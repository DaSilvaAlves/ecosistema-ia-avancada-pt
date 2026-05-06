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
 * SSE stream com 1 tool_use block — para testar executor a emitir LLMStreamEvent tool_use.
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
          input: { titulo: 'Comprar pão' },
        },
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
      // Detect tool_use scenario by checking if userMsg mentions specific keywords
      // OR if user explicitly requests tool use via system prompt
      const wantsToolUse =
        system.includes('MOCK_EXECUTOR_TOOL_USE') ||
        userMsgText.toLowerCase().includes('comprar pão');

      const stream = wantsToolUse
        ? buildToolUseStream(body.model)
        : buildSimpleTextStream(body.model);

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
