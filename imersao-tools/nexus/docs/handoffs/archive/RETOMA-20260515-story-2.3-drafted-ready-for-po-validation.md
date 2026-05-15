# RETOMA — Story 2.3 DRAFTED (River → Pax)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**From:** River (`@sm`) — Scrum Master story draft
**To:** Pax (`@po`)
**Data:** 15/05/2026
**Story:** 2.3 — Vista lista de tarefas (com secção dedicada de atrasadas)
**Branch sugerida:** `feature/2.3-vista-lista` (a criar quando develop arrancar — `@ux-design-expert *develop 2.3`)
**Status story:** **Draft**
**Story draft checklist (River YOLO):** PASS em todas as 6 categorias · Clarity 9/10 · READY
**Próxima acção:** `@po *validate-story-draft 2.3`

---

## Resumo executivo

Story 2.3 é a **primeira UI do Epic 2** — implementa `/tarefas` (Next.js App Router) com vista lista, secção dedicada de atrasadas (FR13), filtros + pesquisa, consumindo `useTasks` da Story 2.1. Não é literalmente "refactor v1" porque o ficheiro não existe em v2 — é o primeiro mount no stack Dexie 4 (interpretação documentada em §"Nota do `@sm` River").

River produziu 4 `[AUTO-DECISION]` D1-D4 explícitas a aguardar ratificação de Pax (resumidas abaixo) + 5 reconciliações R1-R5 entre PRD e `front-end-spec-v2.md` (sendo R1 a mais consequente: spec linha 457 menciona drag em list, mas FR12 limita drag a Kanban/calendário → River exclui drag de 2.3, escala via Open Question Q2 se Pax preferir incluir).

12 ACs, 10 tasks, 6 risk assessments, 4 Open Questions, separation-of-roles A6 respeitada (`@ux-design-expert` executa, `@dev` faz gate). Hard-stop 2 iterações CodeRabbit honrado conforme EPIC-2 §8.

---

## Decisões autónomas a ratificar (4)

| # | Decisão de River | O que Pax aprova / reverte |
|---|------------------|----------------------------|
| **D1** | Drag-and-drop **NÃO** implementado em list view (alinha FR12 — drag só Kanban/calendário; spec linha 457 ignorado por scope creep) | Q2 nas Open Questions. Reversão → +1 AC + estimativa sobe para 6-8h |
| **D2** | Tabs Kanban/Calendário **visíveis mas disabled** com badge "Em construção" | Q1 nas Open Questions. Reversão → tab strip criado só em 2.4/2.5 (refactor cosmético depois) |
| **D3** | "Atrasada" = `dueDate < startOfToday()` em local time (não `< Date.now()`) — tarefas de hoje **não** são overdue | Q3 nas Open Questions. Reversão → mudança operacional do helper `isOverdue.ts` + ajuste teste T4 |
| **D4** | Menu kebab tem "Editar" **disabled** (placeholder + toast) — edição é story futura | Q4 nas Open Questions. Reversão → +1 AC para TaskModal básico + estimativa sobe |

---

## Acção concreta para `@po` Pax

1. **Ler o draft completo** em `imersao-tools/nexus/docs/stories/2.3.story.md` (12 ACs + 4 [AUTO-DECISION] + 5 reconciliações + 6 risks + 4 Open Questions)
2. **Cruzar com fontes primárias:**
   - `PRD-NEXUS-V2.md §6.2` (linhas 132, 134, 135, 136) para FR9/FR11/FR12/FR13
   - `front-end-spec-v2.md §3.2` (linhas 423-460) para layout `/tasks`
   - `EPIC-2.md §5` (tabela de stories — Story 2.3) para executor/gate previstos
   - `architecture-v2.md` (5 ADRs) para confirmar não-reabertura
3. **Executar `*validate-story-draft 2.3`** com o 10-point checklist da PO
4. **Decidir Q1-Q4** (ratificar D1-D4 ou alterar — ver tabela acima)
5. **Se GO conditional** com F-fixes triviais, delegar a River para aplicar; senão NO-GO com lista de required fixes
6. **Criar handoff de saída** para `@ux-design-expert *develop 2.3` (ou para River se houver fixes a aplicar)

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-drafted-ready-for-po-validation.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Open Questions a resolver (4)

| Q | Pergunta | Default de River |
|---|----------|-------------------|
| **Q1** | Tabs Kanban/Calendar visíveis como disabled (D2)? | `[GO]` — scaffold único agora; Pax confirma ou prefere "tabs só em 2.4/2.5" |
| **Q2** | Drag-and-drop excluído de list view (D1)? | `[GO]` — segue FR12 literal; Pax confirma ou prefere incluir (vira AC adicional) |
| **Q3** | "Atrasada" = `< startOfToday()` ou `< Date.now()` (D3)? | `[startOfToday]` — Pax confirma ou prefere `Date.now()` |
| **Q4** | Menu kebab "Editar" disabled (D4)? | `[GO disabled]` — Pax confirma ou prefere implementar edição básica aqui |

> Se Pax responder GO a todas, decisões viram baked-in nos ACs sem alterações. Se Pax reverter alguma, abrir Change Log v0.2 com alteração específica.

---

## Reconciliações PRD ↔ Spec (5)

