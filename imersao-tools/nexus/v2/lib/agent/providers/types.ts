import type { z } from 'zod';

/**
 * Nexus v2 — Provider Abstraction Types (Story 1.2)
 *
 * Interfaces TypeScript para abstracção do provider LLM (classifier + executor).
 * Consumidas por Stories 1.4 (classifier prompt PT-PT) e 1.5 (executor chat agent).
 *
 * Edge + Node compatible — sem APIs Node-only (fs, crypto.createHmac).
 *
 * Tipos derivados de Zod (em `lib/agent/schemas.ts`) ficam ali; aqui ficam
 * as interfaces de provider e options. Nada de runtime code.
 *
 * Trace canónico:
 * - architecture-v2.md §6.1 (linhas 392-427) — modelos default + AgentRun
 * - architecture-v2.md §7.2 (linhas 565-604) — ToolDefinition canónico
 * - architecture-v2.md §4.1 (linhas 184-200) — Edge/Node split (ADR-1)
 */

import type {
  ClassificationResult,
  LLMMessage,
  LLMStreamEvent,
} from '@/lib/agent/schemas';

// Re-export tipos inferidos de Zod para single-import nos consumidores
export type { ClassificationResult, LLMMessage, LLMStreamEvent };

/**
 * Tool call individual emitido pelo executor.
 * Campo `input` é validado pelo Zod schema da tool (Story 1.3).
 */
export interface LLMToolCall {
  id: string;
  name: string;
  input: unknown;
}

/**
 * Resposta síncrona do classifier (não-streaming).
 * Total de tokens incluído para audit log (AgentRun.inputTokens/outputTokens).
 */
export interface LLMResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Options para o classifier. Todos opcionais — defaults vêm de
 * `lib/agent/models.ts` (DEFAULT_CLASSIFIER_MODEL).
 */
export interface ClassifierOpts {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Options para o executor. `runId` é obrigatório — vem da Story 1.5
 * via `startRun()` (run-builder.ts) para rastreabilidade no audit log.
 */
export interface ExecutorOpts {
  model?: string;
  maxTokens?: number;
  runId: string;
}

/**
 * Tool definition mínima para o executor.
 *
 * Alinhada com architecture-v2.md §7.2 (canónico) — Story 1.3 expandirá
 * com `resultSchema`, `domain`, `requiresPreview`, `reversible`, `execute`,
 * `reverse` mas PRESERVA os 3 campos base (`name`, `description`, `argsSchema`).
 *
 * O `AnthropicExecutor` converte `argsSchema` (Zod) → `input_schema` (JSON Schema)
 * via `zod-to-json-schema` internamente antes de chamar o SDK.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  argsSchema: z.ZodType<unknown>;
}

/**
 * Provider de classificação (consumido por Story 1.4).
 *
 * Implementação síncrona — não-streaming. Recebe system prompt (PT-PT,
 * com lista de intents disponíveis e exemplos few-shot) + user prompt
 * (mensagem do utilizador). Retorna `ClassificationResult` com intents
 * detectados + confidence per-intent + raw response (para debug).
 */
export interface ClassifierProvider {
  classify(
    systemPrompt: string,
    userPrompt: string,
    opts?: ClassifierOpts
  ): Promise<ClassificationResult>;
}

/**
 * Provider de execução com tool calling (consumido por Story 1.5).
 *
 * Async iterable de `LLMStreamEvent` — emite `text_delta` durante geração,
 * `tool_use` quando o modelo decide invocar uma tool, e `done` no final
 * com totais de tokens. O loop de tool calling (injectar `tool_result` e
 * re-chamar) é responsabilidade do consumidor (Story 1.5) — este provider
 * é stateless.
 */
export interface ExecutorProvider {
  execute(
    messages: LLMMessage[],
    tools: ToolDefinition[],
    opts: ExecutorOpts
  ): AsyncIterable<LLMStreamEvent>;
}
