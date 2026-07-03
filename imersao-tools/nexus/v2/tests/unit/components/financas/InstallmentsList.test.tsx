import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { InstallmentsList } from '@/components/financas/InstallmentsList';
import type { Card, Installment } from '@/types/db';

/**
 * Nexus v2 — InstallmentsList tests (Story 9.1b — cobertura package finanças)
 *
 * Lista read-only de compras parceladas (Story 3.6, sem Editar). Cobre vazio,
 * preenchido (descrição + cartão + "N× de €X" + total + data), lookup de cartão
 * órfão, o texto de parcela não-divisível e o callback Apagar.
 */

const CARD: Card = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  name: 'Millennium Gold',
  accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  closingDay: 10,
  dueDay: 20,
  limit: null,
};

function makeInstallment(partial: Partial<Installment> = {}): Installment {
  return {
    id: partial.id ?? '11111111-1111-4111-8111-111111111111',
    cardId: partial.cardId ?? CARD.id,
    totalAmount: partial.totalAmount ?? 120000,
    installments: partial.installments ?? 12,
    startDate: partial.startDate ?? '2026-05-15',
    description: partial.description ?? 'Portátil',
  };
}

describe('InstallmentsList (Story 9.1b / cobertura finanças)', () => {
  afterEach(() => cleanup());

  it('estado vazio — lista sem linhas', () => {
    render(<InstallmentsList installments={[]} cards={[CARD]} onDelete={vi.fn()} />);
    const list = screen.getByRole('list', { name: 'Lista de compras parceladas' });
    expect(within(list).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('preenchido — descrição, cartão, "N× de €X" divisível, total e data PT-PT', () => {
    render(
      <InstallmentsList installments={[makeInstallment()]} cards={[CARD]} onDelete={vi.fn()} />,
    );
    expect(screen.getByText('Portátil')).toBeInTheDocument();
    // 120000 / 12 = 10000 cêntimos → €100,00 (divisão exacta).
    expect(screen.getByText(/Millennium Gold · 12× de .*100,00 · Início 15\/05\/2026/)).toBeInTheDocument();
    expect(screen.getByText(/1\.200,00/)).toBeInTheDocument();
  });

  it('divisão não exacta — indica a primeira parcela', () => {
    render(
      <InstallmentsList
        installments={[makeInstallment({ totalAmount: 100, installments: 3 })]}
        cards={[CARD]}
        onDelete={vi.fn()}
      />,
    );
    // 100 cêntimos / 3 → parcelas [34, 33, 33] → mostra "1ª".
    expect(screen.getByText(/3× de .*\(1ª:/)).toBeInTheDocument();
  });

  it('cartão órfão — mostra "Cartão desconhecido"', () => {
    render(
      <InstallmentsList
        installments={[makeInstallment({ cardId: 'ffffffff-ffff-4fff-8fff-ffffffffffff' })]}
        cards={[CARD]}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/Cartão desconhecido/)).toBeInTheDocument();
  });

  it('callback — Apagar devolve o id', () => {
    const onDelete = vi.fn();
    const inst = makeInstallment({ id: '22222222-2222-4222-8222-222222222222', description: 'Móveis' });
    render(<InstallmentsList installments={[inst]} cards={[CARD]} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar compra parcelada Móveis' }));
    expect(onDelete).toHaveBeenCalledWith('22222222-2222-4222-8222-222222222222');
  });
});
