import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { server } from '../../../mocks/server';
import {
  ALREADY_REVOKED_TOKEN,
  REVOKE_SERVER_ERROR_TOKEN,
} from '../../../mocks/handlers/google';

/**
 * Story 6.2 — route de revogação `POST /api/google/oauth/revoke`
 * (T4, AC3/AC6/AC7, [D-6.2-REVOKE]/[D-6.2-REVOKE-PARTIAL]).
 *
 * Estratégia: a revogação Google é REAL (`revokeToken` → MSW `/revoke`). A sessão
 * e o store (`getTokens`/`deleteTokens`) são mockados para controlar cada cenário:
 *   - sem sessão → 401 (AC6);
 *   - KV ausente → 200 idempotente (já desligado, sem crash; eixo b);
 *   - revogação 200 OK → deleteTokens chamado → 200 { revoked: true };
 *   - revogação 400 (token já inválido) → idempotente → deleteTokens → 200;
 *   - revogação 5xx → 502, deleteTokens NÃO chamado (KV preservado; eixo c).
 */

vi.mock('@/lib/shared/env', () => ({
  getServerEnv: () => ({
    GOOGLE_OAUTH_CLIENT_ID: 'mock-client-id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'mock-client-secret',
  }),
}));

let mockSessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({
    valid: mockSessionValid,
    sessionId: mockSessionValid ? 'sess' : undefined,
    userId: mockSessionValid ? ('eurico' as const) : undefined,
  })),
}));

let tokensResult: { accessToken: string; refreshToken: string; expiresAt: number } | null = null;
let tokensThrows = false;
vi.mock('@/lib/google/token-store', () => ({
  getTokens: vi.fn(async () => {
    if (tokensThrows) throw new Error('kv down');
    return tokensResult;
  }),
  deleteTokens: vi.fn(async () => undefined),
}));

import { getTokens, deleteTokens } from '@/lib/google/token-store';

const deleteMock = deleteTokens as unknown as ReturnType<typeof vi.fn>;
const getMock = getTokens as unknown as ReturnType<typeof vi.fn>;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

async function call(withCookie = true): Promise<Response> {
  const { POST } = await import('@/app/api/google/oauth/revoke/route');
  const headers = new Headers();
  if (withCookie) headers.set('Cookie', 'nexus_session=sess');
  return POST(new Request('http://localhost:3001/api/google/oauth/revoke', { method: 'POST', headers }));
}

function tokenRecord(refreshToken: string) {
  return { accessToken: 'ya29.access', refreshToken, expiresAt: Date.now() + 3_600_000 };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionValid = true;
  tokensResult = tokenRecord('1//refresh-valido');
  tokensThrows = false;
});

describe('revoke — auth (AC6)', () => {
  it('sem sessão → 401, sem tocar no store', async () => {
    mockSessionValid = false;
    const res = await call(false);
    expect(res.status).toBe(401);
    expect(getMock).not.toHaveBeenCalled();
    expect(deleteMock).not.toHaveBeenCalled();
  });
});

describe('revoke — KV ausente (idempotente, eixo b)', () => {
  it('sem tokens em KV → 200 idempotente (já desligado), sem deleteTokens', async () => {
    tokensResult = null;
    const res = await call();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.revoked).toBe(true);
    expect(json.alreadyDisconnected).toBe(true);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('falha de leitura de KV → 502', async () => {
    tokensThrows = true;
    const res = await call();
    expect(res.status).toBe(502);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});

describe('revoke — sucesso e idempotência (AC3, [D-6.2-REVOKE-PARTIAL])', () => {
  it('revogação 200 OK → deleteTokens + 200 { revoked: true }', async () => {
    tokensResult = tokenRecord('1//refresh-valido');
    const res = await call();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revoked: true });
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });

  it('revogação 400 (token já inválido) → idempotente → deleteTokens + 200', async () => {
    tokensResult = tokenRecord(ALREADY_REVOKED_TOKEN);
    const res = await call();
    expect(res.status).toBe(200);
    expect((await res.json()).revoked).toBe(true);
    // 400 do Google é idempotente: o KV é apagado na mesma.
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });
});

describe('revoke — Google indisponível (eixo c, KV preservado)', () => {
  it('revogação 5xx → 502 e deleteTokens NÃO é chamado (preserva coerência)', async () => {
    tokensResult = tokenRecord(REVOKE_SERVER_ERROR_TOKEN);
    const res = await call();
    expect(res.status).toBe(502);
    // KV preservado: não apagar quando não sabemos o estado no Google.
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('a resposta de erro NÃO contém o refreshToken (AC6)', async () => {
    tokensResult = tokenRecord(REVOKE_SERVER_ERROR_TOKEN);
    const res = await call();
    const text = await res.text();
    expect(text).not.toContain(REVOKE_SERVER_ERROR_TOKEN);
  });
});
