/**
 * Nexus v2 — validação de URL de resultado de pesquisa web (Story 5.11 — FR55)
 *
 * Helper PURO partilhado pelos dois parsers de pesquisa web
 * (`web-search-anthropic.ts` e `web-search-ddg.ts`). A URL de um resultado flui
 * até `WebSearchSaveModal` → `sourceUrl` da nota e link clicável na UI; uma URL
 * com esquema perigoso (`javascript:`, `data:`, `vbscript:`) seria um vector de
 * XSS / click malicioso (CR Critical/Major PR #72, finding 2). A defesa é uma
 * allowlist de esquemas: só `http:`/`https:` passam.
 *
 * A2 Epic 5 (bug-de-classe): a ausência de allowlist era o mesmo padrão nos dois
 * parsers — daí o helper único, em vez de regex duplicada em cada um.
 */

/**
 * Valida que `raw` é um URL absoluto com esquema `http:` ou `https:`. Devolve o
 * URL normalizado (via `new URL()`) se for seguro, ou `null` caso contrário
 * (esquema perigoso, URL malformado, vazio, não-string). NUNCA lança.
 */
export function isSafeHttpUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // URL relativo / malformado / esquema sem host → descartado.
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  return parsed.toString();
}
