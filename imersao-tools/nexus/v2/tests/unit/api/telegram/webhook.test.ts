import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POST } from '@/app/api/telegram/webhook/route';

/**
 * Story 6.11 — webhook Edge `POST /api/telegram/webhook` (T4, AC4/AC5).
 *
 * Cenários obrigatórios (C2 CRÍTICA / C4 / C8):
 *   - segredo configurado + header ausente → 403;
 *   - segredo configurado + header errado → 403;
 *   - segredo configurado + header correcto → 200 {ok:true};
 *   - C2 fail-closed: segredo AUSENTE em env + header (mesmo "correcto") → 403 incondicional;
 *   - C2 fail-closed: segredo VAZIO em env → 403;
 *   - C8: o stub NÃO parseia o body (200 mesmo com body inválido).
 */

const SECRET = 'segredo-do-webhook-com-mais-de-32-caracteres-aleatorios';
const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

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

const ORIGINAL_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

beforeEach(() => {
  process.env.TELEGRAM_WEBHOOK_SECRET = SECRET;
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.TELEGRAM_WEBHOOK_SECRET;
  else process.env.TELEGRAM_WEBHOOK_SECRET = ORIGINAL_SECRET;
});

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
    const res = await callWebhook({ secretHeader: SECRET });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('C8: stub não parseia o body → 200 mesmo com body inválido', async () => {
    const res = await callWebhook({ secretHeader: SECRET, body: 'isto-não-é-json-{{{' });
    expect(res.status).toBe(200);
  });
});

describe('webhook — fail-closed C2 (CRÍTICA): segredo ausente/vazio em env', () => {
  it('segredo AUSENTE + header que SERIA correcto → 403 incondicional', async () => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    // Mesmo enviando o valor que seria o segredo, sem segredo configurado recusa.
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
    // Enviar header vazio (igualaria "" se não fosse o guard fail-closed).
    const res = await callWebhook({ secretHeader: '' });
    expect(res.status).toBe(403);
  });
});
