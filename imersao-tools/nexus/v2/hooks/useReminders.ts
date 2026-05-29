'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listReminders } from '@/lib/db/repos/reminders';
import type { Reminder } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `reminders` (Story 4.1 — FR33)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza quando lembretes mudam.
 * A Story 4.6 (CRUD lembretes) consome este hook.
 *
 * Retorna `undefined` no primeiro render, depois `Reminder[]` ordenado
 * ascendente por `fireAt` (próximo a disparar primeiro). Padrão `useAccounts`.
 */
export function useReminders(): Reminder[] | undefined {
  return useLiveQuery(() => listReminders(), []);
}
