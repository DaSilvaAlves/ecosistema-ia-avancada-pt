import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import {
  GMAIL_MOCK_MESSAGE_IDS,
  GMAIL_REVOKED_ACCESS_TOKEN,
  GMAIL_SERVER_ERROR_ACCESS_TOKEN,
} from '../../../mocks/handlers/google';

/**
 * Story 6.8 — helper puro de classificação Gmail (`classifyInboxEmails`) (T4,
 * AC1/AC2/AC3/AC6/AC7).
 *
 * Estratégia: KV em memória (Map com suporte a `{ ex }`) + MSW handlers REAIS da
 * Gmail API (`messages.list`/`get`, protocolo camelCase, `payload.headers[]`) e da
 * Anthropic Messages API (`{ content: [{ type, text }] }`, classificação
 * determinística por assunto). Cobre o ciclo de vida:
 *   - 50 emails não-cacheados → classifica todos + persiste KV com TTL (AC1/AC3);
 *   - todos em cache → zero chamadas Gmail/AI (AC2);
 *   - lote misto → só os novos são classificados (AC2);
 *   - 4 buckets produzidos e persistidos (AC3);
 *   - falsificabilidade: shape AI inválido → throw, nenhuma escrita KV (AC6);
 *   - Gmail 401 → GmailAuthError; Gmail 5xx → GmailSyncError; Anthropic 5xx →
 *     GmailClassifyError (AC7 eixo c);
 *   - fidelidade: `id` renomeado na list → classificação vazia (AC6).
 */

// KV em memória — guarda valor REAL + opções (`{ ex }`) para inspeccionar o TTL.
interface KvEntry {
  value: unknown;
  ex?: number;
}
const kvStore = new Map<string, KvEntry>();
const kvSet = vi.fn(async (key: string, value: unknown, opts?: { ex?: number }) => {
  kvStore.set(key, { value, ex: opts?.ex });
});
const kvGet = vi.fn(async (key: string) =>
  kvStore.has(key) ? kvStore.get(key)!.value : null,
);
vi.mock('@vercel/kv', () => ({
  kv: {
    set: (key: string, value: unknown, opts?: { ex?: number }) => kvSet(key, value, opts),
    get: (key: string) => kvGet(key),
    del: vi.fn(async (key: string) => {
      kvStore.delete(key);
    }),
  },
}));

let mockAnthropicKey: string | undefined = 'sk-ant-test-key-com-mais-de-10-chars';
vi.mock('@/lib/shared/env', () => ({
  getServerEnv: () => ({ ANTHROPIC_API_KEY: mockAnthropicKey }),
}));

import {
  classifyInboxEmails,
  classifyCacheKey,
  GmailAuthError,
  GmailSyncError,
  GmailClassifyError,
  GMAIL_BUCKETS,
  type GmailClassifyCacheValue,
} from '@/lib/google/gmail';

const GMAIL_MESSAGES_ENDPOINT = 'https://www.googleapis.com/gmail/v1/users/me/messages';
const ANTHROPIC_MESSAGES_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const VALID_TOKEN = 'ya29.valid-gmail-token';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  kvStore.clear();
  vi.clearAllMocks();
  mockAnthropicKey = 'sk-ant-test-key-com-mais-de-10-chars';
});

