/**
 * Nexus v2 — Mock `fetch` do proxy de inferência OpenAI (Story 8.5 — ADR-10 S5)
 *
 * Variante OpenAI de `tests/mocks/proxy-fetch.ts` (Anthropic). Constrói um
 * `fetchFn` (tipo `fetch`) injectável em `new OpenAIInferenceTransport(fetchFn)`
 * para os testes client-side do transport OpenAI. Intercepta `/api/openai/proxy`
 * (o `OPENAI_PROXY_URL` da 8.4) e substitui a chamada real por respostas
 * determinísticas no **wire format real da OpenAI Chat Completions**.
 *
 * `mock-protocol-fidelity.md` (CRÍTICO nesta story):
 *   O proxy faz **pass-through** do wire SSE real da OpenAI
 *   (`app/api/openai/proxy/route.ts`). Logo este mock NÃO inventa um formato
 *   próprio — reproduz o wire EXACTO da OpenAI (ADR-10 §4.1):
 *     - `data: {chunk}\n\n` (NÃO `event:`/`data:` como o Anthropic);
 *     - `tool_calls.function.arguments` **fragmentados em ≥2 deltas** — o 1.º
 *       chunk de cada `index` traz `id` + `function.name`; os seguintes só
 *       fragmentos de `arguments` (sem `id`/`name`);
 *     - chunk de `usage` (`choices:[]`) **só** com `stream_options.include_usage`;
 *     - `finish_reason:'tool_calls'` vs `'stop'`; terminador `data: [DONE]\n\n`.
 *
 *   O acumulador `Map<index>` do `OpenAIInferenceTransport` só é genuinamente
 *   exercido se os `arguments` vierem fragmentados — um mock que os entregasse
 *   completos num só delta daria fidelidade FALSA (mesma classe do bug da Story
 *   1.2). Por isso `argChunks` é **sempre** ≥2 fragmentos para tool calls com
 *   args; o teste falsificável (AC5) prova-o.
 *
 * Discriminação do request (igual ao proxy real, que reencaminha o body tal-qual
 * para a OpenAI): `body.stream === true` → executor (SSE); caso contrário →
 * classifier (JSON síncrono `ChatCompletion`).
 *
 * Trace canónico:
 * - tests/mocks/proxy-fetch.ts — espelho Anthropic (`createMockProxyFetch`)
 * - lib/agent/providers/openai-inference-transport.ts — consumidor sob teste
 * - app/api/openai/proxy/route.ts — contrato `{ messages, model, stream?, ... }`
 * - tests/mocks/handlers/openai.ts — fixtures SSE espelhadas (MSW server-side)
 */

/** Chunk de envelope `ChatCompletionChunk` (campos estáveis por chunk). */
function streamChunk(
  model: string,
  choices: unknown[],
  usage?: unknown
): Record<string, unknown> {
  return {
    id: 'chatcmpl_mock_8_5_proxy',
    object: 'chat.completion.chunk',
    created: 1700000000,
    model,
    choices,
    ...(usage ? { usage } : {}),
  };
}

/**
 * Tool call a emitir no SSE, com `arguments` fragmentados em chunks. A
 * concatenação de `argChunks` deve ser um JSON válido (ou inválido, para o
 * cenário malformed). Fragmentar em ≥2 chunks é OBRIGATÓRIO para fidelidade ao
 * wire real e para exercitar o acumulador.
 */
export interface OpenAIToolCallChunk {
  index: number;
  id: string;
  name: string;
  /** Fragmentos de `function.arguments` (já fragmentados pelo caller, ≥2). */
  argChunks: string[];
}

/** Turno do executor: resposta SSE para a invocação i (0-based) do executor. */
export interface OpenAIExecutorTurn {
  text?: string;
  toolCalls?: OpenAIToolCallChunk[];
  finishReason: 'stop' | 'tool_calls';
  promptTokens?: number;
  completionTokens?: number;
}

/** Resposta classifier (non-streaming) a devolver. */
export interface OpenAIClassifierResponse {
  intents: string[];
  confidence: Record<string, number>;
}

export interface MockOpenAIProxyOptions {
  /** Resposta do classifier (chamada non-stream). */
  classifier: OpenAIClassifierResponse;
  /**
   * Sequência de turnos do executor (chamadas SSE), consumidos por ordem. Se as
   * chamadas excederem os turnos definidos, lança (sinaliza loop inesperado).
   */
  executorTurns: OpenAIExecutorTurn[];
}

export interface MockOpenAIProxyResult {
  /** `fetchFn` a injectar em `new OpenAIInferenceTransport(fetchFn)`. */
  fetchFn: typeof fetch;
  /** Nº de chamadas ao proxy com `stream:true` (executor). */
  getExecutorCallCount: () => number;
  /** Nº de chamadas ao proxy com `stream` falsy (classifier). */
  getClassifierCallCount: () => number;
  /** Bodies (parsed) de cada request recebido — para asserts de protocolo. */
  getRequests: () => Array<Record<string, unknown>>;
}

/**
 * Serializa um turno do executor no wire SSE real da OpenAI. Emite:
 * - text delta (se `turn.text`): `choices[0].delta.content`;
 * - por cada tool call: 1.º chunk com `id`+`function.name`+`arguments:''`,
 *   depois um chunk por fragmento de `argChunks` (só `arguments`);
 * - chunk de fecho com `finish_reason`;
 * - chunk de `usage` SÓ se `includeUsage`;
 * - terminador `data: [DONE]\n\n`.
 */
