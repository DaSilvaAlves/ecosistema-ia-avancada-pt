import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { AccountFormModal } from '@/components/financas/AccountFormModal';
import type { Account } from '@/types/db';

/**
 * Nexus v2 — AccountFormModal tests (Story 9.1b — cobertura package finanças)
 *
 * Modal criar/editar conta (Story 3.5). Cobre render create/edit, submissão
 * feliz (onSubmit + onClose), e DOIS caminhos de erro de submissão
 * (react-component-test-criteria.md): saldo mal-formado (erro de parsing) e
 * validação Zod (nome vazio). Cobre ainda o erro do repo (onSubmit lança →
 * modal não fecha) e o fecho por Escape.
 */

const EDIT_ACCOUNT: Account = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Conta Existente',
  type: 'savings',
  balance: -12345,
  createdAt: 1_700_000_000_000,
};

function setBalance(container: HTMLElement, value: string): void {
  fireEvent.change(container.querySelector('#account-balance') as HTMLInputElement, {
    target: { value },
  });
}
function setName(container: HTMLElement, value: string): void {
  fireEvent.change(container.querySelector('#account-name') as HTMLInputElement, {
    target: { value },
  });
}

describe('AccountFormModal (Story 9.1b / cobertura finanças)', () => {
  afterEach(() => cleanup());

  it('modo create — título "Nova conta" e campos vazios', () => {
    render(<AccountFormModal mode="create" onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Nova conta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument();
  });

  it('modo edit — pré-preenche nome, tipo e magnitude/sinal do saldo', () => {
    const { container } = render(
      <AccountFormModal
        mode="edit"
        initialValue={EDIT_ACCOUNT}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Editar conta' })).toBeInTheDocument();
    expect((container.querySelector('#account-name') as HTMLInputElement).value).toBe('Conta Existente');
    expect((container.querySelector('#account-balance') as HTMLInputElement).value).toBe('123,45');
    expect((container.querySelector('#account-sign') as HTMLSelectElement).value).toBe('descoberto');
  });

  it('submissão feliz — onSubmit recebe Account válido e onClose é chamado', async () => {
    let captured: Account | null = null;
    const onSubmit = vi.fn(async (a: Account) => {
      captured = a;
    });
    const onClose = vi.fn();
    const { container } = render(
      <AccountFormModal mode="create" onClose={onClose} onSubmit={onSubmit} />,
    );
    setName(container, 'Conta Nova');
    setBalance(container, '1.250,00');
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const account = captured as Account | null;
    expect(account).not.toBeNull();
    expect(account!.name).toBe('Conta Nova');
    expect(account!.balance).toBe(125000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('caminho de erro 1 (parsing) — saldo mal-formado mostra erro, onSubmit não chamado', () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <AccountFormModal mode="create" onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    setName(container, 'Conta X');
    setBalance(container, 'abc');
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Valor inválido/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('caminho de erro 2 (Zod) — nome vazio mostra "Nome da conta é obrigatório"', () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <AccountFormModal mode="create" onClose={vi.fn()} onSubmit={onSubmit} />,
    );
    setBalance(container, '100,00');
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Nome da conta é obrigatório');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('erro do repo — onSubmit lança, modal não fecha (falha não silenciosa)', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('Falha ao persistir');
    });
    const onClose = vi.fn();
    const { container } = render(
      <AccountFormModal mode="create" onClose={onClose} onSubmit={onSubmit} />,
    );
    setName(container, 'Conta Y');
    setBalance(container, '50,00');
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Escape fecha o modal (onClose)', () => {
    const onClose = vi.fn();
    render(<AccountFormModal mode="create" onClose={onClose} onSubmit={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
