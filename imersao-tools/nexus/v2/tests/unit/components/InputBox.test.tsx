import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputBox } from '@/components/chat/InputBox';

/**
 * Nexus v2 — InputBox component tests (Story 0.4)
 *
 * Verifica:
 *  - Enter envia mensagem
 *  - Shift+Enter NÃO envia (nova linha)
 *  - Empty submit é bloqueado
 */

describe('InputBox', () => {
  it('chama onSend ao pressionar Enter', () => {
    const onSend = vi.fn();
    render(<InputBox onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: /prompt/i });
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('hello');
  });

  it('NÃO chama onSend ao pressionar Shift+Enter (nova linha)', () => {
    const onSend = vi.fn();
    render(<InputBox onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: /prompt/i });
    fireEvent.change(textarea, { target: { value: 'multi\nline' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('NÃO chama onSend com texto vazio', () => {
    const onSend = vi.fn();
    render(<InputBox onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: /prompt/i });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  // Story 1.9 Iter 2 — N4 — branches `streamingState`
  describe('streamingState branches (Story 1.9)', () => {
    it('idle (default) — textarea ENABLED com placeholder canónico', () => {
      render(<InputBox onSend={vi.fn()} />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      expect(textarea).not.toBeDisabled();
      expect(textarea.getAttribute('placeholder')).toMatch(/Escreve qualquer coisa/i);
      expect(textarea.getAttribute('aria-describedby')).toBeNull();
    });

    it('streaming — textarea DISABLED com placeholder "A processar..." e aria-describedby', () => {
      render(<InputBox onSend={vi.fn()} streamingState="streaming" />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      expect(textarea).toBeDisabled();
      expect(textarea.getAttribute('placeholder')).toBe('A processar...');
      expect(textarea.getAttribute('aria-describedby')).toBe('input-box-state-message');
    });

    it('preview-pending — textarea DISABLED com placeholder de confirmação', () => {
      render(<InputBox onSend={vi.fn()} streamingState="preview-pending" />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      expect(textarea).toBeDisabled();
      expect(textarea.getAttribute('placeholder')).toMatch(/Confirma a acção acima/i);
      expect(textarea.getAttribute('aria-describedby')).toBe('input-box-state-message');
    });

    it('streaming — onSend NÃO é invocado quando Enter pressed', () => {
      const onSend = vi.fn();
      render(<InputBox onSend={onSend} streamingState="streaming" />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      fireEvent.change(textarea, { target: { value: 'tentar enviar durante stream' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });
      expect(onSend).not.toHaveBeenCalled();
    });

    it('preview-pending — onSend NÃO é invocado quando Enter pressed', () => {
      const onSend = vi.fn();
      render(<InputBox onSend={onSend} streamingState="preview-pending" />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      fireEvent.change(textarea, { target: { value: 'tentar enviar durante preview' } });
      fireEvent.keyDown(textarea, { key: 'Enter' });
      expect(onSend).not.toHaveBeenCalled();
    });

    it('disabled prop legacy (Story 0.4) continua a funcionar', () => {
      render(<InputBox onSend={vi.fn()} disabled />);
      const textarea = screen.getByRole('textbox', { name: /prompt/i });
      expect(textarea).toBeDisabled();
    });
  });
});
