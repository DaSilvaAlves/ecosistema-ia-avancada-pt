/**
 * Nexus v2 — useAgentStream hook tests (Story 1.9 AC10 + AC11)
 *
 * Cobertura mínima 85% lines (AC11):
 * - submit() dispara fetch para /api/agent/prompt com body correcto
 * - isStreaming é true durante stream e false após [DONE]
 * - Eventos meta, tool_complete, done acumulados em events
 * - Dexie startRun invocado em meta(start)
 * - Dexie appendToolCall invocado em tool_complete
 * - Dexie finishRun (db.agent_runs.update) invocado em done
 * - ChatMessage assistant persistido em done success
 * - Erro de rede exposto em error PT-PT
 *
 * MSW para mockar /api/agent/prompt — handler segue o protocolo real:
 * Content-Type: text/event-stream + linhas data: <JSON>\n\n + data: [DONE]\n\n
 * (memória `feedback_mock_must_reflect_real_protocol.md`).
 *
 * Dexie mockado via vi.mock('@/lib/db/repos/agent-runs') + chat-messages —
 * isola o hook de chamadas Dexie reais para tornar os asserts precisos.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock dos repos Dexie ANTES de importar o hook — vi.mock é hoisted
vi.mock('@/lib/db/repos/agent-runs', () => ({
  createAgentRun: vi.fn(async (run) => run),
  appendToolCall: vi.fn(async () => undefined),
}));

vi.mock('@/lib/db/repos/chat-messages', () => ({
  addChatMessage: vi.fn(async (msg) => msg),
  DEFAULT_CONVERSATION_ID: 'main',
}));

vi.mock('@/lib/db/client', () => ({
  db: {
    agent_runs: {
      update: vi.fn(async () => 1),
    },
  },
}));

import { useAgentStream } from '@/hooks/useAgentStream';
import { createAgentRun, appendToolCall } from '@/lib/db/repos/agent-runs';
import { addChatMessage } from '@/lib/db/repos/chat-messages';
import { db } from '@/lib/db/client';

/**
 * Helper para construir um SSE stream body conforme o protocolo real.
 * `events` são eventos JSON; o helper acrescenta `data: ...\n\n` e `[DONE]\n\n`.
 */
