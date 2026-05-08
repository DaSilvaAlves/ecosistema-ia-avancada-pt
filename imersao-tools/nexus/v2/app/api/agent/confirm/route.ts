import { kv } from '@vercel/kv';
import {
  CONFIRM_TTL_SECONDS,
  KV_CONFIRM_NAMESPACE,
} from '@/lib/agent/kv-confirmation-provider';
import { ConfirmRequestSchema } from '@/lib/agent/schemas';
import { getSession } from '@/lib/auth/session';
import type { Logger } from '@/lib/agent/tools/types';

/**
 * Nexus v2 — Agent confirm endpoint (Story 1.8)
 *
 * `POST /api/agent/confirm` — endpoint auxiliar do preview gate cross-process.
 *
 * Trace canónico:
 * - Story 1.8 AC8 — body schema + auth + write KV + 200
 * - ADR-7 (Story 1.8) — namespace `nexus:agent:confirm:<runId>:<toolName>`
 * - ADR-6 (Story 1.7) — partilha cliente `kv` singleton com `nexus:undo:run:*`
 *
 * Mecanismo (cross-process flow):
 *   1. Edge A (POST /api/agent/prompt): runAgent emite SSE
 *      `preview_request { runId, toolName }` e bloqueia em
 *      `KvConfirmationProvider.requestConfirmation(runId, toolName)` que
 *      faz polling `nexus:agent:confirm:<runId>:<toolName>`
 *   2. Browser recebe evento, mostra diálogo, utilizador clica
 *      Confirmar/Cancelar
 *   3. Browser → POST /api/agent/confirm { runId, toolName, action }
 *   4. Este endpoint (Edge B, possivelmente diferente de A): auth → body
 *      validate → escreve KV com action e TTL CONFIRM_TTL_SECONDS → 200
 *   5. Edge A: polling KV encontra valor, resolve a Promise, executor
 *      executa/cancela a tool conforme action
 *
 * Edge runtime safe (ADR-1): zero imports Node-only; `Logger` é `import type`.
 *
 * Best-effort: se a entry KV expirar (TTL 60s) antes de Edge A fazer poll,
 * o `KvConfirmationProvider` cai em timeout e devolve `'cancel'` (safe
 * default). Cliente UI deve mostrar feedback claro (Story 1.9).
 *
 * Constitution Article IV (No Invention): tudo trace-back a Story 1.8 AC8 +
 * ADR-7 + Story 1.7 endpoint pattern (auth-first).
 */

export const runtime = 'edge';

const confirmLogger: Logger = {
  info: (msg: string, meta?: unknown) => {
    console.info(`[confirm] ${msg}`, meta ?? '');
  },
  error: (msg: string, meta?: unknown) => {
    console.error(`[confirm] ${msg}`, meta ?? '');
  },
};

interface ConfirmErrorBody {
  error: string;
  message: string;
}

interface ConfirmSuccessBody {
  ok: true;
}

function jsonResponse(
  body: ConfirmSuccessBody | ConfirmErrorBody,
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
  // 1. Auth PRIMEIRO (pattern Story 1.7 + Crit-3 PO Pax).
  const session = await getSession(req);
  if (!session.valid) {
    return jsonResponse(
      { error: 'não_autenticado', message: 'Sessão inválida ou expirada' },
      401
    );
  }

  // 2. Body parse + Zod validate.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      { error: 'invalid_body', message: 'Body inválido — esperado JSON' },
      400
    );
  }

  let parsed: { runId: string; toolName: string; action: 'confirm' | 'cancel' };
  try {
    parsed = ConfirmRequestSchema.parse(body);
  } catch (e) {
    return jsonResponse(
      {
        error: 'invalid_body',
        message: `Body inválido: ${errorMessageString(e)}`,
      },
      400
    );
  }

  const { runId, toolName, action } = parsed;

  // 3. Escrever em KV com TTL CONFIRM_TTL_SECONDS (60s).
  // Chave canónica `nexus:agent:confirm:<runId>:<toolName>` — alinhada com
  // `KvConfirmationProvider.requestConfirmation` que faz polling em
  // `${KV_CONFIRM_NAMESPACE}:${runId}:${toolName}`.
  const key = `${KV_CONFIRM_NAMESPACE}:${runId}:${toolName}`;
  try {
    await kv.set(key, action, { ex: CONFIRM_TTL_SECONDS });
  } catch (e) {
    confirmLogger.error('falha ao escrever KV', {
      runId,
      toolName,
      action,
      error: errorMessageString(e),
    });
    return jsonResponse(
      {
        error: 'kv_write_failed',
        message: 'Falha ao registar confirmação — tenta novamente',
      },
      503
    );
  }

  confirmLogger.info('confirmação registada', {
    runId,
    toolName,
    action,
  });

  return jsonResponse({ ok: true }, 200);
}
