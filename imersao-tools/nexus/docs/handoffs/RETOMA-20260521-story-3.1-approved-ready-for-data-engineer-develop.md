# RETOMA — Story 3.1 (Schema finanças) Approved · pronto para `@data-engineer *develop 3.1`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Pax (`@po`) — `*validate-story-draft 3.1`
**Para:** Dara (`@data-engineer`) — `*develop 3.1` · `@devops` (Gage) — push do commit de validação
**Data:** 2026-05-21
**Projecto:** Nexus v2 — Epic 3 (Finanças Completas)
**Estado:** `status: pending`
**Branch:** `main`

---

## Sumário executivo

A **Story 3.1 — Schema finanças (Data Access Layer Dexie v3)** foi validada por Pax (`@po`). Veredicto **GO** — score **9,5/10**, Implementation Readiness **10/10**, Confidence **High**. Status `Draft → Approved`. A story está pronta para `@data-engineer *develop 3.1`.

O [GAP-3.1] está definitivamente resolvido — verificado de forma independente pela validação. Os 3 [AUTO-DECISIONS] A1/A2/A3 estão ratificados e baked-in. Detalhe completo da validação: `imersao-tools/nexus/docs/PO-VALIDATION-STORY-3.1.md`.

---

## O que foi feito nesta sessão (`*validate-story-draft 3.1`)

