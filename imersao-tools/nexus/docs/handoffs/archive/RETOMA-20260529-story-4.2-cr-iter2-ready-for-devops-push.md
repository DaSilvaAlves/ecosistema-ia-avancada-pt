# RETOMA — Story 4.2 CR Iter 2 fixes aplicados, pronto para `@devops` re-correr CR pre-PR (Iter 2) → push → PR

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Dex (`@dev`)
**Para:** Gage (`@devops`)
**Data:** 29/05/2026
**Estado:** consumed
**consumed:** true
**consumed_at:** 2026-05-29T18:42:00Z
**consumed_by:** devops (Gage)
**Story:** 4.2 (CRUD Hábitos + extracção UI partilhada, Epic 4)
**Branch:** `feat/story-4.2-crud-habitos` (local, NÃO pushada)
**HEAD local:** `2ae7555f` (commit de fix Iter 2, sobre `7760c422`)

---

## Resumo

`*qa-loop-fix 4.2` Iter 2 (a ÚLTIMA sem autorização humana — hard-stop §8). O CodeRabbit pre-PR Iter 1 levantou **1 finding CRITICAL** em `app/(app)/habitos/page.tsx:155-167` (limpar o horário no edit não o removia da DB). **RESOLVIDO.** Investigado o comportamento real do Dexie `update()` (não assumido): chave AUSENTE no patch é ignorada (valor antigo persiste); chave PRESENTE com `undefined` faz a Dexie remover a chave. O bug era a chave `time` ficar fora do patch ao limpar. Correcção = a do CR: **patch único e atómico** com a chave `time` sempre presente (`undefined` quando limpo). Sem `time: null` (colidiria com o tipo `string | undefined` e o `HabitSchema.time` `.optional()` sem `.nullable()`). +4 testes não-tautológicos. Gates locais PASS. CodeRabbit self-review (uncommitted) **0 findings**. Commit local `2ae7555f` — **NÃO houve push** (autoridade exclusiva `@devops`).

---

## Contexto

### Estado git

- Branch local `feat/story-4.2-crud-habitos` (NÃO pushada), 3 commits sobre `origin/main` (`87168cd3`):
  - `ed042fac` — implementação @dev (17 ficheiros)
  - `7760c422` — docs: QA gate PASS + InReview (Quinn)
  - `2ae7555f` — **fix Iter 2 (este handoff)**: 4 ficheiros, +125/-12
- Working tree fora-scope INTACTO: submodules `comunidade`/`starter-builder` modified (pré-existentes), 150+ untracked fora-scope. **NÃO mexer.**

### Ficheiros tocados nesta Iter 2 (commit `2ae7555f`)

| Ficheiro | Mudança |
|----------|---------|
| `v2/app/(app)/habitos/page.tsx` | Edit branch (L155-167): patch único com chave `time` sempre presente (era patch sem `time` + 2ª chamada condicional). Comentário enganador L156-157 corrigido. Uma só `updateHabit`. |
| `v2/tests/unit/db/repos/habits.test.ts` | +2 testes: `updateHabit({time:undefined})` REMOVE a chave (`hasOwnProperty` false); `updateHabit` sem chave `time` NÃO toca o `time` antigo (contraprova do bug). |
| `v2/tests/unit/app/habitos/HabitsPage.test.tsx` | +2 testes do edit branch: limpar→patch com `time:undefined` presente (uma só chamada); definir→`time` no patch único. |
| `docs/stories/active/4.2.story.md` | Change Log v0.5 + tabela diff linha-a-linha (Dev Agent Record) + reconciliação AC4 (D-RESTORE, recomendação @qa L384) + gotcha #5 (nit→CRITICAL→resolvido) + QA Results L406 (reclassificação). |

### Decisão técnica chave (para o CR não reabrir)

A recomendação literal `time: null` do CR foi **descartada com fundamento** (registado na story §gotcha #5 + Change Log v0.5):
- Tipo `Habit.time` é `string | undefined` (sem `null`) — `null` quebra typecheck.
- `HabitSchema.time` é `.optional()` sem `.nullable()` — `null` falha a validação Zod no `updateHabit`.
- "Sem horário" = ausência da chave (coerente com D-RESTORE de `archivedAt`), não `null`.
- A Dexie remove a chave quando o patch a inclui com `undefined` — provado por teste. Logo o patch único com `time: undefined` é a solução correcta e atómica, sem mudança de tipo/schema (sem FLAG `@architect`).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260529-story-4.2-cr-iter2-ready-for-devops-push.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Gates locais (evidência fresca 29/05/2026) — TODOS PASS

| Gate | Resultado |
|------|-----------|
| `npm run lint` | PASS (1 warning pré-existente fora-scope `app/api/auth/logout/route.ts`) |
| `npm run typecheck` | PASS (`tsc --noEmit` exit 0) |
| `npm run test:unit` | **1072/1072 PASS** (81 ficheiros) — era 1068, +4 testes Iter 2 |
| Coverage `app/(app)/habitos/page.tsx` | **74.72%** (era 62.54%, +12.18pp) — ≥60% NFR17 |
| Coverage `habits.ts` | 100% (inalterado) |
| CodeRabbit self-review (uncommitted, WSL) | **0 findings** (self-review `@dev`; não é o gate) |

> Nota: o CR pre-PR `--base main` recusou com `payload_too_large` (o repo raiz tem 150+ untracked fora-scope; o CR diffa contra main no repo inteiro). A self-review foi feita em modo `uncommitted` a partir de `imersao-tools/nexus` (âmbito exacto do fix). O CR pre-PR server-side do PR (filtra pela branch) não terá esse problema.

## Próxima acção (`@devops`)

1. `*push feat/story-4.2-crud-habitos` para `origin` (3 commits: `ed042fac` + `7760c422` + `2ae7555f`).
2. `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main --head feat/story-4.2-crud-habitos --title "feat(nexus-v2): CRUD hábitos + extracção UI partilhada [Story 4.2] [Epic 4]"`.
3. CR pre-PR Iter 2 server-side (~7-12 min). **Esperado APPROVED** — o CRITICAL Iter 1 está resolvido e a self-review uncommitted deu 0 findings.

### Cenários pós-push

- **(A) CR Iter 2 APPROVED + CI green** → Eurico `gh pr merge {N} --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch` → `@po *close-story 4.2` → Epic 4 **2/10 Done**.
- **(B) CR Iter 2 CHANGES_REQUESTED** → **STOP. Hard-stop §8 ATINGIDO** (Iter 2 = último round automático). Iter 3 ou merge waived exigem **autorização humana explícita do Eurico** em trailer `Authorized-by:`/`Constraint:` no commit. NÃO avançar Iter 3 sem isso.
- **(C) CI red** → escalar `@dev` para investigar (`not-tested-trailer-rules.md` — esta Iter NÃO tocou CI/runner/build/segurança, só código de app + testes).

### Caveats operacionais

- `gh pr *` requer SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- Push exclusivo `@devops`. Eurico faz merge manual (não `@devops`).
- Pasta exacta: `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt`.
- Passo 0 no terminal `@devops`: `cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"; git log --oneline -3` — validar HEAD `2ae7555f` na branch `feat/story-4.2-crud-habitos`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260529-story-4.2-cr-iter2-ready-for-devops-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Dex (@dev)`
DATA: `29/05/2026`
