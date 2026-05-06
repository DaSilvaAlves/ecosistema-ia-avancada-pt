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

  it('linkMessageToRun lança erro se messageId não existe', async () => {
    await expect(
      linkMessageToRun('00000000-0000-0000-0000-000000000000', crypto.randomUUID())
    ).rejects.toThrow(/não encontrado/i);
  });

  it('listConversation rejeita limit <= 0', async () => {
    await expect(listConversation('main', { limit: 0 })).rejects.toThrow(/limit inválido/i);
    await expect(listConversation('main', { limit: -5 })).rejects.toThrow(/limit inválido/i);
  });

  it('listConversation rejeita limit não finito', async () => {
    await expect(listConversation('main', { limit: NaN })).rejects.toThrow(/limit inválido/i);
    await expect(listConversation('main', { limit: Infinity })).rejects.toThrow(/limit inválido/i);
  });

  it('listConversation rejeita sinceMs negativo ou não finito', async () => {
    await expect(listConversation('main', { sinceMs: -1 })).rejects.toThrow(/sinceMs inválido/i);
    await expect(listConversation('main', { sinceMs: NaN })).rejects.toThrow(/sinceMs inválido/i);
  });

  it('listConversation aceita sinceMs=0 (janela colapsa para "agora")', async () => {
    // sinceMs=0 significa "desde 0ms atrás" → janela `timestamp >= Date.now()`,
    // por isso mensagens do passado não aparecem. Aceitar o input sem lançar é
    // o comportamento esperado; o resultado vazio é uma consequência matemática.
    await addChatMessage(makeMessage({ timestamp: Date.now() - 1000, content: 'msg-1' }));
    const result = await listConversation('main', { sinceMs: 0 });
    expect(result).toEqual([]);
  });

  it('listConversation aplica filtro sinceMs correctamente', async () => {
    const now = Date.now();
    await addChatMessage(makeMessage({ timestamp: now - 60_000, content: 'antiga' }));
    await addChatMessage(makeMessage({ timestamp: now - 100, content: 'recente' }));

    const recent = await listConversation('main', { sinceMs: 5_000 });
    expect(recent).toHaveLength(1);
    expect(recent[0].content).toBe('recente');
  });

  it('getRecentMessages rejeita limit <= 0', async () => {
    await expect(getRecentMessages('main', 0)).rejects.toThrow(/limit inválido/i);
    await expect(getRecentMessages('main', -3)).rejects.toThrow(/limit inválido/i);
  });
});
