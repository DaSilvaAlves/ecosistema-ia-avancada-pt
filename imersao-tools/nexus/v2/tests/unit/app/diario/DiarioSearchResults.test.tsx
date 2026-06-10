import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import type { JournalEntry } from '@/types/db';
import { DiarioSearchResults } from '@/components/diario/DiarioSearchResults';

/**
 * Nexus v2 — DiarioSearchResults tests (Story 5.5 — AC6)
 *
 * 3 estados de render distintos (`react-component-test-criteria.md` → teste
 * obrigatório, 1 cenário por estado):
 *   C1 — loading (isLoading=true) → skeleton (aria-busy); lista ausente.
 *   C2 — results (results>0, !isLoading) → lista com data PT-PT + highlight.
 *   C3 — empty (results=[], !isLoading) → mensagem PT-PT com o query term.
 *   C4 (opcional) — clicar num resultado chama onSelect com o id correcto.
 */

let counter = 0;
function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: `j-${++counter}`,
    date: '2026-06-07',
    mood: 3,
    bodyMarkdown: 'Hoje foi um dia produtivo.',
    ...overrides,
  };
}

describe('DiarioSearchResults (Story 5.5 / AC6)', () => {
  afterEach(() => {
    cleanup();
    counter = 0;
  });

  // ── C1 — loading ──
  it('C1 — loading: isLoading=true mostra skeleton (aria-busy), sem lista', () => {
    render(
      <DiarioSearchResults results={[]} query="alvo" isLoading={true} onSelect={vi.fn()} />,
    );
    expect(screen.getByTestId('diario-search-skeleton')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByTestId('diario-search-results')).not.toBeInTheDocument();
    expect(screen.queryByTestId('diario-search-empty')).not.toBeInTheDocument();
  });

  // ── C2 — results ──
  it('C2 — results: lista visível com data PT-PT e termo destacado (<mark>)', () => {
    render(
      <DiarioSearchResults
        results={[makeEntry({ date: '2026-03-10', mood: 4, bodyMarkdown: 'Reunião sobre o orçamento' })]}
        query="orçamento"
        isLoading={false}
        onSelect={vi.fn()}
      />,
    );
    const list = screen.getByTestId('diario-search-results');
    expect(list).toBeInTheDocument();
    const item = screen.getByLabelText('Entrada de 10/03/2026, humor 4 de 5 (Bom)');
    expect(item).toBeInTheDocument();
    // Termo destacado num <mark>.
    const mark = within(item).getByText('orçamento');
    expect(mark.tagName.toLowerCase()).toBe('mark');
  });

  // ── C3 — empty ──
  it('C3 — empty: results=[] mostra mensagem PT-PT com o query term', () => {
    render(
      <DiarioSearchResults
        results={[]}
        query="inexistente"
        isLoading={false}
        onSelect={vi.fn()}
      />,
    );
    const empty = screen.getByTestId('diario-search-empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveAttribute('role', 'status');
    expect(empty).toHaveTextContent('Nenhuma entrada encontrada para «inexistente».');
    expect(screen.queryByTestId('diario-search-results')).not.toBeInTheDocument();
  });

  // ── C5 — múltiplos resultados: itera todos, preserva a ordem recebida ──
  it('C5 — results com múltiplas entradas: renderiza todas na ordem recebida', () => {
    render(
      <DiarioSearchResults
        results={[
          makeEntry({ date: '2026-03-12', mood: 5, bodyMarkdown: 'projecto alvo' }),
          makeEntry({ date: '2026-03-10', mood: 3, bodyMarkdown: 'outro alvo' }),
          makeEntry({ date: '2026-03-08', mood: 1, bodyMarkdown: 'mais um alvo' }),
        ]}
        query="alvo"
        isLoading={false}
        onSelect={vi.fn()}
      />,
    );
    const items = within(screen.getByTestId('diario-search-results')).getAllByRole('button');
    expect(items).toHaveLength(3);
    // A ordem renderizada espelha a ordem recebida (já ordenada por recência no repo).
    expect(items.map((b) => b.getAttribute('aria-label'))).toEqual([
      'Entrada de 12/03/2026, humor 5 de 5 (Muito bom)',
      'Entrada de 10/03/2026, humor 3 de 5 (Neutro)',
      'Entrada de 08/03/2026, humor 1 de 5 (Muito mau)',
    ]);
  });

  // ── C4 (opcional) — clique ──
  it('C4 — clicar num resultado chama onSelect com o id correcto', () => {
    const onSelect = vi.fn();
    const entry = makeEntry({ date: '2026-03-12', mood: 5, bodyMarkdown: 'tarefa importante' });
    render(
      <DiarioSearchResults
        results={[entry]}
        query="tarefa"
        isLoading={false}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByLabelText('Entrada de 12/03/2026, humor 5 de 5 (Muito bom)'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(entry.id);
  });
});
