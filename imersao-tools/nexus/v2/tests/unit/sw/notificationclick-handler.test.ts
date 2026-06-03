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

interface ClickEvent {
  action: string | undefined;
  notification: { data: unknown; close: Mock };
  waitUntil: Mock;
  _waited: Promise<unknown>[];
}

function makeClickEvent(action: string | undefined, data: unknown): ClickEvent {
  const waited: Promise<unknown>[] = [];
  return {
    action,
    notification: { data, close: vi.fn() },
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

  vi.stubGlobal('self', {
    addEventListener: vi.fn((type: string, fn: Handler) => {
      handlers[type] = fn;
    }),
    skipWaiting: vi.fn(),
    registration: { showNotification: vi.fn(() => Promise.resolve()) },
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
});
