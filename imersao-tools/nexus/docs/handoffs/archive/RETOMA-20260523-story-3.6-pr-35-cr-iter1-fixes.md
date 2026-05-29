# RETOMA — Story 3.6 PR #35 CodeRabbit Iter 1 (fixes pendentes)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 23/05/2026
**De:** Gage (`@devops`) — `*push feature/3.6-compras-parceladas` + PR #35 contra `main`
**Para (sequencial):** `@dev` (`*qa-loop-fix 3.5` Iter 1) → `@devops` (`*push` Iter 1)
**Story:** 3.6 — Compras parceladas vinculadas a cartão (FR19, Epic 3)
**PR:** [#35](https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/35) OPEN, MERGEABLE, `reviewDecision: CHANGES_REQUESTED`
**Branch:** `feature/3.6-compras-parceladas` (head `65f9d829`)
**Iteração:** 1 de 2 — hard-stop `EPIC-3.md §8` activo

> **CONSUMIDO** — 23/05/2026 por `@dev` (Dex)
> - `consumed: true`
> - `consumed_at: 2026-05-23T15:00:00Z`
> - `consumed_by: dev`
> - `status: consumed`
> - Fix #1 + Fix #2 aplicados, commit `ac224820`. Fix #3 documentado como reply ao CR (não fixado, por convenção Epic 3).
> - Próxima acção: `@devops *push feature/3.6-compras-parceladas` + reply ao comentário outside-diff CodeRabbit no PR #35.

---

## Resumo executivo

A Story 3.6 foi implementada (commit `5f5e6a04`), passou o quality gate `@architect` (Aria, PASS confiança ALTA, commit docs `65f9d829`), e o PR #35 foi aberto. Todos os checks de CI passaram (Nexus v2 CI, 50-prompt regression, CodeQL, PR Automation, Vercel preview — todos SUCCESS em ~9 min). **CodeRabbit deixou review `CHANGES_REQUESTED` com 3 achados** (2 actionable inline + 1 outside-diff). Esta é a **Iter 1** do fix loop.

**Dois fixes legítimos a aplicar** (quick wins, ambos defensivos) + **um achado contestado** (viola convenção de testes do Epic 3 — documentar como reply, não fixar).

---

## Estado do PR #35

| Métrica | Valor |
|---------|-------|
| state | OPEN |
| baseRefName | `main` |
| headRefName | `feature/3.6-compras-parceladas` |
| reviewDecision | **CHANGES_REQUESTED** |
| mergeable | MERGEABLE |
| Commit head | `65f9d829` |
| Commits no branch | 2 (`5f5e6a04` implementação + `65f9d829` docs quality gate) |

### Checks (todos COMPLETED, ~9 min total)

| Workflow | Conclusion |
|----------|-----------|
| Nexus v2 CI — Lint + TypeScript | SUCCESS |
| Nexus v2 CI — Vitest unit + coverage | SUCCESS |
| Nexus v2 CI — Playwright E2E + bundle key check | SUCCESS |
| Nexus v2 — E2E Regression — 50-prompt regression | SUCCESS |
| CodeQL — Analyze (javascript-typescript) | SUCCESS |
| CodeQL — Analyze (actions) | SUCCESS |
| PR Automation — Coverage Report | SUCCESS |
| PR Automation — CodeRabbit Status | SUCCESS |
| PR Automation — Post PR Comments | SUCCESS |
| PR Automation — Record Quality Metrics | SUCCESS |
| CI — Detect Changes / Validation Summary | SUCCESS |
| CI — restantes (Jest, ESLint, etc) | SKIPPED (path filter — aiox-core não foi tocado) |
| Welcome New Contributors | SUCCESS |
| PR Labeling | SUCCESS |
| Vercel Preview | SUCCESS |
| Vercel Preview Comments | SUCCESS |
| CodeRabbit (status context) | SUCCESS |

---

## Achados CodeRabbit Iter 1 (3 itens)

### Fix #1 — LEGÍTIMO (🟠 Major, quick win)

**Ficheiro:** `imersao-tools/nexus/v2/lib/db/repos/installments.ts:123`

**Issue:** `createInstallmentWithTransactions` valida `t.installmentId === installment.id` (linha 118-122) mas **não** valida `t.cardId === installment.cardId`. Embora o handler em `app/(app)/financas/page.tsx:462` estampe sempre `cardId: installment.cardId`, a função do repo é uma API pública e poderia ser chamada de outro callsite — permite estado persistido inconsistente.

**Fix:** Adicionar 2 linhas no loop após linha 122:

```typescript
if (t.cardId !== installment.cardId) {
  throw new Error(
    `Transação ${t.id} tem cardId divergente (esperado ${installment.cardId}, recebido ${t.cardId}).`,
  );
}
```

Mensagem PT-PT, paridade com o erro de `installmentId` divergente já existente.

---

### Fix #2 — LEGÍTIMO (🟡 Minor, quick win)

**Ficheiro:** `imersao-tools/nexus/v2/components/financas/InstallmentsList.tsx:89`

**Issue:** `splitInstallmentAmount(installment.totalAmount, installment.installments)` é chamado em render sem fallback. Uma row malformada (ex: `installments < 1` por algum estado inesperado) lança e mata a tab inteira do separador "Parceladas". O `InstallmentSchema` Zod já protege na escrita, mas render-safety é boa prática defensiva.

**Fix:** try/catch wrapper à volta do cálculo de `parcels`/`first`/`last`/`parcelText`, com fallback gracioso "—" ou similar. Sugestão minimal:

```typescript
let parcelText: string;
try {
  const parcels = splitInstallmentAmount(installment.totalAmount, installment.installments);
  const first = parcels[0];
  const last = parcels[parcels.length - 1];
  parcelText = first === last
    ? `${installment.installments}× de ${formatCurrency(first)}`
    : `${installment.installments}× de ${formatCurrency(last)} (a primeira: ${formatCurrency(first)})`;
} catch {
  parcelText = `${installment.installments}× — valor inválido`;
}
```

---

### Fix #3 — CONTESTADO (🟠 Major, heavy lift) — **NÃO FIXAR**

**Ficheiro:** `imersao-tools/nexus/v2/app/(app)/financas/page.tsx:428-767` (outside diff range)

**Issue CodeRabbit:** pede unit tests para `handleNewInstallment`, `handleSubmitInstallment`, `handleDeleteInstallment`, CTA gating (`newButtonDisabled`/`newButtonHint`), tab panel transitions (loading/empty/list), error feedback.

**Por que NÃO fixar:**

1. **Viola a convenção declarada na Story 3.6**, secção `Testing`: *"Componentes (modal, lista): seguindo o precedente das Stories 3.3/3.4/3.5, os componentes React não têm testes unitários próprios — a verificação é feita pelo quality gate `@architect` + CodeRabbit server-side."*
2. **Precedente consolidado** das Stories 3.3, 3.4 e 3.5 — todas aprovadas com a mesma convenção.
3. **Quality gate `@architect` (Aria) já aprovou esta convenção no PASS** (registado em QA Results + Change Log v1.3 da story).
4. Aplicar este fix seria **scope creep** — muda a test policy do Epic 3 inteiro, decisão que cabe ao `@architect` e ao `@pm`, não a uma iteração de fix de PR.

**Acção correcta:** Responder ao comentário outside-diff do CodeRabbit no PR explicando a convenção (com link para a secção Testing da story e para o precedente 3.3/3.4/3.5). Se CodeRabbit reiterar o pedido na Iter 2, escalar formalmente ao `@architect` para decisão de policy.

**Template de reply ao CodeRabbit:**

```markdown
A Story 3.6 declara explicitamente na secção Testing (e o quality gate
@architect aprovou) que componentes React do separador Finanças não têm
testes unitários próprios — a verificação é feita pelo quality gate
manual + CodeRabbit server-side. Esta é uma convenção consolidada do
Epic 3 (precedente Stories 3.3/3.4/3.5, todas Done com a mesma policy).

Aplicar este pedido viria mudar a test policy do Epic inteiro — decisão
que cabe ao @architect e ao @pm, fora do scope desta iteração de fix.
Se mantiveres a recomendação na próxima iteração, escalamos formalmente
para revisão de policy.

Referências:
- docs/stories/active/3.6.story.md secção "Testing"
- QA Results da mesma story (quality gate @architect PASS)
- Stories 3.3, 3.4, 3.5 em docs/stories/completed/ (precedente)
```

---

## Próxima acção (sequencial)

### 1. `@dev` — `*qa-loop-fix 3.6` Iter 1

Aplicar **apenas Fix #1 e Fix #2**. Não tocar em mais nada (zero scope creep).

**Quality gates locais a passar antes do commit:**

```bash
cd imersao-tools/nexus/v2
npx vitest run tests/unit/financas/installmentSplit.test.ts  # 16/16 PASS esperado
npx vitest run                                                # suite total — 853/853 esperado (sem novos testes)
npx tsc --noEmit                                              # EXIT 0
npx eslint app/\(app\)/financas/page.tsx components/financas/InstallmentFormModal.tsx components/financas/InstallmentsList.tsx hooks/useInstallments.ts lib/financas/installmentSplit.ts lib/db/repos/installments.ts
npx next build                                                # PASS (rota /financas)
```

**Commit message sugerido:**

```
fix(nexus-v2): CodeRabbit Iter 1 — cardId guard + render-safe split [Story 3.6]

Aplica os 2 fixes legítimos do CodeRabbit Iter 1 no PR #35:

Fix #1 (Major, installments.ts:123):
  createInstallmentWithTransactions agora valida que cada transação
  tem cardId === installment.cardId, paridade com o guard existente
  de installmentId. Previne estado persistido inconsistente se a
  API for chamada de outro callsite.

Fix #2 (Minor, InstallmentsList.tsx:89):
  splitInstallmentAmount agora corre dentro de try/catch no render —
  uma row malformada já não mata a tab inteira; fallback gracioso
  "N× — valor inválido". Schema Zod protege na escrita, este guard
  protege no render.

NÃO aplicado: Fix #3 (page.tsx:428-767, "add unit tests for handlers")
— viola convenção da Story 3.6 (precedente 3.3/3.4/3.5 aprovado pelo
quality gate @architect). Reply ao comentário CodeRabbit a documentar
a convenção; escalation a @architect se CR reiterar Iter 2.

Quality gates locais 4/4 PASS (lint/typecheck/test:unit 853/853/build).

Confidence: high
Scope-risk: narrow

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

**Não esquecer:** após commit local, **reply ao comentário outside-diff** do CodeRabbit no PR via:

```bash
# Listar comentários para encontrar o ID do outside-diff
gh api repos/DaSilvaAlves/ecosistema-ia-avancada-pt/pulls/35/comments --jq '[.[] | select(.user.login | startswith("coderabbit")) | {id, path, body: (.body | .[0:200])}]'

# Reply ao comentário com o template acima (substituir <COMMENT_ID>)
gh api repos/DaSilvaAlves/ecosistema-ia-avancada-pt/pulls/35/comments/<COMMENT_ID>/replies -f body="..."
```

Ou via UI do GitHub directamente.

### 2. `@devops` — `*push` Iter 1

Push do commit Iter 1 na mesma branch `feature/3.6-compras-parceladas`. CodeRabbit Iter 2 corre automaticamente server-side.

### 3. Aguardar CodeRabbit Iter 2 (auto, ~7-30 min)

### 4. Decisão final

| Cenário | Acção |
|---------|-------|
| Iter 2 APPROVED | `@devops *merge 35` (squash) + `@po *close-story 3.6` |
| Iter 2 CHANGES_REQUESTED apenas no Fix #3 | Escalar ao Eurico — autorizar merge waived via trailer `Constraint:` (`EPIC-3.md` §8 + `.claude/rules/not-tested-trailer-rules.md`); waiver rate Epic 3 sobe para 1/6 |
| Iter 2 CHANGES_REQUESTED com fixes novos | **STOP hard-stop §8** — escalar ao Eurico para Iter 3 excepcional ou waiver; precedente Story 3.1 Iter 3 (autorizada pelo Eurico) |

---

## Comandos GitHub úteis

```bash
# Estado do PR
gh pr view 35 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json statusCheckRollup,reviewDecision,mergeable

# Reviews CodeRabbit (state + submittedAt)
gh pr view 35 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json reviews --jq '.reviews[] | select(.author.login | startswith("coderabbit")) | {state, submittedAt}'

# Comentários inline CodeRabbit
gh api repos/DaSilvaAlves/ecosistema-ia-avancada-pt/pulls/35/comments --jq '[.[] | select(.user.login | startswith("coderabbit")) | {id, path, line, body: (.body | .[0:600])}]'

# Forçar nova review CodeRabbit (após push Iter 1)
# CodeRabbit dispara automaticamente em push novo — só forçar se necessário:
gh pr comment 35 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --body "@coderabbitai review"

# Merge (apenas após APPROVED ou autorização Eurico)
gh pr merge 35 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --squash --delete-branch
```

---

## Ficheiros chave

| Tipo | Path |
|------|------|
| Story (status "Quality Gate PASS — Ready to Push") | `imersao-tools/nexus/docs/stories/active/3.6.story.md` |
| Epic (§8 hard-stop, §9 revisão manual cálculos) | `imersao-tools/nexus/docs/EPIC-3.md` |
| Regra hard-stop | `.claude/rules/not-tested-trailer-rules.md` |
| Regra separation of roles (A6) | `.claude/rules/separation-of-roles.md` |
| Núcleo de cálculo | `imersao-tools/nexus/v2/lib/financas/installmentSplit.ts` |
| Repo com atomicidade | `imersao-tools/nexus/v2/lib/db/repos/installments.ts` ← Fix #1 |
| Lista (render-safety) | `imersao-tools/nexus/v2/components/financas/InstallmentsList.tsx` ← Fix #2 |
| Page (5 separadores + handlers) | `imersao-tools/nexus/v2/app/(app)/financas/page.tsx` ← Fix #3 contestado |
| Tests | `imersao-tools/nexus/v2/tests/unit/financas/installmentSplit.test.ts` (16/16 PASS) |

---

## Contexto histórico (Epic 3 até agora)

| Story | Estado | Notas |
|-------|--------|-------|
| 3.1 | Done (PR #30) | Schema finanças — Iter 3 excepcional autorizada |
| 3.2 | Done | Categorias default PT |
| 3.3 | Done (PR #32) | CRUD transações variáveis — Iter 2 verde |
| 3.4 | Done (PR #33) | CRUD recorrências financeiras |
| 3.5 | Done (PR #34) | CRUD cartões + contas bancárias |
| **3.6** | **PR #35 OPEN, Iter 1 fixes pendentes** | **Compras parceladas (esta retoma)** |
| 3.7-3.11 | Pending | Epic a 5/11 Done |

**Waiver rate Epic 3 actual:** 0/5 (manter 0% se Iter 1 limpa).

---

## Regras importantes para o próximo agente

1. **Hard-stop §8 EPIC-3:** Esta é Iter 1. Apenas 1 iteração extra disponível. Iter 3 exige autorização humana via trailer `Constraint:`.
2. **Zero scope creep:** Aplicar **apenas** Fix #1 e Fix #2. Não tocar em nada não pedido.
3. **Convenção de testes do Epic 3:** Componentes React não têm testes unitários próprios. Fix #3 NÃO deve ser aplicado — documentar como reply.
4. **Repo isolation da page:** `app/(app)/financas/page.tsx` **NÃO** deve ter `db.*` directos (excepto comentários). A regra mantém-se após Fix #2 (que é em `InstallmentsList.tsx`, não na page).
5. **Mensagens em PT-PT.** Tom directo, sem floreados.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.6-pr-35-cr-iter1-fixes.md`. CONFIRMA QUE COINCIDE COM A PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2). SE NÃO COINCIDE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (subprojecto `imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.6-pr-35-cr-iter1-fixes.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Gage (`@devops`)
DATA: 23/05/2026
