'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  isSpeechRecognitionSupported,
  type UseVoiceModeStateResult,
} from '@/hooks/useVoiceModeState';
import type {
  SpeechRecognitionInstance,
  SpeechRecognitionEventLike,
  SpeechRecognitionErrorEventLike,
} from '@/types/voice';

/**
 * Nexus v2 — useVoice (Story 7.2 — FR78)
 *
 * Hook client-side que instancia a Web Speech API (`SpeechRecognition` /
 * `webkitSpeechRecognition`) com `lang='pt-PT'` e a liga ao contrato de estado
 * da Story 7.1 (`useVoiceModeState`, já em main). NÃO duplica estado — recebe os
 * métodos do contrato (`toggle`, `setProcessing`, `setError`, `reset`, `state`,
 * `isSupported`) e limita-se a conduzir a instância efémera de `SpeechRecognition`.
 *
 * Fronteira 7.2 (EPIC-7.md §2/§7, GAP-7.1): este é o caminho (a) — Web Speech
 * client-side no browser. NÃO toca em qualquer route server-side nem no webhook
 * Telegram (caminho (b), problema distinto). NÃO envia o texto ao cérebro (7.3)
 * — apenas o expõe via callback `onTranscript`.
 *
 * Contrato exposto:
 * - `toggle()` → liga ao botão (`onVoiceToggle`): `idle`→`start()`, `listening`→`stop()`
 * - `onTranscript(text)` → recebe a transcrição PT-PT pronta (a 7.3 consome o texto)
 *
 * DEV-DECISION D-7.2-COMPOSE: composição no `InputBox` — o `useVoice` recebe o
 * objecto do `useVoiceModeState` (não cria estado paralelo). AC5: o estado de UI
 * vive exclusivamente no `useVoiceModeState`; a instância de `SpeechRecognition`
 * é efémera (criada em `start`, descartada em `onend`/`stop`/unmount).
 *
 * `internal-state-contract-gate.md`: o estado vive numa só camada (browser). A
 * 7.2 não distribui estado por SW/endpoint/cliente. Os caminhos de falha (eixo c)
 * são tratados explicitamente abaixo — nunca sucesso silencioso (AC4).
 *
 * Trace: PRD §6.14 FR78 + EPIC-7.md §5 row 7.2 + arch §3 (`useVoice.ts`) + AC1-AC8.
 */

/** Mensagens de erro PT-PT (AC4) — mapeadas dos códigos da Web Speech API. */
export const VOICE_ERROR_MIC_DENIED = 'Permissão de microfone negada';
export const VOICE_ERROR_NO_SPEECH = 'Sem resposta de voz detectada';
/** Prefixo para códigos de erro não mapeados explicitamente (AC4 — linha 3). */
export const VOICE_ERROR_GENERIC_PREFIX = 'Erro de reconhecimento: ';
/**
 * Falha ao instanciar/configurar `SpeechRecognition` (VOICE-002 — o construtor
 * nativo lançou; ex.: Firefox AR7 PT-PT). Nunca crash silencioso (AC4/AC8).
 */
export const VOICE_ERROR_INIT_FAILED = 'Erro ao iniciar reconhecimento de voz';

export interface UseVoiceOptions {
  /**
   * Contrato de estado da Story 7.1. O `useVoice` chama os seus métodos; nunca
   * mantém estado de UI próprio (AC5).
   */
  voiceState: UseVoiceModeStateResult;
  /**
   * Invocado com a transcrição PT-PT não vazia quando `onresult` dispara.
   * Ponto de extensão para a Story 7.3 (DEV-DECISION D-7.2-TRANSCRIPT-CONTRACT).
   */
  onTranscript?: (transcript: string) => void;
}

export interface UseVoiceResult {
  /**
   * Alterna o reconhecimento conforme o estado actual do contrato:
   * `idle`/`error` → `start()`; `listening` → `stop()`. No-op se não suportado.
   * Ligar a `VoiceModeButton.onVoiceToggle`.
   */
  toggle: () => void;
  /**
   * Cancela imediatamente qualquer reconhecimento activo: descarta a instância
   * (microfone libertado) e repõe a UI para `idle`. Idempotente / no-op se não
   * houver sessão activa. VOICE-004 (CR Major 3 — Security/Privacy): o
   * consumidor usa isto quando o input é desactivado durante `listening`, para
   * o microfone NÃO ficar activo num input desactivado.
   */
  cancel: () => void;
}

/**
 * Mapeia o código de erro da Web Speech API para mensagem PT-PT legível (AC4).
 */
function errorMessageForCode(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return VOICE_ERROR_MIC_DENIED;
    case 'no-speech':
      return VOICE_ERROR_NO_SPEECH;
    default:
      return `${VOICE_ERROR_GENERIC_PREFIX}${code}`;
  }
}

