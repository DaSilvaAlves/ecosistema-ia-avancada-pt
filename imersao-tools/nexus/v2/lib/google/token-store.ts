import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';
import { kv } from '@vercel/kv';
import { getServerEnv } from '@/lib/shared/env';

/**
 * Nexus v2 — Store server-side dos tokens OAuth Google em Vercel KV
 * (Story 6.1 seam + Story 6.2 encriptação at-rest + refresh flow)
 *
 * SEAM de [D-6.1-SCOPE]: a interface pública (`saveTokens`/`getTokens`/
 * `deleteTokens`) NÃO muda — os callers (callback route, status route) continuam
 * a usá-la sem saber se há encriptação. A 6.2 reimplementa o INTERIOR destas três
 * funções e adiciona um export NOVO (`getValidAccessToken`), sem alterar a
 * interface existente. Zero refactor dos callers.
 *
 * Story 6.2 — decisões ratificadas pelo Architect Gate de Entrada (Aria, 17/06):
 *   [D-6.2-ENCRYPT]     AES-256-GCM (`node:crypto`). Encripta `refreshToken` E
 *                       `accessToken` (uniformidade — o store nunca distingue
 *                       plaintext/ciphertext por campo, elimina regressão
 *                       acidental). `expiresAt` em claro (não-sensível, necessário
 *                       para a decisão de refresh sem desencriptar). IV de 12 bytes
 *                       único por escrita + authTag de 16 bytes persistidos junto
 *                       ao ciphertext.
 *   [D-6.2-ENCRYPT-KEY] Chave de 32 bytes derivada de `SESSION_SECRET` via
 *                       HKDF-SHA256 com salt/info dedicados (separação de domínio
 *                       criptográfico face ao HMAC de state em `oauth-state.ts`).
 *                       NUNCA `SESSION_SECRET` cru. SEM nova env var — `env.ts`
 *                       intocado.
 *   [D-6.2-REFRESH]     Refresh PROACTIVO (janela 5 min) via `getValidAccessToken`.
 *                       A resposta de refresh do Google NÃO traz `refresh_token` →
 *                       NUNCA sobrescrever o `refreshToken` guardado. `invalid_grant`
 *                       → apagar KV + propagar erro tipado (não silent failure).
 *
 * internal-state-contract-gate.md (eixo c): desencriptação falha (authTag GCM
 * inválido / chave mudou / ciphertext corrompido) → `getTokens` devolve `null`
 * (graceful, força re-auth), NUNCA crash nem silent corruption.
 *
 * Server-only: importa `@vercel/kv` + `node:crypto`. NUNCA importar em código
 * client. Node runtime obrigatório (ADR-1) — `crypto`/`googleapis`/`@vercel/kv`
 * são Node-only.
 *
 * Identidade singleton: o Nexus tem um único utilizador (`eurico`) — no máximo um
 * registo de tokens. A identidade vive na chave KV (`nexus:google:tokens`).
 * Prefixo `nexus:` obrigatório (ADR-6). Schema arch §6.
 *
 * Segurança: `accessToken`/`refreshToken` e a chave de encriptação NUNCA são
 * logados (NFR11 adaptado; AC6).
 *
 * Trace: AC1/AC2/AC6/AC7; arch §6 (KV schema `nexus:google:tokens`); [D-6.1-SCOPE];
 * [D-6.2-ENCRYPT]/[D-6.2-ENCRYPT-KEY]/[D-6.2-REFRESH].
 */

export interface GoogleTokenRecord {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** Chave KV singleton dos tokens Google (arch §6). */
export const GOOGLE_TOKENS_KEY = 'nexus:google:tokens';

/** Endpoint real do refresh (contrato externo Google OAuth2 — POST form-urlencoded). */
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

/**
 * Janela de refresh proactivo ([D-6.2-REFRESH]): se faltar menos do que isto para
 * o `accessToken` expirar, renova ANTES de devolver. 5 minutos.
 */
export const REFRESH_WINDOW_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Encriptação at-rest (AES-256-GCM) — [D-6.2-ENCRYPT] / [D-6.2-ENCRYPT-KEY]
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // AES-256 → 32 bytes
const IV_LENGTH = 12; // GCM → 12 bytes (96 bits) recomendado
/** Versão do formato persistido — permite migração futura sem partir leituras antigas. */
const ENVELOPE_VERSION = 1;

/**
 * Separação de domínio criptográfico (HKDF salt/info dedicados): a chave de
 * encriptação de tokens é DISTINTA da assinatura de state (`oauth-state.ts` usa
 * HMAC directo). Nunca a mesma chave para dois fins.
 */
const HKDF_SALT = 'nexus:google:token-enc';
const HKDF_INFO = 'aes-256-gcm';

/** Envelope de um campo encriptado, persistido em KV (base64). */
interface EncryptedField {
  v: number;
  iv: string;
  tag: string;
  ct: string;
}

/** Forma exacta do registo persistido em KV após a 6.2. `expiresAt` em claro. */
interface StoredTokenRecord {
  accessToken: EncryptedField;
  refreshToken: EncryptedField;
  expiresAt: number;
}

/**
 * Deriva a chave AES-256 de 32 bytes a partir de `SESSION_SECRET` via
 * HKDF-SHA256 ([D-6.2-ENCRYPT-KEY]). Nunca usa `SESSION_SECRET` cru nem um
 * simples `sha256(SESSION_SECRET)`. A chave nunca é logada.
 *
 * @throws Error se `SESSION_SECRET` ausente — em produção é erro de configuração
 *   legítimo (env.ts:16 torna-a obrigatória), não um caminho silencioso.
 */
function deriveKey(): Buffer {
  const secret = getServerEnv().SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET ausente — impossível derivar chave de encriptação de tokens.');
  }
  // hkdfSync devolve um ArrayBuffer — normalizar para Buffer.
  const derived = hkdfSync('sha256', Buffer.from(secret, 'utf8'), HKDF_SALT, HKDF_INFO, KEY_LENGTH);
  return Buffer.from(derived);
}

