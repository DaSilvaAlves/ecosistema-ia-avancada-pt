import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Nexus v2 — env.ts unit tests (P1.1 — fecha o ficheiro a 0% coverage)
 *
 * `getServerEnv` mantém um singleton em módulo (`_serverEnv`). Cada teste precisa
 * de um módulo fresco para exercer os ramos `test` / `production`-ok /
 * `production`-falha de forma independente — daí `vi.resetModules()` +
 * `await import(...)` dinâmico em cada caso.
 *
 * `NODE_ENV` é read-only no tipo `ProcessEnv` do Next — manipula-se via
 * `vi.stubEnv` (restaurado em `afterEach`). As restantes vars (não read-only)
 * são definidas/removidas directamente e restauradas a partir do snapshot.
 */

const TOUCHED = [
  'ANTHROPIC_API_KEY',
  'NEXUS_PASSWORD_HASH',
  'SESSION_SECRET',
  'NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC',
  // Story 6.16 — janela do briefing matinal (C15 — teste de parsing).
  'BRIEFING_HOUR_START',
  'BRIEFING_HOUR_END',
] as const;

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  vi.resetModules();
  for (const k of TOUCHED) saved[k] = process.env[k];
});

afterEach(() => {
  vi.unstubAllEnvs();
  for (const k of TOUCHED) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('getServerEnv — modo test', () => {
  it('tolera ausência de vars críticas (partial best-effort)', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.NEXUS_PASSWORD_HASH;
    delete process.env.SESSION_SECRET;
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(() => getServerEnv()).not.toThrow();
    expect(getServerEnv()).toBeDefined();
  });
});

describe('getServerEnv — modo production', () => {
  it('devolve as vars validadas quando todas presentes e válidas', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    const { getServerEnv } = await import('@/lib/shared/env');
    const env = getServerEnv();
    expect(env.ANTHROPIC_API_KEY).toBe('sk-ant-0123456789');
    expect(env.NEXUS_PASSWORD_HASH).toBe('hash-0123456789');
    expect(env.SESSION_SECRET).toBe('session-secret-0123456789');
  });

  it('faz cache: a 2ª chamada devolve a mesma referência', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    const { getServerEnv } = await import('@/lib/shared/env');
    const first = getServerEnv();
    const second = getServerEnv();
    expect(second).toBe(first);
  });

  it('lança com lista de campos quando uma var obrigatória está ausente', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.NEXUS_PASSWORD_HASH;
    delete process.env.SESSION_SECRET;
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(() => getServerEnv()).toThrow(/Env vars inválidas/);
  });

  it('a mensagem de erro nomeia o campo em falta', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    delete process.env.SESSION_SECRET;
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(() => getServerEnv()).toThrow(/SESSION_SECRET/);
  });
});

describe('getServerEnv — BRIEFING_HOUR_* (Story 6.16, C15 parsing)', () => {
  it('coerce string→number das horas do briefing (env vars chegam como string)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    process.env.BRIEFING_HOUR_START = '7';
    process.env.BRIEFING_HOUR_END = '9';
    const { getServerEnv } = await import('@/lib/shared/env');
    const env = getServerEnv();
    expect(env.BRIEFING_HOUR_START).toBe(7);
    expect(env.BRIEFING_HOUR_END).toBe(9);
  });

  it('ausentes → undefined (default 7/9 aplicado no endpoint)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    delete process.env.BRIEFING_HOUR_START;
    delete process.env.BRIEFING_HOUR_END;
    const { getServerEnv } = await import('@/lib/shared/env');
    const env = getServerEnv();
    expect(env.BRIEFING_HOUR_START).toBeUndefined();
    expect(env.BRIEFING_HOUR_END).toBeUndefined();
  });

  it('hora fora de 0-23 → rejeita (validação Zod)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    process.env.BRIEFING_HOUR_START = '25';
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(() => getServerEnv()).toThrow(/BRIEFING_HOUR_START/);
  });
});

describe('getPublicEnv', () => {
  it('lê NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC do process.env', async () => {
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC = 'BPublicVapidKey-123';
    const { getPublicEnv } = await import('@/lib/shared/env');
    expect(getPublicEnv().NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC).toBe(
      'BPublicVapidKey-123',
    );
  });

  it('var pública ausente → campo undefined (opcional)', async () => {
    delete process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC;
    const { getPublicEnv } = await import('@/lib/shared/env');
    expect(getPublicEnv().NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC).toBeUndefined();
  });
});
