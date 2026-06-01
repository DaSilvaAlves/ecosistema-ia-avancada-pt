'use client';

import { Pencil, Trash2, Ban, RotateCcw, Repeat } from 'lucide-react';
import type { Reminder } from '@/types/db';

/**
 * Nexus v2 — RemindersList (Story 4.6 — AC2, FR33)
 *
 * Lista reactiva de lembretes com acções contextuais. Componente apresentacional
 * (recebe dados e callbacks do parent — repo isolation mantido na page, padrão
 * `HabitsList` da Story 4.2).
 *
 * 4 estados de render (`react-component-test-criteria.md` — teste obrigatório):
 *   - Loading (`reminders === undefined`): skeleton.
 *   - Vazio (`reminders.length === 0`): empty state com CTA contextual.
 *   - Lista (variant `pending`): texto, data/hora PT-PT, badge de recorrência +
 *     acções Editar / Cancelar / Apagar.
 *   - Lista (variant `cancelled`): acções Restaurar / Apagar (sem Editar —
 *     [AUTO-DECISION] A4: um lembrete cancelado não se edita directamente).
 *
 * `variant` distingue a tab de origem ([AUTO-DECISION] A6):
 *   - `'pending'` → lembretes `pending`/`snoozed` (pendentes-activos).
 *   - `'cancelled'` → lembretes `cancelled`.
 *
 * Data/hora formatada em PT-PT via `Date.toLocaleString('pt-PT')` ([AUTO-DECISION]
 * A3). Badge de recorrência quando `recurrenceId !== null`.
 *
 * Design system (`design-system-ia-avancada.md`): cards glassmorphism,
 * Inter (texto) + JetBrains Mono (data/hora/badge), paleta fixa.
 */

interface RemindersListProps {
  reminders: Reminder[] | undefined;
  variant: 'pending' | 'cancelled';
  onEdit: (reminder: Reminder) => void;
  onCancel: (reminder: Reminder) => void;
  onRestore: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
}

/** Formata epoch ms para data/hora localizada PT-PT (ex: "01/06/2026, 15:00"). */
function formatFireAt(epochMs: number): string {
  return new Date(epochMs).toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RemindersList({
  reminders,
  variant,
  onEdit,
  onCancel,
  onRestore,
  onDelete,
}: RemindersListProps): React.ReactElement {
  if (reminders === undefined) {
    return <LoadingSkeleton label="A carregar lembretes" />;
  }

  if (reminders.length === 0) {
    return variant === 'pending' ? (
      <EmptyState
        text="Sem lembretes pendentes. Cria o primeiro lembrete no botão acima."
        cta="Criar primeiro lembrete"
      />
    ) : (
      <EmptyState text="Sem lembretes cancelados." />
    );
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
      {reminders.map((reminder) => (
        <li
          key={reminder.id}
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
              {reminder.text}
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
              <span>{formatFireAt(reminder.fireAt)}</span>
              {reminder.recurrenceId !== null && (
                <span
                  data-testid={`reminder-recurrence-badge-${reminder.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#9D00FF',
                    background: 'rgba(157, 0, 255, 0.08)',
                    border: '1px solid rgba(157, 0, 255, 0.25)',
                    borderRadius: 20,
                    padding: '0.15rem 0.5rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    fontSize: '0.6rem',
                  }}
                >
                  <Repeat size={11} /> Recorrente
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {variant === 'pending' ? (
              <>
                <IconButton
                  label={`Editar "${reminder.text}"`}
                  onClick={() => onEdit(reminder)}
                  color="#00F5FF"
                >
                  <Pencil size={16} />
                </IconButton>
                <IconButton
                  label={`Cancelar "${reminder.text}"`}
                  onClick={() => onCancel(reminder)}
                  color="#FFB800"
                >
                  <Ban size={16} />
                </IconButton>
              </>
            ) : (
              <IconButton
                label={`Restaurar "${reminder.text}"`}
                onClick={() => onRestore(reminder)}
                color="#39FF14"
              >
                <RotateCcw size={16} />
              </IconButton>
            )}
            <IconButton
              label={`Apagar "${reminder.text}"`}
              onClick={() => onDelete(reminder)}
              color="#FF006E"
            >
              <Trash2 size={16} />
            </IconButton>
          </div>
        </li>
      ))}
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
            animation: 'lembretes-skeleton-pulse 1.6s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes lembretes-skeleton-pulse {
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
