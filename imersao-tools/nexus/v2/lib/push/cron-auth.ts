import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Nexus v2 — Auth partilhada `CRON_SECRET` Bearer para endpoints cookie-less
 * (Story 4.9, D-ACTION-AUTH)
 *
 * Extraído da lógica inline de `/api/push/dispatch` (Story 4.8) para ser
 * reutilizado pelo `/api/push/action` (Story 4.9). Ambos os endpoints são
 * chamados sem cookie de sessão — o dispatch pelo scheduler, o action pelo
 * Service Worker — e partilham o mesmo `CRON_SECRET` (`Authorization: Bearer`).
 *
 * Server-only (`node:crypto`). NUNCA importar em código client.
 *
 * Segurança (NFR5): o segredo nunca é logado; a comparação é timing-safe.
 */

/**
 * Comparação timing-safe de dois segredos. Hash SHA-256 de ambos antes de
 * comparar para (a) igualar o comprimento (evita o `throw` de `timingSafeEqual`
 * e o leak do comprimento) e (b) manter tempo constante.
 */
export function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** Extrai o token de um header `Authorization: Bearer <token>`. */
export function extractBearer(header: string | null): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}
