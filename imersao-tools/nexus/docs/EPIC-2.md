# Epic 2 — Tarefas v2 + Projectos

> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Criado por:** Morgan (`@pm`) em 14/05/2026
> **Estado:** Em curso — **8/10 stories Done** (Stories 2.1 + 2.2 + 2.3 + 2.4 + 2.5 + 2.8 + 2.9 MERGED em main 15-18/05/2026 via PRs #18 / #19 / #20 / #21 / #22 / #23 / #25; Story 2.6 CLOSED 20/05/2026 — aguarda `@devops *push feature/2.6-tags-global`)
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

> **Progresso:** **8/10 Done · 2/10 Pending**. Stories 2.1+2.2+2.3+2.4+2.5+2.8+2.9 MERGED em main (PRs #18/#19/#20/#21/#22/#23/#25 squash). Story 2.6 CLOSED por Pax 20/05/2026 (aguarda `@devops *push`). Story 2.9 squash `d2acca51` em 18/05/2026 19:59:11Z (1ª iteração PASS sem waiver). Padrão consolidado: **12 stories consecutivas QA Gate PASS à primeira** pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/2.5/2.8/2.9/2.6). Waiver rate Epic 2 actual: **0%** (alvo <20% — abaixo do limite).

| # | Story | Descrição | FR | Executor previsto | Quality gate previsto | Estado |
|---|-------|-----------|-----|-------------------|------------------------|--------|
| 2.1 | Schema tarefas/projectos | Schema Dexie `tasks`, `task_recurrences`, `tags`, `task_tags`, `projects` — estende schema Story 1.1 conforme `architecture-v2.md` | FR9, FR10, FR30 | `@data-engineer` | `@dev` (gate real: `@qa` Quinn) | **Done** (CLOSED 15/05) |
| 2.2 | Migration v1 → v2 | Migrar dados de tarefas do `localStorage` v1 (`nexus_tasks`) para o schema Dexie v2 | FR9 | `@dev` | `@data-engineer` | **Done** (CLOSED 15/05) |
| 2.3 | Vista lista | Refactor da vista lista v1; secção dedicada de atrasadas | FR9, FR11, FR13 | `@ux-design-expert` | `@dev` | **Done (CLOSED 15/05)** — aguarda `@devops *push` |
| 2.4 | Vista Kanban | Colunas customizáveis + drag-and-drop com `dnd-kit` | FR11, FR12 | `@ux-design-expert` | `@dev` | **Done MERGED 16/05** (PR #21 squash `2a5f0dbd`) |
| 2.5 | Vista calendário semanal | Calendário semanal com drag entre dias | FR11, FR12 | `@ux-design-expert` | `@dev` | **Done MERGED 17/05** (PR #22 squash `29e08106`) |
| 2.6 | Sistema de tags global | Criar, listar, filtrar tags partilhadas | FR14 | `@dev` | `@qa` | **Done** (CLOSED por Pax 20/05/2026 — commit código `647baa58`, QA Gate PASS first-iter, aguarda `@devops *push feature/2.6-tags-global`) |
| 2.7 | Geração de instâncias recorrentes | Motor de recorrência client-side (`requestIdleCallback`/`setInterval`) — horizonte 90 dias | FR10 | `@dev` | `@architect` | Pending |
| 2.8 | CRUD projectos | Criar, editar, listar, arquivar projectos | FR29, FR30 | `@dev` | `@qa` | **Done MERGED 17/05** (PR #23 squash `bebbd530`) |
| 2.9 | Vista projecto | Tarefas vinculadas em vista lista + Kanban filtrado | FR31 | `@dev` (executor real, separação A6 mantida: gate Quinn `@qa`) | `@qa` | **Done MERGED 18/05** (PR #25 squash `d2acca51`) |
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

**Story 2.6 CLOSED 20/05/2026** — Sistema de tags global (FR14) fechada por Pax (`@po`) após QA Gate PASS first-iter de Quinn (`@qa`). DoD 15/15 PASS. Story movida para `imersao-tools/nexus/docs/stories/completed/2.6.story.md` v0.5 (Status: Done). Epic 2 a **8/10 Done** + 2/10 Pending (Stories 2.7, 2.10).

Sequência actual:

```text
@devops *push feature/2.6-tags-global  (Gage — push + PR + CR + merge — PRÓXIMO PASSO OBRIGATÓRIO)
```

Após o merge da Story 2.6, restam 2 stories Pending:

Sequência paralelizável (após Story 2.6 validada por Pax, ou em terminal separado):

```text
@sm *draft 2.7 (Motor de recorrência — independente, FR10)
@sm *draft 2.10 (Tools cérebro tarefas/projectos — independente, FR15+FR32)
```

Stories 2.7 e 2.10 podem ser draftadas em paralelo em branches distintas — independentes da Story 2.6.

Sequência herdada:
- Stories 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.8 → 2.9 — **todas em main** (schema → migration → UI Lista → UI Kanban → UI Calendário → CRUD projectos → Vista projecto).
- 2.6 (Tags global) independente.
- 2.7 (Motor de recorrência) independente.
- 2.10 (tools cérebro) — 2.1 + 2.8 em main, agora desbloqueada (pode ainda esperar por 2.6/2.7 se quiser tools de tags/recorrência incluídas na primeira leva).

Alternativa estratégica: `@po *retrospective epic-2-intermedia` (7/10 — retrospectiva intermédia antes de fechar o épico) para capturar lições antes das últimas 3 stories.

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
| **D7** | **Fallback de intent vazio em PT-BR no classifier** — quando o utilizador escreve prompt vago (ex.: "avança"/"AVANÇA"), o parser não parte (hotfix PR #24 OK) mas a resposta de fallback vem em PT-BR com emojis. Exemplo capturado em produção: *"Parece que sua mensagem foi curta 😊 Pode me dar mais contexto? O que você gostaria que eu avançasse ou explicasse? Por exemplo: - Continuar um texto ou código? - Avançar em um tema específico? - Outra coisa? É só me dizer! 🚀"* Violações: `language-standards.md` (PT-PT obrigatório, "você"/"sua"/"em um" proibidos — deveria ser "tu"/"a tua"/"num") + `output-format-standards.md` (emojis em outputs de sistema desencorajados, max 1 por linha). Causa raiz suspeita: system prompt do classifier ou handler de intent-vazio não força PT-PT, deixa o LLM (Haiku 4.5 tende a PT-BR) responder no dialecto default. Solução proposta: (i) forçar PT-PT no system prompt do classifier (instrução explícita "Responde sempre em Português Europeu — usa 'tu'/'a tua', nunca 'você'/'sua'"); (ii) template fixo PT-PT para resposta de intent vazio (sem emojis); (iii) test anti-PT-BR (regex bloqueia "você"/"sua"/"em um"). | Observado em produção `https://imersao.ia.expressia.pt` em 18/05/2026 pós-hotfix PR #24 (`eff7955d`). UX visível mas não bloqueia funcionalidade. | **Média** — UX visível em primeira interacção do utilizador. Endereçar em story dedicada (sugestão: 2.11 técnica) ou integrar em Story 2.9 (Vista projecto) se reduzir context-switch for prioritário. |
| **M2** | **Divergência label "Feita" vs "Concluídas" na vista projecto** — `lib/tarefas/colors.ts:39` define `STATUS_LABELS_PT.done = 'Feita'` (canónico Story 2.3 `TaskRow.tsx:31` + Story 2.4 `KanbanBoard.tsx:58` — "Feitas" no plural). Mas AC4/AC11 e comments do `app/(app)/projectos/[id]/page.tsx:26` da Story 2.9 (e comment do test T1:123) usam "Concluídas". Não há erro de comportamento — a label real renderizada vem de `STATUS_LABELS_PT.done` ("Feita"), os tests passam, a UX é coerente. Apenas inconsistência docs/AC vs vocabulário consolidado no codebase. Solução proposta: (i) alinhar AC4/AC11 e comments da Story 2.9 para "Feita/Feitas" (alinhamento docs ↔ código); OU (ii) adoptar "Concluídas" como novo canónico no codebase e refactor `STATUS_LABELS_PT.done = 'Concluída'` + actualizar `TaskRow.tsx` + `KanbanBoard.tsx` (mudança UX visível com risco de regressão de testes). Pax decide no closure commit Epic 2 — recomendação Pax: opção (i) (menor risco, alinha docs com vocabulário UX já consolidado em 4 stories). | Story 2.9 — Quinn `@qa` QA Gate CONCERN novo §4 (18/05/2026). Pax ratificou na PO Closure como débito M2 não-bloqueante. | **Baixa** — sem regressão funcional. Endereçar no closure commit Epic 2 ou em retrospectiva intermédia 7/10. |

---

*Epic 2 preparado por Morgan (`@pm`) em 14/05/2026. Ancorado em `PRD-NEXUS-V2.md` §10, `architecture-v2.md` (5 ADRs), e Retrospectiva Epic 1 (A1/A2/A6).*
*Story 2.1 CLOSED por Pax (`@po`) em 15/05/2026 — 1/10 Done.*
*Story 2.2 CLOSED por Pax (`@po`) em 15/05/2026 — 2/10 Done.*
*Story 2.3 CLOSED por Pax (`@po`) em 15/05/2026 — 3/10 Done. Primeira UI Epic 2 entregue (página `/tarefas` + 6 componentes + 2 helpers + 20 testes). Lições L1-L5 registadas para retrospectiva Epic 2. PA1-PA4 ratificados como não-bloqueadores (2 → retrospectiva, 2 → backlog Stories 2.4+2.6).*
*Story 2.4 CLOSED por Pax (`@po`) em 16/05/2026 — 4/10 Done (3 em main + 1 aguarda push). Vista Kanban entregue (3 componentes novos KanbanBoard+Column+Card + 12 testes Vitest + refactor cirúrgico `createKanbanDragEndHandler` factory pura). 5/5 quality gates locais PASS à primeira (lint, typecheck, test:unit 466/466, build, coverage 85.71%/83.84%/100%/87.4%). QA Gate Dex PASS à primeira (0/2 qa-loop-fix). DoD 15/15 PASS. 5/5 [AUTO-DECISION] A1-A5 ratificadas. 4 PAs/F1-F4 ratificados não-bloqueadores: D2 (`@dnd-kit/utilities` dep transitiva) + D3 (`PRIORITY_COLORS` duplicado refactor futuro) + D4 (toast primitivo) + D5 (E2E Playwright drag manual). Padrão consolidado: 8 stories consecutivas QA Gate PASS à primeira pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4).*
*Story 2.5 CLOSED por Pax (`@po`) em 17/05/2026 — **5/10 Done em main**, trio Lista/Kanban/Calendário fechado (FR11+FR12 ambos satisfeitos). Vista calendário semanal entregue (3 componentes novos CalendarBoard+Day+Card + 1 helper novo `weekRange.ts` + 30 testes Vitest novos: 14 calendar + 16 weekRange + actualização T9 em page.test.tsx). 5/5 quality gates locais PASS à primeira (lint, typecheck, test:unit 498/498, build, coverage 85.71%/100%/87.78%). QA Gate Dex PASS à primeira (separação A6 — executor Uma, gate Dex). Padrão 2.4 reaproveitado 1:1 (factory pura + `overridesRef` + **`inFlightByTaskRef` mutation token Iter 2** + DndContext+sensors+announcements PT-PT + optimistic UI + rollback). Discovery shape Task: `lastWorkedAt` é `number\|null` (epoch ms) — Uma corrigiu anti-hallucination minor da story v0.2, alinhado com repo `setTaskStatus`. CI todos PASS (Lint, Vitest, Playwright E2E, 50-prompt regression, Coverage, CodeQL ×2, CodeRabbit, Vercel). Squash merge `29e08106` PR #22 sem waiver. Padrão consolidado: **9 stories consecutivas QA Gate PASS à primeira** pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/**2.5**). Waiver rate Epic 2: **0%** (alvo <20%). Débito não-bloqueador para retrospectiva Epic 2: (i) `forceRerenderTick` pattern em CalendarBoard (alternativa `useState` custaria mais re-renders); (ii) `navButtonStyle()` function → const (~10 LOC cosmético); (iii) Coverage gaps defensivos CalendarBoard 85.67% linhas 250-252 + 421-443. Follow-up SECURITY fora de scope: Vercel API token exposto em untracked `docs/handoffs/.claude/settings.local.json` requer rotação separada (NÃO está em main).*
*Story 2.8 CLOSED por Pax (`@po`) em 17/05/2026 — **6/10 Done em main**. CRUD projectos UI entregue (FR29 + FR30 — FR30 já satisfeito por Story 2.3 filtro). 6 ficheiros novos (`/projectos/page.tsx` + 4 componentes Project* + 1 test file) + 1 modificado (`vitest.config.ts` allowlist coverage, precedente Story 2.3). 13 testes Vitest novos (T1-T12 + T12b), full suite 511/511 PASS. Quality gates locais 5/5 PASS à primeira (typecheck 0, lint 0, test:unit 511/511, build 0 com rota `/projectos` 8.36 kB, coverage page 73.71% ≥ 70% AC13 + components 91.76% + all-files 87.99%). QA Gate Quinn PASS à primeira (separação A6 — executor Dex, gate Quinn). 13/13 ACs honrados; 12 [AUTO-DECISION] A1-A12 documentadas (A5 declara delete fora-de-scope justificadamente). CI no PR #23 todos PASS, squash merge `bebbd530` em main 17/05/2026 19:20:17Z sem waiver. Padrão consolidado: **10 stories consecutivas QA Gate PASS à primeira** pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/2.5/**2.8**). Waiver rate Epic 2: **0%** (alvo <20% mantido com folga). 2 débitos registados em §10: **M1** (aria-describedby select status modal — Baixa) + **D6** (Delete projecto com cascata `Task.projectId` — Média, bloqueia funcionalidade plena, story dedicada recomendada).*
*Story 2.6 APPROVED por Pax (`@po`) em 19/05/2026 — **7/10 Done em main + 1/10 Approved**. Sistema de tags global (FR14) validada com **GO 10/10 sem F1** após draft v0.1 de River. PO-VALIDATION-STORY-2.6.md cobre 11 dimensões (Template, Executor, FileStructure, UI/Frontend, AC, Validation/Testing, Security N/A, Tasks Sequence, CodeRabbit, AntiHallucination 19 claims, Implementation Readiness — todas PASS). 12/12 AUTO-DECISIONS A1-A12 ratificadas (paleta restrita 7 cores design system, cascata atómica transacção `'rw'`, `window.confirm` PT-PT pré-delete, `updateTag` self-rename, `tagsLookup` permanece nas pages, etc.). 2 observações minor C1+C2 não-bloqueantes registadas como contexto para Dex (C1 off-by-one linha 114→113; C2 botão Cancelar via reuse 100% ProjectFormModal). Status story `Draft → Approved` (v0.2). Aguarda `@dev *develop 2.6` em modo YOLO.*

*Story 2.6 DRAFTED por River (`@sm`) em 19/05/2026 — **7/10 Done em main + 1/10 Draft**. Sistema de tags global (FR14) drafted v0.1 partindo de `main@40ea2351`. Scope verificado directamente em código: infraestrutura JÁ EXISTE (Stories 0.3 schema + 2.1 repo base + 2.3 wire-up `TasksFilters`). Story entrega apenas (1) extensão repo `tags.ts` (`updateTag` + cascata `deleteTag` atómica via transacção Dexie `'rw'`), (2) hook `useTags()`, (3) rota `/tags` CRUD UI (4 componentes novos `TagsHeader`/`TagsGrid`/`TagCard`/`TagFormModal`), (4) refactor cirúrgico `tarefas/page.tsx:68-69` + `projectos/[id]/page.tsx:~69` (`useLiveQuery(listTags, [])` → `useTags()`), (5) `lib/tags/colors.ts` com `TAG_PALETTE` 7 cores design system. 15 ACs + 12 [AUTO-DECISION] A1-A12 (rota dedicada, grid cards, reuse `ProjectFormModal`, paleta restrita inegociável, cascata atómica, `window.confirm` PT-PT pré-destrutivo, `updateTag` self-rename, contagem inline, empty state PT-PT, pesquisa client-side, ordenação alfabética pt-PT, `tagsLookup` permanece nas pages). ~16-18 testes Vitest planeados (T9 cascata real crítico, T18 smoke refactor não regrede). Anti-padrões 16 documentados. Aguarda `@po *validate-story-draft 2.6`.*

*Story 2.6 CLOSED por Pax (`@po`) em 20/05/2026 — **8/10 Done**. Sistema de tags global entregue (FR14 — rota `/tags` CRUD UI + 4 componentes `Tags*` + extensão repo `tags.ts` com `updateTag` + cascata `deleteTag` atómica via transacção Dexie `'rw'` + hook `useTags()` + `lib/tags/colors.ts` paleta 7 cores design system + refactor cirúrgico `tarefas/page.tsx` + `projectos/[id]/page.tsx` `useLiveQuery` → `useTags()`). 14 ficheiros de código/teste (10 novos + 3 modificados cirurgicamente + 1 config `vitest.config.ts` allowlist) commit `647baa58` em `feature/2.6-tags-global`. 27 testes Vitest novos (T1-T18), full suite **556/556 PASS**. Quality gates locais 5/5 PASS à primeira (lint exit 0 + 1 warning herdado fora-scope, typecheck 0, test:unit 556/556, build rota `/tags` 5.81 kB / 152 kB First Load, coverage page 96.69% + components 89.87% + lib/tags 88.23% + repo 100% + all-files 88.71% — todos os alvos AC15). QA Gate Quinn PASS first-iter 0/2 qa-loop-fix (separação A6 — executor Dex, gate Quinn). 15/15 ACs honrados; 16/16 anti-padrões livres; 12/12 [AUTO-DECISION] A1-A12 verificadas em código. DoD 15/15 PASS. 2 observações minor Q1+Q2 (exclusivamente documentais) ratificadas e corrigidas no closure commit — Q1 path File List/Testing/tasks `tests/unit/lib/db/repos/` → `tests/unit/db/repos/` (caminho real verificado via `git show --stat 647baa58`); Q2 redacção D2 reformulada para descrever fluxo real (re-throw `page.tsx:124` → catch interno `TagFormModal.tsx:152-167`). Sem débito residual. Padrão consolidado: **12 stories consecutivas QA Gate PASS à primeira** pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/2.5/2.8/2.9/**2.6**). Waiver rate Epic 2: **0%** (alvo <20% mantido com folga). Aguarda `@devops *push feature/2.6-tags-global`.*

*Story 2.9 CLOSED por Pax (`@po`) em 18/05/2026 — **7/10 Done em main**. Vista projecto entregue (FR31 — rota `/projectos/[id]` dinâmica + tabs Lista/Kanban WAI-ARIA + `ProjectFormModal` integração para Editar + progress bar Lime client-side + navegação a partir do `ProjectCard` via prop `onView`). 5 ficheiros novos (`/projectos/[id]/page.tsx` + `ProjectDetailHeader.tsx` + `ProjectTaskRow.tsx` + `lib/tarefas/colors.ts` + test file) + 3 modificados cirurgicamente (`ProjectCard.tsx` prop `onView` opcional + `ProjectsGrid.tsx` pass-through + `/projectos/page.tsx` `handleView`). 15 testes Vitest novos (T1-T13 com T7 expandido em T7a/T7b/T7c), full suite **529/529 PASS** (15 ficheiros novos + 514 anteriores). Quality gates locais 5/5 PASS à primeira (typecheck 0, lint 0+1 warning herdado fora-scope, test:unit 529/529, build 0 com rota `/projectos/[id]` 4.29 kB, coverage page **99.31%** lines + components/projectos/ **91.41%** + all-files **88.76%** + `ProjectTaskRow` **100%** + `lib/tarefas/colors.ts` **100%**). QA Gate Quinn PASS à primeira (separação A6 — executor Dex, gate Quinn). 15/15 ACs honrados; 12 [AUTO-DECISION] A1-A12 documentadas (A7 `ProjectTaskRow` novo justificado por 4 razões; A11 D3 parcialmente resolvida via extracção `colors.ts` consumida só pelo novo componente). CI no PR #25 todos PASS, squash merge `d2acca51` em main 18/05/2026 19:59:11Z sem waiver. Padrão consolidado: **11 stories consecutivas QA Gate PASS à primeira** pós-PO Validation GO (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/2.5/2.8/**2.9**). Waiver rate Epic 2: **0%** (alvo <20% mantido com folga). 1 débito novo registado em §10: **M2** (Divergência label "Feita" canónico vs "Concluídas" em AC/comments — Baixa, alinhamento no closure commit Epic 2). 6 CONCERNS Dex ratificados como Baixa não-bloqueantes (unhandled rejection T12, `ProjectCard` coverage 86.81% defensive branches, DnD Kanban sem E2E directo, single `db.projects.count()` justificado nas Dev Notes, D3 parcial deliberada, PT-PT validado).*
