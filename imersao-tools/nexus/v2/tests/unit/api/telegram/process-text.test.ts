import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import {
  POST,
  BRIDGE_SECRET_HEADER,
  ERROR_MESSAGE_PT,
} from '@/app/api/telegram/process-text/route';
import { server } from '@/tests/mocks/server';

/**
 * Story 6.13 (T5, AC1-AC7) — bridge Node `POST /api/telegram/process-text`.
 *
 * Nível 2 de [D-6.13-MOCK-PROTOCOL] (`mock-protocol-fidelity.md`, C10): os testes do
 * bridge mockam `api.anthropic.com/v1/messages` pelo handler MSW REAL (`anthropic.ts`,
 * wire SSE da Anthropic) — NÃO mockam o executor. O caminho REAL do bridge invoca
 * `runAgent` SEM `executor`/`classifier` → factory SDK Node directo a `api.anthropic.com`
 * (C2/C3). A entrega ao utilizador (`sendMessage`) é interceptada pelo handler MSW
 * `sendMessage` (telegram.ts) — captura `chat_id`/`text` reais.
 *
 * Magic strings `MOCK_EXECUTOR_*` (anthropic.ts) controlam a resposta do cérebro de
 * forma determinística pelo wire real (mesma técnica de `executor.test.ts`).
 */

const MOCK_API_KEY = 'sk-ant-test-' + 'x'.repeat(40);
const BOT_TOKEN = '7654321:AAExampleBotTokenForTests';
const SECRET = 'segredo-do-webhook-com-mais-de-32-caracteres-aleatorios';
const CHAT_ID = '987654321';

/** Captura os `sendMessage` entregues à Bot API (chat_id + text). */
const sentMessages: Array<{ chat_id: unknown; text: string }> = [];

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = MOCK_API_KEY;
  process.env.TELEGRAM_BOT_TOKEN = BOT_TOKEN;
  process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
  sentMessages.length = 0;
  // Handler de captura — espelha o shape real mas regista o corpo enviado. Tem
  // precedência sobre o handler default de `telegram.ts` (server.use → first-match).
  server.use(
    http.post('https://api.telegram.org/bot:token/sendMessage', async ({ request }) => {
      const body = (await request.json()) as { chat_id?: unknown; text?: unknown };
      sentMessages.push({ chat_id: body.chat_id, text: String(body.text) });
      return HttpResponse.json({
        ok: true,
        result: { message_id: 1, chat: { id: body.chat_id, type: 'private' }, text: body.text },
      });
    }),
  );
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
  server.close();
});

/** Chama o bridge com `{ text, chatId }` e o shared-secret (a menos que omitido). */
function callBridge(
  opts: { secretHeader?: string | null; text?: unknown; chatId?: unknown; rawBody?: string } = {},
): Promise<Response> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (opts.secretHeader !== null) {
    headers.set(BRIDGE_SECRET_HEADER, opts.secretHeader ?? SECRET);
  }
  const body =
    opts.rawBody ??
    JSON.stringify({
      text: opts.text ?? 'MOCK_EXECUTOR_TEXT_ONLY olá',
      chatId: opts.chatId ?? CHAT_ID,
    });
  const req = new Request('https://nexus.test/api/telegram/process-text', {
    method: 'POST',
    headers,
    body,
  });
  return POST(req);
}

// ═══════════════════════════════════════════════════════════════════════════
// C11 — auth de chamada interna (shared-secret, fail-closed)
// ═══════════════════════════════════════════════════════════════════════════

