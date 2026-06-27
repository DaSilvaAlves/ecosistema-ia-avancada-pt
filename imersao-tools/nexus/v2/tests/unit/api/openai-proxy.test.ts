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
});
