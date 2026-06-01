'use client';

import { useCallback, useEffect, useState } from 'react';
import { urlBase64ToUint8Array } from '@/lib/push/utils';

/**
 * Nexus v2 — Hook de subscrição Web Push (Story 4.7, AC10)
 *
 * Gere a permissão e a subscrição no browser. A public key VAPID chega via
 * `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC` (pública por design, RFC 8292 — sem rota
 * dedicada, CRIT-2 Aria). A subscription é persistida server-side em KV via
 * `POST /api/push/subscribe` — o cliente não guarda nada em IndexedDB.
 *
 * Graceful degradation (NFR23): sem Service Worker / Push API / Notification,
 * `subscribe()` é no-op com aviso e `permission` fica `'denied'`.
 *
 * Trace: FR35; Push API spec; D2/D4.
 */

export interface PushSubscriptionState {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

/**
 * Verifica se o browser suporta o stack completo de Web Push.
 */
function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function usePushSubscription(): PushSubscriptionState {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      // Sem suporte → tratar como bloqueado (subscribe() será no-op).
      setPermission('denied');
      return;
    }
    setPermission(Notification.permission);

    // Reflecte o estado real: já existe subscription activa neste browser?
    void navigator.serviceWorker.getRegistration('/').then(async (registration) => {
      const existing = await registration?.pushManager.getSubscription();
      setIsSubscribed(existing != null);
    });
  }, []);

  const subscribe = useCallback(async (): Promise<void> => {
    if (!isPushSupported()) {
      console.warn('[push] browser sem suporte a Web Push — subscribe ignorado');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC;
    if (!publicKey) {
      console.warn('[push] NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC ausente — subscribe ignorado');
      return;
    }

    setIsLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Cast para BufferSource: o Uint8Array genérico (TS lib nova) não unifica
        // directamente com a assinatura DOM de applicationServerKey.
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) {
        throw new Error(`subscribe falhou: ${response.status}`);
      }

      setIsSubscribed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!isPushSupported()) {
      return;
    }
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { permission, isSubscribed, isLoading, subscribe, unsubscribe };
}
