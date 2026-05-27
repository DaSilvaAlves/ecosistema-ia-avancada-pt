import { format } from 'date-fns';
import { installmentDates } from '@/lib/financas/installmentSplit';
import type { Transaction } from '@/types/db';

/**
 * Nexus v2 — Cálculo de faturas de cartão (Story 3.8 — FR18 + FR19)
 *
 * Módulo de funções puras (sem Dexie, sem React) que:
 *   - `getBillingPeriods` — calcula os limites de fatura corrente e próxima a
 *     partir de `closingDay` e uma data de referência, com clamp ao último dia
 *     do mês destino (padrão de `installmentSplit.ts`).
 *   - `aggregateCardTransactions` — soma de transações cujo `date` cai dentro
 *     de um período (ambos extremos inclusivos); separa entradas vs saídas.
 *   - `countInstallmentPayments` — contagem `paid/remaining/totalMonths` de uma
 *     prestação dada `startDate` + `n` + `reference`. Reutiliza `installmentDates`.
 *
 * Determinístico — todas as funções recebem `Date` via argumento, sem reliance
 * em runtime clock (testáveis sem fake timers).
 *
 * Reutilizável pela Story 3.11 (tool `consultar_balanço` do cérebro
 * multi-intent) — padrão herdado de `monthAggregations.ts` (Story 3.7).
 */

const ISO_DAY = 'yyyy-MM-dd';

export interface BillingPeriod {
  /** Primeiro dia do período (inclusivo) — `YYYY-MM-DD`. */
  startISO: string;
  /** Último dia do período (inclusivo) — `YYYY-MM-DD`. */
  endISO: string;
}

export interface BillingPeriods {
  /** Fatura corrente — começa no fecho mais recente, termina antes do próximo. */
  current: BillingPeriod;
  /** Próxima fatura — começa no próximo fecho, termina antes do fecho seguinte. */
  next: BillingPeriod;
}

export interface CardTransactionTotals {
  /** Soma de entradas (`amount > 0`). */
  inflowCents: number;
  /** Soma de saídas (`amount < 0`) — mantém-se negativo. */
  outflowCents: number;
  /** `inflowCents + outflowCents` (saldo líquido do período, com sinal). */
  totalCents: number;
  /** Número de transações dentro do período. */
  count: number;
}

export interface InstallmentProgress {
  /** Parcelas com data `<= reference` (consideradas pagas/em curso). */
  paid: number;
  /** Parcelas com data `> reference` (futuras). */
  remaining: number;
  /** Total de parcelas — sempre igual a `paid + remaining`. */
  totalMonths: number;
}

/**
 * Devolve o número de dias do mês `monthOneIndexed` (1-12) do ano `year`.
 * `Date.UTC(year, monthOneIndexed, 0)` é o dia 0 do mês `monthOneIndexed`
 * (1-indexed), ou seja, o último dia do mês anterior em 0-indexed JS, que
 * coincide com o último dia do mês 1-indexed pedido.
 */
function lastDayOfMonth(year: number, monthOneIndexed: number): number {
  return new Date(Date.UTC(year, monthOneIndexed, 0)).getUTCDate();
}

/**
 * Constrói a data ISO `YYYY-MM-DD` do fecho de cartão para um dado
 * `(year, monthOneIndexed, closingDay)`, com clamp ao último dia do mês
 * quando `closingDay > lastDayOfMonth`. Aceita `monthOneIndexed` fora de
 * `[1, 12]` e normaliza (mês 0 → Dez do ano anterior; mês 13 → Jan do seguinte).
 *
 * Padrão herdado de `installmentDates` (Story 3.6 — `lib/financas/installmentSplit.ts`).
 */
