import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createReminder,
  getReminder,
  listReminders,
  listPendingReminders,
  updateReminder,
  deleteReminder,
} from '@/lib/db/repos/reminders';
import { createRecurrence, getRecurrence } from '@/lib/db/repos/recurrences';
import type { Recurrence, Reminder } from '@/types/db';

/**
 * Nexus v2 — reminders repo tests (Story 4.1 / AC8)
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: crypto.randomUUID(),
    text: 'Pagar a luz',
    fireAt: Date.now() + 3600_000,
    recurrenceId: null,
    channels: ['push'],
    status: 'pending',
    ...overrides,
  };
}

function makeRecurrence(ownerId: string): Recurrence {
  return {
    id: crypto.randomUUID(),
    rule: 'FREQ=WEEKLY;BYDAY=FR',
    startDate: '2026-05-01',
    endDate: null,
    ownerType: 'reminder',
    ownerId,
  };
}

describe('reminders repo', () => {
  beforeEach(async () => {
    await db.reminders.clear();
    await db.recurrences.clear();
  });

  it('createReminder + getReminder roundtrip', async () => {
    const reminder = makeReminder();
    await createReminder(reminder);
    expect(await getReminder(reminder.id)).toEqual(reminder);
  });

  it('createReminder rejeita texto vazio com mensagem PT-PT', async () => {
    await expect(createReminder(makeReminder({ text: '' }))).rejects.toThrow(
      /Texto do lembrete é obrigatório/,
    );
  });

  it('createReminder rejeita status fora do enum', async () => {
    // @ts-expect-error — status inválido testado em runtime
    await expect(createReminder(makeReminder({ status: 'done' }))).rejects.toThrow();
  });

  it('createReminder rejeita fireAt não-positivo', async () => {
    await expect(createReminder(makeReminder({ fireAt: 0 }))).rejects.toThrow(
      /fireAt deve ser epoch ms positivo/,
    );
  });

  it('listReminders ordena por fireAt asc', async () => {
    const base = Date.now();
    await createReminder(makeReminder({ fireAt: base + 3000 }));
    await createReminder(makeReminder({ fireAt: base + 1000 }));
    await createReminder(makeReminder({ fireAt: base + 2000 }));
    const result = await listReminders();
    expect(result.map((r) => r.fireAt)).toEqual([
      base + 1000,
      base + 2000,
      base + 3000,
    ]);
  });

  it('listPendingReminders devolve só pending com fireAt <= now', async () => {
    const now = Date.now();
    // pending no passado → incluído
    await createReminder(makeReminder({ fireAt: now - 1000, status: 'pending' }));
    // pending no futuro → excluído
    await createReminder(makeReminder({ fireAt: now + 60_000, status: 'pending' }));
    // já enviado no passado → excluído (status != pending)
    await createReminder(makeReminder({ fireAt: now - 5000, status: 'sent' }));

    const due = await listPendingReminders(now);
    expect(due).toHaveLength(1);
    expect(due[0].fireAt).toBe(now - 1000);
    expect(due[0].status).toBe('pending');
  });

  it('updateReminder muda o status (pending → sent)', async () => {
    const reminder = makeReminder();
    await createReminder(reminder);
    await updateReminder(reminder.id, { status: 'sent' });
    expect((await getReminder(reminder.id))?.status).toBe('sent');
  });

  it('deleteReminder não-recorrente remove só o lembrete', async () => {
    const reminder = makeReminder({ recurrenceId: null });
    await createReminder(reminder);
    await deleteReminder(reminder.id);
    expect(await getReminder(reminder.id)).toBeUndefined();
  });

  // Teste NÃO-TAUTOLÓGICO de cascata (AC7) — prova que a Recurrence owned é
  // eliminada, não apenas que o lembrete desaparece.
  it('deleteReminder recorrente elimina em cascata a Recurrence owned', async () => {
    const reminder = makeReminder();
    const recurrence = makeRecurrence(reminder.id);
    await createRecurrence(recurrence);
    await createReminder({ ...reminder, recurrenceId: recurrence.id });
    expect(await getRecurrence(recurrence.id)).toBeDefined();

    await deleteReminder(reminder.id);

    expect(await getReminder(reminder.id)).toBeUndefined();
    expect(await getRecurrence(recurrence.id)).toBeUndefined();
  });

  it('deleteReminder lança se o lembrete não existe', async () => {
    await expect(
      deleteReminder('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(/não encontrado/i);
  });
});
