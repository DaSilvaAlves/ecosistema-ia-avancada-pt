/**
 * Nexus v2 — Cálculo de compras parceladas (Story 3.6 — FR19)
 *
 * Uma compra parcelada (`Installment`) é finita: um total dividido em N
 * prestações mensais. Este módulo é o núcleo de cálculo da Story 3.6 —
 * funções **puras** (sem Dexie, sem React), testáveis em Vitest sem DOM:
 *
 *   - `splitInstallmentAmount` — divide um total em N parcelas inteiras com
 *     arredondamento exacto (a soma das parcelas é SEMPRE igual ao total).
 *   - `installmentDates` — gera as N datas mensais a partir da data de início,
 *     com clamp ao último dia do mês quando o dia-de-origem não existe.
 *
 * Contrato monetário (igual a `currencyInput.ts` / `formatCurrency.ts`): os
 * montantes vivem sempre como inteiros em cêntimos; nunca aritmética de
 * vírgula flutuante.
 */

/** Regex de data ISO 8601 `YYYY-MM-DD` — paridade com `schemas.ts`. */
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Divide `totalCents` (magnitude inteira não-negativa, em cêntimos) em `n`
 * parcelas inteiras.
 *
 * Algoritmo (Story 3.6 [AUTO-DECISION] A3): `base = Math.floor(totalCents / n)`,
 * `remainder = totalCents % n`. As primeiras `remainder` parcelas recebem
 * `base + 1`, as restantes `base`. O resto é distribuído cêntimo a cêntimo
 * pelas primeiras parcelas — nenhum cêntimo se perde nem é inventado.
 *
 * Invariante: `soma(resultado) === totalCents` e `resultado.length === n`.
 *
 * Exemplos:
 *   splitInstallmentAmount(120000, 12) → [10000 ×12]            (€1.200/12 = €100)
 *   splitInstallmentAmount(10000, 3)   → [3334, 3333, 3333]     (€100/3, soma 10000)
 *   splitInstallmentAmount(0, 4)       → [0, 0, 0, 0]
 *
 * @param totalCents - Total da compra, inteiro em cêntimos, não-negativo.
 * @param n - Número de prestações, inteiro >= 1.
 * @returns Array de `n` montantes inteiros em cêntimos (magnitudes positivas).
 * @throws {RangeError} Se `n` não for inteiro >= 1 ou `totalCents` não for inteiro >= 0.
 */
export function splitInstallmentAmount(totalCents: number, n: number): number[] {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(
      `Número de prestações deve ser um inteiro >= 1 (recebido: ${n}).`,
    );
  }
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    throw new RangeError(
      `Valor total deve ser um inteiro em cêntimos >= 0 (recebido: ${totalCents}).`,
    );
  }

  const base = Math.floor(totalCents / n);
  const remainder = totalCents % n;
  return Array.from({ length: n }, (_, i) => (i < remainder ? base + 1 : base));
}

/** Formata um inteiro com pelo menos 2 dígitos (`5` → `'05'`). */
function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Gera as `n` datas ISO `YYYY-MM-DD` de uma compra parcelada: a parcela `i`
 * (0-indexed) cai no mesmo dia-do-mês de `startDate`, `i` meses depois.
 *
 * Clamp de fim de mês (Story 3.6 [AUTO-DECISION] A4): se o mês de destino não
 * tiver o dia-de-origem, a data é fixada no último dia desse mês. Ex:
 * `startDate = 2026-01-31` → parcela 1 = `2026-02-28` (Fev 2026 não é bissexto).
 *
 * NÃO usa `rrule` MONTHLY+`bymonthday` — o `rrule` salta meses sem o dia,
 * produzindo menos de `n` datas. Este stepping mensal com clamp garante
 * exactamente `n` datas.
 *
 * Invariante: `resultado.length === n`, todas em formato ISO 8601.
 *
 * @param startDate - Data de início, ISO `YYYY-MM-DD`.
 * @param n - Número de prestações, inteiro >= 1.
 * @returns Array de `n` datas ISO `YYYY-MM-DD`, uma por mês.
 * @throws {RangeError} Se `n` não for inteiro >= 1.
 * @throws {Error} Se `startDate` não for uma data ISO válida.
 */
export function installmentDates(startDate: string, n: number): string[] {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError(
      `Número de prestações deve ser um inteiro >= 1 (recebido: ${n}).`,
    );
  }
  if (!ISO_DATE_REGEX.test(startDate)) {
    throw new Error(
      `Data de início inválida (${startDate}) — usa o formato ISO 8601 (ex: 2026-05-15).`,
    );
  }

  const baseYear = Number(startDate.slice(0, 4));
  const baseMonth = Number(startDate.slice(5, 7)); // 1-12
  const originDay = Number(startDate.slice(8, 10)); // 1-31

  // Valida que startDate é uma data de calendário real (rejeita 2026-13-01,
  // 2026-02-30, etc.) — o regex sozinho não o garante.
  const daysInStartMonth = new Date(
    Date.UTC(baseYear, baseMonth, 0),
  ).getUTCDate();
  if (
    baseMonth < 1 ||
    baseMonth > 12 ||
    originDay < 1 ||
    originDay > daysInStartMonth
  ) {
    throw new Error(
      `Data de início inválida (${startDate}) — não corresponde a uma data de calendário real.`,
    );
  }

  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    // monthIndex 0-based desde Janeiro do baseYear.
    const monthIndex = baseMonth - 1 + i;
    const year = baseYear + Math.floor(monthIndex / 12);
    const month0 = ((monthIndex % 12) + 12) % 12; // 0-11
    // Último dia do mês de destino — `Date.UTC(year, month0+1, 0)` é o dia 0
    // do mês seguinte, ou seja, o último dia de `month0`.
    const lastDay = new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
    const day = Math.min(originDay, lastDay);
    dates.push(`${year}-${pad2(month0 + 1)}-${pad2(day)}`);
  }
  return dates;
}
