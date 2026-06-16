import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Story 6.1 — testes do state OAuth assinado HMAC single-use (T2/T3, AC6).
 *
 * Cobre as condições vinculativas [D-6.1-PKCE]:
 *   - state assinado HMAC-SHA256 com SESSION_SECRET (cond. 1)
 *   - single-use: consumido (kv.del) após validação bem-sucedida (cond. 2)
 *   - nonce aleatório por state (cond. 3)
 *   - assinatura inválida rejeitada (timing-safe; cond. 4)
 *
 * E os 3 eixos do ciclo de vida (`internal-state-contract-gate.md`):
 *   (a) classes: state válido / inválido / ausente / expirado
 *   (b) transição-já-ocorrida: replay de state já consumido → false (não sucesso)
 *   (c) caminhos de falha: state null/malformado → false, nunca throw silencioso
 *
 * Mock de `@vercel/kv` (padrão `subscriptions-store.test.ts`) — fake-KV em memória
 * para cobrir presença/expiração/single-use sem KV real.
 */

// fake-KV em memória: o `set` com `{ex}` ignora o TTL (a expiração é simulada
// removendo a entrada manualmente nos testes de expiração).
const kvStore = new Map<string, unknown>();

vi.mock('@vercel/kv', () => ({
  kv: {
    set: vi.fn(async (key: string, value: unknown) => {
      kvStore.set(key, value);
    }),
    get: vi.fn(async (key: string) => kvStore.get(key) ?? null),
    del: vi.fn(async (key: string) => {
      kvStore.delete(key);
    }),
  },
}));

// SESSION_SECRET fixo via getServerEnv mock (env.ts lê de process.env em test mode,
// mas mockamos o helper para isolar do ambiente).
vi.mock('@/lib/shared/env', () => ({
  getServerEnv: () => ({ SESSION_SECRET: 'test-session-secret-0123456789' }),
}));

import {
  createSignedState,
  verifyAndConsumeState,
  OAUTH_STATE_TTL_SECONDS,
} from '@/lib/google/oauth-state';
import { kv } from '@vercel/kv';

const kvMock = kv as unknown as {
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  del: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  kvStore.clear();
  vi.clearAllMocks();
});

describe('createSignedState', () => {
  it('gera state no formato <nonce>.<hmac> e armazena o nonce em KV com TTL 600s', async () => {
    const state = await createSignedState();

    expect(state).toContain('.');
    const [nonce, sig] = state.split('.');
    expect(nonce).toBeTruthy();
    expect(sig).toMatch(/^[0-9a-f]+$/); // hex

    // O nonce foi armazenado em KV com o TTL ratificado (cond. 1/2).
    expect(kvMock.set).toHaveBeenCalledWith(
      `nexus:google:oauth-state:${state}`,
      nonce,
      { ex: OAUTH_STATE_TTL_SECONDS },
    );
    expect(OAUTH_STATE_TTL_SECONDS).toBe(600);
  });

  it('usa um nonce aleatório distinto por state (cond. 3)', async () => {
    const a = await createSignedState();
    const b = await createSignedState();
    expect(a).not.toBe(b);
    expect(a.split('.')[0]).not.toBe(b.split('.')[0]);
  });
});

describe('verifyAndConsumeState — caminho feliz', () => {
  it('aceita um state legítimo e CONSOME-O (single-use, cond. 2 / eixo b)', async () => {
    const state = await createSignedState();

    const ok = await verifyAndConsumeState(state);
    expect(ok).toBe(true);

    // Consumido: kv.del chamado com a chave do state.
    expect(kvMock.del).toHaveBeenCalledWith(`nexus:google:oauth-state:${state}`);
  });
});

describe('verifyAndConsumeState — eixos a/b/c (falhas tratadas como inválido)', () => {
  it('(c) state null → false, sem throw', async () => {
    expect(await verifyAndConsumeState(null)).toBe(false);
  });

  it('(c) state malformado (sem separador) → false', async () => {
    expect(await verifyAndConsumeState('semseparador')).toBe(false);
  });

  it('(c) assinatura HMAC inválida → false e NÃO apaga KV (não há entrada legítima)', async () => {
    const state = await createSignedState();
    const [nonce] = state.split('.');
    const forged = `${nonce}.deadbeef`;

    expect(await verifyAndConsumeState(forged)).toBe(false);
    expect(kvMock.del).not.toHaveBeenCalled();
  });

  it('(b) replay de state já consumido → false (não sucesso silencioso)', async () => {
    const state = await createSignedState();

    expect(await verifyAndConsumeState(state)).toBe(true); // 1.ª utilização
    expect(await verifyAndConsumeState(state)).toBe(false); // replay
  });

  it('(a) state assinado mas expirado/ausente em KV → false', async () => {
    const state = await createSignedState();
    // Simula expiração TTL: a entrada desaparece do KV.
    kvStore.clear();

    expect(await verifyAndConsumeState(state)).toBe(false);
  });
});
