import { describe, it, expect } from 'vitest';
import type { HabitLog } from '@/types/db';
import {
  getMonthlyEvolution,
  getMetricRecords,
  getHeatmapLevel,
} from '@/lib/habitos/metrics';

/**
 * Nexus v2 — metrics helper tests (Story 4.4 — AC2)
 *
 * Helper puro determinista: `todayISO` fixo, sem browser nem IndexedDB.
 * Cobertura ~100% (NFR17). Cenários do AC2:
 *   - getMonthlyEvolution: sem logs / um mês / vários meses / logs sem value /
 *     ordenação / determinismo.
 *   - getMetricRecords: sem logs / vários logs / logs sem value.
 *   - getHeatmapLevel: tabela de limiares.
 *
 * Padrão de `heatmap.test.ts` (4.3).
 */

// 31/05/2026 (domingo). Janela de 6 meses: Dez 2025 → Mai 2026.
const TODAY = '2026-05-31';

let counter = 0;
function makeLog(date: string, value?: number): HabitLog {
  const log: HabitLog = { id: `log-${++counter}`, habitId: 'h1', date };
  if (value !== undefined) log.value = value;
  return log;
}

describe('metrics helper (Story 4.4 / AC2)', () => {
  describe('getMonthlyEvolution', () => {
    it('sem logs ([]) → 6 entradas com totalValue 0 e daysCompleted 0', () => {
      const result = getMonthlyEvolution([], TODAY);
      expect(result).toHaveLength(6);
      for (const month of result) {
        expect(month.totalValue).toBe(0);
        expect(month.daysCompleted).toBe(0);
        expect(month.bestDayValue).toBe(0);
      }
    });

    it('janela cobre os últimos 6 meses, do mais antigo ao mais recente', () => {
      const result = getMonthlyEvolution([], TODAY);
      expect(result.map((m) => m.monthLabel)).toEqual([
        'Dez 2025',
        'Jan 2026',
        'Fev 2026',
        'Mar 2026',
        'Abr 2026',
        'Mai 2026',
      ]);
    });

    it('logs num único mês → soma e daysCompleted correctos', () => {
      const logs = [
        makeLog('2026-05-02', 5),
        makeLog('2026-05-10', 7),
        makeLog('2026-05-20', 3),
      ];
      const result = getMonthlyEvolution(logs, TODAY);
      const maio = result.find((m) => m.monthLabel === 'Mai 2026')!;
      expect(maio.totalValue).toBe(15);
      expect(maio.daysCompleted).toBe(3);
      expect(maio.bestDayValue).toBe(7);
      // Os outros meses ficam a zeros.
      expect(result.find((m) => m.monthLabel === 'Abr 2026')!.totalValue).toBe(0);
    });

    it('logs em vários meses → agrupamento correcto; meses sem logs com zeros', () => {
      const logs = [
        makeLog('2025-12-15', 10),
        makeLog('2026-02-01', 4),
        makeLog('2026-02-02', 6),
        makeLog('2026-05-31', 8),
      ];
      const result = getMonthlyEvolution(logs, TODAY);
      expect(result.find((m) => m.monthLabel === 'Dez 2025')!.totalValue).toBe(10);
      expect(result.find((m) => m.monthLabel === 'Jan 2026')!.totalValue).toBe(0);
      expect(result.find((m) => m.monthLabel === 'Fev 2026')!.totalValue).toBe(10);
      expect(result.find((m) => m.monthLabel === 'Fev 2026')!.daysCompleted).toBe(2);
      expect(result.find((m) => m.monthLabel === 'Mai 2026')!.totalValue).toBe(8);
    });

    it('logs sem value → contam o dia em daysCompleted mas não somam (gotcha A1)', () => {
      const logs = [
        makeLog('2026-05-02'), // sem value
        makeLog('2026-05-10', 7),
      ];
      const result = getMonthlyEvolution(logs, TODAY);
      const maio = result.find((m) => m.monthLabel === 'Mai 2026')!;
      expect(maio.totalValue).toBe(7); // só o log com value soma
      expect(maio.daysCompleted).toBe(2); // ambos os dias contam
      expect(maio.bestDayValue).toBe(7);
    });

    it('logs fora da janela de 6 meses são ignorados', () => {
      const logs = [
        makeLog('2025-06-01', 100), // muito antigo, fora da janela
        makeLog('2026-05-01', 5),
      ];
      const result = getMonthlyEvolution(logs, TODAY);
      const total = result.reduce((acc, m) => acc + m.totalValue, 0);
      expect(total).toBe(5);
    });

    it('dois logs no mesmo dia → daysCompleted conta o dia uma só vez (sem double-count)', () => {
      const logs = [
        makeLog('2026-05-10', 3),
        makeLog('2026-05-10', 4), // mesmo dia (defensivo — 4.2 garante ≤1)
      ];
      const result = getMonthlyEvolution(logs, TODAY);
      const maio = result.find((m) => m.monthLabel === 'Mai 2026')!;
      expect(maio.daysCompleted).toBe(1);
      expect(maio.totalValue).toBe(7); // ambos somam
    });

    it('determinista: mesmo todayISO → mesmo resultado', () => {
      const logs = [makeLog('2026-05-10', 7)];
      const a = getMonthlyEvolution(logs, TODAY);
      const b = getMonthlyEvolution(logs, TODAY);
      expect(a).toEqual(b);
    });
  });

  describe('getMetricRecords', () => {
    it('sem logs → zeros + bestDayDate vazio', () => {
      expect(getMetricRecords([])).toEqual({
        bestDayValue: 0,
        bestMonthValue: 0,
        bestDayDate: '',
      });
    });

    it('vários logs → bestDayValue, bestMonthValue e bestDayDate correctos', () => {
      const logs = [
        makeLog('2026-03-10', 12),
        makeLog('2026-03-20', 8),
        makeLog('2026-04-01', 15), // melhor dia
        makeLog('2026-04-02', 5),
      ];
      const records = getMetricRecords(logs);
      expect(records.bestDayValue).toBe(15);
      expect(records.bestDayDate).toBe('2026-04-01');
      // Mar = 12+8 = 20; Abr = 15+5 = 20 → empate, ambos 20.
      expect(records.bestMonthValue).toBe(20);
    });

    it('melhor mês isolado corretamente quando difere do melhor dia', () => {
      const logs = [
        makeLog('2026-01-05', 30), // melhor dia
        makeLog('2026-02-01', 10),
        makeLog('2026-02-02', 10),
        makeLog('2026-02-03', 10), // melhor mês: Fev = 30
      ];
      const records = getMetricRecords(logs);
      expect(records.bestDayValue).toBe(30);
      expect(records.bestDayDate).toBe('2026-01-05');
      expect(records.bestMonthValue).toBe(30); // Jan=30, Fev=30 → empate
    });

    it('logs sem value → ignorados nos recordes', () => {
      const logs = [
        makeLog('2026-03-10'), // sem value
        makeLog('2026-03-11', 4),
      ];
      const records = getMetricRecords(logs);
      expect(records.bestDayValue).toBe(4);
      expect(records.bestDayDate).toBe('2026-03-11');
      expect(records.bestMonthValue).toBe(4);
    });

    it('recordes consideram TODOS os logs históricos (sem limite de range)', () => {
      const logs = [
        makeLog('2020-01-01', 99), // muito antigo, mas conta para recorde
        makeLog('2026-05-31', 5),
      ];
      const records = getMetricRecords(logs);
      expect(records.bestDayValue).toBe(99);
      expect(records.bestDayDate).toBe('2020-01-01');
    });
  });

  describe('getHeatmapLevel', () => {
    it.each([
      [0, 10, 1],
      [2.5, 10, 1], // 25%
      [3, 10, 2], // 30%
      [5, 10, 2], // 50%
      [6, 10, 3], // 60%
      [9, 10, 3], // 90%
      [10, 10, 4], // 100%
      [12, 10, 4], // >100%
    ])('value=%s, target=%s → nível %s', (value, target, expected) => {
      expect(getHeatmapLevel(value, target)).toBe(expected);
    });

    it('target <= 0 → nível 4 (defensivo)', () => {
      expect(getHeatmapLevel(5, 0)).toBe(4);
      expect(getHeatmapLevel(0, -1)).toBe(4);
    });
  });
});
