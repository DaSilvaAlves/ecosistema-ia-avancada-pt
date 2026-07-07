import { nexusIcon } from '@/app/icons/_lib/icon-image';

/**
 * Nexus v2 — apple-touch-icon 180×180 (Story 9.4). Servido em
 * `/icons/apple-touch-icon`, coberto pelo prefixo público `/icons/`.
 * Referenciado por `metadata.icons.apple` em `app/layout.tsx` → o Next
 * injecta `<link rel="apple-touch-icon">` no `<head>` para iOS.
 */

export const runtime = 'edge';

export function GET(): Response {
  return nexusIcon(180);
}
