import type { Task } from '@/types/db';

/**
 * Nexus v2 — Helper "tarefa atrasada" (Story 2.3 / AC3 / [AUTO-DECISION] D3)
 *
 * Definição operacional (ratificada pela `@po` Pax 15/05/2026):
 * Uma tarefa é "atrasada" se e só se:
 *   - dueDate !== null
 *   - new Date(dueDate).getTime() < startOfToday()  (local time, < 00:00:00 do dia actual)
 *   - status !== 'done'
 *
 * Razão: tarefa com dueDate igual a hoje é "due today", não "overdue".
 * Saltar para secção atrasadas às 00:00:01 da meia-noite degrada UX para single-user pessoal.
 */

/**
 * Devolve epoch ms para 00:00:00 do dia local actual (ou do ts fornecido).
 * `referenceTs` permite testes deterministas — em produção usa-se Date.now().
 */
export function startOfToday(referenceTs: number = Date.now()): number {
  const d = new Date(referenceTs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Parseia `Task.dueDate` (string) para epoch ms.
 *
 * Formato `YYYY-MM-DD` é interpretado como **00:00:00 em local time** (não UTC).
 * Razão: uma "due date" é um dia inteiro do calendário do utilizador,
 * não um momento exacto UTC. Evita off-by-one quando o utilizador está em
 * timezone diferente de UTC (Portugal = UTC+1 BST a maior parte do ano).
 *
 * Outros formatos (ISO completo com timezone) são parseados directamente.
 *
 * Devolve NaN se inválido (caller verifica).
 */
function parseDueDateMs(dueDate: string): number {
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0).getTime();
  }
  return new Date(dueDate).getTime();
}

/**
 * Avalia se uma tarefa está atrasada conforme D3.
 * `referenceTs` (opcional) permite testes deterministas.
 */
export function isOverdue(task: Task, referenceTs: number = Date.now()): boolean {
  if (task.dueDate === null) return false;
  if (task.status === 'done') return false;
  const dueMs = parseDueDateMs(task.dueDate);
  if (Number.isNaN(dueMs)) return false;
  return dueMs < startOfToday(referenceTs);
}

/**
 * Devolve o número de dias completos de atraso (>= 1) ou 0 se não atrasada.
 * Util para mostrar "(3d)" na secção atrasadas.
 */
export function daysOverdue(task: Task, referenceTs: number = Date.now()): number {
  if (!isOverdue(task, referenceTs)) return 0;
  const dueMs = parseDueDateMs(task.dueDate as string);
  const diff = startOfToday(referenceTs) - dueMs;
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}
