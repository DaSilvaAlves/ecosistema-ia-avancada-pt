# RETOMA — Story 1.10 PR #14 com CI vermelho, @dev investigar root cause + fix

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 11/05/2026
**Autor:** Pax (@po) — sessão de re-validação accionada pelo Eurico
**De:** `@po` (Pax)
**Para:** `@dev` (Dex) — investigar e corrigir CI fail antes de @po fechar story
**Acção esperada:** Investigar 2 jobs FAILURE em PR #14 → identificar root cause → fix → push para `feat/nexus-v2-story-1.10-e2e-regression` → quando CI verde, devolver para `@po *close-story 1.10`

---

## TL;DR

Story 1.10 (E2E Regression, última do Epic 1) tem PR #14 aberto em `Ready for Review` desde 09/05/2026 mas **2 jobs CI estão FAILURE** desde a push inicial. Eurico re-invocou `@po *validate-story-draft 1.10` em 11/05, e Pax confirmou que a story não está em Draft (já passou todo o SDC) — mas também não pode fechar com CI vermelho. **Escalado para @dev investigar root cause + corrigir.**

| Item | Valor |
|------|-------|
| Story | `1.10` (E2E Regression — 50 prompts PT-PT) |
| Status story | `Ready for Review` (NÃO mexer até CI verde) |
| PR | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/14 |
| Branch | `feat/nexus-v2-story-1.10-e2e-regression` (HEAD `d77ebf37`) |
| Base | `main` (`2adb6810`) |
| mergeStateStatus | `UNSTABLE` |
| Epic 1 | 9/10 Done + 1 Ready for Review — só fecha quando 1.10 mergir |

---

## CI Failures detectadas (snapshot 11/05/2026 manhã)

Run ID do `50-prompt regression` job: `25605084204` (09/05/2026 15:48:27Z)

| Job | Workflow | Conclusão | Hora |
|-----|----------|-----------|------|
| `50-prompt regression` | `Nexus v2 — E2E Regression (Story 1.10)` (novo) | **FAILURE** | 15:48:27Z |
| `Playwright E2E + bundle key check` | `Nexus v2 CI` (existente) | **FAILURE** | 15:47:02Z |

Todos os outros checks (Lint+TypeScript, Vitest, CodeQL, Coverage, Vercel preview, CodeRabbit Status, Validation Summary) estão **SUCCESS**.

---

## Pistas críticas dos logs (job 25605084204)

### 1. Path errado no upload de artifact

```
##[warning]No files were found with the provided path: imersao-tools/nexus/v2/playwright-report/
```

**Hipótese forte:** o workflow `e2e-regression.yml` aponta para `imersao-tools/nexus/v2/playwright-report/` mas o path canónico do projecto é `imersao-tools/nexus/` (sem `v2/`).

Linhas a verificar no workflow:

```yaml
# Em .github/workflows/e2e-regression.yml — procurar todas as referências a `v2/`
working-directory: imersao-tools/nexus/v2  # ← provavelmente errado
path: imersao-tools/nexus/v2/playwright-report/  # ← provavelmente errado
path: imersao-tools/nexus/v2/tests/e2e/regression/report/  # ← provavelmente errado
```

Comando para identificar todas as ocorrências `v2/` no workflow novo:

```bash
git -C "C:/Users/XPS/Documents/ecosistema-ia-avancada-pt" show feat/nexus-v2-story-1.10-e2e-regression:.github/workflows/e2e-regression.yml | grep -n "v2/"
```

### 2. Submódulo orfão em `.gitmodules`

```
fatal: No url found for submodule path 'imersao-tools/briefing-generator' in .gitmodules
##[warning]The process '/usr/bin/git' failed with exit code 128
```

O caminho `imersao-tools/briefing-generator` está registado como submódulo mas `.gitmodules` não tem entry correspondente — pode estar a causar checkout parcial.

Comando para inspeccionar:

```bash
git -C "C:/Users/XPS/Documents/ecosistema-ia-avancada-pt" show feat/nexus-v2-story-1.10-e2e-regression:.gitmodules
git -C "C:/Users/XPS/Documents/ecosistema-ia-avancada-pt" ls-tree feat/nexus-v2-story-1.10-e2e-regression imersao-tools/briefing-generator
```

### 3. Métricas de teste sintomáticas

```
P95: 0ms (budget <2000ms)
Canonical all PASS: false
##[error]Pass rate below threshold
```

**P95 = 0ms é fisicamente impossível com testes Playwright reais a correr.** Indica que os testes **nunca chegaram a executar**. Combinado com pistas 1 e 2, hipótese consolidada:

> O workflow faz checkout, falha no submódulo, depois tenta correr o spec a partir do path errado (`imersao-tools/nexus/v2/`), o spec não existe ali → Playwright não corre → métricas ficam todas a zero → script de pass-rate detecta `0/50` e falha.

---

## Hipóteses ordenadas por probabilidade

