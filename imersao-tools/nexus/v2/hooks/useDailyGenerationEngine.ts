'use client';

import { useEffect } from 'react';
import {
  DAILY_RUN_STORAGE_KEY,
  getTodayLocalIso,
  shouldRunDailyEngine,
} from '@/lib/shared/dailyRunGate';
import {
  runRecurrenceEngine,
  runFinanceRecurrenceEngine,
} from '@/lib/shared/recurrence';

/**
 * Nexus v2 — useDailyGenerationEngine (Story 3.10 / AC2-AC4)
 *
 * Substitui `useRecurrenceEngine` (Story 2.7) e `useFinanceRecurrenceEngine`
 * (Story 3.4) como ponto **único** de activação dos motores de recorrência.
 * Aplica um gate de "primeiro carregamento do dia" — corre `runRecurrenceEngine`
 * e `runFinanceRecurrenceEngine` em sequência apenas se for um dia diferente do
 * último em que correram (persistido em `localStorage[nexus:lastDailyEngineRun]`).
 *
 * Persistência (AC4, alargado CR Iter 1): só grava `lastRun` se ambos os
 * motores correrem sem lançar E com `errors === 0`. Motores com `errors > 0`
 * não lançam, mas indicam que instâncias não foram criadas — tratar como falha
 * parcial e não persistir `lastRun` para garantir retentativa na próxima carga.
 *
 * Prestações: NÃO são geradas aqui. A Story 3.6 fez geração eager atómica via
 * `createInstallmentWithTransactions` — não há motor para parceladas e a 3.10
 * não introduz um ([AUTO-DECISION] A5; boundary fechada pelo `@architect` no
 * quality gate da 3.6).
 *
 * Activação: chamado uma única vez pelo `<DailyEngineProvider>` no
 * `app/(app)/layout.tsx`. ADR-2.7-1 mantido (sem `setInterval`,
 * `requestIdleCallback`, ServiceWorker).
 *
 * Cross-tab: sem `storage` event listener — os motores são idempotentes
 * (Story 2.7 A3 + Story 3.4 A6), por isso correrem em paralelo em 2 tabs do
 * mesmo dia gera 0 novas instâncias na segunda ([AUTO-DECISION] A6).
 *
 * Trace: Story 3.10 AC2 + AC3 + AC4 + [AUTO-DECISION] A3 + A4 + A6 + A7 + A10;
 * ADR-2.7-1 (Story 2.7); `EPIC-3.md` §7.
 */
export function useDailyGenerationEngine(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR guard

    const todayIso = getTodayLocalIso();
    const lastRunIso = window.localStorage.getItem(DAILY_RUN_STORAGE_KEY);
    if (!shouldRunDailyEngine(todayIso, lastRunIso)) return;

    void (async () => {
      try {
        const recurrenceResult = await runRecurrenceEngine();
        const financeResult = await runFinanceRecurrenceEngine();
        // AC4 (alargado CR Iter 1) — persiste só se ambos sem lançar e sem
        // erros internos. `errors > 0` sem throw indica falha parcial; não
        // actualizar `lastRun` garante retentativa na próxima carga.
        if (recurrenceResult.errors === 0 && financeResult.errors === 0) {
          window.localStorage.setItem(DAILY_RUN_STORAGE_KEY, todayIso);
        } else {
          console.error(
            'Falha ao executar motor diário de geração — lastRun não foi actualizado',
            { recurrenceErrors: recurrenceResult.errors, financeErrors: financeResult.errors },
          );
        }
      } catch (error) {
        console.error(
          'Falha ao executar motor diário de geração — lastRun não foi actualizado',
          error,
        );
      }
    })();
  }, []); // one-shot on-mount
}
