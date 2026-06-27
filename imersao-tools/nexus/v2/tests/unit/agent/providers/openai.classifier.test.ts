import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
} from 'vitest';
import { z } from 'zod';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { OpenAIClassifier } from '@/lib/agent/providers/openai';
import { getClassifier } from '@/lib/agent/providers/factory';

/**
 * Nexus v2 — OpenAIClassifier tests (Story 8.3 / ADR-10 S3)
 *
 * Cobertura (cenários C1-C10 da Testing section da story):
 * - C1  JSON válido → ClassificationResult correcto;
 * - C2  multi-intent (≥2 domínios) + confidence per-intent (obrigatório, ADR-10 §6.3);
 * - C3  FALSIFICÁVEL: usage mapeada de `prompt_tokens`/`completion_tokens`
 *       (falharia se lesse os nomes Anthropic `input_tokens`/`output_tokens`);
 * - C4  conteúdo não-JSON (defensivo, mesmo com json_object) → Error PT-PT;
 * - C5  shape sem `intents` → ZodError (AC4);
 * - C6  default model `gpt-4.1-mini` quando `opts.model` ausente (AC6);
 * - C7  inputs vazios → Error PT-PT (AC7);
 * - C8  `response_format:{type:'json_object'}` presente no request (AC2);
 * - C9  factory `LLM_PROVIDER=openai` → `getClassifier()` devolve OpenAIClassifier (AC9);
 * - C10 factory `LLM_PROVIDER=openai` + key ausente → fail-loud PT-PT (AC9).
 *
 * O handler MSW é **non-streaming** (`{choices:[{message:{content}}],usage}`) e
 * vive LOCAL neste test file via `server.use(...)` — NÃO toca o handler streaming
 * da 8.2 em `handlers/openai.ts` (mesmo endpoint; a consolidação canónica é a 8.5).
 * Discrimina por magic string no conteúdo da última mensagem `user`.
 */

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const MOCK_OPENAI_KEY = 'sk-openai-mock-test-key-1234567890';

/** Corpo do último request capturado pelo handler (para C6/C8). */
let lastRequestBody: {
  model?: string;
  response_format?: unknown;
  max_completion_tokens?: number;
  temperature?: number;
  messages?: Array<{ role: string; content: string | null }>;
} | null = null;

afterEach(() => {
  lastRequestBody = null;
});

interface ClassifierFixture {
  content: string;
  promptTokens: number;
  completionTokens: number;
}

/** Resposta non-streaming canónica OpenAI Chat Completions (`ChatCompletion`). */
function chatCompletionJson(model: string, fixture: ClassifierFixture) {
  return HttpResponse.json({
    id: 'chatcmpl_clf_mock_8_3',
    object: 'chat.completion',
    created: 1700000000,
    model,
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content: fixture.content },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: fixture.promptTokens,
      completion_tokens: fixture.completionTokens,
      total_tokens: fixture.promptTokens + fixture.completionTokens,
    },
  });
}

/**
 * Regista o handler non-streaming local. Captura o body e discrimina a fixture
 * pela magic string no conteúdo da última mensagem `user`.
 */
function useClassifierHandler(): void {
  server.use(
    http.post(
      'https://api.openai.com/v1/chat/completions',
      async ({ request }) => {
        const body = (await request.json()) as NonNullable<typeof lastRequestBody>;
        lastRequestBody = body;
        const model = body.model ?? 'unknown';

        const userMsgs = (body.messages ?? []).filter((m) => m.role === 'user');
        const last = userMsgs[userMsgs.length - 1];
        const userText = typeof last?.content === 'string' ? last.content : '';

        let fixture: ClassifierFixture;
        if (userText.includes('MOCK_CLF_MULTI')) {
          fixture = {
            content:
              '{"intents":["criar_tarefa","criar_evento_calendar"],"confidence":{"criar_tarefa":0.92,"criar_evento_calendar":0.85}}',
            promptTokens: 64,
            completionTokens: 28,
          };
        } else if (userText.includes('MOCK_CLF_USAGE')) {
          fixture = {
            content: '{"intents":["finance"],"confidence":{"finance":0.7}}',
            promptTokens: 77,
            completionTokens: 33,
          };
        } else if (userText.includes('MOCK_CLF_NOT_JSON')) {
          fixture = {
            content: 'isto não é JSON de todo — texto livre do modelo',
            promptTokens: 10,
            completionTokens: 6,
          };
        } else if (userText.includes('MOCK_CLF_NO_INTENTS')) {
          fixture = {
            content: '{"confidence":{"tasks":0.5}}',
            promptTokens: 12,
            completionTokens: 4,
          };
        } else if (userText.includes('MOCK_CLF_NULL')) {
          // `JSON.parse('null')` é válido mas não é um objecto — caminho
          // defensivo (CR Iter 1 minor): converte num fail-loud PT-PT limpo.
          fixture = { content: 'null', promptTokens: 8, completionTokens: 2 };
        } else if (userText.includes('MOCK_CLF_FENCED')) {
          fixture = {
            content:
              '```json\n{"intents":["calendar"],"confidence":{"calendar":0.91}}\n```',
            promptTokens: 20,
            completionTokens: 10,
          };
        } else {
          // Fallback (inclui MOCK_CLF_VALID) → single-intent válido.
          fixture = {
            content:
              '{"intents":["criar_tarefa"],"confidence":{"criar_tarefa":0.88}}',
            promptTokens: 80,
            completionTokens: 40,
          };
        }

        return chatCompletionJson(model, fixture);
      }
    )
  );
}

