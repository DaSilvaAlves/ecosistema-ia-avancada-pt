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

// ═══════════════════════════════════════════════════════════════════
// Epic 4 — Hábitos / Metas / Lembretes (Story 4.1)
//
// Espelho fiel de types/db.ts:170-209. Decisões do Architect Gate da
// Story 4.1 ([GAP-4.1b] + cascata):
// - `Goal.milestones` é EMBEBIDO (array), não tabela separada — sub-agregado
//   de baixa cardinalidade lido sempre no contexto do Goal.
// - `Habit.time` (FR24) e `Goal.description` (FR39) são campos não-indexados.
// - Recorrência de hábitos/lembretes reutiliza a tabela genérica `recurrences`
//   (`ownerType: 'habit'`/`'reminder'`) — não há tabela própria.
// ═══════════════════════════════════════════════════════════════════

/** Horário 24h `HH:MM` (FR24 — horário opcional do hábito). */
const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// ─── Habit ───

export const HabitMetricSchema = z.object({
  unit: z.string().min(1, 'Unidade da métrica é obrigatória'),
  target: z.number({ invalid_type_error: 'Alvo da métrica deve ser numérico' }),
});

export const HabitSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  name: z.string().min(1, 'Nome do hábito é obrigatório'),
  frequency: z.string().min(1, 'Frequência (RRULE) é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  time: z
    .string()
    .regex(TIME_HHMM_REGEX, 'Horário deve estar em formato HH:MM (24h)')
    .optional(),
  metric: HabitMetricSchema.optional(),
  // Story 4.2 — timestamp de arquivo (epoch ms). undefined = hábito activo.
  // Campo não-indexado: extensão de schema sem version bump (mesmo precedente
  // de `time?`). `restoreHabit` repõe-o a undefined.
  archivedAt: z
    .number()
    .int('archivedAt deve ser epoch ms inteiro')
    .positive('archivedAt deve ser epoch ms positivo')
    .optional(),
  createdAt: z.number().int().positive('createdAt deve ser epoch ms positivo'),
});

// ─── HabitLog ───
//
// `value` é opcional (só presente em hábitos com `metric` — FR27). A coerência
// "hábito tem metric ⇒ log deve ter value" é regra cross-entity validada no
// repo (`createHabitLog`), não neste schema isolado.

export const HabitLogSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  habitId: z.string().uuid('habitId deve ser UUID válido'),
  date: z
    .string()
    .min(1, 'Data é obrigatória')
    .regex(ISO_DATE_REGEX, 'Data deve estar em formato ISO 8601 (ex: 2026-05-15)'),
  value: z.number().optional(),
});

// ─── Goal ───

export const GoalTypeSchema = z.enum(['numeric', 'boolean']);

export const GoalStatusSchema = z.enum(['active', 'achieved', 'cancelled']);

/**
 * Milestone embebido. `at` = valor-alvo numérico (threshold em que `reached`
 * vira true). Architect Gate Story 4.1: NÃO se força `at` coerente com
 * `Goal.target` — em goals 'boolean' é um passo qualitativo (`note`).
 */
export const GoalMilestoneSchema = z.object({
  at: z.number({ invalid_type_error: 'Valor-alvo do milestone deve ser numérico' }),
  reached: z.boolean(),
  note: z.string().optional(),
});

/**
 * Story 4.5 (FR40) — entrada do histórico de actualizações do `current`.
 * `date` em `YYYY-MM-DD` (mesma convenção UTC do resto do schema — regex
 * partilhada `ISO_DATE_REGEX`, mais defensiva que `z.string()` cru, dado que o
 * helper `formatGoalDeadline`/o histórico dependem de datas UTC bem formadas).
 */
export const GoalProgressEntrySchema = z.object({
  date: z
    .string()
    .regex(ISO_DATE_REGEX, 'Data deve estar em formato ISO 8601 (ex: 2026-06-01)'),
  value: z.number({ invalid_type_error: 'Valor deve ser numérico' }),
  note: z.string().optional(),
});

