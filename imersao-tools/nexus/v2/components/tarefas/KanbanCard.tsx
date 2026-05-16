'use client';

import { memo, type CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, Tag } from '@/types/db';
import { formatDueDate } from '@/lib/tarefas/isOverdue';

/**
 * Nexus v2 — KanbanCard (Story 2.4 / AC3 + AC5)
 *
 * Card individual numa coluna do Kanban. Layout vertical:
 *   - Linha 1: título da tarefa (Inter 0.9rem, truncado em hover via overflow-wrap)
 *   - Linha 2 (badges): prioridade + due date
 *   - Linha 3 (opcional): nome do projecto se task.projectId !== null
 *   - Linha 4 (opcional): até 2 tags + "+N" overflow
 *
 * Drag-and-drop:
 *   - `useSortable({ id: task.id })` do @dnd-kit/sortable como handle de drag
 *   - `attributes` + `listeners` aplicados no root para drag em qualquer ponto
 *   - `transform`/`transition` aplicados via CSS.Transform helper
 *   - `isDragging`: opacity 0.5 + cursor grabbing
 *
 * Acessibilidade (AC5):
 *   - `role="button"` (implícito via @dnd-kit attributes)
 *   - `aria-roledescription="Cartão de tarefa arrastável"` para anúncios screen-reader
 *   - `tabIndex={0}` para focus com teclado
 *   - WAI-ARIA D&D: Space/Enter inicia drag, Arrow Keys movem, Escape cancela
 *     (gerido pelo KeyboardSensor do KanbanBoard).
 *
 * Estilo: glassmorphism alinhado a `.claude/rules/design-system-ia-avancada.md`.
 * Paletes PRIORITY_COLORS / STATUS_COLORS partilhadas conceptualmente com TaskRow
 * (Story 2.3) — replicadas aqui para evitar import cruzado prematuro (refactor
 * futuro para `lib/tarefas/colors.ts` se 3+ componentes precisarem).
 *
 * Tinting overdue (AC3): se `overdue=true`, fundo `rgba(255,0,110,0.05)` + due date
 * a magenta. Contrast preservado: texto branco sobre overlay 5% magenta sobre
 * background glass = AAA (precedente Story 2.3 SF2).
 */

const PRIORITY_LABELS = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
} as const;

const PRIORITY_COLORS = {
  high: { bg: 'rgba(255, 0, 110, 0.12)', border: 'rgba(255, 0, 110, 0.3)', text: '#FF006E' },
  medium: { bg: 'rgba(0, 245, 255, 0.1)', border: 'rgba(0, 245, 255, 0.25)', text: '#00F5FF' },
  low: { bg: 'rgba(136, 146, 164, 0.12)', border: 'rgba(136, 146, 164, 0.3)', text: '#8892A4' },
} as const;

const MAX_VISIBLE_TAGS = 2;

interface KanbanCardProps {
  task: Task;
  projectName?: string;
  tagsLookup: ReadonlyMap<string, Tag>;
  overdue: boolean;
}

function badgeStyle(palette: { bg: string; border: string; text: string }): CSSProperties {
  return {
    display: 'inline-block',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '0.6rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '0.18rem 0.5rem',
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    color: palette.text,
    borderRadius: 20,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };
}

function KanbanCardImpl({ task, projectName, tagsLookup, overdue }: KanbanCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const visibleTags = task.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = task.tags.length - MAX_VISIBLE_TAGS;

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: overdue ? 'rgba(255, 0, 110, 0.05)' : 'rgba(255, 255, 255, 0.04)',
    border: `1px solid ${overdue ? 'rgba(255, 0, 110, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: 8,
    padding: '0.7rem 0.8rem',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    backdropFilter: 'blur(8px)',
    touchAction: 'none', // recomendado pelo @dnd-kit para pointer events
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={0}
      aria-roledescription="Cartão de tarefa arrastável"
      aria-label={`Tarefa: ${task.title}. Prioridade ${PRIORITY_LABELS[task.priority].toLowerCase()}. ${
        task.dueDate ? `Prazo ${formatDueDate(task.dueDate)}` : 'Sem prazo'
      }${overdue ? ', atrasada' : ''}.`}
      data-testid={`kanban-card-${task.id}`}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.9rem',
          fontWeight: 500,
          color: '#F0F4FF',
          lineHeight: 1.35,
          wordBreak: 'break-word',
        }}
      >
        {task.title}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span style={badgeStyle(PRIORITY_COLORS[task.priority])}>{PRIORITY_LABELS[task.priority]}</span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.7rem',
            fontWeight: overdue ? 700 : 500,
            color: overdue ? '#FF006E' : '#8892A4',
            letterSpacing: '0.04em',
          }}
        >
          {formatDueDate(task.dueDate)}
        </span>
      </div>

      {projectName !== undefined && projectName !== null && (
        <p
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.72rem',
            color: '#8892A4',
            letterSpacing: '0.02em',
          }}
        >
          {projectName}
        </p>
      )}

      {task.tags.length > 0 && (
        <div style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {visibleTags.map((tagId) => {
            const tag = tagsLookup.get(tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.58rem',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  padding: '0.15rem 0.45rem',
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
                fontSize: '0.58rem',
                fontWeight: 700,
                color: '#8892A4',
                padding: '0.15rem 0.4rem',
              }}
              aria-label={`Mais ${overflowCount} tags`}
            >
              +{overflowCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const KanbanCard = memo(KanbanCardImpl);
