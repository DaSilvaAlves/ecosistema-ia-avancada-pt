import {
  ClassificationResultSchema,
  LLMStreamEventSchema,
} from '@/lib/agent/schemas';
import {
  DEFAULT_OPENAI_CLASSIFIER_MODEL,
  DEFAULT_OPENAI_EXECUTOR_MODEL,
} from '@/lib/agent/models';
import { EXECUTOR_SYSTEM_PROMPT } from '@/lib/agent/prompts/executor-system';
import { toolsToOpenAIShape } from '@/lib/agent/tools/registry';
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
 * Nexus v2 — OpenAI Inference Transport client-side (Story 8.4 — ADR-10 S4,
 * D-8.4-SIBLING / D-8.4-BROWSER-SAFE)
 *
 * Espelho OpenAI do `InferenceTransport` Anthropic (`inference-transport.ts`,
 * ADR-9). Implementa `ClassifierProvider` + `ExecutorProvider` falando com
 * `/api/openai/proxy` (Edge) via `fetch`, em vez do SDK `openai` directo. Por
 * implementar as MESMAS interfaces, é injectável no executor/classifier sem
 * tocar no `toolCallingLoop`. Emite **exactamente** os mesmos `LLMStreamEvent`
 * canónicos que o `OpenAIExecutor` server-side (`providers/openai.ts`) — tudo a
 * jusante (gate de preview, undo, UI) fica intocado.
 *
 * BROWSER-SAFETY (AC5 / D-8.4-BROWSER-SAFE): este módulo NÃO importa o SDK
 * `openai` nem `@/lib/agent/providers/openai` (esse ficheiro tem
 * `import OpenAI from 'openai'` na linha 1 — arrastaria o SDK inteiro para o
 * bundle client). Por isso `toOpenAIMessages`, `proxyErrorMessage` e a sentinela
 * são definidos LOCALMENTE aqui — espelho exacto do padrão do transport
 * Anthropic (`toAnthropicMessages` local, sem `@anthropic-ai/sdk`).
 *
 * `mock-protocol-fidelity.md`: o proxy faz pass-through do SSE OpenAI tal-qual
 * (`/api/openai/proxy/route.ts:6`). Logo este transport parseia o **wire format
 * real da OpenAI Chat Completions** (ADR-10 §4.1):
 *   - `choices[0].delta.content` → texto incremental
 *   - `choices[0].delta.tool_calls[]` — o 1.º chunk de cada `index` traz `id` +
 *     `function.name`; os seguintes só fragmentos de `function.arguments`
 *   - `finish_reason:'tool_calls'` (ou fim de stream) fecha as entradas do Map →
 *     `JSON.parse` dos args acumulados (parsear cedo = bug da Story 1.2)
 *   - chunk de `usage` (`choices:[]`, só com `stream_options.include_usage`)
 *   - terminador `data: [DONE]`
 *
 * Edge-safety (ADR-1): apenas `fetch` + `iterateSseData` (Web standard) — sem
 * APIs Node-only. Importável de módulos `'use client'`.
 *
 * Trace canónico:
 * - ADR-10 §3.3 (Abordagem B — sibling proxy), §3.4 (selecção client), §4.1
 *   (fragmentação `tool_calls`), §4.3 (`toOpenAIMessages`), §7 R5 (proxy SSRF/auth)
 * - Espelho server: `lib/agent/providers/openai.ts` (`OpenAIExecutor`/`OpenAIClassifier`)
 * - Espelho client Anthropic: `lib/agent/inference-transport.ts`
 *
 * Constitution:
 * - Article IV (No Invention): wire format espelha o protocolo real OpenAI
 * - Article V (Quality First): mensagens PT-PT em todos os Errors
 * - Article VI (Absolute Imports): apenas `@/...`
 */

/**
 * Default de `max_completion_tokens` do classifier OpenAI (paridade com
 * `openai.ts:117` e com o classifier Anthropic = 1024). Resposta JSON
 * multi-intent é pequena e determinística (`temperature 0`) → cap seguro.
 *
 * SF-1 (PO / lição 8.3): o NOME do campo é `max_completion_tokens` (NÃO
 * `max_tokens`, deprecated e incompatível com modelos reasoning — rejeitado nos
 * Architect Gates da 8.2/8.3). Só o classifier fixa default; o executor NÃO
 * (não truncar `arguments` multi-tool).
 */
