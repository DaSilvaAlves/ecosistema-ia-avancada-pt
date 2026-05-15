'use client';

import { useMemo } from 'react';
import type { Task, Project, Tag } from '@/types/db';
import { TaskRow } from '@/components/tarefas/TaskRow';
import { isOverdue } from '@/lib/tarefas/isOverdue';

/**
 * Nexus v2 — TasksTable (Story 2.3 / AC5)
 *
 * Tabela com 8 colunas (header semântico thead/tbody + scope="col").
 * Cada linha é um <TaskRow> memoizado.
 *
 * Acessibilidade: tabela semântica HTML5; ARIA inferido de role natural.
 */

interface TasksTableProps {
  tasks: Task[];
  projects: Project[] | undefined;
  tags: Tag[] | undefined;
  onToggleDone: (taskId: string, done: boolean) => void;
  onDelete: (taskId: string) => void;
  referenceTs?: number;
}

const HEADER_COLS: Array<{ id: string; label: string; width?: number; srOnly?: boolean }> = [
  { id: 'check', label: 'Estado de conclusão', width: 36, srOnly: true },
  { id: 'title', label: 'Título' },
  { id: 'priority', label: 'Prioridade' },
  { id: 'due', label: 'Due' },
  { id: 'project', label: 'Projecto' },
  { id: 'tags', label: 'Tags' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Acções', width: 50, srOnly: true },
];

export function TasksTable({
  tasks,
  projects,
  tags,
  onToggleDone,
  onDelete,
  referenceTs,
}: TasksTableProps): React.ReactElement {
  const projectsLookup = useMemo(() => {
    const m = new Map<string, Project>();
    (projects ?? []).forEach((p) => m.set(p.id, p));
    return m;
  }, [projects]);

  const tagsLookup = useMemo(() => {
    const m = new Map<string, Tag>();
    (tags ?? []).forEach((t) => m.set(t.id, t));
    return m;
  }, [tags]);

  return (
    <div
      style={{
        margin: '0 1.5rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        overflow: 'auto',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <thead>
          <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
            {HEADER_COLS.map((col) => (
              <th
                key={col.id}
                scope="col"
                style={{
                  padding: '0.6rem 0.6rem',
                  textAlign: 'left',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#8892A4',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  width: col.width,
                  whiteSpace: 'nowrap',
                }}
              >
                {col.srOnly ? (
                  <span
                    style={{
                      position: 'absolute',
                      width: 1,
                      height: 1,
                      padding: 0,
                      margin: -1,
                      overflow: 'hidden',
                      clip: 'rect(0,0,0,0)',
                      whiteSpace: 'nowrap',
                      border: 0,
                    }}
                  >
                    {col.label}
                  </span>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              project={task.projectId ? projectsLookup.get(task.projectId) : undefined}
              tagsLookup={tagsLookup}
              overdue={isOverdue(task, referenceTs)}
              onToggleDone={(checked) => onToggleDone(task.id, checked)}
              onDelete={() => onDelete(task.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
