/**
 * Story 1.10 — Builders de sequências SSE determinísticas para Playwright.
 *
 * BLOCKER ARQUITECTURAL RESOLVIDO:
 * Os MSW handlers de `tests/mocks/handlers/anthropic.ts` correm no Vitest
 * Node server e NÃO são interceptados pelo Playwright (browser real). Para
 * Playwright determinístico em CI, intercepta-se o endpoint interno
 * `POST /api/agent/prompt` via `page.route()` (ver `route-handler.ts`)
 * e emite-se uma sequência de `ExecutorSSEEvent` consistente com o protocolo
 * implementado em `lib/agent/executor.ts`.
 *
 * Cada `MockProfile` no fixture mapeia para uma factory aqui que retorna
 * um array de eventos SSE prontos a serializar como `event: TYPE\ndata: JSON\n\n`.
 *
 * Decisão consistente com D1 (Opção C híbrida — MSW determinístico em CI;
 * subset `@real-api` em staging contra Anthropic real). Em staging, o flag
 * `USE_REAL_API=true` desactiva o `page.route()` e o pipeline corre normal.
 */

import type { MockProfile } from './types';

export interface SseEvent {
  event: string;
  data: unknown;
}

const TOOL_DURATION_MS = 25;

function meta(runId: string, classification: { intents: string[]; confidence: Record<string, number> }): SseEvent {
  return {
    event: 'meta',
    data: { type: 'meta', runId, classification },
  };
}

function toolStart(runId: string, toolName: string, args: unknown, toolCallId: string): SseEvent {
  return {
    event: 'tool_start',
    data: { type: 'tool_start', runId, toolName, toolCallId, args },
  };
}

function toolComplete(
  runId: string,
  toolName: string,
  args: unknown,
  result: unknown,
  toolCallId: string
): SseEvent {
  return {
    event: 'tool_complete',
    data: {
      type: 'tool_complete',
      runId,
      toolName,
      toolCallId,
      args,
      result,
      durationMs: TOOL_DURATION_MS,
    },
  };
}

function toolError(runId: string, toolName: string, error: string, toolCallId: string): SseEvent {
  return {
    event: 'tool_error',
    data: {
      type: 'tool_error',
      runId,
      toolName,
      toolCallId,
      error,
      durationMs: TOOL_DURATION_MS,
    },
  };
}

function textDelta(runId: string, text: string): SseEvent {
  return {
    event: 'text_delta',
    data: { type: 'text_delta', runId, text },
  };
}

function previewRequest(runId: string, toolName: string, args: unknown, reason: string): SseEvent {
  return {
    event: 'preview_request',
    data: {
      type: 'preview_request',
      runId,
      toolName,
      args,
      reason,
    },
  };
}

function done(runId: string, status: 'completed' | 'partial' | 'failed' | 'aborted' = 'completed'): SseEvent {
  return {
    event: 'done',
    data: { type: 'done', runId, status },
  };
}

function multiIntentCanonical(runId: string): SseEvent[] {
  return [
    meta(runId, {
      intents: ['calendar', 'finance'],
      confidence: { calendar: 0.95, finance: 0.93 },
    }),
    toolStart(runId, 'criar_evento_calendar', { titulo: 'reunião', hora: '15:00' }, 'tc_001'),
    toolComplete(
      runId,
      'criar_evento_calendar',
      { titulo: 'reunião', hora: '15:00' },
      { eventId: 'evt_001', summary: 'reunião 15:00' },
      'tc_001'
    ),
    toolStart(runId, 'criar_finança_variavel', { valor: 78.7, descricao: 'supermercado' }, 'tc_002'),
    toolComplete(
      runId,
      'criar_finança_variavel',
      { valor: 78.7, descricao: 'supermercado' },
      { transactionId: 'tx_001', amount: 78.7 },
      'tc_002'
    ),
    textDelta(runId, 'Evento e despesa registados.'),
    done(runId, 'completed'),
  ];
}

function multiIntentTasksCalendar(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['tasks', 'calendar'], confidence: { tasks: 0.92, calendar: 0.88 } }),
    toolStart(runId, 'criar_tarefa', { titulo: 'comprar pão' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'comprar pão' }, { taskId: 't_001' }, 'tc_001'),
    toolStart(runId, 'criar_evento_calendar', { titulo: 'dentista', hora: '10:00' }, 'tc_002'),
    toolComplete(
      runId,
      'criar_evento_calendar',
      { titulo: 'dentista', hora: '10:00' },
      { eventId: 'evt_002' },
      'tc_002'
    ),
    done(runId, 'completed'),
  ];
}

