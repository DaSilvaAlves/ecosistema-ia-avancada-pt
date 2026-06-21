import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { POST, VOICE_DEFERRED_MESSAGE_PT } from '@/app/api/telegram/process-voice/route';
import { BRIDGE_SECRET_HEADER } from '@/app/api/telegram/process-text/route';
import { server } from '@/tests/mocks/server';

/**
 * Story 6.14 (T5/T7, AC4/AC5/AC6) — bridge Node `POST /api/telegram/process-voice`
 * (STUB FUNCIONAL DE DIFERIMENTO — [D-6.14-TRANSCRIPTION-SERVICE]=(c)).
 *
 * O bridge NÃO transcreve nesta entrega: responde ao utilizador com a mensagem de
 * diferimento PT-PT ([D-6.14-FALLBACK-VOICE] #1) via `sendMessage`. A entrega é
 * interceptada pelo handler MSW `sendMessage` (telegram.ts) — captura `chat_id`/`text`
 * reais (`mock-protocol-fidelity.md` / C5). NÃO há download/transcrição/cérebro no
 * caminho crítico (C2 — diferido REC-6.14-TRANSCRIPTION-FUTURE).
 *
 * O teste de fidelidade de protocolo (AC9/C5) incide sobre o `sendMessage`: o handler
 * MSW reflecte o shape REAL da Bot API (`{ ok:true, result:<Message> }`; texto vazio
 * → `{ ok:false, description:"message text is empty" }`). O teste de degeneração de
 * shape verifica que, se a Bot API responder `{ok:false}`, o bridge NÃO crasha nem
 * devolve 5xx (degrada para log + 200 — eixo c).
 */

const BOT_TOKEN = '7654321:AAExampleBotTokenForTests';
const SECRET = 'segredo-do-webhook-com-mais-de-32-caracteres-aleatorios';
const CHAT_ID = '987654321';

/** Captura os `sendMessage` entregues à Bot API (chat_id + text). */
const sentMessages: Array<{ chat_id: unknown; text: string }> = [];

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
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
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
  server.close();
});

/** Chama o bridge de voz com `{ chatId }` e o shared-secret (a menos que omitido). */
function callBridge(
  opts: { secretHeader?: string | null; chatId?: unknown; rawBody?: string } = {},
): Promise<Response> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (opts.secretHeader !== null) {
    headers.set(BRIDGE_SECRET_HEADER, opts.secretHeader ?? SECRET);
  }
  const body = opts.rawBody ?? JSON.stringify({ chatId: opts.chatId ?? CHAT_ID });
  const req = new Request('https://nexus.test/api/telegram/process-voice', {
    method: 'POST',
    headers,
    body,
  });
  return POST(req);
}

// ═══════════════════════════════════════════════════════════════════════════
// C4 — auth de chamada interna (shared-secret, fail-closed)
// ═══════════════════════════════════════════════════════════════════════════

describe('process-voice — auth shared-secret (C4, fail-closed)', () => {
  it('segredo AUSENTE em env → 403 incondicional, sem invocar sendMessage', async () => {
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

describe('process-voice — parse do corpo', () => {
  it('body não-JSON → 400, sem sendMessage', async () => {
    const res = await callBridge({ rawBody: 'isto-não-é-json-{{{' });
    expect(res.status).toBe(400);
    expect(sentMessages).toHaveLength(0);
  });

  it('`chatId` ausente → 400', async () => {
    const res = await callBridge({ rawBody: JSON.stringify({ fileId: 'x' }) });
    expect(res.status).toBe(400);
    expect(sentMessages).toHaveLength(0);
  });

  it('`chatId` vazio ("") → 400', async () => {
    const res = await callBridge({ rawBody: JSON.stringify({ chatId: '' }) });
    expect(res.status).toBe(400);
    expect(sentMessages).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AC4/AC5 — caminho FELIZ do stub: resposta de diferimento PT-PT via sendMessage
// ═══════════════════════════════════════════════════════════════════════════

describe('process-voice — diferimento (caminho feliz do stub, AC4/AC5)', () => {
  it('voz → `sendMessage` 1× com chatId correcto e a mensagem de diferimento PT-PT', async () => {
    const res = await callBridge();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, routed: true, type: 'voice' });
    expect(sentMessages).toHaveLength(1);
    expect(String(sentMessages[0].chat_id)).toBe(CHAT_ID);
    expect(sentMessages[0].text).toBe(VOICE_DEFERRED_MESSAGE_PT);
    expect(sentMessages[0].text.length).toBeGreaterThan(0);
  });

  it('a mensagem de diferimento é a EXACTA decidida no gate ([D-6.14-FALLBACK-VOICE] #1)', () => {
    // Falsificável: qualquer alteração ao texto decidido pelo `@architect` parte aqui.
    expect(VOICE_DEFERRED_MESSAGE_PT).toBe(
      'Recebi a tua mensagem de voz, mas ainda não consigo processar áudio. ' +
        'Por agora, escreve a tua mensagem em texto.',
    );
  });

  it('`fileId` no corpo é IGNORADO no stub (não descarrega ficheiro) — resposta inalterada', async () => {
    const res = await callBridge({ rawBody: JSON.stringify({ chatId: CHAT_ID, fileId: 'AwACAgIAAxkBAAIB' }) });
    expect(res.status).toBe(200);
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].text).toBe(VOICE_DEFERRED_MESSAGE_PT);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// AC9/C5 — fidelidade + degeneração de protocolo (eixo c — nunca crash, nunca 5xx)
// ═══════════════════════════════════════════════════════════════════════════

describe('process-voice — degeneração de protocolo (AC9/C5, eixo c)', () => {
  it('Bot API responde `{ok:false}` (shape de erro real) → NÃO crash, NÃO 5xx, log + 200', async () => {
    // Override: a Bot API responde o shape de erro REAL `{ok:false, error_code, description}`.
    // `callBotApi` lança `BotApiError` → o bridge degrada (log + 200), nunca propaga 5xx.
    // Falsificável: se o bridge não tratasse `{ok:false}`, ou propagasse 5xx, isto falharia.
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.post('https://api.telegram.org/bot:token/sendMessage', () =>
        HttpResponse.json(
          { ok: false, error_code: 403, description: 'Forbidden: bot was blocked by the user' },
          { status: 403 },
        ),
      ),
    );
    const res = await callBridge();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, routed: true, type: 'voice' });
    // Anti-M4: a falha de entrega é registada (observability), não silenciosa.
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('falha de rede no `sendMessage` → log + 200 (nunca 5xx ao webhook — anti-loop)', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    server.use(
      http.post('https://api.telegram.org/bot:token/sendMessage', () => HttpResponse.error()),
    );
    const res = await callBridge();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, routed: true, type: 'voice' });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
