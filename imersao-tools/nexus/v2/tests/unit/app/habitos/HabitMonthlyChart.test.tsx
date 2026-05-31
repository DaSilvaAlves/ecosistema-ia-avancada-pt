import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { MonthlyMetricSummary } from '@/lib/habitos/metrics';
import { HabitMonthlyChart } from '@/components/habitos/HabitMonthlyChart';

/**
 * Nexus v2 — HabitMonthlyChart tests (Story 4.4 — AC9)
 *
 * 2 estados de render (fronteira — `react-component-test-criteria.md`):
 *   - Vazio (todos os meses a 0): mensagem "Sem registos".
 *   - Conteúdo: barras com aria-label correctos.
 */

function makeMonth(
  monthLabel: string,
  totalValue: number,
  daysCompleted: number,
): MonthlyMetricSummary {
  return { monthLabel, totalValue, daysCompleted, bestDayValue: totalValue };
}

describe('HabitMonthlyChart (Story 4.4 / AC9)', () => {
  afterEach(() => cleanup());

  it('vazio: todos os meses a 0 → mensagem "Sem registos", sem barras', () => {
    const months = [
      makeMonth('Abr 2026', 0, 0),
      makeMonth('Mai 2026', 0, 0),
    ];
    render(<HabitMonthlyChart months={months} unit="km" record={0} />);
    expect(screen.getByText(/Sem registos de métricas ainda/)).toBeInTheDocument();
    expect(screen.queryByTestId('habit-monthly-chart')).not.toBeInTheDocument();
  });

  it('conteúdo: barras com aria-label (mês, valor, dias) e mês actual realçado', () => {
    const months = [
      makeMonth('Abr 2026', 20, 4),
      makeMonth('Mai 2026', 35, 7),
    ];
    render(<HabitMonthlyChart months={months} unit="km" record={35} />);
    expect(screen.getByTestId('habit-monthly-chart')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Abr 2026: 20 km, 4 dias'),
    ).toBeInTheDocument();
    // Mês actual = último da janela → realçado (data-current).
    const maio = screen.getByLabelText('Mai 2026: 35 km, 7 dias');
    expect(maio).toHaveAttribute('data-current', 'true');
  });

  it('conteúdo: valor não-inteiro formatado em PT-PT (vírgula)', () => {
    const months = [makeMonth('Mai 2026', 7.5, 1)];
    render(<HabitMonthlyChart months={months} unit="km" record={7.5} />);
    expect(
      screen.getByLabelText('Mai 2026: 7,5 km, 1 dia'),
    ).toBeInTheDocument();
  });
});