function multiIntentReminderFinance(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['reminder', 'finance'], confidence: { reminder: 0.9, finance: 0.91 } }),
    toolStart(runId, 'criar_lembrete', { texto: 'pagar luz', hora: '18:00' }, 'tc_001'),
    toolComplete(runId, 'criar_lembrete', { texto: 'pagar luz' }, { reminderId: 'r_001' }, 'tc_001'),
    toolStart(runId, 'criar_finança_variavel', { valor: 45, descricao: 'água' }, 'tc_002'),
    toolComplete(runId, 'criar_finança_variavel', { valor: 45 }, { transactionId: 'tx_002' }, 'tc_002'),
    done(runId, 'completed'),
  ];
}

function multiIntentTasksReminder(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['tasks', 'reminder'], confidence: { tasks: 0.9, reminder: 0.87 } }),
    toolStart(runId, 'criar_tarefa', { titulo: 'rever PRD' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'rever PRD' }, { taskId: 't_002' }, 'tc_001'),
    toolStart(runId, 'criar_lembrete', { texto: 'levar carro à oficina', hora: '08:00' }, 'tc_002'),
    toolComplete(runId, 'criar_lembrete', { texto: 'levar carro' }, { reminderId: 'r_002' }, 'tc_002'),
    done(runId, 'completed'),
  ];
}

function multiIntentTriple(runId: string): SseEvent[] {
  return [
    meta(runId, {
      intents: ['tasks', 'reminder', 'calendar'],
      confidence: { tasks: 0.9, reminder: 0.85, calendar: 0.88 },
    }),
    toolStart(runId, 'criar_tarefa', { titulo: 'enviar relatório' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'enviar relatório' }, { taskId: 't_003' }, 'tc_001'),
    toolStart(runId, 'criar_lembrete', { texto: 'reunião quarta', hora: '09:00' }, 'tc_002'),
    toolComplete(runId, 'criar_lembrete', { texto: 'reunião quarta' }, { reminderId: 'r_003' }, 'tc_002'),
    toolStart(runId, 'criar_evento_calendar', { titulo: 'reunião cliente' }, 'tc_003'),
    toolComplete(runId, 'criar_evento_calendar', { titulo: 'reunião cliente' }, { eventId: 'evt_003' }, 'tc_003'),
    done(runId, 'completed'),
  ];
}

function multiIntentWithError(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['tasks'], confidence: { tasks: 0.9 } }),
    toolStart(runId, 'criar_tarefa', { titulo: 'tarefa A' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'tarefa A' }, { taskId: 't_a' }, 'tc_001'),
    toolStart(runId, 'criar_tarefa', { titulo: 'tarefa B' }, 'tc_002'),
    toolError(runId, 'criar_tarefa', 'Validation failed: titulo too short', 'tc_002'),
    done(runId, 'partial'),
  ];
}

function singleTask(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['tasks'], confidence: { tasks: 0.95 } }),
    toolStart(runId, 'criar_tarefa', { titulo: 'tarefa de teste' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'tarefa de teste' }, { taskId: 't_x' }, 'tc_001'),
    done(runId, 'completed'),
  ];
}

function singleTaskComplete(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['tasks'], confidence: { tasks: 0.95 } }),
    toolStart(runId, 'completar_tarefa', { taskId: 't_y' }, 'tc_001'),
    toolComplete(runId, 'completar_tarefa', { taskId: 't_y' }, { ok: true }, 'tc_001'),
    done(runId, 'completed'),
  ];
}

function singleFinanceVariable(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['finance'], confidence: { finance: 0.94 } }),
    toolStart(runId, 'criar_finança_variavel', { valor: 50, descricao: 'compra' }, 'tc_001'),
    toolComplete(
      runId,
      'criar_finança_variavel',
      { valor: 50, descricao: 'compra' },
      { transactionId: 'tx_x' },
      'tc_001'
    ),
    done(runId, 'completed'),
  ];
}

function singleFinanceRecurring(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['finance'], confidence: { finance: 0.93 } }),
    toolStart(runId, 'criar_finança_recorrente', { valor: 11.99, descricao: 'subscrição' }, 'tc_001'),
    toolComplete(
      runId,
      'criar_finança_recorrente',
      { valor: 11.99 },
      { recurringId: 'rec_x' },
      'tc_001'
    ),
    done(runId, 'completed'),
  ];
}

function singleFinanceCard(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['finance'], confidence: { finance: 0.92 } }),
    toolStart(runId, 'criar_finança_cartao', { valor: 230, descricao: 'fatura cartão' }, 'tc_001'),
    toolComplete(runId, 'criar_finança_cartao', { valor: 230 }, { cardChargeId: 'cc_x' }, 'tc_001'),
    done(runId, 'completed'),
  ];
}

