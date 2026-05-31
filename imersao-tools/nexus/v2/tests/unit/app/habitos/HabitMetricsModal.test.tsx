import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import type { Habit, HabitLog } from '@/types/db';
import { HabitMetricsModal } from '@/components/habitos/HabitMetricsModal';

/**
 * Nexus v2 — HabitMetricsModal tests (Story 4.4 — AC8)
 *
 * 4 estados de render (`react-component-test-criteria.md` — obrigatório):
 *   C1 — loading (allLogs === undefined) → skeleton.
 *   C2 — sem histórico (allLogs sem value) → formulário aberto, recordes a 0.
 *   C3 — com histórico → evolução (chart) + recordes preenchidos + formulário.
 *   C4 — já registado hoje → campo desactivado com o valor; recordes visíveis.
 */

const TODAY = '2026-05-31';

const habit: Habit = {
  id: 'h1',
  name: 'Correr',
  frequency: 'FREQ=DAILY',
  category: 'Desporto',
  metric: { unit: 'km', target: 10 },
  createdAt: Date.now(),
};

function renderModal(overrides: {
  allLogs?: HabitLog[];
  todayLogs?: HabitLog[];
  onRegister?: (value: number) => Promise<void>;
}): { onRegister: (value: number) => Promise<void>; onClose: () => void } {
  const onRegister = overrides.onRegister ?? vi.fn().mockResolvedValue(undefined);
  const onClose = vi.fn();
  render(
    <HabitMetricsModal
      habit={habit}
      todayLogs={overrides.todayLogs ?? []}
      allLogs={overrides.allLogs}
      todayISO={TODAY}
      onClose={onClose}
      onRegister={onRegister}
    />,
  );
  return { onRegister, onClose };
}

describe('HabitMetricsModal (Story 4.4 / AC8)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ── C1 — loading ──
  it('C1 — loading: allLogs === undefined mostra skeleton (aria-busy)', () => {
    renderModal({ allLogs: undefined });
    expect(screen.getByTestId('habit-metrics-skeleton')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  // ── C2 — sem histórico ──
  it('C2 — sem histórico (allLogs = []): formulário aberto + recordes a 0', () => {
    renderModal({ allLogs: [] });
    expect(screen.getByLabelText('Valor em km a registar hoje')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Registar' })).toBeInTheDocument();
    // Recordes a zero.
    expect(screen.getByTestId('record-best-day')).toHaveTextContent('0 km');
    expect(screen.getByTestId('record-best-month')).toHaveTextContent('0 km');
    // Estado vazio do chart.
    expect(screen.getByText(/Sem registos de métricas ainda/)).toBeInTheDocument();
  });

  // ── C3 — com histórico ──
  it('C3 — com histórico: evolução renderizada + recordes preenchidos + formulário', () => {
    const allLogs: HabitLog[] = [
      { id: 'l1', habitId: 'h1', date: '2026-03-10', value: 12 },
      { id: 'l2', habitId: 'h1', date: '2026-04-01', value: 15 },
    ];
    renderModal({ allLogs });
    // Chart presente.
    expect(screen.getByTestId('habit-monthly-chart')).toBeInTheDocument();
    // Recordes preenchidos (melhor dia 15 km em 01/04/2026).
    expect(screen.getByTestId('record-best-day')).toHaveTextContent('15 km');
    expect(screen.getByTestId('record-best-day')).toHaveTextContent('01/04/2026');
    // Formulário disponível (não registou hoje).
    expect(screen.getByLabelText('Valor em km a registar hoje')).toBeInTheDocument();
  });

  it('C3b — submeter valor válido chama onRegister; valor inválido bloqueia', async () => {
    const onRegister = vi.fn().mockResolvedValue(undefined);
    renderModal({ allLogs: [], onRegister });
    const input = screen.getByLabelText('Valor em km a registar hoje');

    // Valor inválido (0) → erro, sem chamar onRegister.
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registar' }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(onRegister).not.toHaveBeenCalled();

    // Valor válido → chama onRegister com o número.
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registar' }));
    await waitFor(() => expect(onRegister).toHaveBeenCalledWith(8));
  });

  it('C3c — valor com vírgula decimal (PT-PT) é parseado correctamente', async () => {
    const onRegister = vi.fn().mockResolvedValue(undefined);
    renderModal({ allLogs: [], onRegister });
    const input = screen.getByLabelText('Valor em km a registar hoje');
    fireEvent.change(input, { target: { value: '7,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registar' }));
    await waitFor(() => expect(onRegister).toHaveBeenCalledWith(7.5));
  });

  // ── C4 — já registado hoje ──
  it('C4 — log de hoje com value: estado "Registado hoje" sem formulário; recordes visíveis', () => {
    const today: HabitLog[] = [
      { id: 'today', habitId: 'h1', date: TODAY, value: 9 },
    ];
    renderModal({ allLogs: today, todayLogs: today });
    expect(screen.getByTestId('metrics-registered-today')).toHaveTextContent(
      'Registado hoje: 9 km',
    );
    // Sem campo de registo.
    expect(
      screen.queryByLabelText('Valor em km a registar hoje'),
    ).not.toBeInTheDocument();
    // Recordes continuam visíveis.
    expect(screen.getByTestId('record-best-day')).toHaveTextContent('9 km');
  });
});
