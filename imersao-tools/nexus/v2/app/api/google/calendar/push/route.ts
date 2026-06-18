import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getValidAccessToken,
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';
import {
  pushCalendarEvent,
  CalendarPushAuthError,
  CalendarPushError,
  CalendarPushNotFoundError,
  CalendarPushRateLimitError,
} from '@/lib/google/calendar-push';
import { db } from '@/lib/db/client';

/**
 * Nexus v2 — Sync push do Google Calendar (Story 6.4, T4, AC6 — FR59 PUSH)
 *
 * Rota `POST /api/google/calendar/push` — Node runtime (ADR-1: fetch server-side
 * contra `googleapis.com`). Route FINA: zero lógica de mapeamento (tudo no helper
 * `lib/google/calendar-push.ts`). Espelha a atomicidade-só-no-fim e o tratamento
 * de erros da route pull (`sync/route.ts`).
 *
 * Auto-suficiente e idempotente-vazia (C1-a, [D-6.4-SCOPE] insert-only):
 *   1. `getSession()` → 401 sem sessão (AC6 i).
 *   2. `getValidAccessToken()` (único ponto de entrada de access token — nunca
 *      `getTokens().accessToken` directo):
 *        - `null`  → 401 `{ error: 'not_connected' }` (utilizador não ligou);
 *        - `TokenRevokedError` → 401 `{ error: 'token_revoked' }`;
 *        - `TokenRefreshError` → 503 `{ error: 'refresh_failed' }`.
 *   3. Lê DIRECTAMENTE `db.calendarEvents.filter(e => !e.googleId)` para
 *      identificar a classe LOCAL-PENDENTE (eventos criados no Nexus sem
 *      `googleId`). A 6.6 (Draft) será o produtor; hoje a lista está vazia.
 *   4. Lista vazia → devolve imediatamente `{ ok: true, pushed: 0, updated: 0,
 *      failed: 0 }` (CAMINHO FELIZ ACTUAL — AC6 iv).
 *   5. Para cada local-pendente: `pushCalendarEvent()` (insert) + persiste o
 *      `googleId` em Dexie na MESMA cadeia `await` imediatamente após o insert 2xx
 *      (janela mínima de crash — C3). Falha de insert NÃO persiste `googleId`.
 *
 * Anti-loop estrutural (AC5, [D-6.4-LOOP]): a route actua exclusivamente em
 * eventos SEM `googleId` → nunca re-empurra eventos de origem-Google. Após insert,
 * o `googleId` persistido transita o evento para "sincronizado"; o pull (6.3)
 * subsequente reconhece-o por `where('googleId').equals(...)`. O cursor KV do pull
 * (`calendar-sync-token.ts`) NÃO é tocado por esta route (T3).
 *
 * Caminhos de falha por evento (eixo c):
 *   - 404 no update (`CalendarPushNotFoundError`) → evento contado como `failed`,
 *     SEM re-insert nem delete-local (C4). (No scope insert-only não ocorre, mas
 *     o helper pode lançá-lo — tratado defensivamente.)
 *   - 429 (`CalendarPushRateLimitError`) → 503 `rate_limited` (aborta o lote, sem
 *     estado parcial além do que já foi persistido com sucesso).
 *   - 5xx / rede (`CalendarPushError`) → 503 `calendar_push_unavailable` (NUNCA
 *     `200 { ok: false }` — anti-padrão M4 4.9).
 *   - 401 da Calendar API (`CalendarPushAuthError`) → 401 `token_revoked`.
 *
 * Relação 6.5 (cron) / 6.6 (tool): este endpoint é o que o Vercel Cron e a tool
 * `criar_evento_calendar` vão disparar.
 *
 * Trace: AC2/AC5/AC6; arch §4.1 (Node runtime); [D-6.4-*]; merge-authority
 * (CR --base main deferido ao @devops).
 */

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  // (AC6 i) Auth — só o Eurico autenticado dispara o push.
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  // (AC6 ii) Único ponto de entrada de access token (nunca getTokens().accessToken).
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

  // (AC6 iii) Lê directamente a classe LOCAL-PENDENTE (sem googleId). Route
  // auto-suficiente — não recebe eventos no body (C1-a).
  const pendentes = await db.calendarEvents.filter((e) => !e.googleId).toArray();

  // (AC6 iv) Caminho feliz actual: sem produtor de eventos locais (a 6.6 é Draft),
  // a lista está vazia → resposta idempotente-vazia.
  if (pendentes.length === 0) {
    return NextResponse.json({ ok: true, pushed: 0, updated: 0, failed: 0 });
  }

  // (AC6 v) Empurra cada local-pendente e persiste o googleId após cada insert 2xx.
  let pushed = 0;
  let updated = 0;
  let failed = 0;

  for (const event of pendentes) {
    try {
      const result = await pushCalendarEvent(accessToken, event);

      // (AC2/C3) Persistência do googleId na MESMA cadeia `await`, imediatamente
      // após o insert 2xx — janela mínima de crash. `update` idempotente por `id`
      // Nexus (não cria duplicado). O `&googleId` único esparso garante unicidade.
      await db.calendarEvents.update(event.id, {
        googleId: result.googleId,
        updatedAt: result.updatedAt,
      });

      if (result.inserted) {
        pushed++;
      } else {
        updated++;
      }
    } catch (err) {
      // 404 (update a evento apagado no Google) → contar como `failed`, SEM
      // re-insert nem delete-local (C4). Não aborta o lote.
      if (err instanceof CalendarPushNotFoundError) {
        failed++;
        continue;
      }
      // Erros transitórios abortam o lote (503/401) — sem estado parcial além do
      // que já foi persistido com sucesso. O googleId do evento corrente NÃO foi
      // persistido (o erro ocorreu antes do `update` Dexie).
      if (err instanceof CalendarPushRateLimitError) {
        return NextResponse.json({ error: 'rate_limited' }, { status: 503 });
      }
      if (err instanceof CalendarPushAuthError) {
        return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
      }
      if (err instanceof CalendarPushError) {
        return NextResponse.json({ error: 'calendar_push_unavailable' }, { status: 503 });
      }
      throw err;
    }
  }

  // (AC6 vi) Sucesso — contadores reais (N pode ser 0 se tudo falhou com 404).
  return NextResponse.json({ ok: true, pushed, updated, failed });
}
