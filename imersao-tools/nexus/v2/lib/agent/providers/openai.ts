import OpenAI from 'openai';
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
import type {
  ClassifierProvider,
  ClassifierOpts,
  ClassificationResult,
  ExecutorProvider,
  ExecutorOpts,
  LLMMessage,
  LLMStreamEvent,
  ToolDefinition,
} from '@/lib/agent/providers/types';

/**
 * Nexus v2 — OpenAI Provider (Story 8.2 / ADR-10 S2)
 *
 * Implementação concreta de `ExecutorProvider` usando o SDK `openai` (Chat
 * Completions em streaming). Espelho linha-a-linha de `anthropic.ts`, com o
 * wire OpenAI: reagregação de `tool_calls` fragmentados por `index`, mapeamento
 * de mensagens (`toOpenAIMessages`) e emissão dos **mesmos** `LLMStreamEvent`
 * canónicos (`text_delta`/`tool_use`/`error`/`done`) que o caminho Anthropic.
 * Tudo a jusante (`toolCallingLoop`, gate de preview, undo, UI) fica intocado.
 *
 * Edge + Node compatible (SDK funciona com `fetch` global).
 *
 * Esta story (8.2) **cria** o ficheiro e os helpers de cliente partilhados
 * (`isOpenAITestEnv`, `buildOpenAIClientOptions`); a 8.3 **adiciona** o
 * `OpenAIClassifier` ao mesmo ficheiro, reutilizando-os (ADR-10 §3.1,
 * D-8.2-FILE-SHARED).
 *
 * Trace canónico:
 * - ADR-10 §2 (contrato canónico agnóstico ao provider)
 * - ADR-10 §3.1 (`OpenAIExecutor implements ExecutorProvider`)
 * - ADR-10 §4.1 (streaming + reagregação `tool_calls` por `index` + `include_usage`)
 * - ADR-10 §4.3 (`toOpenAIMessages` + round-trip `id`↔`tool_call_id`)
 * - ADR-10 §4.5 (modelo executor default)
 * - Espelho: `lib/agent/providers/anthropic.ts:53-390`
 */

// Re-export dos defaults OpenAI (paridade com o re-export Anthropic em
// `anthropic.ts:41`; a 8.3 reutiliza-os no mesmo ficheiro).
export { DEFAULT_OPENAI_CLASSIFIER_MODEL, DEFAULT_OPENAI_EXECUTOR_MODEL };

/**
 * Erro sentinela que sinaliza ao outer catch do `execute()` que o evento
 * `error` já foi emitido pelo handler interno (e.g., parse dos `arguments`
 * acumulados falhou). Evita double-emission.
 *
 * DUPLICADA de `anthropic.ts:53-60` (Architect Gate de Entrada, DECISÃO 2):
 * extrair para um módulo partilhado obrigaria a editar `anthropic.ts` →
 * violaria a AC14 (diff vazio). A extracção DRY fica como dívida registada
 * `REC-ADR10-SENTINEL-DRY`. Cópia byte-equivalente, privada ao módulo.
 */
class StreamErrorAlreadyEmitted extends Error {
  readonly inner: unknown;
  constructor(inner: unknown) {
    super(inner instanceof Error ? inner.message : String(inner));
    this.name = 'StreamErrorAlreadyEmitted';
    this.inner = inner;
  }
}

/**
 * Indica se estamos a correr em ambiente de testes (Vitest jsdom).
 * Usado para gatear `dangerouslyAllowBrowser: true` apenas em testes.
 *
 * Em produção (Edge/Node runtime) a flag MUST ficar `false` para impedir
 * que a API key vaze caso o bundle alguma vez corra em contexto browser.
 * Em tests, o SDK detecta `window` (jsdom) e bloqueia — esta flag é o
 * workaround documentado. MSW intercepta todas as chamadas, portanto a key
 * nunca sai do processo de teste.
 *
 * Espelho de `isTestEnv()` (`anthropic.ts:72-74`). Partilhado com a 8.3.
 */
export function isOpenAITestEnv(): boolean {
  return process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
}

/**
 * Constrói as opções do cliente OpenAI, gateando `dangerouslyAllowBrowser`
 * apenas para o ambiente de testes — espelho de `buildClientOptions`
 * (`anthropic.ts:80-85`). Partilhado com a 8.3 (`OpenAIClassifier`).
 */
export function buildOpenAIClientOptions(
  apiKey: string
): ConstructorParameters<typeof OpenAI>[0] {
  return {
    apiKey,
    ...(isOpenAITestEnv() ? { dangerouslyAllowBrowser: true } : {}),
  };
}

