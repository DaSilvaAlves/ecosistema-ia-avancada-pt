import { z } from 'zod';

/**
 * Nexus v2 — Zod schemas para domínio DB (Tarefas, Projectos, Recorrências, Tags) — Story 2.1
 *
 * Fonte canónica: architecture-v2.md §6.2 + types/db.ts:52-92.
 * Constitution Article IV — espelho fiel das interfaces, sem invenção.
 *
 * Stories 2.2 (migration), 2.3-2.5 (UI Lista/Kanban/Calendário), 2.6 (tags),
 * 2.7 (recurrence engine), 2.8 (CRUD projectos), 2.10 (tools cérebro) reutilizam
 * estes schemas para validar input antes de persistir em Dexie.
 *
 * Convenção: paralelo a `lib/agent/schemas.ts` (Story 1.1 — domínio agente).
 * Este ficheiro é o domínio DB (Tarefas + Projectos + Recorrências + Tags).
 *
 * Lição Story 1.1 — NÃO usar `z.unknown()` em campos obrigatórios: `parse()`
 * infere `?: unknown` opcional e quebra o typecheck. Aqui nenhum campo é
 * `unknown` — Task/Project/Recurrence/Tag são todos shape-fixo.
 */

// ═══════════════════════════════════════════════════════════════════
// Task
// ═══════════════════════════════════════════════════════════════════

export const TaskPrioritySchema = z.enum(['high', 'medium', 'low']);

export const TaskStatusSchema = z.enum(['todo', 'in-progress', 'blocked', 'done']);

export const TaskSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  dueDate: z.string().nullable(),
  projectId: z.string().nullable(),
  tags: z.array(z.string()),
  context: z.string().nullable(),
  lastWorkedAt: z.number().int().nullable(),
  recurrenceId: z.string().nullable(),
  parentTaskId: z.string().nullable(),
  createdAt: z.number().int().positive('createdAt deve ser epoch ms positivo'),
  updatedAt: z.number().int().positive('updatedAt deve ser epoch ms positivo'),
});

export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// ═══════════════════════════════════════════════════════════════════
// Project
// ═══════════════════════════════════════════════════════════════════

export const ProjectStatusSchema = z.enum(['active', 'paused', 'done']);

export const ProjectSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  name: z.string().min(1, 'Nome do projecto é obrigatório'),
  description: z.string(),
  status: ProjectStatusSchema,
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  deadline: z.string().nullable(),
  createdAt: z.number().int().positive('createdAt deve ser epoch ms positivo'),
});

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

// ═══════════════════════════════════════════════════════════════════
// Recurrence
// ═══════════════════════════════════════════════════════════════════

export const RecurrenceOwnerTypeSchema = z.enum([
  'task',
  'transaction',
  'habit',
  'reminder',
]);

export const RecurrenceSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  rule: z.string().min(1, 'Regra RRULE é obrigatória'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().nullable(),
  ownerType: RecurrenceOwnerTypeSchema,
  ownerId: z.string().min(1, 'ownerId é obrigatório'),
});

export type RecurrenceOwnerType = z.infer<typeof RecurrenceOwnerTypeSchema>;

// ═══════════════════════════════════════════════════════════════════
// Tag
// ═══════════════════════════════════════════════════════════════════

export const TagSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  name: z.string().min(1, 'Nome da tag é obrigatório'),
  color: z.string().min(1, 'Cor da tag é obrigatória'),
});

// ═══════════════════════════════════════════════════════════════════
// Epic 3 — Finanças (Story 3.1)
//
// Espelho fiel de types/db.ts:98-142. Montantes SEMPRE em cêntimos
// (inteiros, nunca float) — `z.number().int()`. `Transaction.amount`
// aceita ambos os sinais (negativo = saída, positivo = entrada,
// types/db.ts:117).
//
// Story 3.1 Iter 2 (CodeRabbit) — endurecimento de validação:
// - IDs de referência (`Card.accountId`, `Transaction.accountId/cardId/
//   recurrenceId/installmentId`) validados como UUID — paridade com as PKs.
// - Campos de data INDEXADOS (`Transaction.date`, `Installment.startDate`)
//   validados como ISO 8601 via `ISO_DATE_REGEX`. O índice Dexie ordena
//   lexicalmente; uma string não-ISO (ex: '15/05/2026') quebraria a
//   ordenação dos índices `date` / `[accountId+date]` / `[cardId+date]` /
//   `[cardId+startDate]`. A validação garante que só formatos
//   lexicograficamente ordenáveis entram na DB.
// ═══════════════════════════════════════════════════════════════════

