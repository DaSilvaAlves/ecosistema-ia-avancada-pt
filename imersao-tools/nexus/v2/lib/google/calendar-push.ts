import type { CalendarEvent } from '@/types/db';

/**
 * Nexus v2 — Helper puro de sync PUSH do Google Calendar (Story 6.4 — FR59 PUSH)
 *
 * Direcção PUSH exclusiva: Nexus → Google Calendar. A direcção pull (Google →
 * Nexus) é a Story 6.3 (`lib/google/calendar.ts`, scope separado). Este helper
 * NÃO lê do Google — só ESCREVE via `events.insert` (POST) / `events.update`
 * (PUT) e devolve o resultado para a route persistir em Dexie.
 *
 * Separação de responsabilidades (story §Dev Notes): este ficheiro é distinto de
 * `calendar.ts` (pull) e NÃO toca no cursor KV do pull (`calendar-sync-token.ts`).
 *
 * Decisões @architect ratificadas (Architect Gate de Entrada, 17/06/2026):
 *   [D-6.4-SYNCSTATUS] Inferência por `googleId` — SEM campo de estado novo, SEM
 *                      version bump. Ausente = local-pendente; presente =
 *                      sincronizado. O modelo `CalendarEvent.googleId` passou a
 *                      opcional (C2) para representar a classe local-pendente.
 *   [D-6.4-LOOP]       Anti-loop ESTRUTURAL: `&googleId` único esparso + routes
 *                      `/sync` e `/push` independentes + scope insert-only. Após
 *                      `insert`, o `googleId` devolvido é persistido (route, T3) →
 *                      o pull subsequente reconhece-o e não re-dispara push.
 *   [D-6.4-INSERT-OR-UPDATE] `PUT` (full replace) — não `PATCH`. Discrimina por
 *                      presença de `googleId`: ausente → `POST events.insert`;
 *                      presente → `PUT events.update`. `PATCH` deferido (débito
 *                      REC-6.4-PATCH).
 *   [D-6.4-SCOPE]      Insert-only. O helper implementa AMBOS os ramos
 *                      (insert+update) por completude e testabilidade (AC1), mas a
 *                      route só exerce o ramo insert (não há produtor de
 *                      alterações locais nesta story — a tool é da 6.6, Draft).
 *
 * Protocolo real (`mock-protocol-fidelity.md`, precedente [D-6.3-FETCH-DIRECT]):
 * a Calendar API v3 JSON usa camelCase (`id`, `etag`, `updated`, `status`,
 * `summary`, `start`, `end`) — `fetch` directo (MSW intercepta de forma fiável).
 *
 * Mapeamento Nexus → Google (AC3): `title → summary`; `startAt` (epoch ms) →
 * `start.dateTime` (ISO 8601) OU `start.date` (YYYY-MM-DD, se `allDay`); idem
 * `endAt → end`.
 *
 * Caminhos de falha (eixo c, `internal-state-contract-gate.md`):
 *   - 404 no `PUT` (evento apagado no Google entre read e push) →
 *     `CalendarPushNotFoundError` (erro tratável; a route conta como `failed`,
 *     SEM re-insert nem delete-local — C4).
 *   - 429 (rate limit) → `CalendarPushRateLimitError` (a route mapeia para 503
 *     `rate_limited`); `googleId` não persistido.
 *   - 401 (access token rejeitado) → `CalendarPushAuthError` (a route mapeia 401).
 *   - 5xx / rede → `CalendarPushError` (a route mapeia 503
 *     `calendar_push_unavailable`); NUNCA `200 { ok: false }` (anti-padrão M4 4.9).
 * Em qualquer falha o resultado NÃO é devolvido com sucesso → o `googleId` nunca é
 * persistido em Dexie (sem estado parcial).
 *
 * Node runtime (ADR-1) — fetch server-side contra `googleapis.com`.
 *
 * Trace: AC1/AC2/AC3/AC4/AC5; EPIC-6.md §5 row 6.4; [D-6.4-*].
 */

/** Endpoint real de eventos da Google Calendar API v3 (calendário primário). */
const CALENDAR_EVENTS_ENDPOINT =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/** Erro de autenticação no push (HTTP 401 — access token rejeitado). A route mapeia para 401. */
export class CalendarPushAuthError extends Error {
  constructor(message = 'Access token Google rejeitado pela Calendar API no push (401).') {
    super(message);
    this.name = 'CalendarPushAuthError';
  }
}

