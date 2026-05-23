import { describe, expect, it } from 'vitest';
import {
  aggregateByCategory,
  aggregateByDay,
  aggregateInOut,
  getMonthBounds,
  getProjectionWindow,
} from '@/lib/financas/monthAggregations';
import type { Transaction } from '@/types/db';

/**
 * Nexus v2 — Testes de `lib/financas/monthAggregations.ts` (Story 3.7, AC11)
 *
 * Cobre as 5 funções puras da vista mensal (FR21):
 *   - `getMonthBounds` — bounds correctos em Fev (bissexto/não-bissexto),
 *     30 dias (Abr/Jun/Set/Nov) e 31 dias.
 *   - `getProjectionWindow` — janela rolling default 30d, cavalo de ano,
 *     `days = 1`, `RangeError` em `days < 1` ou não-inteiro.
 *   - `aggregateInOut` — somas separadas in/out + invariante de soma.
 *   - `aggregateByCategory` — ordem desc por |sum|, separação in/out,
 *     filtragem de `sumCents === 0`.
 *   - `aggregateByDay` — ordem asc por dateISO, filtragem de dias vazios.
 *
 * Determinismo: zero `new Date()` interno aos testes — `Date` injectado via
 * argumento (lição da Story 3.4 A6: fake timers + Dexie quebram ops async).
 */

// Factory helper para reduzir verbose nos test cases (sem inflar invariantes).
function makeTx(partial: Partial<Transaction>): Transaction {
  return {
    id: partial.id ?? `tx-${Math.random().toString(36).slice(2)}`,
    amount: partial.amount ?? 0,
    category: partial.category ?? 'Mercearia',
    description: partial.description ?? '',
    date: partial.date ?? '2026-05-15',
    accountId: partial.accountId ?? null,
    cardId: partial.cardId ?? null,
    recurrenceId: partial.recurrenceId ?? null,
    installmentId: partial.installmentId ?? null,
    createdAt: partial.createdAt ?? 0,
  };
}

describe('getMonthBounds', () => {
  it('Mês padrão de 31 dias (Janeiro)', () => {
    expect(getMonthBounds(new Date('2026-01-15'))).toEqual({
      startISO: '2026-01-01',
      endISO: '2026-01-31',
    });
  });

  it('Fevereiro não-bissexto (2026)', () => {
    expect(getMonthBounds(new Date('2026-02-15'))).toEqual({
      startISO: '2026-02-01',
      endISO: '2026-02-28',
    });
  });

  it('Fevereiro bissexto (2028)', () => {
    expect(getMonthBounds(new Date('2028-02-15'))).toEqual({
      startISO: '2028-02-01',
      endISO: '2028-02-29',
    });
  });

  it('Mês de 30 dias (Abril)', () => {
    expect(getMonthBounds(new Date('2026-04-15'))).toEqual({
      startISO: '2026-04-01',
      endISO: '2026-04-30',
    });
  });

  it('Mês de 30 dias (Novembro)', () => {
    expect(getMonthBounds(new Date('2026-11-08'))).toEqual({
      startISO: '2026-11-01',
      endISO: '2026-11-30',
    });
  });

  it('Mês de 31 dias (Dezembro)', () => {
    expect(getMonthBounds(new Date('2026-12-20'))).toEqual({
      startISO: '2026-12-01',
      endISO: '2026-12-31',
    });
  });

  it('Determinístico — input igual produz output igual', () => {
    const a = getMonthBounds(new Date('2026-05-15'));
    const b = getMonthBounds(new Date('2026-05-15'));
    expect(a).toEqual(b);
  });
});

describe('getProjectionWindow', () => {
  it('Default 30 dias (inclusiva — cobre exactamente 30 datas)', () => {
    expect(getProjectionWindow(new Date('2026-05-15'))).toEqual({
      startISO: '2026-05-15',
      endISO: '2026-06-13',
    });
  });

  it('Cavalo de ano (Dezembro → Janeiro)', () => {
    expect(getProjectionWindow(new Date('2026-12-20'), 30)).toEqual({
      startISO: '2026-12-20',
      endISO: '2027-01-18',
    });
  });

  it('`days = 1` (janela degenerada — start === end)', () => {
    expect(getProjectionWindow(new Date('2026-05-15'), 1)).toEqual({
      startISO: '2026-05-15',
      endISO: '2026-05-15',
    });
  });

  it('`days = 60` (janela longa — cobre exactamente 60 datas)', () => {
    expect(getProjectionWindow(new Date('2026-05-15'), 60)).toEqual({
      startISO: '2026-05-15',
      endISO: '2026-07-13',
    });
  });

  it('Lança RangeError em `days = 0`', () => {
    expect(() => getProjectionWindow(new Date('2026-05-15'), 0)).toThrow(
      RangeError,
    );
  });

  it('Lança RangeError em `days` negativo', () => {
    expect(() => getProjectionWindow(new Date('2026-05-15'), -5)).toThrow(
      RangeError,
    );
  });

  it('Lança RangeError em `days` não-inteiro', () => {
    expect(() => getProjectionWindow(new Date('2026-05-15'), 30.5)).toThrow(
      RangeError,
    );
  });

  it('Mensagem de erro em PT-PT', () => {
    expect(() => getProjectionWindow(new Date('2026-05-15'), 0)).toThrow(
      /days deve ser inteiro >= 1/,
    );
  });
});

