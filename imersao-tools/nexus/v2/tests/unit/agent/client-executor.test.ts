import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/client';
import { InferenceTransport } from '@/lib/agent/inference-transport';
import { runClientAgent } from '@/lib/agent/client-executor';
import { ClientConfirmationProvider } from '@/lib/agent/client-confirmation-provider';
import type { ExecutorSSEEvent } from '@/lib/agent/executor';
import {
  createMockProxyFetch,
  type ExecutorTurn,
  type ClassifierResponse,
} from '@/tests/mocks/proxy-fetch';
import type { Task } from '@/types/db';

/**
 * Nexus v2 — Client Executor integração end-to-end (Story 1.11 — ADR-9, T7)
 *
 * Exercita o FLUXO CLIENT-SIDE COMPLETO do cérebro (o fix do bug de produção):
 *   `runClientAgent(prompt, _, transport)` → `runAgent` (injectável) →
 *   classifier(transport.classify) + executor(transport.execute) →
 *   tools (`criar_tarefa`/`listar_atrasadas`) com `ctx.db` = Dexie REAL
 *   (fake-indexeddb, via `tests/setup.ts`).
 *
 * O `transport` é um `InferenceTransport` real, com o `fetch` substituído por um
 * mock do proxy (`createMockProxyFetch`) que emite o WIRE SSE REAL da Anthropic.
 * Assim o parsing SSE + reconstrução de args do transport são exercitados de
 * verdade — não há atalho de mock do executor.
 *
 * Cobre:
 * - AC3/AC5 — escrita end-to-end: "anota a tarefa de comprar pão" cria mesmo uma
 *   `Task` em `db.tasks` (zero `Cannot read properties of null`).
 * - AC6 — leitura end-to-end: "quais as atrasadas?" lê dados reais de `db.tasks`
 *   e re-injecta o `tool_result` no loop.
 * - AC9 (`mock-protocol-fidelity.md`) — teste que FALHA se o protocolo divergir
 *   (args do `tool_use` emitidos completos no `content_block_start` em vez de
 *   fragmentados em `input_json_delta`).
 *
 * NOTA: O barrel `@/lib/agent/tools` é importado pelo `client-executor.ts`
 * (side-effect que regista as tools no `toolRegistry` singleton) — não o
 * importamos aqui para não duplicar o registo.
 */

const EXECUTOR_MODEL = 'claude-sonnet-mock';

/** Args canónico de `criar_tarefa` fragmentado em 2 chunks (issue #960). */
function criarTarefaToolUse(id: string, titulo: string): ExecutorTurn['toolUses'] {
  const json = JSON.stringify({ titulo });
  const mid = Math.floor(json.length / 2);
  return [
    {
      id,
      name: 'criar_tarefa',
      // Fragmentação OBRIGATÓRIA — espelha o wire real (args nunca completos
      // no content_block_start).
      jsonChunks: [json.slice(0, mid), json.slice(mid)],
    },
  ];
}

/** Args canónico de `listar_atrasadas` fragmentado em 2 chunks. */
function listarAtrasadasToolUse(id: string): ExecutorTurn['toolUses'] {
  const json = JSON.stringify({});
  return [
    {
      id,
      name: 'listar_atrasadas',
      // `{}` é curto — fragmentamos na mesma para exercitar a concatenação.
      jsonChunks: ['{', '}'],
    },
  ];
}

const TASKS_CLASSIFIER: ClassifierResponse = {
  intents: ['tasks'],
  confidence: { tasks: 0.95 },
};

async function collect(
  prompt: string,
  transport: InferenceTransport
): Promise<ExecutorSSEEvent[]> {
  const events: ExecutorSSEEvent[] = [];
  for await (const ev of runClientAgent(prompt, undefined, transport)) {
    events.push(ev);
  }
  return events;
}

beforeEach(async () => {
  await db.tasks.clear();
  await db.projects.clear();
});

