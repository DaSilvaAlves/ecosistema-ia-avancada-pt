import { nexusIcon } from '@/app/icons/_lib/icon-image';

/**
 * Nexus v2 — Ícone PWA 192×192 (Story 9.4). Servido em `/icons/icon-192`,
 * coberto pelo prefixo público `/icons/` de `middleware.ts`.
 */

export const runtime = 'edge';

export function GET(): Response {
  return nexusIcon(192);
}
