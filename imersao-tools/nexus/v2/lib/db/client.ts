import Dexie, { type Table } from 'dexie';
import type {
  Task,
  Project,
  Recurrence,
  Tag,
  Transaction,
  Account,
  Card,
  Installment,
  Category,
  FinanceRecurrence,
  Habit,
  HabitLog,
  Goal,
  Reminder,
  JournalEntry,
  KnowledgeArea,
  KnowledgeNotebook,
  KnowledgeNote,
  BrainDump,
  AgentRun,
  ChatMessage,
  CalendarEvent,
} from '@/types/db';

/**
 * Nexus v2 — Dexie 4 client (Story 0.3 + Story 2.1 + Story 3.1)
 *
 * Schema version 1 — fonte canónica architecture-v2.md §4.2.
 * Constitution Article IV — não inventar tabelas/campos.
 *
 * Epic 2 incrementa para version 2 (adiciona `recurrences` genérica
 * partilhada entre Epics 2/3/4 — architecture §16 L1128 — e `tags` globais).
 * Epic 3 incrementa para version 3 (accounts, cards, installments, categories)
 * e para version 4 (financeRecurrences — Story 3.4).
 * Cada Epic adiciona `this.version(N+1).stores({...})` sem reescrever o anterior.
 *
 * Story 3.1 — version 3 (Epic 3 Finanças):
 * - 4 tabelas novas: accounts, cards, installments, categories.
 * - `transactions` JÁ EXISTE em version(1) — NÃO recriada. version(3)
 *   re-declara `transactions` apenas para ADICIONAR o índice composto
 *   `[cardId+date]` ([AUTO-DECISION] A4 — vista cartões da Story 3.8 filtra
 *   por cartão + range de datas). Re-declarar uma tabela num version() posterior
 *   é o mecanismo Dexie aditivo de alteração de índices — preserva os dados.
 * - `recurrences` JÁ EXISTE em version(2) — NÃO recriada. Para finanças
 *   recorrentes (FR17, Story 3.4) usar `ownerType: 'transaction'` no repo
 *   existente. [GAP-3.1] RESOLVIDO: a tabela `recurrences` é genérica por
 *   `ownerType` (types/db.ts:84) — sem extensão de schema necessária.
 * - Interfaces Account/Card/Transaction/Installment/Category vivem em
 *   types/db.ts:98-142 (Story 0.3) — version(3) só liga as tabelas.
 *
 * Story 3.4 — version 4 (Epic 3 Finanças recorrentes, FR17):
 * - 1 tabela nova: financeRecurrences. Guarda o template financeiro de uma
 *   recorrência (valor, categoria, conta/cartão). A RRULE + datas continuam
 *   na tabela genérica `recurrences` com `ownerType: 'transaction'` e
 *   `ownerId === financeRecurrence.id` ([AUTO-DECISION] A1). Índice
 *   `recurrenceId` serve a navegação template → RRULE.
 * - Aditivo: Dexie preserva as 19 tabelas de version(3) → 20.
 * - Interface FinanceRecurrence vive em types/db.ts (Story 3.4).
 */

