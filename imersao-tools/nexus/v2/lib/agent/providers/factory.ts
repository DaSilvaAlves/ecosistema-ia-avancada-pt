import { AnthropicClassifier, AnthropicExecutor } from '@/lib/agent/providers/anthropic';
import { OpenAIClassifier, OpenAIExecutor } from '@/lib/agent/providers/openai';
import type {
  ClassifierProvider,
  ExecutorProvider,
} from '@/lib/agent/providers/types';
import {
  assertProviderFlagsAgree,
  resolveLLMProvider,
  type LLMProvider,
} from '@/lib/shared/env';

/**
 * Nexus v2 — Provider Factories (Story 1.2; dual-provider Story 8.1 / ADR-10 S1)
 *
 * `getClassifier()` e `getExecutor()` são os pontos de entrada server-side.
 * Resolvem o provider activo por `process.env.LLM_PROVIDER` (default `anthropic`)
 * e instanciam a implementação correspondente. Lêem `process.env.X`
 * directamente (não via `getServerEnv()` para evitar parse global em Edge
 * runtime — apenas a flag e a key são lidas pontualmente).
 *
 * Fail-loud (PT-PT), nunca silent-fallback:
 * - flag `LLM_PROVIDER` com valor inválido → erro (via `resolveLLMProvider`);
 * - mismatch `LLM_PROVIDER` ≠ `NEXT_PUBLIC_LLM_PROVIDER` → erro (asserção de boot);
 * - key do provider activo ausente → erro;
 * - `LLM_PROVIDER=openai`: classifier (S3 / Story 8.3) e executor (S2 / Story 8.2)
 *   implementados — instancia a impl OpenAI; NUNCA cai para Anthropic (um fallback
 *   silencioso mascararia má configuração).
 *
 * Default `anthropic` garante retrocompatibilidade byte-a-byte: sem a flag, o
 * comportamento é o de hoje → os 2400+ testes server-side ficam verdes por
 * construção (ADR-10 §3.2/§6.1).
 *
 * Trace canónico:
 * - ADR-10 §3.2 (factory resolve por flag) + §8 row S1 (fail-loud)
 * - architecture-v2.md §4.1 — Edge/Node split (factories funcionam em ambos)
 *
 * Edge compatibility: `process.env.X` funciona em Edge runtime do Next.js
 * (variáveis declaradas em vercel.json/env files são injectadas em build).
 */

function readApiKey(provider: LLMProvider): string {
  // CR Iter 1 (Minor): `key.trim().length === 0` (não `key.length === 0`) —
  // uma key whitespace-only (ex: '   ', vinda de uma env var mal preenchida)
  // tem length > 0 mas é tão inválida como ausente. Fail-loud também nesse caso,
  // em vez de a passar ao SDK e falhar mais tarde com erro 401 opaco.
  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key.trim().length === 0) {
      throw new Error(
        'OPENAI_API_KEY não configurada — não é possível inicializar provider OpenAI'
      );
    }
    return key;
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error(
      'ANTHROPIC_API_KEY não configurada — não é possível inicializar provider Anthropic'
    );
  }
  return key;
}

/**
 * Resolve o provider activo aplicando, por esta ordem, os gates de configuração:
 * 1. asserção de concordância das flags (server ↔ público) — fail-loud em mismatch;
 * 2. validação do enum de `LLM_PROVIDER` — fail-loud em valor inválido.
 *
 * É o ponto de arranque lazy da asserção de boot (Story 8.1 AC5).
 */
function resolveActiveProvider(): LLMProvider {
  assertProviderFlagsAgree();
  return resolveLLMProvider();
}

export function getClassifier(): ClassifierProvider {
  // Override de opts (model/maxTokens) é feito via parâmetro de `classify()`.
  // Factory apenas resolve o provider, garante a key e instancia.
  const provider = resolveActiveProvider();
  if (provider === 'openai') {
    // Story 8.3 (ADR-10 S3): o classifier OpenAI está implementado. Valida a key
    // do provider activo (fail-loud se ausente — `readApiKey('openai')`) e
    // instancia o `OpenAIClassifier` — deixa de fail-loud no caminho classifier
    // server (espelho do `getExecutor()` openai, Story 8.2).
    return new OpenAIClassifier(readApiKey('openai'));
  }
  return new AnthropicClassifier(readApiKey('anthropic'));
}

export function getExecutor(): ExecutorProvider {
  const provider = resolveActiveProvider();
  if (provider === 'openai') {
    // Story 8.2 (ADR-10 S2): o executor OpenAI está implementado. Valida a key
    // do provider activo e instancia o `OpenAIExecutor` — deixa de fail-loud no
    // caminho executor server. O `getClassifier()` openai MANTÉM o fail-loud
    // "não implementado" até a Story 8.3 (S3).
    return new OpenAIExecutor(readApiKey('openai'));
  }
  return new AnthropicExecutor(readApiKey('anthropic'));
}
