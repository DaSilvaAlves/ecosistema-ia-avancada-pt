import { db } from '@/lib/db/client';
import { AccountSchema } from '@/lib/db/schemas';
import type { Account } from '@/types/db';

/**
 * Nexus v2 — Repository para `accounts` (Story 3.1)
 *
 * Encapsula acesso à tabela Dexie `accounts` (contas bancárias — FR18).
 * Stories 3.3-3.11 do Epic 3 devem usar estes helpers em vez de tocar
 * `db.accounts.*` directamente. Padrão herdado da Story 2.1 (`tasks.ts`).
 *
 * Validação Zod aplicada antes de qualquer write — input inválido lança
 * ZodError com mensagens PT-PT. Reads não revalidam (assume integridade
 * do DB local).
 *
 * `balance` é SEMPRE inteiro em cêntimos (types/db.ts:102) — nunca float.
 */

export async function createAccount(input: Account): Promise<Account> {
  AccountSchema.parse(input);
  await db.accounts.add(input);
  return input;
}

export async function getAccount(id: string): Promise<Account | undefined> {
  return db.accounts.get(id);
}

/**
 * Lista todas as contas, ordenadas descendente por `createdAt`.
 */
export async function listAccounts(): Promise<Account[]> {
  const all = await db.accounts.toArray();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateAccount(
  id: string,
  patch: Partial<Account>,
): Promise<void> {
  const updated = await db.accounts.update(id, patch);
  if (updated === 0) {
    throw new Error(`Conta ${id} não encontrada — não foi possível actualizar`);
  }
}

/**
 * Aplica um delta atómico ao saldo da conta, numa transacção Dexie `'rw'`.
 *
 * `delta` é um inteiro em cêntimos: positivo aumenta o saldo (entrada),
 * negativo diminui (saída). A leitura e a escrita ocorrem dentro da mesma
 * transacção — garantia ACID local contra escritas concorrentes.
 *
 * Lança `Error` PT-PT se a conta não existir.
 */
export async function updateBalance(id: string, delta: number): Promise<void> {
  await db.transaction('rw', db.accounts, async () => {
    const account = await db.accounts.get(id);
    if (account === undefined) {
      throw new Error(
        `Conta ${id} não encontrada — não foi possível actualizar o saldo`,
      );
    }
    await db.accounts.update(id, { balance: account.balance + delta });
  });
}

export async function deleteAccount(id: string): Promise<void> {
  await db.accounts.delete(id);
}
