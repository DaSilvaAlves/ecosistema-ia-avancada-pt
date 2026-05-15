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
