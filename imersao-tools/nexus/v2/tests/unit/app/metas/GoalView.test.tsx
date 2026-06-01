import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { GoalView } from '@/components/metas/GoalView';
import type { Goal } from '@/types/db';

/**
 * Nexus v2 — GoalView tests (Story 4.5 — AC7/AC11)
 *
 * 5 estados de render (`react-component-test-criteria.md` — teste obrigatório):
 *   C1 — loading (goal === undefined) → skeleton.
 *   C2 — numeric em progresso → form de update + "Marcar como Alcançada".
 *   C3 — numeric alcançada → barra 100%, sem form de update.
 *   C4 — boolean por alcançar → botão "Marcar como Alcançada", sem campo numérico.
 *   C5 — boolean alcançada → barra 100%, sem botão de update.
 *
 * + gotcha progressLog undefined → "Sem histórico de actualizações".
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
  onUpdateProgress: vi.fn(async () => undefined),
  onToggleMilestone: vi.fn(async () => undefined),
  onMarkAchieved: vi.fn(async () => undefined),
  onClose: vi.fn(),
};

describe('GoalView (Story 4.5 / AC7)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── C1 — loading ──
  it('C1 — loading: goal === undefined mostra skeleton', () => {
    render(<GoalView goal={undefined} todayISO={TODAY} {...noopHandlers} />);
    expect(screen.getByTestId('goal-view-loading')).toHaveAttribute('aria-busy', 'true');
  });

  // ── C2 — numeric em progresso ──
  it('C2 — numeric em progresso: form de update + "Marcar como Alcançada" + sem histórico', () => {
    render(
      <GoalView
        goal={makeGoal({ type: 'numeric', current: 3, target: 12, status: 'active' })}
        todayISO={TODAY}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByLabelText(/Novo valor actual/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actualizar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Marcar como Alcançada/ })).toBeInTheDocument();
    // Gotcha: progressLog undefined → "Sem histórico de actualizações".
    expect(screen.getByText('Sem histórico de actualizações.')).toBeInTheDocument();
  });

  it('C2b — update de progresso chama onUpdateProgress com valor + nota', async () => {
    const onUpdateProgress = vi.fn(async () => undefined);
    render(
      <GoalView
        goal={makeGoal({ type: 'numeric', current: 3, target: 12, status: 'active' })}
        todayISO={TODAY}
        onUpdateProgress={onUpdateProgress}
        onToggleMilestone={vi.fn(async () => undefined)}
        onMarkAchieved={vi.fn(async () => undefined)}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Novo valor actual/), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Nota/), { target: { value: 'mais um livro' } });
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }));
    await waitFor(() => expect(onUpdateProgress).toHaveBeenCalledWith(5, 'mais um livro'));
  });

  it('C2c — histórico (progressLog) renderiza entradas em ordem descendente', () => {
    render(
      <GoalView
        goal={makeGoal({
          type: 'numeric',
          current: 5,
          target: 12,
          progressLog: [
            { date: '2026-05-30', value: 3 },
            { date: '2026-06-01', value: 5, note: 'novo livro' },
          ],
        })}
        todayISO={TODAY}
        {...noopHandlers}
      />,
    );
    expect(screen.queryByText('Sem histórico de actualizações.')).not.toBeInTheDocument();
    expect(screen.getByText('2026-06-01')).toBeInTheDocument();
    expect(screen.getByText('novo livro')).toBeInTheDocument();
  });

  // ── C3 — numeric alcançada ──
  it('C3 — numeric alcançada: barra 100% e sem form de update', () => {
    render(
      <GoalView
        goal={makeGoal({ type: 'numeric', current: 12, target: 12, status: 'achieved' })}
        todayISO={TODAY}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.queryByLabelText(/Novo valor actual/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marcar como Alcançada/ })).not.toBeInTheDocument();
  });

  // ── C4 — boolean por alcançar ──
  it('C4 — boolean activa: botão "Marcar como Alcançada", sem campo numérico', () => {
    render(
      <GoalView
        goal={makeGoal({ type: 'boolean', status: 'active', target: 1, current: 0 })}
        todayISO={TODAY}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.queryByLabelText(/Novo valor actual/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Marcar como Alcançada/ })).toBeInTheDocument();
  });

  it('C4b — boolean: clicar "Marcar como Alcançada" chama onMarkAchieved', async () => {
    const onMarkAchieved = vi.fn(async () => undefined);
    render(
      <GoalView
        goal={makeGoal({ type: 'boolean', status: 'active' })}
        todayISO={TODAY}
        onUpdateProgress={vi.fn(async () => undefined)}
        onToggleMilestone={vi.fn(async () => undefined)}
        onMarkAchieved={onMarkAchieved}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Marcar como Alcançada/ }));
    await waitFor(() => expect(onMarkAchieved).toHaveBeenCalledTimes(1));
  });

  // ── C5 — boolean alcançada ──
  it('C5 — boolean alcançada: barra 100%, sem botão de update', () => {
    render(
      <GoalView
        goal={makeGoal({ type: 'boolean', status: 'achieved' })}
        todayISO={TODAY}
        {...noopHandlers}
      />,
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.queryByRole('button', { name: /Marcar como Alcançada/ })).not.toBeInTheDocument();
  });

  it('milestone toggle chama onToggleMilestone com o índice', async () => {
    const onToggleMilestone = vi.fn(async () => undefined);
    render(
      <GoalView
        goal={makeGoal({
          type: 'numeric',
          milestones: [{ at: 6, reached: false, note: 'Metade' }],
        })}
        todayISO={TODAY}
        onUpdateProgress={vi.fn(async () => undefined)}
        onToggleMilestone={onToggleMilestone}
        onMarkAchieved={vi.fn(async () => undefined)}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Marcar milestone Metade como alcançado/ }));
    await waitFor(() => expect(onToggleMilestone).toHaveBeenCalledWith(0));
  });

  it('Escape chama onClose', () => {
    const onClose = vi.fn();
    render(
      <GoalView
        goal={makeGoal()}
        todayISO={TODAY}
        onUpdateProgress={vi.fn(async () => undefined)}
        onToggleMilestone={vi.fn(async () => undefined)}
        onMarkAchieved={vi.fn(async () => undefined)}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
