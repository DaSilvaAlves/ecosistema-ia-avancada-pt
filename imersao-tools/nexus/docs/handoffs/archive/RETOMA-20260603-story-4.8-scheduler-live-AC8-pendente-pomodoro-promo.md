# RETOMA — Story 4.8 · scheduler LIVE · AC8 pendente (browser) · promoção do Pomodoro

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Claude (orquestrador main) — hotfix middleware fechado + scheduler montado com o Eurico
**to_agent:** any (próximo terminal) — (A) registar AC8 + `@po *close-story 4.8`; (B) `@devops` rotação do `CRON_SECRET`; (C) fluxo próprio do Pomodoro
**created:** 2026-06-03
**status:** pending
**prioridade:** ALTA — a 4.8 está a um passo (AC8) de fechar. Epic 4 a 8/10 → 9/10 ao fechar.

---

## ARRANQUE EM TERMINAL NOVO (ler primeiro)

A 4.8 (disparo server-side de Web Push) está **em produção e funcional**. O bloqueador do middleware (307) foi resolvido e o scheduler externo já bate o endpoint de minuto a minuto com sucesso. **Só falta o smoke AC8 no browser (acção do Eurico)** e depois o `@po *close-story 4.8`.

Há ainda **duas pontas independentes**: rotação do `CRON_SECRET` (exposto parcialmente em screenshots) e a promoção do **Pomodoro configurável** (que vive só numa branch, ainda não em produção).

**Estado git/infra verificado (03/06/2026):**
- `origin/main` = **`017a032c`** (`fix(nexus-v2): middleware exempta /api/push/dispatch ... (#56)`). A 4.8 + hotfix estão em `main`.
- Produção `https://imersao.ia.expressia.pt` serve `017a032c` (deployment `imercao-ia-15pcpg53v`, Production READY).
- Branch de trabalho do worktree principal: `feat/nexus-v2-story-4.8-push-dispatch` (partilhada, contém o Pomodoro `fd7fbd12` + untracked de sessões antigas). **Não é onde trabalhar a 4.8** — a 4.8 já está em `main`.

**Verificação rápida ao arrancar (prova que está vivo):**
```
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://imersao.ia.expressia.pt/api/push/dispatch
# esperado: 401 (auth exigida, middleware já NÃO redireciona — era 307)
```

---

## §A — O que JÁ está feito (não repetir)

| Passo | Estado |
|-------|--------|
| Hotfix middleware (307→/login) | **FEITO.** `@dev` fix (`/api/push/dispatch` em `PUBLIC_PATHS` + teste não-redirect) → `@architect` gate PASS → **PR #56 squash-merged `017a032c`** → redeploy auto. Handoff arquivado: `archive/RETOMA-20260603-story-4.8-HOTFIX-middleware-dispatch-307.md`. |
| Smoke pós-deploy | **FEITO.** Dispatch sem auth = **401** (era 307). Prova positiva com `Authorization: Bearer <CRON_SECRET>` = **200** `{"ok":true,"total":0,"dispatched":0,"failed":0}`. |
| `CRON_SECRET` provisionado | **FEITO** (sessão anterior). Vercel Production + Development + `v2/.env` local (gitignored). |
| Scheduler externo (cron-job.org) | **FEITO + ENABLED + SAVED.** Job "Nexus v2 — push dispatch": `POST https://imersao.ia.expressia.pt/api/push/dispatch`, header `Authorization: Bearer <CRON_SECRET>`, intervalo **1 min** (`* * * * *`), timezone Europe/Lisbon. **Test run = 200 OK** (165ms, Server: Vercel). |

## §B — AC8 smoke Chrome + Edge — PENDENTE (acção do Eurico no browser)

Este é o **único critério que falta** para fechar a 4.8. Valida só o *envio* da push (o display visível é stub — Story 4.9).

