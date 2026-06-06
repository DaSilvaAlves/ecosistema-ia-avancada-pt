import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

/**
 * Story 4.9 — testes do handler `notificationclick` do SW (AC4/AC5/AC6, C3/C4/C5).
 *
 * D-SW-TEST-FRAMEWORK: SW JS importado por side-effect com `vi.stubGlobal` para
 * `self`/`clients`/`fetch`. Ficheiro `.ts` (o vitest `include` só apanha `.ts`).
 *
 * mock-protocol-fidelity.md (Notification API): o mock de `event` reflecte o
 * protocolo real — `event.action` (string da NotificationAction), `event.notification.data`
 * (propagado pelo handler `push`), `event.notification.close()`. C3/C4 provam que
 * "marcar feito"/"snooze" NÃO abrem a app (`clients.openWindow` não é chamado).
 */

type Handler = (event: unknown) => void;

const handlers: Record<string, Handler | undefined> = {};
let openWindowMock: Mock;
let matchAllMock: Mock;
let fetchMock: Mock;
let showNotificationMock: Mock;

interface ClickEvent {
  action: string | undefined;
  notification: { title: string; body: string; data: unknown; close: Mock };
  waitUntil: Mock;
  _waited: Promise<unknown>[];
}

function makeClickEvent(action: string | undefined, data: unknown): ClickEvent {
  const waited: Promise<unknown>[] = [];
  return {
    action,
    notification: { title: 'Lembrete', body: 'Pagar a luz', data, close: vi.fn() },
    waitUntil: vi.fn((p: Promise<unknown>) => waited.push(p)),
    _waited: waited,
  };
}

const REMINDER_ID = '11111111-1111-4111-8111-111111111111';

