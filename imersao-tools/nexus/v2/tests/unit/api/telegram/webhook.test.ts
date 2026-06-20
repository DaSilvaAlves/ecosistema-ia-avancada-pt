import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/telegram/webhook/route';
import { TelegramUpdateSchema } from '@/lib/telegram/types';
import {
  TELEGRAM_FIXTURE_CHAT_ID,
  makeTextUpdate,
  makeVoiceUpdate,
  makePhotoUpdate,
  makeUnknownUpdate,
} from '../../../mocks/handlers/telegram';

/**
 * Story 6.11 (T4, AC4/AC5) + Story 6.12 (T5, AC1-AC8) — webhook Edge
 * `POST /api/telegram/webhook`.
 *
 * Os 7 testes da 6.11 (verificação de origem + fail-closed C2) são PRESERVADOS
 * (C1 — não regridem). Os blocos da 6.12 são ADITIVOS: parse Zod (C2), filtro
 * chatId (C7), rate-limit KV (C5), ordem das guardas (C6), detecção de tipo +
 * dispatch (AC4/AC5), fail-open KV (C9), fidelidade de shape (C4), sem
 * `kv.keys`/`scan` (C8).
 *
 * Mock KV (`@vercel/kv`): Map em memória + contador controlável por teste; o
 * spy de `incr` permite afirmar a ordem das guardas (C6 — NÃO chamado para
 * chatId inválido) e injectar rejeição (C9 — fail-open).
 */

// ── Mock KV (hoisted) — só `incr`/`expire` são exercidos (D-KV-HASH; sem keys/scan).
const kvState = {
  /** Valor que o próximo `incr` deve devolver (controlado por teste). */
  nextCount: 1,
  /** Se definido, `incr` rejeita com este erro (simula KV down — C9). */
  incrError: null as Error | null,
};
const kvIncr = vi.fn(async (_key: string) => {
  if (kvState.incrError) throw kvState.incrError;
  return kvState.nextCount;
});
const kvExpire = vi.fn(async (_key: string, _ttl: number) => 1);
vi.mock('@vercel/kv', () => ({
  kv: {
    incr: (key: string) => kvIncr(key),
    expire: (key: string, ttl: number) => kvExpire(key, ttl),
  },
}));

const SECRET = 'segredo-do-webhook-com-mais-de-32-caracteres-aleatorios';
const SECRET_HEADER = 'x-telegram-bot-api-secret-token';
const CHAT_ID = String(TELEGRAM_FIXTURE_CHAT_ID);

function callWebhook(opts: { secretHeader?: string; body?: BodyInit } = {}): Promise<Response> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (opts.secretHeader !== undefined) headers.set(SECRET_HEADER, opts.secretHeader);
  const req = new Request('https://nexus.test/api/telegram/webhook', {
    method: 'POST',
    headers,
    body: opts.body ?? JSON.stringify({ update_id: 1 }),
  });
  return POST(req);
}

/** Conveniência: chamada autenticada com um objecto de update já serializado. */
function callWithUpdate(update: unknown): Promise<Response> {
  return callWebhook({ secretHeader: SECRET, body: JSON.stringify(update) });
}

const ORIGINAL_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const ORIGINAL_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

