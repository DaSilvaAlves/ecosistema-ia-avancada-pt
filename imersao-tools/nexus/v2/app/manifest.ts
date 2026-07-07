import type { MetadataRoute } from 'next';

/**
 * Nexus v2 — Web App Manifest PWA (Story 9.4)
 *
 * Função pura tipada `MetadataRoute.Manifest`. O Next 15 serve-a
 * automaticamente em `/manifest.webmanifest` e injecta
 * `<link rel="manifest">` no `<head>` — sem edição de JSX em `layout.tsx`.
 *
 * Cores do design-system (`design-system-ia-avancada.md`, AC4):
 *   - background_color `#04040A` (fundo inegociável)
 *   - theme_color `#00F5FF` (Cyan — mesmo valor de `viewport.themeColor`
 *     em `layout.tsx`, reutilizado, nunca divergente).
 *
 * Ícones servidos por route handlers sob `/icons/*` (cobertos pelo prefixo
 * público `/icons/` de `middleware.ts` — AC7, sem edição do middleware).
 */

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nexus',
    short_name: 'Nexus',
    description: 'Continuidade pessoal — assistente multi-intent chat-first.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#04040A',
    theme_color: '#00F5FF',
    lang: 'pt-PT',
    dir: 'ltr',
    categories: ['productivity'],
    icons: [
      {
        src: '/icons/icon-192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
