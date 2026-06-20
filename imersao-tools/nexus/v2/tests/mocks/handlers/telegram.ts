/**
 * Nexus v2 — MSW handlers Telegram Bot API (Story 6.11 — AC6/C5)
 *
 * Handlers `getMe`/`setWebhook` que reflectem o shape REAL da Telegram Bot API
 * (`mock-protocol-fidelity.md` — A1 Epic 1):
 *   - sucesso → `{ ok:true, result:<...> }`
 *   - erro    → `{ ok:false, error_code, description }`
 *
 * Fidelidade de protocolo (C5):
 *   - `getMe` OK → `{ ok:true, result:{ id, is_bot:true, first_name, username, ... } }`
 *     (NUNCA `{ok:true}` sem `result` — o teste de fidelidade falharia).
 *   - `setWebhook` OK → `{ ok:true, result:true, description:"Webhook was set" }`.
 *   - Token inválido → `{ ok:false, error_code:401, description:"Unauthorized" }`
 *     (o `description` REAL da Bot API para token inválido é `"Unauthorized"`,
 *     NÃO `"Not Found"` — `"Not Found"` é para um MÉTODO inexistente; ratificado
 *     no Architect Gate, C5).
 *
 * Discriminação: o token vai no caminho `/bot<token>/<method>`. Um token que
 * contenha o marcador `TELEGRAM_INVALID_TOKEN_MARKER` simula token inválido
 * (`getMe` → `{ok:false}`). Qualquer outro token é tratado como válido.
 *
 * Aditivo (NÃO substitui) — expande o stub vazio anterior, alinhado com o padrão
 * dos handlers Gmail (6.8/6.9/6.10).
 */
import { http, HttpResponse, type HttpHandler } from 'msw';

/** Marcador que, presente no token da URL, faz `getMe` devolver `{ok:false}`. */
export const TELEGRAM_INVALID_TOKEN_MARKER = 'INVALIDTOKEN';

/** Identidade do bot de teste (`getMe` result — shape real). */
export const TELEGRAM_MOCK_BOT = {
  id: 7654321,
  is_bot: true,
  first_name: 'Nexus Test Bot',
  username: 'nexus_test_bot',
  can_join_groups: true,
  can_read_all_group_messages: false,
  supports_inline_queries: false,
} as const;

/** `{ok:false}` real da Bot API para token inválido (C5 — `"Unauthorized"`). */
const UNAUTHORIZED_RESPONSE = {
  ok: false as const,
  error_code: 401,
  description: 'Unauthorized',
};

function tokenIsInvalid(url: string): boolean {
  return url.includes(TELEGRAM_INVALID_TOKEN_MARKER);
}

export const telegramHandlers: HttpHandler[] = [
  // getMe — o helper faz POST (callBotApi usa sempre POST).
  http.post('https://api.telegram.org/bot:token/getMe', ({ request }) => {
    if (tokenIsInvalid(request.url)) {
      return HttpResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
    }
    return HttpResponse.json({ ok: true, result: TELEGRAM_MOCK_BOT });
  }),

  // setWebhook — sucesso idempotente (UM webhook por bot).
  http.post('https://api.telegram.org/bot:token/setWebhook', ({ request }) => {
    if (tokenIsInvalid(request.url)) {
      return HttpResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
    }
    return HttpResponse.json({
      ok: true,
      result: true,
      description: 'Webhook was set',
    });
  }),
];
