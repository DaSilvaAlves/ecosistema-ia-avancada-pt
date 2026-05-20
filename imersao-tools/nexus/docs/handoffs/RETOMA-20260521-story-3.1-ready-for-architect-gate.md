# RETOMA — Story 3.1 (Schema finanças) implementada · pronto para quality gate de `@architect`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Dara (`@data-engineer`) — `*develop 3.1`
**Para:** Aria (`@architect`) — quality gate de implementação da Story 3.1
**Data:** 2026-05-21
**Projecto:** Nexus v2 — Epic 3 (Finanças Completas)
**Estado:** `status: pending`
**Branch:** `feature/3.1-schema-financas` (commit `82b07ea4`, a partir de `main`)

---

## Sumário executivo

A **Story 3.1 — Schema finanças (Data Access Layer Dexie v3)** foi implementada por Dara (`@data-engineer`) via `*develop 3.1`. É a story de fundação do Epic 3 e bloqueia as 10 stories seguintes (3.2-3.11).

18/18 ACs honrados. Schema Dexie `version(3)` aditivo (4 tabelas novas + re-declaração de `transactions` para o índice `[cardId+date]`). 5 schemas Zod, 5 repos tipados, helper `formatCurrency`, 2 hooks reactivos, 8 ficheiros de teste (116 testes do domínio financeiro). Todos os quality gates locais passam.

O quality gate de implementação é do `@architect` (Aria), não do `@qa` — `separation-of-roles.md` (A6): schema/DDL é domínio do `@data-engineer`, logo o gate sobe para `@architect`. Confirmado em `EPIC-3.md` §5 e na Story 3.1 (`quality_gate: @architect`).

---

## O que foi feito (`*develop 3.1`)

| Acção | Detalhe |
|-------|---------|
| Leitura de fontes | Regras obrigatórias (handoff-central, handoff-location, mandatory-change-log, mock-protocol-fidelity, not-tested-trailer-rules, separation-of-roles, workflow-execution); handoff de entrada; `3.1.story.md` íntegra; `PO-VALIDATION-STORY-3.1.md`; código base da Story 2.1 (precedente — `client.ts`, `schemas.ts`, `repos/*`, `hooks/*`, testes) |
| Branch | `feature/3.1-schema-financas` criada a partir de `main` |
| Schema `version(3)` | `client.ts` — 4 tabelas novas (`accounts`, `cards`, `installments`, `categories`) + re-declaração de `transactions` com índice `[cardId+date]` ([AUTO-DECISION] A4). `version(1)`/`version(2)` intactos |
| Schemas Zod | `schemas.ts` estendido com 5 schemas financeiros + `AccountTypeSchema`, mensagens PT-PT |
| Repos | 5 repos tipados: `accounts` (+ `updateBalance` atómico), `cards` (+ `listCardsByAccount`), `transactions` (+ `listTransactions` 7 filtros), `installments` (+ `listInstallmentsByCard`), `categories` (PK `name`, rejeição duplicado case-insensitive) |
| Helper | `lib/financas/formatCurrency.ts` — formato PT-PT `€1.234,56` |
| Hooks | `useAccounts`, `useTransactions` — wrappers `useLiveQuery` |
| Testes | 8 ficheiros: 5 repos + `schema-upgrade-v3.test.ts` (honest mock `NexusDBV2Only`) + `formatCurrency.test.ts` + extensão de `schemas.test.ts`. 116 testes do domínio financeiro |
| Commit | `82b07ea4` — conventional + trailers commit-protocol + secção `Changes:` (mandatory-change-log) |
| Handoff de entrada consumido | `RETOMA-20260521-story-3.1-approved-ready-for-data-engineer-develop.md` marcado `consumed` + movido para `archive/` |

---

## Quality gates locais (AC17, AC18)

