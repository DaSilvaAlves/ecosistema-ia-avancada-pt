import { db } from '@/lib/db/client';
import { FinanceRecurrenceSchema } from '@/lib/db/schemas';
import { deleteRecurrence } from '@/lib/db/repos/recurrences';
import type { FinanceRecurrence } from '@/types/db';

/**
 * Nexus v2 — Repository para `financeRecurrences` (Story 3.4 — FR17)
 *
 * Encapsula o acesso à tabela Dexie `financeRecurrences` (template das despesas
 * e receitas recorrentes — renda, Netflix, seguros). A RRULE + datas vivem na
 * tabela genérica `recurrences` (`ownerType: 'transaction'`) — ver
 * [AUTO-DECISION] A1 da Story 3.4. Este repo só gere o template financeiro.
 *
 * Montantes SEMPRE em cêntimos (inteiros) — `FinanceRecurrence.amount` negativo
 * é saída, positivo é entrada. Validação Zod aplicada antes de qualquer write.
 *
 * Padrão herdado de `lib/db/repos/transactions.ts` (Story 3.1) e
 * `lib/db/repos/recurrences.ts` (Story 2.1).
 */

/**
 * Cria uma recorrência financeira. Gera `id` UUID e `createdAt` (epoch ms),
 * valida o registo completo com `FinanceRecurrenceSchema` e persiste em Dexie.
 *
 * O `recurrenceId` tem de apontar para um registo já existente na tabela
 * `recurrences` — o caller (modal) cria primeiro a `Recurrence`, depois esta
 * `FinanceRecurrence` com a `recurrenceId` correspondente.
 */
export async function createFinanceRecurrence(
  input: Omit<FinanceRecurrence, 'id' | 'createdAt'>,
): Promise<FinanceRecurrence> {
  const record: FinanceRecurrence = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  FinanceRecurrenceSchema.parse(record);
  await db.financeRecurrences.add(record);
  return record;
}

export async function getFinanceRecurrence(
  id: string,
): Promise<FinanceRecurrence | undefined> {
  return db.financeRecurrences.get(id);
}

/**
 * Lista todas as recorrências financeiras, ordenadas descendente por
 * `createdAt` (mais recente primeiro) — mesma convenção de `listTransactions`.
 */
export async function listFinanceRecurrences(): Promise<FinanceRecurrence[]> {
  const all = await db.financeRecurrences.toArray();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Actualiza parcialmente uma recorrência financeira. Valida o patch com
 * `FinanceRecurrenceSchema.omit({ id, createdAt, recurrenceId }).partial().strict()`
 * (CR Iter 1 #I2) — mantém as regras de cada campo mutável presente (amount
 * inteiro em cêntimos, category não-vazia, accountId/cardId UUID ou null) e
 * REJEITA explicitamente os campos imutáveis `id`/`createdAt` e a ligação
 * `recurrenceId`: o `.strict()` faz `parse()` lançar `ZodError` se o patch os
 * incluir, em vez de os deixar passar silenciosamente para `db.update`.
 *
 * Lança se o registo não existir — paridade com `updateTransaction` (Story 3.1).
 */
export async function updateFinanceRecurrence(
  id: string,
  patch: Partial<FinanceRecurrence>,
): Promise<void> {
  FinanceRecurrenceSchema.omit({ id: true, createdAt: true, recurrenceId: true })
    .partial()
    .strict()
    .parse(patch);
  const updated = await db.financeRecurrences.update(id, patch);
  if (updated === 0) {
    throw new Error(
      `Recorrência financeira ${id} não encontrada — não foi possível actualizar`,
    );
  }
}

/**
 * Apaga uma recorrência financeira e a `Recurrence` associada (a RRULE + datas).
 *
 * Cascata (AC3 / AC12): elimina a `Recurrence` genérica via
 * `deleteRecurrence(fr.recurrenceId)` e o template `FinanceRecurrence`. As
 * `Transaction` já geradas com `recurrenceId === fr.recurrenceId` NÃO são
 * eliminadas — ficam como transações normais (AC12, padrão da Story 2.7 AC9).
 *
 * Os dois `delete` correm dentro de uma transacção Dexie `rw` (CR Iter 1 #I3):
 * a eliminação é all-or-nothing — se o segundo `delete` falhar, o primeiro faz
 * rollback, evitando o estado inconsistente "template órfão sem RRULE" (ou
 * vice-versa).
 */
export async function deleteFinanceRecurrence(id: string): Promise<void> {
  const fr = await getFinanceRecurrence(id);
  if (!fr) {
    throw new Error(`Recorrência financeira não encontrada: ${id}`);
  }
  await db.transaction('rw', db.recurrences, db.financeRecurrences, async () => {
    await deleteRecurrence(fr.recurrenceId);
    await db.financeRecurrences.delete(id);
  });
}
