import { db } from '@/lib/db/client';
import { AgentRunSchema, ToolCallSchema } from '@/lib/agent/schemas';
import type { AgentRun, ToolCall } from '@/types/db';

/**
 * Nexus v2 — Repository para `agent_runs` (Story 1.1)
 *
 * Encapsula acesso à tabela Dexie `agent_runs`. Stories 1.2-1.10 do Epic 1
 * devem usar estes helpers em vez de tocar `db.agent_runs.*` directamente.
 *
 * Validação Zod aplicada antes de qualquer write — input inválido lança ZodError
 * com mensagens PT-PT. Reads não revalidam (assume integridade do DB local).
 */

export interface ListRecentRunsOptions {
  withinMs?: number;
  status?: AgentRun['status'];
  limit?: number;
}

const DEFAULT_LIMIT = 50;

export async function createAgentRun(input: AgentRun): Promise<AgentRun> {
  AgentRunSchema.parse(input);
  await db.agent_runs.add(input);
  return input;
}

export async function getAgentRun(id: string): Promise<AgentRun | undefined> {
  return db.agent_runs.get(id);
}

export async function listRecentRuns(opts: ListRecentRunsOptions = {}): Promise<AgentRun[]> {
  const { withinMs, status, limit = DEFAULT_LIMIT } = opts;
  const sinceTs = withinMs !== undefined ? Date.now() - withinMs : 0;

  const baseCollection = db.agent_runs.where('timestamp').aboveOrEqual(sinceTs);
  const filtered = status ? baseCollection.filter((r) => r.status === status) : baseCollection;

  const results = await filtered.toArray();
  return results.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

export async function updateAgentRunStatus(
  id: string,
  status: AgentRun['status'],
  errorMessage?: string
): Promise<void> {
  const patch: Partial<AgentRun> = { status };
  if (errorMessage !== undefined) patch.errorMessage = errorMessage;
  await db.agent_runs.update(id, patch);
}

export async function appendToolCall(runId: string, toolCall: ToolCall): Promise<void> {
  ToolCallSchema.parse(toolCall);
  const run = await db.agent_runs.get(runId);
  if (!run) {
    throw new Error(`AgentRun ${runId} não encontrado`);
  }
  await db.agent_runs.update(runId, {
    toolCalls: [...run.toolCalls, toolCall],
  });
}

export async function markRunReverted(id: string): Promise<void> {
  await updateAgentRunStatus(id, 'reverted');
}
