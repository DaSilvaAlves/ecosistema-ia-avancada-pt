# RETOMA — Story 9.9 FECHADA (merged em main) — Epic 9 5/11 — CI+CodeRabbit bloqueantes — próximo 9.3 (SW/PWA)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.9 FECHADA (Done, merged)** → **próxima: 9.3 (Service Worker/PWA — recomendada, fundação) ou 9.6 (backup export)**
**Data:** 05/07/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** any (preferência `@sm *draft 9.3` ou `/sdc 9.3 --push`) · **status:** pending
**Branch de partida:** `main` (HEAD = `ca4764be` + closure commit docs — ver §2)

**Porquê este handoff:** a 9.9 (CodeRabbit obrigatório) percorreu o ciclo `/sdc 9.9 --push` completo (draft→validate→dev→qa→push→PR→merge→activação→close) e está DONE em `main`. Com ela, o par CI/review (NFR18) fica fechado — a branch protection de `main` tem agora **5 required contexts** (CI + CodeRabbit). Substitui e arquiva o handoff anterior (`RETOMA-20260704-9.8`).

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a production-ready. Progresso: **5/11 unidades Done** — 9.11 + unidade 9.1 + 9.2 + 9.8 + **9.9**. A 9.9 acrescentou o context **`CodeRabbit`** (a revisão real, legacy commit status — NÃO o `CodeRabbit Status` decorativo) como **5º required context** ao ruleset que a 9.8 criou. A branch protection de `main` está agora com 5 required contexts: `Detect Nexus v2 Changes`, `Lint + TypeScript`, `Vitest unit + coverage`, `Playwright E2E + bundle key check`, `CodeRabbit` (strict=false, enforce_admins=false, required_pull_request_reviews=null). A **NFR18** fica satisfeita como **gate de presença** (a revisão CodeRabbit tem de completar antes do merge) + o veto por severidade CRITICAL garantido ao nível de **processo** por `merge-authority.md` (o agente não mergeia com CR Major aberto no head SHA). A automação-na-plataforma do veto (`required_pull_request_reviews`) fica como GAP honesto fora de âmbito. Produção mantém-se LIVE via Anthropic; 9.10 (deploy) continua BLOQUEADA por `production-state-verification-gate.md`.

## 2. Estado exacto do repo (verificado 05/07/2026)

```
branch: main — HEAD ca4764be (merge da 9.9, PR #107) + closure commit docs 9.9 (pendente do @devops)
ca4764be docs(nexus-v2): prepara AC4 branch protection 5º context CodeRabbit — Fase 3 [Story 9.9] (#107)
06715dca docs(nexus-v2): sincroniza handoff 9.8 — branch protection AC4 ACTIVADA, 9.9 desbloqueada [Story 9.8]
5d790e38 docs(nexus-v2): AC4 branch protection ACTIVADA — required checks main + C2 provado [Story 9.8]
```

**Branch protection de `main` = ACTIVA com 5 required contexts** (verificado por GET): os 4 da 9.8 + `CodeRabbit`. `strict=false`, `enforce_admins=false`, `required_pull_request_reviews=null`.

**Closure commit docs da 9.9 — staged pelo `@po`:** rename `stories/active/9.9.story.md` → `stories/completed/9.9.story.md` (Done, QA Results incorporado, AC status) + `EPIC-9.md` (9.9→DONE, 5/11, **prosa §10 reconciliada** — já não diz "AC4 deferido/main 404"). Consolidado neste handoff — o `@devops` committa closure + handoffs numa só operação.

> **Efeito de processo (desde a 9.8):** `main` está protegido. Pushes directos docs-only passam com admin bypass (`Bypassed rule violations ... N of N required status checks are expected`). O auto-merge `--admin --squash` continua a funcionar (enforce_admins=false). Considerar closure docs via PR daqui para a frente.

> **Ruído fora-scope (NÃO committar):** submódulos, untracked (`.agent/`, `.codex/`, `.antigravity/`, `.cursor/`, backups), docs `PO-VALIDATION-*`/`PR-BODY-*`/`QA-GATE-*`, e `9.1.story.md` (SUPERSEDED preservado). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.9 fixou / decisões e lições a NÃO reabrir

