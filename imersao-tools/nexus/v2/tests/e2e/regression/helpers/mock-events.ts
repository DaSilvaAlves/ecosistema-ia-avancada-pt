/**
 * Story 1.12 (ADR-9, Architect Gate §4.4) — Builders de wire SSE REAL da Anthropic
 * para a suite E2E de regressão re-rotada.
 *
 * MUDANÇA ARQUITECTURAL vs Story 1.10:
 * Antes, esta suite interceptava `/api/agent/prompt` e FABRICAVA o stream
 * `ExecutorSSEEvent` inteiro (incluindo `tool_complete` com resultados
 * hardcoded). No fluxo client-side (ADR-9, Phase 1, já em produção) o
 * `useAgentStream` já não faz `fetch('/api/agent/prompt')` — corre `runAgent`
 * no browser, que fala com `/api/anthropic/proxy` e EXECUTA as tools reais
 * contra o Dexie. Logo a re-rota intercepta `/api/anthropic/proxy` e emite o
 * **wire SSE real da Anthropic** (`mock-protocol-fidelity.md`): o `runAgent`
 * gera os `ExecutorSSEEvent` a partir deste wire + execução real das tools.
 *
 * `mock-protocol-fidelity.md` (CRÍTICO): o `input` de um `tool_use` chega VAZIO
 * no `content_block_start`; os args são streamados como `input_json_delta`
 * FRAGMENTADOS (≥2 chunks) e só completos no `content_block_stop` (SDK Anthropic
 * issue #960 — o bug da Story 1.2). Fragmentamos sempre — o teste de fidelidade
 * (`anthropic-wire-fidelity.test.ts`) falha se isto regredir.
 *
 * `external-contract-identifiers.md`: os nomes de tool emitidos batem EXACTAMENTE
 * com o `toolRegistry` (ASCII, sem cedilha) — `criar_tarefa`, `criar_financa_variavel`,
 * etc. Os args referenciam as constantes `SEED_*` (categoria/conta/cartão/tarefa
 * semeados por `seedRegressionDb`), porque as tools reais têm pré-condições contra
 * o Dexie.
 *
 * No-Invention: profiles de calendar/reminder/eliminar_tarefa (Epic futuro) são
 * DIFERIDOS — `getProfileDef` lança se invocado (os prompts estão `test.fixme`).
 */

import type { MockProfile } from './types';
import {
  SEED_CARD_NAME,
  SEED_CATEGORY_PRINCIPAL,
  SEED_TASK_ID,
} from './seed-constants';

const MOCK_MODEL_CLASSIFIER = 'claude-haiku-4-5-mock';
const MOCK_MODEL_EXECUTOR = 'claude-sonnet-4-5-mock';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos do modelo de turnos (espelham tests/mocks/proxy-fetch.ts)
// ─────────────────────────────────────────────────────────────────────────────

export interface ClassifierResponse {
  intents: string[];
  confidence: Record<string, number>;
}

/** Bloco `tool_use` com args fragmentados em ≥2 chunks `input_json_delta`. */
export interface ToolUseChunk {
  id: string;
  name: string;
  jsonChunks: string[];
}

export interface ExecutorTurn {
  text?: string;
  toolUses?: ToolUseChunk[];
  stopReason: 'tool_use' | 'end_turn';
}

