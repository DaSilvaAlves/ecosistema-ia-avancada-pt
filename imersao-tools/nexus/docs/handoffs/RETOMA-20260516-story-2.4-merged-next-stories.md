# RETOMA — Story 2.4 MERGED em main · Epic 2 = 4/10 Done · Próxima story por decidir

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Gage (`@devops`)
**Para:** Eurico — decisão da próxima story
**Data:** 2026-05-16
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** PENDING (Eurico decide qual a próxima story 2.5/2.6/2.7/2.8 ou retrospectiva intermédia)

---

## Sumário executivo

Story 2.4 (Vista Kanban) **MERGED em main** em 16/05/2026 22:13:53Z via PR #21 squash `2a5f0dbd`. Closure ciclo merge completo:

- Push Iter 2 (2 commits `93399bd5`+`e23f22a4`) ✓
- PR comment waivers explícitos para 5 Major handoff + 3 MD nits (issuecomment-4468292754) ✓
- CI Iter 2 9/9 essential checks PASS ✓
- CR Iter 2 review COMMENTED (não CHANGES_REQUESTED — só duplicate nits MD waived) ✓
- Merge `gh pr merge --admin --squash --delete-branch` ✓
- Branch remote+local eliminadas ✓
- main local fast-forward `3d97c212..2a5f0dbd` ✓
- Vercel production auto-deploy a actualizar Vista Kanban activa ✓

**Epic 2 = 4/10 Done em main** (Stories 2.1 + 2.2 + 2.3 + 2.4).

