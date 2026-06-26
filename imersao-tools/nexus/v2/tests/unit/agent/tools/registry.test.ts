import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  defineTool,
  ToolRegistry,
  toolRegistry,
  toolsToAnthropicShape,
  toolsToOpenAIShape,
} from '@/lib/agent/tools/registry';
import type { ToolDefinition, ToolDomain } from '@/lib/agent/tools/types';

/**
 * Story 1.3 — Tool Registry tests.
 *
 * Cobre AC2-AC6 + AC10. Sem MSW, sem Dexie — registry é puro.
 *
 * Strategy fail-loud (AC5): preferimos schemas Zod genuinamente non-object
 * (cast TypeScript) em vez de mock de `zod-to-json-schema` — testa o
 * comportamento real e evita dependências de hoisting de `vi.mock`. Para
 * o caso defensivo `null` retornado (que `zodToJsonSchema` real não produz),
 * usamos `vi.mock` num bloco isolado.
 */

// Helper — produz uma ToolDefinition válida com overrides
const dummyTool = (overrides?: Partial<ToolDefinition>): ToolDefinition => ({
  name: 'tool_dummy',
  description: 'Tool fake para tests',
  domain: 'meta' as ToolDomain,
  argsSchema: z.object({ x: z.string() }),
  resultSchema: z.object({ ok: z.boolean() }),
  requiresPreview: false,
  reversible: false,
  execute: vi.fn().mockResolvedValue({ ok: true }),
  ...overrides,
});

describe('ToolRegistry — empty registry', () => {
  beforeEach(() => {
    toolRegistry.clear();
  });

  it('all() retorna [] quando registry vazio', () => {
    expect(toolRegistry.all()).toEqual([]);
  });

  it('get(name) retorna undefined quando registry vazio', () => {
    expect(toolRegistry.get('inexistente')).toBeUndefined();
  });

  it('has(name) retorna false quando registry vazio', () => {
    expect(toolRegistry.has('inexistente')).toBe(false);
  });

  it('byDomain(domain) retorna [] quando registry vazio', () => {
    expect(toolRegistry.byDomain('tasks')).toEqual([]);
  });

  it('toAnthropicTools() retorna [] quando registry vazio', () => {
    expect(toolRegistry.toAnthropicTools()).toEqual([]);
  });
});

describe('ToolRegistry — register happy path', () => {
  beforeEach(() => {
    toolRegistry.clear();
  });

  it('register() adiciona tool e get/has/all reflectem state', () => {
    const tool = dummyTool({ name: 'criar_tarefa', domain: 'tasks' });
    toolRegistry.register(tool);

    expect(toolRegistry.has('criar_tarefa')).toBe(true);
    expect(toolRegistry.get('criar_tarefa')).toBe(tool);
    expect(toolRegistry.all()).toEqual([tool]);
    expect(toolRegistry.all()).toHaveLength(1);
  });

  it('register() preserva ordem de inserção em all()', () => {
    const t1 = dummyTool({ name: 'tool_a' });
    const t2 = dummyTool({ name: 'tool_b' });
    toolRegistry.register(t1);
    toolRegistry.register(t2);
    expect(toolRegistry.all().map((t) => t.name)).toEqual(['tool_a', 'tool_b']);
  });
});

describe('ToolRegistry — register validation errors', () => {
  beforeEach(() => {
    toolRegistry.clear();
  });

  it('lança em nome vazio com mensagem PT-PT', () => {
    expect(() => toolRegistry.register(dummyTool({ name: '' }))).toThrow(
      'Tool registry: nome da tool não pode estar vazio'
    );
  });

  it.each(['Foo', 'foo-bar', '1foo', '_foo', 'Foo_Bar', 'foo bar', 'foo.bar'])(
    'lança em nome inválido %s',
    (invalidName) => {
      expect(() =>
        toolRegistry.register(dummyTool({ name: invalidName }))
      ).toThrow(/inválido — usar snake_case lowercase/);
    }
  );

  it('lança em nome duplicado', () => {
    toolRegistry.register(dummyTool({ name: 'tool_a' }));
    expect(() => toolRegistry.register(dummyTool({ name: 'tool_a' }))).toThrow(
      'Tool registry: tool "tool_a" já registada — usar unregister() primeiro ou escolher outro nome'
    );
  });

  it('aceita nomes válidos snake_case', () => {
    expect(() =>
      toolRegistry.register(dummyTool({ name: 'criar_tarefa' }))
    ).not.toThrow();
    toolRegistry.clear();
    expect(() =>
      toolRegistry.register(dummyTool({ name: 'tool_v2_with_numbers123' }))
    ).not.toThrow();
  });

  // Story 8.1 (AC8, C9, ADR-10 §7.1) — guard de comprimento ≤64 (limite OpenAI).
  it('lança em nome > 64 caracteres (limite OpenAI)', () => {
    // 65 chars snake_case válido no padrão mas demasiado longo.
    const longName = 'a' + '_a'.repeat(32); // 'a' + 64 = 65 chars
    expect(longName.length).toBe(65);
    expect(() =>
      toolRegistry.register(dummyTool({ name: longName }))
    ).toThrow(/excede 64 caracteres/);
  });

  it('aceita nome de exactamente 64 caracteres (limite incl.)', () => {
    const name64 = 'a' + 'b'.repeat(63); // 64 chars
    expect(name64.length).toBe(64);
    expect(() =>
      toolRegistry.register(dummyTool({ name: name64 }))
    ).not.toThrow();
  });

  it('nomes actuais (snake_case curtos) passam o guard de comprimento', () => {
    for (const name of [
      'listar_tarefas',
      'processar_recibo',
      'pesquisar_web_e_criar_nota',
    ]) {
      toolRegistry.clear();
      expect(() =>
        toolRegistry.register(dummyTool({ name }))
      ).not.toThrow();
    }
  });
});

