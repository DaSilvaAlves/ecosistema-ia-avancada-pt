import { http, HttpResponse } from 'msw';

/**
 * Nexus v2 — MSW handlers Google OAuth2 (Story 6.1, T5, AC5/AC7)
 *
 * Reflecte o PROTOCOLO REAL do `googleapis` / Google OAuth2 token endpoint
 * (`mock-protocol-fidelity.md`). O `client.getToken(code)` faz
 * `POST https://oauth2.googleapis.com/token` com o `code` no corpo
 * (`application/x-www-form-urlencoded`) e o `googleapis` lê o JSON de resposta
 * mapeando-o para `{ tokens: { access_token, refresh_token, expiry_date, ... } }`.
 *
 * Fidelidade falsificável: a resposta OK usa as chaves snake_case REAIS do wire
 * (`access_token`, `refresh_token`, `expires_in`, `scope`, `token_type`). Se
 * alguém renomear `access_token` → `accessToken` na resposta mock, o
 * `exchangeCode` deixa de extrair o token e o teso de troca FALHA — ≥1 teste
 * falha se o shape divergir (condição AC5/AC7).
 *
 * O code mágico `denied-code` simula um `invalid_grant` (code já usado/expirado),
 * para o cenário de `token_exchange_failed`.
 *
 * Trace: AC5, AC7; `mock-protocol-fidelity.md`; arch §5.2.
 */

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/** Code que o handler trata como `invalid_grant` (replay/expirado). */
export const INVALID_GRANT_CODE = 'invalid-grant-code';

export const googleHandlers = [
  http.post(GOOGLE_TOKEN_ENDPOINT, async ({ request }) => {
    // O googleapis envia o code em form-urlencoded.
    const body = await request.text();
    const params = new URLSearchParams(body);
    const code = params.get('code');

    // Cenário: code inválido/já usado → erro real do Google OAuth2 (HTTP 400 com
    // `{ error, error_description }`). O googleapis transforma-o em rejeição de
    // `getToken`, que o `exchangeCode` mapeia para TokenExchangeError.
    if (code === INVALID_GRANT_CODE) {
      return HttpResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Bad Request',
        },
        { status: 400 },
      );
    }

    // Cenário feliz: shape REAL do wire (snake_case). `expires_in` em segundos é o
    // que o Google devolve; o googleapis calcula `expiry_date` (epoch ms) a partir
    // dele e expõe-o em `tokens.expiry_date`.
    return HttpResponse.json({
      access_token: 'ya29.mock-access-token',
      refresh_token: '1//mock-refresh-token',
      expires_in: 3599,
      scope: 'https://www.googleapis.com/auth/calendar',
      token_type: 'Bearer',
    });
  }),
];
