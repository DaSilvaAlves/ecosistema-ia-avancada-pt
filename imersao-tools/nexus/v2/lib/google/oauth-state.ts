import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { kv } from '@vercel/kv';
import { getServerEnv } from '@/lib/shared/env';

/**
 * Nexus v2 — State OAuth assinado HMAC-SHA256 + store KV single-use (Story 6.1, T2/T3)
 *
 * [D-6.1-PKCE] Opção (A): o state é um token opaco assinado com
 * `crypto.createHmac('sha256', SESSION_SECRET)`, armazenado em KV com TTL 600s e
 * validado no callback. Protege o callback contra CSRF (RFC 9700 §2.1 aceita
 * state assinado como mitigação suficiente para confidential clients).
 *
 * Condições vinculativas do gate ([D-6.1-PKCE]):
 *   1. HMAC usa `SESSION_SECRET` via `getServerEnv()` — nunca `process.env` cru.
 *   2. State é SINGLE-USE: o callback apaga a entrada KV após validação,
 *      ANTES da troca de code (eixo b — evita replay do state).
 *   3. State inclui nonce aleatório (`randomUUID`) — o HMAC é sobre o nonce, não
 *      sobre valor previsível.
 *   4. Comparação do HMAC em tempo constante (`timingSafeEqual`).
 *
 * Server-only (`node:crypto` + `@vercel/kv`). NUNCA importar em código client.
 *
 * Trace: AC1/AC2/AC6; arch §16 (state assinado com SESSION_SECRET); [D-6.1-PKCE];
 * `internal-state-contract-gate.md` eixos a/b/c.
 */

/** TTL do state em KV (10 min) — condição [D-6.1-PKCE]. */
export const OAUTH_STATE_TTL_SECONDS = 600;

const STATE_KEY_PREFIX = 'nexus:google:oauth-state:';

/** Formato do state na wire: `<nonce>.<hmac-hex>`. */
const STATE_SEPARATOR = '.';

function stateKvKey(state: string): string {
  return `${STATE_KEY_PREFIX}${state}`;
}

/** Assina um nonce com HMAC-SHA256(SESSION_SECRET). Hex. */
function signNonce(nonce: string): string {
  const secret = getServerEnv().SESSION_SECRET;
  if (!secret) {
    // Em produção `SESSION_SECRET` é obrigatório (env.ts:16); ausência é erro de
    // configuração, não um caminho silencioso.
    throw new Error('SESSION_SECRET ausente — impossível assinar state OAuth.');
  }
  return createHmac('sha256', secret).update(nonce).digest('hex');
}

/**
 * Gera um state assinado novo, armazena-o em KV (single-use, TTL 600s) e devolve
 * o token a colocar no `generateAuthUrl`. O valor guardado em KV é o nonce — a
 * sua presença prova que o state foi emitido por um pedido legítimo.
 */
export async function createSignedState(): Promise<string> {
  const nonce = randomUUID();
  const signature = signNonce(nonce);
  const state = `${nonce}${STATE_SEPARATOR}${signature}`;

  await kv.set(stateKvKey(state), nonce, { ex: OAUTH_STATE_TTL_SECONDS });

  return state;
}

/**
 * Comparação timing-safe de duas assinaturas hex de igual comprimento esperado.
 * Devolve `false` em vez de lançar quando o comprimento difere (assinatura
 * forjada com tamanho errado) — `timingSafeEqual` lança se os buffers diferem em
 * tamanho.
 */
function signaturesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Valida e CONSOME um state recebido no callback (single-use). Trata todos os
 * caminhos de falha como inválido (eixo a/c — nunca tratar ausente como sucesso):
 *
 * - state ausente/malformado → `false`
 * - assinatura HMAC inválida → `false` (não consome KV — não houve entrada
 *   legítima a apagar; um atacante não deve poder apagar entradas)
 * - state não presente em KV (expirado / nunca emitido / já usado) → `false`
 * - state válido E presente em KV → apaga a entrada (single-use) e devolve `true`
 *
 * O apagamento ocorre ANTES de o caller trocar o code (condição [D-6.1-PKCE] 2 /
 * eixo b — evita replay).
 *
 * @returns `true` apenas se o state é autêntico, não expirado e ainda não usado.
 */
export async function verifyAndConsumeState(state: string | null): Promise<boolean> {
  if (!state) return false;

  const sepIndex = state.indexOf(STATE_SEPARATOR);
  if (sepIndex <= 0) return false;

  const nonce = state.slice(0, sepIndex);
  const signature = state.slice(sepIndex + 1);
  if (!nonce || !signature) return false;

  // 1. Verificação criptográfica (timing-safe) — barata, sem I/O.
  const expectedSignature = signNonce(nonce);
  if (!signaturesMatch(signature, expectedSignature)) return false;

  // 2. Verificação de presença + single-use em KV. Mesmo com assinatura válida,
  // se a entrada não existe (expirou ou já foi consumida) → inválido (eixo b:
  // replay do state após uso → falha, não sucesso silencioso).
  const stored = await kv.get<string>(stateKvKey(state));
  if (stored !== nonce) return false;

  // 3. Consumir (single-use) antes de devolver sucesso.
  await kv.del(stateKvKey(state));
  return true;
}
