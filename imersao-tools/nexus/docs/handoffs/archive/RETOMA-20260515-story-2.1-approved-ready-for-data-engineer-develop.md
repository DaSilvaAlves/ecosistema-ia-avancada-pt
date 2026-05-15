---
from_agent: sm
to_agent: data-engineer
created: 2026-05-15T02:00:00Z
status: pending
project: nexus-v2
epic: 2
story: 2.1
next_action: develop_story_2.1
prerequisite_read: imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.1.md
---

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# Story 2.1 Approved — pronto para `@data-engineer *develop 2.1`

## Sumário

Story 2.1 (Schema tarefas/projectos — Data Access Layer Dexie v2) está **Approved** e pronta para implementação por Dara (`@data-engineer`). PO validation deu **GO conditional / Score 10/10** (relatório `PO-VALIDATION-STORY-2.1.md`); River (`@sm`) aplicou F1 (apply mecânico das resoluções Q1-Q3 + SF2 nota CodeRabbit local-skip). Tudo baked-in nos AC3/AC6/AC9; Status: Draft → Approved.

## Estado consolidado

| Item | Valor |
|------|-------|
| Story file | `imersao-tools/nexus/docs/stories/2.1.story.md` (**Status: Approved**) |
| PO validation | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.1.md` |
| Score | 10/10 (vs Story 1.1: 9/10, Story 1.10: 8/10) |
| Executor | **`@data-engineer`** (Dara) |
| Quality gate | `@dev` (Dex) — respeita `separation-of-roles.md` A6 |
| Estimativa | 3-4h |
| Hard-stop QA loop | 2 iter `qa-loop-fix` (EPIC-2 §8) |
| Bloqueia | Stories 2.2 (migration), 2.3-2.10 — todas precisam dos repos da 2.1 |

## Acção obrigatória ANTES de tocar em código

**PRIMEIRA acção de Dara:** ler `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.1.md §1` (resoluções Q1-Q3). Isto não é cerimónia — são decisões `@po` com fundamentação canónica que afectam directamente AC3/AC6/AC9. Embora estejam baked-in no story file, o PO-VALIDATION tem a fundamentação completa.

## O que está fechado (Dara NÃO reabre)

| Decisão | Fechada por | Onde |
|---------|-------------|------|
| Interpretação "Data Access Layer" (não apenas schema) | `@po` (validation §11) | story Nota do `@sm` no topo |
| R1 — `tasks`/`projects` já em `version(1)`; não recriar | `@po` (validation §13) | story Reconciliação R1 |
| R2 — `recurrences` genérica (não `task_recurrences`) | `@po` (validation §13) | story Reconciliação R2 |
| R3 — Sem `task_tags`; tags denormalizadas (`*tags` em `Task.tags`) | `@po` (validation §13) | story Reconciliação R3 |
| Q1 — `Task.tags: string[]` guarda **ids** | `@po` (validation §1) | story AC6 + Resoluções |
| Q2 — Tabela `tags` sem `&name`; normalização case-insensitive no repo | `@po` (validation §1) | story AC9 + Resoluções |
| Q3 — Índice `recurrences: 'id, ownerType, ownerId, [ownerType+ownerId]'` | `@po` (validation §1) | story AC3 + Resoluções |
| Executor/Quality-gate (`@data-engineer`/`@dev`) | `@pm` (EPIC-2 §5), confirmado `@po` (validation §2.1) | story Executor Assignment |

## Scope ABERTO para `@data-engineer` decidir durante implementação

| # | Item | Estado |
|---|------|--------|
| SF1 | Tags `(AC: N)` explícitas nas Tasks/Subtasks | `@po` Optativo — projecto não usa convencionalmente. Aplica se quiseres melhorar traceability |
| SF3 | Placement final de `lib/db/schemas.ts` vs `lib/db/repos/schemas.ts` (co-located) | `@po` aceita qualquer um — proposto é `lib/db/schemas.ts` (paralelo a `lib/agent/schemas.ts` Story 1.1) |
| N1 | Exportar tipos auxiliares `TaskCreateInput`, `TaskUpdatePatch` | Nice-to-have — DX para Stories 2.3-2.10 |
| N2 | Smoke test `renderHook` para `useTasks`/`useProjects` | Nice-to-have — útil para Stories 2.3-2.5 |
| N3 | `repos/tags.ts` aceitar whitespace mas guardar trimmed | Nice-to-have — robustez UX |

## Workflow esperado

```
1. @data-engineer cria branch local: feature/2.1-schema-tarefas-projectos
2. @data-engineer LE PO-VALIDATION-STORY-2.1.md §1 (resoluções Q1-Q3)
3. @data-engineer LE a story 2.1.story.md (Approved)
4. @data-engineer implementa T1-T9 sequencialmente
   - T1: Validação inicial (Q1-Q3 já resolvidas; índices version(1) confirmar)
   - T2: Schema increment version(2) + fix comentário client.ts:22
   - T3: lib/db/schemas.ts com 4 schemas Zod
   - T4: 4 repos (tasks, projects, recurrences, tags)
   - T5: 2 hooks (useTasks, useProjects)
   - T6: Tests Vitest (incluindo AC13 — teste de upgrade crítico)
   - T7: Quality gates locais (lint, typecheck, test:unit, build, coverage ≥80%)
   - T8: Story file maintenance (preencher File List + Completion Notes + Change Log)
