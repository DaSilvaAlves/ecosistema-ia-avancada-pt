import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db/client';
import {
  cancelTaskRecurrence,
  CANCEL_RECURRENCE_CONFIRM,
} from '@/lib/tarefas/cancelRecurrence';
import type { Recurrence, Task } from '@/types/db';

/**
 * Nexus v2 — cancelTaskRecurrence tests (Story 2.7 / AC13 — T23-T24)
 *
 * T23 — confirmação aceite → deleteRecurrence + updateTask chamados.
 * T24 — confirmação abortada → nada é eliminado.
 */

function makeMotherTask(recurrenceId: string): Task {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: 'Tarefa recorrente',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-06-01',
    projectId: null,
    tags: [],
    context: null,
    lastWorkedAt: null,
    recurrenceId,
    parentTaskId: null,
    createdAt: now,
    updatedAt: now,
  };
}

function makeRecurrence(id: string, ownerId: string): Recurrence {
  return {
    id,
    rule: 'FREQ=DAILY',
    startDate: '2026-06-01',
    endDate: null,
    ownerType: 'task',
    ownerId,
  };
}

describe('cancelTaskRecurrence — Story 2.7', () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.recurrences.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // T23 — confirmação aceite
  it('T23 — confirmar pede window.confirm PT-PT e elimina a recorrência', async () => {
    const recId = crypto.randomUUID();
    const mother = makeMotherTask(recId);
    await db.tasks.add(mother);
    await db.recurrences.add(makeRecurrence(recId, mother.id));

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const result = await cancelTaskRecurrence(mother.id, recId);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(confirmSpy).toHaveBeenCalledWith(CANCEL_RECURRENCE_CONFIRM);
    expect(result).toBe(true);
    expect(await db.recurrences.get(recId)).toBeUndefined();
    expect((await db.tasks.get(mother.id))?.recurrenceId).toBeNull();
  });

  // T24 — confirmação abortada
  it('T24 — abortar não elimina a recorrência nem altera a task', async () => {
    const recId = crypto.randomUUID();
    const mother = makeMotherTask(recId);
    await db.tasks.add(mother);
    await db.recurrences.add(makeRecurrence(recId, mother.id));

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const result = await cancelTaskRecurrence(mother.id, recId);

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
    expect(await db.recurrences.get(recId)).toBeDefined();
    expect((await db.tasks.get(mother.id))?.recurrenceId).toBe(recId);
  });
});
