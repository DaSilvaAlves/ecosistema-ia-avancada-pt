import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createCard,
  getCard,
  listCards,
  listCardsByAccount,
  updateCard,
  deleteCard,
} from '@/lib/db/repos/cards';
import type { Card } from '@/types/db';

/**
 * Nexus v2 — cards repo tests (Story 3.1 / AC13)
 *
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeCard(overrides: Partial<Card> = {}): Card {
  return {
    id: crypto.randomUUID(),
    name: 'Cartão Crédito',
    accountId: crypto.randomUUID(),
    closingDay: 25,
    dueDay: 10,
    limit: 500000, // €5.000,00
    ...overrides,
  };
}

describe('cards repo', () => {
  beforeEach(async () => {
    await db.cards.clear();
  });

  it('createCard + getCard roundtrip', async () => {
    const card = makeCard();
    await createCard(card);
    const retrieved = await getCard(card.id);
    expect(retrieved).toEqual(card);
  });

  it('createCard aceita limit null', async () => {
    const card = makeCard({ limit: null });
    await createCard(card);
    const retrieved = await getCard(card.id);
    expect(retrieved?.limit).toBeNull();
  });

  it('createCard rejeita input inválido (Zod)', async () => {
    const invalid = makeCard({ id: 'not-a-uuid' });
    await expect(createCard(invalid)).rejects.toThrow();
  });

  it('createCard rejeita accountId não-UUID com mensagem PT-PT', async () => {
    // Story 3.1 Iter 2 (CodeRabbit #7) — accountId é validado como UUID;
    // uma string vazia ou não-UUID falha a validação.
    const invalid = makeCard({ accountId: '' });
    await expect(createCard(invalid)).rejects.toThrow(/accountId deve ser UUID válido/);
    const notUuid = makeCard({ accountId: 'conta-1' });
    await expect(createCard(notUuid)).rejects.toThrow(/accountId deve ser UUID válido/);
  });

  it('createCard rejeita closingDay fora do intervalo 1-31', async () => {
    await expect(createCard(makeCard({ closingDay: 0 }))).rejects.toThrow(/Dia de fecho/);
    await expect(createCard(makeCard({ closingDay: 32 }))).rejects.toThrow(/Dia de fecho/);
  });

  it('listCards ordena alfabeticamente (pt-PT)', async () => {
    await createCard(makeCard({ name: 'Zen' }));
    await createCard(makeCard({ name: 'Ácido' }));
    await createCard(makeCard({ name: 'Maçã' }));

    const result = await listCards();
    expect(result.map((c) => c.name)).toEqual(['Ácido', 'Maçã', 'Zen']);
  });

  it('listCardsByAccount filtra por conta via índice accountId', async () => {
    const accountA = crypto.randomUUID();
    const accountB = crypto.randomUUID();
    await createCard(makeCard({ accountId: accountA, name: 'A1' }));
    await createCard(makeCard({ accountId: accountB, name: 'B1' }));
    await createCard(makeCard({ accountId: accountA, name: 'A2' }));

    const matched = await listCardsByAccount(accountA);
    expect(matched).toHaveLength(2);
    matched.forEach((c) => expect(c.accountId).toBe(accountA));
  });

  it('listCardsByAccount devolve vazio para conta sem cartões', async () => {
    await createCard(makeCard({ accountId: crypto.randomUUID() }));
    const matched = await listCardsByAccount(crypto.randomUUID());
    expect(matched).toEqual([]);
  });

  it('updateCard aplica patch parcial', async () => {
    const card = makeCard({ name: 'Antes' });
    await createCard(card);
    await updateCard(card.id, { name: 'Depois', dueDay: 15 });

    const updated = await getCard(card.id);
    expect(updated?.name).toBe('Depois');
    expect(updated?.dueDay).toBe(15);
    expect(updated?.closingDay).toBe(card.closingDay);
  });

  it('updateCard lança erro se id não existe', async () => {
    await expect(
      updateCard('00000000-0000-0000-0000-000000000000', { name: 'X' }),
    ).rejects.toThrow(/não encontrado/i);
  });

  // Story 3.1 Iter 2 (CodeRabbit #2) — updateCard valida o patch parcial.
  it('updateCard rejeita patch com closingDay fora do intervalo 1-31', async () => {
    const card = makeCard();
    await createCard(card);

    await expect(updateCard(card.id, { closingDay: 0 })).rejects.toThrow(/Dia de fecho/);
    await expect(updateCard(card.id, { closingDay: 32 })).rejects.toThrow(/Dia de fecho/);

    // O cartão permanece intacto após as tentativas inválidas.
    const unchanged = await getCard(card.id);
    expect(unchanged?.closingDay).toBe(card.closingDay);
  });

  it('updateCard rejeita patch com accountId não-UUID', async () => {
    const card = makeCard();
    await createCard(card);

    await expect(
      updateCard(card.id, { accountId: 'conta-1' }),
    ).rejects.toThrow(/accountId deve ser UUID válido/);
  });

  it('deleteCard remove o cartão', async () => {
    const card = makeCard();
    await createCard(card);
    await deleteCard(card.id);
    expect(await getCard(card.id)).toBeUndefined();
  });

  it('deleteCard é idempotente — não lança em id inexistente', async () => {
    await expect(
      deleteCard('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
  });
});
