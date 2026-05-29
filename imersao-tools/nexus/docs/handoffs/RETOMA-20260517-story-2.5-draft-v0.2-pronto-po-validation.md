# RETOMA — Story 2.5 Draft v0.2 (Mutation Token Iter 2 incorporado) · Pronto para PO Validation

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** River (`@sm`)
**Para:** Pax (`@po`) — `*validate-story-draft 2.5`
**Data:** 2026-05-17
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** PENDING (aguarda PO validation)

---

## Sumário executivo

Story 2.5 (Vista calendário semanal) **redraftada para v0.2** em resposta ao brief explícito do Eurico:

> `*draft 2.5 Reaproveitamento máximo: scaffold tabs Story 2.3 + dnd-kit Story 2.4 com mutation token Iter 2. triádico FR11`

A versão v0.1 (16/05/2026) já cobria scaffold tabs 2.3 e dnd-kit 2.4 mas **omitia o reaproveitamento explícito do mutation token Iter 2 fix da 2.4** — o exemplo de código `createCalendarDragEndHandler` replicava o bug original da Iter 1 (sem `inFlightByTaskRef`). Em drag rápido sequencial no calendário, este bug provocaria flicker visual e rollback fantasma.

**Termo "triádico" no brief = trio Lista/Kanban/Calendário do FR11**, não uma vista nova. Origem da expressão: recomendação Gage no `RETOMA-20260516-story-2.4-merged-next-stories.md` linha 117.

---

## Mudanças v0.1 → v0.2 (12 patches)

| # | Secção | Mudança |
|---|--------|---------|
| 1 | Header | Story points 5 mantido; bloqueio hard REMOVIDO (Story 2.4 já em `main` `2a5f0dbd`); branch sugerida actualizada para arrancar de `main` actualizado |
| 2 | Nota River sobre escopo | Item 5 novo: "Mutation token por task-id (Iter 2 fix race condition)" com trace canónico `KanbanBoard.tsx:85-91, :132-138, :286-289` |
| 3 | Acceptance Criteria | **Novo AC5b** — drag rápido sequencial não corrompe estado (mutation token); trace de implementação + test associado T13 |
| 4 | CodeRabbit Integration Focus Areas | Linha "Mutation token Iter 2 (AC5b)" adicionada |
| 5 | Tasks/Subtasks T1 | T1.1 actualizado (bloqueio removido); T1.4 explícito sobre ler `KanbanBoard.tsx` versão `2a5f0dbd` (NÃO Iter 1) |
| 6 | Tasks/Subtasks T7 | Renomeada para "Optimistic UI + Rollback + Mutation Token"; **novas T7.5 + T7.6** — `inFlightByTaskRef` na factory + incremento+captura+check stale |
| 7 | Tasks/Subtasks T9 | T9.2 actualizada (12 cenários em vez de 11); **nova T9.8** — pattern `mockImplementationOnce` para promises controladas |
| 8 | AC11 lista de testes | **Novo T13** — Mutation token / drag rápido sequencial (AC5b) |
| 9 | Padrão dnd-kit (exemplo de código) | Factory `createCalendarDragEndHandler` reescrita: signature inclui `inFlightByTaskRef`, lógica de incremento+captura antes do `await`, check `=== mutationId` no `.then` e `.catch` para descartar stale completion/failure |
| 10 | Anti-padrões | 2 linhas novas: handler sem mutation token (replica bug 2.4 Iter 1); rollback em stale failure (não comparar token no `.catch`) |
| 11 | Padrão de teste para drag | Signatures dos T7/T7b/T7c actualizadas com `inFlightByTaskRef`; **novo T13** — mock controlado de 2 promises, 2 handler calls antes de qualquer resolve, resolver na ordem inversa, verificar que 1ª completion é stale e ignorada |
| 12 | Risks / Dependencies | D1 e D2 marcadas RESOLVIDAS; **novo R7** — race condition em drag rápido (Alta + Alto se ignorado) com mitigação canónica |
| 13 | Architectural Decisions Carry-Over | Nova linha "Padrão 2.4 Iter 2 fix — Mutation token por task-id" com trace e justificação |
| 14 | Change Log | Entrada v0.2 com 12 mudanças listadas e racional |

---

## Estado do draft

