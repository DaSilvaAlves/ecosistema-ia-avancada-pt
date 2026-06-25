'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Nexus v2 — useSynthesisToggle (Story 7.4 — FR80, AC1)
 *
 * Gere a preferência de síntese de voz on/off, persistida em `localStorage`.
 * DESIGN-DECISION D-7.4-TOGGLE (Opção A): toggle opt-in, OFF por omissão; a
 * preferência persiste na chave `nexus_speech_synthesis_enabled` (booleano).
 * `localStorage` = uma só camada client-side (não Dexie, não server) — é o
 * padrão para preferências de UI sem backend; `internal-state-contract-gate.md`
 * não se aplica nesta dimensão.
 *
 * SSR-safe (Next.js): `localStorage` só existe no browser. O estado começa em
 * `false` no SSR/primeiro render e é reconciliado com o valor persistido no
 * mount client-side (via `useEffect`), evitando mismatch de hidratação — mesmo
 * padrão de `useVoiceModeState` / `useSpeechSynthesis`.
 *
 * Trace: FR80 ("PODE" → opt-in → OFF por omissão) + EPIC-7.md §5 row 7.4
 * ("Toggle de voz on/off") + D-7.4-TOGGLE (Opção A).
 */

export const SYNTHESIS_ENABLED_STORAGE_KEY = 'nexus_speech_synthesis_enabled';

/** Lê a preferência persistida. SSR-safe — devolve `false` fora do browser. */
function readPersistedPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SYNTHESIS_ENABLED_STORAGE_KEY) === 'true';
  } catch {
    // `localStorage` pode lançar (modo privado/quota). Fallback seguro: OFF.
    return false;
  }
}

export interface UseSynthesisToggleResult {
  /** `true` se a síntese está activada (preferência persistida). */
  enabled: boolean;
  /** Alterna on⇄off e persiste a nova preferência em `localStorage`. */
  toggle: () => void;
}

export function useSynthesisToggle(): UseSynthesisToggleResult {
  // OFF por omissão (D-7.4-TOGGLE); reconciliado no mount client-side.
  const [enabled, setEnabled] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(readPersistedPreference());
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        try {
          if (next) {
            window.localStorage.setItem(SYNTHESIS_ENABLED_STORAGE_KEY, 'true');
          } else {
            // Desactivar: remove a chave (AC1 — "apagada ou definida como false").
            window.localStorage.removeItem(SYNTHESIS_ENABLED_STORAGE_KEY);
          }
        } catch {
          // Persistência best-effort: se `localStorage` lançar, o estado em
          // memória ainda alterna (a UI responde), só não persiste no reload.
        }
      }
      return next;
    });
  }, []);

  return { enabled, toggle };
}
