# RETOMA — Story 3.1 (Schema finanças) · PR #30 · CodeRabbit Iter 1 CHANGES_REQUESTED · escalado ao `@data-engineer`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Gage (`@devops`) — `*push feature/3.1-schema-financas` + PR #30 + CI + CodeRabbit Iter 1
**Para:** Dara (`@data-engineer`) — `*qa-loop-fix 3.1` Iter 2 (domínio schema/DDL — executor da Story 3.1)
**Data:** 2026-05-21
**Projecto:** Nexus v2 — Epic 3 (Finanças Completas)
**Estado:** `status: pending`
**Branch:** `feature/3.1-schema-financas` — head `1e3f4a6d`
**PR:** [#30](https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/30) — OPEN

---

## Sumário executivo

A **Story 3.1** passou o pre-push gate 4/4 e o CI essencial 100% verde. O **CodeRabbit Iter 1** retornou **CHANGES_REQUESTED** com **12 inline comments + 1 outside-diff (Major) + 1 nitpick** — vários são **findings de código actionable** (validação Zod em falta, race condition, correctness `Math.trunc`), portanto **não** é zona "merge waived Opção A". O merge **não procede**.

Conforme `agent-authority.md` (hard-stop `@devops`: zero fixes de código) e a instrução do handoff de entrada da Aria, o fix loop Iter 2 é delegado ao **executor da story** — `@data-engineer` (Dara), domínio schema/DDL — alinhado com a `separation-of-roles` (gate do `@architect`, fixes do executor).

---

## Estado da execução `@devops`

| Acção | Resultado |
|-------|-----------|
| Push de `main` (3 commits docs-only) | `fa6d51a5..430f4c26` fast-forward limpo |
| Pre-push gates feature branch | **4/4 PASS** — lint exit 0 (+1 warn herdado `auth/logout/route.ts:1`), typecheck exit 0, test:unit **728/728** (59 ficheiros), build PASS (16 rotas) |
| Push feature branch | `feature/3.1-schema-financas` publicada em `origin` |
| PR #30 | OPEN contra `main`, `mergeStateStatus: CLEAN`, `MERGEABLE` |
| CI essencial | **100% verde** — Lint+TS, Vitest unit+coverage, Playwright E2E + bundle, 50-prompt regression, CodeQL js+actions, Coverage Report, Record Quality Metrics, CodeRabbit Status, Vercel Preview |
| CodeRabbit Iter 1 | **CHANGES_REQUESTED** — review no SHA `1e3f4a6d`, 12 inline + 1 outside-diff + 1 nitpick |

---

## Findings CodeRabbit Iter 1 a resolver (Iter 2)

### Findings de código (actionable)

| # | Ficheiro | Linhas | Severidade | Descrição |
|---|----------|--------|-----------|-----------|
| 1 | `lib/db/repos/accounts.ts` | 37-64 | Major | `updateAccount` e `updateBalance` saltam validação Zod — escrita pode criar dados não-conformes. `updateAccount` deve `AccountSchema.partial().parse(patch)`; `updateBalance` deve assertar `Number.isInteger(delta)` |
| 2 | `lib/db/repos/cards.ts` | 43-47 | — | `updateCard` escreve `Partial<Card>` sem validação Zod — adicionar validação de schema do patch antes de `db.cards.update` |
| 3 | `lib/db/repos/categories.ts` | 26-37 | — | `createCategory` faz read-then-write não-atómico (race condition em duplicados case-variant) — envolver duplicate-check + insert em `db.transaction('rw', db.categories, ...)` |
| 4 | `lib/db/repos/installments.ts` | 40-49 | — | `updateInstallment` chama `db.installments.update` sem validar o patch parcial contra `InstallmentSchema.partial()` |
| 5 | `lib/db/repos/transactions.ts` | 62-63 | — | `limit` não normalizado antes de `slice(0, limit)` — clamp para inteiro não-negativo (`Math.floor`), cap máximo; aplicar em ambas as ocorrências |
| 6 | `lib/db/repos/transactions.ts` | 81-89 | — | `updateTransaction` escreve patch sem validação — usar `TransactionSchema.partial()` antes de `db.transactions.update` |
| 7 | `lib/db/schemas.ts` | 124-152 | — | IDs não validados como UUID — `CardSchema.accountId` e `TransactionSchema.accountId/cardId/recurrenceId/installmentId` devem usar `z.string().uuid(...)` |
| 8 | `lib/db/schemas.ts` | 143-148, 158-166 | — | Campos de data aceitam qualquer string não-vazia — quebra ordenação lexical de índices Dexie. Validar formato ISO 8601 (`TransactionSchema.date`, `startDate`, outros campos de data indexados) |
| 9 | `lib/financas/formatCurrency.ts` | 50 | — | `Math.trunc(cents)` propaga NaN/Infinity — validar `Number.isFinite(cents)` antes; falhar fast ou fallback determinístico |

### Findings de teste (actionable)

| # | Ficheiro | Linhas | Severidade | Descrição |
|---|----------|--------|-----------|-----------|
| 10 | `tests/unit/db/schema-upgrade.test.ts` | 176-196 | Major (outside-diff) | Teste "19 tabelas" afirma 19 mas valida só 15 — adicionar assertions para `accounts`, `cards`, `installments`, `categories` (+ `expect(db.tables).toHaveLength(19)`) |
| 11 | `tests/unit/db/repos/accounts.test.ts` | 86-120 | — | Adicionar teste que `updateBalance` rejeita delta não-inteiro (`1.5`, `-0.5`) |
| 12 | `tests/unit/db/repos/installments.test.ts` | 52-59 | — | Adicionar assertions de rejeição de installments não-inteiros (`1.5`, `0.1`, `-0.5`) para `createInstallment` e `updateInstallment` |
| N1 | `tests/unit/financas/formatCurrency.test.ts` | 11-47 | Nitpick | Adicionar testes de input inválido (`1.5`, `NaN`) para fixar o contrato cents-inteiro |

### Doc-nit (1, não-bloqueante)

| # | Ficheiro | Descrição |
|---|----------|-----------|
| D1 | `archive/RETOMA-20260521-story-3.1-ready-for-architect-gate.md` | Linha "LOCALIZAÇÃO ACTUAL" aponta para path não-archive — actualizar para `.../handoffs/archive/...` (o ficheiro já está em `archive/`) |

---

## Classificação `@devops`

- **NÃO é zona "merge waived Opção A"** — há findings de código actionable reais (validação Zod, race condition, correctness `Math.trunc`), não apenas doc-nits Markdown puros.
- Iter 2 fix legítimo dentro da margem `EPIC-3.md` §8 (max 2 iterações). **Iter 3 PROIBIDA sem decisão do Eurico.**
- Hard-stop `@devops` respeitado: zero fixes de código aplicados pelo Gage.

---

## Next action

1. **Dara (`@data-engineer`)** — `*qa-loop-fix 3.1` Iter 2 na branch `feature/3.1-schema-financas`:
   - Resolver os findings de código #1-#9 + testes #10-#12 + nitpick N1.
   - Verificar cada finding contra o código actual antes de aplicar (vários CR podem ser ajuste mínimo; `categories.ts` PK = `name` segundo A3 ratificado — confirmar que a transacção não colide).
   - Doc-nit D1 pode ser corrigido no mesmo commit (não-bloqueante).
   - Reproduzir os 4 quality gates locais (lint, typecheck, test:unit, build).
   - Criar handoff de saída para Gage (`@devops`) `*push` Iter 2.
2. **Gage (`@devops`)** — após fix Iter 2: push incremental, acompanhar CI + CodeRabbit Iter 2; se verde → `gh pr merge 30 --squash`; se CHANGES_REQUESTED de novo → hard-stop §8, escalar ao Eurico.
3. **Pax (`@po`)** — após merge, `*close-story 3.1`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO Nexus v2 — localização correcta dentro da pasta do projecto a que o handoff se refere.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260521-story-3.1-pr-30-cr-iter1-escalado-data-engineer.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Gage (@devops)`
DATA: `21/05/2026`
