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

/** Code que o handler trata como `invalid_grant` (replay/expirado) na troca de code. */
export const INVALID_GRANT_CODE = 'invalid-grant-code';

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

    // Cenário feliz da troca: shape REAL do wire (snake_case). Aqui SIM o Google
    // devolve `refresh_token` (é a autorização inicial).
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
];
