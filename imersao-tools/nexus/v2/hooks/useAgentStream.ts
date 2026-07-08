'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';
import { runClientAgent } from '@/lib/agent/client-executor';
import { db } from '@/lib/db/client';
import { addChatMessage, DEFAULT_CONVERSATION_ID } from '@/lib/db/repos/chat-messages';
import { appendToolCall, createAgentRun } from '@/lib/db/repos/agent-runs';
import type { AgentRun, ChatMessage, ToolCall } from '@/types/db';

/**
 * Nexus v2 — useAgentStream hook (Story 1.9 AC1 + AC2 · Story 1.11 ADR-9 AC4)
 *
 * Hook 'use client' que CONDUZ o executor client-side (`runClientAgent`,
 * Story 1.11 ADR-9) no browser, em vez de fazer `fetch('/api/agent/prompt')`.
 * Consome o AsyncGenerator de `ExecutorSSEEvent`, expõe estado reactivo para a
 * UI e PERSISTE a run em Dexie client-side.
 *
 * Story 1.11 (ADR-9, A1+A4 — fix do bug de produção):
 * - Antes: o hook fazia `POST /api/agent/prompt` (Edge, `ctx.db = null`), logo
 *   `criar_tarefa` falhava com `Cannot read properties of null (reading
 *   'tasks')`. O executor corria no Edge sem IndexedDB.
 * - Agora: o hook conduz `runClientAgent(prompt)` no browser, onde o `ctx.db` é
 *   o Dexie real (`@/lib/db/client`) e o transport de inferência fala com
 *   `/api/anthropic/proxy` (a `ANTHROPIC_API_KEY` fica server-only). As 12
 *   tools (inalteradas) escrevem/leem directamente.
 *
 * O contrato de saída (`UseAgentStreamResult`) e a persistência de chat-log
 * (agent_runs/chat_messages) MANTÊM-SE — `ChatPanel`/`MessageList`/`ToolCard`
 * não mudam (consomem `events` exactamente como antes).
 *
 * Trace canónico:
 * - Story 1.9 AC1 — assinatura `UseAgentStreamResult`
 * - Story 1.9 AC2 — Dexie runtime (startRun em meta(start), appendToolCall em
 *   tool_complete, finishRun em done, ChatMessage em done success/partial)
 * - Story 1.11 ADR-9 AC4 — hook conduz o executor client-side
 * - Architecture v2 ADR-9 — executor client-side + ctx.db Dexie real
 * - executor.ts — `ExecutorSSEEvent` discriminated union
 *
 * Anti-patterns críticos (AC2 + arch ADR-2):
 * - `'use client'` é obrigatório — Dexie + executor client são client-only,
 *   NUNCA importar em código com `runtime = 'edge'`
 * - NUNCA tocar `db.agent_runs.*` directamente — usar repos `createAgentRun`/
 *   `appendToolCall`/`updateAgentRunStatus` (Story 1.1)
 *
 * Persistência Dexie como side-effects no caminho de consumo (não bloqueante):
 * - Erros de Dexie são logados via `console.error` mas NÃO interrompem a run —
 *   UX prioriza ver resultado, mesmo que persistência de chat-log falhe
 * - Idempotência: `createAgentRun` usa `db.agent_runs.add()` — se o runId já
 *   existe (e.g., race ou retry), Dexie lança `ConstraintError` que é
 *   silenciosamente apanhado e logado (run continua)
 */

/**
 * Resultado canónico do hook (Story 1.9 AC1).
 */
export interface UseAgentStreamResult {
  /** Conduz o executor client-side (`runClientAgent`) para o prompt. NÃO retorna — UI observa estado. */
  submit: (prompt: string) => void;
  /** `true` enquanto a stream está activa (após `submit`, antes de `[DONE]`). */
  isStreaming: boolean;
  /** runId do `meta(start)` actual; `null` antes do primeiro evento ou após `reset`. */
  currentRunId: string | null;
  /** Array imutável de eventos recebidos na run actual, em ordem de chegada. */
  events: ExecutorSSEEvent[];
  /** Mensagem de erro PT-PT — definida em fetch failure ou stream parse error. */
  error: string | null;
  /** Limpa estado para nova run (não cancela stream em curso — UI deve aguardar). */
  reset: () => void;
}

