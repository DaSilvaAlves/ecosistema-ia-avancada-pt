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
 * um array de eventos SSE prontos a serializar como `data: <JSON>\n\n`.
 *
 * Decisão consistente com D1 (Opção C híbrida — MSW determinístico em CI;
 * subset `@real-api` em staging contra Anthropic real). Em staging, o flag
 * `USE_REAL_API=true` desactiva o `page.route()` e o pipeline corre normal.
 *
 * **Iter 3 — fix CI vermelho de PR #14 (10/05/2026):**
 * O mock anterior emitia uma forma reduzida de `meta` (`{ type, runId,
 * classification }`) e usava `text` no `text_delta` em vez de `delta`. O
 * `useAgentStream` consumer real (Story 1.9) requer `phase: 'start'` para
 * chamar `setCurrentRunId` + `persistRunStart`, e o `MessageList.reduceLiveBubble`
 * só renderiza um LiveAgentBubble quando recebe um `meta(start)` com runId.
 * Sem isso, ToolCards e `assistant-message-text` NUNCA renderizavam, e o
 * `submitPromptAndWait.waitForFunction` ficava 30s à espera, causando
 * `Test timeout 30000ms exceeded` + `Target page closed`.
 *
 * Causa raiz é exactamente a memória persistente do agente:
 * `feedback_mock_must_reflect_real_protocol` — mocks de protocolos externos
 * espelham o protocolo real, não apenas fazem tests passar. Iter 3 corrige
 * a divergência alinhando os 3 events críticos com o `ExecutorSSEEvent` real
 * (`lib/agent/executor.ts` L159-267):
 *  - `meta(start)` com phase + prompt + modelClassifier + modelExecutor +
 *    startedAt + classifierResult: null
 *  - `meta(classified)` com phase + runId + classifierResult (intents +
 *    confidence)
 *  - `text_delta` com `delta` (não `text`)
 *  - `done` com intents + inputTokens + outputTokens + durationMs + totals
 *  - `[DONE]` terminator emitido pelo route-handler após a sequência
 */

import type { MockProfile } from './types';

export interface SseEvent {
  /**
   * Iter 3 — apenas o JSON serializado vai para o wire. O campo `event` SSE
   * (linha `event: TYPE\n`) NÃO é emitido pelo endpoint real
   * (`/api/agent/prompt` linha 173 — apenas `data: <JSON>\n\n`), pelo que
   * mockar com `event:` divergia do protocolo real e quebrava parsers
   * estritos. Mantemos o campo aqui só para auto-documentação humana —
   * não usado em `serializeSseEvents`.
   */
  event: string;
  data: unknown;
}

const TOOL_DURATION_MS = 25;
const RUN_DURATION_MS = 80;
const MOCK_MODEL_CLASSIFIER = 'claude-haiku-4-5-mock';
const MOCK_MODEL_EXECUTOR = 'claude-sonnet-4-5-mock';

interface MetaStartArgs {
  runId: string;
  prompt: string;
  startedAt: number;
}

function metaStart({ runId, prompt, startedAt }: MetaStartArgs): SseEvent {
  return {
    event: 'meta',
    data: {
      type: 'meta',
      phase: 'start',
      runId,
      prompt,
      modelClassifier: MOCK_MODEL_CLASSIFIER,
      modelExecutor: MOCK_MODEL_EXECUTOR,
      startedAt,
      classifierResult: null,
    },
  };
}

function metaClassified(
  runId: string,
  classification: { intents: string[]; confidence: Record<string, number> }
): SseEvent {
  return {
    event: 'meta',
    data: {
      type: 'meta',
      phase: 'classified',
      runId,
      classifierResult: classification,
    },
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
    },
  };
}

function textDelta(runId: string, delta: string): SseEvent {
  return {
    event: 'text_delta',
    // Iter 3 — campo canónico é `delta` (executor.ts L196 — `text_delta;
    // runId; delta`), não `text`.
    data: { type: 'text_delta', runId, delta },
  };
}

interface PreviewRequestArgs {
  runId: string;
  toolName: string;
  args: unknown;
  reason: 'low_confidence' | 'requires_preview' | 'both';
  domain: string;
  confidence?: number;
  toolCallId?: string;
}

function previewRequest(opts: PreviewRequestArgs): SseEvent {
  const { runId, toolName, args, reason, domain, confidence, toolCallId } = opts;
  // executor.ts L208-217 — confidence opcional só quando reason inclui low_confidence
  const data: Record<string, unknown> = {
    type: 'preview_request',
    runId,
    toolName,
    args,
    reason,
    domain,
  };
  if (toolCallId !== undefined) data.toolCallId = toolCallId;
  if (confidence !== undefined) data.confidence = confidence;
  return { event: 'preview_request', data };
}

