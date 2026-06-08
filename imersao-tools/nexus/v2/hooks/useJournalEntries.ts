'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listJournalEntriesByDateRange } from '@/lib/db/repos/journal-entries';
import { db } from '@/lib/db/client';
import type { JournalEntry } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `journal_entries` (Story 5.1 — FR42/FR44)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza quando entradas de diário são
 * inseridas, actualizadas ou apagadas. As Stories 5.3 (CRUD + heatmap) consomem
 * este hook.
 *
 * Com `range` (intervalo de datas `YYYY-MM-DD`), devolve as entradas do
 * intervalo ordenadas ascendente por data — query do heatmap (FR44). Sem
 * `range`, devolve todas as entradas. Retorna `undefined` no primeiro render
 * (Dexie a carregar). Padrão herdado de `useHabitLogs`.
 */
export function useJournalEntries(range?: {
  from: string;
  to: string;
}): JournalEntry[] | undefined {
  return useLiveQuery(() => {
    if (range) {
      return listJournalEntriesByDateRange(range.from, range.to);
    }
    return db.journal_entries.orderBy('date').toArray();
  }, [range?.from, range?.to]);
}
