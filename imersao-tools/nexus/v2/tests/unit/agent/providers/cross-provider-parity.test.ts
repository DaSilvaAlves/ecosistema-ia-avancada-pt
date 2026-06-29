import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';
import { z } from 'zod';
import { http, HttpResponse } from 'msw';
import { server } from '@/tests/mocks/server';
import { AnthropicExecutor, AnthropicClassifier } from '@/lib/agent/providers/anthropic';
import { OpenAIExecutor, OpenAIClassifier } from '@/lib/agent/providers/openai';
import { OpenAIInferenceTransport } from '@/lib/agent/providers/openai-inference-transport';
import { createMockOpenAIProxyFetch } from '@/tests/mocks/proxy-fetch-openai';
import type {
  LLMMessage,
  LLMStreamEvent,
  ToolDefinition,
} from '@/lib/agent/providers/types';

/**
 * Nexus v2 — Suite de parity cross-provider (Story 8.5 / ADR-10 S5 §6.3)
 *
 * Afirma que os `LLMStreamEvent`/`ClassificationResult` emitidos pelo caminho
 * OpenAI são **semanticamente idênticos** aos do caminho Anthropic nos 6
 * cenários canónicos do ADR-10 §6.3, antes do cutover em produção (8.6).
 *
 * Estrutura (parametrizada, NÃO duplicada):
 * - C1-C5 (executor): `OpenAIExecutor` vs `AnthropicExecutor` via MSW handlers
 *   globais (`handlers/openai.ts` / `handlers/anthropic.ts`). Um único corpo
 *   `it.each` itera os cenários.
 * - C6 (classifier): `OpenAIClassifier` vs `AnthropicClassifier` via MSW.
 * - AC5 (falsificável): `OpenAIInferenceTransport` + `proxy-fetch-openai.ts` —
 *   prova que o acumulador `Map<index>` é exercido por args fragmentados em ≥2
 *   deltas (falharia com delta único — `mock-protocol-fidelity.md`).
 *
 * DEV-DECISION D-8.5-PARITY-CANON — invariância ao provider:
 *   O `id` de um tool call é fornecido pelo provider e é **necessariamente
 *   distinto** entre wires (`toolu_...` Anthropic vs `call_...` OpenAI; ADR-10
 *   §4.3 — preservado verbatim DENTRO de cada provider, não entre providers).
 *   Logo a parity NÃO compara `id` literal entre providers — afirma que ambos
 *   preservam um `id` não-vazio. Os tokens (`inputTokens`/`outputTokens`) também
 *   diferem por provider (mocks distintos) e NÃO são comparados (ADR-10 §6.3).
 *   O que é invariante e afirmado: a sequência de `type`s, o texto concatenado,
 *   o `name`+`input` da tool (quando os mocks codificam a mesma resposta lógica)
 *   e — para multi-tool — a NÃO-MISTURA de índices (`internal-state-contract-gate`).
 */

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ANT_KEY = 'sk-ant-mock-test-key-1234567890';
const OAI_KEY = 'sk-openai-mock-test-key-1234567890';
const OPTS = { runId: '11111111-2222-3333-4444-555555555555' };

const sampleTool: ToolDefinition = {
  name: 'criar_tarefa',
  description: 'Cria uma nova tarefa na lista do utilizador',
  domain: 'tasks',
  argsSchema: z.object({
    titulo: z.string().min(1),
    prazo: z.string().optional(),
  }),
  resultSchema: z.object({ id: z.string() }),
  requiresPreview: false,
  reversible: true,
  execute: vi.fn().mockResolvedValue({ id: 'mock-id' }),
};

// ── Helpers de recolha + normalização canónica ──────────────────────────────

async function collect(
  iter: AsyncIterable<LLMStreamEvent>
): Promise<LLMStreamEvent[]> {
  const events: LLMStreamEvent[] = [];
  for await (const e of iter) events.push(e);
  return events;
}

/** Recolha tolerante a throw (cenário de erro C4 lança após emitir `error`). */
async function collectSafe(
  iter: AsyncIterable<LLMStreamEvent>
): Promise<{ events: LLMStreamEvent[]; threw: boolean }> {
  const events: LLMStreamEvent[] = [];
  let threw = false;
  try {
    for await (const e of iter) events.push(e);
  } catch {
    threw = true;
  }
  return { events, threw };
}

