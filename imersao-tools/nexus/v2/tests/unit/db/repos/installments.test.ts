import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createInstallment,
  getInstallment,
  listInstallmentsByCard,
  updateInstallment,
  deleteInstallment,
} from '@/lib/db/repos/installments';
import type { Installment } from '@/types/db';

/**
 * Nexus v2 — installments repo tests (Story 3.1 / AC13)
 *
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeInstallment(overrides: Partial<Installment> = {}): Installment {
  return {
    id: crypto.randomUUID(),
    cardId: crypto.randomUUID(),
    totalAmount: 120000, // €1.200,00
    installments: 12,
    startDate: '2026-05-15',
    description: 'Compra parcelada de teste',
    ...overrides,
  };
}

describe('installments repo', () => {
  beforeEach(async () => {
    await db.installments.clear();
  });

  it('createInstallment + getInstallment roundtrip', async () => {
    const inst = makeInstallment();
    await createInstallment(inst);
    const retrieved = await getInstallment(inst.id);
    expect(retrieved).toEqual(inst);
  });

  it('createInstallment rejeita input inválido (Zod)', async () => {
    const invalid = makeInstallment({ id: 'not-a-uuid' });
    await expect(createInstallment(invalid)).rejects.toThrow();
  });

  it('createInstallment rejeita cardId ausente com mensagem PT-PT', async () => {
    const invalid = makeInstallment({ cardId: '' });
    await expect(createInstallment(invalid)).rejects.toThrow(/cardId é obrigatório/);
  });

  it('createInstallment rejeita installments <= 0', async () => {
    await expect(createInstallment(makeInstallment({ installments: 0 }))).rejects.toThrow(
      /maior que zero/,
    );
    await expect(createInstallment(makeInstallment({ installments: -3 }))).rejects.toThrow(
      /maior que zero/,
    );
  });

  it('listInstallmentsByCard filtra por cartão via índice composto [cardId+startDate]', async () => {
    const cardA = crypto.randomUUID();
    const cardB = crypto.randomUUID();
    await createInstallment(makeInstallment({ cardId: cardA, startDate: '2026-05-01' }));
    await createInstallment(makeInstallment({ cardId: cardB, startDate: '2026-05-02' }));
    await createInstallment(makeInstallment({ cardId: cardA, startDate: '2026-05-03' }));

    const matched = await listInstallmentsByCard(cardA);
    expect(matched).toHaveLength(2);
    matched.forEach((i) => expect(i.cardId).toBe(cardA));
  });

  it('listInstallmentsByCard ordena por startDate desc', async () => {
    const cardId = crypto.randomUUID();
    await createInstallment(makeInstallment({ cardId, startDate: '2026-05-01' }));
    await createInstallment(makeInstallment({ cardId, startDate: '2026-05-20' }));
    await createInstallment(makeInstallment({ cardId, startDate: '2026-05-10' }));

    const matched = await listInstallmentsByCard(cardId);
    expect(matched.map((i) => i.startDate)).toEqual([
      '2026-05-20',
      '2026-05-10',
      '2026-05-01',
    ]);
  });

  it('listInstallmentsByCard isola por cartão — devolve vazio para cartão sem compras', async () => {
    await createInstallment(makeInstallment({ cardId: crypto.randomUUID() }));
    const matched = await listInstallmentsByCard(crypto.randomUUID());
    expect(matched).toEqual([]);
  });

  it('updateInstallment aplica patch parcial', async () => {
    const inst = makeInstallment({ description: 'Antes' });
    await createInstallment(inst);
    await updateInstallment(inst.id, { description: 'Depois', installments: 24 });

    const updated = await getInstallment(inst.id);
    expect(updated?.description).toBe('Depois');
    expect(updated?.installments).toBe(24);
    expect(updated?.totalAmount).toBe(inst.totalAmount);
  });

  it('updateInstallment lança erro se id não existe', async () => {
    await expect(
      updateInstallment('00000000-0000-0000-0000-000000000000', { installments: 6 }),
    ).rejects.toThrow(/não encontrada/i);
  });

  it('deleteInstallment remove a compra parcelada', async () => {
    const inst = makeInstallment();
    await createInstallment(inst);
    await deleteInstallment(inst.id);
    expect(await getInstallment(inst.id)).toBeUndefined();
  });

  it('deleteInstallment é idempotente — não lança em id inexistente', async () => {
    await expect(
      deleteInstallment('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeUndefined();
  });
});
