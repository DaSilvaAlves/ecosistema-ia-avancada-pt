# RETOMA — Story 2.4 Ready for Review · Next: `@dev *qa-gate 2.4`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Uma (`@ux-design-expert`)
**Para:** Dex (`@dev`) — quality gate (separação A6)
**Data:** 2026-05-16
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** PENDING (consumir ao invocar `@dev *qa-gate 2.4`)

---

## Sumário executivo

Story 2.4 (Vista Kanban) implementada em iteração única — modo YOLO — pela Uma. Status `Validated → Ready for Review`. Branch `feature/2.4-vista-kanban` em local apenas (sem push ainda — aguarda quality gate Dex).

**Quality gates locais 5/5 PASS à primeira:**

| Gate | Resultado |
|------|-----------|
| `npm run lint` | 0 errors, 1 warning pré-existente em `/api/auth/logout` (não Story 2.4) |
| `npm run typecheck` | exit 0 |
| `npm run test:unit` | 466/466 PASS (12 novos kanban.test.tsx + 14 page.test.tsx actualizado + 440 anteriores) |
| `npm run build` | exit 0 — rota `/tarefas` 25kB |
| `npm run test:coverage` | `app/(app)/tarefas/` 85.71%, `components/tarefas/` 83.84%, `lib/tarefas/` 100%, agregado 87.4% (todos ≥ thresholds AC12/NFR17) |

12 ACs honrados (AC1-AC12). 5 [AUTO-DECISION] A1-A5 cumpridas. Sem regressão em Story 2.3 (test T9 actualizado para reflectir Kanban activo).

---

## Acções concretas Dex

### 1. Sincronizar com branch local Uma

A branch `feature/2.4-vista-kanban` existe localmente (Uma não fez push). Para auditar:

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt
git status                  # confirma branch actual
git log --oneline -5        # vê commits da Uma (provavelmente staged uncommitted)
git diff main...HEAD        # vê alterações vs main
```

> **NOTA:** Uma deixou alterações UNCOMMITTED na branch (working tree). Não criou commit. Decisão consciente — quality gate Dex revê primeiro, depois Dex (ou Uma após fixes) faz commit no final. Padrão usado nas Stories 2.1/2.2/2.3.

### 2. Ler a story + handoffs

| Ordem | Ficheiro |
|-------|----------|
| 1 | `imersao-tools/nexus/docs/stories/2.4.story.md` (story completa, ACs, Dev Agent Record, File List, Change Log v1.0) |
| 2 | Este handoff |
| 3 | `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260516-story-2.4-validated-ready-for-ux-design-expert.md` (handoff entrada Uma) |
| 4 | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.4.md` (validação Pax 9.0/10 GO) |

### 3. Executar `*qa-gate 2.4` (separação A6)

Como `@dev` Dex, valida implementação:
- **7 checks DoD** do quality gate AIOX (Constitution Articulo V — Quality First)
- **12 ACs** mapeados aos commits/ficheiros
- **5 [AUTO-DECISION]** A1-A5 da Story 2.4 ratificadas?
- **5/5 quality gates locais** reproduz byte-a-byte (lint, typecheck, test:unit, build, coverage)
- **Anti-padrões** verificados:
  - [x] Zero `db.tasks.*` directo no componente (só `setTaskStatus` do repo) ✓
  - [x] `lib/tarefas/formatDueDate.ts` NÃO criado autonomamente ✓
  - [x] `vitest.config.ts` thresholds globais inalterados (só `coverage.include` allowlist) ✓
  - [x] Optimistic UI + rollback em catch ✓
  - [x] PT-PT canónico em todos os strings UI ✓
  - [x] mock-protocol-fidelity N/A confirmado (sem mocks SSE/MSW) ✓

### 4. Veredicto

| Veredicto | Acção subsequente |
|-----------|-------------------|
| **PASS** | Status `Ready for Review → Done`. Handoff de saída para `@po *close-story 2.4`. |
| **CONCERNS** | Listar fixes triviais (≤2h). Uma absorve numa iteração curta. |
| **FAIL** | Iter 1 fix loop (max 2 iter EPIC-2 §8). Documenta razões e cria handoff `qa-loop-fix`. |

---

## Ficheiros tocados (resumo)

