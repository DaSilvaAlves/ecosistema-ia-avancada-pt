import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

/**
 * Story 4.8 (hotfix) — testes do middleware de auth (`v2/middleware.ts`).
 *
 * Cobre a LACUNA DE CAMADA que deixou passar o bug de produção: os unit tests
 * dos route handlers chamam `POST` directamente, saltando o middleware. Por isso
 * o redirect 307 de `/api/push/dispatch` para `/login` (que ocorre ANTES do
 * handler) nunca foi exercido. Estes testes exercitam `middleware()` directamente.
 *
 * Asserções:
 *   - `POST /api/push/dispatch` SEM cookie → `NextResponse.next()` (NÃO redirect).
 *     A auth real (CRON_SECRET Bearer) vive no handler e não é responsabilidade
 *     do middleware. Esta é a correcção do hotfix.
 *   - (Regressão de segurança) rotas protegidas SEM cookie → continuam a
 *     redirecionar para `/login`. Prova que a excepção é cirúrgica e não abriu
 *     buraco nas restantes rotas (incluindo `/api/push/send` cookie-auth).
 *
 * `NextRequest` é compatível com a `Request` standard; o cookie de sessão é
 * passado via header `Cookie` (mesmo padrão de `tests/unit/api/anthropic-proxy.test.ts`).
 */

function request(path: string, opts: { method?: string; cookie?: boolean } = {}): NextRequest {
  const headers = new Headers();
  if (opts.cookie) headers.set('Cookie', 'nexus_session=test-session-id');
  return new NextRequest(`https://imersao.ia.expressia.pt${path}`, {
    method: opts.method ?? 'GET',
    headers,
  });
}

/** Um redirect do middleware tem status 3xx e um header `location`. */
function isRedirect(res: { status: number; headers: Headers }): boolean {
  return res.status >= 300 && res.status < 400 && res.headers.has('location');
}

describe('middleware de auth', () => {
  describe('excepção do hotfix — /api/push/dispatch', () => {
    it('NÃO redireciona POST /api/push/dispatch sem cookie (deixa passar para o handler Bearer)', () => {
      const res = middleware(request('/api/push/dispatch', { method: 'POST' }));

      // O middleware NÃO deve interceptar: a auth CRON_SECRET vive no handler.
      expect(isRedirect(res)).toBe(false);
      expect(res.headers.get('location')).toBeNull();
      // `NextResponse.next()` sinaliza "continuar" via header interno x-middleware-next.
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });

    it('continua a deixar passar /api/push/dispatch mesmo COM cookie (idempotente)', () => {
      const res = middleware(request('/api/push/dispatch', { method: 'POST', cookie: true }));

      expect(isRedirect(res)).toBe(false);
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });
  });

  describe('regressão de segurança — rotas protegidas continuam fechadas', () => {
    it('redireciona /dashboard sem cookie para /login', () => {
      const res = middleware(request('/dashboard'));

      expect(isRedirect(res)).toBe(true);
      const location = res.headers.get('location');
      expect(location).not.toBeNull();
      expect(new URL(location as string).pathname).toBe('/login');
    });

    it('redireciona /api/push/send sem cookie para /login (send é cookie-auth, NÃO foi exemptado)', () => {
      const res = middleware(request('/api/push/send', { method: 'POST' }));

      expect(isRedirect(res)).toBe(true);
      expect(new URL(res.headers.get('location') as string).pathname).toBe('/login');
    });

    it('redireciona /api/push/subscribe sem cookie para /login (subscribe é cookie-auth)', () => {
      const res = middleware(request('/api/push/subscribe', { method: 'POST' }));

      expect(isRedirect(res)).toBe(true);
      expect(new URL(res.headers.get('location') as string).pathname).toBe('/login');
    });

    it('deixa passar rota protegida COM cookie de sessão presente', () => {
      const res = middleware(request('/dashboard', { cookie: true }));

      expect(isRedirect(res)).toBe(false);
      expect(res.headers.get('x-middleware-next')).toBe('1');
    });
  });

  describe('paths públicos pré-existentes (sem regressão)', () => {
    it('deixa passar /login sem cookie', () => {
      const res = middleware(request('/login'));
      expect(isRedirect(res)).toBe(false);
    });

    it('deixa passar /api/auth/login sem cookie', () => {
      const res = middleware(request('/api/auth/login', { method: 'POST' }));
      expect(isRedirect(res)).toBe(false);
    });
  });
});
