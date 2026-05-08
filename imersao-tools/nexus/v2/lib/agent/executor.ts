import { classifyPrompt, type ClassifyOpts } from '@/lib/agent/classifier';
import { DEFAULT_CLASSIFIER_MODEL, DEFAULT_EXECUTOR_MODEL } from '@/lib/agent/models';
import { getExecutor } from '@/lib/agent/providers/factory';
import type {
  ClassificationResult,
  ContentBlock,
  LLMMessage,
  LLMStreamEvent,
} from '@/lib/agent/schemas';
import type {
  ExecutionContext,
  Logger,
  ToolDefinition,
  ToolDomain,
  VercelKV,
} from '@/lib/agent/tools/types';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type { NexusDB } from '@/lib/db/client';

/**
 * Nexus v2 — Executor: chat agent + SSE streaming + tool calling loop (Story 1.5)
 *
 * Async generator `runAgent(userPrompt, opts?)` que orquestra o cérebro multi-intent:
 *
 *   1. classifier (Story 1.4 Haiku PT-PT) → `intents: ToolDomain[]`
 *   2. tool registry filter (Story 1.3) → `byDomain(d)` por domain + sempre `byDomain('meta')`
 *   3. executor (Story 1.2 Sonnet) → loop sequencial de tool calling
 *      a. SDK emite `tool_use` (já com `input` completo após `content_block_stop`)
 *      b. valida args via `tool.argsSchema.parse(input)`
 *      c. executa `tool.execute(args, ctx)` SEQUENCIALMENTE (RESOLVED-1)
 *      d. injecta `tool_result` na conversa e re-itera
 *      e. para quando o modelo emite `done` sem novos `tool_use`, ou ao atingir
 *         `MAX_TOOL_ITERATIONS` (defesa contra loops infinitos)
 *   4. emite stream SSE com 6 eventos canónicos: `meta`, `tool_start`,
 *      `tool_complete`, `tool_error`, `text_delta`, `done`
 *
 * Edge runtime safe (ADR-1): zero imports de Node-only APIs (`fs`, `path`,
 * `crypto.createHmac`, `child_process`); zero imports de Dexie (`@/lib/db/client`)
 * e `@vercel/kv` em runtime — `NexusDB`/`VercelKV` são `import type` apenas.
 *
 * Stateless server-side (ADR-2 + RESOLVED-2): o executor NÃO escreve em IndexedDB.
 * Persistência Dexie é responsabilidade do client consumer da SSE (Story 1.9):
 * client invoca `startRun({ prompt, modelClassifier, modelExecutor })` ao receber
 * `meta(start)`; `appendToolCall(runId, toolCall)` ao receber `tool_complete`;
 * `finishRun(runId, ...)` ao receber `done`. Ver arch §8 line 689 — fonte canónica.
 *
 * Stories 2-7 que precisem de operações Dexie em tools devem fazê-lo via
 * "command pattern" no `result` da tool (cliente interpreta e executa Dexie
 * localmente) ou via API endpoint dedicado (decisão Stories 2-7).
 *
 * Trace canónico:
 * - PRD §10 line 416 — Story 1.5 acceptance ("Executor: executa tools em sequência")
 * - architecture-v2.md §7.4 — token economy via byDomain (~10 tools vs 39)
 * - architecture-v2.md §8 lines 677-704 — blueprint fluxo + 6 eventos SSE
 * - architecture-v2.md §8 line 689 — "persist ChatMessage + AgentRun → IndexedDB
 *   (no client após receber stream)" — fonte canónica do client-side persistence
 * - architecture-v2.md §4.1 lines 184-200 — Edge/Node split (ADR-1)
 *
 * Constitution:
 * - Article IV (No Invention): zero invenção — tudo trace-back a PRD/arch/Stories 1.1-1.4
 * - Article V (Quality First): mensagens PT-PT em todos os Errors/eventos
 * - Article VI (Absolute Imports): apenas `@/...`
 */

/**
 * Limite defensivo de iterações do tool calling loop.
 *
 * Justificação: o benchmark Epic 1 AC1 do PRD (linha 424) usa 2 tools
 * (calendar + finance). Multi-intent realista cobre 2-4 tools por domínio
 * com margem de segurança. Acima de 5 iterações sem o modelo parar
 * voluntariamente é sintoma de prompt drift ou ciclo infinito do Sonnet.
 *
 * Override possível em testes via `opts.maxToolIterations`. Revisitável em
 * Story 1.10 com dados reais de produção.
 */
export const MAX_TOOL_ITERATIONS = 5;

/**
 * Threshold de confiança abaixo do qual o gate de preview é activado.
 *
 * Trace canónico: PRD §6.1 FR5 (linha 125) — `"Confidence < 70% → preview
 * antes de persistir"`. Story 1.6 implementa este FR como constante exportada
 * para permitir override em testes e documentar como knob de tuning.
 *
 * Range: [0, 1] (calibrado pela Story 1.4 few-shot prompt). Valor 0.7 == 70%.
 *
 * Strict less-than: `confidence[domain] < PREVIEW_CONFIDENCE_THRESHOLD` —
 * confidence === 0.7 NÃO activa o gate (consistente com FR5 "< 70%").
 */
export const PREVIEW_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Provider de confirmação injectado opcionalmente em `RunAgentOpts`.
 *
 * Quando o gate de preview é activado (`confidence[domain] < 0.7` ou
 * `tool.requiresPreview === true`), o executor invoca
 * `requestConfirmation(runId, toolName)` e aguarda (`await`) a Promise
 * antes de executar a tool. Resolução `'confirm'` → executa; `'cancel'` →
 * emite `tool_error` e prossegue o loop.
 *
 * Story 1.6 expõe a abstracção; Stories 1.8 (endpoint) e 1.9 (UI) escolhem
 * a implementação concreta (Vercel KV poll, Promise in-process, etc.) — o
 * executor é agnóstico. Auto-confirm default (provider `undefined`) preserva
 * retrocompatibilidade com Story 1.5: o gate emite `preview_request` +
 * `preview_confirmed { action: 'confirm' }` e continua imediatamente.
 *
 * Trace: Story 1.6 AC3.
 */
