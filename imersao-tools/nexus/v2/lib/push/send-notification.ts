import webpush from 'web-push';
import { getServerEnv } from '@/lib/shared/env';
import {
  deletePushSubscription,
  getPushSubscription,
} from '@/lib/push/subscriptions-store';

/**
 * Nexus v2 — Envio de Web Push (Story 4.8, AC3.1)
 *
 * Função partilhada server-only que encapsula o envio de uma notificação Web
 * Push à subscription singleton (KV). **Extraída** da lógica que vivia em
 * `app/api/push/send/route.ts` (Story 4.7) para poder ser reutilizada por dois
 * chamadores com modelos de autenticação distintos:
 *   - `/api/push/send`  — cookie-auth (teste manual + futura 4.9);
 *   - `/api/push/dispatch` — `CRON_SECRET` (scheduler, sem cookie).
 *
 * Server-only: importa `@vercel/kv` (via `subscriptions-store`) e `web-push`
 * (que usa `crypto` Node). NUNCA importar em código client.
 *
 * Segurança (NFR5): `WEB_PUSH_VAPID_PRIVATE` e `keys.auth` nunca são logados.
 *
 * Trace: Story 4.8 AC3.1; Architect Gate (a) ponto 1; ADR-1 (Node runtime).
 */

// Literal VAPID subject (RFC 8292 §3.2) — não é env var (preferência Aria, 4.7).
const VAPID_SUBJECT = 'mailto:eurico@nexus.app';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * Resultado discriminado do envio. O chamador (route handler) mapeia cada
 * `reason` para o status HTTP do seu contrato — a função em si nunca lança por
 * falha de envio (degradação graciosa, CONCERN C8.1 Pax da 4.7).
 */
export type SendResult =
  | { ok: true }
  | { ok: false; reason: 'not_configured' | 'no_subscription' | 'expired' | 'error' };

/**
 * Envia uma notificação à subscription singleton. Best-effort: traduz falhas em
 * `SendResult` em vez de lançar. Numa subscrição expirada (404/410) remove o
 * registo do KV para não voltar a tentar um endpoint morto (paridade com a 4.7).
 */
export async function sendPushNotification(
  payload: PushPayload,
): Promise<SendResult> {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC;
  const privateKey = getServerEnv().WEB_PUSH_VAPID_PRIVATE;
  if (!publicKey || !privateKey) {
    console.error('[push/send-notification] VAPID keys ausentes na configuração');
    return { ok: false, reason: 'not_configured' };
  }

  let subscription;
  try {
    subscription = await getPushSubscription();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[push/send-notification] falha ao ler subscrição do KV:', message);
    return { ok: false, reason: 'error' };
  }
  if (subscription === null) {
    return { ok: false, reason: 'no_subscription' };
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, publicKey, privateKey);
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        data: payload.data,
      }),
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';

    // Subscrição expirada/cancelada: o push service responde 404/410. Apagar o
    // registo singleton para não voltar a enviar a um endpoint morto. Best-effort:
    // uma falha do delete não muda o resultado devolvido ao chamador.
    if (
      err instanceof webpush.WebPushError &&
      (err.statusCode === 404 || err.statusCode === 410)
    ) {
      try {
        await deletePushSubscription();
        console.error(
          `[push/send-notification] subscrição expirada (HTTP ${err.statusCode}) — removida do store`,
        );
      } catch (delErr) {
        const delMessage =
          delErr instanceof Error ? delErr.message : 'erro desconhecido';
        console.error(
          '[push/send-notification] falha ao remover subscrição expirada:',
          delMessage,
        );
      }
      return { ok: false, reason: 'expired' };
    }

    console.error('[push/send-notification] falha ao enviar notificação:', message);
    return { ok: false, reason: 'error' };
  }
}
