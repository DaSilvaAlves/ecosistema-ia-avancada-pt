import { db } from '@/lib/db/client';
import { BrainDumpSchema } from '@/lib/db/schemas';
import type { BrainDump } from '@/types/db';
import type { BrainDumpStatus } from '@/lib/db/schemas';

/**
 * Nexus v2 — Repository para `brain_dumps` (Story 5.1 — FR47/FR48/FR49)
 *
 * Tabela Dexie `version(5)` (decisão @architect `D-BRAINDUMP-STORE`, AC2). A
 * tabela é nova nesta story — índices `createdAt, status` (client.ts version(5))
 * servem `listBrainDumps` (historial DESC, FR47) e o filtro por estado do
 * approval flow (Story 5.8). As Stories 5.6 (UI), 5.7 (parser AI), 5.8 (approval
 * flow) consomem estes helpers.
 *
 * Validação Zod antes de qualquer write. Reads não revalidam.
 *
 * `status` é a máquina de estados que atravessa sessões (FR48/FR49 — parse →
 * aprovação item-a-item). `parsedOutput` é `unknown` — o tipo exacto dos 4
 * buckets AI é definido na Story 5.7 (parser), sem coupling nesta camada.
 *
 * Sem cascata (AC7): o Brain Dump é folha desta camada — os itens aprovados
 * persistem como Tasks/Projects/Notes na Story 5.8, não como filhos desta tabela.
 */

export async function createBrainDump(input: BrainDump): Promise<BrainDump> {
  BrainDumpSchema.parse(input);
  await db.brain_dumps.add(input);
  return input;
}

export async function getBrainDump(
  id: string,
): Promise<BrainDump | undefined> {
  return db.brain_dumps.get(id);
}

/**
 * Lista os brain dumps ordenados por `createdAt` descendente (mais recente
 * primeiro — historial, FR47). Usa o índice `createdAt`.
 */
export async function listBrainDumps(): Promise<BrainDump[]> {
  return db.brain_dumps.orderBy('createdAt').reverse().toArray();
}

/**
 * Lista os brain dumps com um estado (filtro do approval flow, Story 5.8). Usa o
 * índice `status`. Ordenado descendente por `createdAt`.
 */
export async function listBrainDumpsByStatus(
  status: BrainDumpStatus,
): Promise<BrainDump[]> {
  const dumps = await db.brain_dumps.where('status').equals(status).toArray();
  return dumps.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateBrainDump(
  id: string,
  patch: Partial<BrainDump>,
): Promise<void> {
  BrainDumpSchema.partial().parse(patch);
  const updated = await db.brain_dumps.update(id, patch);
  if (updated === 0) {
    throw new Error(
      `Brain dump ${id} não encontrado — não foi possível actualizar`,
    );
  }
}

export async function deleteBrainDump(id: string): Promise<void> {
  await db.brain_dumps.delete(id);
}
