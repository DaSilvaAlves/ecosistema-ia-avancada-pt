import { db } from '@/lib/db/client';
import { KnowledgeNoteSchema } from '@/lib/db/schemas';
import type { KnowledgeNote } from '@/types/db';

/**
 * Nexus v2 — Repository para `knowledge_notes` (Story 5.1 — FR53/FR54/FR55/FR56)
 *
 * Folha da hierarquia: Área → Caderno → Nota. A tabela já existe em `version(1)`
 * com os índices `notebookId, *tags, updatedAt` (scaffold Story 0.3,
 * client.ts:96) — servem `listNotesByNotebook`, `listNotesByTag` e ordenação por
 * recência. As Stories 5.9 (CRUD), 5.10 (pesquisa), 5.12 (cérebro cria nota)
 * consomem estes helpers.
 *
 * Validação Zod antes de qualquer write. Reads não revalidam.
 *
 * `tags` é string[] de IDs de tags (padrão Task.tags — Epic 2). Reutiliza a
 * tabela `tags` de version(2); NÃO há sistema de tags separado (R4). `sourceUrl`
 * guarda a URL de origem quando a nota é criada por pesquisa web (FR55/FR56).
 *
 * Convenção de delete-cascata (AC7): `deleteKnowledgeNote` é hard-delete simples
 * — a Nota é a folha da hierarquia, sem filhos. As tags referenciadas mantêm-se
 * intactas (R4).
 */

export async function createKnowledgeNote(
  input: KnowledgeNote,
): Promise<KnowledgeNote> {
  KnowledgeNoteSchema.parse(input);
  const notebook = await db.knowledge_notebooks.get(input.notebookId);
  if (notebook === undefined) {
    throw new Error(
      `Caderno ${input.notebookId} não encontrado — não é possível criar nota órfã`,
    );
  }
  await db.knowledge_notes.add(input);
  return input;
}

export async function getKnowledgeNote(
  id: string,
): Promise<KnowledgeNote | undefined> {
  return db.knowledge_notes.get(id);
}

/**
 * Lista as notas de um caderno (FR51 — hierarquia). Usa o índice `notebookId`.
 * Ordenado descendente por `updatedAt` (mais recente primeiro).
 */
export async function listNotesByNotebook(
  notebookId: string,
): Promise<KnowledgeNote[]> {
  const notes = await db.knowledge_notes
    .where('notebookId')
    .equals(notebookId)
    .toArray();
  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Lista as notas que têm uma tag (FR54 — pesquisa por tag). Usa o índice
 * multi-entry `*tags` (mesmo padrão de `db.tasks.where('tags').anyOf(...)`,
 * Story 2.6). Ordenado descendente por `updatedAt`.
 */
export async function listNotesByTag(tagId: string): Promise<KnowledgeNote[]> {
  const notes = await db.knowledge_notes.where('tags').anyOf([tagId]).toArray();
  return notes.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Pesquisa full-text base (FR53) sobre `title` e `bodyMarkdown`. Base que a
 * Story 5.10 (pesquisa full-text conhecimento) refina. Implementação simples
 * case-insensitive em memória — sem índice full-text dedicado nesta story de
 * schema (nenhum FR42-57 exige indexação de texto livre na 5.1). Ordenado
 * descendente por `updatedAt`.
 */
export async function searchNotes(query: string): Promise<KnowledgeNote[]> {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [];
  const all = await db.knowledge_notes.toArray();
  return all
    .filter((note) =>
      `${note.title} ${note.bodyMarkdown}`.toLowerCase().includes(needle),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function updateKnowledgeNote(
  id: string,
  patch: Partial<KnowledgeNote>,
): Promise<void> {
  KnowledgeNoteSchema.partial().parse(patch);
  const updated = await db.knowledge_notes.update(id, patch);
  if (updated === 0) {
    throw new Error(`Nota ${id} não encontrada — não foi possível actualizar`);
  }
}

export async function deleteKnowledgeNote(id: string): Promise<void> {
  await db.knowledge_notes.delete(id);
}
