import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createKnowledgeArea,
  getKnowledgeArea,
  listKnowledgeAreas,
  updateKnowledgeArea,
  deleteKnowledgeArea,
} from '@/lib/db/repos/knowledge-areas';
import { createKnowledgeNotebook } from '@/lib/db/repos/knowledge-notebooks';
import { createKnowledgeNote } from '@/lib/db/repos/knowledge-notes';
import type { KnowledgeArea, KnowledgeNotebook, KnowledgeNote } from '@/types/db';

/**
 * Nexus v2 — knowledge_areas repo tests (Story 5.1 / AC8)
 * Inclui a cascata de 2 níveis (AC7) — teste NÃO-TAUTOLÓGICO.
 */

function makeArea(overrides: Partial<KnowledgeArea> = {}): KnowledgeArea {
  return {
    id: crypto.randomUUID(),
    name: 'Programação',
    color: '#00F5FF',
    icon: 'code',
    ...overrides,
  };
}

function makeNotebook(areaId: string, overrides: Partial<KnowledgeNotebook> = {}): KnowledgeNotebook {
  return {
    id: crypto.randomUUID(),
    areaId,
    name: 'TypeScript',
    ...overrides,
  };
}

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

describe('knowledge-areas repo', () => {
  beforeEach(async () => {
    await db.knowledge_areas.clear();
    await db.knowledge_notebooks.clear();
    await db.knowledge_notes.clear();
  });

  it('createKnowledgeArea + getKnowledgeArea roundtrip', async () => {
    const area = makeArea();
    await createKnowledgeArea(area);
    expect(await getKnowledgeArea(area.id)).toEqual(area);
  });

  it('createKnowledgeArea rejeita id não-UUID', async () => {
    await expect(createKnowledgeArea(makeArea({ id: 'nope' }))).rejects.toThrow();
  });

  it('createKnowledgeArea rejeita nome vazio com mensagem PT-PT', async () => {
    await expect(createKnowledgeArea(makeArea({ name: '' }))).rejects.toThrow(
      /Nome da área é obrigatório/,
    );
  });

  it('listKnowledgeAreas ordena alfabeticamente (PT-PT)', async () => {
    await createKnowledgeArea(makeArea({ name: 'Zoologia' }));
    await createKnowledgeArea(makeArea({ name: 'Álgebra' }));
    await createKnowledgeArea(makeArea({ name: 'Música' }));
    const result = await listKnowledgeAreas();
    expect(result.map((a) => a.name)).toEqual(['Álgebra', 'Música', 'Zoologia']);
  });

  it('updateKnowledgeArea aplica patch parcial', async () => {
    const area = makeArea({ name: 'Antes' });
    await createKnowledgeArea(area);
    await updateKnowledgeArea(area.id, { name: 'Depois', color: '#FFB800' });
    const got = await getKnowledgeArea(area.id);
    expect(got?.name).toBe('Depois');
    expect(got?.color).toBe('#FFB800');
  });

  it('updateKnowledgeArea lança se id não existe', async () => {
    await expect(
      updateKnowledgeArea('00000000-0000-0000-0000-000000000000', { name: 'X' }),
    ).rejects.toThrow(/não encontrada/i);
  });

  it('deleteKnowledgeArea remove a área', async () => {
    const area = makeArea();
    await createKnowledgeArea(area);
    await deleteKnowledgeArea(area.id);
    expect(await getKnowledgeArea(area.id)).toBeUndefined();
  });

  // Teste NÃO-TAUTOLÓGICO de cascata de 2 níveis (AC7) — prova que cadernos E
  // notas são eliminados, não apenas que a área desaparece.
  it('deleteKnowledgeArea elimina em cascata cadernos e notas (2 níveis)', async () => {
    const area = makeArea();
    await createKnowledgeArea(area);
    const nb1 = makeNotebook(area.id, { name: 'Caderno 1' });
    const nb2 = makeNotebook(area.id, { name: 'Caderno 2' });
    await createKnowledgeNotebook(nb1);
    await createKnowledgeNotebook(nb2);
    // 2 notas em cada caderno (4 notas total).
    await createKnowledgeNote(makeNote(nb1.id));
    await createKnowledgeNote(makeNote(nb1.id));
    await createKnowledgeNote(makeNote(nb2.id));
    await createKnowledgeNote(makeNote(nb2.id));

    expect(await db.knowledge_notebooks.where('areaId').equals(area.id).count()).toBe(2);
    expect(await db.knowledge_notes.where('notebookId').equals(nb1.id).count()).toBe(2);
    expect(await db.knowledge_notes.where('notebookId').equals(nb2.id).count()).toBe(2);

    await deleteKnowledgeArea(area.id);

    expect(await getKnowledgeArea(area.id)).toBeUndefined();
    expect(await db.knowledge_notebooks.where('areaId').equals(area.id).count()).toBe(0);
    expect(await db.knowledge_notes.where('notebookId').equals(nb1.id).count()).toBe(0);
    expect(await db.knowledge_notes.where('notebookId').equals(nb2.id).count()).toBe(0);
  });

  it('deleteKnowledgeArea não afecta outras áreas, cadernos ou notas (isolamento)', async () => {
    const areaA = makeArea({ name: 'A' });
    const areaB = makeArea({ name: 'B' });
    await createKnowledgeArea(areaA);
    await createKnowledgeArea(areaB);
    const nbA = makeNotebook(areaA.id);
    const nbB = makeNotebook(areaB.id);
    await createKnowledgeNotebook(nbA);
    await createKnowledgeNotebook(nbB);
    await createKnowledgeNote(makeNote(nbA.id));
    const noteB = makeNote(nbB.id);
    await createKnowledgeNote(noteB);

    await deleteKnowledgeArea(areaA.id);

    expect(await getKnowledgeArea(areaB.id)).toBeDefined();
    expect(await db.knowledge_notebooks.where('areaId').equals(areaB.id).count()).toBe(1);
    expect(await db.knowledge_notes.where('notebookId').equals(nbB.id).count()).toBe(1);
  });
});
