# RETOMA — Story 2.4 Validated + Amendment v0.2 · Next: `@ux-design-expert *develop 2.4`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** River (`@sm`)
**Para:** Uma (`@ux-design-expert`) — qualquer terminal, qualquer sessão
**Data:** 2026-05-16
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** CONSUMED 2026-05-16 por Uma (`@ux-design-expert`) — implementação YOLO mode em iteração única.
**Consumido em:** 2026-05-16
**Consumido por:** Uma (`@ux-design-expert`)
**Resultado:** 12 ACs honrados, 5/5 quality gates locais PASS à primeira. Status Story 2.4 `Validated → Ready for Review`. Handoff de saída `RETOMA-20260516-story-2.4-ready-for-dev-quality-gate.md` criado para Dex (separação A6).

---

## Sumário executivo

Story 2.4 (Vista Kanban) **Validated 9.0/10 GO** desde 15/05/2026 (PO Pax) e com **amendment v0.2** aplicado em 16/05/2026 pós-merge da Story 2.3 em main (PR #20 squash `667c1dac` + closure `3d97c212`). Story pronta para implementação — todas as dependências resolvidas, helpers consolidados, `@dnd-kit` instalado.

Next action: `@ux-design-expert *develop 2.4` arrancando de `main@3d97c212` actualizado.

---

## Contexto do amendment v0.2 (16/05/2026)

Houve trabalho cross-terminal entre 15-16/05/2026:

- **Terminal X (15/05):** River draftou 2.4 → Pax validou 9.0/10 GO → Status `Validated` ficou em `imersao-tools/nexus/docs/stories/2.4.story.md`.
- **Terminal Y (15-16/05):** Gage+Dex+Uma fecharam o fix loop Iter 3 da Story 2.3 → PR #20 merge → closure `3d97c212`. Handoff `RETOMA-20260516-story-2.3-merged-next-2.4-kanban.md` criado a pedir `@sm *draft 2.4` (assumindo que a story não existia).

River detectou o conflito ao consumir o handoff de entrada. Em vez de re-draft (que descartava a validação Pax), aplicou **amendment v0.2** sincronizando a story com o estado real de `main`. Story mantém-se `Validated` sem regressão.

---

## Mudanças do amendment v0.2

| # | Mudança | Localização na story |
|---|---------|----------------------|
| (a) | D1 marcado RESOLVED (Story 2.3 em main) | §Risks / Dependencies |
| (b) | D2 marcado RESOLVED (shape final pós Iter 1) | §Risks / Dependencies |
| (c) | Dev Notes "Ficheiros a ler" corrigido — `lib/tarefas/formatDueDate.ts` substituído por `lib/tarefas/isOverdue.ts:140` que exporta `formatDueDate` (consolidação Iter 1 Uma A3) | §Dev Notes |
| (d) | T1.4 reformulado — importar do helper consolidado, **proibido criar `lib/tarefas/formatDueDate.ts` autónomo** | §Tasks / Subtasks |
| (e) | R1 confirmado BAIXO via `package.json` (`@dnd-kit/core@^6.1.0` + `sortable@^8.0.0`) | §Risks / Dependencies |
| (f) | Pax Recommended improvement #1 ratificada como já-resolvida pela Iter 1 da 2.3 — sem trabalho extra em T1 | §PO Validation |
| (g) | Handoff de entrada `RETOMA-20260516-story-2.3-merged-next-2.4-kanban.md` consumido + movido para `archive/` | INDEX local Nexus |

---

## O que Uma DEVE fazer ao consumir este handoff

### 1. Sincronizar com main

```bash
cd /c/Users/XPS/Documents/ecosistema-ia-avancada-pt
git fetch
git checkout main
git pull
git status   # verificar que está limpo no head 3d97c212
git checkout -b feature/2.4-vista-kanban
```

### 2. Ler a story (na ordem)

| Ordem | Ficheiro |
|-------|----------|
| 1 | `imersao-tools/nexus/docs/stories/2.4.story.md` (12 ACs, 11 Tasks, ~35 subtarefas) |
| 2 | `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260516-story-2.3-merged-next-2.4-kanban.md` (10 pontos críticos + 6 lições reusáveis L1-L6) |
| 3 | `imersao-tools/nexus/docs/stories/completed/2.3.story.md` (precedente — formatDueDate consolidado, kebab WAI-ARIA, allowlist vitest) |
| 4 | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.4.md` (validação Pax 9.0/10 GO completa) |
| 5 | `imersao-tools/nexus/docs/EPIC-2.md` §5 + §8 + §9 (Story 2.4 row, hard-stop 2 iter CR, coverage thresholds) |

### 3. Ler ficheiros do repo antes de tocar código (T1)

| Ficheiro | Porquê |
|----------|--------|
| `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts` | **Importar `formatDueDate`, `isOverdue`, `daysOverdue`, `parseDueDateMs` daqui** — não criar `lib/tarefas/formatDueDate.ts` autónomo. |
| `imersao-tools/nexus/v2/components/tarefas/TaskRow.tsx` | Shape de props + paleta badges — KanbanCard reutiliza a mesma paleta. |
| `imersao-tools/nexus/v2/components/tarefas/TasksHeader.tsx` | Tab strip — remover `disabled={true}` + tooltip "Em construção · Story 2.4" do tab Kanban; conectar `onClick`. |
| `imersao-tools/nexus/v2/components/tarefas/OverdueSection.tsx` | Reutilizar directamente, zero alterações. |
| `imersao-tools/nexus/v2/components/tarefas/TasksFilters.tsx` | Estender com prop `mode: 'lista' \| 'kanban'`. |
| `imersao-tools/nexus/v2/lib/db/repos/tasks.ts` | Confirmar assinatura `setTaskStatus(id, status)` linha ~78. |
| `imersao-tools/nexus/v2/package.json` | Confirmar `@dnd-kit/core` e `@dnd-kit/sortable` instalados (esperado: `^6.1.0` / `^8.0.0`). |

### 4. Sequência de implementação

| Task | Estado |
|------|--------|
| T1 Preparação (verificar deps, ler ficheiros) | Iniciar |
| T2 Activar tab Kanban (AC1) | Depois T1 |
| T3 KanbanBoard (AC2, AC6, AC7, AC8) | Depois T2 |
| T4 KanbanColumn (AC2, AC5, AC8) | Paralelo T3 |
| T5 KanbanCard (AC3, AC5) | Paralelo T3-T4 |
| T6 Optimistic UI + Rollback (AC4) | Depois T3-T5 |
| T7 Filtros em modo Kanban (AC7) | Depois T2 |
| T8 Testes Vitest (AC10, AC12) | Em paralelo com T3-T7 |
| T9 Quality gates locais (AC11, AC12) | Antes de Ready for Review |
| T10 Story file maintenance — File List + Change Log v1.0 | Antes de Ready for Review |
| T11 Delegar push a `@devops *push` após quality gate `@dev` | Final |

### 5. Restrições críticas (não-negociáveis)

| # | Restrição | Trace |
|---|-----------|-------|
| 1 | **Hard-stop CR 2 iter** — Iter 3 só com aprovação Eurico explícita (precedente Story 2.3 Opção D) | `EPIC-2.md` §8 |
| 2 | **Separação A6** — Uma executor, `@dev` quality gate (não auto-validar) | `separation-of-roles.md` |
| 3 | **NÃO alterar `vitest.config.ts` thresholds globais** — apenas `coverage.include` allowlist | AC12 + `.claude/rules/not-tested-trailer-rules.md` |
| 4 | **NÃO criar `lib/tarefas/formatDueDate.ts`** — violaria consolidação Iter 1 da 2.3 | Story Dev Notes T1.4 |
| 5 | **NÃO acesso directo a `db.tasks.*`** — sempre via `setTaskStatus(id, novoStatus)` do repo | Story Anti-padrões |
| 6 | **Optimistic UI obrigatório + rollback em erro** — `setOverrides` antes do `setTaskStatus`; restaurar override em catch | AC4 |
| 7 | **PT-PT canónico** — "Por fazer", "Em curso", "Bloqueadas", "Feitas", "Atrasadas", "A mover", "Tarefa movida para", "Erro ao mover tarefa" | AC9 + `language-standards.md` |
| 8 | **Mock-protocol-fidelity N/A** — UI puro + Dexie via repos Story 2.1, sem SSE/MSW | `.claude/rules/mock-protocol-fidelity.md` |
| 9 | **Local CLI skip CodeRabbit** — CR corre via integração GitHub no PR | Story §CodeRabbit Integration |
| 10 | **Coverage ≥ 70% lines `app/(app)/tarefas/` + agregado ≥ 60%** | AC12 + NFR17 |

---

## Próxima acção concreta

```
@ux-design-expert *develop 2.4
```

Branch base: `main@3d97c212` (head pós-merge Story 2.3). Branch a criar: `feature/2.4-vista-kanban`.

Quality gate após implementação: `@dev *qa-gate 2.4` (Dex valida; separação A6).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-validated-ready-for-ux-design-expert.md`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA — coincide com pasta do projecto. CONSULTAR `.claude/rules/handoff-location.md` SE EM DÚVIDA.

---

## Estado dos artefactos

| Artefacto | Path | Estado |
|-----------|------|--------|
| Story 2.4 | `imersao-tools/nexus/docs/stories/2.4.story.md` | **Validated 9.0/10 GO** + amendment v0.2 (16/05). Change Log v0.2 documentado. |
| PO Validation 2.4 | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.4.md` | 26KB, validação completa Pax — não regredida pelo amendment. |
| Story 2.3 | `imersao-tools/nexus/docs/stories/completed/2.3.story.md` | Done MERGED 16/05 (PR #20 squash `667c1dac`). |
| EPIC-2 | `imersao-tools/nexus/docs/EPIC-2.md` | 3/10 Done — próximo: Story 2.4 implementação. |
| `@dnd-kit` deps | `imersao-tools/nexus/v2/package.json` | `@dnd-kit/core@^6.1.0` + `@dnd-kit/sortable@^8.0.0` instalados (Story 2.3 deixou pronto, não importou). |
| Branch | `feature/2.4-vista-kanban` | A criar a partir de `main@3d97c212`. |
| Vercel | `https://imersao.ia.expressia.pt` | LIVE com Story 2.3 mergeada (esta story adicionará Kanban activa pós-merge). |

---

## Handoffs relacionados (arquivados)

| Handoff | Para que serve agora |
|---------|----------------------|
| `archive/RETOMA-20260516-story-2.3-merged-next-2.4-kanban.md` | Handoff de Gage+Dex+Uma que River consumiu via amendment v0.2 (em vez de re-draft) |
| `archive/RETOMA-20260515-story-2.3-closed-ready-for-devops-push.md` | Estado pré-merge 2.3 — contexto histórico |
| `archive/RETOMA-20260512-epic-1-retrospective-complete.md` | 5 acções A1-A6 da retrospectiva Epic 1 (mock-protocol-fidelity, not-tested-trailer-rules, separation-of-roles) — todas já em vigor para Epic 2 |

---

## Cenários para Uma

**Cenário A — Implementação normal**
→ Sincronizar main + criar branch + ler story + implementar T1-T11. Hard-stop CR 2 iter.

**Cenário B — Quality gate `@dev` aponta gaps**
→ Uma absorve fixes na mesma branch; CR fix loop até max 2 iter. Iter 3+ requer aprovação Eurico (precedente Story 2.3).

**Cenário C — `@dnd-kit` versão diverge do esperado**
→ Confirmar T1.2 ANTES de implementar — se mismatch, alinhar com `npm install @dnd-kit/core@^6.1.0 @dnd-kit/sortable@^8.0.0`.

**Cenário D — Bug encontrado em produção Vercel relacionado com Story 2.3**
→ Pausar Story 2.4. Seguir SOP `docs/sops/hotfix-producao.md`. Retomar 2.4 após hotfix mergeado.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2 (subprojecto de `imersao-tools/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-validated-ready-for-ux-design-expert.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-validated-ready-for-ux-design-expert.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: 16/05/2026
