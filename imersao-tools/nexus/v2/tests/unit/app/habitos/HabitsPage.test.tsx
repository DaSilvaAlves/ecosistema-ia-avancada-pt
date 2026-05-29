import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { Habit, HabitLog } from '@/types/db';

/**
 * Nexus v2 — HabitosPage tests (Story 4.2 — AC9/AC10)
 *
 * 3 estados de render (`react-component-test-criteria.md`):
 *   C1 — loading (useHabits === undefined) → skeleton.
 *   C2 — tab Activos → lista de hábitos activos.
 *   C3 — tab Arquivados → hábitos arquivados, sem "Marcar concluído".
 *
 * + idempotência do registo concluído (AC7): com log já existente, NÃO chama
 *   createHabitLog (prova de comportamento real do handler).
 *
 * Mocks: useHabits, repos (habits + habit-logs), next/navigation. O
 * `useLiveQuery` (todayLogs) é mockado para devolver os logs controlados.
 */

const mocks = vi.hoisted(() => ({
  routerBack: vi.fn(),
  useHabits: vi.fn(),
  liveLogs: vi.fn(),
  listHabitLogsByHabit: vi.fn(),
  createHabitLog: vi.fn(),
  archiveHabit: vi.fn(),
  restoreHabit: vi.fn(),
  deleteHabit: vi.fn(),
  createHabit: vi.fn(),
  updateHabit: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: mocks.routerBack }),
}));

vi.mock('@/hooks/useHabits', () => ({
  useHabits: () => mocks.useHabits(),
}));

vi.mock('dexie-react-hooks', () => ({
  // A page usa useLiveQuery para os logs de hoje — devolvemos o valor controlado.
  useLiveQuery: () => mocks.liveLogs(),
}));

vi.mock('@/lib/db/repos/habit-logs', () => ({
  listHabitLogsByHabit: (...args: unknown[]) => mocks.listHabitLogsByHabit(...args),
  createHabitLog: (...args: unknown[]) => mocks.createHabitLog(...args),
}));

vi.mock('@/lib/db/repos/habits', () => ({
  createHabit: (...args: unknown[]) => mocks.createHabit(...args),
  updateHabit: (...args: unknown[]) => mocks.updateHabit(...args),
  archiveHabit: (...args: unknown[]) => mocks.archiveHabit(...args),
  restoreHabit: (...args: unknown[]) => mocks.restoreHabit(...args),
  deleteHabit: (...args: unknown[]) => mocks.deleteHabit(...args),
}));

// Importação DEPOIS dos vi.mock (factory hoisting).
import HabitosPage from '@/app/(app)/habitos/page';

let counter = 0;
function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: overrides.id ?? `habit-${++counter}`,
    name: overrides.name ?? 'Leitura',
    frequency: overrides.frequency ?? 'FREQ=DAILY',
    category: overrides.category ?? 'Pessoal',
    time: overrides.time,
    createdAt: overrides.createdAt ?? Date.now(),
    archivedAt: overrides.archivedAt,
  };
}

describe('HabitosPage (Story 4.2 / AC9)', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((m) => m.mockReset());
    mocks.liveLogs.mockReturnValue([]);
    mocks.listHabitLogsByHabit.mockResolvedValue([]);
    counter = 0;
  });

  afterEach(() => cleanup());

  // ── C1 — loading ──
  it('C1 — loading: useHabits === undefined mostra skeleton', () => {
    mocks.useHabits.mockReturnValue(undefined);
    mocks.liveLogs.mockReturnValue(undefined);

    render(<HabitosPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Hábitos' })).toBeInTheDocument();
    expect(screen.getByLabelText('A carregar hábitos')).toHaveAttribute('aria-busy', 'true');
  });

  // ── C2 — tab activos ──
  it('C2 — tab Activos: lista hábitos com archivedAt undefined + botão "+ Novo hábito"', () => {
    mocks.useHabits.mockReturnValue([
      makeHabit({ id: 'a1', name: 'Correr' }),
      makeHabit({ id: 'a2', name: 'Arquivado', archivedAt: Date.now() }),
    ]);

    render(<HabitosPage />);

    expect(screen.getByText('Correr')).toBeInTheDocument();
    // O arquivado NÃO aparece na tab activos.
    expect(screen.queryByText('Arquivado')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ Novo hábito' })).toBeInTheDocument();
  });

  // ── C3 — tab arquivados ──
  it('C3 — tab Arquivados: mostra só arquivados, sem "Marcar concluído" nem "+ Novo hábito"', () => {
    mocks.useHabits.mockReturnValue([
      makeHabit({ id: 'a1', name: 'Correr' }),
      makeHabit({ id: 'a2', name: 'Meditar', archivedAt: Date.now() }),
    ]);

    render(<HabitosPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Arquivados' }));

    expect(screen.getByText('Meditar')).toBeInTheDocument();
    expect(screen.queryByText('Correr')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Marcar "Meditar" como concluído hoje' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restaurar "Meditar"' })).toBeInTheDocument();
    // Botão "+ Novo hábito" só na tab activos.
    expect(screen.queryByRole('button', { name: '+ Novo hábito' })).not.toBeInTheDocument();
  });

  // ── AC7 — idempotência ──
  it('AC7 — marcar concluído cria HabitLog quando não existe ainda', async () => {
    mocks.useHabits.mockReturnValue([makeHabit({ id: 'a1', name: 'Correr' })]);
    mocks.listHabitLogsByHabit.mockResolvedValue([]); // sem log hoje
    mocks.createHabitLog.mockResolvedValue(undefined);

    render(<HabitosPage />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Marcar "Correr" como concluído hoje' }),
    );

    await waitFor(() => expect(mocks.createHabitLog).toHaveBeenCalledTimes(1));
    const arg = mocks.createHabitLog.mock.calls[0][0] as HabitLog;
    expect(arg.habitId).toBe('a1');
    expect(arg.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD
    expect(arg.value).toBeUndefined();
  });

  it('AC7 — idempotente: com log já existente NÃO chama createHabitLog', async () => {
    mocks.useHabits.mockReturnValue([makeHabit({ id: 'a1', name: 'Correr' })]);
    // Já existe um log para (a1, hoje).
    mocks.listHabitLogsByHabit.mockResolvedValue([
      { id: 'log1', habitId: 'a1', date: '2026-05-29' },
    ]);

    render(<HabitosPage />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Marcar "Correr" como concluído hoje' }),
    );

    await waitFor(() =>
      expect(screen.getByText(/já estava registado hoje/i)).toBeInTheDocument(),
    );
    expect(mocks.createHabitLog).not.toHaveBeenCalled();
  });

  // ── AC8 — confirm de apagar ──
  it('AC8 — apagar pede confirmação que menciona arquivar; cancelar não apaga', () => {
    mocks.useHabits.mockReturnValue([makeHabit({ id: 'a1', name: 'Correr' })]);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<HabitosPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Apagar "Correr"' }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('Arquivar'),
    );
    expect(mocks.deleteHabit).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
