import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getServerEnv } from '@/lib/shared/env';
import {
  sendMessage,
  BotApiTokenMissingError,
} from '@/lib/telegram/bot-api';

/**
 * Nexus v2 — Envio de mensagem Telegram (Story 6.17, AC3-AC6 — FR76)
 *
 * Rota `POST /api/telegram/send` — Node runtime (C1, [D-6.17-RUNTIME]): lê
 * `TELEGRAM_CHAT_ID`/`TELEGRAM_BOT_TOKEN` de env e chama `sendMessage` da Bot API
 * (`fetch` server-side) — ambos Node-only. Recebe `{ text }` da tool client-side
 * `enviar_telegram` (`ctx.fetch` same-origin, cookie de sessão automático — ADR-9)
 * e envia a mensagem ao utilizador autenticado.
 *
 * Porquê uma route server-side (e não chamada directa na tool): o executor de
 * tools corre CLIENT-SIDE no fluxo de produção (ADR-9, `noKvStub` lança;
 * `TELEGRAM_BOT_TOKEN` é server-only). A tool `enviar_telegram` faz
 * `ctx.fetch('/api/telegram/send')`; o trabalho Node-only (token + Bot API) vive
 * AQUI. Espelha o padrão de `app/api/google/gmail/draft/route.ts` da 6.10 (auth
 * `getSession`, runtime nodejs, erros 401/400/503/502 nunca `200 { ok:false }` —
 * anti-M4 da 4.9).
 *
 * [D-6.17-CHATID] (anti-SSRF, vinculativa C3): o `chat_id` NUNCA vem do body nem
 * é argumento da tool. A route lê SEMPRE `getServerEnv().TELEGRAM_CHAT_ID`
 * server-side — o destinatário é um invariante do contrato de segurança, fora do
 * alcance do LLM (que poderia inventar/injectar um `chat_id` arbitrário).
 *
 * [D-6.17-CONTRACT] (C5): sucesso → 200 `{ ok: true }` (`sendMessage` devolve
 * `void`; sem `message_id` a propagar — a 6.13 ignora o `result` da Bot API por
 * design). Falha → NUNCA `200 { ok:false }`; o status HTTP é o sinal de verdade:
 *
 *   | Condição                              | Status | corpo `{ error }`     |
 *   |---------------------------------------|--------|-----------------------|
 *   | `getSession` inválida/ausente         | 401    | not_authenticated     |
 *   | `text` ausente/vazio/>4096            | 400    | invalid_request       |
 *   | `TELEGRAM_CHAT_ID` ausente            | 503    | chat_id_missing       |
 *   | `BotApiTokenMissingError`             | 503    | bot_token_missing     |
 *   | `BotApiError`/timeout/rede (upstream) | 502    | telegram_unavailable  |
 *
 * 502 (não 503) para falha da Bot API porque é o upstream Telegram (bad gateway),
 * distinto de 503 (config server-side ausente).
 *
 * Trace: AC3/AC4/AC5/AC6; EPIC-6.md §5 row 6.17; [D-6.17-RUNTIME]/[D-6.17-CHATID]/
 * [D-6.17-CONTRACT]; Architect Gate de Entrada C1-C7. Open-closed: `sendMessage`
 * (`bot-api.ts:287`) INTOCADO (C7). Constitution: Art. IV (No Invention), V (PT-PT),
 * VI (imports `@/...`).
 */

export const runtime = 'nodejs';

/** Limite de `text` da Bot API `sendMessage` (4096 chars). */
const MAX_TEXT_LENGTH = 4096;

/** Corpo de pedido validado (a tool já valida com Zod; a route revalida — defesa em profundidade). */
interface SendRequestBody {
  text?: unknown;
}

/** Resposta de sucesso da route (200). */
export interface TelegramSendResponse {
  ok: true;
}

export async function POST(req: Request): Promise<Response> {
  // (i) Sessão de browser (cookie-gated — a tool só é invocada no contexto de uma
  // sessão autenticada; a route NÃO está em PUBLIC_PATHS). C2/[D-6.17-CHATID].
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  }

  // (ii) Validação do corpo `{ text }` (C3): defesa em profundidade. `chat_id`
  // NUNCA é lido do body (anti-SSRF) — só `text`.
  let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    // Body não-JSON (vazio, malformado) → 400 (nunca 500).
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  // `req.json()` pode devolver `null` ou um JSON escalar/array válido (`123`,
  // `"texto"`, `[]`). Destructurar isso directamente lançaria `TypeError` → 500,
  // violando a promessa de 400 `invalid_request` do AC5. Guarda a forma de objecto
  // ANTES do destructuring (CR Iter 1 F1).
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { text } = parsed as SendRequestBody;
  if (typeof text !== 'string' || text.length === 0 || text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // (iii) `chat_id` SEMPRE server-side ([D-6.17-CHATID]). Ausente → 503, NUNCA
  // tentar enviar com `chat_id` undefined nem mascarar como sucesso (eixo b/c).
  const chatId = getServerEnv().TELEGRAM_CHAT_ID;
  if (!chatId) {
    return NextResponse.json({ error: 'chat_id_missing' }, { status: 503 });
  }

  // (iv) Envia via Bot API (Node-only). `sendMessage` lança em `{ok:false}`/rede/
  // timeout (BotApiError) e em token ausente (BotApiTokenMissingError) — nunca
  // sucesso silencioso (C5, anti-M4). Mapeia cada falha para o status correcto.
  try {
    await sendMessage(chatId, text);
    const responseBody: TelegramSendResponse = { ok: true };
    return NextResponse.json(responseBody);
  } catch (err) {
    if (err instanceof BotApiTokenMissingError) {
      // Config server-side ausente (token do BotFather) → 503 (distinto de 502).
      return NextResponse.json({ error: 'bot_token_missing' }, { status: 503 });
    }
    // BotApiError / BotApiTimeoutError / rede → upstream Telegram indisponível.
    // 502 bad gateway (nunca 200 { ok:false }, anti-M4).
    return NextResponse.json({ error: 'telegram_unavailable' }, { status: 502 });
  }
}
