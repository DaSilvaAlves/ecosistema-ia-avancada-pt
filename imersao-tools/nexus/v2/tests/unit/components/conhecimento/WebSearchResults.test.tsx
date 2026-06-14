import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react';
import { WebSearchResults } from '@/components/conhecimento/WebSearchResults';
import type { WebSearchResult } from '@/lib/shared/web-search-ddg';

/**
 * Nexus v2 — WebSearchResults tests (Story 5.11 — AC4, AC6, AC10)
 *
 * 5 estados de render distintos (`react-component-test-criteria.md` → teste
 * obrigatório, 1 cenário por estado):
 *   I1 — idle (!isSearching && !hasSearched) → mensagem de convite.
 *   I2 — loading (isSearching) → skeleton (aria-busy); lista ausente.
 *   I3 — results (results>0) → lista com título + URL (Cyan) + excerto + badge.
 *   I4 — empty (hasSearched, results=[], error=null) → mensagem PT-PT.
 *   I5 — error (hasSearched, error!==null) → mensagem real em Magenta, role=alert.
 *   I6 — clicar "Guardar como nota" chama onSave com o resultado correcto.
 *
 * `[D-5.11-EMPTY-VS-ERROR]`: empty e error são estados distintos.
 */

function makeResult(over: Partial<WebSearchResult> = {}): WebSearchResult {
  return {
    title: 'Artemis 2',
    url: 'https://nasa.gov/artemis-ii',
    excerpt: 'A missão Artemis 2 levará astronautas à órbita lunar.',
    ...over,
  };
}

const BASE = {
  results: [] as WebSearchResult[],
  source: null,
  query: '',
  isSearching: false,
  hasSearched: false,
  error: null,
  onSave: vi.fn(),
} as const;

describe('WebSearchResults (Story 5.11 / AC4)', () => {
  afterEach(() => cleanup());

  it('I1 — idle: sem pesquisa ainda → mensagem de convite', () => {
    render(<WebSearchResults {...BASE} onSave={vi.fn()} />);
    expect(screen.getByTestId('web-search-idle')).toBeInTheDocument();
    expect(screen.queryByTestId('web-search-results')).not.toBeInTheDocument();
  });

  it('I2 — loading: isSearching=true → skeleton (aria-busy), sem lista', () => {
    render(<WebSearchResults {...BASE} isSearching={true} onSave={vi.fn()} />);
    expect(screen.getByTestId('web-search-skeleton')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByTestId('web-search-results')).not.toBeInTheDocument();
    expect(screen.queryByTestId('web-search-idle')).not.toBeInTheDocument();
  });

  it('I3 — results: lista com título, URL, excerto e badge de provider', () => {
    render(
      <WebSearchResults
        {...BASE}
        results={[makeResult()]}
        source="anthropic"
        query="Artemis 2"
        hasSearched={true}
        onSave={vi.fn()}
      />,
    );
    const list = screen.getByTestId('web-search-results');
    expect(list).toBeInTheDocument();
    expect(within(list).getByText('Artemis 2')).toBeInTheDocument();
    expect(within(list).getByText('https://nasa.gov/artemis-ii')).toBeInTheDocument();
    expect(
      within(list).getByText('A missão Artemis 2 levará astronautas à órbita lunar.'),
    ).toBeInTheDocument();
    // Badge de provider em maiúsculas.
    expect(within(list).getByText('ANTHROPIC')).toBeInTheDocument();
    // URL é um link com target/rel seguros.
    const link = within(list).getByRole('link');
    expect(link).toHaveAttribute('href', 'https://nasa.gov/artemis-ii');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('I3b — badge DUCKDUCKGO quando source=duckduckgo', () => {
    render(
      <WebSearchResults
        {...BASE}
        results={[makeResult()]}
        source="duckduckgo"
        hasSearched={true}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText('DUCKDUCKGO')).toBeInTheDocument();
  });

  it('I4 — empty: hasSearched, results=[], error=null → mensagem PT-PT com query', () => {
    render(
      <WebSearchResults
        {...BASE}
        query="xpto"
        hasSearched={true}
        error={null}
        onSave={vi.fn()}
      />,
    );
    const empty = screen.getByTestId('web-search-empty');
    expect(empty).toHaveAttribute('role', 'status');
    expect(empty).toHaveTextContent('Nenhum resultado para «xpto».');
    expect(screen.queryByTestId('web-search-error')).not.toBeInTheDocument();
  });

  it('I5 — error: hasSearched, error!==null → mensagem real em role=alert (distinto de empty)', () => {
    render(
      <WebSearchResults
        {...BASE}
        query="xpto"
        hasSearched={true}
        error="Não foi possível pesquisar agora. Tenta de novo mais tarde."
        onSave={vi.fn()}
      />,
    );
    const err = screen.getByTestId('web-search-error');
    expect(err).toHaveAttribute('role', 'alert');
    expect(err).toHaveTextContent('Não foi possível pesquisar agora.');
    // Distinto de empty (`[D-5.11-EMPTY-VS-ERROR]`).
    expect(screen.queryByTestId('web-search-empty')).not.toBeInTheDocument();
  });

  it('I6 — clicar "Guardar como nota" chama onSave com o resultado correcto', () => {
    const onSave = vi.fn();
    const result = makeResult({ title: 'Alvo', url: 'https://alvo.com' });
    render(
      <WebSearchResults
        {...BASE}
        results={[result]}
        source="anthropic"
        hasSearched={true}
        onSave={onSave}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar «Alvo» como nota' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(result);
  });

  it('resultado sem excerto não renderiza parágrafo vazio', () => {
    render(
      <WebSearchResults
        {...BASE}
        results={[makeResult({ excerpt: '' })]}
        source="anthropic"
        hasSearched={true}
        onSave={vi.fn()}
      />,
    );
    expect(
      screen.queryByText('A missão Artemis 2 levará astronautas à órbita lunar.'),
    ).not.toBeInTheDocument();
  });
});