// ─────────────────────────────────────────────────────────────────────────────
// AC3 + AC5 — Escrita end-to-end (o caso exacto do bug de produção)
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.11 — escrita end-to-end client-side (AC3, AC5)', () => {
  it('cria mesmo uma Task em db.tasks ao "anotar a tarefa de comprar pão"', async () => {
    const mock = createMockProxyFetch({
      classifier: TASKS_CLASSIFIER,
      executorTurns: [
        // Turn 1 — o Sonnet pede `criar_tarefa`.
        {
          toolUses: criarTarefaToolUse('toolu_criar_01', 'comprar pão'),
          stopReason: 'tool_use',
        },
        // Turn 2 — após o tool_result, fecha com texto de confirmação.
        { text: 'Tarefa criada.', stopReason: 'end_turn' },
      ],
    });
    const transport = new InferenceTransport(mock.fetchFn);

    const events = await collect('anota a tarefa de comprar pão', transport);

    // A persistência de domínio aconteceu mesmo no Dexie real.
    const tasks = await db.tasks.toArray();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.title).toBe('comprar pão');
    expect(tasks[0]?.status).toBe('todo');

    // Zero `Cannot read properties of null` — o run terminou com sucesso e a
    // tool `criar_tarefa` completou.
    const done = events.find((e) => e.type === 'done');
    expect(done).toBeDefined();
    if (done?.type === 'done') {
      expect(done.status).toBe('success');
    }
    const toolComplete = events.find(
      (e) => e.type === 'tool_complete' && e.toolName === 'criar_tarefa'
    );
    expect(toolComplete).toBeDefined();

    // Nenhum tool_error de null-deref.
    const toolErrors = events.filter((e) => e.type === 'tool_error');
    expect(toolErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC6 — Leitura end-to-end (read tools com ctx.db real, dados re-injectados)
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.11 — leitura end-to-end client-side (AC6)', () => {
  it('lê tarefas atrasadas reais de db.tasks e re-injecta o tool_result', async () => {
    // Semear o Dexie real com 2 atrasadas + 1 futura + 1 já concluída atrasada.
    const now = Date.now();
    const ontem = new Date(now - 2 * 86_400_000).toISOString().slice(0, 10);
    const amanha = new Date(now + 2 * 86_400_000).toISOString().slice(0, 10);
    const base = (overrides: Partial<Task>): Task => ({
      id: crypto.randomUUID(),
      title: 'x',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueDate: null,
      projectId: null,
      tags: [],
      context: null,
      lastWorkedAt: null,
      recurrenceId: null,
      parentTaskId: null,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });
    await db.tasks.bulkAdd([
      base({ title: 'pagar luz', dueDate: ontem, status: 'todo' }),
      base({ title: 'entregar relatório', dueDate: ontem, status: 'in-progress' }),
      base({ title: 'futura', dueDate: amanha, status: 'todo' }),
      base({ title: 'já feita atrasada', dueDate: ontem, status: 'done' }),
    ]);

    let secondTurnSeen = false;
    const mock = createMockProxyFetch({
      classifier: TASKS_CLASSIFIER,
      executorTurns: [
        {
          toolUses: listarAtrasadasToolUse('toolu_listar_01'),
          stopReason: 'tool_use',
        },
        { text: 'Tens 2 tarefas atrasadas.', stopReason: 'end_turn' },
      ],
    });
    const transport = new InferenceTransport(mock.fetchFn);

    const events = await collect('quais as minhas tarefas atrasadas?', transport);
    void secondTurnSeen;

    // A tool de leitura completou com dados reais (2 atrasadas, exclui futura e done).
    const toolComplete = events.find(
      (e) => e.type === 'tool_complete' && e.toolName === 'listar_atrasadas'
    );
    expect(toolComplete).toBeDefined();
    if (toolComplete?.type === 'tool_complete') {
      const result = toolComplete.result as {
        total: number;
        tarefas: Array<{ titulo: string }>;
      };
      expect(result.total).toBe(2);
      const titulos = result.tarefas.map((t) => t.titulo).sort();
      expect(titulos).toEqual(['entregar relatório', 'pagar luz']);
    }

    // O loop fez 2 chamadas ao executor: a 2ª prova que o tool_result foi
    // re-injectado (o Sonnet recebeu o resultado e fechou o turno).
    expect(mock.getExecutorCallCount()).toBe(2);
    const secondRequest = mock.getRequests().filter((r) => r.stream === true)[1];
    expect(secondRequest).toBeDefined();
    const messages = secondRequest?.messages as Array<{
      role: string;
      content: unknown;
    }>;
    // A última mensagem injectada no 2º turno é o tool_result (role user com
    // content[].type === 'tool_result').
    const hasToolResult = messages.some(
      (m) =>
        m.role === 'user' &&
        Array.isArray(m.content) &&
        m.content.some(
          (b) => (b as { type?: string }).type === 'tool_result'
        )
    );
    expect(hasToolResult).toBe(true);

    const done = events.find((e) => e.type === 'done');
    expect(done?.type === 'done' && done.status).toBe('success');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC9 — Fidelidade de mock (mock-protocol-fidelity.md)
// ─────────────────────────────────────────────────────────────────────────────

describe('Story 1.11 — fidelidade do protocolo SSE Anthropic (AC9)', () => {
  /**
   * Prova que o transport reconstrói os args fragmentados em `input_json_delta`
   * (protocolo real, issue #960). Os args do `criar_tarefa` chegam partidos no
   * MEIO de uma string PT-PT com acentos ("comprar pão") — se o transport
   * regredisse para ler `input` do `content_block_start` (o bug da Story 1.2),
   * receberia `{}` e a tool falharia o Zod parse de `titulo`.
   */
  it('reconstrói args de input_json_delta fragmentado a meio de string acentuada', async () => {
    // Fragmentação hostil: corta dentro da string "pão" (entre 'pã' e 'o").
    const json = JSON.stringify({ titulo: 'comprar pão', descricao: 'urgente' });
    // Encontrar um ponto de corte dentro do valor da string.
    const cut1 = json.indexOf('comprar') + 5; // meio de "comprar"
    const cut2 = json.indexOf('urgente') + 3;
    const chunks = [json.slice(0, cut1), json.slice(cut1, cut2), json.slice(cut2)];
    expect(chunks.length).toBe(3);
    expect(chunks.join('')).toBe(json); // sanity

    const mock = createMockProxyFetch({
      classifier: TASKS_CLASSIFIER,
      executorTurns: [
        {
          toolUses: [
            { id: 'toolu_frag_01', name: 'criar_tarefa', jsonChunks: chunks },
          ],
          stopReason: 'tool_use',
        },
        { text: 'OK.', stopReason: 'end_turn' },
      ],
    });
    const transport = new InferenceTransport(mock.fetchFn);

    await db.tasks.clear();
    const events = await collect('cria tarefa comprar pão urgente', transport);

    const tasks = await db.tasks.toArray();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.title).toBe('comprar pão');
    expect(tasks[0]?.description).toBe('urgente');

    const toolComplete = events.find(
      (e) => e.type === 'tool_complete' && e.toolName === 'criar_tarefa'
    );
    expect(toolComplete).toBeDefined();
  });

  /**
   * Teste de FALHA-POR-DESIGN do mock-protocol-fidelity: prova directamente, no
   * nível do `InferenceTransport.execute`, que o `tool_use` emitido carrega os
   * args reconstruídos do `input_json_delta` — e NÃO o `input` (vazio) do
   * `content_block_start`. Se o transport (ou um mock futuro) emitisse os args
   * no `content_block_start`, o `input` reconstruído seria `{}` e este teste
   * FALHARIA. É a guarda explícita exigida pela obrigação 3 da regra.
   */
  it('o tool_use emitido pelo transport tem input dos deltas, não o input vazio do start', async () => {
    const mock = createMockProxyFetch({
      classifier: TASKS_CLASSIFIER,
      executorTurns: [
        {
          toolUses: [
            {
              id: 'toolu_proof_01',
              name: 'criar_tarefa',
              jsonChunks: ['{"titulo":"reg', 'ar luz"}'],
            },
          ],
          stopReason: 'tool_use',
        },
        { text: 'fim', stopReason: 'end_turn' },
      ],
    });
    const transport = new InferenceTransport(mock.fetchFn);

    const streamEvents = [];
    for await (const ev of transport.execute(
      [{ role: 'user', content: 'cria tarefa regar luz' }],
      [],
      { runId: 'run-fidelity', model: EXECUTOR_MODEL }
    )) {
      streamEvents.push(ev);
    }

    const toolUse = streamEvents.find((e) => e.type === 'tool_use');
    expect(toolUse).toBeDefined();
    if (toolUse?.type === 'tool_use') {
      // Reconstruído dos deltas — NÃO o `{}` do content_block_start.
      expect(toolUse.input).toEqual({ titulo: 'regar luz' });
      expect(toolUse.input).not.toEqual({});
    }
  });

  /**
   * Prova que o transport propaga um erro quando o `input_json_delta`
   * acumulado é JSON inválido (chunk splitting que nunca fecha o JSON) — o
   * mock que emitisse args completos no start nunca exercitaria este caminho.
   */
  it('emite error event quando o input_json_delta acumulado é JSON inválido', async () => {
    const mock = createMockProxyFetch({
      classifier: TASKS_CLASSIFIER,
      executorTurns: [
        {
          toolUses: [
            {
              id: 'toolu_bad_01',
              name: 'criar_tarefa',
              jsonChunks: ['{"titulo":NOT_', 'VALID'],
            },
          ],
          stopReason: 'tool_use',
        },
      ],
    });
    const transport = new InferenceTransport(mock.fetchFn);

    const seen: string[] = [];
    let threw = false;
    try {
      for await (const ev of transport.execute(
        [{ role: 'user', content: 'x' }],
        [],
        { runId: 'run-bad', model: EXECUTOR_MODEL }
      )) {
        seen.push(ev.type);
      }
    } catch {
      threw = true;
    }

    expect(seen).toContain('error');
    expect(threw).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// AC7 — Confirmação in-process no fluxo end-to-end (ClientConfirmationProvider)
// ─────────────────────────────────────────────────────────────────────────────

/** Classifier que activa o gate de preview por confidence baixa (< 0.7). */
const LOW_CONFIDENCE_CLASSIFIER: ClassifierResponse = {
  intents: ['tasks'],
  confidence: { tasks: 0.5 },
};

/**
 * Subclasse de teste que captura os pares `(runId, toolName)` à medida que o
 * executor chama `requestConfirmation`, e expõe `resolvePending(action)` para
 * simular o clique da UI de forma assíncrona.
 *
 * Necessário porque o `runAgent` acumula os eventos de uma tool e só os yielda
 * DEPOIS de a Promise de confirmação resolver — logo resolver "dentro do
 * for await" ao ver o `preview_request` faria deadlock (o consumidor espera o
 * evento, o executor espera a resolução). A UI real resolve a partir de um
 * contexto independente (um onClick), que é o que este auto-responder simula.
 */
class CapturingConfirmationProvider extends ClientConfirmationProvider {
  private readonly captured: Array<{ runId: string; toolName: string }> = [];

  requestConfirmation(runId: string, toolName: string): Promise<'confirm' | 'cancel'> {
    this.captured.push({ runId, toolName });
    return super.requestConfirmation(runId, toolName);
  }

  /** Resolve o pedido pendente mais antigo capturado. */
  resolvePending(action: 'confirm' | 'cancel'): boolean {
    const next = this.captured.shift();
    if (!next) return false;
    return this.resolve(next.runId, next.toolName, action);
  }
}

/**
 * Conduz `runClientAgent` num contexto, e em paralelo faz poll a resolver os
 * pedidos de confirmação assim que o executor os cria — simulando a UI a
 * responder de forma assíncrona (evita o deadlock do resolver-no-for-await).
 */
async function collectWithConfirmation(
  prompt: string,
  transport: InferenceTransport,
  provider: CapturingConfirmationProvider,
  action: 'confirm' | 'cancel'
): Promise<ExecutorSSEEvent[]> {
  let running = true;
  const responder = (async () => {
    while (running) {
      if (provider.pendingCount > 0) {
        provider.resolvePending(action);
      }
      await new Promise((r) => setTimeout(r, 1));
    }
  })();

  const events: ExecutorSSEEvent[] = [];
  try {
    for await (const ev of runClientAgent(prompt, provider, transport)) {
      events.push(ev);
    }
  } finally {
    running = false;
    await responder;
  }
  return events;
}

describe('Story 1.11 — confirmação in-process end-to-end (AC7)', () => {
  it('aguarda confirmação e aplica a tool quando o utilizador confirma', async () => {
    const mock = createMockProxyFetch({
      classifier: LOW_CONFIDENCE_CLASSIFIER,
      executorTurns: [
        {
          toolUses: criarTarefaToolUse('toolu_gate_01', 'comprar pão'),
          stopReason: 'tool_use',
        },
        { text: 'Tarefa criada.', stopReason: 'end_turn' },
      ],
    });
    const transport = new InferenceTransport(mock.fetchFn);
    const provider = new CapturingConfirmationProvider();

    const events = await collectWithConfirmation(
      'anota a tarefa de comprar pão',
      transport,
      provider,
      'confirm'
    );

    // O gate foi exercitado: preview_request + preview_confirmed(confirm).
    const previewReq = events.find((e) => e.type === 'preview_request');
    expect(previewReq).toBeDefined();
    const previewConfirmed = events.find((e) => e.type === 'preview_confirmed');
    expect(previewConfirmed?.type === 'preview_confirmed' && previewConfirmed.action).toBe('confirm');

    // A tool aplicou-se de facto no Dexie real.
    const tasks = await db.tasks.toArray();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.title).toBe('comprar pão');
    expect(provider.pendingCount).toBe(0);
  });

  it('NÃO aplica a tool quando o utilizador cancela', async () => {
    const mock = createMockProxyFetch({
      classifier: LOW_CONFIDENCE_CLASSIFIER,
      executorTurns: [
        {
          toolUses: criarTarefaToolUse('toolu_gate_02', 'comprar pão'),
          stopReason: 'tool_use',
        },
        { text: 'Cancelado.', stopReason: 'end_turn' },
      ],
    });
    const transport = new InferenceTransport(mock.fetchFn);
    const provider = new CapturingConfirmationProvider();

    const events = await collectWithConfirmation(
      'anota a tarefa de comprar pão',
      transport,
      provider,
      'cancel'
    );

    const previewConfirmed = events.find((e) => e.type === 'preview_confirmed');
    expect(previewConfirmed?.type === 'preview_confirmed' && previewConfirmed.action).toBe('cancel');

    // Nenhuma Task criada — o cancelamento impediu a escrita.
    const tasks = await db.tasks.toArray();
    expect(tasks).toHaveLength(0);
    expect(provider.pendingCount).toBe(0);
  });
});
