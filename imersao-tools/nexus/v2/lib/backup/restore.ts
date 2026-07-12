import { importInto, peakImportFile, type DexieExportJsonMeta } from 'dexie-export-import';
import { unzipSync } from 'fflate';
import { db, type NexusDB } from '@/lib/db/client';
import { DB_EXPORT_FILENAME } from '@/lib/backup/export';

/**
 * Nexus v2 — Backup restore/import (Story 9.7)
 *
 * Import DESTRUTIVO e inteiramente CLIENT-SIDE: substitui as 22 tabelas Dexie
 * pelos dados de um ZIP de backup gerado pela Story 9.6. Ao contrário do export
 * (só-leitura, 9.6), esta é a peça de maior risco de estado do Epic 9 — escreve
 * de forma destrutiva. Por isso a ordem é INEGOCIÁVEL:
 *
 *   1. desempacotar o ZIP (`fflate.unzipSync`)
 *   2. localizar a entrada `DB_EXPORT_FILENAME` (contrato fixo da 9.6)  ← AC2
 *   3. validar o formato com `peakImportFile` (`formatName === 'dexie'`) ← AC3
 *   4. [confirmação destrutiva do utilizador — no componente, AC5]
 *   5. só ENTÃO `importInto(..., { clearTablesBeforeImport, overwriteValues })`
 *
 * NENHUMA escrita em Dexie acontece antes dos passos 2-4. As validações de
 * nome/versão da base de dados são feitas pela própria lib DENTRO de `importInto`
 * mas ANTES de qualquer escrita (dexie-export-import 4.4.0, L3416-3420 do source,
 * antes do `clearTablesBeforeImport` L3434) — por isso um backup incompatível é
 * rejeitado sem tocar nas tabelas (AC4). Esta camada apenas captura e reclassifica
 * os `Error` nativos da lib em `RestoreError` tipado.
 *
 * ATOMICIDADE (AC7) — DEFESA EM DUAS CAMADAS:
 *
 *   [FLAG @architect — achado de execução, ver Change Log] A atomicidade nativa do
 *   `importInto` NÃO é suficiente sozinha para o caminho "JSON corrompido a meio dos
 *   dados". Confirmado por execução real (dexie-export-import 4.4.0): o parser em
 *   streaming (`JsonStream`) TOLERA um JSON truncado/estragado no array de dados —
 *   quando o stream termina prematuramente, o `importInto` NÃO lança; termina com
 *   sucesso tendo escrito apenas as linhas que conseguiu parsear (ex.: 19 de 30). Ou
 *   seja: as tabelas são limpas (`clearTablesBeforeImport`) e depois só parcialmente
 *   reescritas, e a transacção COMMITA — silent partial loss, exactamente o anti-M4
 *   que esta story tem de impedir. A transacção nativa só reverte quando `importInto`
 *   REALMENTE lança (ex.: erro de escrita Dexie numa linha válida-em-JSON).
 *
 *   Camada 1 (fecha o buraco acima): validar que o JSON está INTEGRALMENTE parseável
 *   (`JSON.parse` do texto completo) ANTES de tocar em Dexie. Um JSON truncado/
 *   corrompido falha aqui → `RestoreError('invalid-format')` com ZERO escrita. Como
 *   `JSON.parse` do texto completo só passa se o ficheiro estiver íntegro, garante
 *   que o `importInto` a seguir lê todas as linhas sem terminar a meio.
 *
 *   Camada 2 (transacção nativa): NUNCA se passa `noTransaction: true`. Para um erro
 *   genuíno DURANTE a escrita (linha válida em JSON mas rejeitada por Dexie), o
 *   `importInto` lança e a transacção reverte por completo.
 *
 *   As duas camadas juntas garantem o all-or-nothing observável: a DB nunca fica
 *   parcialmente escrita — ou fica no estado do backup, ou intocada.
 *
 * As strings PT-PT de erro NÃO vivem aqui — vivem no componente `RestoreSettings`
 * (padrão `lib/backup/export.ts` / `BackupSettings.tsx`). Esta lib expõe apenas o
 * `reason` discriminado para o componente escolher a mensagem certa.
 *
 * Trace: AC2, AC3, AC4, AC6, AC7, AC8, AC10.
 */