describe('aggregateInOut', () => {
  it('Misto: entradas e saídas — invariante netCents === inflow + outflow', () => {
    const tx = [
      makeTx({ amount: 1000 }),
      makeTx({ amount: -500 }),
      makeTx({ amount: -200 }),
    ];
    expect(aggregateInOut(tx)).toEqual({
      inflowCents: 1000,
      outflowCents: -700,
      netCents: 300,
      count: 3,
    });
  });

  it('Só entradas', () => {
    const tx = [makeTx({ amount: 1000 }), makeTx({ amount: 500 })];
    expect(aggregateInOut(tx)).toEqual({
      inflowCents: 1500,
      outflowCents: 0,
      netCents: 1500,
      count: 2,
    });
  });

  it('Só saídas', () => {
    const tx = [makeTx({ amount: -1000 }), makeTx({ amount: -500 })];
    expect(aggregateInOut(tx)).toEqual({
      inflowCents: 0,
      outflowCents: -1500,
      netCents: -1500,
      count: 2,
    });
  });

  it('Array vazio', () => {
    expect(aggregateInOut([])).toEqual({
      inflowCents: 0,
      outflowCents: 0,
      netCents: 0,
      count: 0,
    });
  });

  it('Ignora transações com amount === 0 nas somas mas conta no count', () => {
    const tx = [
      makeTx({ amount: 0 }),
      makeTx({ amount: 1000 }),
      makeTx({ amount: -500 }),
    ];
    expect(aggregateInOut(tx)).toEqual({
      inflowCents: 1000,
      outflowCents: -500,
      netCents: 500,
      count: 3,
    });
  });
});

describe('aggregateByCategory', () => {
  it('Múltiplas categorias — ordenadas descendente por |sum|', () => {
    const tx = [
      makeTx({ category: 'Mercearia', amount: -2000 }),
      makeTx({ category: 'Mercearia', amount: -1500 }),
      makeTx({ category: 'Habitação', amount: -50000 }),
      makeTx({ category: 'Restauração', amount: -800 }),
    ];
    const result = aggregateByCategory(tx);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      category: 'Habitação',
      sumCents: -50000,
      count: 1,
      direction: 'out',
    });
    expect(result[1]).toEqual({
      category: 'Mercearia',
      sumCents: -3500,
      count: 2,
      direction: 'out',
    });
    expect(result[2]).toEqual({
      category: 'Restauração',
      sumCents: -800,
      count: 1,
      direction: 'out',
    });
  });

  it('Separa in/out da mesma categoria em agregados distintos', () => {
    const tx = [
      makeTx({ category: 'Salário', amount: 200000 }),
      makeTx({ category: 'Salário', amount: -5000, description: 'estorno' }),
    ];
    const result = aggregateByCategory(tx);
    expect(result).toHaveLength(2);
    // Ordenado por |sum| desc — entrada (200000) primeiro
    expect(result[0]).toMatchObject({
      category: 'Salário',
      sumCents: 200000,
      direction: 'in',
    });
    expect(result[1]).toMatchObject({
      category: 'Salário',
      sumCents: -5000,
      direction: 'out',
    });
  });

  it('Filtra agregados com sumCents === 0', () => {
    // 2 transações com sinais opostos mas categorias diferentes
    // produzem dois agregados distintos (separados por direction).
    // Para forçar sumCents === 0 num agregado, precisamos de transactions
    // com amount === 0 que são filtradas antes do bucketing.
    const tx = [
      makeTx({ category: 'Test', amount: 0 }),
      makeTx({ category: 'Mercearia', amount: -1000 }),
    ];
    const result = aggregateByCategory(tx);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Mercearia');
  });

  it('Array vazio devolve []', () => {
    expect(aggregateByCategory([])).toEqual([]);
  });

  it('Empate em |sum| — ordem estável (preserva inserção)', () => {
    const tx = [
      makeTx({ id: 'a', category: 'Alpha', amount: -1000 }),
      makeTx({ id: 'b', category: 'Beta', amount: -1000 }),
    ];
    const result = aggregateByCategory(tx);
    expect(result).toHaveLength(2);
    // Map preserva ordem de inserção; sort estável em V8 — Alpha primeiro.
    expect(result[0].category).toBe('Alpha');
    expect(result[1].category).toBe('Beta');
  });
});

