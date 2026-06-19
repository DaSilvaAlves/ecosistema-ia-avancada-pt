import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../mocks/server';
import { GMAIL_MOCK_MESSAGE_IDS } from '../../../mocks/handlers/google';
import {
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';
import { classifyCacheKey, type GmailClassifyCacheValue } from '@/lib/google/gmail';
import type { EmailSummary } from '@/app/api/google/gmail/inbox/route';

/**
 * Story 6.9 — testes da route `GET /api/google/gmail/inbox` (T4, AC2).
 *
 * Estratégia (espelha `gmail-classify.test.ts` da 6.8): mock de `getSession`,
 * `getValidAccessToken` e `@vercel/kv` (Map em memória); a Gmail API real
 * (`messages.list`/`get`) é interceptada por MSW (handlers da 6.8). A route
 * re-deriva a lista por `messages.list` + `kv.get` O(1) por id e filtra os 2
 * buckets visíveis ([D-6.9-READ-ENDPOINT] a-1).
 *
 * Condições do gate de saída cobertas:
 *   - C1 (sem `kv.keys`): a route só usa `kv.get` — verificado por grep no código.
 *   - C3: 1 msgId com `messages.get` 404 + outros 200 → 200 com os válidos.
 *   - C4: 401 (não-ligado/revogado) vs 200+`emails:[]` (ligado, inbox limpa);
 *         `pode_esperar`/`descartavel` NUNCA na resposta.
 */

// KV em memória (Map) — só `get` é exercido pela route (D-KV-HASH; sem `keys`).
const kvStore = new Map<string, unknown>();
const kvGet = vi.fn(async (key: string) =>
  kvStore.has(key) ? kvStore.get(key) : null,
);
vi.mock('@vercel/kv', () => ({
  kv: {
    get: (key: string) => kvGet(key),
  },
}));

let sessionValid = true;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({ valid: sessionValid, userId: 'eurico' })),
}));

let accessTokenResult: string | null = 'ya29.valid-gmail-token';
let accessTokenError: Error | null = null;
vi.mock('@/lib/google/token-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/google/token-store')>();
  return {
    ...actual,
    getValidAccessToken: vi.fn(async () => {
      if (accessTokenError) throw accessTokenError;
      return accessTokenResult;
    }),
  };
});

const GMAIL_MESSAGES_ENDPOINT = 'https://www.googleapis.com/gmail/v1/users/me/messages';
const VALID_TOKEN = 'ya29.valid-gmail-token';

/**
 * Shape de sucesso do `GET inbox` — reutiliza o tipo REAL `EmailSummary` exportado
 * pela route (mock-protocol-fidelity, anti-#4): se o shape da route divergir, este
 * teste falha em compilação em vez de validar contra uma cópia local desactualizada.
 */
interface InboxOk {
  emails: EmailSummary[];
}

async function callInbox(): Promise<Response> {
  const { GET } = await import('@/app/api/google/gmail/inbox/route');
  const req = new Request('http://localhost:3001/api/google/gmail/inbox', {
    method: 'GET',
    headers: { cookie: 'nexus_session=abc' },
  });
  return GET(req);
}

/** Semeia a cache KV com o bucket de cada msgId mock. */
function seedCache(byId: Record<string, GmailClassifyCacheValue['bucket']>): void {
  for (const [id, bucket] of Object.entries(byId)) {
    const value: GmailClassifyCacheValue = { bucket, classifiedAt: 1_750_000_000_000 };
    kvStore.set(classifyCacheKey(id), value);
  }
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  kvStore.clear();
  vi.clearAllMocks();
  sessionValid = true;
  accessTokenResult = VALID_TOKEN;
  accessTokenError = null;
});

describe('gmail/inbox — auth e token (AC2 i-ii, C4)', () => {
  it('sessão inválida → 401 not_connected', async () => {
    sessionValid = false;
    const res = await callInbox();
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('not_connected');
  });

  it('getValidAccessToken null → 401 not_connected', async () => {
    accessTokenResult = null;
    const res = await callInbox();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('not_connected');
  });

  it('TokenRevokedError → 401 token_revoked', async () => {
    accessTokenError = new TokenRevokedError();
    const res = await callInbox();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('token_revoked');
  });

  it('TokenRefreshError → 503 refresh_failed', async () => {
    accessTokenError = new TokenRefreshError('Google indisponível');
    const res = await callInbox();
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('refresh_failed');
  });
});