**Padrão consolidado: 8 stories consecutivas com QA Gate PASS à primeira pós-PO Validation GO** — 1.5/1.6/1.7/1.8/1.9/2.1/2.3/**2.4**.

---

## Estado pós-merge

| Item | Estado |
|------|--------|
| main commit | `2a5f0dbd feat(nexus-v2): Story 2.4 — vista Kanban com drag-and-drop entre colunas (Epic 2 UI) (#21)` |
| PR #21 | **MERGED** 22:13:53Z |
| Branch `feature/2.4-vista-kanban` | Eliminada (remote 404 + local deleted) |
| Vercel production | `https://imersao.ia.expressia.pt` — auto-deploy em curso/concluído |
| Epic 2 progresso | **4/10 Done** em main |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-merged-next-stories.md`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md` SE EM DÚVIDA.

---

## Opções para Eurico decidir

### Opção 1 — Avançar Story 2.5 (Vista calendário semanal)

```
@sm *draft 2.5
```

**Trace:** EPIC-2 §5 — FR11 (3 vistas), FR12 (drag-and-drop entre dias). Reaproveita scaffold tabs Story 2.3 + dnd-kit Story 2.4. Executor previsto `@ux-design-expert`, quality gate `@dev`.

Vantagem: completa o triádico Lista/Kanban/Calendário do FR11. Reaproveitamento alto.

### Opção 2 — Avançar Story 2.6 (Sistema tags global)

```
@sm *draft 2.6
```

**Trace:** EPIC-2 §5 — FR14 (tags globais: criar, listar, filtrar). Executor previsto `@dev`, quality gate `@qa`.

Vantagem: independente (não bloqueia outras). Resolve PA2/D3 (PRIORITY_COLORS duplicação) ao introduzir mais componentes que beneficiam de `lib/tarefas/colors.ts`.

### Opção 3 — Avançar Story 2.7 (Motor de recorrência)

```
@sm *draft 2.7
```

**Trace:** EPIC-2 §5 — FR10 (recorrência configurável diária/semanal/mensal/dias-úteis/fim-de-semana/dia específico). Executor previsto `@dev`, quality gate `@architect`.

Vantagem: bloqueia futuras stories de hábitos/metas (Epic 4). Independente das vistas.

### Opção 4 — Avançar Story 2.8 (CRUD projectos)

```
@sm *draft 2.8
```

**Trace:** EPIC-2 §5 — FR29 (CRUD projectos) + FR30 (vínculo tarefas). Executor previsto `@dev`, quality gate `@qa`.

Vantagem: bloqueia 2.9 (Vista projecto) + 2.10 (tools cérebro). Critical path para fechar epic.

### Opção 5 — Retrospectiva intermédia (4/10)

```
@po *retrospective epic-2
```

Geralmente retrospective é ao fim do epic. Mas Epic 2 atingiu 40% e tem 5 lições + 5 débitos D1-D5 a registar. Pode fazer agora para evitar acumular ou esperar fim do epic.

### Opção 6 — Paralelizar (avançado)

Stories 2.5/2.6/2.7/2.8 são **paralelizáveis entre si** (sem dependências cruzadas). Eurico pode invocar Workers ou paralelizar manualmente com terminais separados:

```
Terminal A: @sm *draft 2.5
Terminal B: @sm *draft 2.6
Terminal C: @sm *draft 2.7
Terminal D: @sm *draft 2.8
```

Cada draft pode independentemente avançar pelo SDC (sm → po → dev → qa → po → devops).

---

## Recomendação Gage (não-vinculativa)

**Opção 1 (Story 2.5)** é a mais lógica como follow-up directo da 2.4 — completa o triádico Lista/Kanban/Calendário e maximiza reaproveitamento (scaffold tabs Story 2.3, dnd-kit Story 2.4 com mutation token Iter 2). Velocidade alta esperada.

Alternativamente, **Opção 4 (Story 2.8)** se Eurico prefere atacar o critical path (CRUD projectos desbloqueia 2.9+2.10, fechando epic mais cedo).

---

## Padrão consolidado: 8 stories consecutivas PASS à primeira

| Story | QA Gate | CR Iter 1 | CR Iter 2/3 | Merge tipo | Commit main |
|-------|---------|-----------|-------------|------------|-------------|
| 1.5 | PASS Iter 1 | CHANGES_REQUESTED nits | — | Opção A waived | em main |
| 1.6 | PASS Iter 1 | CHANGES_REQUESTED nits | — | Opção A waived | em main |
| 1.7 | PASS Iter 1 | CHANGES_REQUESTED nits | — | Opção A waived | em main |
| 1.8 | PASS Iter 1 | CHANGES_REQUESTED nits | — | Opção A waived | em main |
| 1.9 | PASS Iter 1 | CHANGES_REQUESTED nits | — | Opção A waived | em main |
| 2.1 | PASS Iter 1 | CHANGES_REQUESTED nits | — | Opção A waived | `86ddb6a6` |
| 2.3 | PASS Iter 1 | CHANGES_REQUESTED Iter 1 mixed | Iter 3 Opção D Eurico-approved | Opção A waived | `667c1dac` |
| **2.4** | **PASS Iter 1** | **CHANGES_REQUESTED Iter 1 (1 Major código + 5 Major handoff + 4 Minor)** | **Iter 2 COMMENTED (waivers ratificados PR comment)** | **Opção A waived** | **`2a5f0dbd`** |

---

## Débitos não-bloqueadores Epic 2 (registados em EPIC-2 §10)

| # | Item | Origem | Prioridade |
|---|------|--------|------------|
| D1 | Teste JSON malformado em localStorage migration | Story 2.2 | Baixa |
| D2 | `@dnd-kit/utilities` dep transitiva (não declarado explícito) | Story 2.4 PA1/F1 | Baixa |
| D3 | `PRIORITY_COLORS` duplicado TaskRow.tsx vs KanbanCard.tsx | Story 2.4 PA2/F2 | Baixa — refactor `lib/tarefas/colors.ts` futuro |
| D4 | Toast de erro primitivo (sem biblioteca) | Story 2.4 PA3/F3 | Baixa |
| D5 | E2E Playwright drag manual ponta-a-ponta | Story 2.4 PA4/F4 | Baixa |

---

## Cenários para Eurico

**Cenário A — Decidir próxima story (mais provável)**
→ Eurico responde com opção 1/2/3/4 ou paralelizar. Workflow continua via `@sm *draft {next}`.

**Cenário B — Verificar production deploy**
→ Eurico abre `https://imersao.ia.expressia.pt` para validar Vista Kanban activa em produção. Se bug encontrado: SOP hotfix.

**Cenário C — Retrospectiva intermédia**
→ Eurico invoca `@po *retrospective epic-2` para registar lições e ratificar D1-D5 antes de continuar.

**Cenário D — Pausa estratégica**
→ Eurico pausa Epic 2 para atacar outro projecto/iniciativa. Estado preservado para retoma futura.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2 (subprojecto de `imersao-tools/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-merged-next-stories.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260516-story-2.4-merged-next-stories.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Gage (`@devops`)
DATA: 16/05/2026