| # | Hipótese | Probabilidade | Como confirmar |
|---|----------|---------------|----------------|
| H1 | Workflow `e2e-regression.yml` usa path `imersao-tools/nexus/v2/` em vez de `imersao-tools/nexus/` | **ALTA** | `git show feat/...:.github/workflows/e2e-regression.yml \| grep v2/` |
| H2 | Submódulo `briefing-generator` orfão impede checkout limpo do feat branch | **MÉDIA** | `git show feat/...:.gitmodules` |
| H3 | `regression.spec.ts` aponta para fixture path errado relativo ao working-directory do workflow | **MÉDIA** | Ler `regression.spec.ts` + `route-handler.ts` no feat branch |
| H4 | `window.__nexusDB` não exposto em produção (GAP-2 conhecido) | BAIXA | Helper `dexie-eval.ts` é defensivo, devia mascarar — mas verificar |
| H5 | Mock SSE protocol mismatch (algum field em `ExecutorSSEEvent`) | BAIXA | Improvável dado MSW handlers já validados em handoff anterior |

---

## Comandos prontos para o terminal seguinte

```bash
# 1. Mudar para feat branch (working tree volta a ter Story 1.10)
git -C "C:/Users/XPS/Documents/ecosistema-ia-avancada-pt" checkout feat/nexus-v2-story-1.10-e2e-regression

# 2. Investigar paths no workflow
grep -n "v2/" .github/workflows/e2e-regression.yml
grep -rn "imersao-tools/nexus/v2" .github/workflows/
grep -rn "nexus/v2" imersao-tools/nexus/tests/e2e/regression/

# 3. Verificar submódulos
cat .gitmodules
git ls-tree HEAD imersao-tools/

# 4. Reproduzir failure localmente (subset)
cd imersao-tools/nexus
npm install
npm run test:e2e -- --grep "ac1-epic1"

# 5. Após fix — staging selectivo + commit
git add .github/workflows/e2e-regression.yml  # se foi este o fix
git commit -m "fix(nexus-v2): correct path in e2e-regression workflow [Story 1.10]"

# 6. @devops faz push (ou tu se tens autoridade neste contexto)
git push origin feat/nexus-v2-story-1.10-e2e-regression
```

---

## O que NÃO fazer

| NÃO | Razão |
|-----|-------|
| Alterar Status da story | Mantém-se `Ready for Review` até CI verde |
| Mexer em `1.10.story.md` em termos de scope/AC | Já validado por @po em 09/05 — fix é workflow, não story |
| Refazer PO-VALIDATION | `PO-VALIDATION-STORY-1.10.md` existe no feat branch, ficou GO 8/10 |
| Tocar em fixture `tests/fixtures/prompts-pt-pt.json` | 50 prompts canónicos, já validados — fix é noutro lado |
| Mergir PR #14 com CI vermelho | Viola Constitution Artigo V (Quality First) |
| Criar uma nova story para o fix do workflow | É hotfix dentro do escopo da Story 1.10 — adicionar commit à feat branch |

---

## Decision tree para @dev

```
1. git checkout feat/nexus-v2-story-1.10-e2e-regression
2. Verificar H1 (path v2/) → se confirmado:
   - fix path no workflow
   - commit + push
   - aguardar CI
3. Se H1 não bate → verificar H2 (submódulo orfão):
   - remover entry orfão do .gitmodules OU adicionar URL legítimo
   - commit + push
4. Se H1 e H2 ambos batem → fazer os 2 fixes num só commit
5. Se nem H1 nem H2 → escalar de volta para @architect (Aria) para análise mais profunda
```

---

## Referências canónicas

| Documento | Path | Notas |
|-----------|------|-------|
| Story 1.10 | `imersao-tools/nexus/docs/stories/active/1.10.story.md` (no feat branch) | Status: `Ready for Review` |
| PO Validation | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.10.md` (no feat branch) | GO conditional 8/10 |
| QA Gate | `imersao-tools/nexus/docs/QA-GATE-STORY-1.10.md` (no feat branch) | CONCERNS resolvido |
| Architecture | `imersao-tools/nexus/docs/architecture-v2.md` (no feat branch) | ADR-8 Mocking E2E |
| PRD | `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | §10 linha 431 (threshold 85%) |
| Handoff anterior | `archive/RETOMA-20260509-story-1.10-pr-14-aguarda-ci-verde-close-story-OBSOLETO.md` | Sessão full pipeline 09/05 |
| Handoff PO decisions | `archive/RETOMA-20260509-story-1.10-po-validation-decisions-ready.md` | Decisões D1-D4 canónicas |

---

## Estado do Epic 1

| Story | Status |
|-------|--------|
| 1.1 — 1.9 | Done (merged em main) |
| **1.10** | **Ready for Review — bloqueado em CI vermelho** |

**Epic 1: 9/10 Done + 1/10 bloqueado. Fecha quando PR #14 mergir.**

---

## Próxima acção (terminal seguinte)

```
1. @dev (Dex) lê este handoff
2. @dev faz checkout do feat branch
3. @dev verifica H1 (path v2/) — comando exacto na secção "Comandos prontos"
4. @dev aplica fix → commit local → push (ou pede a @devops)
5. @dev aguarda CI — se verde, cria handoff de devolução: RETOMA-20260511-story-1.10-pr-14-ci-verde-close-story.md
6. @po (Pax) lê esse handoff e executa *close-story 1.10
7. Epic 1 fecha (10/10) → Eurico decide arranque Epic 2
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2**
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260511-story-1.10-pr-14-ci-fail-investigar-fix.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: `@po` (Pax)
DATA: 11/05/2026
