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
import {
  INVALID_GRANT_CODE,
  ALREADY_REVOKED_TOKEN,
  REVOKE_SERVER_ERROR_TOKEN,
  GMAIL_INCREMENTAL_CODE,
  GMAIL_INCREMENTAL_REFRESH_TOKEN,
} from '../../../mocks/handlers/google';

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
 *
 * Story 6.2 (T3, AC3, [D-6.2-REVOKE]/[D-6.2-REVOKE-PARTIAL]):
 *   - revokeToken: 200 OK → resolve (sucesso)
 *   - revokeToken: 400 (token já inválido) → resolve (idempotente)
 *   - revokeToken: 5xx → TokenRevokeError (transporte/indisponibilidade)
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
  generateGmailAuthUrl,
  revokeToken,
  TokenExchangeError,
  TokenRevokeError,
  GOOGLE_CALENDAR_SCOPE,
  GMAIL_MODIFY_SCOPE,
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

describe('generateGmailAuthUrl — OAuth incremental (Story 6.7, C1, AC1)', () => {
  it('inclui include_granted_scopes=true, scope gmail.modify, prompt=consent e access_type offline', () => {
    const url = generateGmailAuthUrl('state-gmail');
    const decoded = decodeURIComponent(url);
    expect(url).toContain('accounts.google.com');
    // C1 — teste falsificável: se `include_granted_scopes` faltar no URL, FALHA.
    expect(url).toContain('include_granted_scopes=true');
    expect(decoded).toContain(GMAIL_MODIFY_SCOPE);
    expect(url).toContain('access_type=offline');
    // prompt=consent garante o NOVO refresh_token combinado (C3).
    expect(url).toContain('prompt=consent');
    expect(url).toContain('state=state-gmail');
  });

  it('NÃO altera generateAuthUrl (Calendar-only continua sem include_granted_scopes)', () => {
    // Prova de não-regressão: o caminho Calendar da 6.1 não ganha o parâmetro
    // incremental nem o scope Gmail (assinatura/comportamento intocados).
    const calendarUrl = generateAuthUrl('state-cal');
    expect(calendarUrl).not.toContain('include_granted_scopes');
    expect(decodeURIComponent(calendarUrl)).not.toContain(GMAIL_MODIFY_SCOPE);
    expect(decodeURIComponent(calendarUrl)).toContain(GOOGLE_CALENDAR_SCOPE);
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
    // Story 6.7 (C5): o `scope` da resposta é exposto (calendar-só na troca 6.1).
    expect(tokens.scope).toBe(GOOGLE_CALENDAR_SCOPE);
  });

  it('(Story 6.7, C3/C5) troca incremental Gmail → scope combinado + refresh NOVO não-vazio', async () => {
    const tokens = await exchangeCode(GMAIL_INCREMENTAL_CODE);

    // C3 — o invariante é refreshToken NÃO-VAZIO (novo combinado), NÃO "igual ao da 6.1".
    expect(tokens.refreshToken).toBe(GMAIL_INCREMENTAL_REFRESH_TOKEN);
    expect(tokens.refreshToken.length).toBeGreaterThan(0);
    // C5/AC7 — fidelidade falsificável: o scope combinado inclui gmail.modify.
    expect(tokens.scope).toContain('gmail.modify');
    expect(tokens.scope).toContain('calendar');
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

describe('revokeToken — implementação 6.2 ([D-6.2-REVOKE]/[D-6.2-REVOKE-PARTIAL])', () => {
  it('200 OK → resolve (revogação bem-sucedida)', async () => {
    await expect(revokeToken('1//refresh-valido')).resolves.toBeUndefined();
  });

  it('400 (token já inválido/revogado) → resolve idempotente (não lança)', async () => {
    // [D-6.2-REVOKE-PARTIAL]: 400 = o token já não vale → sucesso do ponto de
    // vista do utilizador. A route prossegue para apagar o KV.
    await expect(revokeToken(ALREADY_REVOKED_TOKEN)).resolves.toBeUndefined();
  });

  it('5xx (Google indisponível) → TokenRevokeError (transporte, KV preservado)', async () => {
    await expect(revokeToken(REVOKE_SERVER_ERROR_TOKEN)).rejects.toBeInstanceOf(
      TokenRevokeError,
    );
  });

  it('falha de rede (fetch lança) → TokenRevokeError', async () => {
    server.use(
      http.post('https://oauth2.googleapis.com/revoke', () => {
        throw new Error('network down');
      }),
    );
    await expect(revokeToken('1//qualquer')).rejects.toBeInstanceOf(TokenRevokeError);
  });
});
