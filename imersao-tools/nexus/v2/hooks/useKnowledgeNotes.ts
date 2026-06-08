'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listNotesByNotebook } from '@/lib/db/repos/knowledge-notes';
import type { KnowledgeNote } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `knowledge_notes` de um caderno (Story 5.1 — FR51)
 *
 * Envolve `useLiveQuery` da Dexie 4. Aceita `notebookId` e re-subscreve quando
 * `notebookId` muda. As Stories 5.9/5.10/5.12 consomem este hook.
 *
 * Retorna `undefined` no primeiro render, depois `KnowledgeNote[]` ordenado
 * descendente por `updatedAt` (mais recente primeiro). Padrão herdado de
 * `useHabitLogs` (hook com parâmetro).
 */
export function useKnowledgeNotes(
  notebookId: string,
): KnowledgeNote[] | undefined {
  return useLiveQuery(() => listNotesByNotebook(notebookId), [notebookId]);
}
