'use client';

import { type CSSProperties, type ReactElement } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { SynthesisToggleButtonProps, SynthesisToggleState } from '@/types/voice';

/**
 * Nexus v2 — SynthesisToggleButton (Story 7.4 — FR80, AC1)
 *
 * Botão/toggle de SÍNTESE de voz (altifalante) no chat principal, com 3 estados
 * de render visuais. Complemento de saída do `VoiceModeButton` (7.1, entrada).
 * Componente prop-driven puro: o estado vem do caller (via `useSynthesisToggle`
 * + suporte do `useSpeechSynthesis`).
 *
 * IMPORTANTE — fronteira (open-closed): este componente NÃO contém lógica de
 * `SpeechSynthesis`. Apenas invoca `onToggle` no clique; o `ChatPanel` decide,
 * com base na preferência (on/off), se sintetiza a resposta após `done`.
 *
 * Design System [IA]AVANÇADA PT (design-system-ia-avancada.md):
 * - Lime `#39FF14` (active — síntese on), Cyan `#00F5FF` (idle — disponível off),
 *   Grey `#8892A4` (unsupported)
 * - glassmorphism, border-radius 8px, transição cubic-bezier 0.25s
 *
 * Acessibilidade (AC1/AC5):
 * - `aria-label` PT-PT descritivo por estado
 * - `aria-pressed` reflecte on/off (omitido quando `unsupported` — botão
 *   não-interactivo, evita leitura ambígua; padrão do `VoiceModeButton`)
 * - foco e activação por teclado nativos (`<button>` → Tab/Enter/Space)
 *
 * Trace: PRD §6.14 FR80 + EPIC-7.md §5 row 7.4 ("Toggle de voz on/off") +
 * D-7.4-TOGGLE.
 */

const BASE_TRANSITION = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';

/** Estilo visual por estado, alinhado ao `VoiceModeButton`. */
const STATE_STYLE: Record<SynthesisToggleState, CSSProperties> = {
  idle: {
    background: 'rgba(0,245,255,0.08)',
    border: '1px solid rgba(0,245,255,0.2)',
    color: '#00F5FF',
    boxShadow: 'none',
  },
  active: {
    background: 'rgba(57,255,20,0.12)',
    border: '1px solid rgba(57,255,20,0.3)',
    color: '#39FF14',
  },
  unsupported: {
    background: 'rgba(136,146,164,0.08)',
    border: '1px solid rgba(136,146,164,0.15)',
    color: '#8892A4',
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};

/** `aria-label` PT-PT por estado (AC1/AC5). */
function ariaLabelFor(state: SynthesisToggleState): string {
  switch (state) {
    case 'idle':
      return 'Activar leitura em voz alta das respostas';
    case 'active':
      return 'Leitura em voz alta activa — clica para desactivar';
    case 'unsupported':
      return 'Síntese de voz não suportada neste browser';
  }
}

/** Texto curto para o anúncio `aria-live` (leitores de ecrã). */
function liveAnnouncementFor(state: SynthesisToggleState): string {
  switch (state) {
    case 'idle':
      return 'Leitura em voz alta inactiva';
    case 'active':
      return 'Leitura em voz alta activa';
    case 'unsupported':
      return 'Síntese de voz indisponível';
  }
}

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

export function SynthesisToggleButton({
  state,
  onToggle,
  iconSize = 18,
}: SynthesisToggleButtonProps): ReactElement {
  const isUnsupported = state === 'unsupported';
  const isActive = state === 'active';
  // AC5: clique no-op em `unsupported`. Também exige handler presente.
  const hasHandler = typeof onToggle === 'function';
  const isInteractive = !isUnsupported && hasHandler;

  function handleClick(): void {
    if (!isInteractive) return;
    onToggle?.();
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
  };

  // `aria-pressed` só em botão interactivo (evita leitura ambígua — padrão 7.1).
  const ariaPressed = isInteractive ? isActive : undefined;

  const Icon = isUnsupported ? VolumeX : Volume2;

  return (
    <>
      <button
        type="button"
        data-testid="synthesis-toggle-button"
        data-state={state}
        aria-label={ariaLabelFor(state)}
        aria-pressed={ariaPressed}
        aria-disabled={!isInteractive}
        title={ariaLabelFor(state)}
        disabled={isUnsupported}
        onClick={handleClick}
        style={style}
      >
        <Icon size={iconSize} aria-hidden="true" />
      </button>
      <span role="status" aria-live="polite" style={SR_ONLY}>
        {liveAnnouncementFor(state)}
      </span>
    </>
  );
}
