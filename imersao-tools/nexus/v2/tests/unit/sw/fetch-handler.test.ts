import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

/**
 * Story 9.3 — testes do handler `fetch` do Service Worker (AC2/AC3/AC7/AC10).
 *
 * `public/sw.js` corre no ServiceWorkerGlobalScope (não Node). Testamo-lo como
 * módulo JS puro com `vi.stubGlobal` para `self`/`clients`/`fetch`/`caches`
 * (D-SW-TEST-FRAMEWORK, Story 4.9). Diferença face aos testes de push: aqui
 * stubamos também `caches` (mock mínimo) e `self.location`, porque o handler
 * `fetch`/`activate` os usa — os testes de push NÃO os stubam e continuam verdes
 * porque nunca invocam estes handlers (AC6).
 *
 * internal-state-contract-gate.md — as três classes de estado que o SW distribui
 * são provadas separadamente:
 *   - sucesso de rede            → cenário 1a
 *   - erro REAL do servidor 5xx  → cenário 1b (devolvido tal qual, NÃO 503)
 *   - sem rede (fetch rejeita)   → cenário 2 (503 {offline:true} sintético)
 */

type Handler = (event: unknown) => unknown;

const ORIGIN = 'https://nexus.test';
const handlers: Record<string, Handler | undefined> = {};

let fetchMock: Mock;
let cacheMatchMock: Mock;
let cachePutMock: Mock;
let cacheOpenMock: Mock;
let cachesKeysMock: Mock;
let cachesDeleteMock: Mock;

interface FetchEvent {
  request: { url: string; method: string; mode: string };
  respondWith: Mock;
  _responded: unknown;
}

function makeFetchEvent(
  path: string,
  { method = 'GET', mode = 'cors', origin = ORIGIN } = {},
): FetchEvent {
  const event: FetchEvent = {
    request: { url: `${origin}${path}`, method, mode },
    respondWith: vi.fn((p: unknown) => {
      event._responded = p;
    }),
    _responded: undefined,
  };
  return event;
}

