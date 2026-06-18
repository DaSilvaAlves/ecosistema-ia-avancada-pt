import { http, HttpResponse } from 'msw';

/**
 * Nexus v2 — MSW handlers Google OAuth2 (Story 6.1 + Story 6.2)
 *
 * Reflecte o PROTOCOLO REAL do `googleapis` / Google OAuth2 (`mock-protocol-fidelity.md`):
 *   - `POST oauth2.googleapis.com/token` com `code` → troca de code (6.1).
 *   - `POST oauth2.googleapis.com/token` com `grant_type=refresh_token` → refresh (6.2).
 *   - `POST oauth2.googleapis.com/revoke` com `token=` → revogação (6.2).
 *
 * Fidelidade falsificável (6.1): a resposta de troca usa as chaves snake_case
 * REAIS do wire (`access_token`, `refresh_token`, `expires_in`, `scope`,
 * `token_type`). Se alguém renomear `access_token` → `accessToken`, o
 * `exchangeCode` deixa de extrair o token e o teste de troca FALHA.
 *
 * Fidelidade falsificável CRÍTICA (6.2): a resposta de REFRESH **NÃO inclui**
 * `refresh_token` — o protocolo real do Google não o devolve no refresh (só na
 * autorização inicial). O teste `refresh.test.ts` falha se este handler incluir
 * `refresh_token` na resposta de refresh (guarda contra o bug silencioso de
 * sobrescrever o refreshToken guardado).
 *
 * Trace: AC5, AC7; `mock-protocol-fidelity.md`; arch §5.2.
 */

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_REVOKE_ENDPOINT = 'https://oauth2.googleapis.com/revoke';

/**
 * Endpoint real de `events.list` da Google Calendar API v3 (Story 6.3).
 * O helper `lib/google/calendar.ts` chama este endpoint com `fetch` directo
 * (mesmo padrão do refresh em `token-store.ts`) para o MSW o poder interceptar.
 */
const GOOGLE_CALENDAR_EVENTS_ENDPOINT =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/**
 * syncToken que o handler de `events.list` trata como expirado → HTTP 410 Gone
 * (Story 6.3, AC5). Permite testar o caminho de full resync automático.
 */
export const EXPIRED_SYNC_TOKEN = 'expired-sync-token';

/**
 * Story 6.4 — sentinelas de push (`events.insert`/`events.update`).
 *
 * O handler de insert/update reflecte o `summary` recebido no corpo para certos
 * sentinelas dispararem caminhos de falha controlados:
 *   - `PUSH_NOT_FOUND_SUMMARY` → o `PUT` (update) devolve 404 (evento apagado no
 *     Google entre o read e o push, AC4 i);
 *   - `PUSH_RATE_LIMIT_SUMMARY` → 429 com `Retry-After` (AC4 ii);
 *   - `PUSH_SERVER_ERROR_SUMMARY` → 5xx (Google indisponível, AC4 iii).
 * Qualquer outro `summary` segue o caminho feliz (201 insert / 200 update).
 */
export const PUSH_NOT_FOUND_SUMMARY = '__push_not_found__';
export const PUSH_RATE_LIMIT_SUMMARY = '__push_rate_limit__';
export const PUSH_SERVER_ERROR_SUMMARY = '__push_server_error__';

/** googleId que o handler de `PUT` (update) trata como apagado no Google → 404. */
export const DELETED_GOOGLE_EVENT_ID = 'deleted-google-event-id';

/** Code que o handler trata como `invalid_grant` (replay/expirado) na troca de code. */
export const INVALID_GRANT_CODE = 'invalid-grant-code';

/**
 * Story 6.7 — code do fluxo OAuth INCREMENTAL Gmail. A resposta de troca reflecte
 * o protocolo real Google (`mock-protocol-fidelity.md`): com `include_granted_scopes`
 * + `prompt=consent`, o Google devolve um token COMBINADO que cobre `calendar` +
 * `gmail.modify` no campo `scope` (espaço-separado) E um NOVO `refresh_token`
 * (distinto do da 6.1 — `prompt=consent` força nova emissão). Fidelidade
 * falsificável (AC5/AC7): o teste falha se este `scope` não incluir `gmail.modify`.
 */
