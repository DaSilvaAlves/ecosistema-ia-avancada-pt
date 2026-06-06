> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# Handoff — Story 2.3 PR #20 CR Iter 1 CHANGES_REQUESTED (delegação @ux-design-expert + @dev)

**De:** Gage (`@devops`)
**Para:** Eurico (decisão Opção A vs B) → depois `@ux-design-expert` (Uma) + `@dev` (Dex) para Iter 2 fix
**Data:** 15/05/2026
**Projecto:** Nexus v2
**Story:** 2.3 — Vista lista de tarefas
**PR:** [#20](https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/20)
**Branch:** `feature/2.3-vista-lista`
**Commit head:** `02367bfa` (closure)
**Status:** OPEN — CR Iter 1 CHANGES_REQUESTED, CI verde, Vercel SUCCESS, aguarda Iter 2 fix

---

## Contexto

Push de Story 2.3 fechado pelo Gage hoje 15/05/2026 com closure commit `02367bfa` em cima de implementação rebaseada `93aad6e2`. Sequência cumprida:

1. PR #19 (Story 2.2) merged via `gh pr merge --admin --squash` (Opção A waiver) — squash `eee859f9` em main
2. Rebase `feature/2.3-vista-lista` contra `origin/main` actualizado — 2.2 closure auto-dropped (patch upstream), 2.2 impl skipped (CONFLICT em INDEX.md já resolvido pelo squash), apenas 2.3 re-aplicada
3. Closure commit `02367bfa` (11 ficheiros: 4 mods + 7 novos handoffs + 1 rename story)
4. Push `feature/2.3-vista-lista` para origin
5. PR #20 criado contra main com body PT-PT completo (sumário, D1-D4, coverage, gates 3/3 PASS, lições L1-L5, PAs ratificados, test plan)
6. CR Iter 1 review submetido @ `02367bfa` — **CHANGES_REQUESTED com 7 actionables + 2 nitpicks**

---

## CR Iter 1 — classificação completa

### 5 issues MEDIUM (technical — bloqueadores de merge)

| # | Issue | Path | Linhas | Categoria |
|---|-------|------|--------|-----------|
| 3 | `handleToggleDone`/`handleDelete` swallow errors silently (só `console.error`, sem UI feedback) | `imersao-tools/nexus/v2/app/(app)/tarefas/page.tsx` | 82-96 | UX |
| 4 | Composite widget ARIA roles incorrectos (`role="menu"` + `role="menuitem"` sem implementação real do menu pattern: sem arrow keyboard nav, sem focus management) | `imersao-tools/nexus/v2/components/tarefas/TaskKebabMenu.tsx` | 94-151 | A11y |
| 5 | `formatDueDate` usa `new Date(dueDate)` UTC parse → off-by-one display em offsets negativos. **Contradiz D3** ratificada na story | `imersao-tools/nexus/v2/components/tarefas/TaskRow.tsx` | 57-65 | Correctness |
| 6 | `parseDueDateMs` aceita out-of-range (month 13, day 32) porque `Date` normaliza para data válida diferente | `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts` | 38-45 | Correctness |
| 7 | `daysOverdue` faz subtração de millisecond entre local midnights → erro ±1h em DST transitions | `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts` | 66-67 | Correctness DST |

### 2 doc-nits (Low — absorvíveis no mesmo commit)

| # | Issue | Path | Linhas |
|---|-------|------|--------|
| 1 | Footer "Última actualização" stale (30/04 vs 15/05) | `docs/HANDOFF-INDEX.md` | 10 |
| 2 | Fence sem language MD040 sob "Sequência sugerida" | `imersao-tools/nexus/docs/EPIC-2.md` | 118-126 |

### 2 nitpicks (test coverage — Low)

| # | Issue | Path | Linhas |
|---|-------|------|--------|
| Nit1 | Testes missing Escape nav + mutation error path (rejected `setTaskStatus`/`deleteTask`) | `imersao-tools/nexus/v2/tests/unit/app/tarefas/page.test.tsx` | 51-324 |
| Nit2 | Testes missing invalid ISO (`2026-13-40`) + DST boundary cases | `imersao-tools/nexus/v2/tests/unit/lib/tarefas/isOverdue.test.ts` | 35-80 |

---

## Análise — por que NÃO é cenário de waiver

Padrão merge waived consolidado das 5 stories Epic 1 (1.5/1.6/1.7/1.8/1.9) + Story 2.2 sempre teve CR Iter 1 com **only doc-nits**. Esta tem:

- **5 issues MEDIUM technical** (correctness bugs reais)
- **#5 contradiz D3** ratificada na story (overdue local-date parser) — `TaskRow.tsx` continua a usar parser naive UTC enquanto `isOverdue.ts` faz local-date parse correcto. Display de "DD/MM/YYYY" no kebab menu vai diferir do badge "Atrasada" em offsets negativos
- **#6 + #7 estão no ficheiro de D3** — D3 dizia "parser interpreta YYYY-MM-DD como local date, evita off-by-one em BST" mas o parser nem rejeita inputs inválidos nem trata DST correctamente no day counting

Não é waiver — é fix legítimo. Epic 2 §8 max 2 iter desenhado precisamente para este caso.

---

## Constraint convenção @devops nunca aplica fixes

Stories 1.6/1.7/1.8/1.9 + Story 2.2 consolidaram em **6 stories agora**: **@devops NUNCA aplica fixes em CR loop, sempre delega ao executor original ou ao seu quality gate**.

Gage (@devops) hard-stop respeitado:
- NÃO aplicou fixes
- NÃO merge
- Postou comment audit trail em PR #20 (`#issuecomment-4464241316`)
- Criou este handoff de delegação

---

## Mapa de delegação Iter 2

### Opção A (recomendada — paralela)

Issues distribuídos por agente per separation-of-roles A6:

| Agente | Issues | Ficheiros | Comando |
|--------|--------|-----------|---------|
| `@ux-design-expert` (Uma) — executora original UI | #3 (UX swallow), #4 (a11y ARIA), #5 (formatDueDate parser) | `app/(app)/tarefas/page.tsx`, `components/tarefas/TaskKebabMenu.tsx`, `components/tarefas/TaskRow.tsx` | `@ux-design-expert *qa-loop-fix 2.3` |
| `@dev` (Dex) — quality gate Story 2.3, autor implícito de `isOverdue.ts` patterns | #6 (parseDueDateMs range validation), #7 (DST UTC midnight diff) | `lib/tarefas/isOverdue.ts` | `@dev *qa-loop-fix 2.3` |

Doc-nits #1, #2 + test nitpicks Nit1, Nit2 absorvíveis no commit de qualquer um (recomendado @ux-design-expert assumir todos os doc-nits + nit testes de `page.test.tsx`; @dev assumir nit testes de `isOverdue.test.ts`).

Vantagem: paralelização, fix mais rápido.
Desvantagem: 2 commits separados (mas tudo na mesma branch — squash mantém história limpa).

### Opção B (sequencial — único agente)

Delegar tudo a Uma (executora) ou Dex (quality gate). Uma tem contexto mais fresh do código. Dex já fez `*qa-gate 2.3` e validou D3 — fix de #5/#6/#7 alinhado com a sua decisão.

Vantagem: 1 commit Iter 2 limpo.
Desvantagem: serializa.

---

## Próxima acção

**Eurico decide A vs B** → invoca agente(s) com `*qa-loop-fix 2.3` → aplica os 9 fixes (7 actionables + 2 nitpicks de teste) → commit Iter 2 → `@devops *push` Iter 2 → re-aguarda CR Iter 2.

### Se Iter 2 ainda CHANGES_REQUESTED (Epic 2 §8 hard-stop)

Per EPIC-2.md §8 max 2 iter:
- Escalar a Eurico com Opção C (merge waived se reduzido a doc-nits-only) ou Opção D (Iter 3 com aprovação explícita)
- Pattern Story 1.10 closure commit aplicável: `@devops` faz closure commit em main pós-merge a absorver doc-nits residuais

---

## Estado actual do PR #20

| Métrica | Valor |
|---------|-------|
| State | OPEN |
| Mergeable | MERGEABLE |
| mergeStateStatus | UNSTABLE |
| reviewDecision | CHANGES_REQUESTED |
| Head SHA | `02367bfa97197ef8b7baca0ae779c4419a2188e4` |
| CR review @ head SHA | CHANGES_REQUESTED (7 actionables + 2 nitpicks) |
| CR status check | SUCCESS |
| Vercel preview | SUCCESS |
| Nexus v2 CI (Lint+TS, Vitest, Playwright) | SUCCESS |
| 50-prompt regression | SUCCESS |
| CodeQL javascript-typescript + actions | SUCCESS |
| Coverage Report / Record Quality Metrics | SUCCESS |

CR semantic review veio AFTER status check. A review devolveu issues legítimos que CR status check (que é mais permissivo) não bloqueia.

---

## Memory log a criar pelo @devops

`agent-memory/aiox-devops/project_nexus_v2_story_2_3_pr_20_iter1_changes_requested.md` — registo do padrão diferente Stories 2.1/2.2 (waiver-pattern only doc-nits) vs Story 2.3 (technical MEDIUM legítimos).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO: Nexus v2. COINCIDE com regra `handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Gage (`@devops`)
DATA: 15/05/2026
