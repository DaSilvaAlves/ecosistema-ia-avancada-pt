# RETOMA — Story 9.8 FECHADA (merged em main) — Epic 9 4/11 — AC4 branch protection DEFERIDO (aguarda consentimento Eurico)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.8 FECHADA (Done, merged)** → **próxima: 9.9 (CodeRabbit obrigatório — mas herda a dependência do AC4) ou 9.3 (SW/PWA — independente)**
**Data:** 04/07/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** any (+ acção pendente do Eurico — ver §4) · **status:** pending
**Branch de partida:** `main` (HEAD = `fe028edc` + closure commit docs — ver §2)

**Porquê este handoff:** a 9.8 (CI bloqueante) percorreu o ciclo `/sdc 9.8 --push` completo (draft→validate→dev→qa/architect→push→PR→merge→close) e está DONE em `main`, com **um AC deferido a decisão humana** (AC4 branch protection). Substitui e arquiva o handoff anterior (`RETOMA-20260704-9.2-FECHADA`).

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a production-ready. Progresso: **4/11 unidades Done** — 9.11 + unidade 9.1 + 9.2 + **9.8 (CI bloqueante)**. A 9.8 tornou o workflow `nexus-v2-ci.yml` robusto para ser *required*: removeu o `paths:` do trigger e adicionou um job `changes` (`dorny/paths-filter@v3`) + 3 jobs condicionais que **reportam sempre** (skipped=success) — evitando o "required check preso" em PRs que não tocam o Nexus; adicionou `permissions: contents: read` least-privilege e `timeout-minutes` explícitos (5/8/10). CI verde a ~2m52s (<5min, AC5 empírico). **Porém a activação real da branch protection (AC4) — marcar os checks como required em `main` — foi DEFERIDA**: é política do repo INTEIRO (afecta `.aiox-core/`, `comunidade/`, `membros/`), exige token admin e consentimento explícito do Eurico. Fica documentada com o comando `gh api` exacto (4 required contexts, strict=false). Produção mantém-se LIVE via Anthropic; 9.10 (deploy) continua BLOQUEADA por `production-state-verification-gate.md`.

## 2. Estado exacto do repo (verificado 04/07/2026)

```
branch: main — HEAD fe028edc (merge da 9.8, PR #105) + closure commit docs 9.8 (pendente do @devops)
fe028edc ci(nexus-v2): CI bloqueante — path-filter robusto + timeouts + branch protection deferida [Story 9.8] (#105)
08e66f6a docs(nexus-v2): close-story 9.2 + handoff RETOMA [Story 9.2]
66486112 test(nexus-v2): E2E caminho crítico [Story 9.2] (#104)
```

**Closure commit docs da 9.8 — staged pelo `@po`:** rename `stories/active/9.8.story.md` → `stories/completed/9.8.story.md` (Done, AC status, Architect RE-GATE incorporado, débitos) + `EPIC-9.md` (9.8→DONE, 4/11). Consolidado neste handoff — o `@devops` committa o closure + estes handoffs numa só operação.

**Branch protection de `main` = 404 (NÃO protegido)** — verificado pré e pós-merge. A 9.8 **não** activou nada; só preparou o workflow e documentou o comando.

> **Ruído fora-scope (NÃO committar):** submódulos sujos, untracked (`.agent/`, `.codex/`, `.antigravity/`, `.cursor/`, backups), docs `PO-VALIDATION-*`/`PR-BODY-*`/`QA-GATE-*`, e `9.1.story.md` (SUPERSEDED preservado). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.8 fixou / decisões e lições a NÃO reabrir