/**
 * Mensagem de erro em PT-PT — concisa para a UI mostrar em toast/badge.
 * Detalhe técnico vai para `console.error` (NFR11 implícito).
 *
 * Story 9.5 (AC6, AC10 eixo a/b): distingue honestamente "sem rede" de outros
 * erros. O chat é sempre `POST /api/anthropic/proxy` — pelo contrato de dois
 * sinais offline ratificado no Architect Gate da 9.3, um pedido não-GET passa
 * DIRECTO ao browser (o SW não o intercepta) e, offline, o `fetch()` nativo
 * rejeita com `TypeError` (nunca o 503 `{offline:true}` sintético, que é só para
 * GET). Discriminamos por `e instanceof TypeError` — NUNCA por sniffing de string
 * da mensagem (frágil: "Failed to fetch" no Chrome vs "NetworkError..." no
 * Firefox). `TypeError` é subclasse de `Error`, por isso o ramo tem de vir ANTES
 * do ramo genérico `Error`. Nenhuma run é marcada como sucesso quando isto ocorre
 * (o catch do `submit` chama `setError`, comportamento inalterado — anti-M4/R5).
 */
function networkErrorMessage(e: unknown): string {
  if (e instanceof TypeError) {
    return 'Sem rede — a tua mensagem não foi enviada. Tenta novamente quando a ligação voltar.';
  }
  if (e instanceof Error) {
    return `Erro de rede: ${e.message}`;
  }
  return 'Erro de rede inesperado';
}

/**
 * Persiste o `AgentRun` quando recebemos `meta(start)`. Best-effort — falha
 * em Dexie (ex: storage quota, fake-indexeddb cleanup) é logada mas não
 * interrompe a stream. RESOLVED-2 estabelece este contract.
 */
async function persistRunStart(
  event: Extract<ExecutorSSEEvent, { type: 'meta'; phase: 'start' }>
): Promise<void> {
  const run: AgentRun = {
    id: event.runId,
    timestamp: event.startedAt,
    prompt: event.prompt,
    intents: [],
    toolCalls: [],
    status: 'success', // será actualizado em `done`
    durationMs: 0, // será actualizado em `done`
    modelClassifier: event.modelClassifier,
    modelExecutor: event.modelExecutor,
    inputTokens: 0,
    outputTokens: 0,
  };

  try {
    await createAgentRun(run);
  } catch (e) {
    // ConstraintError (run já existe) ou DataError — log e continua.
    // Story 1.10 regression suite valida que isto não acontece em runs reais.
    console.error('[useAgentStream] createAgentRun falhou', e);
  }
}

/**
 * Persiste um `ToolCall` quando recebemos `tool_complete`. RESOLVED-2.
 */
async function persistToolCall(
  event: Extract<ExecutorSSEEvent, { type: 'tool_complete' }>
): Promise<void> {
  const toolCall: ToolCall = {
    toolName: event.toolName,
    args: event.args,
    result: event.result,
    durationMs: event.durationMs,
    reverted: false,
  };

  try {
    await appendToolCall(event.runId, toolCall);
  } catch (e) {
    console.error('[useAgentStream] appendToolCall falhou', e);
  }
}

/**
 * Persiste o estado final do `AgentRun` quando recebemos `done`. RESOLVED-2.
 *
 * Usa `db.agent_runs.update` directamente (não há `finishRun` exportada no
 * repo Story 1.1) — actualizar `status`, `durationMs`, `inputTokens`,
 * `outputTokens`, `intents`, `errorMessage` num único patch é mais eficiente
 * que múltiplas `updateAgentRunStatus` calls.
 */
