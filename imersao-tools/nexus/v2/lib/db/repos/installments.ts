import Dexie from 'dexie';
import { db } from '@/lib/db/client';
import { InstallmentSchema } from '@/lib/db/schemas';
import type { Installment } from '@/types/db';

/**
 * Nexus v2 — Repository para `installments` (Story 3.1)
 *
 * Encapsula acesso à tabela Dexie `installments` (compras parceladas — FR19).
 * Cada compra parcelada está vinculada a um cartão (`cardId`). Padrão herdado
 * da Story 2.1.
 *
 * `totalAmount` é inteiro em cêntimos; `installments` é o número de prestações
 * (inteiro positivo). Validação Zod aplicada antes de qualquer write.
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
