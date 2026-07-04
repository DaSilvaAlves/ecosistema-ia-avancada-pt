# RETOMA — Story 9.2 FECHADA (merged em main) — Epic 9 3/11 — próximo 9.8 (CI) ou 9.3 (SW/PWA)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.2 FECHADA (Done, merged)** → **próxima: 9.8 (CI bloqueante, recomendada) ou 9.3 (Service Worker/PWA)**
**Data:** 04/07/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** any (preferência `@sm *draft 9.8`) · **status:** pending
**Branch de partida:** `main` (HEAD = `66486112` + closure commit docs — ver §2)

**Porquê este handoff:** a 9.2 (E2E Playwright caminho crítico) percorreu o ciclo completo (draft→validate→dev→qa→merge→close) e está DONE em `main`. Substitui e arquiva o handoff anterior (`RETOMA-20260703-9.1b-FECHADA`), já superado.

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a production-ready. Progresso: **3/11 unidades Done** — 9.11 (isolamento full-suite) + unidade 9.1 (cobertura ≥60% packages core) + **9.2 (E2E caminho crítico)**. A 9.2 entregou um spec E2E leve e determinístico `v2/tests/e2e/critical-path.spec.ts` (login → primeiro prompt → criar tarefa via UI → tarefa visível em `/tarefas` → `page.reload()` → persistência confirmada em Dexie), que corre no CI regular (não na suite pesada de 50 prompts). Reutiliza ADR-8 (`installMockRoute`/`mock-events.ts`, zero mock paralelo) com fidelidade de protocolo `ExecutorSSEEvent` na fronteira `/api/anthropic/proxy` (asserção falsificável: args fragmentados em `input_json_delta` reconstruídos client-side). **Achado colateral valioso:** o AC5 corrigiu um bug latente do CI — o job `e2e` de `.github/workflows/nexus-v2-ci.yml` tinha `NEXUS_PASSWORD_HASH` placeholder inválido (login falhava sempre 401); corrigido copiando o par hash+`TEST_PASSWORD` já validado de `e2e-regression.yml`. **Provado em CI real** (o job E2E do PR #104 passou o login pela primeira vez). Produção mantém-se LIVE via Anthropic; 9.10 (deploy) continua BLOQUEADA por `production-state-verification-gate.md`.

## 2. Estado exacto do repo (verificado 04/07/2026)

```
branch: main — HEAD 66486112 (merge da 9.2, PR #104) + closure commit docs 9.2 (pendente do @devops)
66486112 test(nexus-v2): E2E caminho crítico login→prompt→tarefa→persistência [Story 9.2] (#104)
ad62b839 docs(nexus-v2): handoff RETOMA 9.1b FECHADA + arquiva 9.1a [Story 9.1b]
f06df1c5 docs(nexus-v2): close-story 9.1b [Story 9.1b]
```

**Closure commit docs da 9.2 — no working tree, staged pelo `@po`:** rename `stories/active/9.2.story.md` → `stories/completed/9.2.story.md` (Status Done, QA Results + PO Closure) + `EPIC-9.md` (9.2→DONE, contagem 3/11). Consolidado neste handoff — o `@devops` committa o closure + estes handoffs numa só operação.

Estado do Epic 9 (`docs/EPIC-9.md`): **Done (3):** 9.11 · unidade 9.1 (9.1a+9.1b) · 9.2. **Falta (8):** 9.3 (SW) · 9.4 (manifest/ícones PWA) · 9.5 (offline degradado) · 9.6 (backup export) · 9.7 (restore import) · 9.8 (CI bloqueante) · 9.9 (CodeRabbit obrigatório) · 9.10 (deploy).

> **Ruído fora-scope no working tree (NÃO committar):** submódulos sujos (`comunidade`, `starter-builder`), untracked (`.agent/`, `.codex/`, `.antigravity/`, `.cursor/`, backups `.backup.*`), docs `PO-VALIDATION-*`/`PR-BODY-*`/`QA-GATE-*`, e `9.1.story.md` (SUPERSEDED, preservado intencionalmente — ver §5 do EPIC-9). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.2 fixou / decisões a NÃO reabrir

- **Decisão de gate Opção C (`@po`)**: a 9.2 tem gate `@qa` (E2E), com o `@qa` como **enforcer do Evidence Gate** porque o AC5 toca `.github/workflows/` (território bloqueador `not-tested-trailer-rules.md`). Trip-wire: subiria a `@architect` só se o AC5 exigisse gerar hash novo / tocar control-flow / outros workflows — **não foi o caso** (cópia aditiva de 2 valores + 1 path). Padrão reutilizável para futuras stories E2E que toquem config leve de CI.
- **AC5 = cópia aditiva, não geração**: hash bcrypt `$2a$10$uibDFC5h...` + `TEST_PASSWORD: nexus-test-password` copiados de `e2e-regression.yml` (L37/L39) para o `env:` do job `e2e` de `nexus-v2-ci.yml`. NÃO reabrir/regenerar.
- **Evidence Gate (território bloqueador)**: usar `Evidence:` (playwright `--list` + `test:e2e` 0 FAIL + `--list` regressão), NUNCA `Not-tested:`. Vale para qualquer story que toque `.github/workflows/`, `playwright.config`, `vitest.config`, `package.json` scripts, `next.config`, `tsconfig`.
- **ADR-1 a ADR-9 intactos**; mock via `installMockRoute`/`mock-events.ts` (zero mock paralelo); asserção determinística por `kanban-card-{id}` (não fallback soft de contagem).
- **Gotcha de reprodução local (não é bug do código)**: ao correr o E2E localmente com um ficheiro `.env`, o `@next/env`/dotenv-expand consome o `$` do hash bcrypt (resolve a 14 chars → 401). Escapar `\$` no `.env` local OU usar o mecanismo de env do próprio job CI. No CI real (GitHub Actions env) não acontece.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260704-story-9.2-FECHADA-epic-9-3de11-proximo-9.8-ou-9.3.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. Próxima peça: 9.8 (recomendada) ou 9.3

- **9.8 — GitHub Actions CI bloqueante (RECOMENDADA).** Desbloqueada pela 9.11 (full-suite determinístico — pré-condição de "tests <5 min" credível). NÃO bloqueada por estado de produção (institui o gate CI sobre o repo — lint+typecheck+test em PR — não toca deploy/LIVE). **Sinergia imediata:** passa a correr a E2E da 9.2 (via `test:e2e` já corrigido no AC5) como gate automático em todos os PRs. Executor `@devops`, gate `@architect` (config de CI = território bloqueador `not-tested-trailer-rules.md` → `Evidence:`). → `@sm *draft 9.8`.
- **9.3 — Service Worker + cache strategy (alternativa paralelizável).** Fundação da PWA (NFR21). SW manual em `public/sw.js` (NÃO Workbox, arch §11): install/activate/fetch (network-first `/api/*` com fallback `503 {offline:true}`, cache-first assets) + handler `push` do Epic 4 INTOCADO (Risco R4 — não partir o Web Push). Executor `@dev`, gate `@architect`. Abre a cadeia 9.3→9.4→9.5. `internal-state-contract-gate.md` relevante (estado offline distribuído).
- **9.10 — deploy: BLOQUEADA.** `production-state-verification-gate.md` — antes de desenhar, `vercel env ls --environment production` + SHA activo em produção + reconciliar deployment paralelo `4e2b1c4`/J-6 com o Eurico. Incógnitas (a)/(b) do §10 bloqueiam SÓ 9.10/estado-LIVE.

## 5. Ciclo padrão da próxima story

`@sm *draft {id}` → `@po *validate-story-draft {id}` → gate de entrada (conforme executor/`separation-of-roles.md`) → branch `feat/{id}-slug` (de `main`) → `@dev`/`@devops` implementa → gate de saída (**CR `--base main`** — obrigatório em território infra/config) → `@devops` push + PR + **6 condições `merge-authority` no head SHA** + auto-merge `--admin --squash --delete-branch` → `@po *close-story {id}` → `@devops` closure commit docs.

**Regras críticas:** `not-tested-trailer-rules.md` (`Evidence:` em território bloqueador), `separation-of-roles.md`, `cr-base-main-no-gate-saida`. CodeRabbit CLI: `coderabbit review --agent --type committed --base main` (`--prompt-only` REMOVIDO). WSL path: `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`. `gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`. Hard-stop §8 = máx. 2 iter CR (Iter 3+ = `Authorized-by: Eurico`).

## 6. Git para o próximo terminal

```
git checkout main
git pull --ff-only origin main   # HEAD = 66486112 (+ closure commit docs 9.2 quando o @devops o fizer)
```
Não há branches de feature pendentes (a de 9.2 foi apagada no merge). Working tree só com ruído fora-scope conhecido.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260704-story-9.2-FECHADA-epic-9-3de11-proximo-9.8-ou-9.3.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `04/07/2026`
