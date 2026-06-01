import type { Goal } from '@/types/db';

/**
 * Nexus v2 — Helper puro de progresso de metas (Story 4.5 — FR39/FR40)
 *
 * Módulo de funções puras (sem Dexie, sem React) que derivam o estado de
 * progresso de um `Goal` e formatam o prazo em PT-PT. Segue o padrão dos
 * helpers `lib/habitos/heatmap.ts` (4.3) e `lib/habitos/metrics.ts` (4.4):
 * funções deterministas, datas em `YYYY-MM-DD` UTC, `todayISO` recebido por
 * argumento — NENHUMA função chama `Date.now()`/`new Date()` sem argumento.
 *
 * Convenções (alinhadas às Stories 4.2/4.3/4.4):
 *   - Datas em `YYYY-MM-DD`, comparadas em UTC via `Date.UTC` (evita off-by-one
 *     entre fusos). `formatGoalDeadline` recebe `todayISO` por parâmetro.
 *
 * Trace: FR39 (CRUD metas), FR40 (vista progress + histórico + milestones);
 * padrão de `heatmap.ts`/`metrics.ts`.
 */

/** Resumo de progresso de uma meta — derivado puramente do estado do `Goal`. */
export interface GoalProgressSummary {
  /** Percentagem 0-100 (capped a 100). */
  percentage: number;
  /** `target - current` (mínimo 0 quando alcançado/excedido). */
  remaining: number;
  /** `current >= target` (numeric) | `status === 'achieved'` (boolean). */
  isAchieved: boolean;
  /** Nº de milestones com `reached: true`. */
  milestonesReached: number;
  /** Total de milestones definidos. */
  milestonesTotal: number;
}

/**
 * Calcula o resumo de progresso de uma meta a partir do seu estado actual.
 * Determinista — não lê `Date.now()`.
 *
 * Regras:
 *   - `type: 'boolean'` → `percentage = status === 'achieved' ? 100 : 0`;
 *     `remaining` é 0 quando alcançada, 1 caso contrário (passo único);
 *     `isAchieved = status === 'achieved'`.
 *   - `type: 'numeric'` → `percentage = min(100, round(current / target * 100))`;
 *     defesa `target <= 0` → 0%; `isAchieved = current >= target` (ou
 *     `status === 'achieved'`, p.ex. alcançada manualmente sem atingir o alvo).
 */
export function getGoalProgress(goal: Goal): GoalProgressSummary {
  const milestonesTotal = goal.milestones.length;
  const milestonesReached = goal.milestones.filter((m) => m.reached).length;

  if (goal.type === 'boolean') {
    const isAchieved = goal.status === 'achieved';
    return {
      percentage: isAchieved ? 100 : 0,
      remaining: isAchieved ? 0 : 1,
      isAchieved,
      milestonesReached,
      milestonesTotal,
    };
  }

  // type === 'numeric'
  // Defesa divisão por zero / target não-positivo: com `target <= 0` o progresso
  // numérico é indefinido — NÃO se infere "alcançada" da comparação `current >=
  // target` (evita falso-positivo com `current:0, target:0`). Só conta como
  // alcançada se o `status` foi marcado `achieved` explicitamente.
  const isAchieved =
    goal.status === 'achieved' ||
    (goal.target > 0 && goal.current >= goal.target);
  const rawPercentage =
    goal.target > 0
      ? Math.round((goal.current / goal.target) * 100)
      : goal.status === 'achieved'
        ? 100
        : 0;
  const percentage = Math.min(100, Math.max(0, rawPercentage));
  const remaining = Math.max(0, goal.target - goal.current);

  return {
    percentage,
    remaining,
    isAchieved,
    milestonesReached,
    milestonesTotal,
  };
}

/**
 * Diferença em dias UTC entre duas datas `YYYY-MM-DD` (`b - a`). Positivo =
 * `b` no futuro relativo a `a`. Determinista (UTC puro, sem fuso local).
 */
function diffDaysUTC(aISO: string, bISO: string): number {
  const [ay, am, ad] = aISO.split('-').map(Number);
  const [by, bm, bd] = bISO.split('-').map(Number);
  const a = Date.UTC(ay, am - 1, ad);
  const b = Date.UTC(by, bm - 1, bd);
  return Math.round((b - a) / 86_400_000);
}

/**
 * Formata o prazo de uma meta em texto PT-PT legível, relativo a `todayISO`.
 * Determinista — recebe `todayISO: string` (`YYYY-MM-DD`) por parâmetro.
 *
 *   - `deadline === null` → "Sem prazo".
 *   - hoje → "Hoje".
 *   - amanhã → "Amanhã".
 *   - futuro (>1 dia) → "Em N dias".
 *   - ontem → "Há 1 dia".
 *   - passado (>1 dia) → "Há N dias".
 */
export function formatGoalDeadline(
  deadline: string | null,
  todayISO: string,
): string {
  if (deadline === null) return 'Sem prazo';

  const days = diffDaysUTC(todayISO, deadline);
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanhã';
  if (days > 1) return `Em ${days} dias`;
  if (days === -1) return 'Há 1 dia';
  return `Há ${Math.abs(days)} dias`;
}
