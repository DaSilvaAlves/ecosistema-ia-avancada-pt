import { db } from '@/lib/db/client';
import { ChatMessageSchema } from '@/lib/agent/schemas';
import type { ChatMessage } from '@/types/db';

/**
 * Nexus v2 — Repository para `chat_messages` (Story 1.1)
 *
 * Encapsula acesso à tabela Dexie `chat_messages`. Story 1.9 (UI) e Story 1.5
 * (Executor) devem usar estes helpers em vez de tocar `db.chat_messages.*`
 * directamente.
 *
 * `conversationId` default `'main'` — single-user assumption (Constraint C1).
 * Quando Epic 8 introduzir múltiplas conversações, basta passar `conversationId`.
 */

export const DEFAULT_CONVERSATION_ID = 'main';

export interface ListConversationOptions {
  limit?: number;
  sinceMs?: number;
}

const DEFAULT_LIMIT = 100;

export async function addChatMessage(input: ChatMessage): Promise<ChatMessage> {
  ChatMessageSchema.parse(input);
  await db.chat_messages.add(input);
  return input;
}

export async function listConversation(
  conversationId: string = DEFAULT_CONVERSATION_ID,
  opts: ListConversationOptions = {}
): Promise<ChatMessage[]> {
  const { limit = DEFAULT_LIMIT, sinceMs } = opts;
  const sinceTs = sinceMs !== undefined ? Date.now() - sinceMs : 0;

  const baseCollection = db.chat_messages.where('conversationId').equals(conversationId);
  const filtered =
    sinceMs !== undefined ? baseCollection.filter((m) => m.timestamp >= sinceTs) : baseCollection;

  const results = await filtered.toArray();
  return results.sort((a, b) => a.timestamp - b.timestamp).slice(-limit);
}

export async function getRecentMessages(
  conversationId: string,
  limit: number
): Promise<ChatMessage[]> {
  const results = await db.chat_messages.where('conversationId').equals(conversationId).toArray();

  return results
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .reverse();
}

export async function linkMessageToRun(messageId: string, agentRunId: string): Promise<void> {
  await db.chat_messages.update(messageId, { agentRunId });
}
