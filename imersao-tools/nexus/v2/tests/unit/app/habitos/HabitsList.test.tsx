import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { Habit, HabitLog } from '@/types/db';
import { HabitsList } from '@/components/habitos/HabitsList';

/**
 * Nexus v2 — HabitsList tests (Story 4.2 — AC6/AC10)
 *
 * 4 estados de render (`react-component-test-criteria.md`):
 *   C1 — loading (habits === undefined) → skeleton.
 *   C2 — vazio (habits === []) → empty state com CTA.
 *   C3 — lista com hábitos → nomes/categorias/acções.
 *   C4 — hábito já no todayLogs → badge "Concluído hoje", marcar desactivado.
 */

let counter = 0;
function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: overrides.id ?? `habit-${++counter}`,
    name: overrides.name ?? 'Leitura',
    frequency: overrides.frequency ?? 'FREQ=DAILY',
    category: overrides.category ?? 'Pessoal',
    time: overrides.time,
    metric: overrides.metric,
    createdAt: overrides.createdAt ?? Date.now(),
    archivedAt: overrides.archivedAt,
  };
}

const noopHandlers = {
  onEdit: vi.fn(),
  onMarkDone: vi.fn(),
  onArchive: vi.fn(),
  onRestore: vi.fn(),
  onDelete: vi.fn(),
};

