# RETOMA — Story 9.11 FECHADA (Epic 9 1/11) — continuar noutro terminal com 9.1 (cobertura) ou 9.8 (CI bloqueante)

> **CONSUMIDO / SUPERADO — 03/07/2026.** A decisão desta retoma foi tomada e executada: Eurico escolheu 9.1, que foi partida em 9.1a/9.1b; a **9.1a está FECHADA (merged `b21bb0c2`, PR #102)**. Handoff vivo actual: `RETOMA-20260703-story-9.1a-FECHADA-epic-9-proximo-9.1b-financas.md`. `consumed: true` · `consumed_by: @aiox-master (Orion)` · `status: consumed`. Mover para `archive/`.

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md` (último epic do roadmap PRD §9)
**Story desta retoma:** **9.11 (Isolamento de testes full-suite) FECHADA** → **próxima FIXADA: 9.1 (cobertura ≥60%)** — decidido pelo Eurico em 01/07/2026 (ver §4)
**Data:** 01/07/2026
**from_agent:** @devops (Gage) · **to_agent:** any (Eurico decide a próxima story no arranque) · **status:** pending
**Branch de partida:** `main` (sincronizado — HEAD `d8f4d0bf`)

**Porquê este handoff:** a 9.11 (1.ª story do Epic 9, débito `REC-8.6-ISOLAMENTO-TESTES`) fechou o ciclo completo hoje (PR #101 → merge → reconciliação AC3 → close-story). O Eurico pediu para **continuar noutro terminal com contexto fresco**. Esta retoma dá o estado exacto e as duas próximas stories destrancadas.

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a **production-ready** (cobertura, E2E, PWA/SW offline, backup/restore, CI/CD bloqueante, deploy contínuo) — não introduz módulo funcional novo. A produção está **LIVE e com cérebro via Anthropic** (`https://imersao.ia.expressia.pt`); o Epic 8 (dual-provider OpenAI) está **FECHADO 6/6** e o cutover LIVE OpenAI está **deferido on-demand** (`REC-8.6-CUTOVER-DEFERIDO`, não bloqueia o Epic 9). A **9.11 está DONE**: a suite full-suite (`npm run test:unit` a partir de `imersao-tools/nexus/v2/`) é agora determinística — causa-raiz confirmada = **timing flake sob carga** (1.º `await import()` dinâmico de routes de import pesado esgota o `testTimeout` default de 5000ms sob CPU saturada), **NÃO contaminação cross-test** (Vitest 2.x isola módulos/globals por-ficheiro); fix = `testTimeout`/`hookTimeout` 5000→20000ms em `vitest.config.ts`, **concorrência intacta, zero skips**; 5 corridas consecutivas = **2536 PASS / 0 FAIL**. Isto **desbloqueia a 9.1** (cobertura ≥60% precisa de baseline determinístico) e a **9.8** (CI bloqueante credível). Restam 10 stories (9.1-9.10).

## 2. Estado exacto do repo (verificado 01/07/2026)

```
branch: main (sincronizado com origin/main) — HEAD d8f4d0bf, divergência 0/0
d8f4d0bf docs(nexus-v2): close-story 9.11 — isolamento full-suite DONE, Epic 9 1/11 [Story 9.11]
60b8e021 docs(nexus-v2): refina reconciliação AC3 — condições (i)/(ii) e autoria D-9.11-TIMEOUT [Story 9.11]
0e7bd6d0 fix(nexus-v2): full-suite determinístico — testTimeout/hookTimeout 20000ms [Story 9.11] (#101)
61fbb539 docs(nexus-v2): cria EPIC-9 Hardening + Deploy + PWA (planeamento, 11 stories) [Epic 9]
a93295ef docs(nexus-v2): retrospetiva Epic 8 + regra production-state-verification-gate (A1) [Epic 8]
```

Estado do Epic 9 (`docs/EPIC-9.md`): **1/11 stories Done.**
- 9.11 — **DONE** em `main` (`stories/completed/9.11.story.md`). Fix em `v2/vitest.config.ts`.
- 9.1-9.10 — **Não iniciadas** (`stories/` ainda sem drafts). Ver §5 do EPIC-9 para a tabela executor/gate.

**Baseline de testes (verificado, 5 corridas do ciclo 9.11):** `npm run test:unit` (a partir de `imersao-tools/nexus/v2/`) → **2536 PASS / 0 FAIL**, determinístico. `oauth-status.test.ts` isolado = 6/6 PASS em 2,35s. typecheck exit 0; lint exit 0 (1 warning pré-existente `logout`, fora-scope).

> **Ruído fora-scope no working tree (NÃO committar):** submódulos sujos (`comunidade`, `starter-builder`), ~150 untracked (`.agent/`, `.agents/`, `.codex/`, `.antigravity/`, `.cursor/`, `PO-VALIDATION-*`, `PR-BODY-*`, backups `.backup.*`, etc.). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.11 fixou (NÃO reabrir)

- **[D-9.11-TIMEOUT]** (ratificada por `@architect`, formalizada por `@po` na v0.5 + refino AC3 `60b8e021`): timeout **global** `testTimeout`/`hookTimeout` 20000ms em `v2/vitest.config.ts`. Escolhido em vez de ajuste por-teste porque a classe de falha é **sistémica** (qualquer ficheiro de import pesado, não só o `oauth-status`); ajuste só num teste deixaria os outros expostos noutra máquina (violaria AC1/determinismo). Valor derivado da medição (~4× o cold-start), concorrência (`pool`/`isolate`/`maxWorkers`) intacta, zero skips. **Não é mascaramento** — um hang real continua a falhar, só mais tarde.
- **Território bloqueador `not-tested-trailer-rules.md`** (test-runner config): usou-se `Evidence:` (5 corridas), NUNCA `Not-tested:`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260701-story-9.11-FECHADA-epic-9-1de11-proximo-9.1-ou-9.8.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. Próximas stories destrancadas (DECIDIDO: 9.1)

> **DECISÃO 01/07/2026 (Eurico):** próxima story fixada em **9.1 — Cobertura ≥60%** (Opção A). Ciclo arrancado por Orion (`@aiox-master`) com `@sm *draft 9.1`. A 9.8 fica em backlog do Epic 9 (candidata a correr depois do Epic 7). A 9.10 mantém-se BLOQUEADA (production-state-verification-gate).
>
> **RECONCILIAÇÃO DA NOTA GAP-9.1 (@sm, diagnóstico real 01/07/2026 — corrige a premissa abaixo):** a nota "cobertura real 91,81%, story de consolidação" estava **incompleta**. Global passa (88,99% lines) mas SÓ porque o `coverage.include` de `v2/vitest.config.ts` NUNCA incluiu `financas/**` nem `app/api/anthropic|openai/**`. Medido isoladamente: `components/financas/**` (10 comp., 3.604 linhas) = **0%**; 3 de 4 páginas `app/(app)/financas/**` = **0%** (só `patrimonio` testado); `anthropic/proxy/route.ts` = 45,61% (< 60%); `openai/proxy/route.ts` = 69,64%; tarefas sem GAP. Logo a 9.1 tem **trabalho real** (AC3 finanças ~6.145 linhas UI nunca testadas), não é trivial. Draft: `stories/active/9.1.story.md`, 8 AC.
>
> **VALIDAÇÃO @po (Pax) + DECISÃO DE DIMENSÃO 01/07/2026:** `@po` deu **GO-com-condições 9/10** (diagnóstico do @sm verificado contra código real). Recomendou **SPLIT** (motor: hard-stop §8 — PR único com config + ~13 ficheiros de teste excede provavelmente 2 iter CR). **Eurico CONFIRMOU o SPLIT.** Plano: **9.1a** (AC1 só rotas proxy `anthropic`/`openai` + package cérebro; ~130 linhas; baixo risco) → merge primeiro; **9.1b** (AC1 finanças `app/(app)/financas/**`+`components/financas/**` empacotado com os testes AC3; ~6.145 linhas UI). **SF-1/SF-2 (obrigatórias):** paths de finanças a 0% entram no `coverage.include` SÓ junto com os testes — NUNCA PR allowlist-only para finanças (senão threshold global 60% falha a meio, evidência AC6 enganadora). Gate de saída de ambas: `@qa` com CR `--base main`. `@sm` a partir em 9.1a/9.1b.
>
> **SPLIT EXECUTADO (@sm, 01-02/07/2026):** criados `stories/active/9.1a.story.md` (allowlist proxy `anthropic`/`openai` + package cérebro; ~130 linhas; merge PRIMEIRO) e `stories/active/9.1b.story.md` (allowlist finanças EMPACOTADO com testes AC + 10 comp. CRUD + 3 páginas; depende de 9.1a mergeada). `9.1.story.md` marcada SUPERSEDED (conteúdo preservado). `EPIC-9.md` §5 actualizado (9.1 → 9.1a+9.1b; epic continua 11 unidades de âmbito). SF-1/SF-2 incorporadas na ordem de tasks de cada uma; Evidence Gate presente em ambas; D-9.11-TIMEOUT não reaberta. **Ordem de execução: `@po` valida 9.1a/9.1b → `@dev *develop 9.1a` (branch `feat/9.1a-cobertura-proxy-cerebro`) → só após 9.1a Done/merged: `@dev *develop 9.1b`.**
>
> **VALIDAÇÃO DE ENTRADA DO SPLIT (@po Pax, 02/07/2026):** 9.1a **GO** (sem condições, Status Approved) — pronta para develop; 9.1b **GO** (SF-1/SF-2 já no texto, Status Approved) — arranca só após 9.1a mergeada. 7/7 no checklist do split (âmbito completo preservado, SF-2 com blindagem tripla em 9.1b, Evidence Gate em ambas, D-9.11-TIMEOUT intacta, dep 9.1b→9.1a declarada). Watch-item não-bloqueante 9.1b: hard-stop §8 (~13 ficheiros de teste).
>
> **9.1a IMPLEMENTADA (@dev Dex, 02/07/2026) — Ready for Review:** branch local `feat/9.1a-cobertura-proxy-cerebro`, commit `7e4c23ec` (NÃO pushed). Resultados: `anthropic/proxy` 45,61%→**100%**, `openai/proxy` 69,64%→**100%**, cérebro package **95,64%**, global **89,1%** (4 métricas ≥60), full-suite **2550 PASS/0 FAIL** 3× determinístico, typecheck+lint exit 0. `vitest.config.ts` diff = só +9 linhas no array `coverage.include` (D-9.11-TIMEOUT intacta). Trailer `Evidence:` (não `Not-tested:`). Sem FLAG @architect. Flake conhecido/pré-existente `google/oauth-status.test.ts` sob instrumentação de cobertura (isolado 6/6 PASS; não-regressão, doc Epic 8/9.11). **ESTADO ACTUAL: gate `@qa` (CR `--base main`) EM CURSO.** Após PASS → `@devops` push+PR+merge → `@po *close-story 9.1a` → desbloqueia 9.1b.
>
> **Ruído a NÃO committar (efeito do cwd):** agentes criaram `docs/handoffs/.claude/agent-memory/aiox-po|aiox-dev/` — memória de agente, fora-scope da story, não entra nos PRs.

| Opção | Story | Executor / Gate | Notas |
|-------|-------|-----------------|-------|
| **A (recomendada)** | **9.1 — Cobertura ≥60% packages core** | `@dev` / `@qa` | **GAP-9.1:** o threshold global já está a 60% desde 13/06 (auditoria P1.1; cobertura real era 91,81%). Confirmar no draft a cobertura **actual por package core** (cérebro/tarefas/finanças). Se já ≥60%, a 9.1 é de **consolidação/verificação**, não de subir threshold — ajustar âmbito ao que falta, sem inventar défice. |
| **B** | **9.8 — GitHub Actions CI bloqueante** | `@devops` / `@architect` | lint + typecheck + test bloqueante em PRs. **Contexto bloqueador `not-tested-trailer-rules.md`** (config de CI) → `Evidence:` local (não `Not-tested:`). CR `--base main` no gate de saída. `separation-of-roles`: `@devops` executa → gate sobe a `@architect`. Beneficia de correr **depois** do Epic 7 fechar (cobre o produto completo) — não bloqueante. |
| C | 9.9 — CodeRabbit obrigatório | `@devops` / `@qa` | Formaliza o que já está em uso. |
| **NÃO ainda** | 9.10 — Vercel deploy automatizado | `@devops` / `@architect` | **BLOQUEADA pelos pré-requisitos §10/§7 do EPIC-9:** `production-state-verification-gate.md` obrigatório — verificar contra a plataforma (`vercel env ls`, SHA activo, se auto-deploy-on-push está ligado) + reconciliar o commit paralelo `4e2b1c4`/J-6 ANTES de desenhar a automação. Não arrancar sem isto. |

**Duas incógnitas de estado de produção do §10 (bloqueiam SÓ a 9.10 e stories de estado LIVE, NÃO a 9.1/9.8/9.11):** (a) razão de o cérebro estar via Anthropic + estado do saldo; (b) reconciliação do deployment activo `4e2b1c4`/J-6 (sessão paralela). A 9.11 avançou sem elas por decisão registada (é local, não toca produção) — o mesmo se aplica à 9.1/9.8.

## 5. Ciclo padrão da próxima story (herança dos Epics 2-8)

`@sm *draft {id}` → `@po *validate-story-draft {id}` → gate de entrada (`@qa` ou `@architect` conforme §5) → branch `feat/{id}-slug` → `@dev`/executor implementa → gate de saída (**CR `--base main` — obrigatório em território de infra**) → `@devops` PR + **6 condições `merge-authority` no head SHA** + merge `--admin --squash --delete-branch` → `@po *close-story {id}`.

**Regras críticas neste epic:** `not-tested-trailer-rules.md` (CI/test-runner/build config = `Evidence:`, não `Not-tested:`), `production-state-verification-gate.md` (9.10 e estado LIVE), `separation-of-roles.md` (`@devops` executa CI/deploy → gate `@architect`/`@qa`), `cr-base-main-no-gate-saida` (infra), `internal-state-contract-gate.md` (SW offline multi-camada, relevante 9.3/9.6).

**Operacional CodeRabbit CLI (mudou):** `--prompt-only` foi REMOVIDO → usar `coderabbit review --agent --type committed --base main` (skill `coderabbit-review` já corrigida em `~/.claude/skills/`). WSL path deste repo: `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`. `gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`. NUNCA `git add -A`.

## 6. Git para o próximo terminal

```
git checkout main
git pull --ff-only origin main   # HEAD = d8f4d0bf
```
Não há branches de feature pendentes (a de 9.11 foi apagada no merge). `main == origin/main` 0/0.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260701-story-9.11-FECHADA-epic-9-1de11-proximo-9.1-ou-9.8.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@devops (Gage)`
DATA: `01/07/2026`
