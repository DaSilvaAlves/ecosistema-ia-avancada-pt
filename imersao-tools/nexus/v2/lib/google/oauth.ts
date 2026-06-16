import { google } from 'googleapis';
import { getServerEnv } from '@/lib/shared/env';

/**
 * Nexus v2 — Wrapper Node-safe do cliente OAuth2 `googleapis` (Story 6.1, T1)
 *
 * Fundação de toda a integração Google do Epic 6 (Calendar + Gmail partilham
 * este cliente). É um **confidential server-side client**: o
 * `GOOGLE_OAUTH_CLIENT_SECRET` vive server-only (Vercel env) e nunca chega ao
 * browser. Por isso [D-6.1-PKCE] ratifica state assinado HMAC-SHA256 (sem PKCE);
 * o `client_secret` na troca de code já dá a prova de posse que o PKCE replicaria
 * para public clients. PKCE S256 fica como débito reavaliável na 6.2
 * (REC-6.1-PKCE).
 *
 * TEST MODE PERMANENTE: a app fica sempre em test mode no Google Cloud Console
 * (single-user, <100 utilizadores) — NÃO pedir Google Verification. O Eurico tem
 * de constar como test user. Ver `v2/docs/setup-oauth.md` (P1/P2/P3). [D-6.1-TESTMODE]
 *
 * Node runtime obrigatório (ADR-1, arch §4.1): `googleapis` usa `http`/`crypto`
 * Node — não corre em Edge. As routes que importam este módulo não usam
 * `runtime = 'edge'`.
 *
 * Segurança: `accessToken`/`refreshToken` NUNCA são logados (NFR11 adaptado).
 *
 * Trace: FR58; arch §3 (árvore `lib/google/`), §9.2 (env vars), §16 (state
 * assinado); [D-6.1-PKCE]; [D-6.1-CALLBACK]; [D-6.1-TESTMODE].
 */

/** Scope OAuth do Google Calendar (contrato externo — forma canónica Google). */
export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';

/**
 * Tokens normalizados devolvidos pela troca de code. Forma interna do Nexus
 * (camelCase) — distinta do wire format Google (snake_case) que `exchangeCode`
 * converte. O schema KV é `{ accessToken, refreshToken, expiresAt }` (arch §6).
 */
export interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** Erro tipado de troca de code falhada (mapeado a `?error=token_exchange_failed`). */
export class TokenExchangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenExchangeError';
  }
}

/**
 * Instancia o `OAuth2Client` com as credenciais lidas via `getServerEnv()`
 * (validadas por Zod em `env.ts:19-21`). NÃO acede a `process.env` cru.
 *
 * @throws Error se alguma das `GOOGLE_OAUTH_*` estiver ausente — em produção é um
 *   erro de configuração legítimo (as credenciais são opcionais no schema porque
 *   só são provisionadas no Epic 6 / P1-P2, mas a 6.1 exige-as para operar).
 */
export function createOAuth2Client(): InstanceType<typeof google.auth.OAuth2> {
  const env = getServerEnv();
  const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      'Credenciais OAuth Google ausentes (GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI).',
    );
  }

  const client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Força o transporte gaxios a usar o `fetch` global (WHATWG). Em produção
  // (Vercel Node 18+) o `fetch` global é o transporte padrão e suportado; fixá-lo
  // explicitamente (i) torna o comportamento determinístico em vez de depender da
  // auto-detecção de transporte do gaxios, e (ii) garante que o MSW (que intercepta
  // o `fetch` global) apanha sempre a troca de code nos testes — fidelidade de
  // protocolo determinística (`mock-protocol-fidelity.md`).
  const transporter = client.transporter as { defaults?: Record<string, unknown> };
  if (transporter && typeof transporter === 'object') {
    transporter.defaults = {
      ...transporter.defaults,
      fetchImplementation: (...args: Parameters<typeof fetch>) =>
        globalThis.fetch(...args),
    };
  }

  return client;
}

/**
 * Gera o URL de autorização Google para o scope Calendar.
 *
 * - `access_type: 'offline'` — necessário para obter o `refresh_token` (sem isto
 *   o Google só devolve `access_token` de curta duração).
 * - `prompt: 'consent'` — força o consent screen mesmo em re-autorização, para
 *   garantir que o `refresh_token` vem sempre (o Google só o envia na 1ª vez se
 *   não forçado).
 * - `state` — token CSRF assinado por `oauth-state.ts` ([D-6.1-PKCE]).
 */
export function generateAuthUrl(state: string): string {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [GOOGLE_CALENDAR_SCOPE],
    state,
  });
}

/**
 * Troca o `code` do callback por tokens. Reflecte o protocolo real do
 * `googleapis`: `getToken(code)` resolve `{ tokens: { access_token, refresh_token,
 * expiry_date, token_type, scope } }`.
 *
 * Trata explicitamente o caminho de falha ([D-6.1-ERROR], eixo c):
 * - `getToken` rejeita (`invalid_grant`, code já usado/expirado) → `TokenExchangeError`.
 * - resposta sem `access_token` (parcial) → `TokenExchangeError` (nunca persistir
 *   tokens parciais; eixo b/AC3).
 *
 * @throws TokenExchangeError em qualquer falha — o caller mapeia para
 *   `?error=token_exchange_failed`.
 */
export async function exchangeCode(code: string): Promise<GoogleTokens> {
  const client = createOAuth2Client();

  // `getToken` tem overloads (string | options | callback). A forma string
  // resolve `{ tokens: Credentials, res }`. Tipamos `tokens` como `Credentials`.
  let tokens: import('google-auth-library').Credentials;
  try {
    const res = await client.getToken(code);
    tokens = res.tokens;
  } catch (err) {
    // Não logar o `code` nem o detalhe do Google (pode conter dados sensíveis).
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    throw new TokenExchangeError(`Troca de code falhou: ${message}`);
  }

  const accessToken = tokens.access_token;
  const refreshToken = tokens.refresh_token;
  const expiryDate = tokens.expiry_date;

  if (!accessToken) {
    throw new TokenExchangeError('Resposta do Google sem access_token.');
  }
  if (!refreshToken) {
    // `access_type: 'offline'` + `prompt: 'consent'` garantem o refresh token. A
    // sua ausência é uma falha de contrato — a 6.2 precisa dele para renovar.
    throw new TokenExchangeError('Resposta do Google sem refresh_token.');
  }

  return {
    accessToken,
    refreshToken,
    // `expiry_date` é epoch ms. Fallback defensivo para 1h se ausente.
    expiresAt: typeof expiryDate === 'number' ? expiryDate : Date.now() + 3_600_000,
  };
}

/**
 * Stub de revogação — implementação completa na 6.2 (REC-6.1-ENCRYPT / GAP-6.2:
 * revogação + refresh flow). A 6.1 não expõe o flow de "Desligar" funcional; o
 * botão da UI fica preparado mas a revogação real é da 6.2.
 *
 * Lança para sinalizar claramente que não está implementado — nenhum caller da
 * 6.1 o invoca em produção.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function revokeToken(token: string): Promise<void> {
  throw new Error('revokeToken: implementação completa na Story 6.2 (GAP-6.2).');
}
