import { kv } from '@vercel/kv';

/**
 * Nexus v2 — Store server-side dos tokens OAuth Google em Vercel KV (Story 6.1, T3)
 *
 * SEAM de [D-6.1-SCOPE]: a 6.1 escreve os tokens em KV **sem encriptação
 * at-rest**. A 6.2 (GAP-6.2) reimplementa o INTERIOR destas três funções para
 * adicionar a camada de encriptação at-rest — SEM mudar a interface
 * (`saveTokens`/`getTokens`/`deleteTokens`). Por isso os callers (callback route,
 * status route) NUNCA acedem ao `kv` directamente para tokens: usam este store.
 * Isto garante que a 6.2 troca a implementação com zero refactor dos callers.
 *
 * REC-6.1-ENCRYPT (débito explícito da 6.2): a janela em que os tokens vivem sem
 * encriptação aplicacional é aceitável neste perfil (single-user, test mode
 * permanente, KV Upstash já encriptado at-rest ao nível do fornecedor + acesso
 * por `KV_REST_API_TOKEN` server-only + TLS). Não é uma omissão — é fronteira
 * deliberada do epic.
 *
 * Server-only: importa `@vercel/kv`. NUNCA importar em código client.
 *
 * Identidade singleton: o Nexus tem um único utilizador (`eurico`) — no máximo um
 * registo de tokens. A identidade vive na chave KV (`nexus:google:tokens`).
 * Prefixo `nexus:` obrigatório (ADR-6). Schema arch §6.
 *
 * Segurança: `accessToken`/`refreshToken` NUNCA são logados (NFR11 adaptado).
 *
 * Trace: AC3; arch §6 (KV schema `nexus:google:tokens`); [D-6.1-SCOPE]; padrão
 * `@vercel/kv` de `lib/push/subscriptions-store.ts`.
 */

export interface GoogleTokenRecord {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** Chave KV singleton dos tokens Google (arch §6). */
export const GOOGLE_TOKENS_KEY = 'nexus:google:tokens';

/**
 * Guarda (ou substitui) o registo de tokens singleton no KV.
 *
 * Pré-condição do caller (AC3, eixo b/c): só chamar após `accessToken` presente e
 * não-vazio — nunca persistir tokens parciais. Este store não revalida (a
 * validação é do `exchangeCode`), mas a interface assume tokens completos.
 */
export async function saveTokens(record: GoogleTokenRecord): Promise<void> {
  await kv.set(GOOGLE_TOKENS_KEY, record);
}

/**
 * Lê o registo de tokens singleton. Devolve `null` se ausente (semântica nativa
 * do `kv.get` — não `undefined`). Estado `não-existente` do ciclo de vida
 * (`internal-state-contract-gate.md` eixo a).
 */
export async function getTokens(): Promise<GoogleTokenRecord | null> {
  return kv.get<GoogleTokenRecord>(GOOGLE_TOKENS_KEY);
}

/**
 * Remove o registo de tokens singleton (no-op se não existir). O flow de
 * revogação completo (revogar no Google + apagar aqui) é da 6.2.
 */
export async function deleteTokens(): Promise<void> {
  await kv.del(GOOGLE_TOKENS_KEY);
}
