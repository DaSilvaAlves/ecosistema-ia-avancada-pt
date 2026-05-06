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

    if (system.includes('MOCK_CLASSIFIER')) {
      // Resposta canónica — bem formada
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
