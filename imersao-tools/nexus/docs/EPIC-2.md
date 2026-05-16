# Epic 2 — Tarefas v2 + Projectos

> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Criado por:** Morgan (`@pm`) em 14/05/2026
> **Estado:** Em curso — 3/10 stories Done em main (Stories 2.1 + 2.2 + 2.3 MERGED 15-16/05/2026 via PRs #18 / #19 / #20)
> **Fonte da verdade:** `PRD-NEXUS-V2.md` §6.2, §6.5, §9, §10 (Epic 2) — Constitution Artigo IV (No Invention): cada story e AC abaixo traça ao PRD
> **Arquitectura:** `architecture-v2.md` (5 ADRs — não reabrir, ver `project_nexus_v2_architecture.md`)
> **Lições aplicadas:** Retrospectiva Epic 1 (`retrospectives/EPIC-1-retrospective.md`) — acções A1, A2, A6

---

## 1. Goal

CRUD completo de tarefas com recorrência configurável, 3 vistas (lista, Kanban, calendário semanal), projectos, e tools do cérebro multi-intent integradas. Trace: PRD §10 Epic 2.

## 2. Contexto e posicionamento

| Dimensão | Detalhe |
|----------|---------|
| Continuidade | O campo `context` ("onde parei") + `lastWorkedAt` (FR9) é o ângulo de continuidade — alinhado à visão Nexus (overnight agent prepara o dia seguinte). Não é uma to-do list genérica. |
| Base Epic 1 | O cérebro multi-intent + Tool Registry (Epic 1, consolidado em `main` @ `5514b310`) é onde as tools de tarefas/projectos se registam. Epic 2 povoa o registry vazio criado na Story 1.3. |
| Persistência | Schema Dexie 4 IndexedDB — estende o schema criado na Story 1.1 (`agent_runs`, `chat_messages`). Ver §7 (reconciliação PRD ↔ arquitectura). |

## 3. Dependências

| Relação | Epic | Estado |
|---------|------|--------|
| Depende de | Epic 1 (Cérebro Multi-Intent — Tool Registry, classifier, executor) | DONE — 10/10 em main |
| Bloqueia | Epic 4 (Hábitos + Metas + Lembretes — reutiliza o motor de recorrência) | Não iniciado |
| Paralelizável com | Epic 3 (Finanças) — se `@sm` criar stories independentes | Não iniciado |

Ordem PRD §9: `0 → 1 → (2 || 3) → 4 → 5 → 6 → 7 → 8`.

## 4. Functional Requirements cobertos

| FR | Descrição | Stories |
|----|-----------|---------|
| FR9 | CRUD tarefas (título, descrição, prioridade, due date, projecto opcional, tags, status, `context`, `lastWorkedAt`) | 2.1, 2.3 |
| FR10 | Recorrência configurável (diária, semanal, mensal, dias úteis, fim-de-semana, dia específico) | 2.1, 2.7 |
| FR11 | 3 vistas: lista, Kanban, calendário semanal | 2.3, 2.4, 2.5 |
| FR12 | Drag-and-drop entre dias (calendário) e entre colunas (Kanban) | 2.4, 2.5 |
| FR13 | Tarefas atrasadas destacadas em secção dedicada | 2.3 |
| FR14 | Tags globais (criar, listar, filtrar) | 2.6 |
| FR15 | Tools cérebro: `criar_tarefa`, `completar_tarefa`, `listar_tarefas`, `listar_atrasadas`, `vincular_tarefa_projecto` | 2.10 |
| FR29 | CRUD projectos (nome, descrição, status, data início, prazo opcional) | 2.8 |
| FR30 | Tarefas vinculam-se a 0 ou 1 projecto | 2.1, 2.8 |
| FR31 | Vista projecto (lista + Kanban filtrado) | 2.9 |
| FR32 | Tools cérebro: `criar_projecto`, `vincular_tarefa_projecto`, `consultar_projecto` | 2.10 |

## 5. Stories (10) — trace PRD §10

> **Progresso:** 3/10 Done · 7/10 Pending. Stories 2.1 + 2.2 + 2.3 CLOSED 15/05/2026. Story 2.1 mergeada em `main` (squash `86ddb6a6` PR #18). Stories 2.2 (commit local `dd6dc0d8`) e 2.3 (commit local `7b0c201a`, branch `feature/2.3-vista-lista` 3 ahead) aguardam `@devops *push`. Sequência sugerida: push 2.2 → merge → rebase 2.3 → push 2.3 → merge.

| # | Story | Descrição | FR | Executor previsto | Quality gate previsto | Estado |
|---|-------|-----------|-----|-------------------|------------------------|--------|
| 2.1 | Schema tarefas/projectos | Schema Dexie `tasks`, `task_recurrences`, `tags`, `task_tags`, `projects` — estende schema Story 1.1 conforme `architecture-v2.md` | FR9, FR10, FR30 | `@data-engineer` | `@dev` (gate real: `@qa` Quinn) | **Done** (CLOSED 15/05) |
| 2.2 | Migration v1 → v2 | Migrar dados de tarefas do `localStorage` v1 (`nexus_tasks`) para o schema Dexie v2 | FR9 | `@dev` | `@data-engineer` | **Done** (CLOSED 15/05) |
| 2.3 | Vista lista | Refactor da vista lista v1; secção dedicada de atrasadas | FR9, FR11, FR13 | `@ux-design-expert` | `@dev` | **Done (CLOSED 15/05)** — aguarda `@devops *push` |
| 2.4 | Vista Kanban | Colunas customizáveis + drag-and-drop com `dnd-kit` | FR11, FR12 | `@ux-design-expert` | `@dev` | Pending |
| 2.5 | Vista calendário semanal | Calendário semanal com drag entre dias | FR11, FR12 | `@ux-design-expert` | `@dev` | Pending |
| 2.6 | Sistema de tags global | Criar, listar, filtrar tags partilhadas | FR14 | `@dev` | `@qa` | Pending |
| 2.7 | Geração de instâncias recorrentes | Motor de recorrência client-side (`requestIdleCallback`/`setInterval`) — horizonte 90 dias | FR10 | `@dev` | `@architect` | Pending |
| 2.8 | CRUD projectos | Criar, editar, listar, arquivar projectos | FR29, FR30 | `@dev` | `@qa` | Pending |
| 2.9 | Vista projecto | Tarefas vinculadas em vista lista + Kanban filtrado | FR31 | `@ux-design-expert` | `@dev` | Pending |
| 2.10 | Tools cérebro tarefas/projectos | Registar 7 tools no Tool Registry: `criar_tarefa`, `completar_tarefa`, `listar_tarefas`, `listar_atrasadas`, `vincular_tarefa_projecto`, `criar_projecto`, `consultar_projecto` | FR15, FR32 | `@dev` | `@architect` | Pending |

> Os pares executor/quality-gate são **previsões** (Quality-First Planning) e respeitam `executor != quality_gate` (regra A6). `@sm` finaliza a atribuição em cada story draft, `@po` valida.

## 6. Acceptance Criteria (nível epic) — trace PRD §10

| # | Critério |
|---|----------|
| AC1 | Migration v1→v2 não perde tarefas existentes |
| AC2 | Criar tarefa via UI ou via cérebro produz o mesmo resultado persistido |
| AC3 | Recorrência semanal/mensal/dias-úteis funciona em horizonte de 90 dias |
| AC4 | Drag-and-drop em Kanban e calendário persiste sem reload |
| AC5 | Tarefa pode ter projecto OU não (vínculo opcional) |

## 7. Reconciliação PRD ↔ Arquitectura

| Ponto | PRD §10 dizia | Arquitectura (ADR) | Resolução para Epic 2 |
|-------|---------------|--------------------|-----------------------|
| Persistência | "Schema `localStorage`" / "migration localStorage v1 → v2" | ADR-2: Dexie 4 IndexedDB desde o dia 1 | Story 2.1 cria schema **Dexie**, estende o da Story 1.1. Story 2.2 lê o `localStorage` v1 e escreve no Dexie v2. O termo "localStorage v2" do PRD está superado pela arquitectura. |
| Recorrência | "cron client-side via `setInterval` ou `requestIdleCallback`" | Sem ADR específico — segue padrão client-side | Story 2.7 segue a abordagem client-side; `date-fns` + `rrule` (PRD §8.2). |

Nenhum ADR é reaberto. Qualquer divergência face à arquitectura é escalada a `@architect` antes de implementar.

## 8. Qualidade e processo — lições da Retrospectiva Epic 1

| Acção | Aplicação no Epic 2 |
|-------|---------------------|
| **A1 — `mock-protocol-fidelity.md`** | Epic 2 é CRUD interno — não tem mocks de protocolos externos (SSE/HTTP/OAuth). A Story 2.10 (tools cérebro) deve garantir que qualquer mock do Tool Registry/executor reflecte o contrato real do registry. **Nota honesta:** a demonstração plena do critério A1 ("1 PR refactora 1 mock de protocolo externo") encaixa naturalmente no Epic 6 (OAuth Google/Gmail/Telegram), não no Epic 2 — não se força aqui. |
| **A2 — Not-Tested Evidence Gate** | O `story-tmpl.yaml` já tem a secção. Story 2.7 (motor de recorrência) e Story 2.2 (migration) são candidatas a tocar config/scripts — se algum commit usar `Not-tested:` em path bloqueador, a secção é obrigatória com evidência local. |
| **A6 — `separation-of-roles.md`** | Aplicado na tabela §5 — nenhum executor é o seu próprio quality gate. |
| Alvo de waiver rate | Epic 1 fechou com 50% "merge waived" (5/10). **Alvo Epic 2: <20%** (no máximo 2/10 stories). Causa-raiz do waiver em Epic 1 foi profundidade de trabalho insuficiente + estilo de feedback do CR — não cosmética. |
| Hard-stop QA loop | Máximo 2 iterações de `qa-loop-fix` por story, mantido 10/10 no Epic 1 — manter no Epic 2. |

## 9. Quality gates do epic

Trace PRD §10 Epic 2: "Epic 1 + manual UX validation".

| Gate | Detalhe |
|------|---------|
| Pré-requisito | Epic 1 consolidado em main — SATISFEITO |
| Por story | lint + typecheck + test + CodeRabbit (CRITICAL bloqueia) |
| Manual UX validation | Vistas Kanban (2.4) e calendário (2.5) exigem validação manual de drag-and-drop em Chrome/Edge |
| Cobertura | NFR17: >= 60% em packages core (tarefas entra nesta meta) |

## 10. Próximo passo

**Stories 2.2 + 2.3 CLOSED 15/05/2026** — ambas aguardam `@devops *push`.

| Story | Branch | Commit local | Estado |
|-------|--------|---------------|--------|
| 2.2 | `feature/2.2-migration-refactor` | `dd6dc0d8` + closure `ff86773c` | CLOSED, push pendente |
| 2.3 | `feature/2.3-vista-lista` | `7b0c201a` (inclui 2.2 no histórico — rebase pós-merge limpa) | CLOSED, push pendente após merge 2.2 |

Sequência sugerida:

```text
@devops *push (feature/2.2-migration-refactor) → CR Iter 1 → merge squash → main
  → @devops rebase feature/2.3-vista-lista contra main actualizado
  → @devops *push (feature/2.3-vista-lista) → CR Iter 1 → merge squash → main
  → Epic 2 fica 3/10 Done em main
  → @sm *draft 2.4 (Vista Kanban — desbloqueada por 2.3 que entregou scaffold de header com tabs)
```

Sequência herdada:
- Stories 2.1 → 2.2 → 2.3 são sequenciais (schema antes de migration antes de UI consumer) — todas concluídas.
- 2.4-2.9 podem paralelizar parcialmente agora que 2.3 entregou o scaffold de header com tabs Lista|Kanban|Calendário.
- 2.4 (Kanban) reaproveita layout 2.3 + adiciona drag-and-drop (FR12). 2.5 (Calendário) reaproveita scaffold tabs.
- 2.10 (tools cérebro) depende de 2.1 + 2.8 (precisa de tasks e projects persistidos).

### Débito não-bloqueador registado para retrospectiva Epic 2

| # | Item | Origem | Prioridade |
|---|------|--------|------------|
| D1 | Teste de cenário "JSON malformado em `localStorage.nexus_tasks` → migration retorna `no-data` graciosamente" | Cobre linhas 72-74 (`catch { v1Tasks = []; }`) de `v1-to-v2.ts` — pré-existente Story 0.3 (`git blame c362b171`), aceito como débito. Coverage agregada de `v1-to-v2.ts` é 96.22% > 80% alvo AC11 sem este teste. | Baixa — pode ser absorvido na Story 8.10 (Epic 8 cleanup) ou criado como story de débito técnico no fecho do Epic 2 |

---

*Epic 2 preparado por Morgan (`@pm`) em 14/05/2026. Ancorado em `PRD-NEXUS-V2.md` §10, `architecture-v2.md` (5 ADRs), e Retrospectiva Epic 1 (A1/A2/A6).*
*Story 2.1 CLOSED por Pax (`@po`) em 15/05/2026 — 1/10 Done.*
*Story 2.2 CLOSED por Pax (`@po`) em 15/05/2026 — 2/10 Done.*
*Story 2.3 CLOSED por Pax (`@po`) em 15/05/2026 — 3/10 Done. Primeira UI Epic 2 entregue (página `/tarefas` + 6 componentes + 2 helpers + 20 testes). Lições L1-L5 registadas para retrospectiva Epic 2. PA1-PA4 ratificados como não-bloqueadores (2 → retrospectiva, 2 → backlog Stories 2.4+2.6).*
