import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

/**
 * Nexus v2 — Onboarding complete (Story 0.7)
 *
 * Marca flag `nexus:onboarding:done = true` em Vercel KV.
 * Em dev local sem KV, o client-side já guarda em localStorage como fallback.
 *
 * Issue should-fix Pax — endpoint stub explícito para que o client tenha
 * receptor mesmo antes de Epic 6 implementar lógica real de tracking.
 */

export const runtime = 'nodejs';

interface Body {
  name?: string;
  pushDeclined?: boolean;
}

export async function POST(req: NextRequest): Promise<Response> {
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    body = {};
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const data = JSON.stringify({
        done: true,
        name: body.name ?? 'Eurico',
        pushDeclined: body.pushDeclined ?? false,
        completedAt: Date.now(),
      });
      await fetch(`${kvUrl}/set/nexus:onboarding:done/${encodeURIComponent(data)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${kvToken}` },
      });
    } catch {
      // Não bloqueia o fluxo — client mantém flag em localStorage
    }
  }

  return NextResponse.json({ ok: true });
}
