import { describe, expect, it } from 'vitest';
import {
  aggregateCardTransactions,
  countInstallmentPayments,
  getBillingPeriods,
} from '@/lib/financas/cardBilling';
import type { Transaction } from '@/types/db';

/**
 * Story 3.8 — Tests para `lib/financas/cardBilling.ts`
 *
 * Foco:
 *   - Tabela canónica AC2 (`getBillingPeriods` — 5 casos, incluindo clamp Fev e
 *     dia de referência = dia de fecho).
 *   - `closingDay` inválido lança `RangeError` PT-PT.
 *   - `aggregateCardTransactions` com transações dentro/fora do período +
 *     separação in/out + array vazio.
 *   - `countInstallmentPayments` paid/remaining/total + clamp Fev + invariante.
 *
 * Determinismo: `reference: Date` injectado em todos os testes. Sem fake timers.
 */

function makeTx(
  partial: Partial<Transaction> & Pick<Transaction, 'amount' | 'date'>,
): Transaction {
  return {
    id: partial.id ?? 'tx-' + Math.random().toString(36).slice(2),
    amount: partial.amount,
    category: partial.category ?? 'Mercearia',
    description: partial.description ?? '',
    date: partial.date,
    accountId: partial.accountId ?? null,
    cardId: partial.cardId ?? null,
    recurrenceId: partial.recurrenceId ?? null,
    installmentId: partial.installmentId ?? null,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

describe('cardBilling — getBillingPeriods', () => {
  // AC2 — tabela canónica (5 casos exactos)

  it('AC2 caso 1: closingDay=15, today=2026-05-25 → current 15/05→14/06, next 15/06→14/07', () => {
    const result = getBillingPeriods(15, new Date(2026, 4, 25));
    expect(result.current.startISO).toBe('2026-05-15');
    expect(result.current.endISO).toBe('2026-06-14');
    expect(result.next.startISO).toBe('2026-06-15');
    expect(result.next.endISO).toBe('2026-07-14');
  });

  it('AC2 caso 2: closingDay=1, today=2026-05-15 → current 01/05→31/05, next 01/06→30/06', () => {
    const result = getBillingPeriods(1, new Date(2026, 4, 15));
    expect(result.current.startISO).toBe('2026-05-01');
    expect(result.current.endISO).toBe('2026-05-31');
    expect(result.next.startISO).toBe('2026-06-01');
    expect(result.next.endISO).toBe('2026-06-30');
  });

  it('AC2 caso 3: closingDay=31, today=2026-02-15 → current 31/01→27/02, next 28/02→30/03 (clamp Fev)', () => {
    const result = getBillingPeriods(31, new Date(2026, 1, 15));
    expect(result.current.startISO).toBe('2026-01-31');
    expect(result.current.endISO).toBe('2026-02-27');
    expect(result.next.startISO).toBe('2026-02-28');
    expect(result.next.endISO).toBe('2026-03-30');
  });

  it('AC2 caso 4: closingDay=15, today=2026-05-15 (dia de fecho) → corrente inicia hoje 15/05→14/06', () => {
    const result = getBillingPeriods(15, new Date(2026, 4, 15));
    expect(result.current.startISO).toBe('2026-05-15');
    expect(result.current.endISO).toBe('2026-06-14');
    expect(result.next.startISO).toBe('2026-06-15');
    expect(result.next.endISO).toBe('2026-07-14');
  });

  it('AC2 caso 5: closingDay=28, today=2026-03-01 → current 28/02→27/03, next 28/03→27/04', () => {
    const result = getBillingPeriods(28, new Date(2026, 2, 1));
    expect(result.current.startISO).toBe('2026-02-28');
    expect(result.current.endISO).toBe('2026-03-27');
    expect(result.next.startISO).toBe('2026-03-28');
    expect(result.next.endISO).toBe('2026-04-27');
  });

  // Edge cases adicionais

  it('cross-year: closingDay=15, today=2026-12-20 → current 15/12→14/01 (próximo ano)', () => {
    const result = getBillingPeriods(15, new Date(2026, 11, 20));
    expect(result.current.startISO).toBe('2026-12-15');
    expect(result.current.endISO).toBe('2027-01-14');
    expect(result.next.startISO).toBe('2027-01-15');
    expect(result.next.endISO).toBe('2027-02-14');
  });

  it('cross-year backward: closingDay=10, today=2026-01-05 → current 10/12/2025→09/01/2026', () => {
    const result = getBillingPeriods(10, new Date(2026, 0, 5));
    expect(result.current.startISO).toBe('2025-12-10');
    expect(result.current.endISO).toBe('2026-01-09');
    expect(result.next.startISO).toBe('2026-01-10');
    expect(result.next.endISO).toBe('2026-02-09');
  });

  it('cross-year edge: closingDay=1, today=2025-12-15 → proximoFecho=01/01/2026 e current.endISO=31/12/2025', () => {
    const result = getBillingPeriods(1, new Date(2025, 11, 15));
    expect(result.current.startISO).toBe('2025-12-01');
    expect(result.current.endISO).toBe('2025-12-31');
    expect(result.next.startISO).toBe('2026-01-01');
    expect(result.next.endISO).toBe('2026-01-31');
  });

  it('closingDay=31 com ano bissexto: today=2024-02-15 (Fev bissexto, 29 dias)', () => {
    const result = getBillingPeriods(31, new Date(2024, 1, 15));
    expect(result.current.startISO).toBe('2024-01-31');
    expect(result.current.endISO).toBe('2024-02-28');
    expect(result.next.startISO).toBe('2024-02-29');
    expect(result.next.endISO).toBe('2024-03-30');
  });

  // Validação

  it('lança RangeError PT-PT quando closingDay é 0', () => {
    expect(() => getBillingPeriods(0, new Date(2026, 4, 25))).toThrow(RangeError);
    expect(() => getBillingPeriods(0, new Date(2026, 4, 25))).toThrow(
      /closingDay deve ser inteiro entre 1 e 31/,
    );
  });

  it('lança RangeError quando closingDay é 32', () => {
    expect(() => getBillingPeriods(32, new Date(2026, 4, 25))).toThrow(RangeError);
  });

  it('lança RangeError quando closingDay é negativo', () => {
    expect(() => getBillingPeriods(-1, new Date(2026, 4, 25))).toThrow(RangeError);
  });

  it('lança RangeError quando closingDay não é inteiro', () => {
    expect(() => getBillingPeriods(15.5, new Date(2026, 4, 25))).toThrow(RangeError);
  });
});

describe('cardBilling — aggregateCardTransactions', () => {
  const period = { startISO: '2026-05-15', endISO: '2026-06-14' };

  it('filtra transações fora do período e soma apenas as dentro', () => {
    const transactions = [
      makeTx({ amount: -5000, date: '2026-05-14' }), // fora — antes
      makeTx({ amount: -3000, date: '2026-05-15' }), // dentro — limite inferior
      makeTx({ amount: -7000, date: '2026-06-01' }), // dentro
      makeTx({ amount: 1000, date: '2026-06-14' }), // dentro — limite superior
      makeTx({ amount: -2000, date: '2026-06-15' }), // fora — depois
    ];
    const result = aggregateCardTransactions(transactions, period);
    expect(result.count).toBe(3);
    expect(result.inflowCents).toBe(1000);
    expect(result.outflowCents).toBe(-10000);
    expect(result.totalCents).toBe(-9000);
  });

  it('separa inflow e outflow correctamente', () => {
    const transactions = [
      makeTx({ amount: 50000, date: '2026-05-20' }),
      makeTx({ amount: -30000, date: '2026-05-21' }),
      makeTx({ amount: 20000, date: '2026-06-01' }),
      makeTx({ amount: -10000, date: '2026-06-10' }),
    ];
    const result = aggregateCardTransactions(transactions, period);
    expect(result.inflowCents).toBe(70000);
    expect(result.outflowCents).toBe(-40000);
    expect(result.totalCents).toBe(30000);
    expect(result.count).toBe(4);
  });

  it('array vazio devolve totais a zero', () => {
    const result = aggregateCardTransactions([], period);
    expect(result.inflowCents).toBe(0);
    expect(result.outflowCents).toBe(0);
    expect(result.totalCents).toBe(0);
    expect(result.count).toBe(0);
  });

  it('todas as transações fora do período devolvem totais a zero', () => {
    const transactions = [
      makeTx({ amount: -5000, date: '2026-05-14' }),
      makeTx({ amount: -5000, date: '2026-06-15' }),
    ];
    const result = aggregateCardTransactions(transactions, period);
    expect(result.count).toBe(0);
    expect(result.totalCents).toBe(0);
  });

  it('invariante: totalCents === inflowCents + outflowCents', () => {
    const transactions = [
      makeTx({ amount: 12345, date: '2026-05-20' }),
      makeTx({ amount: -6789, date: '2026-06-01' }),
      makeTx({ amount: 1000, date: '2026-06-10' }),
    ];
    const result = aggregateCardTransactions(transactions, period);
    expect(result.totalCents).toBe(result.inflowCents + result.outflowCents);
  });

  it('transações com amount=0 são contadas mas não somadas', () => {
    const transactions = [
      makeTx({ amount: 0, date: '2026-05-20' }),
      makeTx({ amount: 5000, date: '2026-05-21' }),
    ];
    const result = aggregateCardTransactions(transactions, period);
    expect(result.count).toBe(2);
    expect(result.totalCents).toBe(5000);
  });
});

describe('cardBilling — countInstallmentPayments', () => {
  it('12 parcelas começando em 01/01/2026, referência 01/06/2026 → paid=6 remaining=6', () => {
    const result = countInstallmentPayments('2026-01-01', 12, new Date(2026, 5, 1));
    expect(result.paid).toBe(6);
    expect(result.remaining).toBe(6);
    expect(result.totalMonths).toBe(12);
  });

  it('3 parcelas com startDate=2026-05-01, ref=2026-04-30 → paid=0', () => {
    const result = countInstallmentPayments('2026-05-01', 3, new Date(2026, 3, 30));
    expect(result.paid).toBe(0);
    expect(result.remaining).toBe(3);
    expect(result.totalMonths).toBe(3);
  });

  it('clamp Feb: startDate=2026-01-31, n=3, ref=2026-03-28 → paid=2 (Jan + Fev clampado a 28)', () => {
    // installmentDates(2026-01-31, 3) = [2026-01-31, 2026-02-28, 2026-03-31]
    // ref = 2026-03-28 → datas <= ref: 2026-01-31 (Jan) e 2026-02-28 (Fev) ⇒ paid=2
    const result = countInstallmentPayments('2026-01-31', 3, new Date(2026, 2, 28));
    expect(result.paid).toBe(2);
    expect(result.remaining).toBe(1);
    expect(result.totalMonths).toBe(3);
  });

  it('todas as parcelas pagas: ref muito posterior', () => {
    const result = countInstallmentPayments('2026-01-01', 6, new Date(2027, 0, 1));
    expect(result.paid).toBe(6);
    expect(result.remaining).toBe(0);
    expect(result.totalMonths).toBe(6);
  });

  it('referência igual ao dia da 1ª parcela conta como paga', () => {
    const result = countInstallmentPayments('2026-05-15', 4, new Date(2026, 4, 15));
    expect(result.paid).toBe(1);
    expect(result.remaining).toBe(3);
  });

  it('invariante: paid + remaining === totalMonths', () => {
    const inputs: Array<[string, number, Date]> = [
      ['2026-01-01', 12, new Date(2026, 5, 15)],
      ['2026-05-31', 5, new Date(2026, 7, 10)],
      ['2025-12-01', 24, new Date(2026, 5, 30)],
      ['2026-02-28', 3, new Date(2026, 0, 1)],
    ];
    for (const [start, n, ref] of inputs) {
      const r = countInstallmentPayments(start, n, ref);
      expect(r.paid + r.remaining).toBe(r.totalMonths);
      expect(r.totalMonths).toBe(n);
    }
  });

  // Story 3.8 CR Iter 2 (N1) — caminhos de erro explícitos: `countInstallmentPayments`
  // propaga validações de `installmentDates` (Story 3.6) sem swallow silencioso.

  it('propaga erro quando startDate é inválida', () => {
    expect(() =>
      countInstallmentPayments('data-invalida', 3, new Date(2026, 4, 1)),
    ).toThrow();
  });

  it('propaga erro quando n é inválido (0)', () => {
    expect(() =>
      countInstallmentPayments('2026-05-01', 0, new Date(2026, 4, 1)),
    ).toThrow();
  });
});
