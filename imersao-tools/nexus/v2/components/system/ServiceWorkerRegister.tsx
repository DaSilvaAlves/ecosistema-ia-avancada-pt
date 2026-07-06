'use client';

import { useEffect } from 'react';

/**
 * Nexus v2 — ServiceWorkerRegister (Story 9.3 / AC5)
 *
 * Regista o Service Worker (`public/sw.js`) a nível de bootstrap da app, uma
 * única vez por carregamento, independentemente do Web Push.
 *
 * Motivação (Inventário `@sm`): até à Story 9.3 o SW só era registado dentro de
 * `usePushSubscription.subscribe()` (`hooks/usePushSubscription.ts`) — ou seja, um
 * utilizador que nunca activa notificações nunca tinha o SW instalado, logo nunca
 * beneficiava da fetch strategy (cache-first / 503 honesto). Este componente
 * corrige isso registando o SW no primeiro carregamento da app autenticada.
 *
 * Idempotência (spec): `navigator.serviceWorker.register('/sw.js', { scope: '/' })`
 * com o mesmo script URL + scope é idempotente — esta chamada e a de
 * `usePushSubscription.ts` referem-se à MESMA registration, não criam uma segunda.
 * Por isso a chamada existente no hook fica intacta (o teste
 * `tests/unit/hooks/usePushSubscription.test.ts` continua a passar sem alteração).
 *
 * Graceful degradation (NFR23): guarda `'serviceWorker' in navigator` — mesmo
 * padrão de `isPushSupported()` no hook. Num browser sem suporte, é no-op.
 *
 * Pass-through nulo: não renderiza nada (padrão de `DevDbExposer`, Story 1.12).
 * Trace: Story 9.3 AC5; padrão `DailyEngineProvider` Story 3.10.
 */
export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      // Falha de registo (ex: SW indisponível) é best-effort — a app continua a
      // funcionar sem cache offline. Não propaga para não partir o carregamento.
      console.warn('[SW] registo do Service Worker falhou', error);
    });
  }, []);

  return null;
}
