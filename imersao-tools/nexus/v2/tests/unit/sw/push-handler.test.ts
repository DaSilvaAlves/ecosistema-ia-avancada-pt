import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

/**
 * Story 4.9 — testes do handler `push` do Service Worker (AC1/AC2/AC3, C1/C2/C6).
 *
 * `public/sw.js` corre no ServiceWorkerGlobalScope (não Node). Testamo-lo como
 * módulo JS puro com `vi.stubGlobal` para `self`/`clients` (D-SW-TEST-FRAMEWORK).
 * O ficheiro de teste é `.ts` (o vitest `include` só apanha `.ts`/`.tsx`), mas a
 * técnica segue D-SW-TEST-FRAMEWORK: o SW JS é importado por side-effect e os
 * globais do scope SW são stubbed.
 *
 * mock-protocol-fidelity.md: o mock de `event.data.json()` devolve o shape REAL
 * serializado por `sendPushNotification` (`{ title, body, data: { reminderId } }`,
 * via `JSON.stringify` em `lib/push/send-notification.ts`). O teste C6 prova que
 * o handler falharia (perderia `reminderId`) se o protocolo divergisse.
 */

type Handler = (event: unknown) => void;
type PushPayload = { title?: string; body?: string; data?: unknown } | null;

const handlers: Record<string, Handler | undefined> = {};
let showNotificationMock: Mock;

interface PushEvent {
  waitUntil: Mock;
  _waited: Promise<unknown>[];
  data: { json: Mock; text: Mock } | null;
}

function makePushEvent(
  jsonReturn: PushPayload,
  { dataPresent = true, jsonThrows = false } = {},
): PushEvent {
  const waited: Promise<unknown>[] = [];
  return {
    waitUntil: vi.fn((p: Promise<unknown>) => waited.push(p)),
    _waited: waited,
    data: dataPresent
      ? {
          json: vi.fn(() => {
            if (jsonThrows) throw new Error('not json');
            return jsonReturn;
          }),
          text: vi.fn(() => 'texto simples'),
        }
      : null,
  };
}

beforeEach(async () => {
  vi.resetModules();
  handlers.push = undefined;
  handlers.notificationclick = undefined;
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
    matchAll: vi.fn(() => Promise.resolve([])),
    openWindow: vi.fn(() => Promise.resolve()),
  });
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })));

  // SW é um script sem exports (ServiceWorkerGlobalScope) — import por side-effect.
  // @ts-expect-error sw.js não é um módulo ESM tipado; carregamos pelos efeitos.
  await import('@/public/sw.js');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SW push handler — Story 4.9', () => {
  // C1 — showNotification chamado com actions correctas e payload válido.
  it('C1 — chama showNotification com title/body e as duas actions accionáveis', () => {
    const event = makePushEvent({
      title: 'Lembrete',
      body: 'Pagar a luz',
      data: { reminderId: '11111111-1111-4111-8111-111111111111' },
    });
    handlers.push?.(event);

    expect(showNotificationMock).toHaveBeenCalledTimes(1);
    const [title, options] = showNotificationMock.mock.calls[0];
    expect(title).toBe('Lembrete');
    expect(options.body).toBe('Pagar a luz');
    expect(options.data).toEqual({
      reminderId: '11111111-1111-4111-8111-111111111111',
    });
    expect(options.actions).toEqual([
      { action: 'marcar-feito', title: 'Marcar feito' },
      { action: 'snooze', title: 'Snooze 10min' },
    ]);
  });

  // C2 — event.waitUntil é chamado (o SW não termina antes de showNotification).
  it('C2 — chama event.waitUntil com a promessa de showNotification', () => {
    const event = makePushEvent({
      title: 'Lembrete',
      body: 'X',
      data: { reminderId: '11111111-1111-4111-8111-111111111111' },
    });
    handlers.push?.(event);

    expect(event.waitUntil).toHaveBeenCalledTimes(1);
    expect(event._waited).toHaveLength(1);
  });

  // C6 — fidelidade ao protocolo: se o payload não trouxer `reminderId` (shape
  // divergente do real), o handler ainda corre mas `data.reminderId` é undefined,
  // o que faria a acção "marcar feito" falhar (AC4 não accionável). Prova que o
  // mock reflecte o protocolo real e não apenas faz o teste passar.
  it('C6 — payload sem reminderId: showNotification corre mas data.reminderId é undefined', () => {
    const event = makePushEvent({ title: 'Lembrete', body: 'X', data: {} });
    handlers.push?.(event);

    const [, options] = showNotificationMock.mock.calls[0];
    expect(options.data?.reminderId).toBeUndefined();
  });

  // C6b — fidelidade: usa event.data.json() (não .text()) para o shape JSON real.
  it('C6b — desserializa via event.data.json() (protocolo real), não via .text()', () => {
    const event = makePushEvent({
      title: 'Lembrete',
      body: 'Y',
      data: { reminderId: '11111111-1111-4111-8111-111111111111' },
    });
    handlers.push?.(event);

    expect(event.data?.json).toHaveBeenCalledTimes(1);
    expect(event.data?.text).not.toHaveBeenCalled();
  });

  // Robustez — payload não-JSON cai para .text() sem quebrar.
  it('payload não-JSON: cai para event.data.text() e ainda mostra notificação', () => {
    const event = makePushEvent(null, { jsonThrows: true });
    handlers.push?.(event);

    expect(event.data?.text).toHaveBeenCalledTimes(1);
    expect(showNotificationMock).toHaveBeenCalledTimes(1);
    const [title, options] = showNotificationMock.mock.calls[0];
    expect(title).toBe('Lembrete');
    expect(options.body).toBe('texto simples');
  });

  // Sem event.data: usa defaults sem lançar.
  it('sem event.data: usa título por defeito e corpo vazio', () => {
    const event = makePushEvent(null, { dataPresent: false });
    handlers.push?.(event);

    expect(showNotificationMock).toHaveBeenCalledTimes(1);
    const [title, options] = showNotificationMock.mock.calls[0];
    expect(title).toBe('Lembrete');
    expect(options.body).toBe('');
  });
});
