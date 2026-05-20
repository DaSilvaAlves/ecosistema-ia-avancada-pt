'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import {
  listTransactions,
  type ListTransactionsOptions,
} from '@/lib/db/repos/transactions';
import type { Transaction } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `transactions` (Story 3.1)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza automaticamente quando
 * transações são inseridas, actualizadas ou apagadas. As Stories 3.3 (CRUD
 * transações variáveis), 3.7 (vista mensal) e 3.8 (vista cartões) consomem
 * este hook.
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois
 * `Transaction[]` ordenado descendente por `date` via `listTransactions`.
 *
 * Padrão herdado de `hooks/useTasks.ts` (Story 2.1).
 */

export function useTransactions(
  opts: ListTransactionsOptions = {},
): Transaction[] | undefined {
  return useLiveQuery(
    () => listTransactions(opts),
    [
      opts.accountId,
      opts.cardId,
      opts.category,
      opts.dateFrom,
      opts.dateTo,
      opts.recurrenceId,
      opts.installmentId,
      opts.limit,
    ],
  );
}
