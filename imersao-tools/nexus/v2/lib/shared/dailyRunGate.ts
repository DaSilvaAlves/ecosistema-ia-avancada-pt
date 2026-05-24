/**
 * Nexus v2 — Gate de execução diária (Story 3.10)
 *
 * Decide se o motor diário deve correr "hoje" com base no último dia em que
 * correu (persistido em `localStorage` pelo hook que invoca este helper). Tudo
 * são funções puras — sem React, sem Dexie, sem `await` — para serem testadas
 * sem mocks de browser.
 *
 * Boundary com Story 3.6 (prestações): este gate **não toca em prestações**.
 * A 3.6 fez geração eager atómica via `createInstallmentWithTransactions`
 * (`db.transaction('rw', ...)`) — não há motor para parceladas e a 3.10 não
 * introduz um. Decisão ratificada pelo `@architect` no quality gate da 3.6
 * ([AUTO-DECISION] A2 da 3.6).
 *
 * Trace: Story 3.10 AC1 + [AUTO-DECISION] A1 + A2 + A5 + A9.
 */

/**
 * Chave de `localStorage` onde o último dia em que o motor correu é
 * persistido. Formato: string ISO `YYYY-MM-DD` no fuso local do utilizador.
 *
 * Exportada como const para os testes a poderem usar sem refletir o nome.
 */
export const DAILY_RUN_STORAGE_KEY = 'nexus:lastDailyEngineRun';

/**
 * Devolve a data local de hoje no formato `YYYY-MM-DD`.
 *
 * Usa `toLocaleDateString('sv-SE')` que produz exactamente `YYYY-MM-DD` em
 * qualquer fuso (o locale sueco usa formato ISO 8601 sem aspas — confirmado
 * na ECMA Intl.DateTimeFormat). A comparação lexicográfica entre strings
 * deste formato é equivalente à comparação cronológica
 * (`'2026-05-23' < '2026-05-24'`).
 *
 * `now` opcional para testabilidade — em produção `new Date()` (default).
 *
 * Trace: Story 3.10 [AUTO-DECISION] A1.
 */
export function getTodayLocalIso(now?: Date): string {
  return (now ?? new Date()).toLocaleDateString('sv-SE');
}

/**
 * Decide se o motor diário deve correr.
 *
 * - `lastRunIso === null` → `true` (nunca correu).
 * - `lastRunIso === ''` → `true` (defensivo — valor corrompido tratado como
 *   "nunca correu", evita estado "stuck").
 * - `todayIso > lastRunIso` (lexicograficamente) → `true` (novo dia).
 * - `todayIso <= lastRunIso` → `false` (mesmo dia, ou o relógio do utilizador
 *   recuou — não correr, evita duplicar corridas).
 *
 * Função pura — sem `localStorage`, sem `Date`, sem efeitos colaterais.
 *
 * Trace: Story 3.10 AC1 + [AUTO-DECISION] A1.
 */
export function shouldRunDailyEngine(
  todayIso: string,
  lastRunIso: string | null,
): boolean {
  if (lastRunIso === null || lastRunIso === '') return true;
  return todayIso > lastRunIso;
}

/**
 * Apaga o sentinel `nexus:lastDailyEngineRun` do `localStorage`.
 *
 * Usos:
 * - Debugging via DevTools Console quando o motor parece "stuck" e o
 *   utilizador quer forçar a próxima carga a re-disparar os motores.
 * - Limpar o estado entre suites de teste (`beforeEach` / `afterEach`).
 *
 * No-op em SSR (`typeof window === 'undefined'`) para ser seguro de importar
 * em qualquer contexto.
 *
 * Trace: Story 3.10 AC1 + [AUTO-DECISION] A9.
 */
export function resetDailyEngineRun(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DAILY_RUN_STORAGE_KEY);
}
