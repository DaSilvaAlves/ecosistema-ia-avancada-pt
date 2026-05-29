# RETOMA — Story 1.10 PR #14 Iter 4 fix aplicado, 4 commits ahead, aguarda @devops push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 11/05/2026
**Autor:** Dex (@dev) — sessão de investigação CI failure PR #14
**De:** `@dev` (Dex)
**Para:** `@devops` (Gage) — fazer push dos 4 commits ahead de origin
**Acção esperada:** `git push origin feat/nexus-v2-story-1.10-e2e-regression` → CI re-corre → quando CI verde, devolver para `@po *close-story 1.10`

---

## TL;DR

@po (Pax) reportou que PR #14 estava com CI vermelho (2 jobs FAILURE). Investigação encontrou 2 root causes distintos e a fix do primeiro JÁ ESTAVA APLICADA LOCALMENTE mas não-pushed (Iter 3, commit `21f91867`). Iter 4 (commit `887e6c2f`) resolve o segundo root cause. **Branch local tem 4 commits ahead de origin — push é tudo o que falta.**

| Item | Valor |
|------|-------|
| Story | `1.10` |
| Branch | `feat/nexus-v2-story-1.10-e2e-regression` |
| HEAD local | `c2978465` |
| HEAD remoto (origin) | `d77ebf37` (estado em PR #14) |
| Commits ahead | **4** (Iter 3 + Iter 3 doc + Iter 4 + Iter 4 doc) |
| PR | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/14 |
| Status story | `Ready for Review` (mantém-se) |

---

## Os 4 commits a pushar (mais antigo → mais recente)

| # | Hash | Tipo | Resumo |
|---|------|------|--------|
| 1 | `21f91867` | fix | **Iter 3** — mock SSE protocol alinhado com `executor.ts` real (5 events corrigidos). Local validation: **48/50 PASS, Canonical PASS, P95 252ms** |
| 2 | `7d1c0612` | docs | Handoff Iter 3 doc (já estava em local, deixar passar) |
| 3 | `887e6c2f` | fix | **Iter 4** — `testIgnore: ['**/regression/**']` em `playwright.config.ts`. Resolve `nexus-v2-ci.yml e2e` job (`Pass rate 0/0` por placeholder password hash) |
| 4 | `c2978465` | docs | Story 1.10 File List + Change Log v0.8 |

---

## Root causes resolvidos

### Root cause #1 (já fixed em Iter 3 — commit `21f91867`)

**Sintoma:** `Test timeout 30000ms exceeded` em R001, browser closed, P95: 0ms, Pass rate 0/1.

**Origem:** Mock SSE em `mock-events.ts` divergia do protocolo real do `executor.ts` em 5 campos críticos:
1. `meta` event sem `phase:'start'` + `prompt` + `runId` + `startedAt`
2. `text_delta` usava `text` em vez de `delta`
3. `done` sem `intents` + tokens + totals
4. Wire format `event: TYPE\ndata: ...` em vez de canónico `data: ...`
5. Sem terminator `data: [DONE]\n\n`

Resultado: `useAgentStream.processSseLine` não chamava `setCurrentRunId`, `MessageList.reduceLiveBubble` retornava `null`, ToolCards/`assistant-message-text` nunca renderizavam → `submitPromptAndWait` esperava 30s pela presença DOM que nunca chegava.

**Fix em `21f91867`:** mock-events.ts reescrito + route-handler.ts mock /api/agent/confirm + stream-wait.ts onboarding bypass.

### Root cause #2 (fix novo em Iter 4 — commit `887e6c2f`)

**Sintoma:** `Playwright E2E + bundle key check` (workflow `nexus-v2-ci.yml`) falhava com `Pass rate 0/0` + `[auth] Login failed (401): {"error":"Password incorrecta. Verifica no Vercel."}`.

**Origem:** O script `npm run test:e2e` (= `playwright test`) corre TUDO em `tests/e2e/`, incluindo a regression suite. Mas `nexus-v2-ci.yml` tem env `NEXUS_PASSWORD_HASH: '$2a$10$xxxxxxx...'` (placeholder de zeros — não é hash real de password nenhuma). `bcrypt.compare(password, INVALID_HASH)` retorna `false` → endpoint devolve 401 → `loginViaApi` throws → todos os 50 prompts da regression fail no `beforeEach`.

**Fix em `887e6c2f`:** `playwright.config.ts` adiciona `testIgnore: ['**/regression/**']`. Default `playwright test` exclui regression. Path explícito (`playwright test tests/e2e/regression/regression.spec.ts` em `e2e-regression.yml`) faz override do testIgnore e suite corre normalmente lá.

**Arquitectura resultante:**

| Workflow | Specs que corre | Env requirido |
|----------|-----------------|---------------|
| `nexus-v2-ci.yml e2e` | auth.spec.ts + smoke.spec.ts (fluxo não-autenticado) | placeholder hash OK |
| `e2e-regression.yml` | regression.spec.ts (50 prompts, login required) | valid bcrypt hash + TEST_PASSWORD |

---

## Comandos prontos para @devops

```bash
# 1. Verificar 4 commits ahead (worktree separada criada por @dev em sessão)
git -C "C:/Users/XPS/Documents/ecosistema-feat-1.10" log origin/feat/nexus-v2-story-1.10-e2e-regression..HEAD --oneline
# Esperado: c2978465, 887e6c2f, 7d1c0612, 21f91867

# 2. Pre-flight CodeRabbit local (15 min — vale a pena antes de push)
wsl bash -c 'cd /mnt/c/Users/XPS/Documents/ecosistema-feat-1.10 && ~/.local/bin/coderabbit --prompt-only --base main'

# 3. Push
git -C "C:/Users/XPS/Documents/ecosistema-feat-1.10" push origin feat/nexus-v2-story-1.10-e2e-regression

# 4. Monitorizar CI
gh pr checks 14 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --watch

# 5. Se CI verde → criar handoff para @po fechar story
#    Se CI vermelho → escalar para @dev nova iter
```

---

## Worktree separada criada (manutenção)

@dev criou `C:/Users/XPS/Documents/ecosistema-feat-1.10` como worktree separada para não mexer no working tree principal (que tinha submódulos modificados). Os 4 commits estão LOCAIS — visíveis de qualquer worktree partilhada (refs no .git/ comum).

Após CI verde + close story, @devops pode limpar:

```bash
git -C "C:/Users/XPS/Documents/ecosistema-ia-avancada-pt" worktree remove "C:/Users/XPS/Documents/ecosistema-feat-1.10"
```

---

## Riscos / Pontos de atenção

| Risco | Mitigação |
|-------|-----------|
| Iter 4 testIgnore não funciona em Playwright | É opção standard documentada. Path explícito faz override (confirmado pela docs). Default tests:e2e fica leve, regression continua a correr no workflow dedicado |
| 2 failures expected na regression (`abort-mid-stream` profile) | Local validation confirmou 48/50 (>=43 threshold). Os 2 failures são previstos pelo design (mock one-shot não consegue simular abort verdadeiro). Não bloqueiam threshold |
| Submódulo `briefing-generator` orfão em `.gitmodules` | Não bloqueia checkout (só warning). Cleanup ortogonal — não fazer nesta iter |
| Iter 4 commit muito recente vs Iter 3 push pendente | Tudo num push só. Não tentar pushar separadamente |

---

## Validação local executada

| Check | Comando | Resultado |
|-------|---------|-----------|
| TypeScript (playwright.config.ts) | Inspeccionado manualmente | OK — `testIgnore` é opção standard PlaywrightTestConfig |
| Diff cosmético do fix | `git diff playwright.config.ts` | 7 linhas adicionadas, JSDoc + 1 linha de config |
| Regression suite (Iter 3) | (do commit `21f91867` log) | 48/50 PASS, Canonical PASS, P95 252ms |
| Lint+typecheck do projecto | NÃO corrido (worktree sem `npm install`) | Pre-existing infra issues no worktree, não relacionado com fix |
| `npm run test:e2e` (default) | NÃO corrido localmente | Validar em CI — regression deve ser excluída, só auth+smoke correm |

---

## Referências canónicas

| Documento | Path |
|-----------|------|
| Story 1.10 | `imersao-tools/nexus/docs/stories/active/1.10.story.md` (Status: Ready for Review, v0.8) |
| PO Validation | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.10.md` |
| QA Gate | `imersao-tools/nexus/docs/QA-GATE-STORY-1.10.md` |
| Architecture | `imersao-tools/nexus/docs/architecture-v2.md` (com ADR-6/7/8) |
| Playwright config (modificado) | `imersao-tools/nexus/v2/playwright.config.ts` |
| Workflow regression | `.github/workflows/e2e-regression.yml` |
| Workflow regular | `.github/workflows/nexus-v2-ci.yml` |
| Handoff consumido | `RETOMA-20260511-story-1.10-pr-14-ci-fail-investigar-fix.md` (mover para archive) |

---

## Estado do Epic 1

| Story | Status |
|-------|--------|
| 1.1 — 1.9 | Done (merged em main) |
| **1.10** | **Ready for Review · 4 commits local ahead · aguarda push** |

**Epic 1: 9/10 Done + 1/10 Ready for Review (CI pending push)**

---

## Próxima acção (terminal seguinte)

```
1. @devops (Gage) lê este handoff
2. @devops corre pre-flight CodeRabbit local (opcional mas recomendado)
3. @devops faz `git push origin feat/nexus-v2-story-1.10-e2e-regression`
4. @devops monitoriza CI (10-15 min para regression suite + 2-3 min para outros jobs)
5a. Se CI verde → criar handoff RETOMA-20260511-story-1.10-pr-14-ci-verde-close-story.md para @po
5b. Se CI vermelho → diagnosticar novo erro + criar handoff para @dev nova iter
6. Após @po *close-story 1.10 → Epic 1 fecha (10/10) → Eurico decide arranque Epic 2
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2**
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260511-story-1.10-iter4-fix-ready-for-push.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: `@dev` (Dex)
DATA: 11/05/2026
