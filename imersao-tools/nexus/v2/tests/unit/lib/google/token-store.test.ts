import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Story 6.1 + 6.2 — testes do seam `lib/google/token-store.ts`.
 *
 * 6.1 (T3, AC3, [D-6.1-SCOPE]): contrato da interface (chave singleton).
 * 6.2 (T1, AC1/AC6/AC7): encriptação at-rest AES-256-GCM. Valida:
 *   - round-trip: saveTokens → KV ENCRIPTADO → getTokens = original;
 *   - o `refreshToken`/`accessToken` NUNCA aparecem em texto limpo no KV;
 *   - desencriptação falha (chave/ciphertext corrompido) → `null` (não crash);
 *   - registo legado (sem forma encriptada) → `null`.
 *
 * Usa um fake KV em memória (padrão `subscriptions-store.test.ts`) para inspeccionar
 * o que é REALMENTE persistido. `SESSION_SECRET` é injectado via mock de `env.ts`
 * (HKDF deriva a chave dele).
 */

// Fake KV em memória — guarda o valor REAL gravado para inspecção.
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
  accessToken: 'ya29.token-secreto',
  refreshToken: '1//refresh-secreto',
  expiresAt: 1717200000000,
};

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
});

describe('GOOGLE_TOKENS_KEY', () => {
  it('é a chave singleton do schema arch §6', () => {
    expect(GOOGLE_TOKENS_KEY).toBe('nexus:google:tokens');
  });
});

describe('saveTokens + getTokens — round-trip de encriptação (AC1)', () => {
  it('round-trip: getTokens devolve exactamente o registo original', async () => {
    await saveTokens(SAMPLE);
    expect(kvMock.set).toHaveBeenCalledWith(GOOGLE_TOKENS_KEY, expect.any(Object));
    const got = await getTokens();
    expect(got).toEqual(SAMPLE);
  });

  it('o registo persistido em KV NÃO contém os tokens em texto limpo (AC6)', async () => {
    await saveTokens(SAMPLE);
    const persisted = store.get(GOOGLE_TOKENS_KEY);
    const serialized = JSON.stringify(persisted);
    // Os tokens em claro nunca aparecem no que é gravado.
    expect(serialized).not.toContain('ya29.token-secreto');
    expect(serialized).not.toContain('1//refresh-secreto');
    // expiresAt fica em claro (não-sensível, necessário para a decisão de refresh).
    expect(serialized).toContain('1717200000000');
  });

  it('o registo persistido tem a forma de envelope encriptado (iv + tag + ct)', async () => {
    await saveTokens(SAMPLE);
    const persisted = store.get(GOOGLE_TOKENS_KEY) as Record<string, Record<string, unknown>>;
    for (const field of ['accessToken', 'refreshToken'] as const) {
      expect(typeof persisted[field].iv).toBe('string');
      expect(typeof persisted[field].tag).toBe('string');
      expect(typeof persisted[field].ct).toBe('string');
    }
  });

  it('IV único por escrita: dois saves do mesmo registo produzem ciphertext distinto', async () => {
    await saveTokens(SAMPLE);
    const first = JSON.stringify(store.get(GOOGLE_TOKENS_KEY));
    await saveTokens(SAMPLE);
    const second = JSON.stringify(store.get(GOOGLE_TOKENS_KEY));
    // IV aleatório por escrita → ciphertext difere mesmo com input igual.
    expect(first).not.toEqual(second);
    // Mas a desencriptação devolve o mesmo plaintext.
    expect(await getTokens()).toEqual(SAMPLE);
  });
});