/**
 * Default de `max_completion_tokens` do classifier OpenAI (Story 8.3).
 *
 * Paridade comportamental com o classifier Anthropic
 * (`DEFAULT_CLASSIFIER_MAX_TOKENS = 1024`, `anthropic.ts:37`) — a classificação
 * JSON multi-intent é uma resposta pequena e determinística (`temperature 0`),
 * logo um cap de 1024 é seguro (ao contrário do executor, que NÃO fixa default
 * para não truncar `arguments` multi-tool — `openai.ts` `execute()`).
 *
 * [AUTO-DECISION] valor 1024 (paridade Anthropic); o NOME do campo é
 * `max_completion_tokens` (NÃO `max_tokens`, deprecated e incompatível com
 * modelos reasoning — decisão do Architect Gate da 8.2, `openai.ts` `execute()`).
 * Sobreponível por `opts.maxTokens`.
 */
const DEFAULT_OPENAI_CLASSIFIER_MAX_TOKENS = 1024;

/**
 * Classifier baseado em OpenAI Chat Completions (non-streaming, Story 8.3 /
 * ADR-10 S3). Espelho non-streaming do `AnthropicClassifier`
 * (`anthropic.ts:98-159`), com o wire OpenAI.
 *
 * `classify()` chama `client.chat.completions.create({...})` **non-streaming**
 * (sem `stream:true`) com `response_format:{type:'json_object'}` — a garantia
 * **primária** de que `choices[0].message.content` é JSON puro sem markdown
 * fences (elimina a saga de hotfixes do Haiku, ADR-10 §4.4). Mantém
 * `stripJsonMarkdownFences` como **rede defensiva de custo zero** (D-8.3-JSON-OBJECT):
 * sobre JSON já puro o strip é no-op (Caso 4, `classifier-json.ts:145-146`).
 *
 * Devolve um `ClassificationResult` **byte-compatível** com o do
 * `AnthropicClassifier` (`{ intents, confidence, rawResponse, inputTokens,
 * outputTokens }`), validado pelo **mesmo** `ClassificationResultSchema.parse`
 * (`schemas.ts:69-75`) — contrato canónico agnóstico ao provider (ADR-10 §2,
 * D-8.3-CONTRATO). Usage mapeada dos nomes OpenAI (`prompt_tokens`/
 * `completion_tokens`), NÃO dos nomes Anthropic.
 *
 * Em caso de output malformado da API, lança `Error` PT-PT (não-JSON) ou
 * `ZodError` (shape inválido) — fail-loud, paridade com Anthropic.
 */
export class OpenAIClassifier implements ClassifierProvider {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI(buildOpenAIClientOptions(apiKey));
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

    const response = await this.client.chat.completions.create({
      model: opts.model ?? DEFAULT_OPENAI_CLASSIFIER_MODEL,
      max_completion_tokens: opts.maxTokens ?? DEFAULT_OPENAI_CLASSIFIER_MAX_TOKENS,
      temperature: opts.temperature ?? 0,
      // Garantia primária de JSON puro sem fences (ADR-10 §4.4). O system prompt
      // vai como mensagem `role:'system'` (a OpenAI não tem param top-level
      // `system` como o Anthropic), o user prompt como `role:'user'`.
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    // Guard ANTES de aceder choices[0] (defensivo — AC7; espelho do guard
    // `choices.length===0` do executor).
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error(
        'Classifier: resposta da API OpenAI não contém choices[0].message.content'
      );
    }
    const rawResponse = content;
    // Rede defensiva de custo zero (D-8.3-JSON-OBJECT): com `response_format:
    // json_object` o conteúdo já é JSON puro e o strip devolve-o intacto; se um
    // modelo futuro regredir e envolver em fences, o strip protege. `rawResponse`
    // preserva o conteúdo ORIGINAL (antes do strip) — paridade Anthropic.
    const cleanedResponse = stripJsonMarkdownFences(rawResponse);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch {
      throw new Error(
        `Classifier: resposta da API não é JSON válido — recebido: ${rawResponse.slice(0, 200)}`
      );
    }
    // `JSON.parse('null')` (ou um primitivo/`true`/número) passa o parse mas NÃO
    // é o objecto `{intents,confidence}` esperado — desreferenciar daria um
    // TypeError opaco. Converter num fail-loud PT-PT limpo (CR Iter 1 minor;
    // reforça AC4/AC8 sem divergir do contrato — o caminho continua fail-loud).
    if (parsed === null || typeof parsed !== 'object') {
      throw new Error(
        `Classifier: resposta da API não é um objecto JSON — recebido: ${rawResponse.slice(0, 200)}`
      );
    }
    const parsedObj = parsed as { intents?: unknown; confidence?: unknown };

    // Mapeamento de usage com os nomes OpenAI (`prompt_tokens`/`completion_tokens`),
    // NÃO os nomes Anthropic (`input_tokens`/`output_tokens`). Usage ausente →
    // `undefined` → ZodError no `.parse` (fail-loud; `schemas.ts:73-74` exige int
    // não-negativo). O teste falsificável (C3) fixa este mapeamento.
    const usage = response.usage;
    const candidate = {
      intents: parsedObj.intents,
      confidence: parsedObj.confidence,
      rawResponse,
      inputTokens: usage?.prompt_tokens,
      outputTokens: usage?.completion_tokens,
    };
    return ClassificationResultSchema.parse(candidate);
  }
}

