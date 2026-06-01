import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { savePushSubscription } from '@/lib/push/subscriptions-store';

/**
 * Nexus v2 — Push subscribe (Story 4.7, AC8 — edição do stub da Story 0.7)
 *
 * Guarda a PushSubscription (serializada via `subscription.toJSON()`) em
 * Vercel KV. Node runtime obrigatório: `web-push`/`crypto` Node (GAP-4.3, ADR-1).
 *
 * Auth: `getSession(req)` — 401 sem sessão válida (NFR8).
 *
 * Trace: FR35; SF-1; CRIT-3 Aria; `external-contract-identifiers.md`.
 */

export const runtime = 'nodejs';

// Shape de `PushSubscription.toJSON()` (Push API). `endpoint` é uma URL HTTPS
// do serviço de push; `keys.p256dh`/`keys.auth` são strings base64url não-vazias.
const SubscribeSchema = z.object({
  endpoint: z.string().url().startsWith('https://', 'endpoint deve ser HTTPS'),
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh ausente'),
    auth: z.string().min(1, 'auth ausente'),
  }),
});

export async function POST(req: NextRequest): Promise<Response> {
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Body inválido — esperado JSON.' },
      { status: 400 }
    );
  }

  const parsed = SubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Subscription inválida.' },
      { status: 400 }
    );
  }

  await savePushSubscription({
    endpoint: parsed.data.endpoint,
    keys: parsed.data.keys,
    createdAt: Date.now(),
  });

  return NextResponse.json({ ok: true });
}
