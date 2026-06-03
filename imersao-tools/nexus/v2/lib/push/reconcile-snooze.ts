import { updateReminder } from '@/lib/db/repos/reminders';
import { fetchPendingSchedules } from '@/lib/push/schedule-client';

/**
 * Nexus v2 — Reconciliação on-mount de lembretes adiados (Story 4.9, AC10)
 *
 * Quando o utilizador faz "snooze" numa notificação push, o Service Worker
 * reescreve a entrada do mirror KV (`/api/push/action`) com novo `fireAt`
 * mantendo `status: 'pending'` (D-RECON-SNOOZE-KEEP) — a app pode estar fechada.
 * Esta função traz esse `fireAt` actualizado de volta para Dexie e marca o
 * lembrete `snoozed` (feedback visual ao utilizador).
 *
 * Diferença crítica para `reconcileSentReminders`: as entradas `pending` NÃO são
 * removidas do mirror — ficam à espera do próximo disparo do scheduler. O Dexie
 * `snoozed` é apenas visual; o scheduler dispara quando `fireAt <= now`,
 * independentemente do status em Dexie.
 *
 * Nota de semântica (AC10): `fetchPendingSchedules()` devolve TODAS as entradas
 * `pending` — incluindo lembretes agendados normalmente que ainda não foram
 * accionados. `updateReminder(id, { status: 'snoozed', fireAt })` é idempotente
 * e actualiza correctamente em ambos os casos; a distinção client-side não é
 * necessária.
 *
 * Idempotente e best-effort: um lembrete que já não exista localmente (apagado
 * noutro contexto) é ignorado; um erro por lembrete não interrompe os restantes
 * (padrão `reconcileSentReminders`).
 *
 * Trace: Story 4.9 AC10/AC11; D-RECON-SNOOZE-KEEP.
 */
export async function reconcileSnoozedReminders(): Promise<void> {
  const pending = await fetchPendingSchedules();

  for (const { id, fireAt } of pending) {
    try {
      await updateReminder(id, { status: 'snoozed', fireAt });
    } catch (error) {
      // Lembrete inexistente em Dexie (apagado entretanto) — não é erro fatal.
      // NÃO removemos a entrada do mirror (D-RECON-SNOOZE-KEEP).
      console.error('[reconcile-snooze] lembrete não encontrado', id, error);
    }
  }
}
