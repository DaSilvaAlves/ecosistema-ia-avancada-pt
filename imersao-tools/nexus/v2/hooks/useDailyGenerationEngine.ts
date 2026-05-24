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
 * Persistência (AC4): só grava `lastRun` se ambos os motores correrem sem
 * lançar — assim, falha catastrófica num motor garante retentativa na próxima
 * carga. Cada motor já tolera erros internos (retorna `errors` count); falhas
 * dentro desse contrato não interrompem a sequência, mas falhas fora dele
 * (ex: rejeição da `Promise`) sim — esse é o sinal de que `lastRun` não
 * deve avançar.
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
        await runRecurrenceEngine();
        await runFinanceRecurrenceEngine();
        // AC4 — só persiste se ambos correrem sem lançar. Falha em qualquer
        // motor → `lastRun` permanece intacto → próxima carga re-tenta.
        window.localStorage.setItem(DAILY_RUN_STORAGE_KEY, todayIso);
      } catch (error) {
        console.error(
          'Falha ao executar motor diário de geração — lastRun não foi actualizado',
          error,
        );
      }
    })();
  }, []); // one-shot on-mount
}