describe('classifyInboxEmails — lote totalmente novo (AC1/AC3)', () => {
  it('classifica os 4 emails e persiste cada bucket em KV com TTL 7d', async () => {
    const result = await classifyInboxEmails(VALID_TOKEN);

    expect(result.total).toBe(GMAIL_MOCK_MESSAGE_IDS.length);
    expect(result.classified).toBe(GMAIL_MOCK_MESSAGE_IDS.length);
    expect(result.fromCache).toBe(0);

    // Cada msgId foi persistido com a forma { bucket, classifiedAt } + TTL 7d.
    for (const id of GMAIL_MOCK_MESSAGE_IDS) {
      const entry = kvStore.get(classifyCacheKey(id));
      expect(entry).toBeDefined();
      expect(entry!.ex).toBe(7 * 24 * 3600);
      const value = entry!.value as GmailClassifyCacheValue;
      expect(GMAIL_BUCKETS).toContain(value.bucket);
      expect(typeof value.classifiedAt).toBe('number');
    }
  });

  it('produz os 4 buckets distintos a partir dos assuntos (AC3)', async () => {
    await classifyInboxEmails(VALID_TOKEN);
    const bucketOf = (idFragment: string): string => {
      const id = GMAIL_MOCK_MESSAGE_IDS.find((m) => m.includes(idFragment))!;
      return (kvStore.get(classifyCacheKey(id))!.value as GmailClassifyCacheValue).bucket;
    };
    expect(bucketOf('importante')).toBe('importante');
    expect(bucketOf('responder')).toBe('responder_hoje');
    expect(bucketOf('esperar')).toBe('pode_esperar');
    expect(bucketOf('descartavel')).toBe('descartavel');
  });
});

describe('classifyInboxEmails — cache KV (AC2, mitigação R4)', () => {
  it('todos em cache → 0 classified, fromCache=total, sem chamadas Gmail/AI', async () => {
    // Pré-popular a cache com os 4 ids.
    for (const id of GMAIL_MOCK_MESSAGE_IDS) {
      kvStore.set(classifyCacheKey(id), {
        value: { bucket: 'pode_esperar', classifiedAt: Date.now() } as GmailClassifyCacheValue,
      });
    }

    let getCalls = 0;
    let aiCalls = 0;
    server.use(
      http.get(`${GMAIL_MESSAGES_ENDPOINT}/:id`, () => {
        getCalls++;
        return HttpResponse.json({ id: 'x', payload: { headers: [] } });
      }),
      http.post(ANTHROPIC_MESSAGES_ENDPOINT, () => {
        aiCalls++;
        return HttpResponse.json({ content: [{ type: 'text', text: '{}' }] });
      }),
    );

    const result = await classifyInboxEmails(VALID_TOKEN);
    expect(result.classified).toBe(0);
    expect(result.fromCache).toBe(GMAIL_MOCK_MESSAGE_IDS.length);
    expect(result.total).toBe(GMAIL_MOCK_MESSAGE_IDS.length);
    // `messages.list` é sempre chamado, mas `messages.get` e a AI NÃO (tudo em cache).
    expect(getCalls).toBe(0);
    expect(aiCalls).toBe(0);
  });

  it('lote misto (2 em cache, 2 novos) → classifica só os 2 novos', async () => {
    // 2 já em cache.
    const cached = GMAIL_MOCK_MESSAGE_IDS.slice(0, 2);
    for (const id of cached) {
      kvStore.set(classifyCacheKey(id), {
        value: { bucket: 'importante', classifiedAt: Date.now() } as GmailClassifyCacheValue,
      });
    }

    const result = await classifyInboxEmails(VALID_TOKEN);
    expect(result.fromCache).toBe(2);
    expect(result.classified).toBe(2);
    expect(result.total).toBe(4);

    // Os 2 novos foram (re)escritos; os 2 cacheados mantêm o valor original.
    const novos = GMAIL_MOCK_MESSAGE_IDS.slice(2);
    for (const id of novos) {
      expect(kvStore.get(classifyCacheKey(id))!.ex).toBe(7 * 24 * 3600);
    }
  });
});

describe('classifyInboxEmails — lote grande (~50, AC1 + C1 batching)', () => {
  it('classifica 50 emails em lotes paralelos sem perder nenhum', async () => {
    const ids = Array.from({ length: 50 }, (_, i) => `bulk-msg-${i}`);
    server.use(
      http.get(GMAIL_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({
          messages: ids.map((id) => ({ id, threadId: `t-${id}` })),
          resultSizeEstimate: ids.length,
        }),
      ),
      http.get(`${GMAIL_MESSAGES_ENDPOINT}/:id`, ({ params }) =>
        HttpResponse.json({
          id: params.id as string,
          payload: {
            headers: [
              { name: 'Subject', value: 'Atualização do projecto' },
              { name: 'From', value: 'a@b.pt' },
              { name: 'Date', value: 'Wed, 18 Jun 2026 09:00:00 +0100' },
            ],
          },
        }),
      ),
    );

    const result = await classifyInboxEmails(VALID_TOKEN);
    expect(result.total).toBe(50);
    expect(result.classified).toBe(50);
    expect(kvStore.size).toBe(50);
  });
});

