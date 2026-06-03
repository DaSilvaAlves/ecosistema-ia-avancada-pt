# RETOMA — Story 4.9 Architect Gate CONCERNS (F3-b: cookie same-origin no /api/push/action)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** `@architect` (Aria)
**to_agent:** `@dev` (Dex)
**created:** 03/06/2026
**status:** pending
**projecto:** Nexus v2 (`imersao-tools/nexus/`)
**branch:** `feat/nexus-v2-story-4.8-push-dispatch`
**commit do dev em revisão (NÃO pushed):** `4f2c0245`
**veredicto:** CONCERNS (F3-b required-fix bloqueador)

---

## Summary

Gate de saída `@architect` da Story 4.9 (SW push handler — última do Epic 4). A arquitectura SW está sólida (handlers, reconciliação on-mount, extensão do contrato `GET /api/push/schedule`, fidelidade de protocolo, 6 suites de teste novas — tudo PASS). UM bloqueador: a auth do `/api/push/action` (CR F3, FLAGGED para `@architect`). **Decisão F3-b: REVOGO D-ACTION-AUTH (CRON_SECRET Bearer no SW) → cookie same-origin.** Não é redesenho — é um fix localizado a 1 endpoint + remoção do secret no SW + ajuste de testes. Após o fix, re-gate `@architect` (Iter 2) antes de qualquer push.

## Context — porquê F3-b (não F3-a)

A decisão D-ACTION-AUTH foi ratificada no draft, mas a verificação do código real revelou que está **funcionalmente quebrada** em produção (dois problemas independentes, ambos bloqueadores):

1. **O secret nunca chega ao SW → 401 sempre.** `sw.js` L20 lê `self.__NEXUS_PUSH_ACTION_SECRET__ || ''`. O placeholder NUNCA é injectado: `usePushSubscription.ts` L80 faz `navigator.serviceWorker.register('/sw.js')` servindo o ficheiro estático tal-qual. Logo `PUSH_ACTION_SECRET===''`, o header `Authorization` só é adicionado `if (PUSH_ACTION_SECRET)` (L73) → nunca é enviado → `/api/push/action` devolve 401 (route.ts L54-57). **"Marcar feito"/"Snooze" não funcionam em produção (AC4/AC5).** Os unit tests passam porque mockam `fetch` — não exercitam o contrato real.

2. **Mesmo se injectado, é escalada de privilégio.** O `CRON_SECRET` protege também o `/api/push/dispatch` (4.8 — trigger de TODOS os pushes). Embebê-lo num `/sw.js` servido a qualquer cliente exporia esse secret. CRON_SECRET é server-to-server; nunca pode viver no cliente.

**Alternativa correcta (cookie same-origin):** o `notificationclick` corre same-origin no browser do utilizador autenticado. `fetch('/api/push/action', {method:'POST'})` envia o cookie de sessão automaticamente (default same-origin credentials; `SameSite=Lax`/`Strict` permite same-origin). É o modelo que `/api/push/schedule` já usa (`getSession`). O dispatch (cron) mantém o Bearer — os dois caminhos separam-se.

## Required-fix (BLOQUEADOR) — F3-b

> Detalhe completo na secção **Architect Gate (Aria)** de `docs/stories/active/4.9.story.md`.

1. **`app/api/push/action/route.ts`** — trocar auth Bearer por `getSession(req)` (padrão do `schedule/route.ts`); 401 se `!session.valid`. Remover `secretsMatch`/`extractBearer`/`getServerEnv().CRON_SECRET` deste endpoint.
2. **`public/sw.js`** — remover `PUSH_ACTION_SECRET` (L15-20, L73-74) e o header `Authorization` em `postAction`. Opcional: `credentials:'same-origin'` explícito por clareza. Remover comentários D-ACTION-AUTH/CRON_SECRET.
3. **`lib/push/cron-auth.ts`** — MANTER (usado pelo dispatch). Só actualizar JSDoc (remover `/api/push/action` como consumidor).
4. **`tests/unit/api/push/action.test.ts`** — substituir testes de auth Bearer (503/401-bearer) por auth de sessão (mockar `getSession` como `schedule-get-extension.test.ts` L13-20): 401 sem sessão, 200 com sessão. Manter C8 (snooze SF-1) com nova auth.
5. **Story** — actualizar AC4(b)/AC5(b)/AC7 + linha `external-contract-identifiers.md` (`/api/push/action` passa a cookie-auth); registar revogação de D-ACTION-AUTH + nova **D-ACTION-AUTH-COOKIE**.
6. **Re-gate** — submeter ao gate `@architect` (Iter 2) após o fix. NÃO `@devops *push` antes do re-gate.

> Confirma o `SameSite` do cookie de sessão Nexus: `Lax` ou `Strict` ambos enviam num fetch same-origin do SW (só `Strict` bloqueia cross-site, e este não é cross-site). Sem alteração ao cookie esperada.

## O que está PASS (não mexer)

- `mock-protocol-fidelity.md`: C6b prova `event.data.json()` (não `.text()`); C3/C4 provam `openWindow not called`. Não-tautológicos.
- `external-contract-identifiers.md`: `push`/`notificationclick`/`marcar-feito`/`snooze` ASCII, não regrediram.
- SF-1 (C8): snooze reescreve `fireAt`, mantém `pending`, não chama `markScheduleSent`. SF-2: `fireAt=now+10min` sempre futuro.
- AC6 (`openOrFocusApp` matchAll+focus/openWindow), AC8 (GET pending), AC9, AC10 (reconcile-snooze sem remover mirror), AC11 (wiring L57). F1 by-design, F2 fixed, F4 doc-reconciliado.

## blockers
- F3-b (auth do `/api/push/action`) — bloqueador único. Resolver e re-gate.
- AC13 (manual Chrome+Edge) — PENDENTE-HUMANO (Eurico) E bloqueado de facto por F3-b (auth quebrada faria o teste manual falhar). Testar só após F3-b.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`. (Confirmado: refere-se ao Nexus v2, convenção dos handoffs Nexus anteriores.)

---

## next_action (`@dev` Dex)

1. Aplicar F3-b (6 required-fixes acima). É localizado — não redesenho.
2. Re-correr os 4 gates locais (typecheck/lint/test:unit/build).
3. Re-submeter ao gate `@architect` (Iter 2). NÃO push antes do re-gate.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-story-4.9-gate-CONCERNS-back-to-dev.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@architect` (Aria)
DATA: `03/06/2026`
