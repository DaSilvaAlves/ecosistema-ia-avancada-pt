'use client';

import { memo } from 'react';
import type { Task } from '@/types/db';
import { formatDueDate } from '@/lib/tarefas/isOverdue';
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS_PT,
  STATUS_COLORS,
  STATUS_LABELS_PT,
  badgeStyle,
} from '@/lib/tarefas/colors';

/**
 * Nexus v2 — ProjectTaskRow (Story 2.9 / AC4)
 *
 * Linha de tarefa simplificada, exclusiva da vista detalhada de projecto
 * (`/projectos/[id]`). Renderizada como `<li>` dentro de uma `<ul>` agrupada por
 * status — diferente de `TaskRow.tsx` (Story 2.3), que é um `<tr>` para tabela
 * com 8 colunas (título · prioridade · due · projecto · tags · status · kebab).
 *
 * A7 (Story 2.9) — decisão por componente novo em vez de reutilizar `TaskRow`:
 *   1. `TaskRow` é `<tr>` e exige `<table>` wrapper — desadequado a lista
 *      vertical agrupada por status.
 *   2. `TaskRow` requer `onToggleDone` e `onDelete` — fora-de-scope na vista
 *      projecto (AC8/AC10 explicitam CTA para `/tarefas`).
 *   3. `TaskRow` mostra coluna "Projecto" — redundante numa vista de projecto
 *      único.
 *   4. `TaskRow` traz menu kebab `TaskKebabMenu` com lógica WAI-ARIA — não
 *      necessário aqui.
 *
 * D3 (Epic 2) — PRIORITY_COLORS e STATUS_COLORS extraídos para
 * `lib/tarefas/colors.ts`. Esta linha usa o módulo partilhado; `TaskRow` e
 * `KanbanCard` permanecem com cópias inline para zero modificação de Stories
 * 2.3/2.4 (consolidação completa fica para closure commit Epic 2).
 *
 * Read-only — sem handlers de mutação. Click no título redirige para `/tarefas`
 * (AC8) através da CTA do empty state e/ou do parent.
 */

interface ProjectTaskRowProps {
  task: Task;
}

function ProjectTaskRowImpl({ task }: ProjectTaskRowProps): React.ReactElement {
  const isDone = task.status === 'done';

  const liStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto auto',
    gap: 12,
    alignItems: 'center',
    padding: '0.7rem 0.9rem',
    background: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: 8,
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.88rem',
    color: '#F0F4FF',
  };

  return (
    <li
      data-testid={`project-task-row-${task.id}`}
      data-status={task.status}
      style={liStyle}
    >
      <span
        style={{
          textDecoration: isDone ? 'line-through' : 'none',
          opacity: isDone ? 0.6 : 1,
          fontWeight: 500,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={task.title}
      >
        {task.title}
      </span>

      <span style={badgeStyle(PRIORITY_COLORS[task.priority])}>
        {PRIORITY_LABELS_PT[task.priority]}
      </span>

      <span
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.72rem',
          color: '#8892A4',
          letterSpacing: '0.02em',
          minWidth: 64,
          textAlign: 'right',
        }}
      >
        {formatDueDate(task.dueDate)}
      </span>

      <span style={badgeStyle(STATUS_COLORS[task.status])}>
        {STATUS_LABELS_PT[task.status]}
      </span>
    </li>
  );
}

export const ProjectTaskRow = memo(ProjectTaskRowImpl);
