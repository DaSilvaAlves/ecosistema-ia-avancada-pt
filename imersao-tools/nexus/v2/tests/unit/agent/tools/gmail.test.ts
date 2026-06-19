import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type { ExecutionContext, Logger, VercelKV } from '@/lib/agent/tools/types';
import { GmailMessageNotFoundError } from '@/lib/agent/tools/gmail';
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tools cérebro Gmail tests (Story 6.10 — FR67 + FR68)
 *
 * `[D-6.10-RUNTIME]`: as 3 tools operam SÓ por `ctx.fetch` a routes server-side.
 * Os testes injectam um `ctx.fetch` fake que ROTEIA por URL e devolve o shape REAL
 * que cada route 6.9/6.10 devolve (anti-tautológico — não MSW, é o contrato da tool
 * com a route). O `ctx.db`/`ctx.kv` NÃO são exercidos (as tools Gmail não os tocam —
 * C1). As routes server-side têm os seus próprios testes (MSW + Gmail API) em
 * `tests/unit/api/google/gmail-{draft,archive}.test.ts`.
 */

const mockLogger: Logger = { info: vi.fn(), error: vi.fn() };
const mockKv: VercelKV = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
};

const baseCtx: Omit<ExecutionContext, 'fetch' | 'db'> = {
  userId: 'eurico',
  kv: mockKv,
  logger: mockLogger,
  runId: 'test-run-id',
};

const tool = (name: string) => {
  const t = toolRegistry.get(name);
  if (t === undefined) throw new Error(`Tool "${name}" não registada`);
  return t;
};

/** Resposta para uma URL (relativa, same-origin). */
interface FetchRoute {
  status?: number;
  body: unknown;
}

/**
 * Constrói um `ctx` cujo `fetch` fake ROTEIA por substring da URL. Captura os
 * pedidos para asserir method/body. Devolve também o registo de chamadas.
 */
