# RETOMA — Story 3.1 (Schema finanças) Draft · pronto para `@po *validate-story-draft 3.1`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** River (`@sm`) — `*draft 3.1`
**Para:** Pax (`@po`) — `*validate-story-draft 3.1` · `@devops` (Gage) — push do commit de draft
**Data:** 2026-05-20
**Projecto:** Nexus v2 — Epic 3 (Finanças Completas)
**Estado:** `status: pending`
**Branch:** `main`

---

## Sumário executivo

A **Story 3.1 — Schema finanças (Data Access Layer Dexie v3)** está criada em `imersao-tools/nexus/docs/stories/active/3.1.story.md`, no mesmo padrão da Story 2.1. Cobre os FRs de schema do Epic 3 (FR16, FR17, FR18, FR19), tem **18 ACs**, **10 tasks/subtasks**, **3 [AUTO-DECISIONS]** documentadas e resolve o **[GAP-3.1]** com evidência directa do código.

O `EPIC-3.md` foi actualizado: Story 3.1 `Pending → Draft` (20/05/2026).

---

## O que foi feito nesta sessão (`*draft 3.1`)

| Acção | Detalhe |
|-------|---------|
| Leitura de fontes | Regras obrigatórias; handoff de entrada consumido; `EPIC-3.md` na íntegra; `PRD-NEXUS-V2.md` §6.3; Story 2.1 completa (referência de formato); `types/db.ts:79-143` (interfaces existentes); `lib/db/client.ts` (schema Dexie version(1) e version(2)) |
| [GAP-3.1] resolvido | Verificação directa em código real: `types/db.ts:84` já contém `ownerType: 'task' \| 'transaction' \| 'habit' \| 'reminder'`. Tabela `recurrences` é genérica e reutilizável para FR17. Story 3.1 NÃO cria tabela de recorrências separada. |
| `3.1.story.md` criada | `stories/active/3.1.story.md` — 18 ACs rastreáveis a FRs, 10 tasks sequenciadas, Dev Notes com contexto técnico verificado, Not-Tested Evidence Gate, Anti-padrões, referências. |
| `EPIC-3.md` actualizado | Story 3.1: Pending → Draft; nota de progresso actualizada com resolução [GAP-3.1] |
| Handoff de entrada consumido | `RETOMA-20260520-epic-3-created-ready-for-sm-draft.md` marcado `consumed` + movido para `archive/` |
| INDEX local actualizado | Entrada Pending substituída por esta; entrada consumida adicionada a Archived |

---

## Resolução do [GAP-3.1]

**Evidência directa:**

- `imersao-tools/nexus/v2/types/db.ts:84` — `ownerType: 'task' | 'transaction' | 'habit' | 'reminder'`
- `imersao-tools/nexus/v2/lib/db/client.ts:77` — `recurrences: 'id, ownerType, ownerId, [ownerType+ownerId]'` em `version(2)`
- `imersao-tools/nexus/v2/lib/db/client.ts:28` — "Epic 3 incrementa para version 3 (accounts, cards, installments, categories)"

**Conclusão:** A tabela `recurrences` da Story 2.1 é **reutilizável sem extensão** para finanças recorrentes (FR17). Usar `ownerType: 'transaction'`. A Story 3.1 cria `version(3)` com apenas 4 tabelas novas: `accounts`, `cards`, `installments`, `categories`.

---

## [AUTO-DECISIONS] para `@po` ratificar

| # | Decisão | Pergunta | Recomendação `@sm` |
|---|---------|----------|-------------------|
| A1 | `version(3)` é o número correcto | — | Firme. `client.ts:28` confirma. Não precisa escalação. |
| A2 | `lib/financas/formatCurrency.ts` criado nesta story | Deve estar na story de schema ou nas stories de UI? | Criado aqui para partilha imediata por todas as stories de UI (3.3/3.7/3.8/3.9). Alternativa: criado na Story 3.3. Recomendo aqui — resolve risco R3 EPIC-3 na story de fundação. |
| A3 | Chave primária de `categories` é `name` | `Transaction.category: string` referencia o nome directamente. PK `name` evita join. Trade-off: rename de categoria requer migração. | Confirmar com `@architect` no gate. Se `@po` preferir PK `id` com campo `categoryId` em `Transaction`, é mudança de schema mais significativa — requer actualizar `types/db.ts:118`. |

---

## Pontos de validação críticos para `@po`

1. **AC3 — índice `categories.name`:** chave primária string. `@po` decide se concorda com A3 ou prefere `id` + actualização de `Transaction.categoryId: string | null`.
2. **AC11 — `formatCurrency`:** `@po` confirma se criação do helper aqui (story de schema) vs story 3.3 (CRUD transações, primeira UI) é a abordagem correcta.
3. **AC2 — NÃO declarar `transactions` novamente:** `@po` valida que o executor (`@data-engineer`) entende que `transactions` já existe em `version(1)` e não deve ser tocada.
4. **AC15 — `NexusDBV2Only` honest mock:** `@po` confirma que o padrão da Story 2.1 (`NexusDBV1Only`) é replicado para `NexusDBV2Only` — honest mock.
5. **Executor `@data-engineer` / gate `@architect`:** confirmar par executor/gate conforme A6 (`separation-of-roles.md`).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO Nexus v2 — localização correcta dentro da pasta do projecto a que o handoff se refere.

---

## Next action

1. **Pax (`@po`)** — `*validate-story-draft 3.1`. Focar especialmente nas [AUTO-DECISIONS] A2 e A3. Resultado esperado: GO >= 7/10 → Story 3.1 `Draft → Approved`. Criar feedback F1 com decisões firmes para bake-in nos ACs (padrão Story 2.1 Q1/Q2/Q3).
2. **`@devops` (Gage)** — fazer push do commit local desta sessão (docs-only: `stories/active/3.1.story.md` + `EPIC-3.md` actualizado + handoff de entrada arquivado + este handoff + INDEX local). Push é exclusivo do `@devops`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-3.1-draft-ready-for-po-validation.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `River (@sm)`
DATA: `20/05/2026`
