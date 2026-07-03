import type { NextConfig } from 'next';

/**
 * Nexus v2 — Next.js configuration
 *
 * Inclui security headers conforme architecture-v2.md §9.4.
 * CSP permite apenas connect-src para api.anthropic.com e api.telegram.org.
 * Microfone permitido (Web Speech API). Câmara/geolocation negados.
 */
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'microphone=(self), camera=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "font-src 'self' fonts.gstatic.com",
      "img-src 'self' data: blob: https://avatars.githubusercontent.com",
      "connect-src 'self' https://api.anthropic.com https://api.telegram.org https://query1.finance.yahoo.com https://api.allorigins.win https://api.github.com",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Vários package-lock.json acima deste directório (monorepo) — fixa a raiz
  // do file tracing ao projecto para o Next não inferir a raiz errada.
  outputFileTracingRoot: __dirname,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
