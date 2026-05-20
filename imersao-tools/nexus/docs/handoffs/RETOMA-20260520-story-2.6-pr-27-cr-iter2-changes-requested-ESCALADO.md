# RETOMA — Story 2.6 (Sistema de tags global, FR14) — CR Iter 2 CHANGES_REQUESTED — ESCALADO ao Eurico

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 20/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Tipo:** Escalação de decisão — hard-stop EPIC-2 §8 atingido (CodeRabbit Iter 2 = última iteração permitida)
**Severidade:** alta — decisão necessária do Eurico antes de qualquer passo seguinte
**Localização canónica:** `imersao-tools/nexus/`
**Branch actual:** `feature/2.6-tags-global` (commits Iter 2 `9e10f317` + `2745b93b` pushed — tip remoto `2745b93b`)
**De:** Gage (`@devops`) — `*push feature/2.6-tags-global` executado + CodeRabbit Iter 2 avaliado
**Para:** Eurico — decisão entre `@architect` ou merge waived
**Status:** pending

---

## 1. Resumo executivo

O push incremental Iter 2 (`9e10f317` + `2745b93b`) foi executado para `origin/feature/2.6-tags-global` — PR #27 actualizado. Pre-push quality gates 4/4 PASS. CI essencial 100% verde. **CodeRabbit Iter 2 = CHANGES_REQUESTED** com **2 findings actionable técnicos** (1 Major a11y + 1 Minor test) + 3 nitpicks.

Esta era a **Iteração 2 — a última permitida pelo hard-stop EPIC-2 §8**. Iter 3 está PROIBIDA sem aprovação explícita. Por isso, o `@devops` **PARA** e escala a decisão ao Eurico, conforme a ordem da tarefa e a convenção consolidada em 7+ stories.

| Marco | Estado |
|-------|--------|
| Push Iter 2 | `a9615e04..2745b93b` em `feature/2.6-tags-global` — limpo, PR #27 actualizado |
| Pre-push quality gates | 4/4 PASS — lint exit 0 (1 warn herdado fora-scope `auth/logout/route.ts:1`), typecheck exit 0, test:unit 556/556 (44 ficheiros), build `/tags` 5.9 kB |
| CI essencial | 100% verde — Lint+TS, Vitest unit+coverage, Playwright E2E+bundle, 50-prompt regression, CodeQL js-ts+actions, Coverage Report, Record Quality Metrics, Validation Summary, Vercel Preview SUCCESS |
| CodeRabbit Status (check) | SUCCESS |
| CodeRabbit review Iter 2 | **CHANGES_REQUESTED** — 2 actionable (1 Major + 1 Minor) + 3 nitpicks |
| Hard-stop EPIC-2 §8 | **ATINGIDO** — Iter 3 PROIBIDA sem aprovação Eurico |

---

## 2. CodeRabbit Iter 2 — findings remanescentes

Review `4328740399` submetido `2026-05-20T13:08:03Z` sobre o range `e60c70f0..2745b93b`.

### 2.1 Findings actionable (2)

| # | Severidade | Ficheiro | Descrição |
|---|-----------|----------|-----------|
| A1 | **Major** (a11y) | `imersao-tools/nexus/v2/components/tags/TagFormModal.tsx:123` | Quando `form.color` NÃO está em `TAG_PALETTE` (path de dados legacy), a linha 122 trata o índice de fallback (`baseIdx`) mas a linha 285 deixa **todos** os radios com `tabIndex={-1}`. Resultado: o radiogroup fica inalcançável por teclado (Tab) nesse path. Sugestão CR: garantir que pelo menos um radio recebe `tabIndex={0}` (ex: derivar `hasPaletteSelection` e usá-lo para escolher um `tabbableIndex` único). |
| A2 | **Minor** (test) | `imersao-tools/nexus/v2/tests/unit/app/tags/page.test.tsx:302` | No teste T10 (delete-cancel) há um `await act(async () => { await new Promise((r) => setTimeout(r, 30)); })` hardcoded. É redundante após a introdução do helper `flush()` na Iter 2 e não há trabalho assíncrono quando `confirm=false`. Sugestão CR: remover o sleep; se houver espera real, usar `waitFor()` ou `await flush()` (evita flakiness). |

### 2.2 Nitpicks (3) — não-bloqueantes

