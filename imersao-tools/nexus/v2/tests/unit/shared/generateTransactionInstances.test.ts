import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db/client';
import {
  buildRecurrenceConfig,
  buildRRule,
  generateTransactionInstances,
  runFinanceRecurrenceEngine,
} from '@/lib/shared/recurrence';
import { listTransactions } from '@/lib/db/repos/transactions';
import { createRecurrence } from '@/lib/db/repos/recurrences';
import { createFinanceRecurrence } from '@/lib/db/repos/finance-recurrences';
import type { FinanceRecurrence, Recurrence } from '@/types/db';

/**
 * Nexus v2 — generateTransactionInstances / runFinanceRecurrenceEngine tests
 * (Story 3.4 / AC13)
 *
 * Foco de risco da story: idempotência da geração de transações recorrentes.
 *
 * Instante de referência fixado via parâmetro `nowMs` do motor (não fake timers
 * — combinar fake timers com Dexie/IndexedDB quebra as operações async).
 * `2026-06-01` é uma Segunda-feira.
 */

const NOW_MS = new Date('2026-06-01T09:00:00.000Z').getTime();

/**
 * Cria a `Recurrence` (RRULE + datas) na DB. `ownerId` aponta para o template
 * financeiro. Retorna o registo persistido.
 */
async function seedRecurrence(
  ownerId: string,
  opts: {
    type?: 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    endDate?: string | null;
    monthday?: number;
    weekday?: number;
  } = {},
): Promise<Recurrence> {
  const config = buildRecurrenceConfig(opts.type ?? 'monthly', {
    startDate: opts.startDate ?? '2026-06-01',
    endDate: opts.endDate ?? null,
    monthday: opts.monthday ?? 8,
    weekday: opts.weekday,
  });
  const recurrence: Recurrence = {
    id: crypto.randomUUID(),
    rule: buildRRule(config).toString(),
    startDate: config.startDate,
    endDate: config.endDate ?? null,
    ownerType: 'transaction',
    ownerId,
  };
  await createRecurrence(recurrence);
  return recurrence;
}

/** Cria o template `FinanceRecurrence` na DB. */
async function seedFinanceRecurrence(
  recurrenceId: string,
  overrides: Partial<Omit<FinanceRecurrence, 'id' | 'createdAt'>> = {},
): Promise<FinanceRecurrence> {
  return createFinanceRecurrence({
    amount: -65000,
    category: 'Habitação',
    description: 'Renda do apartamento',
    accountId: null,
    cardId: null,
    recurrenceId,
    ...overrides,
  });
}

describe('generateTransactionInstances — Story 3.4', () => {
  beforeEach(async () => {
    await db.financeRecurrences.clear();
    await db.recurrences.clear();
    await db.transactions.clear();
  });

  // T1 — recorrência mensal, horizonte 90 dias → N instâncias geradas
  it('T1 — recorrência mensal dia 8 gera ~3 transações em 90 dias', async () => {
    const frId = crypto.randomUUID();
    const recurrence = await seedRecurrence(frId, { type: 'monthly', monthday: 8 });
    const fr = await seedFinanceRecurrence(recurrence.id);

    const result = await generateTransactionInstances(fr, recurrence, 90, NOW_MS);

    // Dias 8 de Jun, Jul, Ago dentro da janela 01/06 → 29/08.
    expect(result.created).toBe(3);
    expect(result.skipped).toBe(0);

    const transactions = await listTransactions({ recurrenceId: recurrence.id });
    expect(transactions).toHaveLength(3);
    expect(transactions.map((t) => t.date).sort()).toEqual([
      '2026-06-08',
      '2026-07-08',
      '2026-08-08',
    ]);
  });

  // T2 — idempotência: 2ª corrida não duplica
  it('T2 — segunda corrida é idempotente (skipped === created da 1ª)', async () => {
    const frId = crypto.randomUUID();
    const recurrence = await seedRecurrence(frId, { type: 'monthly', monthday: 8 });
    const fr = await seedFinanceRecurrence(recurrence.id);

    const first = await generateTransactionInstances(fr, recurrence, 90, NOW_MS);
    const second = await generateTransactionInstances(fr, recurrence, 90, NOW_MS);

    expect(second.created).toBe(0);
    expect(second.skipped).toBe(first.created);

    const transactions = await listTransactions({ recurrenceId: recurrence.id });
    expect(transactions).toHaveLength(first.created);
  });

  // T3 — respeita endDate
  it('T3 — não gera transações após endDate da recorrência', async () => {
    const frId = crypto.randomUUID();
    const recurrence = await seedRecurrence(frId, {
      type: 'monthly',
      monthday: 8,
      endDate: '2026-07-08',
    });
    const fr = await seedFinanceRecurrence(recurrence.id);

    const result = await generateTransactionInstances(fr, recurrence, 90, NOW_MS);

    // Só 08/06 e 08/07 — 08/08 cai depois do endDate.
    expect(result.created).toBe(2);
    const transactions = await listTransactions({ recurrenceId: recurrence.id });
    expect(transactions.map((t) => t.date).sort()).toEqual([
      '2026-06-08',
      '2026-07-08',
    ]);
  });

  // T4 — campos da transação gerada estão correctos
  it('T4 — transação gerada tem amount, category, recurrenceId e installmentId correctos', async () => {
    const frId = crypto.randomUUID();
    const recurrence = await seedRecurrence(frId, { type: 'monthly', monthday: 8 });
    const fr = await seedFinanceRecurrence(recurrence.id, {
      amount: -65000,
      category: 'Habitação',
      description: 'Renda',
    });

    await generateTransactionInstances(fr, recurrence, 90, NOW_MS);
    const [tx] = await listTransactions({ recurrenceId: recurrence.id });

    expect(tx.amount).toBe(-65000); // cêntimos, sinal negativo (saída)
    expect(tx.category).toBe('Habitação');
    expect(tx.description).toBe('Renda');
    expect(tx.recurrenceId).toBe(recurrence.id);
    expect(tx.installmentId).toBeNull();
    expect(tx.accountId).toBeNull();
    expect(tx.cardId).toBeNull();
  });

  // T5 — entrada (amount positivo) propaga sinal correctamente
  it('T5 — recorrência de entrada gera transações com amount positivo', async () => {
    const frId = crypto.randomUUID();
    const recurrence = await seedRecurrence(frId, { type: 'monthly', monthday: 1 });
    const fr = await seedFinanceRecurrence(recurrence.id, {
      amount: 120000, // entrada de €1.200,00 (salário)
      category: 'Rendimento',
    });

    await generateTransactionInstances(fr, recurrence, 90, NOW_MS);
    const transactions = await listTransactions({ recurrenceId: recurrence.id });

    expect(transactions.length).toBeGreaterThan(0);
    for (const tx of transactions) {
      expect(tx.amount).toBe(120000);
    }
  });

  // T6 — recorrência diária gera horizonte completo
  it('T6 — recorrência diária gera uma transação por dia do horizonte', async () => {
    const frId = crypto.randomUUID();
    const recurrence = await seedRecurrence(frId, { type: 'daily' });
    const fr = await seedFinanceRecurrence(recurrence.id);

    const result = await generateTransactionInstances(fr, recurrence, 10, NOW_MS);
    expect(result.created).toBe(10);
  });

  // T7 — rule corrompida lança erro (tolerância delegada ao motor)
  it('T7 — generateTransactionInstances lança para rule RRULE corrompida', async () => {
    const frId = crypto.randomUUID();
    const recurrence = await seedRecurrence(frId, { type: 'monthly', monthday: 8 });
    const fr = await seedFinanceRecurrence(recurrence.id);

    const corrupted: Recurrence = { ...recurrence, rule: 'isto-nao-e-uma-rrule' };
    await expect(
      generateTransactionInstances(fr, corrupted, 90, NOW_MS),
    ).rejects.toThrow();
  });
});

