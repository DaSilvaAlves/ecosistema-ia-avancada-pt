# RETOMA — Story 2.6 (Sistema de tags global, FR14) APPROVED 10/10 GO — aguarda `@dev *develop 2.6`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 19/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Tipo:** Cross-agent dentro do Story Development Cycle — passagem do validador para o executor
**Severidade:** baixa (rotina SDC Phase 2 → Phase 3)
**Localização canónica:** `imersao-tools/nexus/`
**Branch actual:** `main` (tip `40ea2351`)
**De:** Pax (`@po`) — `*validate-story-draft 2.6` executado em iteração única
**Para:** Dex (`@dev`) — `*develop 2.6` (Story Development Cycle Phase 3)

---

## 1. Resumo executivo

Story 2.6 (Sistema de tags global, FR14) **APPROVED 10/10 GO direct** sem F1 trivial necessário. 12/12 AUTO-DECISIONS A1-A12 ratificadas pela Pax. Dex pode arrancar `*develop 2.6` directamente.

| Marco | Detalhe |
|-------|---------|
| Veredicto | **GO** — score 10/10 em 11 dimensões (Template, Executor, FileStructure, UI/Frontend, AC, Validation/Testing, Security N/A, Tasks Sequence, CodeRabbit, AntiHallucination, Implementation Readiness) |
| F1 trivial | **NENHUM** — 2 observações minor (C1+C2) ignoráveis |
| Confidence | **High** — todos os claims técnicos verificados em código |
| Anti-hallucination claims verificados | 19 |
| AUTO-DECISIONS ratificadas | 12/12 (100%) |
| Implementation Readiness | 10/10 |
| Status update | `Draft → Approved` (story file v0.2) |
| PO-VALIDATION doc | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.6.md` |

---

## 2. Decisões firmes (ratificadas Pax) — baked-in na story

Todas as 12 AUTO-DECISIONS de River foram ratificadas sem ajustes. Resumo das mais críticas para Dex:

| # | Decisão firme | Implicação para Dex |
|---|---------------|----------------------|
| **A4** | Paleta restrita a 7 cores do design system (`TAG_PALETTE` const em `lib/tags/colors.ts`) | NÃO inventar HEX picker livre. Radio group `<button role="radio">` com 7 opções fixas. |
| **A5** | Cascata atómica em `deleteTag` via **transacção Dexie `'rw'`** | NÃO fazer 2 awaits separados — usar `db.transaction('rw', db.tasks, db.tags, async () => {...})`. Rollback automático se algo falhar. |
| **A6** | `window.confirm` PT-PT pré-delete com contagem de tasks afectadas | Mensagem exacta: `"Eliminar a tag «{nome}»? Será removida de {N} tarefas vinculadas."`. Calcular N via `db.tasks.where('tags').anyOf([id]).count()` antes do confirm. |
| **A7** | `updateTag` exclui próprio id na verificação de duplicado | `existing.find((t) => t.id !== id && normalize(t.name) === target)` — sem isto, self-rename falha. |
| **A8** | Contagem de uso **inline na page**, NÃO no hook `useTags()` | Cálculo via `useLiveQuery(() => Promise.all(tags.map((t) => db.tasks.where('tags').anyOf([t.id]).count())), [tags])` na `app/(app)/tags/page.tsx`. Hook `useTags()` retorna `Tag[] | undefined` puro. |
| **A12** | `tagsLookup` Map **permanece nas pages**, NÃO no hook | Refactor cirúrgico só substitui `useLiveQuery(listTags, [])` por `useTags()`. O `useMemo` que constrói `tagsLookup` continua na page. |

---

## 3. Observações minor (não-bloqueantes) registadas pela Pax

| # | Descrição | Recomendação |
|---|-----------|--------------|
| **C1** | Story refere "tarefas/page.tsx:114-120" em AC5 e T7.5; código real está em **linhas 113-120** (off-by-one) | Dex localiza pelo símbolo `handleEscape`, não pela linha. Ajustar inline durante implementação OU ignorar. |
| **C2** | AC9 (TagFormModal) menciona botões "Criar"/"Guardar"/"Cancelar" via AC12 PT-PT, mas T6.4 não detalha explicitamente o botão Cancelar — assume padrão `ProjectFormModal` | Dex replica 1:1 do `ProjectFormModal.tsx` (que já tem Cancelar). |

**Nenhuma destas observações requer fix obrigatório.** São contexto para Dex registar em Completion Notes se preferir.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260519-story-2.6-approved-ready-for-dev-develop.md`. CAMINHO ESTÁ DENTRO DA PASTA DO PROJECTO (`imersao-tools/nexus/`) — CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. Estado actual do repositório

