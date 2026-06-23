import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/shared/env';
import { secretsMatch, extractBearer } from '@/lib/push/cron-auth';
import { sendMessage } from '@/lib/telegram/bot-api';
import { listSchedules } from '@/lib/push/schedule-store';
import {
  DEFAULT_BRIEFING_HOUR_START,
  DEFAULT_BRIEFING_HOUR_END,
  isWithinBriefingWindow,
  lisbonDateKey,
  getBriefingLastSent,
  setBriefingLastSent,
  remindersForDay,
  buildBriefingText,
} from '@/lib/telegram/briefing';

/**
 * Nexus v2 — Briefing matinal por Telegram (Story 6.16 — FR74/FR75/FR89)
 *
 * Rota `POST /api/telegram/briefing` — gera e entrega via Telegram um briefing do
 * estado do dia. Disparada por scheduler externo (cron-job.org, server-to-server,
 * de hora a hora entre 07h-09h), NÃO por Vercel Cron nativo — a app é agnóstica à
 * origem do trigger ([D-6.5-CRON-CONFIG], `vercel.json` sem `crons`). Protegida por
 * `CRON_SECRET` Bearer timing-safe (sem cookie). Paralelo exacto de `cron/sync`.
 *
 * Node runtime (ADR-1): importa `@vercel/kv` (briefing-store + schedule-store) e
 * `sendMessage` (Bot API via `fetch`) — Node-only.
 *
 * Decisões do Architect Gate de Entrada (Aria):
 *   - [D-6.16-BRIEFING-SCHEDULE] (C8): janela `[start, end[` em `Europe/Lisbon`
 *     via `Intl` (robusto a DST), configurável por `BRIEFING_HOUR_START/END`.
 *   - [D-6.16-BRIEFING-CONTENT] (C10): conteúdo SÓ de fontes server-side
 *     (lembretes do dia via `listSchedules`); conteúdo rico de Dexie diferido com
 *     1 linha honesta (Artigo IV — zero invenção). REC-6.16-BRIEFING-RICH.
 *   - [D-6.16-STATE-CONTRACT] (C9): `last_sent` (data Lisboa) gravado SÓ após
 *     `sendMessage` OK — briefing falhado não bloqueia o re-envio.
 *   - [D-6.16-CHAT-ID] (C11): `TELEGRAM_CHAT_ID` ausente → `console.error` + 200
 *     `{ok:false}`, NUNCA `sendMessage` com `chat_id` vazio.
 *
 * Contrato de status codes (C7, resolução Obs-1 — padrão `cron/sync`): 200 sempre
 * no caminho normal E falha parcial (`{ok:false,reason}`); 401 token errado; 503
 * `CRON_SECRET` ausente ou `getServerEnv()` lança; NUNCA 5xx no catch de lote
 * (200 `{ok:false,reason:'internal_error'}`) — evita re-agendamento em rajada.
 *
 * Trace: Story 6.16 AC6-AC10; condições C6-C11.
 */

export const runtime = 'nodejs';

type BriefingResult =
  | { ok: true; sent: true }
  | {
      ok: false;
      reason: 'outside_window' | 'already_sent' | 'send_failed' | 'no_chat_id' | 'internal_error';
    };

export async function POST(req: Request): Promise<Response> {
  // (C6) Auth `CRON_SECRET` Bearer timing-safe, fail-closed. `getServerEnv()` pode
  // LANÇAR na validação Zod (env inválido em prod) — o try/catch garante que config
  // ausente e config inválida terminam IDENTICAMENTE no mesmo 503 (padrão cron/sync).
  let env: ReturnType<typeof getServerEnv>;
  try {
    env = getServerEnv();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[telegram/briefing] configuração de ambiente inválida:', message);
    return NextResponse.json(
      { error: 'Serviço de briefing indisponível.' },
      { status: 503 },
    );
  }

  const cronSecret = env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[telegram/briefing] CRON_SECRET ausente na configuração');
    return NextResponse.json(
      { error: 'Serviço de briefing indisponível.' },
      { status: 503 },
    );
  }

  const provided = extractBearer(req.headers.get('authorization'));
  if (provided === null || !secretsMatch(provided, cronSecret)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const now = new Date();

    // (C8) Janela horária `[start, end[` em Lisboa (robusto a DST).
    const start = env.BRIEFING_HOUR_START ?? DEFAULT_BRIEFING_HOUR_START;
    const end = env.BRIEFING_HOUR_END ?? DEFAULT_BRIEFING_HOUR_END;
    if (!isWithinBriefingWindow(now, start, end)) {
      const body: BriefingResult = { ok: false, reason: 'outside_window' };
      return NextResponse.json(body, { status: 200 });
    }

    // (C9) Idempotência diária — comparada em data de Lisboa.
    // NOTA: este check-then-send-then-set NÃO é atómico. Duas invocações
    // sobrepostas no mesmo minuto podem ambas ver `last_sent !== today` e
    // enviar o briefing antes de qualquer uma gravar o marcador. Risco baixo
    // (scheduler invoca de hora a hora); lease atómico per-dia diferido em
    // REC-6.16-BRIEFING-LEASE (CR F4, aceite-diferido pelo @qa).
    const today = lisbonDateKey(now);
    const lastSent = await getBriefingLastSent();
    if (lastSent === today) {
      const body: BriefingResult = { ok: false, reason: 'already_sent' };
      return NextResponse.json(body, { status: 200 });
    }

    // (C11) `chatId` ausente → falha graciosa, sem invocar `sendMessage` vazio.
    const chatId = env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      console.error('[telegram/briefing] TELEGRAM_CHAT_ID ausente — briefing não enviado');
      const body: BriefingResult = { ok: false, reason: 'no_chat_id' };
      return NextResponse.json(body, { status: 200 });
    }

    // (C10) Conteúdo SÓ de fontes server-side — lembretes do dia (KV).
    const schedules = await listSchedules();
    const reminders = remindersForDay(schedules, now);
    const text = buildBriefingText(reminders, now);

    // (C9/C5) `sendMessage` LANÇA em `{ok:false}`/rede — só gravamos `last_sent`
    // APÓS êxito (briefing falhado não bloqueia o re-envio no próximo tick).
    try {
      await sendMessage(chatId, text);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'erro desconhecido';
      console.error('[telegram/briefing] falha ao enviar briefing:', message);
      const body: BriefingResult = { ok: false, reason: 'send_failed' };
      return NextResponse.json(body, { status: 200 });
    }

    await setBriefingLastSent(today);
    const body: BriefingResult = { ok: true, sent: true };
    return NextResponse.json(body, { status: 200 });
  } catch (err) {
    // (C7) Erro inesperado — mantém o contrato 200-sempre (padrão cron/sync), NÃO
    // 5xx (evita re-agendamento em rajada do scheduler).
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[telegram/briefing] falha inesperada:', message);
    const body: BriefingResult = { ok: false, reason: 'internal_error' };
    return NextResponse.json(body, { status: 200 });
  }
}
