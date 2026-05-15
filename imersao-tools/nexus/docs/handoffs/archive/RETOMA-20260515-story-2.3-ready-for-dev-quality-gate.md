# RETOMA — Story 2.3 READY FOR REVIEW (Uma → Dex)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**From:** Uma (`@ux-design-expert`) — `*develop 2.3` completo
**To:** Dex (`@dev`) — quality gate
**Data:** 15/05/2026
**Story:** 2.3 — Vista lista de tarefas (com secção dedicada de atrasadas)
**Branch:** `feature/2.3-vista-lista` (local, **não pushed**)
**Commit local:** `7b0c201a` (3 ahead of `main@86ddb6a6` — inclui `dd6dc0d8` da 2.2 + `ff86773c` closure + `7b0c201a` da 2.3)
**Status story:** **Ready for Review**
**Quality gates locais:** **5/5 PASS** (lint + typecheck + test:unit 418/418 + build + coverage paths 2.3 ≥70%)
**Próxima acção:** `@dev *qa-gate 2.3` — Dex valida implementação técnica conforme separation-of-roles A6

---

## Resumo executivo

Story 2.3 implementada por Uma em iteração única com 1 fix loop curto (2 testes corrigidos em Iter 2: parser de YYYY-MM-DD como local date para evitar off-by-one em BST, + query de texto trocada por role-based). Todos os 12 ACs honrados, 4/4 [AUTO-DECISION] D1-D4 cumpridas. SF1+SF3 aplicados inline; SF2 verificado por design tokens. 5/5 gates locais PASS à segunda tentativa (após Iter 2 dos testes).

Decisão de implementação digna de menção: `vitest.config.ts` `coverage.include` expandida com 6 paths Story 2.3 — precedente Story 1.9 (que adicionou paths similares com comentário `// Story 1.9 — UI consumer`). Thresholds globais 25% inalterados. Esta decisão respeita AC12 lido com precisão ("NÃO alterar o **threshold global**") e o anti-padrão genérico fica fora de âmbito (adicionar paths à allowlist é coerente com a intenção de medir cobertura).

---

## Acção concreta para `@dev` Dex

1. **Ler** a story file `imersao-tools/nexus/docs/stories/2.3.story.md` (Ready for Review v0.3) — secções §Acceptance Criteria, §Dev Agent Record, §File List, §Change Log
2. **Reproduzir gates locais** em `imersao-tools/nexus/v2/`:
   ```bash
   npm run typecheck    # exit 0 esperado
   npm run lint         # 1 warn pré-existente NextResponse fora-scope
   npm run test:unit    # 418/418 PASS esperado
   npm run build        # rota /tarefas 6.86 kB esperado
   npm run test:coverage  # paths 2.3: 82-100% lines
   ```
3. **Validar 12 ACs** directamente em código (commit `7b0c201a`):
   - AC1: `app/(app)/tarefas/page.tsx` existe com `'use client'`
   - AC2: header sticky com 3 tabs (Lista activa, Kanban/Calendar disabled + tooltip + aria-disabled), botão Esc—Voltar
   - AC3: secção atrasadas só renderiza quando `length > 0`, max 5 visíveis + "Mostrar todas" se >5
   - AC4: 4 selects + input search com debounce 200ms; status/projectId/tag passam para useTasks; priority/search/overdue client-side
   - AC5: tabela 8 colunas conforme spec linha 457; tinting magenta linha overdue; kebab menu primitivo
   - AC6: zero `db.tasks.*` / `db.projects.*` / `db.tags.*` directos (verificar com grep)
   - AC7: skeleton 5 linhas pulsantes + empty state com "+ Nova" disabled
   - AC8: ARIA labels em todos os interactivos (tablist, tabs, selects, search, checkbox, kebab, menuitem); Escape executa router.back
   - AC9: PT-PT canónico — "Tarefas", "Atrasadas", "Por fazer", "Em curso", "Bloqueadas", "Feitas", "Apagar", "Pesquisar", "Projecto", "Prioridade"
   - AC10: 11 cenários page.test.tsx + 9 cenários isOverdue.test.ts = 20 testes novos PASS
   - AC11: 4 gates locais PASS
   - AC12: coverage paths 2.3 ≥70% lines (82.12% page, 92.01% components, 100% lib/hooks)
