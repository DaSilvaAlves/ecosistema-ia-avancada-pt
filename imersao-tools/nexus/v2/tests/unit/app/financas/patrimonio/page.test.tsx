import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import type { Account } from '@/types/db';

/**
 * Nexus v2 — PatrimonioPage tests (Story 3.9 / FR20)
 *
 * 5 cenários a cobrir a vista `/financas/patrimonio` enquanto componente
 * read-only que consome o hook `useAccounts` (Story 3.1). Adicionado em
 * resposta ao CR Iter 1 actionable Major: "sem unit tests para
 * PatrimonioPage" (`patrimonio/page.tsx:438`).
 *
 * Cobertura:
 *   - C1: Loading state (`useAccounts === undefined`) → mensagem "A carregar
 *         contas…" e ausência de `TotalKpi` e secções.
 *   - C2: Empty state (`useAccounts === []`) → `TotalKpi` com zeros e link
 *         para `/financas`.
 *   - C3: Content state (4 contas, 3 tipos: checking/savings/cash) → `TotalKpi`
 *         com soma correcta, contagem plural, secção por tipo, contas
 *         individuais visíveis.
 *   - C4: Toggle expansão de grupo → `aria-expanded` flip de `true` → `false`
 *         e accounts dentro do grupo desaparecem da DOM.
 *   - C5: Overdraft badge → conta com `balance < 0` recebe badge "Descoberto".
 *
 * Padrão: mock de `@/hooks/useAccounts` (zero acesso a Dexie real — a page é
 * pure-view) + mock de `next/navigation` para evitar real `useRouter`.
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  routerPush: vi.fn(),
  useAccounts: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack, push: mocks.routerPush }),
}));

vi.mock('@/hooks/useAccounts', () => ({
  useAccounts: () => mocks.useAccounts(),
}));

// Importação tem de vir DEPOIS dos `vi.mock` (factory hoisting do Vitest).
import PatrimonioPage from '@/app/(app)/financas/patrimonio/page';

let accountIdCounter = 0;

function makeAccount(partial: Partial<Account> & Pick<Account, 'balance' | 'type'>): Account {
  return {
    id: partial.id ?? `acc-${++accountIdCounter}`,
    name: partial.name ?? 'Conta',
    type: partial.type,
    balance: partial.balance,
    createdAt: partial.createdAt ?? Date.now(),
  };
}

describe('PatrimonioPage (Story 3.9 / FR20)', () => {
  beforeEach(() => {
    mocks.routerBack.mockClear();
    mocks.routerPush.mockClear();
    mocks.useAccounts.mockReset();
    accountIdCounter = 0;
  });

  afterEach(() => {
    cleanup();
  });

  // ─────────────────────────────────────────────────────────────────
  // C1 — Loading state
  // ─────────────────────────────────────────────────────────────────
  it('C1 — Loading: mostra "A carregar contas…" e oculta KPI/grupos quando useAccounts === undefined', () => {
    mocks.useAccounts.mockReturnValue(undefined);

    render(<PatrimonioPage />);

    expect(screen.getByText(/a carregar contas/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Total do Património')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Património' })).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // C2 — Empty state
  // ─────────────────────────────────────────────────────────────────
  it('C2 — Empty: mostra TotalKpi com zeros e link para /financas quando useAccounts === []', () => {
    mocks.useAccounts.mockReturnValue([]);

    render(<PatrimonioPage />);

    expect(screen.getByLabelText('Total do Património')).toBeInTheDocument();
    expect(screen.getByText('0 contas')).toBeInTheDocument();
    expect(screen.getByText(/sem contas registadas/i)).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Finanças' });
    expect(link).toHaveAttribute('href', '/financas');
  });

  // ─────────────────────────────────────────────────────────────────
  // C3 — Content state (multi-grupo)
  // ─────────────────────────────────────────────────────────────────
  it('C3 — Content: soma KPI, contagem plural, 3 grupos (checking/savings/cash) com contas individuais visíveis', () => {
    const accounts: Account[] = [
      makeAccount({ id: 'a1', name: 'Conta Activos', type: 'checking', balance: 100000 }),
      makeAccount({ id: 'a2', name: 'Conta Suplementar', type: 'checking', balance: 50000 }),
      makeAccount({ id: 'a3', name: 'Poupança Reformas', type: 'savings', balance: 200000 }),
      makeAccount({ id: 'a4', name: 'Numerário Caixa', type: 'cash', balance: 25000 }),
    ];
    mocks.useAccounts.mockReturnValue(accounts);

    render(<PatrimonioPage />);

    // Total = 100000 + 50000 + 200000 + 25000 = 375000 cêntimos = €3.750,00
    const kpiSection = screen.getByLabelText('Total do Património');
    expect(within(kpiSection).getByText(/3\.750,00/)).toBeInTheDocument();
    expect(within(kpiSection).getByText('4 contas')).toBeInTheDocument();

    // 3 grupos esperados: Conta à ordem (checking, subtotal 150000), Poupança
    // (savings, subtotal 200000) e Dinheiro (cash, subtotal 25000)
    expect(screen.getByRole('button', { name: /Conta à ordem/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Poupança/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dinheiro/ })).toBeInTheDocument();

    // Accounts individuais visíveis (grupos expandidos por defeito — A4)
    expect(screen.getByText('Conta Activos')).toBeInTheDocument();
    expect(screen.getByText('Conta Suplementar')).toBeInTheDocument();
    expect(screen.getByText('Poupança Reformas')).toBeInTheDocument();
    expect(screen.getByText('Numerário Caixa')).toBeInTheDocument();

    // Nenhuma badge "Descoberto" — todas as contas têm balance >= 0
    expect(screen.queryByText('Descoberto')).not.toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // C4 — Toggle expansão de grupo
  // ─────────────────────────────────────────────────────────────────
  it('C4 — Toggle: clicar header do grupo flips aria-expanded e oculta accounts internas', () => {
    const accounts: Account[] = [
      makeAccount({ id: 'a1', name: 'Conta Única', type: 'checking', balance: 100000 }),
    ];
    mocks.useAccounts.mockReturnValue(accounts);

    render(<PatrimonioPage />);

    const groupButton = screen.getByRole('button', { name: /Conta à ordem/ });
    expect(groupButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Conta Única')).toBeInTheDocument();

    fireEvent.click(groupButton);

    expect(groupButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Conta Única')).not.toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────────
  // C5 — Overdraft badge
  // ─────────────────────────────────────────────────────────────────
  it('C5 — Overdraft: conta com balance negativo recebe badge "Descoberto"', () => {
    const accounts: Account[] = [
      makeAccount({ id: 'a1', name: 'Conta Saldada', type: 'checking', balance: 50000 }),
      makeAccount({ id: 'a2', name: 'Conta a Descoberto', type: 'checking', balance: -30000 }),
    ];
    mocks.useAccounts.mockReturnValue(accounts);

    render(<PatrimonioPage />);

    // Badge "Descoberto" aparece exactamente uma vez, junto à conta correcta
    const badges = screen.getAllByText('Descoberto');
    expect(badges).toHaveLength(1);

    // A badge está no mesmo `<li>` da conta a descoberto, não da conta saldada
    const overdraftRow = screen.getByText('Conta a Descoberto').closest('li');
    expect(overdraftRow).not.toBeNull();
    expect(within(overdraftRow as HTMLElement).getByText('Descoberto')).toBeInTheDocument();

    const healthyRow = screen.getByText('Conta Saldada').closest('li');
    expect(healthyRow).not.toBeNull();
    expect(within(healthyRow as HTMLElement).queryByText('Descoberto')).not.toBeInTheDocument();
  });
});
