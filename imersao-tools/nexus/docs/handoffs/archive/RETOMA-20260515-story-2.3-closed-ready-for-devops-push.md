# RETOMA — Story 2.3 CLOSED (Pax → Gage)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**From:** Pax (`@po`) — Product Owner closure
**To:** Gage (`@devops`)
**Data:** 15/05/2026
**Story:** 2.3 — Vista lista de tarefas (com secção dedicada de atrasadas)
**Branch:** `feature/2.3-vista-lista` (local, **não pushed**)
**Commit local:** `7b0c201a` (3 commits ahead of `main@86ddb6a6` — inclui 2.2 + 2.2 closure + 2.3)
**Status story:** **Done (CLOSED 15/05/2026)**
**PO Veredicto:** **CLOSED** — DoD 14/14 PASS
**Próxima acção:** `@devops *push` (após push da 2.2 + merge + rebase desta branch)

---

## Resumo executivo

Story 2.3 fechada formalmente pela PO Pax após quality gate Dex PASS (0/2 qa-loop-fix consumidas, confiança alta). DoD 14/14 PASS com evidência directa: 12/12 ACs honrados, 4/4 [AUTO-DECISION] D1-D4 ratificadas pela implementação (zero desvios), 3/3 SFs aplicados ou verificados, 8/8 pontos focais Uma confirmados por Dex, 5/5 gates locais reproduzidos byte-a-byte (typecheck 0, lint OK, test:unit 418/418, build OK rota `/tarefas`, coverage paths 2.3 82-100%), trailers commit conformes, Constituição I-VI PASS, PT-PT canónico clean, separação A6 honrada rigorosamente. 4 Pontos de Atenção (PA1-PA4) ratificados como não-bloqueadores: PA1+PA2 (coverage UI maturity) → retrospectiva Epic 2; PA3 (useTags inline) → backlog Story 2.6; PA4 (tab arrow nav) → backlog Story 2.4. Story movida `stories/` → `stories/completed/` via `git mv`. `EPIC-2.md` actualizado (3/10 Done, §10 push sequencial 2.2 → 2.3, rodapé com lições L1-L5).

| Item | Estado |
|------|--------|
| Story file actualizada com `## PO Closure` + Change Log v0.5 | DONE |
| Story movida para `stories/completed/2.3.story.md` via `git mv` | DONE |
| `EPIC-2.md` actualizado (counter 3/10, 2.3 Done CLOSED, §10 sequência push, rodapé com lições + PAs) | DONE |
| Handoff de entrada `qa-PASS` arquivado (consumed por Pax) | TODO (próximo passo desta sessão) |
| Handoff de saída para `@devops` criado | DONE (este ficheiro) |
| `INDEX.md` actualizado (qa-PASS pending → archived, novo handoff em pending) | TODO (próximo passo desta sessão) |
| `docs/HANDOFF-INDEX.md` central actualizado | TODO (próximo passo desta sessão) |

---

## Acção concreta para `@devops`

**Sequência obrigatória** (push 2.2 → merge 2.2 → rebase 2.3 → push 2.3):

1. **Push da branch 2.2 primeiro** (consume handoff `RETOMA-20260515-story-2.2-closed-ready-for-devops-push.md` ainda em pending). `git push -u origin feature/2.2-migration-refactor` + abrir PR contra `main`.
2. **Aguardar CodeRabbit Iter 1** (max 2 iterações conforme `EPIC-2.md §8` hard-stop) e merge squash da 2.2.
3. **Rebase da branch 2.3 contra main actualizado:**
   ```bash
   git fetch origin
   git checkout feature/2.3-vista-lista
   git rebase origin/main
   # Resultado esperado: 3 commits ahead → 1 commit ahead (só 7b0c201a — equivalente após rebase)
   ```
4. **Push da branch 2.3 rebased:**
   ```bash
   git push -u origin feature/2.3-vista-lista
   ```