describe('ToolRegistry — unregister', () => {
  beforeEach(() => {
    toolRegistry.clear();
  });

  it('unregister(name) retorna true para nome existente e remove', () => {
    toolRegistry.register(dummyTool({ name: 'tool_a' }));
    expect(toolRegistry.unregister('tool_a')).toBe(true);
    expect(toolRegistry.has('tool_a')).toBe(false);
  });

  it('unregister(name) retorna false para nome inexistente', () => {
    expect(toolRegistry.unregister('inexistente')).toBe(false);
  });
});

describe('ToolRegistry — byDomain', () => {
  beforeEach(() => {
    toolRegistry.clear();
  });

  it('filtra correctamente com múltiplos domínios', () => {
    const t1 = dummyTool({ name: 'criar_tarefa', domain: 'tasks' });
    const t2 = dummyTool({ name: 'completar_tarefa', domain: 'tasks' });
    const t3 = dummyTool({ name: 'consultar_balanco', domain: 'meta' });
    toolRegistry.register(t1);
    toolRegistry.register(t2);
    toolRegistry.register(t3);

    expect(toolRegistry.byDomain('tasks')).toEqual([t1, t2]);
    expect(toolRegistry.byDomain('meta')).toEqual([t3]);
    expect(toolRegistry.byDomain('finance')).toEqual([]);
  });
});

describe('ToolRegistry — toAnthropicTools (happy path)', () => {
  beforeEach(() => {
    toolRegistry.clear();
  });

  it('converte schema Zod real para shape SDK Anthropic válido', () => {
    const tool = dummyTool({
      name: 'criar_tarefa',
      description: 'Cria uma nova tarefa',
      argsSchema: z.object({
        titulo: z.string(),
        prazo: z.string().nullable(),
        prioridade: z.enum(['alta', 'media', 'baixa']),
      }),
    });
    toolRegistry.register(tool);

    const result = toolRegistry.toAnthropicTools();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('criar_tarefa');
    expect(result[0].description).toBe('Cria uma nova tarefa');
    expect(result[0].input_schema.type).toBe('object');
    expect(result[0].input_schema.properties).toBeDefined();
    expect(result[0].input_schema.properties).toHaveProperty('titulo');
    expect(result[0].input_schema.properties).toHaveProperty('prazo');
    expect(result[0].input_schema.properties).toHaveProperty('prioridade');
  });

  it('toAnthropicTools(tools) aceita subset explícito', () => {
    const t1 = dummyTool({ name: 'tool_a' });
    const t2 = dummyTool({ name: 'tool_b' });
    toolRegistry.register(t1);
    toolRegistry.register(t2);

    const result = toolRegistry.toAnthropicTools([t1]);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('tool_a');
  });

  it('toolsToAnthropicShape (helper exportado) converte sem instanciar registry', () => {
    const t = dummyTool({ name: 'tool_x' });
    const result = toolsToAnthropicShape([t]);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('tool_x');
    expect(result[0].input_schema.type).toBe('object');
  });

  it('toolsToAnthropicShape([]) retorna []', () => {
    expect(toolsToAnthropicShape([])).toEqual([]);
  });
});

