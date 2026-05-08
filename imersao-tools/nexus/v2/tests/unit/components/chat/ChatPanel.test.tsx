/**
 * Nexus v2 — ChatPanel component tests (Story 1.9 Iter 2)
 *
 * Cobertura focada nos fixes CodeRabbit Iter 1:
 *   - Major #1: dedup stream/persisted — quando `currentRunId` está activo,
 *     mensagens persistidas com o mesmo `agentRunId` são suprimidas para
 *     evitar render duplicado (live bubble + persisted bubble)
 *   - Minor #4: erro de POST /api/agent/confirm é surfaced em vez de silenciado
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { ChatMessage } from '@/types/db';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';
import type { UseAgentStreamResult } from '@/hooks/useAgentStream';

// Mocks dos hooks
const persistedMessagesRef: { current: ChatMessage[] | undefined } = { current: [] };
const streamStateRef: { current: UseAgentStreamResult } = {
  current: {
    submit: vi.fn(),
    reset: vi.fn(),
    isStreaming: false,
    currentRunId: null,
    events: [],
    error: null,
  },
};

vi.mock('@/hooks/useChatMessages', () => ({
  useConversationMessages: () => persistedMessagesRef.current,
}));

vi.mock('@/hooks/useAgentStream', () => ({
  useAgentStream: () => streamStateRef.current,
}));

import { ChatPanel } from '@/components/chat/ChatPanel';

const RUN_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const server = setupServer();

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
  server.listen({ onUnhandledRequest: 'error' });
  // Reset state refs
  persistedMessagesRef.current = [];
  streamStateRef.current = {
    submit: vi.fn(),
    reset: vi.fn(),
    isStreaming: false,
    currentRunId: null,
    events: [],
    error: null,
  };
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

describe('ChatPanel — dedup stream/persisted (Story 1.9 Iter 2 Major #1)', () => {
  it('quando currentRunId está activo, persisted message com mesmo agentRunId é suprimida', () => {
    const persisted: ChatMessage[] = [
      {
        id: 'msg-1',
        conversationId: 'main',
        role: 'user',
        content: 'olá',
        timestamp: 1700000000000,
      },
      {
        id: 'msg-2',
        conversationId: 'main',
        role: 'assistant',
        content: 'Olá Eurico — bem-vindo!',
        agentRunId: RUN_ID,
        timestamp: 1700000001000,
      },
    ];
    persistedMessagesRef.current = persisted;

    // Stream activo com text_delta + run actual = mesmo runId
    const events: ExecutorSSEEvent[] = [
      {
        type: 'meta',
        phase: 'start',
        runId: RUN_ID,
        prompt: 'olá',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt: 1700000000500,
        classifierResult: null,
      },
      { type: 'text_delta', runId: RUN_ID, delta: 'Olá Eurico — bem-vindo!' },
    ];

    streamStateRef.current = {
      submit: vi.fn(),
      reset: vi.fn(),
      isStreaming: true,
      currentRunId: RUN_ID,
      events,
      error: null,
    };

    render(<ChatPanel />);

    // O texto da resposta do agente deve aparecer EXACTAMENTE 1 vez
    // (vem do live bubble — a persisted foi suprimida)
    const matches = screen.getAllByText(/Olá Eurico — bem-vindo!/);
    expect(matches).toHaveLength(1);
  });

  it('quando currentRunId é null, todas as persisted aparecem (não há dedup)', () => {
    const persisted: ChatMessage[] = [
      {
        id: 'msg-2',
        conversationId: 'main',
        role: 'assistant',
        content: 'Resposta antiga',
        agentRunId: RUN_ID,
        timestamp: 1700000001000,
      },
    ];
    persistedMessagesRef.current = persisted;

    streamStateRef.current = {
      submit: vi.fn(),
      reset: vi.fn(),
      isStreaming: false,
      currentRunId: null,
      events: [],
      error: null,
    };

    render(<ChatPanel />);
    expect(screen.getByText(/Resposta antiga/)).toBeInTheDocument();
  });

  it('persistedMessages undefined (Dexie ainda a carregar) não causa erro', () => {
    persistedMessagesRef.current = undefined;
    streamStateRef.current = {
      submit: vi.fn(),
      reset: vi.fn(),
      isStreaming: false,
      currentRunId: null,
      events: [],
      error: null,
    };

    expect(() => render(<ChatPanel />)).not.toThrow();
  });
});

describe('ChatPanel — preview error handling (Story 1.9 Iter 2 Minor #4)', () => {
  it('erro 500 do POST /api/agent/confirm é surfaced via banner aria-alert', async () => {
    server.use(
      http.post('/api/agent/confirm', () => {
        return HttpResponse.json({ error: 'kv_failed' }, { status: 500 });
      })
    );

    // Stream tem preview_request a aguardar
    const events: ExecutorSSEEvent[] = [
      {
        type: 'meta',
        phase: 'start',
        runId: RUN_ID,
        prompt: 'criar evento',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt: 1700000000000,
        classifierResult: null,
      },
      {
        type: 'preview_request',
        runId: RUN_ID,
        toolName: 'criar_evento',
        toolCallId: 'call_001',
        args: { titulo: 'reunião' },
        reason: 'low_confidence',
        confidence: 0.5,
        domain: 'calendar',
      },
    ];

    streamStateRef.current = {
      submit: vi.fn(),
      reset: vi.fn(),
      isStreaming: true,
      currentRunId: RUN_ID,
      events,
      error: null,
    };

    render(<ChatPanel />);

    const confirmBtn = await screen.findByRole('button', { name: /confirmar e gravar acção/i });
    fireEvent.click(confirmBtn);

    // Banner de erro deve aparecer (aria-live="assertive")
    await waitFor(() => {
      expect(screen.getByText(/Erro ao confirmar acção \(HTTP 500\)/i)).toBeInTheDocument();
    });
  });

  it('erro de rede do POST /api/agent/confirm é surfaced em PT-PT', async () => {
    server.use(
      http.post('/api/agent/confirm', () => HttpResponse.error())
    );

    const events: ExecutorSSEEvent[] = [
      {
        type: 'meta',
        phase: 'start',
        runId: RUN_ID,
        prompt: 'criar evento',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt: 1700000000000,
        classifierResult: null,
      },
      {
        type: 'preview_request',
        runId: RUN_ID,
        toolName: 'criar_evento',
        toolCallId: 'call_001',
        args: { titulo: 'reunião' },
        reason: 'low_confidence',
        confidence: 0.5,
        domain: 'calendar',
      },
    ];

    streamStateRef.current = {
      submit: vi.fn(),
      reset: vi.fn(),
      isStreaming: true,
      currentRunId: RUN_ID,
      events,
      error: null,
    };

    render(<ChatPanel />);

    const cancelBtn = await screen.findByRole('button', { name: /cancelar acção/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByText(/Erro de rede ao cancelar acção/i)).toBeInTheDocument();
    });
  });
});
