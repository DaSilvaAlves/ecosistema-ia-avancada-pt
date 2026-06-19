import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getValidAccessToken,
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';

/**
 * Nexus v2 — Arquivar email Gmail (Story 6.10, AC4 — FR68)
 *
 * Rota `POST /api/google/gmail/archive` — Node runtime (ADR-1: `getValidAccessToken`
 * + fetch server-side à Gmail API são Node-only). Arquiva um email removendo o
 * label `INBOX` via `users.messages.modify` ([D-6.10-ARCHIVE-API]: "arquivar" =
 * remover de INBOX, NÃO mover para Trash — equivale ao botão "Archive" da UI Gmail).
 *
 * Porquê uma route server-side (e não chamada directa na tool): o executor de
 * tools corre CLIENT-SIDE no fluxo de produção (ADR-9). A tool `arquivar_email`
 * faz `ctx.fetch('/api/google/gmail/archive')` (cookie de sessão same-origin
 * automático no browser); o trabalho Node-only (token + Gmail API) vive AQUI.
 * Espelha o padrão de `inbox/route.ts` da 6.9.
 *
 * Idempotência (eixo b da análise de ciclo de vida): `messages.modify
 * removeLabelIds:['INBOX']` sobre um email que já não tem `INBOX` é no-op
 * server-side (200 sem erro) — re-arquivar é seguro. 404 (email eliminado /
 * Trash esvaziado) → 404 `not_found` → a tool lança `GmailMessageNotFoundError`.
 *
 * Distinção de estados (C3, anti-M4): `getSession` inválida / `getValidAccessToken`
 * null → 401 `not_connected`; `TokenRevokedError` / Gmail 401 → 401 `token_revoked`;
 * `TokenRefreshError` → 503 `refresh_failed`; Gmail 404 → 404 `not_found`; Gmail
 * 429/5xx / rede → 503 `gmail_unavailable`. NUNCA `200 { ok: false }`.
 *
 * Trace: AC4; EPIC-6.md §5 row 6.10; [D-6.10-ARCHIVE-API]; [D-6.10-RUNTIME];
 * arch §4.1. Open-closed: NÃO importa funções privadas de `lib/google/gmail.ts` (C2).
 */

export const runtime = 'nodejs';

/** Endpoint real de `users.messages` da Gmail API v1 (modify = `/:id/modify`). */
const GMAIL_MESSAGES_ENDPOINT =
  'https://www.googleapis.com/gmail/v1/users/me/messages';

/** Corpo de pedido validado (a tool já valida com Zod; a route revalida o mínimo). */
interface ArchiveRequestBody {
  msgId?: unknown;
}

/** Resposta real de `users.messages.modify` (`labelIds` SEM INBOX após arquivar). */
interface GmailMessageModifyResponse {
  id: string;
  labelIds?: string[];
}

/** Resposta de sucesso da route (200). */
export interface ArchivedResponse {
  msgId: string;
  archived: true;
}

export async function POST(req: Request): Promise<Response> {
  // (i) Sessão de browser (cookie-gated — sem CRON_SECRET, espelha inbox 6.9).
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  // (ii) Validação mínima do corpo (a tool já valida com Zod; defesa em profundidade).
  let payload: ArchiveRequestBody;
  try {
    payload = (await req.json()) as ArchiveRequestBody;
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { msgId } = payload;
  if (typeof msgId !== 'string' || msgId.length === 0) {
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
    // (iv) `messages.modify` removendo o label INBOX ([D-6.10-ARCHIVE-API]).
    const url = `${GMAIL_MESSAGES_ENDPOINT}/${encodeURIComponent(msgId)}/modify`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ removeLabelIds: ['INBOX'] }),
    });

    if (res.status === 401) {
      return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
    }
    if (res.status === 404) {
      // Email já não existe (Trash esvaziado / eliminado) — 404 distinto (eixo b).
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: 'gmail_unavailable' }, { status: 503 });
    }

    // Consome o corpo (shape real `{ id, labelIds }`) mas a route só confirma o
    // sucesso — o estado de labels não é devolvido à tool (contrato { msgId, archived }).
    (await res.json()) as GmailMessageModifyResponse;
    const responseBody: ArchivedResponse = { msgId, archived: true };
    return NextResponse.json(responseBody);
  } catch {
    // Gmail 429/5xx / rede → 503 (nunca 200 { ok: false }, anti-M4).
    return NextResponse.json({ error: 'gmail_unavailable' }, { status: 503 });
  }
}
