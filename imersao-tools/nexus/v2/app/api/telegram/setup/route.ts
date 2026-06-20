import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getMe,
  setWebhook,
  BotApiTokenMissingError,
  BotApiError,
  type TelegramUser,
} from '@/lib/telegram/bot-api';

/**
 * Nexus v2 — Setup one-time do bot Telegram (Node) (Story 6.11 — FR69)
 *
 * `POST /api/telegram/setup` — invocado pelo Eurico UMA vez após o deploy para
 * registar o webhook em `api.telegram.org`. [D-6.11-SETUP-SPLIT]/C: o SETUP corre
 * em **Node** (`runtime='nodejs'`, auth `getSession` — padrão de
 * `validate-token/route.ts` e `gmail/classify/route.ts`); o webhook receiver corre
 * em Edge. Script npm `setup:telegram` rejeitado como fonte primária (sem acesso
 * garantido a env/KV de produção fora do runtime Vercel) — esta route é a fonte de
 * verdade do setup.
 *
 * Ordem de escrita (C3 — eixo b/c, `internal-state-contract-gate.md`):
 *   1. `getMe()` valida o token ([D-6.11-GET-ME]); `{ok:false}` (token inválido,
 *      `description:"Unauthorized"`) → aborta, KV NÃO escrito.
 *   2. `setWebhook(url, secret)` confirma `{ok:true, result:true}` no Telegram; se
 *      `result:false`/`{ok:false}`/rede → aborta, KV NÃO escrito.
 *   3. SÓ ENTÃO `kv.set('nexus:telegram:bot', ...)`. O KV nunca afirma
 *      `webhookSet:true` sem o Telegram ter realmente aceitado.
 *
 * Idempotência (C6 — [D-6.11-IDEMPOTENCIA]): re-correr o setup com o mesmo URL não
 * lança (Bot API trata `setWebhook` como idempotente — UM webhook por bot) e
 * actualiza `webhookSetAt` em KV sem duplicar.
 *
 * Schema KV (C9 — [D-6.11-KV-SCHEMA]): `{ tokenHint, chatId, webhookSet, webhookUrl,
 * webhookSetAt }`. `tokenHint` = SÓ os últimos 4 chars do token (NUNCA o token
 * completo — vive em env server-only; duplicá-lo aumenta a superfície de exposição,
 * NFR6/R1). O `secret_token` NÃO entra em KV (o webhook compara contra env
 * directamente). `kv.set` directo sobre a chave conhecida — JAMAIS `kv.keys()`/
 * `kv.scan()` (D-KV-HASH, AC8).
 *
 * URL do webhook: derivado da origem do request (a deployment Vercel onde a route
 * corre), com o caminho canónico `/api/telegram/webhook` — assim o webhook
 * registado aponta sempre para a deployment actual (re-deploy → URL novo → o
 * Telegram substitui silenciosamente).
 *
 * Trace: AC2/AC3; [D-6.11-SETUP-SPLIT]/[D-6.11-GET-ME]/[D-6.11-KV-SCHEMA]/
 * [D-6.11-IDEMPOTENCIA]; C3/C6/C9.
 */

export const runtime = 'nodejs';

/** Chave KV do estado do bot (arch §6 — nome exacto, prefixo `nexus:`, ADR-6). */
export const TELEGRAM_BOT_KV_KEY = 'nexus:telegram:bot';

/** Caminho canónico do webhook Edge (registado em `api.telegram.org`). */
const WEBHOOK_PATH = '/api/telegram/webhook';

/** Registo persistido em KV ([D-6.11-KV-SCHEMA]/C9). */
export interface TelegramBotKvRecord {
  /** ÚLTIMOS 4 chars do token, só para debug. NUNCA o token completo. */
  tokenHint: string;
  /** `TELEGRAM_CHAT_ID` (destino, não credencial). */
  chatId: string;
  webhookSet: boolean;
  webhookUrl: string;
  /** ISO 8601. */
  webhookSetAt: string;
}

/** Últimos 4 chars do token (`tokenHint`) — nunca o token completo (C9). */
function tokenHintOf(token: string): string {
  return token.slice(-4);
}

/**
 * Constrói o URL do webhook a partir da origem do request. `req.nextUrl` não está
 * garantido num `Request` cru — usamos `new URL(req.url).origin`.
 */
function webhookUrlFrom(req: Request): string {
  const origin = new URL(req.url).origin;
  return `${origin}${WEBHOOK_PATH}`;
}

export async function POST(req: Request): Promise<Response> {
  // 1. Auth de admin (padrão Node `getSession`).
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const chatId = process.env.TELEGRAM_CHAT_ID ?? '';

  // Config ausente → 503 fail-closed (não há setup possível sem token+segredo).
  if (!botToken) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN ausente — configura o token do BotFather em Vercel env.' },
      { status: 503 },
    );
  }
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'TELEGRAM_WEBHOOK_SECRET ausente — configura o segredo do webhook em Vercel env.' },
      { status: 503 },
    );
  }

  const webhookUrl = webhookUrlFrom(req);

  // 2. getMe PRIMEIRO (C3 / [D-6.11-GET-ME]). Token inválido → KV NÃO escrito.
  let bot: TelegramUser;
  try {
    bot = await getMe();
  } catch (err) {
    if (err instanceof BotApiTokenMissingError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof BotApiError) {
      // Token inválido (Bot API `{ok:false, description:"Unauthorized"}`) ou rede.
      return NextResponse.json(
        { error: `Token BotFather inválido ou inacessível: ${err.description}` },
        { status: 400 },
      );
    }
    // Erro de rede do fetch — KV NÃO escrito; estado anterior preservado.
    return NextResponse.json(
      { error: 'Telegram indisponível ao validar o token.' },
      { status: 503 },
    );
  }

  // 3. setWebhook — só prossegue se {ok:true, result:true} (C3). result:false /
  // {ok:false} / rede → lança → KV NÃO escrito.
  try {
    await setWebhook(webhookUrl, webhookSecret);
  } catch (err) {
    const message = err instanceof BotApiError ? err.description : 'Telegram indisponível.';
    return NextResponse.json(
      { error: `Falha ao registar o webhook: ${message}` },
      { status: 502 },
    );
  }

  // 4. SÓ ENTÃO persistir em KV (C3) — schema C9, `kv.set` directo (AC8).
  const record: TelegramBotKvRecord = {
    tokenHint: tokenHintOf(botToken),
    chatId,
    webhookSet: true,
    webhookUrl,
    webhookSetAt: new Date().toISOString(),
  };
  await kv.set(TELEGRAM_BOT_KV_KEY, record);

  return NextResponse.json({
    ok: true,
    bot: { id: bot.id, username: bot.username ?? null },
    webhookUrl,
  });
}