describe('process-text — auth shared-secret (C11, fail-closed)', () => {
  it('segredo AUSENTE em env → 403 incondicional, sem invocar cérebro/sendMessage', async () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    const res = await callBridge();
    expect(res.status).toBe(403);
    expect(sentMessages).toHaveLength(0);
  });

  it('header ausente → 403', async () => {
    const res = await callBridge({ secretHeader: null });
    expect(res.status).toBe(403);
    expect(sentMessages).toHaveLength(0);
  });

  it('header errado → 403', async () => {
    const res = await callBridge({ secretHeader: 'segredo-errado' });
    expect(res.status).toBe(403);
    expect(sentMessages).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Parse do corpo
// ═══════════════════════════════════════════════════════════════════════════

describe('process-text — parse do corpo', () => {
  it('body não-JSON → 400, sem sendMessage', async () => {
    const res = await callBridge({ rawBody: 'isto-não-é-json-{{{' });
    expect(res.status).toBe(400);
    expect(sentMessages).toHaveLength(0);
  });

  it('`text` ausente → 400', async () => {
    const res = await callBridge({ rawBody: JSON.stringify({ chatId: CHAT_ID }) });
    expect(res.status).toBe(400);
    expect(sentMessages).toHaveLength(0);
  });

  it('`text` vazio/whitespace → 400 (nunca invocar o cérebro com prompt vazio)', async () => {
    const res = await callBridge({ text: '   ' });
    expect(res.status).toBe(400);
    expect(sentMessages).toHaveLength(0);
  });

  it('`chatId` ausente → 400', async () => {
    const res = await callBridge({ rawBody: JSON.stringify({ text: 'olá' }) });
    expect(res.status).toBe(400);
    expect(sentMessages).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AC1/AC2/AC3 — caminho feliz: cérebro responde texto → sendMessage (wire real)
// ═══════════════════════════════════════════════════════════════════════════

describe('process-text — happy path (AC1/AC2/AC3, wire Anthropic real)', () => {
  it('texto → cérebro responde → `sendMessage` 1× com chatId correcto e texto do Sonnet', async () => {
    const res = await callBridge();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, routed: true });
    expect(sentMessages).toHaveLength(1);
    expect(String(sentMessages[0].chat_id)).toBe(CHAT_ID);
    // O handler real (anthropic.ts) devolve "OK feito." para MOCK_EXECUTOR_TEXT_ONLY.
    expect(sentMessages[0].text).toBe('OK feito.');
    expect(sentMessages[0].text.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AC5/C9 — cérebro falha → mensagem de erro PT-PT (nunca silencioso, nunca 5xx)
// ═══════════════════════════════════════════════════════════════════════════

describe('process-text — fallback em erro do cérebro (AC5/C9)', () => {
  it('classifier falha (Anthropic 500) → `sendMessage` com mensagem de erro PT-PT + 200', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await callBridge({ text: 'MOCK_EXECUTOR_CLASSIFIER_FAIL falha aqui' });
    // Nunca 5xx ao webhook (que já respondeu 200 ao Telegram).
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, routed: true });
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].text).toBe(ERROR_MESSAGE_PT);
    // Anti-M4: a falha é registada (observability), não silenciosa.
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Idempotência de entrega (CR #87) — NO MÁXIMO 1 sendMessage por request
// ═══════════════════════════════════════════════════════════════════════════

describe('process-text — idempotência de entrega (1 envio outbound por request)', () => {
  it('cérebro responde mas a ENTREGA falha → 1 só tentativa de sendMessage (sem 2º envio de erro)', async () => {
    // Cenário CR: o cérebro responde com sucesso, mas o `sendMessage` da resposta
    // falha (rede). O código antigo entrava no catch e enviava UM SEGUNDO
    // `sendMessage` (erro PT-PT) → mensagens duplicadas/conflituosas. O fix separa
    // "cérebro falhou" de "entrega falhou": após o cérebro responder há UMA só
    // tentativa de entrega — se falhar, NÃO há segundo envio.
    let attempts = 0;
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.post('https://api.telegram.org/bot:token/sendMessage', () => {
        attempts += 1;
        return HttpResponse.error(); // falha de rede em TODAS as tentativas
      }),
    );
    const res = await callBridge();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, routed: true });
    // Exactamente 1 tentativa — o 2º envio do código antigo faria attempts === 2.
    expect(attempts).toBe(1);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AC7/C10 — teste de DEGENERAÇÃO de protocolo (falharia se o shape divergisse)
// ═══════════════════════════════════════════════════════════════════════════

describe('process-text — degeneração de protocolo (AC7/C10)', () => {
  it('resposta do cérebro SEM text_delta (shape degenerado) → fallback PT-PT, NÃO crash (C8)', async () => {
    // Override do handler Anthropic: stream válido mas SEM nenhum `content_block`
    // de texto (só message_start/message_delta/message_stop). O executor não emite
    // `text_delta` → `finalText` vazio → o bridge usa o fallback PT-PT (C8) em vez
    // de chamar `sendMessage` com '' (que a Bot API rejeitaria) ou de crashar.
    server.use(
      http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
        const body = (await request.json()) as { stream?: boolean; model: string };
        if (!body.stream) {
          // Classifier (síncrono) — intents vazios para um caminho text-only.
          return HttpResponse.json({
            id: 'msg_degenerate_classifier',
            type: 'message',
            role: 'assistant',
            model: body.model,
            content: [{ type: 'text', text: JSON.stringify({ intents: [], confidence: {} }) }],
            stop_reason: 'end_turn',
            usage: { input_tokens: 10, output_tokens: 5 },
          });
        }
        // Executor (stream) — SEM content_block de texto (degenerado).
        const encoder = new TextEncoder();
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const events = [
              {
                event: 'message_start',
                data: {
                  type: 'message_start',
                  message: {
                    id: 'msg_degenerate',
                    type: 'message',
                    role: 'assistant',
                    content: [],
                    model: body.model,
                    stop_reason: null,
                    stop_sequence: null,
                    usage: { input_tokens: 10, output_tokens: 0 },
                  },
                },
              },
              {
                event: 'message_delta',
                data: {
                  type: 'message_delta',
                  delta: { stop_reason: 'end_turn', stop_sequence: null },
                  usage: { output_tokens: 0 },
                },
              },
              { event: 'message_stop', data: { type: 'message_stop' } },
            ];
            for (const e of events) {
              controller.enqueue(
                encoder.encode(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`),
              );
            }
            controller.close();
          },
        });
        return new HttpResponse(stream, {
          headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
        });
      }),
    );

    const res = await callBridge({ text: 'olá sem resposta' });
    expect(res.status).toBe(200);
    expect(sentMessages).toHaveLength(1);
    // Texto vazio do cérebro → fallback PT-PT (NÃO string vazia — C8).
    expect(sentMessages[0].text).toBe(ERROR_MESSAGE_PT);
    expect(sentMessages[0].text.length).toBeGreaterThan(0);
  });
});
