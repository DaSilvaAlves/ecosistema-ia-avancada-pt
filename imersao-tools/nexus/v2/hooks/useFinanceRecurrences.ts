'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listFinanceRecurrences } from '@/lib/db/repos/finance-recurrences';
import type { FinanceRecurrence } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `financeRecurrences` (Story 3.4 / AC7)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza automaticamente quando
 * recorrências financeiras são inseridas, actualizadas ou apagadas. A página
 * `/financas` consome este hook para a lista de recorrências.
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois
 * `FinanceRecurrence[]` ordenado descendente por `createdAt` via
 * `listFinanceRecurrences`.
 *
 * Padrão herdado de `hooks/useTransactions.ts` (Story 3.1).
 */
export function useFinanceRecurrences(): FinanceRecurrence[] | undefined {
  return useLiveQuery(() => listFinanceRecurrences(), []);
}
