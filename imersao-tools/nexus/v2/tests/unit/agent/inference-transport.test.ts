import { describe, it, expect } from 'vitest';
import { InferenceTransport } from '@/lib/agent/inference-transport';
import { createMockProxyFetch } from '@/tests/mocks/proxy-fetch';

/**
 * Nexus v2 — InferenceTransport unit tests (Story 1.11 — ADR-9, A2, T7)
 *
 * Foca o transport isoladamente (sem o `runAgent`): o caminho do classifier
 * (non-stream → JSON) e os guards de input. O caminho do executor (SSE +
 * reconstrução de args) é exercitado em `client-executor.test.ts` (fidelidade).
 *
 * O transport fala com `/api/anthropic/proxy` via `fetch` injectado — a
 * `ANTHROPIC_API_KEY` NUNCA é referenciada neste módulo (§9.2/NFR5).
 */

const CLASSIFIER_MODEL = 'claude-haiku-mock';

describe('InferenceTransport.classify (AC2)', () => {
  it('parseia a resposta JSON do proxy e devolve ClassificationResult', async () => {
    const mock = createMockProxyFetch({
      classifier: { intents: ['tasks', 'finance'], confidence: { tasks: 0.9, finance: 0.8 } },
      executorTurns: [],
    });
    const transport = new InferenceTransport(mock.fetchFn);

    const result = await transport.classify('system', 'cria tarefa e regista despesa', {
      model: CLASSIFIER_MODEL,
    });

    expect(result.intents).toEqual(['tasks', 'finance']);
    expect(result.confidence.tasks).toBe(0.9);
    expect(result.confidence.finance).toBe(0.8);
    // Non-stream: 1 chamada ao classifier, 0 ao executor.
    expect(mock.getClassifierCallCount()).toBe(1);
    expect(mock.getExecutorCallCount()).toBe(0);
    // O request foi non-stream.
    const req = mock.getRequests()[0];
    expect(req?.stream).not.toBe(true);
  });

  it('rejeita systemPrompt vazio', async () => {
    const mock = createMockProxyFetch({ classifier: { intents: [], confidence: {} }, executorTurns: [] });
    const transport = new InferenceTransport(mock.fetchFn);
    await expect(transport.classify('', 'x')).rejects.toThrow(/systemPrompt obrigatório/);
  });

  it('rejeita userPrompt vazio', async () => {
    const mock = createMockProxyFetch({ classifier: { intents: [], confidence: {} }, executorTurns: [] });
    const transport = new InferenceTransport(mock.fetchFn);
    await expect(transport.classify('sys', '')).rejects.toThrow(/userPrompt obrigatório/);
  });

  it('propaga erro PT-PT quando o proxy responde não-OK', async () => {
    const fetchFn = (async () =>
      new Response(JSON.stringify({ error: 'rate limit' }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      })) as typeof fetch;
    const transport = new InferenceTransport(fetchFn);
    await expect(transport.classify('sys', 'prompt')).rejects.toThrow(/Proxy de inferência respondeu 429/);
  });

  it('lança quando a resposta do classifier não é JSON válido', async () => {
    const fetchFn = (async () =>
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'isto não é JSON' }],
          usage: { input_tokens: 5, output_tokens: 2 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )) as typeof fetch;
    const transport = new InferenceTransport(fetchFn);
    await expect(transport.classify('sys', 'prompt')).rejects.toThrow(/não é JSON válido/);
  });
});

describe('InferenceTransport.execute — guards (AC2)', () => {
  it('rejeita messages vazio', async () => {
    const mock = createMockProxyFetch({ classifier: { intents: [], confidence: {} }, executorTurns: [] });
    const transport = new InferenceTransport(mock.fetchFn);
    const gen = transport.execute([], [], { runId: 'r1' });
    await expect((async () => {
      for await (const _ of gen) void _;
    })()).rejects.toThrow(/messages array não pode estar vazio/);
  });

  it('rejeita runId vazio (obrigatório para audit log)', async () => {
    const mock = createMockProxyFetch({ classifier: { intents: [], confidence: {} }, executorTurns: [] });
    const transport = new InferenceTransport(mock.fetchFn);
    const gen = transport.execute([{ role: 'user', content: 'x' }], [], { runId: '' });
    await expect((async () => {
      for await (const _ of gen) void _;
    })()).rejects.toThrow(/runId obrigatório/);
  });
});
