import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { INVALID_GRANT_CODE } from '../../../mocks/handlers/google';

/**
 * Story 6.1 — testes do wrapper OAuth2 `lib/google/oauth.ts` (T1, AC1/AC7).
 *
 * Fidelidade de protocolo (`mock-protocol-fidelity.md`): a troca de code é feita
 * contra o MSW handler que reflecte o wire format REAL do Google
 * (`{ access_token, refresh_token, expires_in, ... }` snake_case). ≥1 teste falha
 * se o shape divergir — o teste de override snake→camel prova-o (cenário "fidelidade").
 *
 * Cobre:
 *   - generateAuthUrl: scope calendar + access_type offline + state (AC1)
 *   - exchangeCode: shape real → GoogleTokens normalizado (AC2/AC7)
 *   - exchangeCode: invalid_grant → TokenExchangeError (eixo c)
 *   - exchangeCode: resposta sem access_token → TokenExchangeError (eixo b/AC3)
 *   - fidelidade: resposta com camelCase → TokenExchangeError (mock-protocol-fidelity)
 *   - revokeToken: stub lança (6.2)
 */

vi.mock('@/lib/shared/env', () => ({
  getServerEnv: () => ({
    GOOGLE_OAUTH_CLIENT_ID: 'mock-client-id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'mock-client-secret',
    GOOGLE_OAUTH_REDIRECT_URI: 'https://nexus-eurico.vercel.app/api/google/oauth/callback',
  }),
}));

import {
  exchangeCode,
  generateAuthUrl,
  revokeToken,
  TokenExchangeError,
  GOOGLE_CALENDAR_SCOPE,
} from '@/lib/google/oauth';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('generateAuthUrl', () => {
  it('inclui scope calendar, access_type offline e o state (AC1)', () => {
    const url = generateAuthUrl('state-abc');
    expect(url).toContain('accounts.google.com');
    expect(decodeURIComponent(url)).toContain(GOOGLE_CALENDAR_SCOPE);
    expect(url).toContain('access_type=offline');
    expect(url).toContain('state=state-abc');
    // prompt=consent garante o refresh token em re-autorização.
    expect(url).toContain('prompt=consent');
  });
});

describe('exchangeCode — caminho feliz (shape real Google)', () => {
  it('troca o code e normaliza para GoogleTokens (camelCase) (AC2/AC7)', async () => {
    const tokens = await exchangeCode('valid-code');

    expect(tokens.accessToken).toBe('ya29.mock-access-token');
    expect(tokens.refreshToken).toBe('1//mock-refresh-token');
    // expiry_date é derivado pelo googleapis a partir de expires_in → epoch ms futuro.
    expect(typeof tokens.expiresAt).toBe('number');
    expect(tokens.expiresAt).toBeGreaterThan(Date.now());
  });
});

describe('exchangeCode — caminhos de falha (eixo b/c)', () => {
  it('(c) invalid_grant do Google → TokenExchangeError', async () => {
    await expect(exchangeCode(INVALID_GRANT_CODE)).rejects.toBeInstanceOf(
      TokenExchangeError,
    );
  });

  it('(b/AC3) resposta sem access_token → TokenExchangeError (nunca tokens parciais)', async () => {
    server.use(
      http.post('https://oauth2.googleapis.com/token', () =>
        HttpResponse.json({
          refresh_token: '1//mock-refresh-token',
          expires_in: 3599,
          token_type: 'Bearer',
        }),
      ),
    );
    await expect(exchangeCode('no-access')).rejects.toBeInstanceOf(TokenExchangeError);
  });

  it('(b/AC3) resposta sem refresh_token → TokenExchangeError', async () => {
    server.use(
      http.post('https://oauth2.googleapis.com/token', () =>
        HttpResponse.json({
          access_token: 'ya29.mock-access-token',
          expires_in: 3599,
          token_type: 'Bearer',
        }),
      ),
    );
    await expect(exchangeCode('no-refresh')).rejects.toBeInstanceOf(TokenExchangeError);
  });
});

describe('exchangeCode — FIDELIDADE de protocolo (mock-protocol-fidelity.md)', () => {
  it('falha se a resposta usar camelCase em vez do snake_case real do wire', async () => {
    // Se o wire format divergir (accessToken em vez de access_token), o googleapis
    // não extrai o token → exchangeCode lança. Este teste é o "≥1 teste falha se o
    // shape divergir" exigido por AC5/AC7.
    server.use(
      http.post('https://oauth2.googleapis.com/token', () =>
        HttpResponse.json({
          accessToken: 'ya29.wrong-shape',
          refreshToken: '1//wrong-shape',
          expiryDate: Date.now() + 3_600_000,
        }),
      ),
    );
    await expect(exchangeCode('camel-case')).rejects.toBeInstanceOf(TokenExchangeError);
  });
});

describe('revokeToken — stub 6.2', () => {
  it('lança (implementação completa na 6.2)', async () => {
    await expect(revokeToken('any')).rejects.toThrow();
  });
});
