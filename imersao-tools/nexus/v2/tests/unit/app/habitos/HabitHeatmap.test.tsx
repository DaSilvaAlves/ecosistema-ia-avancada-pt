import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { HabitLog } from '@/types/db';
import { HabitHeatmap } from '@/components/habitos/HabitHeatmap';

/**
 * Nexus v2 — HabitHeatmap tests (Story 4.3 — AC8)
 *
 * 3 estados de render + a11y (`react-component-test-criteria.md`):
 *   C1 — loading (logs === undefined) → skeleton.
 *   C2 — vazio (logs === []) → grelha + hint "Ainda sem registos".
 *   C3 — conteúdo (logs > 0) → célula concluída (via aria-label, não só cor).
 *   C4 — a11y: aria-labels com data+estado, legenda, padding aria-hidden.
 *   C5 — célula de hoje: realce + aria-label inclui "(hoje)".
 */

const TODAY = '2026-05-29'; // sexta → range from 2025-12-01

let counter = 0;
function makeLog(date: string, value?: number): HabitLog {
  const log: HabitLog = { id: `log-${++counter}`, habitId: 'h1', date };
  if (value !== undefined) log.value = value;
  return log;
}

describe('HabitHeatmap (Story 4.3 / AC8)', () => {
  afterEach(() => {
    cleanup();
    counter = 0;
  });

  // ── C1 — loading ──
  it('C1 — loading: logs === undefined mostra skeleton (aria-busy)', () => {
    render(<HabitHeatmap logs={undefined} todayISO={TODAY} />);
    expect(screen.getByTestId('habit-heatmap-skeleton')).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  // ── C2 — vazio ──
  it('C2 — vazio: logs === [] renderiza a grelha + hint "Ainda sem registos"', () => {
    render(<HabitHeatmap logs={[]} todayISO={TODAY} />);
    expect(screen.getByTestId('habit-heatmap')).toBeInTheDocument();
    // Pelo menos uma célula inRange existe (aria-label de uma data conhecida).
    expect(screen.getByLabelText(/29\/05\/2026:/)).toBeInTheDocument();
    expect(screen.getByText(/Ainda sem registos para este hábito/)).toBeInTheDocument();
  });

  // ── C3 — conteúdo ──
  it('C3 — conteúdo: um log concluído marca a célula como "concluído" (via aria-label)', () => {
    render(<HabitHeatmap logs={[makeLog('2026-03-10')]} todayISO={TODAY} />);
    expect(screen.getByLabelText('10/03/2026: concluído')).toBeInTheDocument();
    // E não mostra o hint de vazio.
    expect(screen.queryByText(/Ainda sem registos/)).not.toBeInTheDocument();
  });

  // ── C4 — a11y não-só-cor ──
  it('C4 — a11y: célula tem aria-label data+estado, legenda presente, padding aria-hidden', () => {
    render(<HabitHeatmap logs={[makeLog('2026-03-10')]} todayISO={TODAY} />);
    // aria-label com data + estado (não só cor).
    expect(screen.getByLabelText('10/03/2026: concluído')).toBeInTheDocument();
    expect(screen.getByLabelText('11/03/2026: não concluído')).toBeInTheDocument();
    // Legenda visível.
    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('Não concluído')).toBeInTheDocument();
    // Padding (sábado 30/05/2026, depois de hoje) NÃO é exposto à a11y.
    expect(screen.queryByLabelText(/30\/05\/2026/)).not.toBeInTheDocument();
  });

  // ── C5 — célula de hoje ──
  it('C5 — hoje: a célula de todayISO tem aria-label com "(hoje)"', () => {
    render(<HabitHeatmap logs={[]} todayISO={TODAY} />);
    const todayCell = screen.getByLabelText('29/05/2026: não concluído (hoje)');
    expect(todayCell).toBeInTheDocument();
    expect(todayCell).toHaveAttribute('data-today', 'true');
  });

  // ── Story 4.4 / AC10 — extensão com prop `metric` (intensidade por valor) ──
  it('C6 — com metric + log com value: aria-label inclui o valor numérico (PT-PT)', () => {
    render(
      <HabitHeatmap
        logs={[makeLog('2026-03-10', 7.2)]}
        todayISO={TODAY}
        metric={{ unit: 'km', target: 10 }}
      />,
    );
    // aria-label com valor (não-só-cor) + legenda de 4 níveis.
    expect(screen.getByLabelText('10/03/2026: 7,2 km')).toBeInTheDocument();
    expect(screen.getByText('≥ 100% do alvo')).toBeInTheDocument();
  });

  it('C7 — com metric + log sem value: célula tratada como nível 1 (valor 0)', () => {
    render(
      <HabitHeatmap
        logs={[makeLog('2026-03-10')]} // log sem value
        todayISO={TODAY}
        metric={{ unit: 'km', target: 10 }}
      />,
    );
    // value ausente → 0 km no aria-label (getHeatmapLevel(0, 10) = 1).
    const cell = screen.getByLabelText('10/03/2026: 0 km');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveAttribute('data-completed', 'true');
  });
});
