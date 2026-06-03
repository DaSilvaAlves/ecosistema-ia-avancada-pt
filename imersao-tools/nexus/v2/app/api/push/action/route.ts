import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerEnv } from '@/lib/shared/env';
import { secretsMatch, extractBearer } from '@/lib/push/cron-auth';
import {
  listSchedules,
  markScheduleSent,
  putSchedule,
} from '@/lib/push/schedule-store';

/**
 * Nexus v2 — Acção de notificação push aplicada ao mirror KV (Story 4.9, AC7)
 *
 * Endpoint **sem cookie**, protegido por `CRON_SECRET` (`Authorization: Bearer`).
 * Chamado pelo Service Worker (`public/sw.js`) quando o utilizador clica num
 * botão da notificação — o SW não tem contexto de sessão, por isso reutiliza o
 * mesmo segredo Bearer do dispatch (D-ACTION-AUTH).
 *
 *   - `marcar-feito` — marca a entrada `sent` no mirror (`markScheduleSent`); a
 *     reconciliação on-mount (`reconcileSentReminders`, 4.8) traz o `sent` para
 *     Dexie na próxima abertura da app.
 *   - `snooze`       — reescreve `fireAt = now + snoozeMinutes*60_000` mantendo
 *     `status: 'pending'` (`putSchedule`); a entrada NÃO é removida — aguarda o
 *     próximo disparo do scheduler (D-RECON-SNOOZE-KEEP). A reconciliação
 *     on-mount (`reconcileSnoozedReminders`, AC10/AC11) marca `snoozed` em Dexie
 *     para feedback visual.
 *
 * Node runtime: `@vercel/kv` no store, `node:crypto` na auth (ADR-1).
 * Segurança (NFR5): `CRON_SECRET` nunca é logado; comparação timing-safe.
 *
 * Trace: Story 4.9 AC7; EPIC-4.md §5 (gate @architect — contrato externo).
 */

export const runtime = 'nodejs';

const ActionSchema = z.object({
  reminderId: z.string().uuid('reminderId deve ser UUID válido'),
  action: z.enum(['marcar-feito', 'snooze']),
  // Só relevante para `snooze`; inteiro positivo de minutos.
  snoozeMinutes: z.number().int().positive().optional(),
});

export async function POST(req: Request): Promise<Response> {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) {
    // Sem secret configurado, o endpoint nunca processa (segurança fail-closed).
    console.error('[push/action] CRON_SECRET ausente na configuração');
    return NextResponse.json(
      { error: 'Serviço de acção indisponível.' },
      { status: 503 }
    );
  }

  const provided = extractBearer(req.headers.get('authorization'));
  if (provided === null || !secretsMatch(provided, cronSecret)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
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

  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Acção inválida.' }, { status: 400 });
  }

  const { reminderId, action, snoozeMinutes } = parsed.data;

  try {
    // A entrada actual é necessária para preservar `text`/`fireAt` ao reescrever.
    const schedules = await listSchedules();
    const entry = schedules.find((s) => s.id === reminderId);
    if (!entry) {
      // O lembrete pode já ter sido reconciliado e removido do mirror — não é
      // erro (idempotência). Devolve ok para o SW não re-tentar inutilmente.
      return NextResponse.json({ ok: true, applied: false });
    }

    if (action === 'marcar-feito') {
      await markScheduleSent(entry);
      return NextResponse.json({ ok: true, applied: true });
    }

    // action === 'snooze' — reescreve fireAt mantendo `pending` (D-RECON-SNOOZE-KEEP).
    const minutes = snoozeMinutes ?? 10;
    const fireAt = Date.now() + minutes * 60_000;
    await putSchedule({ ...entry, fireAt, status: 'pending' });
    return NextResponse.json({ ok: true, applied: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[push/action] falha ao aplicar acção:', message);
    return NextResponse.json(
      { error: 'Falha ao aplicar acção.' },
      { status: 500 }
    );
  }
}
