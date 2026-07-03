import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Transaction } from '@/types/db';

/**
 * Nexus v2 — FinancasPage (home) smoke tests (Story 9.1b — cobertura package finanças)
 *
 * Segue o padrão de `patrimonio/page.test.tsx` (Story 3.9): mocka os hooks
 * `useLiveQuery` (dexie-react-hooks) e os 6 hooks de dados + `next/navigation`,
 * e cobre os 3 estados de render da tab por omissão (Transações): loading, empty,
 * content. Não persegue cada branch — smoke test da composição da página.
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  useTransactions: vi.fn(),
  useCategories: vi.fn(),
  useAccounts: vi.fn(),
  useCards: vi.fn(),
  useFinanceRecurrences: vi.fn(),
  useInstallments: vi.fn(),
  useLiveQuery: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack, push: vi.fn() }),
}));
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => mocks.useLiveQuery(),
}));
vi.mock('@/hooks/useTransactions', () => ({ useTransactions: () => mocks.useTransactions() }));
vi.mock('@/hooks/useCategories', () => ({ useCategories: () => mocks.useCategories() }));
vi.mock('@/hooks/useAccounts', () => ({ useAccounts: () => mocks.useAccounts() }));
vi.mock('@/hooks/useCards', () => ({ useCards: () => mocks.useCards() }));
vi.mock('@/hooks/useFinanceRecurrences', () => ({
  useFinanceRecurrences: () => mocks.useFinanceRecurrences(),
}));
vi.mock('@/hooks/useInstallments', () => ({ useInstallments: () => mocks.useInstallments() }));

import FinancasPage from '@/app/(app)/financas/page';

const TX: Transaction = {
  id: '11111111-1111-4111-8111-111111111111',
  amount: -7870,
  category: 'Alimentação',
  description: 'Supermercado',
  date: '2026-05-15',
  accountId: null,
  cardId: null,
  recurrenceId: null,
  installmentId: null,
  createdAt: 1_700_000_000_000,
};

function setAll(value: unknown): void {
  mocks.useTransactions.mockReturnValue(value);
  mocks.useCategories.mockReturnValue(value);
  mocks.useAccounts.mockReturnValue(value);
  mocks.useCards.mockReturnValue(value);
  mocks.useFinanceRecurrences.mockReturnValue(value);
  mocks.useInstallments.mockReturnValue(value);
  mocks.useLiveQuery.mockReturnValue(value);
}

describe('FinancasPage (Story 9.1b / smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => cleanup());

  it('loading — hooks undefined mostram skeleton "A carregar transações"', () => {
    setAll(undefined);
    render(<FinancasPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Finanças' })).toBeInTheDocument();
    expect(screen.getByLabelText('A carregar transações')).toBeInTheDocument();
  });

  it('empty — transações vazias mostram o empty state', () => {
    setAll([]);
    render(<FinancasPage />);
    expect(screen.getByText(/Sem transações/)).toBeInTheDocument();
  });

  it('content — uma transação renderiza a lista', () => {
    setAll([]);
    mocks.useTransactions.mockReturnValue([TX]);
    mocks.useCategories.mockReturnValue([]);
    render(<FinancasPage />);
    expect(screen.getByText('Supermercado')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Lista de transações' })).toBeInTheDocument();
  });
});
