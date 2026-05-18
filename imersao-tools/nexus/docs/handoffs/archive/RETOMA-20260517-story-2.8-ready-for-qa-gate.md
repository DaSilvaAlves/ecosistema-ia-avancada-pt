# RETOMA — Story 2.8 (CRUD projectos) Ready for Review — aguarda QA Gate

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 2026-05-17
**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 2 — Tarefas v2 + Projectos (5/10 Done em main + 2.8 ready local)
**Story activa:** 2.8 — CRUD projectos
**Ficheiro story:** `imersao-tools/nexus/docs/stories/2.8.story.md`
**Branch local:** `feature/2.8-crud-projectos`
**Commit local:** `7d956d9d` (não pushed)
**Próximo agente:** `@qa` (Quinn) — separação A6 (executor Dex ≠ quality gate Quinn)
**Próximo comando:** `@qa *qa-gate 2.8` ou `@qa *review 2.8`

---

## 1. Estado actual — TL;DR

A Story 2.8 (CRUD projectos UI) foi implementada localmente em 1ª iteração YOLO pelo Dex (`@dev`). Todos os quality gates locais passam. Aguarda QA gate do Quinn (`@qa`).

- ✅ Implementação 1ª iteração YOLO — 13/13 testes próprios + 511/511 full suite
- ✅ Quality gates locais TODOS PASS: typecheck, lint, test:unit, build, coverage
- ✅ CodeRabbit pre-commit: 0 findings em código Story 2.8 (todos os 13 findings em ficheiros UNTRACKED fora-de-scope)
- ✅ Commit local `7d956d9d` (9 ficheiros, +2897 lines)
- ⏳ Aguarda QA Gate: `@qa *qa-gate 2.8` (Quinn)
- ⏳ Aguarda push: `@devops *push feature/2.8-crud-projectos` (Gage, EXCLUSIVO)
- ⏳ Aguarda closure: `@po *close-story 2.8` (Pax) + registar débito D6

---

## 2. Padrão consolidado Epic 1+2

**9 stories consecutivas QA Gate PASS à primeira** pós-PO Validation GO:
- 1.5 → 1.6 → 1.7 → 1.8 → 1.9 → 2.1 → 2.3 → 2.4 → 2.5
- Waiver rate Epic 2: **0%** (alvo <20%)
- Story 2.8 é a 10ª a tentar manter este padrão

---

## 3. Audit trail completo (Story 2.8)

| Etapa | Agente | Data | Resultado | Artefacto |
|-------|--------|------|-----------|-----------|
| Draft | River (`@sm`) | 2026-05-17 | v0.1 — 708 linhas, 13 ACs, 12 [AUTO-DECISION], 11 tasks | `docs/stories/2.8.story.md` |
| PO Validation | Pax (`@po`) | 2026-05-17 | **GO 10/10** Confidence High | `docs/PO-VALIDATION-STORY-2.8.md` |
| Implementação | Dex (`@dev`) | 2026-05-17 ~18:50Z | YOLO 1ª iter PASS — commit `7d956d9d` | 6 ficheiros novos + 1 modificado |
| **QA Gate** | **Quinn (`@qa`)** | **PENDENTE** | — | — |
| Push + PR | Gage (`@devops`) | PENDENTE | — | — |
| Closure | Pax (`@po`) | PENDENTE | — | — |

---

## 4. Como retomar em novo terminal (cross-terminal protocol)

### Passo 1 — Verificar estado git

```bash
cd "C:/Users/XPS/Documents/ecosistema-ia-avancada-pt/imersao-tools/nexus"
git status                    # branch actual deve ser feature/2.8-crud-projectos
git log --oneline -5          # commit 7d956d9d no topo
git branch --show-current     # confirmar branch
```

**Se NÃO estiveres na branch `feature/2.8-crud-projectos`:**
```bash
git checkout feature/2.8-crud-projectos
```

