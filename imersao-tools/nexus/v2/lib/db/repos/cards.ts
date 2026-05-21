import { db } from '@/lib/db/client';
import { CardSchema } from '@/lib/db/schemas';
import type { Card } from '@/types/db';

/**
 * Nexus v2 — Repository para `cards` (Story 3.1)
 *
 * Encapsula acesso à tabela Dexie `cards` (cartões de crédito — FR18).
 * Cada cartão pertence a uma conta (`accountId`) e tem `closingDay`/`dueDay`
 * para o cálculo da fatura corrente (Story 3.8). Padrão herdado da Story 2.1.
 *
 * Validação Zod aplicada antes de qualquer write — input inválido lança
 * ZodError com mensagens PT-PT.
 */

export async function createCard(input: Card): Promise<Card> {
  CardSchema.parse(input);
  await db.cards.add(input);
  return input;
}

export async function getCard(id: string): Promise<Card | undefined> {
  return db.cards.get(id);
}

/**
 * Lista todos os cartões, ordenados alfabeticamente (pt-PT) por `name`.
 */
export async function listCards(): Promise<Card[]> {
  const all = await db.cards.toArray();
  return all.sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'));
}

/**
 * Lista os cartões de uma conta específica, via índice `accountId`.
 * Ordenados alfabeticamente (pt-PT) por `name`.
 */
export async function listCardsByAccount(accountId: string): Promise<Card[]> {
  const matched = await db.cards.where('accountId').equals(accountId).toArray();
  return matched.sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'));
}

export async function updateCard(id: string, patch: Partial<Card>): Promise<void> {
  // Story 3.1 Iter 2 (CodeRabbit #2) — validar o patch parcial antes da escrita.
  // `.partial()` mantém as regras de cada campo presente (closingDay/dueDay 1-31,
  // accountId UUID, limit inteiro em cêntimos).
  CardSchema.partial().parse(patch);
  const updated = await db.cards.update(id, patch);
  if (updated === 0) {
    throw new Error(`Cartão ${id} não encontrado — não foi possível actualizar`);
  }
}

export async function deleteCard(id: string): Promise<void> {
  await db.cards.delete(id);
}
