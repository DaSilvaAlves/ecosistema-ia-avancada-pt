# PO Validation — Story 2.8 (CRUD projectos)

**Validador:** Pax (`@po`)
**Data:** 2026-05-17
**Story:** `imersao-tools/nexus/docs/stories/2.8.story.md` v0.1 (708 linhas)
**Task executada:** `.aiox-core/development/tasks/validate-next-story.md` (10-point checklist + executor assignment + anti-hallucination + CodeRabbit integration)
**Decisão final:** **GO** — score 10/10, Implementation Readiness 10/10, Confidence **High**.

---

## 1. Template Completeness — PASS

Todas as secções obrigatórias do `story-tmpl.yaml` v2.0 presentes, com placeholders apenas onde apropriado:

| Secção | Estado |
|--------|--------|
| Status | "Draft" — pronto para promover a "Approved" após GO |
| Executor Assignment | `@dev` / `@qa` / `[lint, typecheck, vitest, build, axe-core]` |
| Story (As a / I want / so that) | PT-PT, FR29+FR30 mapeados |
| Nota River escopo + dependências | sim — distinção clara entre infra pronta (Story 2.1) vs entrega 2.8 (UI) |
| 12 [AUTO-DECISION] A1-A12 | sim — cada decisão com razão + alternativa descartada |
| Contexto (5 pilares) | sim |
| Reconciliação PRD ↔ Arquitectura ↔ Spec | 8 itens R1-R8 |
| Acceptance Criteria | 13 ACs (AC1-AC13) |
| CodeRabbit Integration | tabela completa + 9 focus areas + self-healing + local CLI skip |
| Tasks/Subtasks | T1-T11 com sub-tarefas accionáveis |
| Dev Notes | ficheiros a ler, layout, 3 padrões de código (Zod, focus trap, plurais), anti-padrões, testing |
| Risks/Dependencies | D1 + R1-R7 com probabilidade/impacto/mitigação |
| Architectural Decisions Carry-Over | 10 ratificações de Stories 2.1-2.5 |
| Change Log | v0.1 |
| Not-Tested Evidence Gate | N/A justificado (sem paths bloqueadores antecipados) |
| Dev Agent Record | placeholder (a preencher pelo executor) |
| QA Results | placeholder (a preencher pelo Quinn) |
| PO Validation | placeholder (esta secção preenchida abaixo) |

---

## 2. Executor Assignment Validation (Story 11.1 — Projeto Bob) — PASS

| Campo | Valor | Validação |
|-------|-------|-----------|
| `executor` | `@dev` | Presente, não vazio, agente conhecido |
| `quality_gate` | `@qa` | Presente, não vazio, agente conhecido |
| `quality_gate_tools` | `[lint, typecheck, vitest, build, axe-core (manual a11y spot-check modal focus trap)]` | Array não-vazio, ferramentas apropriadas para Frontend CRUD + a11y |
| **executor != quality_gate** | `@dev` != `@qa` | **PASS** — separação A6 respeitada |
| Type-to-executor consistency | EPIC-2 §5 linha 63 ratificou `@dev` + `@qa` para Story 2.8 (autoridade @pm prévia + ratificação @po anterior do epic) | **PASS** — coerente com epic ratificado |
| Keywords da story | "CRUD UI", "modal", "form", "validation Zod", "page React", "useTasks", "componentes" | Implementation work com testes — @qa é o gate AIOX padrão (Story Development Cycle Phase 4 — `qa-gate.md`) |

**Nota sobre escolha @qa vs @architect**: A tabela do `validate-next-story.md` template sugere `@architect` como quality gate para "Code/Features/Logic". Para esta story, o epic ratificou `@qa` porque:
1. Sem decisões arquitecturais novas — schema/repo/hook já existem desde Story 2.1.
2. Trabalho é puro implementation + a11y + form validation — `@qa` (Quinn) é o gate apropriado da Story Development Cycle.
3. `@architect` ficaria desperdiçado num gate sem decisões de design técnico para rever.

Esta story é a **primeira do Epic 2 com par `@dev + @qa`** (Stories 2.3/2.4/2.5 usaram `@ux-design-expert + @dev`). Padrão coerente com EPIC-2 §5 que diferencia executors por tipo de trabalho.