const DEFAULT_OPENAI_CLASSIFIER_MAX_TOKENS = 1024;

/**
 * URL do proxy Edge OpenAI. Relativa — resolve contra a origin do browser. O
 * proxy encapsula a `OPENAI_API_KEY` (server-only) e faz forward para a OpenAI.
 */
const OPENAI_PROXY_URL = '/api/openai/proxy';

/**
 * Erro sentinela: o handler interno do parser já emitiu o evento `error`
 * (e.g., `arguments` acumulados malformados). Evita double-emission no outer
 * catch. Espelha `StreamErrorAlreadyEmitted` (`openai.ts:64-71`) /
 * `TransportStreamErrorAlreadyEmitted` (`inference-transport.ts:81-87`).
 * Definida LOCALMENTE (browser-safety — não importar de módulos com SDK).
 */
class OpenAITransportStreamErrorAlreadyEmitted extends Error {
  readonly inner: unknown;
  constructor(inner: unknown) {
    super(inner instanceof Error ? inner.message : String(inner));
    this.name = 'OpenAITransportStreamErrorAlreadyEmitted';
    this.inner = inner;
  }
}

/**
 * Shape interno (subset) das mensagens OpenAI Chat Completions. Espelho de
 * `OpenAIChatMessage` em `openai.ts:230-242` — replicado aqui (browser-safety:
 * NÃO importar `openai.ts`, que puxa o SDK).
 */
type OpenAIChatMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | {
      role: 'assistant';
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }>;
    }
  | { role: 'tool'; tool_call_id: string; content: string };

/**
 * Mapeia `LLMMessage[]` → mensagens OpenAI Chat Completions (4 regras do
 * ADR-10 §4.3). Espelho de `lib/agent/providers/openai.ts:toOpenAIMessages`
 * (`:259-331`) — replicado aqui SEM o SDK para browser-safety (mesmos valores
 * em runtime). Manter sincronizado com a versão server.
 *
 * 1. System prompt → prepend `{ role:'system', content: EXECUTOR_SYSTEM_PROMPT }`.
 * 2. `role:'tool'` → `{ role:'tool', tool_call_id, content }` (fail-loud PT-PT
 *    se `toolCallId` ausente — a OpenAI rejeita `role:'tool'` órfã).
 * 3. Assistant com `tool_use` → `{ role:'assistant', content:<texto|null>,
 *    tool_calls:[{ id, type:'function', function:{ name, arguments } }] }`. O `id`
 *    é preservado verbatim (round-trip `id`↔`tool_call_id`, ADR-10 §4.3/§7 R2).
 * 4. Texto simples → `content: string` directo.
 */
function toOpenAIMessages(messages: LLMMessage[]): OpenAIChatMessage[] {
  const result: OpenAIChatMessage[] = [
    { role: 'system', content: EXECUTOR_SYSTEM_PROMPT },
  ];

  for (const m of messages) {
    // Regra 2: resultado de tool.
    if (m.role === 'tool') {
      if (!m.toolCallId) {
        throw new Error(
          'OpenAIInferenceTransport: mensagens com role "tool" requerem toolCallId (OpenAI Chat Completions requirement)'
        );
      }
      const toolContent =
        typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      result.push({
        role: 'tool',
        tool_call_id: m.toolCallId,
        content: toolContent,
      });
      continue;
    }

    // Regra 3: assistant com `content: ContentBlock[]` (text + tool_use).
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      const textParts: string[] = [];
      const toolCalls: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }> = [];
      for (const block of m.content) {
        if (block.type === 'text') {
          textParts.push(block.text);
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id, // round-trip verbatim
            type: 'function',
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input ?? {}),
            },
          });
        }
      }
      const textContent = textParts.join('');
      if (toolCalls.length > 0) {
        result.push({
          role: 'assistant',
          content: textContent.length > 0 ? textContent : null,
          tool_calls: toolCalls,
        });
      } else {
        result.push({ role: 'assistant', content: textContent });
      }
      continue;
    }

    // Regra 4: texto simples (user/assistant com `content: string`).
    if (typeof m.content === 'string') {
      result.push({ role: m.role, content: m.content });
      continue;
    }

    // Defensivo: user com `ContentBlock[]` (fora do contrato) — serializar.
    result.push({ role: m.role, content: JSON.stringify(m.content) });
  }

  return result;
}