/** Encripta um campo de texto limpo num envelope AES-256-GCM com IV único. */
function encryptField(plaintext: string): EncryptedField {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH); // único por escrita — obrigatório em GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: ENVELOPE_VERSION,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: ct.toString('base64'),
  };
}

/**
 * Desencripta um envelope. O authTag do GCM garante detecção determinística de
 * corrupção/chave-errada: `decipher.final()` lança se a integridade falhar. O
 * caller (`getTokens`) trata a excepção como `null` (eixo c — graceful).
 */
function decryptField(field: EncryptedField): string {
  const key = deriveKey();
  const iv = Buffer.from(field.iv, 'base64');
  const tag = Buffer.from(field.tag, 'base64');
  const ct = Buffer.from(field.ct, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plaintext.toString('utf8');
}

/** Type guard mínimo de um envelope encriptado lido de KV (defesa contra dados legados/corrompidos). */
function isEncryptedField(value: unknown): value is EncryptedField {
  if (typeof value !== 'object' || value === null) return false;
  const f = value as Record<string, unknown>;
  return (
    typeof f.iv === 'string' &&
    typeof f.tag === 'string' &&
    typeof f.ct === 'string'
  );
}

/** Type guard do registo persistido (encriptado). */
function isStoredRecord(value: unknown): value is StoredTokenRecord {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    isEncryptedField(r.accessToken) &&
    isEncryptedField(r.refreshToken) &&
    typeof r.expiresAt === 'number'
  );
}

// ---------------------------------------------------------------------------
// Interface pública (INTOCADA desde a 6.1) — [D-6.1-SCOPE]
// ---------------------------------------------------------------------------

/**
 * Guarda (ou substitui) o registo de tokens singleton no KV, com `accessToken` e
 * `refreshToken` encriptados at-rest (AES-256-GCM) e `expiresAt` em claro (AC1).
 * O KV nunca contém os tokens em texto limpo após a 6.2 (AC6 — sem regressão).
 *
 * Pré-condição do caller (AC3, eixo b/c): só chamar após `accessToken` presente e
 * não-vazio — nunca persistir tokens parciais.
 */
export async function saveTokens(record: GoogleTokenRecord): Promise<void> {
  const stored: StoredTokenRecord = {
    accessToken: encryptField(record.accessToken),
    refreshToken: encryptField(record.refreshToken),
    expiresAt: record.expiresAt,
  };
  await kv.set(GOOGLE_TOKENS_KEY, stored);
}

/**
 * Lê e desencripta o registo de tokens singleton. Devolve `null` se:
 *   - ausente (estado `não-existente` — semântica nativa do `kv.get`);
 *   - o registo não tem a forma encriptada esperada (legado/corrompido);
 *   - a desencriptação falha (authTag GCM inválido / chave mudou) — eixo c, AC6:
 *     graceful, força re-auth, NUNCA crash nem silent corruption.
 */
export async function getTokens(): Promise<GoogleTokenRecord | null> {
  const raw = await kv.get<unknown>(GOOGLE_TOKENS_KEY);
  if (raw === null || raw === undefined) return null;
  if (!isStoredRecord(raw)) {
    // Registo presente mas sem a forma encriptada (ex.: escrita legada da 6.1 sem
    // encriptação, ou dados corrompidos). Tratar como não-existente → re-auth.
    return null;
  }

  try {
    return {
      accessToken: decryptField(raw.accessToken),
      refreshToken: decryptField(raw.refreshToken),
      expiresAt: raw.expiresAt,
    };
  } catch {
    // Desencriptação falhou (chave mudou / ciphertext corrompido). NÃO logar o
    // detalhe (poderia expor material sensível); NÃO crash. Força re-auth.
    return null;
  }
}

/**
 * Remove o registo de tokens singleton (no-op se não existir). Usado pelo flow de
 * revogação completo (revogar no Google via `revokeToken` + apagar aqui) e quando
 * o refresh devolve `invalid_grant` (refreshToken revogado externamente).
 */
export async function deleteTokens(): Promise<void> {
  await kv.del(GOOGLE_TOKENS_KEY);
}

