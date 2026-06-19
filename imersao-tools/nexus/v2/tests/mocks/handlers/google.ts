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
 * Endpoint real de `users.messages.list`/`get` da Gmail API v1 (Story 6.8). O
 * helper `lib/google/gmail.ts` chama estes endpoints com `fetch` directo (mesmo
 * padrão de `calendar.ts`) para o MSW os poder interceptar.
 */
const GMAIL_MESSAGES_ENDPOINT =
  'https://www.googleapis.com/gmail/v1/users/me/messages';

/**
 * Endpoint real de `users.drafts.create` da Gmail API v1 (Story 6.10). A route
 * server-side `POST /api/google/gmail/draft` chama-o com `fetch` directo (mesmo
 * padrão de `inbox/route.ts`) para o MSW o poder interceptar.
 */
const GMAIL_DRAFTS_ENDPOINT =
  'https://www.googleapis.com/gmail/v1/users/me/drafts';

/**
 * Story 6.8 — access token que o handler Gmail trata como revogado → 401
 * `invalid_grant`. Permite testar `GmailAuthError` (eixo c). Distinto de um token
 * de caminho-feliz.
 */
export const GMAIL_REVOKED_ACCESS_TOKEN = 'ya29.gmail-revoked';

/**
 * Story 6.8 — access token que o handler Gmail trata como 5xx (Google
 * indisponível) → testa `GmailSyncError` (eixo c).
 */
export const GMAIL_SERVER_ERROR_ACCESS_TOKEN = 'ya29.gmail-5xx';

/**
 * Story 6.8 — `msgId`s base do mock Gmail. O handler de `messages.list` devolve
 * estes ids; o de `messages.get` devolve metadados coerentes por id. Os assuntos
 * mapeiam aos 4 buckets para o handler Anthropic produzir uma classificação
 * determinística (`temperature: 0`).
 */
export const GMAIL_MOCK_MESSAGE_IDS = [
  'gmail-msg-importante-1',
  'gmail-msg-responder-1',
  'gmail-msg-esperar-1',
  'gmail-msg-descartavel-1',
];

/**
 * Story 6.9 — endpoint INTERNO da vista Gmail (`GET /api/google/gmail/inbox`). O
 * `GmailWidget` chama-o do browser. O handler reflecte o shape REAL da resposta
 * (`{ emails: EmailSummary[] }`, `mock-protocol-fidelity.md`): cada email tem
 * `id`/`bucket`/`subject`/`from`/`date`/`classifiedAt`. Apenas buckets
 * `importante`/`responder_hoje` aparecem (FR66 — resto oculto na origem). O header
 * `x-gmail-inbox-scenario` selecciona o cenário (content/empty/401/503) sem precisar
 * de um access token Google real (a route já está coberta por `gmail-inbox.test.ts`).
 *
 * Fidelidade falsificável (C5): a chave do array é `emails` e cada item tem `bucket`
 * com a grafia ASCII (`importante`/`responder_hoje`). Se o widget esperar `messages`
 * ou um `bucket` traduzido, o render `content` falha.
 */
export const GMAIL_INBOX_ENDPOINT = '*/api/google/gmail/inbox';

/** Cenário do handler interno da inbox (via header `x-gmail-inbox-scenario`). */
export const GMAIL_INBOX_SCENARIO_HEADER = 'x-gmail-inbox-scenario';

/** Emails de exemplo devolvidos pelo cenário `content` (shape real EmailSummary). */
export const GMAIL_INBOX_MOCK_EMAILS = [
  {
    id: 'gmail-msg-importante-1',
    bucket: 'importante',
    subject: '[URGENTE] Resposta necessária hoje',
    from: 'paulo@cliente.pt',
    date: 'Wed, 18 Jun 2026 09:00:00 +0100',
    classifiedAt: 1_750_000_000_000,
  },
  {
    id: 'gmail-msg-responder-1',
    bucket: 'responder_hoje',
    subject: 'Podes confirmar a reunião de amanhã?',
    from: 'ana@equipa.pt',
    date: 'Wed, 18 Jun 2026 08:30:00 +0100',
    classifiedAt: 1_750_000_000_001,
  },
] as const;

