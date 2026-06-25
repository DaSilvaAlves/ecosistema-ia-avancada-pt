/**
 * Nexus v2 — SynthesisToggleButton component tests (Story 7.4 — FR80, AC1/AC5, R3)
 *
 * `react-component-test-criteria.md`: o toggle de síntese tem 3 estados de render
 * distintos (idle/active/unsupported) → teste de componente obrigatório.
 *
 * Verifica:
 *   - render por estado (cor/ícone via data-state) + aria-label PT-PT
 *   - aria-pressed reflecte on/off em estado interactivo; omitido em unsupported
 *   - clique em idle/active → onToggle invocado
 *   - clique em unsupported → no-op (botão disabled, AC5)
 *   - sem handler → não-interactivo (aria-disabled)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SynthesisToggleButton } from '@/components/chat/SynthesisToggleButton';

describe('SynthesisToggleButton — estados de render (AC1/AC5)', () => {
  it('idle → data-state=idle, aria-pressed=false, aria-label de activação', () => {
    render(<SynthesisToggleButton state="idle" onToggle={vi.fn()} />);
    const btn = screen.getByTestId('synthesis-toggle-button');
    expect(btn.getAttribute('data-state')).toBe('idle');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.getAttribute('aria-label')).toMatch(/Activar leitura em voz alta/i);
    expect(btn).not.toBeDisabled();
  });

  it('active → data-state=active, aria-pressed=true', () => {
    render(<SynthesisToggleButton state="active" onToggle={vi.fn()} />);
    const btn = screen.getByTestId('synthesis-toggle-button');
    expect(btn.getAttribute('data-state')).toBe('active');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('aria-label')).toMatch(/desactivar/i);
  });

  it('unsupported → disabled, aria-pressed ausente, aria-label de não-suporte (AC5)', () => {
    render(<SynthesisToggleButton state="unsupported" onToggle={vi.fn()} />);
    const btn = screen.getByTestId('synthesis-toggle-button');
    expect(btn.getAttribute('data-state')).toBe('unsupported');
    expect(btn).toBeDisabled();
    expect(btn.getAttribute('aria-pressed')).toBeNull();
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.getAttribute('aria-label')).toMatch(/não suportada/i);
  });
});

describe('SynthesisToggleButton — interacção (AC1/AC5)', () => {
  it('clique em idle → onToggle invocado', () => {
    const onToggle = vi.fn();
    render(<SynthesisToggleButton state="idle" onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('synthesis-toggle-button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('clique em active → onToggle invocado', () => {
    const onToggle = vi.fn();
    render(<SynthesisToggleButton state="active" onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('synthesis-toggle-button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('clique em unsupported → no-op (onToggle NÃO invocado) (AC5)', () => {
    const onToggle = vi.fn();
    render(<SynthesisToggleButton state="unsupported" onToggle={onToggle} />);
    fireEvent.click(screen.getByTestId('synthesis-toggle-button'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('sem handler → não-interactivo (aria-disabled, sem aria-pressed)', () => {
    render(<SynthesisToggleButton state="idle" />);
    const btn = screen.getByTestId('synthesis-toggle-button');
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.getAttribute('aria-pressed')).toBeNull();
  });
});