// ---------------------------------------------------------------------------
// Refresh flow — getValidAccessToken (export NOVO da 6.2) — [D-6.2-REFRESH]
// ---------------------------------------------------------------------------

/**
 * Erro tipado lançado quando o `refreshToken` foi revogado externamente (Google
 * devolve `invalid_grant`). O caller (route / UI) distingue-o de uma falha de
 * transporte para apresentar `revogado-externo` (CTA re-autorização) vs erro
 * transitório. NÃO contém tokens.
 */
export class TokenRevokedError extends Error {
  constructor(message = 'O refresh token Google foi revogado ou é inválido (invalid_grant).') {
    super(message);
    this.name = 'TokenRevokedError';
  }
}

/** Erro tipado de falha de refresh por indisponibilidade do Google (transporte/5xx). */
export class TokenRefreshError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

interface GoogleRefreshResponse {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  // CRÍTICO: o protocolo real NÃO devolve `refresh_token` no refresh. Mesmo que
  // o campo exista (mock incorrecto), é IGNORADO — nunca sobrescreve o guardado.
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

/**
 * Obtém um `accessToken` válido, renovando-o proactivamente se necessário
 * ([D-6.2-REFRESH], janela 5 min). Único ponto de entrada de access token para
 * todo o Epic 6 (as stories 6.3+ usam isto, não `getTokens().accessToken`).
 *
 * Fluxo:
 *   1. Lê+desencripta tokens (via `getTokens`). Ausente/corrompido → `null`
 *      (estado não-ligado — o caller trata).
 *   2. Se `expiresAt - now >= 5 min` → devolve o `accessToken` actual (válido).
 *   3. Caso contrário → chama o refresh Google (`POST oauth2.googleapis.com/token`
 *      `grant_type=refresh_token`), persiste `accessToken`+`expiresAt` novos
 *      PRESERVANDO o `refreshToken` (a resposta não traz um novo — eixo b),
 *      devolve o token renovado.
 *
 * Caminhos de falha (eixo c):
 *   - `invalid_grant` (refreshToken revogado externamente) → apaga KV
 *     automaticamente (`deleteTokens`) e lança `TokenRevokedError` (não silent).
 *   - Google indisponível (transporte/5xx) → NÃO altera KV (o refreshToken
 *     continua válido — foi a rede que falhou), lança `TokenRefreshError`.
 *
 * @returns `accessToken` válido, ou `null` se não há ligação (sem tokens em KV).
 * @throws TokenRevokedError | TokenRefreshError
 */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  // Token ainda válido fora da janela de refresh → devolve directo (sem chamar Google).
  if (tokens.expiresAt - Date.now() >= REFRESH_WINDOW_MS) {
    return tokens.accessToken;
  }

  // Refresh proactivo. Chama o endpoint do Google directamente com o `fetch`
  // global (que o MSW intercepta nos testes) para controlar a fidelidade de
  // protocolo e distinguir invalid_grant (400) de falha de transporte (rede/5xx).
  const env = getServerEnv();
  const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new TokenRefreshError(
      'Credenciais OAuth Google ausentes (GOOGLE_OAUTH_CLIENT_ID/SECRET) — impossível renovar.',
    );
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  let res: Response;
  try {
    res = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (err) {
    // Falha de transporte (rede/timeout). NÃO alterar KV — o refreshToken
    // continua válido. NÃO logar tokens.
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    throw new TokenRefreshError(`Falha de rede ao renovar o access token: ${message}`);
  }

  // Inspecciona o CORPO, não só o status (lição: invalid_grant chega como 400 com
  // `{ error: 'invalid_grant' }`).
  let data: GoogleRefreshResponse;
  try {
    data = (await res.json()) as GoogleRefreshResponse;
  } catch {
    data = {};
  }

  if (!res.ok) {
    if (data.error === 'invalid_grant') {
      // RefreshToken revogado externamente — nunca mais será válido. Apaga KV
      // automaticamente (eixo b) e propaga erro tipado para a UI mostrar
      // `revogado-externo` (CTA re-auth).
      await deleteTokens();
      throw new TokenRevokedError();
    }
    // Outro erro (5xx, rate limit, etc.) → falha de transporte do ponto de vista
    // do Nexus. NÃO apaga KV.
    throw new TokenRefreshError(`Refresh recusado pelo Google (HTTP ${res.status}).`);
  }

  if (!data.access_token) {
    throw new TokenRefreshError('Resposta de refresh do Google sem access_token.');
  }

  // PRESERVA o `refreshToken` existente — a resposta de refresh NÃO traz um novo
  // (protocolo real). Mesmo que `data.refresh_token` venha presente (mock
  // incorrecto), é deliberadamente ignorado: só `tokens.refreshToken` é gravado.
  const expiresAt =
    typeof data.expires_in === 'number'
      ? Date.now() + data.expires_in * 1000
      : Date.now() + 3_600_000;

  await saveTokens({
    accessToken: data.access_token,
    refreshToken: tokens.refreshToken,
    expiresAt,
  });

  return data.access_token;
}
