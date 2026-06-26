import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CLASSIFIER_MODEL,
  DEFAULT_EXECUTOR_MODEL,
  DEFAULT_OPENAI_CLASSIFIER_MODEL,
  DEFAULT_OPENAI_EXECUTOR_MODEL,
} from '@/lib/agent/models';

/**
 * Story 8.1 (AC9, C10) — defaults OpenAI em `models.ts`, aditivo.
 *
 * Confirma que os defaults OpenAI estão exportados com os valores do ADR-10 §4.5
 * e que as constantes Anthropic existentes ficam intactas (não-regressão).
 */

describe('models — defaults OpenAI (AC9)', () => {
  it("DEFAULT_OPENAI_CLASSIFIER_MODEL é 'gpt-4.1-mini'", () => {
    expect(DEFAULT_OPENAI_CLASSIFIER_MODEL).toBe('gpt-4.1-mini');
  });

  it("DEFAULT_OPENAI_EXECUTOR_MODEL é 'gpt-4.1'", () => {
    expect(DEFAULT_OPENAI_EXECUTOR_MODEL).toBe('gpt-4.1');
  });
});

describe('models — defaults Anthropic intactos (não-regressão)', () => {
  it("DEFAULT_CLASSIFIER_MODEL mantém 'claude-haiku-4-5-20251001'", () => {
    expect(DEFAULT_CLASSIFIER_MODEL).toBe('claude-haiku-4-5-20251001');
  });

  it("DEFAULT_EXECUTOR_MODEL mantém 'claude-sonnet-4-6'", () => {
    expect(DEFAULT_EXECUTOR_MODEL).toBe('claude-sonnet-4-6');
  });
});
