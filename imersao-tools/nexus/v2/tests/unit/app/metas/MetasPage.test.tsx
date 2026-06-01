import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { Goal } from '@/types/db';

/**
 * Nexus v2 — MetasPage tests (Story 4.5 — AC9/AC10/AC11)
 *
 * 3 estados de render (`react-component-test-criteria.md`):
 *   C1 — loading (useGoals === undefined) → skeleton.
 *   C2 — tab Activas → lista + "+ Nova meta".
 *   C3 — tab Alcançadas → re-subscreve useGoals('achieved'), sem "+ Nova meta".
 *
 * + AC10 (handlers): criar chama createGoal com current 0/status active;
 *   apagar com confirm; marcar alcançada (numeric) fixa current = target.
 *
 * Mocks: useGoals, repo goals, next/navigation.
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  useGoals: vi.fn(),
  createGoal: vi.fn(),
  getGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack }),
}));

vi.mock('@/hooks/useGoals', () => ({
  useGoals: (status?: string) => mocks.useGoals(status),
}));

vi.mock('@/lib/db/repos/goals', () => ({
  createGoal: (...args: unknown[]) => mocks.createGoal(...args),
  getGoal: (...args: unknown[]) => mocks.getGoal(...args),
  updateGoal: (...args: unknown[]) => mocks.updateGoal(...args),
  deleteGoal: (...args: unknown[]) => mocks.deleteGoal(...args),
}));

// Importação DEPOIS dos vi.mock (factory hoisting).
import MetasPage from '@/app/(app)/metas/page';

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    title: overrides.title ?? 'Ler 12 livros',
    description: overrides.description,
    type: overrides.type ?? 'numeric',
    target: overrides.target ?? 12,
    current: overrides.current ?? 3,
    deadline: overrides.deadline ?? null,
    status: overrides.status ?? 'active',
    milestones: overrides.milestones ?? [],
    progressLog: overrides.progressLog,
  };
}

describe('MetasPage (Story 4.5 / AC9)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.createGoal.mockResolvedValue(undefined);
    mocks.updateGoal.mockResolvedValue(undefined);
    mocks.deleteGoal.mockResolvedValue(undefined);
    mocks.getGoal.mockResolvedValue(undefined);
  });

  afterEach(() => cleanup());

  // ── C1 — loading ──
  it('C1 — loading: useGoals === undefined mostra skeleton', () => {
    mocks.useGoals.mockReturnValue(undefined);
    render(<MetasPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Metas' })).toBeInTheDocument();
    expect(screen.getByLabelText('A carregar metas')).toHaveAttribute('aria-busy', 'true');
  });

  // ── C2 — tab activas ──
  it('C2 — tab Activas: lista metas + botão "+ Nova meta"', () => {
    mocks.useGoals.mockReturnValue([makeGoal({ id: 'g1', title: 'Ler 12 livros' })]);
    render(<MetasPage />);
    expect(screen.getByText('Ler 12 livros')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Nova meta' })).toBeInTheDocument();
    // useGoals chamado com 'active' por default.
    expect(mocks.useGoals).toHaveBeenCalledWith('active');
  });

  // ── C3 — tab alcançadas ──
  it('C3 — tab Alcançadas: re-subscreve useGoals(achieved), sem "+ Nova meta"', () => {
    mocks.useGoals.mockReturnValue([]);
    render(<MetasPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Alcançadas' }));
    expect(mocks.useGoals).toHaveBeenCalledWith('achieved');
    expect(screen.queryByRole('button', { name: '+ Nova meta' })).not.toBeInTheDocument();
  });

  // ── AC10 — criar ──
  it('AC10 — criar: createGoal com current 0, status active, id gerado', async () => {
    mocks.useGoals.mockReturnValue([]);
    render(<MetasPage />);
    fireEvent.click(screen.getByRole('button', { name: '+ Nova meta' }));

    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: 'Correr 100km' } });
    fireEvent.change(screen.getByLabelText(/Alvo/), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));

    await waitFor(() => expect(mocks.createGoal).toHaveBeenCalledTimes(1));
    const goalArg = mocks.createGoal.mock.calls[0][0] as Goal;
    expect(goalArg.title).toBe('Correr 100km');
    expect(goalArg.target).toBe(100);
    expect(goalArg.current).toBe(0);
    expect(goalArg.status).toBe('active');
    expect(goalArg.milestones).toEqual([]);
    expect(typeof goalArg.id).toBe('string');
  });

  // ── AC8 — apagar com confirmação ──
  it('AC8 — apagar: confirm cancelado não apaga', () => {
    mocks.useGoals.mockReturnValue([makeGoal({ id: 'g1', title: 'Ler 12 livros' })]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<MetasPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar "Ler 12 livros"' }));
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('permanente'));
    expect(mocks.deleteGoal).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('AC8 — apagar confirmado chama deleteGoal', async () => {
    mocks.useGoals.mockReturnValue([makeGoal({ id: 'g1', title: 'Ler 12 livros' })]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<MetasPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar "Ler 12 livros"' }));
    await waitFor(() => expect(mocks.deleteGoal).toHaveBeenCalledWith('g1'));
    confirmSpy.mockRestore();
  });

  // ── AC10 — marcar alcançada via GoalView ──
  it('AC10 — marcar alcançada (numeric) fixa current = target via updateGoal', async () => {
    const goal = makeGoal({ id: 'g1', title: 'Ler 12 livros', type: 'numeric', current: 3, target: 12 });
    mocks.useGoals.mockReturnValue([goal]);
    mocks.getGoal.mockResolvedValue(goal);
    render(<MetasPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver "Ler 12 livros"' }));
    // Aguarda o GoalView abrir com o goal fresco.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Marcar como Alcançada/ })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Marcar como Alcançada/ }));

    await waitFor(() =>
      expect(mocks.updateGoal).toHaveBeenCalledWith('g1', { status: 'achieved', current: 12 }),
    );
  });
});
