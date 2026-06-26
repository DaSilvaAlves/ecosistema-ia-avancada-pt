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
  // Story 8.1 — flags dual-provider + secret OpenAI.
  'LLM_PROVIDER',
  'NEXT_PUBLIC_LLM_PROVIDER',
  'OPENAI_API_KEY',
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

describe('Story 8.1 — LLM_PROVIDER no ServerEnvSchema (AC1)', () => {
  it('LLM_PROVIDER ausente → default "anthropic" (retrocompat)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    delete process.env.LLM_PROVIDER;
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(getServerEnv().LLM_PROVIDER).toBe('anthropic');
  });

  it('LLM_PROVIDER="openai" → validado e resolvido', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.OPENAI_API_KEY = 'sk-openai-0123456789'; // provider activo exige a sua key
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    process.env.LLM_PROVIDER = 'openai';
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(getServerEnv().LLM_PROVIDER).toBe('openai');
  });

  it('LLM_PROVIDER inválido → rejeitado pelo schema (Zod enum)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    process.env.LLM_PROVIDER = 'foobar';
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(() => getServerEnv()).toThrow(/LLM_PROVIDER/);
  });

  it('OPENAI_API_KEY é opcional quando LLM_PROVIDER=anthropic (provider activo)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    delete process.env.LLM_PROVIDER; // default anthropic
    delete process.env.OPENAI_API_KEY;
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(() => getServerEnv()).not.toThrow();
    expect(getServerEnv().OPENAI_API_KEY).toBeUndefined();
  });

  it('boot OpenAI-only: LLM_PROVIDER=openai + OPENAI_API_KEY presente + ANTHROPIC ausente → resolve openai (não exige ANTHROPIC)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.ANTHROPIC_API_KEY;
    process.env.OPENAI_API_KEY = 'sk-openai-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    process.env.LLM_PROVIDER = 'openai';
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(() => getServerEnv()).not.toThrow();
    expect(getServerEnv().LLM_PROVIDER).toBe('openai');
    expect(getServerEnv().OPENAI_API_KEY).toBe('sk-openai-0123456789');
  });

  it('boot OpenAI sem OPENAI_API_KEY → rejeita (key do provider activo obrigatória)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.ANTHROPIC_API_KEY = 'sk-ant-0123456789';
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    process.env.LLM_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(() => getServerEnv()).toThrow(/Key do provider activo ausente/);
  });

  it('boot Anthropic sem ANTHROPIC_API_KEY → rejeita (retrocompat fail-loud preservado)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.ANTHROPIC_API_KEY;
    process.env.NEXUS_PASSWORD_HASH = 'hash-0123456789';
    process.env.SESSION_SECRET = 'session-secret-0123456789';
    delete process.env.LLM_PROVIDER; // default anthropic
    const { getServerEnv } = await import('@/lib/shared/env');
    expect(() => getServerEnv()).toThrow(/Env vars inválidas/);
  });
});

describe('Story 8.1 — resolveLLMProvider (CONCERN @po #1, fail-loud)', () => {
  it('ausente → "anthropic" (default válido)', async () => {
    delete process.env.LLM_PROVIDER;
    const { resolveLLMProvider } = await import('@/lib/shared/env');
    expect(resolveLLMProvider()).toBe('anthropic');
  });

  it('"openai" → "openai"', async () => {
    process.env.LLM_PROVIDER = 'openai';
    const { resolveLLMProvider } = await import('@/lib/shared/env');
    expect(resolveLLMProvider()).toBe('openai');
  });

  it('valor inválido NÃO cai para anthropic — lança Error PT-PT', async () => {
    process.env.LLM_PROVIDER = 'foobar';
    const { resolveLLMProvider } = await import('@/lib/shared/env');
    expect(() => resolveLLMProvider()).toThrow(/LLM_PROVIDER inválido/);
    expect(() => resolveLLMProvider()).toThrow(/foobar/);
  });
});

describe('Story 8.1 — assertProviderFlagsAgree (AC5, C5)', () => {
  it('ambas ausentes → concordam (ambas default anthropic), sem erro', async () => {
    delete process.env.LLM_PROVIDER;
    delete process.env.NEXT_PUBLIC_LLM_PROVIDER;
    const { assertProviderFlagsAgree } = await import('@/lib/shared/env');
    expect(() => assertProviderFlagsAgree()).not.toThrow();
  });

  it('ambas "openai" → concordam, sem erro', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'openai';
    const { assertProviderFlagsAgree } = await import('@/lib/shared/env');
    expect(() => assertProviderFlagsAgree()).not.toThrow();
  });

  it('mismatch (server openai, público anthropic) → lança Error', async () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'anthropic';
    const { assertProviderFlagsAgree } = await import('@/lib/shared/env');
    expect(() => assertProviderFlagsAgree()).toThrow(
      /Mismatch de flags de provider/,
    );
  });

  it('NEXT_PUBLIC_LLM_PROVIDER inválido → lança Error', async () => {
    process.env.LLM_PROVIDER = 'anthropic';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'foobar';
    const { assertProviderFlagsAgree } = await import('@/lib/shared/env');
    expect(() => assertProviderFlagsAgree()).toThrow(
      /NEXT_PUBLIC_LLM_PROVIDER inválido/,
    );
  });
});

describe('Story 8.1 — getPublicEnv cabla NEXT_PUBLIC_LLM_PROVIDER (CONCERN @po #2)', () => {
  it('lê NEXT_PUBLIC_LLM_PROVIDER do process.env', async () => {
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'openai';
    const { getPublicEnv } = await import('@/lib/shared/env');
    expect(getPublicEnv().NEXT_PUBLIC_LLM_PROVIDER).toBe('openai');
  });

  it('ausente → default "anthropic"', async () => {
    delete process.env.NEXT_PUBLIC_LLM_PROVIDER;
    const { getPublicEnv } = await import('@/lib/shared/env');
    expect(getPublicEnv().NEXT_PUBLIC_LLM_PROVIDER).toBe('anthropic');
  });
});
