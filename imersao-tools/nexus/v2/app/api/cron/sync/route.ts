import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/shared/env';
import { secretsMatch, extractBearer } from '@/lib/push/cron-auth';
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
import {
  pushCalendarEvent,
  CalendarPushAuthError,
  CalendarPushError,
  CalendarPushNotFoundError,
  CalendarPushRateLimitError,
} from '@/lib/google/calendar-push';
import { db } from '@/lib/db/client';

/**
 * Nexus v2 — Cron diário de sync delta do Google Calendar (Story 6.5 — FR59/FR65)
 *
 * Rota `POST /api/cron/sync` — orquestrador periódico do sync 2-way de calendário.
 * Disparada por scheduler externo (cron-job.org, server-to-server, 1×/dia
 * `0 6 * * *`), NÃO por Vercel Cron nativo — a app é agnóstica à origem do trigger
 * (padrão da Story 4.8). Protegida por `CRON_SECRET` Bearer timing-safe (sem
 * cookie de sessão). `vercel.json` NÃO declara `crons` ([D-6.5-CRON-CONFIG]).
 *
 * Node runtime ([D-6.5-RUNTIME]): importa `getValidAccessToken`/`syncCalendarEvents`/
 * `pushCalendarEvent` + cursor KV (`@vercel/kv`) + Dexie — todos Node-only (ADR-1),
 * coerente com as routes pull (`sync/route.ts`) e push (`push/route.ts`).
 *
 * Desenho ([D-6.5-ORCHESTRATION]) — import de helpers de domínio, NÃO fetch HTTP:
 * as routes 6.3/6.4 exigem cookie de sessão (`getSession`) e o middleware bloqueia
 * qualquer pedido server-to-server sem `nexus_session`. Um cron NÃO tem cookie e
 * forjar uma sessão seria um anti-padrão de segurança. Por isso o cron importa os
 * MESMOS helpers de domínio que essas routes usam e replica a coordenação fina
 * (ler cursor → sync → persistir cursor; filtrar `!googleId` → push → persistir
 * `googleId`), com a sua própria auth (`CRON_SECRET`, não sessão de browser). O
 * cálculo de diff/mapeamento continua 100% dentro de `syncCalendarEvents`/
 * `pushCalendarEvent` — o cron só coordena. Zero round-trip HTTP interno → zero
 * superfície SSRF (lição 5.11).
 *
 * Sequência SERIAL pull→push ([D-6.5-ORCHESTRATION]): trazer eventos novos do
 * Google antes de empurrar locais reduz a janela de conflito e elimina a corrida
 * pull→push intra-execução. A cadência diária elimina o overlap entre execuções.
 *
 * Falha parcial ([D-6.5-PARTIAL-FAILURE]): responde SEMPRE 200 (nunca 5xx — um 5xx
 * faria o scheduler re-agendar com backoff não controlado contra um Google já em
 * falha). Curto-circuito: se o pull falha por classe-token (`token_revoked`/
 * `not_connected`), o push é `skipped` (usaria o mesmo token revogado). Se o pull
 * falha por causa transitória (`calendar_unavailable`/`refresh_failed`), o push
 * corre na mesma (pode haver locais-pendente a empurrar com token ainda válido).
 *
 * Gmail ([D-6.5-GMAIL-TRIGGER]): calendário-only nesta story. O campo `gmail: null`
 * documenta a extensibilidade — a Story 6.8 adiciona a chamada de classificação.
 *
 * Trace: AC1-AC6; EPIC-6.md §5 row 6.5; [D-6.5-*]; Architect Gate de Entrada
 * (Aria, 18/06/2026); padrão Story 4.8 (`dispatch/route.ts` + `cron-auth.ts`).
 */

export const runtime = 'nodejs';

/** Erros de classe-token do pull que curto-circuitam o push (mesmo token revogado). */
const TOKEN_CLASS_ERRORS = new Set(['token_revoked', 'not_connected']);

type PullOutcome =
  | { upserted: number; deleted: number; skipped: number; fullResync: boolean }
  | { error: string };

type PushOutcome =
  | { pushed: number; updated: number; failed: number }
  | { error: string }
  | { skipped: true };

/** Forma da resposta do cron — extensível para Gmail (6.8) via campo `gmail`. */
type CronSyncResponse = {
  ok: boolean;
  calendar: {
    pull: PullOutcome;
    push: PushOutcome;
  };
  gmail?: null;
};

/**
 * Executa o pull (Google → Nexus), replicando a coordenação de `sync/route.ts`
 * sem `getSession` (a auth do cron é o `CRON_SECRET`). Obtém o seu próprio access
 * token, lê o cursor KV, invoca o helper e persiste o cursor ATÓMICA e SÓ NO FIM.
 * Nunca lança — converte cada classe de erro num `{ error }` para o orquestrador.
 */
async function runPull(): Promise<PullOutcome> {
  let accessToken: string | null;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    if (err instanceof TokenRevokedError) return { error: 'token_revoked' };
    if (err instanceof TokenRefreshError) return { error: 'refresh_failed' };
    throw err;
  }
  if (accessToken === null) return { error: 'not_connected' };

  const currentSyncToken = await getCalendarSyncToken();

  let result;
  try {
    result = await syncCalendarEvents(accessToken, currentSyncToken);
  } catch (err) {
    if (err instanceof CalendarAuthError) return { error: 'token_revoked' };
    if (err instanceof CalendarSyncError) return { error: 'calendar_unavailable' };
    throw err;
  }

  // Persistência ATÓMICA e SÓ NO FIM (espelha sync/route.ts:104-111). Full resync
  // (incluindo degradação de 410) apaga o cursor antigo antes de gravar o novo.
  if (result.fullResync) {
    await deleteCalendarSyncToken();
  }
  if (result.nextSyncToken) {
    await setCalendarSyncToken(result.nextSyncToken);
  } else {
    await deleteCalendarSyncToken();
  }

  return {
    upserted: result.upserted,
    deleted: result.deleted,
    skipped: result.skipped,
    fullResync: result.fullResync,
  };
}