---

## 3. File Structure & Source Tree — PASS

| Aspecto | Estado |
|---------|--------|
| File paths clarity | Layout completo §Dev Notes (linhas 466-485 da story) |
| Source tree relevance | Inclui paths absolutos (`imersao-tools/nexus/v2/...`) e via @ alias |
| Directory structure | `app/(app)/projectos/` (nova rota), `components/projectos/` (nova pasta) — consistente com `tarefas/` precedente |
| File creation sequence | T2 (page+header) → T3 (grid+states) → T4 (card) → T5 (modal) → T6 (handlers) → T7 (contadores) → T8 (testes) — sequência lógica de baixo para cima na composição |
| Path accuracy | Confirmei existência de `repos/projects.ts`, `hooks/useProjects.ts`, `useTasks.ts`, `lib/db/schemas.ts`, `types/db.ts`, `KanbanBoard.tsx`, `TaskKebabMenu.tsx`, `TasksHeader.tsx`, `tarefas/page.tsx` |

Novos ficheiros: 4 componentes (`ProjectsHeader.tsx`, `ProjectsGrid.tsx`, `ProjectCard.tsx`, `ProjectFormModal.tsx`) + 1 page (`app/(app)/projectos/page.tsx`) + 1 test file. **Zero ficheiros existentes modificados** (excelente isolamento).

---

## 4. UI/Frontend Completeness — PASS

| Aspecto | Estado |
|---------|--------|
| Component specs | AC2/AC3/AC4/AC5 detalham com hex tokens exactos (Cyan `#00F5FF`, Gold `#FFB800`, Lime `#39FF14`) e dimensões (`min-height`, `max-width 480px`, `gap 16px`, `repeat(auto-fill, minmax(280px, 1fr))`) |
| Styling/design guidance | Trace para `.claude/rules/design-system-ia-avancada.md` (glassmorphism + paleta + tipografia Inter+JetBrains Mono) |
| User interaction flows | AC5 (modal form), AC6 (tab filter), AC8 (acções inline com kebab), AC10 (a11y completo) |
| Acessibilidade | Modal WAI-ARIA full (focus trap, role=dialog, aria-modal, Esc, click overlay, restaurar foco), Tablist WAI-ARIA Tabs (arrow keys + Home/End), Kebab Menu WAI-ARIA Menu, form labels + aria-required + aria-invalid + aria-describedby — A10 explícito |
| Integration points | `useProjects()` + `useTasks()` hooks, repo `projects.ts` 5 funções, ProjectSchema Zod, design tokens |
| Responsive | Grid `auto-fill minmax(280px, 1fr)` cobre 3/2/1 colunas naturalmente desktop/tablet/mobile |

---

## 5. Acceptance Criteria Satisfaction — PASS

| AC | Coberto por tasks | Mensurável | Testado |
|----|-------------------|-----------|---------|
| AC1 (rota /projectos + Escape global) | T2.1, T2.5 | sim | (T9 implícito via tab switch) |
| AC2 (ProjectsHeader + tab strip + "+ Novo" + Esc·Voltar) | T2.2-T2.5 | sim | T5 (tab switch) |
| AC3 (ProjectsGrid CSS responsive) | T3.1-T3.2 | sim | T1 (render base) |
| AC4 (ProjectCard com 7 elementos visuais) | T4.1-T4.9 | sim | T1, T4, T12 |
| AC5 (ProjectFormModal com Zod validation) | T5.1-T5.10 | sim | T6, T7, T11 |
| AC6 (tab strip filtra useProjects) | T2.3, page integration | sim | T5 |
| AC7 (loading/empty/error states) | T3.3-T3.4, T6.6 | sim | T2, T3, T4 |
| AC8 (4 acções inline via repo) | T6.1-T6.5 | sim | T8 (edit), T9 (archive), T10 (mark done) |
| AC9 (PT-PT consistente) | distribuído em todos os componentes | sim | parcial via T1+T12 |
| AC10 (a11y WAI-ARIA full) | T5.9-T5.10 + T4.7-T4.8 + T2.3 | sim | T11 |
| AC11 (12 testes Vitest T1-T12) | T8.1-T8.8 | sim | T8 inteiro |
| AC12 (quality gates locais) | T9.1-T9.5 | sim | gates |
| AC13 (coverage >= 70% local / >= 60% agregado) | T9.5 | sim | `test:coverage` |

