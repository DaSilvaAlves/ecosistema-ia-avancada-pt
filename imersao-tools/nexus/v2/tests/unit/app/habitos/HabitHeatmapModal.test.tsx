import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { Habit, HabitLog } from '@/types/db';

/**
 * Nexus v2 — HabitHeatmapModal tests (Story 4.3 — AC9)
 *
 * Teste de integração do wrapper de fetch: o modal abre, renderiza o
 * `HabitHeatmap` com o nome do hábito no cabeçalho, e Escape/botão fecham.
 * `useHabitLogs` é mockado (padrão de mock de hooks da Story 4.2).
 */

const mocks = vi.hoisted(() => ({
  useHabitLogs: vi.fn(),
}));

vi.mock('@/hooks/useHabitLogs', () => ({
  useHabitLogs: (...args: unknown[]) => mocks.useHabitLogs(...args),
}));

// Importação DEPOIS do vi.mock (factory hoisting).
import { HabitHeatmapModal } from '@/components/habitos/HabitHeatmapModal';

const habit: Habit = {
  id: 'h1',
  name: 'Leitura diária',
  frequency: 'FREQ=DAILY',
  category: 'Pessoal',
  createdAt: 0,
};

const sampleLogs: HabitLog[] = [{ id: 'l1', habitId: 'h1', date: '2026-03-10' }];

describe('HabitHeatmapModal (Story 4.3 / AC9)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('abre com role=dialog e o nome do hábito no cabeçalho', () => {
    mocks.useHabitLogs.mockReturnValue(sampleLogs);
    render(<HabitHeatmapModal habit={habit} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Heatmap — Leitura diária')).toBeInTheDocument();
  });

  it('renderiza o HabitHeatmap (delega os logs do hook)', () => {
    mocks.useHabitLogs.mockReturnValue(sampleLogs);
    render(<HabitHeatmapModal habit={habit} onClose={vi.fn()} />);
    expect(screen.getByTestId('habit-heatmap')).toBeInTheDocument();
    expect(screen.getByLabelText('10/03/2026: concluído')).toBeInTheDocument();
  });

  it('mostra skeleton enquanto o hook devolve undefined (loading)', () => {
    mocks.useHabitLogs.mockReturnValue(undefined);
    render(<HabitHeatmapModal habit={habit} onClose={vi.fn()} />);
    expect(screen.getByTestId('habit-heatmap-skeleton')).toBeInTheDocument();
  });

  it('Escape chama onClose', () => {
    mocks.useHabitLogs.mockReturnValue(sampleLogs);
    const onClose = vi.fn();
    render(<HabitHeatmapModal habit={habit} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('botão "Fechar heatmap" chama onClose', () => {
    mocks.useHabitLogs.mockReturnValue(sampleLogs);
    const onClose = vi.fn();
    render(<HabitHeatmapModal habit={habit} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Fechar heatmap'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
