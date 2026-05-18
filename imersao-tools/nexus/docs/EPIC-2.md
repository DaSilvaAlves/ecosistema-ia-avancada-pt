# Epic 2 — Tarefas v2 + Projectos

> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Criado por:** Morgan (`@pm`) em 14/05/2026
> **Estado:** Em curso — **6/10 stories Done em main** (Stories 2.1 + 2.2 + 2.3 + 2.4 + 2.5 + 2.8 MERGED 15-17/05/2026 via PRs #18 / #19 / #20 / #21 / #22 / #23)
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

> **Progresso:** **6/10 Done em main · 4/10 Pending**. Stories 2.1+2.2+2.3+2.4+2.5+2.8 MERGED em main (PRs #18/#19/#20/#21/#22/#23 squash). Story 2.8 squash `bebbd530` em 17/05/2026 19:20:17Z (1ª iteração PASS sem waiver). Padrão consolidado: **10 stories consecutivas QA Gate PASS à primeira** pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/2.5/2.8). Waiver rate Epic 2 actual: **0%** (alvo <20% — abaixo do limite).

| # | Story | Descrição | FR | Executor previsto | Quality gate previsto | Estado |
|---|-------|-----------|-----|-------------------|------------------------|--------|
| 2.1 | Schema tarefas/projectos | Schema Dexie `tasks`, `task_recurrences`, `tags`, `task_tags`, `projects` — estende schema Story 1.1 conforme `architecture-v2.md` | FR9, FR10, FR30 | `@data-engineer` | `@dev` (gate real: `@qa` Quinn) | **Done** (CLOSED 15/05) |
| 2.2 | Migration v1 → v2 | Migrar dados de tarefas do `localStorage` v1 (`nexus_tasks`) para o schema Dexie v2 | FR9 | `@dev` | `@data-engineer` | **Done** (CLOSED 15/05) |
| 2.3 | Vista lista | Refactor da vista lista v1; secção dedicada de atrasadas | FR9, FR11, FR13 | `@ux-design-expert` | `@dev` | **Done (CLOSED 15/05)** — aguarda `@devops *push` |
| 2.4 | Vista Kanban | Colunas customizáveis + drag-and-drop com `dnd-kit` | FR11, FR12 | `@ux-design-expert` | `@dev` | **Done MERGED 16/05** (PR #21 squash `2a5f0dbd`) |
| 2.5 | Vista calendário semanal | Calendário semanal com drag entre dias | FR11, FR12 | `@ux-design-expert` | `@dev` | **Done MERGED 17/05** (PR #22 squash `29e08106`) |
| 2.6 | Sistema de tags global | Criar, listar, filtrar tags partilhadas | FR14 | `@dev` | `@qa` | Pending |
| 2.7 | Geração de instâncias recorrentes | Motor de recorrência client-side (`requestIdleCallback`/`setInterval`) — horizonte 90 dias | FR10 | `@dev` | `@architect` | Pending |
| 2.8 | CRUD projectos | Criar, editar, listar, arquivar projectos | FR29, FR30 | `@dev` | `@qa` | **Done MERGED 17/05** (PR #23 squash `bebbd530`) |
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

**Story 2.8 CLOSED MERGED 17/05/2026** — CRUD projectos UI (FR29+FR30) entregue em main. Epic 2 a **6/10 Done**. Story 2.9 (Vista projecto, FR31) agora desbloqueada.

Sequência sugerida:

```text
@sm *draft 2.6 (Sistema de tags global — independente, FR14)
  ‖ paralelizável com:
@sm *draft 2.7 (Motor de recorrência — independente, FR10)
@sm *draft 2.9 (Vista projecto — depende de 2.8 que está em main, FR31)
  → 2.10 (tools cérebro) depende de 2.1 + 2.8
```

Stories 2.6, 2.7 e 2.9 podem ser draftadas em paralelo em 3 branches distintas (2.6 e 2.7 totalmente independentes; 2.9 depende de 2.8 que já está em main).

Sequência herdada:
- Stories 2.1 → 2.2 → 2.3 → 2.4 → 2.5 + 2.8 — **todas em main** (schema → migration → UI Lista → UI Kanban → UI Calendário → CRUD projectos).
- 2.6, 2.7, 2.9 podem paralelizar:
  - 2.6 (Tags global) independente.
  - 2.7 (Motor de recorrência) independente.
  - 2.9 (Vista projecto) — 2.8 satisfeita, agora desbloqueada.
- 2.10 (tools cérebro) depende de 2.1 + 2.8 — ambas em main, agora desbloqueada (resta 2.6/2.7 se quiser tools de tags/recorrência).

### Débito não-bloqueador registado para retrospectiva Epic 2

| # | Item | Origem | Prioridade |
|---|------|--------|------------|
| D1 | Teste de cenário "JSON malformado em `localStorage.nexus_tasks` → migration retorna `no-data` graciosamente" | Cobre linhas 72-74 (`catch { v1Tasks = []; }`) de `v1-to-v2.ts` — pré-existente Story 0.3 (`git blame c362b171`), aceito como débito. Coverage agregada de `v1-to-v2.ts` é 96.22% > 80% alvo AC11 sem este teste. | Baixa — pode ser absorvido na Story 8.10 (Epic 8 cleanup) ou criado como story de débito técnico no fecho do Epic 2 |
| D2 | `@dnd-kit/utilities` usado em `KanbanCard.tsx` mas não declarado explicitamente em `package.json` (transitiva via `@dnd-kit/sortable`) | Story 2.4 — PA1/F1 do QA Gate. Funciona em build + dev. | Baixa — registar dep explícita na Story 2.5 (Calendar) se for usada lá; senão, retrospectiva Epic 2 |
| D3 | `PRIORITY_COLORS` duplicado entre `TaskRow.tsx` (Story 2.3) e `KanbanCard.tsx` (Story 2.4) | Story 2.4 — PA2/F2 do QA Gate. Duplicação ≤2 instâncias (limite YAGNI). | Baixa — refactor para `lib/tarefas/colors.ts` quando 3+ componentes precisarem (provavelmente Story 2.6 tags ou 2.9 vista projecto) |
| D4 | Toast de erro primitivo (`setTimeout` 4s, sem biblioteca) no `KanbanBoard.tsx` | Story 2.4 — PA3/F3 do QA Gate. Pattern alinha com `window.alert` da Story 2.3, a11y `role="status"` + `aria-live="assertive"` OK. | Baixa — sistema toast unificado futuro (sem prioridade definida) |
| D5 | E2E Playwright para drag manual ponta-a-ponta (Kanban) | Story 2.4 — PA4/F4 do QA Gate. Pax aceitou na PO Validation #2 (15/05). 12 testes Vitest cobrem handler factory. | Baixa — registar na retrospectiva Epic 2 quando volume de UI features justifica E2E suite |
| **D6** | **Delete projecto com cascata `Task.projectId`** — política e implementação (set null vs bloquear vs cascade delete tasks). Actualmente o repo `projects.ts` tem apenas `archiveProject` (status → `'paused'`); não há hard delete. | Story 2.8 — A5 declarou delete fora-de-scope (decisão pertence a story dedicada). Pax NTH1 da PO Validation + Quinn débito explícito QA Gate. | **Média** — bloqueia funcionalidade plena de gestão de projectos. Endereçar em story dedicada do Epic 2 (sugestão: incluir na Story 2.9 ou criar 2.11 técnica) |
| **M1** | **`aria-describedby` ausente no select `status`** do `ProjectFormModal.tsx:268-279` — `aria-invalid` está presente mas falta `aria-describedby={errors.status !== undefined ? 'project-status-error' : undefined}` em harmonia com os outros 4 campos | Story 2.8 — QA Gate CONCERN minor. Impacto prático quase nulo (select é enum fechado 3 opções via `<option>`), erro Zod ainda apresentado via `<span role="alert">`. | Baixa — fix em qualquer story futura que toque o modal, ou linha solta em retrospectiva Epic 2 |

---

*Epic 2 preparado por Morgan (`@pm`) em 14/05/2026. Ancorado em `PRD-NEXUS-V2.md` §10, `architecture-v2.md` (5 ADRs), e Retrospectiva Epic 1 (A1/A2/A6).*
*Story 2.1 CLOSED por Pax (`@po`) em 15/05/2026 — 1/10 Done.*
*Story 2.2 CLOSED por Pax (`@po`) em 15/05/2026 — 2/10 Done.*
*Story 2.3 CLOSED por Pax (`@po`) em 15/05/2026 — 3/10 Done. Primeira UI Epic 2 entregue (página `/tarefas` + 6 componentes + 2 helpers + 20 testes). Lições L1-L5 registadas para retrospectiva Epic 2. PA1-PA4 ratificados como não-bloqueadores (2 → retrospectiva, 2 → backlog Stories 2.4+2.6).*
*Story 2.4 CLOSED por Pax (`@po`) em 16/05/2026 — 4/10 Done (3 em main + 1 aguarda push). Vista Kanban entregue (3 componentes novos KanbanBoard+Column+Card + 12 testes Vitest + refactor cirúrgico `createKanbanDragEndHandler` factory pura). 5/5 quality gates locais PASS à primeira (lint, typecheck, test:unit 466/466, build, coverage 85.71%/83.84%/100%/87.4%). QA Gate Dex PASS à primeira (0/2 qa-loop-fix). DoD 15/15 PASS. 5/5 [AUTO-DECISION] A1-A5 ratificadas. 4 PAs/F1-F4 ratificados não-bloqueadores: D2 (`@dnd-kit/utilities` dep transitiva) + D3 (`PRIORITY_COLORS` duplicado refactor futuro) + D4 (toast primitivo) + D5 (E2E Playwright drag manual). Padrão consolidado: 8 stories consecutivas QA Gate PASS à primeira pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4).*
*Story 2.5 CLOSED por Pax (`@po`) em 17/05/2026 — **5/10 Done em main**, trio Lista/Kanban/Calendário fechado (FR11+FR12 ambos satisfeitos). Vista calendário semanal entregue (3 componentes novos CalendarBoard+Day+Card + 1 helper novo `weekRange.ts` + 30 testes Vitest novos: 14 calendar + 16 weekRange + actualização T9 em page.test.tsx). 5/5 quality gates locais PASS à primeira (lint, typecheck, test:unit 498/498, build, coverage 85.71%/100%/87.78%). QA Gate Dex PASS à primeira (separação A6 — executor Uma, gate Dex). Padrão 2.4 reaproveitado 1:1 (factory pura + `overridesRef` + **`inFlightByTaskRef` mutation token Iter 2** + DndContext+sensors+announcements PT-PT + optimistic UI + rollback). Discovery shape Task: `lastWorkedAt` é `number\|null` (epoch ms) — Uma corrigiu anti-hallucination minor da story v0.2, alinhado com repo `setTaskStatus`. CI todos PASS (Lint, Vitest, Playwright E2E, 50-prompt regression, Coverage, CodeQL ×2, CodeRabbit, Vercel). Squash merge `29e08106` PR #22 sem waiver. Padrão consolidado: **9 stories consecutivas QA Gate PASS à primeira** pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/**2.5**). Waiver rate Epic 2: **0%** (alvo <20%). Débito não-bloqueador para retrospectiva Epic 2: (i) `forceRerenderTick` pattern em CalendarBoard (alternativa `useState` custaria mais re-renders); (ii) `navButtonStyle()` function → const (~10 LOC cosmético); (iii) Coverage gaps defensivos CalendarBoard 85.67% linhas 250-252 + 421-443. Follow-up SECURITY fora de scope: Vercel API token exposto em untracked `docs/handoffs/.claude/settings.local.json` requer rotação separada (NÃO está em main).*
*Story 2.8 CLOSED por Pax (`@po`) em 17/05/2026 — **6/10 Done em main**. CRUD projectos UI entregue (FR29 + FR30 — FR30 já satisfeito por Story 2.3 filtro). 6 ficheiros novos (`/projectos/page.tsx` + 4 componentes Project* + 1 test file) + 1 modificado (`vitest.config.ts` allowlist coverage, precedente Story 2.3). 13 testes Vitest novos (T1-T12 + T12b), full suite 511/511 PASS. Quality gates locais 5/5 PASS à primeira (typecheck 0, lint 0, test:unit 511/511, build 0 com rota `/projectos` 8.36 kB, coverage page 73.71% ≥ 70% AC13 + components 91.76% + all-files 87.99%). QA Gate Quinn PASS à primeira (separação A6 — executor Dex, gate Quinn). 13/13 ACs honrados; 12 [AUTO-DECISION] A1-A12 documentadas (A5 declara delete fora-de-scope justificadamente). CI no PR #23 todos PASS, squash merge `bebbd530` em main 17/05/2026 19:20:17Z sem waiver. Padrão consolidado: **10 stories consecutivas QA Gate PASS à primeira** pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/2.5/**2.8**). Waiver rate Epic 2: **0%** (alvo <20% mantido com folga). 2 débitos registados em §10: **M1** (aria-describedby select status modal — Baixa) + **D6** (Delete projecto com cascata `Task.projectId` — Média, bloqueia funcionalidade plena, story dedicada recomendada).*
