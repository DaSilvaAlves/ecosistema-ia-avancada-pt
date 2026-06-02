import { kv } from '@vercel/kv';

/**
 * Nexus v2 — Store server-side da PushSubscription em Vercel KV (Story 4.7, AC6)
 *
 * Server-only: importa `@vercel/kv`. NUNCA importar em hooks, componentes ou
 * código client (a subscription não persiste em IndexedDB — Dexie é client-only
 * e não está disponível em route handlers Node).
 *
 * Identidade singleton: o Nexus tem um único utilizador (`eurico`), por isso
 * existe no máximo uma subscription. A identidade vive na própria chave KV
 * (`nexus:push:subscription:singleton`) — não há campo `id` no registo.
 * Prefixo `nexus:` obrigatório (ADR-6).
 *
 * Trace: CRIT-3 Aria; ADR-6; padrão `@vercel/kv` de `app/api/agent/undo/route.ts`.
 */

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: number;
}

const PUSH_SUBSCRIPTION_KEY = 'nexus:push:subscription:singleton';

/**
 * Guarda (ou substitui) a subscription singleton no KV.
 */
export async function savePushSubscription(sub: PushSubscriptionRecord): Promise<void> {
  await kv.set(PUSH_SUBSCRIPTION_KEY, sub);
}

/**
 * Lê a subscription singleton. Devolve `null` se ausente (semântica nativa do
 * `kv.get` — não `undefined`).
 */
export async function getPushSubscription(): Promise<PushSubscriptionRecord | null> {
  return kv.get<PushSubscriptionRecord>(PUSH_SUBSCRIPTION_KEY);
}

/**
 * Remove a subscription singleton do KV (no-op se não existir).
 */
export async function deletePushSubscription(): Promise<void> {
  await kv.del(PUSH_SUBSCRIPTION_KEY);
}
