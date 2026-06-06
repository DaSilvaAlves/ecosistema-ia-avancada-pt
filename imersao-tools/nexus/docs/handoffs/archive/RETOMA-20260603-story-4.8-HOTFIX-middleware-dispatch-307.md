# RETOMA — Story 4.8 HOTFIX · middleware redireciona `/api/push/dispatch` (307 → /login)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Gage (`@devops`) — descoberto no smoke de provisionamento (AC8 antecipado)
**to_agent:** Dex (`@dev`) — fix middleware → Aria (`@architect`) gate → Gage (`@devops`) redeploy
**created:** 2026-06-03
**status:** consumed
**consumed_at:** 2026-06-03T12:36:00Z
**consumed_by:** Gage (`@devops`)
**prioridade:** ALTA — BUG de produção. A 4.8 (já em `main` `6b429560`) está **não-funcional** em produção sem este fix.

---

## RESOLUÇÃO (03/06/2026 — Gage `@devops`)

**BLOQUEADOR RESOLVIDO.** Cadeia completa executada: `@dev` fix `middleware.ts` (`/api/push/dispatch` em `PUBLIC_PATHS` + teste de não-redirect) → `@architect` (Aria) gate PASS → `@devops` PR #56 → CR APPROVED, CI CLEAN → **squash merge `017a032c` em `main`** (`6b429560..017a032c`) → **redeploy de produção** (auto-deploy disparado pelo merge, deployment `imercao-ia-15pcpg53v` Production READY, aliasado a `https://imersao.ia.expressia.pt` + git-main → SHA `017a032c`).

**Smoke de produção (critério de sucesso):**
- `POST /api/push/dispatch` sem auth → **401** (era 307 — BUG resolvido; o middleware já não redireciona, o handler corre).
- `POST /api/push/dispatch` com `Authorization: Bearer <CRON_SECRET>` → **200** `{"ok":true,"total":0,"dispatched":0,"failed":0}` (CRON_SECRET activo no build, auth Bearer timing-safe OK).

Continuidade: `RETOMA-20260603-story-4.8-PR-55-aberto-provisionamento-pos-merge.md` §B.2 (scheduler cron-job.org) → §C (AC8) → `@po *close-story 4.8`.

---

## ARRANQUE EM TERMINAL NOVO (ler primeiro)

**Invocar:** `@dev` (Dex) e pedir: "hotfix do middleware que redireciona `/api/push/dispatch` (307→/login) — Story 4.8". O agente deve ler **este handoff na íntegra** + `v2/middleware.ts` antes de tocar em código.

