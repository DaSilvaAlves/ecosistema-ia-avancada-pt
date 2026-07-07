import { nexusIcon } from '@/app/icons/_lib/icon-image';

/**
 * Nexus v2 — Ícone PWA 512×512 (Story 9.4). Servido em `/icons/icon-512`,
 * coberto pelo prefixo público `/icons/` de `middleware.ts`.
 *
 * `force-static`: o glyph é determinístico (SVG estático, sem input de request),
 * pelo que o Next 15 gera o ícone UMA vez no build e serve-o como asset estático
 * cacheável — nunca regenera por request. Sem `runtime = 'edge'` (incompatível
 * com geração estática no build: edge é request-time).
 */

export const dynamic = 'force-static';

export function GET(): Response {
  return nexusIcon(512);
}
