import { endOfMonth, format, startOfMonth } from 'date-fns';
import type { Transaction } from '@/types/db';

/**
 * Nexus v2 — Agregações da vista mensal (Story 3.7 / AC1)
 *
 * Módulo de funções puras (sem Dexie, sem React) que agregam `Transaction[]`
 * por categoria, por dia e em totais entrada vs saída, e que calculam janelas
 * de datas (mês corrente, projecção 30 dias) para a page `/financas/mes`.
 *
 * Determinístico — todas as funções recebem `Date` via argumento, sem reliance
 * em runtime clock (testáveis sem fake timers). Reutilizável pela Story 3.11
 * (tool `consultar_balanço` do cérebro multi-intent).
 *
 * Convenções:
 *   - `amount` em cêntimos: positivo = entrada, negativo = saída.
 *   - `dateISO` no formato `YYYY-MM-DD` (componente de data, sem hora).
 *   - Ordenação `aggregateByCategory`: descendente por `Math.abs(sumCents)`.
 *   - Ordenação `aggregateByDay`: ascendente por `dateISO` (cronológica).
 *   - Categorias/dias com `sumCents === 0` ou sem transações são filtrados.
 *
 * Trace: Story 3.7 AC1 + AC11; padrão de helpers puros `installmentSplit.ts`
 * (Story 3.6), `balanceInput.ts` (Story 3.5).
 */

const ISO_DAY = 'yyyy-MM-dd';
const MS_PER_DAY = 86_400_000;

export interface MonthBounds {
  /** Primeiro dia do mês — `YYYY-MM-01`. */
  startISO: string;
  /** Último dia do mês — `YYYY-MM-{28|29|30|31}`. */
  endISO: string;
}

export interface ProjectionWindow {
  /** Início da janela (inclusivo) — `YYYY-MM-DD`. */
  startISO: string;
  /** Fim da janela (inclusivo) — `YYYY-MM-DD`. */
  endISO: string;
}

export interface InOutTotals {
  /** Soma de todas as entradas (`amount > 0`). */
  inflowCents: number;
  /** Soma de todas as saídas (`amount < 0`) — mantém-se negativo. */
  outflowCents: number;
  /** `inflowCents + outflowCents` (saldo líquido com sinal). */
  netCents: number;
  /** Número total de transações consideradas. */
  count: number;
}

export interface CategoryAggregate {
  /** Nome da categoria (`Transaction.category`, que é o `Category.name`). */
  category: string;
  /** Soma com sinal — positiva se direction === 'in', negativa se 'out'. */
  sumCents: number;
  /** Número de transações nesta categoria + direcção. */
  count: number;
  /** Direcção do agregado — separa entradas vs saídas da mesma categoria. */
  direction: 'in' | 'out';
}

export interface DayAggregate {
  /** Componente de data — `YYYY-MM-DD`. */
  dateISO: string;
  /** Soma de entradas (`amount > 0`) no dia. */
  inflowCents: number;
  /** Soma de saídas (`amount < 0`) no dia — mantém-se negativo. */
  outflowCents: number;
  /** `inflowCents + outflowCents` (saldo líquido do dia). */
  netCents: number;
  /** Número de transações no dia. */
  count: number;
}

/**
 * Devolve o primeiro e o último dia do mês a que `reference` pertence.
 *
 * Determinístico — usa `startOfMonth`/`endOfMonth` da `date-fns` em fuso local.
 * Trace: Story 3.7 AC1 + AC11 (Fev bissexto/não-bissexto, 30 vs 31 dias).
 */
export function getMonthBounds(reference: Date): MonthBounds {
  return {
    startISO: format(startOfMonth(reference), ISO_DAY),
    endISO: format(endOfMonth(reference), ISO_DAY),
  };
}

