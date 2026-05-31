import { describe, it, expect } from 'vitest';

import { InferenceTransport } from '@/lib/agent/inference-transport';
import type { LLMStreamEvent } from '@/lib/agent/schemas';
import {
  buildExecutorSseBody,
  getProfileDef,
} from '../../e2e/regression/helpers/mock-events';

/**
 * Story 1.12 (ADR-9, Architect Gate §4.4 D4) — Teste de FIDELIDADE do mock SSE.
 *
 * `mock-protocol-fidelity.md` (incidente Story 1.2): o mock do proxy E2E TEM de
 * espelhar o wire SSE real da Anthropic — o `input` de um `tool_use` chega VAZIO
 * no `content_block_start` e os args são streamados FRAGMENTADOS em
 * `input_json_delta` (issue #960), só completos no `content_block_stop`.
 *
 * Este teste FALHA se o mock regredir para emitir o `input` completo no
 * `content_block_start` (o bug da Story 1.2), provando que:
 *   (a) o builder fragmenta sempre os args (≥2 `input_json_delta`, `input:{}` no start);
 *   (b) o `InferenceTransport` reconstrói correctamente os args no `content_block_stop`.
 */
describe('Story 1.12 — fidelidade do mock SSE Anthropic (D4)', () => {
  const turn = getProfileDef('single-task').executorTurns[0];
  const sse = buildExecutorSseBody(turn);

  it('emite o input VAZIO no content_block_start (não os args completos)', () => {
    // Guard de regressão: o content_block_start do tool_use tem `"input":{}`.
    // Se alguém mudar o mock para emitir os args completos no start, isto falha.
    expect(sse).toContain('"type":"tool_use"');
    expect(sse).toContain('"input":{}');
    // E NÃO deve conter os args dentro do content_block_start.
    const startBlock = sse
      .split('\n\n')
      .find((b) => b.includes('content_block_start') && b.includes('tool_use'));
    expect(startBlock).toBeDefined();
    expect(startBlock).not.toContain('titulo');
  });

  it('fragmenta os args em ≥2 chunks input_json_delta', () => {
    const deltaCount = (sse.match(/"type":"input_json_delta"/g) ?? []).length;
    expect(deltaCount).toBeGreaterThanOrEqual(2);
  });

  it('o InferenceTransport reconstrói os args completos no content_block_stop', async () => {
    const fetchFn: typeof fetch = async () =>
      new Response(sse, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      });
    const transport = new InferenceTransport(fetchFn);

    const events: LLMStreamEvent[] = [];
    for await (const ev of transport.execute(
      [{ role: 'user', content: 'criar tarefa' }],
      [],
      { runId: 'run-fidelity-test', model: 'mock', maxTokens: 256 }
    )) {
      events.push(ev);
    }

    const toolUse = events.find((e) => e.type === 'tool_use');
    expect(toolUse).toBeDefined();
    if (toolUse && toolUse.type === 'tool_use') {
      expect(toolUse.name).toBe('criar_tarefa');
      // Reconstrução exacta dos args fragmentados — o coração da fidelidade.
      expect(toolUse.input).toEqual({ titulo: 'tarefa de teste' });
    }
  });
});
