'use client';

import { type CSSProperties, type ReactElement } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import type { VoiceModeButtonProps, VoiceModeState } from '@/types/voice';

/**
 * Nexus v2 — VoiceModeButton (Story 7.1 — FR77)
 *
 * Botão/toggle de microfone do chat principal com 5 estados de render visuais.
 * Substitui o placeholder `<Mic>` idle-only do `InputBox` (GAP-2). Componente
 * prop-driven puro: o estado vem do caller (via `useVoiceModeState`).
 *
 * IMPORTANTE — fronteira 7.1/7.2: este componente NÃO contém lógica de Web
 * Speech API. Apenas invoca `onVoiceToggle` no clique; a Story 7.2 fornecerá a
 * implementação real (`SpeechRecognition.start()/stop()`). O contrato de props
 * é estável e não muda na 7.2.
 *
 * Design System [IA]AVANÇADA PT (design-system-ia-avancada.md):
 * - Cyan `#00F5FF` (idle/processing), Lime `#39FF14` (listening),
 *   Magenta `#FF006E` (error), Grey `#8892A4` (unsupported)
 * - glassmorphism, border-radius 8px, transição cubic-bezier 0.25s
 *
 * Acessibilidade (AC1/AC8):
 * - `aria-label` PT-PT descritivo por estado
 * - `aria-pressed` sincronizado (omitido quando `disabled`/`unsupported` —
 *   D-7.1, should-fix #3 PO: evita leitura ambígua de botão desactivado)
 * - `aria-live="polite"` num texto sr-only que anuncia mudanças de estado
 * - foco e activação por teclado nativos (`<button>` → Tab/Enter/Space)
 *
 * D-7.1-PLACEMENT: estado vive no `InputBox` (local) — ver story.
 * D-7.1-ANIMATION: CSS keyframes custom (não Tailwind `animate-pulse`) porque
 *   os componentes `components/chat/*` usam inline styles, não classes Tailwind.
 *
 * Trace: PRD §6.14 FR77 + EPIC-7.md §5 row 7.1 + front-end-spec §4.4.
 */

const BASE_TRANSITION = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';

/** Estilo visual por estado, conforme as Notas de Design da story. */
const STATE_STYLE: Record<VoiceModeState, CSSProperties> = {
  idle: {
    background: 'rgba(0,245,255,0.08)',
    border: '1px solid rgba(0,245,255,0.2)',
    color: '#00F5FF',
    boxShadow: 'none',
  },
  listening: {
    background: 'rgba(57,255,20,0.12)',
    border: '1px solid rgba(57,255,20,0.3)',
    color: '#39FF14',
  },
  processing: {
    background: 'rgba(0,245,255,0.08)',
    border: '1px solid rgba(0,245,255,0.15)',
    color: '#00F5FF',
  },
  error: {
    background: 'rgba(255,0,110,0.10)',
    border: '1px solid rgba(255,0,110,0.3)',
    color: '#FF006E',
  },
  unsupported: {
    background: 'rgba(136,146,164,0.08)',
    border: '1px solid rgba(136,146,164,0.15)',
    color: '#8892A4',
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

/** `aria-label` PT-PT por estado (AC1/AC3/AC8). */
function ariaLabelFor(state: VoiceModeState, errorMessage?: string): string {
  switch (state) {
    case 'idle':
      return 'Activar modo voz';
    case 'listening':
      return 'A ouvir — clica para parar';
    case 'processing':
      return 'A processar voz';
    case 'error':
      return errorMessage
        ? `Erro no modo voz: ${errorMessage}`
        : 'Erro no modo voz — clica para tentar de novo';
    case 'unsupported':
      return 'Modo voz não suportado neste browser';
  }
}

/** Texto curto para o anúncio `aria-live` (leitores de ecrã). */
function liveAnnouncementFor(state: VoiceModeState): string {
  switch (state) {
    case 'idle':
      return 'Modo voz inactivo';
    case 'listening':
      return 'Modo voz a ouvir';
    case 'processing':
      return 'Modo voz a processar';
    case 'error':
      return 'Modo voz com erro';
    case 'unsupported':
      return 'Modo voz indisponível';
  }
}

const KEYFRAMES_STYLE_ID = 'voice-mode-button-keyframes';

/**
 * Keyframes injectados uma vez (idempotente por id). Inline styles não
 * suportam `@keyframes`, e os componentes deste projecto não usam Tailwind —
 * por isso a animação vive num `<style>` scoped por id (D-7.1-ANIMATION).
 */
const KEYFRAMES = `
@keyframes voicePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(57,255,20,0.45); }
  50% { box-shadow: 0 0 0 6px rgba(57,255,20,0); }
}
@keyframes voiceSpin {
  to { transform: rotate(360deg); }
}
`;

const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};

export function VoiceModeButton({
  state,
  onVoiceToggle,
  errorMessage,
  iconSize = 18,
}: VoiceModeButtonProps): ReactElement {
  const isUnsupported = state === 'unsupported';
  const isProcessing = state === 'processing';
  const isListening = state === 'listening';
  // AC4: clique no-op em `unsupported` e `processing`.
  const isInteractive = !isUnsupported && !isProcessing;

  function handleClick(): void {
    if (!isInteractive) return;
    // `active=true` quando vai começar a ouvir; `false` quando vai parar.
    onVoiceToggle?.(!isListening);
  }

  const stateStyle = STATE_STYLE[state];

  const style: CSSProperties = {
    background: 'transparent',
    borderRadius: 8,
    padding: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: BASE_TRANSITION,
    cursor: isInteractive ? 'pointer' : 'not-allowed',
    ...stateStyle,
    ...(isListening ? { animation: 'voicePulse 1.5s ease-in-out infinite' } : {}),
  };

  // AC1/AC8: `aria-pressed` só em botão interactivo (D-7.1 / should-fix #3 PO).
  const ariaPressed = isInteractive ? isListening : undefined;

  const Icon = isUnsupported ? MicOff : state === 'error' ? AlertCircle : Mic;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} id={KEYFRAMES_STYLE_ID} />
      <button
        type="button"
        data-testid="voice-mode-button"
        data-state={state}
        aria-label={ariaLabelFor(state, errorMessage)}
        aria-pressed={ariaPressed}
        aria-disabled={!isInteractive}
        title={ariaLabelFor(state, errorMessage)}
        disabled={isUnsupported}
        onClick={handleClick}
        style={style}
      >
        {isProcessing ? (
          <span
            data-testid="voice-mode-spinner"
            aria-hidden="true"
            style={{
              width: iconSize,
              height: iconSize,
              borderRadius: '50%',
              border: '2px solid rgba(0,245,255,0.25)',
              borderTopColor: '#00F5FF',
              animation: 'voiceSpin 0.7s linear infinite',
              display: 'inline-block',
            }}
          />
        ) : (
          <Icon size={iconSize} aria-hidden="true" />
        )}
      </button>
      <span role="status" aria-live="polite" style={SR_ONLY}>
        {liveAnnouncementFor(state)}
      </span>
    </>
  );
}
