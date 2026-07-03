import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { CardFormModal } from '@/components/financas/CardFormModal';
import type { Account, Card } from '@/types/db';

/**
 * Nexus v2 — CardFormModal tests (Story 9.1b — cobertura package finanças)
 *
 * Modal criar/editar cartão (Story 3.5). Cobre render, submissão feliz, e DOIS
 * caminhos de erro: pré-validação de selecções obrigatórias (conta/dias) e
 * limite mal-formado. Cobre ainda o erro do repo (modal não fecha).
 */

const ACCOUNTS: Account[] = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Conta Principal', type: 'checking', balance: 0, createdAt: 1 },
];

function base(overrides: Partial<React.ComponentProps<typeof CardFormModal>> = {}) {
  return {
    mode: 'create' as const,
    accounts: ACCOUNTS,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
}

function fillValid(container: HTMLElement): void {
  fireEvent.change(container.querySelector('#card-name') as HTMLInputElement, {
    target: { value: 'Millennium Gold' },
  });
  fireEvent.change(container.querySelector('#card-account') as HTMLSelectElement, {
    target: { value: ACCOUNTS[0].id },
  });
  fireEvent.change(container.querySelector('#card-closing-day') as HTMLSelectElement, {
    target: { value: '10' },
  });
  fireEvent.change(container.querySelector('#card-due-day') as HTMLSelectElement, {
    target: { value: '20' },
  });
}

describe('CardFormModal (Story 9.1b / cobertura finanças)', () => {
  afterEach(() => cleanup());

  it('modo create — título "Novo cartão"', () => {
    render(<CardFormModal {...base()} />);
    expect(screen.getByRole('heading', { name: 'Novo cartão' })).toBeInTheDocument();
  });

  it('submissão feliz — limite vazio vira null, onSubmit + onClose', async () => {
    let captured: Card | null = null;
    const onSubmit = vi.fn(async (c: Card) => {
      captured = c;
    });
    const onClose = vi.fn();
    const { container } = render(<CardFormModal {...base({ onSubmit, onClose })} />);
    fillValid(container);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const card = captured as Card | null;
    expect(card).not.toBeNull();
    expect(card!.name).toBe('Millennium Gold');
    expect(card!.accountId).toBe(ACCOUNTS[0].id);
    expect(card!.closingDay).toBe(10);
    expect(card!.dueDay).toBe(20);
    expect(card!.limit).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('caminho de erro 1 — selecções obrigatórias em falta (conta/fecho/vencimento)', () => {
    const onSubmit = vi.fn();
    render(<CardFormModal {...base({ onSubmit })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(screen.getByText('Conta é obrigatória')).toBeInTheDocument();
    expect(screen.getByText('Dia de fecho é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Dia de vencimento é obrigatório')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('caminho de erro 2 — limite mal-formado mostra erro de parsing', () => {
    const onSubmit = vi.fn();
    const { container } = render(<CardFormModal {...base({ onSubmit })} />);
    fillValid(container);
    fireEvent.change(container.querySelector('#card-limit') as HTMLInputElement, {
      target: { value: 'xyz' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Valor inválido/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('erro do repo — onSubmit lança, modal não fecha', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('Falha repo');
    });
    const onClose = vi.fn();
    const { container } = render(<CardFormModal {...base({ onSubmit, onClose })} />);
    fillValid(container);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
  });
});
