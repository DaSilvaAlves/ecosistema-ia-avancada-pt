import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { pt } from 'date-fns/locale';

/**
 * Nexus v2 — weekRange helper (Story 2.5 / T2 / A8 + A9)
 *
 * Calcula a janela semanal usada pela vista Calendário (`CalendarBoard`).
 *
 * Convenções:
 *   - Semana inicia à segunda-feira (`weekStartsOn: 1`) — [AUTO-DECISION A8].
 *     Convenção PT-PT vs `weekStartsOn: 0` (Domingo, US).
 *   - Identificador de dia: string ISO date `YYYY-MM-DD` em local time
 *     ([AUTO-DECISION A9]) — usado como `id` em `useDroppable` e em
 *     `updateTask({ dueDate })`. Nunca persistir com componente de hora.
 *   - Labels: `format(..., { locale: pt })` para PT-PT
 *     (Seg/Ter/.../Dom + Segunda-feira/.../Domingo + Maio/.../Dezembro).
 *   - `isToday` é determinístico via `isSameDay` (compara YMD local).
 *
 * Helpers exportados:
 *   - `getWeekRange(anchor?)` — devolve a semana que contém `anchor` (default: hoje).
 *   - `getPreviousWeek(current)` — shift -7d.
 *   - `getNextWeek(current)` — shift +7d.
 *   - `formatDueDateIso(date)` — `YYYY-MM-DD` em local time, para writes Dexie.
 */

export interface CalendarDay {
  /** Midnight local desse dia. */
  date: Date;
  /** ISO date `YYYY-MM-DD` em local time — id de `useDroppable` e `Task.dueDate`. */
  iso: string;
  /** Label abreviado PT-PT ("Seg", "Ter", ..., "Dom"). */
  label: string;
  /** Label longo PT-PT ("Segunda-feira", ..., "Domingo") — para aria-label. */
  longLabel: string;
  /** Dia do mês 1-31. */
  dayNumber: number;
  /** Mês abreviado PT-PT ("Mai"). */
  monthLabel: string;
  /** True se este dia é hoje (local time). */
  isToday: boolean;
}

export interface WeekRange {
  /** Segunda-feira da semana, 00:00 local. */
  start: Date;
  /** Segunda-feira da semana seguinte, 00:00 local (exclusivo). */
  end: Date;
  /** 7 dias consecutivos (segunda → domingo). */
  days: CalendarDay[];
  /** Label PT-PT da semana — ex: "Semana de 12 de Maio de 2026". */
  weekLabel: string;
}

const WEEK_STARTS_ON = 1 as const; // A8 — segunda-feira

/**
 * Devolve a semana (segunda → domingo) que contém `anchor`.
 * `anchor` default = hoje. `referenceToday` default = hoje (permite testes deterministas).
 */
export function getWeekRange(
  anchor: Date = new Date(),
  referenceToday: Date = new Date(),
): WeekRange {
  const start = startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON });
  const days: CalendarDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return {
      date,
      iso: formatDueDateIso(date),
      label: capitalize(format(date, 'EEE', { locale: pt })),
      longLabel: capitalize(format(date, 'EEEE', { locale: pt })),
      dayNumber: date.getDate(),
      monthLabel: capitalize(format(date, 'MMM', { locale: pt })),
      isToday: isSameDay(date, referenceToday),
    };
  });
  return {
    start,
    end: addDays(start, 7),
    days,
    weekLabel: capitalize(
      format(start, "'Semana de' d 'de' MMMM 'de' yyyy", { locale: pt }),
    ),
  };
}

export function getPreviousWeek(
  current: WeekRange,
  referenceToday: Date = new Date(),
): WeekRange {
  return getWeekRange(addDays(current.start, -7), referenceToday);
}

export function getNextWeek(
  current: WeekRange,
  referenceToday: Date = new Date(),
): WeekRange {
  return getWeekRange(addDays(current.start, 7), referenceToday);
}

/**
 * Formata uma `Date` como `YYYY-MM-DD` em LOCAL time (não UTC).
 *
 * Usar SEMPRE em vez de `date.toISOString().slice(0, 10)` — esse último converte
 * para UTC e produz off-by-one em timezones com offset (Portugal BST = +1h).
 *
 * Trace anti-padrão Story 2.5 — A9. Coerente com `parseDueDateMs` da Story 2.3
 * (que trata `YYYY-MM-DD` como midnight local).
 */
export function formatDueDateIso(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Capitaliza a primeira letra (PT-PT `pt` locale do date-fns devolve "seg",
 * "segunda-feira" em minúsculas — queremos "Seg", "Segunda-feira" nos labels).
 */
function capitalize(s: string): string {
  if (s.length === 0) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
