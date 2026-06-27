import { describe, it, expect, afterEach, vi } from 'vitest';
import { runClientAgent } from '@/lib/agent/client-executor';
import { OpenAIInferenceTransport } from '@/lib/agent/providers/openai-inference-transport';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';

/**
 * Nexus v2 — selecção de transport em runClientAgent (Story 8.4 — ADR-10 S4, AC6)
 *
 * Prova D-8.4-CLIENT-SELECT: com `NEXT_PUBLIC_LLM_PROVIDER='openai'` o transport
 * default fala com `/api/openai/proxy`; ausente (default `'anthropic'`) fala com
 * `/api/anthropic/proxy`. O argumento `transport` explícito tem prioridade total.
 *
 * Mecânica: substitui `globalThis.fetch` por um stub que captura o URL do 1.º
 * pedido (o classifier) e lança — abortando a run cedo. O URL revela qual proxy
 * (logo qual transport) foi seleccionado, sem depender do shape da resposta.
 */

const ORIGINAL_FETCH = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  vi.unstubAllEnvs();
});

/** Corre a run até ao 1.º fetch e devolve o URL capturado. */
async function captureFirstFetchUrl(
  transport?: OpenAIInferenceTransport
): Promise<string> {
  let captured = '';
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    captured = typeof input === 'string' ? input : input.toString();
    throw new Error('ABORT_AFTER_CAPTURE');
  }) as typeof fetch;

  const events: ExecutorSSEEvent[] = [];
  try {
    for await (const ev of runClientAgent('olá mundo', undefined, transport)) {
      events.push(ev);
    }
  } catch {
    // esperado — abortamos no 1.º fetch
  }
  return captured;
}

describe('runClientAgent — selecção de transport por NEXT_PUBLIC_LLM_PROVIDER (AC6)', () => {
  it("com NEXT_PUBLIC_LLM_PROVIDER='openai' usa o proxy OpenAI", async () => {
    vi.stubEnv('NEXT_PUBLIC_LLM_PROVIDER', 'openai');
    const url = await captureFirstFetchUrl();
    expect(url).toContain('/api/openai/proxy');
    expect(url).not.toContain('/api/anthropic/proxy');
  });

  it('com NEXT_PUBLIC_LLM_PROVIDER ausente usa o proxy Anthropic (default)', async () => {
    vi.stubEnv('NEXT_PUBLIC_LLM_PROVIDER', '');
    const url = await captureFirstFetchUrl();
    expect(url).toContain('/api/anthropic/proxy');
    expect(url).not.toContain('/api/openai/proxy');
  });

  it('o argumento transport explícito tem prioridade sobre a flag', async () => {
    // Flag diz anthropic, mas injectamos um OpenAIInferenceTransport explícito —
    // deve falar com o proxy OpenAI (override total).
    vi.stubEnv('NEXT_PUBLIC_LLM_PROVIDER', 'anthropic');
    let captured = '';
    const fetchFn = (async (input: RequestInfo | URL) => {
      captured = typeof input === 'string' ? input : input.toString();
      throw new Error('ABORT_AFTER_CAPTURE');
    }) as typeof fetch;
    const explicit = new OpenAIInferenceTransport(fetchFn);

    const url = await captureFirstFetchUrl(explicit);
    // O fetch capturado é o do transport injectado (não o globalThis stub).
    expect(captured).toContain('/api/openai/proxy');
    // `captureFirstFetchUrl` devolve o globalThis stub url, que NÃO foi chamado.
    expect(url).toBe('');
  });
});
