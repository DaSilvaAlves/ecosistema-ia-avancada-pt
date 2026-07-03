import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '@/tests/mocks/handlers';

/**
 * Nexus v2 — OpenAI proxy unit tests (Story 8.4 — ADR-10 S4, AC1)
 *
 * Espelho de `anthropic-proxy.test.ts`. Verifica:
 *  - 401 sem cookie de sessão (auth antes do forward)
 *  - 400 com body inválido (sem messages)
 *  - 500 sem OPENAI_API_KEY configurada
 *  - forward streaming SSE válido → 200 text/event-stream
 *  - OPENAI_API_KEY NUNCA no body/headers da resposta (NFR5)
 *  - GET → 405
 *
 * SSRF (ADR-10 §7 R5): o upstream é constante hardcoded — não há input do
 * request que o desvie. Rate-limit (KV) não coberto (depende de KV em prod).
 */

const server = setupServer(...handlers);

// Story 9.1a — URL fake do KV REST (Upstash) usada só nos testes de rate-limit.
const KV_URL = 'https://kv.test';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Story 9.1a — regista handlers MSW do KV REST e activa o KV via env, para
 * exercitar o bloco de rate-limit do proxy (linhas 54-98, só corre com
 * `KV_REST_API_URL`/`KV_REST_API_TOKEN` definidos). Activar o KV faz `getSession`
 * ir pelo caminho de produção (lookup KV), pelo que também se mocka o `/get/` da
 * sessão a devolver sessão válida — espelhando o protocolo real do Upstash
 * (INCR → `{result:<n>}`, GET → `{result:<json>}`).
 */
