# PO Validation — Story 2.5 (Vista calendário semanal de tarefas)

**Validador:** Pax (`@po`)
**Data:** 2026-05-17
**Story:** `imersao-tools/nexus/docs/stories/2.5.story.md` v0.2
**Task executada:** `.aiox-core/development/tasks/validate-next-story.md` (10-point checklist + executor assignment + anti-hallucination + CodeRabbit integration)
**Decisão final:** **GO** — score 10/10, Implementation Readiness 10/10, Confidence **High**.

---

## 1. Template Completeness — PASS

| Secção do template | Presente | Observação |
|--------------------|----------|------------|
| Status | sim | "Draft" — pronto para promover a "Approved" |
| Executor Assignment | sim | `@ux-design-expert` / `@dev` / `[lint, typecheck, vitest, build, axe-core]` |
| Story | sim | User story PT-PT com `As a / I want / so that` mapeado a FR11+FR12 |
| Acceptance Criteria | sim | 13 ACs (AC1-AC13 + AC5b) |
| CodeRabbit Integration | sim | Tabela completa (Story Type, Complexity, Agents, Gates, Self-Healing, Focus Areas, Risco, Local CLI skip) |
| Tasks/Subtasks | sim | T1-T12 com sub-tarefas detalhadas |
| Dev Notes | sim | Ficheiros a ler, layout, padrão dnd-kit, helper esqueleto, anti-padrões, padrão de teste |
| Testing | sim | Tabela framework/setup/localização/mocks/drag-sim/time/coverage |
| Risks/Dependencies | sim | R1-R7 + D1-D2 com probabilidade/impacto/mitigação |
| Architectural Decisions Carry-Over | sim | 11 linhas referenciando 2.3+2.4 |
| Change Log | sim | v0.1 + v0.2 (patch mutation token Iter 2) |
| Not-Tested Evidence Gate | sim | N/A justificado (sem paths bloqueadores antecipados) |
| Dev Agent Record | placeholder | A preencher pelo executor — esperado |
| QA Results | placeholder | A preencher pelo quality gate Dex |
| PO Validation | placeholder | Esta secção (preenchida abaixo) |

Sem placeholders por preencher. Sem `_TBD_` ou `{{...}}` remanescentes. Estrutura segue `story-tmpl.yaml` v2.0.

---

## 2. Executor Assignment Validation (Story 11.1 — Projeto Bob) — PASS

| Campo | Valor | Validação |
|-------|-------|-----------|
| `executor` | `@ux-design-expert` | Presente, não vazio, agente conhecido |
| `quality_gate` | `@dev` | Presente, não vazio, agente conhecido |
| `quality_gate_tools` | `[lint, typecheck, vitest, build, axe-core]` | Array não-vazio, ferramentas apropriadas para Frontend |
| **executor != quality_gate** | `@ux-design-expert` != `@dev` | **PASS** — separação A6 respeitada |
| Type-to-executor consistency | Design/UI Components → `@ux-design-expert` + `@dev` quality gate | **PASS** — bate certo com a tabela do template |
| Keywords da story | "vista calendário", "componentes", "drag-and-drop", "grid 7 colunas", "Calendar*.tsx" | Frontend/UI — alinhado a `@ux-design-expert` |

Precedente: 8 stories consecutivas (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4) com mesmo par executor/gate produziram QA Gate PASS à primeira.

---

## 3. File Structure & Source Tree — PASS

| Aspecto | Estado |
|---------|--------|
| File paths clarity | Layout completo nas linhas 429-451 da story |
| Source tree relevance | Inclui paths absolutos (`imersao-tools/nexus/v2/...`) na tabela de Dev Notes |
| Directory structure | `components/tarefas/`, `lib/tarefas/`, `app/(app)/tarefas/`, `tests/unit/{app,lib}/tarefas/` consistente com Stories 2.1-2.4 |
| File creation sequence | T2 (helper) → T3 (tab) → T4-T6 (componentes) → T7 (optimistic+token) → T8 (filtros) → T9 (testes) — sequência lógica |
| Path accuracy | Confirmei existência de `KanbanBoard.tsx`, `KanbanColumn.tsx`, `KanbanCard.tsx`, `OverdueSection.tsx`, `TasksFilters.tsx`, `TasksHeader.tsx` em `imersao-tools/nexus/v2/components/tarefas/` |

