import { db } from '@/lib/db/client';
import { KnowledgeNotebookSchema } from '@/lib/db/schemas';
import type { KnowledgeNotebook } from '@/types/db';

/**
 * Nexus v2 — Repository para `knowledge_notebooks` (Story 5.1 — FR51)
 *
 * Nível intermédio da hierarquia: Área → Caderno → Nota. A tabela já existe em
 * `version(1)` com o índice `areaId` (scaffold Story 0.3, client.ts:95) — serve
 * `listNotebooksByArea`. A Story 5.9 consome estes helpers.
 *
 * Validação Zod antes de qualquer write. Reads não revalidam.
 *
 * Convenção de delete-cascata (AC7): `deleteKnowledgeNotebook` faz cascata de
 * 1 nível (Caderno → Notas) numa transacção `'rw'` atómica — a Nota é filho de
 * composição do Caderno.
 */

/**
 * Cria um caderno. Valida com `KnowledgeNotebookSchema` e exige que a área pai
 * exista — um caderno órfão (sem área) não tem semântica na hierarquia
 * (mesma regra de integridade referencial de `createHabitLog`, Story 4.1).
 */
export async function createKnowledgeNotebook(
  input: KnowledgeNotebook,
): Promise<KnowledgeNotebook> {
  KnowledgeNotebookSchema.parse(input);
  const area = await db.knowledge_areas.get(input.areaId);
  if (area === undefined) {
    throw new Error(
      `Área ${input.areaId} não encontrada — não é possível criar caderno órfão`,
    );
  }
  await db.knowledge_notebooks.add(input);
  return input;
}

export async function getKnowledgeNotebook(
  id: string,
): Promise<KnowledgeNotebook | undefined> {
  return db.knowledge_notebooks.get(id);
}

/**
 * Lista os cadernos de uma área (FR51 — hierarquia). Usa o índice `areaId`.
 * Ordenado alfabeticamente por nome (PT-PT).
 */
export async function listNotebooksByArea(
  areaId: string,
): Promise<KnowledgeNotebook[]> {
  const notebooks = await db.knowledge_notebooks
    .where('areaId')
    .equals(areaId)
    .toArray();
  return notebooks.sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'));
}

export async function updateKnowledgeNotebook(
  id: string,
  patch: Partial<KnowledgeNotebook>,
): Promise<void> {
  KnowledgeNotebookSchema.partial().parse(patch);
  const updated = await db.knowledge_notebooks.update(id, patch);
  if (updated === 0) {
    throw new Error(`Caderno ${id} não encontrado — não foi possível actualizar`);
  }
}

/**
 * Apaga um caderno e, em cascata de 1 nível, todas as suas notas (AC7).
 *
 * As duas tabelas (`knowledge_notebooks`, `knowledge_notes`) participam na mesma
 * transacção `'rw'`: all-or-nothing. Hard-delete. `KnowledgeNote.tags` não exige
 * cascata (R4 — referências a `tags`, que se mantêm intactas).
 */
export async function deleteKnowledgeNotebook(id: string): Promise<void> {
  await db.transaction(
    'rw',
    db.knowledge_notebooks,
    db.knowledge_notes,
    async () => {
      await db.knowledge_notes.where('notebookId').equals(id).delete();
      await db.knowledge_notebooks.delete(id);
    },
  );
}
