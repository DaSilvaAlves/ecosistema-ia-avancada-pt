import { describe, it, expect } from 'vitest';
import { toOpenAIMessages } from '@/lib/agent/providers/openai';
import { EXECUTOR_SYSTEM_PROMPT } from '@/lib/agent/prompts/executor-system';
import type { LLMMessage } from '@/lib/agent/providers/types';

/**
 * Nexus v2 — toOpenAIMessages tests (Story 8.2 / ADR-10 S2)
 *
 * Cobertura: AC8 (4 regras §4.3 + fail-loud toolCallId), AC9 (round-trip
 * `id`↔`tool_call_id` falsificável multi-tool).
 *
 * Função pura (sem MSW). Verifica o mapeamento `LLMMessage[]` → mensagens OpenAI.
 */

describe('toOpenAIMessages — regra 1: system prompt prepended (AC8)', () => {
  it('prepend { role:"system", content: EXECUTOR_SYSTEM_PROMPT } como 1.º elemento', () => {
    const out = toOpenAIMessages([{ role: 'user', content: 'olá' }]);
    expect(out[0]).toEqual({ role: 'system', content: EXECUTOR_SYSTEM_PROMPT });
  });
});

describe('toOpenAIMessages — regra 4: texto simples passa directo (AC8)', () => {
  it('user/assistant com content string passam directo', () => {
    const messages: LLMMessage[] = [
      { role: 'user', content: 'cria uma tarefa' },
      { role: 'assistant', content: 'feito' },
    ];
    const out = toOpenAIMessages(messages);
    expect(out[1]).toEqual({ role: 'user', content: 'cria uma tarefa' });
    expect(out[2]).toEqual({ role: 'assistant', content: 'feito' });
  });
});

describe('toOpenAIMessages — regra 2: resultado de tool (AC8)', () => {
  it('role:"tool" → { role:"tool", tool_call_id, content }', () => {
    const messages: LLMMessage[] = [
      { role: 'tool', content: '{"ok":true}', toolCallId: 'call_xyz' },
    ];
    const out = toOpenAIMessages(messages);
    expect(out[1]).toEqual({
      role: 'tool',
      tool_call_id: 'call_xyz',
      content: '{"ok":true}',
    });
  });

  it('fail-loud PT-PT quando role:"tool" sem toolCallId (C9)', () => {
    const messages: LLMMessage[] = [
      // toolCallId ausente — o schema permitiria construir o objecto, mas o
      // mapper recusa (a OpenAI rejeita role:"tool" órfã).
      { role: 'tool', content: 'resultado' } as LLMMessage,
    ];
    expect(() => toOpenAIMessages(messages)).toThrow(/role "tool" requerem toolCallId/);
  });

  it('serializa content não-string defensivamente', () => {
    const messages: LLMMessage[] = [
      {
        role: 'tool',
        content: [{ type: 'text', text: 'x' }],
        toolCallId: 'call_arr',
      },
    ];
    const out = toOpenAIMessages(messages);
    expect(out[1]).toEqual({
      role: 'tool',
      tool_call_id: 'call_arr',
      content: JSON.stringify([{ type: 'text', text: 'x' }]),
    });
  });
});

describe('toOpenAIMessages — regra 3: assistant com tool_use (AC8/AC9)', () => {
  it('bloco tool_use → tool_calls com id preservado e arguments serializados', () => {
    const messages: LLMMessage[] = [
      {
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'call_keep_01',
            name: 'criar_tarefa',
            input: { titulo: 'Comprar pão' },
          },
        ],
      },
    ];
    const out = toOpenAIMessages(messages);
    expect(out[1]).toEqual({
      role: 'assistant',
      content: null,
      tool_calls: [
        {
          id: 'call_keep_01',
          type: 'function',
          function: { name: 'criar_tarefa', arguments: '{"titulo":"Comprar pão"}' },
        },
      ],
    });
  });

  it('assistant com text + tool_use → content texto + tool_calls', () => {
    const messages: LLMMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'A chamar a tool.' },
          { type: 'tool_use', id: 'call_mix', name: 'listar', input: {} },
        ],
      },
    ];
    const out = toOpenAIMessages(messages);
    expect(out[1]).toEqual({
      role: 'assistant',
      content: 'A chamar a tool.',
      tool_calls: [
        {
          id: 'call_mix',
          type: 'function',
          function: { name: 'listar', arguments: '{}' },
        },
      ],
    });
  });
});

describe('toOpenAIMessages — round-trip id↔tool_call_id multi-tool (AC9, falsificável)', () => {
  it('o id do tool_use reaparece intacto como tool_calls[].id E tool_call_id', () => {
    // Cenário multi-tool: assistant emite 2 tool_use; a ronda seguinte injecta 2
    // role:"tool" com os MESMOS ids. O round-trip tem de fechar — senão a OpenAI
    // rejeitaria a mensagem role:"tool" órfã.
    const messages: LLMMessage[] = [
      { role: 'user', content: 'cria tarefa e evento' },
      {
        role: 'assistant',
        content: [
          { type: 'tool_use', id: 'call_id_A', name: 'criar_tarefa', input: { titulo: 'A' } },
          {
            type: 'tool_use',
            id: 'call_id_B',
            name: 'criar_evento_calendar',
            input: { local: 'B' },
          },
        ],
      },
      { role: 'tool', content: '{"id":"t1"}', toolCallId: 'call_id_A' },
      { role: 'tool', content: '{"id":"e1"}', toolCallId: 'call_id_B' },
    ];

    const out = toOpenAIMessages(messages);

    // out[0]=system, out[1]=user, out[2]=assistant(tool_calls), out[3]/out[4]=tool
    const assistantMsg = out[2];
    expect(assistantMsg.role).toBe('assistant');
    if (assistantMsg.role === 'assistant') {
      const ids = (assistantMsg.tool_calls ?? []).map((t) => t.id);
      // FALSIFICÁVEL: falharia se o mapper gerasse novos ids ou perdesse a ordem.
      expect(ids).toEqual(['call_id_A', 'call_id_B']);
    }

    const toolA = out[3];
    const toolB = out[4];
    expect(toolA.role).toBe('tool');
    expect(toolB.role).toBe('tool');
    if (toolA.role === 'tool') expect(toolA.tool_call_id).toBe('call_id_A');
    if (toolB.role === 'tool') expect(toolB.tool_call_id).toBe('call_id_B');

    // Cada tool_call_id da ronda seguinte corresponde a um tool_calls[].id da
    // mensagem assistant anterior (contrato OpenAI).
    if (assistantMsg.role === 'assistant') {
      const assistantIds = new Set((assistantMsg.tool_calls ?? []).map((t) => t.id));
      if (toolA.role === 'tool') expect(assistantIds.has(toolA.tool_call_id)).toBe(true);
      if (toolB.role === 'tool') expect(assistantIds.has(toolB.tool_call_id)).toBe(true);
    }
  });
});