/** Erro transitório do push (5xx / rede). A route mapeia para 503 `calendar_push_unavailable`. */
export class CalendarPushError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalendarPushError';
  }
}

/**
 * Evento apagado no Google entre o read e o `PUT` (HTTP 404). Erro tratável — a
 * route conta o evento como `failed`, SEM re-insert nem delete-local nesta story
 * (decisão C4; a decisão de re-insert pertence a uma story de conflito futura).
 */
export class CalendarPushNotFoundError extends Error {
  constructor(message = 'Evento já não existe no Google (404) — apagado entre o read e o push.') {
    super(message);
    this.name = 'CalendarPushNotFoundError';
  }
}

/** Rate limit do Google (HTTP 429). A route mapeia para 503 `rate_limited`. */
export class CalendarPushRateLimitError extends Error {
  constructor(message = 'Google recusou o push por rate limit (429).') {
    super(message);
    this.name = 'CalendarPushRateLimitError';
  }
}

/**
 * Resultado de um push bem-sucedido — devolvido à route para persistência em
 * Dexie (AC1 iii). O `googleId` é o `id` que o Google atribuiu (insert) ou ecoou
 * (update); `updatedAt` é o `updated` do Google convertido para epoch ms.
 */
export interface PushResult {
  /** `id` do evento no Google — a persistir como `CalendarEvent.googleId` (AC2). */
  googleId: string;
  /** `etag` do evento no Google (controlo de concorrência optimista, persistível). */
  etag: string;
  /** `updated` do Google (ISO 8601) convertido para epoch ms. */
  updatedAt: number;
  /** `true` se foi um `insert` (novo no Google); `false` se foi um `update`. */
  inserted: boolean;
}

// ---------------------------------------------------------------------------
// Shape do wire (camelCase REAL da Calendar API v3 — fidelidade de protocolo)
// ---------------------------------------------------------------------------

interface GoogleEventDateTime {
  dateTime?: string; // ISO 8601 com hora (evento normal)
  date?: string; // YYYY-MM-DD (evento all-day)
}

/** Corpo enviado no `insert`/`update` (subset que o Nexus modela). */
interface GoogleEventWriteBody {
  summary: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
}

/** Resposta de `events.insert`/`events.update` (campos relevantes para o push). */
interface GoogleEventWriteResponse {
  id?: string;
  etag?: string;
  status?: string;
  updated?: string; // ISO 8601
  summary?: string;
  start?: GoogleEventDateTime;
  end?: GoogleEventDateTime;
}

// ---------------------------------------------------------------------------
// Mapeamento modelo Nexus → Google Event (AC3)
// ---------------------------------------------------------------------------

/**
 * Converte um instante (epoch ms) numa estrutura de data do Google:
 * - `allDay: true`  → `{ date: 'YYYY-MM-DD' }` (dia inteiro, fuso UTC);
 * - `allDay: false` → `{ dateTime: ISO 8601 }` (com hora, instante UTC).
 *
 * Para all-day usa-se a porção de data do ISO UTC (`toISOString().slice(0, 10)`),
 * consistente com o pull (6.3 interpreta `start.date` como meia-noite UTC).
 */
function toGoogleDateTime(epochMs: number, allDay: boolean): GoogleEventDateTime {
  const iso = new Date(epochMs).toISOString();
  if (allDay) {
    return { date: iso.slice(0, 10) }; // YYYY-MM-DD
  }
  return { dateTime: iso }; // ISO 8601 com hora
}

/**
 * Mapeia um `CalendarEvent` Nexus para o corpo de pedido do Google (AC3).
 * `title → summary`; `startAt/endAt` (epoch ms) → `start/end` (dateTime OU date).
 */
function toGoogleWriteBody(event: CalendarEvent): GoogleEventWriteBody {
  return {
    summary: event.title,
    start: toGoogleDateTime(event.startAt, event.allDay),
    end: toGoogleDateTime(event.endAt, event.allDay),
  };
}

