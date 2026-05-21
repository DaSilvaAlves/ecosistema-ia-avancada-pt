'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listCards } from '@/lib/db/repos/cards';
import type { Card } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `cards` (Story 3.3)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza automaticamente quando
 * cartões são inseridos, actualizados ou apagados. O `TransactionFormModal`
 * (Story 3.3) consome este hook para o seletor de cartão opcional; as Stories
 * 3.5 (CRUD cartões) e 3.8 (vista cartões) reutilizam-no.
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois `Card[]`.
 * Tipicamente vazio até à Story 3.5 (que entrega o CRUD de cartões) — o seletor
 * de cartão do formulário trata o caso vazio com a opção "— Nenhum —".
 *
 * Padrão herdado de `hooks/useAccounts.ts` (Story 3.1).
 */

export function useCards(): Card[] | undefined {
  return useLiveQuery(() => listCards(), []);
}
