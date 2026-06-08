import { db } from '@/lib/db/client';
import { KnowledgeAreaSchema } from '@/lib/db/schemas';
import type { KnowledgeArea } from '@/types/db';

/**
 * Nexus v2 — Repository para `knowledge_areas` (Story 5.1 — FR51)
 *
 * Topo da hierarquia do Conhecimento: Área → Caderno → Nota. A tabela já existe
 * em `version(1)` com o índice `name` (scaffold Story 0.3, client.ts:94). A
 * Story 5.9 (CRUD áreas/cadernos/notas) consome estes helpers.
 *
 * Validação Zod antes de qualquer write — input inválido lança `ZodError` em
 * PT-PT. Reads não revalidam.
 *
 * Convenção de delete-cascata (AC7 — aplicação da decisão da Story 4.1):
 * Cadernos e Notas são filhos de composição (sem vida própria fora da
 * hierarquia), pelo que `deleteKnowledgeArea` faz cascata de 2 níveis
 * (Área → Cadernos → Notas) numa única transacção `'rw'` atómica.
 */

export async function createKnowledgeArea(
  input: KnowledgeArea,
): Promise<KnowledgeArea> {
  KnowledgeAreaSchema.parse(input);
  await db.knowledge_areas.add(input);
  return input;
}

export async function getKnowledgeArea(
  id: string,
): Promise<KnowledgeArea | undefined> {
  return db.knowledge_areas.get(id);
}

/**
 * Lista todas as áreas, ordenadas alfabeticamente por nome (PT-PT) — mesma
 * convenção de `listTags`. A hierarquia de Conhecimento navega-se por nome.
 */
export async function listKnowledgeAreas(): Promise<KnowledgeArea[]> {
  const all = await db.knowledge_areas.toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'));
}

export async function updateKnowledgeArea(
  id: string,
  patch: Partial<KnowledgeArea>,
): Promise<void> {
  KnowledgeAreaSchema.partial().parse(patch);
  const updated = await db.knowledge_areas.update(id, patch);
  if (updated === 0) {
    throw new Error(`Área ${id} não encontrada — não foi possível actualizar`);
  }
}

/**
 * Apaga uma área e, em cascata de 2 níveis, todos os seus cadernos e todas as
 * notas desses cadernos (AC7 / Architect Gate Story 4.1).
 *
 * Cascata: Caderno e Nota são filhos de composição — sem a área, ficam órfãos
 * sem semântica. Os 3 stores (`knowledge_areas`, `knowledge_notebooks`,
 * `knowledge_notes`) participam na mesma transacção `'rw'` Dexie: a eliminação
 * é all-or-nothing (rollback automático se qualquer passo falhar). É uma cascata
 * mais profunda que a do Epic 4 (Hábito → Log, 1 nível) — padrão herdado de
 * `deleteHabit` (Story 4.1) e `deleteTag` (Story 2.6).
 *
 * Hard-delete (consistência com o codebase Epic 2/3/4). `KnowledgeNote.tags`
 * (string[] de IDs) NÃO exige cascata: as notas referenciam tags, não o
 * inverso — a tabela `tags` mantém-se intacta (R4).
 */
export async function deleteKnowledgeArea(id: string): Promise<void> {
  await db.transaction(
    'rw',
    db.knowledge_areas,
    db.knowledge_notebooks,
    db.knowledge_notes,
    async () => {
      const notebooks = await db.knowledge_notebooks
        .where('areaId')
        .equals(id)
        .toArray();
      for (const notebook of notebooks) {
        await db.knowledge_notes
          .where('notebookId')
          .equals(notebook.id)
          .delete();
      }
      await db.knowledge_notebooks.where('areaId').equals(id).delete();
      await db.knowledge_areas.delete(id);
    },
  );
}
