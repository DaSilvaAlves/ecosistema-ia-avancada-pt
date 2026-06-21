/**
 * Nexus v2 — Webhook handler Telegram (Edge) (Story 6.12 — FR70)
 *
 * `POST /api/telegram/webhook` — PRIMEIRO endpoint do Nexus que recebe input
 * não-solicitado da internet pública (EPIC-6.md §2/§9, Risco R2/R3). A 6.11
 * entregou o esqueleto (porteiro de origem `secret_token` + stub 200). A 6.12
 * SUBSTITUI o stub pelo handler completo: parse Zod → filtro `chatId` →
 * rate-limit KV → detecção de tipo → dispatch stub ([D-6.11-WEBHOOK-STUB]).
 *
 * Edge runtime (ADR-1 / arch §4.1 / C3): só leitura de header + `req.json()` +
 * Zod + `kv.incr`/`kv.expire` + `Response`. Zero `node:crypto`, zero
 * `googleapis`, zero `getValidAccessToken` (Node-only). `kv` de `@vercel/kv`
 * (Edge-safe — precedente `confirm/route.ts:1`, ratificado no Architect Gate).
 *
 * ORDEM DAS GUARDAS (AC7/C6 — inegociável, defesa em profundidade):
 *   1. `secret_token` (herdada da 6.11 — C1, PRESERVADA byte-a-byte; 1.ª operação)
 *   2. parse `req.json()` + `TelegramUpdateSchema.safeParse` (AC1/C2 → 400)
 *   3. filtro `chatId` (AC2/C7 → 200 silencioso se não autorizado)
 *   4. rate-limit KV (AC3/C5 → 429 se excedido; fail-OPEN com log se KV down — C9)
 *   5. detecção de tipo + dispatch stub (AC4/AC5 → 200 {ok,routed:false,type})
 *
 * O rate-limit ocorre DEPOIS do filtro `chatId` (C6): não se gastam KV writes em
 * chatIds não autorizados, e o limite só é atingível pelo chatId legítimo.
 *
 * Distinção fail-closed vs fail-open ([D-6.12-RATELIMIT-KV-FAIL]/C9):
 *   - `secret_token` é AUTENTICAÇÃO → fail-CLOSED (sem segredo → 403 — C1/6.11).
 *   - rate-limit é HARDENING anti-hammering, NÃO autenticação → fail-OPEN: se o KV
 *     lançar, processa-se o request MAS regista-se `console.error` (NUNCA
 *     silencioso — anti-padrão M4 da 4.9). Para single-user, disponibilidade do
 *     bot ao único utilizador legítimo > defesa marginal.
 *
 * Story 6.13 (FR71) — o ramo `type==='text'` deixa de ser stub: lança um `fetch`
 * fire-and-forget ao bridge Node `/api/telegram/process-text` (que invoca o cérebro
 * multi-intent e responde ao utilizador via `sendMessage`) e devolve `routed:true`.
 * As guardas C1-C9 da 6.12 ficam INTACTAS (open-closed — AC6); voz/foto/unknown
 * continuam `routed:false` (6.14/6.15). O ACK ao Telegram é IMEDIATO (não aguarda o
 * cérebro — [D-6.13-TIMEOUT]=(c), AC4): o `fetch` é iniciado mas NÃO aguardado.
 *
 * Trace: AC1-AC8; C1-C9; [D-6.12-PARSE-STRATEGY]/[D-6.12-CHATID-REJECT]/
 * [D-6.12-RATELIMIT-ALGO]/[D-6.12-RATELIMIT-RESPONSE]/[D-6.12-FAN-OUT-SCOPE]/
 * [D-6.12-MISSING-CHATID-ENV]/[D-6.12-RATELIMIT-KV-FAIL]/[D-6.12-CHATID-TYPE];
 * Story 6.13 [D-6.13-RUNTIME]/[D-6.13-TIMEOUT]; C5/C6/C7 da 6.13.
 */

import { kv } from '@vercel/kv';
import { TelegramUpdateSchema, type TelegramUpdate } from '@/lib/telegram/types';

export const runtime = 'edge';

const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

/**
 * Caminho do bridge Node que invoca o cérebro (Story 6.13). O webhook NÃO importa
 * o módulo do bridge (`process-text/route.ts`) — esse importa `runAgent` + o barrel
 * de tools (Node-only, dynamic-import do SDK Anthropic). Importá-lo aqui puxaria
 * código Node-only para o bundle Edge (viola C7/C3 da 6.12). Por isso o caminho e o
 * header do shared-secret são duplicados como literais de contrato (como o
 * `SECRET_HEADER` já é) — strings, não dependências de módulo.
 */
