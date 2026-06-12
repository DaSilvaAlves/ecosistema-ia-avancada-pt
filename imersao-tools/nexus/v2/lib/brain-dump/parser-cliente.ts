import { stripJsonMarkdownFences } from '@/lib/agent/classifier-json';
import { DEFAULT_EXECUTOR_MODEL } from '@/lib/agent/models';
import {
  enrichWithIds,
  parseBrainDumpWire,
  type BrainDumpParsed,
} from '@/lib/brain-dump/ai-parser';

/**
 * Nexus v2 — Helper client-side de parsing AI do Brain Dump (Story 5.7 — AC2/AC4)
 *
 * `[D-5.7-MECHANISM]` (Architect Gate de entrada, Aria 12/06/2026):
 *   Escolha 1 — runtime: reutiliza `/api/anthropic/proxy` (Opção A, precedente
 *               `[D-5.4-ENDPOINT]`). NÃO existe `/api/agent/brain-dump`. Este
 *               helper espelha `estruturar-cliente.ts` (Story 5.4).
 *   Escolha 2 — transporte: JSON síncrono (`stream` ausente no body → o proxy
 *               devolve o JSON da Anthropic Messages API tal-qual). O overlay
 *               "A estruturar…" é um estado binário loading→done — SSE não melhora
 *               a UX de um parse atómico.
 *   Escolha 3 — shape: 4 buckets de TEXTOS (wire), validados via Zod `.strict()`
 *               do helper puro, depois enriquecidos com ids no cliente
 *               (`enrichWithIds`) → domínio `BrainDumpParsed`.
 *
 * `max_tokens: 2048` (`[D-5.7-MECHANISM]` consequência b): os 1024 do diário
 * cobrem 3 buckets curtos; 4 buckets com N itens cada precisam de folga.
 *
 * Edge-safety (ADR-1 / NFR5): este módulo NÃO importa `@anthropic-ai/sdk` nem a
 * `ANTHROPIC_API_KEY`. A key vive SÓ no proxy server-side. Só `fetch` + parsing
 * de string. Pode correr em módulo `'use client'`.
 *
 * Contrato de erro (AC4, `internal-state-contract-gate.md` eixo c): qualquer
 * falha — `!res.ok`, ausência de `content[].text`, JSON inválido após strip,
 * shape inválido — **lança** `Error` com mensagem PT-PT. NÃO devolve preview
 * vazio silencioso. A UI apanha o throw → estado `error`. `res.ok` é verificado
 * **antes** de ler o body (lição Epic 4 §5.1).
 *
 * Constitution:
 * - Article IV (No Invention): wire shape espelha a Anthropic Messages API.
 * - Article V (Quality First): mensagens PT-PT em todos os Errors.
 * - Article VI (Absolute Imports): apenas `@/...`.
 */

/** URL do proxy Edge — relativa, resolve contra a origin do browser. */
const PROXY_URL = '/api/anthropic/proxy';

/**
 * Tecto de tokens da resposta — 4 buckets com N itens cada precisam de mais folga
 * do que os 3 buckets curtos do diário (`[D-5.7-MECHANISM]` consequência b).
 */
const DEFAULT_MAX_TOKENS = 2048;

/**
 * System prompt PT-PT de estruturação. Pede ao Sonnet para reorganizar o texto
 * livre em 4 buckets e devolver APENAS JSON com as chaves exactas do contrato
 * (`tarefas`/`projectos`/`ideias`/`decisoes`), cada uma um array de strings. Os
 * arrays são sempre presentes (vazios quando o texto não suporta o bucket).
 *
 * Não é segredo (o `system` do classifier também vive client-side) — pode viver
 * em módulo `'use client'`. A key, essa, não.
 */
