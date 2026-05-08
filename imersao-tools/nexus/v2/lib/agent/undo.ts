import {
  UndoEntrySchema,
  type ToolCall,
  type UndoEntry,
} from '@/lib/agent/schemas';
import type { VercelKV } from '@/lib/agent/tools/types';

/**
 * Nexus v2 — Undo mechanism (Story 1.7)
 *
 * Storage 30s + endpoint reverse para o cérebro multi-intent (Epic 1).
 *
 * Trace canónico:
 * - PRD §6.1 FR6 (linha 126) — "Botão undo (toast 30s) reverte última acção do agente"
 * - PRD §10 linha 418 — "1.7 Undo mechanism (storage 30s + endpoint reverse)"
 * - Epic 1 AC4 (PRD §10 linha 427) — "Undo reverte última operação dentro de 30s; após 30s não é possível"
 * - Architecture v2 §3 linha 130 — `lib/agent/undo.ts // 30s window` (file path canónico)
 * - Architecture v2 §6.5 linhas 538-546 — KV namespace pattern (Story 1.7 introduz `nexus:undo:run:<runId>`)
 * - Architecture v2 §17 linha 1132 — `"@vercel/kv": "^3.0.0"` (pacote canónico)
 *
 * 3 funções:
 *   - `registerUndoEntry(runId, toolCalls, kvClient)` — escreve com TTL 30s
 *   - `getUndoEntry(runId, kvClient)` — leitura validada Zod ou null
 *   - `deleteUndoEntry(runId, kvClient)` — apaga após uso (idempotente)
 *
 * Edge runtime safe (ADR-1): zero imports de `fs`, `child_process`, ou
 * `crypto.createHmac`; apenas `@/lib/agent/schemas` (Zod) e `VercelKV` type
 * (interface mínima — `lib/agent/tools/types.ts` é `import type` apenas).
 *
 * Constitution Article IV (No Invention): tudo trace-back a PRD/arch/Stories
 * 1.1+1.3+1.5+1.6 + RESOLVED-1/2/3/4/5/6 + ADR-6 da Story 1.7.
 */

/**
 * Janela de undo em segundos. Constante exportada para:
 * 1. Permitir override em testes (`UNDO_TTL_SECONDS` é o valor canónico de
 *    produção — testes podem mockar `Date.now()` em vez de alterar o TTL).
 * 2. Servir de single source of truth — `registerUndoEntry` usa esta constante
 *    em `kv.set(..., { ex: UNDO_TTL_SECONDS })` E em `expiresAt = now + UNDO_TTL_SECONDS * 1000`.
 *
 * Trace: PRD §6.1 FR6 + Epic 1 AC4 (linha 427) — "dentro de 30s; após 30s não é possível".
 */
export const UNDO_TTL_SECONDS = 30;

/**
 * Constrói a chave KV canónica para um `runId`.
 *
 * Namespace `nexus:undo:run:*` — extensão do padrão existente em arch §6.5
 * (`nexus:auth:session:*`, `nexus:google:tokens`, `nexus:push:subscriptions`,
 * `nexus:telegram:bot`, `nexus:cache:gmail:classify:*`).
 *
 * ADR-6 (Story 1.7 RESOLVED-3): mantém-se INDEPENDENTE de
 * `nexus:agent:confirm:*` (Story 1.8 ConfirmationProvider TBD) — as duas
 * funcionalidades partilham cliente `kv` mas usam namespaces e patterns distintos.
 */
function kvKey(runId: string): string {
  return `nexus:undo:run:${runId}`;
}

