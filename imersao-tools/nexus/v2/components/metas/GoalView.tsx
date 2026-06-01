'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Flag } from 'lucide-react';
import type { Goal } from '@/types/db';
import { getGoalProgress, formatGoalDeadline } from '@/lib/metas/progress';
import { GoalProgressBar } from '@/components/metas/GoalProgressBar';
import { FormField, fieldInputStyle } from '@/components/ui/FormField';

/**
 * Nexus v2 — GoalView (Story 4.5 — AC7, FR40)
 *
 * Vista de detalhe de uma meta em modal glassmorphism: progress bar, milestones
 * com toggle, formulário de actualização do `current` + nota, histórico de
 * updates (`progressLog`) e botão "Marcar como Alcançada" (proposta — A4).
 *
 * 5 estados de render (`react-component-test-criteria.md` — teste obrigatório):
 *   - Loading (`goal === undefined`): skeleton.
 *   - Meta `numeric` em progresso (`current < target`, `status: active`):
 *     barra + milestones + form de update + histórico + "Marcar como Alcançada".
 *   - Meta `numeric` alcançada (`current >= target` ou `status: achieved`):
 *     barra 100% (Lime), milestones, histórico, sem form de update.
 *   - Meta `boolean` por alcançar (`status: active`): barra 0%, botão
 *     "Marcar como Alcançada" proeminente, sem campo numérico.
 *   - Meta `boolean` alcançada (`status: achieved`): barra 100%, badge, sem update.
 *
 * `todayISO` por prop (determinismo). Focus trap + Escape + `role="dialog"`.
 * `progressLog === undefined`/`[]` → "Sem histórico de actualizações" (gotcha
 * metas pré-4.5). Design system (`design-system-ia-avancada.md`).
 */

interface GoalViewProps {
  goal: Goal | null | undefined;
  todayISO: string;
  onUpdateProgress: (value: number, note?: string) => Promise<void>;
  onToggleMilestone: (milestoneIndex: number) => Promise<void>;
  onMarkAchieved: () => Promise<void>;
  onClose: () => void;
}

