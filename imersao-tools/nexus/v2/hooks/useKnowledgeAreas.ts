'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listKnowledgeAreas } from '@/lib/db/repos/knowledge-areas';
import type { KnowledgeArea } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `knowledge_areas` (Story 5.1 — FR51)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza quando áreas são inseridas,
 * actualizadas ou apagadas (cascata incluída). A Story 5.9 consome este hook.
 *
 * Retorna `undefined` no primeiro render, depois `KnowledgeArea[]` ordenado
 * alfabeticamente por nome (PT-PT). Padrão herdado de `useHabits`.
 */
export function useKnowledgeAreas(): KnowledgeArea[] | undefined {
  return useLiveQuery(() => listKnowledgeAreas(), []);
}
