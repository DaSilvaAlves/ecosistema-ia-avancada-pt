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
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import {
  INVALID_GRANT_CODE,
  GMAIL_INCREMENTAL_CODE,
  GMAIL_INCREMENTAL_REFRESH_TOKEN,
  GMAIL_PARTIAL_GRANT_CODE,
} from '../../../mocks/handlers/google';

/**
 * Story 6.1 — testes de integração do callback OAuth `GET /api/google/oauth/callback`
 * (T3, AC2/AC3/AC6 + 3 eixos do ciclo de vida).
 *
 * Estratégia: a troca de code é REAL (`exchangeCode` → MSW handler com shape Google
 * real). O state (`verifyAndConsumeState`) e o store (`saveTokens`) são mockados
 * para controlar cada cenário do ciclo de vida sem KV real:
 *   - code válido + state válido → grava tokens (eixo a: não-existente→válido), redirect ?connected=calendar
 *   - state inválido/ausente → 403, sem troca (AC6, eixo a/c)
 *   - access_denied do Google → redirect ?error=access_denied (eixo c)
 *   - invalid_grant na troca → redirect ?error=token_exchange_failed (eixo b/c)
 *   - falha de KV ao gravar → redirect ?error=storage_failed (eixo c)
 *
 * `mock-protocol-fidelity.md`: o handler MSW reflecte o wire real; saveTokens
 * recebe accessToken/refreshToken extraídos do snake_case real.
 */

vi.mock('@/lib/shared/env', () => ({
  getServerEnv: () => ({
    GOOGLE_OAUTH_CLIENT_ID: 'mock-client-id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'mock-client-secret',
    GOOGLE_OAUTH_REDIRECT_URI: 'https://nexus-eurico.vercel.app/api/google/oauth/callback',
  }),
}));

let mockStateValid = true;
vi.mock('@/lib/google/oauth-state', () => ({
  verifyAndConsumeState: vi.fn(async () => mockStateValid),
}));

vi.mock('@/lib/google/token-store', () => ({
  saveTokens: vi.fn(async () => undefined),
}));

import { verifyAndConsumeState } from '@/lib/google/oauth-state';
import { saveTokens } from '@/lib/google/token-store';

const verifyMock = verifyAndConsumeState as unknown as ReturnType<typeof vi.fn>;
const saveMock = saveTokens as unknown as ReturnType<typeof vi.fn>;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  vi.clearAllMocks();
  mockStateValid = true;
  verifyMock.mockImplementation(async () => mockStateValid);
  saveMock.mockResolvedValue(undefined);
});

async function call(query: Record<string, string>): Promise<Response> {
  const { GET } = await import('@/app/api/google/oauth/callback/route');
  const url = new URL('http://localhost:3001/api/google/oauth/callback');
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  return GET(new Request(url));
}

function locationOf(res: Response): string {
  return res.headers.get('Location') ?? '';
}

describe('callback — caminho feliz (AC2/AC3, eixo a)', () => {
  it('code+state válidos → grava tokens e redirige ?connected=calendar', async () => {
    const res = await call({ code: 'valid-code', state: 'good.state' });

    expect(res.status).toBe(302);
    expect(locationOf(res)).toContain('/settings?connected=calendar');

    // Tokens extraídos do shape REAL (snake_case) e gravados via seam token-store.
    expect(saveMock).toHaveBeenCalledTimes(1);
    const saved = saveMock.mock.calls[0][0];
    expect(saved.accessToken).toBe('ya29.mock-access-token');
    expect(saved.refreshToken).toBe('1//mock-refresh-token');
    expect(typeof saved.expiresAt).toBe('number');
  });

  it('consome o state ANTES de gravar (single-use, eixo b)', async () => {
    await call({ code: 'valid-code', state: 'good.state' });
    expect(verifyMock).toHaveBeenCalledWith('good.state');
  });
});