5. @data-engineer marca Status: Approved → InProgress (ao começar)
6. @data-engineer marca Status: InProgress → Ready for Review (ao terminar com 5/5 gates locais PASS)
7. @data-engineer cria handoff @data-engineer → @dev (quality gate)
8. @dev *qa-gate 2.1 (PASS/CONCERNS/FAIL/WAIVED)
9. @po *close-story 2.1 (após PASS)
10. @devops *push (CR roda no PR via GitHub integration)
```

## Padrões a seguir (Story 1.1 é a referência directa)

| Aspecto | Referência |
|---------|------------|
| Estrutura de repo (CRUD + validação Zod no input) | `imersao-tools/nexus/v2/lib/db/repos/agent-runs.ts` |
| Schemas Zod com mensagens PT-PT | `imersao-tools/nexus/v2/lib/agent/schemas.ts` |
| Hooks reactivos `useLiveQuery` | `imersao-tools/nexus/v2/hooks/useAgentRuns.ts` |
| Tests Vitest com `fake-indexeddb` | `imersao-tools/nexus/v2/tests/unit/db/repos/agent-runs.test.ts` |
| Lição Story 1.1 — `z.unknown()` infere opcional | Story 1.1 Completion Notes #2 (não afecta Task/Project/Recurrence/Tag mas manter padrão) |
| Lição Story 1.1 — Hooks fora do coverage | Story 1.1 Completion Notes #7 (`vitest.config.ts` `coverage.include`) |
| Convenção Constitution Art. VI | Sempre `@/...` absolute; excepção: imports dentro de `lib/db/repos/` podem ser relativos entre si |

## Anti-padrões (NÃO fazer — 13 já listados na story)

Resumo dos mais críticos:
1. **NÃO reescrever** `this.version(1).stores({...})` em `client.ts` — incremento é aditivo (`version(2)`)
2. **NÃO recriar** as tabelas `tasks`/`projects` — já existem em `version(1)`
3. **NÃO recriar** as interfaces `Task`/`Project`/`Recurrence`/`Tag` — já em `types/db.ts:54-92`
4. **NÃO criar** `task_recurrences` ou `task_tags` (reconciliações R2/R3)
5. **NÃO inventar** estado `Project.status: 'archived'` — enum é `'active'|'paused'|'done'`
6. **NÃO tocar** em `lib/db/migrations/v1-to-v2.ts` — é Story 2.2
7. **NÃO tocar** em `vitest.config.ts` (threshold global é Story F.1) — **path bloqueador** (Not-Tested Evidence Gate activa se for tocado)
8. **NÃO usar** `any` — `unknown` com type guards quando necessário

## Pontos de atenção técnica

- **AC13 (teste de upgrade Dexie) é crítico:** é a mitigação principal de AR2 (`architecture-v2.md` linha 1217 — "Dexie schema migration falhar mid-upgrade"). Se falhar localmente, escala a `@architect` antes de tentar workarounds.
- **`fake-indexeddb`** pode não simular upgrade fielmente — o `architecture-v2.md` AR2 já antecipa. Se o teste de upgrade for frágil, documenta no story como lição (Completion Notes) e propõe alternativa.
- **Comentário errado em `client.ts:22`** ("Epic 2 adiciona installments/accounts/cards" — Epic 3) deve ser corrigido como parte de T2 (AC4).
- **Bug colateral apanhado pela PO-VALIDATION:** referencia explicitamente no Completion Notes "Fix do comentário stale em `client.ts:22`".

## Estado da sessão (15/05/2026)

- Branch base: `main` (working tree com submódulos modificados — Eurico ainda não decidiu committar Epic 2)
- Story 2.1, PO-VALIDATION, e este handoff: criados nesta sessão, NÃO committados ainda
- 3 handoffs anteriores deste ciclo (epic-2-created, story-2.1-drafted, story-2.1-validated) consumidos e movidos para `archive/`
- INDEX local actualizado em cada transição

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-approved-ready-for-data-engineer-develop.md`. PROJECTO: nexus-v2 → dentro de `imersao-tools/nexus/`. COINCIDE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Notas finais para `@data-engineer` Dara

- **Não escales nada das 3 perguntas (Q1/Q2/Q3) a `@architect`.** Já decididas com fundamentação canónica directa pela `@po`. Se durante implementação descobrires uma 4ª pergunta nova, escala normalmente.
- **A migration `v1-to-v2.ts` já existe** (skeleton Story 0.3). Refina-a apenas se afectar a tua implementação dos repos — caso contrário, deixa para Story 2.2.
- **CodeRabbit corre via GitHub no PR** — não dispares CLI local (convenção Nexus v2). `@devops` confirma no push.
- **Hard-stop 2 iter qa-loop-fix** se `@dev` mandar fixes. Epic 1 fechou com 50% waiver rate; alvo Epic 2 é **<20%**. Profundidade > velocidade.
- **Tabela tags pequena:** `db.tags.toArray()` + filter para verificar duplicado (AC9) é OK. Não optimizar prematuramente.
- **AC11 deve cobrir:** CRUD roundtrip cada repo + cada filtro de `listTasks` (status/projectId/tag) + `getRecurrenceByOwner` via índice composto + `createTag` rejeita duplicado.
- **AC13 (upgrade test):** abre `NexusDB` com Dexie, insere data simulando estado `version(1)`, deixa Dexie correr o upgrade, valida que `tasks`/`projects` estão intactos e que `recurrences`/`tags` estão criadas e vazias. `fake-indexeddb` deve suportar isto — caso contrário, documenta limitação.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **nexus-v2**
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-approved-ready-for-data-engineer-develop.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: 15/05/2026
