'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listTasks, type ListTasksOptions } from '@/lib/db/repos/tasks';
import type { Task } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `tasks` (Story 2.1)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza automaticamente quando
 * tarefas são inseridas, actualizadas ou apagadas. Stories 2.3 (lista), 2.4
 * (Kanban), 2.5 (calendário) e 2.10 (cards de tools) consomem este hook.
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois `Task[]`.
 *
 * Padrão herdado de `useAgentRuns.ts` (Story 1.1).
 */

export function useTasks(opts: ListTasksOptions = {}): Task[] | undefined {
  return useLiveQuery(
    () => listTasks(opts),
    [opts.status, opts.projectId, opts.tag, opts.limit]
  );
}
