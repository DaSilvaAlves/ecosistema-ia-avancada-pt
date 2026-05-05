import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createAgentRun,
  getAgentRun,
  listRecentRuns,
  updateAgentRunStatus,
  appendToolCall,
  markRunReverted,
} from '@/lib/db/repos/agent-runs';
import type { AgentRun, ToolCall } from '@/types/db';

/**
 * Nexus v2 — agent-runs repo tests (Story 1.1 / AC8)
 *
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeRun(overrides: Partial<AgentRun> = {}): AgentRun {
  return {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    prompt: 'teste prompt',
    intents: [],
    toolCalls: [],
    status: 'success',
    durationMs: 100,
    modelClassifier: 'claude-haiku-4-5-20251001',
    modelExecutor: 'claude-sonnet-4-6',
    inputTokens: 50,
    outputTokens: 100,
    ...overrides,
  };
}

function makeToolCall(overrides: Partial<ToolCall> = {}): ToolCall {
  return {
    toolName: 'criar_tarefa',
    args: { titulo: 'X' },
    result: { id: 'abc' },
    durationMs: 50,
    reverted: false,
    ...overrides,
  };
}

describe('agent-runs repo', () => {
  beforeEach(async () => {
    await db.agent_runs.clear();
  });

  it('createAgentRun + getAgentRun roundtrip', async () => {
    const run = makeRun();
    await createAgentRun(run);
    const retrieved = await getAgentRun(run.id);
    expect(retrieved).toEqual(run);
  });

  it('createAgentRun rejeita input inválido (Zod)', async () => {
    const invalid = makeRun({ id: 'not-a-uuid' });
    await expect(createAgentRun(invalid)).rejects.toThrow();
  });

  it('listRecentRuns retorna ordem desc por timestamp', async () => {
    const baseTs = Date.now();
    await createAgentRun(makeRun({ timestamp: baseTs - 3000 }));
    await createAgentRun(makeRun({ timestamp: baseTs - 1000 }));
    await createAgentRun(makeRun({ timestamp: baseTs - 2000 }));

    const result = await listRecentRuns();
    expect(result).toHaveLength(3);
    expect(result[0].timestamp).toBe(baseTs - 1000);
    expect(result[1].timestamp).toBe(baseTs - 2000);
    expect(result[2].timestamp).toBe(baseTs - 3000);
  });

  it('listRecentRuns filtra por status via index composto', async () => {
    await createAgentRun(makeRun({ status: 'success' }));
    await createAgentRun(makeRun({ status: 'failed' }));
    await createAgentRun(makeRun({ status: 'success' }));

    const successRuns = await listRecentRuns({ status: 'success' });
    expect(successRuns).toHaveLength(2);
    successRuns.forEach((r) => expect(r.status).toBe('success'));
  });

  it('listRecentRuns respeita opção limit', async () => {
    for (let i = 0; i < 5; i++) {
      await createAgentRun(makeRun({ timestamp: Date.now() - i * 1000 }));
    }
    const result = await listRecentRuns({ limit: 3 });
    expect(result).toHaveLength(3);
  });

  it('listRecentRuns filtra por janela temporal withinMs', async () => {
    const now = Date.now();
    await createAgentRun(makeRun({ timestamp: now - 60_000 })); // 1 min atrás
    await createAgentRun(makeRun({ timestamp: now - 10 })); // muito recente

    const recent = await listRecentRuns({ withinMs: 5_000 });
    expect(recent).toHaveLength(1);
    expect(recent[0].timestamp).toBe(now - 10);
  });

  it('updateAgentRunStatus actualiza só o status (e errorMessage opcional)', async () => {
    const run = makeRun({ status: 'partial' });
    await createAgentRun(run);
    await updateAgentRunStatus(run.id, 'failed', 'Erro X');

    const updated = await getAgentRun(run.id);
    expect(updated?.status).toBe('failed');
    expect(updated?.errorMessage).toBe('Erro X');
    expect(updated?.prompt).toBe(run.prompt); // resto intacto
  });

  it('appendToolCall preserva campos e adiciona toolCall imutavelmente', async () => {
    const run = makeRun({ toolCalls: [makeToolCall({ toolName: 'a' })] });
    await createAgentRun(run);
    await appendToolCall(run.id, makeToolCall({ toolName: 'b' }));

    const updated = await getAgentRun(run.id);
    expect(updated?.toolCalls).toHaveLength(2);
    expect(updated?.toolCalls[0].toolName).toBe('a');
    expect(updated?.toolCalls[1].toolName).toBe('b');
    expect(updated?.prompt).toBe(run.prompt);
  });

  it('appendToolCall lança erro se runId não existe', async () => {
    await expect(
      appendToolCall('00000000-0000-0000-0000-000000000000', makeToolCall())
    ).rejects.toThrow(/não encontrado/i);
  });

  it('markRunReverted muda status para reverted', async () => {
    const run = makeRun({ status: 'success' });
    await createAgentRun(run);
    await markRunReverted(run.id);

    const updated = await getAgentRun(run.id);
    expect(updated?.status).toBe('reverted');
  });
});
