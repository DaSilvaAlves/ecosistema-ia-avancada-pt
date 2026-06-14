import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Nexus v2 — POST /api/conhecimento/web-search tests (Story 5.11 — AC2, AC6)
 *
 * Cobre a cascata `[D-5.11-FALLBACK]`: Anthropic (via proxy) → DDG → 503. O fetch
 * interno é mockado por URL (proxy `/api/anthropic/proxy` vs DDG
 * `html.duckduckgo.com`). Os bodies do proxy reflectem o shape REAL da Anthropic
 * web search (mock-protocol-fidelity.md). Inclui o TESTE OBRIGATÓRIO do eixo (c):
 * um `web_search_tool_result_error` (HTTP 200) dispara o fallback DDG (ponto cego
 * M4 da 4.9).
 */

let mockSessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({
    valid: mockSessionValid,
    sessionId: mockSessionValid ? 'test-session-id' : undefined,
    userId: mockSessionValid ? ('eurico' as const) : undefined,
  })),
}));

// HTML DDG real (subset) — 1 resultado utilizável.
const DDG_HTML = `
<div class="result web-result"><div class="links_main">
  <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.org%2Fa">Resultado DDG</a>
  <a class="result__snippet">Excerto do DuckDuckGo.</a>
</div></div>
`;

const ANTHROPIC_SUCCESS_BODY = {
  content: [
    {
      type: 'web_search_tool_result',
      content: [
        {
          type: 'web_search_result',
          url: 'https://anthropic-result.com/x',
          title: 'Resultado Anthropic',
        },
      ],
    },
    {
      type: 'text',
      text: '...',
      citations: [
        {
          url: 'https://anthropic-result.com/x',
          cited_text: 'Citação do resultado.',
        },
      ],
    },
  ],
};

const ANTHROPIC_ERROR_BODY = {
  content: [
    {
      type: 'web_search_tool_result',
      content: { type: 'web_search_tool_result_error', error_code: 'max_uses_exceeded' },
    },
  ],
};

type FetchImpl = (url: string, init?: RequestInit) => Promise<Response>;

function installFetch(impl: FetchImpl): void {
  vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    return impl(url, init);
  }));
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function call(body?: unknown, withCookie = true): Promise<Response> {
  const { POST } = await import('@/app/api/conhecimento/web-search/route');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (withCookie) headers.set('Cookie', 'nexus_session=test-session-id');
  const { NextRequest } = await import('next/server');
  const req = new NextRequest('http://localhost:3001/api/conhecimento/web-search', {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return POST(req);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionValid = true;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/conhecimento/web-search — auth + validação', () => {
  it('401 sem sessão válida', async () => {
    mockSessionValid = false;
    installFetch(async () => jsonResponse({}));
    const resp = await call({ query: 'teste' }, false);
    expect(resp.status).toBe(401);
  });

  it('400 com body não-JSON', async () => {
    installFetch(async () => jsonResponse({}));
    const { POST } = await import('@/app/api/conhecimento/web-search/route');
    const { NextRequest } = await import('next/server');
    const req = new NextRequest('http://localhost:3001/api/conhecimento/web-search', {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json',
        Cookie: 'nexus_session=test-session-id',
      }),
      body: 'not-json{',
    });
    const resp = await POST(req);
    expect(resp.status).toBe(400);
  });

  it('400 com query vazia', async () => {
    installFetch(async () => jsonResponse({}));
    const resp = await call({ query: '   ' });
    expect(resp.status).toBe(400);
  });
});