describe('runFinanceRecurrenceEngine — Story 3.4', () => {
  beforeEach(async () => {
    await db.financeRecurrences.clear();
    await db.recurrences.clear();
    await db.transactions.clear();
  });

  // T8 — 2 recorrências activas → contadores agregados correctos
  it('T8 — processa todas as recorrências financeiras e agrega contadores', async () => {
    const fr1Id = crypto.randomUUID();
    const rec1 = await seedRecurrence(fr1Id, { type: 'monthly', monthday: 8 });
    await seedFinanceRecurrence(rec1.id);

    const fr2Id = crypto.randomUUID();
    const rec2 = await seedRecurrence(fr2Id, { type: 'monthly', monthday: 1 });
    await seedFinanceRecurrence(rec2.id, { category: 'Subscrições', amount: -1099 });

    const result = await runFinanceRecurrenceEngine(NOW_MS);

    expect(result.errors).toBe(0);
    expect(result.created).toBeGreaterThan(0);
    expect(result.skipped).toBe(0);

    // Segunda corrida — tudo skipped, nada criado.
    const second = await runFinanceRecurrenceEngine(NOW_MS);
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(result.created);
    expect(second.errors).toBe(0);
  });

  // T9 — tolerância a erros: 1 recorrência corrompida → errors === 1, outra processada
  it('T9 — uma recorrência corrompida não interrompe as restantes', async () => {
    // Recorrência válida.
    const okId = crypto.randomUUID();
    const recOk = await seedRecurrence(okId, { type: 'monthly', monthday: 8 });
    await seedFinanceRecurrence(recOk.id);

    // Recorrência com RRULE corrompida — o engine deve contá-la como erro.
    const badId = crypto.randomUUID();
    const badRecurrenceId = crypto.randomUUID();
    await db.recurrences.add({
      id: badRecurrenceId,
      rule: 'rrule-invalida',
      startDate: '2026-06-01',
      endDate: null,
      ownerType: 'transaction',
      ownerId: badId,
    });
    await seedFinanceRecurrence(badRecurrenceId, { category: 'Habitação' });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await runFinanceRecurrenceEngine(NOW_MS);
    consoleSpy.mockRestore();

    expect(result.errors).toBe(1);
    expect(result.created).toBeGreaterThan(0); // a recorrência válida foi processada
  });

  // T10 — template financeiro sem Recurrence associada → conta como erro
  it('T10 — template sem Recurrence correspondente é contado como erro', async () => {
    // FinanceRecurrence cujo recurrenceId não existe na tabela recurrences.
    await seedFinanceRecurrence(crypto.randomUUID());

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await runFinanceRecurrenceEngine(NOW_MS);
    consoleSpy.mockRestore();

    expect(result.errors).toBe(1);
    expect(result.created).toBe(0);
  });

  // T11 — sem recorrências → contadores a zero
  it('T11 — engine sem recorrências devolve contadores a zero', async () => {
    const result = await runFinanceRecurrenceEngine(NOW_MS);
    expect(result).toEqual({ created: 0, skipped: 0, errors: 0 });
  });
});