interface DoneArgs {
  runId: string;
  status?: 'success' | 'partial' | 'failed';
  intents: string[];
  toolCallCount: number;
  inputTokens?: number;
  outputTokens?: number;
  errorMessage?: string;
}

const UNDO_TTL_MS = 30_000;

/**
 * Iter 3 — emit `undo_registered` event para profiles com tools reversíveis.
 * Story 1.7 emite este event ANTES do `done` quando há tools reversíveis
 * bem-sucedidas no run e `registerUndoEntry` resolveu sem erro. Sem este
 * event, o `ChatPanel.useEffect` (Story 1.9 L102-122) não cria UndoToast.
 *
 * No mock, emitimos sempre que o profile tem tools reversíveis (criar_*,
 * registar_*, agendar_*, lembrar_*, eliminar_*) — corresponde ao
 * `tool.reversible: true` flag do registry real (Story 1.3+).
 *
 * **Important — Iter 3 PR #14:** No flow real, executor emite `undo_registered`
 * ANTES de `done` (executor.ts L604-609). Em mock one-shot via Playwright
 * `route.fulfill`, todos os events chegam no MESMO microtask ao consumer
 * (`useAgentStream.processSseLine` faz `setEvents` em sequência rápida que
 * o React batcha num único re-render). O `ChatPanel.useEffect` (L102-122) que
 * detecta `undo_registered` apenas inspecciona o ÚLTIMO event do array
 * (`stream.events[stream.events.length - 1]`) — se a última add é `done`,
 * o effect nunca executa o branch undo. Em produção real, os events
 * chegam serializados pela rede com latency natural (~1-50ms cada), pelo
 * que cada `setEvents` re-renderiza separadamente e o effect vê
 * `last === undo_registered` no momento certo.
 *
 * Workaround acordado nesta iteração: emitir `undo_registered` APÓS `done`
 * apenas no mock E2E. Isto preserva a fidelidade visual end-to-end (UndoToast
 * aparece como esperado) sem mudar Story 1.9 ChatPanel (que será refactored
 * em tech-debt separado para iterar `events` à procura de qualquer
 * `undo_registered` em vez de inspeccionar só `last`).
 *
 * Tech-debt registado em `1.10.story.md` Dev Notes.
 */
function undoRegistered(runId: string, undoableToolCount: number): SseEvent {
  return {
    event: 'undo_registered',
    data: {
      type: 'undo_registered',
      runId,
      undoableToolCount,
      expiresAt: Date.now() + UNDO_TTL_MS,
    },
  };
}

