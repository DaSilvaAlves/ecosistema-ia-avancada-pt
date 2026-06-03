import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/shared/env';
import { sendPushNotification } from '@/lib/push/send-notification';
import { secretsMatch, extractBearer } from '@/lib/push/cron-auth';
import {
  listSchedules,
  markScheduleSent,
  type ScheduleEntry,
} from '@/lib/push/schedule-store';

/**
 * Nexus v2 — Disparo agendado de Web Push (Story 4.8, AC2/AC3.3/AC4)
 *
 * Endpoint **sem cookie**, protegido por `CRON_SECRET` (`Authorization: Bearer`).
 * Chamado pelo scheduler (Vercel Cron `* * * * *`, ou scheduler externo — a app
 * é agnóstica à origem do trigger). Lê do mirror KV os lembretes devidos
 * (`status:'pending'`, `fireAt <= now`), envia um push por cada via
 * `sendPushNotification`, e marca-o `sent` no mirror (idempotência: a transição
 * `pending → sent` impede re-disparo na janela seguinte — AC4).
 *
 * Node runtime: `web-push`/`crypto` Node + `@vercel/kv` no store (ADR-1, GAP-4.3).
 * Segurança (NFR5): `CRON_SECRET` nunca é logado; comparação timing-safe.
 *
 * Recorrência DIFERIDA (AC5): um lembrete recorrente dispara a sua 1ª ocorrência
 * como qualquer outro; a auto-geração da próxima instância é follow-up pós-Epic-4.
 *
 * Trace: Story 4.8 AC2/AC3.3/AC4; Architect Gate (a) ponto 2; ADR-6.
 */

export const runtime = 'nodejs';

// Auth `CRON_SECRET` Bearer partilhada com `/api/push/action` (Story 4.9):
// `secretsMatch`/`extractBearer` movidas para `lib/push/cron-auth.ts`.

async function dispatchDue(now: number): Promise<{
  total: number;
  dispatched: number;
  failed: number;
}> {
  const schedules = await listSchedules();
  const due: ScheduleEntry[] = schedules.filter(
    (s) => s.status === 'pending' && s.fireAt <= now,
  );

  let dispatched = 0;
  let failed = 0;

  for (const entry of due) {
    const result = await sendPushNotification({
      title: 'Lembrete',
      body: entry.text,
      // `reminderId` permite à 4.9 accionar "marcar feito"/"snooze" no SW.
      data: { reminderId: entry.id },
    });

    if (result.ok) {
      // Idempotência (AC4): a transição `pending → sent` impede re-disparo. Só
      // marcamos `sent` quando o envio teve êxito — uma falha (sem subscrição,
      // erro) deixa o lembrete `pending` para nova tentativa no próximo tick.
      await markScheduleSent(entry);
      dispatched++;
    } else {
      failed++;
    }
  }

  return { total: due.length, dispatched, failed };
}

export async function POST(req: Request): Promise<Response> {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) {
    // Sem secret configurado, o endpoint nunca processa (segurança fail-closed).
    console.error('[push/dispatch] CRON_SECRET ausente na configuração');
    return NextResponse.json(
      { error: 'Serviço de disparo indisponível.' },
      { status: 503 }
    );
  }

  const provided = extractBearer(req.headers.get('authorization'));
  if (provided === null || !secretsMatch(provided, cronSecret)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const summary = await dispatchDue(Date.now());
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[push/dispatch] falha ao disparar lembretes:', message);
    return NextResponse.json(
      { error: 'Falha ao disparar lembretes.' },
      { status: 500 }
    );
  }
}