export const GMAIL_INCREMENTAL_CODE = 'gmail-incremental-code';

/** `scope` combinado devolvido no fluxo incremental Gmail (wire real, espaço-separado). */
export const GMAIL_INCREMENTAL_SCOPE =
  'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.modify';

/** Refresh token NOVO emitido no 2.º consent (combinado) — distinto do da 6.1 (C3). */
export const GMAIL_INCREMENTAL_REFRESH_TOKEN = '1//mock-combined-refresh-token';

/**
 * Story 6.7 — code do cenário em que o utilizador só concede `calendar` no consent
 * Gmail (scope parcialmente concedido, eixo c). A resposta NÃO inclui `gmail.modify`
 * no `scope` → o callback redirige `?connected=calendar` e o `/status` reporta
 * `gmailConnected:false` (honesto — o scope não foi concedido).
 */
export const GMAIL_PARTIAL_GRANT_CODE = 'gmail-partial-grant-code';

/**
 * Refresh token que o handler de refresh trata como `invalid_grant` (revogado
 * externamente). Permite testar o cenário `revogado-externo` do ciclo de vida.
 */
export const INVALID_GRANT_REFRESH_TOKEN = 'invalid-grant-refresh-token';

/**
 * Token que o handler de revogação trata como já-inválido (400 idempotente).
 * Permite testar `[D-6.2-REVOKE-PARTIAL]` ramo 400.
 */
export const ALREADY_REVOKED_TOKEN = 'already-revoked-token';

/**
 * Token que o handler de revogação trata como indisponibilidade do Google (5xx).
 * Permite testar `[D-6.2-REVOKE-PARTIAL]` ramo transporte/5xx (KV preservado).
 */
export const REVOKE_SERVER_ERROR_TOKEN = 'revoke-server-error-token';