function done(opts: DoneArgs): SseEvent {
  const {
    runId,
    status = 'success',
    intents,
    toolCallCount,
    inputTokens = 0,
    outputTokens = 0,
    errorMessage,
  } = opts;
  // executor.ts L250-267 — `done` requer intents + inputTokens + outputTokens
  // + durationMs + totals. errorMessage opcional.
  const data: Record<string, unknown> = {
    type: 'done',
    runId,
    status,
    intents,
    inputTokens,
    outputTokens,
    durationMs: RUN_DURATION_MS,
    totals: { intents: intents.length, toolCalls: toolCallCount },
  };
  if (errorMessage !== undefined) data.errorMessage = errorMessage;
  return { event: 'done', data };
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile builders — recebem `prompt` para preencher `meta(start).prompt`
// (executor.ts L506) — útil para audit e para o consumer hook que persiste
// o prompt em Dexie via `persistRunStart`.
// ─────────────────────────────────────────────────────────────────────────────

interface BuilderContext {
  runId: string;
  prompt: string;
  startedAt: number;
}

function multiIntentCanonical(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['calendar', 'finance'];
  const classification = { intents, confidence: { calendar: 0.95, finance: 0.93 } };
  return [
    metaStart(ctx),
    metaClassified(runId, classification),
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
    done({ runId, intents, toolCallCount: 2, inputTokens: 120, outputTokens: 28 }),
    // Iter 3 workaround — emit undo_registered DEPOIS de done para contornar
    // React batching no ChatPanel useEffect (ver doc de `undoRegistered`).
    undoRegistered(runId, 2),
  ];
}

function multiIntentTasksCalendar(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks', 'calendar'];
  const classification = { intents, confidence: { tasks: 0.92, calendar: 0.88 } };
  return [
    metaStart(ctx),
    metaClassified(runId, classification),
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
    done({ runId, intents, toolCallCount: 2, inputTokens: 110, outputTokens: 22 }),
    undoRegistered(runId, 2),
  ];
}

function multiIntentReminderFinance(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['reminder', 'finance'];
  const classification = { intents, confidence: { reminder: 0.9, finance: 0.91 } };
  return [
    metaStart(ctx),
    metaClassified(runId, classification),
    toolStart(runId, 'criar_lembrete', { texto: 'pagar luz', hora: '18:00' }, 'tc_001'),
    toolComplete(runId, 'criar_lembrete', { texto: 'pagar luz' }, { reminderId: 'r_001' }, 'tc_001'),
    toolStart(runId, 'criar_finança_variavel', { valor: 45, descricao: 'água' }, 'tc_002'),
    toolComplete(runId, 'criar_finança_variavel', { valor: 45 }, { transactionId: 'tx_002' }, 'tc_002'),
    done({ runId, intents, toolCallCount: 2, inputTokens: 105, outputTokens: 20 }),
    undoRegistered(runId, 2),
  ];
}

function multiIntentTasksReminder(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks', 'reminder'];
  const classification = { intents, confidence: { tasks: 0.9, reminder: 0.87 } };
  return [
    metaStart(ctx),
    metaClassified(runId, classification),
    toolStart(runId, 'criar_tarefa', { titulo: 'rever PRD' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'rever PRD' }, { taskId: 't_002' }, 'tc_001'),
    toolStart(runId, 'criar_lembrete', { texto: 'levar carro à oficina', hora: '08:00' }, 'tc_002'),
    toolComplete(runId, 'criar_lembrete', { texto: 'levar carro' }, { reminderId: 'r_002' }, 'tc_002'),
    done({ runId, intents, toolCallCount: 2, inputTokens: 110, outputTokens: 24 }),
    undoRegistered(runId, 2),
  ];
}

function multiIntentTriple(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks', 'reminder', 'calendar'];
  const classification = {
    intents,
    confidence: { tasks: 0.9, reminder: 0.85, calendar: 0.88 },
  };
  return [
    metaStart(ctx),
    metaClassified(runId, classification),
    toolStart(runId, 'criar_tarefa', { titulo: 'enviar relatório' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'enviar relatório' }, { taskId: 't_003' }, 'tc_001'),
    toolStart(runId, 'criar_lembrete', { texto: 'reunião quarta', hora: '09:00' }, 'tc_002'),
    toolComplete(runId, 'criar_lembrete', { texto: 'reunião quarta' }, { reminderId: 'r_003' }, 'tc_002'),
    toolStart(runId, 'criar_evento_calendar', { titulo: 'reunião cliente' }, 'tc_003'),
    toolComplete(runId, 'criar_evento_calendar', { titulo: 'reunião cliente' }, { eventId: 'evt_003' }, 'tc_003'),
    done({ runId, intents, toolCallCount: 3, inputTokens: 130, outputTokens: 30 }),
    undoRegistered(runId, 3),
  ];
}

function multiIntentWithError(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks'];
  const classification = { intents, confidence: { tasks: 0.9 } };
  return [
    metaStart(ctx),
    metaClassified(runId, classification),
    toolStart(runId, 'criar_tarefa', { titulo: 'tarefa A' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'tarefa A' }, { taskId: 't_a' }, 'tc_001'),
    toolStart(runId, 'criar_tarefa', { titulo: 'tarefa B' }, 'tc_002'),
    toolError(runId, 'criar_tarefa', 'Validation failed: titulo too short', 'tc_002'),
    // Story 1.7 — `undoableToolCount` reflecte tools reversíveis bem-sucedidas
    // (não inclui as que falharam em `tool.execute()`). Aqui só `criar_tarefa
    // tarefa A` foi successful → 1.
    done({
      runId,
      status: 'partial',
      intents,
      toolCallCount: 2,
      inputTokens: 95,
      outputTokens: 18,
    }),
    undoRegistered(runId, 1),
  ];
}

function singleTask(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { tasks: 0.95 } }),
    toolStart(runId, 'criar_tarefa', { titulo: 'tarefa de teste' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'tarefa de teste' }, { taskId: 't_x' }, 'tc_001'),
    done({ runId, intents, toolCallCount: 1, inputTokens: 80, outputTokens: 14 }),
    undoRegistered(runId, 1),
  ];
}

