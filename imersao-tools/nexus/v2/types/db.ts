/**
 * Nexus v2 — Database type definitions
 *
 * Tipos TypeScript para todas as tabelas Dexie 4.
 * Fonte canónica: architecture-v2.md §6.1-6.5 + §6.6-6.10 (interfaces lógicas).
 *
 * Constitution Article IV — No Invention: NUNCA adicionar campos não previstos
 * pelo architecture sem actualizar primeiro o documento e validação @architect.
 */

// ═══════════════════════════════════════════════════════════════════
// Epic 1 — Cérebro
// ═══════════════════════════════════════════════════════════════════

export interface ToolCall {
  toolName: string;
  args: unknown;
  result: unknown;
  durationMs: number;
  reverted: boolean;
}

export interface AgentRun {
  id: string;
  timestamp: number;
  prompt: string;
  intents: string[];
  toolCalls: ToolCall[];
  status: 'success' | 'partial' | 'failed' | 'reverted';
  durationMs: number;
  modelClassifier: string;
  modelExecutor: string;
  inputTokens: number;
  outputTokens: number;
  errorMessage?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  agentRunId?: string;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════
// Epic 2 — Tarefas
// ═══════════════════════════════════════════════════════════════════

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'blocked' | 'done';
  dueDate: string | null;
  projectId: string | null;
  tags: string[];
  context: string | null;
  lastWorkedAt: number | null;
  recurrenceId: string | null;
  parentTaskId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'done';
  startDate: string;
  deadline: string | null;
  createdAt: number;
}

export interface Recurrence {
  id: string;
  rule: string; // RRULE string
  startDate: string;
  endDate: string | null;
  ownerType: 'task' | 'transaction' | 'habit' | 'reminder';
  ownerId: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

// ═══════════════════════════════════════════════════════════════════
// Epic 3 — Finanças
// ═══════════════════════════════════════════════════════════════════

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'cash';
  balance: number; // cêntimos
  createdAt: number;
}

export interface Card {
  id: string;
  name: string;
  accountId: string;
  closingDay: number;
  dueDay: number;
  limit: number | null;
}

export interface Transaction {
  id: string;
  amount: number; // cêntimos. Negativo = saída, positivo = entrada
  category: string;
  description: string;
  date: string; // ISO date
  accountId: string | null;
  cardId: string | null;
  recurrenceId: string | null;
  installmentId: string | null;
  createdAt: number;
}

export interface Installment {
  id: string;
  cardId: string;
  totalAmount: number;
  installments: number;
  startDate: string;
  description: string;
}

export interface Category {
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
}

/**
 * Recorrência financeira (FR17) — Story 3.4.
 *
 * Template de uma despesa/receita recorrente (renda, Netflix, seguro). A RRULE
 * + datas vivem na tabela genérica `recurrences` (`ownerType: 'transaction'`,
 * `ownerId === FinanceRecurrence.id`); esta interface guarda os campos de
 * domínio financeiro que a tabela `recurrences` genérica não tem.
 *
 * `amount` em cêntimos inteiros com sinal — negativo = saída, positivo = entrada
 * (mesma convenção de `Transaction.amount`, linha 117).
 */
export interface FinanceRecurrence {
  id: string;
  amount: number; // cêntimos inteiros, com sinal (negativo = saída, positivo = entrada)
  category: string; // nome da categoria (FK lógica para categories.name)
  description: string; // descrição template (pode ser vazia)
  accountId: string | null;
  cardId: string | null;
  recurrenceId: string; // FK para recurrences.id (a RRULE + datas)
  createdAt: number; // epoch ms
}

// ═══════════════════════════════════════════════════════════════════
// Epic 4 — Hábitos / Metas / Lembretes
// ═══════════════════════════════════════════════════════════════════

export interface Habit {
  id: string;
  name: string;
  frequency: string; // RRULE
  category: string;
  time?: string; // FR24 — horário opcional sugerido (HH:MM, 24h). Não-indexado (Story 4.1).
  metric?: { unit: string; target: number };
  archivedAt?: number; // Story 4.2 — epoch ms do arquivo; undefined = activo. Não-indexado (sem version bump).
  createdAt: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // ISO date
  value?: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string; // FR39 — descrição opcional. Não-indexado (Story 4.1).
  type: 'numeric' | 'boolean';
  target: number;
  current: number;
  deadline: string | null;
  status: 'active' | 'achieved' | 'cancelled';
  // milestones embebido (Architect Gate Story 4.1, [GAP-4.1b]): sub-agregado de
  // baixa cardinalidade, lido sempre no contexto do Goal. `at` = valor-alvo
  // numérico (threshold em que `reached` vira true), coerente com `target` em
  // goals 'numeric'; em goals 'boolean' é um passo qualitativo (`note`).
  milestones: Array<{ at: number; reached: boolean; note?: string }>;
  // Story 4.5 (FR40) — histórico de actualizações do `current`. Cada entrada é
  // o valor de `current` registado numa data (`YYYY-MM-DD`) com nota opcional.
  // Campo embebido NÃO-indexado: extensão de schema sem version bump (mesmo
  // precedente de `Habit.archivedAt?`). `undefined` = meta sem histórico
  // (metas criadas antes da 4.5 — o GoalView mostra "Sem histórico").
  progressLog?: Array<{ date: string; value: number; note?: string }>;
}

