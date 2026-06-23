import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toolRegistry } from '@/lib/agent/tools/registry';
import type { ExecutionContext, Logger, VercelKV } from '@/lib/agent/tools/types';
import '@/lib/agent/tools';

/**
 * Nexus v2 — Tool cérebro Telegram tests (Story 6.17 — FR76)
 *
 * `[D-6.17-RUNTIME]`: a tool opera SÓ por `ctx.fetch` à route server-side
 * `/api/telegram/send`. Os testes injectam um `ctx.fetch` fake que ROTEIA por URL
 * e devolve o shape REAL que a route 6.17 devolve (anti-tautológico — não MSW, é
 * o contrato da tool com a route). O `ctx.db`/`ctx.kv` NÃO são exercidos (a tool
 * não os toca — envio stateless). A route server-side tem os seus próprios testes
 * (MSW + Bot API) em `tests/unit/api/telegram/send.test.ts`.
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

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// Registo no Tool Registry (AC1, AC7, C4, C7)
// ═══════════════════════════════════════════════════════════════════

describe('enviar_telegram — registo no registry (AC1, AC7)', () => {
  it('byDomain("telegram") tem 1 tool com o nome ASCII exacto', () => {
    const names = toolRegistry
      .byDomain('telegram')
      .map((t) => t.name)
      .sort();
    expect(names).toEqual(['enviar_telegram']);
  });

  it('all() === 38 após o barrel importar ./telegram (37 + 1)', () => {
    expect(toolRegistry.all()).toHaveLength(38);
  });

  it('requiresPreview:false, reversible:false (D-6.17-REVERSIBLE = C4)', () => {
    expect(tool('enviar_telegram').requiresPreview).toBe(false);
    expect(tool('enviar_telegram').reversible).toBe(false);
    expect(tool('enviar_telegram').reverse).toBeUndefined();
  });

  it('toAnthropicTools não lança para enviar_telegram', () => {
    const telegram = toolRegistry.byDomain('telegram');
    expect(telegram).toHaveLength(1);
    expect(() => toolRegistry.toAnthropicTools(telegram)).not.toThrow();
    expect(toolRegistry.toAnthropicTools(telegram)).toHaveLength(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// argsSchema (AC2, C3) — apenas { text }, SEM chat_id (anti-SSRF)
// ═══════════════════════════════════════════════════════════════════

describe('enviar_telegram — argsSchema (AC2, D-6.17-CHATID)', () => {
  it('aceita { text }', () => {
    expect(tool('enviar_telegram').argsSchema.safeParse({ text: 'olá' }).success).toBe(
      true,
    );
  });

  it('rejeita {} (text obrigatório)', () => {
    expect(tool('enviar_telegram').argsSchema.safeParse({}).success).toBe(false);
  });

  it('rejeita text vazio', () => {
    expect(tool('enviar_telegram').argsSchema.safeParse({ text: '' }).success).toBe(
      false,
    );
  });

  it('rejeita text > 4096 chars (limite Bot API)', () => {
    expect(
      tool('enviar_telegram').argsSchema.safeParse({ text: 'a'.repeat(4097) }).success,
    ).toBe(false);
  });

  it('chat_id NÃO faz parte do schema — é ignorado (não é argumento, anti-SSRF)', () => {
    // O Zod object por defeito faz strip de chaves extra. Confirma que `chat_id`
    // nunca chega ao output parseado da tool — o destinatário é server-side.
    const parsed = tool('enviar_telegram').argsSchema.safeParse({
      text: 'olá',
      chat_id: '999',
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual({ text: 'olá' });
    expect(parsed.success && 'chat_id' in parsed.data).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// execute — caminho feliz (AC3, AC9.b/c/d, C5/C6)
// ═══════════════════════════════════════════════════════════════════

describe('enviar_telegram — caminho feliz (AC3, C5)', () => {
  it('POST /api/telegram/send com { text }; devolve { sent:true } — C1/C5', async () => {
    const { ctx, calls } = ctxRouting({
      '/api/telegram/send': { body: { ok: true } },
    });
    const result = (await tool('enviar_telegram').execute(
      { text: 'bom dia' },
      ctx,
    )) as { sent: boolean };

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain('/api/telegram/send');
    expect(calls[0].init?.method).toBe('POST');
    expect(result).toEqual({ sent: true });
  });

  it('o body enviado contém APENAS { text } — chat_id NUNCA é enviado (anti-SSRF C3)', async () => {
    const { ctx, calls } = ctxRouting({
      '/api/telegram/send': { body: { ok: true } },
    });
    await tool('enviar_telegram').execute({ text: 'bom dia' }, ctx);
    const sentBody = JSON.parse(String(calls[0].init?.body)) as Record<string, unknown>;
    expect(sentBody).toEqual({ text: 'bom dia' });
    expect(Object.keys(sentBody)).not.toContain('chat_id');
  });

  it('200 com corpo malformado (sem ok:true) → Error, NUNCA { sent:true } (anti-M4)', async () => {
    const { ctx } = ctxRouting({
      '/api/telegram/send': { body: { unexpected: 'shape' } },
    });
    await expect(
      tool('enviar_telegram').execute({ text: 'olá' }, ctx),
    ).rejects.toThrow(/Resposta inesperada/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// execute — caminhos de falha (AC5, AC6, C6, eixo c) — nunca { sent:true }
// ═══════════════════════════════════════════════════════════════════

describe('enviar_telegram — caminhos de falha (AC5, AC6, C6)', () => {
  it('401 not_authenticated → Error PT-PT (sessão), nunca sucesso — C6', async () => {
    const { ctx } = ctxRouting({
      '/api/telegram/send': { status: 401, body: { error: 'not_authenticated' } },
    });
    await expect(
      tool('enviar_telegram').execute({ text: 'olá' }, ctx),
    ).rejects.toThrow(/sessão expirou/);
  });

  it('400 invalid_request → Error PT-PT (mensagem inválida) — C6', async () => {
    const { ctx } = ctxRouting({
      '/api/telegram/send': { status: 400, body: { error: 'invalid_request' } },
    });
    await expect(
      tool('enviar_telegram').execute({ text: 'olá' }, ctx),
    ).rejects.toThrow(/inválida/);
  });

  it('503 chat_id_missing → Error PT-PT (config), nunca sucesso — C6/AC6', async () => {
    const { ctx } = ctxRouting({
      '/api/telegram/send': { status: 503, body: { error: 'chat_id_missing' } },
    });
    await expect(
      tool('enviar_telegram').execute({ text: 'olá' }, ctx),
    ).rejects.toThrow(/não está configurado/);
  });

  it('503 bot_token_missing → Error PT-PT (config) — C6', async () => {
    const { ctx } = ctxRouting({
      '/api/telegram/send': { status: 503, body: { error: 'bot_token_missing' } },
    });
    await expect(
      tool('enviar_telegram').execute({ text: 'olá' }, ctx),
    ).rejects.toThrow(/não está configurado/);
  });

  it('502 telegram_unavailable → Error PT-PT (indisponível) — C6', async () => {
    const { ctx } = ctxRouting({
      '/api/telegram/send': { status: 502, body: { error: 'telegram_unavailable' } },
    });
    await expect(
      tool('enviar_telegram').execute({ text: 'olá' }, ctx),
    ).rejects.toThrow(/temporariamente indisponível/);
  });

  it('falha de transporte (ctx.fetch rejeita) → Error PT-PT de ligação (não erro cru) — C6', async () => {
    const fakeFetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    const ctx: ExecutionContext = { ...baseCtx, db: undefined as never, fetch: fakeFetch };
    await expect(
      tool('enviar_telegram').execute({ text: 'olá' }, ctx),
    ).rejects.toThrow(/falha de ligação/);
  });
});
