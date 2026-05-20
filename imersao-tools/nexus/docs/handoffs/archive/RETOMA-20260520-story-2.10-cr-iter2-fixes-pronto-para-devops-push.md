# RETOMA — Story 2.10 · PR #29 · CodeRabbit Iter 2 fixes aplicados · pronto para `@devops` push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Dex (`@dev`) — `*qa-loop-fix 2.10` Iter 2
**Para:** Gage (`@devops`) — `*push` do commit de fix para PR #29
**Data:** 2026-05-20
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** CONSUMED — Gage (`@devops`) executou push `5d312786..389eb65f` (force-with-lease, pós-rebase sobre `origin/main` que incorporou a Story 2.7 `d977ade1`), CodeRabbit Iter 2 verde (0 findings actionable novos), PR #29 squash-merged `fbc337cb` em 2026-05-20T21:35:03Z
**Consumido em:** 2026-05-20
**Consumido por:** `@devops` (Gage)
**Branch:** `feature/2.10-tools-cerebro` — PR #29 MERGED (squash `fbc337cb`), branch eliminada
**PR:** https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/29

---

## Sumário executivo

`*qa-loop-fix 2.10` Iter 2 executado em iteração única. Os **3 actionables** da review CodeRabbit Iter 1 do PR #29 foram **todos resolvidos** — 1 finding de código Major + 2 doc-nits Minor. Quality gates locais 4/4 PASS. Commit de fix pronto para push.

**EPIC-2 §8: máximo 2 iterações de CR fix-loop. Esta foi a Iter 2. Iter 3 PROIBIDA sem decisão do Eurico.**

---

## Os 3 actionables CodeRabbit Iter 1 — estado

| # | Ficheiro | Severidade | Estado | Correcção |
|---|----------|-----------|--------|-----------|
| 1 | `2.10.story.md:31` | Minor (MD040) | RESOLVIDO | Code fence ` ``` ` → ` ```yaml ` |
| 2 | `2.10.story.md:102` | Minor (MD056) | RESOLVIDO | Pipes `\|` em inline code de tabela escapados com `\|` |
| 3 | `tasks.ts` `criar_tarefa` | Major | RESOLVIDO | Validação de integridade referencial — ver detalhe abaixo |

### Detalhe do finding #3 (Major) — código

`criar_tarefa` gravava `args.projecto` directamente em `task.projectId` sem verificar que o projecto existe — podia persistir um `projectId` órfão. Diverge do comportamento estrito de `vincular_tarefa_projecto` (que já valida).

Correcção: adicionado, no início do `execute` de `criar_tarefa`, o bloco de validação que espelha `vincular_tarefa_projecto`:

```typescript
if (args.projecto !== null) {
  const proj = await ctx.db.projects.get(args.projecto);
  if (proj === undefined) {
    throw new Error(`Projecto "${args.projecto}" não encontrado`);
  }
}
```

Efeito colateral nos testes: o teste T4 passava um UUID de projecto sem o semear na DB (passava por ausência de validação). T4 foi renomeado para "com projecto existente" e agora semeia `makeProject()` antes. Novo teste **T4b** cobre o caminho de erro (projecto inexistente lança `Error` PT-PT e não persiste a tarefa). Total de testes em `tasks.test.ts`: 20 → 21.

Não é falso positivo. É o lado da **criação** do mesmo problema de integridade referencial que o débito D6 (cascata delete `Task.projectId`) cobre no lado da **eliminação**.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO Nexus v2 — localização correcta. SE NÃO COINCIDIR, MOVER COM `git mv`. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Quality gates locais — 4/4 PASS

Reproduzidos a partir de `imersao-tools/nexus/v2/`:

| Gate | Resultado |
|------|-----------|
| `npm run lint` | exit 0 — 1 warning herdado (`NextResponse` não usado em `app/api/auth/logout/route.ts:1`, pré-existente, fora-scope) |
| `npm run typecheck` | exit 0 — `tsc --noEmit` limpo |
| `npm run test:unit` | **586/586 PASS** (585 canónico + 1 novo T4b) |
| `npm run build` | exit 0 — todas as rotas compiladas |

## Ficheiros do commit de fix

| Ficheiro | Acção | Notas |
|----------|-------|-------|
| `v2/lib/agent/tools/tasks.ts` | Modificar | Bloco de validação de existência de projecto em `criar_tarefa` (finding #3) |
| `v2/tests/unit/agent/tools/tasks.test.ts` | Modificar | T4 semeia projecto; novo T4b cobre erro projecto inexistente |
| `docs/stories/active/2.10.story.md` | Modificar | doc-nits #1+#2 + Change Log v0.6 + File List actualizada |
| `docs/handoffs/INDEX.md` | Modificar | Bookkeeping handoffs (Pending/Archived) |
| `docs/handoffs/archive/RETOMA-20260520-story-2.10-architect-gate-PASS-ready-for-devops-push.md` | Mover (já em archive) | Bookkeeping `@devops` absorvido |
| `docs/handoffs/RETOMA-20260520-story-2.10-pr-29-cr-iter1-escalado-dev.md` | Mover → archive | Handoff de escalação CR Iter 1 consumido |
| `docs/handoffs/RETOMA-20260520-story-2.10-cr-iter2-fixes-pronto-para-devops-push.md` | Criar | Este handoff |

> Nota: o handoff de escalação da Story 2.7 (`RETOMA-20260520-story-2.7-pr-28-cr-iter1-escalado-dev.md`) está untracked no working tree partilhado mas **não é** committado aqui — pertence ao fix-loop da Story 2.7, em curso noutro worktree.

## Next action

1. **Gage (`@devops`)** — `*push` do commit de fix para `origin/feature/2.10-tools-cerebro`, PR #29.
2. Observar CodeRabbit Iter 2.
3. Se CR Iter 2 fechar verde → `gh pr merge 29 --squash`.
4. Se CR Iter 2 **não** fechar verde → hard-stop EPIC-2 §8, escalar ao Eurico (Iter 3 proibida sem decisão).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.10-cr-iter2-fixes-pronto-para-devops-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Dex (@dev)`
DATA: `20/05/2026`
