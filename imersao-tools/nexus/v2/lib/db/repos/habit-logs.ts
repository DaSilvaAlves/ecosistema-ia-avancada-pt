import { db } from '@/lib/db/client';
import { HabitLogSchema } from '@/lib/db/schemas';
import type { HabitLog } from '@/types/db';

/**
 * Nexus v2 — Repository para `habit_logs` (Story 4.1 — FR25/FR26/FR27)
 *
 * Encapsula o acesso à tabela Dexie `habit_logs` (que já existe em `version(1)`
 * com o índice composto `[habitId+date]` — scaffold Story 0.3). A Story 4.3
 * (heatmap) consome `listHabitLogsByHabit` por range de datas.
 *
 * `value` só é relevante em hábitos com `metric` (FR27 — km, páginas, peso).
 * A coerência "hábito tem metric ⇒ log deve ter value" é validada em
 * `createHabitLog` (regra cross-entity que o `HabitLogSchema` isolado não cobre).
 */

/**
 * Cria um registo de hábito concluído. Valida o registo com `HabitLogSchema`
 * e, se o hábito associado tiver `metric`, exige `value` numérico (FR27).
 *
 * Lança se o hábito não existir — um log órfão (sem hábito) não tem semântica.
 */
export async function createHabitLog(input: HabitLog): Promise<HabitLog> {
  HabitLogSchema.parse(input);
  const habit = await db.habits.get(input.habitId);
  if (habit === undefined) {
    throw new Error(
      `Hábito ${input.habitId} não encontrado — não é possível registar log órfão`,
    );
  }
  if (habit.metric !== undefined && input.value === undefined) {
    throw new Error(
      `Hábito "${habit.name}" tem métrica (${habit.metric.unit}) — o registo exige um valor`,
    );
  }
  await db.habit_logs.add(input);
  return input;
}

export async function getHabitLog(id: string): Promise<HabitLog | undefined> {
  return db.habit_logs.get(id);
}

/**
 * Lista os logs de um hábito, opcionalmente filtrados por intervalo de datas
 * ISO (inclusivo em ambos os extremos). Usa o índice composto `[habitId+date]`
 * — query dominante do heatmap (FR26, últimos 6 meses). Sem intervalo, devolve
 * todos os logs do hábito. Ordenado ascendente por data (o índice já ordena).
 */
export async function listHabitLogsByHabit(
  habitId: string,
  range?: { from: string; to: string },
): Promise<HabitLog[]> {
  if (range) {
    return db.habit_logs
      .where('[habitId+date]')
      .between([habitId, range.from], [habitId, range.to], true, true)
      .toArray();
  }
  return db.habit_logs.where('habitId').equals(habitId).sortBy('date');
}

export async function updateHabitLog(
  id: string,
  patch: Partial<HabitLog>,
): Promise<void> {
  HabitLogSchema.partial().parse(patch);
  const updated = await db.habit_logs.update(id, patch);
  if (updated === 0) {
    throw new Error(
      `Registo de hábito ${id} não encontrado — não foi possível actualizar`,
    );
  }
}

export async function deleteHabitLog(id: string): Promise<void> {
  await db.habit_logs.delete(id);
}
