import { describe, it, expect } from 'vitest';
import {
  formatDueDateIso,
  getNextWeek,
  getPreviousWeek,
  getWeekRange,
} from '@/lib/tarefas/weekRange';

/**
 * Nexus v2 — weekRange helper tests (Story 2.5 / T12 / AC11)
 *
 * Helper puro — testes deterministas via `anchor` + `referenceToday` parameters
 * (sem `vi.setSystemTime`). Verifica:
 *   - `weekStartsOn: 1` (segunda-feira, A8).
 *   - 7 dias consecutivos com `iso` correcto em local time (A9).
 *   - Labels PT-PT capitalizados ("Seg" ... "Dom" / "Segunda-feira" ... "Domingo").
 *   - `isToday` correcto.
 *   - Navegação ±7 dias preserva consistência.
 */

// Quarta-feira, 13 de Maio de 2026 (a meio da semana)
const ANCHOR_MID_WEEK = new Date(2026, 4, 13); // mês 4 = Maio (0-indexed)
// Segunda-feira, 11 de Maio de 2026 (início dessa semana)
const EXPECTED_MONDAY = new Date(2026, 4, 11);

describe('weekRange', () => {
  describe('formatDueDateIso', () => {
    it('formata Date local como YYYY-MM-DD sem componente de hora', () => {
      // Anti-bug A9: NUNCA usar toISOString() — converte para UTC e off-by-one em BST.
      expect(formatDueDateIso(new Date(2026, 4, 13))).toBe('2026-05-13');
      expect(formatDueDateIso(new Date(2026, 0, 1))).toBe('2026-01-01');
      expect(formatDueDateIso(new Date(2026, 11, 31))).toBe('2026-12-31');
    });

    it('preserva o dia local mesmo perto de meia-noite (BST safety)', () => {
      // 13 Maio 2026 às 23:30 local — toISOString() seria '2026-05-13T22:30:00Z' (BST -1h)
      // → slice(0,10) ainda dá '2026-05-13' por sorte; mas em PT inverno (CET):
      // 13 Maio 23:30 local CET = 22:30 UTC → '2026-05-13' OK também.
      // Em PT BST 13 Maio 23:30 local = 22:30 UTC → '2026-05-13' OK.
      // Caso crítico: 13 Maio 00:30 local CET = 13 Maio 00:30 - 1h = 12 Maio 23:30 UTC →
      // toISOString().slice(0,10) seria '2026-05-12' ERRADO.
      const earlyMorning = new Date(2026, 4, 13, 0, 30, 0);
      expect(formatDueDateIso(earlyMorning)).toBe('2026-05-13');
    });
  });

  describe('getWeekRange', () => {
    it('T12a — semana inicia à segunda-feira (A8, weekStartsOn: 1)', () => {
      const wr = getWeekRange(ANCHOR_MID_WEEK);
      expect(wr.start.getDay()).toBe(1); // 1 = Monday
      expect(wr.start.getDate()).toBe(EXPECTED_MONDAY.getDate());
      expect(wr.start.getMonth()).toBe(EXPECTED_MONDAY.getMonth());
      expect(wr.start.getFullYear()).toBe(EXPECTED_MONDAY.getFullYear());
    });

    it('T12b — devolve exactamente 7 dias consecutivos seg→dom', () => {
      const wr = getWeekRange(ANCHOR_MID_WEEK);
      expect(wr.days).toHaveLength(7);
      const isos = wr.days.map((d) => d.iso);
      expect(isos).toEqual([
        '2026-05-11', // Seg
        '2026-05-12', // Ter
        '2026-05-13', // Qua
        '2026-05-14', // Qui
        '2026-05-15', // Sex
        '2026-05-16', // Sáb
        '2026-05-17', // Dom
      ]);
    });

    it('T12c — labels PT-PT capitalizados (Seg/Ter/.../Dom)', () => {
      const wr = getWeekRange(ANCHOR_MID_WEEK);
      expect(wr.days.map((d) => d.label)).toEqual([
        'Seg',
        'Ter',
        'Qua',
        'Qui',
        'Sex',
        'Sáb',
        'Dom',
      ]);
    });

    it('T12d — longLabels PT-PT capitalizados (Segunda-feira/.../Domingo)', () => {
      const wr = getWeekRange(ANCHOR_MID_WEEK);
      expect(wr.days[0].longLabel).toBe('Segunda-feira');
      expect(wr.days[1].longLabel).toBe('Terça-feira');
      expect(wr.days[5].longLabel.toLowerCase()).toContain('sábado');
      expect(wr.days[6].longLabel).toBe('Domingo');
    });

    it('T12e — weekLabel formato "Semana de D de Mês de YYYY" PT-PT', () => {
      const wr = getWeekRange(ANCHOR_MID_WEEK);
      expect(wr.weekLabel).toMatch(/^Semana de 11 de [Mm]aio de 2026$/);
    });

    it('T12f — isToday=true apenas no dia que coincide com referenceToday', () => {
      // referenceToday = quinta-feira 14/05/2026
      const referenceToday = new Date(2026, 4, 14);
      const wr = getWeekRange(ANCHOR_MID_WEEK, referenceToday);
      const todayIndices = wr.days.map((d, i) => (d.isToday ? i : -1)).filter((i) => i >= 0);
      expect(todayIndices).toEqual([3]); // Quinta-feira = index 3 (seg=0)
      expect(wr.days[3].iso).toBe('2026-05-14');
    });

    it('T12g — isToday=false em todos os dias se referenceToday está fora da semana', () => {
      const referenceToday = new Date(2026, 5, 1); // 1 de Junho — fora da semana de 11-17 Maio
      const wr = getWeekRange(ANCHOR_MID_WEEK, referenceToday);
      expect(wr.days.every((d) => d.isToday === false)).toBe(true);
    });

    it('T12h — start.getHours() === 0 (midnight local)', () => {
      const wr = getWeekRange(ANCHOR_MID_WEEK);
      expect(wr.start.getHours()).toBe(0);
      expect(wr.start.getMinutes()).toBe(0);
      expect(wr.start.getSeconds()).toBe(0);
    });

    it('T12i — quando anchor é segunda-feira, devolve essa mesma semana', () => {
      const monday = new Date(2026, 4, 11);
      const wr = getWeekRange(monday);
      expect(wr.start.getDate()).toBe(11);
      expect(wr.days[0].iso).toBe('2026-05-11');
    });

    it('T12j — quando anchor é domingo, devolve a semana que termina nesse domingo', () => {
      const sunday = new Date(2026, 4, 17);
      const wr = getWeekRange(sunday);
      expect(wr.start.getDate()).toBe(11);
      expect(wr.days[6].iso).toBe('2026-05-17');
    });
  });

  describe('getPreviousWeek', () => {
    it('T12k — recua exactamente 7 dias', () => {
      const wr = getWeekRange(ANCHOR_MID_WEEK);
      const prev = getPreviousWeek(wr);
      expect(prev.start.getDate()).toBe(4); // 4 Maio 2026 (Segunda)
      expect(prev.days[0].iso).toBe('2026-05-04');
      expect(prev.days[6].iso).toBe('2026-05-10');
    });
  });

  describe('getNextWeek', () => {
    it('T12l — avança exactamente 7 dias', () => {
      const wr = getWeekRange(ANCHOR_MID_WEEK);
      const next = getNextWeek(wr);
      expect(next.start.getDate()).toBe(18); // 18 Maio 2026 (Segunda)
      expect(next.days[0].iso).toBe('2026-05-18');
      expect(next.days[6].iso).toBe('2026-05-24');
    });
  });

  describe('navegação composta', () => {
    it('T12m — prev → next devolve a mesma semana', () => {
      const wr = getWeekRange(ANCHOR_MID_WEEK);
      const roundtrip = getNextWeek(getPreviousWeek(wr));
      expect(roundtrip.start.getTime()).toBe(wr.start.getTime());
      expect(roundtrip.days.map((d) => d.iso)).toEqual(wr.days.map((d) => d.iso));
    });

    it('T12n — navegação cruza fronteira de mês correctamente', () => {
      // Última semana de Maio 2026 (25-31)
      const lastWeekOfMay = getWeekRange(new Date(2026, 4, 28));
      expect(lastWeekOfMay.start.getDate()).toBe(25);
      const nextWeek = getNextWeek(lastWeekOfMay);
      expect(nextWeek.start.getMonth()).toBe(5); // Junho (0-indexed)
      expect(nextWeek.days[0].iso).toBe('2026-06-01');
      expect(nextWeek.days[6].iso).toBe('2026-06-07');
    });
  });
});