beforeEach(() => {
  process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
  process.env.TELEGRAM_CHAT_ID = CHAT_ID;
  kvState.nextCount = 1;
  kvState.incrError = null;
  kvIncr.mockClear();
  kvExpire.mockClear();
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET;
  else process.env.TELEGRAM_WEBHOOK_SECRET = ORIGINAL_SECRET;
  if (ORIGINAL_CHAT_ID === undefined) delete process.env.TELEGRAM_CHAT_ID;
  else process.env.TELEGRAM_CHAT_ID = ORIGINAL_CHAT_ID;
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 6.11 — verificação de origem (C1: PRESERVADOS byte-a-byte, não regridem)
// ═══════════════════════════════════════════════════════════════════════════

describe('webhook — verificação de origem (segredo configurado)', () => {
  it('header ausente → 403', async () => {
    const res = await callWebhook();
    expect(res.status).toBe(403);
  });

  it('header errado → 403', async () => {
    const res = await callWebhook({ secretHeader: 'segredo-errado' });
    expect(res.status).toBe(403);
  });

  it('header correcto → 200 {ok:true}', async () => {
    // 6.12: body default `{update_id:1}` não tem `message` → chatId ausente →
    // 200 silencioso `{ok:true}` (sub-caso `unauthorized` de C7). Status 200
    // PRESERVADO; corpo `{ok:true}` PRESERVADO (a 6.11 já só exigia ok:true).
    const res = await callWebhook({ secretHeader: SECRET });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('C8: stub não parseia o body → 200 mesmo com body inválido', async () => {
    // 6.11 esperava 200 (stub não parseava). 6.12: body não-JSON → 400 (C2).
    // O teste foi ADAPTADO para o comportamento da 6.12 (parse defensivo).
    const res = await callWebhook({ secretHeader: SECRET, body: 'isto-não-é-json-{{{' });
    expect(res.status).toBe(400);
  });
});

describe('webhook — fail-closed C2 (CRÍTICA): segredo ausente/vazio em env', () => {
  it('segredo AUSENTE + header que SERIA correcto → 403 incondicional', async () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    const res = await callWebhook({ secretHeader: SECRET });
    expect(res.status).toBe(403);
  });

  it('segredo AUSENTE + sem header → 403', async () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    const res = await callWebhook();
    expect(res.status).toBe(403);
  });

  it('segredo VAZIO ("") em env → 403 (string vazia é falsy → fail-closed)', async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = '';
    const res = await callWebhook({ secretHeader: '' });
    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 6.12 — AC1/C2: parse Zod + 400
// ═══════════════════════════════════════════════════════════════════════════

describe('6.12 — parse Zod (AC1/C2)', () => {
  it('body não-JSON → 400 (req.json lança → catch)', async () => {
    const res = await callWebhook({ secretHeader: SECRET, body: 'não-é-json-{{{' });
    expect(res.status).toBe(400);
  });

  it('JSON válido mas `update_id` ausente → 400 (schema-fail)', async () => {
    const res = await callWithUpdate({ message: { chat: { id: TELEGRAM_FIXTURE_CHAT_ID } } });
    expect(res.status).toBe(400);
  });

  it('JSON válido mas `chat.id` não-número → 400 (schema-fail)', async () => {
    const res = await callWithUpdate({
      update_id: 5,
      message: { chat: { id: 'não-é-número' }, text: 'olá' },
    });
    expect(res.status).toBe(400);
  });

  it('C2 falsificável: update com campo extra `entities` PASSA (não 400) — `.strict()` partiria', async () => {
    // Se o schema usasse `.strict()`, este update legítimo daria 400 (silent drop).
    // `.passthrough()` (C2/[D-6.12-PARSE-STRATEGY]) tem de o aceitar e processar.
    const update = {
      ...makeTextUpdate('olá'),
      // campos extra reais da Bot API ao nível raiz e em message:
      extra_root_field: 'x',
    };
    (update.message as Record<string, unknown>).entities = [
      { type: 'bold', offset: 0, length: 3 },
    ];
    const res = await callWithUpdate(update);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, routed: false, type: 'text' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 6.12 — AC2/C7: filtro chatId (3 sub-casos unauthorized → 200 silencioso)
// ═══════════════════════════════════════════════════════════════════════════

describe('6.12 — filtro chatId (AC2/C7)', () => {
  it('chatId correcto → processado (200 dispatch)', async () => {
    const res = await callWithUpdate(makeTextUpdate('olá'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, routed: false, type: 'text' });
  });

  it('sub-caso (a) env `TELEGRAM_CHAT_ID` ausente → 200 silencioso {ok:true} sem processar', async () => {
    delete process.env.TELEGRAM_CHAT_ID;
    const res = await callWithUpdate(makeTextUpdate('olá'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(kvIncr).not.toHaveBeenCalled();
  });

  it('sub-caso (b) `message` ausente → 200 silencioso {ok:true}', async () => {
    const res = await callWithUpdate({ update_id: 99 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(kvIncr).not.toHaveBeenCalled();
  });

  it('sub-caso (c) `chat.id` ≠ env → 200 silencioso {ok:true}', async () => {
    const res = await callWithUpdate(makeTextUpdate('olá', 111222333));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(kvIncr).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 6.12 — AC3/C5: rate-limit KV
// ═══════════════════════════════════════════════════════════════════════════

describe('6.12 — rate-limit KV (AC3/C5)', () => {
  it('count abaixo do limite (1) → processado (200)', async () => {
    kvState.nextCount = 1;
    const res = await callWithUpdate(makeTextUpdate('olá'));
    expect(res.status).toBe(200);
    expect(kvIncr).toHaveBeenCalledTimes(1);
  });

  it('count no limite (60) → ainda processado (200) — `count <= 60`', async () => {
    kvState.nextCount = 60;
    const res = await callWithUpdate(makeTextUpdate('olá'));
    expect(res.status).toBe(200);
  });

  it('count acima do limite (61) → 429', async () => {
    kvState.nextCount = 61;
    const res = await callWithUpdate(makeTextUpdate('olá'));
    expect(res.status).toBe(429);
  });

  it('C5: `kv.expire(key, 70)` é chamado INCONDICIONALMENTE após `incr` (não só em count===1)', async () => {
    kvState.nextCount = 42; // ≠ 1 → ainda assim expire tem de ser chamado.
    await callWithUpdate(makeTextUpdate('olá'));
    expect(kvExpire).toHaveBeenCalledTimes(1);
    expect(kvExpire).toHaveBeenCalledWith(expect.any(String), 70);
  });

  it('C5: chave canónica `nexus:telegram:ratelimit:${chatId}:${window}`', async () => {
    await callWithUpdate(makeTextUpdate('olá'));
    const key = kvIncr.mock.calls[0][0];
    expect(key).toMatch(/^nexus:telegram:ratelimit:987654321:\d+$/);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 6.12 — AC7/C6: ordem das guardas (rate-limit DEPOIS do filtro chatId)
// ═══════════════════════════════════════════════════════════════════════════

describe('6.12 — ordem das guardas (AC7/C6)', () => {
  it('`kv.incr` NÃO é chamado para chatId inválido (filtro antes do rate-limit)', async () => {
    const res = await callWithUpdate(makeTextUpdate('olá', 444555666));
    expect(res.status).toBe(200);
    expect(kvIncr).not.toHaveBeenCalled();
  });

  it('`kv.incr` NÃO é chamado quando o parse Zod falha (parse antes do rate-limit)', async () => {
    const res = await callWithUpdate({ message: { chat: { id: TELEGRAM_FIXTURE_CHAT_ID } } });
    expect(res.status).toBe(400);
    expect(kvIncr).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 6.12 — AC4/AC5: detecção de tipo + dispatch stub
// ═══════════════════════════════════════════════════════════════════════════

describe('6.12 — detecção de tipo + dispatch (AC4/AC5)', () => {
  it("texto → {ok:true, routed:false, type:'text'}", async () => {
    const res = await callWithUpdate(makeTextUpdate('olá'));
    expect(await res.json()).toEqual({ ok: true, routed: false, type: 'text' });
  });

  it("voz → {ok:true, routed:false, type:'voice'}", async () => {
    const res = await callWithUpdate(makeVoiceUpdate());
    expect(await res.json()).toEqual({ ok: true, routed: false, type: 'voice' });
  });

  it("foto → {ok:true, routed:false, type:'photo'}", async () => {
    const res = await callWithUpdate(makePhotoUpdate());
    expect(await res.json()).toEqual({ ok: true, routed: false, type: 'photo' });
  });

  it("update sem `message` autorizado mas sem tipo → cai em chatId-ausente (200 {ok:true})", async () => {
    // makeUnknownUpdate não tem `message` → filtro chatId resolve antes (sub-caso b).
    const res = await callWithUpdate(makeUnknownUpdate());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("texto vazio ('') → não é 'text' → cai em 'unknown' (prioridade text>voice>photo>unknown)", async () => {
    const res = await callWithUpdate(makeTextUpdate(''));
    expect(await res.json()).toEqual({ ok: true, routed: false, type: 'unknown' });
  });

  it("prioridade: update autorizado com `message` sem text/voice/photo → 'unknown'", async () => {
    const res = await callWithUpdate({
      update_id: 7,
      message: { chat: { id: TELEGRAM_FIXTURE_CHAT_ID }, sticker: { file_id: 'x' } },
    });
    expect(await res.json()).toEqual({ ok: true, routed: false, type: 'unknown' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 6.12 — C9: KV indisponível → fail-OPEN (processa) + console.error
// ═══════════════════════════════════════════════════════════════════════════

describe('6.12 — KV down: fail-open com log (C9)', () => {
  it('`kv.incr` rejeita → request PROCESSADO (200 dispatch, não 503/500) E `console.error` chamado', async () => {
    kvState.incrError = new Error('KV unavailable');
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await callWithUpdate(makeTextUpdate('olá'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, routed: false, type: 'text' });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Story 6.12 — AC6/C4: fidelidade de shape (falha se shape divergir do protocolo)
// ═══════════════════════════════════════════════════════════════════════════

describe('6.12 — fidelidade de shape MSW (AC6/C4)', () => {
  it('update de texto válido tem `message.chat` — omiti-lo faz o schema FALHAR (C4)', () => {
    // Update real PASSA.
    expect(TelegramUpdateSchema.safeParse(makeTextUpdate('olá')).success).toBe(true);
    // Sem `message.chat` → schema FALHA (chat é obrigatório quando message presente).
    const semChat = { update_id: 1, message: { text: 'olá' } };
    expect(TelegramUpdateSchema.safeParse(semChat).success).toBe(false);
  });

  it('`message.photo` é SEMPRE array — objecto singular FALHA o schema (C4)', () => {
    const arrayOk = TelegramUpdateSchema.safeParse(makePhotoUpdate());
    expect(arrayOk.success).toBe(true);
    const singular = {
      update_id: 1,
      message: { chat: { id: TELEGRAM_FIXTURE_CHAT_ID }, photo: { file_id: 'x' } },
    };
    expect(TelegramUpdateSchema.safeParse(singular).success).toBe(false);
  });

  it('`voice.file_id` é string obrigatória — sem ele FALHA o schema', () => {
    expect(TelegramUpdateSchema.safeParse(makeVoiceUpdate()).success).toBe(true);
    const semFileId = {
      update_id: 1,
      message: { chat: { id: TELEGRAM_FIXTURE_CHAT_ID }, voice: { duration: 3 } },
    };
    expect(TelegramUpdateSchema.safeParse(semFileId).success).toBe(false);
  });
});
