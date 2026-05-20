'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listAccounts } from '@/lib/db/repos/accounts';
import type { Account } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `accounts` (Story 3.1)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza automaticamente quando
 * contas são inseridas, actualizadas (incluindo `updateBalance`) ou apagadas.
 * As Stories 3.5 (CRUD cartões/contas) e 3.9 (vista património) consomem
 * este hook.
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois
 * `Account[]` ordenado descendente por `createdAt` via `listAccounts`.
 *
 * Padrão herdado de `hooks/useTasks.ts` (Story 2.1).
 */

export function useAccounts(): Account[] | undefined {
  return useLiveQuery(() => listAccounts(), []);
}
