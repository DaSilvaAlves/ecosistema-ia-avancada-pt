import Dexie, { type Table } from 'dexie';
import type {
  Task,
  Project,
  Recurrence,
  Tag,
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
 * Nexus v2 — Dexie 4 client (Story 0.3 + Story 2.1)
 *
 * Schema version 1 — fonte canónica architecture-v2.md §4.2.
 * Constitution Article IV — não inventar tabelas/campos.
 *
 * Epic 2 incrementa para version 2 (adiciona `recurrences` genérica
 * partilhada entre Epics 2/3/4 — architecture §16 L1128 — e `tags` globais).
 * Epic 3 incrementa para version 3 (accounts, cards, installments, categories).
 * Cada Epic adiciona `this.version(N+1).stores({...})` sem reescrever o anterior.
 */

export class NexusDB extends Dexie {
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  recurrences!: Table<Recurrence, string>;
  tags!: Table<Tag, string>;
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
    // Story 2.1 — Epic 2 schema increment.
    // Aditivo: Dexie preserva tasks/projects + restantes 11 tabelas de version(1).
    // Apenas as 2 tabelas novas (recurrences, tags) são adicionadas.
    // - recurrences: tabela genérica reutilizada por tasks/transactions/habits/reminders
    //   (architecture §6.2 L512-519, §16 L1128). Índice composto [ownerType+ownerId]
    //   serve `getRecurrenceByOwner` — padrão consistente com [habitId+date] / [conversationId+timestamp].
    // - tags: definições globais (id, name, color). Vínculo tarefa↔tag vive em
    //   Task.tags: string[] denormalizado + índice multi-entry *tags em `tasks`
    //   (Story 0.3, version(1)). PO Q1 — `Task.tags` guarda IDs, não nomes.
    //   PO Q2 — sem &name; unicidade case-insensitive verificada no repo.
    this.version(2).stores({
      recurrences: 'id, ownerType, ownerId, [ownerType+ownerId]',
      tags: 'id, name',
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
