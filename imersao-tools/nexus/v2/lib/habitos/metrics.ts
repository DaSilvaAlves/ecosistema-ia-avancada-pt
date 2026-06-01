import type { HabitLog } from '@/types/db';

/**
 * Nexus v2 — Helper puro de métricas de hábitos (Story 4.4 — FR27)
 *
 * Módulo de funções puras (sem Dexie, sem React) que transformam `HabitLog[]`
 * com `value` numérico em: (1) evolução mensal dos últimos 6 meses, (2) recordes
 * históricos (melhor dia + melhor mês), (3) nível de intensidade por valor (para
 * o heatmap da 4.3 estendido). É o 2.º ficheiro de `lib/habitos/` — segue o padrão
 * do helper `heatmap.ts` (4.3): funções puras, deterministas, `todayISO` por
 * argumento (nenhuma chama `Date.now()`/`new Date()` sem argumento).
 *
 * Convenções (alinhadas às Stories 4.2/4.3):
 *   - Datas em `YYYY-MM-DD`, derivadas SEMPRE em UTC (mesma derivação dos logs
 *     gravados: `new Date().toISOString().slice(0,10)`). Evita off-by-one entre
 *     "hoje"/limites do range e os logs.
 *   - Meses identificados por `YYYY-MM` (componente UTC). A janela de evolução
 *     são os últimos 6 meses de calendário a partir de `todayISO`.
 *
 * Gotcha (logs sem `value` num hábito com métrica — [AUTO-DECISION] A1 da 4.4):
 *   - `getMonthlyEvolution`: um log sem `value` conta o dia em `daysCompleted`
 *     (o hábito foi concluído) mas NÃO soma para `totalValue` (valor 0).
 *   - `getMetricRecords`: logs sem `value` são IGNORADOS nos recordes.
 *
 * Trace: FR27, [AUTO-DECISION] A3/A4/A6; padrão de `heatmap.ts` (4.3).
 */

/** Nº de meses de calendário cobertos pela vista de evolução (mês actual + 5 anteriores). */
const MONTHS_IN_EVOLUTION = 6;

/** Abreviaturas de mês PT-PT, indexadas por mês 0-11. */
const MESES_PT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export interface MonthlyMetricSummary {
  /** Etiqueta PT-PT do mês, ex.: "Dez 2025". */
  monthLabel: string;
  /** Soma dos `value` dos logs no mês (logs sem `value` contam 0). */
  totalValue: number;
  /** Nº de dias com log no mês (conta o dia mesmo sem `value`). */
  daysCompleted: number;
  /** Maior `value` num único dia dentro do mês (0 se não houver logs com `value`). */
  bestDayValue: number;
}

export interface MetricRecords {
  /** Maior `value` num único dia (todos os logs históricos com `value`). */
  bestDayValue: number;
  /** Maior soma de `value` num único mês (todos os logs históricos com `value`). */
  bestMonthValue: number;
  /** `YYYY-MM-DD` do dia com maior `value`. Vazio se não houver logs com `value`. */
  bestDayDate: string;
}

/**
 * Formata um valor numérico para PT-PT: inteiros sem casas decimais; não-inteiros
 * com no máximo 1 casa decimal e vírgula decimal (ex.: 7,2). Determinista.
 * Exportado para consumo consistente pela UI (chart, heatmap, lista, modal).
 */
export function formatMetricValue(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace('.', ',');
}

/** Chave de mês `YYYY-MM` (componente UTC) a partir de uma data `YYYY-MM-DD`. */
function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** `YYYY-MM` → etiqueta PT-PT "Mês YYYY", ex.: "2025-12" → "Dez 2025". */
function monthLabelOf(key: string): string {
  const [year, month] = key.split('-');
  return `${MESES_PT[Number(month) - 1]} ${year}`;
}

/**
 * Lista das chaves `YYYY-MM` dos últimos `MONTHS_IN_EVOLUTION` meses a partir de
 * `todayISO`, do mais antigo para o mais recente. Aritmética em UTC (sem DST).
 */
