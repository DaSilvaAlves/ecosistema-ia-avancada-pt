import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Account, Card } from '@/types/db';

/**
 * Nexus v2 — CartoesPage smoke tests (Story 9.1b — cobertura package finanças)
 *
 * Vista read-only de cartões (Story 3.8). Mocka `useCards`/`useAccounts`/
 * `useInstallments`/`useTransactions` + `next/navigation`. Cobre os 3 estados:
 * loading, empty e content (uma secção de cartão com métricas de fatura).
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  useCards: vi.fn(),
  useAccounts: vi.fn(),
  useInstallments: vi.fn(),
  useTransactions: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack, push: vi.fn() }),
}));
vi.mock('@/hooks/useCards', () => ({ useCards: () => mocks.useCards() }));
vi.mock('@/hooks/useAccounts', () => ({ useAccounts: () => mocks.useAccounts() }));
vi.mock('@/hooks/useInstallments', () => ({ useInstallments: () => mocks.useInstallments() }));
vi.mock('@/hooks/useTransactions', () => ({ useTransactions: () => mocks.useTransactions() }));

import CartoesPage from '@/app/(app)/financas/cartoes/page';

const ACCOUNT: Account = {
  id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  name: 'Conta Principal',
  type: 'checking',
  balance: 100000,
  createdAt: 1_700_000_000_000,
};
const CARD: Card = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  name: 'Millennium Gold',
  accountId: ACCOUNT.id,
  closingDay: 10,
  dueDay: 20,
  limit: 250000,
};

describe('CartoesPage (Story 9.1b / smoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => cleanup());

  it('loading — useCards undefined mostra "A carregar cartões…"', () => {
    mocks.useCards.mockReturnValue(undefined);
    mocks.useAccounts.mockReturnValue(undefined);
    mocks.useInstallments.mockReturnValue(undefined);
    mocks.useTransactions.mockReturnValue(undefined);
    render(<CartoesPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Cartões' })).toBeInTheDocument();
    expect(screen.getByText(/A carregar cartões/)).toBeInTheDocument();
  });

  it('empty — sem cartões mostra o aviso com link para /financas', () => {
    mocks.useCards.mockReturnValue([]);
    mocks.useAccounts.mockReturnValue([]);
    mocks.useInstallments.mockReturnValue([]);
    mocks.useTransactions.mockReturnValue([]);
    render(<CartoesPage />);
    expect(screen.getByText(/Ainda não tens cartões registados/)).toBeInTheDocument();
  });

  it('content — um cartão renderiza secção com métricas de fatura', () => {
    mocks.useCards.mockReturnValue([CARD]);
    mocks.useAccounts.mockReturnValue([ACCOUNT]);
    mocks.useInstallments.mockReturnValue([]);
    mocks.useTransactions.mockReturnValue([]);
    render(<CartoesPage />);
    expect(screen.getByRole('heading', { level: 2, name: 'Millennium Gold' })).toBeInTheDocument();
    expect(screen.getByText('Fatura corrente')).toBeInTheDocument();
    expect(screen.getByText('Próxima fatura')).toBeInTheDocument();
  });
});
