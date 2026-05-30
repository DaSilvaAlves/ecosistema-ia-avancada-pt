/**
 * Nexus v2 — useAgentStream hook tests (Story 1.9 AC10/AC11 · Story 1.11 ADR-9 AC4)
 *
 * Story 1.11 (ADR-9): o hook DEIXOU de fazer `fetch('/api/agent/prompt')` e passou
 * a CONDUZIR o executor client-side via `runClientAgent` (`@/lib/agent/client-executor`),
 * que devolve um `AsyncGenerator<ExecutorSSEEvent>`. Estes testes foram adaptados:
 * em vez de mockar o endpoint SSE com MSW, mockamos `runClientAgent` para devolver
 * um generator controlável de eventos. A intenção mantém-se: verificar que o hook
 * acumula `events`, expõe estado reactivo e PERSISTE a run em Dexie client-side.
 *
 * Cobertura:
 * - submit() conduz runClientAgent com o prompt trimmed
 * - isStreaming é true durante a stream e false após o generator esgotar
 * - Eventos meta, tool_complete, done acumulados em events
 * - Dexie createAgentRun invocado em meta(start)
 * - Dexie appendToolCall invocado em tool_complete
 * - Dexie agent_runs.update invocado em done (finishRun)
 * - ChatMessage assistant persistido em done success com texto acumulado
 * - Erro do generator exposto em error PT-PT
 * - AbortController: duplo submit / unmount / reset() abortam o generator em curso
 *
 * Dexie mockado via vi.mock dos repos — isola o hook de Dexie real.
 * `runClientAgent` mockado — isola o hook do runtime do executor/transport.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';

// Mock dos repos Dexie ANTES de importar o hook — vi.mock é hoisted.
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

// Story 1.11 — mock do executor client-side. O hook conduz este generator em vez
// de fazer fetch. Cada teste configura `mockGenerator` com a sequência de eventos
// (ou um generator controlável para os testes de abort).
vi.mock('@/lib/agent/client-executor', () => ({
  runClientAgent: vi.fn(),
}));

import { useAgentStream } from '@/hooks/useAgentStream';
import { runClientAgent } from '@/lib/agent/client-executor';
import { createAgentRun, appendToolCall } from '@/lib/db/repos/agent-runs';
import { addChatMessage } from '@/lib/db/repos/chat-messages';
import { db } from '@/lib/db/client';

const mockRunClientAgent = vi.mocked(runClientAgent);

/**
 * Constrói um AsyncGenerator que emite `events` em sequência. Simula o
 * `runClientAgent` num caso simples (todos os eventos disponíveis de imediato).
 */
async function* eventsGenerator(
  events: ExecutorSSEEvent[]
): AsyncGenerator<ExecutorSSEEvent> {
  for (const ev of events) {
    yield ev;
  }
}

/**
 * Generator controlável: bloqueia no primeiro `yield` até `release()` ser
 * chamado. Expõe `returned` (true se o consumidor chamou `.return()` — i.e.
 * abortou) para os testes de AbortController.
 */
function controllableGenerator(): {
  generator: AsyncGenerator<ExecutorSSEEvent>;
  release: () => void;
  state: { started: boolean; returned: boolean };
} {
  const state = { started: false, returned: false };
  let resolveGate: (() => void) | null = null;
  const gate = new Promise<void>((resolve) => {
    resolveGate = resolve;
  });

  async function* gen(): AsyncGenerator<ExecutorSSEEvent> {
    state.started = true;
    try {
      await gate;
      // Após release, emite um done e termina.
      yield {
        type: 'done',
        runId: RUN_ID,
        status: 'success',
        intents: [],
        inputTokens: 0,
        outputTokens: 0,
        durationMs: 0,
        totals: { intents: 0, toolCalls: 0 },
      } as ExecutorSSEEvent;
    } finally {
      // `.return()` (abort) ou esgotamento natural passam aqui; distinguimos
      // pelo flag `returned` que setamos no return override abaixo.
    }
  }

  const generator = gen();
  // Override de `.return()` para registar o abort (o hook chama-o ao abortar).
  const originalReturn = generator.return.bind(generator);
  generator.return = ((value?: unknown) => {
    state.returned = true;
    resolveGate?.(); // desbloqueia para o finally correr
    return originalReturn(value as never);
  }) as typeof generator.return;

  return {
    generator,
    release: () => resolveGate?.(),
    state,
  };
}

const RUN_ID = '11111111-2222-3333-4444-555555555555';
const startedAt = 1_700_000_000_000;

const metaStart: ExecutorSSEEvent = {
  type: 'meta',
  phase: 'start',
  runId: RUN_ID,
  prompt: 'teste',
  modelClassifier: 'haiku',
  modelExecutor: 'sonnet',
  startedAt,
  classifierResult: null,
};

