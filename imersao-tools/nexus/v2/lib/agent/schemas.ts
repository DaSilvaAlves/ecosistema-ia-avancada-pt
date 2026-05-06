import { z } from 'zod';

/**
 * Nexus v2 — Zod schemas para Epic 1 (Cérebro Multi-Intent) — Story 1.1
 *
 * Fonte canónica: architecture-v2.md §6.1 + types/db.ts.
 * Constitution Article IV — espelho fiel das interfaces, sem invenção.
 *
 * Stories 1.4 (classifier) e 1.5 (executor) reutilizam estes schemas para
 * validar JSON da Anthropic antes de persistir em Dexie.
 */

export const AgentRunStatusSchema = z.enum(['success', 'partial', 'failed', 'reverted']);

export const ToolCallSchema = z.object({
  toolName: z.string().min(1, 'toolName é obrigatório'),
  args: z.unknown(),
  result: z.unknown(),
  durationMs: z.number().int().nonnegative(),
  reverted: z.boolean(),
});

export const AgentRunSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  timestamp: z.number().int().positive('timestamp deve ser epoch ms positivo'),
  prompt: z.string().min(1, 'prompt é obrigatório'),
  intents: z.array(z.string()),
  toolCalls: z.array(ToolCallSchema),
  status: AgentRunStatusSchema,
  durationMs: z.number().int().nonnegative(),
  modelClassifier: z.string().min(1, 'modelClassifier é obrigatório'),
  modelExecutor: z.string().min(1, 'modelExecutor é obrigatório'),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  errorMessage: z.string().optional(),
});

export const ChatMessageRoleSchema = z.enum(['user', 'assistant', 'tool']);

export const ChatMessageSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  conversationId: z.string().min(1, 'conversationId é obrigatório'),
  role: ChatMessageRoleSchema,
  content: z.string(),
  toolCalls: z.array(ToolCallSchema).optional(),
  agentRunId: z.string().uuid().optional(),
  timestamp: z.number().int().positive('timestamp deve ser epoch ms positivo'),
});

export type AgentRunStatus = z.infer<typeof AgentRunStatusSchema>;
export type ChatMessageRole = z.infer<typeof ChatMessageRoleSchema>;

/**
 * Story 1.2 — Provider abstraction schemas (classifier + executor).
 *
 * Adicionados ao ficheiro existente sem apagar Story 1.1 — fonte canónica
 * arch §6.1 + §7. Consumidos por Stories 1.4 (classifier) e 1.5 (executor).
 */

/**
 * Resultado da classificação multi-intent.
 *
 * Campo `confidence` é `Record<string, number>` — score per-intent.
 * Range exacto (0..1 vs 0..100) é definido pelo prompt da Story 1.4 — schema
 * fica agnóstico para não bloquear refinement futuro.
 *
 * `rawResponse` preservado para debug (Story 1.4 prompt iteration).
 */
export const ClassificationResultSchema = z.object({
  intents: z.array(z.string()),
  confidence: z.record(z.string(), z.number()),
  rawResponse: z.string(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
});

/**
 * Mensagem individual no array passado ao executor.
 *
 * Reusa `ChatMessageRoleSchema` (Story 1.1) — nice-to-have #1 da PO Pax.
 * `toolCallId` opcional, presente apenas em mensagens com role 'tool'
 * (resposta a um tool_use anterior — Anthropic API requirement).
 */
export const LLMMessageSchema = z.object({
  role: ChatMessageRoleSchema,
  content: z.string(),
  toolCallId: z.string().optional(),
});

/**
 * Stream events emitidos pelo `ExecutorProvider.execute()`.
 *
 * Discriminated union por `type` — tipagem stricta (sem any).
 * Mapeamento Anthropic SDK → estes eventos:
 * - `content_block_delta` com `delta.type === 'text_delta'` → `text_delta`
 * - `content_block_start` com `content_block.type === 'tool_use'` → `tool_use`
 * - `message_stop` (após acumular usage) → `done`
 * - Erros internos → `error`
 *
 * `tool_result` NÃO é emitido pelo provider — é injectado pelo consumidor
 * (Story 1.5) no array `messages` da próxima chamada ao executor.
 *
 * Padrão `z.unknown()` (lição Story 1.1): infere `?: unknown` opcional no
 * output de `parse()`. Para preservar tipagem stricta nos consumidores,
 * o pattern é validar com `LLMStreamEventSchema.parse(event)` e fazer
 * yield do `event` original (não do output do parse).
 */
export const LLMStreamEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text_delta'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('tool_use'),
    id: z.string(),
    name: z.string(),
    input: z.unknown(),
  }),
  z.object({
    type: z.literal('tool_result'),
    toolCallId: z.string(),
    content: z.string(),
  }),
  z.object({
    type: z.literal('done'),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('error'),
    message: z.string(),
  }),
]);

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;
export type LLMMessage = z.infer<typeof LLMMessageSchema>;
export type LLMStreamEvent = z.infer<typeof LLMStreamEventSchema>;
