import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/tests/mocks/server';
import { TELEGRAM_MOCK_BOT } from '@/tests/mocks/handlers/telegram';
import {
  callBotApi,
  getMe,
  setWebhook,
  BotApiTokenMissingError,
  BotApiError,
  BotApiTimeoutError,
} from '@/lib/telegram/bot-api';

/**
 * Story 6.11 — helper puro Telegram Bot API (`bot-api.ts`) (T2, AC1/AC2/AC3/AC7).
 *
 * Estratégia: MSW handlers REAIS da Bot API (`getMe`/`setWebhook`, envelope
 * `{ok:true,result:...}` / `{ok:false,error_code,description}`) + token em
 * `process.env.TELEGRAM_BOT_TOKEN`. Cobre:
 *   - token ausente → BotApiTokenMissingError ANTES de qualquer fetch (eixo a/c);
 *   - getMe válido → shape correcto (fidelidade C5/AC6 — falsificável);
 *   - getMe token inválido → BotApiError com `description:"Unauthorized"`;
 *   - setWebhook sucesso → não lança;
 *   - setWebhook `{ok:false}` / `result:false` → BotApiError (C3).
 */

const VALID_TOKEN = '7654321:VALIDtokenABCDEFGHIJKLMNOPQRSTUVWXYZ12';
const INVALID_TOKEN = '7654321:INVALIDTOKENabcdefghijklmnopqrstuvwxyz';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  process.env.TELEGRAM_BOT_TOKEN = VALID_TOKEN;
});

describe('callBotApi — token ausente (eixo a/c)', () => {
  it('lança BotApiTokenMissingError ANTES de qualquer fetch quando TELEGRAM_BOT_TOKEN ausente', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    await expect(callBotApi('getMe')).rejects.toBeInstanceOf(BotApiTokenMissingError);
  });

  it('lança BotApiTokenMissingError com token vazio', async () => {
    process.env.TELEGRAM_BOT_TOKEN = '';
    await expect(getMe()).rejects.toBeInstanceOf(BotApiTokenMissingError);
  });
});

describe('getMe — validação de token', () => {
  it('token válido → devolve o shape real da Bot API', async () => {
    const me = await getMe();
    expect(me.id).toBe(TELEGRAM_MOCK_BOT.id);
    expect(me.is_bot).toBe(true);
    expect(me.username).toBe('nexus_test_bot');
    expect(me.first_name).toBe('Nexus Test Bot');
  });

  it('token inválido → lança BotApiError com description "Unauthorized" (C5)', async () => {
    process.env.TELEGRAM_BOT_TOKEN = INVALID_TOKEN;
    await expect(getMe()).rejects.toBeInstanceOf(BotApiError);
    try {
      await getMe();
      expect.unreachable('getMe deveria ter lançado');
    } catch (err) {
      expect(err).toBeInstanceOf(BotApiError);
      expect((err as BotApiError).description).toBe('Unauthorized');
      expect((err as BotApiError).method).toBe('getMe');
    }
  });

  // C5 / AC6 / T5.4 — teste de fidelidade de protocolo: FALHA se o shape MSW
  // divergir do real (ex: `result` ausente, ou `result` sem `is_bot`/`username`).
  it('FIDELIDADE: getMe válido tem result.is_bot===true e result.username presente (falha se o shape MSW mudar)', async () => {
    const me = await getMe();
    // Estas duas asserções quebram imediatamente se o handler MSW passar a
    // devolver `{ok:true}` sem `result`, ou um `result` sem `is_bot`/`username`.
    expect(me.is_bot).toBe(true);
    expect(typeof me.username).toBe('string');
    expect(me.username && me.username.length).toBeGreaterThan(0);
  });

  it('FIDELIDADE: getMe rejeita se a Bot API devolver {ok:true} sem result (Zod)', async () => {
    server.use(
      http.post('https://api.telegram.org/bot:token/getMe', () =>
        HttpResponse.json({ ok: true }),
      ),
    );
    // `result` é `undefined` → `callBotApi` devolve undefined → TelegramUserSchema.parse lança.
    await expect(getMe()).rejects.toBeTruthy();
  });

  // F3 (CR Iter 1): infra intermédia devolve não-JSON (ex: HTML 5xx do proxy/CDN)
  // → `resp.json()` lançaria SyntaxError cru; o helper converte-o em BotApiError.
  it('resposta não-JSON da infra → BotApiError (não SyntaxError cru, F3)', async () => {
    server.use(
      http.post('https://api.telegram.org/bot:token/getMe', () =>
        new HttpResponse('<html>502 Bad Gateway</html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' },
        }),
      ),
    );
    await expect(getMe()).rejects.toBeInstanceOf(BotApiError);
  });
});