/**
 * Shape interno (subset) das mensagens OpenAI Chat Completions produzidas por
 * `toOpenAIMessages`. Tipado localmente (irmão do retorno de `toAnthropicMessages`
 * em `anthropic.ts:174-176`) e convertido para o tipo do SDK no call-site, para
 * manter `toOpenAIMessages` testável sem acoplar à namespace profunda do SDK.
 */
export type OpenAIChatMessage =
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
 * Mapeia `LLMMessage[]` (canónico, blocos Anthropic-shaped) → array de mensagens
 * OpenAI Chat Completions, aplicando as 4 regras do ADR-10 §4.3:
 *
 * 1. **System prompt:** prepend `{ role:'system', content: EXECUTOR_SYSTEM_PROMPT }`
 *    (OpenAI usa mensagem `system`; Anthropic usava o param top-level `system`).
 * 2. **Resultado de tool:** `role:'tool'` → `{ role:'tool', tool_call_id, content }`
 *    (fail-loud PT-PT se `toolCallId` ausente — espelho `anthropic.ts:179-183`;
 *    a OpenAI rejeita uma mensagem `role:'tool'` órfã).
 * 3. **Assistant com tool call:** bloco `{type:'tool_use', id, name, input}` →
 *    `{ role:'assistant', content: <texto|null>, tool_calls:[{ id, type:'function',
 *    function:{ name, arguments: JSON.stringify(input) } }] }`. O `id` é preservado
 *    **verbatim** (round-trip `id`↔`tool_call_id`, ADR-10 §4.3/§7 R2).
 * 4. **Texto simples:** `content: string` passa directo.
 */
export function toOpenAIMessages(messages: LLMMessage[]): OpenAIChatMessage[] {
  const result: OpenAIChatMessage[] = [
    { role: 'system', content: EXECUTOR_SYSTEM_PROMPT },
  ];

  for (const m of messages) {
    // Regra 2: resultado de tool.
    if (m.role === 'tool') {
      if (!m.toolCallId) {
        throw new Error(
          'Executor: mensagens com role "tool" requerem toolCallId (OpenAI Chat Completions requirement)'
        );
      }
      // tool content é canónicamente string (JSON-stringified result). Se chegar
      // array (defensivo), serializar para preservar contract.
      const toolContent =
        typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      result.push({
        role: 'tool',
        tool_call_id: m.toolCallId,
        content: toolContent,
      });
      continue;
    }

    // Regra 3: assistant com `content: ContentBlock[]` (pode conter text + tool_use).
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
            id: block.id, // preserva o `id` do stream — round-trip
            type: 'function',
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input ?? {}),
            },
          });
        }
        // tool_result dentro de um array de assistant não ocorre no contrato — ignorar.
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

    // Defensivo: user com `ContentBlock[]` (fora do contrato esperado) — serializar.
    result.push({ role: m.role, content: JSON.stringify(m.content) });
  }

  return result;
}

/**
 * Buffer de um tool call em reagregação, indexado por `tool_calls[].index`.
 *
 * Protocolo OpenAI streaming real (ADR-10 §4.1):
 * 1. O **primeiro** chunk de cada `index` traz `index` + `id` + `function.name`
 *    + `function.arguments` (geralmente `""`).
 * 2. Os chunks **seguintes** desse `index` trazem só fragmentos de
 *    `function.arguments` (sem `id`/`name`) → concatenados ao `argsAccumulator`.
 * 3. `JSON.parse(argsAccumulator)` corre **só** em `finish_reason==='tool_calls'`
 *    (ou fim de stream). Parsear cedo = mesma classe de bug que partiu a 1.2.
 */
interface ToolCallBuffer {
  id: string;
  name: string;
  argsAccumulator: string;
}