function ctxRouting(routes: Record<string, FetchRoute>): {
  ctx: ExecutionContext;
  calls: Array<{ url: string; init?: RequestInit }>;
} {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fakeFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (key === undefined) {
      throw new Error(`ctxRouting: URL não mapeada nos testes: ${url}`);
    }
    const route = routes[key];
    return new Response(JSON.stringify(route.body), {
      status: route.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  return {
    ctx: { ...baseCtx, db: undefined as never, fetch: fakeFetch },
    calls,
  };
}

const EMAIL_IMPORTANTE = {
  id: 'gmail-msg-importante-1',
  bucket: 'importante' as const,
  subject: '[URGENTE] Resposta necessária hoje',
  from: 'paulo@cliente.pt',
  date: 'Wed, 18 Jun 2026 09:00:00 +0100',
  classifiedAt: 1_750_000_000_000,
};
const EMAIL_RESPONDER = {
  id: 'gmail-msg-responder-1',
  bucket: 'responder_hoje' as const,
  subject: 'Podes confirmar a reunião de amanhã?',
  from: 'ana@equipa.pt',
  date: 'Wed, 18 Jun 2026 08:30:00 +0100',
  classifiedAt: 1_750_000_000_001,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// Registo no Tool Registry (AC1, C5, C7)
// ═══════════════════════════════════════════════════════════════════

describe('gmail tools — registo no registry (AC1, C5, C7)', () => {
  it('byDomain("gmail") tem 3 tools com os nomes ASCII exactos', () => {
    const names = toolRegistry
      .byDomain('gmail')
      .map((t) => t.name)
      .sort();
    expect(names).toEqual([
      'arquivar_email',
      'criar_draft_gmail',
      'listar_emails_importantes',
    ]);
  });

  it('all() === 37 após o barrel importar ./gmail (34 + 3)', () => {
    expect(toolRegistry.all()).toHaveLength(37);
  });

  it('requiresPreview/reversible por tool (D-6.10-PREVIEW = a)', () => {
    expect(tool('listar_emails_importantes').requiresPreview).toBe(false);
    expect(tool('listar_emails_importantes').reversible).toBe(false);
    expect(tool('criar_draft_gmail').requiresPreview).toBe(true);
    expect(tool('criar_draft_gmail').reversible).toBe(false);
    expect(tool('arquivar_email').requiresPreview).toBe(true);
    expect(tool('arquivar_email').reversible).toBe(false);
  });

  it('toAnthropicTools não lança para as 3 tools de gmail', () => {
    const gmail = toolRegistry.byDomain('gmail');
    expect(gmail).toHaveLength(3);
    expect(() => toolRegistry.toAnthropicTools(gmail)).not.toThrow();
    expect(toolRegistry.toAnthropicTools(gmail)).toHaveLength(3);
  });
});

// ═══════════════════════════════════════════════════════════════════
// listar_emails_importantes (AC2)
// ═══════════════════════════════════════════════════════════════════

describe('listar_emails_importantes (AC2)', () => {
  it('reutiliza GET /api/google/gmail/inbox (method GET, URL correcta) — C1/C2', async () => {
    const { ctx, calls } = ctxRouting({
      '/api/google/gmail/inbox': { body: { emails: [EMAIL_IMPORTANTE] } },
    });
    await tool('listar_emails_importantes').execute({ limit: 10 }, ctx);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('/api/google/gmail/inbox');
    expect(calls[0].init?.method).toBe('GET');
  });

  it('ordena importante antes de responder_hoje (AC2 v)', async () => {
    const { ctx } = ctxRouting({
      // Devolve na ordem inversa para provar a ordenação por relevância.
      '/api/google/gmail/inbox': {
        body: { emails: [EMAIL_RESPONDER, EMAIL_IMPORTANTE] },
      },
    });
    const result = (await tool('listar_emails_importantes').execute(
      {},
      ctx,
    )) as { emails: Array<{ bucket: string }>; total: number };
    expect(result.emails.map((e) => e.bucket)).toEqual([
      'importante',
      'responder_hoje',
    ]);
    expect(result.total).toBe(2);
  });

  it('respeita o limit (trunca a lista, mas total conta tudo)', async () => {
    const { ctx } = ctxRouting({
      '/api/google/gmail/inbox': {
        body: { emails: [EMAIL_IMPORTANTE, EMAIL_RESPONDER] },
      },
    });
    const result = (await tool('listar_emails_importantes').execute(
      { limit: 1 },
      ctx,
    )) as { emails: unknown[]; total: number };
    expect(result.emails).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('inbox vazia (KV vazio / zero classificados) → emails:[] (estado válido, não erro) — C3', async () => {
    const { ctx } = ctxRouting({
      '/api/google/gmail/inbox': { body: { emails: [] } },
    });
    const result = (await tool('listar_emails_importantes').execute(
      {},
      ctx,
    )) as { emails: unknown[]; total: number };
    expect(result.emails).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('route 401 not_connected → lança erro PT-PT (nunca trata como sucesso) — C3', async () => {
    const { ctx } = ctxRouting({
      '/api/google/gmail/inbox': { status: 401, body: { error: 'not_connected' } },
    });
    await expect(
      tool('listar_emails_importantes').execute({}, ctx),
    ).rejects.toThrow(/Gmail não está ligado/);
  });

  it('route 503 gmail_unavailable → lança erro PT-PT — C3', async () => {
    const { ctx } = ctxRouting({
      '/api/google/gmail/inbox': {
        status: 503,
        body: { error: 'gmail_unavailable' },
      },
    });
    await expect(
      tool('listar_emails_importantes').execute({}, ctx),
    ).rejects.toThrow(/temporariamente indisponível/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// criar_draft_gmail (AC3)
// ═══════════════════════════════════════════════════════════════════

describe('criar_draft_gmail (AC3)', () => {
  it('POST /api/google/gmail/draft com to/subject/body; devolve draftId — C1', async () => {
    const { ctx, calls } = ctxRouting({
      '/api/google/gmail/draft': {
        body: { draftId: 'draft-created-1', subject: 'Reunião sexta', to: 'maria@x.pt' },
      },
    });
    const result = (await tool('criar_draft_gmail').execute(
      { to: 'maria@x.pt', subject: 'Reunião sexta', body: 'Confirmo a reunião de sexta.' },
      ctx,
    )) as { draftId: string; subject: string; to: string };

    expect(calls[0].url).toContain('/api/google/gmail/draft');
    expect(calls[0].init?.method).toBe('POST');
    const sentBody = JSON.parse(String(calls[0].init?.body)) as {
      to: string;
      subject: string;
      body: string;
    };
    expect(sentBody).toEqual({
      to: 'maria@x.pt',
      subject: 'Reunião sexta',
      body: 'Confirmo a reunião de sexta.',
    });
    expect(result.draftId).toBe('draft-created-1');
  });

  it('route 400 invalid_request (to que o Google rejeita) → lança erro descritivo — C3', async () => {
    const { ctx } = ctxRouting({
      '/api/google/gmail/draft': {
        status: 400,
        body: { error: 'invalid_request' },
      },
    });
    await expect(
      tool('criar_draft_gmail').execute(
        { to: 'mau@x.pt', subject: 'Olá', body: 'corpo' },
        ctx,
      ),
    ).rejects.toThrow(/inválido/);
  });

  it('route 401 not_connected → lança erro PT-PT (token null/sessão) — C3', async () => {
    const { ctx } = ctxRouting({
      '/api/google/gmail/draft': { status: 401, body: { error: 'not_connected' } },
    });
    await expect(
      tool('criar_draft_gmail').execute(
        { to: 'a@x.pt', subject: 'S', body: 'b' },
        ctx,
      ),
    ).rejects.toThrow(/Gmail não está ligado/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// arquivar_email (AC4)
// ═══════════════════════════════════════════════════════════════════

describe('arquivar_email (AC4)', () => {
  it('POST /api/google/gmail/archive com msgId; devolve { msgId, archived:true } — C1', async () => {
    const { ctx, calls } = ctxRouting({
      '/api/google/gmail/archive': {
        body: { msgId: 'gmail-msg-importante-1', archived: true },
      },
    });
    const result = (await tool('arquivar_email').execute(
      { msgId: 'gmail-msg-importante-1' },
      ctx,
    )) as { msgId: string; archived: boolean };

    expect(calls[0].url).toContain('/api/google/gmail/archive');
    expect(calls[0].init?.method).toBe('POST');
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      msgId: 'gmail-msg-importante-1',
    });
    expect(result).toEqual({ msgId: 'gmail-msg-importante-1', archived: true });
  });

  it('route 404 → lança GmailMessageNotFoundError (eixo b) — C3', async () => {
    const { ctx } = ctxRouting({
      '/api/google/gmail/archive': { status: 404, body: { error: 'not_found' } },
    });
    await expect(
      tool('arquivar_email').execute({ msgId: 'gmail-msg-nao-existe' }, ctx),
    ).rejects.toBeInstanceOf(GmailMessageNotFoundError);
  });

  it('idempotência: re-arquivar email já arquivado → 200 { archived:true } sem erro (eixo b)', async () => {
    const { ctx } = ctxRouting({
      '/api/google/gmail/archive': {
        body: { msgId: 'gmail-msg-importante-1', archived: true },
      },
    });
    const result = (await tool('arquivar_email').execute(
      { msgId: 'gmail-msg-importante-1' },
      ctx,
    )) as { archived: boolean };
    expect(result.archived).toBe(true);
  });

  it('route 503 → lança erro PT-PT (nunca 200 { ok:false }) — C3', async () => {
    const { ctx } = ctxRouting({
      '/api/google/gmail/archive': {
        status: 503,
        body: { error: 'gmail_unavailable' },
      },
    });
    await expect(
      tool('arquivar_email').execute({ msgId: 'm1' }, ctx),
    ).rejects.toThrow(/temporariamente indisponível/);
  });
});
