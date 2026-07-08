import { describe, it, expect, beforeEach } from 'vitest';
import { zipSync, unzipSync } from 'fflate';
import { buildBackupZip, DB_EXPORT_FILENAME } from '@/lib/backup/export';
import { restoreFromZip } from '@/lib/backup/restore';
import { db } from '@/lib/db/client';

/**
 * Nexus v2 — lib/backup/restore.ts tests (Story 9.7 — AC2/3/4/6/7/10)
 *
 * `fake-indexeddb/auto` (tests/setup.ts) dá um IndexedDB real em jsdom → `db`
 * funciona sem browser. Cobre os 7 cenários mínimos do AC10 (a-g), com destaque
 * para o AC10f (JSON corrompido a meio → estado ANTES ≡ estado DEPOIS), que é o
 * coração anti-M4 desta story: prova que a transacção atómica reverte por completo.
 *
 * Gotcha herdada da 9.6: os bytes lidos/escritos por `unzipSync`/`zipSync` têm de
 * ser `Uint8Array` do mesmo realm — construir sempre via `new Uint8Array(...)`.
 */

/** Lê um Blob como bytes (o Blob sob jsdom pode não expor arrayBuffer). */
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

const encode = (text: string): Uint8Array => new Uint8Array(new TextEncoder().encode(text));
const decode = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/** Extrai a string JSON de `nexus-db-export.json` de dentro de um ZIP de backup. */
async function readBackupJson(zipBlob: Blob): Promise<string> {
  const files = unzipSync(await readBlobBytes(zipBlob));
  return decode(files[DB_EXPORT_FILENAME]);
}

/** Monta um ZIP com uma única entrada `nexus-db-export.json` a partir de uma string. */
function zipFromJson(jsonString: string): Blob {
  const zipped = zipSync({ [DB_EXPORT_FILENAME]: encode(jsonString) });
  return new Blob([zipped as BlobPart], { type: 'application/zip' });
}

interface FixtureTask {
  id: string;
  title: string;
  status: string;
  tags: string[];
  createdAt: number;
}

function makeTask(id: string, title: string): FixtureTask {
  return { id, title, status: 'todo', tags: [], createdAt: 1 };
}

async function addTasks(tasks: FixtureTask[]): Promise<void> {
  await db.tasks.bulkAdd(tasks as unknown as Parameters<typeof db.tasks.bulkAdd>[0]);
}

async function taskTitles(): Promise<string[]> {
  const rows = (await db.tasks.toArray()) as unknown as FixtureTask[];
  return rows.map((t) => t.title).sort();
}

beforeEach(async () => {
  await Promise.all([db.tasks.clear(), db.projects.clear(), db.knowledge_notes.clear()]);
});

describe('restoreFromZip — round-trip (AC10a)', () => {
  it('export → clear → import devolve os dados idênticos', async () => {
    await addTasks([makeTask('t-1', 'Alpha'), makeTask('t-2', 'Beta')]);
    const zip = await buildBackupZip(db);

    // Simular uma DB diferente (limpa).
    await db.tasks.clear();
    expect(await db.tasks.count()).toBe(0);

    const summary = await restoreFromZip(zip, db);

    expect(await taskTitles()).toEqual(['Alpha', 'Beta']);
    expect(summary.tablesRestored).toBeGreaterThan(0);
    expect(summary.rowsRestored).toBeGreaterThanOrEqual(2);
  });
});

describe('restoreFromZip — ZIP sem a entrada esperada (AC10b)', () => {
  it('ZIP sem nexus-db-export.json → missing-json, DB intocada', async () => {
    await addTasks([makeTask('t-1', 'Preservada')]);
    const before = await taskTitles();

    const zipped = zipSync({ 'outro-ficheiro.txt': encode('nada a ver') });
    const bogusZip = new Blob([zipped as BlobPart], { type: 'application/zip' });

    await expect(restoreFromZip(bogusZip, db)).rejects.toMatchObject({
      reason: 'missing-json',
    });
    // Nenhuma tabela tocada (a validação falha antes de Dexie).
    expect(await taskTitles()).toEqual(before);
  });

  it('ZIP inválido/corrompido (bytes que não são um ZIP) → missing-json', async () => {
    const garbage = new Blob([encode('isto não é um zip') as BlobPart], {
      type: 'application/zip',
    });
    await expect(restoreFromZip(garbage, db)).rejects.toMatchObject({
      reason: 'missing-json',
    });
  });
});