// #4 (CR Iter 2): o `fetch` da Bot API tem timeout via AbortController. Um fetch
// pendurado abortaria por timeout → BotApiTimeoutError (instanceof BotApiError,
// nunca silenciado nem pendurado até ao tecto da plataforma). Este teste FALHA
// sem o fix (sem AbortController o fetch esperaria o handler lento até ao fim e
// devolveria a identidade do bot em vez de lançar).
describe('callBotApi — timeout (AbortController, #4)', () => {
  it('fetch pendurado além do timeout → BotApiTimeoutError (instanceof BotApiError)', async () => {
    server.use(
      http.post('https://api.telegram.org/bot:token/getMe', async () => {
        // Handler propositadamente mais lento (200 ms) que o timeout (20 ms).
        await delay(200);
        return HttpResponse.json({ ok: true, result: TELEGRAM_MOCK_BOT });
      }),
    );
    const err = await callBotApi('getMe', undefined, 20).catch((e) => e);
    expect(err).toBeInstanceOf(BotApiTimeoutError);
    expect(err).toBeInstanceOf(BotApiError);
    expect((err as BotApiError).method).toBe('getMe');
  });

  it('chamada rápida dentro do timeout → resolve normalmente (o timer não interfere)', async () => {
    // Timeout folgado (5 s) — o fetch normal resolve muito antes; garante que o
    // AbortController/timer não aborta chamadas legítimas nem deixa o timer pendente.
    const me = await callBotApi<typeof TELEGRAM_MOCK_BOT>('getMe', undefined, 5_000);
    expect(me.id).toBe(TELEGRAM_MOCK_BOT.id);
  });
});

describe('setWebhook', () => {
  it('sucesso ({ok:true,result:true}) → não lança', async () => {
    await expect(
      setWebhook('https://nexus.test/api/telegram/webhook', 'segredo-de-teste-com-mais-de-32-caracteres-aqui'),
    ).resolves.toBeUndefined();
  });

  it('envia o body real {url, secret_token, allowed_updates:["message"]}', async () => {
    let captured: unknown = null;
    server.use(
      http.post('https://api.telegram.org/bot:token/setWebhook', async ({ request }) => {
        captured = await request.json();
        return HttpResponse.json({ ok: true, result: true, description: 'Webhook was set' });
      }),
    );
    await setWebhook('https://nexus.test/api/telegram/webhook', 'segredo-x');
    expect(captured).toEqual({
      url: 'https://nexus.test/api/telegram/webhook',
      secret_token: 'segredo-x',
      allowed_updates: ['message'],
    });
  });

  it('{ok:false} → lança BotApiError (C3)', async () => {
    server.use(
      http.post('https://api.telegram.org/bot:token/setWebhook', () =>
        HttpResponse.json({ ok: false, error_code: 400, description: 'Bad Request: bad webhook' }),
      ),
    );
    await expect(setWebhook('https://x.test/w', 's')).rejects.toBeInstanceOf(BotApiError);
  });

  it('{ok:true, result:false} → lança BotApiError (Telegram não actualizou, C3)', async () => {
    server.use(
      http.post('https://api.telegram.org/bot:token/setWebhook', () =>
        HttpResponse.json({ ok: true, result: false }),
      ),
    );
    await expect(setWebhook('https://x.test/w', 's')).rejects.toBeInstanceOf(BotApiError);
  });
});
