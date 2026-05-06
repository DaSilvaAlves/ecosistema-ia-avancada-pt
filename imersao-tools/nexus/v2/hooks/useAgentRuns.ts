'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listRecentRuns, type ListRecentRunsOptions } from '@/lib/db/repos/agent-runs';
import type { AgentRun } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `agent_runs` (Story 1.1)
 *
 * Envolve `useLiveQuery` da Dexie 4 — re-renderiza automaticamente quando
 * novos runs são inseridos ou actualizados. Story 1.7 (toast undo) e Story
 * 1.9 (cards de acções criadas) consomem este hook.
 *
 * Retorna `undefined` no primeiro render (Dexie a carregar), depois `AgentRun[]`.
 */

export function useRecentAgentRuns(opts: ListRecentRunsOptions = {}): AgentRun[] | undefined {
  return useLiveQuery(
    () => listRecentRuns(opts),
    [opts.withinMs, opts.status, opts.limit]
  );
}
