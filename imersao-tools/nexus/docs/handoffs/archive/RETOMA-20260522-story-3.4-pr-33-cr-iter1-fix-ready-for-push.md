# RETOMA — Story 3.4 PR #33 — CR Iter 1 fix aplicado, pronto para push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Dex (`@dev`)
**Para:** Gage (`@devops`)
**Data:** 22/05/2026
**Projecto:** Nexus v2 — Epic 3 (Finanças Completas)
**Story:** 3.4 — CRUD recorrências financeiras

---

## Estado

- **PR #33** OPEN — branch `feature/3.4-crud-recorrencias-financeiras`
- **Fix CR Iter 1 commitado** — `f5e7eeaf` (commit local, **não pushed**)
- **CodeRabbit Iter 1 era CHANGES_REQUESTED** — 3 Major + 1 Minor + 1 doc-nit. Todos resolvidos.
- Hard-stop EPIC-3 §8: esta é **Iter 1 de 2**. Iter 2 (re-review) é legítima. Iter 3 exigiria autorização humana do Eurico no commit.

---

## Correcções aplicadas (commit `f5e7eeaf`)

| # | Sev | Ficheiro | Correcção |
|---|-----|----------|-----------|
| I2 | Major | `lib/db/repos/finance-recurrences.ts` | `updateFinanceRecurrence` valida com `FinanceRecurrenceSchema.omit({id,createdAt,recurrenceId}).partial().strict()`. O `.strict()` foi adicionado além da recomendação literal do CR — sem ele, o Zod descartaria a chave imutável em silêncio mas o `patch` original ainda seria escrito em `db.update`. Com `.strict()`, `parse()` lança `ZodError`. |
| I3 | Major | `lib/db/repos/finance-recurrences.ts` | `deleteFinanceRecurrence` envolve os 2 deletes em `db.transaction('rw', db.recurrences, db.financeRecurrences, ...)` — cascata atómica all-or-nothing. |
| I5 | Major | `lib/shared/recurrence.ts` | `runFinanceRecurrenceEngine` valida `recurrence.ownerType === 'transaction' && recurrence.ownerId === fr.id` antes de `generateTransactionInstances`; mismatch → `Error` capturado e contado em `errors`. |
| I4 | Minor | `lib/shared/recurrence.ts` | `generateTransactionInstances` valida `horizonDays` inteiro >= 1 no topo (`RangeError` fail-fast). |
| I1 | doc-nit | `docs/stories/active/3.4.story.md` | Pipe escapado (`\|`) na célula da tabela de reconciliação (linha 96). |

**Testes de regressão novos (não-tautológicos):**
- **T6b** (`financeRecurrences.test.ts`) — `updateFinanceRecurrence` rejeita patch com `id`/`createdAt`/`recurrenceId` (prova I2).
- **T7b** (`financeRecurrences.test.ts`) — transações geradas **sobrevivem** a `deleteFinanceRecurrence` — **fecha o concern C1 do QA**.
- **T12** (`generateTransactionInstances.test.ts`) — `Recurrence` com owner inválido conta como `errors`, zero transações geradas (prova I5).

Nota: os helpers antigos de `generateTransactionInstances.test.ts` criavam `Recurrence.ownerId` com um UUID placeholder (≠ `fr.id` real) — incompatível com a guarda I5. Adicionado `seedConsistentPair` (espelha a ordem real de `page.tsx`); T8/T9 migrados.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260522-story-3.4-pr-33-cr-iter1-fix-ready-for-push.md`. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Quality gates locais (corridos pelo `@dev`)

| Gate | Comando | Resultado |
|------|---------|-----------|
| Lint | `npm run lint` | 0 erros novos (1 warning pré-existente `app/api/auth/logout/route.ts` — não tocado) |
| Typecheck | `npm run typecheck` | exit 0 |
| Testes | `npm run test:unit` | **825/825 PASS** (63 ficheiros; 822 + 3 novos) |
| Build | `npm run build` | PASS — `/financas` 10,2 kB |

Nenhum path bloqueador tocado (`vitest.config.ts` intacto) — Not-Tested Evidence Gate N/A.

## Próximo passo

`@devops *push` — push do commit `f5e7eeaf` para `feature/3.4-crud-recorrencias-financeiras`. Isto re-dispara o CodeRabbit no PR #33 (server-side, convenção Nexus v2) → **CodeRabbit Iter 2**.

- Se Iter 2 verde → **merge** (squash) do PR #33. Waiver rate Epic 3 mantém-se 0/4.
- Se Iter 2 trouxer novos findings de código → escalar a `@dev` (seria Iter 2 de 2 do hard-stop §8; uma Iter 3 exigiria autorização humana do Eurico registada no commit).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260522-story-3.4-pr-33-cr-iter1-fix-ready-for-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Dex (@dev)`
DATA: `22/05/2026`