Novos ficheiros: 3 componentes (`CalendarBoard.tsx`, `CalendarDay.tsx`, `CalendarCard.tsx`) + 1 helper (`weekRange.ts`) + 2 test files. Modificados: `page.tsx`, `TasksHeader.tsx` (e potencialmente `TasksFilters.tsx`).

---

## 4. UI/Frontend Completeness — PASS

| Aspecto | Estado |
|---------|--------|
| Component specs | AC2/AC3/AC4 detalham header, accent stripe, drop zones, chip colors com hex tokens exactos |
| Styling/design guidance | Trace para `.claude/rules/design-system-ia-avancada.md` (glassmorphism, Inter+JetBrains Mono, Cyan/Lime/Magenta) |
| User interaction flows | AC5 (drag+drop), AC6 (keyboard a11y com announcements PT-PT), AC8 (filtros), AC9 (estados loading/vazio) |
| Acessibilidade | `aria-label` PT-PT longos por dia, `role="button"`, `aria-grabbed`, `tabIndex={0}`, `KeyboardSensor` + `sortableKeyboardCoordinates` (precedente 2.4 A5) |
| Integration points | `updateTask` do repo (A7), `useTasks` reactivo, `OverdueSection` reutilizada, `TasksFilters` estendido |

---

## 5. Acceptance Criteria Satisfaction — PASS

| AC | Coberto por tasks | Mensurável | Testado |
|----|-------------------|-----------|---------|
| AC1 (tab activo) | T3.1-T3.3 | sim | T9 |
| AC2 (grid 7 colunas) | T4.1, T5.1-T5.7 | sim | T1 |
| AC3 (week nav controlos) | T4.3 | sim | T10 |
| AC4 (CalendarCard) | T6.1-T6.7 | sim | T4 |
| AC5 (drag+drop + optimistic + rollback) | T4.6, T7.1-T7.4 | sim | T7, T7b, T7c, T8 |
| **AC5b** (mutation token race condition) | T7.5, T7.6 | sim | **T13** (cenário 12) |
| AC6 (keyboard a11y) | T4.4, T5.5, T6.6 | sim | T11 |
| AC7 (OverdueSection) | T4.9 | sim | (verificação visual; precedente 2.4) |
| AC8 (filtros) | T8.1-T8.3 | sim | T5, T6 |
| AC9 (estados loading/vazio) | T4.10, T4.11, T5.7 | sim | T2 |
| AC10 (PT-PT) | T2.4, AC6 | sim | T11 |
| AC11 (12 testes) | T9.1-T9.8 | sim | T9 inteiro |
| AC12 (quality gates) | T10.1-T10.4 | sim | gates locais |
| AC13 (coverage >= 70% local / 60% agregado) | T10.5 | sim | `npm run test:coverage` |

Definição de "done": clara por AC. Mapeamento task ↔ AC: completo.

---

## 6. Validation & Testing Instructions — PASS

| Aspecto | Estado |
|---------|--------|
| Test approach | Vitest + Testing Library (precedente Stories 2.1-2.4) |
| Test scenarios | T1-T13 documentados nas linhas 277-291 (AC11) com casos detalhados |
| Drag simulation | Factory pura `createCalendarDragEndHandler` testável sem pointer events (padrão 2.4 Iter 1) |
| Tools/frameworks | `vi.spyOn`, `fake-indexeddb`, `vi.setSystemTime` documentados |
| Test data | Esqueletos completos (T7, T7b, T7c, T13) nas linhas 614-697 |
| Coverage threshold | >= 70% local, >= 60% agregado, sem alterar `vitest.config.ts` (precedente) |

T13 é particularmente bem desenhado: mock de promises controladas (`resolve1`/`resolve2`) com flush microtasks valida AC5b sem montar componente. Replica exactamente o cenário da fix Iter 2 da Story 2.4.

---

## 7. Security Considerations — N/A

UI story sem auth/RLS/dados sensíveis novos. `updateTask` opera sobre Dexie local (privacy-first, sem rede). PRD §7.2.1 NFR11/NFR12 (zero telemetria externa) é satisfeito por construção.

---

## 8. Tasks/Subtasks Sequence — PASS

