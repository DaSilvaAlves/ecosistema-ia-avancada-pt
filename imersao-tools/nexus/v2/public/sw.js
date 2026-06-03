// Nexus v2 Service Worker — push + notificationclick (Story 4.9)
//
// Handlers completos da Web Push API para o Epic 4:
//   - install/activate  — registo mínimo (Story 4.7).
//   - push              — mostra a notificação com botões accionáveis
//                         "Marcar feito" / "Snooze 10min" (Story 4.9 AC1-AC3).
//   - notificationclick — aplica a acção via /api/push/action sem abrir a app
//                         (AC4/AC5), ou abre/foca a app quando não há acção (AC6).
//
// FRONTEIRA EPIC 8 — Story 8.3: cache strategy (fetch handler, precache) aqui.
// Não implementar neste ficheiro até ao Epic 8.
//
// Não é TypeScript — corre no scope global do browser (ServiceWorkerGlobalScope).

// Acções da notificação. ASCII kebab-case — conformes à NotificationAction.action
// spec (sem acentos/cedilha). Ver external-contract-identifiers.md.
const ACTION_MARK_DONE = 'marcar-feito';
const ACTION_SNOOZE = 'snooze';
const SNOOZE_MINUTES = 10;

self.addEventListener('install', (event) => {
  // Activa imediatamente esta versão sem esperar por fecho de tabs antigas.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Assume controlo dos clients abertos sem reload.
  event.waitUntil(clients.claim());
});

// Story 4.9 (AC1/AC2/AC3) — handler `push` real.
// O payload é serializado por `sendPushNotification` (JSON.stringify) com o shape
// { title, body, data: { reminderId } }. `event.data.json()` desserializa-o.
self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      // Payload não-JSON (improvável — o servidor envia sempre JSON). Cai para um
      // texto simples para nunca falhar silenciosamente.
      payload = { title: 'Lembrete', body: event.data.text() };
    }
  }

  const title = payload.title || 'Lembrete';
  const options = {
    body: payload.body || '',
    // `data` propaga o reminderId para o handler `notificationclick`.
    data: payload.data,
    actions: [
      { action: ACTION_MARK_DONE, title: 'Marcar feito' },
      { action: ACTION_SNOOZE, title: 'Snooze 10min' },
    ],
  };

  // `waitUntil` mantém o SW vivo até a notificação ser mostrada (AC1).
  event.waitUntil(self.registration.showNotification(title, options));
});

// Envia a acção do utilizador ao endpoint Node /api/push/action. O fetch é
// same-origin (o notificationclick corre no contexto autenticado do browser),
// por isso o cookie de sessão é enviado automaticamente — auth por sessão, não
// por secret (D-ACTION-AUTH-COOKIE). `credentials: 'same-origin'` é o default
// para fetches same-origin; explicitado aqui por clareza. Best-effort: uma
// falha de rede não pode quebrar o handler do SW (a reconciliação on-mount na app
// recupera o estado na próxima abertura).
function postAction(body) {
  return fetch('/api/push/action', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((error) => {
    console.error('[SW] falha ao enviar acção para /api/push/action', error);
  });
}

// Abre a app ou foca uma janela já aberta (AC6). `clients.matchAll` evita abrir
// uma segunda janela quando a app já está aberta.
async function openOrFocusApp() {
  const allClients = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
  for (const client of allClients) {
    if ('focus' in client) {
      return client.focus();
    }
  }
  if (clients.openWindow) {
    return clients.openWindow('/');
  }
}

// Story 4.9 (AC4/AC5/AC6) — handler `notificationclick`.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const reminderId = event.notification.data && event.notification.data.reminderId;
  const action = event.action;

  if (action === ACTION_MARK_DONE) {
    // AC4 — marca o lembrete feito SEM abrir a app.
    event.waitUntil(postAction({ reminderId, action: ACTION_MARK_DONE }));
    return;
  }

  if (action === ACTION_SNOOZE) {
    // AC5 — adia 10min SEM abrir a app.
    event.waitUntil(
      postAction({
        reminderId,
        action: ACTION_SNOOZE,
        snoozeMinutes: SNOOZE_MINUTES,
      }),
    );
    return;
  }

  // AC6 — click no corpo (sem acção): abre/foca a app.
  event.waitUntil(openOrFocusApp());
});