/**
 * Cria uma instância de `SpeechRecognition` via o construtor nativo ou o prefixo
 * `webkit` (Chrome/Edge). Devolve `null` se nenhum estiver disponível — o caller
 * trata como não suportado (AC1/AC4). AC1: instanciação via
 * `window.SpeechRecognition ?? window.webkitSpeechRecognition`.
 */
function createRecognition(): SpeechRecognitionInstance | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

export function useVoice({ voiceState, onTranscript }: UseVoiceOptions): UseVoiceResult {
  const { state, toggle: toggleMode, setProcessing, setError, reset } = voiceState;

  // Instância efémera de SpeechRecognition (AC5). `null` quando não há
  // reconhecimento activo.
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Flag de "já houve resultado" para esta sessão de reconhecimento.
  // CRÍTICO (ressalva PO #1): `onend` dispara SEMPRE no fim, inclusive após um
  // `onresult` bem-sucedido. Sem esta flag, o caminho feliz cairia erradamente
  // em `setError` no `onend`. Usa-se `useRef` (NÃO `state`) para evitar stale
  // closure — os handlers da instância capturam o valor no momento da criação.
  const gotResultRef = useRef<boolean>(false);
  // Guarda contra updates de estado após o componente desmontar.
  const mountedRef = useRef<boolean>(true);

  // Espelho do estado do contrato num ref, para os handlers (criados uma vez por
  // sessão de start) lerem o valor corrente sem stale closure.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /** Liberta a instância corrente: remove handlers e pára. Idempotente. */
  const teardownRecognition = useCallback((): void => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.stop();
    } catch {
      // `stop()` lança se o reconhecimento já terminou — seguro ignorar.
    }
    recognitionRef.current = null;
  }, []);

  /**
   * Inicia o reconhecimento. Devolve `true` se `SpeechRecognition.start()` foi
   * invocado com sucesso; `false` se não suportado, já activo, ou se `start()`
   * lançou de forma síncrona. O caller (`toggle`) só transita o estado de UI da
   * 7.1 quando isto devolve `true` (VOICE-001 (b) — UI coerente com o recognizer).
   */
  const start = useCallback((): boolean => {
    // AC1/AC4: só instancia se suportado. Em browser sem suporte, no-op — o
    // estado `unsupported` é gerido pela 7.1.
    if (!isSpeechRecognitionSupported()) return false;
    // Já há uma sessão activa — não reinstancia.
    if (recognitionRef.current) return false;

    // VOICE-002 (CR Major 1 — Stability, AC4/AC8): a instanciação nativa
    // (`new SpeechRecognition()`) e a configuração podem lançar (ex.: browser
    // com a API presente mas a falhar para PT-PT — Firefox AR7). Tem de estar
    // dentro de try/catch, senão a excepção escapa de `toggle()` → crash
    // silencioso (nunca `setError`). No catch: mensagem PT-PT, teardown e
    // `false` (a UI não transita — coerente com VOICE-001 (b)).
    let recognition: SpeechRecognitionInstance | null;
    try {
      recognition = createRecognition();
      if (!recognition) return false;
      // AC1/AC3: configuração obrigatória. `lang` SEMPRE 'pt-PT'.
      recognition.lang = 'pt-PT';
      recognition.continuous = false;
      recognition.interimResults = false;
    } catch {
      // Falha ao instanciar/configurar — nunca crash silencioso (AC4/AC8).
      if (mountedRef.current) {
        setError(VOICE_ERROR_INIT_FAILED);
      }
      recognitionRef.current = null;
      return false;
    }

    gotResultRef.current = false;

    recognition.onresult = (event: SpeechRecognitionEventLike): void => {
      // AC2/AC3: shape real da Web Speech API — results[0][0].transcript.
      // `mock-protocol-fidelity.md`: aceder a results[0][0] (não results[0]).
      const transcript = event.results?.[0]?.[0]?.transcript ?? '';
      const trimmed = transcript.trim();
      gotResultRef.current = true;
      // A instância já cumpriu o seu papel; descarta-se (AC5 — efémera).
      // `onend` dispara a seguir mas `gotResultRef` impede o falso `setError`.
      if (!mountedRef.current) {
        teardownRecognition();
        return;
      }
      if (trimmed.length === 0) {
        // AC3: transcript tem de ser uma string não vazia. Vazio → falha
        // explícita, nunca sucesso silencioso (AC4 / eixo c).
        setError(VOICE_ERROR_NO_SPEECH);
        teardownRecognition();
        return;
      }
      // AC2: transição para `processing` antes de entregar o texto.
      setProcessing();
      // VOICE-003 (CR Major 2 — Functional Correctness): `onTranscript` é
      // opcional na interface pública do hook. Sem ele, `setProcessing()`
      // deixaria a UI presa em `processing` (estado sem saída — não há quem
      // faça `reset`). A máquina de estados TEM de sair de `processing`
      // independentemente da presença do callback: quando há `onTranscript`,
      // o consumidor (InputBox) entrega o texto e faz `voice.reset()`; sem
      // callback, o próprio hook repõe a UI para `idle` (não há para onde
      // entregar, mas o estado nunca fica inalcançável).
      if (onTranscript) {
        onTranscript(trimmed);
      } else {
        reset();
      }
      teardownRecognition();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike): void => {
      // AC4: nunca sucesso silencioso — todos os erros viram `setError`.
      gotResultRef.current = true; // impede o `onend` de re-disparar setError.
      if (mountedRef.current) {
        setError(errorMessageForCode(event.error));
      }
      teardownRecognition();
    };

    recognition.onend = (): void => {
      // CRÍTICO (ressalva PO #1): `onend` corre sempre. Só é erro se NÃO houve
      // resultado nem erro prévio (caso `no-speech` silencioso — AC2/AC4).
      if (!gotResultRef.current && mountedRef.current) {
        setError(VOICE_ERROR_NO_SPEECH);
      }
      teardownRecognition();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      // `start()` lança de forma síncrona se já estiver activo — falha
      // explícita. Devolve `false` para o `toggle` NÃO transitar a UI
      // (VOICE-001 (b)): a UI fica coerente com o recognizer (que não arrancou).
      if (mountedRef.current) {
        setError(VOICE_ERROR_NO_SPEECH);
      }
      teardownRecognition();
      return false;
    }
    return true;
  }, [onTranscript, reset, setError, setProcessing, teardownRecognition]);

  /**
   * Pára o reconhecimento. Devolve `true` se havia sessão activa e `stop()` foi
   * invocado sem lançar; `false` se não havia sessão ou se `stop()` lançou de
   * forma síncrona. O caller só transita a UI quando isto devolve `true`.
   */
  const stop = useCallback((): boolean => {
    const recognition = recognitionRef.current;
    if (!recognition) return false;
    // `stop()` aciona `onresult` (se houve fala) seguido de `onend`. Não força
    // `setError` aqui — os handlers tratam o resultado.
    try {
      recognition.stop();
    } catch {
      // já terminou / lançou de forma síncrona — não transita a UI.
      return false;
    }
    return true;
  }, []);

  /**
   * AC2/AC7: ligado a `onVoiceToggle`. Decide start/stop pelo estado do contrato
   * e SÓ transita o estado de UI da 7.1 (`toggleMode`) se a operação no
   * `SpeechRecognition` teve sucesso. VOICE-001 (b): numa falha síncrona de
   * `start()`/`stop()`, a UI NÃO transita — fica coerente com o recognizer
   * (que não arrancou ou não parou). Nota: num `start()` falhado, o `setError`
   * interno já coloca a UI em `error`; não chamar `toggleMode` evita
   * sobrepor/dessincronizar essa transição.
   */
  const toggle = useCallback((): void => {
    if (!isSpeechRecognitionSupported()) return;
    const ok = stateRef.current === 'listening' ? stop() : start();
    // Só alterna o estado de UI (idle⇄listening) se a acção teve sucesso.
    if (ok) {
      toggleMode();
    }
  }, [start, stop, toggleMode]);

  /**
   * VOICE-004 (CR Major 3): cancela o reconhecimento activo e repõe a UI.
   * Liberta o microfone (teardown descarta a instância) e leva a UI de volta a
   * `idle`. Idempotente — se não houver sessão activa, é no-op (não toca na UI
   * fora de `listening`/`processing`). Usado pelo `InputBox` quando o input é
   * desactivado a meio de uma sessão de voz, para o microfone não ficar activo
   * num input desactivado.
   */
  const cancel = useCallback((): void => {
    if (!recognitionRef.current) return;
    teardownRecognition();
    if (
      mountedRef.current &&
      (stateRef.current === 'listening' || stateRef.current === 'processing')
    ) {
      reset();
    }
  }, [reset, teardownRecognition]);

  // Cleanup no unmount (AC5 + Focus secundário CR): pára o reconhecimento e
  // evita state update em componente desmontado.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      teardownRecognition();
    };
  }, [teardownRecognition]);

  // Retorno estável (`toggle`/`cancel` são `useCallback`) — evita re-execução
  // de efeitos do consumidor que dependam do objecto do hook.
  return useMemo<UseVoiceResult>(() => ({ toggle, cancel }), [toggle, cancel]);
}
