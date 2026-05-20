'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listTags } from '@/lib/db/repos/tags';
import type { Tag } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `tags` (Story 2.6 / AC3)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza quando tags são
 * criadas, actualizadas (`updateTag`) ou eliminadas (`deleteTag` cascata).
 *
 * Substitui o padrão inline `useLiveQuery(() => listTags(), [])` que estava
 * em `app/(app)/tarefas/page.tsx` e `app/(app)/projectos/[id]/page.tsx`.
 *
 * Paralelo a `hooks/useProjects.ts` e `hooks/useTasks.ts` (Story 2.1).
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois `Tag[]`
 * ordenado alfabeticamente pt-PT via `listTags`.
 *
 * NOTA (A12): NÃO construir `tagsLookup` Map aqui — esse lookup vive nas
 * pages consumidoras (`tarefas/page.tsx`, `projectos/[id]/page.tsx`). A page
 * `/tags` só precisa da lista pura. Separação de concerns.
 */

export function useTags(): Tag[] | undefined {
  return useLiveQuery(() => listTags(), []);
}
