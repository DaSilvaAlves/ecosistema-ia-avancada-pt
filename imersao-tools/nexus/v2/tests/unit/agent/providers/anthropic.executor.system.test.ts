import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { AnthropicExecutor } from '@/lib/agent/providers/anthropic';
import { EXECUTOR_SYSTEM_PROMPT } from '@/lib/agent/prompts/executor-system';
import type { LLMMessage, LLMStreamEvent } from '@/lib/agent/providers/types';

/**
 * Nexus v2 — Hotfix 18/05/2026: executor system prompt PT-PT
 *
 * Origem: bug produção (https://imersao.ia.expressia.pt) — chatbot respondia
 * em PT-BR com tom genérico violando brandbook + language-standards. Root
 * cause: `AnthropicExecutor.execute()` em `anthropic.ts:348-353` NÃO passava
 * system prompt ao Sonnet, que defaultava para PT-BR + fallbacks genéricos.
 *
 * Estes 3 testes garantem:
 * - T1: a chamada ao SDK Anthropic inclui `system: EXECUTOR_SYSTEM_PROMPT`
 * - T2: o conteúdo do prompt contém marcadores críticos (regressão contra
 *   deleção acidental ou refactor que esvazie o string)
 * - T3: o body HTTP final que chega ao Anthropic tem `body.system` exacto
 *   (mock-protocol-fidelity — o mock espelha o protocolo real)
 *
 * Trace: handoff input `RETOMA-20260518-bug-nexus-pt-br-executor-missing-
 * system-prompt.md` secção 4 (T1+T2+T3).
 */

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const MOCK_API_KEY = 'sk-ant-mock-test-key-1234567890';

/**
 * SSE mínimo válido — message_start + 1 text_delta + content_block_stop +
 * message_delta com stop_reason + message_stop. Suficiente para o executor
 * SDK consumir sem erro.
 */
function buildMinimalSseStream(model: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const events = [
    {
      event: 'message_start',
      data: {
        type: 'message_start',
        message: {
          id: 'msg_test_executor_system',
          type: 'message',
          role: 'assistant',
          content: [],
          model,
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 10, output_tokens: 0 },
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
        delta: { type: 'text_delta', text: 'ok' },
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
        usage: { output_tokens: 2 },
      },
    },
    {
      event: 'message_stop',
      data: { type: 'message_stop' },
    },
  ];
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

async function drainEvents(iter: AsyncIterable<LLMStreamEvent>): Promise<LLMStreamEvent[]> {
  const out: LLMStreamEvent[] = [];
  for await (const e of iter) {
    out.push(e);
  }
  return out;
}

describe('AnthropicExecutor — system prompt (hotfix 18/05/2026 PT-BR bug)', () => {
  // T1: confirmar que a chamada SDK stream inclui system prop
  it('passa system: EXECUTOR_SYSTEM_PROMPT à chamada client.messages.stream', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
        capturedBody = (await request.json()) as Record<string, unknown>;
        const model = (capturedBody.model as string) ?? 'claude-sonnet-4-6';
        return new HttpResponse(buildMinimalSseStream(model), {
          headers: { 'content-type': 'text/event-stream' },
        });
      })
    );

    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const messages: LLMMessage[] = [{ role: 'user', content: 'avança' }];
    await drainEvents(executor.execute(messages, [], { runId: 'test-run-t1' }));

    expect(capturedBody).not.toBeNull();
    const body = capturedBody!;
    expect(body).toHaveProperty('system');
    expect(body.system).toBe(EXECUTOR_SYSTEM_PROMPT);
    expect(body.stream).toBe(true);
  });

  // T2: conteúdo do system prompt contém marcadores críticos
  // (regressão contra deleção acidental ou refactor que esvazie o string)
  it('EXECUTOR_SYSTEM_PROMPT contém marcadores PT-PT + identidade Nexus + regras intents vazios', () => {
    expect(EXECUTOR_SYSTEM_PROMPT).toMatch(/Nexus/);
    expect(EXECUTOR_SYSTEM_PROMPT).toMatch(/PT-PT/);
    expect(EXECUTOR_SYSTEM_PROMPT).toMatch(/Nunca PT-BR/);
    expect(EXECUTOR_SYSTEM_PROMPT).toMatch(/intents vazios/i);
    // Tom directo + tu (não você) — brandbook IA AVANÇADA PT
    expect(EXECUTOR_SYSTEM_PROMPT).toMatch(/\btu\b/i);
    expect(EXECUTOR_SYSTEM_PROMPT).not.toMatch(/\bvocê\b/i);
  });

  // T3: mock-protocol-fidelity — o body HTTP que chega ao Anthropic
  // contém `system` com o valor EXACTO de EXECUTOR_SYSTEM_PROMPT.
  // Garante que o mock espelha o protocolo real (regra
  // `.claude/rules/mock-protocol-fidelity.md`) após o fix.
  it('MSW handler recebe body.system com EXECUTOR_SYSTEM_PROMPT exacto (mock-protocol-fidelity)', async () => {
    let capturedSystem: unknown = undefined;
    let capturedStream: unknown = undefined;

    server.use(
      http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        capturedSystem = body.system;
        capturedStream = body.stream;
        const model = (body.model as string) ?? 'claude-sonnet-4-6';
        return new HttpResponse(buildMinimalSseStream(model), {
          headers: { 'content-type': 'text/event-stream' },
        });
      })
    );

    const executor = new AnthropicExecutor(MOCK_API_KEY);
    const messages: LLMMessage[] = [{ role: 'user', content: 'o céu é azul' }];
    await drainEvents(executor.execute(messages, [], { runId: 'test-run-t3' }));

    // Match EXACTO — não truthy. Prova fidelity do mock ao protocolo real.
    expect(capturedSystem).toBe(EXECUTOR_SYSTEM_PROMPT);
    expect(typeof capturedSystem).toBe('string');
    expect((capturedSystem as string).length).toBeGreaterThan(0);
    // Discriminator executor vs classifier permanece body.stream === true
    expect(capturedStream).toBe(true);
  });
});