export interface ConfirmationProvider {
  requestConfirmation(runId: string, toolName: string): Promise<'confirm' | 'cancel'>;
}

/**
 * Options para `runAgent`. Todos opcionais — defaults preservam comportamento
 * canónico: executor Sonnet com `maxTokens` default do provider, `MAX_TOOL_ITERATIONS=5`,
 * classifier Haiku com `ALL_DOMAINS` (10 domains).
 */
export interface RunAgentOpts {
  /** Override `DEFAULT_EXECUTOR_MODEL` — pass-through para `AnthropicExecutor`. */
  model?: string;
  /** Override default `max_tokens` do executor — pass-through. */
  maxTokens?: number;
  /** Override `MAX_TOOL_ITERATIONS` — útil em testes para acelerar guard. */
  maxToolIterations?: number;
  /** Forwarded para `classifyPrompt` (`availableDomains`, `model`, `maxTokens`, `temperature`). */
  classifyOpts?: ClassifyOpts;
  /**
   * Story 1.6 — provider de confirmação para gate de preview.
   *
   * Sem provider (default): auto-confirm — o executor emite
   * `preview_request` + `preview_confirmed { action: 'confirm' }` e executa
   * a tool imediatamente, preservando comportamento Story 1.5. Stories 1.8/1.9
   * injectam o provider real para bloquear até confirmação humana via UI.
   */
  confirmationProvider?: ConfirmationProvider;
}

/**
 * Eventos SSE emitidos pelo `runAgent` generator.
 *
 * Discriminated union por `type` — tipagem stricta sem `any`. Payloads
 * completos para o client persistir o `AgentRun` sem reconstrução
 * (RESOLVED-2 — stream is the source of truth for one run):
 *
 * - `meta(start)`: `runId` + `prompt` + modelos + `startedAt` → client invoca
 *   `startRun({ prompt, modelClassifier, modelExecutor })` retroactivamente
 * - `meta(classified)`: `classifierResult` → client merge no estado local
 * - `tool_start`: payload mínimo para UI loading state
 * - `tool_complete`: `{ runId, toolName, args, result, durationMs }` — client
 *   invoca `appendToolCall(runId, toolCall)` directamente
 * - `tool_error`: nome da tool + mensagem PT-PT (sem stack — NFR11)
 * - `text_delta`: chunk de texto do assistant
 * - `done`: `{ runId, status, intents, inputTokens, outputTokens, durationMs,
 *   errorMessage?, totals }` — client invoca `finishRun(runId, ...)` directamente
 */
export type ExecutorSSEEvent =
  | {
      type: 'meta';
      phase: 'start';
      runId: string;
      prompt: string;
      modelClassifier: string;
      modelExecutor: string;
      startedAt: number;
      classifierResult: null;
    }
  | {
      type: 'meta';
      phase: 'classified';
      runId: string;
      classifierResult: ClassificationResult;
    }
  | { type: 'tool_start'; runId: string; toolName: string; args: unknown }
  | {
      type: 'tool_complete';
      runId: string;
      toolName: string;
      args: unknown;
      result: unknown;
      durationMs: number;
    }
  | { type: 'tool_error'; runId: string; toolName: string; error: string }
  | { type: 'text_delta'; runId: string; delta: string }
  /**
   * Story 1.6 — preview gate activado antes da execução de uma tool. Emitido
   * quando `confidence[tool.domain] < PREVIEW_CONFIDENCE_THRESHOLD` ou
   * `tool.requiresPreview === true`. Após emitir, o executor aguarda
   * `confirmationProvider.requestConfirmation()` (se fornecido) antes de
   * executar/cancelar a tool. Sem provider, auto-confirm (ver `confirmationProvider`).
   *
   * `reason` discrimina os 3 cenários de gate (low_confidence, requires_preview,
   * both) para a UI poder mostrar copy informativa. `confidence` só é incluído
   * quando `reason` inclui `'low_confidence'` (omitido para `'requires_preview'`).
   */
  | {
      type: 'preview_request';
      runId: string;
      toolName: string;
      args: unknown;
      reason: 'low_confidence' | 'requires_preview' | 'both';
      confidence?: number;
      domain: ToolDomain;
    }
  /**
   * Story 1.6 — emitido após `confirmationProvider.requestConfirmation()`
   * resolver (auto-confirm ou provider real), antes de executar/cancelar a
   * tool. Permite ao client actualizar UI (fechar diálogo de confirmação,
   * mostrar loading state) sem ambiguidade temporal.
   */
  | {
      type: 'preview_confirmed';
      runId: string;
      toolName: string;
      action: 'confirm' | 'cancel';
    }
  | {
      type: 'done';
      runId: string;
      status: 'success' | 'partial' | 'failed';
      intents: string[];
      inputTokens: number;
      outputTokens: number;
      durationMs: number;
      errorMessage?: string;
      totals: { intents: number; toolCalls: number };
      /**
       * Story 1.6 — número de tools que passaram pelo gate de preview neste
       * run (incluindo auto-confirmed e cancelled). Permite ao client saber
       * se o run teve ambiguidade. Campo opcional para retrocompat com
       * consumers Story 1.5 que não conhecem este campo.
       */
      previewCount?: number;
    };

/**
 * Filtra `toolRegistry` pelos `domains` classificados pelo Haiku, garantindo
 * inclusão sempre de tools `meta` (cross-domain queries — `consultar_*`).
 *
 * Token economy (arch §7.4): com 39 tools no inventário completo, passar
 * todas ao Sonnet inflate `input_tokens` em ~3-5x. `byDomain` reduz para
 * ~10 tools por run típica, alinhado com NFR8 (custo Anthropic por mês).
 *
 * NUNCA chama `toolRegistry.all()` ou `toAnthropicTools()` sem filtro —
 * violação directa da arch §7.4. Stories 2-7 chamam `toolRegistry.register`
 * para povoar; enquanto registry estiver vazio, retorna `[]` e o Sonnet
 * responde apenas com texto (happy path Story 1.5).
 *
 * Dedupe via `Set` por nome: se 'meta' já estiver em `domains`, não duplica.
 */
