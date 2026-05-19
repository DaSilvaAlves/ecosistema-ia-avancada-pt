import { http, HttpResponse } from 'msw';

/**
 * Nexus v2 — MSW handlers Anthropic
 *
 * Storia 0.5 — mock multi-intent canónico (proxy Anthropic).
 * Story 1.2 — handlers para classifier (síncrono JSON) e executor (SSE streaming).
 *
 * Rota única (`https://api.anthropic.com/v1/messages`) com discriminação por
 * conteúdo do request:
 * 1. `body.system` contém "MOCK_CLASSIFIER" → classifier response (JSON)
 * 2. `body.system` contém "MOCK_CLASSIFIER_MALFORMED" → response sem campo `intents`
 * 3. `body.stream === true` + tools array → executor SSE com tool_use
 * 4. `body.stream === true` + sem tools → executor SSE só com text_delta + done
 * 5. `body.system` contém "MOCK_API_ERROR" → 500 error
 * 6. Multi-intent canónico (Story 0.5): `paguei €78,70...` → 2 tool_use blocks
 * 7. Fallback genérico → text response
 *
 * Pattern MSW SSE com `ReadableStream` (should-fix #2 PO):
 * ```ts
 * const stream = new ReadableStream({
 *   start(c) {
 *     c.enqueue(new TextEncoder().encode('event: ...\ndata: {...}\n\n'));
 *     c.close();
 *   },
 * });
 * return new HttpResponse(stream, { headers: { 'content-type': 'text/event-stream' } });
 * ```
 */

interface AnthropicRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string | unknown[] }>;
  model: string;
  stream?: boolean;
  system?: string;
  max_tokens?: number;
  tools?: Array<{ name: string; description: string; input_schema: unknown }>;
}

/**
 * Helper para construir SSE stream Anthropic com sequência de eventos.
 * Cada evento é serializado no formato `event: TYPE\ndata: JSON\n\n`.
 */
function buildSseStream(events: Array<{ event: string; data: object }>): ReadableStream<Uint8Array> {
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
 * SSE stream simples — apenas text_delta + done (sem tools).
 * Usado em testes de executor com stream básico.
 */
function buildSimpleTextStream(model: string, text: string = 'Olá mundo'): ReadableStream<Uint8Array> {
  return buildSseStream([
    {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: {
          id: 'msg_simple_text',
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 12, output_tokens: 0 },
        },
      },
    },
    {
      event: 'content_block_start',
      data: {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'text', text: '' },
      },
    },
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'text_delta', text },
      },
    },
    {
      event: 'content_block_stop',
      data: { type: 'content_block_stop', index: 0 },
    },
    {
      event: 'message_delta',
      data: {
        type: 'message_delta',
        delta: { stop_reason: 'end_turn', stop_sequence: null },
        usage: { output_tokens: 7 },
      },
    },
    {
      event: 'message_stop',
      data: { type: 'message_stop' },
    },
  ]);
}

/**
 * SSE stream com 1 tool_use block — protocolo Anthropic real.
 *
 * Iter 3 (CodeRabbit Major 1): refactor para emitir o protocolo correcto:
 * - `content_block_start` com `input: {}` (NÃO `{ titulo: 'Comprar pão' }`)
 * - `content_block_delta` com `input_json_delta` chunks finalizando o JSON
 * - `content_block_stop` para sinalizar fim do tool_use
 *
 * Args canónico: `{"titulo":"Comprar pão"}` — partido em 2 chunks pelo
 * meio para exercitar concatenação básica.
 *
 * Refs: SDK Anthropic issue #960; API docs Streaming Messages.
 */
