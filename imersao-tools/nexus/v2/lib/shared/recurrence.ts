import { RRule, type Options } from 'rrule';
import { db } from '@/lib/db/client';
import { createTask } from '@/lib/db/repos/tasks';
import type { Recurrence, Task } from '@/types/db';

/**
 * Nexus v2 — Recurrence wrapper sobre `rrule`
 *
 * Skeleton conforme architecture-v2.md §16 Epic 3 ("Recurrence engine partilhado
 * tarefas/finanças/hábitos — wrapper sobre `rrule`").
 *
 * Story 2.7 (FR10) estende este módulo com o motor de geração de instâncias:
 *   - `buildRecurrenceConfig` — abstrai a construção de `RecurrenceConfig` para
 *     os 6 tipos do FR10 (AC1).
 *   - `generateTaskInstances` — gera tasks filhas idempotentemente dentro de um
 *     horizonte (AC2).
 *   - `runRecurrenceEngine` — itera todas as `Recurrence` com `ownerType: 'task'`
 *     e gera instâncias (AC3).
 *
 * MOTOR AGNÓSTICO AO MECANISMO DE ACTIVAÇÃO (ADR-2.7-1): este módulo é uma função
 * pura sobre Dexie. NÃO importa `useEffect`, `setInterval`, `requestIdleCallback`
 * nem APIs de ServiceWorker. A activação vive em `hooks/useRecurrenceEngine.ts`.
 *
 * Os Epics 3/4 reutilizam este motor para finanças/hábitos/lembretes.
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
export function occurrencesBetween(rule: RRule, from: Date, to: Date): Date[] {
  return rule.between(from, to, true);
}

// ═══════════════════════════════════════════════════════════════════
// Story 2.7 (FR10) — Motor de recorrência
// ═══════════════════════════════════════════════════════════════════

/**
 * Os 6 tipos de recorrência do FR10 (sem invenção — JARVIS.txt L122-129).
 * Trace: Story 2.7 AC1 + FR10.
 */
export type RecurrenceType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'weekdays'
  | 'weekends'
  | 'monthly-specific-day';

/**
 * Opções para `buildRecurrenceConfig`. `weekday` é obrigatório para `'weekly'`
 * (0=Seg..6=Dom); `monthday` é obrigatório para `'monthly'` e
 * `'monthly-specific-day'` (1-31). `startDate` é sempre obrigatório.
 */
export interface RecurrenceTypeOpts {
  startDate: string; // ISO YYYY-MM-DD
  endDate?: string | null;
  weekday?: number; // 0=Seg..6=Dom — usado por 'weekly'
  monthday?: number; // 1-31 — usado por 'monthly' e 'monthly-specific-day'
}

const HORIZON_DAYS_DEFAULT = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Constrói uma `RecurrenceConfig` para um dos 6 tipos do FR10.
 *
 * Mapeamento (Story 2.7 — tabela "Mapeamento FR10 → RecurrenceConfig"):
 *   - daily                 → DAILY
 *   - weekly                → WEEKLY, byweekday: [weekday]
 *   - monthly               → MONTHLY, bymonthday: [monthday]
 *   - weekdays              → WEEKLY, byweekday: [0,1,2,3,4] (Seg-Sex)
 *   - weekends              → WEEKLY, byweekday: [5,6] (Sáb+Dom)
 *   - monthly-specific-day  → MONTHLY, bymonthday: [monthday]
 *
 * Trace: Story 2.7 AC1 + FR10.
 */
