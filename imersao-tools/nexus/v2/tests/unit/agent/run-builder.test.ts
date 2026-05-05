import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { startRun, finishRun } from '@/lib/agent/run-builder';
import { getAgentRun } from '@/lib/db/repos/agent-runs';

/**
 * Nexus v2 — run-builder tests (Story 1.1 / Task 7.4)
 */

describe('run-builder', () => {
  beforeEach(async () => {
    await db.agent_runs.clear();
  });

  it('startRun + finishRun calculam durationMs correctamente', async () => {
    const before = Date.now();
    const { runId } = await startRun({ prompt: 'teste roundtrip' });
    expect(runId).toBeTruthy();

    const initial = await getAgentRun(runId);
    expect(initial?.status).toBe('partial');
    expect(initial?.timestamp).toBeGreaterThanOrEqual(before);
    expect(initial?.modelClassifier).toBe('claude-haiku-4-5-20251001');
    expect(initial?.modelExecutor).toBe('claude-sonnet-4-6');

    await finishRun(runId, {
      status: 'success',
      intents: ['criar_tarefa'],
      inputTokens: 100,
      outputTokens: 200,
    });

    const final = await getAgentRun(runId);
    expect(final?.status).toBe('success');
    expect(final?.intents).toEqual(['criar_tarefa']);
    expect(final?.inputTokens).toBe(100);
    expect(final?.outputTokens).toBe(200);
    expect(final?.durationMs).toBeGreaterThanOrEqual(0);
    expect(final?.durationMs).toBeLessThan(1000);
  });

  it('finishRun com errorMessage mantém status failed', async () => {
    const { runId } = await startRun({ prompt: 'teste falha' });
    await finishRun(runId, {
      status: 'failed',
      intents: [],
      inputTokens: 0,
      outputTokens: 0,
      errorMessage: 'API timeout',
    });

    const final = await getAgentRun(runId);
    expect(final?.status).toBe('failed');
    expect(final?.errorMessage).toBe('API timeout');
  });

  it('finishRun lança erro se runId não existe', async () => {
    await expect(
      finishRun('00000000-0000-0000-0000-000000000000', {
        status: 'success',
        intents: [],
        inputTokens: 0,
        outputTokens: 0,
      })
    ).rejects.toThrow(/não encontrado/i);
  });

  it('startRun aceita override de modelos', async () => {
    const { runId } = await startRun({
      prompt: 'modelo custom',
      modelClassifier: 'claude-opus-4-7',
      modelExecutor: 'claude-opus-4-7',
    });
    const run = await getAgentRun(runId);
    expect(run?.modelClassifier).toBe('claude-opus-4-7');
    expect(run?.modelExecutor).toBe('claude-opus-4-7');
  });
});