function lastMonthKeys(todayISO: string): string[] {
  const year = Number(todayISO.slice(0, 4));
  const month = Number(todayISO.slice(5, 7)) - 1; // 0-11
  const keys: string[] = [];
  for (let i = MONTHS_IN_EVOLUTION - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - i, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys;
}

/**
 * Evolução mensal dos últimos 6 meses (AC1).
 *
 * Agrega os logs por mês de calendário, cobrindo exactamente os últimos 6 meses
 * a partir de `todayISO` (mês actual + 5 anteriores). Meses sem logs aparecem com
 * `totalValue: 0` e `daysCompleted: 0`. Ordenados do mais antigo para o mais
 * recente. Logs fora da janela de 6 meses são ignorados nesta vista.
 *
 * Pura e determinista: recebe `todayISO` (`YYYY-MM-DD`).
 */
export function getMonthlyEvolution(
  logs: HabitLog[],
  todayISO: string,
): MonthlyMetricSummary[] {
  const keys = lastMonthKeys(todayISO);
  const windowSet = new Set(keys);

  // Acumula por mês apenas os logs dentro da janela de 6 meses. `days` é um Set
  // de datas distintas para `daysCompleted` não duplicar se houver >1 log no mesmo
  // dia (a 4.2 garante ≤1 log por (habitId,date), mas contar dias distintos é
  // defensivo e correcto independentemente dessa garantia).
  const byMonth = new Map<
    string,
    { totalValue: number; days: Set<string>; bestDayValue: number }
  >();
  for (const key of keys) {
    byMonth.set(key, { totalValue: 0, days: new Set<string>(), bestDayValue: 0 });
  }

  for (const log of logs) {
    const key = monthKey(log.date);
    if (!windowSet.has(key)) continue;
    const bucket = byMonth.get(key)!;
    // O dia conta mesmo sem `value` (o hábito foi concluído — [AUTO-DECISION] A1).
    bucket.days.add(log.date);
    if (log.value !== undefined) {
      bucket.totalValue += log.value;
      if (log.value > bucket.bestDayValue) bucket.bestDayValue = log.value;
    }
  }

  return keys.map((key) => {
    const bucket = byMonth.get(key)!;
    return {
      monthLabel: monthLabelOf(key),
      totalValue: bucket.totalValue,
      daysCompleted: bucket.days.size,
      bestDayValue: bucket.bestDayValue,
    };
  });
}

/**
 * Recordes históricos sobre TODOS os logs passados (AC1; [AUTO-DECISION] A4).
 *
 * Sem limite de range — quem chama filtra a janela de visualização, mas os
 * recordes calculam-se sobre tudo. Logs sem `value` são ignorados. Retorna zeros
 * + `bestDayDate: ''` se não houver nenhum log com `value`.
 */
export function getMetricRecords(logs: HabitLog[]): MetricRecords {
  let bestDayValue = 0;
  let bestDayDate = '';
  const monthTotals = new Map<string, number>();

  for (const log of logs) {
    if (log.value === undefined) continue;
    if (log.value > bestDayValue) {
      bestDayValue = log.value;
      bestDayDate = log.date;
    }
    const key = monthKey(log.date);
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + log.value);
  }

  let bestMonthValue = 0;
  for (const total of monthTotals.values()) {
    if (total > bestMonthValue) bestMonthValue = total;
  }

  return { bestDayValue, bestMonthValue, bestDayDate };
}

/**
 * Nível de intensidade (1-4) de um valor relativo ao alvo (AC1; [AUTO-DECISION] A6).
 *
 * Usado pelo `HabitHeatmap` com `metric` para colorir as células por intensidade.
 *   - 1: ≤ 25% do alvo (inclui valor 0 — dia concluído sem valor registado);
 *   - 2: 26-50%;
 *   - 3: 51-99%;
 *   - 4: ≥ 100% do alvo.
 *
 * `target <= 0` é tratado defensivamente como nível 4 (alvo inválido/atingido).
 */
export function getHeatmapLevel(value: number, target: number): 1 | 2 | 3 | 4 {
  if (target <= 0) return 4;
  const ratio = value / target;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio < 1) return 3;
  return 4;
}