/**
 * Executa o push (Nexus → Google), replicando a coordenação de `push/route.ts` sem
 * `getSession`. Obtém o seu próprio access token, lê os locais-pendente
 * (`!googleId`), empurra cada um e persiste o `googleId` na MESMA cadeia `await`
 * após o insert 2xx. Nunca lança — converte erros de lote em `{ error }`.
 */
async function runPush(): Promise<PushOutcome> {
  let accessToken: string | null;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    if (err instanceof TokenRevokedError) return { error: 'token_revoked' };
    if (err instanceof TokenRefreshError) return { error: 'refresh_failed' };
    throw err;
  }
  if (accessToken === null) return { error: 'not_connected' };

  const pendentes = await db.calendarEvents.filter((e) => !e.googleId).toArray();
  if (pendentes.length === 0) {
    return { pushed: 0, updated: 0, failed: 0 };
  }

  let pushed = 0;
  let updated = 0;
  let failed = 0;

  for (const event of pendentes) {
    try {
      const result = await pushCalendarEvent(accessToken, event);
      // Persistência do googleId na MESMA cadeia `await` após o insert 2xx
      // (espelha push/route.ts:116-119 — janela mínima de crash).
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
      // 404 (evento apagado no Google) → conta como `failed`, não aborta o lote.
      if (err instanceof CalendarPushNotFoundError) {
        failed++;
        continue;
      }
      // Erros transitórios abortam o lote, mas NUNCA propagam 5xx para o scheduler:
      // devolvem `{ error }` que o orquestrador encapsula num 200 parcial.
      if (err instanceof CalendarPushRateLimitError) return { error: 'rate_limited' };
      if (err instanceof CalendarPushAuthError) return { error: 'token_revoked' };
      if (err instanceof CalendarPushError) return { error: 'calendar_push_unavailable' };
      throw err;
    }
  }

  return { pushed, updated, failed };
}

/** `true` se o resultado de uma fase é um erro de classe (não contadores). */
function hasError(outcome: PullOutcome | PushOutcome): outcome is { error: string } {
  return 'error' in outcome;
}

export async function POST(req: Request): Promise<Response> {
  // (AC2 i) Auth do cron — `CRON_SECRET` Bearer timing-safe, fail-closed sem secret
  // (padrão dispatch/route.ts:73-86). Lê via getServerEnv (não process.env directo).
  // `getServerEnv()` pode LANÇAR na validação Zod do env em produção (env inválido);
  // o try/catch garante que tanto config ausente (`!cronSecret`) como config inválida
  // (throw) terminam IDENTICAMENTE no mesmo 503 fail-closed, fora do try principal.
  let cronSecret: string | undefined;
  try {
    cronSecret = getServerEnv().CRON_SECRET;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[cron/sync] configuração de ambiente inválida:', message);
    return NextResponse.json(
      { error: 'Serviço de sync indisponível.' },
      { status: 503 },
    );
  }
  if (!cronSecret) {
    console.error('[cron/sync] CRON_SECRET ausente na configuração');
    return NextResponse.json(
      { error: 'Serviço de sync indisponível.' },
      { status: 503 },
    );
  }

  const provided = extractBearer(req.headers.get('authorization'));
  if (provided === null || !secretsMatch(provided, cronSecret)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    // (AC3) Sequência SERIAL pull→push ([D-6.5-ORCHESTRATION]).
    const pull = await runPull();

    // (AC4) Curto-circuito por classe-token: se o pull falhou porque o token está
    // revogado/não-ligado, o push usaria o mesmo token → marca-se `skipped`.
    let push: PushOutcome;
    if (hasError(pull) && TOKEN_CLASS_ERRORS.has(pull.error)) {
      push = { skipped: true };
    } else {
      // Sucesso, ou falha transitória do pull (`calendar_unavailable`/
      // `refresh_failed`): o push corre na mesma (pode haver locais a empurrar).
      push = await runPush();
    }

    // `ok` é `true` apenas se ambas as fases terminaram sem erro de classe. Os
    // `failed` por-evento do push NÃO derrubam `ok` (são re-tentados no próximo cron).
    const ok = !hasError(pull) && !hasError(push) && !('skipped' in push);

    const body: CronSyncResponse = {
      ok,
      calendar: { pull, push },
      gmail: null, // extensível — a Story 6.8 preenche ([D-6.5-GMAIL-TRIGGER]).
    };

    // (AC4) SEMPRE 200, mesmo em falha parcial — nunca 5xx (evita re-agendamento
    // descontrolado do scheduler contra um Google já em falha).
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    // Erro inesperado (não-mapeado pelos helpers). Mantém o contrato 200-sempre com
    // detalhe de erro em ambas as fases — o scheduler não deve re-agendar em rajada.
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[cron/sync] falha inesperada no sync:', message);
    const body: CronSyncResponse = {
      ok: false,
      calendar: {
        pull: { error: 'internal_error' },
        push: { error: 'internal_error' },
      },
      gmail: null,
    };
    return NextResponse.json(body, { status: 200 });
  }
}
