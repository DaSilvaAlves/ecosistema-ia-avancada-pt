import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { TELEGRAM_INVALID_TOKEN_MARKER } from '@/tests/mocks/handlers/telegram';
import type { TelegramSendResponse } from '@/app/api/telegram/send/route';

/**
 * Story 6.17 — testes da route `POST /api/telegram/send` (AC3-AC6, C1-C7).
 *
 * Estratégia (espelha `gmail-draft.test.ts` da 6.10): mock de `getSession` e
 * `getServerEnv` (para `TELEGRAM_CHAT_ID`); a Bot API real (`sendMessage`) é
 * interceptada por MSW (handler `telegram.ts` da 6.11/6.13 — shape REAL
 * `{ ok:true, result:Message }` / `{ ok:false, error_code, description }`,
 * `mock-protocol-fidelity.md`). O `TELEGRAM_BOT_TOKEN` é lido por `bot-api.ts`
 * directamente de `process.env`, por isso é definido em `process.env` (não via
 * getServerEnv mock).
 *
 * Condições do gate cobertas:
 *   - C1: `export const runtime = 'nodejs'`.
 *   - C2: `getSession` obrigatório → 401 not_authenticated.
 *   - C3: `{ text }` validado (vazio/>4096 → 400); `chat_id` SEMPRE server-side.
 *   - C5: 200 `{ ok:true }`; falha 401/400/503/502 nunca `200 { ok:false }`.
 *   - AC9.g: degenerado Bot API `{ok:false}` → route propaga 502 (não sucesso).
 */

let sessionValid = true;
// F2 (CR Iter 1): quando `cookieAware` está activo, a validade da sessão deriva da
// PRESENÇA real do cookie no pedido (não de `sessionValid`). Isto faz o teste de
// "cookie ausente" falhar pela razão certa — sem cookie → sessão inválida —
// em vez de ser tautológico (o mock antigo ignorava o cookie e dependia só de
// `sessionValid=false`, pelo que não provava nada sobre o gate de cookie).
let cookieAware = false;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async (req: Request) => {
    if (cookieAware) {
      const hasCookie = (req.headers.get('cookie') ?? '').includes('nexus_session=');
      return { valid: hasCookie, userId: 'eurico' };
    }
    return { valid: sessionValid, userId: 'eurico' };
  }),
}));

let mockChatId: string | undefined = '987654321';
vi.mock('@/lib/shared/env', () => ({
  getServerEnv: vi.fn(() => ({ TELEGRAM_CHAT_ID: mockChatId })),
}));

const VALID_BOT_TOKEN = '7654321:AAExampleBotTokenForTests';

// F3 (CR Iter 1): captura o valor original de `TELEGRAM_BOT_TOKEN` para o restaurar
// em `afterAll` — evita fuga de estado global do env entre ficheiros de teste
// (testes order-dependent). O `beforeEach`/casos individuais mutam-no; aqui
// garante-se que o ambiente fica como estava no fim da suite.
const ORIGINAL_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function callSend(
  body: unknown,
  opts: { withCookie?: boolean } = {},
): Promise<Response> {
  const { POST } = await import('@/app/api/telegram/send/route');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.withCookie !== false) headers.cookie = 'nexus_session=abc';
  const req = new Request('http://localhost:3001/api/telegram/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return POST(req);
}

const SEND_ENDPOINT = `https://api.telegram.org/bot${VALID_BOT_TOKEN}/sendMessage`;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => {
  server.close();
  // F3 — restaura o env ao estado original (em vez de `delete`), sem fuga global.
  if (ORIGINAL_BOT_TOKEN === undefined) {
    delete process.env.TELEGRAM_BOT_TOKEN;
  } else {
    process.env.TELEGRAM_BOT_TOKEN = ORIGINAL_BOT_TOKEN;
  }
});

beforeEach(() => {
  vi.clearAllMocks();
  sessionValid = true;
  cookieAware = false;
  mockChatId = '987654321';
  process.env.TELEGRAM_BOT_TOKEN = VALID_BOT_TOKEN;
});

describe('telegram/send — auth (AC4, C2)', () => {
  it('sessão inválida → 401 not_authenticated', async () => {
    sessionValid = false;
    const res = await callSend({ text: 'olá' });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('not_authenticated');
  });

  it('cookie ausente → 401 not_authenticated (gate de cookie, não tautológico — F2)', async () => {
    // `cookieAware`: a validade deriva da PRESENÇA do cookie no pedido. Com
    // `sessionValid=true` (default), o 401 só pode vir da ausência do cookie —
    // o teste falha pela razão certa.
    cookieAware = true;
    const res = await callSend({ text: 'olá' }, { withCookie: false });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('not_authenticated');
  });

  it('cookie presente (cookieAware) → passa o gate de auth (controlo do F2)', async () => {
    // Prova que o gate de cookie distingue presença de ausência: com cookie
    // presente, a auth passa (segue para o caminho de envio, 200).
    cookieAware = true;
    server.use(
      http.post(SEND_ENDPOINT, () =>
        HttpResponse.json({ ok: true, result: { message_id: 1 } }),
      ),
    );
    const res = await callSend({ text: 'olá' });
    expect(res.status).toBe(200);
  });
});

