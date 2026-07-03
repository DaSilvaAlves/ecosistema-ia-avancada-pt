import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { AccountsList } from '@/components/financas/AccountsList';
import type { Account } from '@/types/db';

/**
 * Nexus v2 — AccountsList tests (Story 9.1b — cobertura package finanças)
 *
 * Lista read-only de contas bancárias (Story 3.5). Componente de apresentação:
 * cobre o estado vazio, o estado preenchido (nome + tipo + saldo formatado), a
 * distinção visual de saldo a descoberto e os callbacks Editar/Apagar.
 */

function makeAccount(partial: Partial<Account> = {}): Account {
  return {
    id: partial.id ?? '11111111-1111-4111-8111-111111111111',
    name: partial.name ?? 'Millennium à ordem',
    type: partial.type ?? 'checking',
    balance: partial.balance ?? 125000,
    createdAt: partial.createdAt ?? 1_700_000_000_000,
  };
}

describe('AccountsList (Story 9.1b / cobertura finanças)', () => {
  afterEach(() => cleanup());

  it('estado vazio — renderiza a lista sem linhas', () => {
    render(<AccountsList accounts={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const list = screen.getByRole('list', { name: 'Lista de contas' });
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('estado preenchido — nome, rótulo de tipo PT-PT e saldo formatado', () => {
    render(
      <AccountsList
        accounts={[makeAccount({ name: 'Conta Ordenado', type: 'savings', balance: 250000 })]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Conta Ordenado')).toBeInTheDocument();
    expect(screen.getByText('Poupança')).toBeInTheDocument();
    expect(screen.getByText(/2\.500,00/)).toBeInTheDocument();
  });

  it('saldo a descoberto — cor magenta no montante negativo', () => {
    render(
      <AccountsList
        accounts={[makeAccount({ name: 'Conta a Descoberto', balance: -30000 })]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const amount = screen.getByText(/-.*300,00/);
    expect(amount).toHaveStyle({ color: '#FF006E' });
  });

  it('callbacks — Editar devolve a conta, Apagar devolve o id', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const account = makeAccount({ id: '22222222-2222-4222-8222-222222222222', name: 'Conta X' });
    render(<AccountsList accounts={[account]} onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar conta Conta X' }));
    expect(onEdit).toHaveBeenCalledWith(account);

    fireEvent.click(screen.getByRole('button', { name: 'Apagar conta Conta X' }));
    expect(onDelete).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
  });
});
