import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createRecurrence,
  getRecurrence,
  getRecurrenceByOwner,
  deleteRecurrence,
} from '@/lib/db/repos/recurrences';
import type { Recurrence } from '@/types/db';

/**
 * Nexus v2 — recurrences repo tests (Story 2.1 / AC11)
 *
 * Foco do AC: `getRecurrenceByOwner` via índice composto `[ownerType+ownerId]`.
 */

function makeRecurrence(overrides: Partial<Recurrence> = {}): Recurrence {
  return {
    id: crypto.randomUUID(),
    rule: 'FREQ=WEEKLY;BYDAY=MO',
    startDate: '2026-05-15',
    endDate: null,
    ownerType: 'task',
    ownerId: crypto.randomUUID(),
    ...overrides,
  };
}

describe('recurrences repo', () => {
  beforeEach(async () => {
    await db.recurrences.clear();
  });

  it('createRecurrence + getRecurrence roundtrip', async () => {
    const rec = makeRecurrence();
    await createRecurrence(rec);
    const retrieved = await getRecurrence(rec.id);
    expect(retrieved).toEqual(rec);
  });

  it('createRecurrence rejeita input inválido (Zod)', async () => {
    const invalid = makeRecurrence({ id: 'not-a-uuid' });
    await expect(createRecurrence(invalid)).rejects.toThrow();
  });

  it('createRecurrence rejeita rule vazia com mensagem PT-PT', async () => {
    const invalid = makeRecurrence({ rule: '' });
    await expect(createRecurrence(invalid)).rejects.toThrow(/Regra RRULE é obrigatória/);
  });

  it('createRecurrence rejeita ownerType inválido', async () => {
    // @ts-expect-error — intencional
    const invalid = makeRecurrence({ ownerType: 'invalid-owner' });
    await expect(createRecurrence(invalid)).rejects.toThrow();
  });

  it('getRecurrenceByOwner usa índice composto [ownerType+ownerId]', async () => {
    const ownerId = crypto.randomUUID();
    const otherId = crypto.randomUUID();
    const target = makeRecurrence({ ownerType: 'task', ownerId });
    await createRecurrence(target);
    await createRecurrence(makeRecurrence({ ownerType: 'task', ownerId: otherId }));
    await createRecurrence(makeRecurrence({ ownerType: 'habit', ownerId }));

    const found = await getRecurrenceByOwner('task', ownerId);
    expect(found).toEqual(target);
  });

  it('getRecurrenceByOwner retorna undefined quando nada bate', async () => {
    const result = await getRecurrenceByOwner('task', 'inexistente');
    expect(result).toBeUndefined();
  });

  it('getRecurrenceByOwner distingue ownerType para mesmo ownerId', async () => {
    const sharedId = crypto.randomUUID();
    const taskRec = makeRecurrence({ ownerType: 'task', ownerId: sharedId });
    const habitRec = makeRecurrence({ ownerType: 'habit', ownerId: sharedId });
    await createRecurrence(taskRec);
    await createRecurrence(habitRec);

    const fromTask = await getRecurrenceByOwner('task', sharedId);
    const fromHabit = await getRecurrenceByOwner('habit', sharedId);
    expect(fromTask?.id).toBe(taskRec.id);
    expect(fromHabit?.id).toBe(habitRec.id);
  });

  it('deleteRecurrence remove a recurrence', async () => {
    const rec = makeRecurrence();
    await createRecurrence(rec);
    await deleteRecurrence(rec.id);
    const after = await getRecurrence(rec.id);
    expect(after).toBeUndefined();
  });
});