function getToolsForDomains(domains: readonly ToolDomain[]): ToolDefinition[] {
  const seen = new Set<string>();
  const collected: ToolDefinition[] = [];

  // Domains classificados primeiro (preserva ordem de prioridade do classifier)
  for (const d of domains) {
    for (const tool of toolRegistry.byDomain(d)) {
      if (!seen.has(tool.name)) {
        seen.add(tool.name);
        collected.push(tool);
      }
    }
  }

  // 'meta' sempre incluído — dedupe garante zero duplicados se já listado
  for (const tool of toolRegistry.byDomain('meta')) {
    if (!seen.has(tool.name)) {
      seen.add(tool.name);
      collected.push(tool);
    }
  }

  return collected;
}

/**
 * Story 1.6 — verifica se a confidence per-domain do classifier está abaixo
 * do threshold de preview (`PREVIEW_CONFIDENCE_THRESHOLD = 0.7`).
 *
 * Retorna `true` apenas quando `result.confidence[domain]` está definido E
 * é estritamente menor que o threshold. Domain ausente do mapa `confidence`
 * (e.g., classifier não classificou esse domain mas a tool é `meta` sempre
 * incluída) NÃO activa o gate — meta tools são consultivas e read-only por
 * design (consultar_*), logo não precisam de preview por baixa confidence.
 *
 * Trace: PRD §6.1 FR5 — `"Confidence < 70% → preview antes de persistir"`.
 *
 * Função interna (não exportada). Test coverage via cenários do gate em
 * `tests/unit/agent/executor.test.ts`.
 */
function hasConfidenceBelowThreshold(
  result: ClassificationResult,
  domain: ToolDomain
): boolean {
  const score = result.confidence[domain];
  return score !== undefined && score < PREVIEW_CONFIDENCE_THRESHOLD;
}

/**
 * Story 1.6 — avalia o gate de preview para uma tool. Retorna `null` quando
 * o gate NÃO está activado (caminho rápido — comportamento Story 1.5);
 * retorna payload completo do `preview_request` quando o gate activa.
 *
 * Os 3 cenários de `reason`:
 * - `'low_confidence'`: só `confidence < 0.7` activa o gate
 * - `'requires_preview'`: só `tool.requiresPreview === true` activa
 * - `'both'`: ambos activam — UI pode mostrar copy mais informativa
 *
 * `confidence` no payload só é incluído quando `reason` inclui
 * `'low_confidence'` (consistente com discriminação semântica do AC2).
 */
function evaluatePreviewGate(
  classification: ClassificationResult,
  tool: ToolDefinition
): {
  reason: 'low_confidence' | 'requires_preview' | 'both';
  confidence?: number;
} | null {
  const lowConfidence = hasConfidenceBelowThreshold(classification, tool.domain);
  const requiresPreview = tool.requiresPreview === true;

  if (!lowConfidence && !requiresPreview) {
    return null;
  }

  if (lowConfidence && requiresPreview) {
    return {
      reason: 'both',
      confidence: classification.confidence[tool.domain],
    };
  }

  if (lowConfidence) {
    return {
      reason: 'low_confidence',
      confidence: classification.confidence[tool.domain],
    };
  }

  // requiresPreview only — confidence omitido
  return { reason: 'requires_preview' };
}

/**
 * Logger inline com guard NFR11 implícito (callers nunca passam `userPrompt`/
 * `rawResponse`). NFR11 (arch §10): "Logs Vercel NÃO contêm conteúdo de
 * prompts em claro". Logar apenas `runId`, `toolName`, `durationMs`,
 * `intents` count, contadores — nunca o conteúdo do prompt nem a resposta
 * crua do classifier.
 *
 * Story 1.8 pode substituir por logger estruturado (Pino/Winston) — interface
 * `Logger` em `lib/agent/tools/types.ts` é minimal de propósito.
 */
const executorLogger: Logger = {
  info: (msg: string, meta?: unknown) => {
    console.info(`[executor] ${msg}`, meta ?? '');
  },
  error: (msg: string, meta?: unknown) => {
    console.error(`[executor] ${msg}`, meta ?? '');
  },
};

/**
 * Constrói `ExecutionContext` para esta run. Stateless server-side (RESOLVED-2):
 *
 * - `db = null as unknown as NexusDB` — Edge runtime NÃO tem IndexedDB.
 *   Stories 2-7 que precisem de Dexie devolvem command no result (cliente executa).
 * - `kv = null as unknown as VercelKV` — Story 1.7 introduz `@vercel/kv` real
 *   para undo mechanism (TTL 30s); pattern Zod canonical (ADR-5).
 * - `userId = 'eurico'` — single-user constraint C1 da arch.
 * - `fetch = globalThis.fetch` — Edge + Node compatible.
 * - `logger` — `executorLogger` com guard NFR11 implícito.
 * - `runId` — gerado pelo caller via `crypto.randomUUID()` (Web Crypto API).
 */
function buildExecutionContext(runId: string): ExecutionContext {
  return {
    userId: 'eurico',
    /** @todo Stories 2-7 — tools que precisem de Dexie devem devolver "commands" no result (RESOLVED-2 da Story 1.5); persistência Dexie é client-only conforme arch §8 line 689 + ADR-2 */
    db: null as unknown as NexusDB,
    /** @todo Story 1.7 — substituir por cliente Vercel KV real (@vercel/kv); tipagem segue pattern Zod canonical (ADR-5) tal como Tool Registry da Story 1.3 */
    kv: null as unknown as VercelKV,
    fetch: globalThis.fetch,
    logger: executorLogger,
    runId,
  };
}

/**
 * Converte um valor `unknown` (resultado de `tool.execute`) numa string JSON
 * adequada para enviar como `tool_result.content` ao Sonnet na próxima
 * iteração. Defensive contra `undefined` (que `JSON.stringify` retornaria
 * sem aspas e quebraria o protocolo Anthropic).
 */
function stringifyToolResult(result: unknown): string {
  if (result === undefined) return 'null';
  try {
    return JSON.stringify(result);
  } catch {
    // Cycles, BigInt, etc. — fallback para representação seca
    return String(result);
  }
}

