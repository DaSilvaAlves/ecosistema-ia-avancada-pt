import {
  ClassificationResultSchema,
  LLMStreamEventSchema,
} from '@/lib/agent/schemas';
import { DEFAULT_CLASSIFIER_MODEL, DEFAULT_EXECUTOR_MODEL } from '@/lib/agent/models';
import { EXECUTOR_SYSTEM_PROMPT } from '@/lib/agent/prompts/executor-system';
import { toolsToAnthropicShape } from '@/lib/agent/tools/registry';
import { stripJsonMarkdownFences } from '@/lib/agent/classifier-json';
import { iterateSseData } from '@/lib/agent/sse-lines';
import type {
  ClassifierProvider,
  ClassifierOpts,
  ExecutorProvider,
  ExecutorOpts,
  LLMMessage,
  LLMStreamEvent,
  ToolDefinition,
  ClassificationResult,
} from '@/lib/agent/providers/types';

/**
 * Nexus v2 — Inference Transport client-side (Story 1.11 — ADR-9, A2)
 *
 * Transport que implementa `ClassifierProvider` + `ExecutorProvider` falando
 * com `/api/anthropic/proxy` (Edge) via `fetch`, em vez do `@anthropic-ai/sdk`
 * directo. É o substituto client-side de `providers/anthropic.ts` no caminho do
 * `runAgent`: por implementar as MESMAS interfaces, é injectável no executor/
 * classifier (`RunAgentOpts.executor`/`.classifier`) sem tocar no
 * `toolCallingLoop`.
 *
 * Porquê (ADR-9):
 * - `providers/anthropic.ts` instancia `new Anthropic(...)` com a
 *   `ANTHROPIC_API_KEY` (server-only, §9.2/NFR5) e tem `dangerouslyAllowBrowser`
 *   gated por `isTestEnv()` — recusa-se a correr no browser real. Logo NÃO pode
 *   ir no bundle client.
 * - O `/api/anthropic/proxy` (Edge) já encapsula a key server-side e faz forward
 *   para a Anthropic Messages API. Este transport fala com o proxy; a key
 *   NUNCA entra em módulo `'use client'`.
 *
 * `mock-protocol-fidelity.md` (CRÍTICO nesta story): o proxy faz pass-through do
 * stream SSE da Anthropic tal-qual (`proxy/route.ts:152-160`). Logo este
 * transport tem de parsear o **wire format SSE real da Anthropic**:
 *   message_start → content_block_start (tool_use sem input) →
 *   content_block_delta (input_json_delta.partial_json fragmentado) →
 *   content_block_stop → message_delta → message_stop
 *
 * O `input` de um `tool_use` chega VAZIO no `content_block_start` e os args são
 * streamados como `input_json_delta` chunks que só estão completos no
 * `content_block_stop` (SDK Anthropic issue #960). Reconstruir os args antes do
 * stop é exactamente o bug da Story 1.2 — este transport reconstrói-os no stop.
 *
 * Edge-safety (ADR-1): este módulo NÃO importa `@anthropic-ai/sdk` nem
 * `ANTHROPIC_API_KEY`. Pode correr no browser (apenas `fetch` + parsing).
 *
 * Trace canónico:
 * - architecture-v2.md ADR-9 — executor client-side via proxy
 * - architecture-v2.md §9.2 — ANTHROPIC_API_KEY server-only
 * - app/api/anthropic/proxy/route.ts — contrato `{ messages, model, stream?, max_tokens?, tools?, system? }`
 * - lib/agent/providers/anthropic.ts — parser de referência do wire format SSE
 *
 * Constitution:
 * - Article IV (No Invention): wire format espelha o protocolo real Anthropic
 * - Article V (Quality First): mensagens PT-PT em todos os Errors
 * - Article VI (Absolute Imports): apenas `@/...`
 */

const DEFAULT_CLASSIFIER_MAX_TOKENS = 1024;
const DEFAULT_EXECUTOR_MAX_TOKENS = 4096;

/**
 * URL do proxy Edge. Relativa — resolve contra a origin do browser. O proxy
 * encapsula a `ANTHROPIC_API_KEY` (server-only) e faz forward para a Anthropic.
 */
const PROXY_URL = '/api/anthropic/proxy';

/**
 * Erro sentinela: o handler interno do parser já emitiu o evento `error`
 * (e.g., `input_json_delta` malformado). Evita double-emission no outer catch.
 * Espelha `StreamErrorAlreadyEmitted` de `providers/anthropic.ts`.
 */
