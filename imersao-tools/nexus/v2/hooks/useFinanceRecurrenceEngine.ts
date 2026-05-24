'use client';

import { useEffect } from 'react';
import { runFinanceRecurrenceEngine } from '@/lib/shared/recurrence';

/**
 * Nexus v2 — useFinanceRecurrenceEngine (Story 3.4 / AC5)
 *
 * Activa o motor de recorrência financeira exactamente uma vez no mount do
 * componente que o utiliza (a page `/financas`). Ao montar, gera as transações
 * recorrentes em falta dentro do horizonte de 90 dias.
 *
 * Activação via `useEffect` on-mount — mesmo padrão de `useRecurrenceEngine`
 * (Story 2.7, ADR-2.7-1). O motor em `lib/shared/recurrence.ts` permanece
 * agnóstico ao mecanismo de activação.
 *
 * @deprecated since Story 3.10 — utilizar `DailyEngineProvider` em
 *   `app/(app)/layout.tsx` em vez deste hook. Continua funcional para casos
 *   de force-run pontual (ex: testes, scripts de debug), mas em produção o
 *   motor é orquestrado uma vez por dia pelo provider global em vez de a
 *   cada mount de página.
 *
 * Trace: Story 3.4 AC5 + [AUTO-DECISION] A4 + ADR-2.7-1; `EPIC-3.md` §7;
 * deprecado por Story 3.10 [AUTO-DECISION] A3 + AC8.
 */
export function useFinanceRecurrenceEngine(): void {
  useEffect(() => {
    runFinanceRecurrenceEngine().catch((error) => {
      console.error('Falha ao executar o motor de recorrência financeira', error);
    });
  }, []); // one-shot on-mount
}
