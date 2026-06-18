import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { generateAuthUrl, generateGmailAuthUrl } from '@/lib/google/oauth';
import { createSignedState } from '@/lib/google/oauth-state';

/**
 * Nexus v2 — Início do fluxo OAuth Google (Story 6.1, T2, AC1 + Story 6.7, T1)
 *
 * Rota literal `/api/google/oauth/start` ([D-6.1-CALLBACK] Opção A). Node runtime
 * (ADR-1) — `googleapis`/`node:crypto`.
 *
 * Fluxo:
 *   1. Verifica a sessão do Eurico via cookie `nexus_session` (AC6 — só o
 *      utilizador autenticado pode ligar o OAuth). Sem sessão → 401.
 *   2. Gera um state assinado HMAC + armazena em KV single-use TTL 600s
 *      ([D-6.1-PKCE]).
 *   3. Redirige (302) para o consent screen Google.
 *
 * Story 6.7 ([D-6.7-INCREMENTAL] (B-mod), C1): discrimina pelo query param
 * `?scope=gmail`. Sem o param (ou qualquer outro valor) → fluxo Calendar da 6.1
 * (`generateAuthUrl`, INTOCADO). Com `?scope=gmail` → fluxo incremental Gmail
 * (`generateGmailAuthUrl`, `include_granted_scopes=true` + scope `gmail.modify`).
 * Uma só route, callback único (preserva [D-6.1-CALLBACK]). O `start_failed`
 * cobre ambos os caminhos.
 *
 * Segurança: nenhum token nem o state é logado (NFR11 adaptado). O state é opaco.
 *
 * Trace: AC1, AC6; arch §9.1; [D-6.1-CALLBACK]; [D-6.1-PKCE]; [D-6.7-INCREMENTAL].
 */

export const runtime = 'nodejs';

export async function GET(req: Request): Promise<Response> {
  // 1. Auth — só o Eurico autenticado inicia o fluxo (AC6).
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  // Story 6.7 (C1): discrimina o scope incremental. Default = Calendar (6.1).
  const scopeParam = new URL(req.url).searchParams.get('scope');
  const isGmailFlow = scopeParam === 'gmail';

  try {
    // 2. State CSRF assinado + armazenado single-use ([D-6.1-PKCE]). Mecanismo
    // partilhado pelos dois fluxos — sem alteração ao `oauth-state.ts`.
    const state = await createSignedState();

    // 3. Redirect para o consent screen Google (incremental Gmail ou Calendar).
    const authUrl = isGmailFlow
      ? generateGmailAuthUrl(state)
      : generateAuthUrl(state);
    return NextResponse.redirect(authUrl, { status: 302 });
  } catch (err) {
    // Falha de configuração (credenciais ausentes) ou de KV. Não expor detalhe.
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[google/oauth/start] falha ao iniciar OAuth:', message);
    // Redirige para as definições com erro em vez de devolver 500 cru (a UI
    // apresenta a mensagem PT-PT + CTA de retentar — [D-6.1-ERROR]).
    return NextResponse.redirect(new URL('/settings?error=start_failed', req.url), {
      status: 302,
    });
  }
}
