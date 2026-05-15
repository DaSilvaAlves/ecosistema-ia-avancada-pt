import { describe, it, expect } from 'vitest';
import { isOverdue, daysOverdue, startOfToday } from '@/lib/tarefas/isOverdue';
import type { Task } from '@/types/db';

/**
 * Nexus v2 — isOverdue helper tests (Story 2.3 / AC12 / [AUTO-DECISION] D3)
 *
 * Helper puro — testes deterministas via `referenceTs`.
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

// Referência fixa: 15/05/2026 14:30 (local)
const REF = new Date('2026-05-15T14:30:00').getTime();

describe('isOverdue helper (D3)', () => {
  it('tarefa sem dueDate NUNCA é overdue', () => {
    expect(isOverdue(makeTask({ dueDate: null }), REF)).toBe(false);
  });

  it('tarefa com dueDate de hoje NÃO é overdue (due today != overdue)', () => {
    // Hoje em local time, 09:00 — mesmo já passado, NÃO é overdue
    expect(isOverdue(makeTask({ dueDate: '2026-05-15' }), REF)).toBe(false);
  });

  it('tarefa com dueDate de ontem É overdue', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-05-14' }), REF)).toBe(true);
  });

  it('tarefa com dueDate de amanhã NÃO é overdue', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-05-16' }), REF)).toBe(false);
  });

  it('tarefa com status done NÃO é overdue mesmo com dueDate passado', () => {
    expect(isOverdue(makeTask({ dueDate: '2026-05-10', status: 'done' }), REF)).toBe(false);
  });

  it('tarefa com dueDate inválido NÃO é overdue (não rebenta)', () => {
    expect(isOverdue(makeTask({ dueDate: 'data-inválida' }), REF)).toBe(false);
  });

  it('daysOverdue conta dias completos', () => {
    expect(daysOverdue(makeTask({ dueDate: '2026-05-14' }), REF)).toBe(1);
    expect(daysOverdue(makeTask({ dueDate: '2026-05-10' }), REF)).toBe(5);
  });

  it('daysOverdue devolve 0 se não atrasada', () => {
    expect(daysOverdue(makeTask({ dueDate: '2026-05-15' }), REF)).toBe(0);
    expect(daysOverdue(makeTask({ dueDate: null }), REF)).toBe(0);
  });

  it('startOfToday devolve 00:00:00 do dia local', () => {
    const ts = startOfToday(REF);
    const d = new Date(ts);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(4); // 0-indexed: Maio = 4
  });
});
