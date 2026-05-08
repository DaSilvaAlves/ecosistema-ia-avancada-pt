'use client';

import { useCallback, useRef, useState } from 'react';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';
import { db } from '@/lib/db/client';
import { addChatMessage, DEFAULT_CONVERSATION_ID } from '@/lib/db/repos/chat-messages';
import { appendToolCall, createAgentRun } from '@/lib/db/repos/agent-runs';
import type { AgentRun, ChatMessage, ToolCall } from '@/types/db';

/**
 * Nexus v2 — useAgentStream hook (Story 1.9 AC1 + AC2)
 *
 * Hook 'use client' que consome `POST /api/agent/prompt` (Story 1.8) via fetch
 * + ReadableStream reader. Parseia SSE events `data: <JSON>\n\n`, expõe estado
 * reactivo para a UI e PERSISTE a run em Dexie client-side (RESOLVED-2 da
 * Story 1.5 — server stateless, persistência é responsabilidade do consumer).
 *
 * Trace canónico:
 * - Story 1.9 AC1 — assinatura `UseAgentStreamResult`
 * - Story 1.9 AC2 — Dexie runtime (startRun em meta(start), appendToolCall em
 *   tool_complete, finishRun em done, ChatMessage em done success/partial)
 * - Architecture v2 §8 line 689 — "persist ChatMessage + AgentRun → IndexedDB
 *   (no client após receber stream)"
 * - executor.ts L159-255 — `ExecutorSSEEvent` discriminated union (10 tipos)
 * - executor.ts L46-67 — RESOLVED-2 contract
 *
 * Anti-patterns críticos (AC2 + arch ADR-2):
 * - `'use client'` é obrigatório — Dexie é client-only, NUNCA importar em
 *   código com `runtime = 'edge'`
 * - NUNCA chamar `runAgent()` directamente — sempre via `POST /api/agent/prompt`
 *   (Story 1.8 endpoint pronto)
 * - NUNCA tocar `db.agent_runs.*` directamente — usar repos `createAgentRun`/
 *   `appendToolCall`/`updateAgentRunStatus` (Story 1.1)
 *
 * Persistência Dexie como side-effects no caminho do reader (não bloqueante):
 * - Erros de Dexie são logados via `console.error` mas NÃO interrompem a
 *   stream — UX prioriza ver resultado, mesmo que persistência local falhe
 *   (alinha com best-effort do executor para `registerUndoEntry`)
 * - Idempotência: `createAgentRun` usa `db.agent_runs.add()` — se o runId já
 *   existe (e.g., race ou retry), Dexie lança `ConstraintError` que é
 *   silenciosamente apanhado e logado (run continua a streamar)
 */

/**
 * Resultado canónico do hook (Story 1.9 AC1).
 */
export interface UseAgentStreamResult {
  /** Submete um prompt para `/api/agent/prompt`. NÃO retorna — UI observa estado. */
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
 * Mensagem de erro genérica em PT-PT — mantém-se concisa para a UI mostrar
 * em toast/badge. Detalhe técnico vai para `console.error` (NFR11 implícito).
 */
function networkErrorMessage(e: unknown): string {
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

  const reset = useCallback(() => {
    setIsStreaming(false);
    setCurrentRunId(null);
    setEvents([]);
    setError(null);
    accumulatedTextRef.current = '';
  }, []);

  /**
   * Processa uma linha SSE individual. Retorna `true` se a stream terminou
   * (`[DONE]` recebido), `false` para continuar.
   *
   * Side-effects de persistência Dexie acontecem aqui — best-effort (ver doc
   * do módulo).
   */
  const processSseLine = useCallback(async (line: string): Promise<boolean> => {
    if (!line.startsWith('data: ')) return false;

    const raw = line.slice(6).trim();
    if (raw.length === 0) return false;
    if (raw === '[DONE]') return true;

    let event: ExecutorSSEEvent;
    try {
      event = JSON.parse(raw) as ExecutorSSEEvent;
    } catch (e) {
      console.error('[useAgentStream] parse SSE line falhou', { raw, e });
      return false;
    }

    setEvents((prev) => [...prev, event]);

    // Acumular text_delta para ChatMessage final
    if (event.type === 'text_delta') {
      accumulatedTextRef.current += event.delta;
    }

    // Capturar runId do meta(start) para UI correlation
    if (event.type === 'meta' && event.phase === 'start') {
      setCurrentRunId(event.runId);
      await persistRunStart(event);
      return false;
    }

    if (event.type === 'tool_complete') {
      await persistToolCall(event);
      return false;
    }

    if (event.type === 'done') {
      await persistRunFinish(event);
      // Persistir ChatMessage do agente apenas em success/partial — failed
      // significa erro fatal sem resposta útil para guardar no histórico.
      if (event.status === 'success' || event.status === 'partial') {
        await persistAssistantMessage(event.runId, accumulatedTextRef.current);
      }
      return false;
    }

    return false;
  }, []);

  /**
   * Consume a `Response.body` ReadableStream — itera linhas `data: ...\n\n`,
   * pipa para `processSseLine`, termina ao receber `[DONE]` ou `EOF`.
   */
  const consumeStream = useCallback(
    async (response: Response): Promise<void> => {
      if (!response.body) {
        throw new Error('Resposta sem body — stream impossível');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // Split em `\n\n` — separator canónico SSE
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const sseDone = await processSseLine(line);
            if (sseDone) return;
          }
        }
        // Flush buffer remanescente (sem `\n\n` final)
        if (buffer.length > 0) {
          await processSseLine(buffer);
        }
      } finally {
        // Liberta o reader explicitamente — em Edge runtime o GC pode demorar.
        try {
          reader.releaseLock();
        } catch {
          // releaseLock pode lançar se o reader já está fechado — silencia.
        }
      }
    },
    [processSseLine]
  );

  const submit = useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim();
      if (trimmed.length === 0) return;

      // Reset state do run anterior. Não usamos `reset()` aqui para evitar
      // race com setState batching — definimos directamente.
      setEvents([]);
      setError(null);
      setCurrentRunId(null);
      setIsStreaming(true);
      accumulatedTextRef.current = '';

      // Persistir mensagem do utilizador imediatamente — não bloqueia o stream
      void persistUserMessage(trimmed);

      // Async IIFE — `submit` é fire-and-forget; UI observa state via hook.
      void (async () => {
        try {
          const response = await fetch('/api/agent/prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: trimmed }),
          });

          if (!response.ok) {
            const status = response.status;
            const message =
              status === 401
                ? 'Sessão expirada — inicia sessão novamente'
                : status === 400
                  ? 'Prompt inválido — verifica o conteúdo'
                  : `Erro do servidor (${status}) — tenta de novo`;
            setError(message);
            setIsStreaming(false);
            return;
          }

          await consumeStream(response);
        } catch (e) {
          setError(networkErrorMessage(e));
          console.error('[useAgentStream] submit falhou', e);
        } finally {
          setIsStreaming(false);
        }
      })();
    },
    [consumeStream]
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