interface CanonTool {
  id: string;
  name: string;
  input: unknown;
}

interface Canon {
  text: string;
  tools: CanonTool[];
  toolCount: number;
  toolIds: string[];
  types: string[];
  hasError: boolean;
  hasDone: boolean;
  threw: boolean;
}

/** Normaliza um stream de `LLMStreamEvent` numa forma comparável entre providers. */
function canon(events: LLMStreamEvent[], threw = false): Canon {
  const text = events
    .filter((e) => e.type === 'text_delta')
    .map((e) => (e.type === 'text_delta' ? e.text : ''))
    .join('');
  const tools = events.flatMap((e) =>
    e.type === 'tool_use' ? [{ id: e.id, name: e.name, input: e.input }] : []
  );
  return {
    text,
    tools,
    toolCount: tools.length,
    toolIds: tools.map((t) => t.id),
    types: events.map((e) => e.type),
    hasError: events.some((e) => e.type === 'error'),
    hasDone: events.some((e) => e.type === 'done'),
    threw,
  };
}

// ── C1-C5 — Parity executor (parametrizada) ─────────────────────────────────

interface ExecutorScenario {
  id: string;
  label: string;
  tools: ToolDefinition[];
  openaiUser: string;
  anthropicUser: string;
  /** Override MSW opcional (ex: C5 não tem fixture no-args global Anthropic). */
  setup?: () => void;
  assert: (o: Canon, a: Canon) => void;
}

/** SSE Anthropic com 1 tool_use SEM `input_json_delta` → acumulador vazio → {}. */
function anthropicNoArgsSse(model: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const events = [
    {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: {
          id: 'msg_noargs',
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 18, output_tokens: 0 },
        },
      },
    },
    {
      event: 'content_block_start',
      data: {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'tool_use', id: 'toolu_noargs_01', name: 'listar_tarefas', input: {} },
      },
    },
    { event: 'content_block_stop', data: { type: 'content_block_stop', index: 0 } },
    {
      event: 'message_delta',
      data: {
        type: 'message_delta',
        delta: { stop_reason: 'tool_use', stop_sequence: null },
        usage: { output_tokens: 3 },
      },
    },
    { event: 'message_stop', data: { type: 'message_stop' } },
  ];
  return new ReadableStream({
    start(c) {
      for (const e of events) {
        c.enqueue(enc.encode(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`));
      }
      c.close();
    },
  });
}

/**
 * SSE OpenAI com 2 tool calls (índices 0/1) e fragmentos de `arguments`
 * **INTERCALADOS** entre índices — codifica a MESMA resposta lógica que
 * `anthropicMultiToolSse` (mesmos `name`+`input`; ids provider-specific). A
 * intercalação é o que prova a não-mistura: se o `Map<index>` cruzasse
 * fragmentos, o `input` sairia trocado/inválido e a parity de valor falharia.
 *   T0: criar_tarefa {titulo:'A'}   T1: criar_evento_calendar {cidade:'B'}
 */
function openaiMultiToolSse(model: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const chunk = (choices: unknown[]): string =>
    `data: ${JSON.stringify({
      id: 'chatcmpl_parity_c3',
      object: 'chat.completion.chunk',
      created: 1700000000,
      model,
      choices,
    })}\n\n`;
  const parts = [
    chunk([
      {
        index: 0,
        delta: {
          tool_calls: [
            { index: 0, id: 'call_a', type: 'function', function: { name: 'criar_tarefa', arguments: '' } },
          ],
        },
        finish_reason: null,
      },
    ]),
    chunk([
      {
        index: 0,
        delta: {
          tool_calls: [
            { index: 1, id: 'call_b', type: 'function', function: { name: 'criar_evento_calendar', arguments: '' } },
          ],
        },
        finish_reason: null,
      },
    ]),
    chunk([{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '{"titulo":' } }] }, finish_reason: null }]),
    chunk([{ index: 0, delta: { tool_calls: [{ index: 1, function: { arguments: '{"cidade":' } }] }, finish_reason: null }]),
    chunk([{ index: 0, delta: { tool_calls: [{ index: 0, function: { arguments: '"A"}' } }] }, finish_reason: null }]),
    chunk([{ index: 0, delta: { tool_calls: [{ index: 1, function: { arguments: '"B"}' } }] }, finish_reason: null }]),
    chunk([{ index: 0, delta: {}, finish_reason: 'tool_calls' }]),
  ];
  return new ReadableStream({
    start(c) {
      for (const p of parts) c.enqueue(enc.encode(p));
      c.enqueue(enc.encode('data: [DONE]\n\n'));
      c.close();
    },
  });
}

/** SSE Anthropic com os 2 mesmos tool calls lógicos de `openaiMultiToolSse`. */
function anthropicMultiToolSse(model: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  const events = [
    {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: {
          id: 'msg_parity_c3',
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 40, output_tokens: 0 },
        },
      },
    },
    {
      event: 'content_block_start',
      data: {
        type: 'content_block_start',
        index: 0,
        content_block: { type: 'tool_use', id: 'toolu_a', name: 'criar_tarefa', input: {} },
      },
    },
    { event: 'content_block_delta', data: { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"titulo":' } } },
    { event: 'content_block_delta', data: { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '"A"}' } } },
    { event: 'content_block_stop', data: { type: 'content_block_stop', index: 0 } },
    {
      event: 'content_block_start',
      data: {
        type: 'content_block_start',
        index: 1,
        content_block: { type: 'tool_use', id: 'toolu_b', name: 'criar_evento_calendar', input: {} },
      },
    },
    { event: 'content_block_delta', data: { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '{"cidade":' } } },
    { event: 'content_block_delta', data: { type: 'content_block_delta', index: 1, delta: { type: 'input_json_delta', partial_json: '"B"}' } } },
    { event: 'content_block_stop', data: { type: 'content_block_stop', index: 1 } },
    {
      event: 'message_delta',
      data: { type: 'message_delta', delta: { stop_reason: 'tool_use', stop_sequence: null }, usage: { output_tokens: 22 } },
    },
    { event: 'message_stop', data: { type: 'message_stop' } },
  ];
  return new ReadableStream({
    start(c) {
      for (const e of events) {
        c.enqueue(enc.encode(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`));
      }
      c.close();
    },
  });
}