/**
 * Executor baseado em OpenAI Chat Completions com tool calling (streaming).
 *
 * `execute()` é async generator que retorna `AsyncIterable<LLMStreamEvent>`.
 * Mapeia o wire OpenAI para eventos canónicos:
 *
 * | Wire OpenAI | LLMStreamEvent emitido |
 * |-------------|------------------------|
 * | `choices[0].delta.content` | `{ type:'text_delta', text }` |
 * | `choices[0].delta.tool_calls[]` (1.º chunk: id+name; seguintes: args) | buffer por `index` |
 * | `finish_reason==='tool_calls'` (ou fim de stream) | `{ type:'tool_use', id, name, input }` |
 * | chunk de usage (`choices:[]`, `usage`) | acumula tokens para `done` |
 * | fim do stream | `{ type:'done', inputTokens, outputTokens }` |
 *
 * Diferença ao espelho Anthropic: o boundary de parse é **por resposta**
 * (`finish_reason==='tool_calls'` fecha **todas** as entradas pendentes do `Map`),
 * não por bloco. Iterar sobre **todas** as entradas no boundary, limpando-as
 * (espelho de `toolUseBuffers.delete`); o fim de stream é a rede de segurança
 * defensiva idempotente.
 *
 * Validação `LLMStreamEventSchema.parse(event)` antes de cada `yield`.
 */
