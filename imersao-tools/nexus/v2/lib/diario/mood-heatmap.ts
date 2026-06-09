import type { JournalEntry } from '@/types/db';

/**
 * Nexus v2 — Helper puro do heatmap de mood do diário (Story 5.3 — FR44)
 *
 * Módulo de funções puras (sem Dexie, sem React) que (1) calculam a janela de
 * ~6 meses e (2) transformam `JournalEntry[]` numa grelha semanas × 7 dias,
 * estilo GitHub contributions, onde cada célula carrega o **mood (1-5)** do dia
 * ou `null` (sem entrada / padding fora de range).
 *
 * Domínio separado do heatmap de hábitos (`lib/habitos/heatmap.ts`): aquele é
 * **binário** (`completed: boolean` — fez/não fez); este é **escalar** (mood
 * 1-5 ou ausência). A aritmética de datas/grelha é reaproveitada por
 * re-implementação local (UTC determinístico, segunda=0, 26 semanas) — sem
 * acoplamento entre domínios, conforme Dev Notes da 5.3 ([R2]).
 *
 * Determinístico — `getLast6MonthsRange` recebe `todayISO` por argumento; nenhuma
 * função chama `Date.now()`/`new Date()` sem argumento (testável sem fake timers).
 *
 * Convenções (alinhadas à Story 4.2/4.3):
 *   - Datas em `YYYY-MM-DD`, derivadas SEMPRE em UTC — evita off-by-one entre
 *     "hoje"/limites do range e as entradas gravadas.
 *   - Semana a começar à SEGUNDA (PT-PT) — índice 0 = segunda, 6 = domingo.
 *   - 1 entrada por dia (FR42, garantido no repo da 5.1): se houver duplicados no
 *     mesmo `date`, a última entrada vence (dedup-safe por construção do Map).
 *
 * Trace: FR44 (PRD §6.8), `EPIC-5.md` §5 (Story 5.3), padrão Story 4.3.
 */

const MS_PER_DAY = 86_400_000;

/** Nº de semanas (colunas) da janela do heatmap (~6 meses). */
const WEEKS_IN_WINDOW = 26;

/** Mood de uma entrada de diário (FR42). */
export type Mood = 1 | 2 | 3 | 4 | 5;

export interface MoodHeatmapDay {
  /** Data da célula em `YYYY-MM-DD`. */
  date: string;
  /** Mood (1-5) da entrada desse dia, ou `null` se não há entrada (ou padding). */
  mood: Mood | null;
  /** `false` em células de padding (fora de `[from, to]`). */
  inRange: boolean;
}

export interface MoodHeatmapWeek {
  /** Sempre 7 entradas, de segunda (índice 0) a domingo (índice 6). */
  days: MoodHeatmapDay[];
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
 * Janela de ~6 meses para o heatmap (AC3).
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
 * Constrói a grelha do heatmap de mood (AC3).
 *
 * Cada `MoodHeatmapWeek` tem exactamente 7 dias (segunda→domingo). A grelha
 * começa na segunda-feira da semana de `range.from` e termina no domingo da
 * semana de `range.to` (≥26 colunas; tipicamente 26 quando o range vem de
 * `getLast6MonthsRange`). Células fora de `[from, to]` são padding
 * (`inRange: false`, `mood: null`). Entradas com `date` fora de `[from, to]`
 * são ignoradas (uma célula só recebe mood se estiver `inRange`).
 * Dedup-safe: várias entradas no mesmo dia ⇒ a última no array vence.
 */
export function buildMoodHeatmapGrid(
  entries: JournalEntry[],
  range: { from: string; to: string },
): MoodHeatmapWeek[] {
  const fromMs = toUTCDate(range.from).getTime();
  const toMs = toUTCDate(range.to).getTime();

  const gridStart = mondayOfWeek(toUTCDate(range.from));
  const gridEndSunday = addUTCDays(mondayOfWeek(toUTCDate(range.to)), 6);
  const totalDays =
    Math.round((gridEndSunday.getTime() - gridStart.getTime()) / MS_PER_DAY) + 1;
  const weekCount = Math.round(totalDays / 7);

  // Mapa data → mood (dedup-safe: a última entrada de cada dia vence).
  const moodByDate = new Map<string, Mood>();
  for (const entry of entries) moodByDate.set(entry.date, entry.mood);

  const weeks: MoodHeatmapWeek[] = [];
  for (let w = 0; w < weekCount; w++) {
    const days: MoodHeatmapDay[] = [];
    for (let d = 0; d < 7; d++) {
      const cell = addUTCDays(gridStart, w * 7 + d);
      const cellMs = cell.getTime();
      const iso = toISODate(cell);
      const inRange = cellMs >= fromMs && cellMs <= toMs;
      const mood = inRange ? (moodByDate.get(iso) ?? null) : null;
      days.push({ date: iso, mood, inRange });
    }
    weeks.push({ days });
  }
  return weeks;
}
