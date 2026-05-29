# RETOMA — Story 3.4 PR #33 — CodeRabbit Iter 1 CHANGES_REQUESTED

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Gage (`@devops`)
**Para:** Dex (`@dev`) — via Eurico
**Data:** 22/05/2026
**Projecto:** Nexus v2 — Epic 3 (Finanças Completas)
**Story:** 3.4 — CRUD recorrências financeiras

---

## Estado

- **PR #33** OPEN — https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/33
- **Branch:** `feature/3.4-crud-recorrencias-financeiras` — remote tip `045a8f68`
- **CI: 100% verde** — Vitest, Playwright E2E, Lint+TS, CodeQL (js+actions), Coverage Report, 50-prompt regression, Vercel Preview. `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE`.
- **Pre-push gates @devops:** lint 0 erros (1 warning pré-existente `logout/route.ts`), typecheck exit 0, test:unit **822/822 PASS** (63 ficheiros). Build confirmado por QA.
- **CodeRabbit Iter 1: CHANGES_REQUESTED** — `reviewDecision` GitHub-formal CHANGES_REQUESTED. Review URL: https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/33#pullrequestreview-4342328500
- **NÃO mergeado.** Bloqueado por findings de código reais — não há "merge waived".

---

## CodeRabbit Iter 1 — 5 comentários inline + 4 nitpicks

### Findings de código (bloqueiam — exigem fix @dev)

| # | Ficheiro | Linha | Severidade CR | Descrição |
|---|----------|-------|---------------|-----------|
| I2 | `lib/db/repos/finance-recurrences.ts` | 64-69 | **Major** | `updateFinanceRecurrence` usa `FinanceRecurrenceSchema.partial().parse(patch)` — aceita `id`/`createdAt`/`recurrenceId`. Recomendação CR: `FinanceRecurrenceSchema.omit({id,createdAt,recurrenceId}).partial().parse(patch)` para rejeitar campos imutáveis/de ligação. |
| I3 | `lib/db/repos/finance-recurrences.ts` | 85-92 | **Major** | `deleteFinanceRecurrence` faz 2 writes separados (`deleteRecurrence` → `db.recurrences.delete` + `db.financeRecurrences.delete`) — não-atómico. Recomendação CR: envolver em `db.transaction('rw', db.recurrences, db.financeRecurrences, ...)` para rollback all-or-nothing. |
| I5 | `lib/shared/recurrence.ts` | 470-476 | **Major** | `runFinanceRecurrenceEngine` chama `getRecurrence(fr.recurrenceId)` e gera transações sem validar que `recurrence.ownerType === fr.ownerType` e `recurrence.ownerId === fr.ownerId`. Recomendação CR: validar o par owner antes de `generateTransactionInstances`; lançar Error descritivo se não bater. |
| I4 | `lib/shared/recurrence.ts` | 382-396 | Minor | `generateTransactionInstances` não valida `horizonDays` no topo da função. Recomendação CR: `Number.isInteger` + `isFinite` ≥ 1, `RangeError` se inválido — fail-fast em vez de janela invertida/vazia. |

### Doc-nit (não bloqueia)

| # | Ficheiro | Linha | Severidade | Descrição |
|---|----------|-------|------------|-----------|
| I1 | `docs/stories/active/3.4.story.md` | 96 | Minor | Pipe não escapado numa célula de tabela markdown (`DAILY | WEEKLY | MONTHLY`) — escapar com `\|` ou envolver em backticks. |

### Nitpicks (não bloqueiam — opcionais)

- `app/(app)/financas/page.tsx:209-265` — atomicidade Dexie no `handleSubmitRecurrence` (CR marca "Poor tradeoff", não-bloqueante).
- `app/(app)/financas/page.tsx:441-453` — `deleteAndRecreateRecurrence` delete-then-create não-atómico (CR marca "Low value").
- `tests/unit/shared/generateTransactionInstances.test.ts:261-279` — sugere teste T12: `Recurrence` com owner inválido conta como `errors`.
- `tests/unit/financas/financeRecurrences.test.ts:127-136` — sugere teste T7b: transações sobrevivem a `deleteFinanceRecurrence` (alinha com concern C1 do QA). CR forneceu o diff sugerido.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260522-story-3.4-pr-33-cr-iter1-changes-requested.md`. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Análise

Iter 1 trouxe **3 findings Major em código de produção** (`finance-recurrences.ts` ×2, `recurrence.ts` ×1) — não são doc-nits. `@devops` **não aplica fixes de código** (`agent-authority.md`). Escalado a `@dev`.

Os 3 Major partilham um tema: **atomicidade e validação de integridade no domínio de recorrências financeiras**. I2 (rejeitar campos imutáveis) e I3 (delete atómico) são consistentes; I5 (validar par owner) cobre o mesmo risco que o nitpick do teste T12. O concern C1 do QA (transações sobrevivem ao delete) é exactamente o nitpick T7b — CR confirmou-o independentemente.

**Decisão sobre I4 (Minor `horizonDays`):** legítimo dentro do scope do fix Iter 2 — guarda de input barata.

## Hard-stop EPIC-3 §8

Esta é **Iter 1**. Iter 2 de fix é **legítima e dentro da margem**. Iter 3 exige autorização humana explícita do Eurico registada no commit. Waiver rate Epic 3: mantém-se 0/4.

## Próximo passo

`@dev *qa-loop-fix 3.4` — aplicar I2, I3, I5 (Major obrigatórios), I4 (Minor recomendado), I1 (doc-nit do pipe), e opcionalmente T7b/T12 (testes de regressão sugeridos; T7b fecha o concern C1 do QA). Re-correr quality gates locais. Depois `@devops` faz push do fix → re-review CodeRabbit Iter 2 → merge se verde.

`@devops` aguarda o fix — não merge sem CodeRabbit resolvido.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260522-story-3.4-pr-33-cr-iter1-changes-requested.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Gage (@devops)`
DATA: `22/05/2026`