/**
 * Extrai mensagem de erro PT-PT a partir de qualquer `unknown` capturado em
 * `catch`. NUNCA inclui stack trace (NFR11) — apenas a mensagem.
 */
function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

/**
 * Orquestra o pipeline completo de uma run do cérebro multi-intent. Generator
 * async — emite `ExecutorSSEEvent` à medida que o classifier classifica e o
 * executor itera o tool calling loop.
 *
 * Pipeline (revisto pós-RESOLVED-2 — server stateless, persistência client-only):
 *
 *   1. trim + valida `userPrompt` non-empty (Error PT-PT se vazio)
 *   2. `runId = crypto.randomUUID()` — Edge-safe Web Crypto API
 *   3. `startedAt = Date.now()`
 *   4. yield `meta(start)` com `runId` + `prompt` + modelos + `startedAt`
 *   5. `classifyPrompt(trimmed, opts.classifyOpts)` → `ClassificationResult`
 *   6. yield `meta(classified)` com `classifierResult`
 *   7. `tools = getToolsForDomains(intents)` — token economy
 *   8. `toolCallingLoop(messages, tools, runId, opts)` — yield events à medida
 *   9. yield `done` no `finally` (sempre — endereça SF-1)
 *
 * Erros não capturados (classifier falha, SDK Anthropic erro de rede):
 * - yield `tool_error toolName: 'executor'` com mensagem PT-PT (sem stack)
 * - yield `done status: 'failed'` com `errorMessage` no `finally`
 * - re-throw para o caller (Story 1.8) retornar HTTP 500 adequado APÓS o stream
 *   ter emitido todos os eventos
 *
 * @param userPrompt - Prompt PT-PT do utilizador (será trimmed antes de classify)
 * @param opts - Override defaults (model, maxTokens, maxToolIterations, classifyOpts)
 * @returns AsyncGenerator que yielda `ExecutorSSEEvent` até `done`
 */
export async function* runAgent(
  userPrompt: string,
  opts: RunAgentOpts = {}
): AsyncGenerator<ExecutorSSEEvent> {
  const trimmed = userPrompt.trim();
  if (trimmed.length === 0) {
    throw new Error('Executor: userPrompt obrigatório');
  }

  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  const modelClassifier = opts.classifyOpts?.model ?? DEFAULT_CLASSIFIER_MODEL;
  const modelExecutor = opts.model ?? DEFAULT_EXECUTOR_MODEL;
  const maxIterations = opts.maxToolIterations ?? MAX_TOOL_ITERATIONS;

  let status: 'success' | 'partial' | 'failed' = 'success';
  let intents: string[] = [];
  let inputTokens = 0;
  let outputTokens = 0;
  let toolCallCount = 0;
  let errorMessageOut: string | undefined;
  // Story 1.6 — counter de tools que passaram pelo gate de preview neste run.
  let previewCount = 0;

  try {
    // Step 4 — meta(start)
    yield {
      type: 'meta',
      phase: 'start',
      runId,
      prompt: trimmed,
      modelClassifier,
      modelExecutor,
      startedAt,
      classifierResult: null,
    };

    // Step 5 — classifier
    let classification: ClassificationResult;
    try {
      classification = await classifyPrompt(trimmed, opts.classifyOpts);
    } catch (e) {
      status = 'failed';
      errorMessageOut = errorMessage(e);
      yield {
        type: 'tool_error',
        runId,
        toolName: 'executor',
        error: errorMessageOut,
      };
      throw e;
    }
    intents = classification.intents;

    // Step 6 — meta(classified)
    yield {
      type: 'meta',
      phase: 'classified',
      runId,
      classifierResult: classification,
    };

    // Step 7 — token economy filter
    const tools = getToolsForDomains(classification.intents as ToolDomain[]);
    executorLogger.info('tools filtradas', {
      runId,
      domainCount: classification.intents.length,
      toolCount: tools.length,
    });

    // Step 8 — tool calling loop
    const ctx = buildExecutionContext(runId);
    const messages: LLMMessage[] = [{ role: 'user', content: trimmed }];

    const loopResult = yield* toolCallingLoop({
      messages,
      tools,
      ctx,
      runId,
      modelExecutor,
      maxTokens: opts.maxTokens,
      maxIterations,
      classification,
      confirmationProvider: opts.confirmationProvider,
    });

    inputTokens = loopResult.inputTokens;
    outputTokens = loopResult.outputTokens;
    toolCallCount = loopResult.toolCallCount;
    previewCount = loopResult.previewCount;

    // Status mapping (CodeRabbit Iter 2 #2 — fix Iter 3):
    // - hadFatalError: erro do provider/SDK (rede, parse fatal) → 'failed'
    //   (terminal — flow não pode continuar; sem nenhum trabalho útil
    //   entregue).
    // - hitMaxIterations: loop atingiu o limite defensivo mas o que foi
    //   executado é válido → 'partial' (alguma utilidade entregue, alguma
    //   parte do plano ficou por executar).
    // - hadError sem `hadFatalError`: erros de tools individuais (unknown,
    //   args inválidos, tool.execute throw) — o resto da run prosseguiu →
    //   'partial' (algum trabalho válido + algumas falhas isoladas).
    if (loopResult.hadFatalError) {
      status = 'failed';
    } else if (loopResult.hitMaxIterations) {
      status = 'partial';
    } else if (loopResult.hadError) {
      status = 'partial';
    }
  } catch (e) {
    // Classifier ou erro inesperado fora do loop. Loop interno apanha SDK errors
    // e yielda tool_error sem re-throw (status='partial' via hadError flag).
    // Cast: TS narrowing flow não vê o ramo onde o handler `tool_error` nested
    // catch já marcou 'failed' antes deste outer catch propagar.
    if ((status as string) !== 'failed') {
      status = 'failed';
      errorMessageOut = errorMessage(e);
      yield {
        type: 'tool_error',
        runId,
        toolName: 'executor',
        error: errorMessageOut,
      };
    }
    // CodeRabbit Iter 1 fix: substituído `try { yield done } finally { throw e }`
    // por sequencial `yield done` + `throw e`. `throw` em `finally` viola Biome
    // `noUnsafeFinally` e mascara o intent de `.return()` do consumer SSE caso
    // este chame `.return()` enquanto suspenso no `yield done`. Sequencial
    // preserva contract Story 1.8 (HTTP 500): consumer recebe `done` primeiro,
    // depois o generator throw chega ao `for await...of` ou `.next()`.
    yield {
      type: 'done',
      runId,
      status,
      intents,
      inputTokens,
      outputTokens,
      durationMs: Date.now() - startedAt,
      errorMessage: errorMessageOut,
      totals: { intents: intents.length, toolCalls: toolCallCount },
      previewCount,
    };
    throw e;
  }

  // Step 9 — done (happy path)
  yield {
    type: 'done',
    runId,
    status,
    intents,
    inputTokens,
    outputTokens,
    durationMs: Date.now() - startedAt,
    ...(errorMessageOut !== undefined ? { errorMessage: errorMessageOut } : {}),
    totals: { intents: intents.length, toolCalls: toolCallCount },
    previewCount,
  };
}