describe('restoreFromZip — nome/versão incompatíveis (AC10c/AC10d)', () => {
  it('databaseName diferente → name-mismatch, DB intocada', async () => {
    await addTasks([makeTask('t-1', 'Original')]);
    const json = JSON.parse(await readBackupJson(await buildBackupZip(db)));
    json.data.databaseName = 'outra_base';
    const tamperedZip = zipFromJson(JSON.stringify(json));

    await expect(restoreFromZip(tamperedZip, db)).rejects.toMatchObject({
      reason: 'name-mismatch',
    });
    expect(await taskTitles()).toEqual(['Original']);
  });

  it('databaseVersion diferente (7 != db.verno 6) → version-mismatch, DB intocada', async () => {
    await addTasks([makeTask('t-1', 'Original')]);
    const json = JSON.parse(await readBackupJson(await buildBackupZip(db)));
    json.data.databaseVersion = db.verno + 1;
    const tamperedZip = zipFromJson(JSON.stringify(json));

    await expect(restoreFromZip(tamperedZip, db)).rejects.toMatchObject({
      reason: 'version-mismatch',
    });
    expect(await taskTitles()).toEqual(['Original']);
  });
});

describe('restoreFromZip — substituição total (AC10e)', () => {
  it('importar backup de B sobre DB com A → só ficam os dados de B', async () => {
    // Backup com dados B.
    await addTasks([makeTask('b-1', 'DadoB1'), makeTask('b-2', 'DadoB2')]);
    const zipB = await buildBackupZip(db);

    // DB passa a ter dados A (diferentes).
    await db.tasks.clear();
    await addTasks([makeTask('a-1', 'DadoA1'), makeTask('a-2', 'DadoA2'), makeTask('a-3', 'DadoA3')]);

    await restoreFromZip(zipB, db);

    // Só os dados B sobrevivem — os A deixam de existir (substituição, não fusão).
    expect(await taskTitles()).toEqual(['DadoB1', 'DadoB2']);
  });
});

describe('restoreFromZip — falha a meio não deixa DB parcial (AC10f/AC7) [anti-M4]', () => {
  it('JSON truncado/corrompido a meio dos dados → rejeita e o estado antes ≡ depois', async () => {
    // ACHADO DE EXECUÇÃO (FLAG @architect): a atomicidade nativa do `importInto` NÃO
    // protege sozinha este caminho — o parser em streaming tolera JSON truncado e
    // COMITA dados parciais (ex.: 19 de 30 linhas) sem lançar. A defesa real é a
    // validação de integridade total (`assertBackupParseable`, JSON.parse do texto
    // completo) ANTES de escrever: um JSON corrompido é rejeitado com ZERO escrita.
    // Este teste prova a propriedade observável anti-M4: estado ANTES ≡ estado DEPOIS.

    // DB com dados reais que NÃO podem ser perdidos por uma importação falhada.
    async function seedKeepState(): Promise<void> {
      await db.tasks.clear();
      await db.projects.clear();
      await addTasks([makeTask('keep-1', 'Manter1'), makeTask('keep-2', 'Manter2')]);
      await db.projects.bulkAdd([
        { id: 'p-1', name: 'Projecto A' },
      ] as unknown as Parameters<typeof db.projects.bulkAdd>[0]);
    }

    // Backup válido de OUTRO conjunto de dados (muitas linhas para o array de dados
    // ser grande), depois truncado a meio do array `"data":[` — nunca deve ser escrito.
    await db.tasks.clear();
    await addTasks(Array.from({ length: 30 }, (_, i) => makeTask(`x-${i}`, `NuncaEscrito${i}`)));
    const validJson = await readBackupJson(await buildBackupZip(db));

    await seedKeepState();
    const snapshotTasksBefore = await taskTitles();
    const snapshotProjectsBefore = (await db.projects.toArray()).length;

    const rowsArrayStart = validJson.indexOf('"data":[', validJson.indexOf('"tables":['));
    expect(rowsArrayStart).toBeGreaterThan(0);
    // Cortar a meio do array de linhas: JSON incompleto → JSON.parse falha (pré-escrita).
    const cut = rowsArrayStart + Math.floor((validJson.length - rowsArrayStart) / 2);
    const corruptedZip = zipFromJson(validJson.slice(0, cut));

    await expect(restoreFromZip(corruptedZip, db)).rejects.toMatchObject({
      reason: 'invalid-format',
    });

    // O coração da story: estado ANTES ≡ estado DEPOIS (nenhuma escrita parcial).
    expect(await taskTitles()).toEqual(snapshotTasksBefore);
    expect((await db.projects.toArray()).length).toBe(snapshotProjectsBefore);
    expect(await taskTitles()).not.toContain('NuncaEscrito0');
  });
});

describe('restoreFromZip — idempotência (AC10g/AC6)', () => {
  it('reimportar o mesmo ZIP duas vezes não duplica registos', async () => {
    await addTasks([makeTask('t-1', 'Um'), makeTask('t-2', 'Dois')]);
    const zip = await buildBackupZip(db);

    await restoreFromZip(zip, db);
    const countAfterFirst = await db.tasks.count();

    await restoreFromZip(zip, db);
    const countAfterSecond = await db.tasks.count();

    expect(countAfterSecond).toBe(countAfterFirst);
    expect(await taskTitles()).toEqual(['Dois', 'Um']);
  });
});