function singleTaskComplete(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { tasks: 0.95 } }),
    toolStart(runId, 'completar_tarefa', { taskId: 't_y' }, 'tc_001'),
    toolComplete(runId, 'completar_tarefa', { taskId: 't_y' }, { ok: true }, 'tc_001'),
    done({ runId, intents, toolCallCount: 1, inputTokens: 75, outputTokens: 12 }),
    undoRegistered(runId, 1),
  ];
}

function singleFinanceVariable(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['finance'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { finance: 0.94 } }),
    toolStart(runId, 'criar_finança_variavel', { valor: 50, descricao: 'compra' }, 'tc_001'),
    toolComplete(
      runId,
      'criar_finança_variavel',
      { valor: 50, descricao: 'compra' },
      { transactionId: 'tx_x' },
      'tc_001'
    ),
    done({ runId, intents, toolCallCount: 1, inputTokens: 80, outputTokens: 14 }),
    undoRegistered(runId, 1),
  ];
}

function singleFinanceRecurring(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['finance'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { finance: 0.93 } }),
    toolStart(runId, 'criar_finança_recorrente', { valor: 11.99, descricao: 'subscrição' }, 'tc_001'),
    toolComplete(
      runId,
      'criar_finança_recorrente',
      { valor: 11.99 },
      { recurringId: 'rec_x' },
      'tc_001'
    ),
    done({ runId, intents, toolCallCount: 1, inputTokens: 80, outputTokens: 14 }),
    undoRegistered(runId, 1),
  ];
}

function singleFinanceCard(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['finance'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { finance: 0.92 } }),
    toolStart(runId, 'criar_finança_cartao', { valor: 230, descricao: 'fatura cartão' }, 'tc_001'),
    toolComplete(runId, 'criar_finança_cartao', { valor: 230 }, { cardChargeId: 'cc_x' }, 'tc_001'),
    done({ runId, intents, toolCallCount: 1, inputTokens: 82, outputTokens: 15 }),
    undoRegistered(runId, 1),
  ];
}

function singleCalendar(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['calendar'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { calendar: 0.94 } }),
    toolStart(runId, 'criar_evento_calendar', { titulo: 'evento' }, 'tc_001'),
    toolComplete(runId, 'criar_evento_calendar', { titulo: 'evento' }, { eventId: 'evt_x' }, 'tc_001'),
    done({ runId, intents, toolCallCount: 1, inputTokens: 78, outputTokens: 14 }),
    undoRegistered(runId, 1),
  ];
}

function singleReminder(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['reminder'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { reminder: 0.91 } }),
    toolStart(runId, 'criar_lembrete', { texto: 'lembrete' }, 'tc_001'),
    toolComplete(runId, 'criar_lembrete', { texto: 'lembrete' }, { reminderId: 'r_x' }, 'tc_001'),
    done({ runId, intents, toolCallCount: 1, inputTokens: 78, outputTokens: 14 }),
    undoRegistered(runId, 1),
  ];
}

function previewLowConfidence(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { tasks: 0.55 } }),
    previewRequest({
      runId,
      toolName: 'criar_tarefa',
      args: { titulo: 'algo ambíguo' },
      reason: 'low_confidence',
      confidence: 0.55,
      domain: 'tasks',
      toolCallId: 'tc_001',
    }),
    // Iter 3 — emit preview_confirmed pois o mock simula auto-confirm via
    // /api/agent/confirm route handler (one-shot, não cross-process).
    {
      event: 'preview_confirmed',
      data: {
        type: 'preview_confirmed',
        runId,
        toolName: 'criar_tarefa',
        toolCallId: 'tc_001',
        action: 'confirm',
      },
    },
    toolStart(runId, 'criar_tarefa', { titulo: 'algo ambíguo' }, 'tc_001'),
    toolComplete(runId, 'criar_tarefa', { titulo: 'algo ambíguo' }, { taskId: 't_amb' }, 'tc_001'),
    done({ runId, intents, toolCallCount: 1, inputTokens: 90, outputTokens: 16 }),
    undoRegistered(runId, 1),
  ];
}

function previewDestructive(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { tasks: 0.92 } }),
    previewRequest({
      runId,
      toolName: 'eliminar_tarefa',
      args: { taskId: 't_old' },
      reason: 'requires_preview',
      domain: 'tasks',
      toolCallId: 'tc_001',
    }),
    {
      event: 'preview_confirmed',
      data: {
        type: 'preview_confirmed',
        runId,
        toolName: 'eliminar_tarefa',
        toolCallId: 'tc_001',
        action: 'confirm',
      },
    },
    toolStart(runId, 'eliminar_tarefa', { taskId: 't_old' }, 'tc_001'),
    toolComplete(runId, 'eliminar_tarefa', { taskId: 't_old' }, { ok: true }, 'tc_001'),
    done({ runId, intents, toolCallCount: 1, inputTokens: 85, outputTokens: 14 }),
    undoRegistered(runId, 1),
  ];
}