/**
 * Lê o corpo de erro do proxy de forma tolerante (JSON ou texto) e devolve uma
 * mensagem PT-PT concisa. Não inclui a `OPENAI_API_KEY` (o proxy nunca a
 * devolve) nem o prompt cru (NFR11). Espelho de `proxyErrorMessage`
 * (`inference-transport.ts:137-151`) — local (browser-safety).
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
  return `Proxy de inferência OpenAI respondeu ${res.status}${detail ? ` — ${detail}` : ''}`;
}

/**
 * Buffer de um tool call em reagregação, indexado por `tool_calls[].index`.
 * Espelho de `ToolCallBuffer` (`openai.ts:344-348`).
 */
interface ToolCallBuffer {
  id: string;
  name: string;
  argsAccumulator: string;
}

/**
 * Shape (subset) de um `ChatCompletionChunk` do wire SSE OpenAI.
 */
interface OpenAIStreamChunk {
  choices?: Array<{
    index?: number;
    delta?: {
      content?: string | null;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string | null;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/**
 * Transport client-side de inferência OpenAI. Uma instância serve o classifier
 * (non-streaming) e o executor (streaming) — ambos via `/api/openai/proxy`.
 *
 * Stateless: cada chamada faz um `fetch` independente.
 */
export class OpenAIInferenceTransport
  implements ClassifierProvider, ExecutorProvider
{
  /**
   * `fetch` injectável para testes (default `globalThis.fetch` VINCULADO a
   * `globalThis` — D-FETCH-BIND, `inference-transport.ts:179-181`: o `fetch`
   * nativo exige `this === Window`; invocá-lo como `this.fetchFn(...)` sem bind
   * lança `Illegal invocation`). `fetchFn` injectado é usado tal-qual.
   */
  private readonly fetchFn: typeof fetch;

  constructor(fetchFn?: typeof fetch) {
    this.fetchFn = fetchFn ?? globalThis.fetch.bind(globalThis);
  }

  /**
   * Classifier — non-streaming. POST ao proxy com `response_format:
   * {type:'json_object'}` (garantia primária de JSON puro, ADR-10 §4.4), parseia
   * `choices[0].message.content`, aplica `stripJsonMarkdownFences` (rede
   * defensiva de custo zero) + `JSON.parse` + `ClassificationResultSchema`.
   * Espelho de `OpenAIClassifier.classify` (`openai.ts:148-221`), via proxy.
   * Usage mapeada dos nomes OpenAI (`prompt_tokens`/`completion_tokens`).
   */
  async classify(
    systemPrompt: string,
    userPrompt: string,
    opts: ClassifierOpts = {}
  ): Promise<ClassificationResult> {
    if (!systemPrompt || systemPrompt.length === 0) {
      throw new Error('OpenAIInferenceTransport: systemPrompt obrigatório');
    }
    if (!userPrompt || userPrompt.length === 0) {
      throw new Error('OpenAIInferenceTransport: userPrompt obrigatório');
    }

    // CR Iter 2 #3: normalizar TODOS os caminhos de falha do transporte
    // (rede rejeitada / corpo não-JSON), não só `!res.ok`, para um erro PT-PT
    // consistente — paridade com o tratamento de erro do `execute()`/proxy.
    let res: Response;
    try {
      res = await this.fetchFn(OPENAI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: opts.model ?? DEFAULT_OPENAI_CLASSIFIER_MODEL,
          // SF-1: `max_completion_tokens` (NÃO `max_tokens`). Valor 1024 (paridade).
          max_completion_tokens: opts.maxTokens ?? DEFAULT_OPENAI_CLASSIFIER_MAX_TOKENS,
          temperature: opts.temperature ?? 0,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
    } catch (err) {
      throw new Error(
        `OpenAIInferenceTransport: falha de rede ao contactar o proxy de inferência OpenAI — ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }

    if (!res.ok) {
      throw new Error(await proxyErrorMessage(res));
    }

    let data: {
      choices?: Array<{ message?: { content?: string | null } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    try {
      data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
    } catch {
      throw new Error(
        'OpenAIInferenceTransport: resposta do proxy de inferência OpenAI não é JSON válido (corpo malformado)'
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(
        'OpenAIInferenceTransport: resposta do classifier não contém choices[0].message.content'
      );
    }
    const rawResponse = content;

    // Rede defensiva de custo zero (D-8.3-JSON-OBJECT): com `response_format:
    // json_object` o conteúdo já é JSON puro e o strip devolve-o intacto.
    // `rawResponse` preserva o conteúdo ORIGINAL (antes do strip) — NFR11/debug.
    const cleanedResponse = stripJsonMarkdownFences(rawResponse);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch {
      throw new Error(
        `OpenAIInferenceTransport: resposta do classifier não é JSON válido — recebido: ${rawResponse.slice(0, 200)}`
      );
    }
    // `JSON.parse('null')`/primitivo passa o parse mas não é objecto — fail-loud
    // PT-PT (espelho do guard de `openai.ts:201-205`).
    if (parsed === null || typeof parsed !== 'object') {
      throw new Error(
        `OpenAIInferenceTransport: resposta do classifier não é um objecto JSON — recebido: ${rawResponse.slice(0, 200)}`
      );
    }
    const parsedObj = parsed as { intents?: unknown; confidence?: unknown };

    const candidate = {
      intents: parsedObj.intents,
      confidence: parsedObj.confidence,
      rawResponse,
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
    };
    return ClassificationResultSchema.parse(candidate);
  }

  /**
   * Faz flush das entradas pendentes do `Map` (por ordem crescente de `index`,
   * determinístico): `JSON.parse` do `argsAccumulator` (vazio `""` → `{}`) e
   * emite `tool_use`, removendo a entrada. Em parse falhado emite o `error`
   * event e LANÇA a sentinela (≠ `OpenAIExecutor`, que devolve sem lançar para
   * evitar o hang do `iterator.return()` do Stream do SDK sob MSW; aqui o stream
   * é `iterateSseData` sobre um `ReadableStream` puro, cujo `finally` só faz
   * `releaseLock()` — não pendura. Logo o padrão inline-throw do transport
   * Anthropic, `inference-transport.ts:401-409`, aplica-se directamente).
   *
   * Usado no boundary primário (`finish_reason:'tool_calls'`) e no flush
   * defensivo de fim de stream — idempotente (apaga o estado).
   */
  private async *flushToolCallBuffers(
    buffers: Map<number, ToolCallBuffer>
  ): AsyncGenerator<LLMStreamEvent> {
    const entries = [...buffers.entries()].sort((a, b) => a[0] - b[0]);
    for (const [index, buf] of entries) {
      let parsedInput: unknown;
      try {
        parsedInput =
          buf.argsAccumulator.length > 0 ? JSON.parse(buf.argsAccumulator) : {};
      } catch (parseErr) {
        const errorEvent: LLMStreamEvent = {
          type: 'error',
          message: `OpenAIInferenceTransport: tool_calls arguments accumulator não é JSON válido para tool_use ${buf.name} (id=${buf.id}): ${
            parseErr instanceof Error ? parseErr.message : String(parseErr)
          }`,
        };
        LLMStreamEventSchema.parse(errorEvent);
        yield errorEvent;
        throw new OpenAITransportStreamErrorAlreadyEmitted(parseErr);
      }
      const event: LLMStreamEvent = {
        type: 'tool_use',
        id: buf.id,
        name: buf.name,
        input: parsedInput,
      };
      LLMStreamEventSchema.parse(event);
      yield event;
      buffers.delete(index);
    }
  }

  /**
   * Executor — streaming. POST ao proxy com `stream:true` +
   * `stream_options:{include_usage:true}`, parseia o wire SSE real da OpenAI via
   * `iterateSseData` e emite os MESMOS `LLMStreamEvent` canónicos que o
   * `OpenAIExecutor` server-side. Espelho de `openai.ts:431-592`.
   *
   * Conversões + `fetch` DENTRO do try (AC7-F1): erro de rede e fail-loud de
   * `toOpenAIMessages` (toolCallId ausente) passam pelo envelope `error`
   * canónico em vez de escapar crus ao consumidor.
   */
  async *execute(
    messages: LLMMessage[],
    tools: ToolDefinition[],
    opts: ExecutorOpts
  ): AsyncIterable<LLMStreamEvent> {
    if (messages.length === 0) {
      throw new Error('OpenAIInferenceTransport: messages array não pode estar vazio');
    }
    if (!opts.runId || opts.runId.length === 0) {
      throw new Error('OpenAIInferenceTransport: opts.runId obrigatório para audit log');
    }

    let inputTokens = 0;
    let outputTokens = 0;
    const toolCallBuffers = new Map<number, ToolCallBuffer>();

    try {
      const openaiMessages = toOpenAIMessages(messages);
      const openaiTools = toolsToOpenAIShape(tools);

      const res = await this.fetchFn(OPENAI_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: opts.model ?? DEFAULT_OPENAI_EXECUTOR_MODEL,
          stream: true,
          stream_options: { include_usage: true },
          messages: openaiMessages,
          ...(openaiTools.length > 0 ? { tools: openaiTools } : {}),
          // SF-1: `max_completion_tokens` CONDICIONAL — só quando `opts.maxTokens`
          // é fornecido, SEM default hard-coded (um cap arbitrário podia truncar
          // multi-tool a meio do JSON de `arguments`). Espelho `openai.ts:472-474`.
          ...(opts.maxTokens !== undefined
            ? { max_completion_tokens: opts.maxTokens }
            : {}),
        }),
      });

      if (!res.ok) {
        throw new Error(await proxyErrorMessage(res));
      }
      if (!res.body) {
        throw new Error('OpenAIInferenceTransport: proxy não devolveu corpo de stream');
      }

      for await (const evt of iterateSseData(res.body)) {
        const chunk = evt as OpenAIStreamChunk;

        // Captura usage sempre que presente (último-vence). Chunk de usage tem
        // `choices:[]` (só com include_usage).
        if (chunk.usage) {
          if (chunk.usage.prompt_tokens !== undefined) {
            inputTokens = chunk.usage.prompt_tokens;
          }
          if (chunk.usage.completion_tokens !== undefined) {
            outputTokens = chunk.usage.completion_tokens;
          }
        }

        // Guard ANTES de aceder choices[0] (chunk de usage / vazio).
        if (!chunk.choices || chunk.choices.length === 0) {
          continue;
        }

        const choice = chunk.choices[0];
        const delta = choice?.delta;

        // Text delta → emite à medida.
        if (delta?.content) {
          const event: LLMStreamEvent = {
            type: 'text_delta',
            text: delta.content,
          };
          LLMStreamEventSchema.parse(event);
          yield event;
        }

        // Fragmentos de tool_calls → reagregação por `index` (espelho openai.ts).
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const existing = toolCallBuffers.get(tc.index);
            if (!existing) {
              // 1.º chunk do `index` traz `id` e/ou `function.name`. Fragmento de
              // continuação sem entrada prévia (fora de ordem) → ignorado.
              if (tc.id !== undefined || tc.function?.name !== undefined) {
                toolCallBuffers.set(tc.index, {
                  id: tc.id ?? '',
                  name: tc.function?.name ?? '',
                  argsAccumulator: tc.function?.arguments ?? '',
                });
              }
            } else {
              if (tc.id !== undefined && existing.id.length === 0) {
                existing.id = tc.id;
              }
              if (tc.function?.name !== undefined && existing.name.length === 0) {
                existing.name = tc.function.name;
              }
              if (tc.function?.arguments !== undefined) {
                existing.argsAccumulator += tc.function.arguments;
              }
            }
          }
        }

        // Boundary primário: `finish_reason:'tool_calls'` fecha TODAS as entradas
        // pendentes do `Map` de uma vez. `'stop'` fecha text-only sem tool calls.
        if (choice?.finish_reason === 'tool_calls') {
          yield* this.flushToolCallBuffers(toolCallBuffers);
        }
      }

      // Rede de segurança defensiva: flush do que restar no `Map` (stream sem
      // `finish_reason:'tool_calls'` explícito). Idempotente — normalmente vazio.
      yield* this.flushToolCallBuffers(toolCallBuffers);

      const doneEvent: LLMStreamEvent = {
        type: 'done',
        inputTokens,
        outputTokens,
      };
      LLMStreamEventSchema.parse(doneEvent);
      yield doneEvent;
    } catch (error) {
      // Sentinela: error event já emitido pelo handler interno — re-throw o erro
      // original (preserva stack), sem duplicar.
      if (error instanceof OpenAITransportStreamErrorAlreadyEmitted) {
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
