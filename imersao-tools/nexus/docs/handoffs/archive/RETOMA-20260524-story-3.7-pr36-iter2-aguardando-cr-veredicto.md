# RETOMA — Nexus v2 Story 3.7 PR #36 Iter 2 pushed, aguardando veredicto CodeRabbit + CI

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 24/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Estado:** Story 3.7 — Iter 2 pushed ao PR #36 (HEAD `5437d893`), a aguardar CR Iter 2 server-side + último CI check (50-prompt regression)
**Localização canónica:** `imersao-tools/nexus/`
**Branch:** `feature/3.7-vista-este-mes` (5 commits ahead de `main`, sincronizada com `origin/feature/3.7-vista-este-mes` excepto este handoff)
**Tip:** `5437d893` (remote) + 1 commit local pendente (este handoff) — **NÃO pusheado para não disparar CR Iter 3**
**Autor:** sessão Claude Code 23-24/05/2026 — Dex `*qa-loop-fix 3.7` → Gage `*push` → handoff (cross-terminal)

---

## SUMÁRIO EXECUTIVO (1 parágrafo)

PR #36 da Story 3.7 (Vista "Este mês" — FR21) está em **Iter 2** após CR Iter 1 ter dado `CHANGES_REQUESTED` com 4 findings (1 bug funcional `getProjectionWindow` + 3 lint MD). Dex aplicou os 4 fixes em commit `d588f08a` (com 4 expectations de tests actualizadas para semântica inclusiva). Gage criou handoff em `5437d893` e fez push fast-forward `cc3d697f..5437d893` ao PR #36. **Estado pós-push verificado:** HEAD remote = `5437d893` ✓; mergeable: MERGEABLE; reviewDecision: ainda `CHANGES_REQUESTED` (stale do Iter 1 — vai actualizar quando CR Iter 2 submeter veredicto); **14/15 CI checks SUCCESS, 1 RUNNING (50-prompt regression), 0 FAILED**; CodeRabbit Iter 2 = **PENDING** (server-side, demora 7-30 min total); Vercel preview = SUCCESS. Quality gates locais Iter 2 já tinham passado (886/886 vitest, typecheck exit 0, lint 0 erros novos). **Hard-stop §8 EPIC-3:** estamos na **Iter 2** = último round automático; Iter 3 ou merge waived exigem autorização humana explícita do Eurico em trailer `Constraint:`.

---

## ESTADO REAL VERIFICADO (snapshot no momento deste handoff)

```text
{handoff local pendente — não committed ainda no momento do snapshot}
5437d893 docs(nexus-v2): handoff Story 3.7 CR Iter 2 ready for @devops push [Story 3.7] [Epic 3]
d588f08a fix(nexus-v2): Story 3.7 CR Iter 1 — janela inclusiva getProjectionWindow + MD lint fixes [Story 3.7] [Epic 3]
cc3d697f docs(nexus-v2): Story 3.7 QA Gate @dev PASS first-iter + handoff @devops [Story 3.7] [Epic 3]
f0261e38 docs(nexus-v2): handoff Story 3.7 ready for @dev quality gate [Story 3.7] [Epic 3]
75261180 feat(nexus-v2): Story 3.7 — Vista "Este mês" [Story 3.7] [Epic 3]
e985b0d0 docs(nexus-v2): fechar Story 3.6 + actualizar EPIC-3 (6/11 Done) [Story 3.6] [Epic 3]
```

| Métrica | Valor |
|---------|-------|
| PR | **#36 OPEN, mergeable** ([link](https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/36)) |
| HEAD remote | `5437d893` (Iter 2 pushed) |
| Branch local | `feature/3.7-vista-este-mes` (igual ao remote + 1 commit local não-pusheado deste handoff) |
| Quality gates locais Iter 2 | typecheck exit 0; lint 0 erros novos; **886/886 vitest PASS** |
| CI server-side | 14 SUCCESS / 1 RUNNING (50-prompt regression) / 0 FAILED / 15 SKIPPED (não-aplicáveis) |
| CodeRabbit Iter 2 | **PENDING** server-side |
| Vercel | SUCCESS |
| reviewDecision | `CHANGES_REQUESTED` (stale do Iter 1; vai actualizar) |
| Hard-stop §8 | **Iter 2** (último round automático). Iter 3 ou merge waived exigem autorização explícita |
| Waiver rate Epic 3 | 0/6 (manter 0% se merge limpo) |
| Working tree | 150+ untracked fora-scope + 2 submódulos modified (`comunidade`, `starter-builder`) — INTACTOS |

