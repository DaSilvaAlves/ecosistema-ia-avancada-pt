import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import {
  FinanceRecurrenceFormModal,
  type FinanceRecurrenceSubmit,
} from '@/components/financas/FinanceRecurrenceFormModal';
import type { Account, Card, Category } from '@/types/db';

/**
 * Nexus v2 — FinanceRecurrenceFormModal tests (Story 9.1b — cobertura package finanças)
 *
 * Modal criar/editar recorrência financeira (Story 3.4). Usa o RecurrenceFieldset
 * REAL (Story 2.7) — conduzido pelos seus controlos. Cobre render, submissão feliz
 * (RRULE derivada), e DOIS caminhos de erro: valor mal-formado e recorrência não
 * definida. Cobre ainda o erro do repo (modal não fecha).
 */

const CATEGORIES: Category[] = [
  { name: 'Habitação', color: '#9D00FF', icon: '🏠', isDefault: true },
];
const ACCOUNTS: Account[] = [];
const CARDS: Card[] = [];

function base(overrides: Partial<React.ComponentProps<typeof FinanceRecurrenceFormModal>> = {}) {
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
  fireEvent.change(container.querySelector('#finance-recurrence-amount') as HTMLInputElement, {
    target: { value },
  });
}
function selectCategory(container: HTMLElement, value: string): void {
  fireEvent.change(container.querySelector('#finance-recurrence-category') as HTMLSelectElement, {
    target: { value },
  });
}
function enableDailyRecurrence(): void {
  // Activa o toggle → RecurrenceFieldset materializa {type:'daily', startDate:''}.
  fireEvent.click(screen.getByLabelText('Tarefa recorrente'));
  // Preenche a data de início (obrigatória).
  fireEvent.change(screen.getByLabelText('Data de início da recorrência'), {
    target: { value: '2026-01-01' },
  });
}

describe('FinanceRecurrenceFormModal (Story 9.1b / cobertura finanças)', () => {
  afterEach(() => cleanup());

  it('modo create — título "Nova recorrência"', () => {
    render(<FinanceRecurrenceFormModal {...base()} />);
    expect(screen.getByRole('heading', { name: 'Nova recorrência' })).toBeInTheDocument();
  });

  it('submissão feliz — deriva RRULE e devolve template + datas', async () => {
    let captured: FinanceRecurrenceSubmit | null = null;
    const onSubmit = vi.fn(async (s: FinanceRecurrenceSubmit) => {
      captured = s;
    });
    const onClose = vi.fn();
    const { container } = render(
      <FinanceRecurrenceFormModal {...base({ onSubmit, onClose })} />,
    );
    setAmount(container, '650,00');
    selectCategory(container, 'Habitação');
    enableDailyRecurrence();
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const submit = captured as FinanceRecurrenceSubmit | null;
    expect(submit).not.toBeNull();
    expect(submit!.template.amount).toBe(-65000); // saída (default)
    expect(submit!.template.category).toBe('Habitação');
    expect(submit!.startDate).toBe('2026-01-01');
    expect(submit!.rule).toMatch(/FREQ=DAILY/);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('caminho de erro 1 (parsing) — valor vazio mostra erro, onSubmit não chamado', () => {
    const onSubmit = vi.fn();
    render(<FinanceRecurrenceFormModal {...base({ onSubmit })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Valor inválido/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('caminho de erro 2 — recorrência não definida bloqueia a submissão', () => {
    const onSubmit = vi.fn();
    const { container } = render(<FinanceRecurrenceFormModal {...base({ onSubmit })} />);
    setAmount(container, '50,00');
    selectCategory(container, 'Habitação');
    // Recorrência NÃO activada → erro.
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(screen.getByText(/Define a recorrência/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('erro do repo — onSubmit lança, modal não fecha', async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error('Falha repo');
    });
    const onClose = vi.fn();
    const { container } = render(
      <FinanceRecurrenceFormModal {...base({ onSubmit, onClose })} />,
    );
    setAmount(container, '650,00');
    selectCategory(container, 'Habitação');
    enableDailyRecurrence();
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
  });
});
