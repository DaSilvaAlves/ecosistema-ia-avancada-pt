import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { TELEGRAM_INVALID_TOKEN_MARKER } from '@/tests/mocks/handlers/telegram';

/**
 * Story 6.11 — setup route Node `POST /api/telegram/setup` (T3, AC2/AC3, C3/C6/C9).
 *
 * Estratégia: `getSession` mockado; `@vercel/kv` em memória (Map) para inspeccionar
 * a ordem de escrita; MSW REAIS da Bot API. Cobre:
 *   - sem sessão → 401, KV não escrito;
 *   - token ausente / segredo ausente → 503, KV não escrito;
 *   - token inválido (getMe {ok:false}) → 4xx, KV NÃO escrito (C3);
 *   - setWebhook {ok:false} → erro, KV NÃO escrito (C3);
 *   - sucesso → KV escrito com schema C9 (tokenHint=4 chars, sem token completo);
 *   - C6: setup 2× com mesmo URL não lança e KV fica coerente.
 */

let sessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({ valid: sessionValid, userId: 'eurico' })),
}));

// KV em memória — guarda valor REAL para inspeccionar o schema escrito.
const kvStore = new Map<string, unknown>();
const kvSet = vi.fn(async (key: string, value: unknown) => {
  kvStore.set(key, value);
});
const kvGet = vi.fn(async (key: string) => (kvStore.has(key) ? kvStore.get(key) : null));
vi.mock('@vercel/kv', () => ({
  kv: {
    set: (key: string, value: unknown) => kvSet(key, value),
    get: (key: string) => kvGet(key),
  },
}));

import { POST } from '@/app/api/telegram/setup/route';
import { TELEGRAM_BOT_KV_KEY, type TelegramBotKvRecord } from '@/app/api/telegram/setup/route';

const VALID_TOKEN = '7654321:VALIDtokenABCDEFGHIJKLMNOPQRSTUVWX1234';
const SECRET = 'segredo-do-webhook-com-mais-de-32-caracteres-aleatorios';
const CHAT_ID = '123456789';
const ORIGIN = 'https://nexus.test';

function callSetup(): Promise<Response> {
  const req = new Request(`${ORIGIN}/api/telegram/setup`, {
    method: 'POST',
    headers: { cookie: 'nexus_session=abc' },
  });
  return POST(req);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  vi.clearAllMocks();
  kvStore.clear();
  sessionValid = true;
  process.env.TELEGRAM_BOT_TOKEN = VALID_TOKEN;
  process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
  process.env.TELEGRAM_CHAT_ID = CHAT_ID;
});

describe('setup — auth e config', () => {
  it('sem sessão → 401, KV não escrito', async () => {
    sessionValid = false;
    const res = await callSetup();
    expect(res.status).toBe(401);
    expect(kvSet).not.toHaveBeenCalled();
  });

  it('TELEGRAM_BOT_TOKEN ausente → 503, KV não escrito', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const res = await callSetup();
    expect(res.status).toBe(503);
    expect(kvSet).not.toHaveBeenCalled();
  });

  it('TELEGRAM_WEBHOOK_SECRET ausente → 503, KV não escrito', async () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    const res = await callSetup();
    expect(res.status).toBe(503);
    expect(kvSet).not.toHaveBeenCalled();
  });
});

