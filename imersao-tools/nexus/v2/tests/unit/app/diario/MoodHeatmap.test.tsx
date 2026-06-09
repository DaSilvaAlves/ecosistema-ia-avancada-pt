import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import type { JournalEntry } from '@/types/db';
import type { Mood } from '@/lib/diario/mood-heatmap';
import { MoodHeatmap } from '@/components/diario/MoodHeatmap';

/**
 * Nexus v2 — MoodHeatmap tests (Story 5.3 — AC5/AC7)
 *
 * Estados de render distintos + a11y (`react-component-test-criteria.md`):
 *   C1 — loading (entries === undefined) → skeleton (aria-busy).
 *   C2 — vazio (entries === []) → grelha + hint "Ainda sem entradas".
 *   C3 — conteúdo (entries > 0) → célula com mood (via aria-label, não só cor).
 *   C4 — dia-com-mood vs dia-sem-entrada distinguíveis por aria-label.
 *   C5 — clique numa célula chama onSelectDay com a data.
 *   C6 — célula de hoje inclui "(hoje)"; legenda com os 5 moods + "sem entrada".
 */

const TODAY = '2026-06-09'; // terça → range from 2025-12-15

let counter = 0;
function makeEntry(date: string, mood: Mood): JournalEntry {
  return { id: `j-${++counter}`, date, mood, bodyMarkdown: `entrada ${date}` };
}

describe('MoodHeatmap (Story 5.3 / AC5)', () => {
  afterEach(() => {
    cleanup();
    counter = 0;
  });

  // ── C1 — loading ──
  it('C1 — loading: entries === undefined mostra skeleton (aria-busy)', () => {
    render(<MoodHeatmap entries={undefined} todayISO={TODAY} onSelectDay={vi.fn()} />);
    expect(screen.getByTestId('mood-heatmap-skeleton')).toHaveAttribute('aria-busy', 'true');
  });

  // ── C2 — vazio ──
  it('C2 — vazio: entries === [] renderiza grelha + hint "Ainda sem entradas"', () => {
    render(<MoodHeatmap entries={[]} todayISO={TODAY} onSelectDay={vi.fn()} />);
    expect(screen.getByTestId('mood-heatmap')).toBeInTheDocument();
    expect(screen.getByLabelText(/09\/06\/2026: sem entrada/)).toBeInTheDocument();
    expect(screen.getByText(/Ainda sem entradas de diário/)).toBeInTheDocument();
  });

  // ── C3 — conteúdo ──
  it('C3 — conteúdo: entrada com mood 4 marca a célula via aria-label (não só cor)', () => {
    render(
      <MoodHeatmap entries={[makeEntry('2026-03-10', 4)]} todayISO={TODAY} onSelectDay={vi.fn()} />,
    );
    expect(screen.getByLabelText('10/03/2026: humor 4 de 5 (Bom)')).toBeInTheDocument();
    expect(screen.queryByText(/Ainda sem entradas/)).not.toBeInTheDocument();
  });

  // ── C4 — dia-com-mood vs dia-sem-entrada ──
  it('C4 — distingue dia-com-mood de dia-sem-entrada no aria-label', () => {
    render(
      <MoodHeatmap entries={[makeEntry('2026-03-10', 1)]} todayISO={TODAY} onSelectDay={vi.fn()} />,
    );
    expect(screen.getByLabelText('10/03/2026: humor 1 de 5 (Muito mau)')).toBeInTheDocument();
    expect(screen.getByLabelText('11/03/2026: sem entrada')).toBeInTheDocument();
  });

  // ── C5 — clique abre o dia ──
  it('C5 — clicar numa célula chama onSelectDay com a data', () => {
    const onSelectDay = vi.fn();
    render(<MoodHeatmap entries={[]} todayISO={TODAY} onSelectDay={onSelectDay} />);
    fireEvent.click(screen.getByLabelText('10/03/2026: sem entrada'));
    expect(onSelectDay).toHaveBeenCalledWith('2026-03-10');
  });

  // ── C6 — hoje + legenda ──
  it('C6 — célula de hoje inclui "(hoje)"; legenda mostra 5 moods + sem entrada', () => {
    render(<MoodHeatmap entries={[]} todayISO={TODAY} onSelectDay={vi.fn()} />);
    const todayCell = screen.getByLabelText('09/06/2026: sem entrada (hoje)');
    expect(todayCell).toHaveAttribute('data-today', 'true');
    // Legenda não-só-cor: 5 moods + sem entrada.
    expect(screen.getByText(/Muito mau/)).toBeInTheDocument();
    expect(screen.getByText(/Muito bom/)).toBeInTheDocument();
    expect(screen.getByText('Sem entrada')).toBeInTheDocument();
    // Padding (depois de hoje) não exposto à a11y.
    expect(screen.queryByLabelText(/10\/06\/2026/)).not.toBeInTheDocument();
  });
});
