import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
} from '@/lib/db/repos/transactions';
import type { Transaction } from '@/types/db';

/**
 * Nexus v2 — transactions repo tests (Story 3.1 / AC13)
 *
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: crypto.randomUUID(),
    amount: -1500, // saída de €15,00 em cêntimos
    category: 'Mercearia',
    description: 'Compra de teste',
    date: '2026-05-15',
    accountId: null,
    cardId: null,
    recurrenceId: null,
    installmentId: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

describe('transactions repo', () => {
  beforeEach(async () => {
    await db.transactions.clear();
  });

  it('createTransaction + getTransaction roundtrip', async () => {
    const tx = makeTransaction();
    await createTransaction(tx);
    const retrieved = await getTransaction(tx.id);
    expect(retrieved).toEqual(tx);
  });

  it('createTransaction aceita amount positivo (entrada) e negativo (saída)', async () => {
    await expect(createTransaction(makeTransaction({ amount: 50000 }))).resolves.toBeDefined();
    await expect(createTransaction(makeTransaction({ amount: -2500 }))).resolves.toBeDefined();
  });

  it('createTransaction rejeita input inválido (Zod)', async () => {
    const invalid = makeTransaction({ id: 'not-a-uuid' });
    await expect(createTransaction(invalid)).rejects.toThrow();
  });

  it('createTransaction rejeita amount decimal (cêntimos devem ser inteiros)', async () => {
    const invalid = makeTransaction({ amount: 15.99 });
    await expect(createTransaction(invalid)).rejects.toThrow(/inteiro em cêntimos/);
  });

  it('listTransactions ordena por date desc', async () => {
    await createTransaction(makeTransaction({ date: '2026-05-10' }));
    await createTransaction(makeTransaction({ date: '2026-05-20' }));
    await createTransaction(makeTransaction({ date: '2026-05-15' }));

    const result = await listTransactions();
    expect(result.map((t) => t.date)).toEqual(['2026-05-20', '2026-05-15', '2026-05-10']);
  });

  it('listTransactions filtra por accountId', async () => {
    const accountId = crypto.randomUUID();
    await createTransaction(makeTransaction({ accountId }));
    await createTransaction(makeTransaction({ accountId: null }));
    await createTransaction(makeTransaction({ accountId }));

    const matched = await listTransactions({ accountId });
    expect(matched).toHaveLength(2);
    matched.forEach((t) => expect(t.accountId).toBe(accountId));
  });

  it('listTransactions filtra por cardId', async () => {
    const cardId = crypto.randomUUID();
    await createTransaction(makeTransaction({ cardId }));
    await createTransaction(makeTransaction({ cardId: null }));
    await createTransaction(makeTransaction({ cardId }));

    const matched = await listTransactions({ cardId });
    expect(matched).toHaveLength(2);
    matched.forEach((t) => expect(t.cardId).toBe(cardId));
  });

  it('listTransactions filtra por category', async () => {
    await createTransaction(makeTransaction({ category: 'Mercearia' }));
    await createTransaction(makeTransaction({ category: 'Combustível' }));
    await createTransaction(makeTransaction({ category: 'Mercearia' }));

    const matched = await listTransactions({ category: 'Mercearia' });
    expect(matched).toHaveLength(2);
    matched.forEach((t) => expect(t.category).toBe('Mercearia'));
  });

  it('listTransactions filtra por range de datas (dateFrom/dateTo inclusivo)', async () => {
    await createTransaction(makeTransaction({ date: '2026-05-01' }));
    await createTransaction(makeTransaction({ date: '2026-05-15' }));
    await createTransaction(makeTransaction({ date: '2026-05-31' }));
    await createTransaction(makeTransaction({ date: '2026-06-05' }));

    const matched = await listTransactions({ dateFrom: '2026-05-01', dateTo: '2026-05-31' });
    expect(matched).toHaveLength(3);
    matched.forEach((t) => {
      expect(t.date >= '2026-05-01').toBe(true);
      expect(t.date <= '2026-05-31').toBe(true);
    });
  });

  it('listTransactions filtra por recurrenceId', async () => {
    const recurrenceId = crypto.randomUUID();
    await createTransaction(makeTransaction({ recurrenceId }));
    await createTransaction(makeTransaction({ recurrenceId: null }));

    const matched = await listTransactions({ recurrenceId });
    expect(matched).toHaveLength(1);
    expect(matched[0].recurrenceId).toBe(recurrenceId);
  });

  it('listTransactions filtra por installmentId', async () => {
    const installmentId = crypto.randomUUID();
    await createTransaction(makeTransaction({ installmentId }));
    await createTransaction(makeTransaction({ installmentId: null }));

    const matched = await listTransactions({ installmentId });
    expect(matched).toHaveLength(1);
    expect(matched[0].installmentId).toBe(installmentId);
  });

  it('listTransactions combina filtros (cardId + category)', async () => {
    const cardId = crypto.randomUUID();
    await createTransaction(makeTransaction({ cardId, category: 'Mercearia' }));
    await createTransaction(makeTransaction({ cardId, category: 'Combustível' }));
    await createTransaction(makeTransaction({ cardId: null, category: 'Mercearia' }));

    const matched = await listTransactions({ cardId, category: 'Mercearia' });
    expect(matched).toHaveLength(1);
    expect(matched[0].cardId).toBe(cardId);
    expect(matched[0].category).toBe('Mercearia');
  });

  it('listTransactions respeita opção limit', async () => {
    for (let i = 0; i < 5; i++) {
      await createTransaction(makeTransaction({ date: `2026-05-1${i}` }));
    }
    const result = await listTransactions({ limit: 3 });
    expect(result).toHaveLength(3);
  });

  // Story 3.1 Iter 2 (CodeRabbit #5) — limit normalizado para inteiro não-negativo.
  it('listTransactions normaliza limit decimal via Math.floor (3.9 → 3)', async () => {
    for (let i = 0; i < 5; i++) {
      await createTransaction(makeTransaction({ date: `2026-05-1${i}` }));
    }
    const result = await listTransactions({ limit: 3.9 });
    expect(result).toHaveLength(3);
  });

  it('listTransactions trata limit negativo como o default (não devolve vazio)', async () => {
    for (let i = 0; i < 5; i++) {
      await createTransaction(makeTransaction({ date: `2026-05-1${i}` }));
    }
    const result = await listTransactions({ limit: -1 });
    expect(result).toHaveLength(5);
  });

  it('listTransactions trata limit NaN como o default', async () => {
    for (let i = 0; i < 5; i++) {
      await createTransaction(makeTransaction({ date: `2026-05-1${i}` }));
    }
    const result = await listTransactions({ limit: NaN });
    expect(result).toHaveLength(5);
  });

  it('listTransactions trata limit zero como zero resultados', async () => {
    await createTransaction(makeTransaction());
    const result = await listTransactions({ limit: 0 });
    expect(result).toHaveLength(0);
  });

  // Story 3.1 Iter 3 (CodeRabbit #3) — limit acima de MAX_LIMIT é limitado ao tecto.
  it('listTransactions limita limit > MAX_LIMIT ao tecto de 1000', async () => {
    for (let i = 0; i < 1005; i++) {
      await createTransaction(makeTransaction({ id: crypto.randomUUID() }));
    }
    const result = await listTransactions({ limit: 999999 });
    expect(result.length).toBeLessThanOrEqual(1000);
    expect(result).toHaveLength(1000);
  });

  it('updateTransaction aplica patch parcial', async () => {
    const tx = makeTransaction({ amount: -1000 });
    await createTransaction(tx);
    await updateTransaction(tx.id, { amount: -2000, category: 'Saúde' });

    const updated = await getTransaction(tx.id);
    expect(updated?.amount).toBe(-2000);
    expect(updated?.category).toBe('Saúde');
    expect(updated?.description).toBe(tx.description);
  });

  it('updateTransaction lança erro se id não existe', async () => {
    await expect(
      updateTransaction('00000000-0000-0000-0000-000000000000', { amount: 1 }),
    ).rejects.toThrow(/não encontrada/i);
  });

  // Story 3.1 Iter 2 (CodeRabbit #6) — updateTransaction valida o patch parcial.
  it('updateTransaction rejeita patch com amount decimal', async () => {
    const tx = makeTransaction();
    await createTransaction(tx);

    await expect(
      updateTransaction(tx.id, { amount: 15.99 }),
    ).rejects.toThrow(/inteiro em cêntimos/);

    // A transação permanece intacta após a tentativa inválida.
    const unchanged = await getTransaction(tx.id);
    expect(unchanged?.amount).toBe(tx.amount);
  });

  it('updateTransaction rejeita patch com date em formato não-ISO', async () => {
    const tx = makeTransaction();
    await createTransaction(tx);

    await expect(
      updateTransaction(tx.id, { date: '15/05/2026' }),
    ).rejects.toThrow(/ISO 8601/);
  });

  it('updateTransaction rejeita patch com cardId não-UUID', async () => {
    const tx = makeTransaction();
    await createTransaction(tx);

    await expect(
      updateTransaction(tx.id, { cardId: 'cartao-1' }),
    ).rejects.toThrow(/cardId deve ser UUID válido/);
  });

  it('deleteTransaction remove a transação', async () => {
    const tx = makeTransaction();
    await createTransaction(tx);
    await deleteTransaction(tx.id);
    expect(await getTransaction(tx.id)).toBeUndefined();
  });

  it('deleteTransaction é idempotente — não lança em id inexistente', async () => {
    await expect(
      deleteTransaction('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
  });
});
