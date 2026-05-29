'use client';

import { Pencil, Check, Archive, Trash2, ArchiveRestore, CalendarRange } from 'lucide-react';
import type { Habit, HabitLog } from '@/types/db';

/**
 * Nexus v2 — HabitsList (Story 4.2 — AC6, FR24/FR25)
 *
 * Lista reactiva de hábitos com acções contextuais. Componente apresentacional
 * (recebe dados e callbacks do parent — repo isolation mantido na page).
 *
 * 4 estados de render (`react-component-test-criteria.md` — teste obrigatório):
 *   - Loading (`habits === undefined`): skeleton.
 *   - Vazio (`habits.length === 0`): empty state com CTA.
 *   - Lista: nome, categoria, frequência (RRULE), horário opcional + acções.
 *   - Concluído hoje: o botão "Marcar concluído" vira badge desactivado.
 *
 * `variant` distingue a tab de origem:
 *   - `'active'` → acções Editar / Marcar concluído / Arquivar / Apagar.
 *   - `'archived'` → acções Restaurar / Apagar (sem "Marcar concluído" — AC9).
 *
 * `onShowHeatmap` (opcional, Story 4.3 — AC6): quando presente, cada linha ganha
 * uma acção "Ver heatmap" (nas duas variantes — leitura pura, útil também em
 * arquivados). Extensão mínima — não altera as acções existentes.
 *
 * `todayLogs` são os logs de hoje (filtrados na page). Um hábito cujo `id`
 * aparece em `todayLogs` já foi concluído hoje (idempotência — [AUTO-DECISION]
 * A2): o botão de marcar fica desactivado e mostra "Concluído hoje".
 *
 * Design system (`design-system-ia-avancada.md`): cards glassmorphism,
 * Inter (texto) + JetBrains Mono (RRULE/horário), paleta fixa.
 */

interface HabitsListProps {
  habits: Habit[] | undefined;
  todayLogs: HabitLog[] | undefined;
  variant: 'active' | 'archived';
  onEdit: (habit: Habit) => void;
  onMarkDone: (habit: Habit) => void;
  onArchive: (habit: Habit) => void;
  onRestore: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  onShowHeatmap?: (habit: Habit) => void;
}

export function HabitsList({
  habits,
  todayLogs,
  variant,
  onEdit,
  onMarkDone,
  onArchive,
  onRestore,
  onDelete,
  onShowHeatmap,
}: HabitsListProps): React.ReactElement {
  if (habits === undefined) {
    return <LoadingSkeleton label="A carregar hábitos" />;
  }

  if (habits.length === 0) {
    return variant === 'active' ? (
      <EmptyState text="Sem hábitos. Cria o primeiro hábito no botão acima." cta="Criar primeiro hábito" />
    ) : (
      <EmptyState text="Sem hábitos arquivados." />
    );
  }

  const doneTodayIds = new Set((todayLogs ?? []).map((log) => log.habitId));

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
      {habits.map((habit) => {
        const doneToday = doneTodayIds.has(habit.id);
        return (
          <li
            key={habit.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '0.9rem 1.1rem',
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              backdropFilter: 'blur(12px)',
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
                {habit.name}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.68rem',
                  color: '#8892A4',
                }}
              >
                <span>{habit.category}</span>
                <span aria-hidden="true">·</span>
                <span>{habit.frequency}</span>
                {habit.time !== undefined && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{habit.time}</span>
                  </>
                )}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {onShowHeatmap !== undefined && (
                <IconButton
                  label={`Ver heatmap de "${habit.name}"`}
                  onClick={() => onShowHeatmap(habit)}
                  color="#9D00FF"
                >
                  <CalendarRange size={16} />
                </IconButton>
              )}
              {variant === 'active' ? (
                <>
                  {doneToday ? (
                    <span
                      data-testid={`habit-done-badge-${habit.id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: '#39FF14',
                        background: 'rgba(57, 255, 20, 0.08)',
                        border: '1px solid rgba(57, 255, 20, 0.25)',
                        borderRadius: 20,
                        padding: '0.3rem 0.6rem',
                      }}
                    >
                      <Check size={12} /> Concluído hoje
                    </span>
                  ) : (
                    <IconButton
                      label={`Marcar "${habit.name}" como concluído hoje`}
                      onClick={() => onMarkDone(habit)}
                      color="#39FF14"
                    >
                      <Check size={16} />
                    </IconButton>
                  )}
                  <IconButton
                    label={`Editar "${habit.name}"`}
                    onClick={() => onEdit(habit)}
                    color="#00F5FF"
                  >
                    <Pencil size={16} />
                  </IconButton>
                  <IconButton
                    label={`Arquivar "${habit.name}"`}
                    onClick={() => onArchive(habit)}
                    color="#FFB800"
                  >
                    <Archive size={16} />
                  </IconButton>
                </>
              ) : (
                <IconButton
                  label={`Restaurar "${habit.name}"`}
                  onClick={() => onRestore(habit)}
                  color="#39FF14"
                >
                  <ArchiveRestore size={16} />
                </IconButton>
              )}
              <IconButton
                label={`Apagar "${habit.name}"`}
                onClick={() => onDelete(habit)}
                color="#FF006E"
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
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
            height: 56,
            background:
              'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
            backgroundSize: '200% 100%',
            borderRadius: 12,
            animation: 'habitos-skeleton-pulse 1.6s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes habitos-skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function EmptyState({ text, cta }: { text: string; cta?: string }): React.ReactElement {
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
        {text}
      </p>
      {cta !== undefined && (
        <p
          style={{
            margin: '0.5rem 0 0',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: '#00F5FF',
          }}
        >
          {cta}
        </p>
      )}
    </div>
  );
}
