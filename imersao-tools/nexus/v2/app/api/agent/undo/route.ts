import { kv } from '@vercel/kv';
import { UndoRequestSchema } from '@/lib/agent/schemas';
import {
  deleteUndoEntry,
  getUndoEntry,
} from '@/lib/agent/undo';
import { getSession } from '@/lib/auth/session';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type {
  ExecutionContext,
  Logger,
  VercelKV,
} from '@/lib/agent/tools/types';
import type { NexusDB } from '@/lib/db/client';

/**
 * Nexus v2 — Undo endpoint (Story 1.7)
 *
 * `POST /api/agent/undo` — reverte todos os tool calls reversíveis do último
 * AgentRun, em ordem reversa, dentro da janela de 30s. After 30s o endpoint
 * responde 410 Gone (PRD AC4 strict: "após 30s não é possível").
 *
 * Trace canónico:
 * - PRD §6.1 FR6 (linha 126) — requirement
 * - PRD §10 linha 418 — scope ("storage 30s + endpoint reverse")
 * - Epic 1 AC4 (PRD §10 linha 427) — strict semantic
 * - Architecture v2 §3 — file path
 * - Architecture v2 ADR-1 — Edge runtime
 *
 * Edge runtime safe (ADR-1): zero imports de Node-only APIs (`fs`,
 * `child_process`, `crypto.createHmac`); zero imports de Dexie em runtime
 * (`NexusDB` é `import type` apenas).
 *
 * Auth: `getSession(req)` (Story 0.6 pattern). 401 sem sessão válida.
 *
 * Defense-in-depth (RESOLVED-2): `entry.expiresAt < Date.now()` guard fecha
 * race window de ~1s do Upstash TTL precision + clock skew Edge regions.
 *
 * Best-effort (RESOLVED-6): se uma `tool.reverse()` falha, acumula em
 * `errors[]` e continua. Se `tool.reverse === undefined` apesar de
 * `reversible: true` (invariant violation), `logger.error` para Vercel logs
 * + entrada em `errors[]` com mensagem PT-PT.
 *
 * Idempotência (RESOLVED-5): segundo POST após 1º consumir → 410. Cliente UI
 * deve desactivar botão após primeiro click (single source of truth).
 *
 * NÃO chama `markRunReverted`: é client-side Dexie (Story 1.9 cliente faz
 * isso após receber 200). RESOLVED-2 da Story 1.5 estabelece que executor
 * é stateless server-side e Dexie corre no client.
 */

export const runtime = 'edge';

/**
 * Logger inline para o endpoint. Mesmo pattern do executor (`executorLogger`)
 * com guard NFR11 implícito: callers nunca passam `userPrompt`/`rawResponse`.
 *
 * Stories 1.8/2.x podem substituir por logger estruturado (Pino/Winston) — a
 * interface `Logger` em `lib/agent/tools/types.ts` é minimal de propósito.
 */
const undoLogger: Logger = {
  info: (msg: string, meta?: unknown) => {
    console.info(`[undo] ${msg}`, meta ?? '');
  },
  error: (msg: string, meta?: unknown) => {
    console.error(`[undo] ${msg}`, meta ?? '');
  },
};

interface UndoErrorItem {
  toolName: string;
  message: string;
}

interface UndoSuccessResponse {
  reverted: number;
  errors: UndoErrorItem[];
}

interface UndoErrorResponse {
  error: string;
  message: string;
}

/**
 * Constrói `ExecutionContext` minimal para o reverse loop.
 *
 * Mesmo shape que o executor (RESOLVED-2 da Story 1.5 — server stateless,
 * Dexie corre no cliente). Stories 2-7 que precisem de Dexie em
 * `tool.reverse()` devolvem command no `result` (cliente interpreta).
 */
function buildUndoContext(runId: string): ExecutionContext {
  return {
    userId: 'eurico',
    db: null as unknown as NexusDB,
    kv: kv as unknown as VercelKV,
    fetch: globalThis.fetch,
    logger: undoLogger,
    runId,
  };
}

