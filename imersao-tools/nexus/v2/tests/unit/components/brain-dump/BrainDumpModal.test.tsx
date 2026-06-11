import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrainDumpModal } from '@/components/brain-dump/BrainDumpModal';

/**
 * Nexus v2 — BrainDumpModal tests (Story 5.6 — AC7)
 *
 * 6 cenários do AC7 + foco inicial na textarea. O threshold/contagem é coberto
 * em separado no helper puro (`tests/unit/lib/brain-dump/input.test.ts`).
 */

const PLACEHOLDER =
  'Vomita ideias 10 minutos seguidos. Sem censura. A AI organiza depois.';

function setup(overrides: Partial<Parameters<typeof BrainDumpModal>[0]> = {}) {
  const onClose = vi.fn();
  const onStructure = vi.fn();
  render(
    <BrainDumpModal
      isOpen
      onClose={onClose}
      onStructure={onStructure}
      {...overrides}
    />,
  );
  return { onClose, onStructure };
}

describe('BrainDumpModal', () => {
  it('não renderiza quando isOpen é false', () => {
    render(
      <BrainDumpModal isOpen={false} onClose={vi.fn()} onStructure={vi.fn()} />,
    );
    expect(screen.queryByTestId('brain-dump-modal')).not.toBeInTheDocument();
  });

  it('(i) mostra o placeholder exacto quando o input está vazio', () => {
    setup();
    const textarea = screen.getByTestId('brain-dump-textarea');
    expect(textarea).toHaveAttribute('placeholder', PLACEHOLDER);
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('(ii) inibe o botão "Estruturar com AI" abaixo de 50 caracteres', () => {
    setup();
    const textarea = screen.getByTestId('brain-dump-textarea');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(49) } });
    expect(screen.getByRole('button', { name: /^estruturar com ai/i })).toBeDisabled();
  });

  it('(iii) activa o botão "Estruturar com AI" com ≥ 50 caracteres', () => {
    setup();
    const textarea = screen.getByTestId('brain-dump-textarea');
    fireEvent.change(textarea, { target: { value: 'a'.repeat(50) } });
    expect(screen.getByRole('button', { name: 'Estruturar com AI' })).toBeEnabled();
  });

  it('(iv) clicar "Estruturar" com input válido invoca onStructure com o markdown', () => {
    const { onStructure } = setup();
    const markdown = 'Ideia solta '.repeat(6); // > 50 chars
    const textarea = screen.getByTestId('brain-dump-textarea');
    fireEvent.change(textarea, { target: { value: markdown } });
    fireEvent.click(screen.getByRole('button', { name: 'Estruturar com AI' }));
    expect(onStructure).toHaveBeenCalledTimes(1);
    expect(onStructure).toHaveBeenCalledWith(markdown);
  });

  it('(iv-neg) não invoca onStructure quando o input é insuficiente', () => {
    const { onStructure } = setup();
    const textarea = screen.getByTestId('brain-dump-textarea');
    fireEvent.change(textarea, { target: { value: 'curto' } });
    fireEvent.click(screen.getByRole('button', { name: /estruturar com ai/i }));
    expect(onStructure).not.toHaveBeenCalled();
  });

  it('(v) Escape e o botão de fechar invocam onClose', () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar Brain Dump' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('(vi) expõe role="dialog" + aria-modal + aria-label', () => {
    setup();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Brain Dump — captura de ideias');
  });

  it('(a11y) foca a textarea ao abrir', () => {
    setup();
    expect(screen.getByTestId('brain-dump-textarea')).toHaveFocus();
  });
});
