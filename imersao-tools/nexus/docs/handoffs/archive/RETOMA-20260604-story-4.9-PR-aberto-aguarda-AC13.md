# RETOMA — Story 4.9 (SW push handler) — PR #58 ABERTO, aguarda AC13 manual + CR Iter 1

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

- **from_agent:** devops (Gage)
- **to_agent:** any (próxima acção: Eurico faz AC13 manual; depois `@devops` merge OU `@dev` corrige CR Iter 1)
- **created:** 2026-06-04
- **status:** superseded
- **superseded_by:** `RETOMA-20260604-story-4.9-PR58-RF-pushed-aguarda-AC13-merge.md`
- **superseded_at:** 2026-06-04 (Orion `@aiox-master`)

> **SUPERSEDED** — este handoff descreve o CR Iter 1 (11 findings, 6 Major/5 Minor) ANTES da aplicação dos RF1-RF7. Os 4 Major de lógica de produção (snooze) foram resolvidos pelo D-SNOOZE-CONTRACT (commit `80740d97`), o `@architect` deu re-gate Iter 4 PASS e o push foi feito (`e51d8cc7`). **CR Iter 2 local = 0 findings.** O estado actual vive em `RETOMA-20260604-story-4.9-PR58-RF-pushed-aguarda-AC13-merge.md`. Não actuar a partir deste ficheiro.

---

## Summary

Story 4.9 (SW push handler — última do Epic 4) tem **PR #58 ABERTO** contra `main`, branch `feat/nexus-v2-story-4.9-sw-push-handler`. CI 100% verde (`mergeStateStatus: CLEAN`), gates locais @devops PASS (typecheck/lint/test:unit 1374/build). **NÃO foi feito merge** — bloqueado por (1) AC13 manual Chrome+Edge pendente do Eurico e (2) CodeRabbit Iter 1 emitiu CHANGES_REQUESTED com 11 findings (0 CRITICAL, 6 Major, 5 Minor).

## Como foi construída a branch (higiene git)

A branch de trabalho `feat/nexus-v2-story-4.8-push-dispatch` está poluída (commits 4.8 + pomodoro já em main + story pomodoro em active/). Repetiu-se o padrão do PR #57: **branch nova de `origin/main` (`59cba0d1`) + cherry-pick SÓ dos 4 commits da 4.9** (`4f2c0245 ccb45346 f465494e 0dd9a5de`). Cherry-pick limpo, exit 0, zero conflitos. Scope-check (`git diff --stat origin/main...HEAD`) confirmou 18 ficheiros, todos da 4.9, ZERO pomodoro, ZERO 4.8. O working tree voltou intacto à branch 4.8 (stash sem -u durante a operação, depois pop).

## PR #58 — URL e estado

- URL: https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/58
- state OPEN, mergeable MERGEABLE, mergeStateStatus CLEAN
- reviewDecision CHANGES_REQUESTED (CodeRabbit Iter 1)
- HEAD remoto: `68a43cec`

## Gates locais @devops (reais nesta branch)

| Gate | Resultado |
|------|-----------|
| typecheck | PASS (exit 0) |
| lint | PASS (exit 0; 1 warning pré-existente fora-scope `app/api/auth/logout/route.ts`) |
| test:unit | PASS 1374/1374 (120 ficheiros) |
| build | PASS (exit 0; `/api/push/action` registada) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. REFERE-SE AO PROJECTO Nexus v2 — LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## CodeRabbit Iter 1 — 11 findings (0 CRITICAL, 6 Major, 5 Minor)

NÃO foram auto-resolvidos. Os 4 Major de lógica de produção tocam o contrato de design da reconciliação de snooze e da auth de erro — pertencem a `@dev`/`@architect`, NÃO ao @devops. Hard-stop §8 respeitado (Iter 1 só; Iter 3/merge waived exigem autorização humana).

### Major — LÓGICA DE PRODUÇÃO (para `@dev` + ratificação `@architect`)