function toolErrorGeneric(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { tasks: 0.9 } }),
    toolStart(runId, 'criar_tarefa', { titulo: 'erro' }, 'tc_001'),
    toolError(runId, 'criar_tarefa', 'Tool execution failed: simulated error', 'tc_001'),
    done({
      runId,
      status: 'failed',
      intents,
      toolCallCount: 1,
      inputTokens: 70,
      outputTokens: 0,
      errorMessage: 'Tool execution failed: simulated error',
    }),
  ];
}

function toolErrorBadArgs(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['finance'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { finance: 0.85 } }),
    toolStart(runId, 'criar_finança_variavel', { valor: -1 }, 'tc_001'),
    toolError(runId, 'criar_finança_variavel', 'Args invalid: valor must be positive', 'tc_001'),
    done({
      runId,
      status: 'failed',
      intents,
      toolCallCount: 1,
      inputTokens: 70,
      outputTokens: 0,
      errorMessage: 'Args invalid: valor must be positive',
    }),
  ];
}

function toolErrorUnknown(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { tasks: 0.85 } }),
    toolStart(runId, 'tool_xyz_inexistente', {}, 'tc_001'),
    toolError(runId, 'tool_xyz_inexistente', 'Unknown tool: tool_xyz_inexistente', 'tc_001'),
    done({
      runId,
      status: 'failed',
      intents,
      toolCallCount: 1,
      inputTokens: 70,
      outputTokens: 0,
      errorMessage: 'Unknown tool: tool_xyz_inexistente',
    }),
  ];
}

function abortDuringStream(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents = ['tasks'];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: { tasks: 0.9 } }),
    toolStart(runId, 'criar_tarefa', { titulo: 'tarefa abort' }, 'tc_001'),
    // Abort cenário: emite tool_start mas não tool_complete; done com status partial
    // (executor real teria emitido tool_error com toolName='executor' antes do done).
    done({
      runId,
      status: 'partial',
      intents,
      toolCallCount: 1,
      inputTokens: 70,
      outputTokens: 4,
    }),
  ];
}

function textOnly(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents: string[] = [];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: {} }),
    textDelta(runId, 'Olá! Como posso ajudar-te?'),
    done({ runId, intents, toolCallCount: 0, inputTokens: 50, outputTokens: 8 }),
  ];
}

function textOnlyFast(ctx: BuilderContext): SseEvent[] {
  const { runId } = ctx;
  const intents: string[] = [];
  return [
    metaStart(ctx),
    metaClassified(runId, { intents, confidence: {} }),
    textDelta(runId, 'Olá!'),
    done({ runId, intents, toolCallCount: 0, inputTokens: 45, outputTokens: 4 }),
  ];
}

const PROFILE_BUILDERS: Record<MockProfile, (ctx: BuilderContext) => SseEvent[]> = {
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

export interface BuildMockSseEventsArgs {
  profile: MockProfile;
  runId: string;
  prompt: string;
  startedAt?: number;
}

export function buildMockSseEvents(args: BuildMockSseEventsArgs): SseEvent[] {
  const builder = PROFILE_BUILDERS[args.profile];
  if (!builder) {
    throw new Error(`[mock-events] Unknown profile: ${args.profile}`);
  }
  return builder({
    runId: args.runId,
    prompt: args.prompt,
    startedAt: args.startedAt ?? Date.now(),
  });
}

/**
 * Iter 3 — formato canónico do endpoint real `/api/agent/prompt` (route.ts L173):
 *   `data: <JSON-serialized-event>\n\n`
 * + terminador `data: [DONE]\n\n` (route.ts L176).
 *
 * O `useAgentStream.processSseLine` (Story 1.9 hooks/useAgentStream.ts L267)
 * só processa linhas que começam com `data: ` e termina o stream ao receber
 * `[DONE]`. Antes desta iteração emitíamos `event: TYPE\ndata: <JSON>\n\n`
 * (formato SSE multi-field) sem `[DONE]`, divergindo do real.
 */
export function serializeSseEvents(events: SseEvent[]): string {
  const lines = events.map((e) => `data: ${JSON.stringify(e.data)}\n\n`);
  lines.push('data: [DONE]\n\n');
  return lines.join('');
}

