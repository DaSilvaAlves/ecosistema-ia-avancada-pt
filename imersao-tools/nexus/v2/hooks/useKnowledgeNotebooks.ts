'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listNotebooksByArea } from '@/lib/db/repos/knowledge-notebooks';
import type { KnowledgeNotebook } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `knowledge_notebooks` de uma área (Story 5.1 — FR51)
 *
 * Envolve `useLiveQuery` da Dexie 4. Aceita `areaId` e re-subscreve quando
 * `areaId` muda. A Story 5.9 (hierarquia Área→Caderno→Nota) consome este hook.
 *
 * Retorna `undefined` no primeiro render, depois `KnowledgeNotebook[]` ordenado
 * alfabeticamente por nome (PT-PT). Padrão herdado de `useHabitLogs` (hook com
 * parâmetro).
 */
export function useKnowledgeNotebooks(
  areaId: string,
): KnowledgeNotebook[] | undefined {
  return useLiveQuery(() => listNotebooksByArea(areaId), [areaId]);
}
