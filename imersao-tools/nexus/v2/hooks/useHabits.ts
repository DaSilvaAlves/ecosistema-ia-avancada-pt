'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listHabits } from '@/lib/db/repos/habits';
import type { Habit } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `habits` (Story 4.1 — FR24)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza quando hábitos são
 * inseridos, actualizados ou apagados. As Stories 4.2-4.4 consomem este hook.
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois `Habit[]`
 * ordenado descendente por `createdAt`. Padrão herdado de `useAccounts`.
 */
export function useHabits(): Habit[] | undefined {
  return useLiveQuery(() => listHabits(), []);
}
