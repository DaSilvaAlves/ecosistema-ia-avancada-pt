import Anthropic from '@anthropic-ai/sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  ClassificationResultSchema,
  LLMStreamEventSchema,
} from '@/lib/agent/schemas';
import { DEFAULT_CLASSIFIER_MODEL, DEFAULT_EXECUTOR_MODEL } from '@/lib/agent/models';
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
 * Nexus v2 — Anthropic Provider (Story 1.2)
 *
 * Implementação concreta de `ClassifierProvider` + `ExecutorProvider` usando
 * `@anthropic-ai/sdk`. Edge + Node compatible (SDK funciona em ambos com
 * `fetch` global; sem APIs Node-only).
 *
 * Defaults importados de `lib/agent/models.ts` (single source of truth com
 * run-builder.ts — Story 1.2 should-fix #3 Opção A).
 *
 * Trace canónico:
 * - architecture-v2.md §6.1 lines 392-427 — modelos + AgentRun shape
 * - architecture-v2.md §7.2 lines 565-604 — ToolDefinition canónico
 * - PRD §10 lines 412-413 — Epic 1 Story 1.2 acceptance
 */

const DEFAULT_CLASSIFIER_MAX_TOKENS = 1024;
const DEFAULT_EXECUTOR_MAX_TOKENS = 4096;

// Re-export para compat com AC5 (constantes exportadas de anthropic.ts)
export { DEFAULT_CLASSIFIER_MODEL, DEFAULT_EXECUTOR_MODEL };

/**
 * Classifier baseado em Claude Haiku.
 *
 * `classify()` chama `client.messages.create()` (não-streaming) com system
 * prompt + user prompt. O prompt da Story 1.4 instruirá o modelo a responder
 * com JSON estrito no formato `{ intents, confidence }`. Esta classe parses
 * esse JSON e valida via `ClassificationResultSchema`.
 *
 * Em caso de output malformado da API, lança `ZodError` com mensagem PT-PT
 * (Constitution Article V — Quality First).
 */
export class AnthropicClassifier implements ClassifierProvider {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    // dangerouslyAllowBrowser: true necessário porque vitest jsdom expõe `window`,
    // o que faz o SDK detectar ambiente browser e bloquear. Em produção (Edge/Node)
    // não há `window`, portanto este flag é no-op. Em tests, MSW intercepta tudo —
    // a key nunca sai do processo.
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  async classify(
    systemPrompt: string,
    userPrompt: string,
    opts: ClassifierOpts = {}
  ): Promise<ClassificationResult> {
    if (!systemPrompt || systemPrompt.length === 0) {
      throw new Error('Classifier: systemPrompt obrigatório');
    }
    if (!userPrompt || userPrompt.length === 0) {
      throw new Error('Classifier: userPrompt obrigatório');
    }

    const response = await this.client.messages.create({
      model: opts.model ?? DEFAULT_CLASSIFIER_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_CLASSIFIER_MAX_TOKENS,
      temperature: opts.temperature ?? 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Extrai texto da resposta — esperamos 1 content block de tipo 'text'
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error(
        'Classifier: resposta da API não contém content block de tipo text'
      );
    }
    const rawResponse = textBlock.text;

    // Parse JSON do prompt da Story 1.4 — { intents: string[], confidence: Record<string, number> }
    let parsed: { intents?: unknown; confidence?: unknown };
    try {
      parsed = JSON.parse(rawResponse) as { intents?: unknown; confidence?: unknown };
    } catch {
      throw new Error(
        `Classifier: resposta da API não é JSON válido — recebido: ${rawResponse.slice(0, 200)}`
      );
    }

    // Constrói candidate ClassificationResult e valida via Zod (lança ZodError se shape errado)
    const candidate = {
      intents: parsed.intents,
      confidence: parsed.confidence,
      rawResponse,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
    return ClassificationResultSchema.parse(candidate);
  }
}

/**
 * Mapeia LLMMessage[] → formato Anthropic SDK.
 *
 * Anthropic não tem role 'tool' directo — mensagens com role 'tool' são
 * convertidas para `user` com `content: [{ type: 'tool_result', tool_use_id, content }]`.
 * Outras roles passam directo.
 */
function toAnthropicMessages(
  messages: LLMMessage[]
): Array<{ role: 'user' | 'assistant'; content: string | unknown[] }> {
  return messages.map((m) => {
    if (m.role === 'tool') {
      if (!m.toolCallId) {
        throw new Error(
          'Executor: mensagens com role "tool" requerem toolCallId (Anthropic SDK requirement)'
        );
      }
      return {
        role: 'user' as const,
        content: [
          {
            type: 'tool_result',
            tool_use_id: m.toolCallId,
            content: m.content,
          },
        ],
      };
    }
    return { role: m.role, content: m.content };
  });
}

/**
 * Mapeia ToolDefinition[] → formato Anthropic SDK (`tools: [{ name, description, input_schema }]`).
 *
 * Conversão Zod → JSON Schema via `zod-to-json-schema`. O AnthropicExecutor
 * é stateless — não cacheia; cada chamada faz a conversão. Para optimização
 * futura, Story 1.3 pode introduzir cache no `toolRegistry`.
 */
function toAnthropicTools(
  tools: ToolDefinition[]
): Array<{ name: string; description: string; input_schema: { type: 'object'; [k: string]: unknown } }> {
  return tools.map((t) => {
    const jsonSchema = zodToJsonSchema(t.argsSchema, { target: 'openApi3' });
    // Anthropic SDK requer `input_schema.type === 'object'` — garantir shape mínimo
    // mesmo se o Zod produzir algo diferente (defensive — Zod object → JSON 'object' typically).
    const input_schema =
      typeof jsonSchema === 'object' && jsonSchema !== null && 'type' in jsonSchema && jsonSchema.type === 'object'
        ? (jsonSchema as { type: 'object'; [k: string]: unknown })
        : ({ type: 'object' as const, properties: {} });
    return {
      name: t.name,
      description: t.description,
      input_schema,
    };
  });
}

/**
 * Executor baseado em Claude Sonnet com tool calling.
 *
 * `execute()` é async generator que retorna `AsyncIterable<LLMStreamEvent>`.
 * Mapeia eventos do SDK Anthropic para eventos canónicos:
 *
 * | SDK event | Condição | LLMStreamEvent emitido |
 * |-----------|----------|------------------------|
 * | content_block_delta | delta.type === 'text_delta' | { type: 'text_delta', text } |
 * | content_block_start | content_block.type === 'tool_use' | { type: 'tool_use', id, name, input } |
 * | message_delta | usage.output_tokens presente | (acumula para 'done') |
 * | message_start | sempre | (acumula input_tokens para 'done') |
 * | message_stop | fim do stream | { type: 'done', inputTokens, outputTokens } |
 *
 * O loop de tool calling (receber tool_use, executar tool real, injectar
 * tool_result, re-chamar execute) é responsabilidade do consumidor (Story 1.5).
 *
 * Validação `LLMStreamEventSchema.parse(event)` antes de cada `yield` garante
 * tipagem stricta. Padrão Story 1.1: chamar parse() para validar mas yield
 * do `event` original para preservar tipos compile-time.
 */
export class AnthropicExecutor implements ExecutorProvider {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    // dangerouslyAllowBrowser: true necessário porque vitest jsdom expõe `window`,
    // o que faz o SDK detectar ambiente browser e bloquear. Em produção (Edge/Node)
    // não há `window`, portanto este flag é no-op. Em tests, MSW intercepta tudo —
    // a key nunca sai do processo.
    this.client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  }

  async *execute(
    messages: LLMMessage[],
    tools: ToolDefinition[],
    opts: ExecutorOpts
  ): AsyncIterable<LLMStreamEvent> {
    if (messages.length === 0) {
      throw new Error('Executor: messages array não pode estar vazio');
    }
    if (!opts.runId || opts.runId.length === 0) {
      throw new Error('Executor: opts.runId obrigatório para audit log');
    }

    const anthropicMessages = toAnthropicMessages(messages);
    const anthropicTools = toAnthropicTools(tools);

    const stream = this.client.messages.stream({
      model: opts.model ?? DEFAULT_EXECUTOR_MODEL,
      max_tokens: opts.maxTokens ?? DEFAULT_EXECUTOR_MAX_TOKENS,
      messages: anthropicMessages as Anthropic.MessageParam[],
      tools: anthropicTools.length > 0 ? anthropicTools : undefined,
    });

    let inputTokens = 0;
    let outputTokens = 0;

    try {
      for await (const sdkEvent of stream) {
        if (sdkEvent.type === 'message_start') {
          inputTokens = sdkEvent.message.usage.input_tokens;
          outputTokens = sdkEvent.message.usage.output_tokens;
          continue;
        }

        if (sdkEvent.type === 'content_block_start') {
          if (sdkEvent.content_block.type === 'tool_use') {
            const event: LLMStreamEvent = {
              type: 'tool_use',
              id: sdkEvent.content_block.id,
              name: sdkEvent.content_block.name,
              input: sdkEvent.content_block.input,
            };
            LLMStreamEventSchema.parse(event);
            yield event;
          }
          continue;
        }

        if (sdkEvent.type === 'content_block_delta') {
          if (sdkEvent.delta.type === 'text_delta') {
            const event: LLMStreamEvent = {
              type: 'text_delta',
              text: sdkEvent.delta.text,
            };
            LLMStreamEventSchema.parse(event);
            yield event;
          }
          // input_json_delta acumulado pelo SDK no content_block.input — não emitimos delta parcial
          continue;
        }

        if (sdkEvent.type === 'message_delta') {
          if (sdkEvent.usage?.output_tokens !== undefined) {
            outputTokens = sdkEvent.usage.output_tokens;
          }
          continue;
        }

        // content_block_stop, message_stop — ignored (done emitted at end)
      }

      const doneEvent: LLMStreamEvent = {
        type: 'done',
        inputTokens,
        outputTokens,
      };
      LLMStreamEventSchema.parse(doneEvent);
      yield doneEvent;
    } catch (error) {
      // Propagar erro como evento — não silenciar (CodeRabbit lição Story 1.1)
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