4. **Validar 4 [AUTO-DECISION]** cumpridas (referência tabela §Dev Agent Record / §Conformidade)
5. **Decidir veredicto:**
   - **PASS** → Story `Ready for Review → Done`, criar handoff dev → po `*close-story 2.3`
   - **CONCERNS** → registar pontos de atenção em QA Results, manter `Ready for Review`, escalar a `@po`
   - **FAIL** → criar handoff dev → ux-design-expert para fix loop (max 2 iterações conforme EPIC-2 §8)

---

## Pontos focais de verificação (sugestão Uma → Dex)

| # | Item | Onde verificar |
|---|------|----------------|
| 1 | Hook usage estável (AR1) | `app/(app)/tarefas/page.tsx` linhas 39-50: useTasks recebe primitivas (`statusFilter`, `projectFilter`, `tagFilter`); deps internas memoizadas |
| 2 | Repo isolation (AC6) | `grep -rn "db\.tasks\." app/\(app\)/tarefas components/tarefas` deve devolver 0 matches; `db.projects.*`/`db.tags.*` idem (excepto `db.tags` via repo `listTags`) |
| 3 | A11y tablist (AC8) | `components/tarefas/TasksHeader.tsx` linhas 60-92: `role="tablist"` + 3 `role="tab"` + `aria-selected` + `aria-disabled` |
| 4 | D3 overdue parser local date | `lib/tarefas/isOverdue.ts` linhas 23-36: `parseDueDateMs` interpreta `YYYY-MM-DD` como local; test cenários hoje/ontem/amanhã/done/null/inválido em isOverdue.test.ts |
| 5 | D4 kebab Editar disabled | `components/tarefas/TaskKebabMenu.tsx` linhas 96-127: `aria-disabled="true"`, `console.warn` em vez de modal, NÃO chama nenhum hook de edição |
| 6 | SF2 contraste magenta-tint | `components/tarefas/TaskRow.tsx` linha 75: `background: 'rgba(255, 0, 110, 0.05)'` — 5% opacidade sobre `#04040A` mantém AA do `#F0F4FF` |
| 7 | Trailers do commit | `git log -1 7b0c201a` deve conter Constraint/Rejected/Confidence/Scope-risk/Directive; `Not-tested:` correctamente omitido (sem paths bloqueadores) |
| 8 | File List autoritativa | `git show --stat 7b0c201a` deve mostrar 14 files changed (11 novos + 3 modificados) coincidindo com File List em Dev Agent Record |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-ready-for-dev-quality-gate.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Estado da branch (verificado por Uma)

| Item | Valor |
|------|-------|
| Branch | `feature/2.3-vista-lista` |
| Base | `feature/2.2-migration-refactor` (esta branch criada a partir daí — 2.2 ainda não pushed/merged) |
| Tip local | `7b0c201a` |
| Ahead of `main` | 3 commits (`dd6dc0d8` 2.2 work + `ff86773c` 2.2 closure docs + `7b0c201a` 2.3) |
| Working tree (durante develop) | Clean para ficheiros 2.3; ruído pré-existente em outros paths ignorado (conforme handoff entrada) |
| Pushed para origin | NÃO — `@devops` push é por design fora-de-scope desta story (delegado a `@dev *qa-gate` → `@po *close-story` → `@devops *push`) |

> **Trace para Dex:** o commit 2.3 (`7b0c201a`) é independente do commit 2.2 (`dd6dc0d8`). Quando 2.2 for mergeada em main (squash via PR pelo @devops), esta branch pode ser rebased contra main e o commit 2.2 desaparece da diff (já está em main). O commit 2.3 (`7b0c201a`) permanece como único ahead.

---

## Resultados gates locais (reprodutíveis por Dex)

