import { deleteRecurrence } from '@/lib/db/repos/recurrences';
import { updateTask } from '@/lib/db/repos/tasks';

/**
 * Nexus v2 — cancelTaskRecurrence (Story 2.7 / AC9)
 *
 * Cancela a recorrência de uma task-mãe. Pede confirmação ao utilizador via
 * `window.confirm` (PT-PT) e, se confirmado:
 *   1. Elimina a `Recurrence` (`deleteRecurrence`).
 *   2. Limpa o `recurrenceId` da task-mãe (`updateTask`).
 *
 * As instâncias filhas já criadas NÃO são eliminadas — ficam como tasks normais
 * (decisão A10). Cancelar a recorrência só impede a geração de instâncias futuras.
 *
 * Retorna `true` se a recorrência foi cancelada, `false` se o utilizador abortou.
 *
 * Função pura de domínio (sem JSX) — testável de forma isolada (T23/T24) e
 * reutilizável pelo formulário de edição de tarefa quando este existir.
 *
 * Trace: Story 2.7 AC9 + A10 + FR10.
 */

export const CANCEL_RECURRENCE_CONFIRM =
  'Cancelar a recorrência desta tarefa? As instâncias futuras não serão eliminadas automaticamente.';

export async function cancelTaskRecurrence(
  taskId: string,
  recurrenceId: string,
): Promise<boolean> {
  const confirmed = window.confirm(CANCEL_RECURRENCE_CONFIRM);
  if (!confirmed) {
    return false;
  }
  await deleteRecurrence(recurrenceId);
  await updateTask(taskId, { recurrenceId: null });
  return true;
}
