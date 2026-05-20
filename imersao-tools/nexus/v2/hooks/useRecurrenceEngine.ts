'use client';

import { useEffect } from 'react';
import { runRecurrenceEngine } from '@/lib/shared/recurrence';

/**
 * Nexus v2 — useRecurrenceEngine (Story 2.7 / AC4)
 *
 * Activa o motor de recorrência exactamente uma vez no mount do componente que
 * o utiliza (a page `/tarefas`). Ao montar, gera as instâncias recorrentes em
 * falta dentro do horizonte de 90 dias.
 *
 * Activação via `useEffect` on-mount — decisão ADR-2.7-1 (architect-gate
 * 20/05/2026). Não há activação por `setInterval`, `requestIdleCallback` nem
 * ServiceWorker no Epic 2. O motor em `lib/shared/recurrence.ts` permanece
 * agnóstico ao mecanismo — uma futura migração para ServiceWorker (Epic 4, se
 * justificada por requisito de Background Sync) substitui apenas este hook,
 * sem tocar no motor.
 *
 * Trace: Story 2.7 AC4 + ADR-2.7-1 + EPIC-2 §7 + PRD §10 L446.
 */
export function useRecurrenceEngine(): void {
  useEffect(() => {
    runRecurrenceEngine().catch((error) => {
      console.error('Falha ao executar o motor de recorrência', error);
    });
  }, []); // one-shot on-mount — equivalente a "primeiro carregamento"
}