describe('Story 8.1 — toolsToOpenAIShape envelope (AC6, C6)', () => {
  it('produz envelope { type:"function", function:{ name, description, parameters } }', () => {
    const tool = dummyTool({
      name: 'criar_tarefa',
      description: 'Cria uma nova tarefa',
      argsSchema: z.object({
        titulo: z.string(),
        prazo: z.string().nullable(),
        prioridade: z.enum(['alta', 'media', 'baixa']),
      }),
    });

    const result = toolsToOpenAIShape([tool]);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('function');
    expect(result[0].function.name).toBe('criar_tarefa');
    expect(result[0].function.description).toBe('Cria uma nova tarefa');
    expect(result[0].function.parameters.type).toBe('object');
    expect(result[0].function.parameters.properties).toHaveProperty('titulo');
    expect(result[0].function.parameters.properties).toHaveProperty('prazo');
    expect(result[0].function.parameters.properties).toHaveProperty(
      'prioridade',
    );
  });

  it('toolsToOpenAIShape([]) retorna []', () => {
    expect(toolsToOpenAIShape([])).toEqual([]);
  });

  it('aceita subset explícito de tools', () => {
    const t1 = dummyTool({ name: 'tool_a' });
    const t2 = dummyTool({ name: 'tool_b' });
    const result = toolsToOpenAIShape([t2]);
    expect(result).toHaveLength(1);
    expect(result[0].function.name).toBe('tool_b');
  });
});

describe('Story 8.1 — parity parameters === input_schema (AC7, C7 falsificável)', () => {
  it('function.parameters (OpenAI) deep-equals input_schema (Anthropic) para a mesma tool', () => {
    // Schema rico para exercer properties/required/enum/nullable — se as duas
    // conversões divergissem no JSON Schema, este deep-equal falharia.
    const tool = dummyTool({
      name: 'tool_parity',
      description: 'Tool para comparar conversões',
      argsSchema: z.object({
        titulo: z.string().min(1),
        quantidade: z.number().int(),
        categoria: z.enum(['a', 'b', 'c']),
        nota: z.string().optional(),
        valido: z.boolean(),
      }),
    });

    const anthropic = toolsToAnthropicShape([tool]);
    const openai = toolsToOpenAIShape([tool]);

    expect(openai[0].function.parameters).toEqual(anthropic[0].input_schema);
  });
});

describe('Story 8.1 — toolsToOpenAIShape FAIL-LOUD em shape inesperado (AC6, C8)', () => {
  it('lança identificando a tool culpada quando schema não é object', () => {
    const malformedTool = dummyTool({
      name: 'tool_openai_malformed',
      argsSchema: z.string() as unknown as z.ZodObject<z.ZodRawShape>,
    });

    expect(() => toolsToOpenAIShape([malformedTool])).toThrow(
      /tool "tool_openai_malformed"/,
    );
    expect(() => toolsToOpenAIShape([malformedTool])).toThrow(/envelope OpenAI/);
  });
});

describe('Story 8.1 — toolsToOpenAIShape guard de nome no caminho puro (CR Iter 1 Major)', () => {
  // O caminho `toolsToOpenAIShape()` NÃO passa por `register()`. Sem este guard,
  // um nome inválido geraria um payload OpenAI inválido que só falharia na
  // fronteira do provider. `assertValidToolName` fecha a classe de falha aqui.
  it('lança em nome > 64 caracteres (limite OpenAI) sem passar por register()', () => {
    const longName = 'a' + '_a'.repeat(32); // 65 chars
    expect(longName.length).toBe(65);
    const tool = dummyTool({ name: longName });
    expect(() => toolsToOpenAIShape([tool])).toThrow(/excede 64 caracteres/);
  });

  it('lança em nome não-snake_case sem passar por register()', () => {
    const tool = dummyTool({ name: 'Foo-Bar' });
    expect(() => toolsToOpenAIShape([tool])).toThrow(
      /inválido — usar snake_case lowercase/,
    );
  });

  it('lança em nome vazio sem passar por register()', () => {
    const tool = dummyTool({ name: '' });
    expect(() => toolsToOpenAIShape([tool])).toThrow(
      'Tool registry: nome da tool não pode estar vazio',
    );
  });

  it('nome válido de exactamente 64 caracteres converte sem lançar', () => {
    const name64 = 'a' + 'b'.repeat(63); // 64 chars
    expect(name64.length).toBe(64);
    const tool = dummyTool({ name: name64 });
    expect(() => toolsToOpenAIShape([tool])).not.toThrow();
  });
});

