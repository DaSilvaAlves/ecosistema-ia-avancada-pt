import { describe, it, expect } from 'vitest';
import {
  AgentRunSchema,
  ChatMessageSchema,
  ToolCallSchema,
  AgentRunStatusSchema,
} from '@/lib/agent/schemas';

/**
 * Nexus v2 — Zod schemas tests (Story 1.1)
 *
 * Foco em casos NEGATIVOS: garantir que dados inválidos são rejeitados antes
 * de atingir Dexie. Casos positivos validados implicitamente em repos.test.ts.
 */

const VALID_TOOL_CALL = {
  toolName: 'criar_tarefa',
  args: { titulo: 'Teste' },
  result: { id: 'abc' },
  durationMs: 120,
  reverted: false,
};

const VALID_AGENT_RUN = {
  id: '11111111-2222-3333-4444-555555555555',
  timestamp: 1700000000000,
  prompt: 'amanhã reunião 15h',
  intents: ['criar_tarefa'],
  toolCalls: [VALID_TOOL_CALL],
  status: 'success' as const,
  durationMs: 1500,
  modelClassifier: 'claude-haiku-4-5-20251001',
  modelExecutor: 'claude-sonnet-4-6',
  inputTokens: 100,
  outputTokens: 200,
};

const VALID_CHAT_MESSAGE = {
  id: '99999999-8888-7777-6666-555555555555',
  conversationId: 'main',
  role: 'user' as const,
  content: 'olá',
  timestamp: 1700000000000,
};

describe('AgentRunSchema (Story 1.1 / AC10)', () => {
  it('aceita AgentRun válido', () => {
    expect(() => AgentRunSchema.parse(VALID_AGENT_RUN)).not.toThrow();
  });

  it('rejeita AgentRun sem toolCalls', () => {
    const invalid = { ...VALID_AGENT_RUN } as Partial<typeof VALID_AGENT_RUN>;
    delete invalid.toolCalls;
    expect(() => AgentRunSchema.parse(invalid)).toThrow();
  });

  it('rejeita status fora do enum', () => {
    const invalid = { ...VALID_AGENT_RUN, status: 'unknown' };
    expect(() => AgentRunSchema.parse(invalid)).toThrow();
  });

  it('rejeita id que não é UUID', () => {
    const invalid = { ...VALID_AGENT_RUN, id: 'not-a-uuid' };
    expect(() => AgentRunSchema.parse(invalid)).toThrow();
  });

  it('rejeita prompt vazio', () => {
    const invalid = { ...VALID_AGENT_RUN, prompt: '' };
    expect(() => AgentRunSchema.parse(invalid)).toThrow(/prompt é obrigatório/i);
  });

  it('rejeita inputTokens negativo', () => {
    const invalid = { ...VALID_AGENT_RUN, inputTokens: -1 };
    expect(() => AgentRunSchema.parse(invalid)).toThrow();
  });
});

describe('ChatMessageSchema (Story 1.1 / AC10)', () => {
  it('aceita ChatMessage válido', () => {
    expect(() => ChatMessageSchema.parse(VALID_CHAT_MESSAGE)).not.toThrow();
  });

  it('rejeita ChatMessage sem conversationId', () => {
    const invalid = { ...VALID_CHAT_MESSAGE } as Partial<typeof VALID_CHAT_MESSAGE>;
    delete invalid.conversationId;
    expect(() => ChatMessageSchema.parse(invalid)).toThrow();
  });

  it('rejeita conversationId vazio', () => {
    const invalid = { ...VALID_CHAT_MESSAGE, conversationId: '' };
    expect(() => ChatMessageSchema.parse(invalid)).toThrow();
  });

  it('rejeita role inválido', () => {
    const invalid = { ...VALID_CHAT_MESSAGE, role: 'system' };
    expect(() => ChatMessageSchema.parse(invalid)).toThrow();
  });
});

describe('ToolCallSchema (Story 1.1 / AC10)', () => {
  it('aceita ToolCall com args/result unknown', () => {
    expect(() => ToolCallSchema.parse(VALID_TOOL_CALL)).not.toThrow();
  });

  it('rejeita toolName vazio', () => {
    const invalid = { ...VALID_TOOL_CALL, toolName: '' };
    expect(() => ToolCallSchema.parse(invalid)).toThrow();
  });

  it('rejeita durationMs negativo', () => {
    const invalid = { ...VALID_TOOL_CALL, durationMs: -1 };
    expect(() => ToolCallSchema.parse(invalid)).toThrow();
  });
});

describe('AgentRunStatusSchema', () => {
  it('aceita os 4 valores canónicos', () => {
    expect(() => AgentRunStatusSchema.parse('success')).not.toThrow();
    expect(() => AgentRunStatusSchema.parse('partial')).not.toThrow();
    expect(() => AgentRunStatusSchema.parse('failed')).not.toThrow();
    expect(() => AgentRunStatusSchema.parse('reverted')).not.toThrow();
  });
});