beforeEach(async () => {
  vi.resetModules();
  handlers.fetch = undefined;
  handlers.activate = undefined;
  handlers.install = undefined;

  vi.spyOn(console, 'warn').mockImplementation(() => {});

  fetchMock = vi.fn();
  cacheMatchMock = vi.fn(() => Promise.resolve(undefined));
  cachePutMock = vi.fn(() => Promise.resolve());
  cacheOpenMock = vi.fn(() => Promise.resolve({ put: cachePutMock }));
  cachesKeysMock = vi.fn(() => Promise.resolve([]));
  cachesDeleteMock = vi.fn(() => Promise.resolve(true));

  vi.stubGlobal('self', {
    addEventListener: vi.fn((type: string, fn: Handler) => {
      handlers[type] = fn;
    }),
    skipWaiting: vi.fn(),
    registration: { showNotification: vi.fn() },
    location: { origin: ORIGIN },
  });
  vi.stubGlobal('clients', {
    claim: vi.fn(() => Promise.resolve()),
    matchAll: vi.fn(() => Promise.resolve([])),
    openWindow: vi.fn(() => Promise.resolve()),
  });
  vi.stubGlobal('caches', {
    match: cacheMatchMock,
    open: cacheOpenMock,
    keys: cachesKeysMock,
    delete: cachesDeleteMock,
  });
  vi.stubGlobal('fetch', fetchMock);

  // SW é um script sem exports (ServiceWorkerGlobalScope) — import por side-effect.
  // @ts-expect-error sw.js não é um módulo ESM tipado; carregamos pelos efeitos.
  await import('@/public/sw.js');

  // CR-3 (Architect Gate 9.3): guard de registo dos listeners. Sem isto, se o
  // `addEventListener` falhasse (ou o handler deixasse de ser registado), os
  // cenários negativos (`expect(...).not.toHaveBeenCalled()`) passariam vaziamente
  // — o `handlers.fetch?.(event)` seria um no-op silencioso. Provar que o listener
  // existe transforma esses cenários em asserções reais.
  expect(handlers.fetch).toBeTypeOf('function');
  expect(handlers.activate).toBeTypeOf('function');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('SW fetch handler — Story 9.3', () => {
  // Cenário 1a — /api/* GET com rede OK: devolve a resposta de rede tal qual.
  it('1a — /api/* GET com rede OK devolve a resposta do servidor tal qual', async () => {
    const netRes = new Response('ok', { status: 200 });
    fetchMock.mockResolvedValueOnce(netRes);

    const event = makeFetchEvent('/api/agent/chat');
    handlers.fetch?.(event);

    expect(event.respondWith).toHaveBeenCalledTimes(1);
    const res = await event._responded;
    expect(res).toBe(netRes); // identidade prova "tal qual"
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  // Cenário 1b (eixo (c) internal-state-contract-gate) — erro REAL do servidor
  // (5xx) NÃO é convertido em 503 sintético: é devolvido tal qual.
  it('1b — /api/* GET com 500 do servidor devolve o 500 tal qual (NÃO 503 sintético)', async () => {
    const serverError = new Response('boom', { status: 500 });
    fetchMock.mockResolvedValueOnce(serverError);

    const event = makeFetchEvent('/api/anthropic/proxy');
    handlers.fetch?.(event);

    const res = (await event._responded) as Response;
    expect(res).toBe(serverError);
    expect(res.status).toBe(500);
    expect(res.status).not.toBe(503); // anti-M4: erro do servidor ≠ sem rede
  });

  // Cenário 2 — /api/* GET com fetch a REJEITAR (sem rede): 503 {offline:true}.
  it('2 — /api/* GET com fetch rejeitado devolve 503 {offline:true} honesto', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const event = makeFetchEvent('/api/agent/chat');
    handlers.fetch?.(event);

    const res = (await event._responded) as Response;
    expect(res.status).toBe(503);
    expect(res.headers.get('Content-Type')).toBe('application/json');
    await expect(res.json()).resolves.toEqual({ offline: true });
  });

  // Cenário 4 (C1 do PO) — /api/* NÃO-GET (POST) passa DIRECTO: sem respondWith,
  // sem 503 sintético. Offline, falha com o TypeError nativo (Story 9.5 trata).
  it('4 — POST /api/* não é interceptado (passa directo, sem 503)', () => {
    const event = makeFetchEvent('/api/anthropic/proxy', { method: 'POST' });
    handlers.fetch?.(event);

    expect(event.respondWith).not.toHaveBeenCalled();
  });

  // Cenário 3 — asset estático já em cache: devolve do cache SEM chamar fetch.
  it('3 — asset /_next/static/* em cache devolve do cache sem tocar na rede', async () => {
    const cached = new Response('cached', { status: 200 });
    cacheMatchMock.mockResolvedValueOnce(cached);

    const event = makeFetchEvent('/_next/static/chunks/main.js');
    handlers.fetch?.(event);

    const res = await event._responded;
    expect(res).toBe(cached);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cachePutMock).not.toHaveBeenCalled();
  });

  // Cenário 5a — asset ausente do cache: vai à rede, devolve, e grava no cache
  // (cache.put) porque response.ok.
  it('5a — asset /_next/static/* ausente do cache: fetch + cache.put (response.ok)', async () => {
    cacheMatchMock.mockResolvedValueOnce(undefined);
    const netRes = new Response('js', { status: 200 });
    fetchMock.mockResolvedValueOnce(netRes);

    const event = makeFetchEvent('/_next/static/chunks/app.js');
    handlers.fetch?.(event);

    const res = await event._responded;
    expect(res).toBe(netRes);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(cacheOpenMock).toHaveBeenCalledWith('nexus-static-v1');
    expect(cachePutMock).toHaveBeenCalledTimes(1);
    expect(cachePutMock.mock.calls[0][0]).toBe(event.request);
    // grava uma CÓPIA (clone), não o original que segue para o cliente.
    expect(cachePutMock.mock.calls[0][1]).not.toBe(netRes);
  });

  // Cenário 5b — asset ausente do cache mas resposta NÃO-ok: NÃO cacheia o erro.
  it('5b — asset com resposta não-ok NÃO é gravado no cache', async () => {
    cacheMatchMock.mockResolvedValueOnce(undefined);
    const netErr = new Response('not found', { status: 404 });
    fetchMock.mockResolvedValueOnce(netErr);

    const event = makeFetchEvent('/_next/static/chunks/missing.js');
    handlers.fetch?.(event);

    const res = await event._responded;
    expect(res).toBe(netErr);
    expect(cachePutMock).not.toHaveBeenCalled();
  });

  // Cenário 6 — navegação de documento HTML NÃO é interceptada (evita offline
  // shell — âmbito da Story 9.5). Sem respondWith, sem toque em caches.
  it('6 — navegação (mode navigate) não é interceptada', () => {
    const event = makeFetchEvent('/tarefas', { mode: 'navigate' });
    handlers.fetch?.(event);

    expect(event.respondWith).not.toHaveBeenCalled();
    expect(cacheMatchMock).not.toHaveBeenCalled();
  });

  // Extra — pedido same-origin não-/api e não-static (ex: rota RSC) passa directo.
  it('extra — GET same-origin fora de /api e /_next/static não é interceptado', () => {
    const event = makeFetchEvent('/algum/caminho');
    handlers.fetch?.(event);

    expect(event.respondWith).not.toHaveBeenCalled();
  });
});

describe('SW activate handler — Story 9.3 (AC4)', () => {
  // activate limpa caches obsoletos (nome != CACHE_NAME) e mantém clients.claim.
  it('activate apaga cache antigo (nexus-static-v0) e preserva o corrente', async () => {
    cachesKeysMock.mockResolvedValueOnce(['nexus-static-v0', 'nexus-static-v1']);

    const waited: Promise<unknown>[] = [];
    const event = { waitUntil: vi.fn((p: Promise<unknown>) => waited.push(p)) };
    handlers.activate?.(event);

    expect(event.waitUntil).toHaveBeenCalledTimes(1);
    await Promise.all(waited);

    expect(cachesDeleteMock).toHaveBeenCalledWith('nexus-static-v0');
    expect(cachesDeleteMock).not.toHaveBeenCalledWith('nexus-static-v1');
  });
});