interface LoopResult {
  inputTokens: number;
  outputTokens: number;
  toolCallCount: number;
  hitMaxIterations: boolean;
  hadError: boolean;
  /**
   * `true` quando o erro foi do **provider/SDK** (e.g., rede, parse de
   * `input_json_delta`), não de uma tool individual. `hadError` é mais lato
   * e cobre também tool unknown/args inválidos/tool.execute throw — esses
   * são parciais (resto da run pode prosseguir). `hadFatalError` distingue
   * a falha terminal do flow para o status mapping no caller (CodeRabbit
   * Iter 2 #2: provider error → 'failed', não 'partial').
   */
  hadFatalError: boolean;
  /**
   * Story 1.6 — número de tools que passaram pelo gate de preview neste run.
   * Incrementa por cada `preview_request` emitido (independentemente de
   * confirm/cancel/auto-confirm). Propagado para o evento `done.previewCount`.
   */
  previewCount: number;
}

interface LoopParams {
  messages: LLMMessage[];
  tools: ToolDefinition[];
  ctx: ExecutionContext;
  runId: string;
  modelExecutor: string;
  maxTokens?: number;
  maxIterations: number;
  /**
   * Story 1.6 — resultado do classifier, propagado ao handler para avaliar o
   * gate de preview por confidence per-domain antes de cada `tool.execute()`.
   */
  classification: ClassificationResult;
  /**
   * Story 1.6 — provider opcional de confirmação. Sem provider, o gate usa
   * auto-confirm (emite `preview_request` + `preview_confirmed { confirm }`
   * e prossegue), preservando comportamento Story 1.5.
   */
  confirmationProvider?: ConfirmationProvider;
}

/**
 * Tool calling loop. Itera `executor.execute(messages, tools, opts)` por até
 * `maxIterations` vezes. Cada iteração:
 *
 *   - se SDK emite `text_delta`: yield SSE `text_delta`
 *   - se SDK emite `tool_use`: AC4 pipeline (get tool → parse args → execute
 *     SEQUENCIAL → emit `tool_complete` com payload completo → inject
 *     `tool_result` no array `messages` para próxima iteração)
 *   - se SDK emite `done`: acumula tokens; se NENHUM `tool_use` foi emitido
 *     nesta iteração, o loop termina (Sonnet parou voluntariamente)
 *   - se SDK emite `error`: yield SSE `tool_error toolName: 'executor'`,
 *     `hadError = true`, break
 *
 * Guard `iterationCount >= maxIterations`: yield SSE `tool_error
 * toolName: 'loop_guard'` + `hitMaxIterations = true` + break.
 *
 * Tools executam SEQUENCIALMENTE (RESOLVED-1) — `Promise.all` é PROIBIDO.
 * Justificação: undo (Story 1.7) precisa de ordem reversa determinística;
 * audit log (Story 1.1 `appendToolCall`) é incremental por design;
 * write tools (criar_tarefa, etc.) tocam Dexie e tabelas relacionadas —
 * paralelismo causaria races. Latência dominada pelo Sonnet (network),
 * não pelas tools locais (Dexie sub-50ms NFR2).
 */
