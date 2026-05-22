import { describe, it, expect, beforeEach } from 'vitest';
import { ZodError } from 'zod';
import { db } from '@/lib/db/client';
import {
  createFinanceRecurrence,
  getFinanceRecurrence,
  listFinanceRecurrences,
  updateFinanceRecurrence,
  deleteFinanceRecurrence,
} from '@/lib/db/repos/finance-recurrences';
import { createRecurrence, getRecurrence } from '@/lib/db/repos/recurrences';
import type { FinanceRecurrence, Recurrence } from '@/types/db';

/**
 * Nexus v2 — finance-recurrences repo tests (Story 3.4 / AC13)
 *
 * Cobre o CRUD roundtrip de `FinanceRecurrence`, a cascata de eliminação
 * (`deleteFinanceRecurrence` elimina também a `Recurrence` associada) e a
 * validação `FinanceRecurrenceSchema`.
 */

/** Cria uma `Recurrence` genérica `ownerType: 'transaction'` para os testes. */
async function seedRecurrence(ownerId = ''): Promise<Recurrence> {
  const recurrence: Recurrence = {
    id: crypto.randomUUID(),
    rule: 'FREQ=MONTHLY;BYMONTHDAY=8',
    startDate: '2026-06-01',
    endDate: null,
    ownerType: 'transaction',
    ownerId: ownerId || crypto.randomUUID(),
  };
  await createRecurrence(recurrence);
  return recurrence;
}

function templateInput(
  recurrenceId: string,
  overrides: Partial<Omit<FinanceRecurrence, 'id' | 'createdAt'>> = {},
): Omit<FinanceRecurrence, 'id' | 'createdAt'> {
  return {
    amount: -65000, // saída de €650,00
    category: 'Habitação',
    description: 'Renda do apartamento',
    accountId: null,
    cardId: null,
    recurrenceId,
    ...overrides,
  };
}

describe('finance-recurrences repo — Story 3.4', () => {
  beforeEach(async () => {
    await db.financeRecurrences.clear();
    await db.recurrences.clear();
    await db.transactions.clear();
  });

  // T1 — createFinanceRecurrence gera id + createdAt
  it('T1 — createFinanceRecurrence gera id UUID e createdAt epoch ms', async () => {
    const recurrence = await seedRecurrence();
    const created = await createFinanceRecurrence(templateInput(recurrence.id));

    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(created.createdAt).toBeGreaterThan(0);
    expect(created.amount).toBe(-65000);
    expect(created.recurrenceId).toBe(recurrence.id);
  });

  // T2 — getFinanceRecurrence roundtrip
  it('T2 — getFinanceRecurrence devolve o registo criado', async () => {
    const recurrence = await seedRecurrence();
    const created = await createFinanceRecurrence(templateInput(recurrence.id));

    const fetched = await getFinanceRecurrence(created.id);
    expect(fetched).toEqual(created);
  });

  // T3 — getFinanceRecurrence inexistente devolve undefined
  it('T3 — getFinanceRecurrence devolve undefined para id inexistente', async () => {
    const fetched = await getFinanceRecurrence(crypto.randomUUID());
    expect(fetched).toBeUndefined();
  });

  // T4 — listFinanceRecurrences ordenado por createdAt desc
  it('T4 — listFinanceRecurrences ordena por createdAt descendente', async () => {
    const r1 = await seedRecurrence();
    const r2 = await seedRecurrence();
    const r3 = await seedRecurrence();

    const first = await createFinanceRecurrence(templateInput(r1.id));
    await new Promise((resolve) => setTimeout(resolve, 2));
    const second = await createFinanceRecurrence(templateInput(r2.id));
    await new Promise((resolve) => setTimeout(resolve, 2));
    const third = await createFinanceRecurrence(templateInput(r3.id));

    const list = await listFinanceRecurrences();
    expect(list.map((fr) => fr.id)).toEqual([third.id, second.id, first.id]);
  });

  // T5 — updateFinanceRecurrence aplica patch parcial
  it('T5 — updateFinanceRecurrence actualiza só os campos do patch', async () => {
    const recurrence = await seedRecurrence();
    const created = await createFinanceRecurrence(templateInput(recurrence.id));

    await updateFinanceRecurrence(created.id, {
      amount: -70000,
      description: 'Renda actualizada',
    });

    const fetched = await getFinanceRecurrence(created.id);
    expect(fetched?.amount).toBe(-70000);
    expect(fetched?.description).toBe('Renda actualizada');
    expect(fetched?.category).toBe('Habitação'); // inalterado
    expect(fetched?.id).toBe(created.id); // id preservado
    expect(fetched?.createdAt).toBe(created.createdAt); // createdAt preservado
  });

  // T6 — updateFinanceRecurrence lança para id inexistente
  it('T6 — updateFinanceRecurrence lança erro PT-PT para id inexistente', async () => {
    await expect(
      updateFinanceRecurrence(crypto.randomUUID(), { amount: -100 }),
    ).rejects.toThrow(/não encontrada/);
  });

  // T7 — deleteFinanceRecurrence elimina template + Recurrence (cascata AC3/AC12)
  it('T7 — deleteFinanceRecurrence elimina o template E a Recurrence associada', async () => {
    const recurrence = await seedRecurrence();
    const created = await createFinanceRecurrence(templateInput(recurrence.id));

    await deleteFinanceRecurrence(created.id);

    expect(await getFinanceRecurrence(created.id)).toBeUndefined();
    expect(await getRecurrence(recurrence.id)).toBeUndefined();
  });

  // T8 — deleteFinanceRecurrence lança para id inexistente
  it('T8 — deleteFinanceRecurrence lança erro PT-PT para id inexistente', async () => {
    await expect(deleteFinanceRecurrence(crypto.randomUUID())).rejects.toThrow(
      /não encontrada/,
    );
  });

  // T9 — FinanceRecurrenceSchema rejeita amount não-inteiro
  it('T9 — createFinanceRecurrence rejeita amount com casas decimais', async () => {
    const recurrence = await seedRecurrence();
    await expect(
      createFinanceRecurrence(templateInput(recurrence.id, { amount: -650.5 })),
    ).rejects.toThrow(ZodError);
  });

  // T10 — FinanceRecurrenceSchema rejeita category vazia
  it('T10 — createFinanceRecurrence rejeita category vazia', async () => {
    const recurrence = await seedRecurrence();
    let caught: unknown;
    try {
      await createFinanceRecurrence(templateInput(recurrence.id, { category: '' }));
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ZodError);
    expect((caught as ZodError).errors.some((e) => e.message === 'Categoria é obrigatória')).toBe(
      true,
    );
  });

  // T11 — FinanceRecurrenceSchema rejeita recurrenceId não-UUID
  it('T11 — createFinanceRecurrence rejeita recurrenceId não-UUID', async () => {
    await expect(
      createFinanceRecurrence(templateInput('not-a-uuid')),
    ).rejects.toThrow(ZodError);
  });

  // T12 — accountId/cardId opcionais aceitam null e UUID
  it('T12 — createFinanceRecurrence aceita accountId/cardId null e UUID', async () => {
    const recurrence = await seedRecurrence();
    const accountId = crypto.randomUUID();
    const created = await createFinanceRecurrence(
      templateInput(recurrence.id, { accountId, cardId: null }),
    );
    expect(created.accountId).toBe(accountId);
    expect(created.cardId).toBeNull();
  });
});