function buildSseStream(events: unknown[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for (const event of events) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

const server = setupServer();

beforeEach(() => {
  vi.clearAllMocks();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  server.close();
});

const RUN_ID = '11111111-2222-3333-4444-555555555555';
const startedAt = 1_700_000_000_000;

describe('useAgentStream', () => {
  it('submit() dispara fetch para /api/agent/prompt com body correcto', async () => {
    let capturedBody: unknown = null;
    server.use(
      http.post('/api/agent/prompt', async ({ request }) => {
        capturedBody = await request.json();
        return new HttpResponse(buildSseStream([]), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('amanhã reunião 15h');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(capturedBody).toEqual({ prompt: 'amanhã reunião 15h' });
  });

  it('isStreaming é true durante stream e false após [DONE]', async () => {
    let resolveStream: (() => void) | null = null;
    const blockedStream = new ReadableStream({
      async start(controller) {
        await new Promise<void>((resolve) => {
          resolveStream = resolve;
        });
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    server.use(
      http.post('/api/agent/prompt', () => {
        return new HttpResponse(blockedStream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    act(() => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(true));

    act(() => {
      resolveStream?.();
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
  });

  it('eventos meta, tool_complete, done acumulados em events', async () => {
    const events = [
      {
        type: 'meta',
        phase: 'start',
        runId: RUN_ID,
        prompt: 'teste',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt,
        classifierResult: null,
      },
      {
        type: 'tool_complete',
        runId: RUN_ID,
        toolName: 'criar_evento',
        args: { titulo: 'reunião' },
        result: { id: 'ev-1' },
        durationMs: 50,
      },
      {
        type: 'done',
        runId: RUN_ID,
        status: 'success',
        intents: ['calendar'],
        inputTokens: 100,
        outputTokens: 50,
        durationMs: 200,
        totals: { intents: 1, toolCalls: 1 },
      },
    ];

    server.use(
      http.post('/api/agent/prompt', () => {
        return new HttpResponse(buildSseStream(events), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.events).toHaveLength(3);
    expect(result.current.events[0].type).toBe('meta');
    expect(result.current.events[1].type).toBe('tool_complete');
    expect(result.current.events[2].type).toBe('done');
    expect(result.current.currentRunId).toBe(RUN_ID);
  });

  it('Dexie createAgentRun invocado ao receber meta(start)', async () => {
    const events = [
      {
        type: 'meta',
        phase: 'start',
        runId: RUN_ID,
        prompt: 'teste',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt,
        classifierResult: null,
      },
    ];

    server.use(
      http.post('/api/agent/prompt', () => {
        return new HttpResponse(buildSseStream(events), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(createAgentRun).toHaveBeenCalledTimes(1);
    expect(createAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({
        id: RUN_ID,
        prompt: 'teste',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
      })
    );
  });

  it('Dexie appendToolCall invocado ao receber tool_complete', async () => {
    const events = [
      {
        type: 'meta',
        phase: 'start',
        runId: RUN_ID,
        prompt: 'teste',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt,
        classifierResult: null,
      },
      {
        type: 'tool_complete',
        runId: RUN_ID,
        toolName: 'criar_evento',
        args: { titulo: 'reunião' },
        result: { id: 'ev-1' },
        durationMs: 50,
      },
    ];

    server.use(
      http.post('/api/agent/prompt', () => {
        return new HttpResponse(buildSseStream(events), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(appendToolCall).toHaveBeenCalledWith(
      RUN_ID,
      expect.objectContaining({
        toolName: 'criar_evento',
        durationMs: 50,
        reverted: false,
      })
    );
  });

  it('Dexie agent_runs.update invocado ao receber done (finishRun)', async () => {
    const events = [
      {
        type: 'meta',
        phase: 'start',
        runId: RUN_ID,
        prompt: 'teste',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt,
        classifierResult: null,
      },
      {
        type: 'done',
        runId: RUN_ID,
        status: 'success',
        intents: ['calendar'],
        inputTokens: 100,
        outputTokens: 50,
        durationMs: 200,
        totals: { intents: 1, toolCalls: 0 },
      },
    ];

    server.use(
      http.post('/api/agent/prompt', () => {
        return new HttpResponse(buildSseStream(events), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(db.agent_runs.update).toHaveBeenCalledWith(
      RUN_ID,
      expect.objectContaining({
        status: 'success',
        durationMs: 200,
        inputTokens: 100,
        outputTokens: 50,
      })
    );
  });

  it('persiste ChatMessage assistant em done success com texto acumulado', async () => {
    const events = [
      {
        type: 'meta',
        phase: 'start',
        runId: RUN_ID,
        prompt: 'olá',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt,
        classifierResult: null,
      },
      { type: 'text_delta', runId: RUN_ID, delta: 'Olá' },
      { type: 'text_delta', runId: RUN_ID, delta: ' Eurico!' },
      {
        type: 'done',
        runId: RUN_ID,
        status: 'success',
        intents: [],
        inputTokens: 5,
        outputTokens: 3,
        durationMs: 100,
        totals: { intents: 0, toolCalls: 0 },
      },
    ];

    server.use(
      http.post('/api/agent/prompt', () => {
        return new HttpResponse(buildSseStream(events), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('olá');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    // user message + assistant message
    const calls = vi.mocked(addChatMessage).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);
    const assistantCall = calls.find((c) => c[0].role === 'assistant');
    expect(assistantCall?.[0].content).toBe('Olá Eurico!');
    expect(assistantCall?.[0].agentRunId).toBe(RUN_ID);
  });

  it('NÃO persiste ChatMessage assistant em done failed', async () => {
    const events = [
      {
        type: 'meta',
        phase: 'start',
        runId: RUN_ID,
        prompt: 'erro',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt,
        classifierResult: null,
      },
      {
        type: 'done',
        runId: RUN_ID,
        status: 'failed',
        intents: [],
        inputTokens: 0,
        outputTokens: 0,
        durationMs: 100,
        errorMessage: 'classifier falhou',
        totals: { intents: 0, toolCalls: 0 },
      },
    ];

    server.use(
      http.post('/api/agent/prompt', () => {
        return new HttpResponse(buildSseStream(events), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('erro');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    const assistantCalls = vi
      .mocked(addChatMessage)
      .mock.calls.filter((c) => c[0].role === 'assistant');
    expect(assistantCalls).toHaveLength(0);
  });

  it('erro de rede exposto em error com mensagem PT-PT', async () => {
    server.use(
      http.post('/api/agent/prompt', () => {
        return HttpResponse.error();
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatch(/Erro de rede/);
    expect(result.current.isStreaming).toBe(false);
  });

  it('HTTP 401 expõe mensagem PT-PT de sessão expirada', async () => {
    server.use(
      http.post('/api/agent/prompt', () => {
        return new HttpResponse(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatch(/Sessão expirada/);
  });

  it('HTTP 400 expõe mensagem PT-PT de prompt inválido', async () => {
    server.use(
      http.post('/api/agent/prompt', () => {
        return new HttpResponse(JSON.stringify({ error: 'invalid' }), {
          status: 400,
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatch(/Prompt inválido/);
  });

  it('reset() limpa events, error e currentRunId', async () => {
    const events = [
      {
        type: 'meta',
        phase: 'start',
        runId: RUN_ID,
        prompt: 'teste',
        modelClassifier: 'haiku',
        modelExecutor: 'sonnet',
        startedAt,
        classifierResult: null,
      },
      {
        type: 'done',
        runId: RUN_ID,
        status: 'success',
        intents: [],
        inputTokens: 0,
        outputTokens: 0,
        durationMs: 0,
        totals: { intents: 0, toolCalls: 0 },
      },
    ];

    server.use(
      http.post('/api/agent/prompt', () => {
        return new HttpResponse(buildSseStream(events), {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      })
    );

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.events).toHaveLength(2));
    expect(result.current.currentRunId).toBe(RUN_ID);

    act(() => {
      result.current.reset();
    });

    expect(result.current.events).toHaveLength(0);
    expect(result.current.currentRunId).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('submit() com prompt vazio não dispara fetch', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { result } = renderHook(() => useAgentStream());

    act(() => {
      result.current.submit('   ');
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
