import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { setTaskStatus, updateTask } from '@/lib/db/repos/tasks';
import { deleteRecurrence } from '@/lib/db/repos/recurrences';
import {
  buildRecurrenceConfig,
  buildRRule,
  generateTaskInstances,
} from '@/lib/shared/recurrence';
import type { Recurrence, Task } from '@/types/db';

/**
 * Nexus v2 — recurrence lifecycle tests (Story 2.7 / AC13)
 *
 * T12 — completar uma instância não cancela a recorrência.
 * T13 — cancelar a recorrência (deleteRecurrence + updateTask) não elimina
 *        as instâncias filhas já criadas.
 */

const NOW_MS = new Date('2026-06-01T09:00:00.000Z').getTime();

function makeMotherTask(overrides: Partial<Task> = {}): Task {
  const now = NOW_MS;
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
    recurrenceId: null,
    parentTaskId: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeDailyRecurrence(ownerId: string): Recurrence {
  const config = buildRecurrenceConfig('daily', { startDate: '2026-06-01' });
  return {
    id: crypto.randomUUID(),
    rule: buildRRule(config).toString(),
    startDate: config.startDate,
    endDate: null,
    ownerType: 'task',
    ownerId,
  };
}

describe('recurrence lifecycle — Story 2.7', () => {
  beforeEach(async () => {
    await db.tasks.clear();
    await db.recurrences.clear();
  });

  // T12 — completar instância não cancela recorrência
  it('T12 — completar uma instância não afecta a recorrência nem outras instâncias', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeDailyRecurrence(mother.id);
    await db.recurrences.add(rec);
    await updateTask(mother.id, { recurrenceId: rec.id });
    await generateTaskInstances(rec, 5, NOW_MS);

    const children = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();
    expect(children.length).toBeGreaterThan(1);

    // Completar a primeira instância.
    await setTaskStatus(children[0].id, 'done');

    // A recorrência continua intacta.
    const recAfter = await db.recurrences.get(rec.id);
    expect(recAfter).toBeDefined();
    expect(recAfter).toEqual(rec);

    // As outras instâncias não foram afectadas.
    const others = await db.tasks
      .filter((t) => t.parentTaskId === mother.id && t.id !== children[0].id)
      .toArray();
    expect(others.every((t) => t.status === 'todo')).toBe(true);
    expect(others.length).toBe(children.length - 1);
  });

  // T13 — cancelar recorrência mantém instâncias filhas
  it('T13 — cancelar recorrência limpa recurrenceId da mãe e mantém as instâncias', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeDailyRecurrence(mother.id);
    await db.recurrences.add(rec);
    await updateTask(mother.id, { recurrenceId: rec.id });
    await generateTaskInstances(rec, 5, NOW_MS);

    const childrenBefore = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();
    expect(childrenBefore.length).toBeGreaterThan(0);

    // Cancelar recorrência (AC9): deleteRecurrence + updateTask({ recurrenceId: null }).
    await deleteRecurrence(rec.id);
    await updateTask(mother.id, { recurrenceId: null });

    // A recorrência foi eliminada.
    expect(await db.recurrences.get(rec.id)).toBeUndefined();

    // A task-mãe deixa de ter recurrenceId.
    const motherAfter = await db.tasks.get(mother.id);
    expect(motherAfter?.recurrenceId).toBeNull();

    // As instâncias filhas continuam — não eliminadas (A10).
    const childrenAfter = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();
    expect(childrenAfter.length).toBe(childrenBefore.length);
    expect(childrenAfter.every((t) => t.parentTaskId === mother.id)).toBe(true);
  });
});
