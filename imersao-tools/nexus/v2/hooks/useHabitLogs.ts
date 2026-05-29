'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listHabitLogsByHabit } from '@/lib/db/repos/habit-logs';
import type { HabitLog } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `habit_logs` de um hábito (Story 4.1 — FR26)
 *
 * Envolve `useLiveQuery` da Dexie 4. Aceita `habitId` e um intervalo de datas
 * ISO opcional (heatmap dos últimos 6 meses — FR26). Re-subscreve quando
 * `habitId` ou o intervalo mudam. A Story 4.3 (heatmap) consome este hook.
 *
 * Retorna `undefined` no primeiro render, depois `HabitLog[]` (ascendente por
 * data via índice `[habitId+date]`).
 */
export function useHabitLogs(
  habitId: string,
  range?: { from: string; to: string },
): HabitLog[] | undefined {
  return useLiveQuery(
    () => listHabitLogsByHabit(habitId, range),
    [habitId, range?.from, range?.to],
  );
}
