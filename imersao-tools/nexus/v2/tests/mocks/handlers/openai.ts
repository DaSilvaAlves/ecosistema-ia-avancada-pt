import { http, HttpResponse } from 'msw';

/**
 * Nexus v2 — MSW handlers OpenAI (Story 8.2 / ADR-10 S2)
 *
 * Mock do wire OpenAI Chat Completions em streaming (`https://api.openai.com/v1/chat/completions`).
 * Reflecte o wire **real** (`mock-protocol-fidelity.md`):
 * - SSE estilo `data: {chunk}\n\n` (NÃO `event:`/`data:` como Anthropic);
 * - `tool_calls.function.arguments` **fragmentados em ≥2 deltas** — o 1.º chunk de
 *   cada `index` traz `id` + `function.name`; os seguintes só fragmentos de
 *   `arguments` (sem `id`/`name`);
 * - chunk final de `usage` (`choices:[]`, só presente com `stream_options.include_usage`);
 * - `finish_reason:'tool_calls'` vs `'stop'`;
 * - terminador `data: [DONE]`.
 *
 * Discriminação por magic string no conteúdo da última mensagem `user`
 * (espelha o padrão dos handlers Anthropic). A 8.5 consolida/estende este
 * handler no canónico + suite de parity cross-provider — a 8.2 só os fixtures
 * de executor necessários aos seus próprios testes de streaming/reagregação.
 *
 * Story 8.5 (ADR-10 S5) — ESTENDIDO com o caminho **não-streaming** (classifier):
 * quando `body.stream !== true`, devolve um `ChatCompletion` JSON
 * (`{choices:[{message:{content:'<json>'}}], usage}`) com `prompt_tokens`/
 * `completion_tokens` (nomes OpenAI), discriminado pelas magic strings
 * `MOCK_OPENAI_CLASSIFIER_*`. Consolida no handler canónico o que a 8.3 tinha
 * disperso em `server.use(...)` local (D-8.5-HANDLER-EXTEND). Os 5 fixtures SSE
 * streaming da 8.2 ficam **byte-a-byte intactos** (AC6 — zero regressão).
 */

interface OpenAIRequestBody {
  model: string;
  stream?: boolean;
  stream_options?: { include_usage?: boolean };
  messages: Array<{ role: string; content: string | null }>;
  tools?: Array<{ type: string; function: { name: string } }>;
  max_completion_tokens?: number;
}

type Choice = {
  index: number;
  delta: {
    role?: string;
    content?: string | null;
    tool_calls?: Array<{
      index: number;
      id?: string;
      type?: 'function';
      function?: { name?: string; arguments?: string };
    }>;
  };
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
};

/** Envelope comum de um `ChatCompletionChunk` (campos estáveis por chunk). */
function chunk(model: string, choices: Choice[]): Record<string, unknown> {
  return {
    id: 'chatcmpl_mock_8_2',
    object: 'chat.completion.chunk',
    created: 1700000000,
    model,
    choices,
  };
}

/** Chunk final de usage — `choices:[]`, `usage` preenchido (só com include_usage). */
function usageChunk(
  model: string,
  promptTokens: number,
  completionTokens: number
): Record<string, unknown> {
  return {
    id: 'chatcmpl_mock_8_2',
    object: 'chat.completion.chunk',
    created: 1700000000,
    model,
    choices: [],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    },
  };
}

/**
 * Uma fixture = os chunks de conteúdo (SEM usage) + os tokens de usage. O
 * handler anexa o `usageChunk` SÓ quando o request pediu
 * `stream_options.include_usage` (CR Iter 1 minor — `mock-protocol-fidelity.md`:
 * sem `include_usage`, a OpenAI real não emite o chunk de usage).
 */
interface Fixture {
  chunks: Array<Record<string, unknown>>;
  promptTokens: number;
  completionTokens: number;
}

/**
 * Serializa a fixture num SSE stream OpenAI. Cada chunk é `data: {json}\n\n`; o
 * chunk de usage é anexado só se `includeUsage`; termina com `data: [DONE]\n\n`.
 */
