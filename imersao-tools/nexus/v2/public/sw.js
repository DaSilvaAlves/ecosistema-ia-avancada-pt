// Nexus v2 Service Worker — mínimo para push subscription (Story 4.7)
//
// Só faz o registo necessário para a Push API: install + activate + um stub
// do evento `push`. O handler completo (mostrar notificação, acções
// "marcar-feito"/"snooze") vive na Story 4.9. A cache strategy (offline/PWA)
// é fronteira do Epic 8. Este ficheiro não faz cache de nenhum recurso.
//
// Não é TypeScript — corre no scope global do browser (ServiceWorkerGlobalScope).

self.addEventListener('install', (event) => {
  // Activa imediatamente esta versão sem esperar por fecho de tabs antigas.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Assume controlo dos clients abertos sem reload.
  event.waitUntil(clients.claim());
});

// Stub — Story 4.9 implementa o handler completo (event.waitUntil + showNotification).
self.addEventListener('push', (event) => {
  // TODO Story 4.9: processar event.data e mostrar a notificação.
  console.warn('[SW] push recebido mas handler não implementado (Story 4.9)');
});
