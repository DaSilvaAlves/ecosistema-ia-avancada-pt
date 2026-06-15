/**
 * Nexus v2 — DuckDuckGo HTML scraping helper (Story 5.11 — FR55, AC1)
 *
 * Helper PURO de parsing do HTML da versão sem-JavaScript do DuckDuckGo
 * (`https://html.duckduckgo.com/html/?q=…`). NÃO faz fetch nem importa Dexie — o
 * fetch HTTP vive no endpoint `/api/conhecimento/web-search` (Node runtime,
 * `[D-5.11-RUNTIME]`). Isolar a lógica de parsing aqui torna-a testável a ~100%
 * com fixtures de HTML real, à imagem de `lib/diario/pesquisa.ts` /
 * `lib/conhecimento/pesquisa.ts` (helper puro ↔ repo).
 *
 * Robustez (R2 — HTML do DDG é frágil): qualquer HTML inesperado (página vazia,
 * CAPTCHA, layout alterado) resulta em `[]` SEM throw. O caller (endpoint) é quem
 * decide a cascata de fallback — `parseDdgHtml` → `[]` é o sinal de "DDG não deu
 * resultados utilizáveis", que o endpoint converte em 503 PT-PT
 * (`[D-5.11-FALLBACK]`).
 *
 * O parsing usa expressões regulares sobre o HTML, não um DOM parser: o endpoint
 * corre em Node sem `DOMParser` global garantido e o helper deve ser puro/leve.
 * Os selectores-alvo (`result__a`, `result__snippet`, `result__url`) são a
 * estrutura estável da versão HTML do DDG; um teste com HTML real falha se esta
 * estrutura mudar (mock-protocol-fidelity.md, AC6).
 */

import { isSafeHttpUrl } from '@/lib/shared/web-search-url';

/** Resultado de pesquisa web — shape comum a ambos os providers (AC1). */
export interface WebSearchResult {
  title: string;
  url: string;
  excerpt: string;
}

/** Comprimento máximo do excerto (alinhado com `cited_text` ≤150 chars da Anthropic). */
const MAX_EXCERPT_LENGTH = 150;

/**
 * Descodifica entidades HTML comuns que o DDG emite no texto dos resultados
 * (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#x27;`/`&#39;`, `&nbsp;`). Não pretende
 * ser um descodificador HTML completo — apenas as entidades que aparecem em
 * títulos/snippets de resultados de pesquisa.
 */
