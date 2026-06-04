import { updateReminder } from '@/lib/db/repos/reminders';
import { fetchPendingSchedules } from '@/lib/push/schedule-client';

/**
 * Nexus v2 — Reconciliação on-mount de lembretes adiados (Story 4.9, AC10)
 *
 * Quando o utilizador faz "snooze" numa notificação push, o Service Worker
 * reescreve a entrada do mirror KV (`/api/push/action`) com novo `fireAt`,
 * mantendo `status: 'pending'` E gravando o marcador `snoozedAt` (D-SNOOZE-CONTRACT)
 * — a app pode estar fechada. Esta função traz esse `fireAt` actualizado de volta
 * para Dexie e marca o lembrete `snoozed` (feedback visual ao utilizador).
 *
 * Diferença crítica para `reconcileSentReminders`: as entradas adiadas NÃO são
 * removidas do mirror — ficam à espera do próximo disparo do scheduler. O Dexie
 * `snoozed` é apenas visual; o scheduler dispara quando `fireAt <= now`,
 * independentemente do status em Dexie.
 *
 * Fonte estreita (D-SNOOZE-CONTRACT — corrige M3 do CR PR #58):
 * `fetchPendingSchedules()` devolve APENAS entradas adiadas por snooze — o
 * servidor (`GET /api/push/schedule`) filtra por `snoozedAt` definido, pelo que
 * lembretes `pending` normais (ainda não accionados pelo utilizador) NÃO chegam
 * a este loop. A versão anterior consumia TODAS as `pending` e re-rotulava
 * lembretes futuros normais como `snoozed` em Dexie (bug revogado). Marcar
 * `snoozed` apenas as entradas verdadeiramente adiadas é agora seguro.
 *
 * Idempotente e best-effort: um lembrete que já não exista localmente (apagado
 * noutro contexto) é ignorado; um erro por lembrete não interrompe os restantes
 * (padrão `reconcileSentReminders`).
 *
 * Trace: Story 4.9 AC10/AC11; D-SNOOZE-CONTRACT.
 */
export async function reconcileSnoozedReminders(): Promise<void> {
  const pending = await fetchPendingSchedules();

  for (const { id, fireAt } of pending) {
    try {
      await updateReminder(id, { status: 'snoozed', fireAt });
    } catch (error) {
      // Lembrete inexistente em Dexie (apagado entretanto) — não é erro fatal.
      // NÃO removemos a entrada do mirror (D-SNOOZE-CONTRACT — aguarda re-disparo).
      console.error('[reconcile-snooze] lembrete não encontrado', id, error);
    }
  }
}
