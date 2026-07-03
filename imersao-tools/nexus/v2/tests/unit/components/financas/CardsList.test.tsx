import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { CardsList } from '@/components/financas/CardsList';
import type { Account, Card } from '@/types/db';

/**
 * Nexus v2 — CardsList tests (Story 9.1b — cobertura package finanças)
 *
 * Lista read-only de cartões (Story 3.5). Cobre vazio, preenchido (nome + conta
 * associada + dias + limite), lookup de conta órfã ("Conta desconhecida"),
 * cartão sem limite ("Sem limite") e callbacks.
 */

const ACCOUNT: Account = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Conta Principal',
  type: 'checking',
  balance: 100000,
  createdAt: 1_700_000_000_000,
};

function makeCard(partial: Partial<Card> = {}): Card {
  return {
    id: partial.id ?? 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    name: partial.name ?? 'Millennium Gold',
    accountId: partial.accountId ?? ACCOUNT.id,
    closingDay: partial.closingDay ?? 10,
    dueDay: partial.dueDay ?? 20,
    limit: 'limit' in partial ? (partial.limit ?? null) : 250000,
  };
}

describe('CardsList (Story 9.1b / cobertura finanças)', () => {
  afterEach(() => cleanup());

  it('estado vazio — lista sem linhas', () => {
    render(<CardsList cards={[]} accounts={[ACCOUNT]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const list = screen.getByRole('list', { name: 'Lista de cartões' });
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('preenchido — nome, conta associada, dias e limite formatado', () => {
    render(
      <CardsList cards={[makeCard()]} accounts={[ACCOUNT]} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('Millennium Gold')).toBeInTheDocument();
    expect(screen.getByText(/Conta Principal · Fecha dia 10 · Vence dia 20/)).toBeInTheDocument();
    expect(screen.getByText(/2\.500,00/)).toBeInTheDocument();
  });

  it('conta órfã — mostra "Conta desconhecida" quando o accountId não existe', () => {
    render(
      <CardsList
        cards={[makeCard({ accountId: 'ffffffff-ffff-4fff-8fff-ffffffffffff' })]}
        accounts={[ACCOUNT]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/Conta desconhecida/)).toBeInTheDocument();
  });

  it('cartão sem limite — mostra "Sem limite"', () => {
    render(
      <CardsList
        cards={[makeCard({ limit: null })]}
        accounts={[ACCOUNT]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Sem limite')).toBeInTheDocument();
  });

  it('callbacks — Editar devolve o cartão, Apagar devolve o id', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const card = makeCard({ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', name: 'Visa' });
    render(<CardsList cards={[card]} accounts={[ACCOUNT]} onEdit={onEdit} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Editar cartão Visa' }));
    expect(onEdit).toHaveBeenCalledWith(card);

    fireEvent.click(screen.getByRole('button', { name: 'Apagar cartão Visa' }));
    expect(onDelete).toHaveBeenCalledWith('dddddddd-dddd-4ddd-8ddd-dddddddddddd');
  });
});
