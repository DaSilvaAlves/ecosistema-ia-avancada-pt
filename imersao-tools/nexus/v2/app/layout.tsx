import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';

/**
 * Nexus v2 — Root layout
 *
 * lang="pt-PT" (regra `language-standards.md` + UX §7.6).
 * Fundo #04040A (design-system-ia-avancada.md).
 * Fontes: Inter + JetBrains Mono (front-end-spec-v2.md §5.2).
 */

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Nexus',
  description: 'Continuidade pessoal — assistente multi-intent chat-first.',
  applicationName: 'Nexus',
  // Story 9.4 — apenas ADITIVO. `<link rel="manifest">` é auto-injectado pela
  // existência de `app/manifest.ts` (não editado aqui). Estes ícones apontam
  // para route handlers sob `/icons/*` (prefixo público de `middleware.ts`),
  // evitando as rotas de convenção `/icon`/`/apple-icon` do Next — que caem
  // FORA de `PUBLIC_PREFIXES` e seriam redireccionadas para `/login` (AC7).
  icons: {
    icon: '/icons/icon-192',
    apple: '/icons/apple-touch-icon',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#00F5FF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-PT" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body
        style={{
          background: '#04040A',
          color: '#F0F4FF',
          margin: 0,
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
