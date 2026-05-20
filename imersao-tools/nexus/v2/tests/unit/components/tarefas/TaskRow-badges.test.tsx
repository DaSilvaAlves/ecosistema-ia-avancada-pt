import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskRow } from '@/components/tarefas/TaskRow';
import type { Task } from '@/types/db';

/**
 * Nexus v2 — TaskRow recurrence badges tests (Story 2.7 / AC13 — T20-T21)
 *
 * Cobre os badges "Recorrente" (task-mãe) e "Instância" (task filha) — AC8.
 */

function makeTask(overrides: Partial<Task> = {}): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Tarefa de teste',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: null,
    projectId: null,
    tags: [],
    context: null,
    lastWorkedAt: null,
    recurrenceId: null,
    parentTaskId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function renderRow(task: Task): void {
  render(
    <table>
      <tbody>
        <TaskRow
          task={task}
          project={undefined}
          tagsLookup={new Map()}
          overdue={false}
          onToggleDone={vi.fn()}
          onDelete={vi.fn()}
        />
      </tbody>
    </table>,
  );
}

describe('TaskRow recurrence badges — Story 2.7', () => {
  // T20 — badge Recorrente visível na task-mãe
  it('T20 — task-mãe (recurrenceId set, parentTaskId null) mostra badge "Recorrente"', () => {
    renderRow(makeTask({ recurrenceId: 'rec-1', parentTaskId: null }));
    expect(screen.getByLabelText('Tarefa recorrente')).toBeInTheDocument();
    expect(screen.getByText('Recorrente')).toBeInTheDocument();
    expect(screen.queryByText('Instância')).not.toBeInTheDocument();
  });

  // T21 — badge Instância visível na task filha
  it('T21 — task filha (parentTaskId set) mostra badge "Instância"', () => {
    renderRow(makeTask({ recurrenceId: 'rec-1', parentTaskId: 'mother-1' }));
    expect(screen.getByLabelText('Instância recorrente')).toBeInTheDocument();
    expect(screen.getByText('Instância')).toBeInTheDocument();
    expect(screen.queryByText('Recorrente')).not.toBeInTheDocument();
  });

  it('T21b — task normal não mostra nenhum badge de recorrência', () => {
    renderRow(makeTask({ recurrenceId: null, parentTaskId: null }));
    expect(screen.queryByText('Recorrente')).not.toBeInTheDocument();
    expect(screen.queryByText('Instância')).not.toBeInTheDocument();
  });
});
