import { updateReminder } from '@/lib/db/repos/reminders';
import {
  fetchSentReminderIds,
  removeReminderSchedule,
} from '@/lib/push/schedule-client';

/**
 * Nexus v2 — Reconciliação de lembretes disparados server-side (Story 4.8, AC6)
 *
 * O `/api/push/dispatch` marca lembretes `sent` no mirror KV (com a app
 * possivelmente fechada). A fonte-de-verdade do client é Dexie — esta função
 * traz esse estado de volta: lê os ids `sent` do mirror, marca-os `sent` em
 * Dexie (`updateReminder`), e remove-os do mirror (D-RECON-CLEANUP) para o
 * mirror não crescer indefinidamente.
 *
 * Idempotente e best-effort: um lembrete que já não exista localmente (apagado
 * noutro contexto) é ignorado, mas a sua entrada no mirror é limpa na mesma.
 *
 * Trace: Story 4.8 AC6; Architect Gate (a) ponto 4; ADR-2.
 */
export async function reconcileSentReminders(): Promise<void> {
  const sentIds = await fetchSentReminderIds();

  for (const id of sentIds) {
    try {
      await updateReminder(id, { status: 'sent' });
    } catch (error) {
      // Lembrete inexistente em Dexie (apagado entretanto) — não é erro fatal.
      console.error('[reconcile] lembrete não encontrado ao marcar sent', id, error);
    }
    // Cleanup do mirror após reconciliar (corre mesmo que o update falhe — a
    // entrada já não tem correspondência local relevante).
    await removeReminderSchedule(id);
  }
}
