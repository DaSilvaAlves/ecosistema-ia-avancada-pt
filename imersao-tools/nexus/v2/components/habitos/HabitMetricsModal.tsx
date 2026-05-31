'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Habit, HabitLog } from '@/types/db';
import {
  getMonthlyEvolution,
  getMetricRecords,
  formatMetricValue,
} from '@/lib/habitos/metrics';
import { HabitMonthlyChart } from '@/components/habitos/HabitMonthlyChart';

/**
 * Nexus v2 — HabitMetricsModal (Story 4.4 — AC4, FR27)
 *
 * Modal de métricas de um hábito: registo de valor + evolução mensal + recordes.
 * Replica o padrão de modal do `HabitHeatmapModal` (4.3): focus trap, Escape,
 * `role="dialog"` + `aria-modal`, glassmorphism, fundo #04040A.
 *
 * 4 estados de render ([AUTO-DECISION] A2; `react-component-test-criteria.md` —
 * teste obrigatório):
 *   - Loading (`allLogs === undefined`): skeleton.
 *   - Sem histórico (`allLogs` sem logs com value): formulário aberto + recordes a 0.
 *   - Com histórico: gráfico mensal + recordes + formulário (se não registado hoje).
 *   - Já registado hoje: campo de registo desactivado com o valor de hoje.
 *
 * Idempotência (gotcha A1): a decisão de criar/actualizar/bloquear o log vive no
 * handler da page (`handleSubmitMetric`). O modal só recebe `onRegister(value)` e
 * decide localmente se mostra o formulário ou o estado "registado hoje" via
 * `todayLogs`.
 *
 * Design system: glassmorphism, Lime #39FF14 (CTA registar), Cyan #00F5FF (foco),
 * Grey #8892A4 (labels), Inter + JetBrains Mono (valores/unidades).
 */

interface HabitMetricsModalProps {
  habit: Habit;
  todayLogs: HabitLog[];
  /** Logs históricos para evolução + recordes. `undefined` ⇒ loading. */
  allLogs?: HabitLog[];
  /** `YYYY-MM-DD` de hoje (derivado uma vez na page, convenção UTC da 4.2/4.3). */
  todayISO: string;
  onClose: () => void;
  onRegister: (value: number) => Promise<void>;
}

export function HabitMetricsModal({
  habit,
  todayLogs,
  allLogs,
  todayISO,
  onClose,
  onRegister,
}: HabitMetricsModalProps): React.ReactElement {
  const unit = habit.metric?.unit ?? '';

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = 'habit-metrics-title';

  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Log de hoje deste hábito com `value` definido — define o estado "já registado".
  const todayLogWithValue = useMemo(
    () =>
      todayLogs.find(
        (log) => log.habitId === habit.id && log.value !== undefined,
      ),
    [todayLogs, habit.id],
  );

  // Agregações (memo — só recalculam quando os logs mudam). Vazias enquanto loading.
  const months = useMemo(
    () => (allLogs === undefined ? [] : getMonthlyEvolution(allLogs, todayISO)),
    [allLogs, todayISO],
  );
  const records = useMemo(
    () =>
      allLogs === undefined
        ? { bestDayValue: 0, bestMonthValue: 0, bestDayDate: '' }
        : getMetricRecords(allLogs),
    [allLogs],
  );

  // Foco inicial — só no mount (padrão HabitHeatmapModal: evita roubar o foco
  // quando o parent re-renderiza com `onClose` não-memoizado).
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Focus trap + Escape (WAI-ARIA) — padrão HabitHeatmapModal.
  useEffect(() => {
    function getFocusables(): HTMLElement[] {
      if (!modalRef.current) return [];
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

  const isLoading = allLogs === undefined;
  const alreadyRegisteredToday = todayLogWithValue !== undefined;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const parsed = Number(inputValue.trim().replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFormError('Introduz um valor numérico maior do que zero.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await onRegister(parsed);
      setInputValue('');
    } catch {
      setFormError('Erro ao registar o valor — tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  }

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
        data-testid="habit-metrics-modal"
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
            Métricas — {habit.name} ({unit})
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar métricas"
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

        {isLoading ? (
          <MetricsSkeleton />
        ) : (
          <>
            {/* Registo de valor — formulário OU estado "já registado hoje". */}
            {alreadyRegisteredToday ? (
              <div
                data-testid="metrics-registered-today"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0.7rem 1rem',
                  background: 'rgba(57, 255, 20, 0.08)',
                  border: '1px solid rgba(57, 255, 20, 0.25)',
                  borderRadius: 8,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.8rem',
                  color: '#39FF14',
                }}
              >
                Registado hoje: {formatMetricValue(todayLogWithValue.value!)}{' '}
                {unit}
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <label
                  htmlFor="metrics-value-input"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.8rem',
                    color: '#8892A4',
                  }}
                >
                  {unit} hoje
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="metrics-value-input"
                    type="text"
                    inputMode="decimal"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    aria-label={`Valor em ${unit} a registar hoje`}
                    aria-invalid={formError !== null ? 'true' : undefined}
                    style={{
                      flex: 1,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.9rem',
                      color: '#F0F4FF',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 6,
                      padding: '0.5rem 0.8rem',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#04040A',
                      background: '#39FF14',
                      border: 'none',
                      borderRadius: 6,
                      padding: '0.5rem 1.1rem',
                      cursor: submitting ? 'default' : 'pointer',
                      opacity: submitting ? 0.6 : 1,
                      boxShadow: '0 0 16px rgba(57, 255, 20, 0.35)',
                    }}
                  >
                    Registar
                  </button>
                </div>
                {formError !== null && (
                  <span
                    role="alert"
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.75rem',
                      color: '#FF006E',
                    }}
                  >
                    {formError}
                  </span>
                )}
              </form>
            )}

            {/* Recordes históricos. */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.72rem',
                color: '#8892A4',
              }}
            >
              <span data-testid="record-best-day">
                Melhor dia:{' '}
                <strong style={{ color: '#FFB800' }}>
                  {formatMetricValue(records.bestDayValue)} {unit}
                </strong>
                {records.bestDayDate !== '' && (
                  <> em {formatPtDate(records.bestDayDate)}</>
                )}
              </span>
              <span data-testid="record-best-month">
                Melhor mês:{' '}
                <strong style={{ color: '#FFB800' }}>
                  {formatMetricValue(records.bestMonthValue)} {unit}
                </strong>
              </span>
            </div>

            {/* Evolução mensal. */}
            <HabitMonthlyChart
              months={months}
              unit={unit}
              record={records.bestMonthValue}
            />
          </>
        )}
      </div>
    </div>
  );
}

/** `YYYY-MM-DD` → `DD/MM/YYYY` (PT-PT). */
function formatPtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function MetricsSkeleton(): React.ReactElement {
  return (
    <div
      data-testid="habit-metrics-skeleton"
      aria-busy="true"
      aria-label="A carregar métricas"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: i === 2 ? 120 : 40,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)',
            backgroundSize: '200% 100%',
            borderRadius: 8,
            animation: 'metrics-skeleton-pulse 1.6s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes metrics-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