describe('OpenAIClassifier — JSON válido (C1)', () => {
  beforeEach(() => useClassifierHandler());

  it('devolve ClassificationResult correcto (intents/confidence/rawResponse/usage)', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    const result = await classifier.classify(
      'system prompt classifier PT-PT',
      'MOCK_CLF_VALID paguei 50 euros gasolina'
    );

    expect(result.intents).toEqual(['criar_tarefa']);
    expect(result.confidence).toEqual({ criar_tarefa: 0.88 });
    expect(result.rawResponse).toContain('intents');
    expect(result.inputTokens).toBe(80);
    expect(result.outputTokens).toBe(40);
  });
});

describe('OpenAIClassifier — multi-intent (C2, obrigatório)', () => {
  beforeEach(() => useClassifierHandler());

  it('intents com ≥2 domínios + confidence per-intent', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    const result = await classifier.classify(
      'system prompt classifier PT-PT',
      'MOCK_CLF_MULTI marca reunião amanhã e cria tarefa de preparar slides'
    );

    expect(result.intents.length).toBeGreaterThanOrEqual(2);
    expect(result.intents).toEqual(['criar_tarefa', 'criar_evento_calendar']);
    expect(result.confidence).toEqual({
      criar_tarefa: 0.92,
      criar_evento_calendar: 0.85,
    });
    // Cada intent tem um score per-intent.
    for (const intent of result.intents) {
      expect(typeof result.confidence[intent]).toBe('number');
    }
  });
});

describe('OpenAIClassifier — usage mapeada FALSIFICÁVEL (C3)', () => {
  beforeEach(() => useClassifierHandler());

  it('inputTokens===prompt_tokens, outputTokens===completion_tokens', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    const result = await classifier.classify(
      'system prompt classifier PT-PT',
      'MOCK_CLF_USAGE paguei contas'
    );

    // FALSIFICÁVEL: o mock devolve `prompt_tokens:77`/`completion_tokens:33` (nomes
    // OpenAI). Se o classifier lesse os nomes Anthropic (`input_tokens`/
    // `output_tokens`), estes campos seriam `undefined` → ZodError no `.parse` e o
    // teste falharia. Os valores 77/33 (distintos e não-default) tornam impossível
    // um falso-positivo por coincidência.
    expect(result.inputTokens).toBe(77);
    expect(result.outputTokens).toBe(33);
    expect(result.intents).toEqual(['finance']);
  });
});

describe('OpenAIClassifier — conteúdo não-JSON defensivo (C4, AC8)', () => {
  beforeEach(() => useClassifierHandler());

  it('lança Error PT-PT com excerto do rawResponse', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    await expect(
      classifier.classify('system prompt', 'MOCK_CLF_NOT_JSON qualquer')
    ).rejects.toThrow(/não é JSON válido/);
  });
});

describe('OpenAIClassifier — shape inválido sem intents (C5, AC4)', () => {
  beforeEach(() => useClassifierHandler());

  it('lança ZodError quando o JSON não tem campo intents', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    await expect(
      classifier.classify('system prompt', 'MOCK_CLF_NO_INTENTS qualquer')
    ).rejects.toThrow(z.ZodError);
  });

  it('lança Error PT-PT quando o conteúdo é o literal `null` (parse válido, não-objecto)', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    await expect(
      classifier.classify('system prompt', 'MOCK_CLF_NULL qualquer')
    ).rejects.toThrow(/não é um objecto JSON/);
  });
});

