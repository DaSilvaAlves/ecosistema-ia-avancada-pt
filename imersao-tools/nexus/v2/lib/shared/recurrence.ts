import { RRule, type Options } from 'rrule';

/**
 * Nexus v2 — Recurrence wrapper sobre `rrule`
 *
 * Skeleton conforme architecture-v2.md §16 Epic 3 ("Recurrence engine partilhado
 * tarefas/finanças/hábitos — wrapper sobre `rrule`").
 *
 * Os Epics 2/3/4 expandem este módulo com helpers específicos por domínio.
 */

export interface RecurrenceConfig {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  byweekday?: number[]; // 0=Mon ... 6=Sun (rrule.RRule.MO..SU)
  bymonthday?: number[];
  startDate: string; // ISO YYYY-MM-DD
  endDate?: string | null;
  count?: number;
}

const FREQ_MAP: Record<RecurrenceConfig['freq'], number> = {
  YEARLY: RRule.YEARLY,
  MONTHLY: RRule.MONTHLY,
  WEEKLY: RRule.WEEKLY,
  DAILY: RRule.DAILY,
};

/**
 * Constrói uma `RRule` a partir de config simples.
 * Epics 2-4 chamam esta função para gerar instâncias recorrentes.
 */
export function buildRRule(config: RecurrenceConfig): RRule {
  const dtstart = new Date(`${config.startDate}T00:00:00.000Z`);
  if (Number.isNaN(dtstart.getTime())) {
    throw new Error(`startDate inválida: ${config.startDate}`);
  }

  const options: Partial<Options> = {
    freq: FREQ_MAP[config.freq],
    interval: config.interval ?? 1,
    dtstart,
  };

  if (config.byweekday && config.byweekday.length > 0) {
    options.byweekday = config.byweekday;
  }
  if (config.bymonthday && config.bymonthday.length > 0) {
    options.bymonthday = config.bymonthday;
  }
  if (config.endDate) {
    const until = new Date(`${config.endDate}T23:59:59.000Z`);
    if (!Number.isNaN(until.getTime())) options.until = until;
  }
  if (config.count) options.count = config.count;

  return new RRule(options);
}

/**
 * Gera ocorrências entre duas datas (inclusivo).
 */
export function occurrencesBetween(
  rule: RRule,
  from: Date,
  to: Date,
): Date[] {
  return rule.between(from, to, true);
}
