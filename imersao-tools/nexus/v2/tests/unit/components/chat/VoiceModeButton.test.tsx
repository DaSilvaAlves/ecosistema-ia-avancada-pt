import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VoiceModeButton } from '@/components/chat/VoiceModeButton';

/**
 * Nexus v2 — VoiceModeButton component tests (Story 7.1 — FR77, AC7)
 *
 * 5 cenários — exactamente um por estado de render — exigido por
 * `react-component-test-criteria.md` (5 estados ≥ 3 → teste obrigatório) e
 * EPIC-7.md §8 lição A3. Cada cenário verifica:
 *   (a) a cor do design system está presente (style `color`)
 *   (b) o `aria-label` PT-PT está correcto
 *   (c) o comportamento de clique é o esperado (invoca/não invoca `onVoiceToggle`)
 *
 * Fronteira 7.1/7.2: nenhum teste exige `SpeechRecognition` — só estado visual.
 */

describe('VoiceModeButton — AC7 (5 estados de render)', () => {
  it('C1 idle: cor cyan, aria-label "Activar modo voz", clique invoca onVoiceToggle(true)', () => {
    const onVoiceToggle = vi.fn();
    render(<VoiceModeButton state="idle" onVoiceToggle={onVoiceToggle} />);

    const btn = screen.getByTestId('voice-mode-button');
    // (a) cor cyan do design system
    expect(btn).toHaveStyle({ color: 'rgb(0, 245, 255)' });
    // (b) aria-label PT-PT
    expect(btn).toHaveAttribute('aria-label', 'Activar modo voz');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).not.toBeDisabled();
    // (c) clique activa o modo voz
    fireEvent.click(btn);
    expect(onVoiceToggle).toHaveBeenCalledTimes(1);
    expect(onVoiceToggle).toHaveBeenCalledWith(true);
  });

  it('C2 listening: cor lime, aria-pressed=true, animação de pulsação, clique invoca onVoiceToggle(false)', () => {
    const onVoiceToggle = vi.fn();
    render(<VoiceModeButton state="listening" onVoiceToggle={onVoiceToggle} />);

    const btn = screen.getByTestId('voice-mode-button');
    // (a) cor lime do design system
    expect(btn).toHaveStyle({ color: 'rgb(57, 255, 20)' });
    // animação de pulsação activa (D-7.1-ANIMATION — keyframes custom)
    expect(btn.style.animation).toContain('voicePulse');
    // (b) aria-label PT-PT + estado pressionado
    expect(btn).toHaveAttribute('aria-label', 'A ouvir — clica para parar');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    // (c) clique desactiva (active=false)
    fireEvent.click(btn);
    expect(onVoiceToggle).toHaveBeenCalledTimes(1);
    expect(onVoiceToggle).toHaveBeenCalledWith(false);
  });

  it('C3 processing: cor cyan, spinner presente, aria-label "A processar voz", clique é no-op', () => {
    const onVoiceToggle = vi.fn();
    render(<VoiceModeButton state="processing" onVoiceToggle={onVoiceToggle} />);

    const btn = screen.getByTestId('voice-mode-button');
    // (a) cor cyan do design system + spinner em vez de ícone
    expect(btn).toHaveStyle({ color: 'rgb(0, 245, 255)' });
    expect(screen.getByTestId('voice-mode-spinner')).toBeInTheDocument();
    // (b) aria-label PT-PT
    expect(btn).toHaveAttribute('aria-label', 'A processar voz');
    // aria-pressed omitido em estado não-interactivo (D-7.1 / should-fix #3)
    expect(btn).not.toHaveAttribute('aria-pressed');
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    // (c) clique NÃO invoca o callback (AC4)
    fireEvent.click(btn);
    expect(onVoiceToggle).not.toHaveBeenCalled();
  });

  it('C4 error: cor magenta, aria-label inclui mensagem PT-PT, clique invoca onVoiceToggle(true) (retry)', () => {
    const onVoiceToggle = vi.fn();
    render(
      <VoiceModeButton
        state="error"
        errorMessage="Microfone negado"
        onVoiceToggle={onVoiceToggle}
      />
    );

    const btn = screen.getByTestId('voice-mode-button');
    // (a) cor magenta do design system
    expect(btn).toHaveStyle({ color: 'rgb(255, 0, 110)' });
    // (b) aria-label PT-PT com a mensagem de erro
    expect(btn).toHaveAttribute('aria-label', 'Erro no modo voz: Microfone negado');
    // (c) clique permite retry (estado error é interactivo → active=true)
    fireEvent.click(btn);
    expect(onVoiceToggle).toHaveBeenCalledTimes(1);
    expect(onVoiceToggle).toHaveBeenCalledWith(true);
  });

  it('C5 unsupported: cor grey, disabled, aria-label PT-PT, clique é no-op', () => {
    const onVoiceToggle = vi.fn();
    render(<VoiceModeButton state="unsupported" onVoiceToggle={onVoiceToggle} />);

    const btn = screen.getByTestId('voice-mode-button');
    // (a) cor grey do design system
    expect(btn).toHaveStyle({ color: 'rgb(136, 146, 164)' });
    // (b) aria-label PT-PT
    expect(btn).toHaveAttribute(
      'aria-label',
      'Modo voz não suportado neste browser'
    );
    // botão desactivado + aria-pressed omitido
    expect(btn).toBeDisabled();
    expect(btn).not.toHaveAttribute('aria-pressed');
    // (c) clique NÃO invoca o callback (AC4)
    fireEvent.click(btn);
    expect(onVoiceToggle).not.toHaveBeenCalled();
  });

  it('CR Iter 1 C3: state="idle" sem onVoiceToggle → botão não-interactivo (sem cursor pointer, aria-disabled=true, sem aria-pressed, clique no-op)', () => {
    // Path real do InputBox em modo disabled/streaming: passa onVoiceToggle=undefined.
    render(<VoiceModeButton state="idle" />);

    const btn = screen.getByTestId('voice-mode-button');
    // Afordância correcta: não-interactivo apesar do estado idle, porque não há handler.
    expect(btn).toHaveStyle({ cursor: 'not-allowed' });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    // aria-pressed omitido em botão não-interactivo (evita leitura ambígua).
    expect(btn).not.toHaveAttribute('aria-pressed');
    // Clique é seguro (no-op) — sem handler nada é invocado, sem crash.
    fireEvent.click(btn);
  });

  it('AC8: anúncio aria-live="polite" presente para leitores de ecrã', () => {
    render(<VoiceModeButton state="idle" />);
    const live = screen.getByRole('status');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('Modo voz inactivo');
  });
});
