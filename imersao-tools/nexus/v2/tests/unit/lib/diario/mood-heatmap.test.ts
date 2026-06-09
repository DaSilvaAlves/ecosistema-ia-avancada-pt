import { describe, it, expect } from 'vitest';
import {
  getLast6MonthsRange,
  buildMoodHeatmapGrid,
  type Mood,
  type MoodHeatmapWeek,
} from '@/lib/diario/mood-heatmap';
import type { JournalEntry } from '@/types/db';

/**
 * Nexus v2 — mood-heatmap helper tests (Story 5.3 — AC3/AC9)
 *
 * Cobertura ~100% do helper puro (NFR17). Determinista: `todayISO` fixo, sem
 * fake timers nem IndexedDB. Cobre range, grelha, mapeamento de mood escalar,
 * padding, fora-de-range e dedup (1 entrada/dia).
 */

let counter = 0;
function makeEntry(date: string, mood: Mood): JournalEntry {
  return {
    id: `j-${++counter}`,
    date,
    mood,
    bodyMarkdown: `entrada ${date}`,
  };
}

function flat(weeks: MoodHeatmapWeek[]): MoodHeatmapWeek['days'] {
  return weeks.flatMap((w) => w.days);
}

describe('getLast6MonthsRange (Story 5.3 / AC3)', () => {
  it('to === todayISO', () => {
    expect(getLast6MonthsRange('2026-06-09').to).toBe('2026-06-09');
  });

  it('from é uma segunda-feira (UTC)', () => {
    const { from } = getLast6MonthsRange('2026-06-09');
    expect(new Date(`${from}T00:00:00.000Z`).getUTCDay()).toBe(1);
  });

  it('from = segunda 25 semanas antes da segunda da semana de hoje', () => {
    // 2026-06-09 é terça. Segunda dessa semana = 2026-06-08.
    // 25 semanas antes = 2026-06-08 menos 175 dias = 2025-12-15 (segunda).
    expect(getLast6MonthsRange('2026-06-09').from).toBe('2025-12-15');
  });

  it('determinista — mesmo input, mesmo output', () => {
    expect(getLast6MonthsRange('2026-01-15')).toEqual(getLast6MonthsRange('2026-01-15'));
  });

  it('hoje a uma segunda-feira → from continua segunda, 175 dias antes', () => {
    const { from, to } = getLast6MonthsRange('2026-06-08'); // segunda
    expect(to).toBe('2026-06-08');
    expect(from).toBe('2025-12-15');
    expect(new Date(`${from}T00:00:00.000Z`).getUTCDay()).toBe(1);
  });
});

describe('buildMoodHeatmapGrid (Story 5.3 / AC3)', () => {
  it('grelha tem 26 semanas × 7 dias = 182 células (hoje a meio da semana)', () => {
    const range = getLast6MonthsRange('2026-06-09'); // terça
    const weeks = buildMoodHeatmapGrid([], range);
    expect(weeks).toHaveLength(26);
    for (const week of weeks) expect(week.days).toHaveLength(7);
    expect(flat(weeks)).toHaveLength(182);
  });

  it('cada semana começa à segunda e termina ao domingo', () => {
    const range = getLast6MonthsRange('2026-06-09');
    const weeks = buildMoodHeatmapGrid([], range);
    for (const week of weeks) {
      expect(new Date(`${week.days[0].date}T00:00:00.000Z`).getUTCDay()).toBe(1); // segunda
      expect(new Date(`${week.days[6].date}T00:00:00.000Z`).getUTCDay()).toBe(0); // domingo
    }
  });

  it('vazio: sem entradas → todas as células inRange têm mood:null', () => {
    const range = getLast6MonthsRange('2026-06-09');
    const cells = flat(buildMoodHeatmapGrid([], range));
    expect(cells.every((c) => c.mood === null)).toBe(true);
    expect(cells.some((c) => c.inRange)).toBe(true);
  });

  it('mapeamento escalar: 1 entrada dentro do range → essa célula com o mood certo', () => {
    const range = getLast6MonthsRange('2026-06-09');
    const target = '2026-03-10';
    const cells = flat(buildMoodHeatmapGrid([makeEntry(target, 4)], range));
    const withMood = cells.filter((c) => c.mood !== null);
    expect(withMood).toHaveLength(1);
    expect(withMood[0].date).toBe(target);
    expect(withMood[0].mood).toBe(4);
    expect(withMood[0].inRange).toBe(true);
  });

  it('moods distintos são preservados por dia (escala 1-5, não binário)', () => {
    const range = getLast6MonthsRange('2026-06-09');
    const entries = [
      makeEntry('2026-03-02', 1),
      makeEntry('2026-03-03', 3),
      makeEntry('2026-03-04', 5),
    ];
    const byDate = new Map(flat(buildMoodHeatmapGrid(entries, range)).map((c) => [c.date, c.mood]));
    expect(byDate.get('2026-03-02')).toBe(1);
    expect(byDate.get('2026-03-03')).toBe(3);
    expect(byDate.get('2026-03-04')).toBe(5);
  });

  it('fora do range: entrada antes de from ou depois de to → ignorada (mood:null)', () => {
    const range = getLast6MonthsRange('2026-06-09'); // from 2025-12-15, to 2026-06-09
    const before = makeEntry('2025-12-14', 5); // 1 dia antes de from
    const after = makeEntry('2026-06-10', 5); // 1 dia depois de to
    const cells = flat(buildMoodHeatmapGrid([before, after], range));
    expect(cells.filter((c) => c.mood !== null)).toHaveLength(0);
  });

  it('dedup (1 entrada/dia): duas entradas no mesmo dia → a última vence, sem erro', () => {
    const range = getLast6MonthsRange('2026-06-09');
    const day = '2026-04-01';
    const cells = flat(buildMoodHeatmapGrid([makeEntry(day, 2), makeEntry(day, 5)], range));
    const withMood = cells.filter((c) => c.mood !== null);
    expect(withMood).toHaveLength(1);
    expect(withMood[0].mood).toBe(5); // última vence
  });

  it('padding: células fora de [from,to] têm inRange:false e mood:null', () => {
    const range = getLast6MonthsRange('2026-06-09'); // to = terça → qua..dom da última semana são padding
    const weeks = buildMoodHeatmapGrid([], range);
    const lastWeek = weeks[weeks.length - 1];
    // 2026-06-09 é terça (índice 1). Quarta (2)..domingo (6) são > to ⇒ padding.
    expect(lastWeek.days[1].date).toBe('2026-06-09');
    expect(lastWeek.days[1].inRange).toBe(true);
    expect(lastWeek.days[2].inRange).toBe(false);
    expect(lastWeek.days[2].mood).toBe(null);
    expect(lastWeek.days[6].inRange).toBe(false);
  });
});