describe('callback — Story 6.7 sinal de sucesso por scope (C5, AC2, eixo b/c)', () => {
  it('fluxo incremental Gmail → grava scopes combinado + redirige ?connected=gmail', async () => {
    const res = await call({ code: GMAIL_INCREMENTAL_CODE, state: 'good.state' });

    expect(res.status).toBe(302);
    // C5 — sinal derivado do scope concedido (gmail.modify presente).
    expect(locationOf(res)).toContain('/settings?connected=gmail');

    // C3 — o registo gravado tem o refreshToken NOVO combinado (não-vazio) e os
    // scopes incluem gmail.modify (sobrescreve, não preserva o antigo).
    expect(saveMock).toHaveBeenCalledTimes(1);
    const saved = saveMock.mock.calls[0][0];
    expect(saved.refreshToken).toBe(GMAIL_INCREMENTAL_REFRESH_TOKEN);
    expect(saved.refreshToken.length).toBeGreaterThan(0);
    expect(saved.scopes).toContain('gmail.modify');
  });

  it('scope parcialmente concedido (só calendar no consent Gmail) → ?connected=calendar, gmail não marcado (eixo c)', async () => {
    const res = await call({ code: GMAIL_PARTIAL_GRANT_CODE, state: 'good.state' });

    expect(res.status).toBe(302);
    // O scope concedido NÃO inclui gmail.modify → honesto: connected=calendar.
    expect(locationOf(res)).toContain('/settings?connected=calendar');
    const saved = saveMock.mock.calls[0][0];
    expect(saved.scopes).not.toContain('gmail.modify');
  });
});

describe('callback — AC6 (state inválido → 302 UI de erro, sem troca)', () => {
  it('state inválido → 302 para ?error=invalid_state e NÃO grava tokens', async () => {
    mockStateValid = false;
    const res = await call({ code: 'valid-code', state: 'bad.state' });

    // AC6 reconciliado (Architect Gate de saída, [D-6.1-ERROR]): redirect 302 para a
    // UI de erro — o header Location de um 403 não é seguido pelos browsers (RFC 9110).
    expect(res.status).toBe(302);
    expect(locationOf(res)).toContain('/settings?error=invalid_state');
    // Prova anti-tautológica de CSRF: state inválido → o code NUNCA é trocado/gravado.
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('state ausente → 302 para a UI de erro (não tratado como sucesso, eixo a/c)', async () => {
    mockStateValid = false;
    const res = await call({ code: 'valid-code' });
    expect(res.status).toBe(302);
    expect(locationOf(res)).toContain('/settings?error=invalid_state');
    expect(saveMock).not.toHaveBeenCalled();
  });
});

describe('callback — caminhos de falha (eixo c)', () => {
  it('access_denied do Google → redirect ?error=access_denied, sem validar state nem trocar', async () => {
    const res = await call({ error: 'access_denied', state: 'good.state' });

    expect(res.status).toBe(302);
    expect(locationOf(res)).toContain('error=access_denied');
    // Short-circuit: NÃO consome o state válido (senão um retry falharia com
    // invalid_state) nem troca o code.
    expect(verifyMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('(Story 6.7, C4) access_denied no consent Gmail → NÃO chama saveTokens (token Calendar preservado)', async () => {
    // Cenário: utilizador cancela o consent Gmail. O token Calendar existente em KV
    // NÃO pode ser destruído — o callback NUNCA chega ao saveTokens (eixo c).
    const res = await call({ error: 'access_denied', state: 'good.state' });
    expect(locationOf(res)).toContain('error=access_denied');
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('invalid_grant na troca → redirect ?error=token_exchange_failed (eixo b)', async () => {
    const res = await call({ code: INVALID_GRANT_CODE, state: 'good.state' });

    expect(res.status).toBe(302);
    expect(locationOf(res)).toContain('error=token_exchange_failed');
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('falha de KV ao gravar → redirect ?error=storage_failed (eixo c)', async () => {
    saveMock.mockRejectedValueOnce(new Error('kv down'));
    const res = await call({ code: 'valid-code', state: 'good.state' });

    expect(res.status).toBe(302);
    expect(locationOf(res)).toContain('error=storage_failed');
  });
});

describe('callback — tokens nunca na query nem em sucesso exposto (AC6)', () => {
  it('o redirect de sucesso não contém tokens', async () => {
    const res = await call({ code: 'valid-code', state: 'good.state' });
    const loc = locationOf(res);
    expect(loc).not.toContain('ya29');
    expect(loc).not.toContain('mock-refresh-token');
  });
});