function clampedClosingDateISO(
  year: number,
  monthOneIndexed: number,
  closingDay: number,
): string {
  const yearAdj = year + Math.floor((monthOneIndexed - 1) / 12);
  const monthAdj = (((monthOneIndexed - 1) % 12) + 12) % 12 + 1; // 1-12
  const lastDay = lastDayOfMonth(yearAdj, monthAdj);
  const day = Math.min(closingDay, lastDay);
  return `${yearAdj}-${String(monthAdj).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Devolve a data ISO imediatamente anterior à recebida, em aritmética pura
 * de campos `YYYY-MM-DD` (sem dependência de timezone). Trata fronteira de
 * mês e de ano.
 */
function dayBeforeISO(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (d > 1) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d - 1).padStart(2, '0')}`;
  }
  if (m > 1) {
    const prevMonth = m - 1;
    const lastDay = lastDayOfMonth(y, prevMonth);
    return `${y}-${String(prevMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  }
  return `${y - 1}-12-31`;
}

/**
 * Calcula os limites de fatura corrente e próxima de um cartão de crédito.
 *
 * Algoritmo:
 *   1. `closeThisMonth` = fecho clampado do mês actual da `reference`.
 *   2. Se `reference.day >= closeThisMonth.day` → `ultimoFecho = closeThisMonth`;
 *      caso contrário → `ultimoFecho = clamp(refMonth-1)`.
 *   3. `proximoFecho = clamp(ultimoFecho.month+1)`.
 *   4. `fechoSeguinte = clamp(proximoFecho.month+1)`.
 *   5. `current.endISO = dayBefore(proximoFecho)`; `next.endISO = dayBefore(fechoSeguinte)`.
 *
 * Notas:
 *   - O dia de fecho INICIA a nova fatura (entra na corrente, não na anterior).
 *     Verificado pelo caso canónico `closingDay=15, today=2026-05-15` (AC2).
 *   - Clamp de fim de mês (idêntico a `installmentDates`): `closingDay=31` em
 *     Fevereiro 2026 → fecho a `2026-02-28`. AC2 cobre este caso.
 *
 * Trace: Story 3.8 AC1 + AC2 (tabela canónica de 5 casos); [AUTO-DECISION] A3.
 *
 * @param closingDay - Dia do mês de fecho da fatura, inteiro `[1, 31]`.
 * @param reference - Data de referência. Os campos `getFullYear`/`getMonth`/`getDate` (local) são lidos.
 * @returns Limites ISO da fatura corrente e próxima.
 * @throws {RangeError} Se `closingDay` não for inteiro `[1, 31]` ou `reference` não for `Date` válido.
 */
export function getBillingPeriods(
  closingDay: number,
  reference: Date,
): BillingPeriods {
  if (!Number.isInteger(closingDay) || closingDay < 1 || closingDay > 31) {
    throw new RangeError(
      `closingDay deve ser inteiro entre 1 e 31 (recebido: ${closingDay})`,
    );
  }

  // Story 3.8 CR Iter 2 (A2) — validar `reference` antes de derivar limites.
  // Um `Date` inválido (ex: `new Date('texto')`) produz `NaN` em `getFullYear`
  // e propagaria silenciosamente para os ISOs (`NaN-NaN-NaN`), partindo todas
  // as comparações lexicográficas a jusante.
  if (!(reference instanceof Date) || Number.isNaN(reference.getTime())) {
    throw new RangeError(
      `reference deve ser um Date válido (recebido: ${String(reference)})`,
    );
  }

  const refYear = reference.getFullYear();
  const refMonth = reference.getMonth() + 1; // 1-12
  const refDay = reference.getDate();

  const closeThisMonthISO = clampedClosingDateISO(refYear, refMonth, closingDay);
  const closeThisMonthDay = Number(closeThisMonthISO.slice(8));

  const ultimoFechoISO =
    refDay >= closeThisMonthDay
      ? closeThisMonthISO
      : clampedClosingDateISO(refYear, refMonth - 1, closingDay);

  const uYear = Number(ultimoFechoISO.slice(0, 4));
  const uMonth = Number(ultimoFechoISO.slice(5, 7));
  const proximoFechoISO = clampedClosingDateISO(uYear, uMonth + 1, closingDay);

  const pYear = Number(proximoFechoISO.slice(0, 4));
  const pMonth = Number(proximoFechoISO.slice(5, 7));
  const fechoSeguinteISO = clampedClosingDateISO(pYear, pMonth + 1, closingDay);

  return {
    current: {
      startISO: ultimoFechoISO,
      endISO: dayBeforeISO(proximoFechoISO),
    },
    next: {
      startISO: proximoFechoISO,
      endISO: dayBeforeISO(fechoSeguinteISO),
    },
  };
}

/**
 * Agrega `Transaction[]` por intervalo de fatura.
 *
 * - `t.date` é comparado lexicograficamente contra `period.startISO`/`endISO`
 *   (ambos `YYYY-MM-DD` ⇒ ordem cronológica equivale a ordem alfabética).
 * - Ambos os extremos do período são inclusivos.
 * - Convenção `Transaction.amount` (types/db.ts:117): positivo = entrada,
 *   negativo = saída. `totalCents = inflow + outflow` mantém o sinal.
 *
 * Invariante: `totalCents === inflowCents + outflowCents` para qualquer input.
 *
 * Trace: Story 3.8 AC1 + AC5 (métricas de fatura corrente e próxima).
 */
export function aggregateCardTransactions(
  transactions: Transaction[],
  period: BillingPeriod,
): CardTransactionTotals {
  let inflowCents = 0;
  let outflowCents = 0;
  let count = 0;
  for (const t of transactions) {
    if (t.date < period.startISO || t.date > period.endISO) continue;
    count += 1;
    if (t.amount > 0) inflowCents += t.amount;
    else if (t.amount < 0) outflowCents += t.amount;
  }
  return {
    inflowCents,
    outflowCents,
    totalCents: inflowCents + outflowCents,
    count,
  };
}

/**
 * Conta parcelas pagas / em falta de uma prestação.
 *
 * Algoritmo: usa `installmentDates(startDate, n)` (Story 3.6) para gerar as
 * `n` datas mensais com clamp; conta quantas têm `date <= reference`.
 *
 * Convenção `paid`: parcelas cuja data já foi atingida (incluindo a do dia da
 * referência). `reference: Date` é convertido para ISO local (`yyyy-MM-dd`)
 * via `date-fns format` — consistente com o resto do projecto.
 *
 * Invariante: `paid + remaining === totalMonths` para qualquer input.
 *
 * Trace: Story 3.8 AC1 + AC6 + AC8; [AUTO-DECISION] A8.
 *
 * @param startDate - Data ISO `YYYY-MM-DD` da 1ª parcela.
 * @param n - Número de prestações, inteiro `>= 1`.
 * @param reference - Data de referência (tipicamente `new Date()`).
 * @returns Contagem `paid`/`remaining`/`totalMonths`.
 * @throws Propaga `RangeError`/`Error` de `installmentDates` se `n` ou `startDate` forem inválidos.
 */
export function countInstallmentPayments(
  startDate: string,
  n: number,
  reference: Date,
): InstallmentProgress {
  const dates = installmentDates(startDate, n);
  const refISO = format(reference, ISO_DAY);
  const paid = dates.filter((d) => d <= refISO).length;
  return {
    paid,
    remaining: n - paid,
    totalMonths: n,
  };
}
