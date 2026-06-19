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
import {
  GMAIL_ARCHIVE_NOT_FOUND_MSG_ID,
  GMAIL_ARCHIVE_SERVER_ERROR_MSG_ID,
} from '../../../mocks/handlers/google';
import {
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';
import type { ArchivedResponse } from '@/app/api/google/gmail/archive/route';

/**
 * Story 6.10 — testes da route `POST /api/google/gmail/archive` (AC4, C6).
 *
 * Estratégia (espelha `gmail-inbox.test.ts` da 6.9): mock de `getSession` e
 * `getValidAccessToken`; a Gmail API real (`messages.modify`) é interceptada por
 * MSW (handler aditivo da 6.10). A route remove o label INBOX ([D-6.10-ARCHIVE-API]).
 *
 * Condições do gate de saída cobertas:
 *   - C3: 401/404/503 distintos, nunca 200 { ok:false }; 404 → not_found (eixo b).
 *   - C6: corpo `{ removeLabelIds:['INBOX'] }` enviado; resposta `{ id, labelIds }`.
 *   - eixo b: idempotência (re-arquivar → 200 sem erro).
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

const GMAIL_MESSAGES_ENDPOINT = 'https://www.googleapis.com/gmail/v1/users/me/messages';
const VALID_TOKEN = 'ya29.valid-gmail-token';

async function callArchive(body: unknown): Promise<Response> {
  const { POST } = await import('@/app/api/google/gmail/archive/route');
  const req = new Request('http://localhost:3001/api/google/gmail/archive', {
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

describe('gmail/archive — auth e token (C3)', () => {
  it('sessão inválida → 401 not_connected', async () => {
    sessionValid = false;
    const res = await callArchive({ msgId: 'm1' });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('not_connected');
  });

  it('getValidAccessToken null → 401 not_connected', async () => {
    accessTokenResult = null;
    const res = await callArchive({ msgId: 'm1' });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('not_connected');
  });

  it('TokenRevokedError → 401 token_revoked', async () => {
    accessTokenError = new TokenRevokedError();
    const res = await callArchive({ msgId: 'm1' });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('token_revoked');
  });

  it('TokenRefreshError → 503 refresh_failed', async () => {
    accessTokenError = new TokenRefreshError('Google indisponível');
    const res = await callArchive({ msgId: 'm1' });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('refresh_failed');
  });

  it('corpo sem msgId → 400 invalid_request (antes da Gmail API)', async () => {
    const res = await callArchive({});
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_request');
  });
});

describe('gmail/archive — caminho feliz + shape (AC4, C6)', () => {
  it('arquiva e devolve { msgId, archived:true }; envia removeLabelIds:["INBOX"]', async () => {
    let capturedBody: { removeLabelIds?: string[] } = {};
    server.use(
      http.post(`${GMAIL_MESSAGES_ENDPOINT}/:id/modify`, async ({ request, params }) => {
        capturedBody = (await request.json()) as { removeLabelIds?: string[] };
        return HttpResponse.json({ id: params.id, labelIds: ['UNREAD'] });
      }),
    );
    const res = await callArchive({ msgId: 'gmail-msg-importante-1' });
    expect(res.status).toBe(200);
    const json = (await res.json()) as ArchivedResponse;
    expect(json).toEqual({ msgId: 'gmail-msg-importante-1', archived: true });
    // C6 — fidelidade: o corpo enviado remove o label INBOX (semântica "arquivar").
    expect(capturedBody.removeLabelIds).toEqual(['INBOX']);
  });
});

describe('gmail/archive — idempotência e falhas (C3, eixo b)', () => {
  it('idempotência: arquivar duas vezes o mesmo email → ambas 200 { archived:true }', async () => {
    // O handler feliz devolve labelIds sem INBOX — re-arquivar é no-op server-side.
    // Prova a idempotência com DUAS chamadas (não uma): a 2.ª sobre um email já
    // arquivado tem de devolver o mesmo sucesso, sem erro.
    const first = await callArchive({ msgId: 'gmail-msg-importante-1' });
    expect(first.status).toBe(200);
    expect((await first.json()).archived).toBe(true);

    const second = await callArchive({ msgId: 'gmail-msg-importante-1' });
    expect(second.status).toBe(200);
    expect(await second.json()).toEqual({
      msgId: 'gmail-msg-importante-1',
      archived: true,
    });
  });

  it('Gmail 404 (email eliminado) → 404 not_found (eixo b)', async () => {
    const res = await callArchive({ msgId: GMAIL_ARCHIVE_NOT_FOUND_MSG_ID });
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe('not_found');
  });

  it('Gmail 5xx → 503 gmail_unavailable (nunca 200 { ok:false })', async () => {
    const res = await callArchive({ msgId: GMAIL_ARCHIVE_SERVER_ERROR_MSG_ID });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe('gmail_unavailable');
  });

  it('Gmail 401 → 401 token_revoked', async () => {
    server.use(
      http.post(`${GMAIL_MESSAGES_ENDPOINT}/:id/modify`, () =>
        HttpResponse.json({ error: { code: 401 } }, { status: 401 }),
      ),
    );
    const res = await callArchive({ msgId: 'm1' });
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe('token_revoked');
  });
});
