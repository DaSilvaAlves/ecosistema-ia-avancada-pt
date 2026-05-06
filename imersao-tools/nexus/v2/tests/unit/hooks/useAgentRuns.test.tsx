import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { db } from '@/lib/db/client';
import { useRecentAgentRuns } from '@/hooks/useAgentRuns';
import { useConversationMessages } from '@/hooks/useChatMessages';
import { createAgentRun } from '@/lib/db/repos/agent-runs';
import { addChatMessage } from '@/lib/db/repos/chat-messages';

/**
 * Nexus v2 — Hook reactivity tests (Story 1.1 — endereçar should-fix #2 PO)
 *
 * Confirma que os hooks `useLiveQuery` re-renderizam quando registos novos
 * são inseridos. Crítico para Story 1.7 (toast undo) e Story 1.9 (UI cards).
 */

describe('useRecentAgentRuns reactivity', () => {
  beforeEach(async () => {
    await db.agent_runs.clear();
  });

  it('re-renderiza quando novo AgentRun é inserido', async () => {
    const { result } = renderHook(() => useRecentAgentRuns());

    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current).toHaveLength(0);

    await act(async () => {
      await createAgentRun({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        prompt: 'novo run',
        intents: [],
        toolCalls: [],
        status: 'success',
        durationMs: 100,
        modelClassifier: 'claude-haiku-4-5-20251001',
        modelExecutor: 'claude-sonnet-4-6',
        inputTokens: 0,
        outputTokens: 0,
      });
    });

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current?.[0].prompt).toBe('novo run');
  });
});

describe('useConversationMessages reactivity', () => {
  beforeEach(async () => {
    await db.chat_messages.clear();
  });

  it('re-renderiza quando nova mensagem é inserida', async () => {
    const { result } = renderHook(() => useConversationMessages());

    await waitFor(() => expect(result.current).toBeDefined());
    expect(result.current).toHaveLength(0);

    await act(async () => {
      await addChatMessage({
        id: crypto.randomUUID(),
        conversationId: 'main',
        role: 'user',
        content: 'olá',
        timestamp: Date.now(),
      });
    });

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current?.[0].content).toBe('olá');
  });
});
