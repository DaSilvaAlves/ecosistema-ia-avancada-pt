import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Nexus v2 — Auth `CRON_SECRET` Bearer para o endpoint cron `/api/push/dispatch`
 * (Story 4.8, extraído na Story 4.9)
 *
 * Extraído da lógica inline de `/api/push/dispatch` (Story 4.8) para um módulo
 * server-only. Usado **apenas** pelo `/api/push/dispatch` — chamado pelo
 * scheduler externo (cron-job.org), server-to-server, sem cookie de sessão.
 *
 * Nota (Story 4.9, D-ACTION-AUTH-COOKIE): o `/api/push/action` foi inicialmente
 * desenhado para reutilizar este Bearer (D-ACTION-AUTH), mas essa decisão foi
 * revogada — esse endpoint passou a auth por cookie de sessão (`getSession`),
 * porque o Service Worker corre same-origin no browser autenticado. Este módulo
 * deixou de ser partilhado: o `CRON_SECRET` é server-to-server e nunca vive no
 * cliente.
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