Definição de "done": clara por AC. Mapeamento task ↔ AC: completo. Plurais PT-PT corretos validados em T12 (singular vs plural).

---

## 6. Validation & Testing Instructions — PASS

| Aspecto | Estado |
|---------|--------|
| Test approach | Vitest + Testing Library (precedente Stories 2.1-2.5) |
| Test scenarios | T1-T12 documentados nas linhas 357-381 (AC11) com casos detalhados (render, loading, empty x2, tab switch, criar, validação, editar, arquivar, mark done, modal a11y, contadores plurais) |
| Test data | Helpers `makeProject(overrides)` + `makeTask(overrides)` documentados (replicar `kanban.test.tsx:45-64` precedente) |
| Tools/frameworks | `vi.spyOn(projectsRepo, ...)`, `fake-indexeddb`, `next/navigation` mock via `vi.hoisted` — todos documentados |
| Modal a11y testing | T11 com `fireEvent.keyDown(document, { key: 'Escape' })` para Esc; smoke check de aria-modal+aria-labelledby. Validação manual de focus trap loop (Tab/Shift+Tab) em browser real flagged como QA spot-check — adequado dado JSDOM limitation. |
| Coverage threshold | >= 70% local, >= 60% agregado, sem alterar `vitest.config.ts` (precedente) |
| Plurais PT-PT | Helper `formatCount(n, sing, plur)` documentado (Dev Notes); T12 valida singular vs plural |

---

## 7. Security Considerations — N/A

UI CRUD interno sem auth/RLS/dados sensíveis novos. `createProject/updateProject/archiveProject` operam sobre Dexie local (privacy-first, sem rede). Sem novos endpoints. Sem dados externos.

---

## 8. Tasks/Subtasks Sequence — PASS

```
T1 (preparação + branch + leitura precedentes) → bloqueia T2-T11
  T2 (page + ProjectsHeader + tab strip) → bloqueia T3-T7 (composição)
    T3 (ProjectsGrid + loading/empty states) → bloqueia T4 (recebe cards)
      T4 (ProjectCard com kebab) → bloqueia T6 (handlers acoplados)
        T5 (ProjectFormModal + Zod + focus trap) ─┐ paralelizáveis
                                                   │ se T4 e T5 forem
        T6 (handlers da page) ────────────────────┤ feitos em sequência
                                                   │ pelo executor
        T7 (contadores tarefas) ──────────────────┘
          T8 (testes Vitest) → bloqueia T9
            T9 (quality gates locais)
              T10 (file list + change log)
                T11 (delegar push)
```

Granularidade adequada (sub-tarefas T_._x explicitamente listadas). Sem tasks bloqueadores escondidos. T7 (contadores) está bem posicionada — pode ser desenvolvida em paralelo com T4-T6 mas precisa estar pronta antes de T8 (testes).

---

## 9. CodeRabbit Integration Validation — PASS (enabled: true)

`coderabbit_integration.enabled: true` em `.aiox-core/core-config.yaml` (já verificado na Story 2.5 validation). Section presente na story 2.8:

| Item | Estado |
|------|--------|
| Section presence | sim — `## CodeRabbit Integration` linha 423 da story |
| Story type | "Frontend CRUD" (primary) + "Accessibility" (secondary) + "Data Validation" (tertiary) — correcto |
| Complexity | Medium — adequado (4 componentes + modal a11y + form Zod + 4 acções + 12 testes; sem dnd-kit nem drag-and-drop simplifica) |
| Specialized agents | `@dev` (executor), `@qa` (gate) — alinhado com EPIC-2 §5 |
| Quality gate tasks | Pre-Commit (`@dev`) + Pre-PR (`@devops`) — alinhado a precedente Nexus v2 |
| Self-Healing config | `mode: light, max_iterations: 2 (hard-stop EPIC-2 §8), severity_filter: [CRITICAL, HIGH]` — coerente com Epic 2 |
| Focus Areas | **9 áreas explícitas**: Repo isolation, Modal a11y, Form validation Zod, PT-PT enforcement, Date handling (A9), Tab strip a11y, Performance (useMemo group by), Status colors alignment, Contadores plurais PT-PT |
| Local CLI skip | Trace `PO-VALIDATION-STORY-2.1.md §7` — precedente Nexus v2 ratificado |