/** Causa discriminada de falha de restore — mapeia 1:1 para uma mensagem PT-PT no componente. */
export type RestoreErrorReason =
  | 'missing-json' // ZIP inválido/corrompido ou sem a entrada nexus-db-export.json (AC2)
  | 'invalid-format' // entrada existe mas não é um export dexie reconhecível (AC3)
  | 'name-mismatch' // databaseName do backup != nexus_v2 (AC4)
  | 'version-mismatch' // databaseVersion do backup != db.verno actual (AC4)
  | 'transaction-failed'; // erro a meio da importação — transacção revertida (AC7)

/** Erro tipado de restore. O `reason` discrimina a causa para a UI escolher a mensagem PT-PT. */
export class RestoreError extends Error {
  readonly reason: RestoreErrorReason;

  constructor(reason: RestoreErrorReason, detail?: string) {
    super(detail ? `${reason}: ${detail}` : reason);
    this.name = 'RestoreError';
    this.reason = reason;
    // Preserva a cadeia de protótipos ao estender Error com target ES2015+.
    Object.setPrototypeOf(this, RestoreError.prototype);
  }
}

/** Resumo de um restore bem-sucedido — derivado dos metadados do backup (AC8). */
export interface RestoreSummary {
  /** Número de tabelas presentes no backup (metadados de `peakImportFile`). */
  tablesRestored: number;
  /** Número total de registos restaurados (soma dos `rowCount` do backup). */
  rowsRestored: number;
}

/**
 * Lê um Blob como bytes crus. Usa `Blob.arrayBuffer()` (browsers reais) e cai para
 * `FileReader` quando indisponível (o Blob sob jsdom/testes não expõe
 * `arrayBuffer`/`text`, só `slice`).
 *
 * [AUTO-DECISION] Duplicado do `blobToUint8` de `lib/backup/export.ts` (~10 linhas)
 * em vez de extrair um util partilhado — evita tocar num ficheiro de uma story já
 * `Done` (9.6) só para um refactor não-comportamental; mantém o diff da 9.7
 * auto-contido para o gate `@architect`.
 */
async function readBlobBytes(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader falhou a ler o Blob'));
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Desempacota o ZIP e devolve a entrada `nexus-db-export.json` como Blob. Se o ZIP
 * for inválido/corrompido (falha de `unzipSync`) ou não contiver a entrada esperada
 * (ZIP de outra origem, vazio), lança `RestoreError('missing-json')` **antes** de
 * qualquer interacção com Dexie (AC2).
 */
export async function extractBackupJson(zipBlob: Blob): Promise<Blob> {
  const zipBytes = await readBlobBytes(zipBlob);

  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(zipBytes);
  } catch {
    // ZIP inválido/corrompido → não conseguimos sequer localizar a entrada esperada.
    throw new RestoreError('missing-json');
  }

  const jsonBytes = entries[DB_EXPORT_FILENAME];
  if (!jsonBytes) {
    throw new RestoreError('missing-json');
  }

  // Cast igual ao de `export.ts`: `fflate` tipa como `Uint8Array<ArrayBufferLike>`;
  // `zipSync` aloca sempre um `ArrayBuffer` normal, pelo que o cast é seguro.
  return new Blob([jsonBytes as BlobPart], { type: 'application/json' });
}

/**
 * Garante que o JSON de backup está INTEGRALMENTE parseável ANTES de qualquer
 * escrita destrutiva (Camada 1 da atomicidade — ver doc do módulo). Um JSON
 * truncado/corrompido lança `RestoreError('invalid-format')` aqui, com zero
 * interacção com Dexie. Fecha o buraco de silent-partial-import do parser em
 * streaming do `importInto` (que tolera JSON incompleto e comita dados parciais).
 */
