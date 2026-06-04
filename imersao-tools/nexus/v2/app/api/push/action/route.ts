import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import {
  listSchedules,
  markScheduleSent,
  putSchedule,
} from '@/lib/push/schedule-store';

/**
 * Nexus v2 — Acção de notificação push aplicada ao mirror KV (Story 4.9, AC7)
 *
 * Endpoint **cookie-auth** (`getSession` → 401), igual ao `/api/push/schedule`.
 * Chamado pelo Service Worker (`public/sw.js`) no handler `notificationclick`,
 * que corre same-origin no browser do utilizador autenticado — o `fetch` envia
 * o cookie de sessão automaticamente (default same-origin credentials;
 * `SameSite=Strict` envia em requisições same-origin). Decisão D-ACTION-AUTH-COOKIE
 * (revoga D-ACTION-AUTH/CRON_SECRET, que estava funcionalmente quebrada — o secret
 * nunca era injectado no SW estático → 401 sempre — e exporia no cliente o secret
 * que protege o `/api/push/dispatch`).
 *
 *   - `marcar-feito` — marca a entrada `sent` no mirror (`markScheduleSent`); a
 *     reconciliação on-mount (`reconcileSentReminders`, 4.8) traz o `sent` para
 *     Dexie na próxima abertura da app. Entrada ausente → idempotente
 *     (`{ok:true, applied:false}`, 200): perder um "marcar feito" de uma entrada
 *     já removida é inofensivo (já foi reconciliada como `sent`).
 *   - `snooze`       — reescreve `fireAt = now + snoozeMinutes*60_000` mantendo
 *     `status: 'pending'` E gravando `snoozedAt = Date.now()` (marcador dedicado;
 *     `putSchedule`). A entrada NÃO é removida — aguarda o próximo disparo do
 *     scheduler (re-dispara por `fireAt`). A reconciliação on-mount
 *     (`reconcileSnoozedReminders`, AC10/AC11) marca `snoozed` em Dexie SÓ para
 *     entradas com `snoozedAt`. Entrada ausente → **409 `schedule-gone`**: o SW
 *     só envia `reminderId` (não tem `text`/`fireAt` para recriar a entrada),
 *     por isso o snooze NÃO pode ser silenciado — o SW (postAction) trata o 409
 *     como falha e a app reconcilia o estado real no próximo mount.
 *     D-SNOOZE-CONTRACT (Architect Gate Iter 3 — revoga D-RECON-SNOOZE-KEEP). A
 *     assimetria entre as duas acções (marcar-feito 200 vs snooze 409 quando
 *     ausente) é deliberada.
 *
 * Node runtime: `@vercel/kv` no store, `getSession` em KV (ADR-1).
 * Segurança (NFR5): cookie HttpOnly; o `/api/push/dispatch` (cron, server-to-server)
 * mantém o `CRON_SECRET` Bearer — os dois caminhos de auth separam-se.
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
      // Entrada ausente — a bifurcação por acção é deliberada (D-SNOOZE-CONTRACT):
      if (action === 'marcar-feito') {
        // Idempotente: a entrada já foi reconciliada e removida do mirror — perder
        // um "marcar feito" é inofensivo. 200 para o SW não re-tentar inutilmente.
        return NextResponse.json({ ok: true, applied: false });
      }
      // `snooze` com entrada ausente NÃO pode ser silenciado: o SW só envia
      // `reminderId` (sem `text`/`fireAt` para recriar a entrada). Devolve 409 →
      // o SW trata como falha e a app reconcilia o estado real no próximo mount.
      return NextResponse.json(
        { ok: false, error: 'schedule-gone' },
        { status: 409 }
      );
    }

    if (action === 'marcar-feito') {
      await markScheduleSent(entry);
      return NextResponse.json({ ok: true, applied: true });
    }

    // action === 'snooze' — reescreve fireAt mantendo `pending` e grava o marcador
    // dedicado `snoozedAt` (D-SNOOZE-CONTRACT). A reconciliação on-mount actua só
    // sobre entradas com `snoozedAt`; o dispatch ignora-o e re-dispara por `fireAt`.
    const minutes = snoozeMinutes ?? 10;
    const fireAt = Date.now() + minutes * 60_000;
    await putSchedule({ ...entry, fireAt, status: 'pending', snoozedAt: Date.now() });
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