/**
 * Mapeia a resposta do Google (insert/update) para `PushResult`, validando que os
 * campos essenciais existem (`id` e `updated` parseável). Fidelidade falsificável
 * (AC7): se a resposta não tiver `id` (ou usar `eventId`/`event_id` errado), o
 * push lança `CalendarPushError` em vez de persistir um `googleId` undefined.
 */
function toPushResult(res: GoogleEventWriteResponse, inserted: boolean): PushResult {
  if (!res.id || res.id.length === 0) {
    throw new CalendarPushError(
      'Resposta do Google sem `id` — não é possível persistir o googleId (shape inesperado).',
    );
  }
  const updatedAt = res.updated ? Date.parse(res.updated) : Date.now();
  return {
    googleId: res.id,
    etag: res.etag ?? '',
    updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? updatedAt : Date.now(),
    inserted,
  };
}

// ---------------------------------------------------------------------------
// Tratamento de respostas HTTP (mapeia status → erros tratáveis)
// ---------------------------------------------------------------------------

/**
 * Mapeia uma resposta HTTP não-2xx para o erro tratável apropriado. `isUpdate`
 * controla se o 404 é relevante (só faz sentido no `PUT` — evento apagado no
 * Google). Lança sempre (nunca devolve).
 */
function throwForStatus(status: number, isUpdate: boolean): never {
  if (status === 404 && isUpdate) {
    // Evento apagado no Google entre o read e o `PUT` (AC4 i, C4).
    throw new CalendarPushNotFoundError();
  }
  if (status === 401) {
    // Access token rejeitado pela Calendar API.
    throw new CalendarPushAuthError();
  }
  if (status === 429) {
    // Rate limit — a route devolve 503 `rate_limited` (AC4 ii).
    throw new CalendarPushRateLimitError();
  }
  // 5xx / outros não-ok → erro transitório (AC4 iii). NUNCA 200 { ok: false }.
  throw new CalendarPushError(`Calendar API recusou o push (HTTP ${status}).`);
}

/**
 * Executa um pedido de escrita (`POST` insert OU `PUT` update) e mapeia o
 * resultado. Erros de rede tornam-se `CalendarPushError`.
 */
async function writeEvent(
  url: string,
  method: 'POST' | 'PUT',
  accessToken: string,
  body: GoogleEventWriteBody,
  isUpdate: boolean,
): Promise<GoogleEventWriteResponse> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    throw new CalendarPushError(`Falha de rede ao escrever evento no Google: ${message}`);
  }

  if (!res.ok) {
    throwForStatus(res.status, isUpdate);
  }

  return (await res.json()) as GoogleEventWriteResponse;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Empurra um `CalendarEvent` Nexus para o Google Calendar (AC1).
 *
 * Discrimina insert vs update por presença de `googleId` ([D-6.4-INSERT-OR-UPDATE]):
 *   - SEM `googleId` (local-pendente) → `POST events.insert` (AC1 i);
 *   - COM `googleId` (sincronizado) → `PUT events.update` full replace (AC1 ii).
 *
 * @param accessToken Access token válido — obtido pela route via
 *   `getValidAccessToken()` (nunca aqui; AC1 iv — desacopla do store de tokens,
 *   maximiza testabilidade).
 * @param event Evento Nexus a empurrar.
 * @returns `PushResult` (`googleId`, `etag`, `updatedAt`, `inserted`) para a route
 *   persistir em Dexie (AC2). Em falha lança um erro tratável (a route mapeia).
 *
 * Nota de scope (D-6.4-SCOPE): o ramo update existe por completude/testabilidade
 * (AC1), mas a route só exerce o ramo insert no scope desta story.
 */
export async function pushCalendarEvent(
  accessToken: string,
  event: CalendarEvent,
): Promise<PushResult> {
  const body = toGoogleWriteBody(event);

  if (!event.googleId) {
    // Local-pendente → insert (POST). O Google atribui o `id` (= novo googleId).
    const res = await writeEvent(CALENDAR_EVENTS_ENDPOINT, 'POST', accessToken, body, false);
    return toPushResult(res, true);
  }

  // Sincronizado → update (PUT full replace). O `id` ecoa o googleId existente.
  const url = `${CALENDAR_EVENTS_ENDPOINT}/${encodeURIComponent(event.googleId)}`;
  const res = await writeEvent(url, 'PUT', accessToken, body, true);
  return toPushResult(res, false);
}
