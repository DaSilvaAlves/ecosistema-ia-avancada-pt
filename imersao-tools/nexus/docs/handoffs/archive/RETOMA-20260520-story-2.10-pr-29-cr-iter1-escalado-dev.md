# RETOMA — Story 2.10 · PR #29 · CodeRabbit Iter 1 CHANGES_REQUESTED · escalado a @dev

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Gage (`@devops`) — push + PR + triagem CodeRabbit Iter 1
**Para:** Dex (`@dev`) — `*qa-loop-fix 2.10` (Iter 2 de fix do CodeRabbit)
**Data:** 2026-05-20
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** CONSUMED
**Consumed:** true
**Consumed_at:** 2026-05-20T22:10:00Z
**Consumed_by:** dev (Dex)
**Branch:** `feature/2.10-tools-cerebro` — PR #29 OPEN
**PR:** https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/29

---

## Sumário executivo

A Story 2.10 (Tools cérebro tarefas/projectos — FR15 + FR32) foi rebaseada sobre `origin/main` (no-op, base já limpa), empurrada (SHA `5d312786`) e o PR #29 aberto contra `main`. Pre-push quality gates 4/4 PASS (lint exit 0 + 1 warning herdado, typecheck exit 0, test:unit **585/585**, build exit 0). CI essencial 100% verde.

A primeira tentativa de review do CodeRabbit atingiu **rate limit** (quota horária esgotada). A review foi re-disparada via `@coderabbitai review` após a janela expirar e completou: `CHANGES_REQUESTED` com **3 actionables**, dos quais **1 é finding de código da Story 2.10** (#3). Conforme `agent-authority.md`, o `@devops` não aplica fixes de código — escalado a `@dev` para Iter 2.

**EPIC-2 §8: máximo 2 iterações de CR fix-loop. Esta é a Iter 2. Iter 3 PROIBIDA sem decisão do Eurico.**

---

## Estado dos checks (PR #29)

| Check | Resultado |
|-------|-----------|
| CI essencial (Lint+TS, Vitest 585/585, Vercel, CodeQL) | 100% verde |
| Status check `CodeRabbit` (head SHA) | SUCCESS |
| `reviewDecision` GitHub-formal | CHANGES_REQUESTED |
| `mergeStateStatus` | CLEAN |

---

## Os 3 actionables CodeRabbit Iter 1

| # | Ficheiro | Linha | Severidade | Natureza |
|---|----------|-------|-----------|----------|
| 1 | `docs/stories/active/2.10.story.md` | 35 | Minor | doc-nit MD040 — fence sem linguagem |
| 2 | `docs/stories/active/2.10.story.md` | 103 | Minor | doc-nit MD056 — pipe `\|` não escapado em inline code de tabela |
| 3 | `v2/lib/agent/tools/tasks.ts` | 193-203 | Major | código — `criar_tarefa` grava `args.projecto` directamente em `task.projectId` sem validar que o projecto existe. Pode persistir `projectId` órfão. Diverge do comportamento mais estrito já implementado em `vincular_tarefa_projecto` |

### Detalhe do finding #3 (Major)

CR sugere, no handler `execute` de `criar_tarefa`, validar `args.projecto` antes de o atribuir a `task.projectId` — reutilizando a mesma lógica de verificação de existência de `vincular_tarefa_projecto`, lançando erro descritivo (`Projecto "..." não encontrado`) se não existir.

Avaliação @devops: finding legítimo de correcção. É o lado da **criação** do mesmo problema de integridade referencial que o débito D6 (cascata delete `Task.projectId`, EPIC-2 §10) cobre no lado da **eliminação**. Não é falso positivo. A consistência com `vincular_tarefa_projecto` (que já valida) reforça a recomendação.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO Nexus v2 — localização correcta.

---

## Bookkeeping pendente — incluir no commit de fix Iter 2

O `@devops` deixou bookkeeping de handoffs no working tree, **a committar pelo `@dev` junto com os fixes** (evita commit isolado desalinhado do fluxo de fix):

1. `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260520-story-2.10-architect-gate-PASS-ready-for-devops-push.md` — handoff architect→devops já **movido para `archive/`** e marcado `consumed`. Fazer `git add` deste novo path e `git rm` do path antigo (ou `git add -A` da pasta handoffs).
2. `imersao-tools/nexus/docs/handoffs/INDEX.md` — já actualizado no working tree (Pending: handoffs de escalação 2.7+2.10; Archived: handoff architect→devops 2.10). Fazer `git add`.
3. Este handoff de escalação (`RETOMA-20260520-story-2.10-pr-29-cr-iter1-escalado-dev.md`) e o da 2.7 (`RETOMA-20260520-story-2.7-pr-28-cr-iter1-escalado-dev.md`) estão untracked no working tree — incluir nos commits de fix respectivos.

## Next action

1. **`@dev` (Dex)** — `*qa-loop-fix 2.10`: aplicar os 3 fixes (#1-#3) na branch `feature/2.10-tools-cerebro` (commit de fix Iter 2) + bookkeeping acima.
2. Re-correr os quality gates locais e commitar.
3. Devolver a `@devops` (Gage) para push do commit de fix + observar CR Iter 2.
4. Se a Iter 2 fechar verde → `gh pr merge 29 --squash`.
5. Se a Iter 2 **não** fechar verde → hard-stop EPIC-2 §8, escalar ao Eurico (Iter 3 proibida sem decisão).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.10-pr-29-cr-iter1-escalado-dev.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Gage (@devops)`
DATA: `20/05/2026`