/**
 * Valida data ISO 8601: `YYYY-MM-DD` ou `YYYY-MM-DDTHH:MM:SS(.sss)(Z|±HH:MM)`.
 * Apenas formatos com ordenação lexical correcta — exigência dos índices Dexie.
 */
const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?)?$/;

// ─── Account ───

export const AccountTypeSchema = z.enum(['checking', 'savings', 'cash']);

export const AccountSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  type: AccountTypeSchema,
  balance: z.number().int('Saldo deve ser inteiro em cêntimos'),
  createdAt: z.number().int().positive('createdAt deve ser epoch ms positivo'),
});

export type AccountType = z.infer<typeof AccountTypeSchema>;

// ─── Card ───

export const CardSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  accountId: z.string().uuid('accountId deve ser UUID válido'),
  closingDay: z
    .number()
    .int('Dia de fecho deve ser inteiro')
    .min(1, 'Dia de fecho deve estar entre 1 e 31')
    .max(31, 'Dia de fecho deve estar entre 1 e 31'),
  dueDay: z
    .number()
    .int('Dia de vencimento deve ser inteiro')
    .min(1, 'Dia de vencimento deve estar entre 1 e 31')
    .max(31, 'Dia de vencimento deve estar entre 1 e 31'),
  limit: z.number().int('Limite deve ser inteiro em cêntimos').nullable(),
});

// ─── Transaction ───

export const TransactionSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  amount: z.number().int('Montante deve ser inteiro em cêntimos (sem casas decimais)'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string(),
  date: z
    .string()
    .min(1, 'Data é obrigatória')
    .regex(ISO_DATE_REGEX, 'Data deve estar em formato ISO 8601 (ex: 2026-05-15)'),
  accountId: z.string().uuid('accountId deve ser UUID válido').nullable(),
  cardId: z.string().uuid('cardId deve ser UUID válido').nullable(),
  recurrenceId: z.string().uuid('recurrenceId deve ser UUID válido').nullable(),
  installmentId: z.string().uuid('installmentId deve ser UUID válido').nullable(),
  createdAt: z.number().int().positive('createdAt deve ser epoch ms positivo'),
});

// ─── Installment ───

export const InstallmentSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  cardId: z.string().uuid('cardId deve ser UUID válido'),
  totalAmount: z.number().int('Montante total deve ser inteiro em cêntimos'),
  installments: z
    .number()
    .int('Número de prestações deve ser inteiro')
    .positive('Número de prestações deve ser maior que zero'),
  startDate: z
    .string()
    .min(1, 'Data de início é obrigatória')
    .regex(ISO_DATE_REGEX, 'Data de início deve estar em formato ISO 8601 (ex: 2026-05-15)'),
  description: z.string(),
});

// ─── Category ───

export const CategorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório'),
  color: z.string().min(1, 'Cor da categoria é obrigatória'),
  icon: z.string().min(1, 'Ícone da categoria é obrigatório'),
  isDefault: z.boolean(),
});

// ═══════════════════════════════════════════════════════════════════
// Epic 3 — Recorrências financeiras (Story 3.4)
//
// Espelho fiel de types/db.ts `FinanceRecurrence`. `amount` em cêntimos
// inteiros com sinal (negativo = saída, positivo = entrada) — mesma
// convenção de `Transaction.amount`. `recurrenceId` referencia a tabela
// genérica `recurrences` (a RRULE + datas).
// ═══════════════════════════════════════════════════════════════════

export const FinanceRecurrenceSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  amount: z.number().int('Montante deve ser inteiro em cêntimos (sem casas decimais)'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string(),
  accountId: z.string().uuid('accountId deve ser UUID válido').nullable(),
  cardId: z.string().uuid('cardId deve ser UUID válido').nullable(),
  recurrenceId: z.string().uuid('recurrenceId deve ser UUID válido'),
  createdAt: z.number().int().positive('createdAt deve ser epoch ms positivo'),
});
