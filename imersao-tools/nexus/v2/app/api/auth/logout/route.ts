import { NextRequest } from 'next/server';
import { getSession, destroySession, buildClearSessionCookie } from '@/lib/auth/session';

/**
 * Nexus v2 — Logout endpoint (Node runtime)
 *
 * Story 0.6 — invalida sessão no KV e apaga cookie no client.
 */

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<Response> {
  const session = await getSession(req);
  if (session.valid && session.sessionId) {
    await destroySession(session.sessionId);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': buildClearSessionCookie(),
    },
  });
}
