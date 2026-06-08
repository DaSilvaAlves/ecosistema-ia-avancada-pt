import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { createKnowledgeArea } from '@/lib/db/repos/knowledge-areas';
import {
  createKnowledgeNotebook,
  getKnowledgeNotebook,
  listNotebooksByArea,
  updateKnowledgeNotebook,
  deleteKnowledgeNotebook,
} from '@/lib/db/repos/knowledge-notebooks';
import { createKnowledgeNote } from '@/lib/db/repos/knowledge-notes';
import type { KnowledgeArea, KnowledgeNotebook, KnowledgeNote } from '@/types/db';

/**
 * Nexus v2 — knowledge_notebooks repo tests (Story 5.1 / AC8)
 * Inclui a cascata de 1 nível (AC7) — teste NÃO-TAUTOLÓGICO.
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
  return { id: crypto.randomUUID(), areaId, name: 'TypeScript', ...overrides };
}

function makeNote(notebookId: string, overrides: Partial<KnowledgeNote> = {}): KnowledgeNote {
  return {
    id: crypto.randomUUID(),
    notebookId,
    title: 'Generics',
    bodyMarkdown: 'Notas.',
    tags: [],
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('knowledge-notebooks repo', () => {
  let area: KnowledgeArea;

  beforeEach(async () => {
    await db.knowledge_areas.clear();
    await db.knowledge_notebooks.clear();
    await db.knowledge_notes.clear();
    area = makeArea();
    await createKnowledgeArea(area);
  });

  it('createKnowledgeNotebook + getKnowledgeNotebook roundtrip', async () => {
    const nb = makeNotebook(area.id);
    await createKnowledgeNotebook(nb);
    expect(await getKnowledgeNotebook(nb.id)).toEqual(nb);
  });

  it('createKnowledgeNotebook rejeita caderno órfão (área inexistente)', async () => {
    const orphan = makeNotebook(crypto.randomUUID());
    await expect(createKnowledgeNotebook(orphan)).rejects.toThrow(/não é possível criar caderno órfão/);
  });

  it('createKnowledgeNotebook rejeita areaId não-UUID', async () => {
    await expect(
      createKnowledgeNotebook(makeNotebook('nope' as string)),
    ).rejects.toThrow();
  });

  it('createKnowledgeNotebook rejeita nome vazio com mensagem PT-PT', async () => {
    await expect(createKnowledgeNotebook(makeNotebook(area.id, { name: '' }))).rejects.toThrow(
      /Nome do caderno é obrigatório/,
    );
  });

  it('listNotebooksByArea devolve só os cadernos da área, ordenados (PT-PT)', async () => {
    const other = makeArea({ name: 'Outra' });
    await createKnowledgeArea(other);
    await createKnowledgeNotebook(makeNotebook(area.id, { name: 'Zod' }));
    await createKnowledgeNotebook(makeNotebook(area.id, { name: 'Async' }));
    await createKnowledgeNotebook(makeNotebook(other.id, { name: 'Nada a ver' }));

    const result = await listNotebooksByArea(area.id);
    expect(result.map((n) => n.name)).toEqual(['Async', 'Zod']);
  });

  it('updateKnowledgeNotebook aplica patch parcial', async () => {
    const nb = makeNotebook(area.id, { name: 'Antes' });
    await createKnowledgeNotebook(nb);
    await updateKnowledgeNotebook(nb.id, { name: 'Depois' });
    expect((await getKnowledgeNotebook(nb.id))?.name).toBe('Depois');
  });

  it('updateKnowledgeNotebook lança se id não existe', async () => {
    await expect(
      updateKnowledgeNotebook('00000000-0000-0000-0000-000000000000', { name: 'X' }),
    ).rejects.toThrow(/não encontrado/i);
  });

  // Teste NÃO-TAUTOLÓGICO de cascata de 1 nível (AC7).
  it('deleteKnowledgeNotebook elimina em cascata as notas do caderno', async () => {
    const nb = makeNotebook(area.id);
    await createKnowledgeNotebook(nb);
    await createKnowledgeNote(makeNote(nb.id));
    await createKnowledgeNote(makeNote(nb.id));
    await createKnowledgeNote(makeNote(nb.id));
    expect(await db.knowledge_notes.where('notebookId').equals(nb.id).count()).toBe(3);

    await deleteKnowledgeNotebook(nb.id);

    expect(await getKnowledgeNotebook(nb.id)).toBeUndefined();
    expect(await db.knowledge_notes.where('notebookId').equals(nb.id).count()).toBe(0);
  });

  it('deleteKnowledgeNotebook não afecta notas de outros cadernos', async () => {
    const nbA = makeNotebook(area.id);
    const nbB = makeNotebook(area.id);
    await createKnowledgeNotebook(nbA);
    await createKnowledgeNotebook(nbB);
    await createKnowledgeNote(makeNote(nbA.id));
    await createKnowledgeNote(makeNote(nbB.id));

    await deleteKnowledgeNotebook(nbA.id);

    expect(await db.knowledge_notes.where('notebookId').equals(nbA.id).count()).toBe(0);
    expect(await db.knowledge_notes.where('notebookId').equals(nbB.id).count()).toBe(1);
  });
});
