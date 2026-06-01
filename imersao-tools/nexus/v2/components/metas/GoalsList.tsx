'use client';

import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { Goal } from '@/types/db';
import { getGoalProgress, formatGoalDeadline } from '@/lib/metas/progress';
import { GoalProgressBar } from '@/components/metas/GoalProgressBar';

/**
 * Nexus v2 — GoalsList (Story 4.5 — AC6, FR39/FR40)
 *
 * Lista reactiva de metas com acções contextuais. Componente apresentacional
 * (recebe dados e callbacks do parent — repo isolation mantido na page, padrão
 * `RemindersList` da Story 4.6 e `HabitsList` da 4.2).
 *
 * 4 estados de render (`react-component-test-criteria.md` — teste obrigatório):
 *   - Loading (`goals === undefined`): skeleton.
 *   - Vazio (`goals.length === 0`): empty state com CTA contextual.
 *   - Lista: cada linha mostra título, tipo, `GoalProgressBar`, prazo formatado,
 *     badge de status + acções Ver / Editar / Apagar.
 *   - Meta alcançada: progress bar a 100% (Lime) + badge "Alcançada".
 *
 * `todayISO` recebido por prop (determinismo — calculado uma vez na page, padrão
 * dos helpers de hábitos). Design system (`design-system-ia-avancada.md`).
 */

interface GoalsListProps {
  goals: Goal[] | undefined;
  /** Data de hoje em `YYYY-MM-DD` UTC (para `formatGoalDeadline`). */
  todayISO: string;
  onCreateFirst: () => void;
  onView: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goal: Goal) => void;
}

/** Etiqueta + cor PT-PT por status (não-só-cor: texto sempre presente). */
const STATUS_BADGE: Record<Goal['status'], { label: string; color: string }> = {
  active: { label: 'Activa', color: '#00F5FF' },
  achieved: { label: 'Alcançada', color: '#39FF14' },
  cancelled: { label: 'Cancelada', color: '#8892A4' },
};

export function GoalsList({
  goals,
  todayISO,
  onCreateFirst,
  onView,
  onEdit,
  onDelete,
}: GoalsListProps): React.ReactElement {
  if (goals === undefined) {
    return <LoadingSkeleton label="A carregar metas" />;
  }

  if (goals.length === 0) {
    return <EmptyState onCreateFirst={onCreateFirst} />;
  }

  return (
    <ul
      style={{
        listStyle: 'none',
        margin: '0 1.5rem 1.5rem',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {goals.map((goal) => {
        const progress = getGoalProgress(goal);
        const badge = STATUS_BADGE[goal.status];
        return (
          <li
            key={goal.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: '0.9rem 1.1rem',
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              backdropFilter: 'blur(12px)',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#F0F4FF',
                  }}
                >
                  {goal.title}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.62rem',
                    color: '#8892A4',
                  }}
                >
                  <span
                    style={{
                      color: badge.color,
                      background: `${badge.color}14`,
                      border: `1px solid ${badge.color}40`,
                      borderRadius: 20,
                      padding: '0.15rem 0.5rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                    }}
                  >
                    {badge.label}
                  </span>
                  <span>{goal.type === 'numeric' ? 'Numérica' : 'Booleana'}</span>
                  {goal.type === 'numeric' && (
                    <span>
                      {goal.current}/{goal.target}
                    </span>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <IconButton label={`Ver "${goal.title}"`} onClick={() => onView(goal)} color="#00F5FF">
                  <Eye size={16} />
                </IconButton>
                <IconButton label={`Editar "${goal.title}"`} onClick={() => onEdit(goal)} color="#FFB800">
                  <Pencil size={16} />
                </IconButton>
                <IconButton label={`Apagar "${goal.title}"`} onClick={() => onDelete(goal)} color="#FF006E">
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </div>

            <GoalProgressBar
              percentage={progress.percentage}
              label={formatGoalDeadline(goal.deadline, todayISO)}
            />
          </li>
        );
      })}
    </ul>
  );
}

interface IconButtonProps {
  label: string;
  onClick: () => void;
  color: string;
  children: React.ReactNode;
}

function IconButton({ label, onClick, color, children }: IconButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        color,
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 6,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function LoadingSkeleton({ label }: { label: string }): React.ReactElement {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      style={{
        margin: '0 1.5rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 80,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
            backgroundSize: '200% 100%',
            borderRadius: 12,
            animation: 'metas-skeleton-pulse 1.6s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes metas-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ onCreateFirst }: { onCreateFirst: () => void }): React.ReactElement {
  return (
    <div
      style={{
        margin: '0 1.5rem 1.5rem',
        padding: '3rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '1rem',
          color: '#F0F4FF',
        }}
      >
        Ainda não tens metas. Define o teu primeiro objectivo.
      </p>
      <button
        type="button"
        onClick={onCreateFirst}
        style={{
          marginTop: '1rem',
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#04040A',
          background: '#00F5FF',
          border: 'none',
          borderRadius: 6,
          padding: '0.55rem 1.2rem',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(0, 245, 255, 0.4)',
        }}
      >
        Criar primeira meta
      </button>
    </div>
  );
}