function buildToolUseStream(model: string): ReadableStream<Uint8Array> {
  return buildSseStream([
    {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: {
          id: 'msg_tool_use',
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 25, output_tokens: 0 },
        },
      },
    },
    {
      event: 'content_block_start',
      data: {
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'tool_use',
          id: 'toolu_test_01',
          name: 'criar_tarefa',
          // Protocolo real: `input` chega vazio no start; args vêm em deltas
          input: {},
        },
      },
    },
    // Chunk 1 — primeira parte do JSON (deliberadamente parte na string)
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: '{"titulo":"Comp' },
      },
    },
    // Chunk 2 — segunda parte que completa o JSON
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: 'rar pão"}' },
      },
    },
    {
      event: 'content_block_stop',
      data: { type: 'content_block_stop', index: 0 },
    },
    {
      event: 'message_delta',
      data: {
        type: 'message_delta',
        delta: { stop_reason: 'tool_use', stop_sequence: null },
        usage: { output_tokens: 15 },
      },
    },
    {
      event: 'message_stop',
      data: { type: 'message_stop' },
    },
  ]);
}

/**
 * Variante stress-test do tool_use stream — fragmenta o JSON em 5 chunks
 * com cortes em pontos hostis: meio de string (com aspas), meio de número,
 * e separador `:` isolado. Usado para validar que a reagregação no executor
 * é robusta independentemente de onde o servidor parte os chunks.
 *
 * Args canónico: `{"titulo":"Olá mundo","prioridade":42}`
 */
function buildToolUseStreamChunked(model: string): ReadableStream<Uint8Array> {
  return buildSseStream([
    {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: {
          id: 'msg_tool_use_chunked',
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 30, output_tokens: 0 },
        },
      },
    },
    {
      event: 'content_block_start',
      data: {
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'tool_use',
          id: 'toolu_chunked_01',
          name: 'criar_tarefa',
          input: {},
        },
      },
    },
    // 5 chunks, cortes hostis: dentro de string, num separador, num inteiro
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: '{"titulo":"Olá ' },
      },
    },
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: 'mundo","prio' },
      },
    },
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: 'ridade":' },
      },
    },
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: '4' },
      },
    },
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: '2}' },
      },
    },
    {
      event: 'content_block_stop',
      data: { type: 'content_block_stop', index: 0 },
    },
    {
      event: 'message_delta',
      data: {
        type: 'message_delta',
        delta: { stop_reason: 'tool_use', stop_sequence: null },
        usage: { output_tokens: 20 },
      },
    },
    {
      event: 'message_stop',
      data: { type: 'message_stop' },
    },
  ]);
}

/**
 * SSE stream que emite uma sequência específica de eventos (Story 1.5).
 *
 * `multipleToolUses=N` cria `N` content_block tool_use distintos numa só
 * resposta — usado para testar execução SEQUENCIAL multi-intent (RESOLVED-1).
 * Cada tool_use é um índice diferente e tem args que o test pode discriminar.
 *
 * `infiniteLoop=true` força stop_reason `tool_use` para o executor continuar
 * a iterar — usado para testar `MAX_TOOL_ITERATIONS` guard (Story 1.5 AC3).
 *
 * `textOnly=true` emite apenas text_delta + done — happy path sem tools.
 */
interface ExecutorMockOpts {
  textOnly?: boolean;
  toolUses?: Array<{ id: string; name: string; argsJson: string }>;
  stopReason?: 'end_turn' | 'tool_use';
  inputTokens?: number;
  outputTokens?: number;
  text?: string;
}

function buildExecutorStream(model: string, opts: ExecutorMockOpts): ReadableStream<Uint8Array> {
  const events: Array<{ event: string; data: object }> = [];
  const inputTokens = opts.inputTokens ?? 30;
  const outputTokens = opts.outputTokens ?? 15;

  events.push({
    event: 'message_start',
    data: {
      type: 'message_start',
      message: {
        id: 'msg_executor_mock',
        type: 'message',
        role: 'assistant',
        content: [],
        model,
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: inputTokens, output_tokens: 0 },
      },
    },
  });

  let blockIndex = 0;

  if (opts.textOnly || opts.text !== undefined) {
    const text = opts.text ?? 'Resposta de teste do executor.';
    events.push({
      event: 'content_block_start',
      data: {
        type: 'content_block_start',
        index: blockIndex,
        content_block: { type: 'text', text: '' },
      },
    });
    events.push({
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: blockIndex,
        delta: { type: 'text_delta', text },
      },
    });
    events.push({
      event: 'content_block_stop',
      data: { type: 'content_block_stop', index: blockIndex },
    });
    blockIndex += 1;
  }

  if (opts.toolUses) {
    for (const tu of opts.toolUses) {
      events.push({
        event: 'content_block_start',
        data: {
          type: 'content_block_start',
          index: blockIndex,
          content_block: { type: 'tool_use', id: tu.id, name: tu.name, input: {} },
        },
      });
      events.push({
        event: 'content_block_delta',
        data: {
          type: 'content_block_delta',
          index: blockIndex,
          delta: { type: 'input_json_delta', partial_json: tu.argsJson },
        },
      });
      events.push({
        event: 'content_block_stop',
        data: { type: 'content_block_stop', index: blockIndex },
      });
      blockIndex += 1;
    }
  }

  events.push({
    event: 'message_delta',
    data: {
      type: 'message_delta',
      delta: { stop_reason: opts.stopReason ?? 'end_turn', stop_sequence: null },
      usage: { output_tokens: outputTokens },
    },
  });
  events.push({
    event: 'message_stop',
    data: { type: 'message_stop' },
  });

  return buildSseStream(events);
}