describe('getTokens — caminhos de falha (AC6, eixo c)', () => {
  it('ausente → null (estado não-existente)', async () => {
    expect(await getTokens()).toBeNull();
  });

  it('ciphertext corrompido → null (não crash; authTag GCM detecta)', async () => {
    await saveTokens(SAMPLE);
    const persisted = store.get(GOOGLE_TOKENS_KEY) as Record<string, Record<string, string>>;
    // Corrompe o ciphertext do refreshToken — a verificação GCM vai falhar.
    persisted.refreshToken.ct = Buffer.from('lixo-corrompido').toString('base64');
    store.set(GOOGLE_TOKENS_KEY, persisted);
    expect(await getTokens()).toBeNull();
  });

  it('authTag inválido → null (não crash)', async () => {
    await saveTokens(SAMPLE);
    const persisted = store.get(GOOGLE_TOKENS_KEY) as Record<string, Record<string, string>>;
    persisted.accessToken.tag = Buffer.from('0123456789abcdef').toString('base64');
    store.set(GOOGLE_TOKENS_KEY, persisted);
    expect(await getTokens()).toBeNull();
  });

  it('registo legado sem forma encriptada (texto limpo da 6.1) → null', async () => {
    // Simula um registo gravado pela 6.1 (sem encriptação).
    store.set(GOOGLE_TOKENS_KEY, SAMPLE);
    expect(await getTokens()).toBeNull();
  });
});

describe('deleteTokens', () => {
  it('apaga a chave singleton', async () => {
    await saveTokens(SAMPLE);
    await deleteTokens();
    expect(kvMock.del).toHaveBeenCalledWith(GOOGLE_TOKENS_KEY);
    expect(await getTokens()).toBeNull();
  });
});

describe('Story 6.7 — campo scopes aditivo (C2/C3)', () => {
  const COMBINED: GoogleTokenRecord = {
    accessToken: 'ya29.combined',
    refreshToken: '1//combined-refresh',
    expiresAt: 1717200000000,
    scopes:
      'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify',
  };

  it('round-trip preserva o campo scopes quando presente', async () => {
    await saveTokens(COMBINED);
    expect(await getTokens()).toEqual(COMBINED);
  });

  it('scopes é persistido EM CLARO (não-sensível, como expiresAt)', async () => {
    await saveTokens(COMBINED);
    const serialized = JSON.stringify(store.get(GOOGLE_TOKENS_KEY));
    expect(serialized).toContain('gmail.modify');
    // Os tokens continuam encriptados (não em claro).
    expect(serialized).not.toContain('ya29.combined');
    expect(serialized).not.toContain('1//combined-refresh');
  });

  it('registo 6.1 SEM scopes continua a ler-se (fallback retro-compatível)', async () => {
    // SAMPLE não tem `scopes` — simula um registo 6.1 encriptado pela 6.2.
    await saveTokens(SAMPLE);
    const got = await getTokens();
    expect(got).toEqual(SAMPLE);
    expect(got?.scopes).toBeUndefined();
  });

  it('(C3) sobrescrever calendar-só por token combinado → refreshToken NÃO-VAZIO + scopes Gmail', async () => {
    // Estado inicial: registo calendar-só da 6.1.
    await saveTokens(SAMPLE);
    // OAuth incremental Gmail SOBRESCREVE com o token combinado (novo refresh).
    await saveTokens(COMBINED);
    const got = await getTokens();
    // Invariante C3: refreshToken não-vazio (o novo combinado), NÃO igual ao da 6.1.
    expect(got?.refreshToken).toBe('1//combined-refresh');
    expect(got?.refreshToken).not.toBe(SAMPLE.refreshToken);
    expect((got?.refreshToken ?? '').length).toBeGreaterThan(0);
    expect(got?.scopes).toContain('gmail.modify');
  });

  it('registo persistido com scopes de tipo errado → getTokens null (defesa anti-corrupção)', async () => {
    await saveTokens(COMBINED);
    const persisted = store.get(GOOGLE_TOKENS_KEY) as Record<string, unknown>;
    persisted.scopes = 12345; // tipo errado
    store.set(GOOGLE_TOKENS_KEY, persisted);
    expect(await getTokens()).toBeNull();
  });
});
