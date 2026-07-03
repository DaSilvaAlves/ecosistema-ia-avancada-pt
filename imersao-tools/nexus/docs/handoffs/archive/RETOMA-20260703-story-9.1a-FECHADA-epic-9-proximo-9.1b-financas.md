# RETOMA — Story 9.1a FECHADA (merged em main) — continuar com 9.1b (cobertura package finanças)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.1a FECHADA (Done, merged)** → **próxima: 9.1b (cobertura package finanças)** — já Approved pelo `@po`, Draft em `stories/active/9.1b.story.md`
**Data:** 03/07/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** any (arranca `@dev *develop 9.1b`) · **status:** pending
**Branch de partida:** `main` (HEAD = `b21bb0c2` + closure commit docs da 9.1a — ver §2)

**Porquê este handoff:** a 9.1a (1.ª metade do split da 9.1) percorreu o ciclo completo hoje (draft→validate→dev→qa→merge→close) e está DONE em `main`. Esta retoma consolida o estado e aponta a peça grande que falta: **9.1b (finanças)**. Substitui e arquiva os dois handoffs anteriores do Epic 9 (`RETOMA-20260701-9.11` e `RETOMA-20260702-9.1a-READY`), ambos já superados.

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a production-ready. Progresso: **9.11 (isolamento full-suite) + 9.1a (cobertura rotas proxy cérebro) DONE**; a unidade de âmbito 9.1 (cobertura ≥60% packages core) está **parcial** — a 9.1a fechou a medição das 2 rotas proxy de inferência (`app/api/anthropic/**`, `app/api/openai/**`: 45,61%/69,64% → **100%**; cérebro package 95,64%; global 89,1%), falta a **9.1b (package finanças)**. Diagnóstico real (medido pelo `@sm`/`@po`, não suposto): o `coverage.include` de `v2/vitest.config.ts` **nunca incluiu** finanças, e medido isoladamente `components/financas/**` (10 componentes CRUD, 3.604 linhas) = **0%** e 3 das 4 páginas `app/(app)/financas/**` (2.541 linhas) = **0%** (só `patrimonio/page.tsx` testado). A 9.1b é a peça grande do Epic 9 até agora (~6.145 linhas UI nunca testadas, estimativa 10-16h, watch-item hard-stop §8). Produção mantém-se LIVE via Anthropic; cutover OpenAI deferido; 9.10 (deploy) continua BLOQUEADA por `production-state-verification-gate.md`.

## 2. Estado exacto do repo (verificado 03/07/2026)

```
branch: main — HEAD b21bb0c2 (merge da 9.1a, PR #102) no topo
b21bb0c2 test(nexus-v2): cobertura rotas proxy cérebro — allowlist + rate-limit KV [Story 9.1a] (#102)
c62043a7 docs(nexus-v2): handoff RETOMA-20260701 — Story 9.11 FECHADA [Story 9.11]
```

**Closure commit docs da 9.1a — PENDENTE de commit pelo `@devops`** (fecho é docs-only, não foi committado ainda): no working tree estão staged/prontos: `EPIC-9.md` (9.1a→DONE, contagem), rename `stories/active/9.1a.story.md` → `stories/completed/9.1a.story.md` (com QA Results), e a consolidação destes handoffs. `@devops` faz o closure commit + push antes/ao arrancar a 9.1b.

Estado do Epic 9 (`docs/EPIC-9.md`): **9.11 + 9.1a Done**; unidade 9.1 parcial (falta 9.1b); 9.2-9.10 por fazer.

> **Ruído fora-scope no working tree (NÃO committar):** submódulos sujos (`comunidade`, `starter-builder`), ~150+ untracked (`.agent/`, `.agents/`, `.codex/`, `.antigravity/`, `.cursor/`, backups `.backup.*`), e `docs/handoffs/.claude/agent-memory/` (memória de agentes, efeito do cwd). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.1a fixou / decisões a NÃO reabrir

