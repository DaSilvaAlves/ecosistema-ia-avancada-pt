import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import { ALL_DOMAINS, classifyPrompt } from '@/lib/agent/classifier';
import {
  CLASSIFIER_OUTPUT_FORMAT_RULES,
  buildClassifierSystemPrompt,
} from '@/lib/agent/prompts/classifier-system';
import type { ToolDomain } from '@/lib/agent/tools/types';

/**
 * Story 1.4 — Classifier wrapper PT-PT tests.
 *
 * Cobre AC2-AC10. Sem MSW streaming (classifier é síncrono JSON), sem Dexie.
 * Magic strings injectadas como prefix do user prompt (handler MSW detecta
 * em system OU userMsgText — extensão Story 1.4 do handler Story 1.2).
 */

const MOCK_API_KEY = 'sk-ant-test-' + 'x'.repeat(40);

beforeAll(() => {
  process.env.ANTHROPIC_API_KEY = MOCK_API_KEY;
  server.listen();
});

afterEach(() => server.resetHandlers());

afterAll(() => {
  delete process.env.ANTHROPIC_API_KEY;
  server.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Input validation (AC3)
// ─────────────────────────────────────────────────────────────────────────────

describe('classifyPrompt — input validation', () => {
  it('lança erro PT-PT quando userPrompt é string vazia', async () => {
    await expect(classifyPrompt('')).rejects.toThrow(
      'Classifier: userPrompt obrigatório'
    );
  });

  it('lança erro PT-PT quando userPrompt é só whitespace', async () => {
    await expect(classifyPrompt('   \t\n  ')).rejects.toThrow(
      'Classifier: userPrompt obrigatório'
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Happy paths (AC2, AC6, AC8)
// ─────────────────────────────────────────────────────────────────────────────

describe('classifyPrompt — happy paths', () => {
  it('single-intent (tasks): retorna ClassificationResult válido com tokens', async () => {
    const result = await classifyPrompt(
      'MOCK_CLASSIFIER_TASKS::criar tarefa enviar relatório'
    );

    expect(result.intents).toEqual(['tasks']);
    expect(result.confidence).toEqual({ tasks: 0.95 });
    expect(result.inputTokens).toBe(80);
    expect(result.outputTokens).toBe(40);
    expect(result.rawResponse).toContain('"tasks"');
  });

  it('AC6 multi-intent benchmark (Epic 1 AC1: "amanhã reunião 15h, paguei €78,70 supermercado")', async () => {
    const result = await classifyPrompt(
      'MOCK_CLASSIFIER_MULTI_INTENT::amanhã reunião 15h, paguei €78,70 supermercado'
    );

    expect(result.intents).toEqual(['calendar', 'finance']);
    expect(result.confidence).toEqual({ calendar: 0.95, finance: 0.93 });
  });

  it('AC8 empty intents para prompt sem domínio relevante', async () => {
    const result = await classifyPrompt(
      'MOCK_CLASSIFIER_EMPTY::o céu é azul hoje'
    );

    expect(result.intents).toEqual([]);
    expect(result.confidence).toEqual({});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validação adicional fail-loud (AC4)
// ─────────────────────────────────────────────────────────────────────────────

describe('classifyPrompt — validação adicional (AC4)', () => {
  it('lança erro PT-PT quando intent fora de availableDomains', async () => {
    await expect(
      classifyPrompt('MOCK_CLASSIFIER_INVALID_DOMAIN::test')
    ).rejects.toThrow(
      /Classifier: intent "NOT_A_DOMAIN" não está em availableDomains/
    );
  });

  it('mensagem de erro de invalid domain inclui rawResponse truncado', async () => {
    try {
      await classifyPrompt('MOCK_CLASSIFIER_INVALID_DOMAIN::test');
      expect.fail('Esperado throw');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      expect(msg).toContain('NOT_A_DOMAIN');
      expect(msg).toContain('rawResponse:');
    }
  });

  it('lança erro PT-PT quando confidence > 1', async () => {
    await expect(
      classifyPrompt('MOCK_CLASSIFIER_OUT_OF_RANGE_CONFIDENCE_HIGH::test')
    ).rejects.toThrow(/confidence\["tasks"\] = 1\.5 fora do range \[0, 1\]/);
  });

  it('lança erro PT-PT quando confidence < 0', async () => {
    await expect(
      classifyPrompt('MOCK_CLASSIFIER_OUT_OF_RANGE_CONFIDENCE_LOW::test')
    ).rejects.toThrow(/confidence\["tasks"\] = -0\.2 fora do range \[0, 1\]/);
  });

  it('lança erro PT-PT quando confidence tem orphan key (sem intent correspondente)', async () => {
    await expect(
      classifyPrompt('MOCK_CLASSIFIER_ORPHAN_CONFIDENCE::test')
    ).rejects.toThrow(
      /confidence\["finance"\] não corresponde a intent declarado/
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// availableDomains subset (AC2, AC4)
// ─────────────────────────────────────────────────────────────────────────────

describe('classifyPrompt — availableDomains subset', () => {
  it('subset ["finance"] rejeita intent "tasks" do mock', async () => {
    // Handler retorna {intents:['tasks']}; wrapper deve rejeitar porque
    // 'tasks' não está em availableDomains=['finance']
    await expect(
      classifyPrompt('MOCK_CLASSIFIER_TASKS::test', {
        availableDomains: ['finance'],
      })
    ).rejects.toThrow(/intent "tasks" não está em availableDomains/);
  });

  it('subset ["calendar"] rejeita "finance" do multi-intent benchmark', async () => {
    await expect(
      classifyPrompt('MOCK_CLASSIFIER_MULTI_INTENT::test', {
        availableDomains: ['calendar'],
      })
    ).rejects.toThrow(/intent "finance" não está em availableDomains/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildClassifierSystemPrompt standalone (AC1, AC5)
// ─────────────────────────────────────────────────────────────────────────────

describe('buildClassifierSystemPrompt', () => {
  it('defaults: inclui todos os 10 domains', () => {
    const prompt = buildClassifierSystemPrompt();
    const expectedDomains: ToolDomain[] = [
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
    ];
    for (const d of expectedDomains) {
      expect(prompt).toContain(`- ${d}:`);
    }
  });

  it('subset ["tasks", "finance"]: inclui só os passados na secção Domínios disponíveis', () => {
    const prompt = buildClassifierSystemPrompt(['tasks', 'finance']);
    expect(prompt).toContain('- tasks:');
    expect(prompt).toContain('- finance:');
    // Os outros domains NÃO aparecem na secção "Domínios disponíveis" (linha
    // após "Domínios disponíveis:" até linha em branco)
    const domainsSection = prompt
      .split('Domínios disponíveis:')[1]
      ?.split('\n\n')[0];
    expect(domainsSection).toBeDefined();
    expect(domainsSection).not.toContain('- habits:');
    expect(domainsSection).not.toContain('- meta:');
  });

  it('inclui few-shot examples (multi-intent benchmark + empty + low-confidence)', () => {
    const prompt = buildClassifierSystemPrompt();
    // AC6 benchmark
    expect(prompt).toContain('amanhã reunião 15h com cliente');
    expect(prompt).toContain('"calendar","finance"');
    // AC7 low-confidence
    expect(prompt).toContain('reunião amanhã ou na quarta');
    expect(prompt).toMatch(/calendar":\s*0\.55/);
    // AC8 empty
    expect(prompt).toContain('"intents":[],"confidence":{}');
  });

  it('inclui SF-1 PT-BR + typo example ("vamos deletar a tarefa antigua")', () => {
    const prompt = buildClassifierSystemPrompt();
    expect(prompt).toContain('vamos deletar a tarefa antigua');
  });

  it('inclui CLASSIFIER_OUTPUT_FORMAT_RULES (regras canónicas reutilizáveis)', () => {
    const prompt = buildClassifierSystemPrompt();
    expect(prompt).toContain(CLASSIFIER_OUTPUT_FORMAT_RULES);
    expect(CLASSIFIER_OUTPUT_FORMAT_RULES).toContain('intents');
    expect(CLASSIFIER_OUTPUT_FORMAT_RULES).toContain('confidence');
    expect(CLASSIFIER_OUTPUT_FORMAT_RULES).toContain('[0, 1]');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pass-through opts (AC9)
// ─────────────────────────────────────────────────────────────────────────────

describe('classifyPrompt — pass-through opts (AC9)', () => {
  it('opts custom (model + maxTokens + temperature) chegam ao SDK Anthropic', async () => {
    let capturedBody:
      | { model?: string; max_tokens?: number; temperature?: number }
      | null = null;

    server.use(
      http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
        capturedBody = (await request.json()) as typeof capturedBody;
        return HttpResponse.json({
          id: 'msg_passthrough',
          type: 'message',
          role: 'assistant',
          model: capturedBody?.model ?? 'unknown',
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                intents: ['tasks'],
                confidence: { tasks: 0.9 },
              }),
            },
          ],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        });
      })
    );

    await classifyPrompt('teste pass-through', {
      model: 'claude-haiku-4-5-custom-snapshot',
      maxTokens: 1024,
      temperature: 0.3,
    });

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.model).toBe('claude-haiku-4-5-custom-snapshot');
    expect(capturedBody!.max_tokens).toBe(1024);
    expect(capturedBody!.temperature).toBe(0.3);
  });

  it('defaults (maxTokens=512, temperature=0) aplicados quando opts ausente', async () => {
    let capturedBody:
      | { max_tokens?: number; temperature?: number }
      | null = null;

    server.use(
      http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
        capturedBody = (await request.json()) as typeof capturedBody;
        return HttpResponse.json({
          id: 'msg_defaults',
          type: 'message',
          role: 'assistant',
          model: 'claude-haiku-4-5-20251001',
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                intents: ['tasks'],
                confidence: { tasks: 0.9 },
              }),
            },
          ],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        });
      })
    );

    await classifyPrompt('teste defaults');

    expect(capturedBody).not.toBeNull();
    expect(capturedBody!.max_tokens).toBe(512);
    expect(capturedBody!.temperature).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ALL_DOMAINS const sanity (AC2)
// ─────────────────────────────────────────────────────────────────────────────

describe('ALL_DOMAINS', () => {
  it('contém os 10 ToolDomain literais exactamente uma vez', () => {
    expect(ALL_DOMAINS).toHaveLength(10);
    const set = new Set<string>(ALL_DOMAINS);
    expect(set.size).toBe(10);
    const expected: ToolDomain[] = [
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
    ];
    for (const d of expected) {
      expect(set.has(d)).toBe(true);
    }
  });
});