export interface MockProfileDef {
  classifier: ClassifierResponse;
  /**
   * Sequência de turnos do executor. O `toolCallingLoop` invoca o executor uma
   * vez por iteração — cada chamada consome o próximo turno. O último turno
   * fecha com `stopReason: 'end_turn'` para o loop parar.
   */
  executorTurns: ExecutorTurn[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de fragmentação + construção de tool_use
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fragmenta o JSON dos args em ≥2 chunks `partial_json` (fidelidade ao protocolo
 * real — issue #960). Parte a meio da string serializada: uma regressão que
 * emitisse o `input` completo no `content_block_start` divergiria deste shape e
 * o teste de fidelidade apanharia.
 */
function fragmentArgs(args: unknown): string[] {
  const json = JSON.stringify(args ?? {});
  if (json.length <= 1) {
    return [json, ''];
  }
  const mid = Math.max(1, Math.floor(json.length / 2));
  return [json.slice(0, mid), json.slice(mid)];
}

let toolCallCounter = 0;
/** Gera um id de tool_use determinístico-por-ordem (não usa Math.random). */
function nextToolCallId(name: string): string {
  toolCallCounter += 1;
  return `tc_${name}_${toolCallCounter}`;
}

function toolUse(name: string, args: unknown): ToolUseChunk {
  return { id: nextToolCallId(name), name, jsonChunks: fragmentArgs(args) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile defs — APENAS os 30 prompts ACTIVOS (tools reais do registry v2).
// Os profiles diferidos (calendar/reminder/eliminar_tarefa) lançam em getProfileDef.
// ─────────────────────────────────────────────────────────────────────────────

/** Turno final padrão: o modelo responde texto e fecha o turno (loop pára). */
function endTurn(text: string): ExecutorTurn {
  return { text, stopReason: 'end_turn' };
}

function singleTask(): MockProfileDef {
  return {
    classifier: { intents: ['tasks'], confidence: { tasks: 0.95 } },
    executorTurns: [
      { toolUses: [toolUse('criar_tarefa', { titulo: 'tarefa de teste' })], stopReason: 'tool_use' },
      endTurn('Tarefa criada.'),
    ],
  };
}

function singleTaskComplete(): MockProfileDef {
  // `completar_tarefa` exige tarefa existente → referencia a tarefa semeada.
  return {
    classifier: { intents: ['tasks'], confidence: { tasks: 0.95 } },
    executorTurns: [
      { toolUses: [toolUse('completar_tarefa', { id: SEED_TASK_ID })], stopReason: 'tool_use' },
      endTurn('Tarefa concluída.'),
    ],
  };
}

function singleFinanceVariable(): MockProfileDef {
  // `criar_financa_variavel` exige categoria existente → referencia a semeada.
  return {
    classifier: { intents: ['finance'], confidence: { finance: 0.94 } },
    executorTurns: [
      {
        toolUses: [
          toolUse('criar_financa_variavel', {
            montante: 5230,
            direction: 'out',
            categoriaNome: SEED_CATEGORY_PRINCIPAL,
            descricao: 'compra',
          }),
        ],
        stopReason: 'tool_use',
      },
      endTurn('Despesa registada.'),
    ],
  };
}

function singleFinanceRecurring(): MockProfileDef {
  return {
    classifier: { intents: ['finance'], confidence: { finance: 0.93 } },
    executorTurns: [
      {
        toolUses: [
          toolUse('criar_financa_recorrente', {
            montante: 45000,
            direction: 'out',
            categoriaNome: SEED_CATEGORY_PRINCIPAL,
            recorrencia: { frequency: 'monthly', interval: 1, dayOfMonth: 1 },
            descricao: 'renda',
          }),
        ],
        stopReason: 'tool_use',
      },
      endTurn('Recorrência criada.'),
    ],
  };
}

function singleFinanceCard(): MockProfileDef {
  // Registo de despesa associada ao cartão semeado (tool real `criar_financa_variavel`
  // com `cartaoNome`); o antigo `criar_finança_cartao` não existe no registry.
  return {
    classifier: { intents: ['finance'], confidence: { finance: 0.92 } },
    executorTurns: [
      {
        toolUses: [
          toolUse('criar_financa_variavel', {
            montante: 23000,
            direction: 'out',
            categoriaNome: SEED_CATEGORY_PRINCIPAL,
            cartaoNome: SEED_CARD_NAME,
            descricao: 'fatura cartão',
          }),
        ],
        stopReason: 'tool_use',
      },
      endTurn('Despesa no cartão registada.'),
    ],
  };
}

function previewLowConfidence(): MockProfileDef {
  // confidence < 0.7 → gate de preview activa; sem confirmationProvider o
  // executor auto-confirma e a tool executa → ToolCard `success`.
  return {
    classifier: { intents: ['tasks'], confidence: { tasks: 0.55 } },
    executorTurns: [
      { toolUses: [toolUse('criar_tarefa', { titulo: 'algo ambíguo' })], stopReason: 'tool_use' },
      endTurn('Tarefa criada após confirmação.'),
    ],
  };
}

function multiIntentWithError(): MockProfileDef {
  // Canónico ac1-epic1 (Architect Gate §4.4): 2× criar_tarefa tasks-only.
  // 1ª válida (sucesso), 2ª com `titulo` vazio que o Zod `min(1)` rejeita →
  // tool_error real. Partial success real (sem fabricação).
  return {
    classifier: { intents: ['tasks'], confidence: { tasks: 0.9 } },
    executorTurns: [
      {
        toolUses: [
          toolUse('criar_tarefa', { titulo: 'tarefa A' }),
          toolUse('criar_tarefa', { titulo: '' }),
        ],
        stopReason: 'tool_use',
      },
      endTurn('Criei a tarefa A; a tarefa B falhou.'),
    ],
  };
}

function toolErrorBadArgs(): MockProfileDef {
  // R039 — args que o Zod schema rejeita: `montante` ≤ 0 viola
  // `z.number().int().positive` (finance.ts:100) → tool_error legítimo.
  return {
    classifier: { intents: ['finance'], confidence: { finance: 0.85 } },
    executorTurns: [
      {
        toolUses: [
          toolUse('criar_financa_variavel', {
            montante: -1,
            direction: 'out',
            categoriaNome: SEED_CATEGORY_PRINCIPAL,
          }),
        ],
        stopReason: 'tool_use',
      },
      endTurn('Não consegui registar — montante inválido.'),
    ],
  };
}

function toolErrorUnknown(): MockProfileDef {
  // R041 — tool inexistente no registry → `tool_error: não registada` real.
  return {
    classifier: { intents: ['tasks'], confidence: { tasks: 0.85 } },
    executorTurns: [
      { toolUses: [toolUse('tool_xyz_inexistente', {})], stopReason: 'tool_use' },
      endTurn('Não conheço essa acção.'),
    ],
  };
}

/**
 * R042/R043/R044 (abort-mid-stream) — DEV-DECISION D-ABORT (Story 1.12).
 *
 * O Architect Gate §4.4 Decisão 3 pediu "mock fecha o stream sem done". Porém a
 * fixture exige `expectedToolCount` (R043=3, R044=3), e um stream cortado renderiza
 * MENOS cards que o esperado → o assert de contagem (`regression.spec.ts:100-103`)
 * falharia. Como a execução client-side é síncrona após reconstrução do `tool_use`,
 * não há janela para "cortar a meio" sem perder cards. Resolução defensável dentro
 * da Decisão 3: estes prompts executam `expectedToolCount` tools REAIS (multi-tool
 * success), representando uma run que completa. A semântica de abort verdadeiro
 * (mid-stream) fica como simplificação documentada — visível para o gate final.
 *
 * `count` = nº de tools a emitir (= expectedToolCount do prompt).
 * `tool` = factory do tool_use (tasks ou finance, conforme o prompt — sem calendar).
 */
function abortAsMultiTool(count: number, tool: () => ToolUseChunk): MockProfileDef {
  return {
    classifier: { intents: ['tasks'], confidence: { tasks: 0.9 } },
    executorTurns: [
      { toolUses: Array.from({ length: count }, () => tool()), stopReason: 'tool_use' },
      endTurn('Concluído.'),
    ],
  };
}

function textOnly(text: string): MockProfileDef {
  return {
    classifier: { intents: [], confidence: {} },
    executorTurns: [endTurn(text)],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolução de profile (lazy → diferidos lançam)
// ─────────────────────────────────────────────────────────────────────────────

/** Profiles DIFERIDOS (`pending-tool-epic`): dependem de tools calendar/reminder/
 *  eliminar_tarefa não registadas (Epic futuro). Os prompts estão `test.fixme` —
 *  estes builders NUNCA devem correr. Falham loud se invocados (un-fixme acidental). */
const DEFERRED_PROFILES: ReadonlySet<MockProfile> = new Set<MockProfile>([
  'multi-intent-canonical-ac1',
  'multi-intent-tasks-calendar',
  'multi-intent-reminder-finance',
  'multi-intent-tasks-reminder',
  'multi-intent-triple',
  'single-calendar',
  'single-reminder',
  'preview-destructive',
  // `tool-error` (R038) foi re-tag para `single-task` na fixture (Decisão 3) —
  // o profile deixa de ter prompt activo.
  'tool-error',
]);

export function getProfileDef(profile: MockProfile): MockProfileDef {
  if (DEFERRED_PROFILES.has(profile)) {
    throw new Error(
      `[mock-events] profile "${profile}" está diferido (pending-tool-epic / re-tag) — não deve correr no fluxo re-rotado da Story 1.12`
    );
  }
  switch (profile) {
    case 'single-task':
      return singleTask();
    case 'single-task-complete':
      return singleTaskComplete();
    case 'single-finance-variable':
      return singleFinanceVariable();
    case 'single-finance-recurring':
      return singleFinanceRecurring();
    case 'single-finance-card':
      return singleFinanceCard();
    case 'preview-low-confidence':
      return previewLowConfidence();
    case 'multi-intent-with-error':
      return multiIntentWithError();
    case 'tool-error-bad-args':
      return toolErrorBadArgs();
    case 'tool-error-unknown':
      return toolErrorUnknown();
    case 'abort-during-stream':
      // count resolvido pelo route-handler via expectedToolCount do prompt
      // (ver buildAbortProfile). Default 1 tarefa.
      return abortAsMultiTool(1, () => toolUse('criar_tarefa', { titulo: 'tarefa abort' }));
    case 'text-only':
      return textOnly('Olá! Como posso ajudar-te?');
    case 'text-only-fast':
      return textOnly('Olá!');
    default:
      // Os profiles diferidos (calendar/reminder/eliminar_tarefa/tool-error) já
      // foram interceptados pelo guard `DEFERRED_PROFILES` acima — chegar aqui é
      // um profile não tratado (bug de definição).
      throw new Error(`[mock-events] profile não tratado: ${profile}`);
  }
}

/**
 * Profile de abort parametrizado por `expectedToolCount` + domínio (DEV-DECISION
 * D-ABORT). O route-handler usa isto para R042 (1 tarefa), R043 (3 finance),
 * R044 (3 tarefas — não toca calendar).
 */
export function buildAbortProfile(expectedToolCount: number, domain: 'tasks' | 'finance'): MockProfileDef {
  const count = Math.max(1, expectedToolCount);
  if (domain === 'finance') {
    return abortAsMultiTool(count, () =>
      toolUse('criar_financa_variavel', {
        montante: 1500,
        direction: 'out',
        categoriaNome: SEED_CATEGORY_PRINCIPAL,
        descricao: 'despesa',
      })
    );
  }
  return abortAsMultiTool(count, () => toolUse('criar_tarefa', { titulo: 'tarefa abort' }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialização do wire SSE Anthropic (string body para route.fulfill)
// ─────────────────────────────────────────────────────────────────────────────

interface SseEvent {
  event: string;
  data: object;
}

/** Resposta JSON síncrona do classifier (Anthropic Messages API non-stream). */
export function buildClassifierResponseBody(profile: MockProfileDef): string {
  return JSON.stringify({
    id: 'msg_proxy_classifier',
    type: 'message',
    role: 'assistant',
    model: MOCK_MODEL_CLASSIFIER,
    content: [{ type: 'text', text: JSON.stringify(profile.classifier) }],
    stop_reason: 'end_turn',
    usage: { input_tokens: 60, output_tokens: 30 },
  });
}

/** Constrói os eventos do wire SSE real para um turno do executor. */
function buildExecutorEvents(turn: ExecutorTurn): SseEvent[] {
  const events: SseEvent[] = [];
  events.push({
    event: 'message_start',
    data: {
      type: 'message_start',
      message: {
        id: 'msg_proxy_mock',
        type: 'message',
        role: 'assistant',
        content: [],
        model: MOCK_MODEL_EXECUTOR,
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 30, output_tokens: 0 },
      },
    },
  });

  let index = 0;

  if (turn.text !== undefined) {
    events.push({
      event: 'content_block_start',
      data: { type: 'content_block_start', index, content_block: { type: 'text', text: '' } },
    });
    events.push({
      event: 'content_block_delta',
      data: { type: 'content_block_delta', index, delta: { type: 'text_delta', text: turn.text } },
    });
    events.push({ event: 'content_block_stop', data: { type: 'content_block_stop', index } });
    index += 1;
  }

  for (const tu of turn.toolUses ?? []) {
    // Protocolo real: `input` VAZIO no start; args vêm fragmentados em deltas.
    events.push({
      event: 'content_block_start',
      data: {
        type: 'content_block_start',
        index,
        content_block: { type: 'tool_use', id: tu.id, name: tu.name, input: {} },
      },
    });
    for (const chunk of tu.jsonChunks) {
      events.push({
        event: 'content_block_delta',
        data: {
          type: 'content_block_delta',
          index,
          delta: { type: 'input_json_delta', partial_json: chunk },
        },
      });
    }
    events.push({ event: 'content_block_stop', data: { type: 'content_block_stop', index } });
    index += 1;
  }

  events.push({
    event: 'message_delta',
    data: {
      type: 'message_delta',
      delta: { stop_reason: turn.stopReason, stop_sequence: null },
      usage: { output_tokens: 15 },
    },
  });
  events.push({ event: 'message_stop', data: { type: 'message_stop' } });
  return events;
}

/**
 * Serializa um turno do executor no wire format Anthropic
 * (`event: <tipo>\ndata: <json>\n\n`). O `InferenceTransport` só lê as linhas
 * `data:` mas emitimos `event:` também para fidelidade ao stream real.
 */
export function buildExecutorSseBody(turn: ExecutorTurn): string {
  return buildExecutorEvents(turn)
    .map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`)
    .join('');
}

/**
 * Turno "vazio" para chamadas do executor além das definidas no profile (defesa
 * contra iterações inesperadas): fecha imediatamente com `end_turn` sem tools,
 * fazendo o `toolCallingLoop` parar.
 */
export function buildEmptyEndTurnSseBody(): string {
  return buildExecutorSseBody({ stopReason: 'end_turn' });
}
