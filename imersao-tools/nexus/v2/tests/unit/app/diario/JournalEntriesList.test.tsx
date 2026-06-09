import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import type { JournalEntry } from '@/types/db';
import { JournalEntriesList } from '@/components/diario/JournalEntriesList';

/**
 * Nexus v2 — JournalEntriesList tests (Story 5.3 — AC1, QC-5.3-A)
 *
 * Estados de render distintos + interacção (`react-component-test-criteria.md`):
 *   C1 — loading (entries === undefined) → skeleton (aria-busy).
 *   C2 — vazio (entries === []) → mensagem "Sem entradas nos últimos 6 meses".
 *   C3 — conteúdo (entries > 0) → lista, badge de mood (número visível),
 *        excerto em texto simples (sem marcas markdown), aria-label não-só-cor.
 *   C4 — itens ordenados desc por data (mais recente primeiro), sem mutar a prop.
 *   C5 — clicar num item chama onSelect com a date correcta.
 */

let counter = 0;
function makeEntry(date: string, mood: JournalEntry['mood'], bodyMarkdown: string): JournalEntry {
  return { id: `j-${++counter}`, date, mood, bodyMarkdown };
}

describe('JournalEntriesList (Story 5.3 / AC1)', () => {
  afterEach(() => {
    cleanup();
    counter = 0;
  });

  // ── C1 — loading ──
  it('C1 — loading: entries === undefined mostra skeleton (aria-busy)', () => {
    render(<JournalEntriesList entries={undefined} onSelect={vi.fn()} />);
    expect(screen.getByTestId('journal-list-skeleton')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByTestId('journal-list')).not.toBeInTheDocument();
  });

  // ── C2 — vazio ──
  it('C2 — vazio: entries === [] mostra mensagem discreta', () => {
    render(<JournalEntriesList entries={[]} onSelect={vi.fn()} />);
    const empty = screen.getByTestId('journal-list-empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('Sem entradas nos últimos 6 meses.');
    expect(screen.queryByTestId('journal-list')).not.toBeInTheDocument();
  });

  // ── C3 — conteúdo ──
  it('C3 — conteúdo: entrada com mood 4 mostra badge (número visível), excerto e aria-label não-só-cor', () => {
    render(
      <JournalEntriesList
        entries={[makeEntry('2026-03-10', 4, '# Dia produtivo\nresto do corpo')]}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByTestId('journal-list')).toBeInTheDocument();
    const item = screen.getByLabelText('Entrada de 10/03/2026, humor 4 de 5 (Bom)');
    expect(item).toBeInTheDocument();
    // Badge: número do mood visível (não-só-cor).
    expect(within(item).getByText('4')).toBeInTheDocument();
    // Excerto em texto simples: marca markdown "#" removida da 1.ª linha.
    expect(within(item).getByText('Dia produtivo')).toBeInTheDocument();
    expect(within(item).queryByText('# Dia produtivo')).not.toBeInTheDocument();
  });

  // ── C4 — ordenação desc por data ──
  it('C4 — itens ordenados desc por data sem mutar a prop', () => {
    const entries = [
      makeEntry('2026-03-08', 1, 'mais antiga'),
      makeEntry('2026-03-12', 5, 'mais recente'),
      makeEntry('2026-03-10', 3, 'do meio'),
    ];
    const snapshot = entries.map((e) => e.date);
    render(<JournalEntriesList entries={entries} onSelect={vi.fn()} />);

    const items = within(screen.getByTestId('journal-list')).getAllByRole('button');
    expect(items.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Entrada de 12/03/2026, humor 5 de 5 (Muito bom)',
      'Entrada de 10/03/2026, humor 3 de 5 (Neutro)',
      'Entrada de 08/03/2026, humor 1 de 5 (Muito mau)',
    ]);
    // A prop original não foi mutada (ordenação feita sobre cópia).
    expect(entries.map((e) => e.date)).toEqual(snapshot);
  });

  // ── C5 — clique abre a entrada ──
  it('C5 — clicar num item chama onSelect com a date correcta', () => {
    const onSelect = vi.fn();
    render(
      <JournalEntriesList
        entries={[
          makeEntry('2026-03-12', 5, 'recente'),
          makeEntry('2026-03-08', 2, 'antiga'),
        ]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByLabelText('Entrada de 08/03/2026, humor 2 de 5 (Mau)'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('2026-03-08');
  });
});
