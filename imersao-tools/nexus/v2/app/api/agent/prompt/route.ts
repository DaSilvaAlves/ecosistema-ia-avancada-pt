import { kv } from '@vercel/kv';
import { runAgent } from '@/lib/agent/executor';
import { KvConfirmationProvider } from '@/lib/agent/kv-confirmation-provider';
import { PromptRequestSchema } from '@/lib/agent/schemas';
import { getSession } from '@/lib/auth/session';
import type { Logger, VercelKV } from '@/lib/agent/tools/types';

/**
 * Nexus v2 — Agent prompt endpoint (Story 1.8)
 *
 * `POST /api/agent/prompt` — endpoint principal do cérebro multi-intent.
 * Orquestra:
 *   1. Auth via `getSession(req)` → 401 se sessão inválida
 *   2. Body parse + Zod validate via `PromptRequestSchema` → 400 se inválido
 *   3. Constrói `KvConfirmationProvider(kv)` para resolução cross-process
 *      do preview gate (RESOLVED-3 Story 1.7 → ADR-7 Story 1.8)
 *   4. Itera `runAgent(prompt, { confirmationProvider })` (Stories 1.5/1.6/1.7)
 *   5. Serializa cada `ExecutorSSEEvent` como `data: <JSON>\n\n` num
 *      `ReadableStream`
 *   6. Termina com `data: [DONE]\n\n` após o evento `done`
 *
 * Trace canónico:
 * - PRD §10 linha 419 — "1.8 Endpoint /api/agent/prompt com auth + rate limit + telemetria"
 * - PRD §6.1 FR1-FR6 — chat-first, classifier multi-intent, audit log, preview, undo
 * - Architecture v2 ADR-1 — Edge runtime, streaming token-by-token, 30s timeout
 * - Architecture v2 §8 lines 677-703 — blueprint do fluxo SSE
 * - Architecture v2 §9.2 — `ANTHROPIC_API_KEY` server-only
 * - Architecture v2 §9.3 — rate limiting global em middleware (60 req/min)
 * - executor.ts L464 `runAgent(userPrompt, opts)` — assinatura canónica
 *
 * Edge runtime safe (ADR-1): zero imports Node-only (`fs`, `child_process`,
 * `crypto.createHmac`); zero imports Dexie em runtime (`@/lib/db/client`).
 * `VercelKV`/`Logger` são `import type` apenas.
 *
 * Stateless server-side (RESOLVED-2 Story 1.5): este endpoint NÃO escreve em
 * IndexedDB. Persistência é responsabilidade do client consumer da SSE
 * (Story 1.9): `startRun` ao receber `meta(start)`, `appendToolCall` ao
 * receber `tool_complete`, `finishRun` ao receber `done`.
 *
 * Telemetria (NFR11 + NFR12): logger.info com `promptHash` (sha256 substring
 * 8 chars) — NUNCA prompt em claro. Erros logados sem prompt cru.
 *
 * Constitution Article IV (No Invention): tudo trace-back a Stories 1.1-1.7.
 */

export const runtime = 'edge';

/**
 * Logger inline para o endpoint. Mesmo pattern do `undoLogger`
 * (`app/api/agent/undo/route.ts` L67-74). Vercel logs capturam
 * console.info/error em produção.
 */
const promptLogger: Logger = {
  info: (msg: string, meta?: unknown) => {
    console.info(`[prompt] ${msg}`, meta ?? '');
  },
  error: (msg: string, meta?: unknown) => {
    console.error(`[prompt] ${msg}`, meta ?? '');
  },
};

interface PromptErrorBody {
  error: string;
  message: string;
}

function jsonError(body: PromptErrorBody, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorMessageString(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/**
 * SHA-256 hash truncado (8 hex chars) — Edge-safe via `crypto.subtle.digest`.
 * NÃO usar `crypto.createHmac` (Node-only). Trace canónico: NFR11 — logs Vercel
 * NUNCA contêm prompt em claro, apenas hash + intents.
 */
async function promptHash(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
}

export async function POST(req: Request): Promise<Response> {
  // 1. Auth PRIMEIRO (Crit-3 PO Pax — pattern Story 1.7 route.ts L124-159).
  // Cliente sem sessão NÃO pode sondar com `prompt: ""` para distinguir 400/401.
  const session = await getSession(req);
  if (!session.valid) {
    return jsonError(
      { error: 'não_autenticado', message: 'Sessão inválida ou expirada' },
      401
    );
  }

  // 2. Body parse + Zod validate (Crit-3 — body só DEPOIS da auth).
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(
      { error: 'prompt_inválido', message: 'Body inválido — esperado JSON' },
      400
    );
  }

  let parsed: { prompt: string; conversationId?: string };
  try {
    parsed = PromptRequestSchema.parse(body);
  } catch (e) {
    return jsonError(
      {
        error: 'prompt_inválido',
        message: `Body inválido: ${errorMessageString(e)}`,
      },
      400
    );
  }

  const { prompt, conversationId } = parsed;

  // 3. Construir KvConfirmationProvider — apenas `kv`, runId via método
  // (interface canónica Story 1.6 L112-114). UMA instância por request.
  // TODO Story 1.9+: alinhar interface VercelKV interna (lib/agent/tools/types.ts)
  // com o tipo real de @vercel/kv para eliminar `as unknown as VercelKV`.
  // CR Iter 1 nitpick #3 — adiado: VercelKV é usado por executor/undo/etc.,
  // refactor sai do scope desta story.
  const kvProvider = new KvConfirmationProvider(kv as unknown as VercelKV);

  // Telemetria de início (NFR11): hash em vez de prompt cru.
  const startedAt = Date.now();
  const hash = await promptHash(prompt);
  promptLogger.info('request iniciado', {
    promptHash: hash,
    ...(conversationId ? { conversationId } : {}),
  });

  // 4. Construir ReadableStream que itera o AsyncGenerator de runAgent.
  // Captura runId do primeiro `meta(start)` para correlação no logger final.
  const encoder = new TextEncoder();
  let capturedRunId: string | undefined;
  let doneStatus: 'success' | 'partial' | 'failed' | undefined;
  let doneIntents: string[] = [];
  let doneToolCalls = 0;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runAgent(prompt, {
          confirmationProvider: kvProvider,
        })) {
          // Capturar runId do meta(start) — usado no logger de fim.
          if (event.type === 'meta' && event.phase === 'start') {
            capturedRunId = event.runId;
          }
          // Capturar dados do done para telemetria final.
          if (event.type === 'done') {
            doneStatus = event.status;
            doneIntents = event.intents;
            doneToolCalls = event.totals.toolCalls;
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        // Catch defensivo: o `runAgent` consome erros internamente e emite
        // `tool_error` + `done.status = 'failed'` antes de re-throw (executor.ts
        // L615-649). Este catch só dispara se o próprio `for await` lançar
        // (caso raro). NÃO emitimos `type: 'error'` — esse tipo NÃO existe no
        // `ExecutorSSEEvent` union (executor.ts L159-255). Apenas logamos
        // e fechamos o stream limpo com [DONE]. Cliente detecta falha pela
        // ausência de evento `done` ou pelo `done.status === 'failed'` se já
        // foi emitido antes do throw.
        promptLogger.error('stream falhou', {
          runId: capturedRunId,
          error: errorMessageString(err),
        });
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } finally {
        // Telemetria de fim (NFR11): apenas runId + duração + intents + counts.
        promptLogger.info('request terminado', {
          runId: capturedRunId,
          durationMs: Date.now() - startedAt,
          intents: doneIntents,
          toolCallCount: doneToolCalls,
          status: doneStatus,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
