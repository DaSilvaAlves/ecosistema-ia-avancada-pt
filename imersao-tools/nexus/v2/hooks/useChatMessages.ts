'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { listConversation, DEFAULT_CONVERSATION_ID } from '@/lib/db/repos/chat-messages';
import type { ChatMessage } from '@/types/db';

/**
 * Nexus v2 — Hook reactivo para `chat_messages` (Story 1.1)
 *
 * Envolve `useLiveQuery` — re-renderiza quando novas mensagens são inseridas.
 * Story 1.9 (UI MessageList) consome este hook para mostrar conversa em
 * tempo real.
 *
 * `conversationId` default `'main'` (Constraint C1 single-user).
 */

export function useConversationMessages(
  conversationId: string = DEFAULT_CONVERSATION_ID,
  limit?: number
): ChatMessage[] | undefined {
  return useLiveQuery(
    () => listConversation(conversationId, limit !== undefined ? { limit } : {}),
    [conversationId, limit]
  );
}