/**
 * Story 6.10 — `to` que o handler de `drafts.create` trata como rejeitado pela
 * Gmail API (400 `invalidArgument`). Permite testar a propagação de erro 4xx da
 * Gmail API que passou o `z.string().email()` local mas o Google rejeita (eixo c).
 */
export const GMAIL_DRAFT_BAD_REQUEST_TO = 'rejeitado-pelo-google@exemplo.pt';

/**
 * Story 6.10 — `msgId` que o handler de `messages.modify` trata como inexistente
 * (404). Permite testar `GmailMessageNotFoundError` (eixo b — email eliminado).
 */
export const GMAIL_ARCHIVE_NOT_FOUND_MSG_ID = 'gmail-msg-nao-existe';

/**
 * Story 6.10 — `msgId` que o handler de `messages.modify` trata como 5xx (Gmail
 * indisponível). Permite testar a propagação 503 (eixo c, nunca 200 { ok:false }).
 */
export const GMAIL_ARCHIVE_SERVER_ERROR_MSG_ID = 'gmail-msg-5xx';

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

  // ---------------------------------------------------------------------------
  // GMAIL — LISTAGEM (Story 6.8): GET /gmail/v1/users/me/messages. Reflecte o
  // protocolo real da Gmail API v1 (`mock-protocol-fidelity.md`):
  //   - resposta: `{ messages: [{ id, threadId }], resultSizeEstimate }`
  //     (snake_case? NÃO — a Gmail API JSON usa camelCase `threadId`/
  //     `resultSizeEstimate`/`nextPageToken`; o `id` é o `msgId` da cache KV);
  //   - lista APENAS ids — os detalhes exigem `messages.get`.
  //
  // Caminhos de falha por access token (eixo c): token revogado → 401
  // `invalid_grant`; token de 5xx → 503.
  //
  // Fidelidade falsificável CRÍTICA (AC6): a chave do array é `messages` e o id é
  // `id`. Se o helper esperar `messageId` (errado), não extrai nenhum `msgId` e a
  // classificação fica vazia — o teste de fidelidade falha.
  // ---------------------------------------------------------------------------
  http.get(GMAIL_MESSAGES_ENDPOINT, ({ request }) => {
    const auth = request.headers.get('authorization') ?? '';

    if (auth.includes(GMAIL_REVOKED_ACCESS_TOKEN)) {
      return HttpResponse.json(
        {
          error: {
            code: 401,
            message: 'Invalid Credentials',
            errors: [{ domain: 'global', reason: 'authError', message: 'Invalid Credentials' }],
          },
        },
        { status: 401 },
      );
    }

    if (auth.includes(GMAIL_SERVER_ERROR_ACCESS_TOKEN)) {
      return HttpResponse.json(
        { error: { code: 500, message: 'Backend Error' } },
        { status: 500 },
      );
    }

    return HttpResponse.json({
      messages: GMAIL_MOCK_MESSAGE_IDS.map((id) => ({ id, threadId: `thread-${id}` })),
      resultSizeEstimate: GMAIL_MOCK_MESSAGE_IDS.length,
    });
  }),

  // ---------------------------------------------------------------------------
  // GMAIL — DETALHE (Story 6.8): GET /gmail/v1/users/me/messages/:id com
  // `format=metadata&metadataHeaders=Subject,From,Date`. Reflecte o shape real:
  //   - `{ id, threadId, payload: { headers: [{ name, value }] } }` — os headers
  //     são um ARRAY de `{ name, value }` (NÃO `subject`/`from` directos no topo).
  //
  // Fidelidade falsificável (AC6): se o helper esperar `payload.subject` em vez de
  // procurar em `payload.headers[]` por `name === 'Subject'`, extrai vazio — o
  // teste de fidelidade falha. O assunto codifica o bucket esperado (determinístico).
  // ---------------------------------------------------------------------------
  http.get(`${GMAIL_MESSAGES_ENDPOINT}/:id`, ({ params, request }) => {
    const auth = request.headers.get('authorization') ?? '';
    const id = params.id as string;

    if (auth.includes(GMAIL_REVOKED_ACCESS_TOKEN)) {
      return HttpResponse.json(
        { error: { code: 401, message: 'Invalid Credentials' } },
        { status: 401 },
      );
    }

    if (auth.includes(GMAIL_SERVER_ERROR_ACCESS_TOKEN)) {
      return HttpResponse.json(
        { error: { code: 500, message: 'Backend Error' } },
        { status: 500 },
      );
    }

    // Assuntos/remetentes coerentes com o bucket que o nome do id sugere — o
    // handler Anthropic usa o `subject` para classificar de forma determinística.
    const subjectByIdFragment: Record<string, { subject: string; from: string }> = {
      importante: { subject: '[URGENTE] Resposta necessária hoje', from: 'paulo@cliente.pt' },
      responder: { subject: 'Podes confirmar a reunião de amanhã?', from: 'ana@equipa.pt' },
      esperar: { subject: 'Atualização mensal do projecto', from: 'gestao@empresa.pt' },
      descartavel: { subject: 'Promoção: 50% de desconto esta semana!', from: 'newsletter@loja.com' },
    };
    const matchKey = Object.keys(subjectByIdFragment).find((k) => id.includes(k));
    const meta = matchKey
      ? subjectByIdFragment[matchKey]
      : { subject: 'Assunto genérico', from: 'alguem@exemplo.pt' };

    return HttpResponse.json({
      id,
      threadId: `thread-${id}`,
      payload: {
        headers: [
          { name: 'Subject', value: meta.subject },
          { name: 'From', value: meta.from },
          { name: 'Date', value: 'Wed, 18 Jun 2026 09:00:00 +0100' },
        ],
      },
    });
  }),

  // ---------------------------------------------------------------------------
  // GMAIL — VISTA INTERNA (Story 6.9): GET /api/google/gmail/inbox. Endpoint da
  // própria app que o `GmailWidget` consome. Shape real `{ emails: EmailSummary[] }`
  // (mock-protocol-fidelity.md). Cenário escolhido por `x-gmail-inbox-scenario`:
  //   - ausente / 'content' → 200 com GMAIL_INBOX_MOCK_EMAILS (só 2 buckets visíveis);
  //   - 'empty'             → 200 { emails: [] } (inbox limpa);
  //   - 'oauth'             → 401 { error: 'not_connected' };
  //   - 'fetch'             → 503 { error: 'gmail_unavailable' }.
  // ---------------------------------------------------------------------------
  http.get(GMAIL_INBOX_ENDPOINT, ({ request }) => {
    const scenario = request.headers.get(GMAIL_INBOX_SCENARIO_HEADER) ?? 'content';

    if (scenario === 'oauth') {
      return HttpResponse.json({ error: 'not_connected' }, { status: 401 });
    }
    if (scenario === 'fetch') {
      return HttpResponse.json({ error: 'gmail_unavailable' }, { status: 503 });
    }
    if (scenario === 'empty') {
      return HttpResponse.json({ emails: [] });
    }
    return HttpResponse.json({ emails: GMAIL_INBOX_MOCK_EMAILS });
  }),

  // ---------------------------------------------------------------------------
  // GMAIL — CRIAR DRAFT (Story 6.10): POST /gmail/v1/users/me/drafts
  // (`users.drafts.create`). Reflecte o protocolo real da Gmail API v1
  // (`mock-protocol-fidelity.md`):
  //   - corpo de pedido: `{ message: { raw: base64urlEncodedMIME } }`;
  //   - resposta 200: `{ id, message: { id, threadId } }` (o `id` do topo é o
  //     `draftId`; `message.id` é o id da mensagem-rascunho).
  //
  // O handler descodifica o `raw` (base64url → utf-8) para o teste poder asserir
  // que o `Subject` foi codificado em RFC 2047 (`=?utf-8?B?...?=`) quando tem
  // acentos (C4) — fidelidade falsificável: um `Subject:` cru com acentos no MIME
  // faria o teste de RFC 2047 falhar.
  //
  // Caminho de falha (eixo c): se o `To:` do MIME contém o sentinela
  // GMAIL_DRAFT_BAD_REQUEST_TO → 400 `invalidArgument` (a Gmail rejeita um
  // endereço que passou o Zod local).
  //
  // Fidelidade falsificável CRÍTICA: a chave do draftId é `id` no topo (não
  // `draftId`). Se a route esperar `draftId`, não extrai o id e o teste falha.
  // ---------------------------------------------------------------------------
  http.post(GMAIL_DRAFTS_ENDPOINT, async ({ request }) => {
    const auth = request.headers.get('authorization') ?? '';

    if (auth.includes(GMAIL_REVOKED_ACCESS_TOKEN)) {
      return HttpResponse.json(
        { error: { code: 401, message: 'Invalid Credentials' } },
        { status: 401 },
      );
    }
    if (auth.includes(GMAIL_SERVER_ERROR_ACCESS_TOKEN)) {
      return HttpResponse.json(
        { error: { code: 500, message: 'Backend Error' } },
        { status: 500 },
      );
    }

    const body = (await request.json()) as {
      message?: { raw?: string };
    };
    const raw = body.message?.raw ?? '';
    // Descodifica base64url → utf-8 para inspeccionar o MIME (To/Subject).
    const mime = Buffer.from(
      raw.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf-8');
    const toLine = mime
      .split('\r\n')
      .find((l) => l.toLowerCase().startsWith('to:'));

    if (toLine && toLine.includes(GMAIL_DRAFT_BAD_REQUEST_TO)) {
      return HttpResponse.json(
        {
          error: {
            code: 400,
            message: 'Invalid to header',
            errors: [
              { domain: 'global', reason: 'invalidArgument', message: 'Invalid to header' },
            ],
          },
        },
        { status: 400 },
      );
    }

    // Caminho feliz: 200 com o shape REAL (`{ id, message: { id, threadId } }`).
    return HttpResponse.json({
      id: 'draft-created-1',
      message: { id: 'msg-of-draft-1', threadId: 'thread-of-draft-1' },
    });
  }),

  // ---------------------------------------------------------------------------
  // GMAIL — ARQUIVAR (Story 6.10): POST /gmail/v1/users/me/messages/:id/modify
  // (`users.messages.modify`). Reflecte o protocolo real da Gmail API v1
  // (`mock-protocol-fidelity.md`):
  //   - corpo de pedido: `{ removeLabelIds: ['INBOX'] }` (arquivar = remover INBOX);
  //   - resposta 200: `{ id, labelIds: [...] }` (sem INBOX após arquivar).
  //
  // Idempotente: re-arquivar um email já arquivado devolve 200 sem INBOX (a Gmail
  // trata remover um label ausente como no-op). 404 se o `msgId` não existe
  // (eixo b → `GmailMessageNotFoundError`). 5xx → propaga 503 (eixo c).
  //
  // Fidelidade falsificável: a resposta tem `id` e `labelIds` (array). Se a route
  // esperar `messageId` ou um shape diferente, o teste de fidelidade falha.
  // ---------------------------------------------------------------------------
  http.post(`${GMAIL_MESSAGES_ENDPOINT}/:id/modify`, async ({ params, request }) => {
    const auth = request.headers.get('authorization') ?? '';
    const id = params.id as string;

    if (auth.includes(GMAIL_REVOKED_ACCESS_TOKEN)) {
      return HttpResponse.json(
        { error: { code: 401, message: 'Invalid Credentials' } },
        { status: 401 },
      );
    }
    if (id === GMAIL_ARCHIVE_NOT_FOUND_MSG_ID) {
      return HttpResponse.json(
        {
          error: {
            code: 404,
            message: 'Requested entity was not found.',
            errors: [
              { domain: 'global', reason: 'notFound', message: 'Requested entity was not found.' },
            ],
          },
        },
        { status: 404 },
      );
    }
    if (id === GMAIL_ARCHIVE_SERVER_ERROR_MSG_ID || auth.includes(GMAIL_SERVER_ERROR_ACCESS_TOKEN)) {
      return HttpResponse.json(
        { error: { code: 500, message: 'Backend Error' } },
        { status: 500 },
      );
    }

    // Caminho feliz: 200 com `labelIds` SEM `INBOX` (arquivado). Mantém outros
    // labels comuns para reflectir um email real (ex.: UNREAD/CATEGORY_PERSONAL).
    return HttpResponse.json({
      id,
      labelIds: ['UNREAD', 'CATEGORY_PERSONAL'],
    });
  }),
];
