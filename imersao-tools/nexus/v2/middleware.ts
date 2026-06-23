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
 *
 * Story 4.8 (hotfix) — `/api/push/dispatch` é exemptado do redirect de cookie.
 * É um endpoint sem cookie, chamado por um scheduler (Vercel Cron / cron-job.org)
 * que nunca traz `nexus_session`. Sem a excepção, o middleware redireciona o POST
 * para `/login` (307) e o handler nunca corre — o disparo server-side de Web Push
 * fica não-funcional. A excepção NÃO abre buraco: o handler impõe a sua própria
 * auth `CRON_SECRET` (`Authorization: Bearer`, comparação timing-safe; 503 se o
 * secret estiver ausente, 401 se o Bearer estiver errado). "Público" aqui significa
 * apenas "salta o redirect de cookie" — mesmo padrão de `/api/auth/login`. Só o
 * dispatch é Bearer-auth cookie-less; `send`/`subscribe`/`schedule` são cookie-auth
 * do browser e mantêm-se protegidos.
 *
 * Story 6.12 (C6b — achado `@architect`, paralelo EXACTO ao hotfix 4.8) —
 * `/api/telegram/webhook` é exemptado do redirect de cookie. O Telegram entrega o
 * update por POST cookieless (nunca traz `nexus_session`); sem a excepção o
 * middleware redireccionava-o para `/login` (307) e o handler nunca corria → bot
 * mudo em produção. A excepção NÃO abre buraco: a auth real é o `secret_token`
 * (`x-telegram-bot-api-secret-token`) imposto no próprio handler (fail-closed →
 * 403 incondicional se o segredo estiver ausente), exactamente como o dispatch usa
 * `CRON_SECRET`. Os testes Vitest chamam `POST` directamente (não passam pelo
 * middleware) → não apanhariam este caminho (falsa-confiança M4 da 4.9): a
 * exempção é verificada por revisão de `middleware.ts` + preview manual.
 *
 * Story 6.13 (C11 — achado `@architect`, paralelo EXACTO ao 4.8/6.12) —
 * `/api/telegram/process-text` (bridge Node texto → cérebro) é exemptado do
 * redirect de cookie. O webhook Edge cookieless chama-o fire-and-forget (sem
 * `nexus_session`); sem a excepção o middleware redireccionava o POST interno para
 * `/login` (307) e o cérebro nunca corria → bot mudo. A excepção NÃO abre buraco: o
 * bridge impõe a sua própria auth via shared-secret header (`x-telegram-bridge-secret`
 * contra `TELEGRAM_WEBHOOK_SECRET`, fail-closed → 403 incondicional se o segredo
 * estiver ausente), exactamente como o dispatch usa `CRON_SECRET` e o webhook usa o
 * `secret_token`.
 *
 * Story 6.14 (C4 — achado `@architect`, paralelo EXACTO ao 4.8/6.12/6.13) —
 * `/api/telegram/process-voice` (bridge Node voz → resposta de diferimento) é
 * exemptado do redirect de cookie pela MESMA razão: o webhook Edge cookieless
 * chama-o fire-and-forget; sem a excepção o middleware redireccionava o POST interno
 * para `/login` (307) e o canal de voz ficava mudo em produção. A excepção NÃO abre
 * buraco: o bridge impõe a sua própria auth via o mesmo shared-secret header
 * (`x-telegram-bridge-secret` contra `TELEGRAM_WEBHOOK_SECRET`, fail-closed → 403
 * incondicional se o segredo estiver ausente).
 *
 * Story 6.16 (C13 — achado `@architect`, paralelo EXACTO ao hotfix 4.8) —
 * `/api/telegram/briefing` (endpoint Node do briefing matinal) é exemptado do
 * redirect de cookie. É chamado por scheduler externo (cron-job.org)
 * server-to-server, sem cookie de sessão; sem a excepção o middleware
 * redireccionava o POST para `/login` (307) e o briefing nunca corria. A excepção
 * NÃO abre buraco: o handler impõe a sua própria auth `CRON_SECRET` (`Authorization:
 * Bearer`, timing-safe; 503 se o secret estiver ausente, 401 se o Bearer estiver
 * errado), exactamente como o `/api/push/dispatch`. Os testes Vitest chamam `POST`
 * directamente (não passam pelo middleware) — a exempção é verificada por revisão
 * de `middleware.ts` (paralelo ao 4.8/6.12/6.13/6.14, M4 da 4.9).
 */

const PUBLIC_PATHS = [
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/push/dispatch',
  '/api/telegram/webhook',
  '/api/telegram/process-text',
  '/api/telegram/process-voice',
  '/api/telegram/briefing',
];
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