- **AC2 (restructure do path-filter)**: trigger sem `paths:`; job `changes` corre sempre; 3 jobs `if: nexus || workflow_dispatch` (skipped=success). Fecha o "required check preso". **C5: os 3 `name:`/context NÃO se renomeiam** (`Lint + TypeScript`, `Vitest unit + coverage`, `Playwright E2E + bundle key check`) — os required contexts apontam para eles. Padrão idêntico ao `ci.yml`.
- **Falso-verde do `changes`**: se o job `changes` falhar, os dependentes skipam=success (falso-verde). Fecha-se com `Detect Nexus v2 Changes` como **4º required context**. **OBS-1 (crítica): o comando de branch protection TEM de incluir os 4 contexts** — omitir o 4º reabre o buraco.
- **LIÇÃO reforçada (`cr-base-main-no-gate-saida`)**: o CR **CLI local `--base main` deu 0 findings**, mas o **CR server-side no PR apanhou 4 Major** (2 security no workflow + 2 doc). Confirma a regra: o gate de saída corre CR `--base main` E o CR server-side no PR continua parte não-opcional do ciclo. **Verificar sempre os comentários CR no head SHA do PR, não confiar só no CR CLI local.**
- **Débitos registados (não reabrir sem contexto):**
  - `REC-9.8-PERSIST-CREDENTIALS` (Baixa/Segurança) — finding #2 Minor (`zizmor artipacked`). Aplicar `persist-credentials: false` **quebra o CI** (post-cleanup `git submodule foreach` → `fatal: exit 128`). Eurico deu **waiver explícito** ao Minor. Reintroduzir só depois de ↓.
  - `REC-REPO-HYGIENE-GITLINKS` (Média/repo-wide) — **4 gitlinks órfãos sem `.gitmodules`** (`comunidade`, `briefing-generator`, `starter-builder`, `student-profiler`). Pré-requisito do anterior. Achado colateral da 9.8; trabalho `@devops` separado.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260704-story-9.8-FECHADA-epic-9-4de11-AC4-branch-protection-deferido.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. ACÇÃO PENDENTE DO EURICO — activar branch protection (AC4)

**A 9.8 está Done, mas o gate CI só passa a bloquear de facto quando a branch protection for activada.** Isto é decisão de governança do repo INTEIRO — o Eurico tem de consentir. Quando consentir, o `@devops` (token admin) corre o comando documentado na story `9.8.story.md` (secção AC4):

- `gh api PUT .../branches/main/protection` com **`required_status_checks.strict=false`** (não forçar rebase a todo o monorepo) e os **4 required contexts**: `Detect Nexus v2 Changes` + `Lint + TypeScript` + `Vitest unit + coverage` + `Playwright E2E + bundle key check` (**OBS-1: os 4, senão reabre o falso-verde**).
- **Verificação C2 obrigatória pós-activação:** abrir um PR que NÃO toca `imersao-tools/nexus/v2/**` (ex: só `.aiox-core/`) e confirmar que fica **mesclável** (checks skipped/success, não "waiting for status"). É a prova definitiva do blast-radius — nunca foi exercida sob protecção neste repo.

## 5. Próxima peça: 9.9 (herda a dependência do AC4) ou 9.3 (independente)

- **9.9 — CodeRabbit obrigatório.** Acrescenta o contexto CodeRabbit como *required* — **depende da mesma activação de branch protection que a 9.8 deixou deferida**. Faz sentido fechar 9.9 **em conjunto com a activação do AC4** (um único acto de branch protection com todos os required contexts: 4 da 9.8 + CodeRabbit da 9.9). Executor `@devops`, gate `@qa`. Se o Eurico ainda não consentir a branch protection, a 9.9 fica igualmente à espera.
- **9.3 — Service Worker + cache strategy (verdadeiramente independente).** Fundação PWA (NFR21). SW manual `public/sw.js` (NÃO Workbox, arch §11); handler `push` do Epic 4 INTOCADO (Risco R4). Executor `@dev`, gate `@architect`. Abre a cadeia 9.3→9.4→9.5. `internal-state-contract-gate.md` relevante. **Recomendada se se quiser avançar sem esperar pelo consentimento do AC4.**
- **9.10 — deploy: BLOQUEADA** por `production-state-verification-gate.md` (`vercel env ls` + SHA activo + reconciliar `4e2b1c4`/J-6).

## 6. Ciclo padrão / Git

`@sm *draft {id}` → `@po *validate-story-draft` → gate → branch (de `fe028edc`) → impl → **CR `--base main` no gate de saída E verificar CR server-side no head do PR** → `@devops` PR + 6 condições `merge-authority` no head SHA + merge → `@po *close-story` → `@devops` closure commit. `gh` SEMPRE `--repo DaSilvaAlves/...`; NUNCA `git add -A`; hard-stop §8 (Iter 3+ = `Authorized-by: Eurico`). CR CLI: `coderabbit review --agent --type committed --base main` (`--prompt-only` REMOVIDO), WSL `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`.

```
git checkout main
git pull --ff-only origin main   # HEAD = fe028edc (+ closure commit docs 9.8 quando o @devops o fizer)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260704-story-9.8-FECHADA-epic-9-4de11-AC4-branch-protection-deferido.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `04/07/2026`
