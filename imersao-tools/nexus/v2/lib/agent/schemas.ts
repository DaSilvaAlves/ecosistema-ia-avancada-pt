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
 * ContentBlock — bloco estruturado dentro de `LLMMessage.content`.
 *
 * Adicionado em Story 1.5 Iter 2 (CodeRabbit fix #2) para suportar histórico
 * multi-turn com `tool_use` blocks no formato real da API Anthropic. Antes
 * desta iteração, o executor serializava `tool_use` blocks como string
 * `[tool_use id=... name=... input=...]` num único `content: string`, o que
 * funcionava com MSW mock (matching format-agnostic) mas quebraria em runtime
 * real (Story 1.8) — Anthropic API exige `content: ContentBlock[]` quando há
 * `tool_use`/`tool_result`.
 *
 * Discriminated union por `type` — tipagem stricta sem `any`. Mantém-se
 * intencionalmente um subset do shape Anthropic (text + tool_use + tool_result)
 * — Story 1.5 não usa image/document blocks.
 */
export const ContentBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
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
    tool_use_id: z.string(),
    content: z.string(),
  }),
]);

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

/**
 * Mensagem individual no array passado ao executor.
 *
 * Reusa `ChatMessageRoleSchema` (Story 1.1) — nice-to-have #1 da PO Pax.
 * `toolCallId` opcional no shape base, mas apertado por `superRefine` na
 * Iter 3 (CodeRabbit Nitpick B): quando `role === 'tool'`, `toolCallId` é
 * semanticamente obrigatório — sem ele não é possível ligar a mensagem ao
 * `tool_use` original do executor (Anthropic API requirement).
 *
 * Story 1.5 Iter 2 (CodeRabbit fix #2): `content` agora aceita
 * `string | ContentBlock[]` — array é necessário para preservar `tool_use`
 * blocks estruturados no histórico multi-turn (Anthropic API real-API
 * compliance, Story 1.8). Path string-only mantém-se como fallback canónico
 * para mensagens simples (user prompt inicial, tool_result texto, assistant
 * text-only).
 */
export const LLMMessageSchema = z
  .object({
    role: ChatMessageRoleSchema,
    content: z.union([z.string(), z.array(ContentBlockSchema)]),
    toolCallId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'tool' && (!data.toolCallId || data.toolCallId.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['toolCallId'],
        message: 'toolCallId é obrigatório quando role === "tool"',
      });
    }
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

/**
 * Story 1.7 — Undo schemas (storage 30s + endpoint reverse).
 *
 * Trace canónico:
 * - PRD §6.1 FR6 (linha 126) — "Botão undo (toast 30s) reverte última acção do agente"
 * - PRD §10 linha 418 — "1.7 Undo mechanism (storage 30s + endpoint reverse)"
 * - Epic 1 AC4 (PRD §10 linha 427) — "Undo reverte última operação dentro de 30s; após 30s não é possível"
 * - Architecture v2 §3 linha 130 — `lib/agent/undo.ts`
 * - Architecture v2 §6.5 linhas 538-546 — KV namespace pattern (Story 1.7 introduz `nexus:undo:run:<runId>`)
 *
 * Adicionados ao ficheiro existente sem apagar Stories 1.1/1.2/1.5/1.6 — fonte canónica
 * arch §6.1 + §7. Consumidos por `lib/agent/undo.ts` e `app/api/agent/undo/route.ts`.
 *
 * RESOLVED-1 (Architect Aria 08/05/2026): convenção canonical Zod (mesmo pattern
 * Stories 1.1+1.5+1.6) com mensagens PT-PT. NÃO usar `@vercel/kv` directamente
 * neste schema — `UndoEntry` é payload puro, KV adapter mete-o em `set()`.
 */

/**
 * Payload persistido em `nexus:undo:run:<runId>` durante a janela de 30s.
 *
 * Reusa `ToolCallSchema` (Story 1.1) — mesma forma que `AgentRun.toolCalls`
 * para o reverse loop poder iterar `toolCalls` em ordem inversa e chamar
 * `toolRegistry.get(toolCall.toolName).reverse(args, result, ctx)`.
 *
 * Campo `expiresAt` é redundante face a KV `ex: 30` mas é defense-in-depth
 * (RESOLVED-2 Architect): Upstash Redis TTL é precisão de 1s, não ms; clock
 * skew Edge regions é tipicamente <1s mas pode existir. Endpoint guard
 * `entry.expiresAt < Date.now()` fecha a race window de ~1s sem custo extra.
 */