### 4.1 Branch e tip

```
main (local + origin)
└── 40ea2351 docs(nexus-v2): handoff cross-terminal — hotfix executor PT-PT FECHADO + validado em produção
```

Tip: `40ea2351`. **NÃO foi criada branch `feature/2.6-tags-global` ainda** — Dex cria como primeiro passo de `*develop 2.6` (T1.1 da story).

### 4.2 Working tree (PRESERVAR — dívida pré-existente fora-scope)

```
On branch main
Changes not staged for commit:
 M imersao-tools/comunidade                                                       (submódulo — pré-existente)
 m imersao-tools/starter-builder                                                  (submódulo — pré-existente)
 M imersao-tools/nexus/docs/EPIC-2.md                                             (sessão River — Story 2.6 Draft)
 M imersao-tools/nexus/docs/handoffs/INDEX.md                                     (sessões River + Pax)
R  RETOMA-20260519-hotfix-executor-fechado... → archive/                          (sessão River, git mv)

Untracked (sessões River + Pax adicionaram):
 ?? imersao-tools/nexus/docs/stories/2.6.story.md                                 (NOVO sessão River, EDITADO sessão Pax v0.2 Approved)
 ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.6.md                           (NOVO sessão Pax)
 ?? imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260519-story-2.6-drafted-aguarda-po-validate.md  (NOVO sessão River, MOVIDO sessão Pax)
 ?? imersao-tools/nexus/docs/handoffs/RETOMA-20260519-story-2.6-approved-ready-for-dev-develop.md      (NOVO sessão Pax — este handoff)
```

**Nada disto bloqueia próxima sessão.** Dívida histórica preservada conforme padrão Epic 1+2.

### 4.3 Produção

| Item | Estado |
|------|--------|
| URL | https://imersao.ia.expressia.pt |
| Deploy production tip | `40ea2351` / `c044def4` (Vercel SUCCESS) |
| Epic 2 em main | 7/10 Done + 1/10 Approved (2.6) + 2/10 Pending (2.7, 2.10) |

---

## 5. Como retomar (Dex `@dev`)

### 5.1 Dex activa-se em qualquer terminal

```
@dev
```

Ao activar, Dex deve:
1. Ler `imersao-tools/nexus/docs/handoffs/INDEX.md` (regra de activação) — detecta este RETOMA Pending (`po → dev`)
2. Ler `imersao-tools/nexus/docs/stories/2.6.story.md` v0.2 Approved (Status: Approved, 15 ACs, 12 AUTO-DECISIONS A1-A12 ratificadas)
3. Ler `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.6.md` para entender o contexto da validação Pax e as 2 observações minor C1+C2
4. Executar `*develop 2.6` em modo **YOLO** (precedente Stories 2.3-2.9 — execução autónoma em iteração única com 5/5 quality gates locais pré-commit)

### 5.2 Sequência de implementação (sugerida)

Conforme Tasks/Subtasks T1-T11 da story:

