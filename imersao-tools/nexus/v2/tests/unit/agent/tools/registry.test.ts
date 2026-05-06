import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  defineTool,
  ToolRegistry,
  toolRegistry,
  toolsToAnthropicShape,
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
