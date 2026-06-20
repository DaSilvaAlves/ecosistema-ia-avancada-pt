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

/**
 * Story 6.12 (AC6/C4 — `mock-protocol-fidelity.md`) — factories de update fiéis
 * ao shape REAL da Telegram Bot API, usadas como fixtures nos testes do webhook.
 *
 * O webhook handler chama `POST` directamente (não há request externo à Bot API
 * no caminho de update), por isso estas factories NÃO são `http.post` handlers —
 * são geradores de body com o shape exacto da Bot API, partilhados pelos testes
 * (`webhook.test.ts`). Reflectem os identificadores de contrato externo
 * (`external-contract-identifiers.md`): `update_id`, `message`, `chat`, `id`,
 * `text`, `voice`, `file_id`, `photo` — nomes EXACTOS. `message.photo` é SEMPRE
 * um array (múltiplas resoluções). Um teste de fidelidade falha se omitir
 * `message.chat` de um update de texto válido (C4).
 *
 * Aditivo — NÃO substitui os handlers `getMe`/`setWebhook` da 6.11.
 */

/** chatId default das fixtures (alinhar com `TELEGRAM_CHAT_ID` nos testes). */
export const TELEGRAM_FIXTURE_CHAT_ID = 987654321;

/** Update de texto — shape real da Bot API (forma mais simples). */
export function makeTextUpdate(
  text = 'olá',
  chatId: number = TELEGRAM_FIXTURE_CHAT_ID,
) {
  return {
    update_id: 123456789,
    message: {
      message_id: 1,
      from: { id: chatId, is_bot: false, first_name: 'Eurico', language_code: 'pt' },
      chat: { id: chatId, first_name: 'Eurico', type: 'private' },
      date: 1750425600,
      text,
    },
  };
}

/** Update de voz — `voice.file_id` é o identificador externo (transcrição 6.14). */
export function makeVoiceUpdate(chatId: number = TELEGRAM_FIXTURE_CHAT_ID) {
  return {
    update_id: 123456790,
    message: {
      message_id: 2,
      from: { id: chatId, is_bot: false, first_name: 'Eurico' },
      chat: { id: chatId, type: 'private' },
      date: 1750425601,
      voice: {
        file_id: 'AwACAgIAAxkBAAIB',
        file_unique_id: 'AQADgNaXXXXXXX',
        duration: 3,
        mime_type: 'audio/ogg',
        file_size: 12345,
      },
    },
  };
}

/** Update de foto — `photo` é SEMPRE um array de resoluções (OCR 6.15). */
export function makePhotoUpdate(chatId: number = TELEGRAM_FIXTURE_CHAT_ID) {
  return {
    update_id: 123456791,
    message: {
      message_id: 3,
      from: { id: chatId, is_bot: false, first_name: 'Eurico' },
      chat: { id: chatId, type: 'private' },
      date: 1750425602,
      photo: [
        { file_id: 'AgACAgIAAxkBAAIC', file_unique_id: 'AQAD1', width: 320, height: 240, file_size: 11000 },
        { file_id: 'AgACAgIAAxkBAAID', file_unique_id: 'AQAD2', width: 800, height: 600, file_size: 45000 },
      ],
    },
  };
}

/** Update sem `message` (ex.: `edited_message`/`channel_post`) → tipo `unknown`. */
export function makeUnknownUpdate() {
  return {
    update_id: 123456792,
    edited_message: {
      message_id: 4,
      chat: { id: TELEGRAM_FIXTURE_CHAT_ID, type: 'private' },
      date: 1750425603,
      text: 'editado',
    },
  };
}