| Acção | Detalhe |
|-------|---------|
| Leitura de fontes | Regras obrigatórias (handoff-central, handoff-location, mandatory-change-log, mock-protocol-fidelity, not-tested-trailer-rules, separation-of-roles, workflow-execution); handoff de entrada; `3.1.story.md` íntegra; `EPIC-3.md`; `PRD-NEXUS-V2.md` §6.3 + §10 Epic 3; Story 2.1 completa (precedente) |
| Verificação anti-hallucination | 14/14 claims factuais cruzados directamente com código real — `v2/lib/db/client.ts`, `v2/types/db.ts`, `v2/lib/db/schemas.ts`, `v2/lib/db/repos/recurrences.ts`. Zero invenção detectada |
| [GAP-3.1] resolvido — verificação independente | Confirmado em código: `db.ts:84` (`ownerType` inclui `'transaction'`), `client.ts:77` (`recurrences` em `version(2)`), `repos/recurrences.ts:39-48` (`getRecurrenceByOwner` genérico), `schemas.ts:71-76` (Zod aceita `'transaction'`). Conclusão do River CONFIRMADA. Risco R2 do `EPIC-3.md` fechado |
| [AUTO-DECISIONS] ratificadas | A1 (`version(3)`) firme; A2 (`formatCurrency` aqui) firme; A3 (PK `categories.name`) ratificado com nota de gate confirmatório |
| F1 corrigido inline | Dev Notes L256 — aritmética contraditória na contagem de tabelas ("19... = 21...") corrigida para **19 firme** (15 em `version(2)` + 4 em `version(3)`), com trace ao `schema-upgrade.test.ts:174-179` da Story 2.1 |
| Story actualizada | `3.1.story.md` Status `Draft → Approved`; Change Log v1.1 adicionado; Dev Note L256 corrigida |
| `EPIC-3.md` actualizado | Story 3.1 `Draft → Approved`; nota de progresso §5 actualizada |
| PO-VALIDATION criado | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-3.1.md` — 7 secções, 14 claims verificados, scoring 11 dimensões |
| Handoff de entrada consumido | `RETOMA-20260520-story-3.1-draft-ready-for-po-validation.md` marcado `consumed` + movido para `archive/` |
| INDEX local actualizado | Entrada Pending substituída por esta; entrada consumida adicionada a Archived |

---

## Veredicto da validação

| Dimensão | Resultado |
|----------|-----------|
| Score global | **9,5/10** (threshold GO ≥7 largamente superado) |
| Implementation Readiness | **10/10** |
| Confidence | **High** |
| [GAP-3.1] | Resolvido definitivamente (risco R2 EPIC-3 fechado) |
| [AUTO-DECISIONS] | A1/A2/A3 todas ratificadas |
| Findings bloqueadores | Zero |
| F1 (trivial) | Corrigido inline — não exige iteração de `@sm` |

---

## Decisões firmes baked-in para o executor (`@data-engineer`)

| # | Decisão `@po` | Implementação |
|---|---------------|---------------|
| A1 | `version(3)` é o número correcto | `this.version(3).stores({...})` — aditivo, sem tocar `version(1)`/`version(2)` |
| A2 | `formatCurrency` criado nesta story | `lib/financas/formatCurrency.ts` — função pura de domínio de dados. Implementação de referência inline na story (Dev Notes) |
| A3 | PK de `categories` é `name` | `categories: 'name, isDefault'` — PK `name`. **NÃO reabrir** a interface `Category` em `types/db.ts`. O sanity-check de `@architect` no gate é confirmatório, não uma reabertura |
| F1 | Contagem de tabelas `version(3)` = **19** | 15 em `version(2)` (13 v1 + 2 v2) + 4 novas. AC15 (`NexusDBV2Only`) deve confirmar 19 |

---

## Pontos de atenção para a implementação

1. **`transactions` JÁ EXISTE** em `version(1)` (`client.ts:54`) — NÃO recriar. AC2 e anti-padrão #2 são explícitos.
2. **`recurrences` JÁ EXISTE** em `version(2)` (`client.ts:77`) — NÃO recriar. Para finanças recorrentes (Story 3.4) usar `ownerType: 'transaction'` no repo existente.
3. **Interfaces `Account/Card/Transaction/Installment/Category` JÁ EXISTEM** em `types/db.ts:98-142` — NÃO recriar. Os schemas Zod (AC5) espelham-nas.
4. **Schema increment aditivo** — `version(1)` e `version(2)` literais e intactos; só `version(3)` adiciona as 4 tabelas novas.
5. **Montantes sempre em cêntimos** (inteiros, nunca float) — `TransactionSchema.amount` valida `z.number().int()`.
6. **`schemas.ts` é estendido** — o ficheiro já tem Task/Project/Recurrence/Tag (Story 2.1); a story adiciona os 5 schemas financeiros, não recria o ficheiro.
7. **`NexusDBV2Only` honest mock** (AC15) — réplica literal de `version(1)`+`version(2)`, conforme `mock-protocol-fidelity.md`. Padrão `NexusDBV1Only` da Story 2.1 replicado.
8. **Separação de papéis (A6)** — executor `@data-engineer`, quality gate `@architect`. Confirmado.
9. **Not-Tested Evidence Gate** — N/A no arranque. Activa-se SE algum commit tocar `vitest.config.ts`, `tsconfig*.json`, `package.json` (scripts) ou `.github/workflows/**`. AC18 proíbe explicitamente tocar `vitest.config.ts`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO Nexus v2 — localização correcta dentro da pasta do projecto a que o handoff se refere.

---

## Next action

1. **Dara (`@data-engineer`)** — `*develop 3.1`. Implementar partindo de `main`: incremento de schema `version(3)` (4 tabelas novas) + 5 schemas Zod financeiros + 5 repos tipados + helper `formatCurrency` + 2 hooks reactivos + 8 ficheiros de teste. Quality gates locais (AC17/AC18). Decisões A1/A2/A3 já firmes — não reabrir. Quality gate de implementação por `@architect` (Aria).
2. **`@devops` (Gage)** — push único dos commits docs-only locais: os 2 commits pré-existentes do draft (`5c63d791` story draft, `1900cc6b` cleanup handoff) + o commit desta sessão de validação (`3.1.story.md` Approved + `EPIC-3.md` + `PO-VALIDATION-STORY-3.1.md` + handoff de entrada arquivado + este handoff + INDEX). Push é exclusivo do `@devops`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260521-story-3.1-approved-ready-for-data-engineer-develop.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Pax (@po)`
DATA: `21/05/2026`