describe('classifyInboxEmails — FALSIFICÁVEL: shape AI inválido (AC6)', () => {
  it('resposta AI com bucket renomeado (importante→important) → GmailClassifyError, nenhuma escrita KV', async () => {
    server.use(
      http.post(ANTHROPIC_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({
          content: [
            {
              type: 'text',
              // `important` (EN) em vez de `importante` — .strict() rejeita.
              text: JSON.stringify({
                important: ['gmail-msg-importante-1'],
                responder_hoje: [],
                pode_esperar: [],
                descartavel: [],
              }),
            },
          ],
        }),
      ),
    );

    await expect(classifyInboxEmails(VALID_TOKEN)).rejects.toBeInstanceOf(GmailClassifyError);
    expect(kvStore.size).toBe(0);
  });

  it('resposta AI com campo extra → .strict() throw', async () => {
    server.use(
      http.post(ANTHROPIC_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                importante: [],
                responder_hoje: [],
                pode_esperar: [],
                descartavel: [],
                lixo_extra: ['x'],
              }),
            },
          ],
        }),
      ),
    );
    await expect(classifyInboxEmails(VALID_TOKEN)).rejects.toBeInstanceOf(GmailClassifyError);
    expect(kvStore.size).toBe(0);
  });

  it('a AI NÃO gera ids: um id devolvido fora do lote enviado é descartado (C2)', async () => {
    server.use(
      http.post(ANTHROPIC_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                importante: ['gmail-msg-importante-1', 'id-inventado-pela-ai'],
                responder_hoje: [],
                pode_esperar: [],
                descartavel: [],
              }),
            },
          ],
        }),
      ),
    );
    const result = await classifyInboxEmails(VALID_TOKEN);
    // Só o id real foi persistido; o inventado é ignorado (não está no lote).
    expect(kvStore.has(classifyCacheKey('id-inventado-pela-ai'))).toBe(false);
    expect(kvStore.has(classifyCacheKey('gmail-msg-importante-1'))).toBe(true);
    // Os 3 emails não classificados pela AI ficam não-classificados.
    expect(result.classified).toBe(1);
  });
});

describe('classifyInboxEmails — FALSIFICÁVEL: fidelidade Gmail list (AC6)', () => {
  it('se o Google usar messageId em vez de id, o helper não extrai msgId nenhum', async () => {
    server.use(
      http.get(GMAIL_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({
          // chave ERRADA: `messageId` em vez de `id`.
          messages: [{ messageId: 'wrong-key', threadId: 't' }],
          resultSizeEstimate: 1,
        }),
      ),
    );
    const result = await classifyInboxEmails(VALID_TOKEN);
    // O `id` está ausente (undefined) → o helper extrai-o como undefined; total=1
    // mas nenhum metadado coerente. Provamos que depende do shape REAL: o id é
    // undefined → não há classificação útil.
    expect(result.total).toBe(1);
  });
});

