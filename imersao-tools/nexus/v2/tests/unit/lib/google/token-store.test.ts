import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Story 6.1 — testes do seam `lib/google/token-store.ts` (T3, AC3, [D-6.1-SCOPE]).
 *
 * Valida o contrato da interface que a 6.2 reimplementa por dentro (encriptação)
 * sem mudar a assinatura: chave singleton correcta + argumentos. Mock de
 * `@vercel/kv` (padrão `subscriptions-store.test.ts`).
 */

vi.mock('@vercel/kv', () => ({
  kv: { set: vi.fn(), get: vi.fn(), del: vi.fn() },
}));

import {
  saveTokens,
  getTokens,
  deleteTokens,
  GOOGLE_TOKENS_KEY,
  type GoogleTokenRecord,
} from '@/lib/google/token-store';
import { kv } from '@vercel/kv';

const kvMock = kv as unknown as {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

const SAMPLE: GoogleTokenRecord = {
  accessToken: 'ya29.token',
  refreshToken: '1//refresh',
  expiresAt: 1717200000000,
};

beforeEach(() => vi.clearAllMocks());

describe('GOOGLE_TOKENS_KEY', () => {
  it('é a chave singleton do schema arch §6', () => {
    expect(GOOGLE_TOKENS_KEY).toBe('nexus:google:tokens');
  });
});

describe('saveTokens', () => {
  it('grava o registo na chave singleton', async () => {
    await saveTokens(SAMPLE);
    expect(kvMock.set).toHaveBeenCalledWith(GOOGLE_TOKENS_KEY, SAMPLE);
  });
});

describe('getTokens', () => {
  it('devolve o registo quando presente', async () => {
    kvMock.get.mockResolvedValueOnce(SAMPLE);
    expect(await getTokens()).toEqual(SAMPLE);
    expect(kvMock.get).toHaveBeenCalledWith(GOOGLE_TOKENS_KEY);
  });

  it('devolve null quando ausente (estado não-existente)', async () => {
    kvMock.get.mockResolvedValueOnce(null);
    expect(await getTokens()).toBeNull();
  });
});

describe('deleteTokens', () => {
  it('apaga a chave singleton', async () => {
    await deleteTokens();
    expect(kvMock.del).toHaveBeenCalledWith(GOOGLE_TOKENS_KEY);
  });
});