| Categoria | Path | Status |
|-----------|------|--------|
| Novo | `components/tarefas/KanbanBoard.tsx` (~330 linhas) | Orchestrator: DndContext + 4 colunas + optimistic UI + announcements PT-PT + skeleton |
| Novo | `components/tarefas/KanbanColumn.tsx` (~125 linhas) | Coluna: useDroppable + SortableContext + header com accent + empty state |
| Novo | `components/tarefas/KanbanCard.tsx` (~175 linhas) | Card: useSortable + memo + glassmorphism + WAI-ARIA + tinting overdue |
| Novo | `tests/unit/app/tarefas/kanban.test.tsx` (~330 linhas, 12 testes) | Tests T1-T10 + sub-tests T7b/T7c |
| Modificado | `app/(app)/tarefas/page.tsx` | Estado `activeTab` + `hiddenColumns` memo + `tagsLookup` memo + renderização condicional |
| Modificado | `components/tarefas/TasksHeader.tsx` | Kanban activado + arrow-key nav PA4 + `onTabChange` prop |
| Modificado | `tests/unit/app/tarefas/page.test.tsx` (T9 apenas) | T9 actualizado: "Kanban activo + Cal disabled" |
| Modificado | `docs/stories/2.4.story.md` | Status `Validated → Ready for Review` + Dev Agent Record + File List + Change Log v1.0 |

> **NOTA:** Os 4 ficheiros modificados em ramos do River (`docs/HANDOFF-INDEX.md`, `imersao-tools/nexus/docs/handoffs/INDEX.md`, `2.4.story.md` amendment v0.2, RETOMA handoffs) também estão no working tree desta branch. Devem ser parte do commit final.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-ready-for-dev-quality-gate.md`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA — coincide com pasta do projecto. CONSULTAR `.claude/rules/handoff-location.md` SE EM DÚVIDA.

---

## Pontos focais para auditoria Dex

| # | Ponto | Onde olhar |
|---|-------|------------|
| 1 | **Factory pura `createKanbanDragEndHandler`** exposta para teste | `KanbanBoard.tsx` linha ~80 (export function) |
| 2 | **Optimistic UI com `useRef`** para evitar stale closure | `KanbanBoard.tsx` linhas ~170-175 (`overridesRef` + useEffect sync) |
| 3 | **Cleanup automático de overrides** quando Dexie confirma | `KanbanBoard.tsx` linhas ~125-140 (`useEffect` em `tasks`) |
| 4 | **Sensors PointerSensor + KeyboardSensor** com `activationConstraint distance: 4` | `KanbanBoard.tsx` linha ~190 |
| 5 | **announcements PT-PT** em `useMemo` para A11y D&D | `KanbanBoard.tsx` linhas ~200-235 |
| 6 | **`hiddenColumns` propagation** via prop ReadonlySet<string> | `KanbanColumn.tsx` `isHidden` + `display: none` |
| 7 | **`@dnd-kit/utilities` não declarado em package.json** — dep transitiva | KanbanCard.tsx import `from '@dnd-kit/utilities'` |
| 8 | **Filtro Status em modo Kanban** — `effectiveStatusForQuery = undefined` | `page.tsx` linha ~57 (comentado e justificado) |
| 9 | **Test harness simplificado** — chama factory pura directamente | `kanban.test.tsx` T7/T8 |
| 10 | **Arrow-key nav PA4** — `tabIndex` gerido + setas + Home/End | `TasksHeader.tsx` `handleKeyDown` |

---

## Cenários para Dex

**Cenário A — PASS à primeira (mais provável)**
→ 12 ACs verificados, gates reproduzidos. Status `Done`. Criar handoff `qa-PASS` para Pax `*close-story 2.4`.

**Cenário B — CONCERNS (fixes triviais)**
→ Lista fixes ≤2h em comment/handoff. Uma absorve numa iteração curta. Re-gate.

**Cenário C — FAIL (issues majores)**
→ Iter 1 fix loop. Documenta em `RETOMA-20260516-story-2.4-qa-loop-fix.md`. Uma corrige. Max 2 iter (EPIC-2 §8). Iter 3 só com aprovação Eurico explícita.

**Cenário D — Quality gate detecta drift face a amendment v0.2 do River**
→ Confirma com handoff entrada da Uma se os ajustes do River são honrados. Se não, escalada para `@aiox-master`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2 (subprojecto de `imersao-tools/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-ready-for-dev-quality-gate.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-ready-for-dev-quality-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Uma (`@ux-design-expert`)
DATA: 16/05/2026