- **Context correcto = `CodeRabbit`** (legacy commit status, revisão real da GitHub App, reporta `success`/`Review completed`). **NÃO `CodeRabbit Status`** (check-run decorativo do job `coderabbit-check` em `pr-automation.yml`, só confirma que `.coderabbit.yaml` existe). Confirmado em múltiplos head SHAs. Um required context no decorativo seria um gate falso.
- **NFR18 = gate de presença + processo.** A 9.9 torna a *presença* da revisão obrigatória na plataforma. O *veto por severidade* (CRITICAL bloqueia) é garantido por `merge-authority.md` (condições 2/3: CR Status SUCCESS + 0 comentários actionable no head SHA). **Não alegar "NFR18 100% automatizada na plataforma"** (C2) — a automação do veto exigiria `required_pull_request_reviews` (política do monorepo, consentimento novo), registada como GAP fora de âmbito, NÃO como falha.
- **`.coderabbit.yaml` NÃO foi tocado** — já adequado (`auto_review.enabled`, `base_branches:[main]`, sem `path_filters` de exclusão; corre em todos os PRs não-draft). Não mudar foi a decisão certa.
- **Risco residual (AC5):** o CodeRabbit é SaaS externo. Outage → o required check `CodeRabbit` fica `pending` e prende o PR. Sem mitigação técnica na API do GitHub; resolve-se com `--admin` bypass (enforce_admins=false permite-o). Aceite como risco residual.
- **Consentimento:** acrescentar 1 context ao array já ratificado na 9.8 foi tratado como extensão da mesma decisão (não exigiu novo consentimento formal, só heads-up C1). O Eurico autorizou o merge+activação.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260705-story-9.9-FECHADA-epic-9-5de11-proximo-9.3-SW-PWA.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. Próxima peça: 9.3 (recomendada) ou 9.6

Com o par CI/review (9.8+9.9) fechado, as candidatas são a frente PWA e a de backup:

- **9.3 — Service Worker + cache strategy (RECOMENDADA — fundação PWA).** SW **manual em `public/sw.js` (NÃO Workbox** — arch §11, decisão fechada): install (cache static), activate (limpeza de caches antigos), fetch (network-first para `/api/*` com fallback `503 {offline:true}`, cache-first para assets) e handler `push` (já usado pelo Epic 4 — **INTOCADO**, Risco R4: não partir o Web Push; GAP-9.3). Executor `@dev`, gate `@architect` (SW distribui estado offline por várias camadas → `internal-state-contract-gate.md` relevante; `cr-base-main-no-gate-saida` — SW toca fetch de toda a app). Abre a cadeia **9.3→9.4** (manifest/ícones PWA, executor `@ux-design-expert`/gate `@dev`) **→9.5** (offline degradado; banner com estados de render → `react-component-test-criteria.md`).
- **9.6 — Backup export ZIP (alternativa paralelizável, baixo acoplamento).** `dexie-export-import` (já em dependencies, arch §17) → JSON → ZIP (NFR22). Executor `@dev`, gate `@qa`. A 9.7 (restore import — escrita em Dexie, `internal-state-contract-gate.md`) é a contraparte.
- **9.10 — deploy: BLOQUEADA** por `production-state-verification-gate.md` (`vercel env ls` + SHA activo + reconciliar `4e2b1c4`/J-6). Incógnitas (a)/(b) do §10.

## 5. Ciclo padrão / Git

`@sm *draft {id}` → `@po *validate-story-draft` → gate de entrada → branch (de `ca4764be`) → impl → **CR `--base main` no gate de saída E verificar CR server-side no head do PR** → `@devops` PR + **6 condições `merge-authority` no head SHA** (agora com 5 required checks, incl. `CodeRabbit`) + merge `--admin --squash` → `@po *close-story` → `@devops` closure commit. `gh` SEMPRE `--repo DaSilvaAlves/...`; NUNCA `git add -A`; hard-stop §8 (Iter 3+ = `Authorized-by: Eurico`). CR CLI: `coderabbit review --agent --type committed --base main` (`--prompt-only` REMOVIDO), WSL `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`.

**Nota nova (branch protection activa):** os PRs agora precisam dos 5 required checks verdes (SKIPPED conta como passing para checks de código em PRs docs-only). O `CodeRabbit` (revisão real) tem de settle `success` antes do merge — pode levar ~7-30 min. Um outage do CodeRabbit prende o check; usar `--admin` para bypass se necessário.

```
git checkout main
git pull --ff-only origin main   # HEAD = ca4764be (+ closure commit docs 9.9 quando o @devops o fizer)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260705-story-9.9-FECHADA-epic-9-5de11-proximo-9.3-SW-PWA.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `05/07/2026`