function jsonResponse(
  body: UndoSuccessResponse | UndoErrorResponse,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorMessageString(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

export async function POST(req: Request): Promise<Response> {
  // 1. Auth — getSession (Story 0.6 pattern)
  const session = await getSession(req);
  if (!session.valid) {
    return jsonResponse(
      { error: 'unauthorized', message: 'Sessão inválida ou expirada' },
      401
    );
  }

  // 2. Parse + validate body via Zod
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      {
        error: 'invalid_body',
        message: 'Body inválido — esperado JSON',
      },
      400
    );
  }

  let parsed: { runId: string };
  try {
    parsed = UndoRequestSchema.parse(body);
  } catch (e) {
    return jsonResponse(
      {
        error: 'invalid_body',
        message: `Body inválido: ${errorMessageString(e)}`,
      },
      400
    );
  }

  const { runId } = parsed;

  // 3. Lookup undo entry (TTL natural — Upstash retorna null após 30s)
  const kvClient = kv as unknown as VercelKV;
  let entry;
  try {
    entry = await getUndoEntry(runId, kvClient);
  } catch (e) {
    // Zod parse failure no readback (corrupção KV) — fail-loud em PT-PT
    undoLogger.error('undo entry corrupted', {
      runId,
      error: errorMessageString(e),
    });
    return jsonResponse(
      {
        error: 'undo_entry_corrupted',
        message: errorMessageString(e),
      },
      500
    );
  }

  if (entry === null) {
    return jsonResponse(
      {
        error: 'undo_window_expired',
        message: 'Janela de undo (30s) expirou',
      },
      410
    );
  }

  // 4. Defense-in-depth (RESOLVED-2): TTL guard duplo no endpoint.
  // Fecha race window de ~1s do Upstash TTL precision + clock skew Edge regions.
  // Cliente trata 410 igual à expiry natural — UI undo toast desaparece.
  if (entry.expiresAt < Date.now()) {
    // Limpa a entry vencida que escapou ao Upstash TTL — evita estado
    // inconsistente em retry. del() em chave inexistente é no-op.
    await deleteUndoEntry(runId, kvClient);
    return jsonResponse(
      {
        error: 'undo_window_expired',
        message: 'Janela de undo (30s) expirou',
      },
      410
    );
  }

  // 5. Reverse loop best-effort em ordem reversa.
  // RESOLVED-4: undo reverte TODOS os toolCalls do AgentRun em ordem reversa.
  // RESOLVED-6: tool unknown OU tool.reverse undefined → errors[] + logger.error.
  // RESOLVED-6: tool.reverse() throw → errors[] + continua loop.
  //
  // Reverted count = total processado (não apenas successful) — alinha com
  // semântica "best-effort" da Story 1.5 (`done.status === 'partial'` quando
  // alguns tools falham). Cliente recebe `errors[]` para UX informativa
  // ("Revertidos 2 de 3 tool calls; falhou: criar_evento — já apagado").
  const errors: UndoErrorItem[] = [];
  const ctx = buildUndoContext(runId);

  // Reverse iteration — last toolCall first
  for (let i = entry.toolCalls.length - 1; i >= 0; i--) {
    const toolCall = entry.toolCalls[i];
    const tool = toolRegistry.get(toolCall.toolName);

    if (!tool) {
      undoLogger.error('Tool not in registry during undo', {
        runId,
        toolName: toolCall.toolName,
      });
      errors.push({
        toolName: toolCall.toolName,
        message: 'Tool não registada — não pode ser revertida',
      });
      continue;
    }

    if (tool.reverse === undefined) {
      // Invariant violation: `reversible: true` mas `reverse` não definido.
      // Story 1.7 só regista undo entries para tools com `reversible: true`,
      // logo `tool.reverse` DEVERIA estar definido. Se não está, é bug de
      // definição da tool. Logar para observability (Vercel logs) — sem isto
      // o invariant violation seria silenciosamente acumulado em `errors[]`.
      undoLogger.error('Tool reverse missing — invariant violation', {
        runId,
        toolName: toolCall.toolName,
      });
      errors.push({
        toolName: toolCall.toolName,
        message: 'Tool reverse() não definido — invariant violation',
      });
      continue;
    }

    try {
      await tool.reverse(toolCall.args, toolCall.result, ctx);
    } catch (e) {
      errors.push({
        toolName: toolCall.toolName,
        message: errorMessageString(e),
      });
      // Continua o loop — best-effort (RESOLVED-6).
    }
  }

  // 6. Apaga entry KV — sempre, mesmo com erros parciais.
  // RESOLVED-5: 2º POST com mesmo runId encontra entry inexistente → 410.
  // Cliente UI (Story 1.9) deve desactivar botão após 1º click para evitar
  // 2º POST por design.
  await deleteUndoEntry(runId, kvClient);

  return jsonResponse(
    {
      reverted: entry.toolCalls.length,
      errors,
    },
    200
  );
}
