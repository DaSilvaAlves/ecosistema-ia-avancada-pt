'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listGoals } from '@/lib/db/repos/goals';
import type { GoalStatus } from '@/lib/db/schemas';
import type { Goal } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `goals` (Story 4.1 — FR39/FR40)
 *
 * Envolve `useLiveQuery` da Dexie 4. Aceita um `status` opcional para filtrar
 * (re-subscreve quando `status` muda). A Story 4.5 (CRUD metas + vista) consome
 * este hook.
 *
 * Retorna `undefined` no primeiro render, depois `Goal[]` ordenado por
 * `deadline` ascendente (metas sem prazo no fim). Padrão herdado de `useAccounts`.
 */
export function useGoals(status?: GoalStatus): Goal[] | undefined {
  return useLiveQuery(() => listGoals(status), [status]);
}
