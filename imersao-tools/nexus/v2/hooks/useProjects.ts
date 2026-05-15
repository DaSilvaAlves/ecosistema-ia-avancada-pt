'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listProjects, type ListProjectsOptions } from '@/lib/db/repos/projects';
import type { Project } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `projects` (Story 2.1)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza quando projectos são
 * inseridos, actualizados ou arquivados. Stories 2.8 (CRUD), 2.9 (vista
 * projecto) consomem este hook.
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois `Project[]`.
 */

export function useProjects(opts: ListProjectsOptions = {}): Project[] | undefined {
  return useLiveQuery(() => listProjects(opts), [opts.status, opts.limit]);
}
