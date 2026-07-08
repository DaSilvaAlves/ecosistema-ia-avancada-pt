import { exportDB } from 'dexie-export-import';
import { zipSync } from 'fflate';
import { db, type NexusDB } from '@/lib/db/client';
import type { KnowledgeNote } from '@/types/db';

/**
 * Nexus v2 — Backup export (Story 9.6, Tasks 1-2)
 *
 * Export inteiramente CLIENT-SIDE e READ-ONLY (AC6/AC11): não escreve em Dexie,
 * não chama endpoints servidor, não tem efeito destrutivo. As credenciais OAuth
 * (`accessToken`/`refreshToken`) vivem exclusivamente em Vercel KV
 * (`lib/google/token-store.ts`, `nexus:google:tokens`, AES-256-GCM) — NUNCA no
 * IndexedDB. `exportDB(db)` opera só sobre as 22 tabelas Dexie, pelo que o backup
 * é seguro por construção quanto a fugas de secrets (AC6) — sem "sanitização"
 * inventada (Constitution Art. IV: a garantia é estrutural, não código defensivo).
 *
 * DEV-DECISION D-9.6-ZIPLIB — biblioteca de empacotamento ZIP:
 *   Escolhida `fflate` (`zipSync`) para produzir um ZIP real multi-ficheiro (AC4).
 *   - Zero dependências, ~8KB gzip, API síncrona client-side.
 *   - Já resolvida no lockfile (0.8.2, transitiva) → promovida a `dependencies`
 *     sem download novo; `npm audit` limpo registado como Evidence no commit.
 *   Rejeitadas:
 *   - `CompressionStream` nativo — só produz gzip/deflate de UM stream, não um
 *     contentor ZIP multi-ficheiro → não cumpre AC4.
 *   - `jszip` — alternativa madura mas ~100KB e assíncrona, sem ganho aqui.
 *   - ZIP "falso" (JSON renomeado `.zip`) — não cumpre AC3/AC4.
 *   Corre na thread principal da página de definições (não no Service Worker — o
 *   SW não daria paralelismo real; é a mesma thread a fazer o trabalho).
 *
 * Contrato do ZIP (fixo para a Story 9.7 — restore):
 *   nexus-backup-{timestamp}.zip
 *   ├── nexus-db-export.json  ← output CRU de exportDB(db) (formato
 *   │                            dexie-export-import), importável via importInto()
 *   │                            — NÃO transformado (AC7).
 *   └── notas.md               ← markdown legível de knowledge_notes, NÃO
 *                                re-importável (cópia humana, AC8).
 *
 * Trace: AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9.
 */

/**
 * Lê um Blob como bytes crus. Usa `Blob.arrayBuffer()` (browsers reais) e cai
 * para `FileReader` quando indisponível (o Blob de `exportDB` sob jsdom/testes
 * não expõe `arrayBuffer`/`text`, só `slice`). Preserva os bytes exactos (AC7).
 */
async function blobToUint8(blob: Blob): Promise<Uint8Array> {
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

/** Nome do ficheiro JSON dentro do ZIP — contrato fixo para a Story 9.7 (AC7). */
export const DB_EXPORT_FILENAME = 'nexus-db-export.json';

/** Nome do ficheiro markdown dentro do ZIP — cópia humana (AC8). */
export const NOTES_FILENAME = 'notas.md';

/**
 * Gera o JSON completo da base de dados via `exportDB(db)` (dexie-export-import).
 * O Blob devolvido é o output CRU, sem transformação (AC7) — é este formato que a
 * Story 9.7 consome com `importInto()`/`db.import()`.
 */
export async function exportDatabaseJSON(database: NexusDB = db): Promise<Blob> {
  return exportDB(database);
}

/**
 * Renderiza o markdown legível das notas (`knowledge_notes`) — função pura,
 * testável isoladamente (AC3/AC9). Cada nota é uma secção `## {title}` com o
 * `bodyMarkdown` completo. Caso zero notas → aviso explícito (não string vazia
 * que pareça um erro).
 */
export function renderNotesMarkdown(notes: readonly KnowledgeNote[]): string {
  if (notes.length === 0) {
    return '# Notas\n\n_Sem notas registadas._\n';
  }

  const sections = notes.map((note) => `## ${note.title}\n\n${note.bodyMarkdown}`);
  return `# Notas\n\n${sections.join('\n\n')}\n`;
}

/**
 * Lê todas as notas de `knowledge_notes` e gera o markdown legível.
 * Leitura simples e directa (não há helper `listAllKnowledgeNotes` no repo).
 */
export async function buildNotesMarkdown(database: NexusDB = db): Promise<string> {
  const notes = await database.knowledge_notes.toArray();
  return renderNotesMarkdown(notes);
}

/**
 * Monta o ZIP real multi-ficheiro com `nexus-db-export.json` + `notas.md`.
 * O JSON entra byte-a-byte tal como sai de `exportDB()` (AC7): lê-se o Blob como
 * bytes crus e empacota-se sem re-codificação.
 */
export async function buildBackupZip(database: NexusDB = db): Promise<Blob> {
  const [jsonBlob, notesMarkdown] = await Promise.all([
    exportDatabaseJSON(database),
    buildNotesMarkdown(database),
  ]);

  const jsonBytes = await blobToUint8(jsonBlob);
  // `new Uint8Array(TextEncoder.encode(...))`: os valores passados a `zipSync` têm
  // de ser `Uint8Array` do MESMO realm que o `zipSync` reconhece (o de `new
  // Uint8Array`); caso contrário a string seria tratada como um directório
  // aninhado (byte-a-byte). Bytes UTF-8 idênticos — sem transformação de conteúdo.
  const notesBytes = new Uint8Array(new TextEncoder().encode(notesMarkdown));

  const zipped = zipSync({
    [DB_EXPORT_FILENAME]: jsonBytes,
    [NOTES_FILENAME]: notesBytes,
  });

  // Cast: `fflate` tipa o retorno como `Uint8Array<ArrayBufferLike>`; o `BlobPart`
  // do lib.dom (TS 5.7) exige `ArrayBuffer` concreto. `zipSync` aloca sempre um
  // `ArrayBuffer` normal (nunca `SharedArrayBuffer`), pelo que o cast é seguro.
  return new Blob([zipped as BlobPart], { type: 'application/zip' });
}

/**
 * Nome do ficheiro de download (AC5): `nexus-backup-{ISO}.zip` com o timestamp
 * ISO 8601 do momento do export e `:` substituído por `-` (compatibilidade de
 * nome de ficheiro). Ex.: `nexus-backup-2026-07-09T14-30-00.zip`.
 * Função pura testável isoladamente (`now` injectável).
 */
export function backupFileName(now: Date = new Date()): string {
  // ISO até aos segundos (sem milissegundos nem sufixo Z), `:` → `-`.
  const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
  return `nexus-backup-${timestamp}.zip`;
}