5. **Abrir PR** contra `main` com título e body sugeridos abaixo.
6. **Aguardar CodeRabbit Iter 1** (max 2 iterações conforme `EPIC-2.md §8` hard-stop).
7. **Merge** (squash preferred, padrão Stories 1.10/2.1/2.2) após CR PASS + Eurico aprovar.
8. **Criar handoff de saída** para `@sm *draft 2.4` (Vista Kanban) após merge.

### PR title sugerido (Conventional Commits, PT-PT)

```
feat(nexus-v2): Story 2.3 — vista lista de tarefas (UI Epic 2)
```

### PR body sugerido

```markdown
## Summary

Primeira UI do Epic 2. Página `/tarefas` com vista lista, secção dedicada de tarefas atrasadas (FR13), filtros (status/projecto/tag/prioridade) + pesquisa com debounce 200ms, consumindo APIs canónicas da Story 2.1 (`useTasks` / `useProjects` / `listTags` / `setTaskStatus` / `deleteTask`).

Entrega 6 componentes React, 2 helpers (`lib/tarefas/isOverdue.ts` + `hooks/useDebounced.ts`) e scaffold de header sticky com tabs Lista|Kanban|Calendário (Lista activa; Kanban/Calendário em placeholder disabled "Em construção · Story 2.X" — desbloqueia Stories 2.4 e 2.5 sem refactor cosmético).

4/4 [AUTO-DECISION] D1-D4 ratificadas pela @po e cumpridas:
- **D1:** sem drag-and-drop em list view (FR12 limita a Kanban/calendar)
- **D2:** tabs Kanban/Calendário disabled como placeholders Stories 2.4/2.5
- **D3:** overdue = `dueDate < startOfToday()` local (parser interpreta `YYYY-MM-DD` como local date, evita off-by-one em BST)
- **D4:** kebab "Editar" disabled (Apagar com `window.confirm` PT-PT)

3/3 Suggested Fixes aplicados ou verificados:
- **SF1** APLICADO — tooltips uniformizados "Em construção · Story 2.4" / "Em construção · Story 2.5"
- **SF2** VERIFICADO — magenta tint mantém AA com contrast efectivo ~14.8:1
- **SF3** APLICADO — test T8 desdobrado em T8a (confirm=true → delete chamado) + T8b (confirm=false → delete NÃO chamado)

## Evidence

- **Commit:** `7b0c201a` (após rebase contra main pós-merge 2.2)
- **Branch base:** `main` actualizado com 2.2 merged
- **File List autoritativa** (`git show --stat 7b0c201a`):
  - **11 novos:**
    - `imersao-tools/nexus/v2/app/(app)/tarefas/page.tsx` (287 linhas — orquestradora `'use client'`)
    - `imersao-tools/nexus/v2/components/tarefas/TasksHeader.tsx` (161 — header sticky + tabs)
    - `imersao-tools/nexus/v2/components/tarefas/OverdueSection.tsx` (165 — secção FR13)
    - `imersao-tools/nexus/v2/components/tarefas/TasksFilters.tsx` (177 — 4 selects + search)
    - `imersao-tools/nexus/v2/components/tarefas/TasksTable.tsx` (133 — tabela 8 cols)
    - `imersao-tools/nexus/v2/components/tarefas/TaskRow.tsx` (202 — linha memoizada)
    - `imersao-tools/nexus/v2/components/tarefas/TaskKebabMenu.tsx` (179 — kebab primitivo)
    - `imersao-tools/nexus/v2/lib/tarefas/isOverdue.ts` (68 — helper D3 puro)
    - `imersao-tools/nexus/v2/hooks/useDebounced.ts` (21 — hook genérico)
    - `imersao-tools/nexus/v2/tests/unit/app/tarefas/page.test.tsx` (324 — 11 cenários)
    - `imersao-tools/nexus/v2/tests/unit/lib/tarefas/isOverdue.test.ts` (80 — 9 cenários)
  - **3 modificados:**
    - `imersao-tools/nexus/v2/vitest.config.ts` (8 +/- — `coverage.include` expandido com 6 paths Story 2.3, precedente Story 1.9, thresholds globais 25% inalterados)
    - `imersao-tools/nexus/docs/EPIC-2.md` (2 +1)
    - `imersao-tools/nexus/docs/stories/2.3.story.md` (602 +)

## ACs (12/12 PASS)

| AC | Resultado | Trace |
|----|-----------|-------|
| AC1 | PASS | `app/(app)/tarefas/page.tsx:1` tem `'use client'`; build emite rota `/tarefas` 6.86 kB |
| AC2 | PASS | Header sticky `role="tablist"` + 3 tabs (Lista active, Kanban/Calendário disabled + tooltip) + botão Esc · Voltar |
| AC3 | PASS | Secção atrasadas ausente quando 0; até 5 visíveis + "Mostrar todas" |
| AC4 | PASS | 4 selects + input search com debounce 200ms; server-side via `useTasks`, client-side via `useMemo` |
| AC5 | PASS | Tabela 8 cols; `TaskRow` memoizado; tinting magenta overdue; kebab primitivo zero-dep |
| AC6 | PASS | Zero `db.*` directos em paths 2.3 (`grep` clean) — apenas APIs Story 2.1 |
| AC7 | PASS | Skeleton 5 linhas `aria-busy` + Empty contextual + botão "+ Nova" disabled |
| AC8 | PASS | ARIA labels PT-PT, `tablist`/`tab`/`aria-selected`/`aria-disabled`, `scope="col"`, focus visible, Escape handler com cleanup |
| AC9 | PASS | Termos canónicos PT-PT (`grep` clean PT-BR slip-ups) |
| AC10 | PASS | 20 testes novos (11 page + 9 isOverdue) — todos honestos, DB real via `fake-indexeddb` |
| AC11 | PASS | 4/4 gates locais reproduzidos byte-a-byte por Dex |
| AC12 | PASS | Coverage paths 2.3: 82-100% lines (>= AC12 70%); thresholds globais 25% inalterados |

## QA Gate (Dex `@dev`)

- **Veredicto:** PASS (0/2 qa-loop-fix consumidas, confiança alta)
- **Separação de papéis:** Uma executou commit `7b0c201a` integral; Dex fez gate sem tocar ficheiros de produção da 2.3 (A6 conforme)
- **Gates locais reproduzidos:** typecheck 0, lint OK (1 warn pré-existente `NextResponse` fora-scope), test:unit **418/418** (398 pré + 20 novos), build OK rota `/tarefas`, coverage paths 2.3 82-100%
- **8/8 pontos focais Uma confirmados** (hook usage estável, repo isolation, A11y tablist, D3 parser local, D4 kebab, SF2 contraste, trailers commit, File List autoritativa)
- **4 PAs registados como não-bloqueadores** — ratificados pela PO

## PO Closure (Pax)

- **DoD:** 14/14 PASS com evidência directa por item
- **4 [AUTO-DECISION] ratificadas:** D1 (sem drag) / D2 (tabs placeholder) / D3 (overdue local date) / D4 (kebab Editar disabled). Zero desvios. Zero alterações de scope.
- **5 lições registadas para retrospectiva Epic 2:** L1 parser local-date pattern, L2 kebab menu primitivo ARIA, L3 allowlist vitest.config precedente, L4 useTasks options estáveis, L5 UI testing maturity gap em jsdom
- **Veredicto final:** CLOSED

## Test plan

- [ ] CI verde (lint + typecheck + test:unit + build) em `nexus-v2-ci.yml`
- [ ] CodeRabbit Iter 1 PASS ou Iter 2 (hard-stop conforme `EPIC-2.md §8`)
- [ ] Manual smoke test pós-merge: navegar `/tarefas` na app deployada Vercel, verificar consola sem erros
- [ ] Manual UX validation: filtros + pesquisa + atrasadas + checkbox + kebab Apagar (com confirm) funcionam end-to-end com dados reais Dexie
- [ ] Verificar que tabs Kanban/Calendário aparecem disabled com tooltip "Em construção"
- [ ] Vercel deploy production SUCCESS após merge

## Lições para retrospectiva Epic 2

1. **L1 — Parser local-date** (D3 extension) — `isOverdue.ts:38-45` interpreta `YYYY-MM-DD` como local date, não UTC midnight. Aplicável a calendário 2.5, journal 5.5, hábitos 4.x, metas 4.x, lembretes 4.x
2. **L2 — Kebab menu primitivo zero-dep** — `TaskKebabMenu.tsx` com ARIA completo, click-outside + Escape cleanup. Padrão reutilizável Stories 2.6 (tags), 2.8 (projects), 5.x (journal), 6.x (notes) — evita `@radix-ui` em deps
3. **L3 — Allowlist `vitest.config.ts coverage.include`** (precedente Story 1.9) — adicionar paths à allowlist sem alterar thresholds globais mantém observabilidade do report
4. **L4 — "useTasks options estáveis"** — passar primitivas (não objectos recriados) para hooks `useLiveQuery`. Padrão crítico para 2.4 Kanban, 2.5 Calendar, 2.9 vista projecto, 5.x journal
5. **L5 — UI testing maturity gap em jsdom** — hover/focus/visual states difíceis de testar. Identificar oportunidades para Playwright E2E em stories futuras

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-closed-ready-for-devops-push.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Estado da branch (verificado por Pax)

| Item | Valor |
|------|-------|
| Branch | `feature/2.3-vista-lista` |
| Tip | `7b0c201a` (local) |
| Ahead of `main` | 3 commits (`dd6dc0d8` 2.2 + `ff86773c` 2.2 closure + `7b0c201a` 2.3) |
| Behind `main` | 0 commits |
| Origem da branch | Criada a partir de `feature/2.2-migration-refactor` antes do push da 2.2 |
| Working tree (durante closure) | Alterações de PO closure pendentes: story move + EPIC-2 + story content + handoffs + INDEX.md — serão commitadas por `@devops` ou em commit separado pré-push (padrão Story 2.2 closure) |

> **Trace pós-merge 2.2:** quando a 2.2 for squash-mergeada em main, `@devops` deve rebase desta branch contra `origin/main` actualizado. O squash da 2.2 reduz `dd6dc0d8` + `ff86773c` a 1 único commit em main. Após rebase, esta branch fica com apenas `7b0c201a` (ou equivalente após rebase) ahead.

---

## Verificações de DoD efectuadas pela PO (sumário)

| # | Check | Resultado |
|---|-------|-----------|
| 1 | Status story `Done` | PASS |
| 2 | QA Results completa | PASS (linhas 605-700) |
| 3 | File List bate com `git show --stat 7b0c201a` (14 ficheiros: 11 novos + 3 modificados) | PASS |
| 4 | Tasks T1-T9 `[x]`, T10 `[ ]` (push delegado) | PASS |
| 5 | 12/12 ACs com evidência directa | PASS |
| 6 | 4/4 [AUTO-DECISION] D1-D4 honradas | PASS |
| 7 | 3/3 SFs aplicados ou verificados | PASS |
| 8 | 8/8 pontos focais Uma confirmados por Dex | PASS |
| 9 | 5/5 gates locais reproduzidos byte-a-byte | PASS |
| 10 | Coverage paths 2.3 ≥ 70% (AC12) | PASS |
| 11 | Trailers commit conformes (Constraint/Rejected/Confidence/Scope-risk/Directive) | PASS |
| 12 | Constituição AIOX I-VI | PASS |
| 13 | PT-PT canónico clean | PASS |
| 14 | Separação A6 honrada (executor != quality_gate) | PASS |

**14/14 PASS. Zero blockers. Zero waivers. Closure imediata aprovada.**

---

## Decisão dos 4 PAs (Pontos de Atenção)

| # | Ponto | Severidade | Owner ratificado |
|---|-------|-----------|-------------------|
| PA1 | Coverage `page.tsx` 82.12% (skeleton/empty visual states) | Baixa | Retrospectiva Epic 2 (tema "UI testing maturity") |
| PA2 | `components/tarefas/*` functions 55.17% (hover handlers em jsdom) | Baixa | Retrospectiva Epic 2 (mesmo tema) |
| PA3 | Hook `useTags` inline em vez de extraído | Baixa | Backlog Story 2.6 (sistema tags global) |
| PA4 | Tab strip não suporta arrow key navigation | Baixa-Média | Backlog Story 2.4 (Vista Kanban — primeira a activar tab adicional) |

**Nenhum bloqueia push ou merge. 2 → retrospectiva, 2 → stories de backlog.**

---

## Artefactos actualizados/criados nesta sessão (Pax)

- **Movido:** `imersao-tools/nexus/docs/stories/2.3.story.md` → `imersao-tools/nexus/docs/stories/completed/2.3.story.md` via `git mv` (padrão Stories 2.1 + 2.2)
- **Modificado:** `imersao-tools/nexus/docs/stories/completed/2.3.story.md` — Change Log v0.5 (PO Closure), secção `## PO Closure` completa (DoD 14/14, ratificação 4 [AUTO-DECISION], decisão 4 PAs, 5 lições retrospectiva, veredicto CLOSED), typo "Ficheiros novos (10):" → "(11):" corrigido
- **Modificado:** `imersao-tools/nexus/docs/EPIC-2.md` — header `3/10 Done`, tabela §5 (2.3 `Done CLOSED 15/05` aguarda push), §5 progresso, §10 sequência push 2.2 → rebase → 2.3, rodapé com lições L1-L5 e ratificação PAs
- **Criado:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-closed-ready-for-devops-push.md` (este ficheiro)
- **Arquivar (próximo passo desta sessão):** `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-qa-PASS.md` → `archive/` (consumed por Pax)
- **Arquivar (próximo passo desta sessão):** `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-cross-terminal-2.3-done-aguarda-po-close.md` → `archive/` (consumed — guiou Terminal B até `*close-story 2.3`)
- **Modificar (próximo passo desta sessão):** `imersao-tools/nexus/docs/handoffs/INDEX.md` — remover qa-PASS + cross-terminal de pending, adicionar este handoff em pending, ambos em archived
- **Modificar (próximo passo desta sessão):** `docs/HANDOFF-INDEX.md` central — substituir entrada Nexus v2 obsoleta por entrada apontando para este handoff

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-closed-ready-for-devops-push.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Pax (`@po`)
DATA: 15/05/2026

---

## Próxima acção

`@devops *push` da branch `feature/2.3-vista-lista` (após push + merge da 2.2 em main + rebase desta branch contra main actualizado). PR contra `main` com título e body sugeridos acima. Após merge → Epic 2 fica 3/10 Done em main; `@sm *draft 2.4` (Vista Kanban) desbloqueado.

**Sequência projectada:**

```
@devops *push (feature/2.2-migration-refactor)
  → CR Iter 1 (max 2 iter EPIC-2.md §8)
  → Merge squash 2.2 → main
@devops rebase feature/2.3-vista-lista contra origin/main
@devops *push (feature/2.3-vista-lista)
  → CR Iter 1 (max 2 iter)
  → Merge squash 2.3 → main
  → Epic 2 3/10 Done em main
  → @sm *draft 2.4 (Vista Kanban)
```

— Pax, equilibrando prioridades 🎯
