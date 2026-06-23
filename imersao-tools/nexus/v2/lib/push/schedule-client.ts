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
 * Espelha (upsert) a agenda de um lembrete `pending`. Espelha lembretes com
 * canal `'push'` E/OU `'telegram'` ([D-6.16-CHANNEL-COUPLING], Story 6.16 —
 * FR74/FR37). Antes da 6.16 os lembretes só-`telegram` eram ignorados (FR37
 * adiado para o Epic 6); agora o canal `telegram` é despachado server-side, por
 * isso o mirror tem de o conhecer. O campo `channels` é incluído no body para o
 * dispatcher unificado saber que canais entregar (entradas sem `channels` —
 * legado 4.8 — são tratadas como `['push']`). Lembretes sem qualquer canal de
 * entrega declarado não são espelhados (nada a disparar server-side).
 */
export async function putReminderSchedule(reminder: Reminder): Promise<void> {
  // CR Iter 1 (F1 Critical): `channels` é não-opcional no tipo `Reminder`, mas
  // linhas Dexie legadas (anteriores ao campo) podem trazê-lo `undefined` —
  // optional-chaining + `?? false` evita um `TypeError` e trata o legado como
  // "sem canal a espelhar" (graceful, coerente com o contrato 4.8).
  const hasPush = reminder.channels?.includes('push') ?? false;
  const hasTelegram = reminder.channels?.includes('telegram') ?? false;
  if (!hasPush && !hasTelegram) {
    return;
  }
  try {
    const resp = await fetch('/api/push/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reminder.id,
        fireAt: reminder.fireAt,
        text: reminder.text,
        status: 'pending',
        channels: reminder.channels,
      }),
    });
    if (!resp.ok) {
      console.error(
        '[push/schedule-client] falha ao espelhar agenda',
        reminder.id,
        resp.status,
      );
    }
  } catch (error) {
    console.error('[push/schedule-client] erro ao espelhar agenda', error);
  }
}

/**
 * Remove a agenda de um lembrete (cancel/delete; cleanup pós-reconciliação).
 */
export async function removeReminderSchedule(id: string): Promise<void> {
  try {
    const resp = await fetch('/api/push/schedule', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!resp.ok) {
      console.error('[push/schedule-client] falha ao remover agenda', id, resp.status);
    }
  } catch (error) {
    console.error('[push/schedule-client] erro ao remover agenda', error);
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

/**
 * Lê as entradas `pending` do mirror com `{ id, fireAt }` (Story 4.9, AC9). A
 * reconciliação de snooze (`reconcileSnoozedReminders`) usa-as para reflectir um
 * `fireAt` actualizado em Dexie. Devolve `[]` em qualquer falha (best-effort —
 * mesmo padrão de `fetchSentReminderIds`). Auth de sessão (cookie) implícita.
 */
export async function fetchPendingSchedules(): Promise<
  Array<{ id: string; fireAt: number }>
> {
  try {
    const resp = await fetch('/api/push/schedule', { method: 'GET' });
    if (!resp.ok) return [];
    const json = (await resp.json()) as { pending?: unknown };
    if (!Array.isArray(json.pending)) return [];
    return json.pending.filter(
      (entry): entry is { id: string; fireAt: number } =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as { id?: unknown }).id === 'string' &&
        typeof (entry as { fireAt?: unknown }).fireAt === 'number',
    );
  } catch (error) {
    console.error('[push/schedule-client] falha ao ler agenda pendente', error);
    return [];
  }
}
