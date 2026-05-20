import { deleteRecurrence } from '@/lib/db/repos/recurrences';
import { updateTask } from '@/lib/db/repos/tasks';

/**
 * Nexus v2 — cancelTaskRecurrence (Story 2.7 / AC9)
 *
 * Cancela a recorrência de uma task-mãe. Pede confirmação ao utilizador via
 * `window.confirm` (PT-PT) e, se confirmado:
 *   1. Limpa o `recurrenceId` da task-mãe (`updateTask`).
 *   2. Elimina a `Recurrence` (`deleteRecurrence`).
 *
 * CR Iter 2 (#8): a ordem é `updateTask` → `deleteRecurrence` (não o inverso).
 * Se `deleteRecurrence` corresse primeiro e `updateTask` falhasse, a task ficaria
 * com um `recurrenceId` órfão a apontar para uma `Recurrence` inexistente. Com
 * esta ordem, se `updateTask` falhar nada é destruído (estado consistente —
 * recorrência ainda activa). Se `updateTask` passar mas `deleteRecurrence`
 * falhar, restaura-se o `recurrenceId` da task para reverter a operação parcial.
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
  // 1. Limpar o vínculo na task-mãe primeiro — se falhar, nada foi destruído.
  await updateTask(taskId, { recurrenceId: null });
  // 2. Eliminar a `Recurrence`. Se falhar, restaurar o vínculo para reverter.
  try {
    await deleteRecurrence(recurrenceId);
  } catch (error) {
    await updateTask(taskId, { recurrenceId });
    throw error;
  }
  return true;
}