1. `v2/app/api/push/action/route.ts:77` — **Snooze de schedule em falta tratado como sucesso.** Se o utilizador clicar "Snooze" após o `dispatchDue` ter marcado a entrada como `sent` e a limpeza KV a ter removido, o branch devolve `{ ok:true, applied:false }` e o lembrete perde-se silenciosamente (o SW só envia `reminderId`). `marcar-feito` pode ser idempotente, mas `snooze` precisa de dados para recriar o schedule ou de resposta não-sucesso.
2. `v2/app/api/push/schedule/route.ts:128` — **GET `pending` devolve lembretes pending NORMAIS ao reconciler de snooze.** O `PUT /api/push/schedule` guarda lembretes agendados normais como `status:'pending'`; o `reconcileSnoozedReminders()` transforma cada `{id,fireAt}` devolvido em `snoozed` local. Resultado: lembretes futuros normais são re-rotulados como snoozed no próximo mount. Precisa de marcador/filtro dedicado para snoozes verdadeiros.
3. `v2/lib/push/reconcile-snooze.ts:22` — **Mesma classe do #2:** o helper deriva `snoozed` de todo o conjunto `pending`. Precisa de sinal de snooze explícito ou fonte mais estreita que `pending`. (As expectativas dos testes unitários mudam com isto.)
4. `v2/public/sw.js:76` — **Respostas não-2xx do `/api/push/action` não tratadas como falha.** `fetch()` só rejeita em erro de rede; um 401/400/500 passa como sucesso (a notificação fecha e o utilizador não tem sinal). Com cookie-auth de sessão, 401 é alcançável quando a sessão expira. Verificar `response.ok` e expor caminho de recuperação.

> Nota: #1, #2, #3 são fortemente acopladas — são o mesmo problema de contrato de reconciliação de snooze (o `pending` não distingue snooze verdadeiro de lembrete futuro normal). Provavelmente exigem uma decisão `@architect` sobre o marcador de snooze no contrato KV. #4 é mais isolada (defensiva de erro HTTP no SW).

### Major — DOC (stale Bearer/branch)

5. `docs/stories/active/4.9.story.md:162` — secções AC/tasks/dev-notes da story ainda descrevem `/api/push/action` como Bearer/`CRON_SECRET`, contradizendo o contrato cookie ratificado (D-ACTION-AUTH-COOKIE) na mesma story e em `route.ts`. Story internamente contraditória — risco de mandar follow-up para o design revogado.
6. `docs/handoffs/.../RETOMA-20260603-story-4.9-gate-PASS-iter2.md:13` (+63-65) — referência de branch errada (`...4.8-push-dispatch`) no handoff.

### Minor

7. `docs/handoffs/.../RETOMA-20260603-story-4.9-gate-CONCERNS-back-to-dev.md:13` — branch ref no handoff.
8. `docs/handoffs/.../RETOMA-20260603-story-4.9-ready-for-architect-gate.md:38` — MD058 (blank lines à volta da tabela).
9. `docs/stories/active/4.9.story.md:506` — linha de tabela malformada (MD056) na checklist CodeRabbit Integration.
10. `v2/app/api/push/dispatch/route.ts:33` — comentário de auth stale (diz "partilhada com /api/push/action" quando já não é).
11. `v2/tests/unit/api/push/action.test.ts:157` — falta caso de rejeição para `snoozeMinutes` inválido (`0`, negativos, decimais → 400).

---

## next_action

**Caminho A (recomendado):** O Eurico faz o **AC13 manual em Chrome + Edge** (notificação mostra "Marcar feito"+"Snooze 10min"; "Marcar feito" fecha sem abrir app → `sent`; "Snooze" adia 10min → `snoozed`). Em paralelo, `@dev` (+ ratificação `@architect` para os Major #1-#3 do contrato de snooze) corrige os findings CR Iter 1. Depois `@devops` push ff dos fixes (re-dispara CR Iter 2) → quando AC13 OK + CR limpo → `@devops` merge squash.

**Caminho B:** Se os Major #1-#3 forem considerados fora-scope desta story (ex: reconciliação de snooze é hardening de Epic 8), `@architect` pondera waiver explícito (autorização humana no commit — hard-stop §8) e os doc-fixes Major #5/#6 + Minor entram num commit de limpeza.

**O merge aguarda SEMPRE a confirmação manual do AC13 pelo Eurico — independentemente do caminho.**

Decisão de qual caminho: Eurico / `@architect`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260604-story-4.9-PR-aberto-aguarda-AC13.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Gage (@devops)`
DATA: `04/06/2026`
