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

// ═══════════════════════════════════════════════════════════════════
// Epic 4 — Hábitos / Metas / Lembretes
// ═══════════════════════════════════════════════════════════════════

export interface Habit {
  id: string;
  name: string;
  frequency: string; // RRULE
  category: string;
  metric?: { unit: string; target: number };
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
  type: 'numeric' | 'boolean';
  target: number;
  current: number;
  deadline: string | null;
  status: 'active' | 'achieved' | 'cancelled';
  milestones: Array<{ at: number; reached: boolean; note?: string }>;
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
