import type { Reminder } from '@/types/db';

/**
 * Nexus v2 — Cliente do mirror de agenda de push (Story 4.8, AC3.2/AC6)
 *
 * Helpers client-safe que falam com `/api/push/schedule` via `fetch`. NÃO
 * importam código server-only (`@vercel/kv`, `web-push`) — a fronteira client↔KV
 * é o endpoint cookie-auth.
 *
 * DEV-DECISION D-MIRROR-BESTEFFORT: o espelhamento é best-effort (loga, não
 * lança). Um lembrete já foi persistido em Dexie pelo handler de CRUD da 4.6 —
 * uma falha do mirror não deve reverter essa operação nem partir a UI. O custo é
 * que um mirror falhado no create não dispara até nova edição (limitação
 * conhecida registada no Dev Agent Record).
 *
 * Trace: Story 4.8 AC3.2/AC6; Architect Gate (a) ponto 3.
 */

/**
 * Espelha (upsert) a agenda de um lembrete `pending`. Só espelha lembretes com
 * canal `'push'` (lembretes só-`telegram` são ignorados — FR37 = Epic 6).
 */
export async function putReminderSchedule(reminder: Reminder): Promise<void> {
  if (!reminder.channels.includes('push')) return;
  try {
    await fetch('/api/push/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reminder.id,
        fireAt: reminder.fireAt,
        text: reminder.text,
        status: 'pending',
      }),
    });
  } catch (error) {
    console.error('[push/schedule-client] falha ao espelhar agenda', error);
  }
}

/**
 * Remove a agenda de um lembrete (cancel/delete; cleanup pós-reconciliação).
 */
export async function removeReminderSchedule(id: string): Promise<void> {
  try {
    await fetch('/api/push/schedule', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  } catch (error) {
    console.error('[push/schedule-client] falha ao remover agenda', error);
  }
}

/**
 * Lê os ids dos lembretes já `sent` no mirror (para a reconciliação on-mount).
 * Devolve `[]` em qualquer falha (best-effort).
 */
export async function fetchSentReminderIds(): Promise<string[]> {
  try {
    const resp = await fetch('/api/push/schedule', { method: 'GET' });
    if (!resp.ok) return [];
    const json = (await resp.json()) as { sent?: unknown };
    if (!Array.isArray(json.sent)) return [];
    return json.sent.filter((id): id is string => typeof id === 'string');
  } catch (error) {
    console.error('[push/schedule-client] falha ao ler agenda', error);
    return [];
  }
}