**Se a branch não existir localmente (terminal totalmente novo):**
- A branch existe apenas localmente neste terminal (ainda não pushed)
- O commit `7d956d9d` SÓ existe neste terminal
- **PARAR e usar o terminal original** para fazer o QA gate e push, OU
- Continuar em terminal novo APÓS push (passar para Quinn no terminal original primeiro)

### Passo 2 — Activar Quinn e fazer QA gate

```
@qa *qa-gate 2.8
```

ou equivalente `@qa *review 2.8`

Quinn vai:
1. Re-verificar gates locais independentemente (typecheck, lint, test:unit, build, coverage)
2. Code audit contra ACs (AC1-AC13)
3. Anti-hallucination — verificar que claims na story batem com implementação
4. A11y spot-check manual em browser (CRITICAL — focus trap modal: Tab/Shift+Tab loop em Chrome/Edge real)
5. Verificar repo isolation (zero `db.projects.*` directos)
6. Verificar PT-PT consistente
7. Emitir veredicto: PASS / CONCERNS / FAIL / WAIVED
8. Criar `docs/QA-GATE-STORY-2.8.md`

### Passo 3 — Se QA Gate PASS, delegar push a Gage

```
@devops *push feature/2.8-crud-projectos
```

Gage vai:
1. Pre-push CodeRabbit `--base main` (server-side review esperado)
2. `git push -u origin feature/2.8-crud-projectos`
3. `gh pr create -R DaSilvaAlves/ecosistema-ia-avancada-pt` (precedente PR #22)
4. Monitorizar CI checks (Lint, Vitest, Playwright, 50-prompt regression, Coverage, CodeQL ×2, CodeRabbit, Vercel)
5. Após verdes: `gh pr merge --squash --delete-branch`

### Passo 4 — Closure

```
@po *close-story 2.8
```

Pax vai:
1. Marcar story `Status: Done`
2. Mover `docs/stories/2.8.story.md` → `docs/stories/completed/2.8.story.md`
3. Actualizar EPIC-2.md §1 + §5 + §10 (5/10 → 6/10 Done)
4. **Registar débito D6** no EPIC-2 §10: "Delete projecto com cascata `Task.projectId` — decisão de produto (set null / bloquear / soft-delete). Origem: Story 2.8 A5 (delete fora-de-scope). Prioridade: Média."
5. Commit closure `docs(nexus-v2): close Story 2.8 — MERGED em main via PR #N squash <hash> (Epic 2 6/10 Done)`
6. Sugerir próxima: `@sm *draft 2.6` (tags) ou `@sm *draft 2.7` (recorrência) — independentes

---

## 5. Contexto técnico essencial (não re-explicar)

### O que a Story 2.8 entrega

Camada UI completa para CRUD de projectos sobre infra de dados já pronta desde Story 2.1:

**Ficheiros novos (6):**
- `v2/app/(app)/projectos/page.tsx` — orchestrator + state + handlers + Escape global
- `v2/components/projectos/ProjectsHeader.tsx` — sticky header + tab strip (Activos/Pausados/Concluídos/Todos) + "+ Novo" + "Esc·Voltar"
- `v2/components/projectos/ProjectsGrid.tsx` — CSS Grid `repeat(auto-fill, minmax(280px, 1fr))` + skeleton 6 cards + empty states (zero-total vs filtro-vazio)
- `v2/components/projectos/ProjectCard.tsx` — atom com accent stripe + name/desc/badge/dates/counts + kebab menu inline WAI-ARIA
- `v2/components/projectos/ProjectFormModal.tsx` — modal centrado + 5 campos + Zod validation + focus trap WAI-ARIA Modal
- `v2/tests/unit/app/projectos/page.test.tsx` — 13 testes T1-T12 + T12b

**Ficheiros modificados (1):**
- `v2/vitest.config.ts` — adicionados paths `app/(app)/projectos/**` + `components/projectos/**` à allowlist de coverage (precedente Story 2.3 — apenas reporting, sem alteração comportamental)

### Acções por card (4)

- Editar — abre modal pre-preenchido
- Arquivar — `archiveProject(id)` (status → `'paused'`)
- Reactivar — `updateProject(id, {status: 'active'})` (apenas se status `'paused'`)
- Marcar como concluído — `updateProject(id, {status: 'done'})`

**Delete fora-de-scope (A5)** — cascata `Task.projectId` requer decisão de produto (registar como D6 no closure).

### Repo isolation

Zero `db.projects.*` ou `db.tasks.*` directos em código componente. Apenas:
- `createProject`, `updateProject`, `archiveProject` do repo `lib/db/repos/projects.ts` (Story 2.1)
- `useProjects()` hook reactivo (Story 2.1)
- `useTasks()` hook para contadores client-side group by (Story 2.1)

### A11y crítico

**Modal WAI-ARIA Authoring Practices full:**
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby="projects-modal-title"`
- Focus trap: primeiro `<input>` focado no mount; `Tab`/`Shift+Tab` ciclam dentro do modal via `getFocusables()` dynamic query
- `Escape` fecha (handler global no modal)
- Click overlay fecha
- Restaurar foco no opener (`document.activeElement` salvo em `openerEl` state antes de abrir; `setTimeout(() => openerEl.focus(), 0)` ao fechar)

**Page Escape vs Modal Escape — guard `modal === null`:** `page.tsx` tem listener global `Escape → router.back()` MAS condicionalmente — só dispara se modal estiver fechado. Evita double-fire.

### Discovery durante implementação

- **ProjectSchema** real em linhas 55-63 (story v0.1 dizia 55-65). Offset minor, conteúdo idêntico. Não afecta implementação.
- **`vitest.config.ts` precisou de actualização** (paths novos à allowlist coverage). Análoga à Story 2.3 (mesmo padrão para `tarefas/**`). Sem alteração comportamental. Evidência local: `test:coverage` corre normalmente e os novos paths aparecem no relatório (73.71% / 91.76%).

---

## 6. Coverage Story 2.8 (verificado localmente)

| Target | Threshold | Actual | Status |
|--------|-----------|--------|--------|
| `app/(app)/projectos/page.tsx` lines | ≥ 70% (AC13) | **73.71%** | ✓ |
| `components/projectos/` lines agregado | implícito | **91.76%** | ✓ |
| `ProjectsGrid.tsx` lines | implícito | **100%** | ✓ |
| `ProjectCard.tsx` lines | implícito | **89%** | ✓ |
| All-files lines agregado | ≥ 60% (NFR17) | **87.99%** | ✓ |

---

## 7. Not-Tested honesto (a flagar no QA Gate)

**Manual spot-check obrigatório em browser real (Chrome/Edge):**

JSDOM tem limitações conhecidas para focus/blur events. Os testes Vitest T11 cobrem **smoke**:
- `role="dialog"` presente
- `aria-modal="true"` presente
- `aria-labelledby` presente
- Foco em input "Nome" ao abrir modal
- Escape fecha modal

**MAS NÃO cobrem em JSDOM (Quinn deve validar manualmente em browser):**
- Focus trap loop completo: Tab no último elemento focável → ciclar para primeiro
- Shift+Tab no primeiro elemento focável → ciclar para último
- Click no overlay (fora do modal) → fecha modal
- Restaurar foco no opener ao fechar (`document.activeElement` correcto)
- Submit do form com validação completa em browser real (axe-core spot-check)

**Workflow recomendado para Quinn:**
1. `npm run dev` em `imersao-tools/nexus/v2/`
2. Abrir `http://localhost:3001/projectos` (login se necessário)
3. Testar tab strip com setas ←/→ + Home/End
4. Click "+ Novo projecto" → modal abre, foco em "Nome"
5. Tab até último elemento focável (botão "Criar") → próximo Tab cicla para "Nome"
6. Shift+Tab no "Nome" → último elemento (botão "Criar")
7. Escape em qualquer ponto → modal fecha, foco restaurado no botão "+ Novo projecto"
8. Criar projecto sem nome → erro PT-PT abaixo do campo
9. Criar projecto válido → card aparece no grid
10. Click kebab card → menu abre, navegação ↑/↓ funciona
11. Acções (Editar/Arquivar/Mark Done) funcionam
12. Switch tabs (Activos/Pausados/Concluídos/Todos) → cards filtram correctamente

---

## 8. Riscos / blockers conhecidos

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| R1 | Focus trap em JSDOM é frágil | Baixo | Manual spot-check em browser (Passo 7 acima) |
| R2 | `vitest.config.ts` tocado é path bloqueador (Not-Tested gate) | Baixo | Evidência local satisfeita: `test:coverage` mostra novos paths (73.71% / 91.76%) — não há regressão |
| R3 | Story 2.8 é a primeira do Epic 2 com par `@dev + @qa` (anteriores foram `@ux-design-expert + @dev`) | Baixo | Documentado na PO Validation §2; coerente com EPIC-2 §5 que diferencia executors por tipo de trabalho |
| R4 | Modal é primeira na codebase real (focus trap + form Zod) | Médio | Esqueleto inline na story validado, 13 testes Vitest cobrem todos os caminhos lógicos, manual spot-check em QA |

---

## 9. Comandos de retomada rápida

Em terminal novo, no directório do projecto:

```bash
# Verificar estado
cd "C:/Users/XPS/Documents/ecosistema-ia-avancada-pt/imersao-tools/nexus"
git status
git log --oneline -5

# Re-verificar gates (opcional — Quinn fará isto de qualquer forma)
cd v2
npm run typecheck    # exit 0 esperado
npm run lint         # exit 0 esperado (warning pré-existente)
npm run test:unit    # 511/511 esperado
npm run build        # exit 0 esperado, /projectos 8.36 kB
```

Activar Quinn:
```
@qa *qa-gate 2.8
```

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260517-story-2.8-ready-for-qa-gate.md`. ESTÁ DENTRO DA PASTA DO PROJECTO Nexus (`imersao-tools/nexus/`) — LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 10. Estado factual verificável (git ground truth)

```
Branch: feature/2.8-crud-projectos
Último commit local: 7d956d9d
Mensagem: feat(nexus-v2): Story 2.8 — CRUD projectos com rota /projectos + modal Zod + acções (Epic 2)
Files changed: 9 (+2897 lines)
Pushed: NÃO
```

Para verificar:
```bash
git log --oneline -1 feature/2.8-crud-projectos
# Esperado: 7d956d9d feat(nexus-v2): Story 2.8 — CRUD projectos com rota /projectos + modal Zod + acções (Epic 2)

git diff --stat main..feature/2.8-crud-projectos
# Esperado: 9 files changed, 2897 insertions(+)
```

---

## 11. Epic 2 — estado actual

| # | Story | Estado |
|---|-------|--------|
| 2.1 | Schema tarefas/projectos | Done em main (15/05) |
| 2.2 | Migration v1→v2 | Done em main (15/05) |
| 2.3 | Vista lista | Done em main (15/05) |
| 2.4 | Vista Kanban | Done em main (16/05) |
| 2.5 | Vista calendário semanal | Done em main (17/05) |
| **2.8** | **CRUD projectos** | **Ready for Review local** (commit `7d956d9d`, aguarda QA gate Quinn) |
| 2.6 | Sistema de tags global | Pending (independente, FR14) |
| 2.7 | Motor de recorrência | Pending (independente, FR10) |
| 2.9 | Vista projecto | Pending (depende 2.8) |
| 2.10 | Tools cérebro tarefas/projectos | Pending (depende 2.1 + 2.8) |

**Após 2.8 fechar:** 6/10 Done em main, 2.6/2.7 podem paralelizar imediatamente (independentes), 2.9 e 2.10 desbloqueiam.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260517-story-2.8-ready-for-qa-gate.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Dex (`@dev`)
DATA: 17/05/2026

— Dex, sempre construindo 🔨
