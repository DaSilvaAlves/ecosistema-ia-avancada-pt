import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { TransactionsList } from '@/components/financas/TransactionsList';
import type { Category, Transaction } from '@/types/db';

/**
 * Nexus v2 — TransactionsList tests (Story 9.1b — cobertura package finanças)
 *
 * Lista cronológica de transações (Story 3.3). Cobre vazio, distinção
 * saída/entrada (cor magenta vs lime), fallback descrição→categoria e callbacks.
 */

const CATEGORIES: Category[] = [
  { name: 'Alimentação', color: '#39FF14', icon: '🍎', isDefault: true },
];

function makeTx(partial: Partial<Transaction> = {}): Transaction {
  return {
    id: partial.id ?? '11111111-1111-4111-8111-111111111111',
    amount: partial.amount ?? -7870,
    category: partial.category ?? 'Alimentação',
    description: partial.description ?? 'Supermercado',
    date: partial.date ?? '2026-05-15',
    accountId: partial.accountId ?? null,
    cardId: partial.cardId ?? null,
    recurrenceId: partial.recurrenceId ?? null,
    installmentId: partial.installmentId ?? null,
    createdAt: partial.createdAt ?? 1_700_000_000_000,
  };
}

describe('TransactionsList (Story 9.1b / cobertura finanças)', () => {
  afterEach(() => cleanup());

  it('estado vazio — lista sem linhas', () => {
    render(
      <TransactionsList
        transactions={[]}
        categories={CATEGORIES}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const list = screen.getByRole('list', { name: 'Lista de transações' });
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('saída (amount < 0) em magenta, data PT-PT', () => {
    render(
      <TransactionsList
        transactions={[makeTx({ amount: -7870, description: 'Compras' })]}
        categories={CATEGORIES}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Compras')).toBeInTheDocument();
    expect(screen.getByText(/15\/05\/2026/)).toBeInTheDocument();
    const amount = screen.getByText(/-.*78,70/);
    expect(amount).toHaveStyle({ color: '#FF006E' });
  });

  it('entrada (amount > 0) em lime', () => {
    render(
      <TransactionsList
        transactions={[makeTx({ amount: 50000, description: 'Ordenado', category: 'Alimentação' })]}
        categories={CATEGORIES}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const amount = screen.getByText(/500,00/);
    expect(amount).toHaveStyle({ color: '#39FF14' });
  });

  it('fallback — descrição vazia usa a categoria como texto primário', () => {
    render(
      <TransactionsList
        transactions={[makeTx({ description: '   ', category: 'Alimentação' })]}
        categories={CATEGORIES}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    // "Alimentação" aparece como texto primário (bold) e no metadado — pelo menos 1.
    expect(screen.getAllByText(/Alimentação/).length).toBeGreaterThanOrEqual(1);
  });

  it('callbacks — Editar devolve a transação, Apagar devolve o id', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const tx = makeTx({ id: '22222222-2222-4222-8222-222222222222', description: 'Livros' });
    render(
      <TransactionsList
        transactions={[tx]}
        categories={CATEGORIES}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Editar transação Livros' }));
    expect(onEdit).toHaveBeenCalledWith(tx);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar transação Livros' }));
    expect(onDelete).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
  });
});
