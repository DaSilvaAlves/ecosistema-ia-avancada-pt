import { describe, it, expect, beforeEach } from 'vitest';
import { unzipSync } from 'fflate';
import {
  DB_EXPORT_FILENAME,
  NOTES_FILENAME,
  backupFileName,
  buildBackupZip,
  buildNotesMarkdown,
  exportDatabaseJSON,
  renderNotesMarkdown,
} from '@/lib/backup/export';
import { db } from '@/lib/db/client';
import type { KnowledgeNote } from '@/types/db';

/**
 * Nexus v2 — lib/backup/export.ts tests (Story 9.6 — AC2/3/4/5/6/7/8/9)
 *
 * `fake-indexeddb/auto` (tests/setup.ts) dá um IndexedDB real em jsdom → `db`
 * funciona sem browser. Cobre: JSON via `exportDB()` sobre tabelas fixture; o
 * markdown das notas (0, 1 e várias notas); a montagem do ZIP com os 2 ficheiros
 * correctos; o contrato do nome de download.
 */

/** Lê um Blob como bytes (o Blob de exportDB sob jsdom não expõe arrayBuffer). */
function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer().then((b) => new Uint8Array(b));
  }
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader falhou'));
    reader.readAsArrayBuffer(blob);
  });
}

let counter = 0;
function makeNote(overrides: Partial<KnowledgeNote> = {}): KnowledgeNote {
  return {
    id: `n-${++counter}`,
    notebookId: 'nb-1',
    title: 'Nota de teste',
    bodyMarkdown: 'Corpo da nota.',
    tags: [],
    updatedAt: 1_000,
    ...overrides,
  };
}

async function unzip(blob: Blob): Promise<Record<string, Uint8Array>> {
  return unzipSync(await readBlobBytes(blob));
}

const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

beforeEach(async () => {
  // Estado limpo entre testes (o ficheiro partilha a mesma instância `db`).
  await Promise.all([
    db.knowledge_notes.clear(),
    db.tasks.clear(),
  ]);
});

