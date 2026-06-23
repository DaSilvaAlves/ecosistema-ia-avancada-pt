import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/shared/env';
import { sendPushNotification } from '@/lib/push/send-notification';
import { secretsMatch, extractBearer } from '@/lib/push/cron-auth';
import { sendMessage } from '@/lib/telegram/bot-api';
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

// Auth `CRON_SECRET` Bearer usada APENAS por `/api/push/dispatch` (cron,
// server-to-server). O `/api/push/action` (Story 4.9) usa cookie de sessão
// same-origin (D-ACTION-AUTH-COOKIE), não este secret. `secretsMatch`/`extractBearer`
// em `lib/push/cron-auth.ts`.

/**
 * Canais de entrega efectivos de uma entrada. [D-6.16-CHANNEL-COUPLING]:
 * `channels` ausente ou vazio → `['push']` por defeito (retrocompatibilidade
 * Epic 4 — entradas escritas pela 4.8 não têm o campo). C1/C2.
 */
function effectiveChannels(entry: ScheduleEntry): Array<'push' | 'telegram'> {
  const channels: Array<'push' | 'telegram'> =
    entry.channels && entry.channels.length > 0 ? entry.channels : ['push'];
  // CR Iter 1 (F3 Minor): deduplica — um `channels` com duplicados (ex.:
  // `['push','push']`) não deve produzir entregas repetidas no mesmo tick.
  return [...new Set(channels)];
}

/**
 * Entrega um lembrete via Web Push (Epic 4). Lógica byte-a-byte preservada da
 * 4.8 (C2): `sendPushNotification` best-effort (`{ok}`/`{ok:false}` — NÃO lança);
 * o caller distingue `ok` de `!ok` (anti-M4). Devolve sucesso do canal push.
 */
async function dispatchPushChannel(entry: ScheduleEntry): Promise<boolean> {
  const result = await sendPushNotification({
    title: 'Lembrete',
    body: entry.text,
    // `reminderId` permite à 4.9 accionar "marcar feito"/"snooze" no SW.
    data: { reminderId: entry.id },
  });
  return result.ok;
}

/**
 * Entrega um lembrete via Telegram (Story 6.16 — AC1/AC4/C5). `sendMessage`
 * LANÇA em `{ok:false}`/rede (`BotApiError`) — o caller TEM de apanhar (a
 * distinção sucesso vs erro é explícita, não um shape ambíguo). Falha → regista
 * (anti-M4, observability) e devolve `false`: o canal conta como falhado, o
 * lembrete fica `pending` para nova tentativa, e o lote NÃO aborta (AC4).
 * `TELEGRAM_CHAT_ID` ausente → [D-6.16-CHAT-ID]: canal falhado gracioso, sem
 * invocar `sendMessage` com `chat_id` vazio (C11).
 */
async function dispatchTelegramChannel(entry: ScheduleEntry): Promise<boolean> {
  const chatId = getServerEnv().TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.error(
      '[push/dispatch] TELEGRAM_CHAT_ID ausente — canal telegram saltado',
      entry.id,
    );
    return false;
  }
  try {
    await sendMessage(chatId, entry.text);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error(
      '[push/dispatch] falha ao entregar lembrete via telegram:',
      entry.id,
      message,
    );
    return false;
  }
}

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
    const channels = effectiveChannels(entry);

    // Processa um lembrete de cada vez, tentando TODOS os canais declarados.
    // [D-6.16-STATE-CONTRACT] / C3: `markScheduleSent` SÓ após todos os canais
    // declarados terem sucesso (silent-loss guard M1 da 4.9). Se QUALQUER canal
    // falhar, o lembrete fica `pending` → re-tentado no próximo tick. C4 opção
    // (i): na re-tentativa o canal já bem-sucedido é re-enviado (duplicado raro,
    // nunca silent loss) — o sub-estado por canal (`sentChannels`) é o débito
    // diferido REC-6.16-SENT-CHANNELS.
    let allOk = true;
    for (const channel of channels) {
      const ok =
        channel === 'telegram'
          ? await dispatchTelegramChannel(entry)
          : await dispatchPushChannel(entry);
      if (!ok) allOk = false;
    }

    if (allOk) {
      // Idempotência (AC3/AC4): a transição `pending → sent` impede re-disparo.
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