---

## OS 4 FIXES DA ITER 2 (já aplicados — referência rápida)

| # | Ficheiro:linha | Antes | Depois | Razão |
|---|----------------|-------|--------|-------|
| 1 | `imersao-tools/nexus/v2/lib/financas/monthAggregations.ts:112` | `days * MS_PER_DAY` | `(days - 1) * MS_PER_DAY` | Janela inclusiva — N dias cobrem exactamente N datas (CR bug funcional) |
| 2 | `imersao-tools/nexus/v2/tests/unit/financas/monthAggregations.test.ts:95-121` | endISO `2026-06-14` / `2027-01-19` / `2026-05-16` / `2026-07-14` | endISO `2026-06-13` / `2027-01-18` / `2026-05-15` / `2026-07-13` | 4 expectations actualizadas para reflectir nova semântica inclusiva |
| 3 | `imersao-tools/nexus/docs/stories/active/3.7.story.md:128 e :254` | `` `|sum|` `` em cells de tabela | `` `\|sum\|` `` (escapado) | MD056 |
| 4 | 2 handoffs (`RETOMA-...-qa-pass-...md:25` + `archive/...-ready-for-dev-...md:25,86`) | ` ``` ` (sem language tag) | ` ```text ` | MD040 |

Commit pivô da Iter 2: **`d588f08a`** — 5 ficheiros, 31 ins / 15 del, trailers `Constraint: getProjectionWindow deve cobrir exactamente N dates inclusivos`, `Rejected: aceitar bug porque tests passavam`, `Confidence: high`, `Scope-risk: narrow`, `Directive: mudar getProjectionWindow exige actualização paralela dos 4 testes`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260524-story-3.7-pr36-iter2-aguardando-cr-veredicto.md`. ESTÁ DENTRO DA PASTA `imersao-tools/nexus/` (projecto Nexus v2 a que se refere). LOCALIZAÇÃO VÁLIDA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## PRÓXIMA ACÇÃO NO OUTRO TERMINAL — 3 CENÁRIOS

### Passo 0 (obrigatório) — verificar estado actual do PR #36

```bash
cd C:/Users/XPS/Documents/ecosistema-ia-avancada-pt
gh pr view 36 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json headRefOid,state,mergeable,reviewDecision,statusCheckRollup
```

**Validar:**
- `headRefOid` deve continuar `5437d893d425bcfb2506e1b3ef917cbf27a30905` (se mudou, alguém empurrou outro commit — investigar antes de continuar)
- `mergeable` = `MERGEABLE`
- Procurar `"context":"CodeRabbit"` no `statusCheckRollup` → ver `state` (PENDING / SUCCESS / FAILURE)
- Procurar `"name":"50-prompt regression"` → deve estar `SUCCESS` agora (era o único RUNNING no momento do handoff)

### Passo 1 — ler review do CR Iter 2 (assim que sair de PENDING)

```bash
gh pr view 36 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json reviews | python -c "
import json,sys
data=json.load(sys.stdin)
for r in data['reviews'][-3:]:
    if r['author']['login']=='coderabbitai':
        print('--- CR review ---')
        print(f'state: {r[\"state\"]}')
        print(f'commit: {r[\"commit\"][\"oid\"][:8] if r[\"commit\"] else \"-\"}')
        print(r['body'][:3000])
