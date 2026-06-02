import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import {
  deletePushSubscription,
  savePushSubscription,
} from '@/lib/push/subscriptions-store';

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

  // Persistência em KV pode falhar (outage). Em vez de deixar o erro escapar
  // como 500 do framework, devolvemos um contrato JSON controlado (CR Iter 1
  // Fix #3). Nunca logamos `keys.auth`/`keys.p256dh` (NFR5).
  try {
    await savePushSubscription({
      endpoint: parsed.data.endpoint,
      keys: parsed.data.keys,
      createdAt: Date.now(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[push/subscribe] falha ao guardar subscrição:', message);
    return NextResponse.json(
      { error: 'Falha ao guardar subscrição.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

/**
 * Remove a subscription singleton do KV (CR Iter 1 Fix #5).
 *
 * O hook `usePushSubscription.unsubscribe()` invoca este path após cancelar a
 * subscrição no browser — sem ele, o endpoint/keys ficavam órfãos no KV e o
 * `POST /api/push/send` continuaria a tentar enviar a um destino abandonado.
 */
export async function DELETE(req: NextRequest): Promise<Response> {
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    await deletePushSubscription();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[push/subscribe] falha ao remover subscrição:', message);
    return NextResponse.json(
      { error: 'Falha ao remover subscrição.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
