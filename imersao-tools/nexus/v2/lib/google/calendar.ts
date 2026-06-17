import { db } from '@/lib/db/client';
import { CalendarEventSchema } from '@/lib/db/schemas';
import type { CalendarEvent } from '@/types/db';

/**
 * Nexus v2 — Helper puro de sync pull do Google Calendar (Story 6.3 — FR59 PULL)
 *
 * Direcção PULL exclusiva: Google Calendar → Nexus. A direcção push (Nexus →
 * Google) é a Story 6.4 (scope separado). Este helper NÃO escreve no Google — só
 * lê via `events.list` e reconcilia em Dexie.
 *
 * Decisões @architect ratificadas (Architect Gate de Entrada, 17/06/2026):
 *   [D-6.3-SYNC-TOKEN] O cursor `nextSyncToken` vive numa chave KV DEDICADA
 *                      (`nexus:google:calendar:syncToken`), separada de
 *                      `nexus:google:tokens`. Quem persiste o cursor é a ROUTE,
 *                      não este helper: o helper recebe o `syncToken` actual como
 *                      parâmetro e devolve o `nextSyncToken` puro. Desacopla o
 *                      helper do store de tokens e maximiza a testabilidade (~100%).
 *   [D-6.3-SCHEMA]     Tabela `calendarEvents` (version(6)), idempotência por
 *                      índice ÚNICO `&googleId`. Campos temporais em epoch ms.
 *   [D-6.3-CANCELLED]  `status: 'cancelled'` → apagar a linha Dexie por `googleId`.
 *                      Cancelado de googleId inexistente = no-op gracioso (delete
 *                      de 0 linhas = sucesso contabilizado, não erro).
 *
 * Protocolo real (`mock-protocol-fidelity.md`, confirmado contra `googleapis`
 * v3.d.ts): a Calendar API v3 JSON usa camelCase (`nextSyncToken`, `nextPageToken`,
 * `dateTime`) — distinto do snake_case do OAuth2 token endpoint.
 *
 * Caminho 410 Gone (AC5): quando o `syncToken` expira, o Google devolve HTTP 410.
 * O helper apaga o cursor (devolve `nextSyncToken` mas marca `fullResync: true`
 * para a route saber que o cursor antigo já não vale) e reinicia automaticamente
 * com full resync (sem `syncToken`, iterando `pageToken` até ao fim).
 *
 * Caminhos de falha (eixo c, `internal-state-contract-gate.md`):
 *   - 401 (token inválido) → lança `CalendarAuthError` (a route mapeia para 401).
 *   - 5xx Google → lança `CalendarSyncError` (a route mapeia para 503). NÃO
 *     persiste cursor parcial — o próximo sync retoma do syncToken anterior.
 *   - Falha a meio da paginação → propaga o erro ANTES de devolver `nextSyncToken`,
 *     logo a route não persiste cursor parcial (atomicidade só no fim).
 *
 * Node runtime (ADR-1) — `@vercel/kv`/`node:crypto`/fetch server-side.
 *
 * Trace: AC1/AC3/AC4/AC5; EPIC-6.md §5 row 6.3; [D-6.3-*].
 */

/** Endpoint real de `events.list` da Google Calendar API v3 (calendário primário). */
const CALENDAR_EVENTS_ENDPOINT =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/** Erro de autenticação na Calendar API (HTTP 401 — access token inválido/expirado). */
export class CalendarAuthError extends Error {
  constructor(message = 'Access token Google rejeitado pela Calendar API (401).') {
    super(message);
    this.name = 'CalendarAuthError';
  }
}

/** Erro transitório da Calendar API (5xx / rede). A route mapeia para 503. */
export class CalendarSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalendarSyncError';
  }
}

/** Resultado do sync — devolvido ao caller (route) para persistência do cursor + telemetria. */
export interface SyncResult {
  /** Eventos `confirmed` upserted em Dexie (novos + actualizados). */
  upserted: number;
  /** Eventos `cancelled` removidos de Dexie (inclui no-ops de googleId inexistente). */
  deleted: number;
  /** Cursor a persistir para o próximo sync. `null` se o Google não o devolveu. */
  nextSyncToken: string | null;
  /** `true` se este sync foi (ou degradou para) um full resync — a route apaga o cursor antigo antes de gravar o novo. */
  fullResync: boolean;
}