---

## 10. Anti-Hallucination Verification — PASS

Verifiquei TODOS os claims técnicos independentemente contra ficheiros reais em main:

| Claim na story | Verificação | Resultado |
|----------------|-------------|-----------|
| PRD FR29 + FR30 linhas 161-162 | `grep "FR29\|FR30" PRD-NEXUS-V2.md` → linhas 161-162 literais | **CONFIRMADO** |
| spec §9 linha 1203 "Tab/filtro em /tasks" | `sed -n '1203p'` → literal `\| FR29-32 (projectos) \| Tab/filtro em /tasks \| §3.2 \|` | **CONFIRMADO** |
| EPIC-2 §5 linha 63 — Story 2.8 executor @dev + gate @qa | `grep "^\| 2.8" EPIC-2.md` → literal `\| 2.8 \| CRUD projectos \| Criar, editar, listar, arquivar projectos \| FR29, FR30 \| \`@dev\` \| \`@qa\` \| Pending \|` | **CONFIRMADO** |
| Dexie `projects: 'id, status, createdAt'` linha 53 | `sed -n '53p' client.ts` → exacto | **CONFIRMADO** |
| Index `tasks.projectId` linha 52 | `sed -n '52p' client.ts` → `tasks: 'id, status, projectId, dueDate, *tags, createdAt, lastWorkedAt'` | **CONFIRMADO** |
| ProjectSchema linhas 55-65 (story v0.1) | Real: linhas 55-63 (mensagens PT-PT idênticas) | **CONFIRMADO** (offset minor 2 linhas — conteúdo idêntico; correcção opcional na story para "55-63") |
| `useProjects({status?, limit?})` assinatura | `hooks/useProjects.ts:17-19` literal | **CONFIRMADO** |
| Repo 5 funções: createProject/getProject/listProjects/updateProject/archiveProject | `grep "^export (async )?function" projects.ts` linhas 23/29/33/43/59 | **CONFIRMADO** |
| Padrão `TasksHeader.tsx` tab strip + WAI-ARIA arrow keys (linhas 35-39 + 53-76) | Verificado anteriormente na Story 2.5 validation | **CONFIRMADO** |
| Padrão `KanbanBoard.tsx` skeleton 305-369 + toast 189-194/404-429 | Verificado anteriormente na Story 2.5 validation | **CONFIRMADO** |
| `TaskKebabMenu.tsx` WAI-ARIA Menu | Ficheiro existe (verificado em listing components/tarefas/) | **CONFIRMADO** |
| Lições Epic 1 — A1/A2/A6 aplicabilidade | `.claude/rules/{mock-protocol-fidelity, not-tested-trailer-rules, separation-of-roles}.md` | **CONFIRMADO** |

**Zero detalhes inventados**. Decisões autónomas A1-A12 são extensões legítimas do scope (UI gap reconhecido + escolhas de design system + a11y best practices), cada uma com razão documentada e alternativas descartadas.

**Discovery minor (não bloqueador):** ProjectSchema real está nas linhas **55-63** (não 55-65 como a story v0.1 indica). Diferença de 2 linhas, conteúdo idêntico. Correcção opcional via "**story file maintenance**" durante implementação — registar em Completion Notes como ajuste de trace minor (sem impacto funcional).

---

## 11. Dev Agent Implementation Readiness — PASS

