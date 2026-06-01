/**
 * Nexus v2 — usePushSubscription hook tests (Story 4.7, AC13)
 *
 * `mock-protocol-fidelity.md`: os mocks reflectem o protocolo real Web Push —
 * `navigator.serviceWorker.register` → `pushManager.subscribe` → `PushSubscription`
 * com `endpoint`/`keys.p256dh`/`keys.auth` reais → `subscription.toJSON()`.
 *
 * Cenários:
 *   - fluxo completo (granted) → POST com JSON correcto → isSubscribed true.
 *   - permissão negada → isSubscribed false; sem chamada ao SW.
 *   - sem suporte → subscribe() no-op; sem erro uncaught.
 *   - fidelidade → pushManager.subscribe recebe { userVisibleOnly: true,
 *     applicationServerKey: Uint8Array } (falharia se urlBase64ToUint8Array
 *     não convertesse).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { usePushSubscription } from '@/hooks/usePushSubscription';

// VAPID public key real (65 bytes P-256) — exposta via NEXT_PUBLIC_*.
const VAPID_PUBLIC =
  'BB5FvmkT0019krrVvM-XaNfIkn1nbP5ws6nEPAv1FMpFh0qUQrG8U0miJFZb4kfXm62bRkRmP8_X3yOrQLdxCF8';

const SUBSCRIPTION_JSON = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { p256dh: 'p256dh-real', auth: 'auth-real' },
};

let subscribeSpy: ReturnType<typeof vi.fn>;
let registerSpy: ReturnType<typeof vi.fn>;
let getSubscriptionSpy: ReturnType<typeof vi.fn>;
let requestPermissionSpy: ReturnType<typeof vi.fn>;
let fetchSpy: ReturnType<typeof vi.fn>;

function installSupport(permission: NotificationPermission = 'default'): void {
  const fakeSubscription = {
    toJSON: () => SUBSCRIPTION_JSON,
    unsubscribe: vi.fn().mockResolvedValue(true),
  };
  subscribeSpy = vi.fn().mockResolvedValue(fakeSubscription);
  getSubscriptionSpy = vi.fn().mockResolvedValue(null);

  const registration = {
    pushManager: { subscribe: subscribeSpy, getSubscription: getSubscriptionSpy },
  };
  registerSpy = vi.fn().mockResolvedValue(registration);

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      register: registerSpy,
      getRegistration: vi.fn().mockResolvedValue(registration),
    },
  });

  requestPermissionSpy = vi.fn().mockResolvedValue(permission);
  vi.stubGlobal('Notification', {
    permission: 'default' as NotificationPermission,
    requestPermission: requestPermissionSpy,
  });
  vi.stubGlobal('PushManager', class {});

  fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200 });
  vi.stubGlobal('fetch', fetchSpy);

  process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC = VAPID_PUBLIC;
}

function removeSupport(): void {
  // Remove serviceWorker → isPushSupported() === false.
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: undefined,
  });
  vi.stubGlobal('Notification', {
    permission: 'default',
    requestPermission: vi.fn(),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC;
  // Limpa o serviceWorker injectado entre testes.
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: undefined,
  });
});

describe('usePushSubscription', () => {
  it('fluxo completo (granted): subscribe → POST JSON correcto → isSubscribed', async () => {
    installSupport('granted');
    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(registerSpy).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/push/subscribe',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(SUBSCRIPTION_JSON),
      })
    );
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));
  });

  it('fidelidade de protocolo: pushManager.subscribe recebe Uint8Array', async () => {
    installSupport('granted');
    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    const arg = subscribeSpy.mock.calls[0][0];
    expect(arg.userVisibleOnly).toBe(true);
    expect(arg.applicationServerKey).toBeInstanceOf(Uint8Array);
    expect(arg.applicationServerKey.length).toBe(65);
  });

  it('permissão negada: isSubscribed false, sem registo de SW', async () => {
    installSupport('denied');
    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.isSubscribed).toBe(false);
    expect(registerSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sem suporte: subscribe() é no-op sem erro uncaught', async () => {
    removeSupport();
    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await expect(result.current.subscribe()).resolves.toBeUndefined();
    });

    expect(result.current.isSubscribed).toBe(false);
  });
});