describe('gmail/inbox — filtragem de buckets (AC2 iv, C4)', () => {
  it('só devolve importante + responder_hoje; pode_esperar/descartavel excluídos', async () => {
    seedCache({
      'gmail-msg-importante-1': 'importante',
      'gmail-msg-responder-1': 'responder_hoje',
      'gmail-msg-esperar-1': 'pode_esperar',
      'gmail-msg-descartavel-1': 'descartavel',
    });
    const res = await callInbox();
    expect(res.status).toBe(200);
    const json = (await res.json()) as InboxOk;
    const ids = json.emails.map((e) => e.id).sort();
    expect(ids).toEqual(['gmail-msg-importante-1', 'gmail-msg-responder-1']);
    const buckets = json.emails.map((e) => e.bucket);
    expect(buckets).not.toContain('pode_esperar');
    expect(buckets).not.toContain('descartavel');
  });

  it('shape EmailSummary com metadados reais (Subject/From/Date da Gmail API)', async () => {
    seedCache({ 'gmail-msg-importante-1': 'importante' });
    const res = await callInbox();
    const json = (await res.json()) as InboxOk;
    expect(json.emails).toHaveLength(1);
    const email = json.emails[0];
    expect(email.id).toBe('gmail-msg-importante-1');
    expect(email.bucket).toBe('importante');
    expect(email.subject).toContain('URGENTE');
    expect(email.from).toBe('paulo@cliente.pt');
    expect(email.date).not.toBe('');
    expect(typeof email.classifiedAt).toBe('number');
  });

  it('msgId não classificado (kv.get null) → omitido (não erro)', async () => {
    // KV vazia: nenhum dos msgIds da inbox está classificado → 200 vazio.
    const res = await callInbox();
    expect(res.status).toBe(200);
    const json = (await res.json()) as InboxOk;
    expect(json.emails).toEqual([]);
  });
});

describe('gmail/inbox — estado empty (200 vazio) vs erro-oauth (401) (C4)', () => {
  it('Gmail ligado sem urgentes → 200 { emails: [] } (inbox limpa)', async () => {
    seedCache({
      'gmail-msg-esperar-1': 'pode_esperar',
      'gmail-msg-descartavel-1': 'descartavel',
    });
    const res = await callInbox();
    expect(res.status).toBe(200);
    expect((await res.json()).emails).toEqual([]);
  });
});

describe('gmail/inbox — degradação graciosa em 404 (AC2 vi, C3)', () => {
  it('1 msgId messages.get 404 + outro 200 → 200 com o válido (sem 503)', async () => {
    seedCache({
      'gmail-msg-importante-1': 'importante',
      'gmail-msg-responder-1': 'responder_hoje',
    });
    // O email "responder" foi eliminado no Gmail pós-classificação → 404.
    server.use(
      http.get(`${GMAIL_MESSAGES_ENDPOINT}/:id`, ({ params }) => {
        const id = params.id as string;
        if (id === 'gmail-msg-responder-1') {
          return HttpResponse.json(
            { error: { code: 404, message: 'Not Found' } },
            { status: 404 },
          );
        }
        return HttpResponse.json({
          id,
          payload: {
            headers: [
              { name: 'Subject', value: '[URGENTE] Resposta necessária hoje' },
              { name: 'From', value: 'paulo@cliente.pt' },
              { name: 'Date', value: 'Wed, 18 Jun 2026 09:00:00 +0100' },
            ],
          },
        });
      }),
    );
    const res = await callInbox();
    expect(res.status).toBe(200); // NÃO 503 por causa de 1 id (C3).
    const json = (await res.json()) as InboxOk;
    expect(json.emails.map((e) => e.id)).toEqual(['gmail-msg-importante-1']);
  });
});

describe('gmail/inbox — caminhos de falha da Gmail API (AC2 c)', () => {
  it('Gmail messages.list 401 → 401 token_revoked', async () => {
    seedCache({ 'gmail-msg-importante-1': 'importante' });
    server.use(
      http.get(GMAIL_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({ error: { code: 401 } }, { status: 401 }),
      ),
    );
    const res = await callInbox();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('token_revoked');
  });

  it('Gmail messages.list 5xx → 503 gmail_unavailable (nunca 200 { ok: false })', async () => {
    seedCache({ 'gmail-msg-importante-1': 'importante' });
    server.use(
      http.get(GMAIL_MESSAGES_ENDPOINT, () =>
        HttpResponse.json({ error: { code: 500 } }, { status: 500 }),
      ),
    );
    const res = await callInbox();
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('gmail_unavailable');
  });

  it('Gmail messages.get 5xx → 503 gmail_unavailable', async () => {
    seedCache({ 'gmail-msg-importante-1': 'importante' });
    server.use(
      http.get(`${GMAIL_MESSAGES_ENDPOINT}/:id`, () =>
        HttpResponse.json({ error: { code: 500 } }, { status: 500 }),
      ),
    );
    const res = await callInbox();
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('gmail_unavailable');
  });

  it('Gmail messages.get 401 → 401 token_revoked', async () => {
    seedCache({ 'gmail-msg-importante-1': 'importante' });
    server.use(
      http.get(`${GMAIL_MESSAGES_ENDPOINT}/:id`, () =>
        HttpResponse.json({ error: { code: 401 } }, { status: 401 }),
      ),
    );
    const res = await callInbox();
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('token_revoked');
  });
});
