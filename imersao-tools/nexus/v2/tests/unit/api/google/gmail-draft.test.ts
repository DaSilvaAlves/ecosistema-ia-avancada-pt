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
import { GMAIL_DRAFT_BAD_REQUEST_TO } from '../../../mocks/handlers/google';
import {
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';
import type { DraftCreatedResponse } from '@/app/api/google/gmail/draft/route';

/**
 * Story 6.10 — testes da route `POST /api/google/gmail/draft` (AC3, C4, C6).
 *
 * Estratégia (espelha `gmail-inbox.test.ts` da 6.9): mock de `getSession` e
 * `getValidAccessToken`; a Gmail API real (`drafts.create`) é interceptada por
 * MSW (handler aditivo da 6.10). A route constrói o MIME (RFC 2047 no subject
 * com acentos — C4), codifica base64url e faz `drafts.create`.
 *
 * Condições do gate de saída cobertas:
 *   - C3: 401/400/503 distintos, nunca 200 { ok:false }.
 *   - C4: subject com acentos PT-PT → RFC 2047 `=?utf-8?B?...?=` no MIME (falsificável).
 *   - C6: shape real `{ id, message:{ id, threadId } }` → `draftId` extraído de `id`.
 */

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

const GMAIL_DRAFTS_ENDPOINT = 'https://www.googleapis.com/gmail/v1/users/me/drafts';
const VALID_TOKEN = 'ya29.valid-gmail-token';

async function callDraft(body: unknown): Promise<Response> {
  const { POST } = await import('@/app/api/google/gmail/draft/route');
  const req = new Request('http://localhost:3001/api/google/gmail/draft', {
    method: 'POST',
    headers: { cookie: 'nexus_session=abc', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return POST(req);
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  vi.clearAllMocks();
  sessionValid = true;
  accessTokenResult = VALID_TOKEN;
  accessTokenError = null;
});

describe('gmail/draft — auth e token (C3)', () => {
  it('sessão inválida → 401 not_connected', async () => {
    sessionValid = false;
    const res = await callDraft({ to: 'a@x.pt', subject: 'S', body: 'b' });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('not_connected');
  });

  it('getValidAccessToken null → 401 not_connected', async () => {
    accessTokenResult = null;
    const res = await callDraft({ to: 'a@x.pt', subject: 'S', body: 'b' });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('not_connected');
  });

  it('TokenRevokedError → 401 token_revoked', async () => {
    accessTokenError = new TokenRevokedError();
    const res = await callDraft({ to: 'a@x.pt', subject: 'S', body: 'b' });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('token_revoked');
  });

  it('TokenRefreshError → 503 refresh_failed', async () => {
    accessTokenError = new TokenRefreshError('Google indisponível');
    const res = await callDraft({ to: 'a@x.pt', subject: 'S', body: 'b' });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('refresh_failed');
  });

  it('corpo com subject vazio → 400 invalid_request (antes da Gmail API)', async () => {
    const res = await callDraft({ to: 'a@x.pt', subject: '', body: 'b' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
  });

  it('corpo sem `to` → 400 invalid_request', async () => {
    const res = await callDraft({ to: '', subject: 'S', body: 'b' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
  });

  it('corpo sem `body` → 400 invalid_request', async () => {
    const res = await callDraft({ to: 'a@x.pt', subject: 'S', body: '' });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
  });
});

describe('gmail/draft — caminho feliz + shape (AC3, C6)', () => {
  it('cria draft e devolve { draftId, subject, to } com draftId do `id` do topo', async () => {
    const res = await callDraft({
      to: 'maria@x.pt',
      subject: 'Confirmacao',
      body: 'Confirmo a reunião de sexta.',
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as DraftCreatedResponse;
    expect(json.draftId).toBe('draft-created-1'); // do `id` do topo (não message.id)
    expect(json.subject).toBe('Confirmacao');
    expect(json.to).toBe('maria@x.pt');
  });

  it('C6 — fidelidade de shape: se a Gmail devolver sem `id`, o draftId fica undefined', async () => {
    // Falsificável: o handler real usa `id` no topo. Aqui forçamos um shape errado
    // (`draftId` em vez de `id`) e provamos que a route depende do `id` real.
    server.use(
      http.post(GMAIL_DRAFTS_ENDPOINT, () =>
        HttpResponse.json({ draftId: 'errado', message: { id: 'm', threadId: 't' } }),
      ),
    );
    const res = await callDraft({ to: 'a@x.pt', subject: 'S', body: 'b' });
    const json = (await res.json()) as { draftId?: string };
    expect(json.draftId).toBeUndefined();
  });
});

describe('gmail/draft — RFC 2047 no subject (C4)', () => {
  it('subject com acentos PT-PT → MIME codifica `=?utf-8?B?...?=` (nunca cru)', async () => {
    let capturedRaw = '';
    server.use(
      http.post(GMAIL_DRAFTS_ENDPOINT, async ({ request }) => {
        const body = (await request.json()) as { message?: { raw?: string } };
        capturedRaw = body.message?.raw ?? '';
        return HttpResponse.json({
          id: 'draft-x',
          message: { id: 'm', threadId: 't' },
        });
      }),
    );

    const res = await callDraft({
      to: 'maria@x.pt',
      subject: 'Reunião sexta',
      body: 'corpo',
    });
    expect(res.status).toBe(200);

    // Descodifica base64url → utf-8 e inspecciona o header Subject.
    const mime = Buffer.from(
      capturedRaw.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf-8');
    const subjectLine = mime
      .split('\r\n')
      .find((l) => l.startsWith('Subject:'));
    expect(subjectLine).toBeDefined();
    expect(subjectLine).toContain('=?utf-8?B?');
    // FALSIFICÁVEL: o subject acentuado NUNCA aparece cru no header MIME.
    expect(subjectLine).not.toContain('Reunião');
  });

  it('subject ASCII puro → fica inalterado (sem encoding desnecessário)', async () => {
    let capturedRaw = '';
    server.use(
      http.post(GMAIL_DRAFTS_ENDPOINT, async ({ request }) => {
        const body = (await request.json()) as { message?: { raw?: string } };
        capturedRaw = body.message?.raw ?? '';
        return HttpResponse.json({ id: 'd', message: { id: 'm', threadId: 't' } });
      }),
    );
    await callDraft({ to: 'a@x.pt', subject: 'Plain subject', body: 'b' });
    const mime = Buffer.from(
      capturedRaw.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    ).toString('utf-8');
    expect(mime).toContain('Subject: Plain subject');
    expect(mime).not.toContain('=?utf-8?B?');
  });
});

describe('gmail/draft — caminhos de falha da Gmail API (C3)', () => {
  it('Gmail 400 (to rejeitado) → 400 invalid_request', async () => {
    const res = await callDraft({
      to: GMAIL_DRAFT_BAD_REQUEST_TO,
      subject: 'S',
      body: 'b',
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
  });

  it('Gmail 401 → 401 token_revoked', async () => {
    server.use(
      http.post(GMAIL_DRAFTS_ENDPOINT, () =>
        HttpResponse.json({ error: { code: 401 } }, { status: 401 }),
      ),
    );
    const res = await callDraft({ to: 'a@x.pt', subject: 'S', body: 'b' });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('token_revoked');
  });

  it('Gmail 5xx → 503 gmail_unavailable (nunca 200 { ok:false })', async () => {
    server.use(
      http.post(GMAIL_DRAFTS_ENDPOINT, () =>
        HttpResponse.json({ error: { code: 500 } }, { status: 500 }),
      ),
    );
    const res = await callDraft({ to: 'a@x.pt', subject: 'S', body: 'b' });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('gmail_unavailable');
  });
});
