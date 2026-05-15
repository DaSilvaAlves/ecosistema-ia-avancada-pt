---
from_agent: sm
to_agent: po
created: 2026-05-15T00:00:00Z
consumed: true
consumed_at: 2026-05-15T01:00:00Z
consumed_by: po
status: consumed
project: nexus-v2
epic: 2
story: 2.1
next_action: validate_story_draft_2.1
result: GO conditional (10/10). PO-VALIDATION-STORY-2.1.md gerado. Q1/Q2/Q3 decididas pela @po. F1 trivial apply (~5 min) delegado ao @sm antes do @data-engineer arrancar. Handoff de saída @po → @sm criado.
---

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# Story 2.1 drafted — pronto para `@po *validate-story-draft 2.1`

## Sumário

River (`@sm`) draftou a Story 2.1 — **Schema tarefas/projectos (Data Access Layer Dexie v2)** — em `imersao-tools/nexus/docs/stories/2.1.story.md`, status **Draft**. A story incrementa o schema Dexie do Nexus v2 para `version(2)` adicionando as 2 tabelas em falta (`recurrences`, `tags`) e entrega a camada de acesso (schemas Zod + repositories + hooks reactivos) que as Stories 2.2-2.10 vão consumir. A leitura cruzada de `PRD-NEXUS-V2.md` §10, `EPIC-2.md` §5/§7, `architecture-v2.md` §4.2/§6.2/§16 e do código real (`lib/db/client.ts`, `types/db.ts`) revelou **3 reconciliações** PRD↔arquitectura e **3 perguntas abertas** que precisam de validação da `@po` (ou escalação a `@architect`) **antes** de o `@data-engineer` iniciar implementação.

## Estado consolidado

| Item | Valor |
|------|-------|
| Story file | `imersao-tools/nexus/docs/stories/2.1.story.md` |
| Status | Draft |
| Executor previsto | `@data-engineer` (Dara) |
| Quality gate previsto | `@dev` (Dex) — respeita `separation-of-roles.md` (A6) |
| Estimativa | 3-4h |
| Estimativa AC | 15 critérios (AC1-AC15) |
| Tasks/Subtasks | 9 tasks, ~25 subtasks |
| Scope | Dexie `version(2)` + `lib/db/schemas.ts` + 4 repos (`tasks`, `projects`, `recurrences`, `tags`) + 2 hooks (`useTasks`, `useProjects`) + tests Vitest |
| Bloqueia | 2.2 (migration usa repos), 2.3-2.5 (vistas), 2.6 (tags), 2.7 (recorrência), 2.8 (projectos), 2.9 (vista projecto), 2.10 (tools cérebro) |
| Bloqueada por | Epic 1 DONE (`5514b310` em main) — SATISFEITO |

## Interpretação `@sm` que `@po` deve validar (a tua atenção)

`EPIC-2.md` §5 / `PRD §10` descrevem a Story 2.1 como **"Schema Dexie `tasks`, `task_recurrences`, `tags`, `task_tags`, `projects`"**. A leitura real do código mostra que essa descrição está superada — e a leitura natural, alinhada com o precedente da Story 1.1, é "Data Access Layer", não "schema only".

**Estado real (Story 0.3 Done):**
- `tasks` e `projects` JÁ EXISTEM em `version(1)` (`lib/db/client.ts:46-47`)
- `Task`, `Project`, `Recurrence`, `Tag` (interfaces TS) JÁ EXISTEM em `types/db.ts:54-92`
- `recurrences` e `tags` NÃO existem

Tal como na Story 1.1 (PRD dizia "Schema audit log" mas o schema já tinha sido criado pela Story 0.3, então a `@sm` reinterpretou como "Audit Log Data Access Layer"), aqui a Story 2.1 entrega o **data access layer** que falta para Tarefas/Projectos. Mesmo padrão de scope, mesmos artefactos (schema increment + Zod + repos + hooks + tests).

Esta interpretação está fundamentada na Nota do `@sm` no topo da story. **Se rejeitares, escala para a `@sm` ou para o Eurico antes do `@data-engineer` arrancar.**

## 3 reconciliações PRD ↔ Arquitectura (a tua validação)

`EPIC-2.md` §7 instruiu: arquitectura prevalece sobre PRD; sem reabrir ADRs; divergências escaladas a `@architect` antes de implementar. As 3 reconciliações abaixo seguem a arquitectura — NÃO são invenção.

| # | PRD/EPIC-2 §5 dizia | Arquitectura decidiu | Story 2.1 |
|---|---------------------|----------------------|-----------|
| R1 | criar `tasks` e `projects` | Já em `version(1)` (`client.ts:46-47`) + interfaces em `types/db.ts:54-77` | NÃO recria; apenas confirma índices cobrem queries das Stories 2.3-2.9 |
| R2 | `task_recurrences` (específico tarefas) | `Recurrence` genérica — `ownerType: 'task'\|'transaction'\|'habit'\|'reminder'` + `ownerId` (§6.2, §16 L1128 "shared tarefas/finanças/hábitos") | Cria UMA tabela `recurrences`, reutilizada pelos Epics 3 e 4 |
| R3 | `task_tags` (tabela junção) | Sem junção; tags denormalizadas via índice `*tags` em `tasks` + `Task.tags: string[]` + tabela `tags` para definições | NÃO cria `task_tags`; cria apenas `tags` (definições) |

## 3 perguntas abertas (decisão tua ou escalação a `@architect`)

A arquitectura não fecha estes 3 pontos. A Story 2.1 inclui sugestões fundamentadas — mas precisa de confirmação antes de o `@data-engineer` escrever `version(2)`.