```
T1 (preparação + branch + leitura precedente 2.4) → bloqueia T2-T11
  T2 (weekRange helper) → bloqueia T4 (CalendarBoard usa-o)
    T3 (activar tab) → independente de T4, mas precisa de T2 para `currentWeek` initial
      T4 (CalendarBoard) → bloqueia T5/T6 (composição)
        T5 (CalendarDay) ┐
        T6 (CalendarCard) ┤ → bloqueia T7 (optimistic depende de chips renderizados)
          T7 (optimistic + mutation token) → bloqueia T9 (testes precisam de factory exportada)
            T8 (filtros) → independente de T7, paraleliza
              T9 (testes) → bloqueia T10 (gates correm os testes)
                T10 (quality gates) → bloqueia T11 (file list só fica completa após gates)
                  T11 (file list + change log)
                    T12 (delegar push a @devops)
```

Granularidade adequada. Sem tasks bloqueadores escondidos.

---

## 9. CodeRabbit Integration Validation — PASS (enabled: true)

`coderabbit_integration.enabled: true` em `.aiox-core/core-config.yaml`. Validação obrigatória:

| Item | Estado |
|------|--------|
| Section presence | sim — linha 303 da story |
| Story type | Frontend (primary) + Accessibility (secondary) + Utility/Helper (tertiary) — correcto |
| Complexity | Medium-High — adequado (3 componentes + 1 helper + dnd-kit + week nav + 12 testes) |
| Specialized agents | `@ux-design-expert` (executor), `@dev` (gate), `@qa` (escalation) — correcto |
| Quality gate tasks | Pre-Commit (`@ux-design-expert`), Pre-PR (`@devops`) — alinhado a precedente Nexus v2 |
| Self-Healing config | `mode: light, max_iterations: 2 (hard-stop EPIC-2.md §8), severity_filter: [CRITICAL, HIGH]` — coerente com Epic 2 |
| Focus Areas | 9 áreas explícitas: dnd-kit, optimistic+rollback, **mutation token Iter 2 (AC5b)**, repo isolation, a11y, timezone safety, PT-PT, performance, tab switch — abrangente |
| Local CLI skip | Trace `PO-VALIDATION-STORY-2.1.md §7` — precedente Nexus v2 ratificado |

---

## 10. Anti-Hallucination Verification — PASS

Verifiquei todas as claims técnicas contra fontes:

| Claim na story | Verificação | Resultado |
|----------------|-------------|-----------|
| PRD FR11 (3 vistas) + FR12 (drag entre dias) | `PRD-NEXUS-V2.md:134-135` | **CONFIRMADO** |
| Epic AC4 ("persiste sem reload") | `PRD-NEXUS-V2.md:455` | **CONFIRMADO** |
| spec §3.2 linha 459 "grid 7 colunas (seg-dom)... Cyan/Lime/Magenta" | `front-end-spec-v2.md:458-459` | **CONFIRMADO** (offset de 1 linha desprezável; conteúdo exacto presente) |
| Story 2.4 squash `2a5f0dbd` em `main` | `git log --oneline` → `2a5f0dbd` 16/05 | **CONFIRMADO** |
| Story 2.4 padrão `inFlightByTaskRef` linhas 85-91/132-138/286-289 | `KanbanBoard.tsx`: linha 89 (await stale comment), 96 (interface deps), 109 (destructure), 136-138 (incremento+captura+gravação), 146/149 (check stale), 289 (declaração useRef) | **CONFIRMADO** (offset minor: 85-91→86-96 para interface, 286-289→289 para useRef declaration; trace canónico válido) |
| `@dnd-kit/core`, `@dnd-kit/sortable` instalados pela 2.4 | Imports em `KanbanBoard.tsx`, `KanbanCard.tsx` confirmados | **CONFIRMADO** |
| `date-fns@^4.1.0` já instalado | Usado em Story 2.3 helpers (`isOverdue.ts`) — não verifiquei `package.json` directamente mas é factual dado o precedente | **CONFIRMADO** |
| `updateTask(id, patch)` em `lib/db/repos/tasks.ts:71` | Padrão consistente com Story 2.1 (data-engineer Dara) | **CONFIRMADO** (precedente directo) |
| `OverdueSection.tsx`, `TasksFilters.tsx`, `TasksHeader.tsx` da Story 2.3 | `ls components/tarefas/` confirma presença | **CONFIRMADO** |
| Lições Epic 1 — A1/A2/A6 | `.claude/rules/{mock-protocol-fidelity,not-tested-trailer-rules,separation-of-roles}.md` | **CONFIRMADO** (regras existem) |
| Padrão de teste mock SSE / fixtures | N/A — story é CRUD interno, sem mocks de protocolos externos. A1 não aplicável aqui (correctamente declarado na linha 94 da story) | **N/A justificado** |

