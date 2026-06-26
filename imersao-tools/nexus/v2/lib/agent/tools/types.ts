import type { z } from 'zod';
import type { NexusDB } from '@/lib/db/client';

/**
 * Nexus v2 — Tool Registry types (Story 1.3)
 *
 * Contract canónico para o Tool Registry usado pelo cérebro multi-intent (Epic 1).
 * Define `ToolDefinition` estendida, `ExecutionContext` (com placeholders
 * documentados para Story 1.7 substituir `VercelKV` real e Stories 1.5/1.8
 * confirmarem `Logger`), e `ToolDomain` enum.
 *
 * SF-2 (PO Pax — Story 1.3 validation):
 * `argsSchema: z.ZodObject<z.ZodRawShape>` é o aperto deliberado da Iter 3 da
 * Story 1.2 (CodeRabbit Nitpick A) — arch §7.2 line 570 mostra `z.ZodType<TArgs>`
 * mas Anthropic SDK requer `input_schema.type === 'object'`. Aperto evita uso
 * incorrecto pelo registry e pelo SDK. Alinhamento retrospectivo da arch §7.2
 * fica como tech debt fora de scope desta story (SF-3).
 *
 * Trace canónico:
 * - architecture-v2.md §7.2 lines 565-576 — interface ToolDefinition
 * - architecture-v2.md §7.2 lines 578-585 — ExecutionContext
 * - architecture-v2.md §7.2 lines 568-569 — ToolDomain (10 literals)
 * - PRD-NEXUS-V2.md §10 line 414 — Epic 1 Story 1.3 acceptance
 */

/**
 * Domínios funcionais das tools (arch §7.2 lines 568-569).
 *
 * Inventário arch §7.4 (39 tools previstas): Epic 2 tasks (7), Epic 3 finance (6),
 * Epic 4 habits/goals/reminders (9), Epic 5 journal/knowledge (9), Epic 6
 * calendar/gmail/telegram (7), Epic 7 receipt (1). `meta` é reservado para
 * tools de consulta (`consultar_*`) cross-domain.
 */
export type ToolDomain =
  | 'tasks'
  | 'finance'
  | 'habits'
  | 'journal'
  | 'knowledge'
  | 'calendar'
  | 'gmail'
  | 'telegram'
  | 'receipt'
  | 'meta';

/**
 * Logger interface mínima — placeholder até Stories 1.5/1.8 confirmarem a
 * interface real (potencialmente Pino, Winston ou wrapper custom). Stories
 * 2-7 podem fazer `ctx.logger.info('...')` / `ctx.logger.error('...')` em
 * `execute()`/`reverse()` sem dependência forte da implementação concreta.
 */
export interface Logger {
  info: (msg: string, meta?: unknown) => void;
  error: (msg: string, meta?: unknown) => void;
}

/**
 * KV store interface mínima — placeholder até Story 1.7 (Undo mechanism)
 * introduzir `@vercel/kv` real. Apenas `get`/`set`/`del` async para a Story 1.7
 * usar para guardar inverse args (TTL 30s) por `runId+toolCallId`.
 */
export interface VercelKV {
  get: <T = unknown>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, opts?: { ex?: number }) => Promise<void>;
  del: (key: string) => Promise<void>;
}

/**
 * Contexto injectado em cada `tool.execute()` e `tool.reverse()`.
 *
 * Trace: arch §7.2 lines 578-585 — `ExecutionContext` canónico.
 *
 * `userId` é literal `'eurico'` (single-user constraint C1, arch). Stories 2-7
 * acedem a este contexto via parâmetro `ctx` quando registam tools.
 */
export interface ExecutionContext {
  userId: 'eurico';
  db: NexusDB;
  kv: VercelKV;
  fetch: typeof fetch;
  logger: Logger;
  runId: string;
}

/**
 * Tool definition canónica (estendida).
 *
 * Trace: arch §7.2 lines 565-576.
 *
 * Preserva os 3 campos base da versão mínima Story 1.2 (`name`, `description`,
 * `argsSchema`) e adiciona `domain`, `resultSchema`, `requiresPreview`,
 * `reversible`, `execute`, `reverse?`. Stories 2-7 chamam
 * `toolRegistry.register({...})` para registar tools concretas conforme cada Epic.
 *
 * SF-2: `argsSchema: z.ZodObject<z.ZodRawShape>` é desvio deliberado da arch §7.2
 * line 570 (`z.ZodType<TArgs>`). Anthropic SDK requer `input_schema.type === 'object'`;
 * aperto evita schemas non-object aceites silenciosamente. Alinhamento retrospectivo
 * da arch é tech debt registado pelo PO (SF-3 — fora de scope desta story).
 */
export interface ToolDefinition<TArgs = unknown, TResult = unknown> {
  name: string;
  description: string;
  domain: ToolDomain;
  argsSchema: z.ZodObject<z.ZodRawShape>;
  resultSchema: z.ZodType<TResult>;
  requiresPreview: boolean;
  reversible: boolean;
  execute: (args: TArgs, ctx: ExecutionContext) => Promise<TResult>;
  reverse?: (args: TArgs, result: TResult, ctx: ExecutionContext) => Promise<void>;
}

/**
 * Shape Anthropic SDK para `tools` em `messages.stream({ tools: [...] })`.
 * Espelha `Tool.InputSchema` do `@anthropic-ai/sdk` 0.32.
 *
 * `[k: string]: unknown` permite campos extra opcionais (e.g., `format`,
 * `pattern`, `enum`) que `zodToJsonSchema` produz dependendo do schema fonte.
 */
export interface AnthropicToolShape {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
    [k: string]: unknown;
  };
}

/**
 * Shape OpenAI Chat Completions para `tools` em `chat.completions.create({ tools: [...] })`.
 * Irmão de `AnthropicToolShape` (Story 8.1, ADR-10 §4.2).
 *
 * Envelope OpenAI: `{ type: 'function', function: { name, description, parameters } }`,
 * onde `parameters` é o **mesmo** JSON Schema (`zodToJsonSchema(argsSchema, {target:'openApi3'})`)
 * que o caminho Anthropic usa em `input_schema` — ver `toolsToOpenAIShape` em `registry.ts`.
 *
 * `[k: string]: unknown` em `parameters` espelha o `input_schema` Anthropic (campos extra
 * opcionais que `zodToJsonSchema` produz, e.g. `format`, `pattern`, `enum`).
 */
export interface OpenAIToolShape {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties?: Record<string, unknown>;
      required?: string[];
      // `zodToJsonSchema` pode produzir `additionalProperties` como boolean OU
      // como sub-schema (e.g. `z.object().catchall(...)`) — aceitar ambos.
      additionalProperties?: boolean | Record<string, unknown>;
      [k: string]: unknown;
    };
  };
}
