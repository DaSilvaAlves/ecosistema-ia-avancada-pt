'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { CSSProperties } from 'react';
import type { Task, Tag } from '@/types/db';
import { isOverdue } from '@/lib/tarefas/isOverdue';
import { KanbanCard } from '@/components/tarefas/KanbanCard';

/**
 * Nexus v2 — KanbanColumn (Story 2.4 / AC2 + AC5 + AC8)
 *
 * Coluna de um Kanban board. Recebe um TaskStatus como `columnId` e renderiza:
 *   - Header com label PT-PT + badge contador `(N)` + accent stripe top da cor da coluna
 *   - Drop zone (useDroppable do @dnd-kit/core) com glow border quando `isOver`
 *   - Lista de KanbanCard (SortableContext com strategy vertical)
 *   - Empty state "Sem tarefas" quando tasks.length === 0
 *
 * `isHidden` (AC7 / A3): quando filtro Status oculta esta coluna, render com
 * `display: none` para preservar DOM (testes podem queryAll) e estado dnd-kit.
 *
 * Acessibilidade (AC5):
 *   - `aria-label` PT-PT na coluna ("Coluna Por fazer, N tarefas")
 *   - `aria-live="polite"` no contador para anunciar mudanças após drag
 */

export type ColumnId = 'todo' | 'in-progress' | 'blocked' | 'done';

interface KanbanColumnProps {
  columnId: ColumnId;
  label: string;
  accentColor: string;
  tasks: Task[];
  tagsLookup: ReadonlyMap<string, Tag>;
  getProjectName: (projectId: string | null) => string | undefined;
  isHidden: boolean;
}

export function KanbanColumn({
  columnId,
  label,
  accentColor,
  tasks,
  tagsLookup,
  getProjectName,
  isHidden,
}: KanbanColumnProps): React.ReactElement {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  const containerStyle: CSSProperties = {
    display: isHidden ? 'none' : 'flex',
    flexDirection: 'column',
    flex: '1 1 0',
    minWidth: 240,
    maxWidth: 360,
    background: 'rgba(255, 255, 255, 0.025)',
    border: `1px solid ${isOver ? accentColor : 'rgba(255, 255, 255, 0.08)'}`,
    borderRadius: 12,
    padding: '0.85rem',
    backdropFilter: 'blur(12px)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: isOver ? `0 0 24px ${accentColor}33` : 'none',
    gap: 10,
  };

  const taskIds = tasks.map((t) => t.id);

  return (
    <section
      ref={setNodeRef}
      role="region"
      aria-label={`Coluna ${label}, ${tasks.length} ${tasks.length === 1 ? 'tarefa' : 'tarefas'}`}
      aria-hidden={isHidden}
      data-column-id={columnId}
      style={containerStyle}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 8,
          borderBottom: `2px solid ${accentColor}`,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: accentColor,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </h2>
        <span
          aria-live="polite"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: accentColor,
            background: `${accentColor}1a`,
            border: `1px solid ${accentColor}33`,
            padding: '0.15rem 0.45rem',
            borderRadius: 10,
            minWidth: 28,
            textAlign: 'center',
          }}
        >
          {tasks.length}
        </span>
      </header>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            minHeight: 120,
            paddingTop: 4,
          }}
        >
          {tasks.length === 0 ? (
            <p
              style={{
                margin: 0,
                padding: '1.5rem 0.5rem',
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                fontStyle: 'italic',
                color: '#8892A4',
              }}
            >
              Sem tarefas
            </p>
          ) : (
            tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                projectName={task.projectId !== null ? getProjectName(task.projectId) : undefined}
                tagsLookup={tagsLookup}
                overdue={isOverdue(task)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}
