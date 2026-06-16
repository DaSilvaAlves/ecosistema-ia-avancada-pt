import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Story 6.1 — testes da route de estado `GET /api/google/oauth/status` (T4, AC4/AC6).
 *
 * Cobre:
 *   - sem sessão → 401 (AC6)
 *   - tokens presentes → { connected: true } (NUNCA devolve os tokens)
 *   - tokens ausentes → { connected: false }
 *   - falha de KV → { connected: false } (fail-safe, nunca afirma ligado sem prova)
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
  it('tokens presentes → connected:true, sem expor os tokens', async () => {
    tokensResult = {
      accessToken: 'ya29.secret',
      refreshToken: '1//secret',
      expiresAt: Date.now() + 3_600_000,
    };
    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ connected: true });
    // Nenhum token na resposta.
    expect(JSON.stringify(json)).not.toContain('ya29');
    expect(JSON.stringify(json)).not.toContain('secret');
  });

  it('tokens ausentes → connected:false', async () => {
    tokensResult = null;
    const res = await call();
    const json = await res.json();
    expect(json).toEqual({ connected: false });
  });

  it('falha de KV → connected:false (fail-safe)', async () => {
    tokensThrows = true;
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ connected: false });
  });
});
