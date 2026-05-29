# RETOMA — Story 2.6 (Sistema de tags global, FR14) drafted v0.1 — aguarda `@po *validate-story-draft 2.6`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 19/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Tipo:** Cross-agent dentro do Story Development Cycle — passagem do drafter para o validador
**Severidade:** baixa (rotina SDC)
**Localização canónica:** `imersao-tools/nexus/`
**Branch actual:** `main` (tip `40ea2351`)
**De:** River (`@sm`) — `*draft 2.6` executado em iteração única
**Para:** Pax (`@po`) — `*validate-story-draft 2.6` (10-point checklist)

---

## 1. Resumo executivo

Story 2.6 (Sistema de tags global, FR14) drafted v0.1 em iteração única partindo de `main@40ea2351`. Scope verificado directamente em código (não-invenção): a infraestrutura de tags já existe em main desde Stories 0.3 + 2.1 + 2.3; a 2.6 entrega apenas a camada de UI de gestão + 2 operações de repo em falta (`updateTag`, cascata em `deleteTag`) + 1 hook reactivo + refactor cirúrgico de 2 pages consumidoras.

| Marco | Detalhe |
|-------|---------|
| Caminho escolhido | A (Story 2.6) — decisão Eurico via AskUserQuestion após Orion (`@aiox-master`) apresentar opções A/B/C |
| Story file criada | `imersao-tools/nexus/docs/stories/2.6.story.md` (Status: Draft v0.1) |
| Linhas de código (rough) | ~1.500 LOC esperadas (4 componentes UI + page + hook + repo extension + paleta colors + ~16-18 testes) |
| Tamanho da story doc | ~32 KB (versão Draft inicial — espera-se expansão moderada após `@po` validation se F1 trivial necessário) |
| AC | 15 (AC1-AC15) |
| AUTO-DECISIONS | 12 (A1-A12 documentadas com fundamentação) |
| Testes Vitest planeados | ~16-18 (T1-T18 detalhados em AC13) |
| Anti-padrões documentados | 16 |
| Executor previsto | `@dev` (Dex) — separação A6 cumprida |
| Quality gate previsto | `@qa` (Quinn) — separação A6 cumprida |

---

## 2. Cronologia da sessão River (`@sm`)

| Hora UTC (aprox.) | Acção | Resultado |
|-------------------|-------|-----------|
| ~03:30 | River activado por Orion (`@aiox-master`) via Skill `aiox-sm` com argumento `*draft 2.6 + contexto` | OK |
| 03:30 | Greeting + leitura de `create-next-story.md` task + `story-tmpl.yaml` template | OK |
| 03:32 | Glob fail inicial em paths Windows → ajuste para `path` absoluto + Bash cd directo | Resolvido |
| 03:34 | Leitura de `EPIC-2.md` integral (Story 2.6 = "Sistema de tags global", FR14, executor `@dev`, gate `@qa`) | Contexto absorvido |
| 03:35 | Leitura `PRD-NEXUS-V2.md` §6.2 linha 137 (FR14) + §10 Epic 2 linha 445 | Spec confirmada |
| 03:36 | Leitura `architecture-v2.md` linhas 240 (índice `*tags`), 521-525 (interface Tag) | Schema confirmado |
| 03:37 | Leitura `stories/completed/2.9.story.md` (280 linhas) — padrão recente de draft | Estrutura modelo absorvida |
| 03:38 | Leitura `stories/completed/2.1.story.md` (220 linhas) — schema + repo base + Q1/Q2 decisões firmes `@po` | Contexto repo absorvido |
| 03:40 | Anti-hallucination check: Grep `tags.ts` (confirma `createTag`/`listTags`/`getTag`/`deleteTag` — falta `updateTag`) | Confirmado |
| 03:41 | Bash `ls hooks/` + `app/(app)/` + `components/` — confirma rota `/tags` não existe, `useTags` não existe, componentes `tags/` não existem | Confirmado |
| 03:42 | Grep `TasksFilters.tsx` — confirma JÁ tem `<select Filtrar por tag>` wired desde Story 2.3 com props `tagId`/`onTagChange`/`tags` | Importante — wire-up parcial |
| 03:43 | Grep `useTags\|tagsLookup` em todo o v2 — confirma `tarefas/page.tsx:68` tem comentário literal `// useTags hook ainda não existe (Story 2.6) — useLiveQuery inline via repo` | Refactor target confirmado |
| 03:44 | Read `tarefas/page.tsx:60-160` — confirma `useLiveQuery(() => listTags(), [])` + `tagsLookup` Map<string, Tag> construído na page | Refactor cirúrgico definido |
| 03:45 | Read `lib/db/schemas.ts:1-80` — confirma `TagSchema` Zod estável (`id` UUID + `name.min(1)` + `color.min(1)`) | Schema confirmado |
| 03:46-03:55 | Escrita de `2.6.story.md` (15 AC + 12 AUTO-DECISIONS + 11 Tasks/Subtasks + 14 Dev Notes + 16 anti-padrões + Testing + Not-Tested gate + Referências + Change Log) | Story criada |
| 03:55 | Edit `INDEX.md` — substituir entrada Pending (handoff Gage consumido) + adicionar Archived | OK |
| 03:55 | Edit `EPIC-2.md` — Story 2.6 Pending → Draft | (próximo passo) |
| 03:56 | git mv `RETOMA-20260519-hotfix-executor-fechado-validado-decisao-epic-2.md` → `archive/` | OK |
| 03:57 | Este handoff criado | OK |