export class OpenAIExecutor implements ExecutorProvider {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI(buildOpenAIClientOptions(apiKey));
  }

  /**
   * Faz flush das entradas pendentes do `Map`: para cada `index` (por ordem
   * crescente, determinístico) faz `JSON.parse` do `argsAccumulator` (vazio
   * `""` → `{}`) e emite um `tool_use` canónico, removendo a entrada. Em parse
   * falhado emite o `error` event e **devolve** `{ error }` (NÃO lança) — o
   * chamador decide quando re-throw, depois de **drenar** o stream do SDK.
   *
   * Porquê devolver em vez de lançar: lançar (ou `break`) a meio do
   * `for await...of stream` dispara o `iterator.return()` do `Stream` do SDK
   * `openai`, que **pendura** sob MSW (a abortagem do corpo SSE não resolve).
   * Drenar o stream até ao fim (natural) e só depois lançar evita o hang. O
   * `error` event já foi emitido aqui (não há dupla emissão a jusante).
   *
   * Usado tanto no boundary primário (`finish_reason==='tool_calls'`) como no
   * flush defensivo de fim de stream — ambos consomem (apagam) o estado, logo
   * a segunda passagem é idempotente (Map normalmente já vazio). Espelho lógico
   * de `anthropic.ts:320-351` (com a sinalização adaptada ao SDK OpenAI).
   */
  private async *flushToolCallBuffers(
    buffers: Map<number, ToolCallBuffer>
  ): AsyncGenerator<LLMStreamEvent, { error: unknown } | null> {
    const entries = [...buffers.entries()].sort((a, b) => a[0] - b[0]);
    for (const [index, buf] of entries) {
      let parsedInput: unknown;
      try {
        parsedInput =
          buf.argsAccumulator.length > 0 ? JSON.parse(buf.argsAccumulator) : {};
      } catch (parseErr) {
        const errorEvent: LLMStreamEvent = {
          type: 'error',
          message: `Executor: tool_calls arguments accumulator não é JSON válido para tool_use ${buf.name} (id=${buf.id}): ${
            parseErr instanceof Error ? parseErr.message : String(parseErr)
          }`,
        };
        LLMStreamEventSchema.parse(errorEvent);
        yield errorEvent;
        // Sinaliza ao chamador (sem lançar — ver JSDoc): error event já emitido.
        return { error: parseErr };
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
    return null;
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

    let inputTokens = 0;
    let outputTokens = 0;

    const toolCallBuffers = new Map<number, ToolCallBuffer>();
    // Erro de parse detectado no flush. Guardado para re-throw SÓ depois de
    // drenar o stream do SDK (ver `flushToolCallBuffers` JSDoc — sair cedo do
    // for-await pendura o `iterator.return()` do Stream OpenAI sob MSW).
    let pendingError: { error: unknown } | null = null;

    try {
      // Conversões + `create()` DENTRO do try (CR Iter 1 Major): o `await
      // create()` pode rejeitar (rede/auth) e `toOpenAIMessages` pode fail-loud
      // (toolCallId ausente) — ambos passam agora pelo envelope `error` canónico
      // em vez de escapar cru ao consumidor.
      const openaiMessages = toOpenAIMessages(messages);
      const openaiTools = toolsToOpenAIShape(tools);

      // Token limit (Architect Gate, DECISÃO 1): `max_completion_tokens` (NÃO
      // `max_tokens`, deprecated e incompatível com modelos reasoning), incluído
      // SÓ quando `opts.maxTokens` é fornecido — sem default hard-coded (um cap
      // arbitrário podia truncar multi-tool a meio do JSON de `arguments`).
      const stream = await this.client.chat.completions.create({
        model: opts.model ?? DEFAULT_OPENAI_EXECUTOR_MODEL,
        stream: true,
        stream_options: { include_usage: true },
        messages: openaiMessages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        ...(openaiTools.length > 0
          ? { tools: openaiTools as OpenAI.Chat.Completions.ChatCompletionTool[] }
          : {}),
        ...(opts.maxTokens !== undefined
          ? { max_completion_tokens: opts.maxTokens }
          : {}),
      });

      for await (const chunk of stream) {
        // Captura usage sempre que presente (último-vence) — robustez extra
        // recomendada no Architect Gate (b).
        if (chunk.usage) {
          inputTokens = chunk.usage.prompt_tokens;
          outputTokens = chunk.usage.completion_tokens;
        }

        // Após um erro de parse, drena os chunks restantes sem os processar
        // (completa o stream naturalmente — evita o hang do iterator.return()).
        if (pendingError !== null) {
          continue;
        }

        // Chunk de usage (`choices:[]`): tokens, NUNCA delta de conteúdo. Guard
        // ANTES de qualquer acesso a `choices[0]` (senão rebenta). AC7/AC12-d.
        if (chunk.choices.length === 0) {
          continue;
        }

        const choice = chunk.choices[0];
        const delta = choice.delta;

        // Text delta → emite à medida.
        if (delta?.content) {
          const event: LLMStreamEvent = {
            type: 'text_delta',
            text: delta.content,
          };
          LLMStreamEventSchema.parse(event);
          yield event;
        }

        // Fragmentos de tool_calls → reagregação por `index`.
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const existing = toolCallBuffers.get(tc.index);
            if (!existing) {
              // Primeiro chunk do `index` traz `id` e/ou `function.name`. Um
              // fragmento de continuação sem entrada prévia (fora de ordem /
              // defensivo) é ignorado silenciosamente — AC12-a.
              if (tc.id !== undefined || tc.function?.name !== undefined) {
                toolCallBuffers.set(tc.index, {
                  id: tc.id ?? '',
                  name: tc.function?.name ?? '',
                  argsAccumulator: tc.function?.arguments ?? '',
                });
              }
            } else {
              // Continuação: concatena `arguments`; preenche `id`/`name` se
              // chegarem tarde (defensivo, não esperado no wire real).
              if (tc.id !== undefined && existing.id.length === 0) {
                existing.id = tc.id;
              }
              if (
                tc.function?.name !== undefined &&
                existing.name.length === 0
              ) {
                existing.name = tc.function.name;
              }
              if (tc.function?.arguments !== undefined) {
                existing.argsAccumulator += tc.function.arguments;
              }
            }
          }
        }

        // Boundary primário: `finish_reason==='tool_calls'` fecha TODAS as
        // entradas pendentes do `Map` de uma vez (consome/apaga o estado).
        // `finish_reason==='stop'` fecha text-only sem tool calls — AC12-b.
        if (choice.finish_reason === 'tool_calls') {
          pendingError = yield* this.flushToolCallBuffers(toolCallBuffers);
          // Em erro, NÃO sair do loop: o próximo `continue` no topo drena o
          // resto do stream antes de lançar (evita o hang do iterator.return()).
        }
      }

      // Stream drenado. Se houve erro de parse no boundary, re-throw agora
      // (error event já emitido) via sentinela — sem dupla emissão.
      if (pendingError !== null) {
        throw new StreamErrorAlreadyEmitted(pendingError.error);
      }

      // Rede de segurança defensiva: flush do que restar no `Map` (stream
      // truncado / fixture sem `finish_reason`). Idempotente — normalmente vazio.
      const defensive = yield* this.flushToolCallBuffers(toolCallBuffers);
      if (defensive !== null) {
        throw new StreamErrorAlreadyEmitted(defensive.error);
      }

      const doneEvent: LLMStreamEvent = {
        type: 'done',
        inputTokens,
        outputTokens,
      };
      LLMStreamEventSchema.parse(doneEvent);
      yield doneEvent;
    } catch (error) {
      // Sentinel: error event já foi emitido pelo handler interno — só re-throw
      // o erro original para preservar stack trace, sem duplicar.
      if (error instanceof StreamErrorAlreadyEmitted) {
        throw error.inner instanceof Error
          ? error.inner
          : new Error(String(error.inner));
      }
      // Caso geral: emitir error event antes de re-throw (não silenciar erros).
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
