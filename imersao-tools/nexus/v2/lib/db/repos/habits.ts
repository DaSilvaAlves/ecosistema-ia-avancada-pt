import { db } from '@/lib/db/client';
import { HabitSchema } from '@/lib/db/schemas';
import type { Habit } from '@/types/db';

/**
 * Nexus v2 — Repository para `habits` (Story 4.1 — FR24/FR25)
 *
 * Encapsula o acesso à tabela Dexie `habits` (que já existe em `version(1)` —
 * scaffold Story 0.3). As Stories 4.2-4.4/4.10 do Epic 4 usam estes helpers em
 * vez de tocar `db.habits.*` directamente. Padrão herdado de `accounts.ts`
 * (Story 3.1) e `tasks.ts` (Story 2.1).
 *
 * Validação Zod aplicada antes de qualquer write — input inválido lança
 * `ZodError` com mensagens PT-PT. Reads não revalidam.
 *
 * `frequency` é uma RRULE (mesmo modelo das tarefas — FR24). A recorrência
 * detalhada (datas de geração) vive na tabela genérica `recurrences`
 * (`ownerType: 'habit'`) — fora do scope da 4.1.
 */

export async function createHabit(input: Habit): Promise<Habit> {
  HabitSchema.parse(input);
  await db.habits.add(input);
  return input;
}

export async function getHabit(id: string): Promise<Habit | undefined> {
  return db.habits.get(id);
}

/**
 * Lista todos os hábitos, ordenados descendente por `createdAt`
 * (mais recente primeiro) — mesma convenção de `listAccounts`.
 */
export async function listHabits(): Promise<Habit[]> {
  const all = await db.habits.toArray();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function updateHabit(
  id: string,
  patch: Partial<Habit>,
): Promise<void> {
  // Valida o patch parcial antes da escrita (padrão `updateAccount`,
  // Story 3.1 CR Iter 1). `.partial()` torna os campos opcionais mas mantém
  // as regras de cada campo presente (RRULE não-vazia, time HH:MM, etc.).
  HabitSchema.partial().parse(patch);
  const updated = await db.habits.update(id, patch);
  if (updated === 0) {
    throw new Error(`Hábito ${id} não encontrado — não foi possível actualizar`);
  }
}

/**
 * Apaga um hábito e, em cascata, todos os seus `habit_logs`.
 *
 * Cascata (AC7 / Architect Gate Story 4.1): um `HabitLog` é uma observação de
 * um `Habit` específico (composição) — sem o hábito, o log é órfão sem
 * semântica. Os dois `delete` correm dentro de uma transacção Dexie `rw`
 * (padrão `deleteFinanceRecurrence`, Story 3.4): a eliminação é all-or-nothing.
 *
 * Hard-delete (consistência com o codebase Epic 3). O caso "parar um hábito
 * sem perder histórico" resolve-se com archive na Story 4.2 — não aqui.
 */
export async function deleteHabit(id: string): Promise<void> {
  await db.transaction('rw', db.habits, db.habit_logs, async () => {
    await db.habit_logs.where('habitId').equals(id).delete();
    await db.habits.delete(id);
  });
}
