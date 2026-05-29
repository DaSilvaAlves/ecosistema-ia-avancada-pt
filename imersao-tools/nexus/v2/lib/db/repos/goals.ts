import { db } from '@/lib/db/client';
import { GoalSchema, type GoalStatus } from '@/lib/db/schemas';
import type { Goal } from '@/types/db';

/**
 * Nexus v2 — Repository para `goals` (Story 4.1 — FR39/FR40)
 *
 * Encapsula o acesso à tabela Dexie `goals` (que já existe em `version(1)` com
 * o índice `status` — scaffold Story 0.3). A Story 4.5 (CRUD metas + vista)
 * consome `listGoals`.
 *
 * `milestones` é EMBEBIDO no Goal (Architect Gate Story 4.1, [GAP-4.1b]):
 * sub-agregado de baixa cardinalidade, lido sempre no contexto da meta. Não há
 * tabela `goal_milestones`. Actualizar um milestone = `updateGoal` com o array
 * inteiro (read-modify-write do Goal — trivial para ~2-5 milestones).
 */

export async function createGoal(input: Goal): Promise<Goal> {
  GoalSchema.parse(input);
  await db.goals.add(input);
  return input;
}

export async function getGoal(id: string): Promise<Goal | undefined> {
  return db.goals.get(id);
}

/**
 * Lista metas, opcionalmente filtradas por `status` (índice `status`).
 * Sem filtro, devolve todas. Ordenado por `deadline` ascendente, com as metas
 * sem prazo (`null`) no fim.
 */
export async function listGoals(status?: GoalStatus): Promise<Goal[]> {
  const all = status
    ? await db.goals.where('status').equals(status).toArray()
    : await db.goals.toArray();
  return all.sort((a, b) => {
    if (a.deadline === null && b.deadline === null) return 0;
    if (a.deadline === null) return 1;
    if (b.deadline === null) return -1;
    return a.deadline.localeCompare(b.deadline);
  });
}

export async function updateGoal(
  id: string,
  patch: Partial<Goal>,
): Promise<void> {
  GoalSchema.partial().parse(patch);
  const updated = await db.goals.update(id, patch);
  if (updated === 0) {
    throw new Error(`Meta ${id} não encontrada — não foi possível actualizar`);
  }
}

/**
 * Apaga uma meta. Os `milestones` embebidos são eliminados com o registo
 * (Architect Gate Story 4.1) — não há cascata para tabela externa. Hard-delete.
 */
export async function deleteGoal(id: string): Promise<void> {
  await db.goals.delete(id);
}
