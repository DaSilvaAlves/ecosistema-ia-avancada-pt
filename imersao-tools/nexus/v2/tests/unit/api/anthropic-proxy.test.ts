import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
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
 * Não cobre rate limiting (depende de KV em prod).
 */

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
beforeEach(() => {
  server.resetHandlers(...handlers);
  vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-FAKE-KEY-do-not-leak');
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