function useKvRateLimit(opts: {
  incrResult?: number;
  incrOk?: boolean;
  incrNetworkError?: boolean;
} = {}): void {
  const sessionData = JSON.stringify({
    sessionId: 'test-session-id',
    createdAt: Date.now(),
    userId: 'eurico',
  });
  server.use(
    http.get(`${KV_URL}/get/*`, () => HttpResponse.json({ result: sessionData })),
    http.get(`${KV_URL}/incr/*`, () => {
      if (opts.incrNetworkError) return HttpResponse.error();
      if (opts.incrOk === false) return HttpResponse.json({ error: 'kv down' }, { status: 500 });
      return HttpResponse.json({ result: opts.incrResult ?? 1 });
    }),
    http.get(`${KV_URL}/expire/*`, () => HttpResponse.json({ result: 1 })),
  );
  vi.stubEnv('KV_REST_API_URL', KV_URL);
  vi.stubEnv('KV_REST_API_TOKEN', 'kv-token-fake-do-not-leak');
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
beforeEach(() => {
  server.resetHandlers(...handlers);
  vi.stubEnv('OPENAI_API_KEY', 'sk-openai-test-FAKE-KEY-do-not-leak');
  // Sem KV → getSession aceita qualquer cookie não-vazio (dev mode).
  vi.stubEnv('KV_REST_API_URL', '');
  vi.stubEnv('KV_REST_API_TOKEN', '');
});

async function callProxy(init: { hasCookie: boolean; body: unknown }): Promise<Response> {
  const { POST } = await import('@/app/api/openai/proxy/route');

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (init.hasCookie) headers.set('Cookie', 'nexus_session=test-session-id');

  const req = new Request('http://localhost:3001/api/openai/proxy', {
    method: 'POST',
    headers,
    body: typeof init.body === 'string' ? init.body : JSON.stringify(init.body),
  });

  return POST(req as never);
}

describe('OpenAI proxy', () => {
  it('rejeita 401 quando não há cookie de sessão', async () => {
    const resp = await callProxy({
      hasCookie: false,
      body: { messages: [{ role: 'user', content: 'olá' }], model: 'gpt-4.1-mini' },
    });
    expect(resp.status).toBe(401);
  });

  it('rejeita 400 quando body é inválido (sem messages)', async () => {
    const resp = await callProxy({
      hasCookie: true,
      body: { model: 'gpt-4.1-mini' },
    });
    expect(resp.status).toBe(400);
  });

  it('devolve 500 quando OPENAI_API_KEY não está configurada', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const resp = await callProxy({
      hasCookie: true,
      body: { messages: [{ role: 'user', content: 'olá' }], model: 'gpt-4.1-mini' },
    });
    expect(resp.status).toBe(500);
  });

  it('encaminha streaming SSE válido para OpenAI e devolve text/event-stream', async () => {
    const resp = await callProxy({
      hasCookie: true,
      body: {
        messages: [{ role: 'user', content: 'MOCK_OPENAI_TEXT olá' }],
        model: 'gpt-4.1',
        stream: true,
        stream_options: { include_usage: true },
      },
    });

    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toBe('text/event-stream');
    const text = await resp.text();
    expect(text).toContain('data:');
    expect(text).toContain('[DONE]');
  });

  it('encaminha non-streaming JSON e devolve application/json', async () => {
    // Override pontual: resposta non-streaming JSON da OpenAI.
    server.use(
      http.post('https://api.openai.com/v1/chat/completions', () =>
        HttpResponse.json({
          choices: [{ message: { content: '{"intents":[]}' } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        })
      )
    );
    const resp = await callProxy({
      hasCookie: true,
      body: {
        messages: [{ role: 'user', content: 'classifica' }],
        model: 'gpt-4.1-mini',
        response_format: { type: 'json_object' },
      },
    });
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toBe('application/json');
    const json = (await resp.json()) as { choices?: unknown[] };
    expect(json.choices).toBeDefined();
  });

  it('NÃO inclui OPENAI_API_KEY na resposta (NFR5)', async () => {
    server.use(
      http.post('https://api.openai.com/v1/chat/completions', () =>
        HttpResponse.json({ choices: [{ message: { content: 'ok' } }] })
      )
    );
    const resp = await callProxy({
      hasCookie: true,
      body: {
        messages: [{ role: 'user', content: 'olá' }],
        model: 'gpt-4.1-mini',
      },
    });

    const text = await resp.text();
    expect(text).not.toContain('sk-openai-test-FAKE-KEY');

    const headerEntries = Array.from(resp.headers.entries());
    for (const [key, value] of headerEntries) {
      expect(value, `header ${key} contém API key`).not.toContain('sk-openai-test-FAKE-KEY');
    }
  });

  it('devolve 502 quando o fetch ao upstream OpenAI rejeita (rede) — CR Iter 2 #5', async () => {
    // `HttpResponse.error()` simula um erro de rede → o `fetch(OPENAI_URL)` do
    // proxy rejeita → catch → 502 com detalhe PT-PT (sem vazar a key).
    server.use(
      http.post('https://api.openai.com/v1/chat/completions', () => HttpResponse.error())
    );
    const resp = await callProxy({
      hasCookie: true,
      body: {
        messages: [{ role: 'user', content: 'olá' }],
        model: 'gpt-4.1-mini',
      },
    });
    expect(resp.status).toBe(502);
    const json = (await resp.json()) as { error?: string };
    expect(json.error).toContain('Falha ao contactar OpenAI');
    const text = JSON.stringify(json);
    expect(text).not.toContain('sk-openai-test-FAKE-KEY');
  });

  it('GET devolve 405', async () => {
    const { GET } = await import('@/app/api/openai/proxy/route');
    const resp = await GET();
    expect(resp.status).toBe(405);
  });

  it('devolve 400 quando o body não é JSON válido — Story 9.1a', async () => {
    const resp = await callProxy({ hasCookie: true, body: '{ isto nao e json valido' });
    expect(resp.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 9.1a — rate-limit KV (linhas 54-98, antes a 0%)
// ═══════════════════════════════════════════════════════════════════════════

describe('OpenAI proxy — rate limit KV (Story 9.1a)', () => {
  const validBody = { messages: [{ role: 'user', content: 'olá' }], model: 'gpt-4.1-mini' };

  it('1.ª request da janela → INCR=1, define EXPIRE e encaminha (200)', async () => {
    useKvRateLimit({ incrResult: 1 });
    server.use(
      http.post(OPENAI_URL, () =>
        HttpResponse.json({ choices: [{ message: { content: 'ok' } }] }),
      ),
    );
    const resp = await callProxy({ hasCookie: true, body: validBody });
    expect(resp.status).toBe(200);
  });

  it('contador acima do limite (> 60/min) → 429 com Retry-After', async () => {
    useKvRateLimit({ incrResult: 61 }); // > RATE_LIMIT_PER_MIN (60)
    const resp = await callProxy({ hasCookie: true, body: validBody });
    expect(resp.status).toBe(429);
    expect(resp.headers.get('Retry-After')).toBe('60');
    const json = (await resp.json()) as { error?: string };
    expect(json.error).toContain('Rate limit');
  });

  it('INCR responde não-ok (KV indisponível) → fail-open, encaminha (200)', async () => {
    useKvRateLimit({ incrOk: false });
    server.use(http.post(OPENAI_URL, () => HttpResponse.json({ choices: [] })));
    const resp = await callProxy({ hasCookie: true, body: validBody });
    expect(resp.status).toBe(200);
  });

  it('INCR lança (erro de rede no KV) → fail-open, encaminha (200)', async () => {
    useKvRateLimit({ incrNetworkError: true });
    server.use(http.post(OPENAI_URL, () => HttpResponse.json({ choices: [] })));
    const resp = await callProxy({ hasCookie: true, body: validBody });
    expect(resp.status).toBe(200);
  });
});
