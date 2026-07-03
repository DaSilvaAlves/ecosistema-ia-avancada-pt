import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import {
  InstallmentFormModal,
  type InstallmentSubmit,
} from '@/components/financas/InstallmentFormModal';
import type { Card, Category } from '@/types/db';

/**
 * Nexus v2 — InstallmentFormModal tests (Story 9.1b — cobertura package finanças)
 *
 * Modal criar compra parcelada (Story 3.6, só create). Cobre render, preview em
 * vivo, submissão feliz, e DOIS caminhos de erro: campos obrigatórios em falta e
 * número de prestações < 2. Cobre ainda o erro do repo (modal não fecha).
 */

const CARDS: Card[] = [
  { id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', name: 'Millennium Gold', accountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', closingDay: 10, dueDay: 20, limit: null },
];
const CATEGORIES: Category[] = [
  { name: 'Equipamento', color: '#00F5FF', icon: '💻', isDefault: false },
];

function base(overrides: Partial<React.ComponentProps<typeof InstallmentFormModal>> = {}) {
  return {
    cards: CARDS,
    categories: CATEGORIES,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
}

function fillValid(container: HTMLElement): void {
  fireEvent.change(container.querySelector('#installment-card') as HTMLSelectElement, {
    target: { value: CARDS[0].id },
  });
  fireEvent.change(container.querySelector('#installment-description') as HTMLInputElement, {
    target: { value: 'Portátil' },
  });
  fireEvent.change(container.querySelector('#installment-category') as HTMLSelectElement, {
    target: { value: 'Equipamento' },
  });
  fireEvent.change(container.querySelector('#installment-total') as HTMLInputElement, {
    target: { value: '1.200,00' },
  });
  fireEvent.change(container.querySelector('#installment-count') as HTMLInputElement, {
    target: { value: '12' },
  });
  fireEvent.change(container.querySelector('#installment-start') as HTMLInputElement, {
    target: { value: '2026-05-15' },
  });
}

describe('InstallmentFormModal (Story 9.1b / cobertura finanças)', () => {
  afterEach(() => cleanup());

  it('render — título "Nova compra parcelada"', () => {
    render(<InstallmentFormModal {...base()} />);
    expect(screen.getByRole('heading', { name: 'Nova compra parcelada' })).toBeInTheDocument();
  });

  it('preview em vivo — total + prestações mostra "N× de €X"', () => {
    const { container } = render(<InstallmentFormModal {...base()} />);
    fireEvent.change(container.querySelector('#installment-total') as HTMLInputElement, {
      target: { value: '120,00' },
    });
    fireEvent.change(container.querySelector('#installment-count') as HTMLInputElement, {
      target: { value: '12' },
    });
    const preview = screen.getByTestId('installments-preview');
    expect(preview).toHaveTextContent(/12× de .*10,00/);
  });

  it('submissão feliz — onSubmit recebe {installment, category} + onClose', async () => {
    let captured: InstallmentSubmit | null = null;
    const onSubmit = vi.fn(async (s: InstallmentSubmit) => {
      captured = s;
    });
    const onClose = vi.fn();
    const { container } = render(<InstallmentFormModal {...base({ onSubmit, onClose })} />);
    fillValid(container);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submit = captured as InstallmentSubmit | null;
    expect(submit).not.toBeNull();
    expect(submit!.category).toBe('Equipamento');
    expect(submit!.installment.totalAmount).toBe(120000);
    expect(submit!.installment.installments).toBe(12);
    expect(submit!.installment.cardId).toBe(CARDS[0].id);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('caminho de erro 1 — campos obrigatórios em falta', () => {
    const onSubmit = vi.fn();
    render(<InstallmentFormModal {...base({ onSubmit })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(screen.getByText('Cartão é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Descrição é obrigatória')).toBeInTheDocument();
    expect(screen.getByText('Categoria é obrigatória')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('caminho de erro 2 — número de prestações < 2 (validação defensiva no submit)', () => {
    // O input `type=number min=2` bloqueia nativamente valores < 2 no clique
    // (constraint validation do browser/jsdom). `fireEvent.submit` exercita a
    // validação defensiva de aplicação em `handleSubmit` — o caminho de erro real.
    const onSubmit = vi.fn();
    const { container } = render(<InstallmentFormModal {...base({ onSubmit })} />);
    fillValid(container);
    fireEvent.change(container.querySelector('#installment-count') as HTMLInputElement, {
      target: { value: '1' },
    });
    fireEvent.submit(container.querySelector('form') as HTMLFormElement);
    expect(screen.getByText(/inteiro >= 2/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('erro do repo — onSubmit lança, modal não fecha', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('Falha atómica');
    });
    const onClose = vi.fn();
    const { container } = render(<InstallmentFormModal {...base({ onSubmit, onClose })} />);
    fillValid(container);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
  });
});
