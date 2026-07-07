import { nexusIcon } from '@/app/icons/_lib/icon-image';

/**
 * Nexus v2 — Ícone PWA 512×512 maskable (Story 9.4). Servido em
 * `/icons/icon-maskable-512`, coberto pelo prefixo público `/icons/`.
 * Glyph dentro da zona-segura central (~80%) para não ser cortado em
 * launchers Android.
 */

export const runtime = 'edge';

export function GET(): Response {
  return nexusIcon(512, { maskable: true });
}