/**
 * Variante de erro — tool_use com `input_json_delta` que produz JSON inválido.
 * Usado para validar que o executor emite `error` event e re-throws.
 */
function buildToolUseStreamMalformed(model: string): ReadableStream<Uint8Array> {
  return buildSseStream([
    {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: {
          id: 'msg_tool_use_malformed',
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 20, output_tokens: 0 },
        },
      },
    },
    {
      event: 'content_block_start',
      data: {
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'tool_use',
          id: 'toolu_malformed_01',
          name: 'criar_tarefa',
          input: {},
        },
      },
    },
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: '{"titulo":NOT_VAL' },
      },
    },
    {
      event: 'content_block_delta',
      data: {
        type: 'content_block_delta',
        index: 0,
        delta: { type: 'input_json_delta', partial_json: 'ID_JSON' },
      },
    },
    {
      event: 'content_block_stop',
      data: { type: 'content_block_stop', index: 0 },
    },
    {
      event: 'message_delta',
      data: {
        type: 'message_delta',
        delta: { stop_reason: 'tool_use', stop_sequence: null },
        usage: { output_tokens: 5 },
      },
    },
    {
      event: 'message_stop',
      data: { type: 'message_stop' },
    },
  ]);
}

export const anthropicHandlers = [
  http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
    const body = (await request.json()) as AnthropicRequestBody;
    const userMsg = body.messages.find((m) => m.role === 'user');
    const userMsgText = typeof userMsg?.content === 'string' ? userMsg.content : '';
    const system = body.system ?? '';

    // ── Story 1.2 — Classifier (síncrono, JSON) ────────────────────────────
    // Detectado por system prompt magic string (testes definem-no explicitamente)
    if (system.includes('MOCK_CLASSIFIER_MALFORMED')) {
      // Resposta sem campo `intents` — testa ZodError do classifier
      return HttpResponse.json({
        id: 'msg_classifier_malformed',
        type: 'message',
        role: 'assistant',
        model: body.model,
        content: [
          {
            type: 'text',
            text: JSON.stringify({ confidence: { foo: 0.5 } }), // sem intents
          },
        ],
        stop_reason: 'end_turn',
        usage: { input_tokens: 50, output_tokens: 20 },
      });
    }

    if (system.includes('MOCK_CLASSIFIER_NOT_JSON')) {
      // Texto que não é JSON — testa parse error do classifier
      return HttpResponse.json({
        id: 'msg_classifier_not_json',
        type: 'message',
        role: 'assistant',
        model: body.model,
        content: [
          {
            type: 'text',
            text: 'Não é JSON, é texto livre',
          },
        ],
        stop_reason: 'end_turn',
        usage: { input_tokens: 50, output_tokens: 10 },
      });
    }

    // ── Story 1.4 — Classifier wrapper PT-PT (intents = domains) ────────────
    // Magic strings novas (Story 1.4 AC10). Detectadas ANTES do `MOCK_CLASSIFIER`
    // genérico (Story 1.2) porque `system.includes('MOCK_CLASSIFIER')` daria
    // match-positivo em todas estas variantes.
    //
    // Helper inline que constrói resposta classifier well-formed:
    function classifierResponse(payload: {
      intents: string[];
      confidence: Record<string, number>;
    }) {
      return HttpResponse.json({
        id: 'msg_classifier_v14',
        type: 'message',
        role: 'assistant',
        model: body.model,
        content: [{ type: 'text', text: JSON.stringify(payload) }],
        stop_reason: 'end_turn',
        usage: { input_tokens: 80, output_tokens: 40 },
      });
    }

    // Story 1.4: detectar magic strings TANTO no system (Story 1.2 pattern) COMO
    // no userMsgText (Story 1.4 pattern — wrapper `classifyPrompt` constrói o
    // system internamente, então tests injectam magic via prefix do user prompt).
    const triggers = `${system}\n${userMsgText}`;

    if (triggers.includes('MOCK_CLASSIFIER_MULTI_INTENT')) {
      // AC6 Epic 1 AC1 benchmark — multi-domain
      return classifierResponse({
        intents: ['calendar', 'finance'],
        confidence: { calendar: 0.95, finance: 0.93 },
      });
    }

    if (triggers.includes('MOCK_CLASSIFIER_TASKS')) {
      return classifierResponse({
        intents: ['tasks'],
        confidence: { tasks: 0.95 },
      });
    }

    if (triggers.includes('MOCK_CLASSIFIER_EMPTY')) {
      // AC8 — prompt sem domínio relevante
      return classifierResponse({ intents: [], confidence: {} });
    }

    if (triggers.includes('MOCK_CLASSIFIER_INVALID_DOMAIN')) {
      // AC4 — intent fora de availableDomains (esperado erro PT-PT no wrapper)
      return classifierResponse({
        intents: ['NOT_A_DOMAIN'],
        confidence: { NOT_A_DOMAIN: 0.9 },
      });
    }

    if (triggers.includes('MOCK_CLASSIFIER_OUT_OF_RANGE_CONFIDENCE_HIGH')) {
      // AC4 — confidence > 1 (prompt drift)
      return classifierResponse({
        intents: ['tasks'],
        confidence: { tasks: 1.5 },
      });
    }

    if (triggers.includes('MOCK_CLASSIFIER_OUT_OF_RANGE_CONFIDENCE_LOW')) {
      // AC4 — confidence < 0
      return classifierResponse({
        intents: ['tasks'],
        confidence: { tasks: -0.2 },
      });
    }

    if (triggers.includes('MOCK_CLASSIFIER_ORPHAN_CONFIDENCE')) {
      // AC4 — key em confidence sem intent correspondente
      return classifierResponse({
        intents: ['tasks'],
        confidence: { tasks: 0.9, finance: 0.5 },
      });
    }

    // ── Story 1.5 — Classifier auto-responses para MOCK_EXECUTOR_* prompts ──
    //
    // O wrapper `classifyPrompt` (Story 1.4) é invocado como primeiro passo do
    // `runAgent` (Story 1.5). Tests injectam magic strings `MOCK_EXECUTOR_*` no
    // userPrompt — o classifier vê o prompt completo e precisa de retornar
    // intents válidos (empty se o test não regista tools, ou específicos se
    // o test regista tools de domains concretos). NUNCA passa pelo
    // `MOCK_CLASSIFIER_*` genérico; intercept aqui.
    //
    // Tests são request-non-streaming (classifier) — distinguidos de executor
    // pelo `body.stream` undefined/false. Classifier nunca usa stream.
    if (
      !body.stream &&
      (userMsgText.includes('MOCK_EXECUTOR_TWO_TOOLS') ||
        userMsgText.includes('MOCK_EXECUTOR_MULTI_DOMAIN'))
    ) {
      // Multi-intent: retorna calendar + finance (Story 1.5 multi-intent benchmark)
      return classifierResponse({
        intents: ['calendar', 'finance'],
        confidence: { calendar: 0.95, finance: 0.93 },
      });
    }

    if (
      !body.stream &&
      (userMsgText.includes('MOCK_EXECUTOR_ONE_TOOL_USE') ||
        userMsgText.includes('MOCK_EXECUTOR_BAD_TOOL_NAME') ||
        userMsgText.includes('MOCK_EXECUTOR_BAD_ARGS') ||
        userMsgText.includes('MOCK_EXECUTOR_INFINITE_LOOP') ||
        userMsgText.includes('MOCK_EXECUTOR_TEXT_THEN_TOOL_USE') ||
        userMsgText.includes('MOCK_EXECUTOR_PROVIDER_ERROR'))
    ) {
      // Tools de domain `meta` — registry test injecta tools com domain='meta'
      // que `getToolsForDomains` sempre inclui (independentemente dos intents).
      return classifierResponse({
        intents: ['meta'],
        confidence: { meta: 0.9 },
      });
    }

    // ── Story 1.6 — Classifier responses para gate de preview ─────────────
    //
    // `MOCK_EXECUTOR_LOW_CONFIDENCE` — classifier retorna `confidence: { tasks: 0.55 }`
    // para activar o gate por baixa confiança. Test regista tool com domain='tasks'.
    //
    // `MOCK_EXECUTOR_REQUIRES_PREVIEW` — classifier retorna confidence normal
    // (>= 0.7); o gate é activado pelo flag `requiresPreview: true` da tool
    // registada pelo test. Tools `meta` (sempre incluídas) com domain != 'tasks'
    // não passam para o gate-by-confidence (`hasConfidenceBelowThreshold` retorna
    // false para domains ausentes do mapa).
    //
    // `MOCK_EXECUTOR_BOTH_GATES` — confidence < 0.7 E tool com requiresPreview=true.
    if (!body.stream && userMsgText.includes('MOCK_EXECUTOR_LOW_CONFIDENCE')) {
      return classifierResponse({
        intents: ['tasks'],
        confidence: { tasks: 0.55 },
      });
    }

    if (!body.stream && userMsgText.includes('MOCK_EXECUTOR_REQUIRES_PREVIEW')) {
      return classifierResponse({
        intents: ['tasks'],
        confidence: { tasks: 0.92 },
      });
    }

    if (!body.stream && userMsgText.includes('MOCK_EXECUTOR_BOTH_GATES')) {
      return classifierResponse({
        intents: ['tasks'],
        confidence: { tasks: 0.45 },
      });
    }

    if (!body.stream && userMsgText.includes('MOCK_EXECUTOR_TEXT_ONLY')) {
      // Text-only: empty intents → registry vazio → Sonnet só gera texto
      return classifierResponse({ intents: [], confidence: {} });
    }

    if (!body.stream && userMsgText.includes('MOCK_EXECUTOR_CLASSIFIER_FAIL')) {
      // Story 1.5 AC9 — classifier lança excepção
      return HttpResponse.json(
        { type: 'error', error: { type: 'api_error', message: 'mock classifier 500' } },
        { status: 500 }
      );
    }

    if (system.includes('MOCK_CLASSIFIER')) {
      // Story 1.2 — resposta canónica original (preservada para backward compat)
      return HttpResponse.json({
        id: 'msg_classifier_ok',
        type: 'message',
        role: 'assistant',
        model: body.model,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              intents: ['criar_tarefa', 'criar_evento_calendar'],
              confidence: { criar_tarefa: 0.92, criar_evento_calendar: 0.85 },
            }),
          },
        ],
        stop_reason: 'end_turn',
        usage: { input_tokens: 80, output_tokens: 40 },
      });
    }

    if (system.includes('MOCK_API_ERROR')) {
      return HttpResponse.json(
        { type: 'error', error: { type: 'api_error', message: 'mock 500' } },
        { status: 500 }
      );
    }

    // ── Story 1.2 — Executor (SSE streaming) ────────────────────────────────
    if (body.stream === true) {
      // Iter 3: variantes de tool_use detectadas por magic strings explícitas
      // no system prompt. Mantém detecção implícita por keyword "comprar pão"
      // para preservar tests pré-existentes da Iter 1.
      //
      // Story 1.5 + hotfix 18/05/2026: executor agora passa
      // EXECUTOR_SYSTEM_PROMPT (PT-PT) — root cause do bug PT-BR em produção
      // fica resolvido. Magic strings `MOCK_EXECUTOR_*` continuam detectadas
      // no userMsgText (não no system) por backward-compat dos testes Story
      // 1.5. Discriminator canónico executor vs classifier permanece
      // `body.stream === true`. Avaliadas ANTES das Story 1.2 magic strings
      // para evitar conflito.

      // Story 1.5 — turn-aware: Story 1.5 magic strings só se aplicam à
      // PRIMEIRA invocação do executor (turn 1). Em turn 2+ (depois de tool_use
      // injectado como tool_result), o messages já tem `assistant` + `user`
      // (tool_result) — detectar via `body.messages.length > 1`. Em turn 2+,
      // resposta canónica é text-only `end_turn` para fechar o loop sem mais
      // tool_use (excepto para INFINITE_LOOP que continua a pedir).
      const isFollowUp = body.messages.length > 1;
      // CodeRabbit Iter 1 nit-2: typeof guard redundante — `?? ''` já garante
      // string. O find já filtra por `typeof m.content === 'string'`, logo o
      // valor é sempre string ou cai no fallback `''`.
      const userText =
        body.messages
          .slice()
          .reverse()
          .find((m) => m.role === 'user' && typeof m.content === 'string')?.content ?? '';

      // Story 1.5 mock variants
      if (userMsgText.includes('MOCK_EXECUTOR_TEXT_ONLY')) {
        return new HttpResponse(
          buildExecutorStream(body.model, {
            textOnly: true,
            text: 'OK feito.',
            stopReason: 'end_turn',
          }),
          {
            headers: {
              'content-type': 'text/event-stream',
              'cache-control': 'no-cache',
            },
          }
        );
      }

      if (userMsgText.includes('MOCK_EXECUTOR_ONE_TOOL_USE')) {
        if (!isFollowUp) {
          return new HttpResponse(
            buildExecutorStream(body.model, {
              toolUses: [
                {
                  id: 'toolu_one_01',
                  name: 'tool_test_one',
                  argsJson: '{"x":"hello"}',
                },
              ],
              stopReason: 'tool_use',
              inputTokens: 25,
              outputTokens: 12,
            }),
            {
              headers: {
                'content-type': 'text/event-stream',
                'cache-control': 'no-cache',
              },
            }
          );
        }
        // Follow-up turn — fecha com texto
        return new HttpResponse(
          buildExecutorStream(body.model, {
            text: 'Tarefa criada com sucesso.',
            stopReason: 'end_turn',
            inputTokens: 50,
            outputTokens: 8,
          }),
          {
            headers: {
              'content-type': 'text/event-stream',
              'cache-control': 'no-cache',
            },
          }
        );
      }

      if (userMsgText.includes('MOCK_EXECUTOR_TWO_TOOLS')) {
        if (!isFollowUp) {
          return new HttpResponse(
            buildExecutorStream(body.model, {
              toolUses: [
                {
                  id: 'toolu_two_01',
                  name: 'tool_calendar',
                  argsJson: '{"titulo":"reunião","hora":"15:00"}',
                },
                {
                  id: 'toolu_two_02',
                  name: 'tool_finance',
                  argsJson: '{"valor":78.7,"descricao":"supermercado"}',
                },
              ],
              stopReason: 'tool_use',
              inputTokens: 40,
              outputTokens: 25,
            }),
            {
              headers: {
                'content-type': 'text/event-stream',
                'cache-control': 'no-cache',
              },
            }
          );
        }
        return new HttpResponse(
          buildExecutorStream(body.model, {
            text: 'Evento e despesa registados.',
            stopReason: 'end_turn',
            inputTokens: 80,
            outputTokens: 10,
          }),
          {
            headers: {
              'content-type': 'text/event-stream',
              'cache-control': 'no-cache',
            },
          }
        );
      }

      // Story 1.5 Iter 3 (CodeRabbit Iter 2 #3): turn 1 emite `text` + `tool_use`
      // — turn 2 deve receber assistant message com ContentBlock[] em ordem:
      // [{ type: 'text', text }, { type: 'tool_use', ... }]. Test correspondente
      // captura o body do segundo request via `server.use` e valida ordem.
      if (userMsgText.includes('MOCK_EXECUTOR_TEXT_THEN_TOOL_USE')) {
        if (!isFollowUp) {
          return new HttpResponse(
            buildExecutorStream(body.model, {
              text: 'Vou criar essa tarefa para ti.',
              toolUses: [
                {
                  id: 'toolu_text_then_01',
                  name: 'tool_test_one',
                  argsJson: '{"x":"hello"}',
                },
              ],
              stopReason: 'tool_use',
              inputTokens: 30,
              outputTokens: 18,
            }),
            {
              headers: {
                'content-type': 'text/event-stream',
                'cache-control': 'no-cache',
              },
            }
          );
        }
        return new HttpResponse(
          buildExecutorStream(body.model, {
            text: 'Concluído.',
            stopReason: 'end_turn',
            inputTokens: 60,
            outputTokens: 5,
          }),
          {
            headers: {
              'content-type': 'text/event-stream',
              'cache-control': 'no-cache',
            },
          }
        );
      }

      // Story 1.5 Iter 3 (CodeRabbit Iter 2 #2): provider yield error event +
      // throw (anthropic.ts L369-374). Reutiliza `buildToolUseStreamMalformed`
      // que produz `input_json_delta` inválido — provider emite `tool_error`
      // event e re-throws. Sem fix Iter 3, o catch do executor emite um
      // segundo `tool_error executor` (duplicação) e marca status='partial'
      // (deveria ser 'failed' porque nenhum tool executou com sucesso).
      if (userMsgText.includes('MOCK_EXECUTOR_PROVIDER_ERROR')) {
        return new HttpResponse(buildToolUseStreamMalformed(body.model), {
          headers: {
            'content-type': 'text/event-stream',
            'cache-control': 'no-cache',
          },
        });
      }

      // ── Story 1.6 — Executor SSE streams para gate de preview ─────────────
      //
      // Cada magic string tem um par `(turn 1 = tool_use, turn 2 = end_turn)`.
      // O nome da tool e args vêm dos tests via tool registada — o handler
      // emite o nome canónico `tool_preview` (que o test regista com config
      // adequada: domain='tasks' para LOW_CONFIDENCE/BOTH; requiresPreview
      // para REQUIRES_PREVIEW/BOTH).
      if (
        userMsgText.includes('MOCK_EXECUTOR_LOW_CONFIDENCE') ||
        userMsgText.includes('MOCK_EXECUTOR_REQUIRES_PREVIEW') ||
        userMsgText.includes('MOCK_EXECUTOR_BOTH_GATES')
      ) {
        if (!isFollowUp) {
          return new HttpResponse(
            buildExecutorStream(body.model, {
              toolUses: [
                {
                  id: 'toolu_preview_01',
                  name: 'tool_preview',
                  argsJson: '{"titulo":"comprar pão"}',
                },
              ],
              stopReason: 'tool_use',
              inputTokens: 28,
              outputTokens: 14,
            }),
            {
              headers: {
                'content-type': 'text/event-stream',
                'cache-control': 'no-cache',
              },
            }
          );
        }
        return new HttpResponse(
          buildExecutorStream(body.model, {
            text: 'Acção concluída.',
            stopReason: 'end_turn',
            inputTokens: 55,
            outputTokens: 6,
          }),
          {
            headers: {
              'content-type': 'text/event-stream',
              'cache-control': 'no-cache',
            },
          }
        );
      }

      if (userMsgText.includes('MOCK_EXECUTOR_INFINITE_LOOP') || userText.includes('MOCK_EXECUTOR_INFINITE_LOOP')) {
        // Sempre responde com tool_use, mesmo em follow-up — testa MAX_TOOL_ITERATIONS guard
        return new HttpResponse(
          buildExecutorStream(body.model, {
            toolUses: [
              {
                id: `toolu_loop_${Date.now()}`,
                name: 'tool_test_loop',
                argsJson: '{"x":"again"}',
              },
            ],
            stopReason: 'tool_use',
            inputTokens: 20,
            outputTokens: 10,
          }),
          {
            headers: {
              'content-type': 'text/event-stream',
              'cache-control': 'no-cache',
            },
          }
        );
      }

      if (userMsgText.includes('MOCK_EXECUTOR_BAD_TOOL_NAME')) {
        // tool_use para tool nunca registada — testa AC4 unknown tool branch
        if (!isFollowUp) {
          return new HttpResponse(
            buildExecutorStream(body.model, {
              toolUses: [
                {
                  id: 'toolu_bad_01',
                  name: 'tool_inexistente_xyz',
                  argsJson: '{"x":"y"}',
                },
              ],
              stopReason: 'tool_use',
              inputTokens: 22,
              outputTokens: 9,
            }),
            {
              headers: {
                'content-type': 'text/event-stream',
                'cache-control': 'no-cache',
              },
            }
          );
        }
        return new HttpResponse(
          buildExecutorStream(body.model, {
            text: 'Não consegui invocar a tool.',
            stopReason: 'end_turn',
            inputTokens: 50,
            outputTokens: 6,
          }),
          {
            headers: {
              'content-type': 'text/event-stream',
              'cache-control': 'no-cache',
            },
          }
        );
      }

      if (userMsgText.includes('MOCK_EXECUTOR_BAD_ARGS')) {
        // tool_use com args que falham Zod parse na tool registada
        if (!isFollowUp) {
          return new HttpResponse(
            buildExecutorStream(body.model, {
              toolUses: [
                {
                  id: 'toolu_bad_args_01',
                  name: 'tool_test_one',
                  argsJson: '{"x":42}',
                },
              ],
              stopReason: 'tool_use',
              inputTokens: 24,
              outputTokens: 11,
            }),
            {
              headers: {
                'content-type': 'text/event-stream',
                'cache-control': 'no-cache',
              },
            }
          );
        }
        return new HttpResponse(
          buildExecutorStream(body.model, {
            text: 'Args inválidos detectados.',
            stopReason: 'end_turn',
            inputTokens: 50,
            outputTokens: 7,
          }),
          {
            headers: {
              'content-type': 'text/event-stream',
              'cache-control': 'no-cache',
            },
          }
        );
      }

      // Story 1.2 — handlers existentes preservados
      let stream: ReadableStream<Uint8Array>;
      if (system.includes('MOCK_EXECUTOR_TOOL_USE_CHUNKED')) {
        stream = buildToolUseStreamChunked(body.model);
      } else if (system.includes('MOCK_EXECUTOR_TOOL_USE_MALFORMED')) {
        stream = buildToolUseStreamMalformed(body.model);
      } else if (
        system.includes('MOCK_EXECUTOR_TOOL_USE') ||
        userMsgText.toLowerCase().includes('comprar pão')
      ) {
        stream = buildToolUseStream(body.model);
      } else {
        stream = buildSimpleTextStream(body.model);
      }

      return new HttpResponse(stream, {
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
        },
      });
    }

    // ── Story 0.5 — Multi-intent canónico (proxy Anthropic) ─────────────────
    if (userMsgText.includes('paguei €78,70') && userMsgText.includes('amanhã reunião 15h')) {
      return HttpResponse.json({
        id: 'msg_test_multi',
        type: 'message',
        role: 'assistant',
        model: body.model,
        content: [
          {
            type: 'tool_use',
            id: 'toolu_1',
            name: 'criar_finança_variavel',
            input: { valor: 78.7, descricao: 'supermercado', categoria: 'Mercearia' },
          },
          {
            type: 'tool_use',
            id: 'toolu_2',
            name: 'criar_evento_calendar',
            input: { titulo: 'reunião', data: 'tomorrow', hora: '15:00' },
          },
        ],
        stop_reason: 'tool_use',
        usage: { input_tokens: 100, output_tokens: 50 },
      });
    }

    // Fallback genérico — resposta texto simples
    return HttpResponse.json({
      id: 'msg_test_fallback',
      type: 'message',
      role: 'assistant',
      model: body.model,
      content: [{ type: 'text', text: 'Mock response (no canonical match).' }],
      stop_reason: 'end_turn',
      usage: { input_tokens: 10, output_tokens: 10 },
    });
  }),
];