describe('setup — ordem de escrita C3 (Telegram PRIMEIRO, KV DEPOIS)', () => {
  it('token inválido (getMe {ok:false}) → 400, KV NÃO escrito', async () => {
    process.env.TELEGRAM_BOT_TOKEN = `7654321:${TELEGRAM_INVALID_TOKEN_MARKER}restodotoken1234567890`;
    const res = await callSetup();
    expect(res.status).toBe(400);
    expect(kvSet).not.toHaveBeenCalled();
  });

  // #3 (CR Iter 2): assimetria getMe corrigida — outage/5xx/não-JSON do Telegram
  // ao validar o token NÃO é "token inválido" (400), é falha de upstream (502),
  // em simetria com o setWebhook. Estes testes FALHAM sem o fix (o handler antigo
  // mapeava QUALQUER BotApiError do getMe a 400).
  it('getMe outage (ok:false sem error_code 401) → 502, KV NÃO escrito (#3)', async () => {
    server.use(
      http.post('https://api.telegram.org/bot:token/getMe', () =>
        HttpResponse.json(
          { ok: false, error_code: 500, description: 'Internal Server Error' },
          { status: 500 },
        ),
      ),
    );
    const res = await callSetup();
    expect(res.status).toBe(502);
    expect(kvSet).not.toHaveBeenCalled();
  });

  it('getMe resposta não-JSON da infra (ex: HTML 5xx) → 502, KV NÃO escrito (#3)', async () => {
    server.use(
      http.post(
        'https://api.telegram.org/bot:token/getMe',
        () =>
          new HttpResponse('<html>502 Bad Gateway</html>', {
            status: 502,
            headers: { 'Content-Type': 'text/html' },
          }),
      ),
    );
    const res = await callSetup();
    expect(res.status).toBe(502);
    expect(kvSet).not.toHaveBeenCalled();
  });

  it('setWebhook {ok:false} → 502, KV NÃO escrito', async () => {
    server.use(
      http.post('https://api.telegram.org/bot:token/setWebhook', () =>
        HttpResponse.json({ ok: false, error_code: 400, description: 'Bad Request' }),
      ),
    );
    const res = await callSetup();
    expect(res.status).toBe(502);
    expect(kvSet).not.toHaveBeenCalled();
  });

  it('setWebhook {ok:true,result:false} → 502, KV NÃO escrito', async () => {
    server.use(
      http.post('https://api.telegram.org/bot:token/setWebhook', () =>
        HttpResponse.json({ ok: true, result: false }),
      ),
    );
    const res = await callSetup();
    expect(res.status).toBe(502);
    expect(kvSet).not.toHaveBeenCalled();
  });
});

describe('setup — sucesso e schema KV C9', () => {
  it('sucesso → 200 e KV escrito com schema C9 (tokenHint=4 chars, sem token completo)', async () => {
    const res = await callSetup();
    expect(res.status).toBe(200);
    expect(kvSet).toHaveBeenCalledTimes(1);

    const written = kvStore.get(TELEGRAM_BOT_KV_KEY) as TelegramBotKvRecord;
    expect(written.tokenHint).toBe(VALID_TOKEN.slice(-4));
    expect(written.tokenHint.length).toBe(4);
    expect(written.chatId).toBe(CHAT_ID);
    expect(written.webhookSet).toBe(true);
    expect(written.webhookUrl).toBe(`${ORIGIN}/api/telegram/webhook`);
    expect(typeof written.webhookSetAt).toBe('string');

    // C9 — o token completo e o secret_token NUNCA em KV.
    const serialized = JSON.stringify(written);
    expect(serialized).not.toContain(VALID_TOKEN);
    expect(serialized).not.toContain(SECRET);
  });
});

describe('setup — idempotência C6 (2× mesmo URL)', () => {
  it('invocar 2× não lança e o KV fica coerente (mesmo webhookUrl)', async () => {
    const res1 = await callSetup();
    expect(res1.status).toBe(200);
    const first = kvStore.get(TELEGRAM_BOT_KV_KEY) as TelegramBotKvRecord;

    const res2 = await callSetup();
    expect(res2.status).toBe(200);
    const second = kvStore.get(TELEGRAM_BOT_KV_KEY) as TelegramBotKvRecord;

    expect(kvSet).toHaveBeenCalledTimes(2);
    expect(second.webhookUrl).toBe(first.webhookUrl);
    expect(second.webhookSet).toBe(true);
    // Sem duplicação: UMA só chave KV.
    expect(kvStore.size).toBe(1);
  });
});
