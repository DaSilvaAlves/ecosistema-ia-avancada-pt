import { z } from 'zod';

/**
 * Nexus v2 — Schema Zod do update da Telegram Bot API (Story 6.12 — FR70)
 *
 * `TelegramUpdateSchema` valida o body do `POST /api/telegram/webhook` (Edge)
 * ANTES de qualquer acesso a campos (AC1/C2). Espelha o shape REAL da Telegram
 * Bot API (`mock-protocol-fidelity.md` / `external-contract-identifiers.md`):
 * os campos `update_id`, `message`, `chat`, `id`, `text`, `voice`, `file_id`,
 * `photo` são identificadores de contrato externo — nomes EXACTOS, sem renomear.
 *
 * Decisões @architect ratificadas (Architect Gate de Entrada, Aria 20/06/2026):
 *   [D-6.12-PARSE-STRATEGY] (C2) `.passthrough()` ao nível raiz E em cada
 *     sub-objecto (`message`, `chat`, `voice`, item de `photo[]`). Justificação:
 *     é o padrão do repo (`bot-api.ts:123-133` — `TelegramUserSchema`); a Bot API
 *     adiciona campos (`entities`, `forward_*`, `reply_to_message`, ...)
 *     constantemente — `.strict()` partiria o parse de updates legítimos →
 *     silent drop (anti-padrão M2/M4 da 4.9). Tolerar campos extra é correcto.
 *   [D-6.12-EXTERNAL-IDENTIFIERS] (C4) `message.photo` é SEMPRE `z.array(...)`
 *     (múltiplas resoluções da mesma foto), NUNCA objecto singular;
 *     `message.voice.file_id: z.string()`; `message.chat.id: z.number().int()`;
 *     `message` é opcional ao nível raiz (updates `edited_message`/`channel_post`/
 *     etc. não têm `message` — caem no tipo `unknown` no handler).
 *
 * Trace: AC1/AC4/AC6; C2/C4; [D-6.12-PARSE-STRATEGY]/[D-6.12-EXTERNAL-IDENTIFIERS].
 */

/**
 * `message.chat` — o `id` é o identificador do chat (number no JSON da Bot API).
 * `.passthrough()` tolera `first_name`/`type`/`username`/etc. sem partir o parse.
 */
const TelegramChatSchema = z
  .object({
    id: z.number().int(),
  })
  .passthrough();

/**
 * `message.voice` — mensagem de voz. `file_id` é o identificador externo para
 * descarregar o ficheiro (usado na transcrição da 6.14). `.passthrough()` tolera
 * `duration`/`mime_type`/`file_unique_id`/`file_size`.
 */
const TelegramVoiceSchema = z
  .object({
    file_id: z.string(),
  })
  .passthrough();

/**
 * Item de `message.photo[]` — uma resolução da foto. `file_id` é o identificador
 * externo (usado no OCR da 6.15). `.passthrough()` tolera `width`/`height`/etc.
 */
const TelegramPhotoSizeSchema = z
  .object({
    file_id: z.string(),
  })
  .passthrough();

/**
 * `message` — corpo da mensagem recebida. Opcional ao nível raiz (ver acima).
 * `chat` obrigatório quando `message` presente (é por aí que se obtém o `chat.id`
 * para o filtro de autorização — AC2). `text`/`voice`/`photo` são mutuamente
 * exclusivos por tipo de mensagem; a detecção de tipo (AC4) é feita no handler
 * por prioridade `text > voice > photo > unknown`.
 */
const TelegramMessageSchema = z
  .object({
    chat: TelegramChatSchema,
    text: z.string().optional(),
    voice: TelegramVoiceSchema.optional(),
    photo: z.array(TelegramPhotoSizeSchema).optional(),
  })
  .passthrough();

/**
 * `TelegramUpdateSchema` — raiz do update. `update_id` obrigatório (todo o update
 * válido da Bot API o tem); `message` opcional. `.passthrough()` na raiz tolera
 * `edited_message`/`channel_post`/`callback_query`/etc. — esses updates passam o
 * parse (sem `message`) e caem no tipo `unknown` no handler (não são 400).
 */
export const TelegramUpdateSchema = z
  .object({
    update_id: z.number().int(),
    message: TelegramMessageSchema.optional(),
  })
  .passthrough();

/** Tipo do update validado — usado no handler e nos testes. */
export type TelegramUpdate = z.infer<typeof TelegramUpdateSchema>;