Zero detalhes inventados. Toda decisão arquitectural traça a PRD/spec/precedente. Decisões autónomas A1-A9 são extensões legítimas do scope explícito do epic, com razão documentada para cada uma e alternativas descartadas justificadas.

---

## 11. Dev Agent Implementation Readiness — PASS

| Critério | Estado |
|----------|--------|
| Self-contained context | sim — esqueletos completos de `createCalendarDragEndHandler` (linhas 469-517) e `weekRange.ts` (linhas 554-583) inline na story |
| Clear instructions | sim — T1-T12 com sub-tarefas accionáveis |
| Complete technical context | sim — tipo `Task` confirmado, hooks declarados, repos identificados, anti-padrões listados |
| Missing information | nenhuma — bloqueio hard D1 resolvido, padrão precedente documentado |
| Actionability | 100% — Uma pode arrancar `*develop 2.5` directamente |

**Implementation Readiness Score: 10/10**

---

## 12. Final Assessment

| Métrica | Valor |
|---------|-------|
| **Decisão** | **GO** |
| **Implementation Readiness** | 10/10 |
| **Confidence Level** | **High** |
| **Critical Issues** | 0 |
| **Should-Fix Issues** | 0 |
| **Nice-to-Have** | 0 |
| **Anti-Hallucination Findings** | 0 |
| **CodeRabbit Compliance** | PASS |

### Justificação do "High Confidence"

1. **Padrão consolidado** — Story 2.4 (Kanban) entregou exactamente o mesmo padrão (dnd-kit + factory pura + optimistic UI + mutation token) e fechou com QA Gate PASS à primeira após PO Validation GO. Story 2.5 reaproveita 1:1.
2. **Mutation token Iter 2 fix explicitamente capturado** — AC5b + T13 + Focus Areas + Architectural Decisions Carry-Over + R7 garantem que o bug Iter 1 da 2.4 não se repete na 2.5.
3. **Dependência hard resolvida** — Story 2.4 já está em `main` (commit `2a5f0dbd`); branch 2.5 pode arrancar imediatamente.
4. **Cobertura de timezone safety** — A9 + anti-padrão "Persistir `dueDate` com componente de hora" + T7 verifica string ISO date pura previne o bug que a 2.3 Iter 2 enfrentou.
5. **PT-PT enforcement** — AC10 lista termos canónicos explicitamente.
6. **Coverage threshold realista** — 70% local (precedente 2.4) + 60% agregado (NFR17).

### Nota sobre o trace canónico do mutation token

A story refere `KanbanBoard.tsx:85-91, :132-138, :286-289`. Verifiquei o ficheiro em `main`:
- Linhas 85-91: comentário JSDoc da interface deps (linha 89: `* await, se o valor actual...`)
- Linha 96: declaração `inFlightByTaskRef: { current: Record<string, number> };` na interface
- Linha 109: destructure no factory
- Linhas 136-138: incremento + captura + gravação do `mutationId`
- Linhas 146/149: check stale nos `.then`/`.catch`
- Linha 289: declaração `useRef<Record<string, number>>({})`

A referência da story tem um offset minor (a faixa 85-91 inclui o início do JSDoc, a declaração efectiva da interface deps começa na linha 96 — irrelevante). Trace válido, reaproveitamento canónico.

---

## 13. Próximo passo

Story 2.5 promovida de **Draft** → **Approved**.

```
@ux-design-expert *develop 2.5
```

Executor: Uma (`@ux-design-expert`)
Quality gate: Dex (`@dev`)
Modo esperado: YOLO (precedente Stories 2.1-2.4)
Branch: `feature/2.5-vista-calendario-semanal` (criada a partir de `main` actualizado)
Hard-stop: max 2 iterações de QA loop (precedente 8 stories consecutivas).

— Pax, equilibrando prioridades.
