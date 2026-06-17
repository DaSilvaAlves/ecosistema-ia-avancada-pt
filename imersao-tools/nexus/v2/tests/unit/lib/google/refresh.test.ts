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
import { INVALID_GRANT_REFRESH_TOKEN } from '../../../mocks/handlers/google';

/**
 * Story 6.2 — refresh flow (`getValidAccessToken`) (T2, AC2/AC7, [D-6.2-REFRESH]).
 *
 * Estratégia: KV em memória (real `saveTokens`/`getTokens` com encriptação real) +
 * MSW handler de refresh real (protocolo Google snake_case, SEM `refresh_token` na
 * resposta). Cobre o ciclo de vida:
 *   - token válido (fora da janela 5 min) → devolve directo, sem chamar Google;
 *   - token a-expirar/expirado → refresh automático; accessToken+expiresAt
 *     actualizados em KV mas `refreshToken` PRESERVADO (eixo b);
 *   - `invalid_grant` (revogado externamente) → apaga KV + lança TokenRevokedError;
 *   - Google indisponível (5xx/rede) → lança TokenRefreshError, KV NÃO alterado;
 *   - FALSIFICÁVEL: se a resposta de refresh incluir `refresh_token`, o store NÃO
 *     o sobrescreve (continua o original).
 */

const store = new Map<string, unknown>();
vi.mock('@vercel/kv', () => ({
  kv: {
    set: vi.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    get: vi.fn(async (key: string) => (store.has(key) ? store.get(key) : null)),
    del: vi.fn(async (key: string) => {
      store.delete(key);
    }),
  },
}));

vi.mock('@/lib/shared/env', () => ({
  getServerEnv: () => ({
    SESSION_SECRET: 'test-session-secret-com-mais-de-16-chars',
    GOOGLE_OAUTH_CLIENT_ID: 'mock-client-id',
    GOOGLE_OAUTH_CLIENT_SECRET: 'mock-client-secret',
  }),
}));

import {
  saveTokens,
  getTokens,
  getValidAccessToken,
  GOOGLE_TOKENS_KEY,
  REFRESH_WINDOW_MS,
  TokenRevokedError,
  TokenRefreshError,
  type GoogleTokenRecord,
} from '@/lib/google/token-store';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
});

const ORIGINAL_REFRESH = '1//refresh-original-preservado';

async function seed(record: Partial<GoogleTokenRecord> = {}): Promise<void> {
  await saveTokens({
    accessToken: 'ya29.access-antigo',
    refreshToken: ORIGINAL_REFRESH,
    expiresAt: Date.now() - 1000, // expirado por defeito
    ...record,
  });
}

describe('getValidAccessToken — token ainda válido (AC2)', () => {
  it('fora da janela de 5 min → devolve o accessToken actual, sem chamar Google', async () => {
    // Handler que falha o teste se o refresh for chamado (não devia ser).
    server.use(
      http.post(GOOGLE_TOKEN_ENDPOINT, () => {
        throw new Error('refresh NÃO devia ter sido chamado para token válido');
      }),
    );
    await seed({ accessToken: 'ya29.ainda-valido', expiresAt: Date.now() + REFRESH_WINDOW_MS + 60_000 });
    expect(await getValidAccessToken()).toBe('ya29.ainda-valido');
  });

  it('sem tokens em KV → null (não-ligado)', async () => {
    expect(await getValidAccessToken()).toBeNull();
  });
});

describe('getValidAccessToken — refresh automático (AC2, eixo b)', () => {
  it('token expirado → refresh; devolve o novo accessToken', async () => {
    await seed();
    const token = await getValidAccessToken();
    expect(token).toBe('ya29.refreshed-access-token');
  });

  it('actualiza accessToken+expiresAt em KV mas PRESERVA o refreshToken (eixo b)', async () => {
    await seed();
    await getValidAccessToken();
    const persisted = await getTokens();
    expect(persisted).not.toBeNull();
    expect(persisted!.accessToken).toBe('ya29.refreshed-access-token');
    // refreshToken inalterado — o Google não devolve um novo no refresh.
    expect(persisted!.refreshToken).toBe(ORIGINAL_REFRESH);
    // expiresAt no futuro (renovado).
    expect(persisted!.expiresAt).toBeGreaterThan(Date.now());
  });

  it('token a-expirar dentro da janela de 5 min → também faz refresh', async () => {
    await seed({ expiresAt: Date.now() + REFRESH_WINDOW_MS - 1000 });
    const token = await getValidAccessToken();
    expect(token).toBe('ya29.refreshed-access-token');
  });
});

describe('getValidAccessToken — FALSIFICÁVEL: refreshToken nunca sobrescrito (T6, mock-protocol-fidelity)', () => {
  it('mesmo que a resposta de refresh inclua refresh_token, o store mantém o original', async () => {
    // Handler INCORRECTO (protocolo real não devolve refresh_token) — prova que o
    // código NUNCA o usa: se sobrescrevesse, este teste falharia.
    server.use(
      http.post(GOOGLE_TOKEN_ENDPOINT, () =>
        HttpResponse.json({
          access_token: 'ya29.refreshed-access-token',
          refresh_token: '1//ATACANTE-novo-refresh', // não devia existir
          expires_in: 3599,
          token_type: 'Bearer',
        }),
      ),
    );
    await seed();
    await getValidAccessToken();
    const persisted = await getTokens();
    // O refreshToken guardado continua o ORIGINAL, nunca o da resposta.
    expect(persisted!.refreshToken).toBe(ORIGINAL_REFRESH);
    expect(persisted!.refreshToken).not.toBe('1//ATACANTE-novo-refresh');
  });
});

describe('getValidAccessToken — caminhos de falha (eixo c)', () => {
  it('invalid_grant (revogado externamente) → apaga KV + lança TokenRevokedError', async () => {
    await seed({ refreshToken: INVALID_GRANT_REFRESH_TOKEN });
    await expect(getValidAccessToken()).rejects.toBeInstanceOf(TokenRevokedError);
    // KV apagado automaticamente (o refreshToken nunca mais será válido).
    expect(store.has(GOOGLE_TOKENS_KEY)).toBe(false);
  });

  it('Google indisponível (5xx) → lança TokenRefreshError e NÃO altera o KV', async () => {
    server.use(
      http.post(GOOGLE_TOKEN_ENDPOINT, () =>
        HttpResponse.json({ error: 'internal_failure' }, { status: 503 }),
      ),
    );
    await seed();
    const before = JSON.stringify(store.get(GOOGLE_TOKENS_KEY));
    await expect(getValidAccessToken()).rejects.toBeInstanceOf(TokenRefreshError);
    // KV preservado — foi a rede/Google que falhou, não o token.
    expect(JSON.stringify(store.get(GOOGLE_TOKENS_KEY))).toEqual(before);
    // O refreshToken continua válido em KV.
    expect((await getTokens())!.refreshToken).toBe(ORIGINAL_REFRESH);
  });
});
