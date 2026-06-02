import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Story 4.8 — testes da função de envio extraída `send-notification.ts` (AC3.1).
 *
 * mock-protocol-fidelity.md: o mock de `web-push` reflecte o protocolo real —
 * `WebPushError` com `statusCode` 404/410 (subscrição expirada) dispara a
 * remoção do registo, como o push service real faria. Mock de
 * `subscriptions-store` e `env` para isolar a unidade.
 */

const h = vi.hoisted(() => {
  class FakeWebPushError extends Error {
    statusCode: number;
    constructor(statusCode: number) {
      super(`web-push ${statusCode}`);
      this.statusCode = statusCode;
    }
  }
  return {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
    getPushSubscription: vi.fn(),
    deletePushSubscription: vi.fn(),
    FakeWebPushError,
    state: { privateKey: 'vapid-private' as string | undefined },
  };
});

const FakeWebPushError = h.FakeWebPushError;
const sendNotification = h.sendNotification;
const getPushSubscription = h.getPushSubscription;
const deletePushSubscription = h.deletePushSubscription;

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: h.setVapidDetails,
    sendNotification: h.sendNotification,
    WebPushError: h.FakeWebPushError,
  },
}));

vi.mock('@/lib/shared/env', () => ({
  getServerEnv: vi.fn(() => ({ WEB_PUSH_VAPID_PRIVATE: h.state.privateKey })),
}));

vi.mock('@/lib/push/subscriptions-store', () => ({
  getPushSubscription: h.getPushSubscription,
  deletePushSubscription: h.deletePushSubscription,
}));

import { sendPushNotification } from '@/lib/push/send-notification';

const SUB = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  keys: { p256dh: 'p', auth: 'a' },
  createdAt: 1717200000000,
};

const PAYLOAD = { title: 'Lembrete', body: 'Pagar a luz', data: { reminderId: 'x' } };

beforeEach(() => {
  vi.clearAllMocks();
  h.state.privateKey = 'vapid-private';
  process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC = 'vapid-public';
  getPushSubscription.mockResolvedValue(SUB);
  sendNotification.mockResolvedValue(undefined);
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC;
});

describe('sendPushNotification', () => {
  it('não envia e devolve not_configured sem VAPID keys', async () => {
    h.state.privateKey = undefined;
    const result = await sendPushNotification(PAYLOAD);
    expect(result).toEqual({ ok: false, reason: 'not_configured' });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('devolve no_subscription quando o store está vazio', async () => {
    getPushSubscription.mockResolvedValueOnce(null);
    const result = await sendPushNotification(PAYLOAD);
    expect(result).toEqual({ ok: false, reason: 'no_subscription' });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it('envia o payload serializado e devolve ok', async () => {
    const result = await sendPushNotification(PAYLOAD);
    expect(result).toEqual({ ok: true });
    expect(sendNotification).toHaveBeenCalledWith(SUB, JSON.stringify(PAYLOAD));
  });

  it('remove a subscrição e devolve expired num WebPushError 410', async () => {
    sendNotification.mockRejectedValueOnce(new FakeWebPushError(410));
    const result = await sendPushNotification(PAYLOAD);
    expect(result).toEqual({ ok: false, reason: 'expired' });
    expect(deletePushSubscription).toHaveBeenCalledTimes(1);
  });

  it('remove a subscrição e devolve expired num WebPushError 404', async () => {
    sendNotification.mockRejectedValueOnce(new FakeWebPushError(404));
    const result = await sendPushNotification(PAYLOAD);
    expect(result).toEqual({ ok: false, reason: 'expired' });
    expect(deletePushSubscription).toHaveBeenCalledTimes(1);
  });

  it('devolve error num erro genérico sem remover a subscrição', async () => {
    sendNotification.mockRejectedValueOnce(new Error('rede'));
    const result = await sendPushNotification(PAYLOAD);
    expect(result).toEqual({ ok: false, reason: 'error' });
    expect(deletePushSubscription).not.toHaveBeenCalled();
  });
});