```
T1 — Preparação (5-10 min)
  T1.1 git checkout -b feature/2.6-tags-global  # a partir de main@40ea2351
  T1.2-T1.5 Leitura precedentes (tags.ts, ProjectFormModal.tsx, ProjectsHeader/Grid/Card, tarefas/page.tsx)

T2 — Paleta canónica (5 min)
  T2.1-T2.2 Criar lib/tags/colors.ts com TAG_PALETTE + helper + DEFAULT_TAG_COLOR

T3 — Repo extension (15-20 min)
  T3.1 Adicionar updateTag(id, patch) — copy-adaptar pattern createTag (case-insensitive normalize, excluir próprio id)
  T3.2 Reescrever deleteTag(id) com transacção Dexie 'rw' atómica
  T3.3 Manter assinatura Promise<void>
  T3.4 Comentários trace

T4 — Hook reactivo (3 min)
  T4.1-T4.2 Criar hooks/useTags.ts paralelo a useProjects.ts

T5 — Refactor cirúrgico (5 min)
  T5.1 tarefas/page.tsx: useLiveQuery(listTags, []) → useTags()
  T5.2 projectos/[id]/page.tsx: idem
  T5.3 npm run test:unit parcial — confirmar zero regressão

T6 — Componentes UI (40-60 min)
  T6.1 TagsHeader.tsx
  T6.2 TagsGrid.tsx
  T6.3 TagCard.tsx
  T6.4 TagFormModal.tsx (replicar 1:1 ProjectFormModal padrão)

T7 — Rota /tags (20 min)
  T7.1-T7.6 app/(app)/tags/page.tsx

T8 — Testes Vitest (40-60 min)
  T8.1 tests/unit/lib/db/repos/tags-update.test.ts (5-6 tests)
  T8.2 tests/unit/lib/db/repos/tags-delete-cascade.test.ts (3-4 tests — T9 cascata real CRÍTICO)
  T8.3 tests/unit/app/tags/page.test.tsx (10-12 tests)
  T8.4 tests/unit/components/tags/TagFormModal.test.tsx (focus trap, radio group, Zod)

T9 — Quality gates locais (5 min)
  T9.1 npm run lint
  T9.2 npm run typecheck
  T9.3 npm run test:unit (esperado ~545-547 total)
  T9.4 npm run build
  T9.5 npm run test:coverage

T10 — Story file maintenance
  File List + Change Log v0.3 + Dev Agent Record + Status Approved → Ready for Review

T11 — Handoff de saída para @qa *qa-gate 2.6
```

**Estimativa total:** 2h30m-3h30m (medium story com reuse alto). Padrão Stories 2.3-2.9 = ~2h-4h por story.

### 5.3 Anti-padrões críticos (recap dos 16 documentados)

| # | Anti-padrão | Razão |
|---|-------------|-------|
| 1 | NÃO criar tabela `task_tags` | Tags denormalizadas em `Task.tags: string[]` (R3 Story 2.1) |
| 2 | NÃO incrementar Dexie para `version(3)` | Schema actual de `tags` (`'id, name'`) é suficiente; cascata é aplicação, não schema |
| 3 | NÃO fazer 2 awaits separados em try/catch para cascata | Usar transacção `'rw'` atómica — rollback automático |
| 4 | NÃO usar `db.tags.*` ou `db.tasks.*` directamente fora de `lib/db/repos/` | UI consome só via repo + hook |
| 5 | NÃO inventar HEX picker livre nem RGB picker | Paleta restrita 7 cores (A4, AC10) |
| 6 | NÃO criar estado `Tag.status: 'archived'` | Cascata é hard-delete (A5) — No Invention Article IV |
| 7 | NÃO usar `window.alert` para erros do repo | Toast primitivo `setTimeout` 4s (padrão Stories 2.4/2.5/2.8) |
| 8 | NÃO modificar `vitest.config.ts` | Caminho bloqueador — Not-Tested Evidence Gate activaria |
| 9 | NÃO modificar `TasksFilters.tsx` | Filter por tag JÁ wired desde Story 2.3 |
| 10 | NÃO modificar `CalendarBoard.tsx` / `KanbanBoard.tsx` / `CalendarCard.tsx` | `tagsLookup` continua construído pelas pages |
| 11 | NÃO consolidar `tagsLookup` para dentro de `useTags()` | A12 — separação de concerns |
| 12 | NÃO inventar tool cérebro `criar_tag`/`eliminar_tag` | FR15 PRD não lista tag tools |
| 13 | NÃO tocar em `lib/db/migrations/v1-to-v2.ts` | Story 2.2 fora-scope |
| 14 | NÃO usar `any` | `unknown` com type guards quando necessário |
| 15 | NÃO escrever PT-BR | `language-standards.md` PT-PT obrigatório |
| 16 | NÃO criar custom dialog de confirmação delete | `window.confirm` PT-PT é aceite (Stories 2.3+2.8 precedente) |

---

## 6. Caveats operacionais