const doneSuccess: ExecutorSSEEvent = {
  type: 'done',
  runId: RUN_ID,
  status: 'success',
  intents: [],
  inputTokens: 0,
  outputTokens: 0,
  durationMs: 0,
  totals: { intents: 0, toolCalls: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAgentStream', () => {
  it('submit() conduz runClientAgent com o prompt trimmed', async () => {
    mockRunClientAgent.mockReturnValue(eventsGenerator([metaStart, doneSuccess]));

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('  amanhã reunião 15h  ');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(mockRunClientAgent).toHaveBeenCalledTimes(1);
    expect(mockRunClientAgent).toHaveBeenCalledWith('amanhã reunião 15h');
  });

  it('isStreaming é true durante a stream e false após esgotar', async () => {
    const ctrl = controllableGenerator();
    mockRunClientAgent.mockReturnValue(ctrl.generator);

    const { result } = renderHook(() => useAgentStream());

    act(() => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(true));

    act(() => {
      ctrl.release();
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
  });

  it('eventos meta, tool_complete, done acumulados em events', async () => {
    const events: ExecutorSSEEvent[] = [
      metaStart,
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
    mockRunClientAgent.mockReturnValue(eventsGenerator(events));

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
    mockRunClientAgent.mockReturnValue(eventsGenerator([metaStart]));

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
    const events: ExecutorSSEEvent[] = [
      metaStart,
      {
        type: 'tool_complete',
        runId: RUN_ID,
        toolName: 'criar_evento',
        args: { titulo: 'reunião' },
        result: { id: 'ev-1' },
        durationMs: 50,
      },
    ];
    mockRunClientAgent.mockReturnValue(eventsGenerator(events));

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
    const events: ExecutorSSEEvent[] = [
      metaStart,
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
    mockRunClientAgent.mockReturnValue(eventsGenerator(events));

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
    const events: ExecutorSSEEvent[] = [
      { ...metaStart, prompt: 'olá' },
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
    mockRunClientAgent.mockReturnValue(eventsGenerator(events));

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
    const events: ExecutorSSEEvent[] = [
      { ...metaStart, prompt: 'erro' },
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
    mockRunClientAgent.mockReturnValue(eventsGenerator(events));

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

  it('erro do executor exposto em error com mensagem PT-PT', async () => {
    // Story 1.11: o hook já não faz HTTP — qualquer erro vem do runClientAgent
    // (transport/proxy/classifier). O hook converte-o via networkErrorMessage.
    async function* failingGenerator(): AsyncGenerator<ExecutorSSEEvent> {
      throw new Error('proxy de inferência indisponível');
      // eslint-disable-next-line no-unreachable
      yield doneSuccess;
    }
    mockRunClientAgent.mockReturnValue(failingGenerator());

    const { result } = renderHook(() => useAgentStream());

    await act(async () => {
      result.current.submit('teste');
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toMatch(/Erro de rede/);
    expect(result.current.isStreaming).toBe(false);
  });

  it('reset() limpa events, error e currentRunId', async () => {
    mockRunClientAgent.mockReturnValue(eventsGenerator([metaStart, doneSuccess]));

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

  it('submit() com prompt vazio não conduz o executor', () => {
    const { result } = renderHook(() => useAgentStream());

    act(() => {
      result.current.submit('   ');
    });

    expect(mockRunClientAgent).not.toHaveBeenCalled();
  });

  // Story 1.9 Iter 2 — Major #4 — AbortController em duplo submit / unmount / reset.
  // Story 1.11: o abort agora corta a iteração do generator e chama
  // `generator.return()` (não há mais `request.signal`).
  describe('AbortController (Story 1.9 Iter 2 Major #4)', () => {
    it('submit duplo aborta o anterior — apenas o último completa', async () => {
      const first = controllableGenerator();
      mockRunClientAgent.mockReturnValueOnce(first.generator);

      const { result } = renderHook(() => useAgentStream());

      act(() => {
        result.current.submit('primeiro');
      });
      await waitFor(() => expect(first.state.started).toBe(true));

      // Segundo submit — deve abortar o primeiro generator.
      mockRunClientAgent.mockReturnValueOnce(eventsGenerator([doneSuccess]));
      act(() => {
        result.current.submit('segundo');
      });

      await waitFor(() => expect(first.state.returned).toBe(true));
      await waitFor(() => expect(result.current.isStreaming).toBe(false));
      expect(result.current.error).toBeNull();
    });

    it('unmount durante stream aborta o generator — sem state update tardio', async () => {
      const ctrl = controllableGenerator();
      mockRunClientAgent.mockReturnValue(ctrl.generator);

      const { result, unmount } = renderHook(() => useAgentStream());

      act(() => {
        result.current.submit('teste');
      });
      await waitFor(() => expect(ctrl.state.started).toBe(true));
      expect(ctrl.state.returned).toBe(false);

      unmount();

      await waitFor(() => expect(ctrl.state.returned).toBe(true));
    });

    it('reset() aborta stream em curso e limpa state', async () => {
      const ctrl = controllableGenerator();
      mockRunClientAgent.mockReturnValue(ctrl.generator);

      const { result } = renderHook(() => useAgentStream());

      act(() => {
        result.current.submit('teste');
      });
      await waitFor(() => expect(ctrl.state.started).toBe(true));

      act(() => {
        result.current.reset();
      });

      await waitFor(() => expect(ctrl.state.returned).toBe(true));
      expect(result.current.events).toHaveLength(0);
      expect(result.current.currentRunId).toBeNull();
    });
  });
});