export const googleHandlers = [
  http.post(GOOGLE_TOKEN_ENDPOINT, async ({ request }) => {
    // O googleapis / o refresh enviam o corpo em form-urlencoded.
    const body = await request.text();
    const params = new URLSearchParams(body);
    const grantType = params.get('grant_type');

    // -------------------------------------------------------------------------
    // Cenário REFRESH (Story 6.2): grant_type=refresh_token.
    // -------------------------------------------------------------------------
    if (grantType === 'refresh_token') {
      const refreshToken = params.get('refresh_token');

      // refreshToken revogado externamente → invalid_grant (HTTP 400 com
      // `{ error, error_description }`, shape real do Google).
      if (refreshToken === INVALID_GRANT_REFRESH_TOKEN) {
        return HttpResponse.json(
          {
            error: 'invalid_grant',
            error_description: 'Token has been expired or revoked.',
          },
          { status: 400 },
        );
      }

      // Cenário feliz do refresh: shape REAL do wire (snake_case). CRÍTICO: o
      // Google NÃO devolve `refresh_token` no refresh — esta resposta NÃO o inclui
      // (fidelidade falsificável: o teste falha se for adicionado). `expires_in`
      // em segundos.
      return HttpResponse.json({
        access_token: 'ya29.refreshed-access-token',
        expires_in: 3599,
        scope: 'https://www.googleapis.com/auth/calendar',
        token_type: 'Bearer',
      });
    }

    // -------------------------------------------------------------------------
    // Cenário TROCA DE CODE (Story 6.1): code presente.
    // -------------------------------------------------------------------------
    const code = params.get('code');

    // Cenário: code inválido/já usado → erro real do Google OAuth2 (HTTP 400).
    if (code === INVALID_GRANT_CODE) {
      return HttpResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Bad Request',
        },
        { status: 400 },
      );
    }

    // -------------------------------------------------------------------------
    // Story 6.7 — Cenário OAuth INCREMENTAL Gmail: o `scope` da resposta cobre
    // `calendar` + `gmail.modify` (espaço-separado) e o `refresh_token` é NOVO
    // (combinado — `prompt=consent` força nova emissão). Fidelidade falsificável:
    // se este `scope` não incluir `gmail.modify`, o teste de fidelidade falha.
    // -------------------------------------------------------------------------
    if (code === GMAIL_INCREMENTAL_CODE) {
      return HttpResponse.json({
        access_token: 'ya29.mock-combined-access-token',
        refresh_token: GMAIL_INCREMENTAL_REFRESH_TOKEN,
        expires_in: 3599,
        scope: GMAIL_INCREMENTAL_SCOPE,
        token_type: 'Bearer',
      });
    }

    // -------------------------------------------------------------------------
    // Story 6.7 — Cenário de scope PARCIALMENTE concedido: o utilizador só aceitou
    // `calendar` no consent Gmail. O `scope` NÃO inclui `gmail.modify` → o callback
    // redirige `?connected=calendar` e `gmailConnected` fica false (eixo c).
    // -------------------------------------------------------------------------
    if (code === GMAIL_PARTIAL_GRANT_CODE) {
      return HttpResponse.json({
        access_token: 'ya29.mock-partial-access-token',
        refresh_token: '1//mock-partial-refresh-token',
        expires_in: 3599,
        scope: 'https://www.googleapis.com/auth/calendar',
        token_type: 'Bearer',
      });
    }

    // Cenário feliz da troca (6.1 — Calendar): shape REAL do wire (snake_case).
    // Aqui SIM o Google devolve `refresh_token` (é a autorização inicial).
    return HttpResponse.json({
      access_token: 'ya29.mock-access-token',
      refresh_token: '1//mock-refresh-token',
      expires_in: 3599,
      scope: 'https://www.googleapis.com/auth/calendar',
      token_type: 'Bearer',
    });
  }),

  // ---------------------------------------------------------------------------
  // Endpoint de REVOGAÇÃO (Story 6.2): POST /revoke com `token=` form-urlencoded.
  // ---------------------------------------------------------------------------
  http.post(GOOGLE_REVOKE_ENDPOINT, async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const token = params.get('token');

    // Token já inválido/revogado → 400 (Google rejeita). Tratado como idempotente
    // pelo `revokeToken` ([D-6.2-REVOKE-PARTIAL]).
    if (token === ALREADY_REVOKED_TOKEN) {
      return HttpResponse.json(
        { error: 'invalid_token' },
        { status: 400 },
      );
    }

    // Google indisponível → 5xx. `revokeToken` lança TokenRevokeError; a route
    // NÃO apaga o KV.
    if (token === REVOKE_SERVER_ERROR_TOKEN) {
      return HttpResponse.json(
        { error: 'internal_failure' },
        { status: 503 },
      );
    }

    // Sucesso: o Google devolve 200 OK sem body.
    return new HttpResponse(null, { status: 200 });
  }),

  // ---------------------------------------------------------------------------
  // Endpoint de LISTAGEM DE EVENTOS (Story 6.3): GET
  // /calendar/v3/calendars/primary/events. Reflecte o protocolo real da Google
  // Calendar API v3 (`mock-protocol-fidelity.md`):
  //   - resposta: `{ kind, items[], nextSyncToken }` (camelCase REAL do wire JSON
  //     da Calendar API — distinto do snake_case do OAuth2 token endpoint);
  //   - `items[].id` (ID único), `items[].status` ('confirmed' | 'cancelled'),
  //     `items[].summary`, `items[].start`/`items[].end`
  //     (`dateTime` ISO com hora OU `date` YYYY-MM-DD all-day), `items[].updated`;
  //   - sync incremental (com `syncToken`): devolve apenas alterações + um item
  //     `cancelled`;
  //   - full resync (sem `syncToken`): paginação por `pageToken` → última página
  //     traz `nextSyncToken`;
  //   - `syncToken` expirado → HTTP 410 Gone com o body de erro real.
  //
  // Fidelidade falsificável CRÍTICA (AC7): a chave é `nextSyncToken` (camelCase).
  // Se o helper esperar `next_sync_token` (snake_case errado), não persiste o
  // cursor e o sync incremental nunca funciona — o teste de fidelidade falha.
  // ---------------------------------------------------------------------------
  http.get(GOOGLE_CALENDAR_EVENTS_ENDPOINT, ({ request }) => {
    const url = new URL(request.url);
    const syncToken = url.searchParams.get('syncToken');
    const pageToken = url.searchParams.get('pageToken');

    // syncToken expirado → 410 Gone (shape de erro real do Google).
    if (syncToken === EXPIRED_SYNC_TOKEN) {
      return HttpResponse.json(
        {
          error: {
            code: 410,
            message: 'Sync token is no longer valid, a full sync is required.',
            errors: [
              {
                domain: 'calendar',
                reason: 'fullSyncRequired',
                message: 'Sync token is no longer valid, a full sync is required.',
              },
            ],
          },
        },
        { status: 410 },
      );
    }

    // -------------------------------------------------------------------------
    // Sync INCREMENTAL (com syncToken válido): devolve um evento confirmado
    // (actualizado), um evento all-day, e um evento cancelado (para AC4).
    // Última página → `nextSyncToken` presente, sem `nextPageToken`.
    // -------------------------------------------------------------------------
    if (syncToken) {
      return HttpResponse.json({
        kind: 'calendar#events',
        summary: 'Eurico',
        items: [
          {
            id: 'google_event_incremental_1',
            status: 'confirmed',
            summary: 'Reunião com Paulo (actualizada)',
            start: { dateTime: '2026-06-20T15:00:00+01:00' },
            end: { dateTime: '2026-06-20T16:00:00+01:00' },
            updated: '2026-06-17T10:00:00.000Z',
          },
          {
            id: 'google_event_allday_1',
            status: 'confirmed',
            summary: 'Feriado',
            start: { date: '2026-06-25' },
            end: { date: '2026-06-26' },
            updated: '2026-06-17T11:00:00.000Z',
          },
          {
            id: 'google_event_cancelled_1',
            status: 'cancelled',
          },
        ],
        nextSyncToken: 'sync-token-after-incremental',
      });
    }

    // -------------------------------------------------------------------------
    // FULL RESYNC (sem syncToken): paginação de 2 páginas.
    //   - sem pageToken → página 1 com `nextPageToken`;
    //   - pageToken='page-2-token' → página 2 final com `nextSyncToken`.
    // -------------------------------------------------------------------------
    if (pageToken === 'page-2-token') {
      return HttpResponse.json({
        kind: 'calendar#events',
        summary: 'Eurico',
        items: [
          {
            id: 'google_event_full_2',
            status: 'confirmed',
            summary: 'Almoço de equipa',
            start: { dateTime: '2026-07-02T12:30:00+01:00' },
            end: { dateTime: '2026-07-02T13:30:00+01:00' },
            updated: '2026-06-17T09:00:00.000Z',
          },
        ],
        nextSyncToken: 'sync-token-after-full-resync',
      });
    }

    // Página 1 do full resync.
    return HttpResponse.json({
      kind: 'calendar#events',
      summary: 'Eurico',
      items: [
        {
          id: 'google_event_full_1',
          status: 'confirmed',
          summary: 'Consulta médica',
          start: { dateTime: '2026-07-01T09:00:00+01:00' },
          end: { dateTime: '2026-07-01T09:30:00+01:00' },
          updated: '2026-06-16T08:00:00.000Z',
        },
      ],
      nextPageToken: 'page-2-token',
    });
  }),

  // ---------------------------------------------------------------------------
  // Endpoint de CRIAÇÃO DE EVENTO (Story 6.4): POST
  // /calendar/v3/calendars/primary/events (`events.insert`). Reflecte o protocolo
  // real da Google Calendar API v3 (`mock-protocol-fidelity.md`):
  //   - corpo de pedido: `{ summary, start, end }` (start/end com `dateTime` OU
  //     `date` all-day);
  //   - resposta 201: `{ id, etag, status: 'confirmed', updated, summary, start,
  //     end }` (camelCase REAL do wire JSON — `id` é o googleId a persistir).
  //
  // Fidelidade falsificável CRÍTICA (AC7): a chave do ID na resposta é `id`
  // (camelCase, não `eventId`/`event_id`). Se o handler usar o nome errado, o
  // helper `pushCalendarEvent` não extrai o `googleId` e a idempotência (AC2)
  // falha — o teste de fidelidade falha.
  // ---------------------------------------------------------------------------
  http.post(GOOGLE_CALENDAR_EVENTS_ENDPOINT, async ({ request }) => {
    const body = (await request.json()) as {
      summary?: string;
      start?: unknown;
      end?: unknown;
    };
    const summary = body.summary ?? '';

    // Sentinela de rate limit (429 com Retry-After — shape real do Google).
    if (summary === PUSH_RATE_LIMIT_SUMMARY) {
      return HttpResponse.json(
        {
          error: {
            code: 429,
            message: 'Rate Limit Exceeded',
            errors: [
              { domain: 'usageLimits', reason: 'rateLimitExceeded', message: 'Rate Limit Exceeded' },
            ],
          },
        },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    // Sentinela de 5xx (Google indisponível).
    if (summary === PUSH_SERVER_ERROR_SUMMARY) {
      return HttpResponse.json(
        { error: { code: 500, message: 'Backend Error' } },
        { status: 500 },
      );
    }

    // Caminho feliz: 201 Created com o shape REAL (camelCase). Devolve o `start`/
    // `end` recebidos no corpo (o Google ecoa-os) para o teste poder asserir o
    // mapeamento epoch→ISO.
    return HttpResponse.json(
      {
        id: 'google_event_inserted_1',
        etag: '"insert-etag-3387"',
        status: 'confirmed',
        updated: '2026-06-17T12:00:00.000Z',
        summary,
        start: body.start,
        end: body.end,
      },
      { status: 201 },
    );
  }),

  // ---------------------------------------------------------------------------
  // Endpoint de ACTUALIZAÇÃO DE EVENTO (Story 6.4): PUT
  // /calendar/v3/calendars/primary/events/:eventId (`events.update`, full replace
  // — [D-6.4-INSERT-OR-UPDATE]). Resposta análoga ao insert (200 OK).
  //   - 404 se o evento foi apagado no Google entre o read e o `PUT` (AC4 i);
  //   - mesmos sentinelas 429/5xx do insert (via summary).
  // ---------------------------------------------------------------------------
  http.put(`${GOOGLE_CALENDAR_EVENTS_ENDPOINT}/:eventId`, async ({ request, params }) => {
    const eventId = params.eventId as string;
    const body = (await request.json()) as {
      summary?: string;
      start?: unknown;
      end?: unknown;
    };
    const summary = body.summary ?? '';

    // Evento apagado no Google entre o read e o push → 404 (shape de erro real).
    if (eventId === DELETED_GOOGLE_EVENT_ID || summary === PUSH_NOT_FOUND_SUMMARY) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: 'Resource Not Found: events',
            errors: [
              { domain: 'global', reason: 'notFound', message: 'Resource Not Found: events' },
            ],
          },
        },
        { status: 404 },
      );
    }

    if (summary === PUSH_RATE_LIMIT_SUMMARY) {
      return HttpResponse.json(
        {
          error: {
            code: 429,
            message: 'Rate Limit Exceeded',
            errors: [
              { domain: 'usageLimits', reason: 'rateLimitExceeded', message: 'Rate Limit Exceeded' },
            ],
          },
        },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    if (summary === PUSH_SERVER_ERROR_SUMMARY) {
      return HttpResponse.json(
        { error: { code: 500, message: 'Backend Error' } },
        { status: 500 },
      );
    }

    // Caminho feliz: 200 OK, mesmo shape do insert; `id` ecoa o eventId do path.
    return HttpResponse.json({
      id: eventId,
      etag: '"update-etag-9912"',
      status: 'confirmed',
      updated: '2026-06-17T13:30:00.000Z',
      summary,
      start: body.start,
      end: body.end,
    });
  }),
];
