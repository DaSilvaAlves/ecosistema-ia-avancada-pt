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
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

/** Remove tags HTML (ex: `<b>` de termos destacados pelo DDG no snippet). */
function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
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

  let match: RegExpExecArray | null;
  while ((match = titleLinkRe.exec(html)) !== null) {
    const rawHref = match[1] ?? '';
    const rawTitle = match[2] ?? '';

    const title = cleanText(rawTitle);
    const url = resolveDdgUrl(rawHref);

    // Descarta resultados sem título ou sem URL http(s) válido (CAPTCHA, links
    // internos do DDG, anúncios sem conteúdo). Um resultado tem de ter ambos.
    if (title === '' || !/^https?:\/\//i.test(url)) continue;

    // Procura o snippet no HTML que se segue a este título (mesma `.result`).
    const rest = html.slice(titleLinkRe.lastIndex);
    const snippetMatch = rest.match(snippetRe);
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
