/**
 * Nexus v2 — Mock `fetch` do proxy de inferência (Story 1.11 — ADR-9, T7)
 *
 * Constrói um `fetchFn` (tipo `fetch`) que é injectado no `InferenceTransport`
 * (`new InferenceTransport(fetchFn)`) para os testes de integração client-side
 * do cérebro. Substitui a chamada real a `/api/anthropic/proxy` por respostas
 * determinísticas.
 *
 * `mock-protocol-fidelity.md` (CRÍTICO nesta story):
 *   O proxy faz **pass-through** do wire SSE real da Anthropic
 *   (`proxy/route.ts:152-160`). Logo este mock NÃO inventa um formato próprio —
 *   reproduz o wire format EXACTO da Anthropic Messages API:
 *     message_start → content_block_start (tool_use com `input: {}`) →
 *     content_block_delta (input_json_delta.partial_json FRAGMENTADO) →
 *     content_block_stop → message_delta → message_stop
 *
 *   O `input` de um `tool_use` chega VAZIO no `content_block_start`; os args são
 *   streamados como `input_json_delta` chunks só completos no
 *   `content_block_stop` (SDK Anthropic issue #960). Este é exactamente o bug da
 *   Story 1.2: um mock que emitisse o `input` completo no `content_block_start`
 *   passaria os testes mas esconderia o bug em produção. Aqui FRAGMENTAMOS
 *   sempre o JSON dos args em ≥2 chunks — o teste de fidelidade prova que o
 *   transport reconstrói correctamente e falharia se o transport (ou o mock)
 *   regredisse para args-no-start.
 *
 * Discriminação do request (igual ao proxy real, que reencaminha o body tal-qual
 * para a Anthropic): `body.stream === true` → executor (SSE); caso contrário →
 * classifier (JSON síncrono).
 *
 * Trace canónico:
 * - lib/agent/inference-transport.ts — consumidor sob teste
 * - app/api/anthropic/proxy/route.ts — contrato `{ messages, model, stream?, ... }`
 * - lib/agent/providers/anthropic.ts — parser de referência do wire format
 * - tests/mocks/handlers/anthropic.ts — estrutura SSE espelhada (SDK directo)
 */

/** Um evento do wire SSE Anthropic: `event: <tipo>\ndata: <json>\n\n`. */
interface SseEvent {
  event: string;
  data: object;
}

/** Bloco `tool_use` a emitir, com args fragmentados em chunks `input_json_delta`. */
export interface ToolUseChunk {
  id: string;
  name: string;
  /**
   * Chunks de `partial_json` (já fragmentados pelo caller). A concatenação de
   * todos os chunks deve ser um JSON válido dos args da tool. Fragmentar em ≥2
   * chunks é OBRIGATÓRIO para fidelidade ao protocolo real (issue #960).
   */
  jsonChunks: string[];
}

/** Resposta classifier a devolver (intents + confidence). */
export interface ClassifierResponse {
  intents: string[];
  confidence: Record<string, number>;
}

/**
 * Serializa eventos SSE no wire format Anthropic. Idêntico ao `buildSseStream`
 * de `tests/mocks/handlers/anthropic.ts` — o proxy não altera o stream.
 */
