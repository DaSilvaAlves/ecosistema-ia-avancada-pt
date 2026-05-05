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
