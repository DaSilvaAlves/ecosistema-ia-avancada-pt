import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { NoteEditor } from '@/components/conhecimento/NoteEditor';
import type { KnowledgeNote, Tag } from '@/types/db';

/**
 * Nexus v2 — NoteEditor tests (Story 5.9 — AC3/AC11/AC13/AC14)
 *
 * Estados de render distintos (`react-component-test-criteria.md`, ≥3 obrigatório):
 * vazio (sem nota) / view (leitura) / edit (edição). Cobre o tag picker (AC13 —
 * adicionar/remover tags da nota, NÃO da tabela) e a validação de título obrigatório.
 *
 * O `MarkdownEditor` (Tiptap 2) é mockado — esta suite valida o roteamento de
 * estados e o tag picker do NoteEditor, não o editor markdown (testado em 5.2).
 */

vi.mock('@/components/ui/MarkdownEditor', () => ({
  MarkdownEditor: ({ ariaLabel }: { ariaLabel: string }) => (
    <div data-testid="markdown-editor" aria-label={ariaLabel} />
  ),
}));

const tagLeitura: Tag = { id: 'tag-1', name: 'leitura', color: '#FFB800' };
const tagDecisao: Tag = { id: 'tag-3', name: 'decisao', color: '#FF006E' };

const note: KnowledgeNote = {
  id: 'note-1',
  notebookId: 'nb-1',
  title: 'Notas Carnegie',
  bodyMarkdown: '## 6 maneiras',
  tags: ['tag-1'],
  updatedAt: Date.now(),
};

function setup(
  overrides: Partial<Parameters<typeof NoteEditor>[0]> = {},
): Record<string, ReturnType<typeof vi.fn>> {
  const handlers = {
    onStartEdit: vi.fn(),
    onCancelEdit: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn(),
  };
  render(
    <NoteEditor
      note={note}
      creating={false}
      editing={false}
      tags={[tagLeitura, tagDecisao]}
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
}

afterEach(cleanup);

describe('NoteEditor — estados de render (AC3)', () => {
  it('(vazio) sem nota nem criação mostra placeholder', () => {
    setup({ note: null, creating: false });
    expect(
      screen.getByText('Selecciona ou cria uma nota para a ver aqui.'),
    ).toBeInTheDocument();
  });

  it('(view) mostra título como heading e o editor read-only', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Notas Carnegie' })).toBeInTheDocument();
    expect(
      screen.getByLabelText('Corpo da nota (leitura)'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '✏️ Editar' })).toBeInTheDocument();
  });

  it('(edit) mostra input de título e editor editável', () => {
    setup({ editing: true });
    expect(screen.getByLabelText('Título da nota')).toBeInTheDocument();
    expect(screen.getByLabelText('Corpo da nota')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });
});

describe('NoteEditor — tag picker (AC13/AC14)', () => {
  it('(view) mostra só as tags activas da nota', () => {
    setup();
    expect(screen.getByRole('button', { name: /Tag leitura/ })).toBeInTheDocument();
    // tag decisao NÃO está activa → não aparece em modo view
    expect(screen.queryByRole('button', { name: /Tag decisao/ })).not.toBeInTheDocument();
  });

  it('(edit) mostra todas as tags incl. a de sistema decisao (AC14)', () => {
    setup({ editing: true });
    expect(screen.getByRole('button', { name: /Tag leitura/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Tag decisao/ })).toBeInTheDocument();
  });

  it('(edit) toggle de uma tag inactiva activa-a (aria-pressed) e guarda no array', async () => {
    const h = setup({ editing: true });
    const decisaoBtn = screen.getByRole('button', { name: /Tag decisao/ });
    expect(decisaoBtn).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(decisaoBtn);
    expect(decisaoBtn).toHaveAttribute('aria-pressed', 'true');
    // O Guardar dispara `onSave` assíncrono + actualizações de estado (`setSaving`);
    // envolver em `act` para o React aplicar os updates antes da asserção.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    });
    expect(h.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['tag-1', 'tag-3'] }),
    );
  });
});

describe('NoteEditor — acções', () => {
  it('Editar emite onStartEdit', () => {
    const h = setup();
    fireEvent.click(screen.getByRole('button', { name: '✏️ Editar' }));
    expect(h.onStartEdit).toHaveBeenCalledTimes(1);
  });

  it('Eliminar emite onDelete com a nota', () => {
    const h = setup();
    fireEvent.click(screen.getByRole('button', { name: /Eliminar nota Notas Carnegie/ }));
    expect(h.onDelete).toHaveBeenCalledWith(note);
  });

  it('(edit) Guardar com título vazio mostra erro e NÃO chama onSave', () => {
    const h = setup({ note: null, creating: true });
    fireEvent.click(screen.getByRole('button', { name: 'Criar nota' }));
    expect(screen.getByRole('alert')).toHaveTextContent('título da nota é obrigatório');
    expect(h.onSave).not.toHaveBeenCalled();
  });
});
