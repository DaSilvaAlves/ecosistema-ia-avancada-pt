'use client';

import type { Task } from '@/types/db';
import { daysOverdue } from '@/lib/tarefas/isOverdue';

/**
 * Nexus v2 — OverdueSection (Story 2.3 / AC3)
 *
 * Secção dedicada de tarefas atrasadas (FR13). Render condicional:
 *   - Se overdueTasks.length === 0 → não renderiza (ausência é UX positiva)
 *   - Senão → heading "⚠ Atrasadas (N)" + lista até 5 + "Mostrar todas (N)" se >5
 *
 * Trace: front-end-spec-v2.md §3.2 linha 452.
 *
 * Cor magenta `#FF006E` para destacar criticidade — `.claude/rules/design-system-ia-avancada.md`.
 */

interface OverdueSectionProps {
  overdueTasks: Task[];
  onShowAll: () => void;
  referenceTs?: number;
}

const VISIBLE_LIMIT = 5;

export function OverdueSection({
  overdueTasks,
  onShowAll,
  referenceTs,
}: OverdueSectionProps): React.ReactElement | null {
  if (overdueTasks.length === 0) return null;

  const visible = overdueTasks.slice(0, VISIBLE_LIMIT);
  const hasMore = overdueTasks.length > VISIBLE_LIMIT;

  return (
    <section
      aria-labelledby="overdue-heading"
      style={{
        margin: '1rem 1.5rem 0',
        padding: '1rem 1.25rem',
        background: 'rgba(255, 0, 110, 0.05)',
        border: '1px solid rgba(255, 0, 110, 0.25)',
        borderRadius: 12,
        backdropFilter: 'blur(12px)',
      }}
    >
      <h2
        id="overdue-heading"
        style={{
          margin: '0 0 0.75rem 0',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.95rem',
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: '#FF006E',
        }}
      >
        ⚠ Atrasadas ({overdueTasks.length})
      </h2>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {visible.map((task) => {
          const days = daysOverdue(task, referenceTs);
          return (
            <li
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.9rem',
                color: '#F0F4FF',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  paddingRight: '0.5rem',
                }}
              >
                {task.title}
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#FF006E',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                }}
              >
                {days}d
              </span>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={onShowAll}
          aria-label={`Mostrar todas as ${overdueTasks.length} tarefas atrasadas`}
          style={{
            marginTop: '0.75rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#00F5FF',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Mostrar todas ({overdueTasks.length}) →
        </button>
      )}

      {!hasMore && overdueTasks.length > 0 && (
        <button
          type="button"
          onClick={onShowAll}
          aria-label="Filtrar tabela para apenas atrasadas"
          style={{
            marginTop: '0.75rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            color: '#00F5FF',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
        >
          Ver →
        </button>
      )}
    </section>
  );
}
