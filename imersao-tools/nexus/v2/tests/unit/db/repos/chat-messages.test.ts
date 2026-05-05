import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  addChatMessage,
  listConversation,
  getRecentMessages,
  linkMessageToRun,
  DEFAULT_CONVERSATION_ID,
} from '@/lib/db/repos/chat-messages';
import type { ChatMessage } from '@/types/db';

/**
 * Nexus v2 — chat-messages repo tests (Story 1.1 / AC9)
 */

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: crypto.randomUUID(),
    conversationId: DEFAULT_CONVERSATION_ID,
    role: 'user',
    content: 'olá',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('chat-messages repo', () => {
  beforeEach(async () => {
    await db.chat_messages.clear();
  });

  it('addChatMessage roundtrip', async () => {
    const msg = makeMessage({ content: 'mensagem teste' });
    const persisted = await addChatMessage(msg);
    expect(persisted).toEqual(msg);

    const retrieved = await db.chat_messages.get(msg.id);
    expect(retrieved?.content).toBe('mensagem teste');
  });

  it('addChatMessage rejeita input inválido (Zod)', async () => {
    const invalid = makeMessage({ id: 'not-uuid' });
    await expect(addChatMessage(invalid)).rejects.toThrow();
  });

  it('listConversation retorna ordem cronológica via index', async () => {
    const baseTs = Date.now();
    await addChatMessage(makeMessage({ timestamp: baseTs - 3000, content: 'oldest' }));
    await addChatMessage(makeMessage({ timestamp: baseTs - 1000, content: 'newest' }));
    await addChatMessage(makeMessage({ timestamp: baseTs - 2000, content: 'middle' }));

    const result = await listConversation();
    expect(result.map((m) => m.content)).toEqual(['oldest', 'middle', 'newest']);
  });

  it('listConversation filtra por conversationId', async () => {
    await addChatMessage(makeMessage({ conversationId: 'main', content: 'main-msg' }));
    await addChatMessage(makeMessage({ conversationId: 'other', content: 'other-msg' }));

    const main = await listConversation('main');
    expect(main).toHaveLength(1);
    expect(main[0].content).toBe('main-msg');
  });

  it('getRecentMessages retorna últimas N em ordem cronológica', async () => {
    const baseTs = Date.now();
    for (let i = 0; i < 5; i++) {
      await addChatMessage(makeMessage({ timestamp: baseTs - (5 - i) * 1000, content: `m${i}` }));
    }
    const recent = await getRecentMessages('main', 3);
    expect(recent.map((m) => m.content)).toEqual(['m2', 'm3', 'm4']);
  });

  it('linkMessageToRun popula FK agentRunId', async () => {
    const msg = makeMessage();
    await addChatMessage(msg);
    const runId = crypto.randomUUID();
    await linkMessageToRun(msg.id, runId);

    const updated = await db.chat_messages.get(msg.id);
    expect(updated?.agentRunId).toBe(runId);
  });
});