function buildOpenAiSseStream(
  model: string,
  turn: OpenAIExecutorTurn,
  includeUsage: boolean
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks: Record<string, unknown>[] = [];

  if (turn.text !== undefined) {
    chunks.push(
      streamChunk(model, [
        { index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null },
      ])
    );
    chunks.push(
      streamChunk(model, [
        { index: 0, delta: { content: turn.text }, finish_reason: null },
      ])
    );
  }

  for (const tc of turn.toolCalls ?? []) {
    // Contrato de fidelidade (mock-protocol-fidelity.md): um tool call COM args
    // tem de fragmentar em ≥2 deltas. Um único delta com os args completos
    // tornaria o acumulador `Map<index>` trivialmente verde (fidelidade falsa,
    // classe do bug da Story 1.2). No-args (`argChunks: []`) é legítimo (→ {}).
    const joinedArgs = tc.argChunks.join('');
    if (joinedArgs.length > 0 && tc.argChunks.length < 2) {
      throw new Error(
        `createMockOpenAIProxyFetch: argChunks de "${tc.name}" deve fragmentar os arguments em ≥2 deltas (mock-protocol-fidelity) — recebido ${tc.argChunks.length}`
      );
    }
    // 1.º chunk do `index`: id + name + arguments vazio (wire real).
    chunks.push(
      streamChunk(model, [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: tc.index,
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: '' },
              },
            ],
          },
          finish_reason: null,
        },
      ])
    );
    // Chunks seguintes: só fragmentos de arguments (sem id/name).
    for (const frag of tc.argChunks) {
      chunks.push(
        streamChunk(model, [
          {
            index: 0,
            delta: { tool_calls: [{ index: tc.index, function: { arguments: frag } }] },
            finish_reason: null,
          },
        ])
      );
    }
  }

  // Chunk de fecho com finish_reason (delta vazio).
  chunks.push(
    streamChunk(model, [{ index: 0, delta: {}, finish_reason: turn.finishReason }])
  );

  if (includeUsage) {
    const promptTokens = turn.promptTokens ?? 30;
    const completionTokens = turn.completionTokens ?? 15;
    chunks.push(
      streamChunk(model, [], {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      })
    );
  }

  return new ReadableStream({
    start(controller) {
      for (const c of chunks) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(c)}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

/**
 * Resposta JSON síncrona do classifier (OpenAI Chat Completions non-stream).
 *
 * `mock-protocol-fidelity.md`: com `response_format:{type:'json_object'}` a
 * OpenAI real devolve JSON puro sem markdown fences (ADR-10 §4.4) — o mock
 * espelha-o (sem fences, ao contrário do mock Anthropic que as inclui para
 * exercitar `stripJsonMarkdownFences`). Usage com nomes OpenAI.
 */
function buildClassifierResponse(
  model: string,
  payload: OpenAIClassifierResponse
): Response {
  return new Response(
    JSON.stringify({
      id: 'chatcmpl_clf_mock_8_5_proxy',
      object: 'chat.completion',
      created: 1700000000,
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content: JSON.stringify(payload) },
          finish_reason: 'stop',
        },
      ],
      usage: { prompt_tokens: 60, completion_tokens: 30, total_tokens: 90 },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

/**
 * Constrói um mock `fetch` do proxy de inferência OpenAI. Distingue classifier
 * (non-stream → JSON) de executor (stream → SSE) pelo `body.stream`, tal como o
 * proxy real faria perante a OpenAI. O chunk de `usage` só é emitido quando o
 * request pede `stream_options.include_usage` (o transport executor pede-o
 * sempre; o mock honra fielmente).
 */
export function createMockOpenAIProxyFetch(
  options: MockOpenAIProxyOptions
): MockOpenAIProxyResult {
  let executorCallCount = 0;
  let classifierCallCount = 0;
  const requests: Array<Record<string, unknown>> = [];

  const fetchFn = (async (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    // Falha rápido se o transport contactar uma URL diferente do proxy OpenAI —
    // um erro de routing no transport não deve passar despercebido como sucesso.
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
    if (!url.includes('/api/openai/proxy')) {
      throw new Error(
        `createMockOpenAIProxyFetch: URL inesperada "${url}" — esperado /api/openai/proxy`
      );
    }
    const body = init?.body
      ? (JSON.parse(init.body as string) as Record<string, unknown>)
      : {};
    requests.push(body);
    const model = typeof body.model === 'string' ? body.model : 'gpt-4.1-mock';

    if (body.stream === true) {
      const turn = options.executorTurns[executorCallCount];
      executorCallCount += 1;
      if (turn === undefined) {
        throw new Error(
          `createMockOpenAIProxyFetch: executor chamado ${executorCallCount}x mas só há ${options.executorTurns.length} turnos definidos — loop inesperado`
        );
      }
      const streamOptions = body.stream_options as
        | { include_usage?: boolean }
        | undefined;
      const includeUsage = streamOptions?.include_usage === true;
      return new Response(buildOpenAiSseStream(model, turn, includeUsage), {
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
