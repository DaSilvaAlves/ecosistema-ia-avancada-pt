import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { createKnowledgeArea } from '@/lib/db/repos/knowledge-areas';
import { createKnowledgeNotebook } from '@/lib/db/repos/knowledge-notebooks';
import {
  createKnowledgeNote,
  getKnowledgeNote,
  listNotesByNotebook,
  listNotesByTag,
  searchNotes,
  updateKnowledgeNote,
  deleteKnowledgeNote,
} from '@/lib/db/repos/knowledge-notes';
import type { KnowledgeArea, KnowledgeNotebook, KnowledgeNote } from '@/types/db';

/**
 * Nexus v2 — knowledge_notes repo tests (Story 5.1 / AC8)
 */

function makeNote(notebookId: string, overrides: Partial<KnowledgeNote> = {}): KnowledgeNote {
  return {
    id: crypto.randomUUID(),
    notebookId,
    title: 'Generics',
    bodyMarkdown: 'Notas sobre generics.',
    tags: [],
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('knowledge-notes repo', () => {
  let area: KnowledgeArea;
  let notebook: KnowledgeNotebook;

  beforeEach(async () => {
    await db.knowledge_areas.clear();
    await db.knowledge_notebooks.clear();
    await db.knowledge_notes.clear();
    area = { id: crypto.randomUUID(), name: 'Programação', color: '#00F5FF', icon: 'code' };
    await createKnowledgeArea(area);
    notebook = { id: crypto.randomUUID(), areaId: area.id, name: 'TypeScript' };
    await createKnowledgeNotebook(notebook);
  });

  it('createKnowledgeNote + getKnowledgeNote roundtrip', async () => {
    const note = makeNote(notebook.id);
    await createKnowledgeNote(note);
    expect(await getKnowledgeNote(note.id)).toEqual(note);
  });

  it('createKnowledgeNote rejeita nota órfã (caderno inexistente)', async () => {
    await expect(createKnowledgeNote(makeNote(crypto.randomUUID()))).rejects.toThrow(
      /não é possível criar nota órfã/,
    );
  });

  it('createKnowledgeNote rejeita título vazio com mensagem PT-PT', async () => {
    await expect(createKnowledgeNote(makeNote(notebook.id, { title: '' }))).rejects.toThrow(
      /Título da nota é obrigatório/,
    );
  });

  it('createKnowledgeNote aceita sourceUrl válida e rejeita inválida', async () => {
    await createKnowledgeNote(makeNote(notebook.id, { sourceUrl: 'https://exemplo.pt/artigo' }));
    await expect(
      createKnowledgeNote(makeNote(notebook.id, { sourceUrl: 'não-é-url' })),
    ).rejects.toThrow(/sourceUrl deve ser uma URL válida/);
  });

  it('createKnowledgeNote rejeita tags non-array', async () => {
    await expect(
      createKnowledgeNote(
        makeNote(notebook.id, { tags: 'tag1' as unknown as string[] }),
      ),
    ).rejects.toThrow();
  });

  it('listNotesByNotebook devolve só as notas do caderno, ordenadas por updatedAt desc', async () => {
    const base = Date.now();
    await createKnowledgeNote(makeNote(notebook.id, { updatedAt: base - 3000 }));
    await createKnowledgeNote(makeNote(notebook.id, { updatedAt: base - 1000 }));
    await createKnowledgeNote(makeNote(notebook.id, { updatedAt: base - 2000 }));

    const result = await listNotesByNotebook(notebook.id);
    expect(result.map((n) => n.updatedAt)).toEqual([base - 1000, base - 2000, base - 3000]);
  });

  it('listNotesByTag encontra notas pela tag (índice *tags)', async () => {
    const tagId = crypto.randomUUID();
    await createKnowledgeNote(makeNote(notebook.id, { tags: [tagId] }));
    await createKnowledgeNote(makeNote(notebook.id, { tags: [crypto.randomUUID()] }));
    await createKnowledgeNote(makeNote(notebook.id, { tags: [tagId, crypto.randomUUID()] }));

    const result = await listNotesByTag(tagId);
    expect(result).toHaveLength(2);
  });

  it('searchNotes encontra por title e bodyMarkdown (case-insensitive)', async () => {
    await createKnowledgeNote(makeNote(notebook.id, { title: 'Decorators', bodyMarkdown: 'x' }));
    await createKnowledgeNote(
      makeNote(notebook.id, { title: 'Outra', bodyMarkdown: 'Fala de DECORATORS aqui' }),
    );
    await createKnowledgeNote(makeNote(notebook.id, { title: 'Nada', bodyMarkdown: 'y' }));

    const result = await searchNotes('decorators');
    expect(result).toHaveLength(2);
  });

  it('searchNotes devolve vazio para query em branco', async () => {
    await createKnowledgeNote(makeNote(notebook.id));
    expect(await searchNotes('  ')).toEqual([]);
  });

  it('updateKnowledgeNote aplica patch parcial', async () => {
    const note = makeNote(notebook.id, { title: 'Antes' });
    await createKnowledgeNote(note);
    await updateKnowledgeNote(note.id, { title: 'Depois', updatedAt: Date.now() });
    expect((await getKnowledgeNote(note.id))?.title).toBe('Depois');
  });

  it('updateKnowledgeNote lança se id não existe', async () => {
    await expect(
      updateKnowledgeNote('00000000-0000-0000-0000-000000000000', { title: 'X' }),
    ).rejects.toThrow(/não encontrada/i);
  });

  it('deleteKnowledgeNote remove a nota (folha — sem cascata)', async () => {
    const note = makeNote(notebook.id);
    await createKnowledgeNote(note);
    await deleteKnowledgeNote(note.id);
    expect(await getKnowledgeNote(note.id)).toBeUndefined();
  });
});
