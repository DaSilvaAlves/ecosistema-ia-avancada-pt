'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';
import { MessageList } from '@/components/chat/MessageList';
import { InputBox, type InputBoxStreamingState } from '@/components/chat/InputBox';
import { UndoToast } from '@/components/chat/UndoToast';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useConversationMessages } from '@/hooks/useChatMessages';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useSynthesisToggle } from '@/hooks/useSynthesisToggle';
import type { SynthesisToggleState } from '@/types/voice';

/**
 * Nexus v2 — ChatPanel (Story 0.4 + Story 1.9 AC4 + AC8)
 *
 * Container chat-first principal. Layout:
 *   - MessageList (scrollable, flex 1) — histórico Dexie + live stream events
 *   - InputBox (sticky bottom) — input always-visible com state-aware
 *   - UndoToast (fixed bottom, z-index 100) — quando há `undo_registered` SSE
 *
 * Trace canónico:
 * - Story 0.4 — base do layout (flex 1, calc(100vh - 56px))
 * - Story 1.9 AC4 — flow preview-required → POST /api/agent/confirm
 * - Story 1.9 AC5 — UndoToast empilhamento max 3 FIFO
 * - Story 1.9 AC8 — integração useAgentStream + Dexie persistence
 * - Front-end-spec §2.1 — chat ocupa flex 1, sidebar w-360px
 *
 * Layout preserved (Epic 0): este componente continua a ser invocado pelo
 * `app/(app)/page.tsx` que mantém Sidebar + Header. Story 1.9 NÃO toca o
 * `page.tsx` — apenas substitui o `onSend` placeholder pela ligação real ao
 * agente via `useAgentStream`.
 */

const MAX_STACKED_TOASTS = 3;

interface PendingPreview {
  runId: string;
  toolName: string;
}

interface ActiveUndoToast {
  runId: string;
  undoableToolCount: number;
  expiresAt: number;
}

interface PreviewError {
  runId: string;
  toolName: string;
  message: string;
}