| # | Pergunta | Sugestão `@sm` na story |
|---|----------|-------------------------|
| Q1 | `Task.tags: string[]` guarda **ids** ou **nomes** de tag? | Ids (rename-safe). Afecta filtro `listTasks({ tag })` e comportamento de rename |
| Q2 | Tabela `tags` deve ter índice único em `name` (`&name`)? FR14 sugere unicidade | Índice simples + verificação de duplicado no repo `createTag` com erro PT-PT (melhor mensagem que constraint hard) |
| Q3 | Índice da tabela `recurrences` (arquitectura §4.2 deixou em aberto — decisão deferida ao incremento da 2.1) | `'id, ownerType, ownerId, [ownerType+ownerId]'` — serve `getRecurrenceByOwner` (lookup dominante). Decisão é autoridade `@data-engineer`, `@architect` confirma padrão |

## Pontos de qualidade da story

| Item | Detalhe |
|------|---------|
| Trace ao PRD | Cada AC e secção referencia FR/§/linha — sem invenção |
| Trace à arquitectura | Schema, índices, interfaces, padrão de data access — tudo cruzado com `architecture-v2.md` §4.2/§6.2/§16 |
| Precedente | Padrão de scope idêntico à Story 1.1 (mesma reinterpretação "Schema" → "Data Access Layer"; mesma estrutura de repos/Zod/hooks) |
| Separation of roles (A6) | `@data-engineer` executa, `@dev` faz quality gate — diferentes |
| Not-Tested Evidence Gate (A2) | Marcado **N/A** — story não toca paths bloqueadores. Activa-se SE algum commit tocar `vitest.config.ts`/`tsconfig*.json`/`.github/workflows/**` |
| Anti-padrões | 13 anti-padrões explícitos (não reescrever `version(1)`, não recriar interfaces, não inventar `Project.status='archived'`, não criar UI, etc.) |
| Bug colateral apanhado | Comentário errado em `client.ts:22` ("Epic 2 adiciona installments/accounts/cards" — Epic 3) — AC4 corrige |
| Anti-scope-creep | Não tocar `migrations/v1-to-v2.ts` (Story 2.2), não implementar motor de recorrência (Story 2.7), não criar UI (Stories 2.3-2.9), não registar tools (Story 2.10) |

## Próxima acção — `@po`

```
@po *validate-story-draft 2.1
```

10-point checklist. Atenção particular:
1. **Confirmar interpretação "Data Access Layer"** (Nota do `@sm` no topo da story)
2. **Validar reconciliações R1-R3** — confirmar que seguem arquitectura, não PRD literal
3. **Decidir Q1, Q2, Q3** — validar sugestões da story ou escalar a `@architect *consult`
4. **Confirmar non-scope** — Stories 2.2 (migration), 2.6 (sistema tags), 2.7 (motor recorrência) ficam fora

Se PASS (≥7/10): handoff `@po → @dev/@data-engineer` para `*develop 2.1`.
Se NO-GO: lista de fixes obrigatórios; story regressa a Draft.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-drafted-ready-for-po-validation.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Contexto adicional para a `@po`

### Estado da sessão (15/05/2026)

- Branch: `main` (working tree com submódulos modificados — alterações deste handoff são em paths versionados de `imersao-tools/nexus/`)
- Handoff `RETOMA-20260514-epic-2-created-ready-for-sm-draft.md` consumido por `@sm` (River) — marcado `consumed: true`, movido para `archive/`, INDEX actualizado
- Story 2.1 file criado, ainda não committado (`@po` valida primeiro, depois `@dev`/`@data-engineer` implementa, `@devops` faz push)
- O Eurico optou por não committar Epic 2 ainda (ver handoff anterior, secção "Estado da sessão" de 14/05) — `@devops` empurra quando o Eurico decidir

### Ficheiros lidos pelo `@sm` para draftar

- `imersao-tools/nexus/docs/EPIC-2.md` (fonte directa)
- `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §6.2, §6.5, §10 Epic 2
- `imersao-tools/nexus/docs/architecture-v2.md` §4.2 (Dexie schema), §6.2 (interfaces), §16 (pontos críticos Epic 2)
- `imersao-tools/nexus/v2/lib/db/client.ts` (estado real `version(1)`)
- `imersao-tools/nexus/v2/types/db.ts` (interfaces já existentes)
- `imersao-tools/nexus/v2/lib/db/migrations/v1-to-v2.ts` (contexto Story 2.2)
- `imersao-tools/nexus/docs/stories/completed/1.1.story.md` (padrão de precedente)
- `.claude/rules/not-tested-trailer-rules.md`, `.claude/rules/separation-of-roles.md`
- `.aiox-core/development/tasks/create-next-story.md` (workflow da task)
- `.aiox-core/product/templates/story-tmpl.yaml` (template canónico — incluída a secção "Not-Tested Evidence Gate" da A2)

### O que NÃO foi feito (e porquê)

- **Não criada task no ClickUp** — a task `create-next-story.md` tem step 5.1-5.4 para criar story task no ClickUp. Pulado: o projecto Nexus v2 não usa ClickUp como sistema de tracking (não há `clickup` config visível em `core-config.yaml`). Se a `@po` ou Eurico quiserem, abrir manualmente.
- **Não executada `*story-checklist`** — a checklist está em `.aiox-core/development/checklists/story-draft-checklist.md` que **não existe** neste repo (verificado). O equivalente é o `*validate-story-draft` da `@po`, que é o passo seguinte. Se a `@po` quiser correr o checklist canónico, podemos adicionar.
- **Não tocado em código** — a `@sm` não implementa (`agent-authority.md`). Só draftou a story.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **nexus-v2**
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-drafted-ready-for-po-validation.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: 15/05/2026
