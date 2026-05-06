import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type {
  AnthropicToolShape,
  ToolDefinition,
  ToolDomain,
} from '@/lib/agent/tools/types';

/**
 * Nexus v2 — Tool Registry (Story 1.3)
 *
 * Class central que regista, valida e converte tools para o cérebro multi-intent
 * (Epic 1). Stories 2-7 chamam `toolRegistry.register({...})` para povoar com
 * tools concretas (39 tools previstas no inventário arch §7.4).
 *
 * Inicia VAZIO em produção — Story 1.3 só cria a infraestrutura.
 *
 * Tech debt resolvido: CodeRabbit Iter 3 Nitpick #5 da Story 1.2 — função
 * `toAnthropicTools` migrada de `lib/agent/providers/anthropic.ts:188-205`
 * para canonical home aqui, com FAIL-LOUD substituindo o fallback silencioso.
 *
 * Trace canónico:
 * - architecture-v2.md §7.2 lines 587-609 — class ToolRegistry
 * - architecture-v2.md §7.4 — inventário 39 tools + optimização byDomain
 */

const TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

/**
 * Schema interno para validação runtime de `defineTool`.
 *
 * `z.custom<...>(predicate)` para `argsSchema`/`resultSchema` em vez de
 * `z.instanceof(...)` — `instanceof z.ZodObject` é mais robusto entre
 * versões internas do Zod do que `z.instanceof(z.ZodType)`.
 *
 * `execute`/`reverse` validados com `z.custom<Function>(typeof === 'function')`
 * em vez de `z.function()` (Zod 3.x deprecated em Zod 4) para futureproof
 * e mensagem de erro mais previsível — SF-4 PO Pax addressed.
 */
const ToolDefinitionShapeSchema = z.object({
  name: z.string().min(1, 'name é obrigatório'),
  description: z.string().min(1, 'description é obrigatório'),
  domain: z.enum([
    'tasks',
    'finance',
    'habits',
    'journal',
    'knowledge',
    'calendar',
    'gmail',
    'telegram',
    'receipt',
    'meta',
  ]),
  argsSchema: z.custom<z.ZodObject<z.ZodRawShape>>(
    (v) => v instanceof z.ZodObject,
    { message: 'argsSchema deve ser z.ZodObject (não z.ZodType genérico)' }
  ),
  resultSchema: z.custom<z.ZodType<unknown>>((v) => v instanceof z.ZodType, {
    message: 'resultSchema deve ser z.ZodType',
  }),
  requiresPreview: z.boolean(),
  reversible: z.boolean(),
  execute: z.custom<(...args: unknown[]) => unknown>(
    (v) => typeof v === 'function',
    { message: 'execute deve ser função' }
  ),
  reverse: z
    .custom<(...args: unknown[]) => unknown>(
      (v) => typeof v === 'function',
      { message: 'reverse deve ser função se presente' }
    )
    .optional(),
});

/**
 * Converte uma `ToolDefinition` para shape do SDK Anthropic.
 *
 * FAIL-LOUD: se `zodToJsonSchema` retornar shape sem `type === 'object'`,
 * lança Error identificando a tool culpada e o shape recebido. Substitui
 * o fallback silencioso `{ type: 'object', properties: {} }` da Story 1.2
 * (CodeRabbit Iter 3 Nitpick #5).
 *
 * Razão: schema malformado em produção é bug de definição da tool —
 * falhar loud apanha cedo, fallback silencioso esconde até o prompt errar
 * em runtime ou o SDK rejeitar a chamada.
 */
function convertToolToAnthropicShape(
  tool: ToolDefinition
): AnthropicToolShape {
  const jsonSchema = zodToJsonSchema(tool.argsSchema, { target: 'openApi3' });

  if (
    jsonSchema === null ||
    typeof jsonSchema !== 'object' ||
    !('type' in jsonSchema) ||
    (jsonSchema as { type?: unknown }).type !== 'object'
  ) {
    throw new Error(
      `Tool registry: zodToJsonSchema produziu shape inesperado para tool "${tool.name}" — ` +
        `esperado { type: "object", ... }, recebido: ${JSON.stringify(
          jsonSchema
        ).slice(0, 200)}`
    );
  }

  return {
    name: tool.name,
    description: tool.description,
    input_schema: jsonSchema as AnthropicToolShape['input_schema'],
  };
}

/**
 * Helper exportado para conversão pura sem instanciar registry. Usado pelo
 * `AnthropicExecutor` (após refactor Story 1.3) — preserva statelessness do
 * provider sem dependência do singleton.
 */
export function toolsToAnthropicShape(
  tools: ToolDefinition[]
): AnthropicToolShape[] {
  return tools.map(convertToolToAnthropicShape);
}

/**
 * Validation helper para criação tipada de tools com checks runtime.
 *
 * Apanha defs malformadas (e.g., `requiresPreview` ausente, `argsSchema` não
 * sendo ZodObject) antes do `register()`, com mensagens PT-PT mais claras
 * que erros TypeScript em build time.
 */
export function defineTool<TArgs = unknown, TResult = unknown>(
  def: ToolDefinition<TArgs, TResult>
): ToolDefinition<TArgs, TResult> {
  ToolDefinitionShapeSchema.parse(def);
  return def;
}

/**
 * Class ToolRegistry — single source of truth para tools registadas.
 *
 * Trace: arch §7.2 lines 587-609.
 *
 * Métodos extra além da arch (`unregister`, `has`, `all`, `clear`) são para
 * testabilidade — produção usa apenas `register/get/byDomain/toAnthropicTools`.
 */
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(def: ToolDefinition): void {
    if (!def.name || def.name.length === 0) {
      throw new Error('Tool registry: nome da tool não pode estar vazio');
    }
    if (!TOOL_NAME_PATTERN.test(def.name)) {
      throw new Error(
        `Tool registry: nome "${def.name}" inválido — usar snake_case lowercase (a-z, 0-9, _) começando por letra`
      );
    }
    if (this.tools.has(def.name)) {
      throw new Error(
        `Tool registry: tool "${def.name}" já registada — usar unregister() primeiro ou escolher outro nome`
      );
    }
    this.tools.set(def.name, def);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  all(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  byDomain(domain: ToolDomain): ToolDefinition[] {
    return this.all().filter((t) => t.domain === domain);
  }

  /**
   * Converte (sub)set de tools para shape SDK Anthropic. Sem argumento,
   * converte todas as tools registadas. Aplica fail-loud por tool.
   */
  toAnthropicTools(tools?: ToolDefinition[]): AnthropicToolShape[] {
    return toolsToAnthropicShape(tools ?? this.all());
  }

  /**
   * Limpa todas as tools registadas. APENAS para isolation em tests
   * (`beforeEach(() => toolRegistry.clear())`). Produção nunca usa.
   */
  clear(): void {
    this.tools.clear();
  }
}

/**
 * Singleton — fonte de verdade global. Stories 2-7 importam e fazem
 * `toolRegistry.register({...})` para tools de cada Epic.
 */
export const toolRegistry = new ToolRegistry();