function buildOpenAiSseStream(
  model: string,
  fixture: Fixture,
  includeUsage: boolean
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const all = [...fixture.chunks];
  if (includeUsage) {
    all.push(usageChunk(model, fixture.promptTokens, fixture.completionTokens));
  }
  return new ReadableStream({
    start(controller) {
      for (const c of all) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(c)}\n\n`));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

// ── Fixtures de streaming ───────────────────────────────────────────────────

/** Text-only: `delta.content` incremental + `finish_reason:'stop'`. */
function textOnlyFixture(model: string): Fixture {
  return {
    chunks: [
      chunk(model, [
        { index: 0, delta: { role: 'assistant', content: '' }, finish_reason: null },
      ]),
      chunk(model, [{ index: 0, delta: { content: 'Olá ' }, finish_reason: null }]),
      chunk(model, [{ index: 0, delta: { content: 'mundo' }, finish_reason: null }]),
      chunk(model, [{ index: 0, delta: {}, finish_reason: 'stop' }]),
    ],
    promptTokens: 12,
    completionTokens: 7,
  };
}

/**
 * 1 tool com `arguments` FRAGMENTADOS em 2 deltas (`mock-protocol-fidelity.md`).
 * Args canónico: `{"titulo":"Comprar pão"}` partido pelo meio — cada fragmento
 * isolado é JSON inválido, logo o teste falsificável (C3) falharia se o parser
 * parseasse cada delta ou se o mock entregasse os args completos num só delta.
 */
function oneToolFixture(model: string): Fixture {
  return {
    chunks: [
      chunk(model, [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_tool_01',
                type: 'function',
                function: { name: 'criar_tarefa', arguments: '' },
              },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk(model, [
        {
          index: 0,
          delta: { tool_calls: [{ index: 0, function: { arguments: '{"titulo":"Comp' } }] },
          finish_reason: null,
        },
      ]),
      chunk(model, [
        {
          index: 0,
          delta: { tool_calls: [{ index: 0, function: { arguments: 'rar pão"}' } }] },
          finish_reason: null,
        },
      ]),
      chunk(model, [{ index: 0, delta: {}, finish_reason: 'tool_calls' }]),
    ],
    promptTokens: 30,
    completionTokens: 15,
  };
}

/**
 * Multi-tool: índices 0 e 1, com fragmentos INTERCALADOS (prova que o
 * `Map<index>` não mistura fragmentos de índices diferentes — AC4/AC9).
 */
function multiToolFixture(model: string): Fixture {
  return {
    chunks: [
      chunk(model, [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_aaa',
                type: 'function',
                function: { name: 'criar_tarefa', arguments: '' },
              },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk(model, [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 1,
                id: 'call_bbb',
                type: 'function',
                function: { name: 'criar_evento_calendar', arguments: '' },
              },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk(model, [
        {
          index: 0,
          delta: { tool_calls: [{ index: 0, function: { arguments: '{"titulo":' } }] },
          finish_reason: null,
        },
      ]),
      chunk(model, [
        {
          index: 0,
          delta: { tool_calls: [{ index: 1, function: { arguments: '{"local":' } }] },
          finish_reason: null,
        },
      ]),
      chunk(model, [
        {
          index: 0,
          delta: { tool_calls: [{ index: 0, function: { arguments: '"A"}' } }] },
          finish_reason: null,
        },
      ]),
      chunk(model, [
        {
          index: 0,
          delta: { tool_calls: [{ index: 1, function: { arguments: '"B"}' } }] },
          finish_reason: null,
        },
      ]),
      chunk(model, [{ index: 0, delta: {}, finish_reason: 'tool_calls' }]),
    ],
    promptTokens: 40,
    completionTokens: 22,
  };
}

/**
 * Args malformados: `argsAccumulator` final = `{"titulo":NOT_VALID_JSON` (não-JSON).
 * Fragmentado em 2 deltas → `JSON.parse` lança no boundary → `error` event.
 */
function malformedToolFixture(model: string): Fixture {
  return {
    chunks: [
      chunk(model, [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_malformed_01',
                type: 'function',
                function: { name: 'criar_tarefa', arguments: '' },
              },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk(model, [
        {
          index: 0,
          delta: { tool_calls: [{ index: 0, function: { arguments: '{"titulo":NOT_VAL' } }] },
          finish_reason: null,
        },
      ]),
      chunk(model, [
        {
          index: 0,
          delta: { tool_calls: [{ index: 0, function: { arguments: 'ID_JSON' } }] },
          finish_reason: null,
        },
      ]),
      chunk(model, [{ index: 0, delta: {}, finish_reason: 'tool_calls' }]),
    ],
    promptTokens: 20,
    completionTokens: 5,
  };
}

/** Tool sem args: `arguments` acumulado = `""` → interpretado como `{}` (AC6). */
function noArgsToolFixture(model: string): Fixture {
  return {
    chunks: [
      chunk(model, [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: 'call_noargs_01',
                type: 'function',
                function: { name: 'listar_tarefas', arguments: '' },
              },
            ],
          },
          finish_reason: null,
        },
      ]),
      chunk(model, [{ index: 0, delta: {}, finish_reason: 'tool_calls' }]),
    ],
    promptTokens: 18,
    completionTokens: 3,
  };
}

function sseResponse(stream: ReadableStream<Uint8Array>) {
  return new HttpResponse(stream, {
    headers: { 'content-type': 'text/event-stream' },
  });
}

// ── Story 8.5 — caminho NÃO-STREAMING (classifier) ──────────────────────────

/** Fixture do classifier non-streaming: conteúdo + tokens (nomes OpenAI). */
interface ClassifierFixture {
  content: string;
  promptTokens: number;
  completionTokens: number;
}

/**
 * Resposta `ChatCompletion` non-streaming canónica OpenAI Chat Completions —
 * `choices[0].message.content` + `usage` com `prompt_tokens`/`completion_tokens`
 * (NÃO `input_tokens`/`output_tokens`). Espelho do que a 8.3 montava local.
 */
function classifierCompletionJson(model: string, fixture: ClassifierFixture) {
  return HttpResponse.json({
    id: 'chatcmpl_clf_mock_8_5',
    object: 'chat.completion',
    created: 1700000000,
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: fixture.content },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: fixture.promptTokens,
      completion_tokens: fixture.completionTokens,
      total_tokens: fixture.promptTokens + fixture.completionTokens,
    },
  });
}

/**
 * Selecciona a fixture do classifier non-streaming pela magic string na última
 * mensagem `user`. O `MOCK_OPENAI_CLASSIFIER_MULTI_INTENT` devolve **os mesmos
 * `intents`/`confidence`** que o lado Anthropic (`MOCK_CLASSIFIER_MULTI_INTENT`
 * em `handlers/anthropic.ts` → `['calendar','finance']`/`{calendar:0.95,
 * finance:0.93}`), para a parity C6 ser semanticamente significativa (rec. @po).
 * Os `tokens` são propositadamente DISTINTOS dos Anthropic (80/40) — a parity
 * NÃO compara tokens entre providers, só shape e `intents`/`confidence`.
 */
function classifierFixtureFor(userText: string): ClassifierFixture {
  if (userText.includes('MOCK_OPENAI_CLASSIFIER_MULTI_INTENT')) {
    return {
      content: JSON.stringify({
        intents: ['calendar', 'finance'],
        confidence: { calendar: 0.95, finance: 0.93 },
      }),
      promptTokens: 64,
      completionTokens: 28,
    };
  }
  if (userText.includes('MOCK_OPENAI_CLASSIFIER_SINGLE')) {
    return {
      content: JSON.stringify({ intents: ['tasks'], confidence: { tasks: 0.9 } }),
      promptTokens: 40,
      completionTokens: 12,
    };
  }
  if (userText.includes('MOCK_OPENAI_CLASSIFIER_MALFORMED')) {
    // Conteúdo não-JSON (defensivo — mesmo com response_format:json_object).
    return {
      content: 'isto não é JSON de todo — texto livre do modelo',
      promptTokens: 10,
      completionTokens: 6,
    };
  }
  // Fallback: single-intent válido (paridade com o fallback Anthropic).
  return {
    content: JSON.stringify({ intents: ['tasks'], confidence: { tasks: 0.88 } }),
    promptTokens: 80,
    completionTokens: 40,
  };
}

export const openaiHandlers = [
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = (await request.json()) as OpenAIRequestBody;
    const model = body.model;
    const includeUsage = body.stream_options?.include_usage === true;

    // Última mensagem `user` decide a fixture (magic string no conteúdo).
    const userMsgs = body.messages.filter((m) => m.role === 'user');
    const last = userMsgs[userMsgs.length - 1];
    const userText = typeof last?.content === 'string' ? last.content : '';

    // ── Story 8.5 — caminho NÃO-STREAMING (classifier) ───────────────────────
    // O `OpenAIClassifier`/`OpenAIInferenceTransport.classify` chama
    // chat.completions SEM `stream:true`. Discriminar ANTES das fixtures SSE
    // (que assumem streaming). Os testes da 8.3 que registam um handler local
    // via `server.use(...)` continuam a ter precedência sobre este global.
    if (body.stream !== true) {
      return classifierCompletionJson(model, classifierFixtureFor(userText));
    }

    let fixture: Fixture;
    if (userText.includes('MOCK_OPENAI_MULTITOOL')) {
      fixture = multiToolFixture(model);
    } else if (userText.includes('MOCK_OPENAI_MALFORMED')) {
      fixture = malformedToolFixture(model);
    } else if (userText.includes('MOCK_OPENAI_NOARGS')) {
      fixture = noArgsToolFixture(model);
    } else if (userText.includes('MOCK_OPENAI_TOOL')) {
      fixture = oneToolFixture(model);
    } else {
      // Fallback (inclui MOCK_OPENAI_TEXT) → text-only.
      fixture = textOnlyFixture(model);
    }

    return sseResponse(buildOpenAiSseStream(model, fixture, includeUsage));
  }),
];
