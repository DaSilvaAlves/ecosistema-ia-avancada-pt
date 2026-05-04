import { NextRequest, NextResponse } from 'next/server';

/**
 * Nexus v2 — Auth middleware
 *
 * Story 0.6 — bloqueia acesso a rotas protegidas se cookie de sessão ausente.
 * Excepções: `/api/auth/*`, `/login`, `/_next/*`, `favicon`, manifest, sw.
 *
 * NOTA: Middleware corre em Edge runtime. Validação completa via KV é feita
 * dentro de cada handler `/api/*` (que importa `getSession`). Aqui apenas
 * verifica presença do cookie para redirect rápido.
 */

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout'];
const PUBLIC_PREFIXES = ['/_next/', '/icons/', '/favicon', '/manifest', '/sw.js', '/api/auth/'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('nexus_session')?.value;
  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, sw.js
     */
    '/((?!api/auth|_next/static|_next/image|favicon|manifest|sw).*)',
  ],
};
