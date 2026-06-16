import { NextResponse } from 'next/server';
import { exchangeCode, TokenExchangeError } from '@/lib/google/oauth';
import { verifyAndConsumeState } from '@/lib/google/oauth-state';
import { saveTokens } from '@/lib/google/token-store';

/**
 * Nexus v2 — Callback OAuth Google (Story 6.1, T3, AC2/AC3/AC6)
 *
 * Rota literal `/api/google/oauth/callback` ([D-6.1-CALLBACK] Opção A). Este path
 * é um IDENTIFICADOR DE CONTRATO EXTERNO: tem de bater ao caracter com o
 * `GOOGLE_OAUTH_REDIRECT_URI` registado no Google Cloud Console
 * (`external-contract-identifiers.md`), senão o Google rejeita com
 * `redirect_uri_mismatch`. Node runtime (ADR-1).
 *
 * Máquina de estados de erro fechada ([D-6.1-ERROR]) — o callback NUNCA devolve
 * erro cru nem faz throw não-tratado; mapeia cada falha para um tipo e redirige
 * para `/settings?error=<tipo>`. Nenhum `code`, `state` ou token aparece na query
 * string ou em logs.
 *
 * Análise de ciclo de vida (`internal-state-contract-gate.md`):
 *   (a) classes: token `não-existente → válido`; state `válido/usado/expirado`.
 *   (b) transição-já-ocorrida: state single-use (consumido ANTES da troca);
 *       replay de state → invalid_state; replay de code (Google invalida) →
 *       token_exchange_failed. Nunca silent overwrite.
 *   (c) caminhos de falha: access_denied, invalid_state (302 → UI de erro),
 *       token_exchange_failed, storage_failed — cada um tratado como falha, nunca
 *       sucesso silencioso. A defesa CSRF do invalid_state vem do short-circuit
 *       verifyAndConsumeState→não-trocar-code (ortogonal ao status HTTP, RFC 9110).
 *
 * Trace: AC2/AC3/AC6; arch §9.1; [D-6.1-CALLBACK]; [D-6.1-ERROR]; [D-6.1-PKCE];
 * [D-6.1-SCOPE]; `internal-state-contract-gate.md` eixos a/b/c.
 */

export const runtime = 'nodejs';

/** Tipos de erro fechados ([D-6.1-ERROR]) — passados à UI via `?error=`. */
type OAuthErrorType =
  | 'access_denied'
  | 'invalid_state'
  | 'token_exchange_failed'
  | 'storage_failed';

function redirectWithError(req: Request, error: OAuthErrorType): Response {
  return NextResponse.redirect(new URL(`/settings?error=${error}`, req.url), {
    status: 302,
  });
}

function redirectConnected(req: Request): Response {
  return NextResponse.redirect(new URL('/settings?connected=calendar', req.url), {
    status: 302,
  });
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const googleError = url.searchParams.get('error');

  // (c) O utilizador cancelou/negou o consent — o Google devolve ?error=access_denied
  // (e variantes). Tratamos qualquer `error` do Google como access_denied para a UI.
  if (googleError) {
    return redirectWithError(req, 'access_denied');
  }

  // (a/c/AC6) State inválido, ausente, expirado ou já usado → 302 para a UI de erro,
  // ANTES da troca. verifyAndConsumeState consome o state single-use (eixo b — antes
  // da troca), garantindo a defesa CSRF independentemente do status HTTP.
  const stateOk = await verifyAndConsumeState(state);
  if (!stateOk) {
    // AC6 (reconciliado pelo Architect Gate de saída, [D-6.1-ERROR]): redirect 302
    // para `/settings?error=invalid_state`, NÃO 403. O header `Location` de um 403
    // não é seguido pelos browsers (RFC 9110) — o utilizador legítimo com state
    // expirado via TTL veria página em branco e nunca alcançaria a UI de erro
    // (AC4 inalcançável). A protecção CSRF vem do short-circuit acima
    // (verifyAndConsumeState falha → o code NUNCA é trocado), ortogonal ao status.
    return redirectWithError(req, 'invalid_state');
  }

  // O code tem de existir após state válido (fluxo normal do Google).
  if (!code) {
    return redirectWithError(req, 'token_exchange_failed');
  }

  // (b/c) Troca de code por tokens. Code single-use no lado Google — replay →
  // TokenExchangeError, nunca silent overwrite.
  let tokens;
  try {
    tokens = await exchangeCode(code);
  } catch (err) {
    if (!(err instanceof TokenExchangeError)) {
      // Erro inesperado — não logar o code; mensagem genérica.
      const message = err instanceof Error ? err.message : 'erro desconhecido';
      console.error('[google/oauth/callback] erro inesperado na troca de code:', message);
    }
    return redirectWithError(req, 'token_exchange_failed');
  }

  // (c) Persistência via seam token-store ([D-6.1-SCOPE]) — só após access_token
  // presente (garantido por exchangeCode; AC3 — nunca tokens parciais). Falha de
  // KV é tratada como erro, não sucesso silencioso.
  try {
    await saveTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[google/oauth/callback] falha ao gravar tokens em KV:', message);
    return redirectWithError(req, 'storage_failed');
  }

  // Sucesso — transição não-existente → válido completa.
  return redirectConnected(req);
}