export const GoalSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  title: z.string().min(1, 'Título da meta é obrigatório'),
  description: z.string().optional(),
  type: GoalTypeSchema,
  target: z.number({ invalid_type_error: 'Alvo deve ser numérico' }),
  current: z.number({ invalid_type_error: 'Valor actual deve ser numérico' }),
  deadline: z.string().nullable(),
  status: GoalStatusSchema,
  milestones: z.array(GoalMilestoneSchema),
  // Story 4.5 — histórico de updates do `current` (FR40). Embebido,
  // não-indexado, opcional. Sem version bump (precedente `Habit.archivedAt?`).
  progressLog: z.array(GoalProgressEntrySchema).optional(),
});

export type GoalType = z.infer<typeof GoalTypeSchema>;
export type GoalStatus = z.infer<typeof GoalStatusSchema>;

// ─── Reminder ───

export const ReminderChannelSchema = z.enum(['push', 'telegram']);

export const ReminderStatusSchema = z.enum([
  'pending',
  'sent',
  'cancelled',
  'snoozed',
]);

export const ReminderSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  text: z.string().min(1, 'Texto do lembrete é obrigatório'),
  fireAt: z.number().int().positive('fireAt deve ser epoch ms positivo'),
  recurrenceId: z.string().uuid('recurrenceId deve ser UUID válido').nullable(),
  channels: z.array(ReminderChannelSchema),
  status: ReminderStatusSchema,
});

export type ReminderChannel = z.infer<typeof ReminderChannelSchema>;
export type ReminderStatus = z.infer<typeof ReminderStatusSchema>;

// ═══════════════════════════════════════════════════════════════════
// Epic 5 — Diário / Conhecimento (Story 5.1)
//
// Espelho fiel de types/db.ts:223-252. Constitution Article IV — sem invenção.
//
// As 4 tabelas (journal_entries, knowledge_areas, knowledge_notebooks,
// knowledge_notes) já existem em version(1) (client.ts:93-96). A Story 5.1 NÃO
// recria tabelas — adiciona apenas a camada de acesso (schemas Zod + repos +
// hooks). brain_dumps (FR47-49) foi ratificada pelo @architect como tabela Dexie
// `version(5)` (decisão `D-BRAINDUMP-STORE`, [GAP-5.1b]) — BrainDumpSchema está
// definido no fim desta secção.
//
// `JournalEntry.date` usa um regex date-only `YYYY-MM-DD` (mais estrito que o
// ISO_DATE_REGEX que aceita datetime): o índice Dexie `date` e o heatmap por dia
// (FR44) chaveiam por dia-calendário, não por instante. `KnowledgeNote.sourceUrl`
// é validado como URL quando presente (FR55/FR56 — notas criadas por pesquisa web).
// ═══════════════════════════════════════════════════════════════════

/** Data de calendário `YYYY-MM-DD` (sem componente de tempo). FR42/FR44. */
const ISO_DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ─── JournalEntry ───

export const JournalMoodSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

/**
 * Estrutura AI opcional (FR43 — "o que aconteceu / o que aprendi / o que senti").
 * Todos os sub-campos opcionais: a Story 5.4 (AI estrutura diário) preenche-os;
 * uma entrada manual sem AI tem `structuredAI` undefined.
 */
export const JournalStructuredAISchema = z.object({
  whatHappened: z.string().optional(),
  whatLearned: z.string().optional(),
  whatFelt: z.string().optional(),
});

export const JournalEntrySchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  date: z
    .string()
    .regex(ISO_DATE_ONLY_REGEX, 'Data deve estar em formato YYYY-MM-DD (ex: 2026-06-07)'),
  mood: JournalMoodSchema,
  bodyMarkdown: z.string().min(1, 'O corpo da entrada de diário é obrigatório'),
  structuredAI: JournalStructuredAISchema.optional(),
});

export type JournalMood = z.infer<typeof JournalMoodSchema>;

// ─── KnowledgeArea ───

export const KnowledgeAreaSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  name: z.string().min(1, 'Nome da área é obrigatório'),
  color: z.string().min(1, 'Cor da área é obrigatória'),
  icon: z.string().min(1, 'Ícone da área é obrigatório'),
});

