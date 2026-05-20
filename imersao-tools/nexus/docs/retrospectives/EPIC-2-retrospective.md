# Retrospectiva — Epic 2 Nexus v2 (Tarefas v2 + Projectos)

> **Autor:** Pax (`@po`) | **Data:** 20/05/2026
> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Branch consolidação:** `main` (10 stories merged via PRs #18-#29)
> **Período:** 15/05/2026 00:10 → 20/05/2026 22:35 (UTC+1, Lisboa)
> **Referência de formato:** `retrospectives/EPIC-1-retrospective.md`

---

## 1. Sumário executivo

- **10/10 stories Done** em main (2.1 a 2.10) — Epic 2 fechado 100%.
- Cobertura funcional integral: FR9-FR15 + FR29-FR32. Os 5 Epic ACs (§6 do `EPIC-2.md`) satisfeitos.
- **Waiver rate final: 0%** (alvo da Retrospectiva Epic 1 era <20% — cumprido com folga; comparação directa: Epic 1 fechou com 50% "merge waived", 5/10).
- **QA/Architect Gate PASS first-iter em 10/10 stories** — nenhuma story consumiu `qa-loop-fix` (0/2 em todas).
- Pipeline cross-agent validado de ponta a ponta: `@pm` → `@sm` → `@po` → executor → quality gate → `@devops` → `@po` closure, com separação `executor != quality_gate` (regra A6) enforçada em todas as stories.
- **1 ADR local criado** — ADR-2.7-1 (mecanismo de activação do motor de recorrência, `useEffect` on-mount). Os 5 ADRs base da arquitectura Nexus v2 não foram reabertos.
- **Story 2.6 outlier** — única story do epic a precisar de uma 3.ª iteração CodeRabbit (Iter 3 excepcional, autorizada directamente pelo Eurico após hard-stop §8 atingido).
- **9 débitos não-bloqueadores acumulados** (D1-D7, M1, M2, D-2.7-1) — todos Baixa/Média, registados em `EPIC-2.md` §10 e endereçados na §4 deste documento.
- **Vercel production live** continuamente em `https://imersao.ia.expressia.pt` (desde Epic 0, 04/05/2026).

---

## 2. Métricas concretas

### 2.1 — Stories e iterações CodeRabbit

| Métrica | Valor | Observação |
|---------|-------|------------|
| Total stories | 10 | 2.1 → 2.10 |
| Stories first-iter PASS no quality gate | **10/10** | Todas PASS no primeiro gate, 0/2 `qa-loop-fix` consumidas |
| Stories com 0-1 iter CodeRabbit no PR | 7 | 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 2.9 |
| Stories com 2 iter CodeRabbit no PR | 2 | 2.7, 2.10 (Architect Gate — backend/lógica de domínio) |
| Stories com 3 iter CodeRabbit no PR | 1 | **2.6** (outlier — Iter 3 excepcional autorizada pelo Eurico) |
| Hard-stop max-2-iter respeitado | 9/10 | Story 2.6 foi a única excepção, com autorização explícita do Eurico |
| Waiver rate ("merge waived") | **0%** (0/10) | Story 2.6 fechou via "Opção A" pós-Iter-3-verde, não waiver de CHANGES_REQUESTED stale |

> **Nota sobre "quality gate" vs "CodeRabbit":** o quality gate AIOX (QA Gate Quinn / Architect Gate Aria) passou à primeira em 10/10 stories. As iterações CodeRabbit acontecem **depois** do gate, no ciclo do PR — são uma camada distinta. A distinção entre `qa-loop-fix` (gate) e iterações CR (PR) é a mesma da Retrospectiva Epic 1 (lição registada para Story 1.10).

### 2.2 — Velocidade do epic

| Métrica | Valor |
|---------|-------|
| Início Epic 2 (commit criação `6c494b19` PR #16) | 15/05/2026 00:10 |
| Story 2.1 merged (PR #18 `86ddb6a6`) | 15/05/2026 11:56 |
| Story 2.10 merged (PR #29 `fbc337cb`) | 20/05/2026 22:35 |
| **Duração total** | **~6 dias corridos** |
| Stories/dia (média) | 1,67 |
| Story mais rápida (mesmo dia de merge da anterior) | 2.2 (merged 15/05, mesmo dia que 2.1) |

### 2.3 — Cronologia de merges em main

| Story | PR | Squash commit | Data de merge |
|-------|-----|---------------|---------------|
| 2.1 — Schema tarefas/projectos | #18 | `86ddb6a6` | 15/05/2026 11:56 |
| 2.2 — Migration v1→v2 | #19 | `eee859f9` | 15/05/2026 23:13 |
| 2.3 — Vista lista | #20 | `667c1dac` | 16/05/2026 15:40 |
| 2.4 — Vista Kanban | #21 | `2a5f0dbd` | 16/05/2026 23:13 |
| 2.5 — Vista calendário semanal | #22 | `29e08106` | 17/05/2026 13:09 |
| 2.8 — CRUD projectos | #23 | `bebbd530` | 17/05/2026 20:20 |
| 2.9 — Vista projecto | #25 | `d2acca51` | 18/05/2026 20:59 |
| 2.6 — Sistema de tags global | #27 | `401ee594` | 20/05/2026 16:15 |
| 2.7 — Motor de recorrência | #28 | `d977ade1` | 20/05/2026 22:20 |
| 2.10 — Tools cérebro tarefas/projectos | #29 | `fbc337cb` | 20/05/2026 22:35 |

> Ordem de merge ≠ ordem numérica das stories: 2.8 mergeada antes de 2.6/2.7, e 2.9 antes de 2.6/2.7/2.10. Reflecte a paralelizabilidade das stories independentes (2.6, 2.7, 2.10) confirmada no `EPIC-2.md` §10.

### 2.4 — Evolução da suite de testes

| Marco | Testes (test:unit) | Ficheiros | Fonte |
|-------|--------------------|-----------|-------|
| Story 2.1 (início Epic 2) | 392/392 | 32 | Story 2.1 Change Log |
| Story 2.4 | 466/466 | — | Story 2.4 Change Log |
| Story 2.5 | 498/498 | — | Story 2.5 Change Log |
| Story 2.8 | 511/511 | — | Story 2.8 Change Log |
| Story 2.9 | 529/529 | — | Story 2.9 Change Log |
| Story 2.6 (pós CR Iter 3) | 557/557 | — | Story 2.6 closure |
| Story 2.7 (Architect Gate) | 588/588 (31 testes 2.7) | 50 | Architect Gate Aria |
| Story 2.10 (Architect Gate) | 585/585 (28 testes 2.10) | — | Architect Gate Aria |
| **Estado final em main** (pós-rebase 2.10) | **631/631** | **52** | INDEX — push `@devops` PR #29 |

**Delta Epic 2: +239 testes** (392 → 631). Crescimento de 61% na suite de testes ao longo do epic.

### 2.5 — Cobertura

Todas as stories cumpriram NFR17 (>=60% em packages core) e os thresholds AC15 por story. Exemplos verificados nos quality gates:
- Story 2.7 — `recurrence.ts` 98,58% / `RecurrenceFieldset.tsx` 98,38% / `lib/tarefas` 100% / all-files 89,46%.
- Story 2.10 — `lib/agent/tools` 99,36% / all-files 89,14%.
- Story 2.9 — `page.tsx` 99,31% / `ProjectTaskRow` 100% / all-files 88,76%.

All-files coverage manteve-se na faixa 87-89% durante todo o epic — acima do alvo NFR17 com folga consistente.

---

## 3. Loved — o que funcionou bem

### 3.1 — Padrão first-iter consolidado: 12 stories consecutivas QA Gate PASS

O `EPIC-2.md` §5 documenta **12 stories consecutivas QA Gate PASS à primeira** pós-PO Validation GO (1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.3, 2.4, 2.5, 2.8, 2.9, 2.6), prolongado para 2.7 e 2.10 no Architect Gate. **Evidência:** todas as stories Epic 2 com handoff `qa-PASS` ou `architect-gate-PASS` no `archive/`, todas indicando "0/2 qa-loop-fix consumidas". Esta consistência valida que o pipeline `@sm` draft → `@po` validate → executor develop está calibrado: stories chegam ao gate sem retrabalho.

### 3.2 — Waiver rate 0% — acção A5 da Retrospectiva Epic 1 cumprida

A Retrospectiva Epic 1 fixou como alvo reduzir o "merge waived" de 50% para <20% (acção A5). O Epic 2 fechou com **0%**. Nenhuma story foi merged com `reviewDecision: CHANGES_REQUESTED` stale ignorado por waiver. Os PRs com iterações CR (2.6, 2.7, 2.10) foram resolvidos com fixes reais até o CodeRabbit ficar verde — não com escape de waiver. **Evidência:** handoffs `archive/RETOMA-20260520-story-2.{6,7,10}-cr-iter2-fixes-*` — todos terminam em "CodeRabbit Iter N verde, sem waiver".

### 3.3 — Reuso de padrões entre stories de UI reduziu retrabalho

A Story 2.5 (calendário) reaproveitou 1:1 o padrão da Story 2.4 (Kanban): factory pura `createKanbanDragEndHandler`/`createCalendarDragEndHandler`, `overridesRef`, `inFlightByTaskRef` mutation token, DndContext + sensors + announcements PT-PT, optimistic UI + rollback. **Evidência:** Story 2.5 closure no `EPIC-2.md` — "Padrão 2.4 reaproveitado 1:1". O mesmo aconteceu com Story 2.6 (reuse de `ProjectFormModal` da Story 2.8) e Story 2.9 (reuse de componentes `Project*`). O reuso explícito de padrões validados é o que torna o first-iter PASS sustentável.

### 3.4 — Separação executor ≠ quality gate (regra A6) aplicada universalmente

A regra `separation-of-roles.md` (criada na acção A6 da Retrospectiva Epic 1) foi aplicada em 10/10 stories. Casos notáveis:
- Stories de UI (2.3, 2.4, 2.5) — executor `@ux-design-expert` (Uma), gate `@dev` (Dex).
- Story 2.1 — executor `@data-engineer` (Dara), gate `@qa` (Quinn) — escalação A6 porque o gate natural (`@dev`) tinha sobreposição de domínio.
- Stories 2.7 e 2.10 (backend/lógica de domínio sem UI auditável por `@qa`) — executor `@dev` (Dex), gate `@architect` (Aria).

**Evidência:** `EPIC-2.md` §5 tabela executor/quality-gate + handoffs de cada gate. A matriz de escalação da regra A6 funcionou sem ambiguidade.

### 3.5 — Reconciliação PRD ↔ arquitectura feita à cabeça (Story 2.1)

A Story 2.1 reconciliou explicitamente a divergência "schema localStorage" (PRD) vs "Dexie 4 IndexedDB" (ADR-2) antes de implementar — `EPIC-2.md` §7. Resultado: zero retrabalho de schema ao longo do epic. As 9 stories seguintes assentaram sobre o schema da 2.1 sem reabertura.

### 3.6 — Handoff lifecycle disciplinado

Todos os handoffs do epic seguiram `handoff-location.md` e `handoff-central.md`: criados em `imersao-tools/nexus/docs/handoffs/`, consumidos, arquivados em `archive/`, INDEX actualizado a cada transição. **Evidência:** 45+ handoffs Epic 2 em `archive/`, INDEX `Pending`/`Archived` sincronizado.

---

## 4. Os 9 débitos não-bloqueadores acumulados

Todos registados em `EPIC-2.md` §10. Nenhum é bloqueador. Tabela com severidade, origem e recomendação:

| # | Débito | Severidade | Origem | Recomendação de endereçamento |
|---|--------|-----------|--------|-------------------------------|
| D1 | Teste de cenário "JSON malformado em `localStorage.nexus_tasks` → migration retorna `no-data` graciosamente" (cobre linhas 72-74 de `v1-to-v2.ts`) | Baixa | Story 2.2 — débito pré-existente Story 0.3 (`git blame c362b171`). Coverage agregada de `v1-to-v2.ts` é 96,22% sem o teste | Absorver na Story 8.10 (Epic 8 cleanup) ou story de débito técnico dedicada |
| D2 | `@dnd-kit/utilities` usado em `KanbanCard.tsx` mas não declarado explicitamente em `package.json` (transitiva via `@dnd-kit/sortable`) | Baixa | Story 2.4 — PA1 do QA Gate. Funciona em build + dev | Declarar dep explícita num PR de manutenção de dependências |
| D3 | `PRIORITY_COLORS` duplicado entre componentes — parcialmente resolvido na Story 2.9 via extracção de `lib/tarefas/colors.ts` | Baixa | Story 2.4 — PA2 do QA Gate. Resolução parcial confirmada na Story 2.9 (`colors.ts` consumido pelo novo `ProjectTaskRow`) | Consolidar restantes consumidores em `lib/tarefas/colors.ts` quando 3+ componentes precisarem |
| D4 | Toast de erro primitivo (`setTimeout` 4s, sem biblioteca) no `KanbanBoard.tsx` | Baixa | Story 2.4 — PA3 do QA Gate. a11y OK (`role="status"` + `aria-live`) | Sistema toast unificado futuro — sem prioridade definida |
| D5 | E2E Playwright para drag manual ponta-a-ponta (Kanban + calendário) | Baixa | Story 2.4 — PA4 do QA Gate. 12 testes Vitest cobrem o handler factory | Criar E2E suite de drag quando o volume de UI features o justificar |
| D6 | Delete projecto com cascata `Task.projectId` — política e implementação (set null vs bloquear vs cascade delete). O repo `projects.ts` só tem `archiveProject` (status → `paused`), sem hard delete | **Média** | Story 2.8 — A5 declarou delete fora-de-scope. Bloqueia gestão plena de projectos | **Candidato forte a story dedicada** (sugestão recorrente: Story 2.11 técnica) ou integração no início do próximo epic |
| D7 | Fallback de intent vazio em PT-BR no classifier — prompt vago ("avança") produz resposta em PT-BR com emojis, violando `language-standards.md` e `output-format-standards.md` | **Média** | Observado em produção `https://imersao.ia.expressia.pt` 18/05/2026 pós-hotfix PR #24. UX visível na primeira interacção | **Candidato forte a story dedicada** — forçar PT-PT no system prompt do classifier + template fixo PT-PT + test anti-PT-BR (regex) |
| M1 | `aria-describedby` ausente no select `status` do `ProjectFormModal.tsx:268-279` (`aria-invalid` presente, falta `aria-describedby`) | Baixa | Story 2.8 — QA Gate CONCERN minor. Impacto prático quase nulo (select enum fechado de 3 opções) | Fix em qualquer story futura que toque o modal |
| M2 | Divergência label "Feita" (canónico `STATUS_LABELS_PT.done`) vs "Concluídas" (AC4/AC11 e comments da Story 2.9). Sem erro de comportamento — apenas inconsistência docs/AC vs código | Baixa | Story 2.9 — QA Gate CONCERN novo Quinn. Recomendação Pax: opção (i) alinhar AC/comments para "Feita" (menor risco) | Alinhamento documental num PR de manutenção; não justifica refactor de código |
| D-2.7-1 | Ligação do `RecurrenceFieldset` ao formulário "+ Nova" de tarefa — a Story 2.7 entregou o componente standalone e o helper `cancelTaskRecurrence`, mas a ligação ao `onSubmit` ficou diferida (não existe `TaskFormModal`; botão "+ Nova" `disabled` desde Story 2.4 A4) | Baixa | Story 2.7 — Architect Gate, [AUTO-DECISION A11] ratificada como decisão correcta (não scope-creep) | Endereçar na story futura que adicionar o formulário "+ Nova" de tarefa — o `RecurrenceFieldset` é injectável sem refactor |

**Síntese:** 7 débitos Baixa + 2 débitos Média (D6, D7). **D6 e D7 são os candidatos mais fortes a uma story dedicada** — recomendação recorrente nas closures de "Story 2.11 técnica". D6 bloqueia funcionalidade plena de gestão de projectos; D7 é UX visível em produção na primeira interacção do utilizador.

---

## 5. Learned — lições do epic

### 5.1 — Story 2.6 outlier: a 3.ª iteração CodeRabbit e o hard-stop §8

| Item | Detalhe |
|------|---------|
| **Onde** | Story 2.6 (Sistema de tags global), PR #27, 20/05/2026 |
| **Sintoma** | CodeRabbit Iter 1 CHANGES_REQUESTED (6 findings) → Dex Iter 2 (`9e10f317`) → CR Iter 2 CHANGES_REQUESTED (2 actionables + nitpicks). Hard-stop `EPIC-2.md` §8 (máx. 2 iterações `qa-loop-fix`) atingido |
| **Decisão** | Escalação a `@devops` → Eurico autorizou **Iter 3 excepcional** (decisão directa, Opção C). Dex Iter 3 (`81bf6c6b`) — A1 Major a11y roving tabindex + A2 Minor test. CR Iter 3 re-corrida verde |
| **Lição** | O hard-stop de 2 iterações funcionou como mecanismo de controlo — forçou a escalação humana em vez de loop infinito. A Iter 3 só aconteceu com autorização explícita. O processo de escalação está calibrado. Mas a Story 2.6 mostra que **stories de UI com componentes a11y interactivos (radiogroup, roving tabindex) tendem a gerar findings CR de a11y que não aparecem no QA Gate** — o QA Gate validou a11y como PASS, o CR encontrou um Major de roving tabindex |
| **Acção** | Ver **A1** |

### 5.2 — Contaminação de contagem de testes em worktrees paralelos (Stories 2.7 / 2.10)

| Item | Detalhe |
|------|---------|
| **Onde** | Stories 2.7 e 2.10, Architect Gates, 20/05/2026 |
| **Sintoma** | O `@dev` reportou `test:unit 616/616` para a Story 2.7. A Aria, ao correr o Architect Gate em worktree dedicado isolado, obteve **588/588** — os 31 testes da 2.7 verificados isoladamente 31/31 PASS. A diferença (616 vs 588) era contaminação: o número 616 incluía testes da Story 2.10 desenvolvida em paralelo noutro worktree |
| **Causa raiz** | Stories 2.7 e 2.10 desenvolvidas em paralelo (ambas independentes, ambas merged 20/05 com 15 min de intervalo). A contagem `test:unit` reportada pelo `@dev` num ambiente não confirma de qual branch/worktree saiu |
| **Mitigação aplicada** | A Aria correu os gates em worktrees dedicados isolados (`ecosistema-gate-2.7` e separado para 2.10) e verificou os testes da story isoladamente. **A mitigação funcionou** — o Architect Gate apanhou a imprecisão (documentada como PA-5 sem impacto) |
| **Lição** | Quando há stories desenvolvidas em paralelo, a contagem de testes só é fiável se corrida num worktree limpo isolado da branch da story. O número agregado de `test:unit` não identifica a origem. O quality gate deve sempre reproduzir num worktree limpo — foi o que evitou que a imprecisão passasse para a retrospectiva como métrica errada |
| **Acção** | Ver **A2** |

### 5.3 — ADR-2.7-1: divergência PRD/EPIC ↔ arquitectura resolvida sem reabrir ADRs base

| Item | Detalhe |
|------|---------|
| **Onde** | Story 2.7 (Motor de recorrência), 20/05/2026 |
| **Sintoma** | GAP-1: o `EPIC-2.md` §7 dizia "cron client-side via `setInterval`/`requestIdleCallback`"; o `architecture-v2.md` §16 não tinha ADR específico |
| **Resolução** | ADR-2.7-1 — activação do motor via hook `useRecurrenceEngine` com `useEffect` one-shot on-mount. Decisão local, não reabre nenhum dos 5 ADRs base |
| **Lição** | O mecanismo de ADR local para resolver GAPs de story funcionou. A divergência PRD vs arquitectura foi escalada a `@architect` antes de implementar (conforme `EPIC-2.md` §7) — exactamente como a regra prevê. ADRs locais por story são a forma correcta de fechar GAPs sem tocar nas decisões fundacionais |

### 5.4 — D7: bug de produção detectado mas não absorvido no epic

| Item | Detalhe |
|------|---------|
| **Onde** | Produção `https://imersao.ia.expressia.pt`, 18/05/2026, pós-hotfix PR #24 |
| **Sintoma** | Fallback de intent vazio responde em PT-BR com emojis — viola `language-standards.md` (PT-PT obrigatório) e `output-format-standards.md` |
| **Decisão** | Registado como débito D7 (Média), não absorvido numa story do Epic 2 |
| **Lição** | O Epic 2 era CRUD de tarefas/projectos — D7 é do domínio do classifier (Epic 1). Não forçar D7 dentro do Epic 2 foi a decisão de scope correcta (alinha com Constitution Artigo IV — No Invention). Mas D7 é UX visível em produção: **não deve ficar indefinidamente em backlog**. É candidato a hotfix ou a story dedicada antes do próximo epic |
| **Acção** | Ver **A3** |

### 5.5 — Acções A1/A2/A6 da Retrospectiva Epic 1 — verificação de aplicação

| Acção Epic 1 | Estado no Epic 2 |
|--------------|------------------|
| A1 — `mock-protocol-fidelity.md` | Regra existe. Epic 2 é CRUD interno sem mocks de protocolos externos — a regra foi avaliada `N/A` em cada quality gate (2.7, 2.10 confirmam "mock-protocol-fidelity N/A"). Demonstração plena encaixa no Epic 6 (OAuth), como o `EPIC-2.md` §8 já antecipava honestamente |
| A2 — Not-Tested Evidence Gate (`not-tested-trailer-rules.md`) | Regra existe e foi aplicada. Story 2.10 tocou `vitest.config.ts` (`coverage.include`) — o Architect Gate classificou correctamente como não-bloqueador (`thresholds` intacto). Nenhum commit Epic 2 usou `Not-tested:` em path bloqueador sem evidência |
| A6 — `separation-of-roles.md` | Aplicada em 10/10 stories — ver §3.4 |

**As três acções da Retrospectiva Epic 1 foram efectivamente integradas no processo do Epic 2.** É a primeira evidência de que o ciclo de retrospectiva → regra → aplicação funciona.

---

## 6. Lacked — o que faltou

### 6.1 — Sem story técnica para débitos Média (D6, D7)

D6 (delete projecto com cascata) e D7 (fallback PT-BR) são Média e arrastam-se. A sugestão "Story 2.11 técnica" aparece repetidamente nas closures mas nunca foi formalizada. O Epic 2 fechou 10/10 sem absorver os débitos Média. — **Acção A4**.

### 6.2 — QA Gate não apanha findings de a11y que o CodeRabbit apanha

Story 2.6 — o QA Gate Quinn deu PASS com a11y validada; o CodeRabbit Iter 2 encontrou um Major de roving tabindex. Há um gap entre o que o QA Gate verifica em a11y e o que o CR verifica. — **Acção A1**.

### 6.3 — Contagem de testes reportada pelo `@dev` não é fiável em desenvolvimento paralelo

Ver §5.2. Não há convenção formal de "reportar contagem só de worktree limpo isolado". — **Acção A2**.

---

## 7. Decisões accionáveis

| # | Acção | Owner | Deadline | Done quando |
|---|-------|-------|----------|-------------|
| **A1** | Reforçar o checklist de a11y do QA Gate para stories de UI com componentes interactivos (radiogroup, roving tabindex, drag-and-drop): incluir verificação explícita de navegação por teclado e roving tabindex. Objectivo: o QA Gate apanhar findings de a11y antes do CodeRabbit, reduzindo iterações CR em stories de UI. | `@qa` (Quinn) | **Antes do próximo epic com UI** | Checklist QA Gate inclui secção a11y interactiva + 1 story de UI fecha sem finding CR de a11y |
| **A2** | Adicionar ao `story-tmpl.yaml` (ou à convenção de Change Log) a obrigação de a contagem `test:unit` reportada pelo executor identificar a branch/worktree de origem. Em desenvolvimento paralelo, o quality gate reproduz sempre num worktree limpo isolado. | `@sm` (River) | **Antes do próximo epic** | Template/convenção alterada + 1 story de epic paralelizável aplica a convenção |
| **A3** | Avaliar D7 (fallback intent vazio PT-BR) como hotfix ou story dedicada — é UX visível em produção. Decisão: hotfix imediato via SOP Hotfix, OU primeira story técnica do próximo ciclo. Não deixar em backlog indefinido. | Eurico + `@pm` (Morgan) | **Antes do próximo epic** | D7 tem destino decidido (hotfix agendado ou story criada) |
| **A4** | Decidir o destino dos débitos Média D6 (delete projecto cascata) + D7: criar Story 2.11 técnica que os agrupe, OU integrá-los no arranque do próximo epic. Os 7 débitos Baixa podem ficar em backlog de manutenção. | `@pm` (Morgan) + `@po` (Pax) | **No arranque do próximo epic** | D6 e D7 têm story ou epic-slot atribuído; débitos Baixa registados em backlog |
| **A5** | Memory log: actualizar `project_nexus_v2_producao.md` (ou criar entrada equivalente) com Epic 2 = 10/10 Done, waiver rate 0%, PRs #18-#29, e referência a esta retrospectiva. | `@aiox-master` (Orion) ou Eurico | **20/05/2026** | MEMORY.md actualizado + entrada tem ref a este documento |
| **A6** | Eurico decide o próximo epic: Epic 3 (Finanças) ou Epic 4 (Hábitos + Metas + Lembretes). Ordem PRD §9: `2 \|\| 3 → 4` — Epic 3 e Epic 4 paralelizáveis. Epic 4 reutiliza o motor de recorrência da Story 2.7 (`runRecurrenceEngine` genérico por `ownerType`). | Eurico | **Próxima sessão** | Epic escolhido → `@pm *create-epic {N}` |

---

## 8. Comparação Epic 1 vs Epic 2

| Métrica | Epic 1 | Epic 2 | Delta |
|---------|--------|--------|-------|
| Stories | 10 (1.1-1.10) | 10 (2.1-2.10) | igual |
| Duração | 7 dias (05/05 → 12/05) | ~6 dias (15/05 → 20/05) | -1 dia |
| Waiver rate ("merge waived") | 50% (5/10) | **0% (0/10)** | **-50pp — alvo A5 cumprido** |
| Quality gate PASS first-iter | — (não medido isoladamente) | 10/10 | melhoria de processo |
| Story outlier | 1.10 (5 iter CI, 3 dias) | 2.6 (3 iter CR, autorizada) | outlier menos severo |
| Bugs produção pós-deploy dentro do epic | 0 (1 hotfix fora — PR #15) | 0 dentro do epic (D7 detectado em produção, registado como débito) | comparável |
| ADRs reabertos | 0 | 0 | igual |
| ADRs locais criados | — | 1 (ADR-2.7-1) | — |
| Retrospectiva escrita | SIM | SIM (este documento) | igual |
| Acções da retrospectiva anterior aplicadas | n/a | A1, A2, A6 efectivamente integradas | ciclo de melhoria validado |

**Conclusão da comparação:** o Epic 2 foi mais rápido, com waiver rate drasticamente menor (0% vs 50%) e outlier menos severo. As acções da Retrospectiva Epic 1 foram aplicadas — o ciclo retrospectiva → regra → aplicação produz resultados mensuráveis.

---

## 9. Próximas acções na sequência Pax

1. **`@aiox-master` (Orion) ou Eurico** — executa **A5**: actualiza memória com Epic 2 = 10/10.
2. **Eurico** — executa **A6**: decide próximo epic (3 ou 4) → `@pm *create-epic {N}`.
3. **`@pm` (Morgan) + `@po` (Pax)** — executam **A4** no arranque do próximo epic: destino de D6 + D7.
4. **`@devops` (Gage)** — faz push do commit de closure da retrospectiva (docs-only).

---

## 10. Convenções desta retrospectiva

| Regra | Verificação |
|-------|-------------|
| `workspace-governance.md` | Documento em `imersao-tools/nexus/docs/retrospectives/` (categoria 2: Projectos Próprios) — OK |
| `language-standards.md` | PT-PT, datas DD/MM/YYYY, separador decimal vírgula, sem PT-BR — OK |
| `output-format-standards.md` | Tabelas ASCII markdown, sem emojis, sem preâmbulo — OK |
| `mandatory-change-log.md` | Decisões A1-A6 com owner + deadline + done — OK |
| `separation-of-roles.md` | Retrospectiva é trabalho de `@po`; não há quality gate sobre si mesma — documento de processo, não de implementação |
| Constitution Artigo IV (No Invention) | Todas as métricas derivadas de `git log` real, `EPIC-2.md`, stories `completed/`, handoffs `archive/`. Dados não verificáveis não foram inventados |

---

**Documento criado por:** Pax (`@po`) em 20/05/2026
**Sources verificados:**
- `git log --format="%H %ai %s"` em `ecosistema-ia-avancada-pt` (squash commits PRs #18-#29)
- `imersao-tools/nexus/docs/EPIC-2.md` (10/10 COMPLETO, §5 progresso, §10 débitos)
- `imersao-tools/nexus/docs/stories/completed/2.1-2.10.story.md` (Change Logs, contagens de teste)
- `imersao-tools/nexus/docs/handoffs/archive/` (45+ handoffs Epic 2)
- `imersao-tools/nexus/docs/handoffs/INDEX.md`
- `imersao-tools/nexus/docs/retrospectives/EPIC-1-retrospective.md` (referência de formato e baseline)