const PROCESS_TEXT_PATH = '/api/telegram/process-text';

/** Shared-secret header da chamada interna webhook→bridge (C11 — literal duplicado). */
const BRIDGE_SECRET_HEADER = 'x-telegram-bridge-secret';

/** Fixed window 60s — chave `nexus:telegram:ratelimit:${chatId}:${windowId}`. */
const RATE_LIMIT_WINDOW_MS = 60_000;
/** Máximo de updates por janela; `count > 60` → 429 ([D-6.12-RATELIMIT-RESPONSE]). */
const RATE_LIMIT_MAX_REQUESTS = 60;
/** TTL 70s: 10s de margem sobre a janela de 60s (clock skew / atraso incr→expire). */
const RATE_LIMIT_TTL_S = 70;

/** Tipo de update detectado (AC4) — passado ao dispatch (AC5). */
type UpdateType = 'text' | 'voice' | 'photo' | 'unknown';

/** Resposta 403 (origem não reconhecida — sem caminho de remediação). C1/6.11. */
function forbidden(): Response {
  return new Response('forbidden', { status: 403 });
}

/** Resposta JSON 200 — `{ok:true}` silencioso ou dispatch `{ok,routed,type}`. */
function jsonOk(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Rate-limit KV fixed-window (C5). `kv.incr` + `kv.expire(key, 70)` INCONDICIONAL
 * (não só em `count===1` — fecha a janela chave-sem-TTL→contador-eterno do eixo b).
 *
 * Retorna:
 *   - `'allowed'`  → `count <= 60` (processar)
 *   - `'exceeded'` → `count > 60` (429)
 *   - `'kv_error'` → `kv.incr`/`kv.expire` lançou (fail-OPEN + log — C9)
 *
 * Sem `kv.keys()`/`kv.scan()` (D-KV-HASH / C8): chave directa conhecida.
 */
async function checkRateLimit(
  chatId: string,
): Promise<'allowed' | 'exceeded' | 'kv_error'> {
  const windowId = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS);
  const key = `nexus:telegram:ratelimit:${chatId}:${windowId}`;
  try {
    const count = await kv.incr(key);
    // C5 — expire INCONDICIONAL após cada incr (idempotente; custo desprezável).
    await kv.expire(key, RATE_LIMIT_TTL_S);
    return count <= RATE_LIMIT_MAX_REQUESTS ? 'allowed' : 'exceeded';
  } catch (error) {
    // C9 — KV indisponível: fail-OPEN (processar) MAS NUNCA silencioso.
    console.error('[telegram-webhook] rate-limit KV indisponível (fail-open)', error);
    return 'kv_error';
  }
}

/**
 * Detecção de tipo (AC4) — mutuamente exclusiva por prioridade
 * `text > voice > photo > unknown`. `message` ausente, ou presente sem nenhum
 * destes (sticker/location/edited_message/...) → `'unknown'`.
 */
function detectUpdateType(update: TelegramUpdate): UpdateType {
  const message = update.message;
  if (!message) return 'unknown';
  if (typeof message.text === 'string' && message.text.length > 0) return 'text';
  if (message.voice) return 'voice';
  if (Array.isArray(message.photo) && message.photo.length > 0) return 'photo';
  return 'unknown';
}