| Gate | Comando | Resultado |
|------|---------|-----------|
| ESLint | `npm run lint` | PASS — 0 erros (1 warning preexistente em `app/api/auth/logout/route.ts`, fora de scope) |
| TypeScript | `npm run typecheck` | PASS — exit 0 |
| Testes unitários | `npm run test:unit` | PASS — **728/728** testes, 59 ficheiros |
| Build | `npm run build` | PASS |
| Coverage financeiro | `npm run test:coverage` (ficheiros financeiros) | **100% lines** em `accounts.ts`, `cards.ts`, `transactions.ts`, `installments.ts`, `categories.ts`, `schemas.ts`, `formatCurrency.ts` (alvo AC18 >=80%); branch 98,76% |

---

## Pontos de atenção para o quality gate `@architect`

1. **[AUTO-DECISION] A4 (nova) — confirmar.** Durante a Task 1.3, a verificação de índices de `transactions` revelou que faltava `[cardId+date]` para a vista cartões da Story 3.8. A Task 1.3 instrui explicitamente a abrir sub-task nesse caso. Decisão: re-declarar `transactions` em `version(3)` adicionando `[cardId+date]` — operação aditiva de índice Dexie, preserva os dados. Provado por teste (`schema-upgrade-v3.test.ts` — índice `[cardId+date]` funcional após upgrade). **Pede sanity-check de `@architect`.**
2. **[AUTO-DECISION] A3 (ratificada @po) — sanity-check confirmatório.** PK de `categories` é `name`. A `@po` ratificou A3 como decisão firme com nota de gate confirmatório (PO-VALIDATION §3). Não é uma reabertura.
3. **`formatCurrency` — desvio da implementação de referência.** A implementação de referência da story (Dev Notes L258-269) usava `Number.toLocaleString('pt-PT')`, que em runtime Node produz espaço (U+202F) como separador de milhar — divergindo do formato-alvo `€1.234,56`. Substituída por agrupamento manual determinístico (`groupThousands`). Documentado em Dev Agent Record D2.
4. **`listDefaultCategories` — filtro `isDefault` em memória.** O IndexedDB não indexa booleanos de forma fiável. O índice `categories: 'name, isDefault'` é mantido como o AC3 especifica literalmente, mas a query usa leitura + filtro (padrão `listTasks`). Documentado em D3.
5. **Manutenção de `schema-upgrade.test.ts` (Story 2.1).** O AC1 incrementa `NexusDB` para `version(3)`/19 tabelas, o que tornou 2 asserções literais do `schema-upgrade.test.ts` desactualizadas (`verno===2`, "15 tabelas"). Foram actualizadas para `version(3)`/19. Não é scope-creep — é manutenção causada directamente pelo AC1 (lição #1 Story 2.1: o ficheiro é mantido a cada incremento).
6. **[GAP-3.1] respeitado.** `recurrences` reutilizada, não recriada. Nenhuma tabela de recorrências de finanças criada.
7. **Not-Tested Evidence Gate — N/A.** Nenhum commit toca `vitest.config.ts`, `tsconfig*.json`, `package.json` (scripts) ou `.github/workflows/**`. O trailer `Not-tested:` do commit refere apenas o upgrade Dexie real em produção (edge case de runtime — waiver válido, não path bloqueador).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO Nexus v2 — localização correcta dentro da pasta do projecto a que o handoff se refere.

---

## Next action

1. **Aria (`@architect`)** — quality gate de implementação da Story 3.1. Verificar: integridade do incremento `version(3)` (aditivo, `version(1)`/`version(2)` intactos), índices Dexie correctos, schema compliance com `types/db.ts`, montantes em cêntimos, fidelidade de `formatCurrency`. Confirmar [AUTO-DECISION] A4 (índice `[cardId+date]`) e o sanity-check de A3. CodeRabbit corre server-side no PR (convenção Nexus v2).
2. **`@devops` (Gage)** — após gate APPROVED, push da branch `feature/3.1-schema-financas` (commit `82b07ea4`) + abertura de PR. Push é exclusivo do `@devops`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260521-story-3.1-ready-for-architect-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Dara (@data-engineer)`
DATA: `21/05/2026`