/**
 * Persiste um `UndoEntry` em KV com TTL 30s.
 *
 * Validação Zod fail-loud (mensagem PT-PT) ANTES de chamar `kv.set` — payload
 * corrupto (ex: `runId` não-UUID, `toolCalls` malformado) é detectado pelo
 * caller (executor) sem poluir KV com lixo.
 *
 * RESOLVED-2 (Architect Aria 08/05/2026): defense-in-depth approach. Escrevemos
 * `expiresAt = Date.now() + UNDO_TTL_SECONDS * 1000` no payload — esta é a
 * fonte de verdade para o endpoint guard `entry.expiresAt < Date.now() → 410`,
 * fechando race window de ~1s do Upstash TTL precision + clock skew Edge regions.
 *
 * Best-effort do caller (AC4 Story 1.7): se KV está down (`kv.set` lança), o
 * caller (`runAgent`) apanha e emite `tool_error toolName: 'undo_register'`
 * mas NÃO bloqueia o evento `done` — operação principal já foi feita,
 * undo é nice-to-have.
 *
 * @param runId - UUID do AgentRun (geralmente `crypto.randomUUID()` no executor)
 * @param toolCalls - Array de `ToolCall` em ordem de execução (executor já valida via Zod)
 * @param kvClient - Cliente Vercel KV (singleton `kv` do `@vercel/kv` em produção; mock em testes)
 */
export async function registerUndoEntry(
  runId: string,
  toolCalls: ToolCall[],
  kvClient: VercelKV
): Promise<void> {
  const now = Date.now();
  const entry: UndoEntry = {
    runId,
    timestamp: now,
    toolCalls,
    expiresAt: now + UNDO_TTL_SECONDS * 1000,
  };

  // Fail-loud: payload corrupto é bug do caller, deve ser detectado em testes
  // antes de tocar KV. Mensagem PT-PT inclui o erro Zod original para debug.
  let validated: UndoEntry;
  try {
    validated = UndoEntrySchema.parse(entry);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Payload de undo corrupto: ${msg}`);
  }

  await kvClient.set(kvKey(runId), validated, { ex: UNDO_TTL_SECONDS });
}

/**
 * Lê uma `UndoEntry` do KV. Retorna `null` se TTL expirou OU entrada nunca
 * existiu (Upstash devolve `null` em ambos os casos — semanticamente
 * indistinguíveis e o endpoint trata-os igualmente como "janela expirou").
 *
 * Validação Zod no readback: se KV retornar shape corrupto (e.g., entrada
 * escrita por versão antiga ou corrupção), lança Error PT-PT para o endpoint
 * apanhar e responder 500. Esta defesa fail-loud apanha bugs cedo em vez de
 * mascará-los como "undo silenciosamente falhou".
 *
 * @param runId - UUID do AgentRun a recuperar
 * @param kvClient - Cliente Vercel KV
 * @returns `UndoEntry` validada ou `null` se inexistente/expirada
 */
export async function getUndoEntry(
  runId: string,
  kvClient: VercelKV
): Promise<UndoEntry | null> {
  const raw = await kvClient.get(kvKey(runId));

  if (raw === null || raw === undefined) {
    return null;
  }

  // Fail-loud em corrupção. Mensagem PT-PT identifica o `runId` para ops debug.
  try {
    return UndoEntrySchema.parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Payload de undo corrupto no readback (runId=${runId}): ${msg}`
    );
  }
}

/**
 * Apaga uma `UndoEntry` do KV. Idempotente — `kv.del` em chave inexistente é
 * no-op (Upstash retorna `0` deletions, nenhum erro lançado).
 *
 * Chamado em 2 sítios:
 * 1. Endpoint `POST /api/agent/undo` no fim do reverse loop (sempre, mesmo
 *    com erros parciais em `errors[]`) — evita estado inconsistente em retry.
 * 2. Endpoint defense-in-depth path (RESOLVED-2): se `entry.expiresAt < Date.now()`,
 *    apaga + retorna 410 (limpa entry vencida que escapou ao Upstash TTL).
 *
 * @param runId - UUID do AgentRun a apagar
 * @param kvClient - Cliente Vercel KV
 */
export async function deleteUndoEntry(
  runId: string,
  kvClient: VercelKV
): Promise<void> {
  await kvClient.del(kvKey(runId));
}