export async function POST(req: Request): Promise<Response> {
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  // C2 (CRÍTICA) — fail-closed: sem segredo configurado, recusar SEMPRE, ANTES de
  // ler/comparar headers. Nunca aceitar sem segredo (anti-padrão M4 da 4.9).
  if (!configuredSecret) {
    return forbidden();
  }

  // C4 — verificação de origem: header presente e igual ao segredo (`!==` directo).
  const providedSecret = req.headers.get(SECRET_HEADER);
  if (providedSecret !== configuredSecret) {
    return forbidden();
  }

  // ── A partir daqui: origem AUTENTICADA. Handler completo da 6.12. ──

  // (2) Parse + validação Zod (AC1/C2). `safeParse` com `.passthrough()` (raiz e
  // sub-objectos) tolera campos extra do Telegram (`entities`/`forward_*`/...).
  // Body não-JSON OU schema-fail → 400 (nunca 200 nem 500 não-capturado — eixo c).
  let update: TelegramUpdate;
  try {
    const raw = await req.json();
    const parsed = TelegramUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response('bad request', { status: 400 });
    }
    update = parsed.data;
  } catch {
    return new Response('bad request', { status: 400 });
  }

  // (3) Filtro `chatId` (AC2/C7 — [D-6.12-CHATID-REJECT]/[D-6.12-MISSING-CHATID-ENV]).
  // Três sub-casos de `unauthorized` resolvem TODOS em 200 silencioso `{ok:true}`
  // sem processar: (a) env `TELEGRAM_CHAT_ID` ausente/falsy → ninguém autorizado;
  // (b) `message`/`chat`/`id` ausente; (c) `chat.id` ≠ env. O 403 é reservado, por
  // contrato (6.11), exclusivamente à guarda `secret_token`; responder 200 evita
  // re-entrega em loop do Telegram e não revela política de autorização.
  const authorizedChatId = process.env.TELEGRAM_CHAT_ID;
  if (!authorizedChatId) {
    return jsonOk({ ok: true });
  }
  // [D-6.12-CHATID-TYPE] — `chat.id` é number no JSON; env é string → comparar com
  // coerção `String(...)`. `?.` cobre `message`/`chat` ausentes (sub-caso b).
  const incomingChatId = update.message?.chat?.id;
  if (incomingChatId === undefined || String(incomingChatId) !== authorizedChatId) {
    return jsonOk({ ok: true });
  }

  // (4) Rate-limit KV (AC3/C5/C9) — APÓS o filtro chatId (C6: não gastar KV writes
  // em não-autorizados). `count > 60` → 429; KV down → fail-OPEN + log (processa).
  const rateLimit = await checkRateLimit(authorizedChatId);
  if (rateLimit === 'exceeded') {
    return new Response('rate limit exceeded', { status: 429 });
  }
  // `'allowed'` e `'kv_error'` (fail-open) seguem para o dispatch.

  // (5) Detecção de tipo + dispatch (AC4/AC5 — [D-6.12-FAN-OUT-SCOPE]).
  // Story 6.13 (FR71): para `text`, lançar o cérebro via bridge Node
  // fire-and-forget e responder `routed:true`. voz/foto/unknown continuam stub
  // `routed:false` (open-closed — 6.14/6.15). O texto da mensagem está garantido
  // não-vazio quando `type==='text'` (`detectUpdateType` exige `text.length > 0`).
  const type = detectUpdateType(update);
  if (type === 'text') {
    dispatchTextToBridge(req, update.message!.text!, authorizedChatId, configuredSecret);
    return jsonOk({ ok: true, routed: true, type: 'text' });
  }
  return jsonOk({ ok: true, routed: false, type });
}

/**
 * Lança o `fetch` ao bridge Node `/api/telegram/process-text` em fire-and-forget
 * ([D-6.13-TIMEOUT]=(c), C5) — o cérebro demora 10-30s, incompatível com o orçamento
 * Edge <5s. O `fetch` é INICIADO (a conexão parte) mas NÃO aguardado: o ACK ao
 * Telegram é imediato. Um `.catch` no-op evita um unhandled rejection se a conexão
 * falhar (o bridge é quem entrega a mensagem de erro PT-PT ao utilizador — AC5).
 *
 * O bridge é same-origin (mesma deployment) — a base vem de `new URL(req.url).origin`
 * (padrão de `setup/route.ts`; `req.nextUrl` não está garantido num `Request` cru). A
 * chamada leva o shared-secret header (C11): o bridge é cookieless e valida-o
 * fail-closed contra `TELEGRAM_WEBHOOK_SECRET` (o mesmo segredo já aqui validado).
 */
function dispatchTextToBridge(
  req: Request,
  text: string,
  chatId: string,
  sharedSecret: string,
): void {
  const bridgeUrl = `${new URL(req.url).origin}${PROCESS_TEXT_PATH}`;
  void fetch(bridgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [BRIDGE_SECRET_HEADER]: sharedSecret,
    },
    body: JSON.stringify({ text, chatId }),
  }).catch((error) => {
    // Fire-and-forget: nunca propagar (o ACK ao Telegram já foi/será dado). NUNCA
    // silencioso (anti-M4 da 4.9) — log para observability.
    console.error('[telegram-webhook] falha ao despachar texto ao bridge', error);
  });
}