| Gate | Comando | Resultado |
|------|---------|-----------|
| Lint | `npm run lint` | PASS — 1 warning pré-existente `NextResponse unused` em `app/api/auth/logout/route.ts` (fora-scope, herdado) |
| Typecheck | `npm run typecheck` | exit 0 |
| Test unit | `npm run test:unit` | **418/418 PASS** (35 files: 398 pré-existentes + 20 novos Story 2.3) |
| Build | `npm run build` | exit 0 — 12 rotas + 1 nova `/tarefas` (6.86 kB, First Load 153 kB) |
| Coverage | `npm run test:coverage` | All files **88.96%** lines; paths 2.3 específicos: `app/(app)/tarefas` 82.12%, `components/tarefas/*` 92.01%, `lib/tarefas/*` 100%, `hooks/useDebounced.ts` 100%, `hooks/useProjects.ts` 100%, `hooks/useTasks.ts` 100%. Threshold global 25% — PASS. AC12 ≥70% paths 2.3 — PASS. |

---

## Decisões de implementação documentadas (resumo)

| # | Decisão | Local | Justificação |
|---|---------|-------|--------------|
| 1 | Parser `parseDueDateMs` interpreta `YYYY-MM-DD` como local date (não UTC) | `lib/tarefas/isOverdue.ts` linhas 23-36 | Operacionalmente correcto: "due date" é dia inteiro do calendário do utilizador, não momento UTC. Evita off-by-one em timezones com offset (Portugal BST = +1h). Resolveu bug encontrado no Iter 1 dos testes. |
| 2 | Adicionar 6 paths Story 2.3 à `coverage.include` allowlist de `vitest.config.ts` | `vitest.config.ts` linhas 37-42 | Precedente Story 1.9 que já fez o mesmo. Threshold global 25% inalterado. AC12 lê "NÃO alterar o **threshold global**" — adicionar paths à allowlist é coerente com a intenção (medir cobertura dos ficheiros novos). |
| 3 | Hook `useTags` NÃO criado nesta story | `tarefas/page.tsx` linha 51 (inline `useLiveQuery(() => listTags())`) | T3.4 explícita: criação opcional, não-bloqueador. AR2 reformulado por River no F1 cobre exactamente este trade-off. Hook pode ser extraído em Story 2.6 (sistema tags global). |
| 4 | Kebab menu primitivo (sem radix-ui) | `components/tarefas/TaskKebabMenu.tsx` | `@radix-ui/react-dropdown-menu` não em deps; handoff de entrada confirmou via `package.json`. Primitivo `button + ul absoluto` com click-outside + Escape handlers cobre 100% requisitos da AC5 col 8. |
| 5 | Loading skeleton inline (não componente extraído) | `tarefas/page.tsx` linhas 197-235 | Componente pequeno (~40 LOC), uso 1x, extracção introduziria overhead sem benefício de reutilização nesta story. Pode ser extraído quando outras vistas (2.4/2.5) precisarem do mesmo padrão. |

---

## Suggested Fixes (estado pós-develop)

| SF | Estado | Como aplicado |
|----|--------|---------------|
| **SF1** | APLICADO INLINE | Tooltips uniformizados em `TasksHeader.tsx` linhas 86, 91: "Em construção · Story 2.4" / "Em construção · Story 2.5" (não "Disponível na Story 2.X") |
| **SF2** | VERIFICADO | Magenta `#FF006E` em 5% opacidade sobre `#04040A` mantém contrast ratio 15.6:1 do texto `#F0F4FF` (acima de AAA 7:1, muito acima de AA 4.5:1). Aprovado sem ajuste de cor. |
| **SF3** | APLICADO INLINE | Test T8 desdobrado em T8a (`confirm=true → delete chamado`) + T8b (`confirm=false → delete NÃO chamado`) em `tests/unit/app/tarefas/page.test.tsx` |

---

## Aderência a regras AIOX (auto-check Uma)