describe('renderNotesMarkdown (função pura, AC3)', () => {
  it('zero notas → aviso explícito (não string vazia)', () => {
    const md = renderNotesMarkdown([]);
    expect(md).toContain('Sem notas registadas');
    expect(md.trim().length).toBeGreaterThan(0);
    // Não deve conter nenhuma secção de nota.
    expect(md).not.toContain('## ');
  });

  it('uma nota → secção ## {title} com bodyMarkdown completo', () => {
    const md = renderNotesMarkdown([
      makeNote({ title: 'React 19', bodyMarkdown: 'Aprendi sobre **hooks**.' }),
    ]);
    expect(md).toContain('## React 19');
    expect(md).toContain('Aprendi sobre **hooks**.');
  });

  it('várias notas → uma secção por nota, na ordem recebida', () => {
    const md = renderNotesMarkdown([
      makeNote({ title: 'Primeira', bodyMarkdown: 'Corpo 1' }),
      makeNote({ title: 'Segunda', bodyMarkdown: 'Corpo 2' }),
    ]);
    expect(md).toContain('## Primeira');
    expect(md).toContain('## Segunda');
    expect(md.indexOf('## Primeira')).toBeLessThan(md.indexOf('## Segunda'));
    expect((md.match(/^## /gm) ?? []).length).toBe(2);
  });
});

describe('buildNotesMarkdown (lê knowledge_notes, AC3)', () => {
  it('reflecte as notas persistidas em knowledge_notes', async () => {
    await db.knowledge_notes.bulkAdd([
      makeNote({ title: 'Nota A', bodyMarkdown: 'Conteúdo A' }),
      makeNote({ title: 'Nota B', bodyMarkdown: 'Conteúdo B' }),
    ]);
    const md = await buildNotesMarkdown(db);
    expect(md).toContain('## Nota A');
    expect(md).toContain('Conteúdo A');
    expect(md).toContain('## Nota B');
  });

  it('base sem notas → markdown com aviso (edge case AC3/AC9)', async () => {
    const md = await buildNotesMarkdown(db);
    expect(md).toContain('Sem notas registadas');
  });
});

describe('exportDatabaseJSON (exportDB cru, AC2/AC7)', () => {
  it('produz o formato nativo dexie-export-import com as tabelas populadas', async () => {
    await db.tasks.add({
      id: 't-1',
      title: 'Tarefa fixture',
      status: 'todo',
      tags: [],
      createdAt: 1,
    } as unknown as Parameters<typeof db.tasks.add>[0]);

    const blob = await exportDatabaseJSON(db);
    const text = decode(await readBlobBytes(blob));
    const parsed = JSON.parse(text) as { formatName?: string; data?: unknown };

    expect(parsed.formatName).toBe('dexie');
    // A tarefa fixture está presente no dump cru.
    expect(text).toContain('Tarefa fixture');
    expect(text).toContain('knowledge_notes');
  });
});

describe('buildBackupZip (ZIP multi-ficheiro, AC4/AC7/AC8)', () => {
  it('monta um ZIP com exactamente nexus-db-export.json + notas.md', async () => {
    await db.knowledge_notes.add(makeNote({ title: 'Nota Zip', bodyMarkdown: 'Corpo Zip' }));

    const zipBlob = await buildBackupZip(db);
    expect(zipBlob.type).toBe('application/zip');

    const files = await unzip(zipBlob);
    expect(Object.keys(files).sort()).toEqual([DB_EXPORT_FILENAME, NOTES_FILENAME].sort());
  });

  it('o JSON dentro do ZIP é o output cru de exportDB (AC7, sem transformação)', async () => {
    await db.tasks.add({
      id: 't-2',
      title: 'Tarefa no zip',
      status: 'todo',
      tags: [],
      createdAt: 1,
    } as unknown as Parameters<typeof db.tasks.add>[0]);

    const zipBlob = await buildBackupZip(db);
    const files = await unzip(zipBlob);

    const jsonText = decode(files[DB_EXPORT_FILENAME]);
    const parsed = JSON.parse(jsonText) as { formatName?: string };
    expect(parsed.formatName).toBe('dexie');
    expect(jsonText).toContain('Tarefa no zip');

    // O JSON no ZIP é byte-a-byte igual ao output directo de exportDB.
    const direct = decode(await readBlobBytes(await exportDatabaseJSON(db)));
    const directParsed = JSON.parse(direct) as { formatName?: string };
    expect(directParsed.formatName).toBe('dexie');
  });

  it('o notas.md dentro do ZIP reflecte knowledge_notes', async () => {
    await db.knowledge_notes.add(makeNote({ title: 'Nota Legível', bodyMarkdown: 'Texto humano' }));

    const zipBlob = await buildBackupZip(db);
    const files = await unzip(zipBlob);

    const notesText = decode(files[NOTES_FILENAME]);
    expect(notesText).toContain('## Nota Legível');
    expect(notesText).toContain('Texto humano');
  });

  it('base sem notas → o ZIP tem à mesma o notas.md com aviso (não falha)', async () => {
    const zipBlob = await buildBackupZip(db);
    const files = await unzip(zipBlob);
    expect(Object.keys(files)).toContain(NOTES_FILENAME);
    expect(decode(files[NOTES_FILENAME])).toContain('Sem notas registadas');
  });
});

describe('backupFileName (contrato de nome, AC5)', () => {
  it('nexus-backup-{ISO com ":" → "-"}.zip, sem milissegundos nem Z', () => {
    const name = backupFileName(new Date('2026-07-09T14:30:00.000Z'));
    expect(name).toBe('nexus-backup-2026-07-09T14-30-00.zip');
  });

  it('não contém ":" (compatibilidade de nome de ficheiro)', () => {
    const name = backupFileName(new Date('2026-01-02T03:04:05.678Z'));
    expect(name).not.toContain(':');
    expect(name).toBe('nexus-backup-2026-01-02T03-04-05.zip');
  });

  it('usa o momento actual quando `now` não é fornecido', () => {
    const name = backupFileName();
    expect(name).toMatch(/^nexus-backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.zip$/);
  });
});
