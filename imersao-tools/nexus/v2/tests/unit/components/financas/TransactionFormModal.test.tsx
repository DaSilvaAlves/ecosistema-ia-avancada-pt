import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { TransactionFormModal } from '@/components/financas/TransactionFormModal';
import type { Account, Card, Category, Transaction } from '@/types/db';

/**
 * Nexus v2 — TransactionFormModal tests (Story 9.1b — cobertura package finanças)
 *
 * Modal criar/editar transação variável (Story 3.3). Cobre render, submissão
 * feliz (sinal por direção), e DOIS caminhos de erro (valor mal-formado; Zod
 * categoria obrigatória), mais o erro do repo (modal não fecha).
 */

const CATEGORIES: Category[] = [
  { name: 'Alimentação', color: '#39FF14', icon: '🍎', isDefault: true },
];
const ACCOUNTS: Account[] = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Conta', type: 'checking', balance: 0, createdAt: 1 },
];
const CARDS: Card[] = [];

function base(overrides: Partial<React.ComponentProps<typeof TransactionFormModal>> = {}) {
  return {
    mode: 'create' as const,
    categories: CATEGORIES,
    accounts: ACCOUNTS,
    cards: CARDS,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
}

function setAmount(container: HTMLElement, value: string): void {
  fireEvent.change(container.querySelector('#transaction-amount') as HTMLInputElement, {
    target: { value },
  });
}
function selectCategory(container: HTMLElement, value: string): void {
  fireEvent.change(container.querySelector('#transaction-category') as HTMLSelectElement, {
    target: { value },
  });
}

describe('TransactionFormModal (Story 9.1b / cobertura finanças)', () => {
  afterEach(() => cleanup());

  it('modo create — título e botão "Criar"', () => {
    render(<TransactionFormModal {...base()} />);
    expect(screen.getByRole('heading', { name: 'Nova transação' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Criar' })).toBeInTheDocument();
  });

  it('submissão feliz — saída aplica sinal negativo, onSubmit + onClose', async () => {
    let captured: Transaction | null = null;
    const onSubmit = vi.fn(async (t: Transaction) => {
      captured = t;
    });
    const onClose = vi.fn();
    const { container } = render(
      <TransactionFormModal {...base({ onSubmit, onClose })} />,
    );
    setAmount(container, '78,70');
    selectCategory(container, 'Alimentação');
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const tx = captured as Transaction | null;
    expect(tx).not.toBeNull();
    expect(tx!.amount).toBe(-7870);
    expect(tx!.category).toBe('Alimentação');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('caminho de erro 1 (parsing) — valor vazio mostra erro, onSubmit não chamado', () => {
    const onSubmit = vi.fn();
    render(<TransactionFormModal {...base({ onSubmit })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Valor inválido/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('caminho de erro 2 (Zod) — categoria vazia mostra "Categoria é obrigatória"', () => {
    const onSubmit = vi.fn();
    const { container } = render(<TransactionFormModal {...base({ onSubmit })} />);
    setAmount(container, '10,00');
    // categoria fica '' (não seleccionada) → Zod falha.
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(screen.getByText('Categoria é obrigatória')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('erro do repo — onSubmit lança, modal não fecha', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('Falha repo');
    });
    const onClose = vi.fn();
    const { container } = render(
      <TransactionFormModal {...base({ onSubmit, onClose })} />,
    );
    setAmount(container, '10,00');
    selectCategory(container, 'Alimentação');
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
  });
});