/** Tool no-args real (alinhada com o cenário C5 — não exige `titulo`). */
const listarTarefasTool: ToolDefinition = {
  name: 'listar_tarefas',
  description: 'Lista as tarefas do utilizador',
  domain: 'tasks',
  argsSchema: z.object({ filtro: z.string().optional() }),
  resultSchema: z.object({ total: z.number() }),
  requiresPreview: false,
  reversible: false,
  execute: vi.fn().mockResolvedValue({ total: 0 }),
};

/** {name,input} canónico de cada tool, ordenado por name (comparável entre providers). */
function toolShapes(c: Canon): Array<{ name: string; input: unknown }> {
  return c.tools
    .map((t) => ({ name: t.name, input: t.input }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const EXECUTOR_SCENARIOS: ExecutorScenario[] = [
  {
    id: 'C1',
    label: 'só texto',
    tools: [],
    openaiUser: 'MOCK_OPENAI_TEXT diz olá',
    anthropicUser: 'responde só com uma saudação curta',
    assert: (o, a) => {
      // Texto concatenado idêntico ("Olá mundo") + sequência [text..., done].
      expect(o.text).toBe('Olá mundo');
      expect(o.text).toBe(a.text);
      expect(o.toolCount).toBe(0);
      expect(a.toolCount).toBe(0);
      expect(o.hasDone).toBe(true);
      expect(a.hasDone).toBe(true);
      expect(o.hasError).toBe(false);
      expect(a.hasError).toBe(false);
    },
  },
  {
    id: 'C2',
    label: '1 tool call simples',
    tools: [sampleTool],
    openaiUser: 'MOCK_OPENAI_TOOL lembra-me de comprar pão',
    anthropicUser: 'lembra-me de comprar pão',
    assert: (o, a) => {
      // name + input idênticos (mesma resposta lógica); id não-vazio em ambos.
      expect(o.toolCount).toBe(1);
      expect(a.toolCount).toBe(1);
      expect(o.tools[0]?.name).toBe('criar_tarefa');
      expect(o.tools[0]?.name).toBe(a.tools[0]?.name);
      expect(o.tools[0]?.input).toEqual({ titulo: 'Comprar pão' });
      expect(o.tools[0]?.input).toEqual(a.tools[0]?.input);
      expect((o.tools[0]?.id ?? '').length).toBeGreaterThan(0);
      expect((a.tools[0]?.id ?? '').length).toBeGreaterThan(0);
      expect(o.hasDone).toBe(true);
      expect(a.hasDone).toBe(true);
      expect(o.hasError).toBe(false);
      expect(a.hasError).toBe(false);
    },
  },
  {
    id: 'C3',
    label: 'multi tool call (≥2 índices)',
    tools: [sampleTool],
    openaiUser: 'cria tarefa e evento (multi-tool)',
    anthropicUser: 'cria tarefa e evento (multi-tool)',
    // Fixtures emparelhadas (mesma resposta lógica, ids provider-specific) para
    // uma parity de VALOR genuína (CR thread 3 Major). Os fragmentos OpenAI são
    // INTERCALADOS entre índices → se o Map<index> misturasse, os valores
    // sairiam trocados e a comparação `toEqual` falharia (não-mistura provada).
    setup: () => {
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () =>
          new HttpResponse(openaiMultiToolSse('gpt-4.1'), {
            headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
          })
        ),
        http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
          const body = (await request.json()) as { model: string };
          return new HttpResponse(anthropicMultiToolSse(body.model), {
            headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
          });
        })
      );
    },
    assert: (o, a) => {
      expect(o.toolCount).toBe(2);
      expect(a.toolCount).toBe(2);
      // Parity de VALOR: name+input idênticos por tool entre providers.
      expect(toolShapes(o)).toEqual(toolShapes(a));
      expect(toolShapes(o)).toEqual([
        { name: 'criar_evento_calendar', input: { cidade: 'B' } },
        { name: 'criar_tarefa', input: { titulo: 'A' } },
      ]);
      // Não-mistura (internal-state-contract-gate): 2 ids DISTINTOS não-vazios
      // em cada provider — o Map<index>/multi-block não cruza índices.
      expect(new Set(o.toolIds).size).toBe(2);
      expect(new Set(a.toolIds).size).toBe(2);
      expect(o.toolIds.every((id) => id.length > 0)).toBe(true);
      expect(a.toolIds.every((id) => id.length > 0)).toBe(true);
      expect(o.hasDone).toBe(true);
      expect(a.hasDone).toBe(true);
    },
  },
  {
    id: 'C4',
    label: 'args malformados → error',
    tools: [sampleTool],
    openaiUser: 'MOCK_OPENAI_MALFORMED tool partida',
    anthropicUser: 'MOCK_EXECUTOR_PROVIDER_ERROR tool partida',
    assert: (o, a) => {
      // Ambos emitem ≥1 `error` event e re-throw; nenhum `done`; nenhum tool_use.
      expect(o.threw).toBe(true);
      expect(a.threw).toBe(true);
      expect(o.hasError).toBe(true);
      expect(a.hasError).toBe(true);
      expect(o.hasDone).toBe(false);
      expect(a.hasDone).toBe(false);
      expect(o.toolCount).toBe(0);
      expect(a.toolCount).toBe(0);
    },
  },
  {
    id: 'C5',
    label: 'tool sem args → {}',
    // Tool no-args REAL (`listar_tarefas`, não exige `titulo`) — alinhada com o
    // `name` emitido por ambos os mocks (CR thread 4 Major).
    tools: [listarTarefasTool],
    openaiUser: 'MOCK_OPENAI_NOARGS lista tarefas',
    anthropicUser: 'lista as minhas tarefas sem argumentos',
    setup: () => {
      // Anthropic não tem fixture no-args global → override local (não toca
      // ficheiros de fixtures; padrão idiomático já usado na 8.2/8.3).
      server.use(
        http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
          const body = (await request.json()) as { model: string };
          return new HttpResponse(anthropicNoArgsSse(body.model), {
            headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' },
          });
        })
      );
    },
    assert: (o, a) => {
      expect(o.toolCount).toBe(1);
      expect(a.toolCount).toBe(1);
      // Parity de VALOR: mesmo `name` emitido + `input` vazio `{}` em ambos.
      expect(o.tools[0]?.name).toBe('listar_tarefas');
      expect(o.tools[0]?.name).toBe(a.tools[0]?.name);
      expect(o.tools[0]?.input).toEqual({});
      expect(a.tools[0]?.input).toEqual({});
      expect(o.tools[0]?.input).toEqual(a.tools[0]?.input);
      expect((o.tools[0]?.id ?? '').length).toBeGreaterThan(0);
      expect((a.tools[0]?.id ?? '').length).toBeGreaterThan(0);
      expect(o.hasDone).toBe(true);
      expect(a.hasDone).toBe(true);
    },
  },
];