| # | Tensão | Resolução River | Carece de ratificação? |
|---|--------|------------------|------------------------|
| R1 | Spec linha 457 menciona drag em list; PRD FR12 só fala Kanban/calendário | Excluir drag (D1) | Sim (Q2) |
| R2 | Spec linha 425 fala em "modal fullscreen"; arquitectura usa Next.js routes | Route App Router com layout fullscreen via CSS | Não (decisão técnica, sem trade-off de scope) |
| R3 | Stories 2.4/2.5 ainda não existem mas spec mostra 3 tabs | Placeholders disabled (D2) | Sim (Q1) |
| R4 | Spec menciona filtros + pesquisa; PRD FR9 não enumera UI explícita | Implementar todos os 4 + pesquisa (não-invenção, spec é guia UX) | Não (alinhado com spec — fonte primária UX) |
| R5 | FR13 diz "secção do dashboard"; River coloca na vista `/tarefas` | Implementar aqui; widget no dashboard é story futura | Não (escalonamento natural — widget vem depois) |

---

## File List (artefactos do draft)

- **Criado:** `imersao-tools/nexus/docs/stories/2.3.story.md` (~600 linhas, status Draft v0.1)
- **Modificado:** `imersao-tools/nexus/docs/EPIC-2.md` — linha da Story 2.3 (estado `Ready for draft (próxima)` → `Drafted (15/05) — aguarda \`@po *validate-story-draft 2.3\``)
- **Criado:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-drafted-ready-for-po-validation.md` (este ficheiro)
- **A modificar nesta sessão:** `imersao-tools/nexus/docs/handoffs/INDEX.md` — remover handoff `closed-ready-for-devops-push` se já consumido (Gage faz isso após push) + adicionar este em pending
- **A arquivar (futuro):** este handoff vai para `archive/` quando Pax executar `*validate-story-draft 2.3`

---

## Constraint de execução

A 2.3 pode ser validada por Pax **agora** — o draft está completo e referenciado em `EPIC-2.md`. O `*develop 2.3` pelo executor (Uma) é melhor arrancado **após** a 2.2 estar merged em main (`@devops *push` da branch `feature/2.2-migration-refactor`), para que Uma trabalhe numa base limpa com a migration disponível. Mas validação Pax pode ocorrer em paralelo ao push da 2.2 (independente).

> **Trace para Pax:** branch local `feature/2.2-migration-refactor` ainda não pushed (commit `dd6dc0d8`). Handoff `closed-ready-for-devops-push` em pending no INDEX. Se Pax executar `*validate-story-draft 2.3` agora, ratifica D1-D4 e quando a 2.2 mergeai, Uma já pode arrancar imediatamente sem janela de bloqueio.

---

## Aderência a regras AIOX (auto-check River)

| Regra | Aderência |
|-------|-----------|
| `handoff-location.md` | PASS — handoff em `imersao-tools/nexus/docs/handoffs/`, 3 blocos obrigatórios presentes |
| `separation-of-roles.md` A6 | PASS — executor `@ux-design-expert` ≠ quality gate `@dev` |
| `not-tested-trailer-rules.md` A3 | PASS — secção §"Not-Tested Evidence Gate" classifica story como sem paths bloqueadores, com cláusula de activação |
| `mock-protocol-fidelity.md` A1 | PASS — story não tem mocks de protocolos externos; mencionado explicitamente como N/A |
| Constitution Artigo I (CLI First) | PASS — toda a operação via comando `*draft`, próximo passo é `@po *validate-story-draft 2.3` |
| Constitution Artigo III (Story-Driven) | PASS — story criada antes de qualquer código |
| Constitution Artigo IV (No Invention) | PASS — cada AC traça PRD/spec/arch; R1 exclui drag em list para evitar invenção |
| Language Standards PT-PT | PASS — story integralmente em PT-PT; AC9 enforça termos canónicos |
| Design system | PASS — Dev Notes referenciam `.claude/rules/design-system-ia-avancada.md` |

---

## Estado da branch (verificado por River)

| Item | Valor |
|------|-------|
| Branch actual | `feature/2.2-migration-refactor` (handoff 2.2 ainda em pending — Gage não pushed ainda) |
| Tip local | `dd6dc0d8` (Story 2.2 commit) |
| Status 2.3 | Story file criada como **uncommitted change** em `feature/2.2-migration-refactor` |
| Recomendação | River **não criou** branch `feature/2.3-vista-lista` ainda — fica para `@ux-design-expert *develop 2.3` (executor cria branch local quando arrancar). Story file fica como uncommitted parte do trabalho 2.2 closure ou pode ser absorvida em closure commit (decisão de Gage) |

> **Working tree noise sinalizado no handoff anterior:** `M comunidade submodule`, `.agent/`, `.aiox-* configs`, `.cursor/`/`.antigravity/` rules backups — IGNORAR conforme handoff `closed-ready-for-devops-push`. River não tocou em nenhum desses paths.

---

## Tasks marcadas no draft (Tasks/Subtasks da story)

Todas as 10 tasks (T1-T10) estão `[ ]` unchecked — Uma vai marcá-las durante `*develop 2.3`. T10 (push) intencionalmente unchecked e delegada a `@devops`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.3-drafted-ready-for-po-validation.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: 15/05/2026

---

## Próxima acção

`@po *validate-story-draft 2.3` — Pax executa o 10-point checklist da PO, ratifica D1-D4 (Q1-Q4), decide GO / GO-conditional / NO-GO.

- Se **GO**: Pax cria handoff `sm → ux-design-expert` ou (se houver F-fixes triviais) handoff `po → sm` para aplicar.
- Se **GO-conditional**: F-fixes triviais delegados a River; depois Approved.
- Se **NO-GO**: lista de required fixes enviada a River; status `Draft` permanece até resolução.

Sequência projectada após Approved:
```
@po *validate-story-draft 2.3 → @ux-design-expert *develop 2.3 → @dev *qa-gate 2.3 → @po *close-story 2.3 → @devops *push
```