async function persistRunFinish(
  event: Extract<ExecutorSSEEvent, { type: 'done' }>
): Promise<void> {
  const patch: Partial<AgentRun> = {
    status: event.status,
    durationMs: event.durationMs,
    inputTokens: event.inputTokens,
    outputTokens: event.outputTokens,
    intents: event.intents,
  };
  if (event.errorMessage !== undefined) {
    patch.errorMessage = event.errorMessage;
  }

  try {
    const updated = await db.agent_runs.update(event.runId, patch);
    if (updated === 0) {
      console.error(
        `[useAgentStream] AgentRun ${event.runId} não encontrado em finish`
      );
    }
  } catch (e) {
    console.error('[useAgentStream] finishRun falhou', e);
  }
}

/**
 * Persiste a `ChatMessage` do agente após `done` com status `success`/`partial`.
 * Conteúdo = texto acumulado dos `text_delta` events da run.
 */
async function persistAssistantMessage(
  runId: string,
  content: string
): Promise<void> {
  if (content.length === 0) return; // nada para persistir

  const message: ChatMessage = {
    id: crypto.randomUUID(),
    conversationId: DEFAULT_CONVERSATION_ID,
    role: 'assistant',
    content,
    agentRunId: runId,
    timestamp: Date.now(),
  };

  try {
    await addChatMessage(message);
  } catch (e) {
    console.error('[useAgentStream] addChatMessage assistant falhou', e);
  }
}

/**
 * Persiste a `ChatMessage` do utilizador imediatamente após `submit()`. UX:
 * a mensagem do utilizador aparece na lista antes da resposta do agente.
 */
async function persistUserMessage(content: string): Promise<void> {
  const message: ChatMessage = {
    id: crypto.randomUUID(),
    conversationId: DEFAULT_CONVERSATION_ID,
    role: 'user',
    content,
    timestamp: Date.now(),
  };

  try {
    await addChatMessage(message);
  } catch (e) {
    console.error('[useAgentStream] addChatMessage user falhou', e);
  }
}

/**
 * Hook canónico — Story 1.9 AC1 + AC2.
 *
 * Caller padrão (ChatPanel):
 *
 * ```tsx
 * const { submit, isStreaming, events, error } = useAgentStream();
 * <ChatInput onSubmit={submit} disabled={isStreaming} />
 * <MessageList events={events} />
 * {error && <ErrorBanner message={error} />}
 * ```
 */