describe('telegram/send — validação do corpo (AC5, C3)', () => {
  it('text ausente → 400 invalid_request', async () => {
    const res = await callSend({});
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
  });

  it('text vazio → 400 invalid_request', async () => {
    const res = await callSend({ text: '' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
  });

  it('text > 4096 chars → 400 invalid_request', async () => {
    const res = await callSend({ text: 'a'.repeat(4097) });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
  });

  it('corpo não-JSON → 400 invalid_request', async () => {
    const { POST } = await import('@/app/api/telegram/send/route');
    const req = new Request('http://localhost:3001/api/telegram/send', {
      method: 'POST',
      headers: { cookie: 'nexus_session=abc', 'Content-Type': 'application/json' },
      body: 'isto não é json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
  });

  // F1 (CR Iter 1): `req.json()` aceita JSON escalar/null/array válidos. Destructurar
  // `const { text } = payload` sobre estes lançaria TypeError → 500. A route tem de
  // devolver 400 `invalid_request`, NUNCA 500.
  it.each([
    ['null', 'null'],
    ['número escalar', '123'],
    ['string escalar', '"texto solto"'],
    ['array', '["olá"]'],
    ['boolean', 'true'],
  ])('corpo JSON %s (não-objecto) → 400 invalid_request, nunca 500', async (_label, rawBody) => {
    const { POST } = await import('@/app/api/telegram/send/route');
    const req = new Request('http://localhost:3001/api/telegram/send', {
      method: 'POST',
      headers: { cookie: 'nexus_session=abc', 'Content-Type': 'application/json' },
      body: rawBody,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
  });
});

describe('telegram/send — config server-side ausente (AC6, C3)', () => {
  it('TELEGRAM_CHAT_ID ausente → 503 chat_id_missing (nunca envia com chat_id vazio)', async () => {
    mockChatId = undefined;
    let botCalled = false;
    server.use(
      http.post(SEND_ENDPOINT, () => {
        botCalled = true;
        return HttpResponse.json({ ok: true, result: { message_id: 1 } });
      }),
    );
    const res = await callSend({ text: 'olá' });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('chat_id_missing');
    // FALSIFICÁVEL: a Bot API nunca é chamada sem chat_id.
    expect(botCalled).toBe(false);
  });

  it('TELEGRAM_BOT_TOKEN ausente → 503 bot_token_missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const res = await callSend({ text: 'olá' });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('bot_token_missing');
  });
});

describe('telegram/send — caminho feliz + shape (AC3, C5)', () => {
  it('envia e devolve 200 { ok:true }; sendMessage chamado com chat_id de env + text', async () => {
    let captured: { chat_id?: unknown; text?: unknown } = {};
    server.use(
      http.post(SEND_ENDPOINT, async ({ request }) => {
        captured = (await request.json()) as { chat_id?: unknown; text?: unknown };
        return HttpResponse.json({
          ok: true,
          result: { message_id: 42, chat: { id: captured.chat_id, type: 'private' }, text: captured.text },
        });
      }),
    );
    const res = await callSend({ text: 'bom dia' });
    expect(res.status).toBe(200);
    const json = (await res.json()) as TelegramSendResponse;
    expect(json).toEqual({ ok: true });
    // chat_id vem SEMPRE de env (anti-SSRF), não do body.
    expect(captured.chat_id).toBe('987654321');
    expect(captured.text).toBe('bom dia');
  });
});

describe('telegram/send — falha da Bot API (C5, AC9.g) — nunca 200 { ok:false }', () => {
  it('Bot API {ok:false} (degenerado, protocol fidelity) → 502 telegram_unavailable', async () => {
    server.use(
      http.post(SEND_ENDPOINT, () =>
        HttpResponse.json(
          { ok: false, error_code: 403, description: 'Forbidden: bot was blocked by the user' },
          { status: 403 },
        ),
      ),
    );
    const res = await callSend({ text: 'olá' });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('telegram_unavailable');
  });

  it('token inválido (Bot API 401 Unauthorized) → 502 telegram_unavailable', async () => {
    process.env.TELEGRAM_BOT_TOKEN = `${TELEGRAM_INVALID_TOKEN_MARKER}:xyz`;
    const res = await callSend({ text: 'olá' });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('telegram_unavailable');
  });

  it('Bot API 5xx / rede → 502 telegram_unavailable (nunca 200 { ok:false })', async () => {
    server.use(
      http.post(SEND_ENDPOINT, () => HttpResponse.error()),
    );
    const res = await callSend({ text: 'olá' });
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe('telegram_unavailable');
  });
});
