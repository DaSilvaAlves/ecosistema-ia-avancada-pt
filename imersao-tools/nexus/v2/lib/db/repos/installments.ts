import Dexie from 'dexie';
import { db } from '@/lib/db/client';
import { InstallmentSchema, TransactionSchema } from '@/lib/db/schemas';
import type { Installment, Transaction } from '@/types/db';

/**
 * Nexus v2 — Repository para `installments` (Story 3.1 + Story 3.6 FR19)
 *
 * Encapsula acesso à tabela Dexie `installments` (compras parceladas — FR19).
 * Cada compra parcelada está vinculada a um cartão (`cardId`). Padrão herdado
 * da Story 2.1.
 *
 * `totalAmount` é inteiro em cêntimos; `installments` é o número de prestações
 * (inteiro positivo). Validação Zod aplicada antes de qualquer write.
 *
 * Story 3.6 estende o repo com:
 *   - `listInstallments()` — lista global ordenada por `startDate` desc.
 *   - `createInstallmentWithTransactions(...)` — cria a parcelada E as N
 *     transações futuras numa única transacção Dexie `rw` (rollback all-or-nothing).
 *   - `deleteInstallmentCascade(id)` — apaga a parcelada E todas as transações
 *     com `installmentId` correspondente, atomicamente.
 *
 * A orquestração atómica vive aqui (não na page) para manter a regra de
 * repo isolation da page `/financas` (zero `db.*` directos) — padrão herdado
 * de `deleteFinanceRecurrence` (Story 3.4, `finance-recurrences.ts`).
 */

export async function createInstallment(input: Installment): Promise<Installment> {
  InstallmentSchema.parse(input);
  await db.installments.add(input);
  return input;
}

export async function getInstallment(id: string): Promise<Installment | undefined> {
  return db.installments.get(id);
}

/**
 * Lista as compras parceladas de um cartão, via índice composto
 * `[cardId+startDate]`. Resultado ordenado descendente por `startDate`
 * (mais recente primeiro).
 */
export async function listInstallmentsByCard(cardId: string): Promise<Installment[]> {
  const matched = await db.installments
    .where('[cardId+startDate]')
    .between([cardId, Dexie.minKey], [cardId, Dexie.maxKey])
    .toArray();
  return matched.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

/**
 * Lista todas as compras parceladas, ordenadas descendente por `startDate`
 * (mais recente primeiro). Story 3.6 (FR19) consome este list na page
 * `/financas` via o hook `useInstallments`. Paridade com `listTransactions` /
 * `listFinanceRecurrences` (que ordenam desc por data / `createdAt`).
 */
export async function listInstallments(): Promise<Installment[]> {
  const all = await db.installments.toArray();
  return all.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export async function updateInstallment(
  id: string,
  patch: Partial<Installment>,
): Promise<void> {
  // Story 3.1 Iter 2 (CodeRabbit #4) — validar o patch parcial antes da escrita.
  // `.partial()` mantém as regras de cada campo presente (installments inteiro
  // positivo, totalAmount inteiro em cêntimos, startDate ISO 8601).
  InstallmentSchema.partial().parse(patch);
  const updated = await db.installments.update(id, patch);
  if (updated === 0) {
    throw new Error(
      `Compra parcelada ${id} não encontrada — não foi possível actualizar`,
    );
  }
}

export async function deleteInstallment(id: string): Promise<void> {
  await db.installments.delete(id);
}

/**
 * Story 3.6 (AC6) — cria uma compra parcelada e as N transações futuras
 * **atomicamente**.
 *
 * Toda a escrita (1 × `db.installments.add` + N × `db.transactions.add`) corre
 * dentro de uma única `db.transaction('rw', db.installments, db.transactions, ...)`:
 * se qualquer `add` falhar (ex: schema-inválido, IndexedDB cheio), a transacção
 * faz rollback completo — não fica nem `Installment` órfão nem parcelas a meio.
 *
 * Validação Zod aplicada a cada registo antes da escrita: `InstallmentSchema`
 * para a parcelada e `TransactionSchema` para cada uma das N transações.
 * `transactions.length` tem de coincidir com `installment.installments` —
 * caso contrário lança antes de tocar a Dexie.
 *
 * Padrão herdado de `deleteFinanceRecurrence` (Story 3.4 CR Iter 1 #I3).
 *
 * @param installment - Parcelada completa (id já gerado pelo caller).
 * @param transactions - As N transações geradas (id e `installmentId` já
 *   correspondentes; `amount` com sinal aplicado pelo caller).
 * @throws {ZodError} Se algum registo falhar a validação.
 * @throws {Error} Se `transactions.length !== installment.installments`.
 */
export async function createInstallmentWithTransactions(
  installment: Installment,
  transactions: Transaction[],
): Promise<void> {
  if (transactions.length !== installment.installments) {
    throw new Error(
      `Número de transações (${transactions.length}) não bate com installments (${installment.installments}).`,
    );
  }

  // Valida tudo antes de tocar a Dexie — falha clara antes de abrir transacção.
  InstallmentSchema.parse(installment);
  for (const t of transactions) {
    TransactionSchema.parse(t);
    if (t.installmentId !== installment.id) {
      throw new Error(
        `Transação ${t.id} tem installmentId divergente (esperado ${installment.id}, recebido ${t.installmentId}).`,
      );
    }
    // CodeRabbit Iter 1 (Major) — paridade com o guard de installmentId.
    // Embora o handler em `app/(app)/financas/page.tsx` estampe sempre
    // `cardId: installment.cardId`, esta função é API pública do repo e
    // poderia ser chamada de outro callsite com input divergente. Bloqueia
    // estado persistido inconsistente.
    if (t.cardId !== installment.cardId) {
      throw new Error(
        `Transação ${t.id} tem cardId divergente (esperado ${installment.cardId}, recebido ${t.cardId}).`,
      );
    }
  }

  await db.transaction('rw', db.installments, db.transactions, async () => {
    await db.installments.add(installment);
    for (const t of transactions) {
      await db.transactions.add(t);
    }
  });
}

/**
 * Story 3.6 (AC9) — apaga uma compra parcelada e **todas** as N transações
 * geradas, atomicamente.
 *
 * Cascata (Story 3.6 [AUTO-DECISION] A7): elimina o `Installment` E todas as
 * `Transaction` com `installmentId === id`. Diferente da Story 3.4 (recorrências
 * cuja transações **sobrevivem** ao delete da recorrência — débito D-3.4-1) —
 * uma parcelada é uma compra única, apagá-la remove o registo inteiro.
 *
 * `Transaction.installmentId` **não** está indexado em `version(3)` (índices
 * são `id, accountId, cardId, category, date, recurrenceId, [accountId+date],
 * [cardId+date]`). Usa `db.transactions.filter()` (full-table-scan) — mesmo
 * precedente de `generateTaskInstances` (Story 2.7) para `parentTaskId` e de
 * `listTransactions({ installmentId })` (Story 3.1). Aceitável para uso pessoal
 * (volume baixo); se o volume crescer, adicionar `installmentId` ao schema
 * `version(5)` (não-aditivo — outra story).
 *
 * Padrão herdado de `deleteFinanceRecurrence` (Story 3.4, `finance-recurrences.ts`).
 *
 * @param id - Id da compra parcelada a apagar.
 */
export async function deleteInstallmentCascade(id: string): Promise<void> {
  await db.transaction('rw', db.installments, db.transactions, async () => {
    await db.transactions.filter((t) => t.installmentId === id).delete();
    await db.installments.delete(id);
  });
}
