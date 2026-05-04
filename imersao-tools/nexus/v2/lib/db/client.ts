import Dexie, { type Table } from 'dexie';
import type {
  Task,
  Project,
  Transaction,
  Habit,
  HabitLog,
  Goal,
  Reminder,
  JournalEntry,
  KnowledgeArea,
  KnowledgeNotebook,
  KnowledgeNote,
  AgentRun,
  ChatMessage,
} from '@/types/db';

/**
 * Nexus v2 — Dexie 4 client (Story 0.3)
 *
 * Schema version 1 — fonte canónica architecture-v2.md §4.2.
 * Constitution Article IV — não inventar tabelas/campos.
 *
 * Epic 2 incrementa para version 2 (adiciona installments, accounts, cards).
 * Epic 3 incrementa para version 3 (categorias, etc.). Cada Epic adiciona
 * `this.version(N+1).stores({...})` sem reescrever o anterior.
 */

export class NexusDB extends Dexie {
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  transactions!: Table<Transaction, string>;
  habits!: Table<Habit, string>;
  habit_logs!: Table<HabitLog, string>;
  goals!: Table<Goal, string>;
  reminders!: Table<Reminder, string>;
  journal_entries!: Table<JournalEntry, string>;
  knowledge_areas!: Table<KnowledgeArea, string>;
  knowledge_notebooks!: Table<KnowledgeNotebook, string>;
  knowledge_notes!: Table<KnowledgeNote, string>;
  agent_runs!: Table<AgentRun, string>;
  chat_messages!: Table<ChatMessage, string>;

  constructor() {
    super('nexus_v2');
    this.version(1).stores({
      tasks: 'id, status, projectId, dueDate, *tags, createdAt, lastWorkedAt',
      projects: 'id, status, createdAt',
      transactions: 'id, accountId, cardId, category, date, recurrenceId, [accountId+date]',
      habits: 'id, frequency, category, createdAt',
      habit_logs: 'id, habitId, date, [habitId+date]',
      goals: 'id, status, deadline',
      reminders: 'id, fireAt, status, [status+fireAt]',
      journal_entries: 'id, date, mood',
      knowledge_areas: 'id, name',
      knowledge_notebooks: 'id, areaId',
      knowledge_notes: 'id, notebookId, *tags, updatedAt',
      agent_runs: 'id, timestamp, [timestamp+status]',
      chat_messages: 'id, conversationId, timestamp, [conversationId+timestamp]',
    });
  }
}

/**
 * Singleton — usar `db` em todo o app.
 * Em SSR (RSC), `db` não deve ser usado directamente: queries Dexie só fazem
 * sentido client-side. Componentes que usam `useLiveQuery` devem ser
 * marcados `'use client'`.
 */
export const db = new NexusDB();
