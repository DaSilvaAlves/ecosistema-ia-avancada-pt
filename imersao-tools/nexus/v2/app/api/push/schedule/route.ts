import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import {
  ScheduleEntrySchema,
  deleteSchedule,
  listSchedules,
  putSchedule,
} from '@/lib/push/schedule-store';

/**
 * Nexus v2 — Mirror de agenda de lembretes (Story 4.8, AC3.2)
 *
 * Endpoint **cookie-auth** (`getSession` → 401) que o client invoca nos handlers
 * de CRUD de lembrete (`app/(app)/lembretes/page.tsx`) para espelhar a agenda
 * para o KV, de onde o `/api/push/dispatch` a lê (app possivelmente fechada).
 *
 *   - PUT    — upsert da entrada `{id, fireAt, text, status}` (create/edit/restore)
 *   - DELETE — remove a entrada de um id (cancel/delete; e cleanup pós-reconciliação)
 *   - GET    — devolve os ids `sent` para a reconciliação client → Dexie (AC6)
 *
 * Node runtime: `@vercel/kv` no store. Segurança (NFR5): nada sensível é logado.
 *
 * Trace: Story 4.8 AC3.2/AC6; Architect Gate (a) ponto 3; ADR-6.
 */

export const runtime = 'nodejs';

const DeleteSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
});

/** Espelha (upsert) a agenda de um lembrete. */
export async function PUT(req: Request): Promise<Response> {
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

  // O client só espelha lembretes a aguardar disparo — o status aceite aqui é
  // `pending` (a UI não espelha `cancelled`/`snoozed`; usa DELETE para os remover).
  const parsed = ScheduleEntrySchema.safeParse(body);
  if (!parsed.success || parsed.data.status !== 'pending') {
    return NextResponse.json({ error: 'Agenda inválida.' }, { status: 400 });
  }

  try {
    await putSchedule(parsed.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[push/schedule] falha ao espelhar agenda:', message);
    return NextResponse.json(
      { error: 'Falha ao guardar agenda.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

/** Remove a agenda de um lembrete (cancel/delete; cleanup pós-reconciliação). */
export async function DELETE(req: Request): Promise<Response> {
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

  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'id inválido.' }, { status: 400 });
  }

  try {
    await deleteSchedule(parsed.data.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[push/schedule] falha ao remover agenda:', message);
    return NextResponse.json(
      { error: 'Falha ao remover agenda.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

/**
 * Devolve, para a reconciliação client (on-mount):
 *   - `sent`    — ids dos lembretes já disparados (4.8 AC6 — marca `sent` em Dexie
 *     e remove-os via DELETE).
 *   - `pending` — entradas **adiadas por snooze** a aguardar re-disparo, com
 *     `{ id, fireAt }` (Story 4.9 AC8, D-SNOOZE-CONTRACT). O filtro é
 *     `status === 'pending' && typeof snoozedAt === 'number'`: lembretes `pending`
 *     NORMAIS (sem `snoozedAt`, ainda não accionados pelo utilizador) NÃO entram
 *     neste array — caso contrário a `reconcileSnoozedReminders` re-rotularia
 *     lembretes futuros normais como "adiados" em Dexie (bug M2/M3 do CR PR #58).
 *     O nome do campo mantém-se `pending` por compatibilidade com
 *     `fetchPendingSchedules` e os testes; a sua SEMÂNTICA é "snoozes a aguardar
 *     re-disparo" (rename semântico interno, não identificador externo).
 *     Extensão não-breaking: `fetchSentReminderIds` lê apenas `json.sent`.
 */
export async function GET(req: Request): Promise<Response> {
  const session = await getSession(req);
  if (!session.valid) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  try {
    const schedules = await listSchedules();
    const sent = schedules.filter((s) => s.status === 'sent').map((s) => s.id);
    // D-SNOOZE-CONTRACT: só entradas com o marcador `snoozedAt` (adiadas pelo
    // utilizador) — não todas as `pending`.
    const pending = schedules
      .filter((s) => s.status === 'pending' && typeof s.snoozedAt === 'number')
      .map((s) => ({ id: s.id, fireAt: s.fireAt }));
    return NextResponse.json({ sent, pending });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[push/schedule] falha ao ler agenda:', message);
    return NextResponse.json({ error: 'Falha ao ler agenda.' }, { status: 500 });
  }
}