// ---------------------------------------------------------------------------
// Shape do wire (camelCase REAL da Calendar API v3 — fidelidade de protocolo)
// ---------------------------------------------------------------------------

interface GoogleEventDateTime {
  dateTime?: string; // ISO 8601 com hora (evento normal)
  date?: string; // YYYY-MM-DD (evento all-day)
}

interface GoogleEvent {
  id: string;
  status?: 'confirmed' | 'cancelled' | 'tentative';
  summary?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
  updated?: string; // ISO 8601
}

interface GoogleEventsListResponse {
  kind?: string;
  summary?: string;
  items?: GoogleEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

/** Sentinela interna: o Google devolveu 410 Gone (syncToken expirado). */
class SyncTokenExpired extends Error {}

// ---------------------------------------------------------------------------
// Mapeamento Google Event → modelo Nexus
// ---------------------------------------------------------------------------

/**
 * Converte `start`/`end` (dateTime OU date) para epoch ms + flag allDay.
 * - `dateTime` (ISO com hora) → `Date.parse`, `allDay: false`.
 * - `date` (YYYY-MM-DD, all-day) → meia-noite UTC desse dia, `allDay: true`.
 * - ausente → 0 (evento sem hora definida; defensivo, não deve ocorrer em
 *   eventos confirmed com singleEvents=true).
 */
function toEpochMs(dt: GoogleEventDateTime | undefined): { ms: number; allDay: boolean } {
  if (dt?.dateTime) {
    return { ms: Date.parse(dt.dateTime), allDay: false };
  }
  if (dt?.date) {
    // `YYYY-MM-DD` interpretado como meia-noite UTC (estável, sem fuso local).
    return { ms: Date.parse(`${dt.date}T00:00:00.000Z`), allDay: true };
  }
  return { ms: 0, allDay: false };
}

/**
 * Mapeia um `GoogleEvent` confirmado para o modelo `CalendarEvent` Nexus. O `id`
 * Nexus é determinístico-por-reconciliação: se o evento já existe (por `googleId`),
 * preserva-se o `id` Nexus existente; senão gera-se um novo UUID. Idempotência
 * (AC3): re-sync do mesmo evento actualiza, nunca duplica.
 */
function mapEvent(event: GoogleEvent, existingId: string | undefined): CalendarEvent {
  const start = toEpochMs(event.start);
  const end = toEpochMs(event.end);
  return {
    id: existingId ?? crypto.randomUUID(),
    googleId: event.id,
    title: event.summary ?? '',
    startAt: start.ms,
    // all-day: o Google usa `end.date` exclusivo; o flag vem do start (fonte de verdade).
    endAt: end.ms,
    allDay: start.allDay,
    updatedAt: event.updated ? Date.parse(event.updated) : Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Reconciliação em Dexie
// ---------------------------------------------------------------------------

/**
 * Reconcilia uma página de eventos em Dexie. Confirmed → upsert por `googleId`
 * (idempotente); cancelled → delete por `googleId` (no-op gracioso se ausente).
 * Tudo numa transacção `rw` por página para consistência.
 */
async function reconcilePage(
  items: GoogleEvent[],
): Promise<{ upserted: number; deleted: number }> {
  let upserted = 0;
  let deleted = 0;

  await db.transaction('rw', db.calendarEvents, async () => {
    for (const event of items) {
      if (!event.id) continue; // defensivo — item sem id é ignorado.

      if (event.status === 'cancelled') {
        // [D-6.3-CANCELLED]: apagar a linha por googleId. Delete de 0 linhas
        // (googleId nunca sincronizado) = no-op gracioso, contabilizado como
        // deleted (não erro).
        await db.calendarEvents.where('googleId').equals(event.id).delete();
        deleted++;
        continue;
      }

      // confirmed (ou tentative, tratado como activo) → upsert idempotente.
      const existing = await db.calendarEvents
        .where('googleId')
        .equals(event.id)
        .first();
      const mapped = mapEvent(event, existing?.id);
      CalendarEventSchema.parse(mapped);
      await db.calendarEvents.put(mapped);
      upserted++;
    }
  });

  return { upserted, deleted };
}

// ---------------------------------------------------------------------------
// Chamada à Calendar API (fetch directo — MSW intercepta nos testes)
// ---------------------------------------------------------------------------

/**
 * Faz uma chamada a `events.list`. Lança:
 *   - `SyncTokenExpired` em 410 (caller faz full resync);
 *   - `CalendarAuthError` em 401;
 *   - `CalendarSyncError` em 5xx / rede / outros não-ok.
 */
async function listEventsPage(
  accessToken: string,
  params: { syncToken?: string | null; pageToken?: string },
): Promise<GoogleEventsListResponse> {
  const url = new URL(CALENDAR_EVENTS_ENDPOINT);
  url.searchParams.set('singleEvents', 'true');
  if (params.syncToken) {
    url.searchParams.set('syncToken', params.syncToken);
  } else {
    // `orderBy=startTime` só é permitido SEM syncToken (contrato Google).
    url.searchParams.set('orderBy', 'startTime');
  }
  if (params.pageToken) {
    url.searchParams.set('pageToken', params.pageToken);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    throw new CalendarSyncError(`Falha de rede ao listar eventos: ${message}`);
  }

  if (res.status === 410) {
    throw new SyncTokenExpired();
  }
  if (res.status === 401) {
    throw new CalendarAuthError();
  }
  if (!res.ok) {
    throw new CalendarSyncError(`Calendar API recusou a listagem (HTTP ${res.status}).`);
  }

  return (await res.json()) as GoogleEventsListResponse;
}

/**
 * Itera todas as páginas de um sync (incremental ou full), reconciliando cada
 * página em Dexie. Devolve o total reconciliado + o `nextSyncToken` da última
 * página. A persistência do cursor é responsabilidade do caller (route) — só no
 * fim, atómica (nunca por página).
 */
async function runSync(
  accessToken: string,
  startSyncToken: string | null,
): Promise<{ upserted: number; deleted: number; nextSyncToken: string | null }> {
  let upserted = 0;
  let deleted = 0;
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;

  // Itera enquanto houver `nextPageToken`. A última página traz `nextSyncToken`.
  // `do/while` garante ≥1 chamada (sync incremental costuma ter 1 só página).
  do {
    const page = await listEventsPage(accessToken, {
      syncToken: startSyncToken,
      pageToken,
    });
    const result = await reconcilePage(page.items ?? []);
    upserted += result.upserted;
    deleted += result.deleted;

    pageToken = page.nextPageToken;
    if (page.nextSyncToken) {
      nextSyncToken = page.nextSyncToken;
    }
  } while (pageToken);

  return { upserted, deleted, nextSyncToken };
}

/**
 * Sincroniza os eventos do Google Calendar para Dexie (direcção PULL, AC1).
 *
 * @param accessToken Access token válido — obtido pela route via
 *   `getValidAccessToken()` (nunca aqui; AC1 iv — desacopla do store de tokens).
 * @param currentSyncToken Cursor do sync anterior (`null` na primeira vez ou
 *   após um 410). [D-6.3-SYNC-TOKEN]: a route lê/escreve este cursor no KV.
 * @returns `SyncResult` com contadores, o `nextSyncToken` a persistir e a flag
 *   `fullResync` (true se foi full resync ou se degradou de 410).
 *
 * Comportamento 410 (AC5): se uma chamada incremental devolver 410, o helper
 * reinicia automaticamente um full resync (sem `syncToken`). O resultado vem com
 * `fullResync: true` — a route apaga o cursor antigo antes de gravar o novo.
 */
export async function syncCalendarEvents(
  accessToken: string,
  currentSyncToken: string | null = null,
): Promise<SyncResult> {
  let fullResync = currentSyncToken === null;

  try {
    const result = await runSync(accessToken, currentSyncToken);
    return {
      upserted: result.upserted,
      deleted: result.deleted,
      nextSyncToken: result.nextSyncToken,
      fullResync,
    };
  } catch (err) {
    if (err instanceof SyncTokenExpired) {
      // [AC5] syncToken expirou — reinicia full resync automático (sem syncToken).
      // O cursor antigo é descartado; a route grava o novo (`fullResync: true`).
      fullResync = true;
      const result = await runSync(accessToken, null);
      return {
        upserted: result.upserted,
        deleted: result.deleted,
        nextSyncToken: result.nextSyncToken,
        fullResync,
      };
    }
    // CalendarAuthError / CalendarSyncError propagam para a route (401 / 503).
    throw err;
  }
}
