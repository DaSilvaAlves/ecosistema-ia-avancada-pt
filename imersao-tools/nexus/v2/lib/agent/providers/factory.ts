import { AnthropicClassifier, AnthropicExecutor } from '@/lib/agent/providers/anthropic';
import type {
  ClassifierProvider,
  ExecutorProvider,
} from '@/lib/agent/providers/types';

/**
 * Nexus v2 — Provider Factories (Story 1.2)
 *
 * `getClassifier()` e `getExecutor()` são os pontos de entrada para Stories
 * 1.4 e 1.5. Lêem `process.env.ANTHROPIC_API_KEY` directamente (não via
 * `getServerEnv()` para evitar parse global em Edge runtime — apenas a key
 * é lida pontualmente).
 *
 * Lança `Error` em PT-PT se key ausente — falha rápida no arranque do
 * provider, não silenciosamente em runtime.
 *
 * Trace canónico:
 * - architecture-v2.md §9.2 — env vars validation (lib/shared/env.ts)
 * - architecture-v2.md §4.1 — Edge/Node split (factories funcionam em ambos)
 *
 * Edge compatibility: `process.env.X` funciona em Edge runtime do Next.js
 * (variáveis declaradas em vercel.json/env files são injectadas em build).
 */

function readApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.length === 0) {
    throw new Error(
      'ANTHROPIC_API_KEY não configurada — não é possível inicializar provider Anthropic'
    );
  }
  return key;
}

export function getClassifier(): ClassifierProvider {
  // Override de opts (model/maxTokens) é feito via parâmetro de `classify()`.
  // Factory apenas garante API key configurada e instancia provider.
  const apiKey = readApiKey();
  return new AnthropicClassifier(apiKey);
}

export function getExecutor(): ExecutorProvider {
  const apiKey = readApiKey();
  return new AnthropicExecutor(apiKey);
}