export async function assertBackupParseable(jsonBlob: Blob): Promise<void> {
  const text = new TextDecoder().decode(await readBlobBytes(jsonBlob));
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new RestoreError('invalid-format');
  }
  // Estrutura mínima de um export dexie completo: `data.data` é o array de tabelas
  // com as linhas. Se estiver ausente/não-array, o ficheiro não é um export íntegro.
  const data = (parsed as { data?: { data?: unknown } } | null)?.data;
  if (!data || !Array.isArray(data.data)) {
    throw new RestoreError('invalid-format');
  }
}

/**
 * Lê os metadados do JSON de backup via `peakImportFile` (SEM importar) e valida
 * que é um export dexie reconhecível (`formatName === 'dexie'`). Serve também para
 * obter a contagem de tabelas/registos para a mensagem de sucesso (AC8). Se o
 * parsing falhar ou o formato não for reconhecido, lança
 * `RestoreError('invalid-format')` (AC3) — antes de qualquer escrita.
 */
export async function peekBackupMeta(jsonBlob: Blob): Promise<DexieExportJsonMeta> {
  let meta: DexieExportJsonMeta;
  try {
    meta = await peakImportFile(jsonBlob);
  } catch {
    throw new RestoreError('invalid-format');
  }
  if (meta.formatName !== 'dexie') {
    throw new RestoreError('invalid-format');
  }
  return meta;
}

/**
 * Orquestra o restore completo (AC2→AC8): extrai o JSON do ZIP, valida o formato,
 * e só depois importa de forma destrutiva e atómica.
 *
 * A validação de nome/versão da base de dados é feita pela lib dentro de
 * `importInto`, ANTES de escrever (source L3416-3420 < L3434). Aqui apenas se
 * capturam e reclassificam os `Error` nativos ("Name differs...", "Database
 * version differs...") em `RestoreError`; qualquer outro erro durante a transacção
 * (ex.: JSON corrompido a meio dos dados) vira `RestoreError('transaction-failed')`
 * — e a transacção nativa reverte, deixando a DB intocada (AC7).
 *
 * @param zipBlob  o ZIP de backup (gerado pela Story 9.6).
 * @param database instância Dexie alvo (default: `db` real; injectável em testes).
 */
export async function restoreFromZip(
  zipBlob: Blob,
  database: NexusDB = db,
): Promise<RestoreSummary> {
  // Passos 2-3: validar ANTES de tocar em Dexie (zero escrita se falhar).
  const jsonBlob = await extractBackupJson(zipBlob); // AC2
  const meta = await peekBackupMeta(jsonBlob); // AC3 (formatName + contagem)
  await assertBackupParseable(jsonBlob); // AC7 Camada 1 (integridade total < escrita)

  // Passo 5: importação destrutiva e atómica.
  // - clearTablesBeforeImport: limpa cada tabela antes de reescrever (= substituir, AC6)
  // - overwriteValues: bulkPut sobre chaves existentes (AC6)
  // - SEM noTransaction (atomicidade, AC7); SEM acceptNameDiff/acceptVersionDiff (AC4)
  try {
    await importInto(database, jsonBlob, {
      clearTablesBeforeImport: true,
      overwriteValues: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Name differs')) {
      throw new RestoreError('name-mismatch', message);
    }
    if (message.includes('Database version differs')) {
      throw new RestoreError('version-mismatch', message);
    }
    throw new RestoreError('transaction-failed', message);
  }

  // AC8: contagem derivada dos metadados do backup (não recontagem pós-escrita — o
  // import é atómico e substitui, logo os metadados SÃO o estado importado, N2 do PO).
  const tablesRestored = meta.data.tables.length;
  const rowsRestored = meta.data.tables.reduce((sum, table) => sum + table.rowCount, 0);

  return { tablesRestored, rowsRestored };
}