describe('HabitsList (Story 4.2 / AC6)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    counter = 0;
  });

  // ── C1 — loading ──
  it('C1 — loading: habits === undefined mostra skeleton (aria-busy)', () => {
    render(
      <HabitsList habits={undefined} todayLogs={undefined} variant="active" {...noopHandlers} />,
    );
    expect(screen.getByLabelText('A carregar hábitos')).toHaveAttribute('aria-busy', 'true');
  });

  // ── C2 — vazio ──
  it('C2 — vazio (active): habits === [] mostra empty state com CTA', () => {
    render(
      <HabitsList habits={[]} todayLogs={[]} variant="active" {...noopHandlers} />,
    );
    expect(screen.getByText(/sem hábitos/i)).toBeInTheDocument();
    expect(screen.getByText(/criar primeiro hábito/i)).toBeInTheDocument();
  });

  it('C2b — vazio (archived): mensagem sem CTA de criação', () => {
    render(
      <HabitsList habits={[]} todayLogs={[]} variant="archived" {...noopHandlers} />,
    );
    expect(screen.getByText(/sem hábitos arquivados/i)).toBeInTheDocument();
    expect(screen.queryByText(/criar primeiro hábito/i)).not.toBeInTheDocument();
  });

  // ── C3 — lista ──
  it('C3 — lista: renderiza nomes, categoria/frequência e botões de acção', () => {
    const habits = [
      makeHabit({ id: 'h1', name: 'Correr', category: 'Desporto', frequency: 'FREQ=WEEKLY' }),
      makeHabit({ id: 'h2', name: 'Ler', category: 'Pessoal', frequency: 'FREQ=DAILY', time: '21:00' }),
    ];
    render(
      <HabitsList habits={habits} todayLogs={[]} variant="active" {...noopHandlers} />,
    );
    expect(screen.getByText('Correr')).toBeInTheDocument();
    expect(screen.getByText('Ler')).toBeInTheDocument();
    expect(screen.getByText('Desporto')).toBeInTheDocument();
    expect(screen.getByText('21:00')).toBeInTheDocument();
    // Acções da variante active.
    expect(screen.getByRole('button', { name: 'Editar "Correr"' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Arquivar "Correr"' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apagar "Correr"' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar "Correr" como concluído hoje' })).toBeInTheDocument();
  });

  it('C3b — variant archived: mostra Restaurar e Apagar, sem Marcar concluído', () => {
    const habits = [makeHabit({ id: 'h1', name: 'Meditar', archivedAt: Date.now() })];
    render(
      <HabitsList habits={habits} todayLogs={[]} variant="archived" {...noopHandlers} />,
    );
    expect(screen.getByRole('button', { name: 'Restaurar "Meditar"' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apagar "Meditar"' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Marcar "Meditar" como concluído hoje' }),
    ).not.toBeInTheDocument();
  });

  // ── C4 — concluído hoje ──
  it('C4 — hábito no todayLogs mostra badge "Concluído hoje" e oculta o botão de marcar', () => {
    const habits = [makeHabit({ id: 'h1', name: 'Correr' })];
    const todayLogs: HabitLog[] = [{ id: 'log1', habitId: 'h1', date: '2026-05-29' }];
    render(
      <HabitsList habits={habits} todayLogs={todayLogs} variant="active" {...noopHandlers} />,
    );
    expect(screen.getByText('Concluído hoje')).toBeInTheDocument();
    expect(screen.getByTestId('habit-done-badge-h1')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Marcar "Correr" como concluído hoje' }),
    ).not.toBeInTheDocument();
  });

  it('C4b — botões disparam os callbacks correctos', () => {
    const habits = [makeHabit({ id: 'h1', name: 'Correr' })];
    render(
      <HabitsList habits={habits} todayLogs={[]} variant="active" {...noopHandlers} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Marcar "Correr" como concluído hoje' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar "Correr"' }));
    fireEvent.click(screen.getByRole('button', { name: 'Arquivar "Correr"' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar "Correr"' }));
    expect(noopHandlers.onMarkDone).toHaveBeenCalledWith(habits[0]);
    expect(noopHandlers.onEdit).toHaveBeenCalledWith(habits[0]);
    expect(noopHandlers.onArchive).toHaveBeenCalledWith(habits[0]);
    expect(noopHandlers.onDelete).toHaveBeenCalledWith(habits[0]);
  });

  // ── Story 4.3 / AC6 — acção "Ver heatmap" ──
  it('C5 — sem onShowHeatmap: NÃO renderiza o botão "Ver heatmap"', () => {
    const habits = [makeHabit({ id: 'h1', name: 'Correr' })];
    render(
      <HabitsList habits={habits} todayLogs={[]} variant="active" {...noopHandlers} />,
    );
    expect(
      screen.queryByRole('button', { name: 'Ver heatmap de "Correr"' }),
    ).not.toBeInTheDocument();
  });

  it('C5b — com onShowHeatmap: renderiza o botão e dispara o callback (active)', () => {
    const habits = [makeHabit({ id: 'h1', name: 'Correr' })];
    const onShowHeatmap = vi.fn();
    render(
      <HabitsList
        habits={habits}
        todayLogs={[]}
        variant="active"
        {...noopHandlers}
        onShowHeatmap={onShowHeatmap}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver heatmap de "Correr"' }));
    expect(onShowHeatmap).toHaveBeenCalledWith(habits[0]);
  });

  it('C5c — botão "Ver heatmap" aparece em arquivados e dispara o callback (leitura pura)', () => {
    const habits = [makeHabit({ id: 'h1', name: 'Meditar', archivedAt: Date.now() })];
    const onShowHeatmap = vi.fn();
    render(
      <HabitsList
        habits={habits}
        todayLogs={[]}
        variant="archived"
        {...noopHandlers}
        onShowHeatmap={onShowHeatmap}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Ver heatmap de "Meditar"' });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onShowHeatmap).toHaveBeenCalledWith(habits[0]);
  });

  // ── Story 4.4 / AC3 — registo por métrica ──
  it('M1 — hábito SEM metric mantém o botão "Marcar concluído" (sem alterar comportamento)', () => {
    const habits = [makeHabit({ id: 'h1', name: 'Correr' })]; // sem metric
    render(
      <HabitsList
        habits={habits}
        todayLogs={[]}
        variant="active"
        {...noopHandlers}
        onRegisterMetric={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Marcar "Correr" como concluído hoje' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('habit-register-metric-h1'),
    ).not.toBeInTheDocument();
  });

  it('M2 — hábito COM metric + onRegisterMetric: mostra "Registar {unit}" e dispara o callback', () => {
    const habits = [
      makeHabit({ id: 'h1', name: 'Correr', metric: { unit: 'km', target: 10 } }),
    ];
    const onRegisterMetric = vi.fn();
    render(
      <HabitsList
        habits={habits}
        todayLogs={[]}
        variant="active"
        {...noopHandlers}
        onRegisterMetric={onRegisterMetric}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Registar km de "Correr"' });
    expect(btn).toBeInTheDocument();
    // O botão de "Marcar concluído" é substituído.
    expect(
      screen.queryByRole('button', { name: 'Marcar "Correr" como concluído hoje' }),
    ).not.toBeInTheDocument();
    fireEvent.click(btn);
    expect(onRegisterMetric).toHaveBeenCalledWith(habits[0]);
  });

  it('M3 — hábito COM metric e log de hoje COM value: badge "Registado hoje (valor unit)"', () => {
    const habits = [
      makeHabit({ id: 'h1', name: 'Correr', metric: { unit: 'km', target: 10 } }),
    ];
    const todayLogs: HabitLog[] = [
      { id: 'log1', habitId: 'h1', date: '2026-05-31', value: 7 },
    ];
    render(
      <HabitsList
        habits={habits}
        todayLogs={todayLogs}
        variant="active"
        {...noopHandlers}
        onRegisterMetric={vi.fn()}
      />,
    );
    expect(screen.getByTestId('habit-metric-badge-h1')).toBeInTheDocument();
    expect(screen.getByText(/Registado hoje \(7 km\)/)).toBeInTheDocument();
    // Sem botão de registo quando já registado.
    expect(
      screen.queryByRole('button', { name: 'Registar km de "Correr"' }),
    ).not.toBeInTheDocument();
  });

  it('M4 — hábito COM metric e log de hoje SEM value: ainda mostra "Registar {unit}"', () => {
    const habits = [
      makeHabit({ id: 'h1', name: 'Correr', metric: { unit: 'km', target: 10 } }),
    ];
    const todayLogs: HabitLog[] = [
      { id: 'log1', habitId: 'h1', date: '2026-05-31' }, // sem value
    ];
    render(
      <HabitsList
        habits={habits}
        todayLogs={todayLogs}
        variant="active"
        {...noopHandlers}
        onRegisterMetric={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Registar km de "Correr"' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('habit-metric-badge-h1'),
    ).not.toBeInTheDocument();
  });
});