beforeEach(async () => {
  vi.resetModules();
  handlers.push = undefined;
  handlers.notificationclick = undefined;

  openWindowMock = vi.fn(() => Promise.resolve());
  matchAllMock = vi.fn(() => Promise.resolve([]));
  fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
  showNotificationMock = vi.fn(() => Promise.resolve());

  vi.stubGlobal('self', {
    addEventListener: vi.fn((type: string, fn: Handler) => {
      handlers[type] = fn;
    }),
    skipWaiting: vi.fn(),
    registration: { showNotification: showNotificationMock },
  });
  vi.stubGlobal('clients', {
    claim: vi.fn(() => Promise.resolve()),
    matchAll: matchAllMock,
    openWindow: openWindowMock,
  });
  vi.stubGlobal('fetch', fetchMock);

  // @ts-expect-error sw.js não é um módulo ESM tipado; carregamos pelos efeitos.
  await import('@/public/sw.js');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SW notificationclick handler — Story 4.9', () => {
  // C3 — "marcar feito": fecha, faz fetch a /api/push/action, NÃO abre a app.
  it('C3 — marcar-feito: fecha notificação, chama /api/push/action, NÃO abre app', async () => {
    const event = makeClickEvent('marcar-feito', { reminderId: REMINDER_ID });
    handlers.notificationclick?.(event);
    await Promise.all(event._waited);

    expect(event.notification.close).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/push/action');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      reminderId: REMINDER_ID,
      action: 'marcar-feito',
    });
    // Auth por cookie same-origin (D-ACTION-AUTH-COOKIE): o fetch envia o cookie
    // de sessão automaticamente e NÃO inclui header Authorization. Falharia se o
    // SW regredisse para Bearer (CRON_SECRET no cliente — a regressão revogada).
    expect(init.credentials).toBe('same-origin');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.headers).not.toHaveProperty('Authorization');
    expect(openWindowMock).not.toHaveBeenCalled();
  });

  // C4 — "snooze": fecha, fetch com snoozeMinutes:10, NÃO abre a app.
  it('C4 — snooze: fecha, chama /api/push/action com snoozeMinutes:10, NÃO abre app', async () => {
    const event = makeClickEvent('snooze', { reminderId: REMINDER_ID });
    handlers.notificationclick?.(event);
    await Promise.all(event._waited);

    expect(event.notification.close).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/push/action');
    expect(JSON.parse(init.body)).toEqual({
      reminderId: REMINDER_ID,
      action: 'snooze',
      snoozeMinutes: 10,
    });
    expect(openWindowMock).not.toHaveBeenCalled();
  });

  // C5 — sem acção (dismiss/click corpo): abre a app + fecha notificação.
  it('C5 — sem acção: fecha notificação, abre a app (openWindow), NÃO chama action', async () => {
    const event = makeClickEvent(undefined, { reminderId: REMINDER_ID });
    handlers.notificationclick?.(event);
    await Promise.all(event._waited);

    expect(event.notification.close).toHaveBeenCalledTimes(1);
    expect(matchAllMock).toHaveBeenCalledTimes(1);
    expect(openWindowMock).toHaveBeenCalledWith('/');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // C5b — sem acção mas com janela já aberta: foca em vez de abrir nova.
  it('C5b — sem acção com janela aberta: foca a existente, NÃO abre nova', async () => {
    const focusMock = vi.fn(() => Promise.resolve());
    matchAllMock.mockResolvedValueOnce([{ focus: focusMock }]);
    const event = makeClickEvent(undefined, { reminderId: REMINDER_ID });
    handlers.notificationclick?.(event);
    await Promise.all(event._waited);

    expect(focusMock).toHaveBeenCalledTimes(1);
    expect(openWindowMock).not.toHaveBeenCalled();
  });

  // Protocolo: o handler usa event.waitUntil para todas as acções.
  it('chama event.waitUntil para manter o SW vivo durante a acção', async () => {
    const event = makeClickEvent('marcar-feito', { reminderId: REMINDER_ID });
    handlers.notificationclick?.(event);
    expect(event.waitUntil).toHaveBeenCalledTimes(1);
    await Promise.all(event._waited);
  });

  // M4 — falha HTTP (response.ok === false) NÃO é sucesso. O SW re-mostra a
  // notificação (recovery path) para o utilizador saber que a acção falhou.
  // Falharia se o SW voltasse a engolir o não-ok (a regressão revogada do M4).
  it('M4 — response.ok===false (401) re-mostra a notificação (não silencia)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    const event = makeClickEvent('marcar-feito', { reminderId: REMINDER_ID });
    handlers.notificationclick?.(event);
    await Promise.all(event._waited);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Recovery path: a notificação é re-mostrada com os botões accionáveis.
    expect(showNotificationMock).toHaveBeenCalledTimes(1);
    const [title, opts] = showNotificationMock.mock.calls[0];
    expect(title).toBe('Lembrete');
    expect(opts.body).toBe('Pagar a luz');
    expect(opts.actions).toEqual([
      { action: 'marcar-feito', title: 'Marcar feito' },
      { action: 'snooze', title: 'Snooze 10min' },
    ]);
  });

  // M4 — 409 schedule-gone (snooze de entrada já removida) também re-mostra.
  it('M4 — snooze com 409 schedule-gone re-mostra a notificação', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 409 });
    const event = makeClickEvent('snooze', { reminderId: REMINDER_ID });
    handlers.notificationclick?.(event);
    await Promise.all(event._waited);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(showNotificationMock).toHaveBeenCalledTimes(1);
  });

  // M4 — caminho de sucesso (ok===true): NÃO re-mostra. Garante que o recovery
  // path só dispara em falha (asserção não-tautológica do par positivo/negativo).
  it('M4 — response.ok===true NÃO re-mostra a notificação (caminho normal)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true });
    const event = makeClickEvent('marcar-feito', { reminderId: REMINDER_ID });
    handlers.notificationclick?.(event);
    await Promise.all(event._waited);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(showNotificationMock).not.toHaveBeenCalled();
  });

  // M4 — erro de rede (fetch rejeita) também re-mostra (best-effort transitório).
  it('M4 — erro de rede re-mostra a notificação', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    const event = makeClickEvent('marcar-feito', { reminderId: REMINDER_ID });
    handlers.notificationclick?.(event);
    await Promise.all(event._waited);

    expect(showNotificationMock).toHaveBeenCalledTimes(1);
  });
});
