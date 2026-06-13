import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { NoteList } from '@/components/conhecimento/NoteList';
import type { KnowledgeNote, Tag } from '@/types/db';

/**
 * Nexus v2 — NoteList tests (Story 5.9 — AC17, ≥3 estados de render + AC15 filtro)
 *
 * Estados de render distintos (`react-component-test-criteria.md`, ≥3 obrigatório):
 * sem caderno seleccionado / loading (`notes` undefined) / vazia (0 notas) / lista
 * de notas. Cobre o filtro por tag (AC15) e a selecção de nota.
 */

const tagLeitura: Tag = { id: 'tag-1', name: 'leitura', color: '#FFB800' };
const tagPessoal: Tag = { id: 'tag-2', name: 'pessoal', color: '#9D00FF' };

const note: KnowledgeNote = {
  id: 'note-1',
  notebookId: 'nb-1',
  title: 'Notas Carnegie',
  bodyMarkdown: '## 6 maneiras',
  tags: ['tag-1'],
  updatedAt: Date.parse('2026-03-14T10:00:00Z'),
};

function setup(
  overrides: Partial<Parameters<typeof NoteList>[0]> = {},
): Record<string, ReturnType<typeof vi.fn>> {
  const handlers = {
    onTagFilterChange: vi.fn(),
    onSelectNote: vi.fn(),
    onCreateNote: vi.fn(),
  };
  render(
    <NoteList
      notes={[note]}
      hasNotebookSelected={true}
      selectedNoteId={null}
      tagsLookup={new Map([[tagLeitura.id, tagLeitura], [tagPessoal.id, tagPessoal]])}
      tags={[tagLeitura, tagPessoal]}
      tagFilter={null}
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

afterEach(cleanup);

describe('NoteList — estados de render (AC17)', () => {
  it('(sem caderno) mostra o placeholder', () => {
    setup({ hasNotebookSelected: false });
    expect(
      screen.getByText('Selecciona um caderno para ver as suas notas.'),
    ).toBeInTheDocument();
  });

  it('(loading) notes undefined mostra o skeleton aria-busy', () => {
    setup({ notes: undefined });
    expect(screen.getByLabelText('A carregar notas')).toBeInTheDocument();
  });

  it('(vazia) 0 notas mostra mensagem de caderno vazio', () => {
    setup({ notes: [] });
    expect(screen.getByText(/Sem notas neste caderno/)).toBeInTheDocument();
  });

  it('(vazia com filtro) 0 notas com tagFilter mostra mensagem específica', () => {
    setup({ notes: [], tagFilter: 'tag-1' });
    expect(screen.getByText('Nenhuma nota com esta tag.')).toBeInTheDocument();
  });

  it('(lista) renderiza a nota com título e data', () => {
    setup();
    expect(screen.getByText('Notas Carnegie')).toBeInTheDocument();
    expect(screen.getByText('14/03/2026')).toBeInTheDocument();
  });

  it('(lista, updatedAt inválido) mostra placeholder em vez de "Invalid Date"', () => {
    setup({ notes: [{ ...note, updatedAt: Number.NaN }] });
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();
  });
});

describe('NoteList — interacções (AC10/AC15)', () => {
  it('+ Nova nota emite onCreateNote', () => {
    const h = setup();
    fireEvent.click(screen.getByRole('button', { name: '+ Nova nota' }));
    expect(h.onCreateNote).toHaveBeenCalledTimes(1);
  });

  it('selecção de nota emite onSelectNote', () => {
    const h = setup();
    fireEvent.click(screen.getByText('Notas Carnegie'));
    expect(h.onSelectNote).toHaveBeenCalledWith(note);
  });

  it('(AC15) escolher uma tag no filtro emite onTagFilterChange', () => {
    const h = setup();
    fireEvent.change(screen.getByLabelText('Filtrar por tag'), {
      target: { value: 'tag-1' },
    });
    expect(h.onTagFilterChange).toHaveBeenCalledWith('tag-1');
  });

  it('(AC15) escolher "Todas as tags" limpa o filtro (null)', () => {
    const h = setup({ tagFilter: 'tag-1' });
    fireEvent.change(screen.getByLabelText('Filtrar por tag'), {
      target: { value: '' },
    });
    expect(h.onTagFilterChange).toHaveBeenCalledWith(null);
  });
});
