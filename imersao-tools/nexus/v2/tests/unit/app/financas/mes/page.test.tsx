import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { format } from 'date-fns';
import type { Transaction } from '@/types/db';

/**
 * Nexus v2 — MesPage smoke tests (Story 9.1b — cobertura package finanças)
 *
 * Vista analítica "Este mês" (Story 3.7). Mocka `useTransactions` (chamado 2×:
 * mês + projecção) e `useCategories` + `next/navigation`. Cobre os 3 estados:
 * loading, empty (KPIs a zero) e content (KPIs + análise por dia).
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  useTransactions: vi.fn(),
  useCategories: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack, push: vi.fn() }),
}));
vi.mock('@/hooks/useTransactions', () => ({ useTransactions: () => mocks.useTransactions() }));
vi.mock('@/hooks/useCategories', () => ({ useCategories: () => mocks.useCategories() }));

import MesPage from '@/app/(app)/financas/mes/page';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const TX: Transaction = {
  id: '11111111-1111-4111-8111-111111111111',
  amount: -5000,
  category: 'Alimentação',
  description: 'Almoço',
  date: TODAY,
  accountId: null,
  cardId: null,
  recurrenceId: null,
  installmentId: null,
  createdAt: 1_700_000_000_000,
};

describe('MesPage (Story 9.1b / smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => cleanup());

  it('loading — useTransactions undefined mostra "A carregar transações"', () => {
    mocks.useTransactions.mockReturnValue(undefined);
    mocks.useCategories.mockReturnValue(undefined);
    render(<MesPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Este mês' })).toBeInTheDocument();
    expect(screen.getByText(/A carregar transações/)).toBeInTheDocument();
  });

  it('empty — sem transações mostra KPIs a zero e o empty state', () => {
    mocks.useTransactions.mockReturnValue([]);
    mocks.useCategories.mockReturnValue([]);
    render(<MesPage />);
    expect(screen.getByLabelText('Totais do mês')).toBeInTheDocument();
    expect(screen.getByText(/Sem transações em/)).toBeInTheDocument();
  });

  it('content — uma transação renderiza KPIs e a análise por dia', () => {
    mocks.useTransactions.mockReturnValue([TX]);
    mocks.useCategories.mockReturnValue([
      { name: 'Alimentação', color: '#39FF14', icon: '🍎', isDefault: true },
    ]);
    render(<MesPage />);
    expect(screen.getByLabelText('Totais do mês')).toBeInTheDocument();
    expect(screen.getByLabelText('Análise por dia')).toBeInTheDocument();
  });
});
