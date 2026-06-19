import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getValidAccessToken,
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';

/**
 * Nexus v2 — Criação de draft Gmail (Story 6.10, AC3 — FR67 + FR68)
 *
 * Rota `POST /api/google/gmail/draft` — Node runtime (ADR-1: `getValidAccessToken`
 * + fetch server-side à Gmail API são Node-only). Cria um rascunho (draft) no
 * Gmail do utilizador via `users.drafts.create`.
 *
 * Porquê uma route server-side (e não chamada directa na tool): o executor de
 * tools corre CLIENT-SIDE no fluxo de produção (ADR-9, `executor.ts:511-527`
 * noKvStub lança; `getValidAccessToken` é Node-only). A tool `criar_draft_gmail`
 * faz `ctx.fetch('/api/google/gmail/draft')` (cookie de sessão same-origin
 * automático no browser); o trabalho Node-only (token + Gmail API) vive AQUI.
 * Espelha o padrão de `inbox/route.ts` da 6.9 (auth `getSession`, `getValidAccessToken`,
 * runtime nodejs, erros 401/404/503 nunca `200 { ok: false }` — anti-M4 da 4.9).
 *
 * [D-6.10-DRAFT-MIME] (ratificada Architect Gate de Entrada, Aria 19/06/2026):
 *   - body Gmail = `{ message: { raw: base64url(MIME) } }`;
 *   - MIME = `To`/`Subject`/`MIME-Version`/`Content-Type: text/plain; charset=utf-8`
 *     + linha vazia + body;
 *   - `base64url` = base64 com `+`→`-`, `/`→`_`, sem `=` de padding (RFC 4648 §5);
 *   - **Subject com acentos PT-PT EXIGE RFC 2047 encoded-word** (`=?utf-8?B?<base64>?=`)
 *     — um `Subject: Reunião` cru no header MIME é inválido/corrompe (C4);
 *   - `replyToMsgId` DEFERIDO (REC-6.10-THREADING) — fora do `argsSchema`.
 *
 * Distinção de estados (C3, anti-M4): `getSession` inválida / `getValidAccessToken`
 * null → 401 `not_connected`; `TokenRevokedError` / Gmail 401 → 401 `token_revoked`;
 * `TokenRefreshError` → 503 `refresh_failed`; Gmail 400 (`to` que o Google rejeita
 * após passar o Zod local) → 400 `invalid_request`; Gmail 429/5xx / rede → 503
 * `gmail_unavailable`. NUNCA `200 { ok: false }`.
 *
 * Trace: AC3; EPIC-6.md §5 row 6.10; [D-6.10-DRAFT-MIME]; [D-6.10-RUNTIME];
 * arch §4.1 (Node runtime). Open-closed: NÃO importa funções privadas de
 * `lib/google/gmail.ts` (C2).
 */

export const runtime = 'nodejs';

/** Endpoint real de `users.drafts.create` da Gmail API v1. */
const GMAIL_DRAFTS_ENDPOINT =
  'https://www.googleapis.com/gmail/v1/users/me/drafts';

/** Corpo de pedido validado (a tool já valida com Zod; a route revalida o mínimo). */
interface DraftRequestBody {
  to?: unknown;
  subject?: unknown;
  body?: unknown;
}

/** Resposta real de `users.drafts.create` (`id` do topo é o `draftId`). */
interface GmailDraftCreateResponse {
  id: string;
  message?: { id: string; threadId: string };
}

/** Resposta de sucesso da route (200). */
export interface DraftCreatedResponse {
  draftId: string;
  subject: string;
  to: string;
}

/**
 * Codifica um header MIME em RFC 2047 encoded-word (`=?utf-8?B?<base64>?=`) SE
 * contiver caracteres não-ASCII (acentos PT-PT). ASCII puro passa inalterado
 * (evita encoding desnecessário). C4 — falsificável: `"Reunião sexta"` →
 * `=?utf-8?B?...?=`, nunca `Reunião` cru no header.
 */
function encodeHeaderRfc2047(value: string): string {
  // ASCII puro = todos os code points < 128 (sem regex de control chars).
  const isAscii = [...value].every((ch) => ch.charCodeAt(0) < 128);
  if (isAscii) return value;
  const base64 = Buffer.from(value, 'utf-8').toString('base64');
  return `=?utf-8?B?${base64}?=`;
}

/** base64url (RFC 4648 §5): base64 com `+`→`-`, `/`→`_`, sem `=` de padding. */
function toBase64Url(input: string): string {
  return Buffer.from(input, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Constrói a mensagem MIME (texto plano UTF-8). O `Subject` é codificado em RFC
 * 2047 quando tem não-ASCII (C4). O `body` permanece UTF-8 (o `Content-Type`
 * declara `charset=utf-8`).
 */
function buildMimeMessage(to: string, subject: string, body: string): string {
  return [
    `To: ${to}`,
    `Subject: ${encodeHeaderRfc2047(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n');
}

export async function POST(req: Request): Promise<Response> {
  // (i) Sessão de browser (cookie-gated — sem CRON_SECRET, espelha inbox 6.9).
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  // (ii) Validação mínima do corpo (a tool já valida com Zod; defesa em profundidade).
  let payload: DraftRequestBody;
  try {
    payload = (await req.json()) as DraftRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { to, subject, body } = payload;
  if (
    typeof to !== 'string' ||
    to.length === 0 ||
    typeof subject !== 'string' ||
    subject.length === 0 ||
    typeof body !== 'string' ||
    body.length === 0
  ) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // (iii) Único ponto de entrada de access token (nunca getTokens().accessToken).
  let accessToken: string | null;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    if (err instanceof TokenRevokedError) {
      return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
    }
    if (err instanceof TokenRefreshError) {
      return NextResponse.json({ error: 'refresh_failed' }, { status: 503 });
    }
    throw err;
  }
  if (accessToken === null) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  try {
    // (iv) Constrói o MIME e codifica em base64url ([D-6.10-DRAFT-MIME]).
    const raw = toBase64Url(buildMimeMessage(to, subject, body));

    const res = await fetch(GMAIL_DRAFTS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: { raw } }),
    });

    if (res.status === 401) {
      return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
    }
    if (res.status === 400) {
      // O Google rejeitou o pedido (ex.: `to` que passou o Zod mas é inválido
      // para a Gmail) — propaga 400 descritivo, nunca sucesso silencioso (C3).
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'gmail_unavailable' }, { status: 503 });
    }

    const data = (await res.json()) as GmailDraftCreateResponse;
    const responseBody: DraftCreatedResponse = {
      draftId: data.id,
      subject,
      to,
    };
    return NextResponse.json(responseBody);
  } catch {
    // Gmail 429/5xx / rede → 503 (nunca 200 { ok: false }, anti-M4).
    return NextResponse.json({ error: 'gmail_unavailable' }, { status: 503 });
  }
}