| Regra | Aderência |
|-------|-----------|
| `handoff-location.md` | PASS — 3 blocos obrigatórios presentes (início/meio/fim) |
| `separation-of-roles.md` A6 | PASS — Uma (executor) ≠ Dex (quality gate); Uma NÃO faz qa-gate |
| `not-tested-trailer-rules.md` A3 | PASS — commit `7b0c201a` toca apenas paths não-bloqueadores (`app/`, `components/`, `lib/`, `hooks/`, `tests/`, story file, EPIC-2, vitest.config.ts — este último é config mas a alteração é só `include` allowlist, não threshold). `Not-tested:` correctamente omitido nos trailers |
| `mock-protocol-fidelity.md` A1 | PASS — N/A (sem mocks de protocolos externos; mock `next/navigation` é mock de framework, não de protocolo SSE/HTTP) |
| Constitution Artigo I (CLI First) | PASS — toda implementação via comando `*develop 2.3` |
| Constitution Artigo III (Story-Driven) | PASS — Status `Approved` v0.2 antes de develop arrancar |
| Constitution Artigo IV (No Invention) | PASS — 4/4 [AUTO-DECISION] cumpridas, zero campos novos em tipos, scope literal aos FRs |
| Constitution Artigo V (Quality First) | PASS — 5/5 gates locais PASS antes de Ready for Review |
| Constitution Artigo VI (Absolute Imports) | PASS — todos os imports via `@/` alias |
| Design system | PASS — apenas cores/tipografia das 5 cores e 2 fontes da regra; glassmorphism `rgba(255,255,255,0.025)` + border subtle aplicado consistentemente; `border-radius` 8-20px nunca duros |
| Language Standards PT-PT | PASS — zero PT-BR slip-ups verificado por AC9 (test T10 valida ARIA labels canónicos) |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-ready-for-dev-quality-gate.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Uma (`@ux-design-expert`)
DATA: 15/05/2026

---

## Artefactos criados/modificados por Uma nesta sessão

**Novos (11 ficheiros):**
- `imersao-tools/nexus/v2/app/(app)/tarefas/page.tsx`
- `imersao-tools/nexus/v2/components/tarefas/{TasksHeader, OverdueSection, TasksFilters, TasksTable, TaskRow, TaskKebabMenu}.tsx`
- `imersao-tools/nexus/v2/hooks/useDebounced.ts`
- `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts`
- `imersao-tools/nexus/v2/tests/unit/app/tarefas/page.test.tsx`
- `imersao-tools/nexus/v2/tests/unit/lib/tarefas/isOverdue.test.ts`
- `imersao-tools/nexus/docs/stories/2.3.story.md` (criado em sessão anterior por River — mantido)

**Modificados (3 ficheiros):**
- `imersao-tools/nexus/v2/vitest.config.ts` (allowlist `coverage.include` expandida)
- `imersao-tools/nexus/docs/stories/2.3.story.md` (tasks `[x]`, Status `Approved → Ready for Review`, Change Log v0.3, Dev Agent Record completo)
- `imersao-tools/nexus/docs/EPIC-2.md` (Story 2.3: `Approved` → `Ready for Review`)

**A modificar pela Uma nesta sessão (antes de exit):**
- `imersao-tools/nexus/docs/handoffs/INDEX.md` — arquivar handoff Approved + adicionar este em pending

**Commit local:** `7b0c201a` em `feature/2.3-vista-lista`. 14 files changed, +2408/-1 linhas.

---

## Próxima acção

`@dev *qa-gate 2.3` — Dex executa quality gate em iteração única (ou máximo 2 conforme EPIC-2 §8 hard-stop). Veredicto PASS/CONCERNS/FAIL/WAIVED com fundamentação em código.

**Sequência projectada após qa-gate PASS:**

```
@dev *qa-gate 2.3 (este handoff destina-se a esta acção)
  → @po *close-story 2.3 (DoD checklist + ratificações)
  → @devops *push (branch feature/2.3-vista-lista + PR vs main)
  → CodeRabbit Iter 1 (hard-stop 2 iterações EPIC-2 §8)
  → Merge squash → main
```
