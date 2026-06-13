import type { KnowledgeNote } from '@/types/db';
import {
  matchesAllTerms,
  tokenize,
  type HighlightSegment,
} from '@/lib/diario/pesquisa';

/**
 * Nexus v2 — Pesquisa full-text conhecimento (Story 5.10 — FR53)
 *
 * Helper PURO (sem `import` do Dexie) com a lógica de matching/ranking que a
 * `searchNotes` (`lib/db/repos/knowledge-notes.ts`) delega. Análogo directo ao
 * helper `lib/diario/pesquisa.ts` da Story 5.5 — o EPIC-5 §5 exige "lógica de
 * pesquisa/indexação em helper puro `lib/conhecimento/**`", por isso o repo só
 * faz `toArray()` e chama estas funções.
 *
 * Sem indexação dedicada: o volume de notas é moderado (pesquisa local), o
 * matching in-memory é suficiente (decisão herdada da `searchNotes` existente e
 * do padrão da 5.5). Sem índice full-text.
 *
 * Reutilização da 5.5 (sem duplicação): `normalizeText`, `tokenize`,
 * `matchesAllTerms`, `highlightMatches`, `extractExcerpt` e o tipo
 * `HighlightSegment` são genéricos (operam sobre `string`, sem acoplamento a
 * `JournalEntry`) e são importados directamente de `@/lib/diario/pesquisa`. São
 * re-exportados aqui por conveniência para `KnowledgeSearchResults` (5.10) e a
 * tool `pesquisar_conhecimento` (5.13) consumirem a partir do sub-módulo
 * `lib/conhecimento` sem import cruzado para `lib/diario`.
 *
 * As funções NOVAS deste ficheiro (`buildKnowledgeHaystack`, `rankByUpdatedAt`,
 * `searchKnowledgeNotes`) são específicas de `KnowledgeNote` — paralelas a
 * `buildHaystack`/`rankByRecency`/`searchEntries` da 5.5 (que são de
 * `JournalEntry` e NÃO se reutilizam).
 */

// Re-export de conveniência (sub-módulo `lib/conhecimento` self-contained — R11,
// T2.5). `highlightMatches`/`extractExcerpt`/`tokenize` são usados por
// `KnowledgeSearchResults`; `HighlightSegment` é o tipo de retorno do highlight.
export {
  normalizeText,
  tokenize,
  matchesAllTerms,
  highlightMatches,
  extractExcerpt,
} from '@/lib/diario/pesquisa';
export type { HighlightSegment };

/**
 * Concatena os campos pesquisáveis de uma nota num só haystack:
 * `title + ' ' + bodyMarkdown + ' ' + (sourceUrl ?? '')`. NÃO normaliza —
 * `matchesAllTerms` normaliza ao comparar. Inclui `sourceUrl` (notas criadas por
 * pesquisa web — 5.11/5.12), que a `searchNotes` original (single-needle sobre
 * `title + bodyMarkdown`) deixava de fora.
 *
 * Sem `sourceUrl` → o `?? ''` evita um trailing `'undefined'` no haystack; o
 * `.trim()` remove o espaço residual final.
 */
export function buildKnowledgeHaystack(note: KnowledgeNote): string {
  return `${note.title} ${note.bodyMarkdown} ${note.sourceUrl ?? ''}`.trim();
}

/**
 * Ordena desc por `updatedAt` (epoch ms) — mais recente primeiro. Cópia, não
 * muta a lista recebida. Coerente com a ordenação dos restantes helpers do repo
 * `knowledge-notes` (`listNotesByNotebook`/`listNotesByTag`).
 */
export function rankByUpdatedAt(notes: KnowledgeNote[]): KnowledgeNote[] {
  return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Pesquisa multi-termo AND sobre as notas, ordenada por recência. Função pura —
 * recebe as notas já carregadas (o repo faz o `toArray()`). Query vazia (sem
 * termos após `tokenize`) → `[]`.
 */
export function searchKnowledgeNotes(
  notes: KnowledgeNote[],
  query: string,
): KnowledgeNote[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const matched = notes.filter((note) =>
    matchesAllTerms(buildKnowledgeHaystack(note), terms),
  );
  return rankByUpdatedAt(matched);
}
