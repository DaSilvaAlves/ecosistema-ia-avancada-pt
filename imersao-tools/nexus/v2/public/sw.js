// Nexus v2 Service Worker — push + notificationclick (Story 4.9) + fetch strategy (Story 9.3)
//
// Handlers da Web Push API (Epic 4) + cache strategy (Epic 9):
//   - install/activate  — registo mínimo (Story 4.7); activate estende-se com
//                         limpeza de caches obsoletos (Story 9.3 AC4).
//   - push              — mostra a notificação com botões accionáveis
//                         "Marcar feito" / "Snooze 10min" (Story 4.9 AC1-AC3).
//   - notificationclick — aplica a acção via /api/push/action sem abrir a app
//                         (AC4/AC5), ou abre/foca a app quando não há acção (AC6).
//   - fetch             — network-first para `/api/*` GET com fallback honesto
//                         `503 {offline:true}` só em falha de rede; cache-first
//                         para assets estáticos; navegação HTML não interceptada
//                         (Story 9.3 AC2/AC3/AC10).
//
// Story 9.3 estendeu este ficheiro SEM tocar nos handlers `push`/`notificationclick`
// nem em `postAction`/`reshowNotification` (byte-a-byte intactos — Risco R4/AC1).
//
// Não é TypeScript — corre no scope global do browser (ServiceWorkerGlobalScope).

// Acções da notificação. ASCII kebab-case — conformes à NotificationAction.action
// spec (sem acentos/cedilha). Ver external-contract-identifiers.md.
const ACTION_MARK_DONE = 'marcar-feito';
const ACTION_SNOOZE = 'snooze';
const SNOOZE_MINUTES = 10;

// Story 9.3 (AC4) — nome de cache versionado. Uma subida de versão futura
// (`nexus-static-v2`) purga automaticamente o cache antigo no próximo `activate`.
// Identificador interno, não contrato externo (external-contract-identifiers.md N/A).
const CACHE_NAME = 'nexus-static-v1';

self.addEventListener('install', (event) => {
  // Activa imediatamente esta versão sem esperar por fecho de tabs antigas.
  // Story 9.3 [AUTO-DECISION D-9.3-NO-PRECACHE]: NÃO se faz precache de uma lista
  // estática de assets no install. Os ficheiros `/_next/static/**` têm nomes com
  // hash desconhecidos no momento de escrita (só existem no build manifest — puxá-los
  // seria território Workbox, excluído por arch §11). A estratégia cache-first do
  // handler `fetch` (AC3) popula o cache preguiçosamente no primeiro pedido de cada
  // asset, cumprindo "cache static" sem inventar uma lista (Constitution Art. IV).
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Assume controlo dos clients abertos sem reload (Epic 4) E, Story 9.3 (AC4),
  // limpa caches obsoletos: apaga qualquer cache cujo nome não seja o CACHE_NAME
  // corrente. `caches` só é referenciado DENTRO do handler (nunca no module-load) —
  // AC6: não rebenta os testes SW existentes que não fazem stub de `caches`.
  //
  // CR-1 (Architect Gate 9.3): a limpeza de cache é best-effort — uma rejeição
  // (quota, cache API indisponível) NÃO pode bloquear a activação. O `.catch(() => {})`
  // isola a cadeia de limpeza; `clients.claim()` fica FORA do catch e permanece no
  // caminho crítico (resolve sempre), garantindo que o SW assume controlo mesmo que
  // a purga de caches falhe.
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names
              .filter((name) => name !== CACHE_NAME)
              .map((name) => caches.delete(name)),
          ),
        )
        .catch(() => {}),
    ]),
  );
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

// ─────────────────────────────────────────────────────────────────────────────
// Story 9.3 — Fetch strategy (AC2/AC3/AC10).
//
// Contrato de estado que o SW passa a distribuir (internal-state-contract-gate.md),
// TRÊS classes distintas, nunca colapsadas:
//   1. Sucesso de rede            → resposta do servidor devolvida tal qual.
//   2. Erro REAL do servidor 4xx/5xx → resposta do servidor devolvida TAL QUAL
//                                    (NUNCA convertida em 503 sintético — anti-M4
//                                    da Story 4.9 / D-SNOOZE-CONTRACT).
//   3. Sem rede (fetch rejeita)   → `503 {offline:true}` sintético do SW.
// O consumo deste sinal pela UI é âmbito da Story 9.5, não desta (AC9).
// ─────────────────────────────────────────────────────────────────────────────

// Response sintética que sinaliza HONESTAMENTE "sem rede". Status 503 +
// `{offline:true}` — inequivocamente distinguível de um `200 {ok:true}` de sucesso
// (internal-state-contract-gate.md eixo (c)).
function offlineResponse() {
  return new Response(JSON.stringify({ offline: true }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Network-first para `/api/*` GET: tenta a rede primeiro. SÓ quando o `fetch()`
// REJEITA (TypeError de rede, timeout, DNS, offline real) é que devolve o 503
// honesto. Uma resposta HTTP de erro do próprio servidor (4xx/5xx) chega ao
// `return await fetch(...)` sem lançar e é devolvida tal qual — não é "sem rede".
async function networkFirstApi(request) {
  try {
    return await fetch(request);
  } catch {
    console.warn('[SW] rede indisponível para', request.url, '— 503 offline honesto');
    return offlineResponse();
  }
}

// Cache-first para assets estáticos: cache hit → devolve do cache sem tocar na
// rede; cache miss → vai à rede, devolve a resposta e grava uma cópia no cache
// SÓ se `response.ok` (nunca cacheia erros). `response.clone()` porque o body de
// uma Response só pode ser lido uma vez (o original segue para o cliente).
async function cacheFirstAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

// Um pedido é um asset estático cacheável se for same-origin e cair sob
// `/_next/static/**` (assets hashed imutáveis do Next). Ficheiros futuros de
// `public/` (ícones/manifest da Story 9.4) ficam fora do âmbito desta story (AC3)
// — quando existirem, o matcher alarga-se então, sem inventar paths agora.
function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    url.pathname.startsWith('/_next/static/')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // C1 (PO Validation) — só GET é interceptado. Pedidos não-GET (POST/PUT/DELETE,
  // ex: o prompt do chat `POST /api/anthropic/proxy`) passam DIRECTOS, sem
  // fallback 503: re-tentar ou mascarar um POST offline é perigoso (efeitos
  // colaterais duplicados). Offline, um não-GET falha com o `TypeError` nativo do
  // `fetch` — sinal que a Story 9.5 trata na camada de UI.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // /api/* GET → network-first com fallback 503 honesto (AC2).
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  // AC3 — NÃO intercepta navegações de documento HTML: deixa-as passar directas
  // para a rede. Evita reintroduzir por acidente o "offline shell" de página HTML,
  // que é âmbito da Story 9.5, não desta.
  if (request.mode === 'navigate') return;

  // AC3 — assets estáticos same-origin → cache-first. Qualquer outro pedido
  // (rotas RSC, third-party, etc.) passa directo, sem intervenção do SW.
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstAsset(request));
  }
});