export class NexusDB extends Dexie {
  tasks!: Table<Task, string>;
  projects!: Table<Project, string>;
  recurrences!: Table<Recurrence, string>;
  tags!: Table<Tag, string>;
  transactions!: Table<Transaction, string>;
  accounts!: Table<Account, string>;
  cards!: Table<Card, string>;
  installments!: Table<Installment, string>;
  categories!: Table<Category, string>;
  financeRecurrences!: Table<FinanceRecurrence, string>;
  habits!: Table<Habit, string>;
  habit_logs!: Table<HabitLog, string>;
  goals!: Table<Goal, string>;
  reminders!: Table<Reminder, string>;
  journal_entries!: Table<JournalEntry, string>;
  knowledge_areas!: Table<KnowledgeArea, string>;
  knowledge_notebooks!: Table<KnowledgeNotebook, string>;
  knowledge_notes!: Table<KnowledgeNote, string>;
  brain_dumps!: Table<BrainDump, string>;
  agent_runs!: Table<AgentRun, string>;
  chat_messages!: Table<ChatMessage, string>;
  calendarEvents!: Table<CalendarEvent, string>;

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
    // Story 3.1 — Epic 3 schema increment (Finanças).
    // Aditivo: Dexie preserva as 15 tabelas de version(2). Apenas as 4 tabelas
    // novas (accounts, cards, installments, categories) são adicionadas → 19.
    // - accounts: contas bancárias com saldo (FR18). `balance` em cêntimos.
    // - cards: cartões de crédito (FR18). `closingDay`/`dueDay` para fatura.
    // - installments: compras parceladas vinculadas a cartão (FR19). Índice
    //   composto [cardId+startDate] serve `listInstallmentsByCard`.
    // - categories: categorias de transações (FR16/FR22). PK é `name`
    //   ([AUTO-DECISION] A3, ratificada @po) — `Transaction.category` referencia
    //   o nome directamente (types/db.ts:118), evita join.
    // - transactions: re-declarada apenas para adicionar o índice composto
    //   [cardId+date] ([AUTO-DECISION] A4 — vista cartões Story 3.8). A tabela
    //   e os dados são preservados; só o índice é adicionado. Os índices
    //   anteriores de version(1) mantêm-se (Dexie aplica o conjunto declarado
    //   na versão mais recente).
    this.version(3).stores({
      accounts: 'id, type, createdAt',
      cards: 'id, accountId, closingDay, dueDay',
      installments: 'id, cardId, startDate, [cardId+startDate]',
      categories: 'name, isDefault',
      transactions:
        'id, accountId, cardId, category, date, recurrenceId, [accountId+date], [cardId+date]',
    });
    // Story 3.4 — Epic 3 schema increment (Finanças recorrentes, FR17).
    // Aditivo: Dexie preserva as 19 tabelas de version(3). Apenas a tabela
    // nova `financeRecurrences` é adicionada → 20.
    // - financeRecurrences: template financeiro de uma recorrência (valor,
    //   categoria, conta/cartão). A RRULE + datas vivem na tabela genérica
    //   `recurrences` (`ownerType: 'transaction'`, `ownerId === fr.id`,
    //   [AUTO-DECISION] A1). Índice `recurrenceId` serve a navegação
    //   template → RRULE em `deleteFinanceRecurrence`.
    this.version(4).stores({
      financeRecurrences: 'id, recurrenceId',
    });
    // Story 5.1 — Epic 5 schema increment (Brain Dump, FR47-49).
    // Decisão @architect `D-BRAINDUMP-STORE`: brain_dumps é tabela Dexie (não
    // estado transitório) — o `status` é uma máquina de estados que atravessa
    // sessões (parse → aprovação item-a-item, FR48/FR49). As 4 tabelas do Epic 5
    // (journal_entries, knowledge_*) já existiam em version(1) — NÃO recriadas.
    // Aditivo: Dexie preserva as 20 tabelas de version(4) → 21. brain_dumps é a
    // única tabela nova desta story.
    // - createdAt: índice para `listBrainDumps` ordenado DESC (historial, FR47).
    // - status: índice para os filtros do approval flow (Story 5.8).
    this.version(5).stores({
      brain_dumps: 'id, createdAt, status',
    });
    // Story 6.3 — Epic 6 schema increment (Google Calendar sync pull, FR59).
    // Decisão @architect `[D-6.3-SCHEMA]`: tabela `calendarEvents` para os eventos
    // sincronizados do Google Calendar (direcção PULL). Aditivo: Dexie preserva as
    // 21 tabelas de version(5) → 22. Única tabela nova desta story.
    // - &googleId: índice ÚNICO (idempotência por googleId — re-sync do mesmo
    //   evento faz upsert, nunca duplica; AC3). O delete de cancelados (AC4) e o
    //   upsert resolvem o registo Nexus via este índice.
    // - startAt/endAt: índices para queries da Story 6.6 (tool listar_eventos).
    // - updatedAt: reconciliação última-escrita-vence (items[].updated).
    // - [startAt+endAt]: índice composto para queries de range (eventos num
    //   intervalo) que a 6.6 vai precisar.
    this.version(6).stores({
      calendarEvents: 'id, &googleId, startAt, endAt, updatedAt, [startAt+endAt]',
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
