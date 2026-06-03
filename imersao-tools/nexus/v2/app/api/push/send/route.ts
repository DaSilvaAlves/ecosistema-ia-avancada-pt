import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { sendPushNotification } from '@/lib/push/send-notification';

/**
 * Nexus v2 — Push send (Story 4.7 AC9; refactor Story 4.8 AC3.1)
 *
 * Endpoint **cookie-auth** para envio manual de uma notificação (teste manual e,
 * futuramente, a Story 4.9). Story 4.8: a lógica de envio foi extraída para
 * `lib/push/send-notification.ts` (partilhada com `/api/push/dispatch`); este
 * route handler é agora um wrapper fino — **contrato externo inalterado** (mesmos
 * status codes e bodies da 4.7: 401/400/409/410/500/200).
 *
 * Node runtime obrigatório: `web-push` usa `crypto` nativo Node (GAP-4.3, ADR-1).
 * Segurança (NFR5): nenhum secret é logado (o logging vive em `send-notification`).
 *
 * Trace: FR34; Story 4.8 AC3.1; Architect Gate (a) ponto 1.
 */

export const runtime = 'nodejs';

const SendSchema = z.object({
  title: z.string().min(1, 'title ausente'),
  body: z.string().min(1, 'body ausente'),
  data: z.record(z.string(), z.unknown()).optional(),
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
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 });
  }

  const result = await sendPushNotification(parsed.data);
  if (result.ok) {
    return NextResponse.json({ ok: true });
  }

  // Mapeamento preservado da Story 4.7 (contrato externo inalterado).
  switch (result.reason) {
    case 'not_configured':
      return NextResponse.json(
        { error: 'Serviço de notificações indisponível.' },
        { status: 500 }
      );
    case 'no_subscription':
      return NextResponse.json({ error: 'no_subscription' }, { status: 409 });
    case 'expired':
      return NextResponse.json({ error: 'Subscrição expirada.' }, { status: 410 });
    case 'error':
    default:
      return NextResponse.json(
        { error: 'Falha ao enviar notificação.' },
        { status: 500 }
      );
  }
}
