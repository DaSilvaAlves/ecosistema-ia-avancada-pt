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

async function call(
  body?: unknown,
  withCookie = true,
  origin = 'http://localhost:3001',
): Promise<Response> {
  const { POST } = await import('@/app/api/conhecimento/web-search/route');
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (withCookie) headers.set('Cookie', 'nexus_session=test-session-id');
  const { NextRequest } = await import('next/server');
  const req = new NextRequest(`${origin}/api/conhecimento/web-search`, {
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

  it('400 com query não-string (CR PR #72, finding 4)', async () => {
    installFetch(async () => jsonResponse({}));
    const resp = await call({ query: 123 });
    expect(resp.status).toBe(400);
    const data = (await resp.json()) as { error: string };
    expect(data.error).toContain('Indica um termo de pesquisa');
  });

  it('400 com query acima do limite (> MAX_QUERY_LENGTH) (CR PR #72, finding 4)', async () => {
    installFetch(async () => jsonResponse({}));
    const resp = await call({ query: 'a'.repeat(501) });
    expect(resp.status).toBe(400);
    const data = (await resp.json()) as { error: string };
    expect(data.error).toContain('demasiado longa');
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

// TESTE ANTI-TAUTOLÓGICO OBRIGATÓRIO (`[D-5.11-SSRF-FIX]`, eixo c). Sem o fix,
// `route.ts` construiria o `proxyUrl` a partir de `req.nextUrl.origin` (host
// spoofado) e reenviaria o cookie de sessão para o host do atacante. Estes testes
// FALHARIAM com o código antigo: o proxy seria chamado no host malicioso COM o
// cookie. Com o fix, o host não-allowlisted salta o path Anthropic e cai em DDG.
describe('POST /api/conhecimento/web-search — SSRF / host-header (CR Critical PR #72)', () => {
  const originalVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  beforeEach(() => {
    // Garante o caminho da allowlist (sem env Vercel a curto-circuitar a decisão).
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  });

  afterEach(() => {
    if (originalVercel === undefined) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    else process.env.VERCEL_PROJECT_PRODUCTION_URL = originalVercel;
  });

  it('Host malicioso (não-allowlisted) → proxy NÃO é chamado com o cookie; cai em DDG', async () => {
    let proxyCalledWithCookie = false;
    let anyProxyCall = false;
    installFetch(async (url, init) => {
      if (url.includes('/api/anthropic/proxy')) {
        anyProxyCall = true;
        const headers = new Headers(init?.headers);
        if (headers.get('Cookie')) proxyCalledWithCookie = true;
        return jsonResponse(ANTHROPIC_SUCCESS_BODY);
      }
      if (url.includes('duckduckgo')) return new Response(DDG_HTML, { status: 200 });
      return jsonResponse({}, 500);
    });

    const resp = await call({ query: 'teste' }, true, 'https://attacker.example');

    // O cookie de sessão NÃO foi exfiltrado para o host do atacante.
    expect(proxyCalledWithCookie).toBe(false);
    // O proxy nem sequer é contactado no host malicioso — salta direto para DDG.
    expect(anyProxyCall).toBe(false);
    // Resultado degradado seguro: DDG (sem cookie), nunca fuga silenciosa.
    expect(resp.status).toBe(200);
    const data = (await resp.json()) as { source: string };
    expect(data.source).toBe('duckduckgo');
  });

  // ANTI-TAUTOLÓGICO (CR Major PR #72 Iter 3): a allowlist é por ORIGIN COMPLETA
  // (scheme + host + porta), não por hostname. Uma porta arbitrária num host de
  // confiança (`localhost`) NÃO é de confiança. Este teste FALHARIA com a
  // validação só-por-hostname antiga, que aceitaria `localhost:1234` e
  // exfiltraria o cookie para o listener do atacante nessa porta.
  it('localhost com porta NÃO-allowlisted → proxy NÃO contactado com cookie; cai em DDG', async () => {
    let proxyCalledWithCookie = false;
    let anyProxyCall = false;
    installFetch(async (url, init) => {
      if (url.includes('/api/anthropic/proxy')) {
        anyProxyCall = true;
        if (new Headers(init?.headers).get('Cookie')) proxyCalledWithCookie = true;
        return jsonResponse(ANTHROPIC_SUCCESS_BODY);
      }
      if (url.includes('duckduckgo')) return new Response(DDG_HTML, { status: 200 });
      return jsonResponse({}, 500);
    });

    // Mesmo hostname de confiança, porta arbitrária controlada pelo atacante.
    const resp = await call({ query: 'teste' }, true, 'http://localhost:1234');

    expect(proxyCalledWithCookie).toBe(false);
    expect(anyProxyCall).toBe(false);
    expect(resp.status).toBe(200);
    const data = (await resp.json()) as { source: string };
    expect(data.source).toBe('duckduckgo');
  });

  it('Host de confiança (allowlist) → proxy É chamado com o cookie (caminho feliz inalterado, c3)', async () => {
    let proxyCookie: string | null = null;
    installFetch(async (url, init) => {
      if (url.includes('/api/anthropic/proxy')) {
        proxyCookie = new Headers(init?.headers).get('Cookie');
        return jsonResponse(ANTHROPIC_SUCCESS_BODY);
      }
      return new Response(DDG_HTML, { status: 200 });
    });

    // `localhost` está na allowlist → comportamento idêntico ao actual.
    const resp = await call({ query: 'teste' }, true, 'http://localhost:3001');
    expect(proxyCookie).toBe('nexus_session=test-session-id');
    expect(resp.status).toBe(200);
    const data = (await resp.json()) as { source: string };
    expect(data.source).toBe('anthropic');
  });

  it('VERCEL_PROJECT_PRODUCTION_URL presente → proxy contactado nessa origin de confiança', async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'nexus.vercel.app';
    let proxyHost: string | null = null;
    installFetch(async (url, init) => {
      if (url.includes('/api/anthropic/proxy')) {
        proxyHost = new URL(url).host;
        const cookie = new Headers(init?.headers).get('Cookie');
        // O cookie só viaja para a origin de confiança da env (não o Host spoofado).
        expect(cookie).toBe('nexus_session=test-session-id');
        return jsonResponse(ANTHROPIC_SUCCESS_BODY);
      }
      return new Response(DDG_HTML, { status: 200 });
    });

    // Mesmo com Host malicioso, a env de confiança prevalece (não o nextUrl.origin).
    const resp = await call({ query: 'teste' }, true, 'https://attacker.example');
    expect(proxyHost).toBe('nexus.vercel.app');
    expect(resp.status).toBe(200);
    const data = (await resp.json()) as { source: string };
    expect(data.source).toBe('anthropic');
  });
});

describe('GET /api/conhecimento/web-search', () => {
  it('405', async () => {
    const { GET } = await import('@/app/api/conhecimento/web-search/route');
    const resp = await GET();
    expect(resp.status).toBe(405);
  });
});
