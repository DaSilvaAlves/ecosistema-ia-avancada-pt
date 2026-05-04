import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, buildSessionCookie } from '@/lib/auth/session';

/**
 * Nexus v2 — Login endpoint (Node runtime, ADR-1)
 *
 * Story 0.6 — POST `/api/auth/login` recebe `{ password }`, valida bcrypt
 * contra `NEXUS_PASSWORD_HASH`, cria sessão em KV, define cookie HttpOnly.
 */

export const runtime = 'nodejs';

interface LoginBody {
  password?: string;
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json(
      { error: 'Body inválido — esperado JSON.' },
      { status: 400 },
    );
  }

  if (!body.password) {
    return NextResponse.json(
      { error: 'Password obrigatória.' },
      { status: 400 },
    );
  }

  const passwordHash = process.env.NEXUS_PASSWORD_HASH;
  if (!passwordHash) {
    return NextResponse.json(
      { error: 'Servidor não configurado — falta NEXUS_PASSWORD_HASH.' },
      { status: 500 },
    );
  }

  const ok = await verifyPassword(body.password, passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: 'Password incorrecta. Verifica no Vercel.' },
      { status: 401 },
    );
  }

  const sessionId = await createSession();
  const cookie = buildSessionCookie(sessionId);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie,
    },
  });
}