describe('ToolRegistry — toAnthropicTools FAIL-LOUD (AC5)', () => {
  beforeEach(() => {
    toolRegistry.clear();
  });

  it('lança quando argsSchema produz shape com type !== "object" (z.string())', () => {
    // Cast TypeScript: argsSchema é z.ZodObject<z.ZodRawShape> mas em runtime
    // testamos o branch defensivo se algum dev contornar via cast.
    const malformedTool = dummyTool({
      name: 'tool_malformed',
      argsSchema: z.string() as unknown as z.ZodObject<z.ZodRawShape>,
    });

    expect(() => toolsToAnthropicShape([malformedTool])).toThrow(
      /Tool registry: zodToJsonSchema produziu shape inesperado para tool "tool_malformed"/
    );
  });

  it('lança quando argsSchema produz shape array (z.array)', () => {
    const malformedTool = dummyTool({
      name: 'tool_array',
      argsSchema: z.array(z.string()) as unknown as z.ZodObject<z.ZodRawShape>,
    });

    expect(() => toolsToAnthropicShape([malformedTool])).toThrow(
      /Tool registry: zodToJsonSchema produziu shape inesperado para tool "tool_array"/
    );
  });

  it('mensagem de erro contém nome da tool culpada e shape recebido', () => {
    const malformedTool = dummyTool({
      name: 'tool_explicado',
      argsSchema: z.number() as unknown as z.ZodObject<z.ZodRawShape>,
    });

    try {
      toolsToAnthropicShape([malformedTool]);
      expect.fail('Esperado throw');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      expect(message).toContain('tool_explicado');
      expect(message).toContain('esperado { type: "object", ... }');
      expect(message).toContain('recebido:');
    }
  });
});

describe('ToolRegistry — toAnthropicTools FAIL-LOUD com mock zodToJsonSchema retornando null', () => {
  // Isolamos este describe num bloco separado para mockar `zod-to-json-schema`.
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('zod-to-json-schema');
    vi.resetModules();
  });

  it('lança quando zodToJsonSchema retorna null (defensivo)', async () => {
    vi.doMock('zod-to-json-schema', () => ({
      zodToJsonSchema: vi.fn(() => null),
    }));

    const { toolsToAnthropicShape: mockedShape } = await import(
      '@/lib/agent/tools/registry'
    );
    const tool = dummyTool({ name: 'tool_null' });

    expect(() => mockedShape([tool])).toThrow(
      /Tool registry: zodToJsonSchema produziu shape inesperado para tool "tool_null"/
    );
  });
});

describe('defineTool (validação runtime)', () => {
  it('retorna def válida sem alterar', () => {
    const tool = dummyTool({ name: 'tool_valida' });
    const result = defineTool(tool);
    expect(result).toBe(tool);
  });

  it('lança ZodError quando resultSchema ausente', () => {
    const malformed = {
      name: 'tool_x',
      description: 'desc',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      // resultSchema: ausente!
      requiresPreview: false,
      reversible: false,
      execute: vi.fn(),
    } as unknown as ToolDefinition;

    expect(() => defineTool(malformed)).toThrow();
  });

  it('lança ZodError quando requiresPreview ausente', () => {
    const malformed = {
      name: 'tool_x',
      description: 'desc',
      domain: 'meta',
      argsSchema: z.object({ x: z.string() }),
      resultSchema: z.object({ ok: z.boolean() }),
      // requiresPreview: ausente!
      reversible: false,
      execute: vi.fn(),
    } as unknown as ToolDefinition;

    expect(() => defineTool(malformed)).toThrow();
  });

  it('lança ZodError quando argsSchema não é ZodObject', () => {
    const malformed = dummyTool({
      argsSchema: z.string() as unknown as z.ZodObject<z.ZodRawShape>,
    });

    expect(() => defineTool(malformed)).toThrow(
      /argsSchema deve ser z\.ZodObject/
    );
  });

  it('lança ZodError quando execute não é função', () => {
    const malformed = dummyTool({
      execute: 'não é função' as unknown as ToolDefinition['execute'],
    });

    expect(() => defineTool(malformed)).toThrow(/execute deve ser função/);
  });

  it('aceita reverse opcional ausente', () => {
    const tool = dummyTool();
    expect(() => defineTool(tool)).not.toThrow();
  });
});

describe('ToolRegistry — instance isolation (clear)', () => {
  it('clear() entre tests não afecta instâncias separadas', () => {
    const r1 = new ToolRegistry();
    const r2 = new ToolRegistry();

    r1.register(dummyTool({ name: 'tool_r1' }));
    r2.register(dummyTool({ name: 'tool_r2' }));

    expect(r1.all()).toHaveLength(1);
    expect(r2.all()).toHaveLength(1);

    r1.clear();
    expect(r1.all()).toEqual([]);
    expect(r2.all()).toHaveLength(1);
  });

  it('singleton clear() limpa entre tests', () => {
    toolRegistry.clear();
    expect(toolRegistry.all()).toEqual([]);
    toolRegistry.register(dummyTool({ name: 'tool_singleton' }));
    expect(toolRegistry.all()).toHaveLength(1);
    toolRegistry.clear();
    expect(toolRegistry.all()).toEqual([]);
  });
});
