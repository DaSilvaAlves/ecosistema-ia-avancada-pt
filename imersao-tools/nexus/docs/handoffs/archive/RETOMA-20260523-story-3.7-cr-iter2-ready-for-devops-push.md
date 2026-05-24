# RETOMA — Nexus v2 Story 3.7 CR Iter 2 fixes aplicados, pronto para `@devops *push`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 23/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Estado:** Story 3.7 — Fixes da CR Iter 1 aplicados localmente (commit `d588f08a`), pronto para push da Iter 2 no PR #36
**Localização canónica:** `imersao-tools/nexus/`
**Branch:** `feature/3.7-vista-este-mes` (4 commits local — 3 já no PR #36 + 1 novo de Iter 2)
**Tip:** `d588f08a`
**Autor:** sessão Claude Code 23/05/2026 — Dex (`@dev`) qa-loop-fix Iter 2

---

## Sumário executivo (1 parágrafo)

CodeRabbit Iter 1 do PR #36 (head `cc3d697f`) deu `CHANGES_REQUESTED` com **4 findings**: **(1)** bug funcional em `getProjectionWindow` — JSDoc dizia "inclusivo em ambos os extremos" mas o cálculo `days * MS_PER_DAY` fazia janela de 30d span 31 datas (e os 4 testes confirmavam o bug); **(2)** pipes `|sum|` não escapados em 2 cells de tabela da `3.7.story.md` (MD056); **(3-4)** 3 code fences sem language tag em 2 handoffs (MD040). Cada finding verificado contra o código actual antes de aplicar fix mínimo. **Fix #1:** `monthAggregations.ts:112` corrigido para `(days - 1) * MS_PER_DAY`; 4 expectations dos testes actualizadas para semântica inclusiva (Default 30d `2026-06-14`→`2026-06-13`; cavalo de ano `2027-01-19`→`2027-01-18`; days=1 `2026-05-16`→`2026-05-15` start===end; days=60 `2026-07-14`→`2026-07-13`). **Fixes #2-#4:** lint MD aplicado. **Quality gates Iter 2 PASS:** typecheck exit 0; lint 0 erros novos; **886/886 vitest PASS** (33/33 monthAggregations OK com novos valores). Commit `d588f08a` criado. Hard-stop §8 respeitado (Iter 2 = dentro do limite máx 2). Próximo passo: `@devops *push feature/3.7-vista-este-mes` para empurrar `d588f08a` ao PR #36 e despoletar CR Iter 2.

---

## Estado real verificado

```text
d588f08a fix(nexus-v2): Story 3.7 CR Iter 1 — janela inclusiva getProjectionWindow + MD lint fixes [Story 3.7] [Epic 3]
cc3d697f docs(nexus-v2): Story 3.7 QA Gate @dev PASS first-iter + handoff @devops [Story 3.7] [Epic 3]
f0261e38 docs(nexus-v2): handoff Story 3.7 ready for @dev quality gate [Story 3.7] [Epic 3]
75261180 feat(nexus-v2): Story 3.7 — Vista "Este mês" [Story 3.7] [Epic 3]
e985b0d0 docs(nexus-v2): fechar Story 3.6 + actualizar EPIC-3 (6/11 Done) [Story 3.6] [Epic 3]
```

| Métrica | Valor |
|---------|-------|
| Branch local | `feature/3.7-vista-este-mes` (4 ahead de `main`) |
| Branch remote | `feature/3.7-vista-este-mes` (3 commits — `cc3d697f` é HEAD remote) |
| Delta a empurrar | **1 commit novo** — `d588f08a` |
| PR | **#36 OPEN, mergeable** (`https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/36`) |
| reviewDecision antes push | `CHANGES_REQUESTED` (CR Iter 1) |
| CI Iter 1 | **all-green** (Vitest, Playwright, Regression Story 1.10, CodeQL, Vercel) |
| CodeRabbit Iter 1 | `CHANGES_REQUESTED` — 4 findings |
| Tests Vitest totais Iter 2 | **886/886 PASS** (zero regressões) |
| Coverage `monthAggregations.ts` Iter 2 | mantém 100% (4 expectations actualizadas, 0 testes removidos) |
| Working tree | 150+ untracked fora-scope + 2 submódulos modified (`comunidade`, `starter-builder`) — INTACTOS |

---

## Os 4 fixes — antes/depois (regra `mandatory-change-log.md`)

| # | Ficheiro | Linha | Antes | Depois | Razão |
|---|----------|-------|-------|--------|-------|
| 1 | `imersao-tools/nexus/v2/lib/financas/monthAggregations.ts` | 112 | `const end = new Date(start.getTime() + days * MS_PER_DAY);` | `const end = new Date(start.getTime() + (days - 1) * MS_PER_DAY);` | Janela inclusiva — N dias cobrem exactamente N datas (alinha com JSDoc + AC1) |
| 2 | `imersao-tools/nexus/v2/tests/unit/financas/monthAggregations.test.ts` | 95-99 | `endISO: '2026-06-14'` | `endISO: '2026-06-13'` | Default 30d inclusiva |
| 3 | (mesmo ficheiro) | 102-107 | `endISO: '2027-01-19'` | `endISO: '2027-01-18'` | Cavalo de ano 30d inclusiva |
| 4 | (mesmo ficheiro) | 109-114 | `endISO: '2026-05-16'` (descrição "janela de 24h") | `endISO: '2026-05-15'` (descrição "janela degenerada — start === end") | days=1 inclusiva → mesmo dia |
| 5 | (mesmo ficheiro) | 116-121 | `endISO: '2026-07-14'` | `endISO: '2026-07-13'` | days=60 inclusiva |
| 6 | `imersao-tools/nexus/docs/stories/active/3.7.story.md` | 128 | <code>ordenada por &#124;sum&#124; desc</code> (célula tabela A7) | <code>ordenada por &#124;sum&#124; desc</code> | Pipes escapados em cell de tabela (MD056) |
| 7 | (mesma story) | 254 | <code>descendente por &#124;sum&#124; em aggregateByCategory;</code> (célula CR Focus Areas) | <code>descendente por &#124;sum&#124; em aggregateByCategory;</code> | Pipes escapados em cell de tabela (MD056) |
| 8 | `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.7-qa-pass-ready-for-devops-push.md` | 25 | ` ``` ` (vazio) | ` ```text ` | Language tag (MD040) |
| 9 | `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260523-story-3.7-ready-for-dev-quality-gate.md` | 25 | ` ``` ` (vazio) | ` ```text ` | Language tag commit log (MD040) |
| 10 | (mesmo archive) | 86 | ` ``` ` (vazio) | ` ```text ` | Language tag pseudo-code page (MD040) |

Adicionalmente, na `3.7.story.md`:
- Change Log v1.4 adicionado a explicar a Iter 2
- QA Results recebeu sub-secção `Veredicto Iter 2` antes do veredicto Iter 1 (mantido como histórico)

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.7-cr-iter2-ready-for-devops-push.md`. ESTÁ DENTRO DA PASTA `imersao-tools/nexus/` (projecto Nexus v2 a que se refere). LOCALIZAÇÃO VÁLIDA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Quality gates locais Iter 2 re-executados

| Gate | Comando | Resultado |
|------|---------|-----------|
| Typecheck | `npm run typecheck` (a partir de `imersao-tools/nexus/v2`) | **exit 0** |
| Lint | `npm run lint` (mesma pasta) | **0 erros novos** — único warning é `app/api/auth/logout/route.ts:1:23 NextResponse defined but never used` (pré-existente, fora-scope) |
| Tests | `npx vitest run` (mesma pasta) | **886/886 PASS** (66 test files, 15.75s) — 33/33 monthAggregations OK com novos valores inclusivos |

Validação direccionada do helper afectado: `npx vitest run tests/unit/financas/monthAggregations.test.ts` → 33/33 PASS (18ms tests, 2.05s total).

---

## Not-Tested Evidence Gate — mantém N/A

Os 4 fixes da Iter 2 tocam:
1. `lib/financas/monthAggregations.ts` (código aplicação)
2. `tests/unit/financas/monthAggregations.test.ts` (testes — não config do runner)
3. `docs/stories/active/3.7.story.md` (documentação)
4. `docs/handoffs/*.md` (documentação)

Nenhum dos paths bloqueadores do `not-tested-trailer-rules.md` é tocado:
- `.github/workflows/**` → NÃO
- `vitest.config.ts` → NÃO
- `playwright.config.ts` → NÃO
- `tsconfig*.json` → NÃO
- `package.json` (`scripts`) → NÃO
- Caminhos de segurança (auth/RLS/middleware) → NÃO

Mantém N/A. Sem evidência extra exigida.

---

## Próximo passo — `@devops *push feature/3.7-vista-este-mes`

### 1. Push do commit Iter 2 ao remote existente

```bash
cd C:/Users/XPS/Documents/ecosistema-ia-avancada-pt
git push origin feature/3.7-vista-este-mes
```

Como o remote já existe (HEAD remote `cc3d697f`), basta um fast-forward push do commit `d588f08a`. Não é preciso `-u`.

### 2. Aguardar CodeRabbit Iter 2 + CI

| Cenário | Acção do Eurico |
|---------|-----------------|
| CR Iter 2 APPROVED + CI all-green | `gh pr merge 36 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch` → activar `@po *close-story 3.7` → Epic 3 7/11 Done |
| CR Iter 2 ainda `CHANGES_REQUESTED` | **Hard-stop §8 ATINGIDO** (máx 2 iter). Iter 3 ou merge waived exigem autorização humana explícita do Eurico em trailer `Constraint:` do commit — escalar |
| CI red | Activar `@dev` para investigar logs do workflow falhado |

### 3. Verificação do PR após push

```bash
gh pr view 36 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json state,mergeable,reviewDecision,statusCheckRollup,headRefOid
```

`headRefOid` deve passar de `cc3d697f...` para `d588f08a...` após o push. `reviewDecision` mantém-se `CHANGES_REQUESTED` até CR submeter Iter 2.

---

## Convenções operacionais Epic 3 (relembrar — NÃO reabrir)

| Convenção | Detalhe |
|-----------|---------|
| Test policy Epic 3 | Componentes React Finanças sem unit tests; helper puro 100% coverage mantém-se |
| Repo isolation | Helpers em `lib/financas/*.ts`; page consome via hooks |
| Page tab strip | 5 separadores em `/financas`; vistas analíticas são sub-rotas |
| Hard-stop §8 | **Máximo 2 iter CR.** Iter 3 ou merge waived exigem autorização humana explícita do Eurico no trailer `Constraint:` do commit |
| `gh pr *` | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Push exclusivo `@devops` | Constitution Artigo II |
| Merge manual Eurico | `gh pr merge X --squash --delete-branch` (não `@devops`) |

---

## Caveats operacionais críticos

| Caveat | Detalhe |
|--------|---------|
| Working tree | 150+ untracked fora-scope + 2 submódulos modified (`comunidade`, `starter-builder`) — INTACTOS, NÃO mexer |
| Pasta exacta terminal novo | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt` |
| Idioma | PT-PT obrigatório |
| Commit Iter 2 | `d588f08a` — único commit a fazer fast-forward push (HEAD remote actual é `cc3d697f`) |

---

## Ficheiros tocados (5 + este handoff)

1. `imersao-tools/nexus/v2/lib/financas/monthAggregations.ts` — 1 linha (bug fix)
2. `imersao-tools/nexus/v2/tests/unit/financas/monthAggregations.test.ts` — 4 expectations + 2 descrições
3. `imersao-tools/nexus/docs/stories/active/3.7.story.md` — 2 linhas (pipes) + Change Log v1.4 + QA Results sub-secção Iter 2
4. `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.7-qa-pass-ready-for-devops-push.md` — 1 fence
5. `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260523-story-3.7-ready-for-dev-quality-gate.md` — 2 fences

Diff stat global: **5 files changed, 31 insertions(+), 15 deletions(-)**

---

## Ficheiros de referência

1. `docs/HANDOFF-INDEX.md` — adicionar entrada deste handoff em pending (responsabilidade de quem o cria; ver passo abaixo)
2. `imersao-tools/nexus/docs/stories/active/3.7.story.md` — story actualizada com Change Log v1.4 + QA Results Iter 2
3. `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.7-qa-pass-ready-for-devops-push.md` — handoff Iter 1 anterior (continua válido para o PR base)
4. `imersao-tools/nexus/docs/EPIC-3.md` §8 — hard-stop CR
5. `imersao-tools/nexus/v2/lib/financas/monthAggregations.ts:102-117` — função corrigida
6. `imersao-tools/nexus/v2/tests/unit/financas/monthAggregations.test.ts:94-146` — bloco `getProjectionWindow` actualizado
7. `.claude/rules/separation-of-roles.md` — A6 (executor != quality_gate)
8. `.claude/rules/not-tested-trailer-rules.md` — paths bloqueadores (N/A para esta Iter 2)
9. `.claude/rules/mandatory-change-log.md` — formato antes/depois respeitado

Memórias relevantes: `project_nexus_v2_epic_3.md`, `project_nexus_v2_architecture.md`, `project_nexus_v2_producao.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-story-3.7-cr-iter2-ready-for-devops-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Dex (`@dev`) — qa-loop-fix Iter 2 conforme convenção Epic 3 §5 + `separation-of-roles.md` A6
DATA: `23/05/2026`
