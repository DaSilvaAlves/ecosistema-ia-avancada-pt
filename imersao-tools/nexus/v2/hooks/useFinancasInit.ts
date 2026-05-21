'use client';

import { useEffect } from 'react';
import { seedDefaultCategories } from '@/lib/financas/seedCategories';

/**
 * Nexus v2 — useFinancasInit (Story 3.2 / AC5)
 *
 * Inicializa o domínio finanças exactamente uma vez no mount do componente que
 * o utiliza. Ao montar, semeia as 10 categorias default PT no IndexedDB local
 * (`seedDefaultCategories` — idempotente, re-execução não duplica).
 *
 * Activação via `useEffect` on-mount — padrão herdado de `useRecurrenceEngine`
 * (Story 2.7, ADR-2.7-1). O `seedDefaultCategories` é uma função pura e
 * testável isoladamente; este hook apenas garante a activação one-shot por
 * sessão sem bloquear o render.
 *
 * Trace: Story 3.2 AC5 + [AUTO-DECISION A1] + EPIC-3 §2.
 */
export function useFinancasInit(): void {
  useEffect(() => {
    seedDefaultCategories().catch((error) => {
      console.error('[useFinancasInit] Falha ao semear categorias default', error);
    });
  }, []); // one-shot on-mount — equivalente a "primeiro carregamento"
}