| # | Severidade | Ficheiro | Descrição |
|---|-----------|----------|-----------|
| N1 | Nitpick (Low value) | `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260520-story-2.6-pr-27-cr-iter1-changes-requested.md:71-73` | Fenced code block sem language identifier (MD040). |
| N2 | Nitpick (Quick win) | `imersao-tools/nexus/docs/handoffs/INDEX.md:12` | Célula de tabela muito longa com inline code contendo pipes (`count: number\|null`) quebra o parsing markdown (MD056: 5 colunas esperadas, 6 reais). |
| N3 | Nitpick (Quick win) | `imersao-tools/nexus/v2/tests/unit/app/tags/page.test.tsx:252-279` | Falta um teste para o branch de falha de `countTasksForTag` (assertar a copy fallback "Também será removida..." quando `count === null`). |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.6-pr-27-cr-iter2-changes-requested-ESCALADO.md`. CAMINHO DENTRO DA PASTA DO PROJECTO (`imersao-tools/nexus/`) — CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 3. Avaliação `@devops` — porque é escalação e não merge directo

A convenção consolidada em 7+ stories Nexus v2 distingue:

- **Zona "merge waived"** — CR Iter final só com **doc-nits Markdown puros** (MD040/MD056 etc.) sem findings técnicos. Nesse caso, o CR status check head SHA SUCCESS é autoridade e o merge waived procede via Opção A.
- **Findings actionable técnicos** — quando a CR traz issues técnicos legítimos (bug de código, teste), NÃO é zona "merge waived" automática.

A Iter 2 da Story 2.6 traz **A1 (Major, bug de acessibilidade real)** + **A2 (Minor, código de teste)**. Não é doc-nit puro. Por isso o `@devops` **não faz merge unilateral** — a decisão é do Eurico.

O `@devops` **não aplica fixes de código** (hard-stop respeitado, convenção consolidada em 8+ stories). A Iter 3 está PROIBIDA pelo EPIC-2 §8.

---

## 4. Decisão necessária — opções para o Eurico

| Opção | Descrição | Recomendação `@devops` |
|-------|-----------|------------------------|
| **A — `@architect`** | Escalar A1+A2 a Aria (`@architect`) como quality gate alternativo (Separation of Roles — executor `@dev` não assina o próprio gate). Aria avalia se A1 é bloqueante real e, se sim, autoriza uma Iter 3 excepcional focada (precedente Story 2.3 "Opção D" — hard-stop quebrado com aprovação explícita registada como `Constraint:` trailer). | **Recomendada se A1 for considerado bloqueante.** A1 é um bug de acessibilidade real (radiogroup inalcançável por teclado num path de dados legacy) — não é cosmético. WAI-ARIA é critério de qualidade Epic 2. |
| **B — Merge waived + débito** | `gh pr merge 27 --squash --repo DaSilvaAlves/ecosistema-ia-avancada-pt`. A1 e A2 são registados como débitos em `EPIC-2.md §10` para correcção numa story futura. Justificação: A1 só afecta um path de **dados legacy** (cores fora da paleta — improvável em produção, todas as tags criadas via `TagFormModal` usam a paleta); A2 é apenas higiene de teste. | Aceitável **se** o Eurico considerar A1 de baixo impacto real (afecta apenas cores legacy, não o fluxo normal). Regista débito. |
| **C — Iter 3 excepcional** | Eurico aprova explicitamente uma Iter 3 (quebra do hard-stop §8). `@dev` corrige A1+A2+N3 num commit focado, `@devops` faz push, CR re-corre. | Mais segura para a qualidade, mas custa 1 iteração extra e quebra o hard-stop §8 — só com aprovação explícita registada. |

**Recomendação final `@devops`:** Opção A ou C. A1 é um bug de acessibilidade legítimo, não doc-nit. A correcção (A1+A2) é pequena e bem definida pela CR. A Opção B (merge waived) só é defensável se o Eurico aceitar conscientemente o débito a11y do path legacy.

---

## 5. Estado do PR #27

| Campo | Valor |
|-------|-------|
| PR | #27 OPEN, `mergeable: MERGEABLE`, `mergeStateStatus: UNSTABLE` (CR review CHANGES_REQUESTED) |
| Branch | `feature/2.6-tags-global`, tip remoto `2745b93b` |
| Base | `main` |
| CI | 100% essencial verde |
| CodeRabbit Status (check) | SUCCESS |
| CodeRabbit review (Iter 2) | CHANGES_REQUESTED — review `4328740399` |
| Comando merge (se Opção B aprovada) | `gh pr merge 27 --squash --repo DaSilvaAlves/ecosistema-ia-avancada-pt` |

---

## 6. Caveats

| Caveat | Detalhe |
|--------|---------|
| `gh pr *` | requer SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Working tree | 150+ untracked pré-existentes (dívida de governança separada) + 2 submódulos modificados (`comunidade`+`starter-builder`) — NÃO incluir, NÃO tocar |
| Iter 3 | PROIBIDA sem aprovação explícita Eurico (hard-stop EPIC-2 §8) — registar como `Constraint:` trailer se aprovada |
| `@devops` | NÃO aplica fixes de código — qualquer correcção A1/A2/N3 é trabalho de `@dev` |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.6-pr-27-cr-iter2-changes-requested-ESCALADO.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Gage (`@devops`) — sessão `*push feature/2.6-tags-global` + CodeRabbit Iter 2 + escalação
DATA: 20/05/2026