export interface Reminder {
  id: string;
  text: string;
  fireAt: number; // epoch ms
  recurrenceId: string | null;
  channels: Array<'push' | 'telegram'>;
  status: 'pending' | 'sent' | 'cancelled' | 'snoozed';
}

// ═══════════════════════════════════════════════════════════════════
// Epic 5 — Diário / Conhecimento
// ═══════════════════════════════════════════════════════════════════

export interface JournalEntry {
  id: string;
  date: string; // ISO date YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5;
  bodyMarkdown: string;
  structuredAI?: { whatHappened?: string; whatLearned?: string; whatFelt?: string };
}

export interface KnowledgeArea {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface KnowledgeNotebook {
  id: string;
  areaId: string;
  name: string;
}

export interface KnowledgeNote {
  id: string;
  notebookId: string;
  title: string;
  bodyMarkdown: string;
  tags: string[];
  sourceUrl?: string;
  updatedAt: number;
}

/**
 * Brain Dump (FR47-49) — Story 5.1, decisão @architect `D-BRAINDUMP-STORE`.
 * Tabela Dexie `version(5)` (não estado transitório): o `status` é uma máquina
 * de estados que atravessa sessões (parse → aprovação item-a-item). `parsedOutput`
 * é `unknown` deliberado — o tipo exacto dos 4 buckets AI é definido na Story 5.7
 * (parser AI), evitando coupling nesta story de schema.
 */
export interface BrainDump {
  id: string;
  createdAt: number; // epoch ms — índice historial DESC (FR47)
  bodyMarkdown: string; // input original (FR47)
  parsedOutput?: unknown; // 4 buckets AI (FR48); tipo exacto definido na Story 5.7
  status: 'pending' | 'parsed' | 'partially_approved' | 'fully_approved';
}

// ═══════════════════════════════════════════════════════════════════
// Epic 6 — Google Calendar (sync pull)
// ═══════════════════════════════════════════════════════════════════

/**
 * Evento de calendário sincronizado do Google Calendar (Story 6.3 — FR59 PULL).
 * Decisão @architect `[D-6.3-SCHEMA]`: tabela Dexie `version(6)` com índice ÚNICO
 * `&googleId` para idempotência (re-sync do mesmo evento não cria duplicados).
 *
 * Campos temporais em `number` (epoch ms), padrão `Reminder.fireAt` — NÃO string.
 * `startAt`/`endAt` derivam de `start.dateTime`/`end.dateTime` (com hora) ou de
 * `start.date`/`end.date` (dia inteiro → `allDay: true`). `updatedAt` (de
 * `items[].updated`) suporta a reconciliação última-escrita-vence.
 */
export interface CalendarEvent {
  id: string; // PK Nexus (crypto.randomUUID — mesmo gerador dos repos existentes)
  // Story 6.4 (C2 / [D-6.4-SYNCSTATUS]): `googleId` passa a OPCIONAL para
  // representar a classe "local-pendente" — evento criado no Nexus ainda não
  // sincronizado com o Google (ausente = local-pendente; presente = sincronizado).
  // O índice `&googleId` mantém-se único e ESPARSO (Dexie não indexa registos
  // sem a property → não colidem). Alteração aditiva-relaxante: SEM version bump
  // (não toca `client.ts`). O produtor de eventos locais é a Story 6.6 (Draft);
  // o pull (6.3, `calendar.ts:168`) continua a escrever sempre `googleId`.
  googleId?: string; // items[].id — índice ÚNICO esparso &googleId p/ idempotência
  title: string; // items[].summary (default '' se vazio)
  startAt: number; // epoch ms — de start.dateTime OU start.date (allDay)
  endAt: number; // epoch ms — de end.dateTime OU end.date
  allDay: boolean; // true quando o Google devolve start.date (sem dateTime)
  updatedAt: number; // epoch ms de items[].updated (reconciliação)
}
