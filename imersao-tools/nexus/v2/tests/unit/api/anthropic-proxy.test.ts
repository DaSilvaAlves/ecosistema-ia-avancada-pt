import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from '@/tests/mocks/handlers';

/**
 * Nexus v2 — Anthropic proxy unit tests (Story 0.5)
 *
 * Verifica:
 *  - POST com body válido → resposta encaminhada correctamente
 *  - ANTHROPIC_API_KEY nunca no body/headers da resposta
 *  - 401 sem cookie de sessão
 *  - 400 com body inválido
 *
 * Story 9.1a (cobertura) — adiciona os caminhos que estavam a 0%: bloco de
 * rate-limit KV (INCR/EXPIRE/429/fail-open, linhas 45-85), 500 sem API key,
 * 400 body não-JSON, 502 falha de upstream, streaming SSE e GET→405. Todos
 * reutilizam o MSW já existente; os mocks do KV REST espelham o protocolo real
 * do Upstash (INCR devolve `{result:<n>}`, GET de sessão devolve `{result:<json>}`).
 */

const server = setupServer(...handlers);

// Story 9.1a — URL fake do KV REST (Upstash) usada só nos testes de rate-limit.
const KV_URL = 'https://kv.test';

/**
 * Story 9.1a — regista handlers MSW do KV REST e activa o KV via env, para
 * exercitar o bloco de rate-limit do proxy (que só corre quando `KV_REST_API_URL`
 * e `KV_REST_API_TOKEN` estão definidos). Como activar o KV faz `getSession` ir
 * pelo caminho de produção (lookup KV), também se mocka o `/get/` da sessão a
 * devolver uma sessão válida — espelhando o protocolo real do Upstash.
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
    // getSession (caminho prod) → sessão válida
    http.get(`${KV_URL}/get/*`, () => HttpResponse.json({ result: sessionData })),
    // checkRateLimit → INCR
    http.get(`${KV_URL}/incr/*`, () => {
      if (opts.incrNetworkError) return HttpResponse.error();
      if (opts.incrOk === false) return HttpResponse.json({ error: 'kv down' }, { status: 500 });
      return HttpResponse.json({ result: opts.incrResult ?? 1 });
    }),
    // checkRateLimit → EXPIRE (1.ª request da janela)
    http.get(`${KV_URL}/expire/*`, () => HttpResponse.json({ result: 1 })),
  );
  vi.stubEnv('KV_REST_API_URL', KV_URL);
  vi.stubEnv('KV_REST_API_TOKEN', 'kv-token-fake-do-not-leak');
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
beforeEach(() => {
  server.resetHandlers(...handlers);
  vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-FAKE-KEY-do-not-leak');
  // Sem KV por omissão → getSession aceita qualquer cookie não-vazio (dev mode) e
  // o rate-limit é saltado. Os testes de rate-limit reativam o KV via useKvRateLimit.
  vi.stubEnv('KV_REST_API_URL', '');
  vi.stubEnv('KV_REST_API_TOKEN', '');
});

// Helper para invocar o route handler como uma function call simulada.
async function callProxy(init: { hasCookie: boolean; body: unknown }): Promise<Response> {
  const { POST } = await import('@/app/api/anthropic/proxy/route');

  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (init.hasCookie) headers.set('Cookie', 'nexus_session=test-session-id');

  // NextRequest é compatível com Request standard para test
  const req = new Request('http://localhost:3001/api/anthropic/proxy', {
    method: 'POST',
    headers,
    body: typeof init.body === 'string' ? init.body : JSON.stringify(init.body),
  });

  return POST(req as never);
}

describe('Anthropic proxy', () => {
  it('rejeita 401 quando não há cookie de sessão', async () => {
    const resp = await callProxy({
      hasCookie: false,
      body: {
        messages: [{ role: 'user', content: 'olá' }],
        model: 'claude-haiku-4-5-20251001',
      },
    });
    expect(resp.status).toBe(401);
  });

  it('rejeita 400 quando body é inválido (sem messages)', async () => {
    const resp = await callProxy({
      hasCookie: true,
      body: { model: 'claude-haiku-4-5-20251001' },
    });
    expect(resp.status).toBe(400);
  });

  it('encaminha request válido para Anthropic e devolve resposta', async () => {
    const resp = await callProxy({
      hasCookie: true,
      body: {
        messages: [{ role: 'user', content: 'olá' }],
        model: 'claude-haiku-4-5-20251001',
      },
    });

    expect(resp.status).toBe(200);
    const json = (await resp.json()) as { content?: Array<{ type: string }> };
    expect(json.content).toBeDefined();
  });

  it('NÃO inclui ANTHROPIC_API_KEY na resposta (NFR5)', async () => {
    const resp = await callProxy({
      hasCookie: true,
      body: {
        messages: [{ role: 'user', content: 'olá' }],
        model: 'claude-haiku-4-5-20251001',
      },
    });

    const text = await resp.text();
    expect(text).not.toContain('sk-ant-test-FAKE-KEY');

    // Headers também não podem conter a key
    const headerEntries = Array.from(resp.headers.entries());
    for (const [key, value] of headerEntries) {
      expect(value, `header ${key} contém API key`).not.toContain('sk-ant-test-FAKE-KEY');
    }
  });

  it('reconhece prompt multi-intent canónico no MSW handler', async () => {
    const resp = await callProxy({
      hasCookie: true,
      body: {
        messages: [
          {
            role: 'user',
            content: 'paguei €78,70 supermercado, amanhã reunião 15h, lembra-me sexta luz',
          },
        ],
        model: 'claude-sonnet-4-6',
      },
    });

    expect(resp.status).toBe(200);
    const json = (await resp.json()) as {
      content: Array<{ type: string; name?: string }>;
    };
    const toolNames = json.content.filter((c) => c.type === 'tool_use').map((c) => c.name);
    expect(toolNames).toContain('criar_finança_variavel');
    expect(toolNames).toContain('criar_evento_calendar');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 9.1a — rate-limit KV (linhas 45-85, antes a 0%)
// ═══════════════════════════════════════════════════════════════════════════

describe('Anthropic proxy — rate limit KV (Story 9.1a)', () => {
  const validBody = {
    messages: [{ role: 'user', content: 'olá' }],
    model: 'claude-haiku-4-5-20251001',
  };

  it('1.ª request da janela → INCR=1, define EXPIRE e encaminha (200)', async () => {
    useKvRateLimit({ incrResult: 1 });
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
    const resp = await callProxy({ hasCookie: true, body: validBody });
    expect(resp.status).toBe(200);
  });

  it('INCR lança (erro de rede no KV) → fail-open, encaminha (200)', async () => {
    useKvRateLimit({ incrNetworkError: true });
    const resp = await callProxy({ hasCookie: true, body: validBody });
    expect(resp.status).toBe(200);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 9.1a — caminhos de erro + streaming + método (linhas 103-107/114-118/
// 142-149/153-161/171-176, antes a 0%)
// ═══════════════════════════════════════════════════════════════════════════

describe('Anthropic proxy — erros, streaming e método (Story 9.1a)', () => {
  const validBody = {
    messages: [{ role: 'user', content: 'olá' }],
    model: 'claude-haiku-4-5-20251001',
  };

  it('devolve 500 quando ANTHROPIC_API_KEY não está configurada', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    const resp = await callProxy({ hasCookie: true, body: validBody });
    expect(resp.status).toBe(500);
    const json = (await resp.json()) as { error?: string };
    expect(json.error).toContain('API key');
  });

  it('devolve 400 quando o body não é JSON válido', async () => {
    const resp = await callProxy({ hasCookie: true, body: '{ isto nao e json valido' });
    expect(resp.status).toBe(400);
  });

  it('devolve 502 quando o fetch ao upstream Anthropic rejeita (rede)', async () => {
    server.use(
      http.post('https://api.anthropic.com/v1/messages', () => HttpResponse.error()),
    );
    const resp = await callProxy({ hasCookie: true, body: validBody });
    expect(resp.status).toBe(502);
    const json = (await resp.json()) as { error?: string };
    expect(json.error).toContain('Falha ao contactar Anthropic');
    // NFR5 — a key nunca vaza, nem no caminho de erro.
    expect(JSON.stringify(json)).not.toContain('sk-ant-test-FAKE-KEY');
  });

  it('encaminha streaming SSE → 200 text/event-stream (pass-through do corpo)', async () => {
    server.use(
      http.post(
        'https://api.anthropic.com/v1/messages',
        () =>
          new HttpResponse('event: message_start\ndata: {"type":"message_start"}\n\n', {
            headers: { 'Content-Type': 'text/event-stream' },
          }),
      ),
    );
    const resp = await callProxy({
      hasCookie: true,
      body: { ...validBody, stream: true },
    });
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toBe('text/event-stream');
    const text = await resp.text();
    expect(text).toContain('data:');
  });

  it('GET devolve 405', async () => {
    const { GET } = await import('@/app/api/anthropic/proxy/route');
    const resp = await GET();
    expect(resp.status).toBe(405);
  });
});
