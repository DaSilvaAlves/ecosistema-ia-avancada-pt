'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listCategories } from '@/lib/db/repos/categories';
import type { Category } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `categories` (Story 3.3)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza automaticamente quando
 * categorias são inseridas, actualizadas ou apagadas. O `TransactionFormModal`
 * (Story 3.3) consome este hook para o dropdown de categoria; as Stories 3.7
 * (vista mensal) e 3.11 (tools cérebro) reutilizam-no.
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois
 * `Category[]` ordenado alfabeticamente (pt-PT) por `name` via `listCategories`.
 *
 * Padrão herdado de `hooks/useAccounts.ts` (Story 3.1).
 */

export function useCategories(): Category[] | undefined {
  return useLiveQuery(() => listCategories(), []);
}