describe('OpenAIClassifier — default model gpt-4.1-mini (C6, AC6)', () => {
  beforeEach(() => useClassifierHandler());

  it('usa DEFAULT_OPENAI_CLASSIFIER_MODEL quando opts.model ausente', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    await classifier.classify('system prompt', 'MOCK_CLF_VALID qualquer');

    expect(lastRequestBody?.model).toBe('gpt-4.1-mini');
    // temperature 0 (determinística) + default de tokens via `max_completion_tokens`
    // (NÃO `max_tokens`, deprecated — decisão Architect Gate da 8.2).
    expect(lastRequestBody?.temperature).toBe(0);
    expect(lastRequestBody?.max_completion_tokens).toBe(1024);
  });

  it('respeita opts.model / opts.temperature / opts.maxTokens override', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    await classifier.classify('system prompt', 'MOCK_CLF_VALID qualquer', {
      model: 'gpt-4.1',
      temperature: 0.3,
      maxTokens: 256,
    });

    expect(lastRequestBody?.model).toBe('gpt-4.1');
    expect(lastRequestBody?.temperature).toBe(0.3);
    expect(lastRequestBody?.max_completion_tokens).toBe(256);
  });
});

describe('OpenAIClassifier — inputs vazios fail-loud (C7, AC7)', () => {
  it('rejeita systemPrompt vazio', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    await expect(classifier.classify('', 'user prompt')).rejects.toThrow(
      /systemPrompt obrigatório/
    );
  });

  it('rejeita userPrompt vazio', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    await expect(classifier.classify('system prompt', '')).rejects.toThrow(
      /userPrompt obrigatório/
    );
  });
});

describe('OpenAIClassifier — response_format json_object no request (C8, AC2)', () => {
  beforeEach(() => useClassifierHandler());

  it('o body enviado à API inclui response_format:{type:json_object} + messages system/user', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    await classifier.classify(
      'system prompt classifier PT-PT',
      'MOCK_CLF_VALID qualquer'
    );

    expect(lastRequestBody?.response_format).toEqual({ type: 'json_object' });
    // System prompt como mensagem role:'system', user prompt como role:'user'.
    expect(lastRequestBody?.messages?.[0]).toEqual({
      role: 'system',
      content: 'system prompt classifier PT-PT',
    });
    expect(lastRequestBody?.messages?.[1]).toEqual({
      role: 'user',
      content: 'MOCK_CLF_VALID qualquer',
    });
  });
});

describe('OpenAIClassifier — strip defensivo de fences (AC3)', () => {
  beforeEach(() => useClassifierHandler());

  it('parseia JSON envolvido em ```json … ``` (regressão de modelo defensiva); rawResponse preserva fences', async () => {
    const classifier = new OpenAIClassifier(MOCK_OPENAI_KEY);
    const result = await classifier.classify(
      'system prompt',
      'MOCK_CLF_FENCED qualquer'
    );

    expect(result.intents).toEqual(['calendar']);
    expect(result.confidence).toEqual({ calendar: 0.91 });
    // rawResponse preserva o conteúdo ORIGINAL (com fences) — paridade Anthropic.
    expect(result.rawResponse).toContain('```json');
  });
});

describe('OpenAIClassifier — factory (C9/C10, AC9)', () => {
  const TOUCHED = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'LLM_PROVIDER',
    'NEXT_PUBLIC_LLM_PROVIDER',
  ] as const;
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const k of TOUCHED) saved[k] = process.env[k];
    process.env.LLM_PROVIDER = 'openai';
    process.env.NEXT_PUBLIC_LLM_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = MOCK_OPENAI_KEY;
  });

  afterEach(() => {
    for (const k of TOUCHED) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('C9 — LLM_PROVIDER=openai → getClassifier devolve OpenAIClassifier (não fail-loud)', () => {
    const classifier = getClassifier();
    expect(classifier).toBeInstanceOf(OpenAIClassifier);
    expect(typeof classifier.classify).toBe('function');
  });

  it('C10 — LLM_PROVIDER=openai + OPENAI_API_KEY ausente → fail-loud PT-PT', () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => getClassifier()).toThrowError(/OPENAI_API_KEY não configurada/);
  });

  it('C10 — OPENAI_API_KEY whitespace-only → fail-loud PT-PT', () => {
    process.env.OPENAI_API_KEY = '   ';
    expect(() => getClassifier()).toThrowError(/OPENAI_API_KEY não configurada/);
  });
});