"
```

Identificar se CR Iter 2 deu `APPROVED`, `CHANGES_REQUESTED` ou `COMMENTED`. **A review do Iter 2 deve corresponder ao commit `5437d893` ou `d588f08a`** — se for de `cc3d697f` ainda, é a Iter 1 (espera mais).

### Cenário A — CR Iter 2 `APPROVED` + CI all-green

**Acção do Eurico (manual, NÃO @devops):**

```bash
gh pr merge 36 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch
```

**Depois:** activar `@po *close-story 3.7` que faz:
1. Story `git mv` `active/` → `completed/`
2. `EPIC-3.md` 6/11 → **7/11 Done**
3. DoD checklist 15/15 PASS
4. Closure commit em main (`docs(nexus-v2): fechar Story 3.7 + actualizar EPIC-3 (7/11 Done) [Story 3.7] [Epic 3]`)
5. Padrão consolidado: **7 stories Epic 3 first-iter PASS consecutivas** (3.1-3.7) mas com **1 iter CR** desta vez (a primeira no Epic 3 a precisar de qa-loop-fix)
6. Waiver rate Epic 3: **0/7** mantém

### Cenário B — CR Iter 2 `CHANGES_REQUESTED` (HARD-STOP §8 ATINGIDO)

**Eurico decide:**
1. **Opção B1 — Iter 3 excepcional autorizada:** activar `@dev *qa-loop-fix 3.7` com trailer `Constraint: Iter 3 autorizada manualmente por Eurico — razão: {…}`. NÃO pode ser auto-aplicado.
2. **Opção B2 — Merge waived:** activar `@devops *push` de closure commit com trailer `Constraint: hard-stop §8 atingido, fixes CR Iter 2 não-bloqueantes — autorizado por Eurico`. Waiver rate Epic 3 sobe para **1/7** (~14%, ainda dentro do alvo <20%). Documentar débito em `EPIC-3.md` §10.
3. **Opção B3 — Abandonar PR:** fechar PR sem merge, eliminar branch. **NÃO recomendado** (perde trabalho de implementação completo).

**Recomendação default:** ler primeiro os findings da CR Iter 2 — se forem cosméticos (lint MD, comentários, doc), Opção B2 (waived) é apropriada. Se forem bugs funcionais reais ou regressões, Opção B1 (Iter 3).

### Cenário C — CI red

Algum check técnico falhou (Lint+TS, Vitest, Playwright, regression, CodeQL). **Acção:**

```bash
gh pr view 36 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json statusCheckRollup | python -c "
import json,sys
data=json.load(sys.stdin)
failed=[c for c in data['statusCheckRollup'] if c.get('conclusion') in ('FAILURE','CANCELLED','TIMED_OUT')]
for c in failed: print(f'FAILED: {c.get(\"name\",c.get(\"context\",\"?\"))} -> {c.get(\"detailsUrl\")}')
"
```

Activar `@dev` para investigar logs do workflow falhado. Provavelmente nada partiu (886/886 vitest local PASS + push fast-forward limpo), mas se algum workflow distinto do que correu local detectar algo, é necessário fix.

---

## COMO RECONSTRUIR CONTEXTO RÁPIDO (cold start no outro terminal)

Ler nesta ordem:
1. **Este handoff** (sumário + 4 fixes + 3 cenários)
2. **`imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.7-cr-iter2-ready-for-devops-push.md`** — detalhe técnico dos 4 fixes (antes/depois) e plano de teste
3. **`imersao-tools/nexus/docs/stories/active/3.7.story.md`** §QA Results — sub-secção "Veredicto Iter 2" + Change Log v1.4
4. **`imersao-tools/nexus/docs/EPIC-3.md`** §8 — hard-stop CR rules (máx 2 iter)
5. **`.claude/rules/separation-of-roles.md`** — convenção `executor != quality_gate` (irrelevante neste momento, mas referência se houver dúvida)
6. **`.claude/rules/not-tested-trailer-rules.md`** — paths bloqueadores (N/A para Iter 2)

---

## CONVENÇÕES OPERACIONAIS EPIC 3 (NÃO reabrir — consolidadas)

| Convenção | Detalhe |
|-----------|---------|
| Test policy Epic 3 | Componentes React Finanças sem unit tests; helpers puros 100% coverage |
| Repo isolation | Helpers em `lib/financas/*.ts`; pages consomem via hooks; zero `db.*` directo |
| Page tab strip `/financas` | 5 separadores; vistas analíticas (3.7/3.8/3.9) são sub-rotas |
| Hard-stop §8 | **Máximo 2 iter CR.** Iter 3 ou merge waived exigem trailer `Constraint:` com autorização explícita Eurico |
| `gh pr *` | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Push exclusivo | `@devops` (Gage) — Constitution Artigo II |
| Merge | **Manual pelo Eurico** com `gh pr merge X --admin --squash --delete-branch`. NÃO `@devops` |
| Closure | `@po *close-story X.Y` — docs-only directo em `main` sem PR (convenção Nexus v2 desde Story 2.2) |
| Mandatory Change Log | Tabela antes/depois em commits e handoffs (`.claude/rules/mandatory-change-log.md`) |
| Mock fidelity | Mocks de protocolos externos espelham o protocolo real (`.claude/rules/mock-protocol-fidelity.md`) — N/A aqui |

---

## CAVEATS OPERACIONAIS CRÍTICOS

| Caveat | Detalhe |
|--------|---------|
| Repo | `DaSilvaAlves/ecosistema-ia-avancada-pt` (SEMPRE `--repo` nos comandos `gh`) |
| Pasta exacta terminal | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt` (Windows; outras shells: usar barras `/` em paths) |
| Working tree | 150+ untracked fora-scope + 2 submódulos modified (`comunidade`, `starter-builder`) — **INTACTOS, NÃO MEXER** (caveat persistente desde Stories 3.1-3.6) |
| Idioma | PT-PT obrigatório (regra `language-standards.md`) |
| Este handoff não-pusheado | Commit local; **NÃO push antes do CR Iter 2 sair de PENDING** — evitar invalidar a review em curso ao introduzir um novo HEAD |
| Submódulos | NUNCA fazer commit dos paths `imersao-tools/comunidade` e `imersao-tools/starter-builder` (são submodules, gestão separada) |
| Não-amend de commits | Commits de fix da Iter 2 (`d588f08a`, `5437d893`) NÃO podem ser amended — criar novo commit se necessário (regra `CLAUDE.md` global) |

---

## FICHEIROS DE REFERÊNCIA

1. `docs/HANDOFF-INDEX.md` — adicionar entrada deste handoff em pending (a fazer no commit)
2. `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.7-cr-iter2-ready-for-devops-push.md` — handoff Iter 2 técnico (4 fixes detalhados)
3. `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.7-qa-pass-ready-for-devops-push.md` — handoff Iter 1 (push original — agora obsoleto mas referenciado no INDEX como SUPERSEDED)
4. `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260523-story-3.7-ready-for-dev-quality-gate.md` — handoff Uma → Dex (quality gate Iter 1)
5. `imersao-tools/nexus/docs/stories/active/3.7.story.md` — story com Change Log v1.4 + QA Results Iter 1 + Iter 2
6. `imersao-tools/nexus/docs/EPIC-3.md` — Epic 3 status (6/11 Done; 7/11 após merge Story 3.7)
7. `imersao-tools/nexus/v2/lib/financas/monthAggregations.ts:102-117` — função corrigida na Iter 2
8. `imersao-tools/nexus/v2/tests/unit/financas/monthAggregations.test.ts:94-146` — bloco `getProjectionWindow` actualizado

Memórias relevantes: `project_nexus_v2_epic_3.md`, `project_nexus_v2_architecture.md`, `project_nexus_v2_producao.md`.

---

## ESTADO MENTAL NO MOMENTO DESTE HANDOFF

- Sessão actual: `@dev` Dex executou `*qa-loop-fix 3.7` (4 fixes + Change Log) → `@devops` Gage executou `*push` → agora a aguardar resultado server-side (CR + último CI check).
- 50-prompt regression a correr (~2-3 min restantes no momento do handoff).
- CodeRabbit Iter 2 server-side em PENDING (não há ETA preciso; média histórica Epic 3 = 7-12 min para PRs pequenos como este).
- Não há nada **executável** pelo agente neste momento — apenas verificação/decisão pelo Eurico.
- O Eurico optou por preparar este handoff para continuar noutro terminal em vez de ficar à espera nesta sessão.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260524-story-3.7-pr36-iter2-aguardando-cr-veredicto.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Gage (`@devops`) — handoff cross-terminal portátil após `*push` Iter 2 PR #36
DATA: `24/05/2026`
