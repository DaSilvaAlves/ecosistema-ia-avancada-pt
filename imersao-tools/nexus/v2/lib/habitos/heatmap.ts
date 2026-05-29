import type { HabitLog } from '@/types/db';

/**
 * Nexus v2 — Helper puro do heatmap de hábitos (Story 4.3 — FR26)
 *
 * Módulo de funções puras (sem Dexie, sem React) que (1) calculam a janela de
 * ~6 meses e (2) transformam `HabitLog[]` numa grelha semanas × 7 dias, estilo
 * GitHub contributions. É o 1.º ficheiro de `lib/habitos/` — segue o padrão dos
 * helpers puros de finanças (`monthAggregations.ts`, `patrimonyAggregations.ts`).
 *
 * Determinístico — `getLast6MonthsRange` recebe `todayISO` por argumento; nenhuma
 * função chama `Date.now()`/`new Date()` sem argumento (testável sem fake timers).
 *
 * Convenções (alinhadas à Story 4.2):
 *   - Datas em `YYYY-MM-DD`, derivadas SEMPRE em UTC. A 4.2 grava os logs com
 *     `new Date().toISOString().slice(0,10)` (UTC); fazer a aritmética de datas
 *     em UTC evita o off-by-one entre "hoje"/limites do range e os logs gravados
 *     ([AUTO-DECISION] A5 da story).
 *   - Semana a começar à SEGUNDA (PT-PT) — índice 0 = segunda, 6 = domingo.
 *   - Heatmap binário (concluído/não): a 4.2 garante ≤1 log por `(habitId, date)`,
 *     logo a presença de ≥1 log num dia ⇒ `completed: true`. Níveis de intensidade
 *     por valor são a Story 4.4 (FR27) — `value` é ignorado aqui ([AUTO-DECISION] A1).
 *
 * Trace: FR26, AC1 epic (`EPIC-4.md` §6, "30 dias seguidos"), `EPIC-4.md` §9.
 */

const MS_PER_DAY = 86_400_000;

/** Nº de semanas (colunas) da janela do heatmap (~6 meses). */
const WEEKS_IN_WINDOW = 26;

export interface HeatmapDay {
  /** Data da célula em `YYYY-MM-DD`. */
  date: string;
  /** `true` sse existe ≥1 `HabitLog` nesse dia (e o dia está dentro do range). */
  completed: boolean;
  /** `false` em células de padding (fora de `[from, to]`). */
  inRange: boolean;
}

export interface HeatmapWeek {
  /** Sempre 7 entradas, de segunda (índice 0) a domingo (índice 6). */
  days: HeatmapDay[];
}

/** `YYYY-MM-DD` → meia-noite UTC (parsing determinista, sem timezone local). */
function toUTCDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** `Date` → `YYYY-MM-DD` (componente de data UTC). */
function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Soma `days` dias a um `Date` em UTC (sem DST — aritmética segura). */
function addUTCDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

/** Índice do dia da semana com segunda=0 … domingo=6 (convenção PT-PT). */
function mondayBasedDay(date: Date): number {
  // getUTCDay(): domingo=0 … sábado=6. Roda para segunda=0 … domingo=6.
  return (date.getUTCDay() + 6) % 7;
}

/** Segunda-feira (UTC) da semana que contém `date`. */
function mondayOfWeek(date: Date): Date {
  return addUTCDays(date, -mondayBasedDay(date));
}

/**
 * Janela de ~6 meses para o heatmap (AC1).
 *
 * `to === todayISO`; `from` = a segunda-feira da semana situada
 * `WEEKS_IN_WINDOW - 1` (25) semanas antes da semana que contém `todayISO`,
 * ⇒ 26 semanas/colunas no total, todas alinhadas a segunda-feira.
 *
 * Pura e determinista: recebe `todayISO` (`YYYY-MM-DD`), devolve `{ from, to }`.
 */
export function getLast6MonthsRange(todayISO: string): { from: string; to: string } {
  const mondayThisWeek = mondayOfWeek(toUTCDate(todayISO));
  const from = addUTCDays(mondayThisWeek, -(WEEKS_IN_WINDOW - 1) * 7);
  return { from: toISODate(from), to: todayISO };
}

/**
 * Constrói a grelha do heatmap (AC2).
 *
 * Cada `HeatmapWeek` tem exactamente 7 dias (segunda→domingo). A grelha começa
 * na segunda-feira da semana de `range.from` e termina no domingo da semana de
 * `range.to` (≥26 colunas; tipicamente 26 quando o range vem de
 * `getLast6MonthsRange`). Células fora de `[from, to]` são padding
 * (`inRange: false`, `completed: false`). Logs com `date` fora de `[from, to]`
 * são ignorados (uma célula só fica `completed` se estiver `inRange`).
 * Dedup-safe: vários logs no mesmo dia ⇒ uma só célula `completed: true`.
 */
export function buildHeatmapGrid(
  logs: HabitLog[],
  range: { from: string; to: string },
): HeatmapWeek[] {
  const fromMs = toUTCDate(range.from).getTime();
  const toMs = toUTCDate(range.to).getTime();

  const gridStart = mondayOfWeek(toUTCDate(range.from));
  const gridEndSunday = addUTCDays(mondayOfWeek(toUTCDate(range.to)), 6);
  const totalDays =
    Math.round((gridEndSunday.getTime() - gridStart.getTime()) / MS_PER_DAY) + 1;
  const weekCount = Math.round(totalDays / 7);

  // Conjunto das datas com pelo menos um log (dedup-safe por construção).
  const completedDates = new Set(logs.map((log) => log.date));

  const weeks: HeatmapWeek[] = [];
  for (let w = 0; w < weekCount; w++) {
    const days: HeatmapDay[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = addUTCDays(gridStart, w * 7 + d);
      const cellMs = cell.getTime();
      const iso = toISODate(cell);
      const inRange = cellMs >= fromMs && cellMs <= toMs;
      days.push({
        date: iso,
        inRange,
        completed: inRange && completedDates.has(iso),
      });
    }
    weeks.push({ days });
  }
  return weeks;
}