describe('aggregateByDay', () => {
  it('Ordenação ascendente por dateISO (cronológico)', () => {
    const tx = [
      makeTx({ date: '2026-05-20', amount: -500 }),
      makeTx({ date: '2026-05-01', amount: -1000 }),
      makeTx({ date: '2026-05-15', amount: -200 }),
    ];
    const result = aggregateByDay(tx);
    expect(result.map((d) => d.dateISO)).toEqual([
      '2026-05-01',
      '2026-05-15',
      '2026-05-20',
    ]);
  });

  it('Agrega múltiplas transações no mesmo dia', () => {
    const tx = [
      makeTx({ date: '2026-05-15', amount: -500 }),
      makeTx({ date: '2026-05-15', amount: -300 }),
      makeTx({ date: '2026-05-15', amount: 1000 }),
    ];
    const result = aggregateByDay(tx);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      dateISO: '2026-05-15',
      inflowCents: 1000,
      outflowCents: -800,
      netCents: 200,
      count: 3,
    });
  });

  it('Filtra dias sem transações (não aparecem dias vazios)', () => {
    const tx = [
      makeTx({ date: '2026-05-01', amount: -1000 }),
      makeTx({ date: '2026-05-15', amount: -500 }),
    ];
    const result = aggregateByDay(tx);
    expect(result).toHaveLength(2);
    expect(result.map((d) => d.dateISO)).toEqual(['2026-05-01', '2026-05-15']);
  });

  it('Array vazio devolve []', () => {
    expect(aggregateByDay([])).toEqual([]);
  });

  it('Invariante: netCents === inflowCents + outflowCents por dia', () => {
    const tx = [
      makeTx({ date: '2026-05-10', amount: 5000 }),
      makeTx({ date: '2026-05-10', amount: -2000 }),
      makeTx({ date: '2026-05-10', amount: -1000 }),
    ];
    const [day] = aggregateByDay(tx);
    expect(day.netCents).toBe(day.inflowCents + day.outflowCents);
  });
});

describe('Invariantes cross-função', () => {
  it('Σ aggregateByDay.netCents === aggregateInOut.netCents', () => {
    const tx = [
      makeTx({ date: '2026-05-01', amount: 1000 }),
      makeTx({ date: '2026-05-02', amount: -500 }),
      makeTx({ date: '2026-05-03', amount: -200 }),
      makeTx({ date: '2026-05-04', amount: 300 }),
    ];
    const byDay = aggregateByDay(tx);
    const totals = aggregateInOut(tx);
    const sumByDay = byDay.reduce((s, d) => s + d.netCents, 0);
    expect(sumByDay).toBe(totals.netCents);
  });

  it('Σ aggregateByCategory.sumCents === aggregateInOut.netCents', () => {
    const tx = [
      makeTx({ category: 'Mercearia', amount: -1000 }),
      makeTx({ category: 'Habitação', amount: -50000 }),
      makeTx({ category: 'Salário', amount: 200000 }),
    ];
    const byCat = aggregateByCategory(tx);
    const totals = aggregateInOut(tx);
    const sumByCat = byCat.reduce((s, c) => s + c.sumCents, 0);
    expect(sumByCat).toBe(totals.netCents);
  });

  it('Soma de inflowCents por dia === aggregateInOut.inflowCents', () => {
    const tx = [
      makeTx({ date: '2026-05-01', amount: 1000 }),
      makeTx({ date: '2026-05-01', amount: 500 }),
      makeTx({ date: '2026-05-02', amount: 2000 }),
      makeTx({ date: '2026-05-03', amount: -100 }),
    ];
    const byDay = aggregateByDay(tx);
    const totals = aggregateInOut(tx);
    const sumIn = byDay.reduce((s, d) => s + d.inflowCents, 0);
    expect(sumIn).toBe(totals.inflowCents);
  });
});
