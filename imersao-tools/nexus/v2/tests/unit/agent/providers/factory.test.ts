import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getClassifier, getExecutor } from '@/lib/agent/providers/factory';
import { OpenAIExecutor } from '@/lib/agent/providers/openai';

/**
 * Story 8.1 (ADR-10 S1) — Factory dual-provider tests.
 *
 * Cobre AC1/AC2/AC3 + cenários C1-C5 da Testing section:
 * - LLM_PROVIDER ausente/'anthropic' → instância Anthropic (default, retrocompat);
 * - LLM_PROVIDER='openai' (sem impl S2/S3) → fail-loud claro, NÃO cai para Anthropic;
 * - key do provider activo ausente → fail-loud PT-PT;
 * - LLM_PROVIDER inválido (CONCERN @po #1) → fail-loud, NÃO default silencioso;
 * - mismatch LLM_PROVIDER ≠ NEXT_PUBLIC_LLM_PROVIDER → fail-loud (asserção de boot).
 *
 * A factory lê `process.env` directamente (Edge-safe) — sem `vi.resetModules`,
 * basta gerir as env vars tocadas e restaurá-las.
 */

const MOCK_ANTHROPIC_KEY = 'sk-ant-0123456789abcdef';
const MOCK_OPENAI_KEY = 'sk-openai-0123456789abcdef';

const TOUCHED = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'LLM_PROVIDER',
  'NEXT_PUBLIC_LLM_PROVIDER',
] as const;

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of TOUCHED) saved[k] = process.env[k];
  // Baseline limpo: sem flags (ambas default 'anthropic'), key Anthropic presente.
  delete process.env.LLM_PROVIDER;
  delete process.env.NEXT_PUBLIC_LLM_PROVIDER;
  delete process.env.OPENAI_API_KEY;
  process.env.ANTHROPIC_API_KEY = MOCK_ANTHROPIC_KEY;
});

afterEach(() => {
  for (const k of TOUCHED) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('factory — C1/C2 default anthropic (retrocompat)', () => {
  it('LLM_PROVIDER ausente → getClassifier devolve instância Anthropic', () => {
    const classifier = getClassifier();
    expect(classifier).toBeDefined();
    expect(typeof classifier.classify).toBe('function');
  });

  it('LLM_PROVIDER ausente → getExecutor devolve instância Anthropic', () => {
    const executor = getExecutor();
    expect(executor).toBeDefined();
    expect(typeof executor.execute).toBe('function');
  });

  it("LLM_PROVIDER='anthropic' explícito → instância Anthropic (comportamento idêntico)", () => {
    process.env.LLM_PROVIDER = 'anthropic';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'anthropic';
    expect(getClassifier()).toBeDefined();
    expect(getExecutor()).toBeDefined();
  });
});

describe('factory — C3/AC10 LLM_PROVIDER=openai → executor implementado, classifier ainda fail-loud', () => {
  beforeEach(() => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = MOCK_OPENAI_KEY;
  });

  it('getExecutor devolve OpenAIExecutor (Story 8.2 — deixa de fail-loud)', () => {
    const executor = getExecutor();
    expect(executor).toBeInstanceOf(OpenAIExecutor);
    expect(typeof executor.execute).toBe('function');
  });

  it('getClassifier ainda lança Error "ainda não implementado" (Story 8.3 pendente)', () => {
    expect(() => getClassifier()).toThrowError(/ainda não implementado/);
    expect(() => getClassifier()).toThrowError(/OpenAIClassifier/);
  });
});

describe('factory — C4 key do provider activo ausente → fail-loud PT-PT', () => {
  it('Anthropic activo + ANTHROPIC_API_KEY ausente → Error PT-PT', () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => getClassifier()).toThrowError(
      /ANTHROPIC_API_KEY não configurada/,
    );
    expect(() => getExecutor()).toThrowError(
      /ANTHROPIC_API_KEY não configurada/,
    );
  });

  it('Anthropic activo + ANTHROPIC_API_KEY vazia → Error PT-PT', () => {
    process.env.ANTHROPIC_API_KEY = '';
    expect(() => getExecutor()).toThrowError(
      /ANTHROPIC_API_KEY não configurada/,
    );
  });

  it('OpenAI activo + OPENAI_API_KEY ausente → Error de key (antes do not-implemented)', () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'openai';
    delete process.env.OPENAI_API_KEY;
    expect(() => getExecutor()).toThrowError(
      /OPENAI_API_KEY não configurada/,
    );
    expect(() => getClassifier()).toThrowError(
      /OPENAI_API_KEY não configurada/,
    );
  });

  it('OpenAI activo + OPENAI_API_KEY vazia → Error de key', () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = '';
    expect(() => getExecutor()).toThrowError(
      /OPENAI_API_KEY não configurada/,
    );
  });

  // CR Iter 1 (Minor m2) — uma key whitespace-only tem length > 0 mas é tão
  // inválida como ausente. Tratada como fail-loud (não aceite), não passada ao SDK.
  it('Anthropic activo + ANTHROPIC_API_KEY whitespace-only → Error PT-PT', () => {
    process.env.ANTHROPIC_API_KEY = '   ';
    expect(() => getExecutor()).toThrowError(
      /ANTHROPIC_API_KEY não configurada/,
    );
    expect(() => getClassifier()).toThrowError(
      /ANTHROPIC_API_KEY não configurada/,
    );
  });

  it('OpenAI activo + OPENAI_API_KEY whitespace-only → Error de key (antes do not-implemented)', () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = '   ';
    expect(() => getExecutor()).toThrowError(
      /OPENAI_API_KEY não configurada/,
    );
    expect(() => getClassifier()).toThrowError(
      /OPENAI_API_KEY não configurada/,
    );
  });
});

describe('factory — CONCERN @po #1: LLM_PROVIDER inválido → fail-loud', () => {
  it("valor desconhecido ('foobar') NÃO cai para anthropic — lança Error", () => {
    process.env.LLM_PROVIDER = 'foobar';
    // Flags alinhadas (ambas 'foobar') para isolar a validação do enum do
    // caminho de mismatch — o erro do enum (resolveLLMProvider) dispara primeiro.
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'foobar';
    expect(() => getExecutor()).toThrowError(/LLM_PROVIDER inválido/);
    expect(() => getExecutor()).toThrowError(/foobar/);
  });
});

describe('factory — C5 mismatch de flags → fail-loud (asserção de boot)', () => {
  it("LLM_PROVIDER='openai' mas NEXT_PUBLIC_LLM_PROVIDER='anthropic' → Error de mismatch", () => {
    process.env.LLM_PROVIDER = 'openai';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'anthropic';
    process.env.OPENAI_API_KEY = MOCK_OPENAI_KEY;
    expect(() => getExecutor()).toThrowError(/Mismatch de flags de provider/);
  });

  it("LLM_PROVIDER='anthropic' mas NEXT_PUBLIC_LLM_PROVIDER='openai' → Error de mismatch", () => {
    process.env.LLM_PROVIDER = 'anthropic';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'openai';
    expect(() => getClassifier()).toThrowError(/Mismatch de flags de provider/);
  });
});
