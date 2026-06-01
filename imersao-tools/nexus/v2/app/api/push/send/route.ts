import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import webpush from 'web-push';
import { getSession } from '@/lib/auth/session';
import { getServerEnv } from '@/lib/shared/env';
import { getPushSubscription } from '@/lib/push/subscriptions-store';

/**
 * Nexus v2 — Push send (Story 4.7, AC9)
 *
 * Envia uma notificação Web Push para a subscription singleton guardada em KV.
 * Endpoint interno: a Story 4.8 invoca-o para disparar lembretes agendados (D5).
 * Esta story entrega só a infra de envio — o agendamento é da 4.8 (GAP-4.6).
 *
 * Node runtime obrigatório: `web-push` usa `crypto` nativo Node, incompatível
 * com Edge runtime da Vercel (GAP-4.3, ADR-1).
 *
 * Segurança (NFR5): `WEB_PUSH_VAPID_PRIVATE` e `keys.auth` nunca são logados.
 *
 * Trace: FR34; D5; CONCERN C8.1 Pax (degradação graciosa se KV indisponível).
 */

export const runtime = 'nodejs';

// Literal VAPID subject (RFC 8292 §3.2) — não é env var (preferência Aria).
const VAPID_SUBJECT = 'mailto:eurico@nexus.app';

const SendSchema = z.object({
  title: z.string().min(1, 'title ausente'),
  body: z.string().min(1, 'body ausente'),
  data: z.record(z.unknown()).optional(),
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

  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Payload inválido.' },
      { status: 400 }
    );
  }

  // Config VAPID — ausência é erro de configuração (500), nunca expõe valores.
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC;
  const privateKey = getServerEnv().WEB_PUSH_VAPID_PRIVATE;
  if (!publicKey || !privateKey) {
    console.error('[push/send] VAPID keys ausentes na configuração');
    return NextResponse.json(
      { error: 'Serviço de notificações indisponível.' },
      { status: 500 }
    );
  }

  try {
    const subscription = await getPushSubscription();
    if (subscription === null) {
      return NextResponse.json({ error: 'no_subscription' }, { status: 409 });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey);
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: parsed.data.title,
        body: parsed.data.body,
        data: parsed.data.data,
      })
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Degradação graciosa (C8.1): KV indisponível, push service a recusar, etc.
    // Loga só a mensagem do erro — nunca secrets nem o corpo da subscription.
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[push/send] falha ao enviar notificação:', message);
    return NextResponse.json(
      { error: 'Falha ao enviar notificação.' },
      { status: 500 }
    );
  }
}