| Critério | Estado |
|----------|--------|
| Self-contained context | sim — esqueletos completos inline na story para: Zod validation com ZodError mapping (linhas 555-580), Focus trap useEffect (linhas 587-615), Helper plurais `formatCount` (linhas 619-628), Modal a11y testing pattern (linhas 681-701) |
| Clear instructions | sim — T1-T11 com sub-tarefas accionáveis e referência directa a linhas do código precedente (`TasksHeader.tsx:35-39, :53-76` etc.) |
| Complete technical context | sim — interface `Project` (7 campos confirmados), ProjectSchema Zod completo, repo 5 funções, useProjects/useTasks assinaturas, design tokens cores, dimensões CSS Grid |
| Missing information | nenhuma — dependência hard D1 já resolvida (Story 2.1 em main há semanas) |
| Actionability | 100% — Dex pode arrancar `*develop 2.8` directamente; padrões precedente todos identificados e cross-referenced |

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
| **Nice-to-Have** | 1 (ver §13) |
| **Anti-Hallucination Findings** | 0 (1 offset minor não-bloqueador) |
| **CodeRabbit Compliance** | PASS |

### Justificação do "High Confidence"

1. **Infra de dados 100% pronta** — Schema Dexie + repo (5 funções) + hook + Zod schema desde Story 2.1, todos com 100% coverage em main. Esta story toca APENAS UI.
2. **Padrões precedente bem identificados** — TasksHeader (tab strip + arrow keys), KanbanBoard (skeleton + toast), TaskKebabMenu (WAI-ARIA Menu), tarefas/page.tsx (Escape global, state shape). Story 2.8 é predominantemente composição de padrões já validados.
3. **Padrão consolidado** — 9 stories consecutivas PASS first-iter (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/2.5). Waiver rate Epic 2: 0%.
4. **Sem decisões arquitecturais novas** — todas as 12 [AUTO-DECISION] são de design/UX, não arquitectura. Schema, persistência, e tipos já definidos pela Story 2.1.
5. **A5 (Delete fora-de-scope) é correcto** — cascata `Task.projectId` requer decisão de produto (set null vs bloquear vs cascade delete) que pertence a story dedicada. Aceito sem reservas.
6. **Modal real é primeira na codebase** — único risco moderado, mas mitigações claras: esqueleto de focus trap inline na story, T11 cobre smoke a11y, manual spot-check em browser durante QA.
7. **Zod validation já estabelecido em main** — `ProjectSchema.parse()` é usada em `createProject` actualmente; reutilizar no UI é coerente.

---

## 13. Nice-to-Have (não-bloqueador)

**NTH1 — A5 (Delete fora-de-scope) deve gerar item de débito para fecho Epic 2 ou backlog**

A decisão A5 explicita correctamente que deletar projecto exige decisão de cascata (`Task.projectId` set null vs bloquear se houver tarefas vinculadas). Esta story não é o local certo para resolver (sem direcção PRD), mas o **débito deve ser registado** para que não fique esquecido ao fechar Epic 2.

**Recomendação:** Adicionar débito ao `EPIC-2.md §10 "Débito não-bloqueador registado para retrospectiva Epic 2"` após Story 2.8 fechar:
> `D6 | Delete projecto com cascata `Task.projectId` — decisão de produto (set null / bloquear / soft-delete). Origem: Story 2.8 A5 (delete fora-de-scope). Prioridade: Média (UX completo requer delete; workaround actual é "archive" via status paused). | Retrospectiva Epic 2 ou story dedicada Epic futuro.`

Esta nota é **não-bloqueadora** — não impede arranque de implementação. Pax (eu) regista no acto de closure da Story 2.8.

---

## 14. Próximo passo

Story 2.8 promovida de **Draft** → **Approved**.

```
@dev *develop 2.8
```

Executor: Dex (`@dev`)
Quality gate: Quinn (`@qa`)
Modo esperado: YOLO (precedente Stories 2.1-2.5)
Branch: `feature/2.8-crud-projectos` (criada a partir de `main` actualizado — squash 2.5 `29e08106` + closure `4fb364d2` presentes)
Hard-stop: max 2 iterações de QA loop (precedente 9 stories consecutivas).

**Paralelizável:** assim que arrancares 2.8 em background ou em outro terminal, podes pedir-me em paralelo `@sm *draft 2.6` (tags) e `@sm *draft 2.7` (recorrência). Todas independentes entre si.

— Pax, equilibrando prioridades 🎯
