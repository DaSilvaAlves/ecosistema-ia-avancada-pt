import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Story 6.1 — testes da route de estado `GET /api/google/oauth/status` (T4, AC4/AC6).
 * Story 6.7 (T3, AC3, [D-6.7-STATUS]): resposta EXPANDE para
 * `{ connected, calendarConnected, gmailConnected }` derivada dos `scopes`.
 *
 * Cobre:
 *   - sem sessão → 401 (AC6)
 *   - tokens presentes → { connected: true, ... } (NUNCA devolve os tokens)
 *   - tokens ausentes → tudo false
 *   - falha de KV → tudo false (fail-safe, nunca afirma ligado sem prova)
 *   - Story 6.7: scopes calendar-só → calendarConnected:true, gmailConnected:false
 *   - Story 6.7: scopes combinado → ambos true
 *   - Story 6.7: registo legado sem scopes → calendarConnected:true (fallback)
 */

let mockSessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({
    valid: mockSessionValid,
    sessionId: mockSessionValid ? 'sess' : undefined,
    userId: mockSessionValid ? ('eurico' as const) : undefined,
  })),
}));

let tokensResult: unknown = null;
let tokensThrows = false;
vi.mock('@/lib/google/token-store', () => ({
  getTokens: vi.fn(async () => {
    if (tokensThrows) throw new Error('kv down');
    return tokensResult;
  }),
}));

async function call(withCookie = true): Promise<Response> {
  const { GET } = await import('@/app/api/google/oauth/status/route');
  const headers = new Headers();
  if (withCookie) headers.set('Cookie', 'nexus_session=sess');
  return GET(new Request('http://localhost:3001/api/google/oauth/status', { headers }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionValid = true;
  tokensResult = null;
  tokensThrows = false;
});

describe('status — auth (AC6)', () => {
  it('sem sessão → 401', async () => {
    mockSessionValid = false;
    const res = await call(false);
    expect(res.status).toBe(401);
  });
});

describe('status — estado de ligação (AC4)', () => {
  it('tokens presentes (legado 6.1 sem scopes) → connected:true, calendar-só, sem expor tokens', async () => {
    tokensResult = {
      accessToken: 'ya29.secret',
      refreshToken: '1//secret',
      expiresAt: Date.now() + 3_600_000,
    };
    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    // Story 6.7: `connected` legado mantém-se true; fallback de scopes ausente
    // → calendar-só, gmail false.
    expect(json).toEqual({
      connected: true,
      calendarConnected: true,
      gmailConnected: false,
    });
    // Nenhum token na resposta.
    expect(JSON.stringify(json)).not.toContain('ya29');
    expect(JSON.stringify(json)).not.toContain('secret');
  });

  it('tokens ausentes → tudo false', async () => {
    tokensResult = null;
    const res = await call();
    const json = await res.json();
    expect(json).toEqual({
      connected: false,
      calendarConnected: false,
      gmailConnected: false,
    });
  });

  it('falha de KV → tudo false (fail-safe)', async () => {
    tokensThrows = true;
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      connected: false,
      calendarConnected: false,
      gmailConnected: false,
    });
  });
});

describe('status — Story 6.7 (AC3, [D-6.7-STATUS]) derivação de scopes', () => {
  it('scopes calendar-só → calendarConnected:true, gmailConnected:false (utilizador fez 6.1 mas não 6.7)', async () => {
    tokensResult = {
      accessToken: 'ya29.cal',
      refreshToken: '1//cal',
      expiresAt: Date.now() + 3_600_000,
      scopes: 'https://www.googleapis.com/auth/calendar',
    };
    const json = await (await call()).json();
    expect(json).toEqual({
      connected: true,
      calendarConnected: true,
      gmailConnected: false,
    });
  });

  it('scopes combinado calendar+gmail → ambos true', async () => {
    tokensResult = {
      accessToken: 'ya29.both',
      refreshToken: '1//both',
      expiresAt: Date.now() + 3_600_000,
      scopes:
        'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify',
    };
    const json = await (await call()).json();
    expect(json).toEqual({
      connected: true,
      calendarConnected: true,
      gmailConnected: true,
    });
  });
});