- **[D-9.11-TIMEOUT]** (da 9.11): `testTimeout`/`hookTimeout` 20000ms em `v2/vitest.config.ts`. NÃO reabrir. A 9.1a só adicionou 2 globs ao array `coverage.include` — o padrão para a 9.1b é o mesmo (aditivo ao `include`, nunca tocar pool/isolate/timeout/thresholds).
- **Território bloqueador `not-tested-trailer-rules.md`** (test-runner config): usar sempre `Evidence:` (output real de cobertura), NUNCA `Not-tested:`.
- **Split 9.1a/9.1b decidido pelo Eurico** (01/07) e validado pelo `@po` (GO, 7/7 no checklist). Não re-litigar.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260703-story-9.1a-FECHADA-epic-9-proximo-9.1b-financas.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. Próxima story: 9.1b — Cobertura package finanças

**Estado:** Draft Approved pelo `@po` (validação de entrada do split, 02/07). Ficheiro: `stories/active/9.1b.story.md`. Executor `@dev` / gate `@qa`.

**Âmbito (a story manda — resumo):**
- AC1: adicionar `app/(app)/financas/**` + `components/financas/**` ao `coverage.include` de `v2/vitest.config.ts` — **EMPACOTADO COM os testes**, no mesmo PR.
- AC2 (antigo AC3): testes para o package finanças ≥60% — 10 componentes CRUD de `components/financas/**` + smoke tests das 3 páginas nunca testadas (`app/(app)/financas/**`; seguir o padrão validado de `patrimonio/page.test.tsx`, Story 3.9).
- AC3-AC6: determinismo (D-9.11-TIMEOUT intacta), Evidence Gate, âmbito confinado, gates locais limpos.

**CONDIÇÃO CRÍTICA SF-1/SF-2 (inegociável):** os paths de finanças (a 0%) só entram no `coverage.include` **na mesma story/PR que os testes**. NUNCA um PR allowlist-only para finanças — senão o threshold global de 60% falha a meio e a evidência AC do Evidence Gate fica enganadora. Ordem de tasks já reflecte isto (testes antes/junto do allowlist). Blindagem tripla verificada pelo `@po`.

**Watch-item (não-bloqueante):** hard-stop §8 = máx. 2 iterações CodeRabbit. A 9.1b toca ~13 ficheiros de teste novos (10 comp. + 3 páginas) — risco real de findings dispersos (fidelidade de mock, caminhos de erro). Foi por isto que se dividiu a 9.1. Se o CR exceder 2 iter, exige `Authorized-by: Eurico` no commit. `react-component-test-criteria` se aplicável (≥1 caminho de erro por componente CRUD).

## 5. Ciclo padrão da 9.1b

`@dev *develop 9.1b` (branch `feat/9.1b-cobertura-financas`, a partir de main pós-closure-commit) → gate `@qa` (**CR `--base main`** — obrigatório, território infra) → `@devops` push + PR + **6 condições `merge-authority` no head SHA** + auto-merge `--admin --squash --delete-branch` (sem pedir merge manual ao Eurico) → `@po *close-story 9.1b`. Com 9.1b Done, a unidade de âmbito 9.1 fica COMPLETA.

**Regras críticas:** `not-tested-trailer-rules.md` (`Evidence:` não `Not-tested:`), `separation-of-roles.md` (`@dev`≠`@qa`; `@architect` só se AC accionar seam de testabilidade via `FLAG @architect`), `cr-base-main-no-gate-saida`. CodeRabbit CLI: `coderabbit review --agent --type committed --base main` (`--prompt-only` REMOVIDO). WSL path: `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`. `gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.

**Stories alternativas/independentes do Epic 9 (se preferir mudar de frente):** 9.2 (E2E, independente da 9.1b), 9.8 (CI bloqueante). 9.10 (deploy) continua BLOQUEADA por `production-state-verification-gate.md` (verificar `vercel env ls` + SHA activo + reconciliar deployment `4e2b1c4`/J-6 ANTES de desenhar).

## 6. Git para o próximo terminal

```
git checkout main
git pull --ff-only origin main   # HEAD = b21bb0c2 (+ closure commit docs 9.1a quando o @devops o fizer)
```
Não há branches de feature pendentes (a de 9.1a foi apagada no merge). Se o closure commit docs ainda não foi feito, o working tree terá o rename da story + EPIC-9 modificado — pertence ao `@devops`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260703-story-9.1a-FECHADA-epic-9-proximo-9.1b-financas.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `03/07/2026`