---

## 3. O que River decidiu autonomamente (para ratificação Pax)

12 [AUTO-DECISION] foram documentadas explicitamente na story com fundamentação. Sumário rápido:

| # | Decisão | Fundamentação |
|---|---------|---------------|
| **A1** | Rota dedicada `/tags` (não modal/tab settings) | Precedente `/projectos` Story 2.8. Escala melhor que modal sobre `/tarefas` quando Eurico criar >10 tags |
| **A2** | Layout grid de cards (não lista vertical, não tabela) | Padrão `ProjectsGrid.tsx` Story 2.8 |
| **A3** | `TagFormModal` reaproveita 100% padrão `ProjectFormModal.tsx` Story 2.8 | Pax aprovou padrão em PO Validation 2.8; Quinn validou sem CONCERNS |
| **A4** | Paleta restrita a 7 cores do design system (Cyan/Gold/Purple/Magenta/Lime/White/Grey) | `.claude/rules/design-system-ia-avancada.md` inegociável |
| **A5** | Cascata atómica em `deleteTag` via transacção Dexie `'rw'` | Evita orphan tagIds em `Task.tags` que quebrariam `tagsLookup.get(id)` |
| **A6** | `window.confirm` PT-PT pré-delete com contagem de tasks afectadas | Precedente Stories 2.3 + 2.8 (ratificado por Pax sem CONCERNS) |
| **A7** | `updateTag` valida duplicado excluindo o próprio id (`t.id !== id`) | Permite self-rename com capitalização diferente (ex: "Trabalho" → "TRABALHO") |
| **A8** | Contagem de uso por tag calculada inline na page (`useLiveQuery` Promise.all), NÃO no hook `useTags()` | Mantém `useTags()` puro e reutilizável — outras pages consumidoras não pagam custo |
| **A9** | Empty state PT-PT `"Sem tags ainda. Cria a primeira para organizar as tuas tarefas."` | Padrão Story 2.8 `ProjectsGrid` |
| **A10** | Pesquisa client-side via `useMemo` (tabela tags ≤50 realisticamente) | Filtro server-side overkill; precedente Story 2.3 search input |
| **A11** | Ordenação: alfabética pt-PT já em `listTags()` Story 2.1 | Sem toggle ordenação por uso (≤50 tags, alfabético suficiente) |
| **A12** | `tagsLookup` Map continua construído nas pages consumidoras, NÃO no hook | Separação de concerns — `/tags` page só precisa de `Tag[]`, não do lookup |

**Nenhuma decisão é invenção — todas têm fundamentação verificada em código existente, regras de governança, ou padrões consolidados de stories anteriores em main.**

---

## 4. Pontos focais para `@po` Pax

Sugestões de áreas críticas a verificar no 10-point checklist:

