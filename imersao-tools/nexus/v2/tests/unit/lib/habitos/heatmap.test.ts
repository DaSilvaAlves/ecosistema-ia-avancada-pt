import { describe, it, expect } from 'vitest';
import {
  getLast6MonthsRange,
  buildHeatmapGrid,
  type HeatmapWeek,
} from '@/lib/habitos/heatmap';
import type { HabitLog } from '@/types/db';

/**
 * Nexus v2 — heatmap helper tests (Story 4.3 — AC7)
 *
 * Cobertura ~100% do helper puro (NFR17). Determinista: `todayISO` fixo, sem
 * fake timers nem IndexedDB. Inclui o cenário AC1 epic ("30 dias seguidos").
 */

let logCounter = 0;
function makeLog(date: string): HabitLog {
  return { id: `log-${++logCounter}`, habitId: 'h1', date };
}

/** Datas UTC consecutivas a partir de `startISO` (inclusive), `count` dias. */
function consecutiveDates(startISO: string, count: number): string[] {
  const start = new Date(`${startISO}T00:00:00.000Z`).getTime();
  return Array.from({ length: count }, (_, i) =>
    new Date(start + i * 86_400_000).toISOString().slice(0, 10),
  );
}

function flat(weeks: HeatmapWeek[]): HeatmapWeek['days'] {
  return weeks.flatMap((w) => w.days);
}

describe('getLast6MonthsRange (Story 4.3 / AC1)', () => {
  it('to === todayISO', () => {
    expect(getLast6MonthsRange('2026-05-29').to).toBe('2026-05-29');
  });

  it('from é uma segunda-feira (UTC)', () => {
    const { from } = getLast6MonthsRange('2026-05-29');
    // getUTCDay(): 1 = segunda.
    expect(new Date(`${from}T00:00:00.000Z`).getUTCDay()).toBe(1);
  });

  it('from = segunda 25 semanas antes da segunda da semana de hoje', () => {
    // 2026-05-29 é sexta. Segunda dessa semana = 2026-05-25.
    // 25 semanas antes = 2026-05-25 menos 175 dias = 2025-12-01 (segunda).
    expect(getLast6MonthsRange('2026-05-29').from).toBe('2025-12-01');
  });

  it('determinista — mesmo input, mesmo output', () => {
    expect(getLast6MonthsRange('2026-01-15')).toEqual(
      getLast6MonthsRange('2026-01-15'),
    );
  });

  it('hoje a uma segunda-feira → from continua segunda, 175 dias antes', () => {
    // 2026-05-25 é segunda. from = 2026-05-25 - 175 dias = 2025-12-01.
    const { from, to } = getLast6MonthsRange('2026-05-25');
    expect(to).toBe('2026-05-25');
    expect(from).toBe('2025-12-01');
    expect(new Date(`${from}T00:00:00.000Z`).getUTCDay()).toBe(1);
  });
});

describe('buildHeatmapGrid (Story 4.3 / AC2)', () => {
  it('grelha tem 26 semanas × 7 dias = 182 células (todayISO a meio da semana)', () => {
    const range = getLast6MonthsRange('2026-05-29'); // sexta
    const weeks = buildHeatmapGrid([], range);
    expect(weeks).toHaveLength(26);
    for (const week of weeks) {
      expect(week.days).toHaveLength(7);
    }
    expect(flat(weeks)).toHaveLength(182);
  });

  it('cada semana começa à segunda e termina ao domingo', () => {
    const range = getLast6MonthsRange('2026-05-29');
    const weeks = buildHeatmapGrid([], range);
    for (const week of weeks) {
      expect(new Date(`${week.days[0].date}T00:00:00.000Z`).getUTCDay()).toBe(1); // segunda
      expect(new Date(`${week.days[6].date}T00:00:00.000Z`).getUTCDay()).toBe(0); // domingo
    }
  });

  it('vazio: logs = [] → todas as células inRange têm completed:false', () => {
    const range = getLast6MonthsRange('2026-05-29');
    const cells = flat(buildHeatmapGrid([], range));
    expect(cells.every((c) => !c.completed)).toBe(true);
    expect(cells.some((c) => c.inRange)).toBe(true);
  });

  it('mapeamento: 1 log dentro do range → exactamente essa célula completed', () => {
    const range = getLast6MonthsRange('2026-05-29');
    const target = '2026-03-10';
    const cells = flat(buildHeatmapGrid([makeLog(target)], range));
    const completed = cells.filter((c) => c.completed);
    expect(completed).toHaveLength(1);
    expect(completed[0].date).toBe(target);
    expect(completed[0].inRange).toBe(true);
  });

  it('fora do range: log antes de from ou depois de to → ignorado', () => {
    const range = getLast6MonthsRange('2026-05-29'); // from 2025-12-01, to 2026-05-29
    const before = makeLog('2025-11-30'); // 1 dia antes de from
    const after = makeLog('2026-05-30'); // 1 dia depois de to
    const cells = flat(buildHeatmapGrid([before, after], range));
    expect(cells.filter((c) => c.completed)).toHaveLength(0);
  });

  it('dedup-safe: dois logs no mesmo dia → uma célula completed, sem erro', () => {
    const range = getLast6MonthsRange('2026-05-29');
    const day = '2026-04-01';
    const cells = flat(buildHeatmapGrid([makeLog(day), makeLog(day)], range));
    expect(cells.filter((c) => c.completed)).toHaveLength(1);
  });

  it('padding: células fora de [from,to] têm inRange:false e completed:false', () => {
    const range = getLast6MonthsRange('2026-05-29'); // to = sexta → sáb/dom da última semana são padding
    const weeks = buildHeatmapGrid([], range);
    const lastWeek = weeks[weeks.length - 1];
    // 2026-05-29 é sexta (índice 4). Sábado (5) e domingo (6) são > to ⇒ padding.
    expect(lastWeek.days[4].date).toBe('2026-05-29');
    expect(lastWeek.days[4].inRange).toBe(true);
    expect(lastWeek.days[5].inRange).toBe(false);
    expect(lastWeek.days[6].inRange).toBe(false);
  });

  it('AC1 epic — 30 dias seguidos → exactamente 30 células completed, todas inRange', () => {
    const range = getLast6MonthsRange('2026-05-29');
    // 30 dias consecutivos dentro do range (começa numa segunda arbitrária).
    const logs = consecutiveDates('2026-03-02', 30).map(makeLog);
    const cells = flat(buildHeatmapGrid(logs, range));
    const completed = cells.filter((c) => c.completed);
    expect(completed).toHaveLength(30);
    expect(completed.every((c) => c.inRange)).toBe(true);
  });
});