function decodeHtmlEntities(input: string): string {
  // `&amp;` é descodificado por ÚLTIMO, depois de todas as outras entidades.
  // Se fosse primeiro, um input como `&amp;lt;` viraria `&lt;` → `<` (double-
  // unescape, `js/double-escaping`): o `&amp;` descodificado para `&` seria
  // re-interpretado pela regra `&lt;` seguinte. Descodificando `&amp;` no fim,
  // `&amp;lt;` → `&lt;` (nível de escape preservado). O HTML do DDG é externo e
  // arbitrário (R2), por isso esta ordem é de segurança, não cosmética.
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/**
 * Remove tags HTML (ex: `<b>` de termos destacados pelo DDG no snippet).
 *
 * A remoção corre em LOOP até a string estabilizar. Uma única passagem é
 * incompleta (`js/incomplete-multi-character-sanitization`): tags aninhadas ou
 * sobrepostas reintroduzem uma tag depois da remoção — ex: `<scr<script>ipt>`
 * remove o `<script>` interno e re-forma `<script>` a partir dos restos. Como o
 * HTML do DDG é externo/arbitrário (R2), repetimos o replace enquanto a string
 * continuar a mudar, garantindo que nenhum `<…>` residual sobrevive.
 */
function stripTags(input: string): string {
  const tagRe = /<[^>]*>/g;
  let previous: string;
  let current = input;
  do {
    previous = current;
    current = current.replace(tagRe, '');
  } while (current !== previous);
  return current;
}

/** Normaliza espaços em branco (incl. quebras de linha do HTML) para um único espaço. */
function collapseWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/** Limpa um fragmento de texto do HTML do DDG: remove tags, descodifica entidades, normaliza. */
function cleanText(raw: string): string {
  return collapseWhitespace(decodeHtmlEntities(stripTags(raw)));
}

/**
 * Resolve o URL real de um resultado. O DDG HTML embrulha os links num redirect
 * `//duckduckgo.com/l/?uddg=<url-encoded>&…`. Extraímos o parâmetro `uddg` e
 * descodificamo-lo. Se o href já for um URL absoluto (sem redirect), devolve-se
 * tal-qual (após descodificar entidades). `//host/…` (protocol-relative) é
 * normalizado para `https:`.
 */
function resolveDdgUrl(rawHref: string): string {
  const href = decodeHtmlEntities(rawHref.trim());

  // Caso 1: redirect do DDG com parâmetro uddg.
  const uddgMatch = href.match(/[?&]uddg=([^&]+)/);
  if (uddgMatch?.[1]) {
    try {
      return decodeURIComponent(uddgMatch[1]);
    } catch {
      // uddg malformado — degrada para o próprio href normalizado abaixo.
    }
  }

  // Caso 2: protocol-relative → https.
  if (href.startsWith('//')) return `https:${href}`;

  return href;
}

/**
 * Função pura central (AC1). Recebe o HTML de uma resposta DDG e extrai os
 * resultados como `WebSearchResult[]`. HTML inesperado → `[]` (sem throw).
 *
 * Estratégia: para cada bloco `<a class="result__a" href="…">título</a>`,
 * resolve o URL (redirect uddg → URL real) e procura, a seguir ao link, o snippet
 * `<a class="result__snippet">…</a>` (o DDG renderiza o snippet como link). Um
 * resultado sem título OU sem URL utilizável é descartado.
 */
export function parseDdgHtml(html: string): WebSearchResult[] {
  if (typeof html !== 'string' || html.trim() === '') return [];

  const results: WebSearchResult[] = [];

  // Captura cada link de título de resultado: classe `result__a`. O atributo
  // `class` pode ter outras classes além de `result__a`, daí `[^"]*`.
  const titleLinkRe =
    /<a\b[^>]*\bclass="[^"]*\bresult__a\b[^"]*"[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;

  // Snippet: link/span com classe `result__snippet`.
  const snippetRe =
    /<(?:a|span|div)\b[^>]*\bclass="[^"]*\bresult__snippet\b[^"]*"[^>]*>([\s\S]*?)<\/(?:a|span|div)>/i;

  // 1.ª passagem: recolhe o título, o URL e o índice (início/fim) de cada link
  // de resultado. Os índices delimitam o bloco de cada resultado para o snippet
  // ser procurado SÓ dentro do bloco do próprio resultado (CR Major PR #72,
  // finding 3 — sem isto, um resultado sem snippet herdava o do seguinte).
  interface RawMatch {
    title: string;
    url: string;
    start: number;
    end: number;
  }
  const raw: RawMatch[] = [];
  let match: RegExpExecArray | null;
  while ((match = titleLinkRe.exec(html)) !== null) {
    const rawHref = match[1] ?? '';
    const rawTitle = match[2] ?? '';

    const title = cleanText(rawTitle);
    // Allowlist de esquema partilhada (A2 — mesmo helper do parser Anthropic):
    // descarta resultados sem URL http(s) seguro (CAPTCHA, links internos do DDG,
    // `javascript:`/`data:` num `uddg` malicioso descodificado).
    const url = isSafeHttpUrl(resolveDdgUrl(rawHref));

    // Um resultado tem de ter título E URL seguro. Mesmo descartado, regista-se
    // `start`/`end` para que o bloco do resultado VÁLIDO seguinte fique bem
    // delimitado (o bloco termina no INÍCIO do link de título seguinte).
    raw.push({ title, url: url ?? '', start: match.index, end: titleLinkRe.lastIndex });
  }

  for (let i = 0; i < raw.length; i++) {
    const { title, url, end } = raw[i]!;
    if (title === '' || url === '') continue;

    // O bloco deste resultado vai do fim do seu link de título até ao início do
    // próximo link de título (ou ao fim do HTML, se for o último).
    const blockEnd = i + 1 < raw.length ? raw[i + 1]!.start : html.length;
    const block = html.slice(end, blockEnd);

    const snippetMatch = block.match(snippetRe);
    const excerptRaw = snippetMatch?.[1] ? cleanText(snippetMatch[1]) : '';
    const excerpt =
      excerptRaw.length > MAX_EXCERPT_LENGTH
        ? `${excerptRaw.slice(0, MAX_EXCERPT_LENGTH).trimEnd()}…`
        : excerptRaw;

    results.push({ title, url, excerpt });
  }

  return results;
}

export { MAX_EXCERPT_LENGTH };