| # | Área | Onde verificar |
|---|------|----------------|
| 1 | **Trace ao PRD** (No Invention Article IV) | FR14 PRD §6.2 L137 + §10 Epic 2 L445 — confirmar que cada AC traça |
| 2 | **AUTO-DECISIONS A1-A12 ratificadas** ou ajustadas (especialmente A4 paleta restrita, A5 cascata, A6 confirm pré-delete) | Story §"Nota do `@sm` River" + reconciliação R1-R7 |
| 3 | **Verificação de não-regressão do refactor** `useLiveQuery` → `useTags` em 2 pages (AC4) | Tasks T5.3 cobre "smoke render TasksFilters com select populado" — confirma protecção contra regressão |
| 4 | **Cascata atómica** (AC2) — risco principal técnico | Dev Notes §"Cascata atómica em deleteTag" — uso de `db.transaction('rw', ...)` em vez de 2 awaits separados |
| 5 | **`updateTag` exclui próprio id** (AC1 + A7) — bug subtil se esquecido | Implementação detalhada incluída na story (`t.id !== id && normalize(t.name) === target`) |
| 6 | **Paleta restrita** (AC10 + A4) — enforce só em UI, não em DB | Dev Notes §"Paleta restrita" — justificação para não constraint de DB |
| 7 | **PT-PT consistente** (AC12) — incluindo singular/plural "1 TAREFA" vs "N TAREFAS" | AC12 lista todos os textos UI esperados |
| 8 | **Coverage thresholds** (AC15) — page >=70%, components >=70%, repo updates >=80% | Sem alteração de `vitest.config.ts` (caminho bloqueador — gate Not-Tested aplicável) |
| 9 | **Anti-padrões 16** documentados | Story §"Anti-padrões" — proibições explícitas para o executor |
| 10 | **Separação A6** | Executor `@dev`, gate `@qa` — diferentes |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260519-story-2.6-drafted-aguarda-po-validate.md`. CAMINHO ESTÁ DENTRO DA PASTA DO PROJECTO (`imersao-tools/nexus/`) — CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 5. Estado actual do repositório

### 5.1 Branch e tip

```
main (local + origin)
└── 40ea2351 docs(nexus-v2): handoff cross-terminal — hotfix executor PT-PT FECHADO + validado em produção
    └── c044def4 docs(nexus-v2): close hotfix executor system prompt — MERGED em main via PR #26 squash 755375a0
        └── 755375a0 fix(nexus-v2): adicionar system prompt PT-PT ao executor Sonnet (#26)
```

Tip local + origin: `40ea2351` (confirmed via `git pull origin main` — "Already up to date").

### 5.2 Working tree (PRESERVAR — dívida pré-existente fora-scope)

A sessão River **NÃO COMMITTED** as alterações da Story 2.6 — apenas escreveu os ficheiros docs (story + INDEX + handoff saída + EPIC-2 update). Pax verifica a story em estado uncommitted, pode editar livremente para resolver F1 trivial se necessário. Quando Pax fechar a sua sessão e o ciclo avançar para `@dev`, o developer fará commit local da story file + ficheiros novos de implementação juntos.

```
On branch main
Changes not staged for commit:
 M imersao-tools/comunidade                         (submódulo — pré-existente desde antes da Story 2.6)
 m imersao-tools/starter-builder                    (submódulo — pré-existente desde antes da Story 2.6)

Untracked files (sessão River adicionou):
 ?? imersao-tools/nexus/docs/stories/2.6.story.md  (NOVO — esta sessão)
 ?? imersao-tools/nexus/docs/handoffs/RETOMA-20260519-story-2.6-drafted-aguarda-po-validate.md  (NOVO — este handoff)

Renamed (git mv):
 R  imersao-tools/nexus/docs/handoffs/RETOMA-20260519-hotfix-executor-fechado-validado-decisao-epic-2.md
   → imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260519-hotfix-executor-fechado-validado-decisao-epic-2.md

Modified:
 M imersao-tools/nexus/docs/handoffs/INDEX.md       (Pending substituído + Archived adicionado)
 M imersao-tools/nexus/docs/EPIC-2.md               (Story 2.6 Pending → Draft)

Untracked pré-existentes (150+ ficheiros, dívida governança separada — preservar):
 ?? BESTSELLER-*, GUIA_*, HANDOFF_*, mega-brain/, _agents/, ...
 ?? imersao-tools/nexus/docs/.claude/
 ?? imersao-tools/nexus/docs/handoffs/.claude/
 ?? imersao-tools/nexus/docs/PO-VALIDATION-*.md (várias)
 ?? imersao-tools/nexus/docs/PR-BODY-STORY-*.md (várias)
 ?? imersao-tools/nexus/docs/QA-GATE-*.md (várias)
 ?? imersao-tools/nexus/docs/retrospectives/
```

**Nada disto bloqueia próxima sessão.** Dívida histórica preservada conforme padrão Epic 1+2.

### 5.3 Produção

| Item | Estado |
|------|--------|
| URL | https://imersao.ia.expressia.pt |
| Deploy production tip | `40ea2351` / `c044def4` (Vercel SUCCESS desde 19/05/2026 01:58:43Z) |
| `EXECUTOR_SYSTEM_PROMPT` PT-PT activo | SIM — validado em 3 turnos pós-deploy |
| Bug PT-BR original | RESOLVIDO desde PR #26 squash 755375a0 |
| Epic 2 em main | 7/10 Done (Stories 2.1+2.2+2.3+2.4+2.5+2.8+2.9 MERGED) |

---

## 6. Como retomar (Pax `@po`)

### 6.1 Pax activa-se em qualquer terminal

```
@po
```

Ao activar, Pax deve:
1. Ler `imersao-tools/nexus/docs/handoffs/INDEX.md` (regra de activação) — detecta este RETOMA Pending
2. Ler `imersao-tools/nexus/docs/stories/2.6.story.md` (story drafted v0.1)
3. Executar `*validate-story-draft 2.6` (10-point checklist)

### 6.2 Possíveis veredictos

| Veredicto | Próximo passo |
|-----------|---------------|
| **GO** (score 10/10) | Status: `Draft → Approved`. Handoff sm → `@dev` criado. Story pronta para `@dev *develop 2.6` |
| **GO conditional** (score 7-9/10 com F1 trivial) | Status mantém-se Draft. Pax delega F1 a River (`@sm`) para apply trivial (~5-15 min). Handoff `po → sm` criado |
| **NO-GO** (score <7/10) | Pax devolve a River com required fixes listados. Handoff `po → sm` com escopo de correcção |

### 6.3 Onde criar `PO-VALIDATION-STORY-2.6.md`

Convenção Story 2.1+2.3+2.5+2.8+2.9: `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.6.md` (pasta `docs/` raiz, não em `handoffs/`). Pax cria este ficheiro durante `*validate-story-draft` com o 10-point checklist + scoring + decisões F1.

---

## 7. Caveats operacionais

| Caveat | Detalhe |
|--------|---------|
| Working tree não-limpo | 150+ untracked pré-existentes + 2 submódulos modified — preservar (dívida governança separada) |
| Sem commit | River **não** commit-ou nesta sessão — Pax pode editar livremente a story file (F1 trivial). Commit acontece quando `@dev` começa `*develop 2.6` |
| Branch sugerida | `feature/2.6-tags-global` a criar **apenas após** Pax dar GO/GO conditional. Não criar antes |
| Decisões firmes | A1-A12 documentadas — Pax pode ratificar, ajustar (F1) ou bloquear (NO-GO) com fundamentação |
| Padrão | 11 stories first-iter PASS pós-PO Validation GO — Story 2.6 candidata à 12ª |
| Hard-stop Iter 2 | Padrão Epic 1+2 — máximo 2 iterações CR self-healing por story. Mantido nesta story |
| Mock-protocol-fidelity | N/A (CRUD interno, sem mocks de protocolos externos) — registado explicitamente em §"Lições Epic 1" |
| Not-Tested Evidence Gate | N/A (a story não toca paths bloqueadores; AC15 proíbe explicitamente `vitest.config.ts`) |

---

## 8. Ficheiros-chave para Pax `@po`

| Ficheiro | Propósito |
|----------|-----------|
| `imersao-tools/nexus/docs/stories/2.6.story.md` | Story drafted v0.1 — alvo principal do `*validate-story-draft` |
| `imersao-tools/nexus/docs/EPIC-2.md` §5 | Trace executor `@dev` + gate `@qa`, FR14, Story 2.6 estado actualizado para Draft |
| `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §6.2 L137 + §10 L445 | FR14 fonte canónica |
| `imersao-tools/nexus/docs/architecture-v2.md` §4.2 L240 + §6.2 L521-525 | Schema Dexie + interface Tag |
| `imersao-tools/nexus/v2/lib/db/repos/tags.ts` | Repo base (Story 2.1) — alvo da extensão |
| `imersao-tools/nexus/v2/components/tarefas/TasksFilters.tsx:128-143` | Confirma wire-up parcial (filter por tag JÁ existe desde Story 2.3) |
| `imersao-tools/nexus/v2/app/(app)/tarefas/page.tsx:68-69` | Comentário literal `// useTags hook ainda não existe (Story 2.6)` — alvo do refactor |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.9.md` | Padrão recente de PO-Validation a usar como template para 2.6 |
| `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260519-hotfix-executor-fechado-validado-decisao-epic-2.md` | Handoff Gage consumido (contexto produção LIVE) |

---

## 9. Métricas desta operação `@sm`

| Métrica | Valor |
|---------|-------|
| Tempo total River (activação → handoff saída) | ~25 min |
| Anti-hallucination checks executados | 7 (Grep `updateTag`, `useTags`, `tagsLookup`, ls hooks, ls app, ls components/tags, Read tags.ts) |
| Stories anteriores consultadas | 3 (2.1 schema/repo, 2.8 padrão `/projectos`, 2.9 padrão recente) |
| Regras consultadas | 5 (`design-system-ia-avancada.md`, `language-standards.md`, `separation-of-roles.md`, `mock-protocol-fidelity.md`, `handoff-central.md`) |
| ACs propostos | 15 (AC1-AC15) |
| AUTO-DECISIONS documentadas | 12 (A1-A12 com fundamentação) |
| Anti-padrões documentados | 16 |
| Testes Vitest planeados | ~16-18 (T1-T18 listados em AC13) |
| Reconciliações PRD↔Arquitectura↔Código | 7 (R1-R7) |
| Tasks/Subtasks propostas | 11 (T1-T11 com 30+ subtasks) |
| Dev Notes | 14 entradas com source citations |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260519-story-2.6-drafted-aguarda-po-validate.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: River (`@sm`) — sessão `*draft 2.6` executada via Skill `aiox-sm` invocada por Orion (`@aiox-master`)
DATA: 19/05/2026
