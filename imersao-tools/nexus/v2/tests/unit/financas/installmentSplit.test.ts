import { describe, expect, it } from 'vitest';
import {
  installmentDates,
  splitInstallmentAmount,
} from '@/lib/financas/installmentSplit';

/**
 * Nexus v2 — Testes de `lib/financas/installmentSplit.ts` (Story 3.6, AC11)
 *
 * Cobre as 2 funções puras de cálculo de compras parceladas (FR19):
 * `splitInstallmentAmount` (divisão exacta com arredondamento) e
 * `installmentDates` (datas mensais com clamp de fim de mês).
 *
 * Foco de risco (`EPIC-3.md` §8 R1, §9): invariante de soma na divisão
 * (nenhum cêntimo perdido nem inventado) e clamp correcto de meses sem o
 * dia-de-origem.
 */

describe('splitInstallmentAmount', () => {
  it('AC1 canónico: €1.200/12 → 12 parcelas de €100 exactos', () => {
    const parcels = splitInstallmentAmount(120000, 12);
    expect(parcels).toHaveLength(12);
    expect(parcels.every((p) => p === 10000)).toBe(true);
    expect(parcels.reduce((s, p) => s + p, 0)).toBe(120000);
  });

  it('Caso não-divisível (R1): €100/3 → [3334, 3333, 3333] com soma 10000', () => {
    const parcels = splitInstallmentAmount(10000, 3);
    expect(parcels).toEqual([3334, 3333, 3333]);
    expect(parcels.reduce((s, p) => s + p, 0)).toBe(10000);
  });

  it('Invariante de soma: soma === totalCents para vários (totalCents, n)', () => {
    const cases: Array<[number, number]> = [
      [120000, 12],
      [10000, 3],
      [9999, 4],
      [1, 2],
      [33333, 7],
      [50050, 11],
      [100000000, 36],
    ];
    for (const [total, n] of cases) {
      const parcels = splitInstallmentAmount(total, n);
      expect(parcels).toHaveLength(n);
      expect(parcels.reduce((s, p) => s + p, 0)).toBe(total);
      // As primeiras parcelas são as maiores; a sequência é não-crescente.
      for (let i = 1; i < parcels.length; i++) {
        expect(parcels[i]).toBeLessThanOrEqual(parcels[i - 1]);
      }
      // Diferença máxima entre parcelas é 0 ou 1 cêntimo — distribuição justa.
      expect(parcels[0] - parcels[parcels.length - 1]).toBeLessThanOrEqual(1);
    }
  });

  it('Limite n=1: devolve [totalCents]', () => {
    expect(splitInstallmentAmount(12345, 1)).toEqual([12345]);
    expect(splitInstallmentAmount(0, 1)).toEqual([0]);
  });

  it('totalCents=0: devolve n zeros', () => {
    expect(splitInstallmentAmount(0, 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it('Lança RangeError quando n não é inteiro >= 1', () => {
    expect(() => splitInstallmentAmount(1000, 0)).toThrow(RangeError);
    expect(() => splitInstallmentAmount(1000, -1)).toThrow(RangeError);
    expect(() => splitInstallmentAmount(1000, 1.5)).toThrow(RangeError);
    expect(() => splitInstallmentAmount(1000, Number.NaN)).toThrow(RangeError);
  });

  it('Lança RangeError quando totalCents não é inteiro >= 0', () => {
    expect(() => splitInstallmentAmount(-100, 3)).toThrow(RangeError);
    expect(() => splitInstallmentAmount(1.5, 3)).toThrow(RangeError);
    expect(() => splitInstallmentAmount(Number.NaN, 3)).toThrow(RangeError);
    expect(() => splitInstallmentAmount(Number.POSITIVE_INFINITY, 3)).toThrow(
      RangeError,
    );
  });
});

describe('installmentDates', () => {
  it('Gera N datas mensais a partir da data de início', () => {
    const dates = installmentDates('2026-01-15', 12);
    expect(dates).toHaveLength(12);
    expect(dates[0]).toBe('2026-01-15');
    expect(dates[1]).toBe('2026-02-15');
    expect(dates[5]).toBe('2026-06-15');
    expect(dates[11]).toBe('2026-12-15');
  });

  it('Clamp de fim de mês: 31/01 → Fev usa último dia (28 em 2026, não-bissexto)', () => {
    const dates = installmentDates('2026-01-31', 3);
    expect(dates).toEqual(['2026-01-31', '2026-02-28', '2026-03-31']);
  });

  it('Clamp de fim de mês: 31/01/2024 (bissexto) → Fev 29', () => {
    const dates = installmentDates('2024-01-31', 3);
    expect(dates).toEqual(['2024-01-31', '2024-02-29', '2024-03-31']);
  });

  it('Transição de ano: Nov-2026 → Fev-2027', () => {
    const dates = installmentDates('2026-11-10', 4);
    expect(dates).toEqual(['2026-11-10', '2026-12-10', '2027-01-10', '2027-02-10']);
  });

  it('Sequência longa atravessa múltiplos anos correctamente', () => {
    const dates = installmentDates('2026-07-05', 24);
    expect(dates).toHaveLength(24);
    expect(dates[0]).toBe('2026-07-05');
    expect(dates[12]).toBe('2027-07-05');
    expect(dates[23]).toBe('2028-06-05');
  });

  it('n=1: devolve apenas a data de início', () => {
    expect(installmentDates('2026-05-23', 1)).toEqual(['2026-05-23']);
  });

  it('Lança quando startDate não é ISO YYYY-MM-DD', () => {
    expect(() => installmentDates('15/01/2026', 12)).toThrow();
    expect(() => installmentDates('2026-1-15', 12)).toThrow();
    expect(() => installmentDates('', 12)).toThrow();
    expect(() => installmentDates('abc', 12)).toThrow();
  });

  it('Lança quando startDate não é uma data de calendário real', () => {
    expect(() => installmentDates('2026-13-01', 3)).toThrow(
      /não corresponde a uma data de calendário real/,
    );
    expect(() => installmentDates('2026-02-30', 3)).toThrow(
      /não corresponde a uma data de calendário real/,
    );
    expect(() => installmentDates('2026-00-15', 3)).toThrow(
      /não corresponde a uma data de calendário real/,
    );
  });

  it('Lança RangeError quando n não é inteiro >= 1', () => {
    expect(() => installmentDates('2026-01-15', 0)).toThrow(RangeError);
    expect(() => installmentDates('2026-01-15', -1)).toThrow(RangeError);
    expect(() => installmentDates('2026-01-15', 1.5)).toThrow(RangeError);
  });
});
