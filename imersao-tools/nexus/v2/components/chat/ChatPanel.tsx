'use client';

import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { MessageList } from './MessageList';
import { InputBox, type InputBoxStreamingState } from './InputBox';
import { UndoToast } from './UndoToast';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useConversationMessages } from '@/hooks/useChatMessages';

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

export function ChatPanel(): ReactElement {
  const stream = useAgentStream();
  const persistedMessages = useConversationMessages();

  const [pendingPreview, setPendingPreview] = useState<PendingPreview | null>(null);
  const [undoToasts, setUndoToasts] = useState<ActiveUndoToast[]>([]);

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

  // Detectar `undo_registered` → adicionar toast (FIFO max 3)
  useEffect(() => {
    if (stream.events.length === 0) return;
    const last = stream.events[stream.events.length - 1];
    if (last.type !== 'undo_registered') return;

    const newToast: ActiveUndoToast = {
      runId: last.runId,
      undoableToolCount: last.undoableToolCount,
      expiresAt: last.expiresAt,
    };
    setUndoToasts((prev) => {
      // Dedupe — mesmo runId não duplica
      const filtered = prev.filter((t) => t.runId !== newToast.runId);
      const next = [...filtered, newToast];
      // FIFO: descarta o mais antigo se exceder max
      if (next.length > MAX_STACKED_TOASTS) {
        return next.slice(next.length - MAX_STACKED_TOASTS);
      }
      return next;
    });
  }, [stream.events]);

  const handleSend = useCallback(
    (text: string) => {
      stream.submit(text);
    },
    [stream]
  );

  const handleConfirmPreview = useCallback(
    async (runId: string, toolName: string) => {
      try {
        await fetch('/api/agent/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId, toolName, action: 'confirm' }),
        });
        setPendingPreview(null);
      } catch (e) {
        console.error('[ChatPanel] confirm preview falhou', e);
      }
    },
    []
  );

  const handleCancelPreview = useCallback(
    async (runId: string, toolName: string) => {
      try {
        await fetch('/api/agent/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ runId, toolName, action: 'cancel' }),
        });
        setPendingPreview(null);
      } catch (e) {
        console.error('[ChatPanel] cancel preview falhou', e);
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
        messages={persistedMessages}
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

      <InputBox onSend={handleSend} streamingState={streamingState} />

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