describe('POST /api/conhecimento/web-search — cascata', () => {
  it('Anthropic devolve resultados → 200 source anthropic (DDG não é chamado)', async () => {
    const ddgCalled = vi.fn();
    installFetch(async (url) => {
      if (url.includes('/api/anthropic/proxy')) return jsonResponse(ANTHROPIC_SUCCESS_BODY);
      if (url.includes('duckduckgo')) {
        ddgCalled();
        return new Response(DDG_HTML, { status: 200 });
      }
      return jsonResponse({}, 500);
    });

    const resp = await call({ query: 'Artemis 2' });
    expect(resp.status).toBe(200);
    const data = (await resp.json()) as { results: unknown[]; source: string };
    expect(data.source).toBe('anthropic');
    expect(data.results).toHaveLength(1);
    expect(ddgCalled).not.toHaveBeenCalled();
  });

  it('propaga o cookie de sessão no fetch interno ao proxy ([D-5.11-RUNTIME])', async () => {
    let proxyCookie: string | null = null;
    installFetch(async (url, init) => {
      if (url.includes('/api/anthropic/proxy')) {
        const headers = new Headers(init?.headers);
        proxyCookie = headers.get('Cookie');
        return jsonResponse(ANTHROPIC_SUCCESS_BODY);
      }
      return new Response(DDG_HTML, { status: 200 });
    });

    await call({ query: 'teste' });
    expect(proxyCookie).toBe('nexus_session=test-session-id');
  });

  // TESTE OBRIGATÓRIO (gate de saída, eixo c): erro-no-body HTTP 200 → fallback DDG.
  // Falharia se o gatilho fosse `!response.ok` (o erro vem com status 200).
  it('Anthropic 200 + web_search_tool_result_error → fallback DDG → 200 source duckduckgo', async () => {
    const proxyCalled = vi.fn();
    const ddgCalled = vi.fn();
    installFetch(async (url) => {
      if (url.includes('/api/anthropic/proxy')) {
        proxyCalled();
        // HTTP 200 — mas erro no body (ponto cego M4 da 4.9).
        return jsonResponse(ANTHROPIC_ERROR_BODY, 200);
      }
      if (url.includes('duckduckgo')) {
        ddgCalled();
        return new Response(DDG_HTML, { status: 200 });
      }
      return jsonResponse({}, 500);
    });

    const resp = await call({ query: 'Artemis 2' });
    expect(proxyCalled).toHaveBeenCalled();
    expect(ddgCalled).toHaveBeenCalled();
    expect(resp.status).toBe(200);
    const data = (await resp.json()) as { results: unknown[]; source: string };
    expect(data.source).toBe('duckduckgo');
    expect(data.results).toHaveLength(1);
  });

  it('Proxy 429 (rate limit) → fallback DDG', async () => {
    installFetch(async (url) => {
      if (url.includes('/api/anthropic/proxy')) return jsonResponse({ error: 'rate' }, 429);
      return new Response(DDG_HTML, { status: 200 });
    });
    const resp = await call({ query: 'teste' });
    expect(resp.status).toBe(200);
    const data = (await resp.json()) as { source: string };
    expect(data.source).toBe('duckduckgo');
  });

  it('Anthropic falha de rede (fetch throws) → fallback DDG', async () => {
    installFetch(async (url) => {
      if (url.includes('/api/anthropic/proxy')) throw new Error('network down');
      return new Response(DDG_HTML, { status: 200 });
    });
    const resp = await call({ query: 'teste' });
    expect(resp.status).toBe(200);
    const data = (await resp.json()) as { source: string };
    expect(data.source).toBe('duckduckgo');
  });

  it('ambos falham (Anthropic erro + DDG CAPTCHA) → 503 PT-PT (nunca silencioso)', async () => {
    installFetch(async (url) => {
      if (url.includes('/api/anthropic/proxy')) return jsonResponse(ANTHROPIC_ERROR_BODY, 200);
      // HTML sem `result__a` → parseDdgHtml → [] → falha.
      return new Response('<html><body>captcha</body></html>', { status: 200 });
    });
    const resp = await call({ query: 'teste' });
    expect(resp.status).toBe(503);
    const data = (await resp.json()) as { error: string };
    expect(data.error).toContain('Não foi possível pesquisar');
  });

  it('DDG não-ok (502) com Anthropic falhado → 503', async () => {
    installFetch(async (url) => {
      if (url.includes('/api/anthropic/proxy')) throw new Error('down');
      return new Response('bad gateway', { status: 502 });
    });
    const resp = await call({ query: 'teste' });
    expect(resp.status).toBe(503);
  });
});

describe('GET /api/conhecimento/web-search', () => {
  it('405', async () => {
    const { GET } = await import('@/app/api/conhecimento/web-search/route');
    const resp = await GET();
    expect(resp.status).toBe(405);
  });
});