// ─── KnowledgeNotebook ───

export const KnowledgeNotebookSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  areaId: z.string().uuid('areaId deve ser UUID válido'),
  name: z.string().min(1, 'Nome do caderno é obrigatório'),
});

// ─── KnowledgeNote ───
//
// `tags` é string[] de IDs de tags (padrão Task.tags — Epic 2). Reutiliza a
// tabela `tags` de version(2); NÃO há sistema de tags separado (R4). `sourceUrl`
// validado como URL quando presente (FR55/FR56). `updatedAt` epoch ms positivo
// (índice de ordenação).

export const KnowledgeNoteSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  notebookId: z.string().uuid('notebookId deve ser UUID válido'),
  title: z.string().min(1, 'Título da nota é obrigatório'),
  bodyMarkdown: z.string(),
  tags: z.array(z.string()),
  sourceUrl: z.string().url('sourceUrl deve ser uma URL válida').optional(),
  updatedAt: z.number().int().positive('updatedAt deve ser epoch ms positivo'),
});

// ─── BrainDump ───
//
// Decisão @architect `D-BRAINDUMP-STORE` (AC2/[GAP-5.1b]): tabela Dexie
// `version(5)`. O `status` é a máquina de estados que atravessa sessões
// (FR48/FR49 — parse → aprovação item-a-item). `parsedOutput` é `z.unknown()`
// deliberado — o tipo exacto dos 4 buckets AI é definido na Story 5.7 (parser),
// evitando coupling nesta story de schema. `createdAt` epoch ms positivo serve
// o índice de historial DESC (FR47).

export const BrainDumpStatusSchema = z.enum([
  'pending',
  'parsed',
  'partially_approved',
  'fully_approved',
]);

export const BrainDumpSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  createdAt: z.number().int().positive('createdAt deve ser epoch ms positivo'),
  bodyMarkdown: z.string().min(1, 'O corpo do brain dump é obrigatório'),
  parsedOutput: z.unknown().optional(),
  status: BrainDumpStatusSchema,
});

export type BrainDumpStatus = z.infer<typeof BrainDumpStatusSchema>;

// ─── CalendarEvent (Story 6.3 — FR59 PULL) ───
//
// Decisão @architect `[D-6.3-SCHEMA]`: evento sincronizado do Google Calendar.
// `id` é UUID Nexus (crypto.randomUUID). `googleId` é o `items[].id` do Google
// (não-vazio, índice ÚNICO p/ idempotência). `startAt`/`endAt`/`updatedAt` em
// epoch ms (int, padrão `Reminder.fireAt` — `.positive()`, convenção única do
// codebase: epoch 0 nunca é um timestamp legítimo). `title` aceita string vazia
// (Google permite eventos sem `summary` → default ''). Não impomos `endAt >=
// startAt` (all-day usa `end.date` exclusivo; eventos de fronteira não devem
// falhar o upsert da reconciliação). Eventos confirmed sem `start`/`end` válido
// (epoch 0) são malformados — o helper `reconcilePage` faz skip gracioso ANTES
// do `parse`, pelo que `.positive()` nunca rejeita um evento legítimo aqui.
export const CalendarEventSchema = z.object({
  id: z.string().uuid('id deve ser UUID válido'),
  // Story 6.4 (C2 / [D-6.4-SYNCSTATUS]): `googleId` é OPCIONAL — ausente para a
  // classe "local-pendente" (evento criado no Nexus ainda não sincronizado).
  // Quando presente, continua a exigir-se não-vazio (`.min(1)`). Esta relaxação é
  // aditiva (não rejeita nenhum registo que o pull já valida) — SEM version bump
  // Dexie. O `&googleId` mantém-se único e esparso.
  googleId: z.string().min(1, 'googleId deve ser não-vazio quando presente').optional(),
  title: z.string(),
  startAt: z.number().int().positive('startAt deve ser epoch ms positivo'),
  endAt: z.number().int().positive('endAt deve ser epoch ms positivo'),
  allDay: z.boolean(),
  updatedAt: z.number().int().positive('updatedAt deve ser epoch ms positivo'),
});
