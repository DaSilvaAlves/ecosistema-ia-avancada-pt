import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getValidAccessToken,
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';
import {
  syncCalendarEvents,
  CalendarAuthError,
  CalendarSyncError,
} from '@/lib/google/calendar';
import {
  getCalendarSyncToken,
  setCalendarSyncToken,
  deleteCalendarSyncToken,
} from '@/lib/google/calendar-sync-token';

/**
 * Nexus v2 — Sync pull do Google Calendar (Story 6.3, T4, AC6 — FR59 PULL)
 *
 * Rota `POST /api/google/calendar/sync` — Node runtime (ADR-1: `googleapis`/
 * `@vercel/kv`/fetch são Node-only). Route FINA: zero lógica de reconciliação
 * (tudo no helper `lib/google/calendar.ts`). Apenas coordena:
 *   1. `getSession()` → 401 sem sessão (AC6).
 *   2. `getValidAccessToken()` (único ponto de entrada de access token — nunca
 *      `getTokens().accessToken` directo):
 *        - `null`  → 401 `{ error: 'not_connected' }` (utilizador não ligou);
 *        - `TokenRevokedError` → 401 `{ error: 'token_revoked' }`;
 *        - `TokenRefreshError` → 503 (Google indisponível no refresh).
 *   3. Lê o cursor KV ([D-6.3-SYNC-TOKEN]) e invoca o helper.
 *   4. Persiste o cursor ATÓMICA e SÓ NO FIM (nunca por página). 410 Gone → apaga
 *      a chave do cursor e regrava o novo (full resync automático do helper).
 *
 * Caminhos de falha (eixo c, `internal-state-contract-gate.md`):
 *   - `CalendarAuthError` (401 do Google) → 401 `{ error: 'token_revoked' }`
 *     (o access token foi rejeitado pela Calendar API).
 *   - `CalendarSyncError` (5xx Google / rede) → 503, SEM persistir cursor parcial
 *     (anti-padrão M4 da 4.9: NUNCA `200 { ok: false }`). O próximo sync retoma do
 *     syncToken anterior (não foi tocado).
 *
 * Relação 6.5 (cron): este endpoint é o que o Vercel Cron vai disparar.
 *
 * Trace: AC5/AC6/AC8; arch §4.1 (Node runtime); [D-6.3-SYNC-TOKEN]; merge-authority
 * (CR --base main deferido ao @devops).
 */

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  // (AC6) Auth — só o Eurico autenticado dispara o sync.
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  // (AC6) Único ponto de entrada de access token (nunca getTokens().accessToken).
  let accessToken: string | null;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    if (err instanceof TokenRevokedError) {
      // RefreshToken revogado externamente — re-auth necessária.
      return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
    }
    if (err instanceof TokenRefreshError) {
      // Google indisponível no refresh — transitório (não persistir nada).
      return NextResponse.json({ error: 'refresh_failed' }, { status: 503 });
    }
    throw err;
  }

  if (accessToken === null) {
    // Sem tokens em KV — o utilizador nunca ligou o Google Calendar.
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  // (AC2) Cursor do sync anterior ([D-6.3-SYNC-TOKEN], chave KV dedicada).
  const currentSyncToken = await getCalendarSyncToken();

  // (AC1/AC3/AC4/AC5) Invoca o helper puro. 410 Gone é tratado lá dentro
  // (full resync automático) → devolve `fullResync: true`.
  let result;
  try {
    result = await syncCalendarEvents(accessToken, currentSyncToken);
  } catch (err) {
    if (err instanceof CalendarAuthError) {
      // Access token rejeitado pela Calendar API (401) — re-auth.
      return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
    }
    if (err instanceof CalendarSyncError) {
      // 5xx Google / rede a meio do sync → 503, SEM persistir cursor parcial
      // (anti-padrão M4 da 4.9: nunca 200 { ok: false }). O cursor anterior
      // permanece intacto — o próximo sync retoma de lá.
      return NextResponse.json({ error: 'calendar_unavailable' }, { status: 503 });
    }
    throw err;
  }

  // (AC2/AC5) Persistência ATÓMICA e SÓ NO FIM do sync bem-sucedido. Se foi full
  // resync (incluindo degradação de 410), apaga primeiro o cursor antigo, depois
  // grava o novo. Se o Google não devolveu nextSyncToken (não deve ocorrer numa
  // última página), apaga o cursor para forçar full resync no próximo sync.
  if (result.fullResync) {
    await deleteCalendarSyncToken();
  }
  if (result.nextSyncToken) {
    await setCalendarSyncToken(result.nextSyncToken);
  } else {
    await deleteCalendarSyncToken();
  }

  return NextResponse.json({
    ok: true,
    eventsProcessed: result.upserted + result.deleted,
    upserted: result.upserted,
    deleted: result.deleted,
    fullResync: result.fullResync,
  });
}
