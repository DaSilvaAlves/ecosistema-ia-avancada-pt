import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Story 6.1 — testes da route de início OAuth `GET /api/google/oauth/start`
 * (T2, AC1/AC6).
 *
 * Cobre:
 *   - sem sessão → 401 (AC6 — só o Eurico autenticado inicia o fluxo)
 *   - com sessão → 302 para o consent screen Google, com o state assinado no URL (AC1)
 *   - falha ao gerar state → redirect ?error=start_failed (D-6.1-ERROR, eixo c)
 *
 * `getSession`, `createSignedState` e `generateAuthUrl` são mockados para isolar a
 * lógica da route do `googleapis`/KV reais.
 */

let mockSessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({
    valid: mockSessionValid,
    sessionId: mockSessionValid ? 'sess' : undefined,
    userId: mockSessionValid ? ('eurico' as const) : undefined,
  })),
}));

let mockStateThrows = false;
vi.mock('@/lib/google/oauth-state', () => ({
  createSignedState: vi.fn(async () => {
    if (mockStateThrows) throw new Error('kv down');
    return 'nonce.signature';
  }),
}));

vi.mock('@/lib/google/oauth', () => ({
  generateAuthUrl: vi.fn(
    (state: string) =>
      `https://accounts.google.com/o/oauth2/v2/auth?state=${state}&scope=calendar`,
  ),
}));

import { generateAuthUrl } from '@/lib/google/oauth';

const genMock = generateAuthUrl as unknown as ReturnType<typeof vi.fn>;

async function call(withCookie = true): Promise<Response> {
  const { GET } = await import('@/app/api/google/oauth/start/route');
  const headers = new Headers();
  if (withCookie) headers.set('Cookie', 'nexus_session=sess');
  return GET(new Request('http://localhost:3001/api/google/oauth/start', { headers }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionValid = true;
  mockStateThrows = false;
});

describe('start — auth (AC6)', () => {
  it('sem sessão → 401, sem gerar URL', async () => {
    mockSessionValid = false;
    const res = await call(false);
    expect(res.status).toBe(401);
    expect(genMock).not.toHaveBeenCalled();
  });
});

describe('start — fluxo (AC1)', () => {
  it('com sessão → 302 para o consent Google com state no URL', async () => {
    const res = await call();
    expect(res.status).toBe(302);
    const loc = res.headers.get('Location') ?? '';
    expect(loc).toContain('accounts.google.com');
    expect(loc).toContain('state=nonce.signature');
    expect(genMock).toHaveBeenCalledWith('nonce.signature');
  });
});

describe('start — falha (eixo c)', () => {
  it('falha ao gerar/armazenar state → redirect ?error=start_failed', async () => {
    mockStateThrows = true;
    const res = await call();
    expect(res.status).toBe(302);
    expect(res.headers.get('Location') ?? '').toContain('error=start_failed');
  });
});