**Estado git/infra verificado (03/06/2026):**
- `main` = `origin/main` = **`6b429560`** (Story 4.8 squash-merged via PR #55). A 4.8 está em `main` mas o dispatch é não-funcional em prod (este bug).
- Branch de trabalho actual no worktree principal: `feat/nexus-v2-story-4.8-push-dispatch` (a branch partilhada original, com o pomodoro `fd7fbd12`; **não é onde fazer o hotfix**). Worktree tem muitos untracked/uncommitted de sessões antigas — **fazer o hotfix a partir de `main` limpo** (branch `fix/...` nova ou worktree de `main`).
- `CRON_SECRET` **já provisionado** no Vercel (Production + Development) + `v2/.env` local (gitignored). Não regerar. O valor está no `.env` para o cron-job.org/AC8 mais tarde.
- Deployment de prod activo: `6b429560` (criado 10:10:22Z), construído **antes** do `CRON_SECRET` — precisa de redeploy após o hotfix.
- Handoffs/INDEX são ficheiros de working-tree (uncommitted) — o terminal novo lê-os do disco directamente.

**Verificação rápida ao arrancar (reproduz o bug):**
```
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://imersao.ia.expressia.pt/api/push/dispatch
# actual: 307 (redirect /login — BUG)   |   esperado pós-fix+redeploy: 401
```

**Aviso "claude.exe in use" / contexto baixo:** inofensivo — handoff auto-suficiente, arranca limpo.

---

## O bug (confirmado em produção)

`POST https://imersao.ia.expressia.pt/api/push/dispatch` → **307 Temporary Redirect, Location: /login**.

O **middleware de auth** (`v2/middleware.ts`, Edge) intercepta antes do handler:
- `matcher: '/((?!api/auth|_next/static|_next/image|favicon|manifest|sw).*)'` — exclui só `api/auth`, **não** `api/push/dispatch`.
- `PUBLIC_PATHS`/`PUBLIC_PREFIXES` não incluem `/api/push/dispatch`.
- Um scheduler bate sem cookie `nexus_session` → middleware faz `redirect('/login')` (307).
- O handler com a auth `CRON_SECRET` Bearer **nunca corre**.

**Impacto:** o disparo server-side (núcleo da 4.8, AC2 "push às 15h com app fechada") não funciona. Afecta Vercel Cron **e** scheduler externo (ambos via HTTP → 307). `/api/push/send` (4.7) não tem o problema por ser cookie-auth (browser passa o middleware).

**Porque escapou aos gates:** unit tests chamam o handler `POST` directamente (saltam o middleware); a review (Aria) validou a lógica do handler, não a interacção Edge-middleware→Node-handler. Lacuna entre camadas — apanhada no 1.º smoke ao vivo (AC8).

## O fix proposto (`@dev`)

`v2/middleware.ts` — exemptar o dispatch do redirect de cookie (o handler mantém a auth `CRON_SECRET`):

```ts
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/push/dispatch'];
```

> `/api/push/dispatch` fica "público" só no sentido de saltar o redirect de cookie — a auth real (`CRON_SECRET` Bearer, timing-safe, 503 se ausente / 401 se errado) mantém-se no handler. Mesmo padrão de `/api/auth/login`. Considerar também adicionar `/api/push/dispatch` à exclusão do `matcher` (optimização — evita correr o middleware de todo nessa rota), mas só `PUBLIC_PATHS` já resolve.

**Verificar no fix:** nenhuma outra rota cookie-less precisa do mesmo (só o dispatch é Bearer-auth; `send`/`subscribe` são cookie-auth do browser). Não expor nada além do dispatch.

## Processo (auth/security path → não é fix unilateral do `@devops`)

1. **`@dev`** aplica o fix em `middleware.ts` + teste (idealmente um teste que prove que `/api/push/dispatch` **não** é redirecionado pelo middleware — cobre a lacuna de camada). `not-tested-trailer-rules.md`: middleware de auth é red-flag → evidência local obrigatória (curl ao endpoint após deploy: 307→401).
2. **`@architect`** (Aria) gate — reachability + segurança (confirmar que a exempção não abre buraco; o handler impõe `CRON_SECRET`).
3. **`@devops`** (Gage) — push + PR (ou hotfix direto a `main` conforme SOP `hotfix-producao.md`) → redeploy → **smoke: `curl -X POST .../api/push/dispatch` deve dar 401** (não 307, não 503).

## Estado do provisionamento (já feito — fica)

- `CRON_SECRET` no Vercel (Production + Development) + `v2/.env` local (gitignored). **Valor nunca logado/committado.** Correcto, mantém-se.
- Redeploy **não feito** (era inútil — o 307 é no middleware, independente do `CRON_SECRET`).
- cron-job.org **não montado** (endpoint partido — só após o fix).

## Sequência para fechar a 4.8 (depois do hotfix)

1. Hotfix middleware (este handoff) → merged em `main` → redeploy.
2. Smoke dispatch sem auth = **401** (prova reachability + `CRON_SECRET` activo).
3. Montar scheduler (cron-job.org 1-min, `Authorization: Bearer <CRON_SECRET do .env>`) — ver `RETOMA-...PR-55-aberto-provisionamento-pos-merge.md` §B.2.
4. AC8 smoke Chrome+Edge (lembrete ~2min → 200 do dispatch / evento push).
5. `@po *close-story 4.8` (status Done + `git mv` completed/ + EPIC-4 8/10→9/10 + 2 doc fixes do CR Iter 2 §F).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = Nexus v2.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-story-4.8-HOTFIX-middleware-dispatch-307.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Gage (`@devops`)
DATA: `03/06/2026`
