/**
 * Nexus v2 — Brain Dump input helpers (Story 5.6 — AC2, FR47)
 *
 * Funções puras (sem React/Dexie) para o estado de input do Brain Dump:
 *   - `countWords`: contador de palavras mostrado no modal.
 *   - `canStructure`: regra de activação do botão "Estruturar com AI" (≥ 50
 *     caracteres não-vazios). O limiar 50 é o do brain dump — NÃO confundir com
 *     o 100 do diário (5.4). [Source: front-end-spec-v2.md#1.4 [3]]
 *
 * Viver fora do componente mantém a lógica testável ~100% e o `BrainDumpModal`
 * fino (`react-component-test-criteria.md`).
 */

/** Limiar mínimo de caracteres (após trim) para activar "Estruturar com AI". */
export const STRUCTURE_MIN_CHARS = 50;

/**
 * Conta palavras de um texto livre. Espaços múltiplos, tabs e quebras de linha
 * são tratados como um único separador; string vazia ou só-espaços → 0.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * `true` quando o input tem conteúdo suficiente para estruturar (≥ 50 caracteres
 * após trim). Texto só com espaços fica abaixo do limiar (trim → 0).
 */
export function canStructure(text: string): boolean {
  return text.trim().length >= STRUCTURE_MIN_CHARS;
}