describe('Parity executor cross-provider (AC3 — C1-C5, ADR-10 §6.3)', () => {
  it.each(EXECUTOR_SCENARIOS)(
    '$id $label — LLMStreamEvent OpenAI↔Anthropic',
    async (sc) => {
      sc.setup?.();

      const openaiExecutor = new OpenAIExecutor(OAI_KEY);
      const anthropicExecutor = new AnthropicExecutor(ANT_KEY);

      const oMsgs: LLMMessage[] = [{ role: 'user', content: sc.openaiUser }];
      const aMsgs: LLMMessage[] = [{ role: 'user', content: sc.anthropicUser }];

      const o = await collectSafe(openaiExecutor.execute(oMsgs, sc.tools, OPTS));
      const a = await collectSafe(anthropicExecutor.execute(aMsgs, sc.tools, OPTS));

      sc.assert(canon(o.events, o.threw), canon(a.events, a.threw));
    }
  );
});

// ── C6 — Parity classifier ──────────────────────────────────────────────────

describe('Parity classifier cross-provider (AC4 — C6, ADR-10 §6.3)', () => {
  it('C6 multi-intent — ClassificationResult estruturalmente idêntico Anthropic↔OpenAI', async () => {
    const anthropicClassifier = new AnthropicClassifier(ANT_KEY);
    const openaiClassifier = new OpenAIClassifier(OAI_KEY);

    // Anthropic discrimina por `system` (MOCK_CLASSIFIER_MULTI_INTENT);
    // OpenAI por magic string na última `user` (MOCK_OPENAI_CLASSIFIER_MULTI_INTENT).
    // Ambos os mocks devolvem os MESMOS intents/confidence (rec. @po) — só os
    // tokens diferem (NÃO comparados).
    const aRes = await anthropicClassifier.classify(
      'MOCK_CLASSIFIER_MULTI_INTENT — system classifier PT-PT',
      'marca reunião amanhã e regista a despesa de hoje'
    );
    const oRes = await openaiClassifier.classify(
      'system classifier PT-PT',
      'MOCK_OPENAI_CLASSIFIER_MULTI_INTENT marca reunião amanhã e regista a despesa de hoje'
    );

    expect(oRes.intents.length).toBeGreaterThanOrEqual(2);
    expect(oRes.intents).toEqual(aRes.intents);
    expect(oRes.confidence).toEqual(aRes.confidence);
    // Cada intent tem um score numérico per-intent em ambos.
    for (const intent of oRes.intents) {
      expect(typeof oRes.confidence[intent]).toBe('number');
      expect(typeof aRes.confidence[intent]).toBe('number');
    }
    // Tokens presentes e válidos, MAS NÃO comparados entre providers (mocks
    // distintos: OpenAI 64/28 vs Anthropic 80/40).
    expect(oRes.inputTokens).toBeGreaterThanOrEqual(0);
    expect(oRes.outputTokens).toBeGreaterThanOrEqual(0);
    expect(aRes.inputTokens).toBeGreaterThanOrEqual(0);
    expect(aRes.outputTokens).toBeGreaterThanOrEqual(0);
    expect(oRes.rawResponse.length).toBeGreaterThan(0);
    expect(aRes.rawResponse.length).toBeGreaterThan(0);
  });

  it('C6b — classifier malformed: ambos os providers fail-loud com Error PT-PT', async () => {
    // Exercita o branch `MOCK_OPENAI_CLASSIFIER_MALFORMED` do handler estendido
    // (conteúdo não-JSON, defensivo mesmo com response_format:json_object) e o
    // equivalente Anthropic `MOCK_CLASSIFIER_NOT_JSON` — paridade de fail-loud.
    const openaiClassifier = new OpenAIClassifier(OAI_KEY);
    const anthropicClassifier = new AnthropicClassifier(ANT_KEY);

    await expect(
      openaiClassifier.classify('system', 'MOCK_OPENAI_CLASSIFIER_MALFORMED qualquer')
    ).rejects.toThrow(/não é JSON válido/);
    await expect(
      anthropicClassifier.classify('MOCK_CLASSIFIER_NOT_JSON — system', 'qualquer prompt')
    ).rejects.toThrow(/não é JSON válido/);
  });
});