async function* toolCallingLoop(
  params: LoopParams
): AsyncGenerator<ExecutorSSEEvent, LoopResult> {
  const {
    tools,
    ctx,
    runId,
    modelExecutor,
    maxTokens,
    maxIterations,
    classification,
    confirmationProvider,
  } = params;
  const messages = [...params.messages]; // shallow copy — não mutamos input

  const executor = getExecutor();
  let inputTokens = 0;
  let outputTokens = 0;
  let toolCallCount = 0;
  let iterationCount = 0;
  let hitMaxIterations = false;
  let hadError = false;
  let hadFatalError = false;
  // Story 1.6 — counter de tools que passaram pelo gate de preview.
  let previewCount = 0;

  while (iterationCount < maxIterations) {
    iterationCount += 1;
    let toolUsesInThisIteration = 0;
    const toolResultsToInject: LLMMessage[] = [];

    // Buffer de assistant content blocks (texto + tool_use originals) para
    // re-injectar como `assistant` message antes dos `tool_result`. Este pattern
    // está documentado pelo Anthropic SDK: para fazer follow-up após tool_use,
    // o histórico precisa de manter a `assistant` message com os tool_use blocks.
    const assistantBlocks: Array<
      | { type: 'text'; text: string }
      | { type: 'tool_use'; id: string; name: string; input: unknown }
    > = [];
    let assistantText = '';

    let sdkErrored = false;
    // Track se o handler interno já emitiu `tool_error` para o erro fatal
    // do provider. CodeRabbit Iter 2 #2: o `AnthropicExecutor` faz
    // `yield error_event` ANTES de `throw error` (anthropic.ts L369-374) —
    // sem este flag, o catch externo emitia um segundo `tool_error` para o
    // mesmo incidente. Single-emission é o contrato correcto.
    let fatalErrorAlreadyEmitted = false;
    try {
      for await (const sdkEvent of executor.execute(messages, tools, {
        runId,
        model: modelExecutor,
        maxTokens,
      })) {
        const handled = await handleSdkEvent(sdkEvent, {
          runId,
          ctx,
          assistantBlocks,
          toolResultsToInject,
          classification,
          confirmationProvider,
        });
        if (handled.textDelta !== undefined) {
          assistantText += handled.textDelta;
          yield { type: 'text_delta', runId, delta: handled.textDelta };
        }
        for (const ev of handled.events) {
          yield ev;
        }
        // CodeRabbit Iter 1 fix #2: desacoplar `toolUseSeen` (houve tool_use
        // emitido pelo SDK?) de `toolUseProcessed` (a tool foi executada com
        // sucesso?). `toolUsesInThisIteration` controla se o outer loop
        // injecta o histórico antes da próxima iteração — tem de incrementar
        // em todos os caminhos que enfileiraram `tool_result` (incluindo
        // ramos de erro, preview cancel, provider error). `toolCallCount`
        // continua a contar apenas execuções bem-sucedidas (AC8 semântica).
        if (handled.toolUseSeen) {
          toolUsesInThisIteration += 1;
        }
        if (handled.toolUseProcessed) {
          toolCallCount += 1;
        }
        if (handled.tokenDeltas) {
          inputTokens += handled.tokenDeltas.inputTokens;
          outputTokens += handled.tokenDeltas.outputTokens;
        }
        if (handled.errorEmitted) {
          hadError = true;
        }
        if (handled.fatalError) {
          sdkErrored = true;
          hadError = true;
          hadFatalError = true;
          fatalErrorAlreadyEmitted = true;
        }
        // Story 1.6 — propaga preview gate counter
        if (handled.previewGated) {
          previewCount += 1;
        }
      }
    } catch (e) {
      // SDK lançou (e.g., rede, parse). Emit `tool_error executor` SÓ se o
      // handler interno ainda não o emitiu para este mesmo incidente.
      hadError = true;
      hadFatalError = true;
      if (!fatalErrorAlreadyEmitted) {
        yield {
          type: 'tool_error',
          runId,
          toolName: 'executor',
          error: errorMessage(e),
        };
      }
      break;
    }

    if (sdkErrored) {
      break;
    }

    // Sem tool_use nesta iteração → Sonnet parou voluntariamente
    if (toolUsesInThisIteration === 0) {
      break;
    }

    // Com tool_use processados → injectar histórico antes da próxima iteração:
    // (1) assistant message com text + tool_use blocks (formato Anthropic);
    // (2) tool_result messages (uma por tool_use, com toolCallId).
    //
    // Story 1.5 Iter 3 (CodeRabbit Iter 2 #3): preservar ordem ORIGINAL dos
    // ContentBlock[]. A API Anthropic real (Story 1.8) exige sequências como
    // `text → tool_use → text → tool_use` reproduzidas literalmente — flatten
    // do texto antes dos `tool_use` reordena `tool_use` para o fim e quebra
    // multi-turn streaming com texto interleaved. Iter 2 emitia array mas
    // colapsava todo o `assistantText` num único bloco no início, perdendo
    // a sequência. Iter 3 itera `assistantBlocks` em ordem de chegada do SDK.
    //
    // Coalesce de blocos `text` consecutivos: o SDK do Anthropic emite
    // `content_block_delta` em chunks pequenos — sem coalesce, terias N
    // blocos `text` curtos no histórico por cada delta. Coalesce reconstroi
    // o bloco semanticamente equivalente ao que o modelo gerou.
    const hasToolUse = assistantBlocks.some((b) => b.type === 'tool_use');
    if (hasToolUse) {
      const blocks: ContentBlock[] = [];
      for (const block of assistantBlocks) {
        if (block.type === 'text') {
          // Coalesce: se o último bloco é text, append; senão push novo.
          const last = blocks[blocks.length - 1];
          if (last && last.type === 'text') {
            last.text += block.text;
          } else if (block.text.length > 0) {
            blocks.push({ type: 'text', text: block.text });
          }
        } else {
          blocks.push({
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input,
          });
        }
      }
      messages.push({ role: 'assistant', content: blocks });
    } else if (assistantText.length > 0) {
      // Sem tool_use mas com texto → manter shape simples (string) — fallback
      // canónico para mensagens text-only.
      messages.push({ role: 'assistant', content: assistantText });
    }
    for (const tr of toolResultsToInject) {
      messages.push(tr);
    }

    // Se atingimos limite, emitir guard antes de break
    if (iterationCount >= maxIterations) {
      hitMaxIterations = true;
      yield {
        type: 'tool_error',
        runId,
        toolName: 'loop_guard',
        error: 'Executor: limite de iterações atingido (MAX_TOOL_ITERATIONS)',
      };
      break;
    }
  }

  return {
    inputTokens,
    outputTokens,
    toolCallCount,
    hitMaxIterations,
    hadError,
    hadFatalError,
    previewCount,
  };
}

/**
 * Acções resultantes de processar um único `LLMStreamEvent` do SDK.
 * Generator pai consome estas acções e yielda os SSE events apropriados +
 * actualiza counters/flags.
 */
interface SdkEventHandled {
  textDelta?: string;
  events: ExecutorSSEEvent[];
  /**
   * CodeRabbit Iter 1 fix #2: `true` sempre que o SDK emitiu um `tool_use`
   * neste evento, INDEPENDENTEMENTE de a tool ter sido executada com sucesso.
   *
   * Distinto de `toolUseProcessed` (que requer execução completa). Necessário
   * porque o outer loop usa este flag para decidir se deve injectar o
   * `assistant` message + `toolResultsToInject` no histórico antes da próxima
   * iteração. Sem este desacoplamento, ramos de erro (tool desconhecida, args
   * inválidos, preview cancel, provider error, tool.execute throw) enfileiram
   * `tool_result` mas o loop quebra antes de injectar — o modelo nunca vê o
   * `tool_result` e o follow-up turn fica perdido. Bug funcional real.
   *
   * Regra: `toolUseSeen: true` em qualquer return dentro de `if (event.type
   * === 'tool_use')`; `false` para text_delta, done, error, fallback.
   */
  toolUseSeen: boolean;
  toolUseProcessed: boolean;
  tokenDeltas?: { inputTokens: number; outputTokens: number };
  errorEmitted: boolean;
  fatalError: boolean;
  /**
   * Story 1.6 — `true` quando o gate de preview foi activado para esta tool
   * (tanto path confirm como cancel). Caller incrementa `previewCount` para
   * propagar ao `done.previewCount`.
   */
  previewGated: boolean;
}

