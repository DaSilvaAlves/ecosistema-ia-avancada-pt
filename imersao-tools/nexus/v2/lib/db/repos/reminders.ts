import { db } from '@/lib/db/client';
import { ReminderSchema } from '@/lib/db/schemas';
import { deleteRecurrence } from '@/lib/db/repos/recurrences';
import type { Reminder } from '@/types/db';

/**
 * Nexus v2 — Repository para `reminders` (Story 4.1 — FR33/FR34/FR38)
 *
 * Encapsula o acesso à tabela Dexie `reminders` (que já existe em `version(1)`
 * com o índice composto `[status+fireAt]` — scaffold Story 0.3). As Stories 4.6
 * (CRUD lembretes) e 4.8 (agendamento de push) consomem estes helpers.
 *
 * Recorrência opcional (FR33, "igual a tarefas"): `recurrenceId` aponta para a
 * tabela genérica `recurrences` (`ownerType: 'reminder'`). O motor de geração é
 * a Story 4.8 — esta story só gere a entidade e a cascata.
 */

export async function createReminder(input: Reminder): Promise<Reminder> {
  ReminderSchema.parse(input);
  await db.reminders.add(input);
  return input;
}

export async function getReminder(id: string): Promise<Reminder | undefined> {
  return db.reminders.get(id);
}

/**
 * Lista todos os lembretes, ordenados ascendente por `fireAt` (próximo a
 * disparar primeiro).
 */
export async function listReminders(): Promise<Reminder[]> {
  return db.reminders.orderBy('fireAt').toArray();
}

/**
 * Lista os lembretes pendentes cujo `fireAt` já passou (`<= now`) — query
 * dominante do disparo de push (FR34, Story 4.8). Usa o índice composto
 * `[status+fireAt]`: filtra `status === 'pending'` e `fireAt` no intervalo
 * `(0, now]`. `now` é epoch ms.
 */
export async function listPendingReminders(now: number): Promise<Reminder[]> {
  return db.reminders
    .where('[status+fireAt]')
    .between(['pending', 0], ['pending', now], true, true)
    .toArray();
}

export async function updateReminder(
  id: string,
  patch: Partial<Reminder>,
): Promise<void> {
  ReminderSchema.partial().parse(patch);
  const updated = await db.reminders.update(id, patch);
  if (updated === 0) {
    throw new Error(
      `Lembrete ${id} não encontrado — não foi possível actualizar`,
    );
  }
}

/**
 * Apaga um lembrete e, em cascata, a `Recurrence` que lhe pertence (se for
 * recorrente).
 *
 * Cascata (AC7 / Architect Gate Story 4.1): a `Recurrence` com
 * `ownerType: 'reminder'` é owned pelo lembrete (composição) — eliminada via
 * `deleteRecurrence(reminder.recurrenceId)`. Os dois `delete` correm numa
 * transacção Dexie `rw` (padrão `deleteFinanceRecurrence`, Story 3.4):
 * all-or-nothing, evita o estado "RRULE órfã sem lembrete". Hard-delete.
 *
 * Lembretes não-recorrentes (`recurrenceId === null`) fazem só o delete próprio.
 */
export async function deleteReminder(id: string): Promise<void> {
  const reminder = await getReminder(id);
  if (!reminder) {
    throw new Error(`Lembrete não encontrado: ${id}`);
  }
  await db.transaction('rw', db.reminders, db.recurrences, async () => {
    if (reminder.recurrenceId !== null) {
      await deleteRecurrence(reminder.recurrenceId);
    }
    await db.reminders.delete(id);
  });
}
