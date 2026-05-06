import { db } from '@/lib/db/client';
import { createAgentRun, getAgentRun } from '@/lib/db/repos/agent-runs';
import { DEFAULT_CLASSIFIER_MODEL, DEFAULT_EXECUTOR_MODEL } from '@/lib/agent/models';
import type { AgentRun } from '@/types/db';

/**
 * Nexus v2 — Run Builder (Story 1.1)
 *
 * Helper de fluxo para Stories 1.2-1.7 do Epic 1. Mantém invariante:
 * - `timestamp` é set no `startRun` (epoch ms)
 * - `durationMs` é calculado em `finishRun` baseado no timestamp original
 * - Status inicial é sempre `'partial'` até `finishRun` ser chamado
 *
 * Preferred path para Stories 1.5 (Executor) e 1.7 (Undo) — evita boilerplate
 * "lê run, calcula delta, faz update".
 *
 * Defaults dos models importados de `lib/agent/models.ts` (single source of truth,
 * Story 1.2 should-fix #3 Opção A) — ver ADR-1 da architecture-v2.md:
 * - classifier: claude-haiku-4-5-20251001 (rápido, cheap, classificação)
 * - executor: claude-sonnet-4-6 (capaz, function calling)
 */

export interface StartRunInput {
  prompt: string;
  modelClassifier?: string;
  modelExecutor?: string;
}

export interface FinishRunInput {
  status: AgentRun['status'];
  intents: string[];
  inputTokens: number;
  outputTokens: number;
  errorMessage?: string;
}

export async function startRun(input: StartRunInput): Promise<{ runId: string }> {
  const id = crypto.randomUUID();
  const timestamp = Date.now();
  await createAgentRun({
    id,
    timestamp,
    prompt: input.prompt,
    intents: [],
    toolCalls: [],
    status: 'partial',
    durationMs: 0,
    modelClassifier: input.modelClassifier ?? DEFAULT_CLASSIFIER_MODEL,
    modelExecutor: input.modelExecutor ?? DEFAULT_EXECUTOR_MODEL,
    inputTokens: 0,
    outputTokens: 0,
  });
  return { runId: id };
}

export async function finishRun(runId: string, partial: FinishRunInput): Promise<void> {
  const run = await getAgentRun(runId);
  if (!run) {
    throw new Error(`AgentRun ${runId} não encontrado`);
  }
  const durationMs = Date.now() - run.timestamp;
  const patch: Partial<AgentRun> = {
    status: partial.status,
    intents: partial.intents,
    inputTokens: partial.inputTokens,
    outputTokens: partial.outputTokens,
    durationMs,
  };
  if (partial.errorMessage !== undefined) patch.errorMessage = partial.errorMessage;
  await db.agent_runs.update(runId, patch);
}
