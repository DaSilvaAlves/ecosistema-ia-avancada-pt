# RETOMA — Epic 3 (Finanças) criado · pronto para `@sm *draft 3.1`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Morgan (`@pm`) — `*create-epic 3` (criação do Epic 3 — Finanças Completas)
**Para:** River (`@sm`) — `*draft 3.1` · `@devops` (Gage) — push do commit de criação do epic
**Data:** 2026-05-20
**Projecto:** Nexus v2 — Epic 3 (Finanças Completas)
**Estado:** `status: pending`
**Branch:** `main`

---

## Sumário executivo

O **Epic 3 — Finanças Completas** está criado em `imersao-tools/nexus/docs/EPIC-3.md`, no mesmo formato do `EPIC-2.md`. Decompõe os 8 FRs de Finanças (FR16-FR23) do PRD §6.3 em **11 stories (3.1-3.11)** — cópia fiel das "Stories sugeridas" do PRD §10 Epic 3, sem invenção. Cobre os 5 Epic ACs do PRD §10. Estado de arranque: **0/11 Done, todas Pending**.

O Eurico decidiu arrancar o Epic 3 (e não o Epic 4) — PRD §9 permite ordem `2 || 3 → 4`, o Epic 3 depende apenas do Epic 1 (em main).

---

## O que foi feito nesta sessão (`*create-epic 3`)

| Acção | Detalhe |
|-------|---------|
| Leitura de fontes | Regras obrigatórias (agent-authority, handoff-central, handoff-location, mandatory-change-log, workflow-execution); `PRD-NEXUS-V2.md` §6.3 + §9 + §10 Epic 3; `EPIC-2.md` (formato de referência); `EPIC-2-retrospective.md` (débitos D6/D7, acção A4) |
| `EPIC-3.md` criado | 10 secções no padrão `EPIC-2.md`: goal, contexto, dependências, 8 FRs cobertos, 11 stories, 5 Epic ACs, reconciliação PRD↔arquitectura, qualidade/processo, quality gates, próximo passo + decisão D6/D7 + riscos |
| Handoff de entrada consumido | `RETOMA-20260520-epic-2-retrospectiva-completa-decisao-proximo-epic.md` marcado `consumed` + movido para `archive/` |
| INDEX actualizado | Entrada Pending substituída por esta; entrada consumida adicionada a Archived |
| Acção A4 executada | Decisão `@pm` sobre destino de D6 + D7 registada na §10 do `EPIC-3.md` |
| Commit local | Conventional commit com secção `Changes:` (regra `mandatory-change-log.md`). NÃO push — exclusivo `@devops` |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO Nexus v2 — localização correcta dentro da pasta do projecto a que o handoff se refere.

---

## FRs cobertos pelo Epic 3 (trace PRD §6.3)

| FR | Descrição | Stories |
|----|-----------|---------|
| FR16 | Transações variáveis (valor EUR PT-PT, categoria, data, descrição, conta/cartão) | 3.1, 3.3 |
| FR17 | Finanças recorrentes (mesma estrutura de recorrência das tarefas) | 3.1, 3.4, 3.10 |
| FR18 | Contas bancárias + cartões de crédito (fecho fatura + vencimento) | 3.1, 3.5 |
| FR19 | Compras parceladas → N transações futuras | 3.1, 3.6, 3.10 |
| FR20 | Vista Património (saldo agregado por conta) | 3.9 |
| FR21 | Vista mensal + projecção 30 dias | 3.7 |
| FR22 | Categorias default PT (10 categorias) | 3.2 |
| FR23 | 6 tools cérebro de finanças | 3.11 |

## Stories planeadas (11)

3.1 Schema finanças · 3.2 Categorias default PT · 3.3 CRUD transações variáveis · 3.4 CRUD recorrências · 3.5 CRUD cartões · 3.6 Compras parceladas · 3.7 Vista "este mês" · 3.8 Vista cartões · 3.9 Vista património · 3.10 Geração diária recorrentes+prestações · 3.11 Tools cérebro finanças.

## Pontos de atenção para o draft da Story 3.1

1. **`[GAP-3.1]` (EPIC-3.md §7)** — a Story 2.1 já criou uma tabela `recurrences` genérica (reconciliação R2 do `EPIC-2.md`). A Story 3.1 deve **verificar em código** se essa tabela é reutilizável para finanças por `ownerType`, ou se precisa de extensão. Não assumir nem duplicar tabela. `@architect` resolve no draft/gate da 3.1.
2. **Reuso do motor de recorrência** — FR17 + ADR-2.7-1: o `runRecurrenceEngine` da Story 2.7 é genérico por `ownerType`. Stories 3.4 e 3.10 reutilizam-no, não reimplementam.
3. **Schema estende Stories 1.1 + 2.1** — não é schema novo isolado; segue o precedente da Story 2.1 (interpretação "Data Access Layer", schema Dexie).
4. **3.1 é bloqueante** — todas as outras 10 stories assentam no schema da 3.1.

## Next action

1. **River (`@sm`)** — `*draft 3.1` (Schema finanças). Partir de `main`. Resolver o `[GAP-3.1]` da §7 do `EPIC-3.md` (verificar reutilização da tabela `recurrences`). Atribuir executor/quality-gate respeitando a regra A6 (`separation-of-roles.md`) — previsão do epic: executor `@data-engineer`, gate `@architect`. Criar handoff de saída para `@po *validate-story-draft 3.1`.
2. **`@devops` (Gage)** — fazer push do commit local desta sessão (docs-only: `EPIC-3.md` + handoff de entrada arquivado + este handoff + INDEX). Push é exclusivo do `@devops`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-epic-3-created-ready-for-sm-draft.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Morgan (@pm)`
DATA: `20/05/2026`
