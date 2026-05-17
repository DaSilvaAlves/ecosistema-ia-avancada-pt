'use client';

import { memo, type CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tag, Task } from '@/types/db';
import { isOverdue } from '@/lib/tarefas/isOverdue';

/**
 * Nexus v2 — CalendarCard (Story 2.5 — AC4 + AC6)
 *
 * Chip individual num dia do calendário. Layout horizontal compacto (calendário tem
 * menos espaço por célula que Kanban):
 *   - Dot de prioridade (6px) à esquerda — magenta(high) / cyan(medium) / grey(low).
 *   - Ícone projecto 📁 prefixed se task.projectId !== null.
 *   - Título truncado ~25 char com ellipsis (Inter 0.8rem 600).
 *
 * Cor do chip por estado (precedência done → overdue → futuro):
 *   - done    → Lime  rgba(57,255,20,0.12) + border rgba(57,255,20,0.3)
 *   - overdue → Magenta rgba(255,0,110,0.12) + border rgba(255,0,110,0.3)
 *   - futuro  → Cyan  rgba(0,245,255,0.08) + border rgba(0,245,255,0.2)
 *
 * Drag-and-drop:
 *   - `useSortable({ id: task.id })` do @dnd-kit/sortable como drag handle.
 *   - `attributes` + `listeners` no root → drag em qualquer ponto do chip.
 *   - `transform`/`transition` via `CSS.Transform.toString` (precedente KanbanCard).
 *
 * Acessibilidade (AC6):
 *   - `role="button"` (implícito via @dnd-kit attributes), `tabIndex={0}`.
 *   - `aria-roledescription="Cartão de tarefa arrastável"`.
 *   - `aria-label` com título + estado.
 *
 * `isMoving`: indicador visual quando o chip está em optimistic move (override
 * activo) — opacity ligeiramente reduzida para signalar "a guardar".
 *
 * `React.memo` para evitar re-renders desnecessários em mudanças de outras tasks.
 */

const PRIORITY_DOT_COLOR = {
  high: '#FF006E',
  medium: '#00F5FF',
  low: '#8892A4',
} as const;

const PRIORITY_LABEL = {
  high: 'alta',
  medium: 'média',
  low: 'baixa',
} as const;

const MAX_TITLE_CHARS = 25;

type ChipColor = 'done' | 'overdue' | 'futuro';

function getChipColor(task: Task): ChipColor {
  if (task.status === 'done') return 'done';
  if (isOverdue(task)) return 'overdue';
  return 'futuro';
}

const CHIP_PALETTE: Record<ChipColor, { bg: string; border: string; text: string }> = {
  done: {
    bg: 'rgba(57, 255, 20, 0.12)',
    border: 'rgba(57, 255, 20, 0.3)',
    text: '#F0F4FF',
  },
  overdue: {
    bg: 'rgba(255, 0, 110, 0.12)',
    border: 'rgba(255, 0, 110, 0.3)',
    text: '#F0F4FF',
  },
  futuro: {
    bg: 'rgba(0, 245, 255, 0.08)',
    border: 'rgba(0, 245, 255, 0.2)',
    text: '#F0F4FF',
  },
};

const CHIP_LABEL_BY_COLOR: Record<ChipColor, string> = {
  done: 'feita',
  overdue: 'atrasada',
  futuro: 'futura',
};

interface CalendarCardProps {
  task: Task;
  projectName?: string;
  tagsLookup: ReadonlyMap<string, Tag>;
  /** True se há override optimistic activo para este task. */
  isMoving: boolean;
}

function truncateTitle(title: string): string {
  if (title.length <= MAX_TITLE_CHARS) return title;
  return title.slice(0, MAX_TITLE_CHARS - 1) + '…';
}

function CalendarCardImpl({
  task,
  projectName,
  tagsLookup,
  isMoving,
}: CalendarCardProps): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const color = getChipColor(task);
  const palette = CHIP_PALETTE[color];

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : isMoving ? 0.75 : 1,
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: 6,
    padding: '0.35rem 0.55rem',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backdropFilter: 'blur(6px)',
    touchAction: 'none',
    color: palette.text,
  };

  // Tooltip data — não usar attributes title nativo do navegador (UX inconsistente).
  // tagsLookup poderá ser usado em iteração futura para mostrar 1ª tag em hover.
  void tagsLookup;

  const ariaLabel = `Tarefa: ${task.title}. ${CHIP_LABEL_BY_COLOR[color]}. Prioridade ${PRIORITY_LABEL[task.priority]}.${
    projectName !== undefined ? ` Projecto ${projectName}.` : ''
  }`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={0}
      role="button"
      aria-roledescription="Cartão de tarefa arrastável"
      aria-label={ariaLabel}
      data-testid={`calendar-card-${task.id}`}
      data-color={color}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: PRIORITY_DOT_COLOR[task.priority],
          flexShrink: 0,
        }}
      />
      {projectName !== undefined && (
        <span aria-hidden="true" style={{ fontSize: '0.7rem', flexShrink: 0 }}>
          📁
        </span>
      )}
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: palette.text,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          lineHeight: 1.3,
        }}
      >
        {truncateTitle(task.title)}
      </span>
    </div>
  );
}

export const CalendarCard = memo(CalendarCardImpl);
