# RETOMA — Story 2.7 · PR #28 · CodeRabbit Iter 1 CHANGES_REQUESTED · escalado a @dev

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Gage (`@devops`) — push + PR + triagem CodeRabbit Iter 1
**Para:** Dex (`@dev`) — `*qa-loop-fix 2.7` (Iter 2 de fix do CodeRabbit)
**Data:** 2026-05-20
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** CONSUMED — `consumed: true` · `consumed_at: 2026-05-20` · `consumed_by: dev`
**Branch:** `feature/2.7-motor-recorrencia` — PR #28 OPEN

> **CONSUMIDO** por Dex (`@dev`) em 20/05/2026 via `*qa-loop-fix 2.7` Iter 2. Os 8 findings
> da 2.7 (#3-#10) foram todos resolvidos no commit `e4a73cb6`. Quality gates locais 4/4 PASS
> (lint exit 0, typecheck exit 0, test:unit 602/602, build exit 0). Handoff de saída
> `RETOMA-20260520-story-2.7-cr-iter2-fixes-pronto-para-devops-push.md` criado para Gage `*push`.
**PR:** https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/28

---

## Sumário executivo

A Story 2.7 (Motor de recorrência, FR10) foi empurrada (SHA `e3107a60`) e o PR #28 aberto contra `main`. Os pre-push quality gates passaram 4/4 (lint exit 0 + 1 warning herdado, typecheck exit 0, test:unit **588/588** — número canónico confirmado, build exit 0). CI essencial 100% verde.

O CodeRabbit Iter 1 retornou `CHANGES_REQUESTED` com **10 actionables**, dos quais **6 são findings de código/teste da Story 2.7** (#5-#10). Conforme `agent-authority.md`, o `@devops` não aplica fixes de código — escalado a `@dev` para Iter 2.

**EPIC-2 §8: máximo 2 iterações de CR fix-loop. Esta é a Iter 2. Iter 3 PROIBIDA sem decisão do Eurico.**

---

## Estado dos checks (PR #28)

| Check | Resultado |
|-------|-----------|
| CI essencial (Lint+TS, Vitest 588/588, Vercel, CodeQL) | 100% verde |
| Status check `CodeRabbit` (head SHA) | SUCCESS |
| `reviewDecision` GitHub-formal | CHANGES_REQUESTED |
| `mergeStateStatus` | CLEAN |

---

## Os 10 actionables CodeRabbit Iter 1

| # | Ficheiro | Linha | Severidade | Natureza | Responsável |
|---|----------|-------|-----------|----------|-------------|
| 1 | `docs/stories/active/2.10.story.md` | 189 | Major | doc-nit Zod `.nullable().default(null)` — **fora-scope deste PR** | PR da Story 2.10 |
| 2 | `docs/stories/active/2.10.story.md` | 221 | Major | doc-nit interpolação `${}` em string single-quote — **fora-scope deste PR** | PR da Story 2.10 |
| 3 | `docs/stories/active/2.7.story.md` | 36 | Minor | doc-nit MD040 — fence sem linguagem | @dev (Iter 2) |
| 4 | `docs/stories/active/2.7.story.md` | 133 | Minor | doc-nit MD056 — pipe `\|` não escapado em tabela | @dev (Iter 2) |
| 5 | `v2/components/tarefas/RecurrenceFieldset.tsx` | 64 | Minor | código — `validateRecurrenceValue` só valida datas; não valida `weekday` (0-6) nem `monthday` (1-31) | @dev (Iter 2) |
| 6 | `v2/lib/shared/recurrence.ts` | 139-147 | Major | código — switch `weekly`/`monthly` faz default silencioso de `weekday`→0 e `monthday`→1; deve falhar com erro descritivo se ausentes | @dev (Iter 2) |
| 7 | `v2/lib/shared/recurrence.ts` | 193-196 | Major | código — janela do horizonte usa `nowMs` directo; correr a meio do dia salta a ocorrência de hoje, correr à meia-noite duplica (devido a `between(..., true)` inclusivo). Normalizar `from`/`to` a fronteiras de dia inteiro | @dev (Iter 2) |
| 8 | `v2/lib/tarefas/cancelRecurrence.ts` | 34-35 | Major | código — `deleteRecurrence` antes de `updateTask`; se `updateTask` falhar, a task fica com `recurrenceId` órfão. Inverter ordem (update primeiro) ou envolver em try/catch com restauro | @dev (Iter 2) |
| 9 | `v2/tests/unit/hooks/useRecurrenceEngine.test.ts` | 39 | Minor | teste — só cobre o caminho de sucesso; adicionar caso de rejeição do engine | @dev (Iter 2) |
| 10 | `v2/tests/unit/shared/recurrence-cancel.test.ts` | 104 | Major | teste — T13 reproduz internals de cancelamento em vez de chamar `cancelTaskRecurrence` directamente (contrato AC9) | @dev (Iter 2) |

Detalhe completo dos findings: comentários inline do PR #28 + review CR.

---

## Notas de avaliação @devops

- Os findings #6, #7, #8 são preocupações de **correcção** reais (não cosméticas) sobre o motor de recorrência. #7 (normalização de janela) é o mais relevante — afecta directamente a idempotência da geração de instâncias.
- #5/#9/#10 são reforços de robustez/cobertura.
- O Architect Gate considerou a tolerância a erros do motor e a não-indexação de `parentTaskId` como decisões deliberadas (ADR-2.7-1); os findings CR **não contradizem** essas decisões — são ortogonais (validação de input vs estratégia de activação/indexação).
- Nenhum finding é falso positivo óbvio que justifique waiver puro. Iter 2 de fix legítima.
- O `vitest.config.ts` não foi tocado pela 2.7 — `not-tested-trailer-rules.md` não aplicável a esta branch.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO Nexus v2 — localização correcta.

---

## Next action

1. **`@dev` (Dex)** — `*qa-loop-fix 2.7`: aplicar os fixes #3-#10 na branch `feature/2.7-motor-recorrencia` (commit de fix Iter 2). Os #1-#2 pertencem ao PR da Story 2.10, não tocar aqui.
2. Re-correr os quality gates locais e commitar.
3. Devolver a `@devops` (Gage) para push do commit de fix + observar CR Iter 2.
4. Se a Iter 2 fechar verde → `gh pr merge 28 --squash`.
5. Se a Iter 2 **não** fechar verde → hard-stop EPIC-2 §8, escalar ao Eurico (Iter 3 proibida sem decisão).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.7-pr-28-cr-iter1-escalado-dev.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Gage (@devops)`
DATA: `20/05/2026`
