'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listInstallments } from '@/lib/db/repos/installments';
import type { Installment } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `installments` (Story 3.6 — FR19)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza automaticamente quando
 * compras parceladas são inseridas ou apagadas (a Story 3.6 não suporta
 * edição — [AUTO-DECISION] A6). A page `/financas` consome este hook para a
 * lista da tab "Parceladas"; a Story 3.8 (vista cartões) e a Story 3.11
 * (tools cérebro) podem reutilizá-lo.
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois
 * `Installment[]` ordenado descendente por `startDate` via `listInstallments`.
 *
 * Padrão herdado de `hooks/useCards.ts` (Story 3.3) e
 * `hooks/useFinanceRecurrences.ts` (Story 3.4).
 */

export function useInstallments(): Installment[] | undefined {
  return useLiveQuery(() => listInstallments(), []);
}
