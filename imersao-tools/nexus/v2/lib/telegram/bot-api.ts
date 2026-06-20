import { z } from 'zod';

/**
 * Nexus v2 — Helper puro da Telegram Bot API por `fetch` nativo
 * (Story 6.11 — FR69)
 *
 * Todas as chamadas à Telegram Bot API (`getMe`, `setWebhook`, ...) são feitas
 * por `fetch` nativo para `https://api.telegram.org/bot<token>/<method>`. SEM
 * SDK Node (`node-telegram-bot-api`/`grammY`/`telegraf`) — [DECISÃO-RATIFICADA-1].
 *
 * Edge-safe (C1, ADR-1): zero imports de `node:*`, `googleapis` ou qualquer SDK;
 * apenas `fetch` nativo + `zod`. Pode por isso ser importado pelo webhook Edge
 * (`app/api/telegram/webhook/route.ts`) sem violar a Edge-safety — embora na 6.11
 * o webhook seja stub e não chame a Bot API; o helper serve o setup Node (6.11)
 * e as stories 6.12+.
 *
 * Decisões @architect ratificadas (Architect Gate de Entrada, Aria 20/06/2026 —
 * condições C1/C3/C5/C7, vinculativas):
 *   [DECISÃO-RATIFICADA-1] `fetch` directo, sem SDK Telegram. Elimina as 2 criticals
 *                   da cadeia `request`/`form-data` (via `node-telegram-bot-api`).
 *   [D-6.11-GET-ME] (C3) O setup chama `getMe` PRIMEIRO; `{ok:false}` (token inválido,
 *                   `description:"Unauthorized"`) → lança `BotApiError`, KV NÃO escrito.
 *   [mock-protocol-fidelity] (C5) O shape do wire reflecte o protocolo REAL da Bot API:
 *                   sucesso `{ok:true, result:...}`; erro `{ok:false, error_code, description}`.
 *
 * Caminhos de falha (eixo c, `internal-state-contract-gate.md`):
 *   - `TELEGRAM_BOT_TOKEN` ausente em env → `BotApiTokenMissingError` ANTES de qualquer
 *     `fetch` (nunca construir uma URL com `botundefined`).
 *   - Bot API `{ok:false}` → `BotApiError(method, description)`.
 *   - Erro de rede do `fetch` → propagado (o setup aborta; KV NÃO escrito).
 *
 * Trace: AC1/AC2/AC3/AC7; EPIC-6.md §5 row 6.11; [DECISÃO-RATIFICADA-1]/[D-6.11-GET-ME];
 * padrão `lib/google/gmail.ts` (helper puro, MSW-testável).
 */

/** Base da Telegram Bot API. O `<token>` é interpolado por `botApiBaseUrl()`. */
const TELEGRAM_API_ROOT = 'https://api.telegram.org';

// ---------------------------------------------------------------------------
// Erros (classes nomeadas — instanceof estável no caller)
// ---------------------------------------------------------------------------

/**
 * `TELEGRAM_BOT_TOKEN` ausente/vazio em env. Lançado ANTES de qualquer `fetch`
 * (eixo a/c) para nunca construir uma URL `bot undefined`.
 */
export class BotApiTokenMissingError extends Error {
  constructor(
    message = 'TELEGRAM_BOT_TOKEN ausente — configura o token do BotFather em Vercel env.',
  ) {
    super(message);
    this.name = 'BotApiTokenMissingError';
  }
}

/**
 * A Bot API respondeu `{ok:false}` (ex: token inválido → `description:"Unauthorized"`,
 * ou parâmetro inválido). Carrega o método e a `description` real da Bot API.
 */
export class BotApiError extends Error {
  readonly method: string;
  readonly description: string;
  readonly errorCode?: number;

  constructor(method: string, description: string, errorCode?: number) {
    super(`Telegram Bot API '${method}' falhou: ${description}`);
    this.name = 'BotApiError';
    this.method = method;
    this.description = description;
    this.errorCode = errorCode;
  }
}

// ---------------------------------------------------------------------------
// Shape do wire Bot API (fidelidade de protocolo — mock-protocol-fidelity.md)
// ---------------------------------------------------------------------------

/**
 * Envelope real de QUALQUER resposta da Bot API:
 *   - sucesso → `{ ok: true, result: <T>, description?: string }`
 *   - erro    → `{ ok: false, error_code: number, description: string }`
 */
