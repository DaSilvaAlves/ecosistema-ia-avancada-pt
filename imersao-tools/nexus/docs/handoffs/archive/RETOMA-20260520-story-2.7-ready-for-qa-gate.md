# RETOMA — Story 2.7 Motor de recorrência (FR10) · Pronto para QA Gate

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Dex (`@dev`)
**Para:** Aria (`@architect`) — quality gate da Story 2.7 (`EPIC-2.md` §5: quality gate `@architect`; `separation-of-roles.md` A6 — Dex executou, Aria faz o gate)
**Data:** 2026-05-20
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** CONSUMED
**consumed:** true
**consumed_at:** 2026-05-20T18:45:00Z
**consumed_by:** architect (Aria)
**resultado:** Architect Gate de implementação **PASS** — 15/15 AC honrados, 5/5 quality gates reproduzidos em worktree limpo, A11 (AC7 parcial) ratificada, 31 testes 2.7 verdes. Story `Ready for Review` → `Done`. Handoff de saída `RETOMA-20260520-story-2.7-gate-PASS-ready-for-devops-push.md` criado para Gage `*push`.

---

## Sumário executivo

Story 2.7 (Motor de recorrência, FR10) **implementada em iteração única, modo YOLO** na branch `feature/2.7-motor-recorrencia` (criada de `main` local actualizado, pós Story 2.6 merged). Commit `ccfd545e`.

O motor de recorrência client-side está completo e funcional: configuração dos 6 tipos do FR10, geração idempotente de instâncias num horizonte de 90 dias, activação via `useEffect` one-shot on-mount (ADR-2.7-1). 31 testes Vitest novos, 616/616 PASS na suite completa.

Implementação feita **em paralelo com a Story 2.10** (outro `@dev`) — zero contacto com ficheiros da 2.10. Os ficheiros `v2/lib/agent/tools/*` e `v2/vitest.config.ts` (alterados pela 2.10) ficaram **fora** deste commit deliberadamente.

---

## Resultado vs Acceptance Criteria (15 AC)

| AC | Estado | Evidência |
|----|--------|-----------|
| AC1 — `buildRecurrenceConfig` (6 tipos) | CUMPRIDO | `recurrence.ts`; T1+T2 |
| AC2 — `generateTaskInstances` idempotente | CUMPRIDO | `recurrence.ts`; T3-T9b |
| AC3 — `runRecurrenceEngine` tolerante a erros | CUMPRIDO | `recurrence.ts`; T10-T11 |
| AC4 — `useRecurrenceEngine` (useEffect on-mount, ADR-2.7-1) | CUMPRIDO | `hooks/useRecurrenceEngine.ts`; T22 |
| AC5 — page `/tarefas` chama o hook | CUMPRIDO | `tarefas/page.tsx` topo do componente |
| AC6 — `RecurrenceFieldset` | CUMPRIDO | `components/tarefas/RecurrenceFieldset.tsx`; T14-T19 |
| AC7 — Integração no formulário de tarefa | **PARCIAL — ver A11** | Não existe formulário de criação/edição de tarefa na page (`+ Nova` disabled, sem `TaskFormModal`). `RecurrenceFieldset` entregue standalone + `cancelTaskRecurrence` helper testado. Ligação ao `onSubmit` fica para a story que adicionar o formulário. |
| AC8 — Badges Recorrente/Instância | CUMPRIDO | `TaskRow.tsx` + `KanbanCard.tsx`; T20-T21 |
| AC9 — Cancelar recorrência | CUMPRIDO (lógica) | `lib/tarefas/cancelRecurrence.ts` helper `cancelTaskRecurrence` (`window.confirm` PT-PT); T23-T24 |
| AC10 — Completar instância não cancela recorrência | CUMPRIDO | T12 |
| AC11 — PT-PT consistente | CUMPRIDO | Todos os textos UI em PT-PT |
| AC12 — Acessibilidade WAI-ARIA | CUMPRIDO | `aria-label`/`aria-describedby`/`role="alert"` |
| AC13 — Testes Vitest (~20-25) | CUMPRIDO | 31 testes (T1-T24 + variantes T9b/T10b/T19b/T19c/T21b/T22b) |
| AC14 — Quality gates locais | CUMPRIDO | lint exit 0, typecheck 0 (na 2.7), test:unit 616/616, build exit 0 |
| AC15 — Coverage | CUMPRIDO | `recurrence.ts` 98.58%, `RecurrenceFieldset.tsx` 98.38%, `lib/tarefas` 100%, all-files 90.09% |

