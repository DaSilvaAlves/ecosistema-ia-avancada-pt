import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import {
  createJournalEntry,
  getJournalEntry,
  getJournalEntryByDate,
  listJournalEntriesByDateRange,
  searchJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
} from '@/lib/db/repos/journal-entries';
import type { JournalEntry } from '@/types/db';

/**
 * Nexus v2 — journal_entries repo tests (Story 5.1 / AC8)
 * fake-indexeddb carregado via tests/setup.ts.
 */

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: crypto.randomUUID(),
    date: '2026-06-07',
    mood: 3,
    bodyMarkdown: 'Hoje foi um dia produtivo.',
    ...overrides,
  };
}

describe('journal-entries repo', () => {
  beforeEach(async () => {
    await db.journal_entries.clear();
  });

  it('createJournalEntry + getJournalEntry roundtrip', async () => {
    const entry = makeEntry();
    await createJournalEntry(entry);
    expect(await getJournalEntry(entry.id)).toEqual(entry);
  });

  it('createJournalEntry aceita structuredAI opcional', async () => {
    const entry = makeEntry({
      structuredAI: { whatHappened: 'X', whatLearned: 'Y', whatFelt: 'Z' },
    });
    await createJournalEntry(entry);
    const got = await getJournalEntry(entry.id);
    expect(got?.structuredAI).toEqual({ whatHappened: 'X', whatLearned: 'Y', whatFelt: 'Z' });
  });

  it('createJournalEntry rejeita id não-UUID', async () => {
    await expect(createJournalEntry(makeEntry({ id: 'nope' }))).rejects.toThrow();
  });

  it('createJournalEntry rejeita mood fora de {1-5}', async () => {
    await expect(
      createJournalEntry(makeEntry({ mood: 6 as unknown as JournalEntry['mood'] })),
    ).rejects.toThrow();
    await expect(
      createJournalEntry(makeEntry({ mood: 0 as unknown as JournalEntry['mood'] })),
    ).rejects.toThrow();
  });

  it('createJournalEntry rejeita date não-YYYY-MM-DD', async () => {
    await expect(createJournalEntry(makeEntry({ date: '07/06/2026' }))).rejects.toThrow(
      /YYYY-MM-DD/,
    );
    await expect(
      createJournalEntry(makeEntry({ date: '2026-06-07T10:00:00Z' })),
    ).rejects.toThrow(/YYYY-MM-DD/);
  });

  it('createJournalEntry rejeita corpo vazio com mensagem PT-PT', async () => {
    await expect(createJournalEntry(makeEntry({ bodyMarkdown: '' }))).rejects.toThrow(
      /corpo da entrada de diário é obrigatório/,
    );
  });

  it('getJournalEntryByDate devolve a entrada do dia', async () => {
    await createJournalEntry(makeEntry({ date: '2026-06-01' }));
    const target = makeEntry({ date: '2026-06-07' });
    await createJournalEntry(target);
    const got = await getJournalEntryByDate('2026-06-07');
    expect(got?.id).toBe(target.id);
  });

  it('getJournalEntryByDate devolve undefined se não existe', async () => {
    expect(await getJournalEntryByDate('2099-01-01')).toBeUndefined();
  });

  it('listJournalEntriesByDateRange filtra inclusivo e ordena ascendente', async () => {
    await createJournalEntry(makeEntry({ date: '2026-05-30' }));
    await createJournalEntry(makeEntry({ date: '2026-06-01' }));
    await createJournalEntry(makeEntry({ date: '2026-06-05' }));
    await createJournalEntry(makeEntry({ date: '2026-06-10' }));

    const result = await listJournalEntriesByDateRange('2026-06-01', '2026-06-05');
    expect(result.map((e) => e.date)).toEqual(['2026-06-01', '2026-06-05']);
  });

  it('searchJournalEntries encontra por bodyMarkdown e structuredAI (case-insensitive)', async () => {
    await createJournalEntry(
      makeEntry({ date: '2026-06-01', bodyMarkdown: 'Reunião sobre o ORÇAMENTO' }),
    );
    await createJournalEntry(
      makeEntry({
        date: '2026-06-02',
        bodyMarkdown: 'Dia normal',
        structuredAI: { whatLearned: 'Aprendi sobre orçamento participativo' },
      }),
    );
    await createJournalEntry(makeEntry({ date: '2026-06-03', bodyMarkdown: 'Outra coisa' }));

    const result = await searchJournalEntries('orçamento');
    expect(result).toHaveLength(2);
    // Ordenado descendente por data (mais recente primeiro).
    expect(result.map((e) => e.date)).toEqual(['2026-06-02', '2026-06-01']);
  });

  it('searchJournalEntries devolve vazio para query em branco', async () => {
    await createJournalEntry(makeEntry());
    expect(await searchJournalEntries('   ')).toEqual([]);
  });

  it('updateJournalEntry aplica patch parcial', async () => {
    const entry = makeEntry({ mood: 2 });
    await createJournalEntry(entry);
    await updateJournalEntry(entry.id, { mood: 5, bodyMarkdown: 'Melhorou' });
    const got = await getJournalEntry(entry.id);
    expect(got?.mood).toBe(5);
    expect(got?.bodyMarkdown).toBe('Melhorou');
  });

  it('updateJournalEntry lança se id não existe', async () => {
    await expect(
      updateJournalEntry('00000000-0000-0000-0000-000000000000', { mood: 4 }),
    ).rejects.toThrow(/não encontrada/i);
  });

  it('deleteJournalEntry remove a entrada', async () => {
    const entry = makeEntry();
    await createJournalEntry(entry);
    await deleteJournalEntry(entry.id);
    expect(await getJournalEntry(entry.id)).toBeUndefined();
  });
});