export function ChatPanel(): ReactElement {
  const stream = useAgentStream();
  const persistedMessages = useConversationMessages();

  // Story 7.4 (FR80) — síntese de voz da SAÍDA do cérebro.
  // - `synthesis` encapsula `SpeechSynthesisUtterance` (`speak`/`cancel`/`isSupported`).
  // - `synthesisToggle` é a preferência on/off persistida em `localStorage`
  //   (D-7.4-TOGGLE, OFF por omissão).
  const synthesis = useSpeechSynthesis();
  const synthesisToggle = useSynthesisToggle();

  // D-7.4-SOURCE (Opção A): acumulador LOCAL do texto dos `text_delta` da run
  // activa — padrão de `accumulatedTextRef` do `useAgentStream` (NÃO exposto, é
  // interno ao hook; aqui acumula-se localmente, open-closed). Limpo antes de
  // cada `stream.submit` (R1) e lido ao receber `done`.
  const synthesisTextRef = useRef<string>('');
  // runId já sintetizado — impede o `done` de disparar `speak` mais do que uma
  // vez (o efeito que observa `stream.events` corre a cada novo evento).
  const spokenRunIdRef = useRef<string | null>(null);

  const [pendingPreview, setPendingPreview] = useState<PendingPreview | null>(null);
  const [undoToasts, setUndoToasts] = useState<ActiveUndoToast[]>([]);
  // Story 1.9 Iter 2 — Minor #4 — surface erro do POST /api/agent/confirm
  // em vez de silenciar 4xx/5xx. UX agora vê toast/banner e pode reagir.
  const [previewError, setPreviewError] = useState<PreviewError | null>(null);

  /**
   * Story 1.9 Iter 2 — Major #1 — dedup stream/persisted.
   *
   * O `useAgentStream` persiste a `ChatMessage` do agente em Dexie quando
   * recebe `done` com status `success`/`partial`. Mas `stream.events`
   * permanece populado (o text_delta acumulado mantém-se como live bubble)
   * até o caller chamar `reset()`. Isto causaria render duplicado: a mensagem
   * persistida já lá está + o live bubble construído a partir dos events.
   *
   * Solução: filtrar `persistedMessages` removendo qualquer message cujo
   * `agentRunId` corresponda à `currentRunId` ENQUANTO `stream.events` ainda
   * contém eventos para esse run. Quando `currentRunId === null` (reset
   * chamado ou nunca houve submit), todas as persistidas aparecem.
   *
   * Nota: a UX preferível é ler primeiro do live (porque é a UI activa);
   * persistidas só aparecem após reset ou nova run.
   */
  const dedupedMessages = useMemo(() => {
    if (persistedMessages === undefined) return undefined;
    if (stream.currentRunId === null) return persistedMessages;
    return persistedMessages.filter(
      (m) => m.agentRunId !== stream.currentRunId
    );
  }, [persistedMessages, stream.currentRunId]);

  // Detectar `preview_request` na stream → marcar input como preview-pending
  useEffect(() => {
    if (stream.events.length === 0) return;
    const last = stream.events[stream.events.length - 1];
    if (last.type === 'preview_request') {
      setPendingPreview({ runId: last.runId, toolName: last.toolName });
    } else if (last.type === 'preview_confirmed' || last.type === 'tool_complete' || last.type === 'tool_error') {
      // Limpar pending se for o mesmo runId+toolName
      setPendingPreview((prev) =>
        prev && 'toolName' in last && prev.runId === last.runId && prev.toolName === last.toolName
          ? null
          : prev
      );
    }
  }, [stream.events]);

  // Detectar `undo_registered` → adicionar toast (FIFO max 3).
  //
  // Story 1.12 (ADR-9): no fluxo client-side REAL o executor emite
  // `undo_registered` ANTES de `done` (executor.ts:757) — logo o ÚLTIMO evento
  // do stream é `done`, não `undo_registered`. A versão Story 1.9 inspeccionava
  // apenas `events[length-1]` e nunca via o `undo_registered` (tech-debt
  // registado na 1.10; reexposto pela re-rota da Story 1.12). Gate §6 follow-up
  // #3: itera TODOS os `undo_registered` (dedupe por runId) em vez de só o último.
  useEffect(() => {
    const undoEvents = stream.events.filter(
      (e): e is Extract<ExecutorSSEEvent, { type: 'undo_registered' }> =>
        e.type === 'undo_registered'
    );
    if (undoEvents.length === 0) return;

    setUndoToasts((prev) => {
      // Dedupe por runId, preservando ordem de inserção (FIFO).
      const byRun = new Map<string, ActiveUndoToast>(prev.map((t) => [t.runId, t]));
      for (const e of undoEvents) {
        byRun.set(e.runId, {
          runId: e.runId,
          undoableToolCount: e.undoableToolCount,
          expiresAt: e.expiresAt,
        });
      }
      const next = Array.from(byRun.values());
      return next.length > MAX_STACKED_TOASTS
        ? next.slice(next.length - MAX_STACKED_TOASTS)
        : next;
    });
  }, [stream.events]);

  // Story 7.4 (FR80) — D-7.4-SOURCE + D-7.4-TRIGGER.
  // Observa `stream.events`: acumula o texto dos `text_delta` e, ao receber
  // `done` com status `success`/`partial`, lê a resposta em voz alta SE o toggle
  // estiver ON (AC2). Toggle OFF → nenhuma síntese (AC2). `spokenRunIdRef`
  // garante que cada run é falada no máximo uma vez (o efeito re-corre a cada
  // novo evento da stream).
  useEffect(() => {
    if (stream.events.length === 0) return;

    // Reconstrói o texto acumulado da run a partir dos `text_delta` (idempotente:
    // `stream.events` é o array completo da run em ordem de chegada).
    synthesisTextRef.current = stream.events
      .filter(
        (e): e is Extract<ExecutorSSEEvent, { type: 'text_delta' }> =>
          e.type === 'text_delta'
      )
      .map((e) => e.delta)
      .join('');

    const last = stream.events[stream.events.length - 1];
    if (last.type !== 'done') return;
    if (last.status !== 'success' && last.status !== 'partial') return;
    // AC2: só sintetiza com o toggle ON. OFF → não fala — e NÃO marca a run como
    // falada. Marcar aqui (antes do check do toggle) impediria erradamente a
    // leitura se o utilizador ligasse o toggle enquanto este `done` ainda é o
    // último evento; o estado inicial do toggle (OFF por omissão) é reconciliado
    // com o `localStorage` num efeito posterior, pelo que o primeiro passe deste
    // efeito vê `enabled=false` mesmo quando a preferência persistida é ON.
    if (!synthesisToggle.enabled) return;
    // Já falámos esta run? (o efeito corre a cada evento; o `done` é estável).
    if (spokenRunIdRef.current === last.runId) return;
    spokenRunIdRef.current = last.runId;

    synthesis.speak(synthesisTextRef.current);
  }, [stream.events, synthesisToggle.enabled, synthesis]);

  const handleSend = useCallback(
    (text: string) => {
      // Story 7.4 — ordem R1 (PO): cancelar síntese em curso (AC3) → limpar o
      // acumulador (evitar que `text_delta` de uma run anterior contamine a
      // próxima) → iniciar a nova run.
      synthesis.cancel();
      synthesisTextRef.current = '';
      stream.submit(text);
    },
    [stream, synthesis]
  );

  // Story 1.9 Iter 2 — Minor #4 — não silenciar 4xx/5xx do confirm endpoint.
  // Antes: catch silencioso + setPendingPreview(null) sempre → UX pensa que
  // foi confirmado mesmo quando o servidor rejeitou. Agora: erro fica visível
  // e `pendingPreview` mantém-se até resolução.
  const handleConfirmPreview = useCallback(
    async (runId: string, toolName: string) => {
      try {
        const res = await fetch('/api/agent/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId, toolName, action: 'confirm' }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          console.error('[ChatPanel] confirm preview falhou', res.status, detail);
          setPreviewError({
            runId,
            toolName,
            message: `Erro ao confirmar acção (HTTP ${res.status}). Tenta de novo.`,
          });
          return; // NÃO limpa pendingPreview — utilizador pode tentar de novo
        }
        setPreviewError(null);
        setPendingPreview(null);
      } catch (e) {
        console.error('[ChatPanel] confirm preview falhou', e);
        setPreviewError({
          runId,
          toolName,
          message: 'Erro de rede ao confirmar acção. Tenta de novo.',
        });
      }
    },
    []
  );

  const handleCancelPreview = useCallback(
    async (runId: string, toolName: string) => {
      try {
        const res = await fetch('/api/agent/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId, toolName, action: 'cancel' }),
        });
        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          console.error('[ChatPanel] cancel preview falhou', res.status, detail);
          setPreviewError({
            runId,
            toolName,
            message: `Erro ao cancelar acção (HTTP ${res.status}). Tenta de novo.`,
          });
          return; // NÃO limpa pendingPreview
        }
        setPreviewError(null);
        setPendingPreview(null);
      } catch (e) {
        console.error('[ChatPanel] cancel preview falhou', e);
        setPreviewError({
          runId,
          toolName,
          message: 'Erro de rede ao cancelar acção. Tenta de novo.',
        });
      }
    },
    []
  );

  const dismissUndoToast = useCallback((runId: string) => {
    setUndoToasts((prev) => prev.filter((t) => t.runId !== runId));
  }, []);

  const streamingState: InputBoxStreamingState = useMemo(() => {
    if (pendingPreview !== null) return 'preview-pending';
    if (stream.isStreaming) return 'streaming';
    return 'idle';
  }, [pendingPreview, stream.isStreaming]);

  // Story 7.4 (FR80) — estado de render do toggle de síntese (AC1/AC5):
  // `unsupported` se o browser não suporta `SpeechSynthesis`; senão `active`/
  // `idle` conforme a preferência persistida.
  const synthesisState: SynthesisToggleState = useMemo(() => {
    if (!synthesis.isSupported) return 'unsupported';
    return synthesisToggle.enabled ? 'active' : 'idle';
  }, [synthesis.isSupported, synthesisToggle.enabled]);

  return (
    <section
      aria-label="Chat principal"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 56px)',
        position: 'relative',
      }}
    >
      <MessageList
        messages={dedupedMessages}
        events={stream.events}
        isStreaming={stream.isStreaming}
        onConfirmPreview={handleConfirmPreview}
        onCancelPreview={handleCancelPreview}
      />

      {stream.error && (
        <div
          role="alert"
          style={{
            margin: '0 24px 8px',
            padding: '8px 12px',
            background: 'rgba(255,0,110,0.08)',
            border: '1px solid rgba(255,0,110,0.4)',
            borderRadius: 8,
            color: '#FF006E',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
          }}
        >
          {stream.error}
        </div>
      )}

      {previewError && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            margin: '0 24px 8px',
            padding: '8px 12px',
            background: 'rgba(255,0,110,0.08)',
            border: '1px solid rgba(255,0,110,0.4)',
            borderRadius: 8,
            color: '#FF006E',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.85rem',
          }}
        >
          {previewError.message}
        </div>
      )}

      <InputBox
        onSend={handleSend}
        streamingState={streamingState}
        synthesisState={synthesisState}
        onSynthesisToggle={synthesisToggle.toggle}
      />

      {undoToasts.map((toast) => (
        <UndoToast
          key={toast.runId}
          runId={toast.runId}
          undoableToolCount={toast.undoableToolCount}
          expiresAt={toast.expiresAt}
          onUndoSuccess={() => dismissUndoToast(toast.runId)}
          onDismiss={() => dismissUndoToast(toast.runId)}
        />
      ))}
    </section>
  );
}