export function GoalView({
  goal,
  todayISO,
  onUpdateProgress,
  onToggleMilestone,
  onMarkAchieved,
  onClose,
}: GoalViewProps): React.ReactElement {
  const [progressValue, setProgressValue] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = 'goal-view-title';

  // Focus trap + Escape (WAI-ARIA Modal Authoring Practices) — padrão GoalFormModal.
  useEffect(() => {
    function getFocusables(): HTMLElement[] {
      if (!modalRef.current) return [];
      return Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    // Move o foco para dentro do dialog ao abrir (CR Iter 1 F3) — o primeiro
    // focável, ou o próprio container (tabIndex=-1) se o conteúdo for vazio
    // (ex.: estado loading sem botões). Padrão WAI-ARIA Modal.
    const focusables = getFocusables();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else {
      modalRef.current?.focus();
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

  // Estado loading: o goal ainda não chegou.
  if (goal === undefined) {
    return (
      <Overlay onClose={onClose}>
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-busy="true"
          aria-label="A carregar meta"
          data-testid="goal-view-loading"
          tabIndex={-1}
          style={modalBoxStyle}
        >
          <div
            style={{
              height: 120,
              background:
                'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
              backgroundSize: '200% 100%',
              borderRadius: 12,
              animation: 'goal-view-skeleton 1.6s ease-in-out infinite',
            }}
          />
          <style>{`
            @keyframes goal-view-skeleton {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
        </div>
      </Overlay>
    );
  }

  // Meta inexistente (apagada entretanto): fecha sem render.
  if (goal === null) {
    return (
      <Overlay onClose={onClose}>
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          style={modalBoxStyle}
        >
          <h2 id={titleId} style={titleStyle}>
            Meta não encontrada
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#8892A4', margin: 0 }}>
            Esta meta já não existe.
          </p>
          <CloseButton onClose={onClose} />
        </div>
      </Overlay>
    );
  }

  const progress = getGoalProgress(goal);
  const isNumeric = goal.type === 'numeric';
  const canUpdate = !progress.isAchieved && goal.status === 'active';

  async function handleUpdate(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (submitting) return;
    const value = Number(progressValue);
    if (progressValue.trim() === '' || Number.isNaN(value)) return;
    try {
      setSubmitting(true);
      await onUpdateProgress(value, progressNote.trim() === '' ? undefined : progressNote.trim());
      setProgressValue('');
      setProgressNote('');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMilestoneToggle(index: number): Promise<void> {
    if (submitting) return;
    try {
      setSubmitting(true);
      await onToggleMilestone(index);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAchieve(): Promise<void> {
    if (submitting) return;
    try {
      setSubmitting(true);
      await onMarkAchieved();
    } finally {
      setSubmitting(false);
    }
  }

  const log = goal.progressLog ?? [];

  return (
    <Overlay onClose={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="goal-view"
        tabIndex={-1}
        style={modalBoxStyle}
      >
        <h2 id={titleId} style={titleStyle}>
          {goal.title}
        </h2>
        {goal.description !== undefined && goal.description !== '' && (
          <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#8892A4' }}>
            {goal.description}
          </p>
        )}

        <GoalProgressBar
          percentage={progress.percentage}
          label={formatGoalDeadline(goal.deadline, todayISO)}
        />

        {/* Milestones */}
        {goal.milestones.length > 0 && (
          <section aria-label="Milestones" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SectionLabel>Milestones ({progress.milestonesReached}/{progress.milestonesTotal})</SectionLabel>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {goal.milestones.map((m, index) => (
                <li key={index} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleMilestoneToggle(index)}
                    disabled={submitting}
                    aria-pressed={m.reached}
                    aria-label={`${m.reached ? 'Desmarcar' : 'Marcar'} milestone ${m.note ?? m.at} como alcançado`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      flexShrink: 0,
                      color: m.reached ? '#04040A' : '#8892A4',
                      background: m.reached ? '#FFB800' : 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${m.reached ? '#FFB800' : 'rgba(255, 255, 255, 0.15)'}`,
                      borderRadius: 6,
                      cursor: submitting ? 'wait' : 'pointer',
                    }}
                  >
                    {m.reached && <Check size={13} />}
                  </button>
                  <span
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.85rem',
                      color: m.reached ? '#F0F4FF' : '#8892A4',
                      textDecoration: m.reached ? 'none' : 'none',
                    }}
                  >
                    {m.note ?? `Marco aos ${m.at}`}
                    {isNumeric && (
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: '#4A5568', marginLeft: 6 }}>
                        ({m.at})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Form de actualização do current (só numeric activa não-alcançada) */}
        {isNumeric && canUpdate && (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionLabel>Actualizar progresso</SectionLabel>
            <FormField id="goal-progress-value" label="Novo valor actual" required>
              <input
                id="goal-progress-value"
                type="number"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder={String(goal.current)}
                aria-required="true"
                style={fieldInputStyle()}
              />
            </FormField>
            <FormField id="goal-progress-note" label="Nota (opcional)">
              <input
                id="goal-progress-note"
                type="text"
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder="Ex: terminei mais um livro"
                style={fieldInputStyle()}
              />
            </FormField>
            <button
              type="submit"
              disabled={submitting}
              style={primaryButtonStyle(submitting)}
            >
              Actualizar
            </button>
          </form>
        )}

        {/* Botão Marcar como Alcançada (proposta — A4): activa não-alcançada */}
        {goal.status === 'active' && (
          <button
            type="button"
            onClick={handleAchieve}
            disabled={submitting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#04040A',
              background: '#39FF14',
              border: 'none',
              borderRadius: 6,
              padding: '0.6rem 1.2rem',
              cursor: submitting ? 'wait' : 'pointer',
              boxShadow: '0 0 16px rgba(57, 255, 20, 0.35)',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            <Flag size={15} /> Marcar como Alcançada
          </button>
        )}

        {/* Histórico de updates */}
        <section aria-label="Histórico de actualizações" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SectionLabel>Histórico</SectionLabel>
          {log.length === 0 ? (
            <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: '#4A5568', fontStyle: 'italic' }}>
              Sem histórico de actualizações.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...log].reverse().map((entry, index) => (
                <li
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.72rem',
                    color: '#8892A4',
                  }}
                >
                  <span style={{ color: '#4A5568' }}>{entry.date}</span>
                  <span style={{ color: '#00F5FF', fontWeight: 700 }}>{entry.value}</span>
                  {entry.note !== undefined && entry.note !== '' && (
                    <span style={{ fontFamily: 'Inter, sans-serif', color: '#8892A4' }}>{entry.note}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <CloseButton onClose={onClose} />
      </div>
    </Overlay>
  );
}

// ─── Sub-componentes presentacionais ───

function Overlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}): React.ReactElement {
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
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: '#8892A4',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}

function CloseButton({ onClose }: { onClose: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fechar"
      style={{
        alignSelf: 'flex-end',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: '#F0F4FF',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 6,
        padding: '0.5rem 1.1rem',
        cursor: 'pointer',
      }}
    >
      Fechar
    </button>
  );
}

const modalBoxStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 520,
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
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Inter, sans-serif',
  fontSize: '1.25rem',
  fontWeight: 800,
  color: '#F0F4FF',
  letterSpacing: '-0.01em',
};

function primaryButtonStyle(submitting: boolean): React.CSSProperties {
  return {
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#04040A',
    background: '#00F5FF',
    border: 'none',
    borderRadius: 6,
    padding: '0.55rem 1.2rem',
    cursor: submitting ? 'wait' : 'pointer',
    boxShadow: '0 0 12px rgba(0, 245, 255, 0.3)',
    opacity: submitting ? 0.7 : 1,
    alignSelf: 'flex-start',
  };
}