/**
 * Processa um `LLMStreamEvent` do `AnthropicExecutor`. Pure function (não
 * yielda directamente — retorna acções para o caller yield-ar). Mantém o
 * tool calling loop legível e testável separadamente.
 *
 * `tool_use`: valida `tool` registada (senão `tool_error`), parse args via
 * Zod (senão `tool_error`), executa SEQUENCIALMENTE (await), emit
 * `tool_start` + `tool_complete` com payload completo, injecta `tool_result`
 * no buffer para próxima iteração.
 */
async function handleSdkEvent(
  event: LLMStreamEvent,
  ctx: {
    runId: string;
    ctx: ExecutionContext;
    assistantBlocks: Array<
      | { type: 'text'; text: string }
      | { type: 'tool_use'; id: string; name: string; input: unknown }
    >;
    toolResultsToInject: LLMMessage[];
    /** Story 1.6 — classifier result para avaliar gate por confidence per-domain. */
    classification: ClassificationResult;
    /** Story 1.6 — provider opcional de confirmação. Sem provider, auto-confirm. */
    confirmationProvider?: ConfirmationProvider;
  }
): Promise<SdkEventHandled> {
  const events: ExecutorSSEEvent[] = [];

  if (event.type === 'text_delta') {
    ctx.assistantBlocks.push({ type: 'text', text: event.text });
    return {
      textDelta: event.text,
      events,
      toolUseSeen: false,
      toolUseProcessed: false,
      errorEmitted: false,
      fatalError: false,
      previewGated: false,
    };
  }

  if (event.type === 'tool_use') {
    const toolName = event.name;
    ctx.assistantBlocks.push({
      type: 'tool_use',
      id: event.id,
      name: event.name,
      input: event.input,
    });

    const tool = toolRegistry.get(toolName);
    if (!tool) {
      events.push({
        type: 'tool_error',
        runId: ctx.runId,
        toolName,
        error: `Executor: tool "${toolName}" não registada`,
      });
      // Anthropic protocolo: precisamos injectar tool_result mesmo em erro
      // para o modelo poder continuar (alternativa seria abortar a conversa).
      ctx.toolResultsToInject.push({
        role: 'tool',
        content: JSON.stringify({ error: `Tool "${toolName}" não registada` }),
        toolCallId: event.id,
      });
      // CodeRabbit Iter 1 fix #3: `toolUseProcessed: false` em error branches
      // — AC8 semântica = "tool calls executed AND have result to persist".
      // Tool não registada não foi executada → não conta para totals.toolCalls.
      // `errorEmitted: true` mantém-se: consumer já recebeu o tool_error event.
      // CodeRabbit Iter 1 fix #2: `toolUseSeen: true` — o SDK emitiu um
      // `tool_use` que enfileirou `tool_result` em `toolResultsToInject`.
      // Outer loop precisa de saber para injectar o histórico antes da
      // próxima iteração; sem isto, o modelo nunca vê o tool_result.
      return {
        events,
        toolUseSeen: true,
        toolUseProcessed: false,
        errorEmitted: true,
        fatalError: false,
        previewGated: false,
      };
    }

    // Parse args via Zod schema da tool (fail-loud com mensagem PT-PT)
    let validatedArgs: unknown;
    try {
      validatedArgs = tool.argsSchema.parse(event.input);
    } catch (e) {
      events.push({
        type: 'tool_error',
        runId: ctx.runId,
        toolName,
        error: `Executor: args inválidos para tool "${toolName}" — ${errorMessage(e)}`,
      });
      ctx.toolResultsToInject.push({
        role: 'tool',
        content: JSON.stringify({ error: `Args inválidos: ${errorMessage(e)}` }),
        toolCallId: event.id,
      });
      // CodeRabbit Iter 1 fix #3: ver justificação acima — Zod parse failure
      // significa que tool nunca chegou a `tool.execute()`, logo não deve
      // contar para totals.toolCalls.
      // CodeRabbit Iter 1 fix #2: `toolUseSeen: true` — `tool_result` foi
      // enfileirado e tem de ser injectado no histórico (mesma justificação
      // do branch "tool não registada" acima).
      return {
        events,
        toolUseSeen: true,
        toolUseProcessed: false,
        errorEmitted: true,
        fatalError: false,
        previewGated: false,
      };
    }

    // tool_start (UI loading state)
    events.push({
      type: 'tool_start',
      runId: ctx.runId,
      toolName,
      args: event.input,
    });

    // Story 1.6 — gate de preview. Avalia ANTES de `tool.execute()`. Se gate
    // activado, emite `preview_request`, aguarda confirmação (provider real
    // ou auto-confirm), emite `preview_confirmed`. Cancel ramo → emite
    // `tool_error` + injecta `tool_result` indicando cancelamento + retorna
    // sem executar a tool. Confirm ramo → prossegue para `tool.execute()`.
    const gateResult = evaluatePreviewGate(ctx.classification, tool);
    let previewGated = false;
    if (gateResult !== null) {
      previewGated = true;

      // CodeRabbit Iter 1 fix #1: usar `validatedArgs` (pós-Zod) em vez de
      // `event.input` (raw do SDK). Schema pode strip/coerce/transform/default
      // — utilizador deve confirmar a payload PÓS-validação que será de facto
      // passada a `tool.execute()`. Caso contrário UI mostra X mas executor
      // corre Y. Trace: AC2 spec (`args` no payload do preview_request).
      const previewRequest: ExecutorSSEEvent = {
        type: 'preview_request',
        runId: ctx.runId,
        toolName,
        args: validatedArgs,
        reason: gateResult.reason,
        domain: tool.domain,
        ...(gateResult.confidence !== undefined
          ? { confidence: gateResult.confidence }
          : {}),
      };
      events.push(previewRequest);

      // Auto-confirm default (sem provider) — Story 1.5 backward compat.
      // Com provider: aguarda Promise; resolução `'confirm'` ou `'cancel'`.
      let action: 'confirm' | 'cancel' = 'confirm';
      if (ctx.confirmationProvider) {
        try {
          action = await ctx.confirmationProvider.requestConfirmation(
            ctx.runId,
            toolName
          );
        } catch (e) {
          // Provider falhou: tratamos como erro de tool individual (não fatal).
          // Emite `tool_error` + injecta `tool_result` para o modelo continuar
          // o loop. Não emitimos `preview_confirmed` (semanticamente o provider
          // não resolveu).
          events.push({
            type: 'tool_error',
            runId: ctx.runId,
            toolName,
            error: `Executor: provider de confirmação falhou — ${errorMessage(e)}`,
          });
          ctx.toolResultsToInject.push({
            role: 'tool',
            content: JSON.stringify({
              error: `Provider de confirmação falhou: ${errorMessage(e)}`,
            }),
            toolCallId: event.id,
          });
          // CodeRabbit Iter 1 fix #2: `toolUseSeen: true` — sem isto o outer
          // loop quebraria antes de injectar o `tool_result` da falha do
          // provider, e o modelo nunca veria a informação para fazer follow-up.
          return {
            events,
            toolUseSeen: true,
            toolUseProcessed: false,
            errorEmitted: true,
            fatalError: false,
            previewGated,
          };
        }
      }

      events.push({
        type: 'preview_confirmed',
        runId: ctx.runId,
        toolName,
        action,
      });

      if (action === 'cancel') {
        // Cancel: emite `tool_error` PT-PT + injecta `tool_result` para o
        // modelo poder continuar com a informação que a acção foi cancelada.
        // Não conta para `totals.toolCalls` (consistente com semântica AC8 —
        // tool nunca foi executada). `errorEmitted` mantém status='partial'
        // se foi a única ocorrência (loop continua sem outras falhas).
        events.push({
          type: 'tool_error',
          runId: ctx.runId,
          toolName,
          error: 'Cancelado pelo utilizador',
        });
        ctx.toolResultsToInject.push({
          role: 'tool',
          content: JSON.stringify({ error: 'Cancelado pelo utilizador' }),
          toolCallId: event.id,
        });
        // CodeRabbit Iter 1 fix #2: `toolUseSeen: true` — preview cancel
        // ainda enfileira `tool_result` indicando o cancelamento. O outer
        // loop precisa de injectar para o modelo continuar a conversa
        // sabendo que a acção foi cancelada (e.g., reformular ou escolher
        // outra tool). Sem este flag o follow-up turn ficava perdido.
        return {
          events,
          toolUseSeen: true,
          toolUseProcessed: false,
          errorEmitted: true,
          fatalError: false,
          previewGated,
        };
      }
      // action === 'confirm' — fall through para tool.execute()
    }

    // Execução SEQUENCIAL (RESOLVED-1) — `await` bloqueia até completar.
    const startedAt = Date.now();
    let result: unknown;
    try {
      result = await tool.execute(validatedArgs, ctx.ctx);
    } catch (e) {
      events.push({
        type: 'tool_error',
        runId: ctx.runId,
        toolName,
        error: `Executor: tool "${toolName}" falhou — ${errorMessage(e)}`,
      });
      ctx.toolResultsToInject.push({
        role: 'tool',
        content: JSON.stringify({ error: errorMessage(e) }),
        toolCallId: event.id,
      });
      // CodeRabbit Iter 2 #1: regressão directa do Iter 1 #3 noutro local.
      // AC8 semântica = "tool calls executed AND have result to persist".
      // `tool.execute` lançou → não há `tool_complete` event nem `ToolCall`
      // payload completo a emitir → não conta para `done.totals.toolCalls`.
      // `errorEmitted: true` mantém-se: consumer já recebeu `tool_error`.
      // CodeRabbit Iter 1 fix #2: `toolUseSeen: true` — `tool_result` com
      // o erro está enfileirado e tem de ser injectado no próximo turno
      // para o modelo poder reagir à falha (e.g., tentar outra tool).
      return {
        events,
        toolUseSeen: true,
        toolUseProcessed: false,
        errorEmitted: true,
        fatalError: false,
        previewGated,
      };
    }
    const durationMs = Date.now() - startedAt;

    // tool_complete (payload COMPLETO — client invoca appendToolCall directamente)
    events.push({
      type: 'tool_complete',
      runId: ctx.runId,
      toolName,
      args: event.input,
      result,
      durationMs,
    });

    // Injecta tool_result na próxima iteração (Sonnet continua)
    ctx.toolResultsToInject.push({
      role: 'tool',
      content: stringifyToolResult(result),
      toolCallId: event.id,
    });

    return {
      events,
      toolUseSeen: true,
      toolUseProcessed: true,
      errorEmitted: false,
      fatalError: false,
      previewGated,
    };
  }

  if (event.type === 'done') {
    return {
      events,
      toolUseSeen: false,
      toolUseProcessed: false,
      tokenDeltas: {
        inputTokens: event.inputTokens,
        outputTokens: event.outputTokens,
      },
      errorEmitted: false,
      fatalError: false,
      previewGated: false,
    };
  }

  if (event.type === 'error') {
    events.push({
      type: 'tool_error',
      runId: ctx.runId,
      toolName: 'executor',
      error: event.message,
    });
    return {
      events,
      toolUseSeen: false,
      toolUseProcessed: false,
      errorEmitted: true,
      fatalError: true,
      previewGated: false,
    };
  }

  // tool_result não é emitido pelo provider — defensive no-op.
  return {
    events,
    toolUseSeen: false,
    toolUseProcessed: false,
    errorEmitted: false,
    fatalError: false,
    previewGated: false,
  };
}

// Exports auxiliares para testes (Story 1.5 AC10) — não fazem parte da API
// pública do consumer (Story 1.8). Marcados explicitamente como test-only via
// JSDoc para code review.

/** @internal — exposto para AC10 tests (`getToolsForDomains` cobertura). */
export { getToolsForDomains as _getToolsForDomains };