export function buildRecurrenceConfig(
  type: RecurrenceType,
  opts: RecurrenceTypeOpts,
): RecurrenceConfig {
  const base = {
    startDate: opts.startDate,
    endDate: opts.endDate ?? null,
    interval: 1,
  };

  switch (type) {
    case 'daily':
      return { ...base, freq: 'DAILY' };
    case 'weekly': {
      // CR Iter 2 (#6): falhar com erro descritivo se `weekday` ausente ou
      // fora do intervalo 0-6 — um default silencioso (→0=Segunda) geraria
      // recorrências no dia errado sem o utilizador perceber.
      if (
        !Number.isInteger(opts.weekday) ||
        opts.weekday! < 0 ||
        opts.weekday! > 6
      ) {
        throw new Error(
          `Recorrência semanal exige um dia da semana válido (0=Segunda..6=Domingo); recebido: ${String(opts.weekday)}`,
        );
      }
      return { ...base, freq: 'WEEKLY', byweekday: [opts.weekday!] };
    }
    case 'weekdays':
      return { ...base, freq: 'WEEKLY', byweekday: [0, 1, 2, 3, 4] };
    case 'weekends':
      return { ...base, freq: 'WEEKLY', byweekday: [5, 6] };
    case 'monthly':
    case 'monthly-specific-day': {
      // CR Iter 2 (#6): falhar com erro descritivo se `monthday` ausente ou
      // fora do intervalo 1-31 — um default silencioso (→1) geraria a
      // recorrência no dia errado do mês.
      if (
        !Number.isInteger(opts.monthday) ||
        opts.monthday! < 1 ||
        opts.monthday! > 31
      ) {
        throw new Error(
          `Recorrência mensal exige um dia do mês válido (1-31); recebido: ${String(opts.monthday)}`,
        );
      }
      return { ...base, freq: 'MONTHLY', bymonthday: [opts.monthday!] };
    }
    default: {
      // Exhaustiveness — tipo desconhecido lança erro PT-PT.
      const unknown: string = type;
      throw new Error(`Tipo de recorrência inválido: ${unknown}`);
    }
  }
}

/** Converte um `Date` (em UTC) para string ISO `YYYY-MM-DD`. */
function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Normaliza um instante para o início do dia em UTC (00:00:00.000Z).
 *
 * CR Iter 2 (#7): a janela do horizonte tem de assentar em fronteiras de dia
 * inteiro. As ocorrências do `rrule` têm `dtstart` à meia-noite UTC; se a
 * janela `from` for um instante a meio do dia, `between` perde a ocorrência
 * de hoje. Normalizar `from` ao início do dia e `to` ao fim do dia torna a
 * geração idempotente independentemente da hora a que o motor corre.
 */
function startOfUtcDay(ms: number): Date {
  const d = new Date(ms);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  );
}

/** Normaliza um instante para o fim do dia em UTC (23:59:59.999Z). */
function endOfUtcDay(ms: number): Date {
  const d = new Date(ms);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999),
  );
}

/**
 * Gera instâncias (tasks filhas) de uma recorrência dentro de um horizonte.
 *
 * Idempotente (Story 2.7 A3 + AC2 + T4): antes de criar uma instância para uma
 * data, verifica se já existe uma task filha com `parentTaskId === recurrence.ownerId`
 * e `dueDate === isoDate`. Se existir, incrementa `skipped` em vez de criar duplicado.
 *
 * A task filha herda `title`, `description`, `priority`, `projectId`, `tags` da
 * task-mãe; `status` começa em `'todo'`; `context` e `lastWorkedAt` começam `null`.
 *
 * Se a task-mãe não existir (ex: foi apagada), não gera nada — retorna zeros.
 *
 * `nowMs` (opcional) define o instante de referência do horizonte — por omissão
 * `Date.now()`. Existe para testabilidade determinística sem fake timers
 * (combinar fake timers com Dexie/IndexedDB quebra as operações async).
 *
 * Trace: Story 2.7 AC2 + FR10 + architecture-v2.md §6.2 (`parentTaskId`).
 */