function singleCalendar(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['calendar'], confidence: { calendar: 0.94 } }),
    toolStart(runId, 'criar_evento_calendar', { titulo: 'evento' }, 'tc_001'),
    toolComplete(runId, 'criar_evento_calendar', { titulo: 'evento' }, { eventId: 'evt_x' }, 'tc_001'),
    done(runId, 'completed'),
  ];
}

function singleReminder(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['reminder'], confidence: { reminder: 0.91 } }),
    toolStart(runId, 'criar_lembrete', { texto: 'lembrete' }, 'tc_001'),
    toolComplete(runId, 'criar_lembrete', { texto: 'lembrete' }, { reminderId: 'r_x' }, 'tc_001'),
    done(runId, 'completed'),
  ];
}

function previewLowConfidence(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['tasks'], confidence: { tasks: 0.55 } }),
    previewRequest(runId, 'criar_tarefa', { titulo: 'algo ambíguo' }, 'low_confidence'),
    toolStart(runId, 'criar_tarefa', { titulo: 'algo ambíguo' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'algo ambíguo' }, { taskId: 't_amb' }, 'tc_001'),
    done(runId, 'completed'),
  ];
}

function previewDestructive(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['tasks'], confidence: { tasks: 0.92 } }),
    previewRequest(runId, 'eliminar_tarefa', { taskId: 't_old' }, 'destructive'),
    toolStart(runId, 'eliminar_tarefa', { taskId: 't_old' }, 'tc_001'),
    toolComplete(runId, 'eliminar_tarefa', { taskId: 't_old' }, { ok: true }, 'tc_001'),
    done(runId, 'completed'),
  ];
}

function toolErrorGeneric(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['tasks'], confidence: { tasks: 0.9 } }),
    toolStart(runId, 'criar_tarefa', { titulo: 'erro' }, 'tc_001'),
    toolError(runId, 'criar_tarefa', 'Tool execution failed: simulated error', 'tc_001'),
    done(runId, 'failed'),
  ];
}

function toolErrorBadArgs(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['finance'], confidence: { finance: 0.85 } }),
    toolStart(runId, 'criar_finança_variavel', { valor: -1 }, 'tc_001'),
    toolError(runId, 'criar_finança_variavel', 'Args invalid: valor must be positive', 'tc_001'),
    done(runId, 'failed'),
  ];
}

function toolErrorUnknown(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['tasks'], confidence: { tasks: 0.85 } }),
    toolStart(runId, 'tool_xyz_inexistente', {}, 'tc_001'),
    toolError(runId, 'tool_xyz_inexistente', 'Unknown tool: tool_xyz_inexistente', 'tc_001'),
    done(runId, 'failed'),
  ];
}

function abortDuringStream(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: ['tasks'], confidence: { tasks: 0.9 } }),
    toolStart(runId, 'criar_tarefa', { titulo: 'tarefa abort' }, 'tc_001'),
    done(runId, 'aborted'),
  ];
}

function textOnly(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: [], confidence: {} }),
    textDelta(runId, 'Olá! Como posso ajudar-te?'),
    done(runId, 'completed'),
  ];
}

function textOnlyFast(runId: string): SseEvent[] {
  return [
    meta(runId, { intents: [], confidence: {} }),
    textDelta(runId, 'Olá!'),
    done(runId, 'completed'),
  ];
}

const PROFILE_BUILDERS: Record<MockProfile, (runId: string) => SseEvent[]> = {
  'multi-intent-canonical-ac1': multiIntentCanonical,
  'multi-intent-tasks-calendar': multiIntentTasksCalendar,
  'multi-intent-reminder-finance': multiIntentReminderFinance,
  'multi-intent-tasks-reminder': multiIntentTasksReminder,
  'multi-intent-triple': multiIntentTriple,
  'multi-intent-with-error': multiIntentWithError,
  'single-task': singleTask,
  'single-task-complete': singleTaskComplete,
  'single-finance-variable': singleFinanceVariable,
  'single-finance-recurring': singleFinanceRecurring,
  'single-finance-card': singleFinanceCard,
  'single-calendar': singleCalendar,
  'single-reminder': singleReminder,
  'preview-low-confidence': previewLowConfidence,
  'preview-destructive': previewDestructive,
  'tool-error': toolErrorGeneric,
  'tool-error-bad-args': toolErrorBadArgs,
  'tool-error-unknown': toolErrorUnknown,
  'abort-during-stream': abortDuringStream,
  'text-only': textOnly,
  'text-only-fast': textOnlyFast,
};

export function buildMockSseEvents(profile: MockProfile, runId: string): SseEvent[] {
  const builder = PROFILE_BUILDERS[profile];
  if (!builder) {
    throw new Error(`[mock-events] Unknown profile: ${profile}`);
  }
  return builder(runId);
}

export function serializeSseEvents(events: SseEvent[]): string {
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join('');
}