export function useAgentStream(): UseAgentStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<ExecutorSSEEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Texto acumulado dos `text_delta` da run actual — usado para `persistAssistantMessage`.
  // ref em vez de state: evita rerender por cada delta (a UI consome `events` para mostrar streaming).
  const accumulatedTextRef = useRef<string>('');

  /**
   * Story 1.9 Iter 2 — Major #4 — AbortController para cancelar fetch+stream
   * em duplo submit ou unmount. Antes deste fix:
   *   - Click duplo no submit: dois streams simultâneos disputavam state +
   *     ambos persistiam side-effects Dexie em duplicado.
   *   - Unmount durante stream: stream continuava em background, persistia
   *     ChatMessage em conversation que já não está visível, e o reader
   *     `releaseLock` era chamado tarde.
   * Solução: AbortController guardado em ref; cada submit aborta o anterior
   * antes de iniciar; unmount aborta o último.
   */
  const controllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    // Aborta stream em curso antes de limpar state (evita race com setEvents)
    controllerRef.current?.abort();
    controllerRef.current = null;
    setIsStreaming(false);
    setCurrentRunId(null);
    setEvents([]);
    setError(null);
    accumulatedTextRef.current = '';
  }, []);

  // Cleanup automático no unmount — abort qualquer stream pendente.
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  /**
   * Processa um `ExecutorSSEEvent` já desserializado (vindo directamente do
   * AsyncGenerator do executor client-side — Story 1.11 ADR-9, não há mais
   * parsing de linhas `data:`). Side-effects de persistência Dexie acontecem
   * aqui — best-effort (ver doc do módulo).
   */
  const processEvent = useCallback(async (event: ExecutorSSEEvent): Promise<void> => {
    setEvents((prev) => [...prev, event]);

    // Acumular text_delta para ChatMessage final
    if (event.type === 'text_delta') {
      accumulatedTextRef.current += event.delta;
      return;
    }

    // Capturar runId do meta(start) para UI correlation
    if (event.type === 'meta' && event.phase === 'start') {
      setCurrentRunId(event.runId);
      await persistRunStart(event);
      return;
    }

    if (event.type === 'tool_complete') {
      await persistToolCall(event);
      return;
    }

    if (event.type === 'done') {
      await persistRunFinish(event);
      // Persistir ChatMessage do agente apenas em success/partial — failed
      // significa erro fatal sem resposta útil para guardar no histórico.
      if (event.status === 'success' || event.status === 'partial') {
        await persistAssistantMessage(event.runId, accumulatedTextRef.current);
      }
      return;
    }
  }, []);

  /**
   * Consome o AsyncGenerator do executor client-side (`runClientAgent`),
   * processando cada `ExecutorSSEEvent`. Story 1.11 (ADR-9): substitui o
   * antigo consumo de `Response.body` SSE — o executor corre no browser, logo
   * não há rede a parsear.
   *
   * `signal` aborta o consumo (duplo submit, unmount, `reset()`). Ao abortar,
   * chamamos `generator.return()` IMEDIATAMENTE via listener do signal — isto
   * interrompe um `await generator.next()` que esteja suspenso entre yields
   * (caso contrário o `for await` só reavaliaria `signal.aborted` no próximo
   * yield, deixando o abort pendurado enquanto o executor não produz eventos).
   * `.return()` corre o `finally` interno do transport (reader cleanup via
   * `releaseLock`). O guard `signal.aborted` no topo do loop cobre o caso de o
   * abort chegar entre yields já disponíveis.
   */
  const consumeAgent = useCallback(
    async (
      generator: AsyncGenerator<ExecutorSSEEvent>,
      signal: AbortSignal
    ): Promise<void> => {
      const onAbort = () => {
        // Interrompe um `next()` suspenso. `.catch` silencia se já terminou.
        void generator.return(undefined as never).catch(() => undefined);
      };
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
      try {
        for await (const event of generator) {
          if (signal.aborted) return;
          await processEvent(event);
        }
      } finally {
        signal.removeEventListener('abort', onAbort);
      }
    },
    [processEvent]
  );

  const submit = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim();
      if (trimmed.length === 0) return;

      // Story 1.9 Iter 2 — Major #4 — abortar qualquer run em curso antes de
      // iniciar nova. Duplo submit / submit-durante-run agora cancela a
      // anterior em vez de duplicar side-effects Dexie.
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const { signal } = controller;

      // Reset state do run anterior. Não usamos `reset()` aqui para evitar
      // race com setState batching — definimos directamente.
      setEvents([]);
      setError(null);
      setCurrentRunId(null);
      setIsStreaming(true);
      accumulatedTextRef.current = '';

      // Persistir mensagem do utilizador imediatamente — não bloqueia a run
      void persistUserMessage(trimmed);

      // Async IIFE — `submit` é fire-and-forget; UI observa state via hook.
      void (async () => {
        try {
          // Story 1.11 (ADR-9, AC4): conduz o executor no browser. Sem
          // confirmationProvider → auto-confirm (comportamento Story 1.5 e da
          // UI actual, que nunca wired o gate de confirmação). A
          // ANTHROPIC_API_KEY nunca entra no cliente — o transport fala com
          // o proxy Edge.
          const generator = runClientAgent(trimmed);
          await consumeAgent(generator, signal);
        } catch (e) {
          // AbortError é esperado em duplo submit / unmount — não mostra
          // erro ao utilizador (UX: foi intencional).
          if (signal.aborted || (e instanceof Error && e.name === 'AbortError')) {
            return;
          }
          setError(networkErrorMessage(e));
          console.error('[useAgentStream] submit falhou', e);
        } finally {
          // Só limpa isStreaming se o signal corresponde ao actual — evita
          // que um abort tardio limpe o flag de uma run posterior.
          if (controllerRef.current === controller) {
            setIsStreaming(false);
            controllerRef.current = null;
          }
        }
      })();
    },
    [consumeAgent]
  );

  return {
    submit,
    isStreaming,
    currentRunId,
    events,
    error,
    reset,
  };
}