export async function generateTaskInstances(
  recurrence: Recurrence,
  horizonDays: number = HORIZON_DAYS_DEFAULT,
  nowMs: number = Date.now(),
): Promise<{ created: number; skipped: number }> {
  // Parse da RRULE primeiro — uma `rule` corrompida deve ser detectada
  // independentemente de a task-mãe existir (T11 — tolerância a erros).
  const rule = RRule.fromString(recurrence.rule);

  const motherTask = await db.tasks.get(recurrence.ownerId);
  if (!motherTask) {
    return { created: 0, skipped: 0 };
  }

  const now = nowMs;
  // CR Iter 2 (#7): janela normalizada a fronteiras de dia inteiro em UTC.
  // `from` = início do dia de hoje; `to` = fim do dia de hoje + (horizonte-1).
  // Garante que a ocorrência de hoje é sempre apanhada e que correr o motor
  // duas vezes no mesmo dia (ou à meia-noite) não duplica nem salta instâncias.
  const from = startOfUtcDay(now);
  const to = endOfUtcDay(now + (horizonDays - 1) * MS_PER_DAY);
  const occurrences = occurrencesBetween(rule, from, to);

  // endDate da recorrência: não gerar instâncias após esta data (AC2).
  const endLimit = recurrence.endDate ? `${recurrence.endDate}` : null;

  // Idempotência — uma única leitura das filhas existentes (AC2 / A3 / T4).
  // PA-1: `parentTaskId` NÃO está indexado em version(2) — Dexie `where()` exige
  // índice, por isso usa-se `filter()` (full-table-scan). Aceitável para uso
  // pessoal (volume baixo). Se o volume crescer, adicionar índice em version(3)
  // (Epic 3) — version(2) é retroactivo e destrutivo, não se altera aqui.
  const existingChildren = await db.tasks
    .filter((t) => t.parentTaskId === recurrence.ownerId)
    .toArray();
  const existingDueDates = new Set(
    existingChildren.map((t) => t.dueDate).filter((d): d is string => d !== null),
  );

  let created = 0;
  let skipped = 0;

  for (const occurrence of occurrences) {
    const isoDate = toIsoDate(occurrence);
    if (endLimit !== null && isoDate > endLimit) continue;

    if (existingDueDates.has(isoDate)) {
      skipped += 1;
      continue;
    }

    const child: Task = {
      id: crypto.randomUUID(),
      title: motherTask.title,
      description: motherTask.description,
      priority: motherTask.priority,
      status: 'todo',
      dueDate: isoDate,
      projectId: motherTask.projectId,
      tags: [...motherTask.tags],
      context: null,
      lastWorkedAt: null,
      recurrenceId: recurrence.id,
      parentTaskId: recurrence.ownerId,
      createdAt: now,
      updatedAt: now,
    };
    await createTask(child);
    existingDueDates.add(isoDate);
    created += 1;
  }

  return { created, skipped };
}

/**
 * Motor de recorrência: itera todas as `Recurrence` com `ownerType: 'task'` e
 * gera as instâncias em falta dentro do horizonte padrão (90 dias).
 *
 * Tolerância a erros (AC3 + T11): um erro numa recorrência (ex: `rule` corrompida)
 * não interrompe as restantes — é capturado, contado em `errors`, e o motor
 * continua. Retorna contadores agregados.
 *
 * Genérico por design — o Epic 4 (hábitos/lembretes) reutiliza o mesmo padrão
 * com outros `ownerType`. Esta story trata apenas `ownerType: 'task'`.
 *
 * `nowMs` (opcional) é repassado a `generateTaskInstances` — ver nota nessa
 * função sobre testabilidade determinística.
 *
 * Trace: Story 2.7 AC3 + EPIC-2 §5.
 */
export async function runRecurrenceEngine(nowMs: number = Date.now()): Promise<{
  created: number;
  skipped: number;
  errors: number;
}> {
  const recurrences = await db.recurrences
    .where('ownerType')
    .equals('task')
    .toArray();

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const recurrence of recurrences) {
    try {
      const result = await generateTaskInstances(recurrence, HORIZON_DAYS_DEFAULT, nowMs);
      created += result.created;
      skipped += result.skipped;
    } catch (error) {
      errors += 1;
      console.error(
        `Falha ao gerar instâncias da recorrência ${recurrence.id}`,
        error,
      );
    }
  }

  return { created, skipped, errors };
}
