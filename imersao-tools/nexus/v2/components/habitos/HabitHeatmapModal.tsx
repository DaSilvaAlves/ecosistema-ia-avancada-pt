'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Habit } from '@/types/db';
import { useHabitLogs } from '@/hooks/useHabitLogs';
import { getLast6MonthsRange } from '@/lib/habitos/heatmap';
import { HabitHeatmap } from '@/components/habitos/HabitHeatmap';

/**
 * Nexus v2 — HabitHeatmapModal (Story 4.3 — AC5, FR26)
 *
 * Wrapper fino que abre o heatmap de um hábito. Calcula `todayISO` UMA vez,
 * obtém os logs dos últimos ~6 meses via `useHabitLogs(habit.id, range)` e
 * passa-os (com `todayISO`) ao `HabitHeatmap` presentacional ([AUTO-DECISION]
 * A2/A5). Replica o padrão de modal do `HabitFormModal` (Story 4.2): focus trap,
 * Escape, `role="dialog"` + `aria-modal`, glassmorphism, fundo #04040A.
 */

interface HabitHeatmapModalProps {
  habit: Habit;
  onClose: () => void;
}

export function HabitHeatmapModal({
  habit,
  onClose,
}: HabitHeatmapModalProps): React.ReactElement {
  // `todayISO` calculado uma só vez (mesma derivação UTC da Story 4.2) — evita
  // off-by-one entre "hoje" e os logs gravados ([AUTO-DECISION] A5).
  const [todayISO] = useState(() => new Date().toISOString().slice(0, 10));
  const range = useMemo(() => getLast6MonthsRange(todayISO), [todayISO]);
  const logs = useHabitLogs(habit.id, range);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = 'habit-heatmap-title';

  // Foco inicial — SÓ no mount. Separado do effect de keydown para não roubar o
  // foco quando o parent re-renderiza (a page passa `closeHeatmap` não-memoizado
  // como `onClose`, cuja identidade muda a cada update do `useLiveQuery`/`useHabits`).
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Focus trap + Escape (WAI-ARIA) — padrão HabitFormModal.
  useEffect(() => {
    function getFocusables(): HTMLElement[] {
      if (!modalRef.current) return [];
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = getFocusables();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4, 4, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="habit-heatmap-modal"
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: '1.5rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: 'calc(100vh - 32px)',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontFamily: 'Inter, sans-serif',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#F0F4FF',
              letterSpacing: '-0.01em',
            }}
          >
            Heatmap — {habit.name}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar heatmap"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#F0F4FF',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 6,
              padding: '0.45rem 0.9rem',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Fechar
          </button>
        </div>

        <HabitHeatmap logs={logs} todayISO={todayISO} metric={habit.metric} />
      </div>
    </div>
  );
}