class TransportStreamErrorAlreadyEmitted extends Error {
  readonly inner: unknown;
  constructor(inner: unknown) {
    super(inner instanceof Error ? inner.message : String(inner));
    this.name = 'TransportStreamErrorAlreadyEmitted';
    this.inner = inner;
  }
}

/**
 * Mapeia `LLMMessage[]` → formato Anthropic (`role: 'user' | 'assistant'`).
 *
 * Espelha `toAnthropicMessages` de `providers/anthropic.ts`: mensagens com
 * `role: 'tool'` viram `user` com `content: [{ type: 'tool_result', ... }]`;
 * `assistant`/`user` passam o `content` (string OU `ContentBlock[]`) directo.
 *
 * Single source of truth do contrato: o proxy faz forward para a Anthropic
 * Messages API, que exige este shape — idêntico ao que o SDK constrói.
 */
function toAnthropicMessages(
  messages: LLMMessage[]
): Array<{ role: 'user' | 'assistant'; content: string | unknown[] }> {
  return messages.map((m) => {
    if (m.role === 'tool') {
      if (!m.toolCallId) {
        throw new Error(
          'InferenceTransport: mensagens com role "tool" requerem toolCallId (Anthropic API requirement)'
        );
      }
      const toolResultContent =
        typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return {
        role: 'user' as const,
        content: [
          {
            type: 'tool_result',
            tool_use_id: m.toolCallId,
            content: toolResultContent,
          },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });
}

// `iterateSseData` (framing SSE puro `data: …\n\n`) foi extraída para
// `@/lib/agent/sse-lines` na Story 8.4 (D-8.4-SSE-LINES) para ser partilhada
// byte-a-byte com o `OpenAIInferenceTransport` — refactor DRY zero-comportamento
// (ADR-10 §3.3 "Nota DRY de baixo risco"). Importada acima.

/**
 * Lê o corpo de erro do proxy de forma tolerante (JSON ou texto) e devolve uma
 * mensagem PT-PT concisa. Não inclui a `ANTHROPIC_API_KEY` (o proxy nunca a
 * devolve) nem o prompt cru (NFR11).
 */
async function proxyErrorMessage(res: Response): Promise<string> {
  let detail = '';
  try {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { error?: unknown };
      detail = typeof parsed.error === 'string' ? parsed.error : text.slice(0, 200);
    } catch {
      detail = text.slice(0, 200);
    }
  } catch {
    detail = '';
  }
  return `Proxy de inferência respondeu ${res.status}${detail ? ` — ${detail}` : ''}`;
}

/**
 * Transport client-side de inferência. Uma instância serve tanto o classifier
 * (Haiku, non-streaming) como o executor (Sonnet, streaming) — ambos via
 * `/api/anthropic/proxy`.
 *
 * Stateless: cada chamada faz um `fetch` independente.
 */
export class InferenceTransport implements ClassifierProvider, ExecutorProvider {
  /**
   * `fetch` injectável para testes (default `globalThis.fetch`). Em produção é
   * o `fetch` do browser que resolve `PROXY_URL` contra a origin.
   */
  private readonly fetchFn: typeof fetch;

  /**
   * Story 1.12 (DEV-DECISION D-FETCH-BIND) — o default tem de ser
   * `globalThis.fetch` VINCULADO a `globalThis`. O `fetch` nativo exige
   * `this === Window`/`WorkerGlobalScope`; armazená-lo numa propriedade e
   * invocá-lo como `this.fetchFn(...)` faz `this === InferenceTransport` →
   * `TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation`.
   * Bug latente da Phase 1 (ADR-9): os unit tests sempre injectam um `fetchFn`
   * mock (nunca exercitam o default) e a suite E2E da Story 1.10 mockava
   * `/api/agent/prompt` (não passava pelo transport). A re-rota da Story 1.12
   * (que exercita o caminho client REAL pela 1ª vez em E2E) revelou-o.
   * `fetchFn` injectado é usado tal-qual; só o default é vinculado.
   */
  constructor(fetchFn?: typeof fetch) {
    this.fetchFn = fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  /**
   * Classifier (Haiku) — non-streaming. POST ao proxy com `stream: false`,
   * espera a resposta JSON da Anthropic Messages API (`content[].text` com o
   * JSON do classifier) e valida via `ClassificationResultSchema`.
   *
   * Espelha `AnthropicClassifier.classify` de `providers/anthropic.ts`, mas via
   * proxy em vez do SDK. Aplica `stripJsonMarkdownFences` ao `content[].text`
   * antes do `JSON.parse` (hotfix 2026-05-31, paridade com o server-side),
   * preservando o `rawResponse` original com fences downstream (NFR11/debug).
   * NÃO remover este strip client-side: a sua omissão na migração ADR-9 foi a
   * regressão que partiu produção (cérebro down para prompts-com-tool).
   */
  async classify(
    systemPrompt: string,
    userPrompt: string,
    opts: ClassifierOpts = {}
  ): Promise<ClassificationResult> {
    if (!systemPrompt || systemPrompt.length === 0) {
      throw new Error('InferenceTransport: systemPrompt obrigatório');
    }
    if (!userPrompt || userPrompt.length === 0) {
      throw new Error('InferenceTransport: userPrompt obrigatório');
    }

    const res = await this.fetchFn(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_CLASSIFIER_MODEL,
        max_tokens: opts.maxTokens ?? DEFAULT_CLASSIFIER_MAX_TOKENS,
        temperature: opts.temperature ?? 0,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(await proxyErrorMessage(res));
    }

    const data = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const textBlock = data.content?.find((b) => b.type === 'text');
    if (!textBlock || typeof textBlock.text !== 'string') {
      throw new Error(
        'InferenceTransport: resposta do classifier não contém content block de tipo text'
      );
    }
    const rawResponse = textBlock.text;

    // Hotfix produção 2026-05-31: o Haiku envolve o JSON em markdown fences
    // (```` ```json ... ``` ````) apesar do system prompt pedir "APENAS JSON".
    // O `AnthropicClassifier` server-side já fazia este strip (hotfixes 05-09 +
    // 05-18); a migração client-side (ADR-9) omitiu-o → `JSON.parse` cru
    // rebentava em produção. Aplicar `stripJsonMarkdownFences` antes do parse,
    // preservando `rawResponse` original (com fences) downstream (NFR11/debug).
    const cleanedResponse = stripJsonMarkdownFences(rawResponse);

    let parsed: { intents?: unknown; confidence?: unknown };
    try {
      parsed = JSON.parse(cleanedResponse) as {
        intents?: unknown;
        confidence?: unknown;
      };
    } catch {
      throw new Error(
        `InferenceTransport: resposta do classifier não é JSON válido — recebido: ${rawResponse.slice(0, 200)}`
      );
    }

    const candidate = {
      intents: parsed.intents,
      confidence: parsed.confidence,
      rawResponse,
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    };
    return ClassificationResultSchema.parse(candidate);
  }

  /**
   * Executor (Sonnet) — streaming. POST ao proxy com `stream: true`, parseia o
   * wire SSE real da Anthropic e emite `LLMStreamEvent` canónicos (os mesmos
   * que o `AnthropicExecutor` do SDK emite), para o `toolCallingLoop` consumir
   * sem qualquer alteração.
   *
   * Wire format (espelha `AnthropicExecutor.execute`):
   * - `message_start` → acumula `input_tokens`
   * - `content_block_start` (text) → ignora; (tool_use) → abre buffer
   *   `{ id, name, jsonAccumulator: '' }` (input vazio no start)
   * - `content_block_delta` (text_delta) → emite `text_delta`;
   *   (input_json_delta) → concatena `partial_json` no buffer
   * - `content_block_stop` → `JSON.parse` do accumulator → emite `tool_use`
   *   com `input` completo (ou erro se JSON malformado)
   * - `message_delta` → actualiza `output_tokens`
   * - `message_stop` → fim do stream → emite `done`
   */
  async *execute(
    messages: LLMMessage[],
    tools: ToolDefinition[],
    opts: ExecutorOpts
  ): AsyncIterable<LLMStreamEvent> {
    if (messages.length === 0) {
      throw new Error('InferenceTransport: messages array não pode estar vazio');
    }
    if (!opts.runId || opts.runId.length === 0) {
      throw new Error('InferenceTransport: opts.runId obrigatório para audit log');
    }

    const anthropicMessages = toAnthropicMessages(messages);
    const anthropicTools = toolsToAnthropicShape(tools);

    const res = await this.fetchFn(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_EXECUTOR_MODEL,
        max_tokens: opts.maxTokens ?? DEFAULT_EXECUTOR_MAX_TOKENS,
        system: EXECUTOR_SYSTEM_PROMPT,
        stream: true,
        messages: anthropicMessages,
        ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
      }),
    });

    if (!res.ok) {
      throw new Error(await proxyErrorMessage(res));
    }
    if (!res.body) {
      throw new Error('InferenceTransport: proxy não devolveu corpo de stream');
    }

    let inputTokens = 0;
    let outputTokens = 0;

    // Buffer de tool_use por `content_block_index` — idêntico ao
    // `AnthropicExecutor`. Args streamados via `input_json_delta`; só
    // reconstruídos no `content_block_stop` (Story 1.2 bug se reconstruídos
    // antes). CRÍTICO mock-protocol-fidelity.
    const toolUseBuffers = new Map<
      number,
      { id: string; name: string; jsonAccumulator: string }
    >();

    try {
      for await (const evt of iterateSseData(res.body)) {
        const sdkEvent = evt as {
          type?: string;
          index?: number;
          message?: { usage?: { input_tokens?: number; output_tokens?: number } };
          content_block?: { type?: string; id?: string; name?: string };
          delta?: {
            type?: string;
            text?: string;
            partial_json?: string;
          };
          usage?: { output_tokens?: number };
        };

        if (sdkEvent.type === 'message_start') {
          inputTokens = sdkEvent.message?.usage?.input_tokens ?? 0;
          outputTokens = sdkEvent.message?.usage?.output_tokens ?? 0;
          continue;
        }

        if (sdkEvent.type === 'content_block_start') {
          if (
            sdkEvent.content_block?.type === 'tool_use' &&
            sdkEvent.index !== undefined &&
            sdkEvent.content_block.id &&
            sdkEvent.content_block.name
          ) {
            toolUseBuffers.set(sdkEvent.index, {
              id: sdkEvent.content_block.id,
              name: sdkEvent.content_block.name,
              jsonAccumulator: '',
            });
          }
          continue;
        }

        if (sdkEvent.type === 'content_block_delta') {
          if (sdkEvent.delta?.type === 'text_delta') {
            const event: LLMStreamEvent = {
              type: 'text_delta',
              text: sdkEvent.delta.text ?? '',
            };
            LLMStreamEventSchema.parse(event);
            yield event;
            continue;
          }
          if (sdkEvent.delta?.type === 'input_json_delta') {
            const buf =
              sdkEvent.index !== undefined
                ? toolUseBuffers.get(sdkEvent.index)
                : undefined;
            if (buf) {
              buf.jsonAccumulator += sdkEvent.delta.partial_json ?? '';
            }
          }
          continue;
        }

        if (sdkEvent.type === 'content_block_stop') {
          const buf =
            sdkEvent.index !== undefined
              ? toolUseBuffers.get(sdkEvent.index)
              : undefined;
          if (buf) {
            let parsedInput: unknown;
            try {
              parsedInput =
                buf.jsonAccumulator.length > 0
                  ? JSON.parse(buf.jsonAccumulator)
                  : {};
            } catch (parseErr) {
              const errorEvent: LLMStreamEvent = {
                type: 'error',
                message: `InferenceTransport: input_json_delta accumulator não é JSON válido para tool_use ${buf.name} (id=${buf.id}): ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`,
              };
              LLMStreamEventSchema.parse(errorEvent);
              yield errorEvent;
              throw new TransportStreamErrorAlreadyEmitted(parseErr);
            }
            const event: LLMStreamEvent = {
              type: 'tool_use',
              id: buf.id,
              name: buf.name,
              input: parsedInput,
            };
            LLMStreamEventSchema.parse(event);
            yield event;
            if (sdkEvent.index !== undefined) {
              toolUseBuffers.delete(sdkEvent.index);
            }
          }
          continue;
        }

        if (sdkEvent.type === 'message_delta') {
          if (sdkEvent.usage?.output_tokens !== undefined) {
            outputTokens = sdkEvent.usage.output_tokens;
          }
          continue;
        }

        // message_stop — done emitido no fim.
      }

      const doneEvent: LLMStreamEvent = {
        type: 'done',
        inputTokens,
        outputTokens,
      };
      LLMStreamEventSchema.parse(doneEvent);
      yield doneEvent;
    } catch (error) {
      if (error instanceof TransportStreamErrorAlreadyEmitted) {
        throw error.inner instanceof Error
          ? error.inner
          : new Error(String(error.inner));
      }
      const errorEvent: LLMStreamEvent = {
        type: 'error',
        message: error instanceof Error ? error.message : String(error),
      };
      LLMStreamEventSchema.parse(errorEvent);
      yield errorEvent;
      throw error;
    }
  }
}
