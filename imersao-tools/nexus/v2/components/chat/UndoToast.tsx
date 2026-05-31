'use client';

import { Undo2, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { UNDO_TTL_SECONDS } from '@/lib/agent/undo';
import { clientUndoStore } from '@/lib/agent/client-undo-store';
import { markRunReverted } from '@/lib/db/repos/agent-runs';

/**
 * Nexus v2 — UndoToast component (Story 1.9 AC5 + AC9)
 *
 * Toast bottom-center com countdown 30s para anular toda a run agente.
 *
 * Trace canónico:
 * - Front-end-spec §4.3 — countdown progress bar Cyan, hover-pause, botão "Anular"
 * - Story 1.9 AC5 — comportamentos (markRunReverted, toasts feedback, empilhamento max 3 FIFO)
 * - Story 1.9 AC9 — `role="alert"`, `aria-live="polite"`, `aria-valuenow/max`,
 *   countdown progress bar acessível
 * - Story 1.7 — `UNDO_TTL_SECONDS = 30`
 * - Story 1.12 (ADR-9, A4 — Phase 2): reverte via `clientUndoStore.undo(runId)`
 *   (browser + Dexie real), substituindo o antigo `fetch('/api/agent/undo')`
 *   (endpoint Edge morto na Phase 1). Ver `lib/agent/client-undo-store.ts`.
 * - PRD §6.1 FR6 + Epic 1 AC4
 *
 * Renderizado pelo `ChatPanel` quando o `useAgentStream` recebe `undo_registered`
 * SSE event para a run actual (executor.ts L599-602 emite este evento ANTES de
 * `done` quando há tool calls reversíveis bem-sucedidas).
 *
 * Comportamento de empilhamento (AC5): o caller (`ChatPanel`) pode renderizar
 * múltiplos `UndoToast` em paralelo se houver múltiplas runs com undo activo
 * — cada toast gere o seu próprio countdown. O caller é responsável por
 * limitar a 3 simultâneos (FIFO) — este componente não impõe esse limite.
 *
 * Hover pause (front-end-spec §4.3): durante hover, o countdown pára. Implementado
 * via state `paused` que pausa o `setInterval`.
 */

export interface UndoToastProps {
  /** runId do AgentRun a anular — usado em `POST /api/agent/undo`. */
  runId: string;
  /** Número de tool calls reversíveis (vem de `undo_registered.undoableToolCount`). */
  undoableToolCount: number;
  /** Epoch ms quando a janela undo expira (vem de `undo_registered.expiresAt`). */
  expiresAt: number;
  /** Callback ao clicar "Anular" com sucesso (200) — caller pode actualizar UI. */
  onUndoSuccess?: (revertedCount: number) => void;
  /** Callback quando o toast desaparece (timeout, undo bem-sucedido, ou close). */
  onDismiss?: () => void;
}

type FeedbackToastKind = 'success' | 'error' | 'expired';

interface FeedbackToast {
  kind: FeedbackToastKind;
  message: string;
}

/**
 * Tick do countdown — 100ms para animação fluida do progress bar.
 * Story 1.10 pode ajustar via NFR de performance.
 */
const TICK_MS = 100;

/**
 * Tempo de feedback toast (success/error) antes de desaparecer.
 * Front-end-spec §4.3 — 4s sem countdown.
 */
const FEEDBACK_TIMEOUT_MS = 4000;

export function UndoToast(props: UndoToastProps): ReactElement | null {
  const { runId, undoableToolCount, expiresAt, onUndoSuccess, onDismiss } = props;
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, expiresAt - Date.now())
  );
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackToast | null>(null);

  // Persist refs para o setInterval ler estado actual sem closure stale
  const pausedRef = useRef(paused);
  const dismissedRef = useRef(dismissed);
  pausedRef.current = paused;
  dismissedRef.current = dismissed;

  // Story 1.9 Iter 2 — Nitpick N1 — `onDismissRef` para o useEffect não
  // depender da identidade de `onDismiss` (parent re-render reiniciava o
  // timer porque a callback era nova). Pattern já usado para `pausedRef`.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Countdown interval
  useEffect(() => {
    if (feedback !== null) return; // feedback toast tem timer próprio
    if (dismissed) return;

    const interval = setInterval(() => {
      if (pausedRef.current || dismissedRef.current) return;
      const left = Math.max(0, expiresAt - Date.now());
      setRemainingMs(left);
      if (left === 0) {
        setDismissed(true);
        onDismissRef.current?.();
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [expiresAt, dismissed, feedback]);

  // Feedback toast auto-dismiss
  useEffect(() => {
    if (feedback === null) return;
    const timeout = setTimeout(() => {
      setFeedback(null);
      setDismissed(true);
      onDismissRef.current?.();
    }, FEEDBACK_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [feedback]);

  async function handleUndo(): Promise<void> {
    if (busy || dismissed) return;
    setBusy(true);

    try {
      // Story 1.12 (ADR-9, A4 — Phase 2): reverte via `clientUndoStore` no
      // browser (memória + Dexie real), em vez de `fetch('/api/agent/undo')`
      // (endpoint do fluxo Edge morto na Phase 1 — undo estava desligado em
      // produção). O store reverte cada tool call em ordem reversa via
      // `tool.reverse(args, result, ctx)` com o Dexie real.
      const result = await clientUndoStore.undo(runId);

      if (result.status === 'expired') {
        setFeedback({
          kind: 'expired',
          message: 'Já não é possível anular — 30s expirados',
        });
        return;
      }

      // markRunReverted Dexie (AC5) — best-effort, não bloqueia UI. Marca o
      // agent_run como 'reverted' (consumido pelo assert E2E da regressão).
      try {
        await markRunReverted(runId);
      } catch (e) {
        console.error('[UndoToast] markRunReverted falhou', e);
      }

      onUndoSuccess?.(result.reverted);
      setFeedback({
        kind: 'success',
        message: `Anulado · ${result.reverted} ${result.reverted === 1 ? 'acção revertida' : 'acções revertidas'}`,
      });
    } catch (e) {
      console.error('[UndoToast] handleUndo falhou', e);
      setFeedback({
        kind: 'error',
        message: 'Erro ao anular — tenta de novo',
      });
    } finally {
      setBusy(false);
    }
  }

  if (dismissed && feedback === null) return null;

  // Feedback toast — aparece após undo (success/error/expired)
  if (feedback !== null) {
    const colorMap: Record<FeedbackToastKind, string> = {
      success: '#39FF14',
      error: '#FF006E',
      expired: '#FF006E',
    };
    const borderColor = colorMap[feedback.kind];
    const bgColor =
      feedback.kind === 'success' ? 'rgba(57,255,20,0.08)' : 'rgba(255,0,110,0.08)';

    return (
      <div
        role="alert"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: 12,
          padding: '12px 18px',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: '#F0F4FF',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          fontWeight: 600,
          zIndex: 100,
          minWidth: 280,
          textAlign: 'center',
        }}
      >
        {feedback.message}
      </div>
    );
  }

  const totalMs = UNDO_TTL_SECONDS * 1000;
  const progressPct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="undo-toast"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,245,255,0.08)',
        border: '1px solid rgba(0,245,255,0.3)',
        borderRadius: 12,
        padding: '12px 18px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: '#F0F4FF',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.9rem',
        zIndex: 100,
        minWidth: 320,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {undoableToolCount} {undoableToolCount === 1 ? 'acção criada' : 'acções criadas'}.
          {' '}Anular tudo?
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleUndo}
            disabled={busy}
            aria-label={`Anular ${undoableToolCount} ${
              undoableToolCount === 1 ? 'acção' : 'acções'
            }`}
            style={{
              background: 'transparent',
              color: '#00F5FF',
              border: '1px solid #00F5FF',
              borderRadius: 6,
              padding: '6px 12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: busy ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: busy ? 0.6 : 1,
              transition: '0.2s',
            }}
          >
            <Undo2 size={14} aria-hidden />
            Anular
          </button>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            aria-label="Fechar toast de anulação"
            style={{
              background: 'transparent',
              color: '#8892A4',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>

      {/* Progress bar 3px Cyan */}
      <div
        role="progressbar"
        aria-valuenow={remainingSeconds}
        aria-valuemax={UNDO_TTL_SECONDS}
        aria-valuemin={0}
        aria-label={`Tempo restante para anular: ${remainingSeconds} segundos`}
        style={{
          height: 3,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background: '#00F5FF',
            transition: paused ? 'none' : `width ${TICK_MS}ms linear`,
          }}
        />
      </div>
    </div>
  );
}