| Caveat | Detalhe |
|--------|---------|
| Working tree não-limpo | 150+ untracked pré-existentes + 2 submódulos modified + 4 ficheiros docs sessão Pax — Dex preserva e adiciona commit normal sobre Story 2.6 |
| Sem commit anterior à Story 2.6 | Story file, PO-VALIDATION, handoffs ainda untracked — Dex commit Story 2.6 + actualiza Change Log v0.3 + commit final pré-handoff @qa |
| Branch | Dex cria `feature/2.6-tags-global` a partir de `main@40ea2351` (T1.1) |
| Mock-protocol-fidelity | N/A (CRUD interno, sem mocks de protocolos externos) — registado na story |
| Not-Tested Evidence Gate | N/A (a story não toca paths bloqueadores) — registado na story |
| Hard-stop QA loop | Máximo 2 iterações `qa-loop-fix` após `*qa-gate 2.6` (padrão EPIC-2 §8) |
| Coverage thresholds | NÃO alterar `vitest.config.ts:coverage.thresholds.global` — caminho bloqueador |
| CodeRabbit local CLI | Skip — corre via integração GitHub no PR (server-side) — padrão Nexus v2 |
| Cascata atómica | Padrão Dexie canónico — primeira aplicação multi-tabela em Epic 2 (Stories 2.1-2.9 não usaram). T9 test crítico para mitigar |

---

## 7. Ficheiros-chave para Dex `@dev`

| Ficheiro | Propósito |
|----------|-----------|
| `imersao-tools/nexus/docs/stories/2.6.story.md` v0.2 Approved | Story APPROVED — alvo principal do `*develop` |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.6.md` | Contexto da validação Pax + observações C1+C2 |
| `imersao-tools/nexus/v2/lib/db/repos/tags.ts` | Repo base 4 funções (Story 2.1) — alvo de T3 (estender) |
| `imersao-tools/nexus/v2/components/projectos/ProjectFormModal.tsx` | Padrão focus trap + Escape + foco restaurado para replicar em `TagFormModal` (T1.3, T6.4) |
| `imersao-tools/nexus/v2/components/projectos/ProjectsHeader.tsx` + `ProjectsGrid.tsx` + `ProjectCard.tsx` | Padrão visual/CSS para replicar 1:1 em `components/tags/` (T1.4, T6.1-T6.3) |
| `imersao-tools/nexus/v2/app/(app)/tarefas/page.tsx:60-80` + `app/(app)/projectos/[id]/page.tsx:~65-80` | Alvos do refactor cirúrgico (T5.1, T5.2) |
| `imersao-tools/nexus/v2/components/tarefas/TasksFilters.tsx:128-143` | Confirma filter por tag JÁ wired — verificar que continua a popular após refactor (T18 smoke) |
| `imersao-tools/nexus/docs/EPIC-2.md` §5 | Confirma executor `@dev` + gate `@qa` (separação A6) |
| `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260519-story-2.6-drafted-aguarda-po-validate.md` | Handoff entrada já consumido (sessão Pax) |
| `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260519-hotfix-executor-fechado-validado-decisao-epic-2.md` | Handoff Gage anterior (contexto produção LIVE) |

---

## 8. Métricas desta operação `@po`

| Métrica | Valor |
|---------|-------|
| Tempo total Pax (activação → handoff saída) | ~25 min |
| Anti-hallucination claims verificados | 19 |
| AUTO-DECISIONS ratificadas | 12/12 (100%) |
| Score validação | 10/10 (10 PASS + 1 N/A em Security) |
| F1 trivial necessário | NÃO |
| Observações minor não-bloqueantes | 2 (C1 off-by-one linha + C2 botão Cancelar assumido) |
| Stories precedentes consultadas | 1 (2.8 PO-VALIDATION como template) |
| Padrão consolidado | 12ª story consecutiva candidata a first-iter PASS (depende de Quinn `*qa-gate 2.6`) |
| Story file maintenance | v0.2 Approved + Change Log entrada |
| Documento PO-VALIDATION gerado | `PO-VALIDATION-STORY-2.6.md` (`imersao-tools/nexus/docs/`) |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260519-story-2.6-approved-ready-for-dev-develop.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Pax (`@po`) — sessão `*validate-story-draft 2.6` executada via Skill `aiox-po` invocada por Orion (`@aiox-master`)
DATA: 19/05/2026