function buildSseStream(events: SseEvent[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const e of events) {
        controller.enqueue(
          encoder.encode(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`)
        );
      }
      controller.close();
    },
  });
}

/**
 * Constrói a sequência de eventos do wire SSE real para uma resposta do
 * executor com texto opcional + N tool_use blocks (args fragmentados).
 *
 * `stopReason: 'tool_use'` força o `toolCallingLoop` a injectar os
 * `tool_result` e re-chamar; `'end_turn'` fecha o loop.
 */
function buildExecutorEvents(opts: {
  model: string;
  text?: string;
  toolUses?: ToolUseChunk[];
  stopReason: 'tool_use' | 'end_turn';
  inputTokens?: number;
  outputTokens?: number;
}): SseEvent[] {
  const events: SseEvent[] = [];
  const inputTokens = opts.inputTokens ?? 30;
  const outputTokens = opts.outputTokens ?? 15;

  events.push({
    event: 'message_start',
    data: {
      type: 'message_start',
      message: {
        id: 'msg_proxy_mock',
        type: 'message',
        role: 'assistant',
        content: [],
        model: opts.model,
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: inputTokens, output_tokens: 0 },
      },
    },
  });

  let index = 0;

  if (opts.text !== undefined) {
    events.push({
      event: 'content_block_start',
      data: {
        type: 'content_block_start',
        index,
        content_block: { type: 'text', text: '' },
      },
    });
    events.push({
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index,
        delta: { type: 'text_delta', text: opts.text },
      },
    });
    events.push({
      event: 'content_block_stop',
      data: { type: 'content_block_stop', index },
    });
    index += 1;
  }

  for (const tu of opts.toolUses ?? []) {
    // Protocolo real: `input` VAZIO no start; args vêm em deltas (issue #960).
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
    events.push({
      event: 'content_block_stop',
      data: { type: 'content_block_stop', index },
    });
    index += 1;
  }

  events.push({
    event: 'message_delta',
    data: {
      type: 'message_delta',
      delta: { stop_reason: opts.stopReason, stop_sequence: null },
      usage: { output_tokens: outputTokens },
    },
  });
  events.push({
    event: 'message_stop',
    data: { type: 'message_stop' },
  });

  return events;
}

/**
 * Resposta JSON síncrona do classifier (Anthropic Messages API non-stream).
 *
 * `mock-protocol-fidelity.md` (hotfix produção 2026-05-31): o Haiku REAL envolve
 * o JSON em markdown fences (```` ```json ... ``` ````). O mock espelha-o para
 * exercitar o `stripJsonMarkdownFences` do `InferenceTransport.classify`.
 */
function buildClassifierResponse(model: string, payload: ClassifierResponse): Response {
  return new Response(
    JSON.stringify({
      id: 'msg_proxy_classifier',
      type: 'message',
      role: 'assistant',
      model,
      content: [{ type: 'text', text: '```json\n' + JSON.stringify(payload) + '\n```' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 60, output_tokens: 30 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

/** Turno do executor: resposta SSE para a invocação i (0-based) do executor. */
export interface ExecutorTurn {
  text?: string;
  toolUses?: ToolUseChunk[];
  stopReason: 'tool_use' | 'end_turn';
}

export interface MockProxyOptions {
  /** Resposta do classifier (1ª chamada non-stream do `runAgent`). */
  classifier: ClassifierResponse;
  /**
   * Sequência de turnos do executor (chamadas SSE). O `toolCallingLoop`
   * invoca o executor uma vez por iteração; cada chamada consome o próximo
   * turno. A última deve ter `stopReason: 'end_turn'` para fechar o loop.
   */
  executorTurns: ExecutorTurn[];
}

export interface MockProxyResult {
  /** `fetchFn` a injectar em `new InferenceTransport(fetchFn)`. */
  fetchFn: typeof fetch;
  /** Nº de chamadas ao proxy com `stream:true` (executor). */
  getExecutorCallCount: () => number;
  /** Nº de chamadas ao proxy com `stream` falsy (classifier). */
  getClassifierCallCount: () => number;
  /** Bodies (parsed) de cada request recebido — para asserts de protocolo. */
  getRequests: () => Array<Record<string, unknown>>;
}

/**
 * Constrói um mock `fetch` do proxy de inferência. Distingue classifier
 * (non-stream → JSON) de executor (stream → SSE) pelo `body.stream`, tal como
 * o proxy real faria perante a Anthropic.
 *
 * Os turnos do executor são consumidos por ordem: cada chamada SSE devolve o
 * próximo `ExecutorTurn`. Se as chamadas excederem os turnos definidos, lança
 * (sinaliza loop inesperado no teste).
 */
export function createMockProxyFetch(options: MockProxyOptions): MockProxyResult {
  let executorCallCount = 0;
  let classifierCallCount = 0;
  const requests: Array<Record<string, unknown>> = [];

  const fetchFn = (async (
    _input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const body = init?.body
      ? (JSON.parse(init.body as string) as Record<string, unknown>)
      : {};
    requests.push(body);
    const model = typeof body.model === 'string' ? body.model : 'mock-model';

    if (body.stream === true) {
      const turn = options.executorTurns[executorCallCount];
      executorCallCount += 1;
      if (turn === undefined) {
        throw new Error(
          `createMockProxyFetch: executor chamado ${executorCallCount}x mas só há ${options.executorTurns.length} turnos definidos — loop inesperado`
        );
      }
      const events = buildExecutorEvents({
        model,
        text: turn.text,
        toolUses: turn.toolUses,
        stopReason: turn.stopReason,
      });
      return new Response(buildSseStream(events), {
        status: 200,
        headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
      });
    }

    classifierCallCount += 1;
    return buildClassifierResponse(model, options.classifier);
  }) as typeof fetch;

  return {
    fetchFn,
    getExecutorCallCount: () => executorCallCount,
    getClassifierCallCount: () => classifierCallCount,
    getRequests: () => requests,
  };
}
