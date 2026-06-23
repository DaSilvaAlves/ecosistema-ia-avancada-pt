'use client';

import { useCallback, useEffect, useState } from 'react';
import type { VoiceModeState } from '@/types/voice';

/**
 * Nexus v2 — useVoiceModeState (Story 7.1 — FR77)
 *
 * Gere o estado local do `VoiceModeButton`. Apenas estado — SEM lógica de
 * Web Speech API. A detecção de suporte no mount é verificação client-side
 * pura (`'SpeechRecognition' in window`), não instancia `SpeechRecognition`,
 * pelo que não cruza a fronteira com a Story 7.2.
 *
 * Contrato exposto à Story 7.2:
 * - `toggle()`    → a 7.2 liga ao `SpeechRecognition.start()/stop()`
 * - `setProcessing()` → a 7.2 chama quando o reconhecimento termina e o texto
 *   é enviado ao cérebro (incluído já na 7.1 por should-fix #2 do PO Pax)
 * - `setError(msg)` → a 7.2 chama no `onerror` do `SpeechRecognition`
 * - `reset()`     → volta a `idle` (recuperação de erro)
 *
 * Trace: EPIC-7.md §5 row 7.1 + Dev Notes "Arquitectura do hook" + AC3/AC5.
 *
 * `internal-state-contract-gate.md`: o estado vive numa só camada (este hook
 * no browser), sem persistência multi-camada — o gate de ciclo de vida não se
 * aplica nesta story.
 */

/**
 * Detecta suporte de Web Speech API sem instanciar `SpeechRecognition`.
 * Seguro em SSR (Next.js): verifica `typeof window !== 'undefined'` primeiro.
 */
export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

export interface UseVoiceModeStateResult {
  /** Estado de render actual. */
  state: VoiceModeState;
  /**
   * Alterna `idle` ⇄ `listening`. No-op se o browser não suporta
   * (`unsupported`) ou se está a processar (`processing`). NÃO inicia
   * `SpeechRecognition` — a Story 7.2 fá-lo.
   */
  toggle: () => void;
  /** Coloca em `error` com a mensagem dada (a 7.2 chama no `onerror`). */
  setError: (msg: string) => void;
  /** Coloca em `processing` (a 7.2 chama ao enviar a transcrição). */
  setProcessing: () => void;
  /** Volta a `idle` (recuperação de erro / fim de processamento). */
  reset: () => void;
  /** Mensagem de erro corrente (vazia quando não há erro). */
  errorMessage: string;
  /** `true` se o browser suporta Web Speech API. */
  isSupported: boolean;
}

export function useVoiceModeState(): UseVoiceModeStateResult {
  // SSR-safe: começa sempre em `idle`; o estado real (`unsupported` ou `idle`)
  // é confirmado no mount client-side via useEffect, evitando mismatch de
  // hidratação Next.js.
  const [state, setState] = useState<VoiceModeState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);

  // Detecção de suporte no mount (client-side only).
  useEffect(() => {
    const supported = isSpeechRecognitionSupported();
    setIsSupported(supported);
    if (!supported) {
      setState('unsupported');
    }
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => {
      // Bloqueia transições a partir de estados não-interactivos.
      if (prev === 'unsupported' || prev === 'processing') return prev;
      if (prev === 'listening') return 'idle';
      // idle ou error → começa a ouvir (a 7.2 inicia o SpeechRecognition).
      return 'listening';
    });
    setErrorMessage('');
  }, []);

  const setError = useCallback((msg: string) => {
    setState((prev) => (prev === 'unsupported' ? prev : 'error'));
    setErrorMessage(msg);
  }, []);

  const setProcessing = useCallback(() => {
    setState((prev) => (prev === 'unsupported' ? prev : 'processing'));
    setErrorMessage('');
  }, []);

  const reset = useCallback(() => {
    setState((prev) => (prev === 'unsupported' ? prev : 'idle'));
    setErrorMessage('');
  }, []);

  return {
    state,
    toggle,
    setError,
    setProcessing,
    reset,
    errorMessage,
    isSupported,
  };
}