// ── AC5 — Teste falsificável de fragmentação ────────────────────────────────

describe('AC5 — teste falsificável de fragmentação (mock-protocol-fidelity)', () => {
  it('FALSIFICÁVEL: reagrega arguments fragmentados em ≥2 deltas num input completo', async () => {
    // FALSIFICÁVEL: a fixture parte {"titulo":"Comprar pão"} em 2 deltas
    // ('{"titulo":"Comp' / 'rar pão"}') — cada fragmento isolado é JSON inválido.
    // Este assert só passa se o acumulador Map<index> concatenou os ≥2 deltas e
    // parseou SÓ no boundary. FALHARIA se o mock entregasse os args completos
    // num único delta OU se o transport parseasse cada delta isoladamente.
    const { fetchFn } = createMockOpenAIProxyFetch({
      classifier: { intents: [], confidence: {} },
      executorTurns: [
        {
          toolCalls: [
            {
              index: 0,
              id: 'call_frag_01',
              name: 'criar_tarefa',
              argChunks: ['{"titulo":"Comp', 'rar pão"}'],
            },
          ],
          finishReason: 'tool_calls',
        },
      ],
    });
    const transport = new OpenAIInferenceTransport(fetchFn);
    const events = await collect(
      transport.execute([{ role: 'user', content: 'cria tarefa' }], [sampleTool], OPTS)
    );

    const toolUses = events.filter((e) => e.type === 'tool_use');
    expect(toolUses).toHaveLength(1);
    if (toolUses[0]?.type === 'tool_use') {
      expect(toolUses[0].input).toEqual({ titulo: 'Comprar pão' });
      expect(toolUses[0].id).toBe('call_frag_01');
    }
    expect(events.filter((e) => e.type === 'error')).toHaveLength(0);
    expect(events[events.length - 1]?.type).toBe('done');
  });

  it('guarda de fidelidade: a fixture parte os arguments em ≥2 fragmentos, nenhum válido sozinho', async () => {
    // Meta-asserção sobre o wire cru: prova que o mock NÃO entrega os args
    // completos num único delta (senão o teste acima seria trivialmente verde —
    // fidelidade falsa). Esta é a guarda directa de `mock-protocol-fidelity.md`.
    const { fetchFn } = createMockOpenAIProxyFetch({
      classifier: { intents: [], confidence: {} },
      executorTurns: [
        {
          toolCalls: [
            {
              index: 0,
              id: 'call_x',
              name: 'criar_tarefa',
              argChunks: ['{"titulo":"Comp', 'rar pão"}'],
            },
          ],
          finishReason: 'tool_calls',
        },
      ],
    });

    const res = await fetchFn('/api/openai/proxy', {
      method: 'POST',
      body: JSON.stringify({
        stream: true,
        stream_options: { include_usage: true },
        model: 'gpt-4.1',
        messages: [],
      }),
    });
    const raw = await res.text();

    const argFragments: string[] = [];
    for (const line of raw.split('\n')) {
      if (!line.startsWith('data: ') || line.includes('[DONE]')) continue;
      const json = JSON.parse(line.slice(6)) as {
        choices?: Array<{
          delta?: { tool_calls?: Array<{ function?: { arguments?: string } }> };
        }>;
      };
      const frag = json.choices?.[0]?.delta?.tool_calls?.[0]?.function?.arguments;
      if (frag) argFragments.push(frag);
    }

    expect(argFragments.length).toBeGreaterThanOrEqual(2);
    // Cada fragmento isolado é JSON inválido — prova a fragmentação genuína.
    for (const frag of argFragments) {
      expect(() => JSON.parse(frag)).toThrow();
    }
    // A concatenação é o JSON canónico completo.
    expect(argFragments.join('')).toBe('{"titulo":"Comprar pão"}');
  });
});