/**
 * Devolve uma janela rolling `[reference, reference + days]`, inclusiva em
 * ambos os extremos. Usada na secção "Projecção 30 dias" da page `/financas/mes`
 * — inclui automaticamente recorrentes (já materializadas pelo motor da Story
 * 3.4) e prestações (já materializadas eager pela Story 3.6) no intervalo.
 *
 * @throws {RangeError} Se `days` não for inteiro `>= 1`.
 *
 * Trace: Story 3.7 AC1 + AC7 ([AUTO-DECISION] A5 — janela rolling a partir de
 * hoje, não do início do mês).
 */
export function getProjectionWindow(
  reference: Date,
  days = 30,
): ProjectionWindow {
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError(
      `days deve ser inteiro >= 1 (recebido: ${String(days)})`,
    );
  }
  const start = reference;
  const end = new Date(start.getTime() + days * MS_PER_DAY);
  return {
    startISO: format(start, ISO_DAY),
    endISO: format(end, ISO_DAY),
  };
}

/**
 * Agrega `Transaction[]` em totais entrada vs saída.
 *
 * Invariante: `netCents === inflowCents + outflowCents` para qualquer input.
 * Trace: Story 3.7 AC1 + AC4 (KPIs Entradas/Saídas/Saldo).
 */
export function aggregateInOut(transactions: Transaction[]): InOutTotals {
  let inflowCents = 0;
  let outflowCents = 0;
  for (const t of transactions) {
    if (t.amount > 0) inflowCents += t.amount;
    else if (t.amount < 0) outflowCents += t.amount;
  }
  return {
    inflowCents,
    outflowCents,
    netCents: inflowCents + outflowCents,
    count: transactions.length,
  };
}

/**
 * Agrega `Transaction[]` por categoria e direcção.
 *
 * - Chave composta `category|direction` — entradas e saídas da mesma categoria
 *   aparecem como agregados separados ([AUTO-DECISION] A7).
 * - Filtra agregados com `sumCents === 0` ([AUTO-DECISION] A9).
 * - Ordena descendente por `Math.abs(sumCents)` — categoria mais movimentada
 *   no topo (estável para `|sum|` iguais; preserva ordem de inserção).
 *
 * Trace: Story 3.7 AC1 + AC5 (lista por categoria — Saídas / Entradas).
 */
export function aggregateByCategory(
  transactions: Transaction[],
): CategoryAggregate[] {
  const buckets = new Map<string, CategoryAggregate>();
  for (const t of transactions) {
    if (t.amount === 0) continue;
    const direction: 'in' | 'out' = t.amount > 0 ? 'in' : 'out';
    const key = `${t.category}|${direction}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.sumCents += t.amount;
      existing.count += 1;
    } else {
      buckets.set(key, {
        category: t.category,
        sumCents: t.amount,
        count: 1,
        direction,
      });
    }
  }
  return Array.from(buckets.values())
    .filter((b) => b.sumCents !== 0)
    .sort((a, b) => Math.abs(b.sumCents) - Math.abs(a.sumCents));
}

/**
 * Agrega `Transaction[]` por dia (componente `YYYY-MM-DD` de `Transaction.date`).
 *
 * - Filtra dias sem transações (não aparecem dias vazios — [AUTO-DECISION] A9).
 * - Ordena ascendente por `dateISO` (cronológico — primeiro do mês em cima).
 *
 * Trace: Story 3.7 AC1 + AC6 (lista por dia cronológica).
 */
export function aggregateByDay(transactions: Transaction[]): DayAggregate[] {
  const buckets = new Map<string, DayAggregate>();
  for (const t of transactions) {
    const existing = buckets.get(t.date);
    if (existing) {
      if (t.amount > 0) existing.inflowCents += t.amount;
      else if (t.amount < 0) existing.outflowCents += t.amount;
      existing.netCents += t.amount;
      existing.count += 1;
    } else {
      buckets.set(t.date, {
        dateISO: t.date,
        inflowCents: t.amount > 0 ? t.amount : 0,
        outflowCents: t.amount < 0 ? t.amount : 0,
        netCents: t.amount,
        count: 1,
      });
    }
  }
  return Array.from(buckets.values()).sort((a, b) =>
    a.dateISO.localeCompare(b.dateISO),
  );
}