export const BRAIN_DUMP_SYSTEM_PROMPT = `És o cérebro de organização do Nexus.

Recebes um despejo de texto livre (em português europeu) — um "brain dump" de ideias soltas — e reorganiza-lo em quatro categorias:
- "tarefas" — coisas concretas a fazer (acções accionáveis)
- "projectos" — iniciativas maiores que agrupam várias tarefas ou exigem planeamento
- "ideias" — ideias soltas, pensamentos ou notas sem acção imediata
- "decisoes" — decisões que é preciso tomar (escolhas em aberto)

Regras:
1. Usa o conteúdo REAL do texto. Não inventes nem acrescentes informação que não esteja no texto.
2. Cada categoria é um array de strings curtas (uma por item). Se uma categoria não tiver conteúdo, devolve um array VAZIO [] (nunca omitas a chave).
3. Escreve cada item em português europeu (PT-PT), conciso, sem numeração nem marcadores.
4. Responde APENAS com JSON válido, sem markdown, sem prosa antes ou depois. As únicas chaves permitidas são "tarefas", "projectos", "ideias" e "decisoes", e cada valor é um array de strings.

Exemplo de resposta:
{"tarefas":["ligar ao contabilista","comprar tinta"],"projectos":["renovar o escritório"],"ideias":["app de receitas"],"decisoes":["mudar de banco?"]}`;

/**
 * Lê o corpo de erro do proxy de forma tolerante (JSON ou texto) e devolve uma
 * mensagem PT-PT concisa. Não inclui a `ANTHROPIC_API_KEY` (o proxy nunca a
 * devolve) nem o prompt cru (NFR11). Espelha `proxyErrorMessage` de
 * `estruturar-cliente.ts:73`.
 */
async function proxyErrorMessage(res: Response): Promise<string> {
  let detail = '';
  try {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { error?: unknown };
      detail = typeof parsed.error === 'string' ? parsed.error : text.slice(0, 200);
    } catch {
      detail = text.slice(0, 200);
    }
  } catch {
    detail = '';
  }
  return `Não foi possível estruturar o brain dump (proxy respondeu ${res.status}${
    detail ? ` — ${detail}` : ''
  }).`;
}

/** Opções da chamada (modelo/tokens/idFn overridable; `fetchFn` injectável). */
export interface ParseBrainDumpOpts {
  model?: string;
  maxTokens?: number;
  /**
   * Gerador de ids injectável (default `crypto.randomUUID`) — usado por
   * `enrichWithIds`. Permite testes determinísticos do enriquecimento.
   */
  idFn?: () => string;
  /**
   * `fetch` injectável para testes (default `globalThis.fetch` vinculado a
   * `globalThis`). O bind do default é obrigatório: o `fetch` nativo exige
   * `this === Window` (DEV-DECISION D-FETCH-BIND, Story 1.12).
   */
  fetchFn?: typeof fetch;
}

/**
 * Estrutura o texto livre de um brain dump via proxy de inferência (Sonnet, JSON
 * síncrono). Devolve `BrainDumpParsed` (4 buckets com itens `{ id, texto }`)
 * pronto para `createBrainDump({ ..., parsedOutput, status: 'parsed' })`.
 *
 * Lança PT-PT em qualquer falha (rede, `!res.ok`, body sem `text`, JSON inválido,
 * shape inválido) — a UI mapeia ao estado `error` (AC4).
 */
export async function parseBrainDump(
  bodyMarkdown: string,
  opts: ParseBrainDumpOpts = {},
): Promise<BrainDumpParsed> {
  const fetchFn = opts.fetchFn ?? globalThis.fetch.bind(globalThis);

  const res = await fetchFn(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_EXECUTOR_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: 0,
      system: BRAIN_DUMP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: bodyMarkdown }],
    }),
  });

  // `internal-state-contract-gate.md` eixo c: verificar `res.ok` ANTES do body.
  if (!res.ok) {
    throw new Error(await proxyErrorMessage(res));
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const textBlock = data.content?.find((b) => b.type === 'text');
  if (!textBlock || typeof textBlock.text !== 'string') {
    throw new Error(
      'A resposta de estruturação não contém texto — tenta novamente.',
    );
  }

  // O Sonnet pode envolver o JSON em markdown fences apesar do prompt pedir
  // "APENAS JSON" — reutiliza o mesmo strip do classifier (hotfix 2026-05-31).
  const cleaned = stripJsonMarkdownFences(textBlock.text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      'A resposta de estruturação não é JSON válido — tenta novamente.',
    );
  }

  // Zod `.strict()` — bucket renomeado/extra falha (AC7). Lança PT-PT. Depois
  // enriquece com ids no cliente (`[D-5.7-SHAPE]` — a AI não gera ids).
  const wire = parseBrainDumpWire(parsed);
  return enrichWithIds(wire, opts.idFn);
}
