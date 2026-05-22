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
 * BOUNDARY com a Story 3.10: este hook NÃO implementa a lógica de "primeiro
 * carregamento do dia" (estado persistido que controla se o motor já correu
 * hoje). Corre a cada mount da página. A Story 3.10 substitui este hook pelo
 * mecanismo de geração diária — sem tocar no motor.
 *
 * Trace: Story 3.4 AC5 + [AUTO-DECISION] A4 + ADR-2.7-1; `EPIC-3.md` §7.
 */
export function useFinanceRecurrenceEngine(): void {
  useEffect(() => {
    runFinanceRecurrenceEngine().catch((error) => {
      console.error('Falha ao executar o motor de recorrência financeira', error);
    });
  }, []); // one-shot on-mount
}
