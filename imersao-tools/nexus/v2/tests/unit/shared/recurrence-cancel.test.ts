import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db/client';
import { setTaskStatus, updateTask } from '@/lib/db/repos/tasks';
import {
  buildRecurrenceConfig,
  buildRRule,
  generateTaskInstances,
} from '@/lib/shared/recurrence';
import { cancelTaskRecurrence } from '@/lib/tarefas/cancelRecurrence';
import type { Recurrence, Task } from '@/types/db';

/**
 * Nexus v2 — recurrence lifecycle tests (Story 2.7 / AC13)
 *
 * T12 — completar uma instância não cancela a recorrência.
 * T13 — cancelar a recorrência via `cancelTaskRecurrence` (contrato AC9) não
 *        elimina as instâncias filhas já criadas.
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

  afterEach(() => {
    vi.restoreAllMocks();
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

  // T13 (CR Iter 2 #10) — cancelar recorrência via o contrato `cancelTaskRecurrence`
  it('T13 — cancelTaskRecurrence limpa recurrenceId da mãe e mantém as instâncias', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeDailyRecurrence(mother.id);
    await db.recurrences.add(rec);
    await updateTask(mother.id, { recurrenceId: rec.id });
    await generateTaskInstances(rec, 5, NOW_MS);

    const childrenBefore = await db.tasks.filter((t) => t.parentTaskId === mother.id).toArray();
    expect(childrenBefore.length).toBeGreaterThan(0);

    // Cancelar recorrência via o contrato real (AC9) — utilizador confirma.
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const result = await cancelTaskRecurrence(mother.id, rec.id);
    expect(result).toBe(true);

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

  // T13b (CR Iter 2 #10) — utilizador aborta o cancelamento
  it('T13b — cancelTaskRecurrence abortado pelo utilizador não altera nada', async () => {
    const mother = makeMotherTask();
    await db.tasks.add(mother);
    const rec = makeDailyRecurrence(mother.id);
    await db.recurrences.add(rec);
    await updateTask(mother.id, { recurrenceId: rec.id });

    // O utilizador cancela o `window.confirm`.
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const result = await cancelTaskRecurrence(mother.id, rec.id);
    expect(result).toBe(false);

    // A recorrência continua e o vínculo da task-mãe permanece intacto.
    expect(await db.recurrences.get(rec.id)).toBeDefined();
    const motherAfter = await db.tasks.get(mother.id);
    expect(motherAfter?.recurrenceId).toBe(rec.id);
  });
});