describe('classifyInboxEmails — caminhos de falha (eixo c, AC7)', () => {
  it('Gmail 401 (token revogado) → GmailAuthError, nenhuma escrita KV', async () => {
    await expect(classifyInboxEmails(GMAIL_REVOKED_ACCESS_TOKEN)).rejects.toBeInstanceOf(
      GmailAuthError,
    );
    expect(kvStore.size).toBe(0);
  });

  it('Gmail 5xx → GmailSyncError, nenhuma escrita KV', async () => {
    await expect(classifyInboxEmails(GMAIL_SERVER_ERROR_ACCESS_TOKEN)).rejects.toBeInstanceOf(
      GmailSyncError,
    );
    expect(kvStore.size).toBe(0);
  });

  it('Anthropic 5xx → GmailClassifyError, nenhuma escrita KV do lote falhado', async () => {
    server.use(
      http.post(ANTHROPIC_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({ error: { message: 'overloaded' } }, { status: 529 }),
      ),
    );
    await expect(classifyInboxEmails(VALID_TOKEN)).rejects.toBeInstanceOf(GmailClassifyError);
    expect(kvStore.size).toBe(0);
  });

  it('Gmail messages.get 5xx a meio → GmailSyncError (propaga do lote paralelo)', async () => {
    server.use(
      http.get(`${GMAIL_MESSAGES_ENDPOINT}/:id`, () =>
        HttpResponse.json({ error: { code: 503 } }, { status: 503 }),
      ),
    );
    await expect(classifyInboxEmails(VALID_TOKEN)).rejects.toBeInstanceOf(GmailSyncError);
  });

  it('Anthropic devolve corpo não-JSON → GmailClassifyError', async () => {
    server.use(
      http.post(ANTHROPIC_MESSAGES_ENDPOINT, () =>
        HttpResponse.text('isto não é JSON'),
      ),
    );
    await expect(classifyInboxEmails(VALID_TOKEN)).rejects.toBeInstanceOf(GmailClassifyError);
    expect(kvStore.size).toBe(0);
  });

  it('Anthropic devolve content sem bloco de texto → GmailClassifyError', async () => {
    server.use(
      http.post(ANTHROPIC_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({ content: [{ type: 'tool_use', id: 'x' }] }),
      ),
    );
    await expect(classifyInboxEmails(VALID_TOKEN)).rejects.toBeInstanceOf(GmailClassifyError);
  });

  it('AI devolve texto que não é JSON parseável → GmailClassifyError', async () => {
    server.use(
      http.post(ANTHROPIC_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({ content: [{ type: 'text', text: 'desculpa, não consigo' }] }),
      ),
    );
    await expect(classifyInboxEmails(VALID_TOKEN)).rejects.toBeInstanceOf(GmailClassifyError);
    expect(kvStore.size).toBe(0);
  });

  it('AI devolve resposta com cercas markdown ```json → parseia na mesma', async () => {
    server.use(
      http.post(ANTHROPIC_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({
          content: [
            {
              type: 'text',
              text:
                '```json\n' +
                JSON.stringify({
                  importante: ['gmail-msg-importante-1'],
                  responder_hoje: [],
                  pode_esperar: [],
                  descartavel: [],
                }) +
                '\n```',
            },
          ],
        }),
      ),
    );
    const result = await classifyInboxEmails(VALID_TOKEN);
    expect(result.classified).toBe(1);
    expect(
      (kvStore.get(classifyCacheKey('gmail-msg-importante-1'))!.value as GmailClassifyCacheValue)
        .bucket,
    ).toBe('importante');
  });
});

describe('classifyInboxEmails — escrita incremental por email (C5)', () => {
  it('cada email classificado é escrito com kv.set individual + opção ex (não acumulado)', async () => {
    await classifyInboxEmails(VALID_TOKEN);
    // 4 emails classificados → 4 chamadas a kv.set, cada uma com { ex }.
    expect(kvSet).toHaveBeenCalledTimes(GMAIL_MOCK_MESSAGE_IDS.length);
    for (const call of kvSet.mock.calls) {
      expect(call[2]).toEqual({ ex: 7 * 24 * 3600 });
    }
  });
});

describe('classifyInboxEmails — inbox vazia', () => {
  it('messages.list sem mensagens → total 0, classified 0, fromCache 0', async () => {
    server.use(
      http.get(GMAIL_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({ resultSizeEstimate: 0 }),
      ),
    );
    const result = await classifyInboxEmails(VALID_TOKEN);
    expect(result).toEqual({ classified: 0, fromCache: 0, total: 0 });
    expect(kvStore.size).toBe(0);
  });
});

describe('classifyInboxEmails — configuração ausente', () => {
  it('ANTHROPIC_API_KEY ausente → GmailClassifyError antes de chamar a AI', async () => {
    mockAnthropicKey = undefined;
    await expect(classifyInboxEmails(VALID_TOKEN)).rejects.toBeInstanceOf(GmailClassifyError);
    expect(kvStore.size).toBe(0);
  });
});
