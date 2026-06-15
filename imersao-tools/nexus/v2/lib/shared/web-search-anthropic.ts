/**
 * Nexus v2 — Anthropic web search response parser (Story 5.11 — FR55, AC2/AC6)
 *
 * Helper PURO de parsing da resposta da Anthropic web search tool
 * (`web_search_20250305`). NÃO faz fetch — recebe o JSON já desserializado da
 * resposta do proxy `/api/anthropic/proxy`. O fetch e a orquestração da cascata
 * vivem no endpoint `/api/conhecimento/web-search`.
 *
 * Shape real da resposta (verificado @architect V5, docs.claude.com 13/06):
 *   - Sucesso: `content[]` contém blocos `{ type: 'web_search_tool_result',
 *     content: [{ type: 'web_search_result', url, title, page_age,
 *     encrypted_content }] }`. O `web_search_result` NÃO tem campo `excerpt`.
 *   - Erro: `content[]` contém `{ type: 'web_search_tool_result', content: {
 *     type: 'web_search_tool_result_error', error_code } }` — devolvido como
 *     HTTP 200 (não 4xx/5xx). Este é o ponto cego M4 da 4.9: o gatilho de
 *     fallback TEM de inspeccionar o body, não `response.ok` (`[D-5.11-FALLBACK]`).
 *   - O excerto vem das `citations[].cited_text` (≤150 chars) que o Claude anexa
 *     aos blocos `text`, ou do próprio `text`. Mapeamos cada `web_search_result`
 *     pelo seu `url`/`title`; o excerto é a primeira `cited_text` que cite esse
 *     URL, com fallback para vazio.
 *
 * `parseAnthropicWebSearch` devolve um `AnthropicWebSearchOutcome` discriminado
 * para o endpoint decidir a cascata: `error` (qualquer erro no body OU ausência
 * de resultados) dispara o fallback DDG; `ok` com resultados devolve-os.
 */

import type { WebSearchResult } from '@/lib/shared/web-search-ddg';
import { isSafeHttpUrl } from '@/lib/shared/web-search-url';

const MAX_EXCERPT_LENGTH = 150;

/** Resultado discriminado do parsing da resposta Anthropic web search. */
export type AnthropicWebSearchOutcome =
  | { kind: 'ok'; results: WebSearchResult[] }
  | { kind: 'error'; reason: 'tool-error' | 'no-results' | 'malformed'; errorCode?: string };

interface WebSearchResultBlock {
  type: 'web_search_result';
  url?: unknown;
  title?: unknown;
}

interface CitationLike {
  type?: unknown;
  url?: unknown;
  cited_text?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function truncateExcerpt(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= MAX_EXCERPT_LENGTH) return trimmed;
  return `${trimmed.slice(0, MAX_EXCERPT_LENGTH).trimEnd()}…`;
}

/**
 * Recolhe todas as citações (`citations[].cited_text` com `url`) dos blocos
 * `text` da resposta. Devolve um mapa `url → cited_text` (primeiro a ganhar) para
 * preencher o excerto de cada `web_search_result`.
 */
function collectCitationsByUrl(content: unknown[]): Map<string, string> {
  const byUrl = new Map<string, string>();
  for (const block of content) {
    if (!isObject(block) || block.type !== 'text') continue;
    const citations = block.citations;
    if (!Array.isArray(citations)) continue;
    for (const citation of citations as CitationLike[]) {
      if (!isObject(citation)) continue;
      const url = asString(citation.url);
      const citedText = asString(citation.cited_text);
      if (url !== '' && citedText !== '' && !byUrl.has(url)) {
        byUrl.set(url, citedText);
      }
    }
  }
  return byUrl;
}

/**
 * Parser puro central (AC2/AC6). Recebe o body JSON da resposta Anthropic e
 * classifica-o. Qualquer `web_search_tool_result_error` → `error tool-error`.
 * Ausência de blocos de resultado utilizáveis → `error no-results`. Body sem
 * `content` array → `error malformed`. Caso contrário `ok` com os resultados.
 */
export function parseAnthropicWebSearch(body: unknown): AnthropicWebSearchOutcome {
  if (!isObject(body) || !Array.isArray(body.content)) {
    return { kind: 'error', reason: 'malformed' };
  }
  const content = body.content;

  // 1. Procura blocos de erro da tool — HTTP 200 mas erro no body (M4 da 4.9).
  for (const block of content) {
    if (!isObject(block) || block.type !== 'web_search_tool_result') continue;
    const inner = block.content;
    if (isObject(inner) && inner.type === 'web_search_tool_result_error') {
      return {
        kind: 'error',
        reason: 'tool-error',
        errorCode: asString(inner.error_code) || undefined,
      };
    }
  }

  // 2. Recolhe citações para os excertos.
  const citationsByUrl = collectCitationsByUrl(content);

  // 3. Extrai os `web_search_result` dos blocos `web_search_tool_result`.
  const results: WebSearchResult[] = [];
  for (const block of content) {
    if (!isObject(block) || block.type !== 'web_search_tool_result') continue;
    const inner = block.content;
    if (!Array.isArray(inner)) continue;
    for (const item of inner as WebSearchResultBlock[]) {
      if (!isObject(item) || item.type !== 'web_search_result') continue;
      // Allowlist de esquema: só http(s) (CR Major PR #72, finding 2). Uma URL
      // `javascript:`/`data:` viraria `sourceUrl` da nota e link clicável → XSS.
      const safeUrl = isSafeHttpUrl(item.url);
      // `title` validado APÓS `trim` (um título só de espaços é vazio).
      const title = asString(item.title).trim();
      if (safeUrl === null || title === '') continue;
      // A citação foi indexada pelo URL bruto da resposta; tenta ambas as formas
      // (bruta e normalizada) para não perder o excerto após a normalização.
      const citedText =
        citationsByUrl.get(asString(item.url)) ?? citationsByUrl.get(safeUrl) ?? '';
      results.push({
        title,
        url: safeUrl,
        excerpt: truncateExcerpt(citedText),
      });
    }
  }

  if (results.length === 0) {
    return { kind: 'error', reason: 'no-results' };
  }

  return { kind: 'ok', results };
}

export { MAX_EXCERPT_LENGTH };