**Resumo: 14/15 plenamente cumpridos. AC7 parcial — ver `[AUTO-DECISION A11]` na story (escopo ajustado pelo executor; não há formulário de tarefa onde injectar; `RecurrenceFieldset` entregue standalone pronto a injectar).**

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.7-ready-for-qa-gate.md`. O projecto a que se refere é o **Nexus v2** (dentro de `imersao-tools/nexus/`). O caminho coincide com a pasta do projecto. CONSULTAR `.claude/rules/handoff-location.md` se em dúvida.

---

## Quality gates locais (reproduzir no gate)

| Gate | Comando | Resultado |
|------|---------|-----------|
| Lint | `npm run lint` | exit 0 — 1 warning pré-existente em `app/api/auth/logout/route.ts` (não introduzido pela 2.7) |
| Typecheck | `npm run typecheck` | zero erros nos ficheiros da Story 2.7. **2 erros pré-existentes** em `v2/lib/agent/tools/projects.ts` — ficheiro **untracked da Story 2.10 paralela**, fora de escopo |
| Testes | `npm run test:unit` | **616/616 PASS** (31 novos da 2.7) |
| Build | `npm run build` | exit 0 — rota `/tarefas` 23.5 kB |
| Coverage | `npm run test:coverage` | `recurrence.ts` 98.58% / `RecurrenceFieldset.tsx` 98.38% / `lib/tarefas` 100% / all-files 90.09% — todos os thresholds do AC15 cumpridos |

---

## Pontos de atenção do Architect Gate (PA-1 a PA-4)

| PA | Como foi tratado |
|----|------------------|
| PA-1 — `parentTaskId` não indexado em `version(2)` | Confirmado em código: `db.tasks.where('parentTaskId')` **lança** (`KeyPath não indexed`). Solução: idempotência via `db.tasks.filter((t) => t.parentTaskId === ownerId)` (full-table-scan). `version(2)` **não alterado** — aceite como dívida documentada (PA-1). |
| PA-2 — Motor agnóstico ao mecanismo | `recurrence.ts` **não importa** `useEffect`/`setInterval`/`requestIdleCallback`/SW — só `rrule`, `db`, `createTask`, tipos. O hook `useRecurrenceEngine` é o único ponto que conhece o mecanismo. |
| PA-3 — Idempotência (risco central) | `generateTaskInstances` lê as filhas existentes uma única vez, monta um `Set` de `dueDate`, e salta as datas já existentes. T4 prova: 2ª corrida `created === 0`, `skipped === N`. |
| PA-4 — Edge cases de calendário | Delegados a `rrule`. T8 cobre o caminho normal (mensal dia 15). |

---

## Decisões de implementação (registadas no Change Log da story)

1. **`runRecurrenceEngine` sem parâmetro `ownerType`** — itera apenas `ownerType: 'task'`. O Epic 4 estende o padrão.
2. **Parâmetro `nowMs` opcional** adicionado a `generateTaskInstances`/`runRecurrenceEngine` — para testabilidade determinística. Razão: combinar `vi.useFakeTimers()` com Dexie/IndexedDB causa timeouts (operações async de Dexie dependem de timers reais). Sem este parâmetro, os testes do motor faziam timeout (113s → 2s após o fix).
3. **`RRule.fromString` movido para antes do check da task-mãe** — uma `rule` corrompida deve ser detectada independentemente de a mãe existir (T11 — tolerância a erros).
4. **`vitest.config.ts` NÃO alterado** — `lib/shared/**`, `components/tarefas/**` e `lib/tarefas/**` já estavam no coverage include. Zero toque a paths bloqueadores (`not-tested-trailer-rules.md`).

---

## CodeRabbit

Convenção Nexus v2 (secção CodeRabbit Integration da story): **CLI local skip** — CodeRabbit corre via integração GitHub no PR (server-side, automático). Self-Healing light max 2 iterações aplica-se ao fix loop pós-PR.

---

## Ficheiros (commit `ccfd545e`)

**Criados (8):** `v2/hooks/useRecurrenceEngine.ts`, `v2/components/tarefas/RecurrenceFieldset.tsx`, `v2/lib/tarefas/cancelRecurrence.ts`, 5 ficheiros de teste em `v2/tests/unit/{shared,hooks,components/tarefas}/`.

**Modificados (5):** `v2/lib/shared/recurrence.ts`, `v2/components/tarefas/TaskRow.tsx`, `v2/components/tarefas/KanbanCard.tsx`, `v2/app/(app)/tarefas/page.tsx`, `docs/stories/active/2.7.story.md`.

Lista completa e diff linha-a-linha na secção "Registo de alterações de implementação (v1.0)" da story.

---

## Próxima acção

1. **`@architect` (Aria)** — quality gate de implementação da Story 2.7: reproduzir os 5 gates locais, validar PA-1 a PA-4, rever a lógica de recorrência e a decisão A11 (AC7 parcial). Veredicto PASS/CONCERNS/FAIL.
2. **`@devops` (Gage)** — após gate PASS: `*push feature/2.7-motor-recorrencia` + PR contra `main`. Push é **EXCLUSIVO do `@devops`** — Dex não empurra.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (Epic 2 — Tarefas v2 + Projectos)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.7-ready-for-qa-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Dex (@dev)`
DATA: `20/05/2026`
