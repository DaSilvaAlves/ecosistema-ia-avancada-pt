import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/shared/env';
import { getSession } from '@/lib/auth/session';
import { secretsMatch, extractBearer } from '@/lib/push/cron-auth';
import {
  getValidAccessToken,
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';
import {
  classifyInboxEmails,
  GmailAuthError,
  GmailSyncError,
  GmailClassifyError,
} from '@/lib/google/gmail';

/**
 * Nexus v2 — Classificação da inbox Gmail (Story 6.8, T2, AC5 — FR64/FR65)
 *
 * Rota `POST /api/google/gmail/classify` — Node runtime (ADR-1: `@vercel/kv`/fetch
 * server-side / `googleapis`-class são Node-only). Route FINA: zero lógica de
 * classificação (tudo no helper `lib/google/gmail.ts`). Apenas coordena auth +
 * token + delegação + mapeamento de erros.
 *
 * Auth DUAL ([D-6.8-CRON-INTEGRATION]/C3, sem env var nova):
 *   - `getSession()` (cookie de sessão) — trigger manual da UI (6.9);
 *   - OU `Authorization: Bearer <CRON_SECRET>` (timing-safe) — invocação
 *     server-to-server por scheduler externo. Reutiliza `secretsMatch`/
 *     `extractBearer` de `lib/push/cron-auth.ts` e o `CRON_SECRET` já existente
 *     (4.8/6.5) — zero mecanismo novo.
 *
 * Nota: a integração CANÓNICA com o cron 6.5 é por IMPORT do helper
 * `classifyInboxEmails` (wiring numa story futura), NÃO por fetch HTTP interno —
 * zero superfície SSRF (lição 5.11). Esta route existe para o trigger manual e
 * como endpoint server-to-server opcional.
 *
 * Token: `getValidAccessToken()` (único ponto de entrada — nunca
 * `getTokens().accessToken`):
 *   - `null`  → 401 `{ error: 'not_connected' }`;
 *   - `TokenRevokedError` → 401 `{ error: 'token_revoked' }`;
 *   - `TokenRefreshError` → 503 (Google indisponível no refresh).
 *
 * Caminhos de falha do helper (eixo c, `internal-state-contract-gate.md`):
 *   - `GmailAuthError` (401 do Gmail) → 401 `{ error: 'token_revoked' }`;
 *   - `GmailSyncError` (429/5xx Gmail / rede) → 503 (anti-padrão M4 da 4.9: NUNCA
 *     `200 { ok: false }`);
 *   - `GmailClassifyError` (Anthropic 5xx / shape inválido) → 503.
 *
 * Trace: AC5; arch §4.1 (Node runtime); [D-6.8-CRON-INTEGRATION]/C3; merge-authority
 * (CR --base main deferido ao @devops).
 */

export const runtime = 'nodejs';

/**
 * Autoriza o pedido por sessão OU `CRON_SECRET` Bearer (C3). Devolve `null` se
 * autorizado, ou uma `Response` de erro (401 não-autorizado / 503 config inválida).
 */
async function authorize(req: Request): Promise<Response | null> {
  // (i) Sessão de browser (trigger manual UI).
  const session = await getSession(req);
  if (session.valid) return null;

  // (ii) `CRON_SECRET` Bearer (server-to-server). `getServerEnv()` pode LANÇAR na
  // validação Zod do env em produção; o try/catch garante que config ausente E
  // config inválida terminam IDENTICAMENTE num 503 fail-closed (padrão cron/sync).
  let cronSecret: string | undefined;
  try {
    cronSecret = getServerEnv().CRON_SECRET;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[gmail/classify] configuração de ambiente inválida:', message);
    return NextResponse.json(
      { error: 'Serviço de classificação indisponível.' },
      { status: 503 },
    );
  }

  const provided = extractBearer(req.headers.get('authorization'));
  if (cronSecret && provided !== null && secretsMatch(provided, cronSecret)) {
    return null;
  }

  return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
}

export async function POST(req: Request): Promise<Response> {
  // (AC5 i) Auth dual: sessão OU CRON_SECRET.
  const authError = await authorize(req);
  if (authError) return authError;

  // (AC5 ii) Único ponto de entrada de access token (nunca getTokens().accessToken).
  let accessToken: string | null;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    if (err instanceof TokenRevokedError) {
      return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
    }
    if (err instanceof TokenRefreshError) {
      return NextResponse.json({ error: 'refresh_failed' }, { status: 503 });
    }
    throw err;
  }

  if (accessToken === null) {
    return NextResponse.json({ error: 'not_connected' }, { status: 401 });
  }

  // (AC5 iv) Delega ao helper puro — zero lógica de classificação aqui.
  let result;
  try {
    result = await classifyInboxEmails(accessToken);
  } catch (err) {
    if (err instanceof GmailAuthError) {
      // Access token rejeitado pela Gmail API (401) — re-auth.
      return NextResponse.json({ error: 'token_revoked' }, { status: 401 });
    }
    if (err instanceof GmailSyncError) {
      // 429/5xx Gmail / rede → 503, SEM 200 { ok: false } (anti-padrão M4 da 4.9).
      return NextResponse.json({ error: 'gmail_unavailable' }, { status: 503 });
    }
    if (err instanceof GmailClassifyError) {
      // Anthropic 5xx / shape inválido → 503 (nenhum email do lote falhado escrito).
      return NextResponse.json({ error: 'classify_failed' }, { status: 503 });
    }
    throw err;
  }

  // (AC5 v) Resposta fina.
  return NextResponse.json({
    ok: true,
    classified: result.classified,
    fromCache: result.fromCache,
    total: result.total,
  });
}
