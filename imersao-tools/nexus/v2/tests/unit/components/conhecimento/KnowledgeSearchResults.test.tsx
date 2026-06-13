import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import type { KnowledgeNote } from '@/types/db';
import {
  KnowledgeSearchResults,
  type KnowledgeSearchResult,
} from '@/components/conhecimento/KnowledgeSearchResults';

/**
 * Nexus v2 — KnowledgeSearchResults tests (Story 5.10 — AC7)
 *
 * 3 estados de render distintos (`react-component-test-criteria.md` → teste
 * obrigatório, 1 cenário por estado):
 *   C1 — loading (isLoading=true) → skeleton (aria-busy); lista ausente.
 *   C2 — results (results>0, !isLoading) → lista com breadcrumb + highlight + data.
 *   C3 — empty (results=[], !isLoading) → mensagem PT-PT com o query term.
 *   C4 (opcional) — clicar num resultado chama onSelect com o id correcto.
 */

let counter = 0;
function makeNote(overrides: Partial<KnowledgeNote> = {}): KnowledgeNote {
  return {
    id: `n-${++counter}`,
    notebookId: 'nb-1',
    title: 'Nota de teste',
    bodyMarkdown: 'Corpo da nota.',
    tags: [],
    updatedAt: Date.UTC(2026, 2, 10), // 10/03/2026
    ...overrides,
  };
}

function makeResult(
  overrides: Partial<KnowledgeNote> = {},
  areaName = 'Aprendizagens',
  notebookName = 'React 19',
): KnowledgeSearchResult {
  return { note: makeNote(overrides), areaName, notebookName };
}

describe('KnowledgeSearchResults (Story 5.10 / AC7)', () => {
  afterEach(() => {
    cleanup();
    counter = 0;
  });

  // ── C1 — loading ──
  it('C1 — loading: isLoading=true mostra skeleton (aria-busy), sem lista', () => {
    render(
      <KnowledgeSearchResults results={[]} query="react" isLoading={true} onSelect={vi.fn()} />,
    );
    expect(screen.getByTestId('knowledge-search-skeleton')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.queryByTestId('knowledge-search-results')).not.toBeInTheDocument();
    expect(screen.queryByTestId('knowledge-search-empty')).not.toBeInTheDocument();
  });

  // ── C2 — results ──
  it('C2 — results: lista visível com breadcrumb, termo destacado (<mark>) e data PT-PT', () => {
    render(
      <KnowledgeSearchResults
        results={[
          makeResult(
            { title: 'Hooks', bodyMarkdown: 'aprendi sobre Suspense e orçamento' },
            'Aprendizagens',
            'React 19',
          ),
        ]}
        query="orçamento"
        isLoading={false}
        onSelect={vi.fn()}
      />,
    );
    const list = screen.getByTestId('knowledge-search-results');
    expect(list).toBeInTheDocument();
    // Breadcrumb "Área > Caderno".
    expect(within(list).getByText('Aprendizagens > React 19')).toBeInTheDocument();
    // Título da nota.
    expect(within(list).getByText('Hooks')).toBeInTheDocument();
    // Termo destacado num <mark>.
    const mark = within(list).getByText('orçamento');
    expect(mark.tagName.toLowerCase()).toBe('mark');
    // Data PT-PT.
    expect(within(list).getByText('10/03/2026')).toBeInTheDocument();
  });

  // ── C3 — empty ──
  it('C3 — empty: results=[] mostra mensagem PT-PT com o query term', () => {
    render(
      <KnowledgeSearchResults
        results={[]}
        query="inexistente"
        isLoading={false}
        onSelect={vi.fn()}
      />,
    );
    const empty = screen.getByTestId('knowledge-search-empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveAttribute('role', 'status');
    expect(empty).toHaveTextContent('Nenhuma nota encontrada para «inexistente».');
    expect(screen.queryByTestId('knowledge-search-results')).not.toBeInTheDocument();
  });

  // ── C5 — múltiplos resultados: itera todos, preserva a ordem recebida ──
  it('C5 — results com múltiplas notas: renderiza todas na ordem recebida', () => {
    render(
      <KnowledgeSearchResults
        results={[
          makeResult({ title: 'Primeira', bodyMarkdown: 'alvo um' }, 'A1', 'C1'),
          makeResult({ title: 'Segunda', bodyMarkdown: 'alvo dois' }, 'A2', 'C2'),
          makeResult({ title: 'Terceira', bodyMarkdown: 'alvo três' }, 'A3', 'C3'),
        ]}
        query="alvo"
        isLoading={false}
        onSelect={vi.fn()}
      />,
    );
    const items = within(screen.getByTestId('knowledge-search-results')).getAllByRole(
      'button',
    );
    expect(items).toHaveLength(3);
    // Ordem preservada — asserção pelo aria-label do botão (estável; o título no
    // corpo pode coincidir com o excerto quando o haystack o inclui).
    expect(items[0]!.getAttribute('aria-label')).toContain('Nota «Primeira»');
    expect(items[1]!.getAttribute('aria-label')).toContain('Nota «Segunda»');
    expect(items[2]!.getAttribute('aria-label')).toContain('Nota «Terceira»');
  });

  // ── C4 (opcional) — clique ──
  it('C4 — clicar num resultado chama onSelect com o id da nota correcto', () => {
    const onSelect = vi.fn();
    const result = makeResult({ title: 'Importante', bodyMarkdown: 'conteúdo alvo' });
    render(
      <KnowledgeSearchResults
        results={[result]}
        query="alvo"
        isLoading={false}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Nota «Importante» em Aprendizagens > React 19/ }),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(result.note.id);
  });

  // ── data inválida → placeholder seguro (defesa em profundidade, espelha NoteList) ──
  it('updatedAt inválido (NaN) → data renderiza placeholder "—"', () => {
    render(
      <KnowledgeSearchResults
        results={[makeResult({ title: 'Nota', bodyMarkdown: 'corpo alvo', updatedAt: NaN })]}
        query="alvo"
        isLoading={false}
        onSelect={vi.fn()}
      />,
    );
    const list = screen.getByTestId('knowledge-search-results');
    expect(within(list).getByText('—')).toBeInTheDocument();
  });
});
