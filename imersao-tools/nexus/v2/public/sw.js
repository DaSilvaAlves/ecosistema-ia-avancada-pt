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
// para fetches same-origin; explicitado aqui por clareza.
//
// D-SNOOZE-CONTRACT (M4 do CR PR #58): a resposta TEM de ser verificada. Uma
// falha HTTP (401 sessão expirada, 409 schedule-gone no snooze, 5xx) NÃO é
// sucesso — engoli-la deixaria o utilizador a pensar que a acção resultou. Em
// não-`ok`, re-mostramos a notificação (recovery path mínimo) para o utilizador
// saber que a acção falhou e poder repetir. Um erro de rede transitório é
// best-effort (também re-mostra). Devolve `true` em sucesso, `false` caso falhe.
async function postAction(body, notification) {
  let response;
  try {
    response = await fetch('/api/push/action', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error) {
    // Falha de rede (offline, etc.) — re-mostra a notificação (best-effort).
    console.error('[SW] falha de rede ao enviar acção para /api/push/action', error);
    await reshowNotification(notification);
    return false;
  }

  if (!response.ok) {
    // Falha HTTP (401/409/5xx) ≠ sucesso. Re-mostra para o utilizador repetir.
    console.error('[SW] /api/push/action devolveu estado não-ok', response.status);
    await reshowNotification(notification);
    return false;
  }

  return true;
}

// Re-mostra a notificação original (recovery path) reaproveitando título/corpo/data.
// Mantém os botões accionáveis para o utilizador poder tentar a acção de novo.
function reshowNotification(notification) {
  if (!notification) return Promise.resolve();
  return self.registration.showNotification(notification.title || 'Lembrete', {
    body: notification.body || '',
    data: notification.data,
    actions: [
      { action: ACTION_MARK_DONE, title: 'Marcar feito' },
      { action: ACTION_SNOOZE, title: 'Snooze 10min' },
    ],
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

  // Snapshot da notificação para o recovery path do `postAction` (re-mostrar em
  // falha HTTP/rede — D-SNOOZE-CONTRACT M4). `event.notification` já foi fechada
  // acima; capturamos os campos necessários para a reconstruir.
  const notification = {
    title: event.notification.title,
    body: event.notification.body,
    data: event.notification.data,
  };

  if (action === ACTION_MARK_DONE) {
    // AC4 — marca o lembrete feito SEM abrir a app.
    event.waitUntil(
      postAction({ reminderId, action: ACTION_MARK_DONE }, notification),
    );
    return;
  }

  if (action === ACTION_SNOOZE) {
    // AC5 — adia 10min SEM abrir a app.
    event.waitUntil(
      postAction(
        {
          reminderId,
          action: ACTION_SNOOZE,
          snoozeMinutes: SNOOZE_MINUTES,
        },
        notification,
      ),
    );
    return;
  }

  // AC6 — click no corpo (sem acção): abre/foca a app.
  event.waitUntil(openOrFocusApp());
});