| Item | Estado |
|------|--------|
| Ficheiro | `imersao-tools/nexus/docs/stories/2.5.story.md` |
| Status | Draft (não validado) |
| Versão | v0.2 (2026-05-17) |
| ACs | 14 (13 originais + AC5b novo) |
| Tasks | T1-T12 (T7.5 + T7.6 + T9.8 novas) |
| Risks | 7 (R1-R6 + R7 novo); D1 e D2 RESOLVIDAS |
| Anti-padrões | 11 (9 originais + 2 novos sobre mutation token) |
| Architectural Decisions Carry-Over | 11 linhas (10 originais + Padrão 2.4 Iter 2 fix novo) |
| Test cenários | 12 (T1-T11 + T13) — T13 é o mutation token race condition |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260517-story-2.5-draft-v0.2-pronto-po-validation.md`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md` SE EM DÚVIDA.

---

## Decisões River nesta sessão (para Pax ratificar)

| # | Decisão | Razão |
|---|---------|-------|
| R1 | **Editar o draft v0.1 em vez de descartar e refazer** | A v0.1 já cobria correctamente FR11 + FR12 + scaffold tabs 2.3 + factory `createCalendarDragEndHandler` + Padrão `dnd-kit`. O gap era apenas no mutation token Iter 2. Reescrever do zero descartava 13 ACs validados, 12 tasks/subtasks, 6 [AUTO-DECISION] A1-A9, e o helper `weekRange.ts` esqueleto. **Patches cirúrgicos** são menos arriscados. |
| R2 | **AC5b separado do AC5 (em vez de fundir)** | O AC5 actual cobre optimistic UI + rollback + factory pura. O comportamento de mutation token tem semântica distinta (anti-race), é testável independentemente (T13 isolado de T7/T7b/T7c), e merece track separado para QA. Fundir tornaria o AC5 enorme e o T13 perderia visibilidade. |
| R3 | **Factory recebe `inFlightByTaskRef` como dependência explícita** (em vez de criar internamente) | Paridade com `createKanbanDragEndHandler` da 2.4 Iter 2 (linhas 85-91 da interface `Deps`). Permite injectar `{ current: {} }` em testes e validar stale completion sem montar componente. Coerente com o padrão de "factory pura testável" já consolidado em 8 stories. |
| R4 | **Termo "triádico" no brief = trio FR11**, NÃO uma vista nova chamada "triádico" | Cruzamento de fontes: a única ocorrência de "triádico" no projecto é no RETOMA 16/05 linha 117 do Gage, onde refere "completa o triádico Lista/Kanban/Calendário". O Eurico copiou o termo literalmente. FR11 oficial = "3 vistas: lista, Kanban, calendário semanal". Story 2.5 = vista Calendário. |
| R5 | **Não atrasar para retrospectiva intermédia** | Eurico expressou preferência clara via `*draft 2.5` em vez de `@po *retrospective epic-2`. Opção 5 do RETOMA explicitamente desconsiderada. |
| R6 | **Story points mantidos em 5** | Mutation token adiciona ~5-10 linhas de código + 1 teste. Padrão já testado e canónico — copiar+adaptar da 2.4. Complexidade adicional negligenciável face ao trabalho do grid 7 colunas + week navigation + a11y já estimados. |

---

## Cenários para Pax

**Cenário A — `*validate-story-draft 2.5` retorna GO Score ≥7 (mais provável)**

Story flui para `@ux-design-expert *develop 2.5` (paralela ou sequencial com outras stories Epic 2). 8º consecutivo GO sem F1 esperado dado que v0.2 patches são todos cirúrgicos sobre uma v0.1 já bem estruturada.

**Cenário B — GO conditional com F1 trivial**

Pax pode pedir esclarecimentos sobre AC5b (semântica de stale completion), T13 (clareza do flush de microtasks), ou alinhamento do exemplo de código com a versão real do `KanbanBoard.tsx` em `main`. River aplica F1 em 5-10 min e devolve.

**Cenário C — NO-GO**

Improvável. Patches são reaproveitamento explícito de padrão já em `main` validado pela 2.4 Iter 2. Único risco: se Pax identificar conflito com regra ou padrão arquitectural que River omitiu.

**Cenário D — Eurico decide paralelizar com outras stories**

Como Stories 2.5/2.6/2.7/2.8 são paralelizáveis (sem dependências cruzadas), Eurico pode invocar `@sm *draft 2.6` ou `2.7` ou `2.8` em terminais separados. Cada draft segue o SDC normal independentemente.

---

## Próximo passo determinístico

```
@po *validate-story-draft 2.5
```

Após GO: `@ux-design-expert *develop 2.5` (executor previsto Uma, quality gate Dex — respeita A6).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2 (subprojecto de `imersao-tools/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260517-story-2.5-draft-v0.2-pronto-po-validation.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260517-story-2.5-draft-v0.2-pronto-po-validation.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: 17/05/2026