1. **Chrome** → `https://imersao.ia.expressia.pt`, login.
2. Garantir notificações push **activadas** (permissão concedida + subscrição feita na app).
3. Criar **lembrete** canal **push**, `fireAt` ~2 min no futuro.
4. Esperar o tick do scheduler (1 min) após o `fireAt` → confirmar **notificação push recebida**. (Alternativa manual: `curl -X POST .../api/push/dispatch -H "Authorization: Bearer $CRON_SECRET"` deve dar 200 com `dispatched:1` quando há lembrete due.)
5. **Repetir em Edge** (NFR23 — dois browsers).
6. Registar o resultado no Dev Agent Record da `4.8.story.md` → depois `@po *close-story 4.8`.

## §C — `@po *close-story 4.8` (após AC8 passar)

Bundle docs-only (sem novo CR — PR já merged):
- Status `Approved → Done` + `git mv docs/stories/active/4.8.story.md → completed/`.
- `EPIC-4.md` **8/10 → 9/10 Done** (resta 4.9).
- **2 doc fixes do CR Iter 2 (§F do handoff PR-55)** em `4.8.story.md`:
  - `:225` — "1 wiring client (`useReminders`)" → wiring é nos **handlers de `app/(app)/lembretes/page.tsx`** (texto-resumo stale; código já correcto).
  - `:138` — verificar a referência `[GAP-4.2]` contra `EPIC-4.md §7` antes de alterar.
  - (opcional) `env.ts:32` — `CRON_SECRET` min-length (hardening; secret é server-provisioned, dispatch já exige match exacto).

## §D — Rotação do `CRON_SECRET` — RECOMENDADO (`@devops`)

O valor do `CRON_SECRET` ficou **parcialmente visível em screenshots** durante a montagem do scheduler (03/06). Não é catastrófico (truncado), mas é o secret partilhado com produção. **Recomendação:** após a 4.8 fechar, `@devops` roda o secret:
1. Gerar novo (`openssl rand -hex 32`), **nunca logar/committar**.
2. `vercel env rm CRON_SECRET production/development` + `vercel env add` com o novo valor.
3. Actualizar o header `Authorization: Bearer <novo>` no job cron-job.org.
4. Actualizar `v2/.env` local.
5. Redeploy + smoke (401 sem auth; 200 com o novo Bearer).
Não bloqueia o AC8 — é higiene pós-fecho.

## §E — Promoção do Pomodoro configurável (fluxo PRÓPRIO — `@sm`/`@dev`/`@architect`/`@devops`)

**Facto verificado no git:** o commit `fd7fbd12 feat: add configurable pomodoro alarm` existe **só** na branch partilhada `feat/nexus-v2-story-4.8-push-dispatch`. **NÃO está em `main`** (`git merge-base --is-ancestor fd7fbd12 origin/main` = falso). Produção serve `017a032c` — sem o Pomodoro configurável.

- Em produção o Pomodoro é o básico (`25:00`, só Iniciar/Reset). A versão configurável (campos **Minutos** + dropdown **Alarme: Urgente**) que o Eurico viu está num **localhost/preview** dessa branch, não em produção.
- Foi **deliberadamente excluído** do PR #55 (a 4.8 levou só os seus 3 commits) para manter a 4.8 isolada — não é esquecimento.
- Tem **story própria**: `pomodoro-custom-duration-alarm.story.md`.
- **Próxima acção (quando for prioridade):** isolar `fd7fbd12` numa branch limpa de `main` → `@architect` gate → `@devops` push + PR próprio → merge → redeploy. Mesmo padrão do hotfix. **Não misturar com a 4.8.**

## Contexto herdado — NÃO reabrir

- Hotfix middleware (PR #56) e gate `@architect` PASS — fechados.
- Decisão de entrada [GAP-4.6] (Opção A′), gate de saída 4.8 — na `4.8.story.md`.
- Backlog **AC5 recorrência DIFERIDA** (`runReminderRecurrenceEngine`, padrão `runFinanceRecurrenceEngine`, pós-Epic-4) → `@po`/`@pm`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = Nexus v2. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-story-4.8-scheduler-live-AC8-pendente-pomodoro-promo.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Claude (orquestrador main)
DATA: `03/06/2026`