export const UndoEntrySchema = z.object({
  runId: z.string().uuid('runId deve ser UUID válido'),
  timestamp: z.number().int().positive('timestamp deve ser epoch ms positivo'),
  toolCalls: z.array(ToolCallSchema),
  expiresAt: z.number().int().positive('expiresAt deve ser epoch ms positivo'),
});

/**
 * Body schema do endpoint `POST /api/agent/undo`.
 *
 * `runId` é o único campo necessário — endpoint lookup via
 * `getUndoEntry(runId, kv)` e reverte todos os `toolCalls` em ordem reversa
 * (RESOLVED-4 Architect: "última operação" = último AgentRun, multi-tool).
 */
export const UndoRequestSchema = z.object({
  runId: z.string().uuid('runId deve ser UUID válido'),
});

export type UndoEntry = z.infer<typeof UndoEntrySchema>;
export type UndoRequest = z.infer<typeof UndoRequestSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;

/**
 * Story 1.8 — Endpoint `POST /api/agent/prompt` body schema.
 *
 * Trace canónico:
 * - PRD §10 linha 419 — "1.8 Endpoint /api/agent/prompt com auth + rate limit + telemetria"
 * - PRD §6.1 FR1 (linha 121) — "Layout principal é chat com input always-visible"
 * - Architecture v2 ADR-1 (linha 24) — Edge runtime, streaming token-by-token
 *
 * `prompt` é PT-PT, max 4000 chars (limite defensivo para evitar abuso de
 * input_tokens; o classifier Haiku da Story 1.4 funciona bem com prompts
 * curtos típicos da imersão pessoal).
 *
 * `conversationId` é OPCIONAL — Story 1.8 ignora-o (executor é stateless,
 * RESOLVED-2 Story 1.5). Incluído agora a custo zero para evitar breaking
 * change na Story 1.9 que vai consumi-lo para juntar mensagens à mesma
 * conversa Dexie client-side. Decisão @po Pax 08/05/2026 (OQ-3 RESOLVED).
 */
export const PromptRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, 'prompt é obrigatório')
    .max(4000, 'prompt excede 4000 caracteres'),
  conversationId: z
    .string()
    .uuid('conversationId deve ser UUID válido')
    .optional(),
});

export type PromptRequest = z.infer<typeof PromptRequestSchema>;

/**
 * Story 1.8 — Endpoint `POST /api/agent/confirm` body schema.
 *
 * Trace canónico:
 * - Story 1.8 AC8 — endpoint auxiliar para resolver `KvConfirmationProvider`
 * - Story 1.6 `ConfirmationProvider` interface (executor.ts L112-114) —
 *   `requestConfirmation(runId, toolName)` retorna `'confirm' | 'cancel'`
 * - ADR-7 (Story 1.8) — namespace KV `nexus:agent:confirm:<runId>:<toolName>`
 *
 * O browser invoca este endpoint quando o utilizador clica em
 * Confirmar/Cancelar no diálogo de preview gate. O endpoint escreve em KV
 * com TTL `CONFIRM_TTL_SECONDS = 60` (lib/agent/kv-confirmation-provider.ts);
 * o `KvConfirmationProvider` que está a correr noutro Edge process
 * (POST /api/agent/prompt) faz polling KV até encontrar o valor e resolve.
 *
 * `runId` UUID — gerado internamente pelo executor (executor.ts L473) e
 * exposto via evento `meta(start)` da SSE — o browser propaga-o de volta
 * neste body.
 *
 * `toolName` string min 1 — não é UUID, é o nome canónico da tool no
 * registry (Story 1.3). Exposto pelo evento `preview_request` da SSE.
 */
export const ConfirmRequestSchema = z.object({
  runId: z.string().uuid('runId deve ser UUID válido'),
  toolName: z.string().min(1, 'toolName é obrigatório'),
  action: z.enum(['confirm', 'cancel']),
});

export type ConfirmRequest = z.infer<typeof ConfirmRequestSchema>;
