'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Nexus v2 — useSpeechSynthesis (Story 7.4 — FR80)
 *
 * Hook client-side que encapsula a Web Speech API de SAÍDA
 * (`window.speechSynthesis` + `SpeechSynthesisUtterance`) para ler em voz alta,
 * em PT-PT, a resposta do cérebro. É o complemento da Story 7.2 (`useVoice`,
 * entrada por reconhecimento): fecha o ciclo voz → cérebro → voz.
 *
 * Fronteira (open-closed): este hook NÃO toca no pipeline de entrada selado pela
 * 7.3 (`onTranscript` → `setText` → `onSend` → `stream.submit`), nem no
 * `useVoice`/`useVoiceModeState`/`VoiceModeButton`. Apenas acrescenta a leitura
 * da saída. Zero server, zero route nova — a `SpeechSynthesis` é uma API de
 * saída do browser, sem `fetch` externo (sem implicação de CSP `connect-src`).
 *
 * Contrato exposto:
 * - `speak(text)`  → cria `SpeechSynthesisUtterance(text)`, define `lang='pt-PT'`
 *   e a voz PT-PT (se disponível), e invoca `speechSynthesis.speak(utterance)`.
 * - `cancel()`     → `speechSynthesis.cancel()`; idempotente / no-op se não há
 *   fala em curso. Usado ao iniciar nova run (AC3) e no unmount.
 * - `isSupported`  → `true` se `'speechSynthesis' in window` (SSR-safe).
 *
 * DESIGN-DECISION D-7.4-TOGGLE / D-7.4-TRIGGER / D-7.4-SOURCE: ver `7.4.story.md`.
 * O estado do toggle (on/off) e a acumulação do texto vivem no `ChatPanel`; este
 * hook é puramente a camada de síntese (sem estado de preferência próprio).
 *
 * `internal-state-contract-gate.md`: o estado vive numa só camada (browser); o
 * `SpeechSynthesisUtterance` é efémero (criado no `speak`, descartado após a
 * fala). Os caminhos de falha (eixo c) são tratados explicitamente: browser sem
 * suporte → `isSupported=false`, nenhuma síntese tentada, sem crash (AC5);
 * ausência de voz PT → fallback gracioso para a voz por omissão (AC4).
 *
 * Trace: PRD §6.14 FR80 (L239) + EPIC-7.md §5 row 7.4 + arch §6 ("Voice = Web
 * Speech API browser nativo") + AC2/AC3/AC4/AC5.
 */

/**
 * Detecta suporte de `SpeechSynthesis` sem instanciar nada. Seguro em SSR
 * (Next.js): verifica `typeof window !== 'undefined'` primeiro. Espelha o padrão
 * de `isSpeechRecognitionSupported` (`useVoiceModeState.ts` L32-37).
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Selecciona a voz PT-PT preferida de uma lista de vozes (AC4):
 *   1.ª escolha: primeira voz cujo `lang` começa por `'pt-PT'` (ou `'pt_PT'`).
 *   2.ª escolha (fallback): primeira voz cujo `lang` começa por `'pt'` (ex: `pt-BR`).
 *   Nenhuma: `null` → o caller usa a utterance sem `voice` (voz por omissão do
 *   browser — degradação graciosa, sem síntese silenciosa).
 * Pura/testável isoladamente.
 */
export function selectPortugueseVoice(
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const normalize = (lang: string): string => lang.toLowerCase().replace('_', '-');
  const ptPT = voices.find((v) => normalize(v.lang).startsWith('pt-pt'));
  if (ptPT) return ptPT;
  const ptAny = voices.find((v) => normalize(v.lang).startsWith('pt'));
  return ptAny ?? null;
}

export interface UseSpeechSynthesisResult {
  /**
   * Lê `text` em voz alta em PT-PT. No-op se não suportado ou se `text` for vazio
   * (após trim). Cria uma `SpeechSynthesisUtterance` efémera.
   */
  speak: (text: string) => void;
  /**
   * Cancela imediatamente qualquer fala em curso (`speechSynthesis.cancel()`).
   * Idempotente / no-op se não há fala. Usado ao iniciar nova run (AC3).
   */
  cancel: () => void;
  /** `true` se o browser suporta `SpeechSynthesis` (SSR-safe). */
  isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisResult {
  // SSR-safe: começa em `false`; o valor real é confirmado no mount client-side,
  // evitando mismatch de hidratação Next.js (padrão `useVoiceModeState`).
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // Voz PT-PT seleccionada (assíncrona via `voiceschanged`). `null` enquanto não
  // resolvida ou se nenhuma voz PT estiver disponível (→ fallback gracioso).
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  // Guarda contra state update após unmount.
  const mountedRef = useRef<boolean>(true);

  // Detecção de suporte + selecção de voz PT-PT (AC4/AC5).
  useEffect(() => {
    mountedRef.current = true;

    const supported = isSpeechSynthesisSupported();
    if (mountedRef.current) setIsSupported(supported);
    if (!supported) {
      // Browser sem suporte: nada a configurar, nenhum listener a registar (AC5).
      return () => {
        mountedRef.current = false;
      };
    }

    const synth = window.speechSynthesis;

    /**
     * Lê as vozes disponíveis e guarda a PT-PT preferida. `getVoices()` é
     * assíncrono: pode devolver `[]` no mount e só ficar populado após o evento
     * `voiceschanged` (Chrome/Edge). Em Firefox/Safari pode vir não-vazio de
     * imediato — neste caso usamo-lo directamente.
     */
    const loadVoices = (): void => {
      const voices = synth.getVoices();
      if (voices.length === 0) return; // ainda não disponíveis; aguarda voiceschanged
      voiceRef.current = selectPortugueseVoice(voices);
    };

    // Tentativa imediata (Firefox/Safari podem já ter vozes).
    loadVoices();

    // R2 (PO): registar `voiceschanged` para obter as vozes que chegam tarde
    // (Chrome/Edge), e REMOVER o listener no cleanup (evita memory-leak).
    synth.addEventListener('voiceschanged', loadVoices);

    return () => {
      mountedRef.current = false;
      synth.removeEventListener('voiceschanged', loadVoices);
      // Cleanup no unmount: para qualquer fala em curso (não deixar voz a tocar
      // depois do componente desaparecer).
      synth.cancel();
    };
  }, []);

  const speak = useCallback((text: string): void => {
    if (!isSpeechSynthesisSupported()) return; // AC5 — nenhuma síntese sem suporte
    const trimmed = text.trim();
    if (trimmed.length === 0) return; // nada a falar

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(trimmed);
    // AC2/AC4: `lang` SEMPRE 'pt-PT'; voz PT-PT se disponível, senão a por omissão.
    utterance.lang = 'pt-PT';
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }
    synth.speak(utterance);
  }, []);

  const cancel = useCallback((): void => {
    if (!isSpeechSynthesisSupported()) return; // AC5 — no-op sem suporte
    // `cancel()` é idempotente: pára qualquer fala em curso, no-op se não houver.
    window.speechSynthesis.cancel();
  }, []);

  // Retorno estável — evita re-execução de efeitos do consumidor (ChatPanel) que
  // dependam do objecto do hook.
  return useMemo<UseSpeechSynthesisResult>(
    () => ({ speak, cancel, isSupported }),
    [speak, cancel, isSupported]
  );
}
