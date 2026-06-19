import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TokenRevokedError,
  TokenRefreshError,
} from '@/lib/google/token-store';
import {
  GmailAuthError,
  GmailSyncError,
  GmailClassifyError,
} from '@/lib/google/gmail';

/**
 * Story 6.8 — testes da route `POST /api/google/gmail/classify` (T4, AC5).
 *
 * Estratégia: a route é FINA — coordena auth dual (sessão OU CRON_SECRET), token e
 * delegação ao helper `classifyInboxEmails`. Mockamos `getSession`, `getServerEnv`
 * (CRON_SECRET), `getValidAccessToken` e o helper (classes de erro reais
 * preservadas via importOriginal para o `instanceof` da route). Não há Gmail/AI
 * reais — a fidelidade do helper está coberta por `gmail.test.ts`.
 *
 * Cenários obrigatórios da story:
 *   - sem sessão e sem CRON_SECRET → 401;
 *   - sessão válida → delega + 200 { ok: true };
 *   - CRON_SECRET Bearer correcto (sem sessão) → delega + 200;
 *   - getValidAccessToken null → 401 not_connected;
 *   - getValidAccessToken TokenRevokedError → 401 token_revoked;
 *   - TokenRefreshError → 503;
 *   - helper GmailAuthError → 401; GmailSyncError → 503; GmailClassifyError → 503.
 */

let sessionValid = false;
vi.mock('@/lib/auth/session', () => ({
  getSession: vi.fn(async () => ({ valid: sessionValid, userId: 'eurico' })),
}));

let mockCronSecret: string | undefined = 'test-cron-secret';
vi.mock('@/lib/shared/env', () => ({
  getServerEnv: vi.fn(() => ({ CRON_SECRET: mockCronSecret })),
}));

let accessTokenResult: string | null = 'ya29.valid';
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

vi.mock('@/lib/google/gmail', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/google/gmail')>();
  return {
    ...actual,
    classifyInboxEmails: vi.fn(),
  };
});

import { getValidAccessToken } from '@/lib/google/token-store';
import { classifyInboxEmails } from '@/lib/google/gmail';

const tokenMock = getValidAccessToken as unknown as ReturnType<typeof vi.fn>;
const classifyMock = classifyInboxEmails as unknown as ReturnType<typeof vi.fn>;

const SECRET = 'test-cron-secret';

async function callClassify(opts: { auth?: string; cookie?: string } = {}): Promise<Response> {
  const { POST } = await import('@/app/api/google/gmail/classify/route');
  const headers = new Headers();
  if (opts.auth !== undefined) headers.set('Authorization', opts.auth);
  if (opts.cookie !== undefined) headers.set('cookie', opts.cookie);
  const req = new Request('http://localhost:3001/api/google/gmail/classify', {
    method: 'POST',
    headers,
  });
  return POST(req);
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionValid = false;
  mockCronSecret = SECRET;
  accessTokenResult = 'ya29.valid';
  accessTokenError = null;
  classifyMock.mockResolvedValue({ classified: 3, fromCache: 2, total: 5 });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('gmail/classify — auth dual (AC5 i)', () => {
  it('401 sem sessão e sem CRON_SECRET Bearer', async () => {
    const res = await callClassify();
    expect(res.status).toBe(401);
    expect(tokenMock).not.toHaveBeenCalled();
    expect(classifyMock).not.toHaveBeenCalled();
  });

  it('401 com Bearer errado e sem sessão', async () => {
    const res = await callClassify({ auth: 'Bearer wrong-secret' });
    expect(res.status).toBe(401);
    expect(classifyMock).not.toHaveBeenCalled();
  });

  it('200 com sessão válida (trigger manual UI)', async () => {
    sessionValid = true;
    const res = await callClassify({ cookie: 'nexus_session=abc' });
    expect(res.status).toBe(200);
    expect(classifyMock).toHaveBeenCalledWith('ya29.valid');
  });

  it('200 com CRON_SECRET Bearer correcto e sem sessão (server-to-server)', async () => {
    const res = await callClassify({ auth: `Bearer ${SECRET}` });
    expect(res.status).toBe(200);
    expect(classifyMock).toHaveBeenCalledTimes(1);
  });

  it('503 quando getServerEnv lança e não há sessão (fail-closed)', async () => {
    const { getServerEnv } = await import('@/lib/shared/env');
    (getServerEnv as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error('env inválido (Zod)');
    });
    const res = await callClassify({ auth: `Bearer ${SECRET}` });
    expect(res.status).toBe(503);
    expect(tokenMock).not.toHaveBeenCalled();
  });
});

describe('gmail/classify — token (AC5 ii)', () => {
  it('getValidAccessToken null → 401 not_connected', async () => {
    sessionValid = true;
    accessTokenResult = null;
    const res = await callClassify({ cookie: 'nexus_session=abc' });
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('not_connected');
    expect(classifyMock).not.toHaveBeenCalled();
  });

  it('TokenRevokedError → 401 token_revoked', async () => {
    sessionValid = true;
    accessTokenError = new TokenRevokedError();
    const res = await callClassify({ cookie: 'nexus_session=abc' });
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('token_revoked');
  });

  it('TokenRefreshError → 503 refresh_failed', async () => {
    sessionValid = true;
    accessTokenError = new TokenRefreshError('Google indisponível');
    const res = await callClassify({ cookie: 'nexus_session=abc' });
    expect(res.status).toBe(503);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('refresh_failed');
  });
});

describe('gmail/classify — sucesso + delegação (AC5 iv/v)', () => {
  it('delega ao helper e devolve { ok: true, classified, fromCache, total }', async () => {
    sessionValid = true;
    classifyMock.mockResolvedValue({ classified: 7, fromCache: 43, total: 50 });
    const res = await callClassify({ cookie: 'nexus_session=abc' });
    const json = (await res.json()) as {
      ok: boolean;
      classified: number;
      fromCache: number;
      total: number;
    };
    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, classified: 7, fromCache: 43, total: 50 });
  });
});

describe('gmail/classify — caminhos de falha do helper (AC5, eixo c)', () => {
  it('GmailAuthError → 401 token_revoked', async () => {
    sessionValid = true;
    classifyMock.mockRejectedValue(new GmailAuthError());
    const res = await callClassify({ cookie: 'nexus_session=abc' });
    expect(res.status).toBe(401);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('token_revoked');
  });

  it('GmailSyncError → 503 gmail_unavailable (nunca 200 { ok: false })', async () => {
    sessionValid = true;
    classifyMock.mockRejectedValue(new GmailSyncError('Gmail 503'));
    const res = await callClassify({ cookie: 'nexus_session=abc' });
    expect(res.status).toBe(503);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('gmail_unavailable');
  });

  it('GmailClassifyError → 503 classify_failed', async () => {
    sessionValid = true;
    classifyMock.mockRejectedValue(new GmailClassifyError('Anthropic 5xx'));
    const res = await callClassify({ cookie: 'nexus_session=abc' });
    expect(res.status).toBe(503);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('classify_failed');
  });
});
