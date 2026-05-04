import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

/**
 * Nexus v2 — Push subscribe stub (Story 0.7)
 *
 * Stub — Epic 4 implementa Web Push real (VAPID + Vercel KV).
 * Aqui apenas regista que o utilizador concedeu permissão.
 */

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<Response> {
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  // Stub — Epic 4 implementa subscribe real
  return NextResponse.json({ ok: true, stub: true });
}