interface BotApiOkResponse<T> {
  ok: true;
  result: T;
  description?: string;
}
interface BotApiErrResponse {
  ok: false;
  error_code?: number;
  description?: string;
}
type BotApiResponse<T> = BotApiOkResponse<T> | BotApiErrResponse;

/**
 * Zod schema do `result` de `getMe` — espelha o shape REAL da Bot API (C5).
 * `id`/`is_bot`/`first_name` obrigatórios; `username` e capacidades opcionais.
 * `.passthrough()` tolera campos extra futuros da Bot API sem partir o parse.
 */
export const TelegramUserSchema = z
  .object({
    id: z.number(),
    is_bot: z.boolean(),
    first_name: z.string(),
    username: z.string().optional(),
    can_join_groups: z.boolean().optional(),
    can_read_all_group_messages: z.boolean().optional(),
    supports_inline_queries: z.boolean().optional(),
  })
  .passthrough();

/** Tipo do `result` de `getMe`. */
export type TelegramUser = z.infer<typeof TelegramUserSchema>;

// ---------------------------------------------------------------------------
// Helper genérico + métodos
// ---------------------------------------------------------------------------

/**
 * Constrói a base autenticada `https://api.telegram.org/bot<token>`. Lança
 * `BotApiTokenMissingError` se o token estiver ausente/vazio (eixo a/c).
 */
function botApiBaseUrl(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new BotApiTokenMissingError();
  return `${TELEGRAM_API_ROOT}/bot${token}`;
}

/**
 * Helper genérico: `POST https://api.telegram.org/bot<token>/<method>` com body
 * JSON. Devolve `result` se `{ok:true}`; lança `BotApiError` se `{ok:false}`.
 *
 * O `fetch` nativo é Edge-safe (C1). Um erro de rede do `fetch` é propagado
 * (não engolido) — o caller (setup) aborta e NÃO escreve KV (eixo c ponto 4).
 */
export async function callBotApi<T>(
  method: string,
  params?: Record<string, unknown>,
): Promise<T> {
  const url = `${botApiBaseUrl()}/${method}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: params ? JSON.stringify(params) : undefined,
  });

  // CR Iter 1 (F3): infra intermédia pode devolver não-JSON (ex: HTML de erro
  // 5xx do proxy/CDN). `resp.json()` lançaria um `SyntaxError` cru — convertemo-lo
  // num `BotApiError` descritivo para que TODOS os caminhos de falha sejam
  // tratados de forma uniforme (eixo c — falha nunca silenciosa nem opaca).
  let data: BotApiResponse<T>;
  try {
    data = (await resp.json()) as BotApiResponse<T>;
  } catch {
    throw new BotApiError(
      method,
      `resposta não-JSON da Bot API (HTTP ${resp.status}).`,
      resp.status,
    );
  }
  if (!data.ok) {
    throw new BotApiError(
      method,
      data.description ?? 'erro desconhecido',
      data.error_code,
    );
  }
  return data.result;
}

/**
 * `getMe` — valida o token e devolve a identidade do bot. Ponto canónico de
 * validação de token da Bot API ([D-6.11-GET-ME]/C3): se o token for inválido a
 * Bot API responde `{ok:false, error_code:401, description:"Unauthorized"}` →
 * `callBotApi` lança `BotApiError`. O `result` é validado com Zod para garantir
 * fidelidade de shape (C5 — falha se a Bot API não devolver `result`/`is_bot`).
 */
export async function getMe(): Promise<TelegramUser> {
  const result = await callBotApi<unknown>('getMe');
  return TelegramUserSchema.parse(result);
}

/**
 * `setWebhook` — regista o webhook do bot com o `secret_token` e `allowed_updates`.
 *
 * Body real da Bot API: `{ url, secret_token, allowed_updates }`. A Bot API
 * devolve `{ok:true, result:true, description}`; se `result !== true` (Telegram
 * não actualizou) lança `BotApiError` para que o setup NÃO escreva KV (C3 / eixo
 * c ponto 2). Idempotente por design (mesmo URL → `{ok:true}`; UM webhook por bot).
 *
 * `allowed_updates: ['message']` e `secret_token` são identificadores de contrato
 * externo — nomes exactos do protocolo Telegram (`external-contract-identifiers.md`).
 */
export async function setWebhook(url: string, secretToken: string): Promise<void> {
  const result = await callBotApi<boolean>('setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message'],
  });
  if (result !== true) {
    throw new BotApiError(
      'setWebhook',
      'a Bot API respondeu ok:true mas result:false — webhook não registado.',
    );
  }
}
