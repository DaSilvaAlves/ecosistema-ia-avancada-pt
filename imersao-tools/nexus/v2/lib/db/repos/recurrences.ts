import { db } from '@/lib/db/client';
import { RecurrenceSchema, type RecurrenceOwnerType } from '@/lib/db/schemas';
import type { Recurrence } from '@/types/db';

/**
 * Nexus v2 — Repository para `recurrences` (Story 2.1)
 *
 * Tabela genérica partilhada entre Epics 2/3/4 — `ownerType` discrimina:
 * `'task' | 'transaction' | 'habit' | 'reminder'`. Architecture v2 §6.2 L512-519,
 * §16 L1128 ("recurrence engine partilhado").
 *
 * O motor de geração de instâncias recorrentes (wrapper sobre `rrule`) é a
 * Story 2.7 (`lib/shared/recurrence.ts`) — fora do scope da 2.1, que só persiste
 * a definição.
 *
 * `getRecurrenceByOwner` usa o índice composto `[ownerType+ownerId]` —
 * PO Q3, AC8.
 */

export async function createRecurrence(input: Recurrence): Promise<Recurrence> {
  RecurrenceSchema.parse(input);
  await db.recurrences.add(input);
  return input;
}

export async function getRecurrence(id: string): Promise<Recurrence | undefined> {
  return db.recurrences.get(id);
}

/**
 * Lookup dominante: retorna a recorrência associada a um owner (ex: a task
 * recorrente, a habit, a transaction). Index composto `[ownerType+ownerId]`
 * — padrão consistente com `[habitId+date]` e `[conversationId+timestamp]`
 * (architecture §4.2).
 *
 * Retorna `undefined` se não houver. Não lança — o caller decide se a
 * ausência é erro ou não.
 */
export async function getRecurrenceByOwner(
  ownerType: RecurrenceOwnerType,
  ownerId: string
): Promise<Recurrence | undefined> {
  const results = await db.recurrences
    .where('[ownerType+ownerId]')
    .equals([ownerType, ownerId])
    .toArray();
  return results[0];
}

export async function deleteRecurrence(id: string): Promise<void> {
  await db.recurrences.delete(id);
}
