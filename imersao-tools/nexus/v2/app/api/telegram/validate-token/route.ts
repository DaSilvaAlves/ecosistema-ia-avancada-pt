import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

/**
 * Nexus v2 — Telegram token validate stub (Story 0.7)
 *
 * Stub — Epic 6 implementa validação real via `getMe` na Bot API.
 * Aqui apenas verifica formato superficial do token.
 */

export const runtime = 'nodejs';

interface Body {
  token?: string;
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
    return NextResponse.json({ error: 'Body inválido.' }, { status: 400 });
  }

  const token = body.token?.trim();
  // Telegram bot token format: <bot_id>:<35 chars hash>
  const isValidShape = typeof token === 'string' && /^\d{6,12}:[A-Za-z0-9_-]{30,}$/.test(token);

  if (!isValidShape) {
    return NextResponse.json(
      { error: 'Formato inválido — usa o token do BotFather.' },
      { status: 400 },
    );
  }

  // Stub — Epic 6 chama https://api.telegram.org/bot<token>/getMe para validar real
  return NextResponse.json({ ok: true, stub: true });
}
