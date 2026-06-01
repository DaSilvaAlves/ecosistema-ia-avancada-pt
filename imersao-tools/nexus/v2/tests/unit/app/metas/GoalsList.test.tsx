import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { GoalsList } from '@/components/metas/GoalsList';
import type { Goal } from '@/types/db';

/**
 * Nexus v2 — GoalsList tests (Story 4.5 — AC6/AC11)
 *
 * 4 estados de render (`react-component-test-criteria.md` — teste obrigatório):
 *   C1 — loading (goals === undefined) → skeleton.
 *   C2 — vazio (goals.length === 0) → empty state com CTA.
 *   C3 — lista com metas activas → título, progress bar, acções.
 *   C4 — meta alcançada → progress bar 100% + badge "Alcançada".
 */

const TODAY = '2026-06-01';

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

const noopHandlers = {
  onCreateFirst: vi.fn(),
  onView: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
};

describe('GoalsList (Story 4.5 / AC6)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── C1 — loading ──
  it('C1 — loading: goals === undefined mostra skeleton', () => {
    render(<GoalsList goals={undefined} todayISO={TODAY} {...noopHandlers} />);
    expect(screen.getByLabelText('A carregar metas')).toHaveAttribute('aria-busy', 'true');
  });

  // ── C2 — vazio ──
  it('C2 — vazio: empty state com CTA "Criar primeira meta"', () => {
    render(<GoalsList goals={[]} todayISO={TODAY} {...noopHandlers} />);
    const cta = screen.getByRole('button', { name: 'Criar primeira meta' });
    expect(cta).toBeInTheDocument();
    fireEvent.click(cta);
    expect(noopHandlers.onCreateFirst).toHaveBeenCalledTimes(1);
  });

  // ── C3 — lista ──
  it('C3 — lista: mostra título, progress bar e acções', () => {
    render(
      <GoalsList
        goals={[makeGoal({ id: 'g1', title: 'Ler 12 livros', current: 6, target: 12 })]}
        todayISO={TODAY}
        {...noopHandlers}
      />,
    );
    expect(screen.getByText('Ler 12 livros')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByRole('button', { name: 'Ver "Ler 12 livros"' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar "Ler 12 livros"' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apagar "Ler 12 livros"' })).toBeInTheDocument();
  });

  it('C3b — clicar Ver/Editar/Apagar chama o handler correspondente', () => {
    const goal = makeGoal({ id: 'g1', title: 'Meta X' });
    render(<GoalsList goals={[goal]} todayISO={TODAY} {...noopHandlers} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver "Meta X"' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar "Meta X"' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar "Meta X"' }));
    expect(noopHandlers.onView).toHaveBeenCalledWith(goal);
    expect(noopHandlers.onEdit).toHaveBeenCalledWith(goal);
    expect(noopHandlers.onDelete).toHaveBeenCalledWith(goal);
  });

  // ── C4 — meta alcançada ──
  it('C4 — meta alcançada: progress bar 100% e badge "Alcançada"', () => {
    render(
      <GoalsList
        goals={[makeGoal({ id: 'g1', title: 'Concluída', current: 12, target: 12, status: 'achieved' })]}
        todayISO={TODAY}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Alcançada')).toBeInTheDocument();
  });
});
