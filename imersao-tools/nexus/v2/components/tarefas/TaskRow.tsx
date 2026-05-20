'use client';

import { memo } from 'react';
import type { Task, Project, Tag } from '@/types/db';
import { TaskKebabMenu } from '@/components/tarefas/TaskKebabMenu';
import { formatDueDate } from '@/lib/tarefas/isOverdue';

/**
 * Nexus v2 — TaskRow (Story 2.3 / AC5)
 *
 * Renderiza uma linha da tabela de tarefas com 8 colunas:
 *   ☐ · Título · Prioridade · Due · Projecto · Tags · Status · Kebab
 *
 * `memo` para evitar re-renders desnecessários em listas grandes.
 *
 * Tinting magenta (D3): se `overdue=true`, fundo subtle `#FF006E` 5% opacidade
 * (mantém contrast AA do texto branco — SF2 verificado: 16.4:1 sobre #04040A,
 * 14.8:1 sobre #04040A + 5% magenta — ainda AAA).
 */

const PRIORITY_LABELS = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
} as const;

const STATUS_LABELS = {
  todo: 'Por fazer',
  'in-progress': 'Em curso',
  blocked: 'Bloqueada',
  done: 'Feita',
} as const;

const PRIORITY_COLORS = {
  high: { bg: 'rgba(255, 0, 110, 0.12)', border: 'rgba(255, 0, 110, 0.3)', text: '#FF006E' },
  medium: { bg: 'rgba(0, 245, 255, 0.1)', border: 'rgba(0, 245, 255, 0.25)', text: '#00F5FF' },
  low: { bg: 'rgba(136, 146, 164, 0.12)', border: 'rgba(136, 146, 164, 0.3)', text: '#8892A4' },
} as const;

const STATUS_COLORS = {
  todo: { bg: 'rgba(0, 245, 255, 0.08)', border: 'rgba(0, 245, 255, 0.2)', text: '#00F5FF' },
  'in-progress': { bg: 'rgba(255, 184, 0, 0.1)', border: 'rgba(255, 184, 0, 0.25)', text: '#FFB800' },
  blocked: { bg: 'rgba(255, 0, 110, 0.1)', border: 'rgba(255, 0, 110, 0.25)', text: '#FF006E' },
  done: { bg: 'rgba(57, 255, 20, 0.08)', border: 'rgba(57, 255, 20, 0.2)', text: '#39FF14' },
} as const;

const MAX_VISIBLE_TAGS = 3;

interface TaskRowProps {
  task: Task;
  project: Project | undefined;
  tagsLookup: Map<string, Tag>;
  overdue: boolean;
  onToggleDone: (checked: boolean) => void;
  onDelete: () => void;
}

function badgeStyle(palette: { bg: string; border: string; text: string }): React.CSSProperties {
  return {
    display: 'inline-block',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '0.2rem 0.55rem',
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    color: palette.text,
    borderRadius: 20,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };
}

// Story 2.7 AC8 — paletes dos badges de recorrência. Task-mãe → Cyan; instância → Grey.
const RECURRENCE_BADGE = {
  bg: 'rgba(0, 245, 255, 0.08)',
  border: 'rgba(0, 245, 255, 0.2)',
  text: '#00F5FF',
} as const;
const INSTANCE_BADGE = {
  bg: 'rgba(136, 146, 164, 0.08)',
  border: 'rgba(136, 146, 164, 0.2)',
  text: '#8892A4',
} as const;

function TaskRowImpl({
  task,
  project,
  tagsLookup,
  overdue,
  onToggleDone,
  onDelete,
}: TaskRowProps): React.ReactElement {
  const isDone = task.status === 'done';
  const visibleTags = task.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = task.tags.length - MAX_VISIBLE_TAGS;

  // Story 2.7 AC8 — task-mãe recorrente vs instância filha.
  const isRecurrenceMother = task.recurrenceId !== null && task.parentTaskId === null;
  const isRecurrenceInstance = task.parentTaskId !== null;

  const rowBg = overdue ? 'rgba(255, 0, 110, 0.05)' : 'transparent';
  const cellStyle: React.CSSProperties = {
    padding: '0.7rem 0.6rem',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.88rem',
    color: '#F0F4FF',
    verticalAlign: 'middle',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  };

  return (
    <tr style={{ background: rowBg }}>
      <td style={{ ...cellStyle, width: 36, textAlign: 'center' }}>
        <input
          type="checkbox"
          aria-label={`Marcar tarefa "${task.title}" como ${isDone ? 'por fazer' : 'feita'}`}
          checked={isDone}
          onChange={(e) => onToggleDone(e.target.checked)}
          style={{
            cursor: 'pointer',
            accentColor: '#39FF14',
            width: 16,
            height: 16,
          }}
        />
      </td>
      <td
        style={{
          ...cellStyle,
          fontWeight: 500,
          textDecoration: isDone ? 'line-through' : 'none',
          opacity: isDone ? 0.6 : 1,
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>{task.title}</span>
          {isRecurrenceMother && (
            <span style={badgeStyle(RECURRENCE_BADGE)} aria-label="Tarefa recorrente">
              Recorrente
            </span>
          )}
          {isRecurrenceInstance && (
            <span style={badgeStyle(INSTANCE_BADGE)} aria-label="Instância recorrente">
              Instância
            </span>
          )}
        </span>
      </td>
      <td style={cellStyle}>
        <span style={badgeStyle(PRIORITY_COLORS[task.priority])}>{PRIORITY_LABELS[task.priority]}</span>
      </td>
      <td
        style={{
          ...cellStyle,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.78rem',
          color: overdue ? '#FF006E' : '#8892A4',
          fontWeight: overdue ? 700 : 400,
        }}
      >
        {formatDueDate(task.dueDate)}
      </td>
      <td style={{ ...cellStyle, color: project ? '#F0F4FF' : '#4A5568' }}>{project?.name ?? '—'}</td>
      <td style={cellStyle}>
        {task.tags.length === 0 ? (
          <span style={{ color: '#4A5568' }}>—</span>
        ) : (
          <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
            {visibleTags.map((tagId) => {
              const tag = tagsLookup.get(tagId);
              if (!tag) return null;
              return (
                <span
                  key={tagId}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    padding: '0.15rem 0.5rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: tag.color || '#F0F4FF',
                    borderRadius: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tag.name}
                </span>
              );
            })}
            {overflowCount > 0 && (
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: '#8892A4',
                  padding: '0.15rem 0.4rem',
                }}
                aria-label={`Mais ${overflowCount} tags`}
              >
                +{overflowCount}
              </span>
            )}
          </span>
        )}
      </td>
      <td style={cellStyle}>
        <span style={badgeStyle(STATUS_COLORS[task.status])}>{STATUS_LABELS[task.status]}</span>
      </td>
      <td style={{ ...cellStyle, textAlign: 'right', width: 50 }}>
        <TaskKebabMenu taskId={task.id} taskTitle={task.title} onDelete={onDelete} />
      </td>
    </tr>
  );
}

export const TaskRow = memo(TaskRowImpl);
