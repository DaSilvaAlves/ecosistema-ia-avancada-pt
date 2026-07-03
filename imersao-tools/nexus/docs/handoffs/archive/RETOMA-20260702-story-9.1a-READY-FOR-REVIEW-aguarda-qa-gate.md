# RETOMA — Story 9.1a IMPLEMENTADA (Ready for Review) — continuar noutro terminal com o gate @qa (CR --base main) → push @devops

> **CONSUMIDO / SUPERADO — 03/07/2026.** O estado deste handoff ("aguarda gate @qa") já foi ultrapassado: gate `@qa` PASS (CR 0 findings) → `@devops` merge (`b21bb0c2`, PR #102) → `@po` close-story. A **9.1a está FECHADA (Done)**. Handoff vivo actual: `RETOMA-20260703-story-9.1a-FECHADA-epic-9-proximo-9.1b-financas.md`. `consumed: true` · `consumed_by: @aiox-master (Orion)` · `status: consumed`. Mover para `archive/`.

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.1a (Cobertura: allowlist rotas proxy + package cérebro) IMPLEMENTADA por `@dev`** → **próxima acção: gate de saída `@qa` (CR `--base main`)**
**Data:** 02/07/2026
**from_agent:** @dev (Dex) · **to_agent:** @qa (Quinn) — gate de saída · **status:** pending
**Branch de partida:** `feat/9.1a-cobertura-proxy-cerebro` (LOCAL, commit `7e4c23ec`, **NÃO pushed** — o commit vive só neste clone/máquina)

**Porquê este handoff:** a 9.1a (1.ª metade do split da 9.1, subconjunto de baixo risco) foi implementada em modo YOLO com todos os AC satisfeitos e evidência local. O Eurico pediu para continuar noutro terminal. Esta retoma dá o estado exacto e a próxima acção (gate `@qa`).

---

## 1. Resumo executivo (1 parágrafo)

A **9.1a** corrige o âmbito de MEDIÇÃO do relatório de cobertura (NFR17): as 2 rotas proxy de inferência pelas quais o chat fala com o LLM (`app/api/anthropic/**`, `app/api/openai/**`) nunca estiveram no `coverage.include` de `v2/vitest.config.ts`, apesar de terem testes parciais. **ZERO funcionalidade nova** — só `tests/**` + o array `coverage.include`. Adicionei os 2 grupos ao allowlist (AC1) e fechei o gap de cobertura das rotas, incluindo o **branch crítico de segurança rate-limit 429** (`anthropic/proxy` linhas 45-85, antes 0%). Resultado: as 2 rotas passaram de **45,61%/69,64% → 100% lines / 91,66% branch** cada; package cérebro **95,64%**; global **89,1%** (4 métricas ≥60%). Full-suite `npm run test:unit` = **2550 PASS / 0 FAIL** determinístico em 3 corridas (2536 baseline + 14 testes novos). typecheck + lint exit 0. `[D-9.11-TIMEOUT]` **NÃO reaberta** (diff só no array `include`). Finanças ficam para a **9.1b** (não tocadas). **Estado: Ready for Review — aguarda gate `@qa` com CR `--base main`.**

## 2. Estado exacto do repo (verificado 02/07/2026)

```
branch actual: feat/9.1a-cobertura-proxy-cerebro (LOCAL, 1 commit à frente de main, SEM upstream)
7e4c23ec test(nexus-v2): cobertura rotas proxy cérebro — allowlist + rate-limit KV [Story 9.1a]
c62043a7 docs(nexus-v2): handoff RETOMA-20260701 — Story 9.11 FECHADA [Story 9.11]   ← = HEAD de main
```

**O commit `7e4c23ec` NÃO foi pushed** (autoridade exclusiva `@devops`). No próximo terminal (mesma máquina):
```
git checkout feat/9.1a-cobertura-proxy-cerebro   # o commit local está aqui
```

Ficheiros do commit (4, `git add` selectivo — SEM ruído):
- `imersao-tools/nexus/v2/vitest.config.ts` — +9 linhas ao array `coverage.include` (grupos `app/api/anthropic/**` + `app/api/openai/**` + comentário PT-PT). **Nada mais tocado.**
- `imersao-tools/nexus/v2/tests/unit/api/anthropic-proxy.test.ts` — 5→14 testes (+9) + helper `useKvRateLimit` + reset KV no `beforeEach` + import `http`/`HttpResponse`.
- `imersao-tools/nexus/v2/tests/unit/api/openai-proxy.test.ts` — 8→13 testes (+5) + helper `useKvRateLimit`.
- `imersao-tools/nexus/docs/stories/active/9.1a.story.md` — Status Ready for Review, tasks [x], Dev Agent Record, File List, Change Log, Not-Tested Evidence Gate preenchido.

> **Ruído fora-scope no working tree (NÃO committar):** submódulos sujos (`comunidade`, `starter-builder`), ~170 untracked (`.agent/`, `.agents/`, `.codex/`, `.antigravity/`, `.cursor/`, `PO-VALIDATION-*`, `PR-BODY-*`, backups `.backup.*`, `docs/handoffs/.claude/agent-memory/`). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. Evidência local (AC5 Evidence Gate — `vitest.config.ts` = contexto bloqueador → trailer `Evidence:`, nunca `Not-tested:`)

Todos os comandos a partir de `imersao-tools/nexus/v2/`.

| Métrica (L/B/F/S) | Antes | Depois | Gate |
|---|---|---|---|
| **Global** | 88,92/89,07/85,8/88,92 (2536 testes) | **89,1/89,11/85,89/89,1** (2550 testes) | ≥60 PASS |
| **Cérebro** (lib/agent+lib/db+api/agent+api/anthropic+api/openai) | — | **95,64/89,14/96,08/95,64** | ≥60 PASS (AC2) |
| **Tarefas** | — | **87,72/87/66,32/87,72** | ≥60 PASS, sem regressão (AC3) |
| `anthropic/proxy/route.ts` | 45,61%/60%/66,66% | **100%/91,66%/100%** | — |
| `openai/proxy/route.ts` | 69,64%/75%/100% | **100%/91,66%/100%** | — |

- **Determinismo (AC4):** 3× `npm run test:unit` = **2550 PASS / 0 FAIL** cada, exit 0.
- **Gates locais (AC7):** `npm run typecheck` exit 0; `npm run lint` exit 0 (só o warning pré-existente `logout/route.ts` — zero novos).
- **`git diff vitest.config.ts`:** só +9 linhas no array `include`. `pool`/`isolate`/`testTimeout`/`hookTimeout`/`thresholds` inalterados.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260702-story-9.1a-READY-FOR-REVIEW-aguarda-qa-gate.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. GOTCHAS importantes (para o gate `@qa` e para a 9.1b)

- **[D-9.11-TIMEOUT] NÃO reaberta:** a edição a `vitest.config.ts` é SÓ aditiva ao array `coverage.include`. Confirmar no `git diff` que `pool`/`isolate`/`testTimeout`(=20000)/`hookTimeout`(=20000)/`thresholds`(=60) estão intactos.
- **Flake conhecido `google/oauth-status.test.ts > sem sessão → 401`:** SÓ sob `npm run test:coverage` (a instrumentação v8 agrava o cold-start do `await import()` de grafos pesados — googleapis — e excede o `hookTimeout` 20000ms: medi 20212ms/25004ms). Quando falha, o vitest **aborta o report de cobertura** → tive de re-correr `test:coverage` até dar limpo. **Isolado 6/6 PASS em 3/3 corridas** → flake pré-existente (doc Epic 8/9.11), **não-regressão**, sem relação com esta story. As 3 corridas de `test:unit` (sem cobertura) são todas limpas 2550/2550. **Se o gate `@qa` correr `test:coverage` e vir esta falha, isolar antes de declarar regressão.**
- **GOTCHA mock KV REST (fidelidade de protocolo):** os proxies fazem rate-limit por `fetch(${kvUrl}/incr/...)` RAW (NÃO `@vercel/kv`), e `getSession` faz lookup KV RAW quando `KV_REST_API_URL` está definido. O helper `useKvRateLimit` activa o KV via `vi.stubEnv('KV_REST_API_URL','https://kv.test')` + MSW `http.get` para `/incr/*`(→`{result:<n>}`), `/expire/*` E `/get/*` (sessão — senão getSession vai pelo caminho prod e devolve 401). Protocolo Upstash real espelhado. Testes falsificáveis (429 exige rate-limit vivo; fail-open exige o `catch`; SSE exige o ramo de streaming).
- **Nenhum `FLAG @architect`:** nenhum seam de testabilidade foi necessário. Zero alteração de comportamento de produção (AC6).

## 5. Próxima acção — gate de saída `@qa`

**Ciclo padrão a partir daqui:**
1. **`@qa` gate de saída** (a story atribui-o explicitamente — território `not-tested-trailer-rules.md` porque toca `vitest.config.ts`):
   - `coderabbit review --agent --type committed --base main` (CR server-side `--base main` é o autoritativo — lição 5.11/8.4: CR local `-t uncommitted` não vê findings server-side).
   - Confirmar cobertura real (testes exercitam código real, não tautológicos) + fidelidade de mock (`mock-protocol-fidelity.md`).
   - Verificar `git diff vitest.config.ts` = só o array `include`.
   - Preencher secção **QA Results** da story com veredicto (PASS/CONCERNS/FAIL).
2. **`@devops`** (após PASS): push da branch → PR → **6 condições `merge-authority` no head SHA** → merge `--admin --squash --delete-branch`.
3. **`@po *close-story 9.1a`** → Status Done, `git mv` active→completed, EPIC-9 §5 actualizado.
4. **Desbloqueia 9.1b** (`stories/active/9.1b.story.md` — allowlist finanças EMPACOTADO com os testes AC; ~6.145 linhas UI; SF-2: finanças a 0% entram no `coverage.include` SÓ junto dos testes, NUNCA allowlist-only). Arranca só após 9.1a mergeada em `main`.

**Regras operacionais:** `gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`. NUNCA `git add -A`. CR CLI: `--prompt-only` foi REMOVIDO → `coderabbit review --agent --type committed --base main`. WSL path deste repo: `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`. Hard-stop §8: máx 2 iterações CR (Iter 3+ exige `Authorized-by: Eurico` no commit).

## 6. Git para o próximo terminal

```
git checkout feat/9.1a-cobertura-proxy-cerebro   # commit local 7e4c23ec (NÃO pushed)
```
Se for outra máquina (não o mesmo clone), o commit não existe lá — nesse caso o trabalho tem de ser re-aplicado a partir deste handoff + File List (§2). `main` continua em `c62043a7` (= `d8f4d0bf` no INDEX anterior está desactualizado; confirmar com `git log`).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260702-story-9.1a-READY-FOR-REVIEW-aguarda-qa-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@dev (Dex)`
DATA: `02/07/2026`
