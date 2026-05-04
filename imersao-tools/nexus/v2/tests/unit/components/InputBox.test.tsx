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
    const textarea = screen.getByRole('textbox', { name: /mensagem/i });
    fireEvent.change(textarea, { target: { value: 'hello' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    expect(onSend).toHaveBeenCalledWith('hello');
  });

  it('NÃO chama onSend ao pressionar Shift+Enter (nova linha)', () => {
    const onSend = vi.fn();
    render(<InputBox onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: /mensagem/i });
    fireEvent.change(textarea, { target: { value: 'multi\nline' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('NÃO chama onSend com texto vazio', () => {
    const onSend = vi.fn();
    render(<InputBox onSend={onSend} />);
    const textarea = screen.getByRole('textbox', { name: /mensagem/i });
    fireEvent.keyDown(textarea, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });
});
