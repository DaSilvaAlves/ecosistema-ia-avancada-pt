# RETOMA — Story 1.10 PR #14 Iter 3 · CI vermelho (browser crash + 49 prompts não correm), aguarda @dev fix

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## Metadata

| Campo | Valor |
|-------|-------|
| `from_agent` | `@devops` (Gage) |
| `to_agent` | `@dev` (Dex) |
| `created` | 2026-05-10T15:50:00Z |
| `status` | pending |
| `project` | Nexus v2 |
| `story_id` | 1.10 |
| `pr` | #14 |
| `branch` | `feat/nexus-v2-story-1.10-e2e-regression` |
| `head_sha` | `06654dcd` |
| `ci_run_e2e` | 25604934662 (FAILURE) |
| `ci_run_nexus` | 25604934685 (FAILURE) |

---

## TL;DR

Push Iter 2 executado com sucesso (`d77ebf37..06654dcd`). CI rerun completo. **2 jobs críticos falharam:** `50-prompt regression` e `Playwright E2E + bundle key check`. **Diagnóstico Iter 2 do Dex (cookie sharing via `page.request`) NÃO resolveu o CI** — o sintoma mudou de `locator.fill timeout em chat-composer-input` (Iter 1) para `Test timeout 30000ms exceeded em R001 + browser crash a meio do teste`. Apenas 1/50 prompts executados antes do crash, 49 nem chegaram a correr. Pass rate 0/1 (threshold ≥43). Retorno a `@dev` para diagnóstico Iter 3.

---

## Estado actual

### CI rollup completo (head SHA `06654dcd`)

| Job | Conclusion | Notas |
|-----|------------|-------|
| 50-prompt regression | **FAILURE** | Pass: 0/1 (threshold ≥43), browser crash R001 |
| Playwright E2E + bundle key check | **FAILURE** | Mesma raiz do 50-prompt regression |
| Detect Changes | SUCCESS | — |
| Lint + TypeScript | SUCCESS | — |
| Vitest unit + coverage | SUCCESS | 321 tests local; CI confirmou |
| Coverage Report | SUCCESS | — |
| Record Quality Metrics | SUCCESS | — |
| Analyze (javascript-typescript) | SUCCESS | CodeQL |
| Analyze (actions) | SUCCESS | CodeQL |
| CodeRabbit Status | SUCCESS | — |
| Vercel | PENDING | (preview deploy normal) |
| Validation Summary | SUCCESS | — |

### Push status

| Antes | Depois |
|-------|--------|
| `d77ebf37` (3 commits Story 1.10 já pushed em sessão anterior) | `06654dcd` (5 commits Story 1.10 — incluindo fix Iter 2 `d8b7435b` + 2 handoffs `0d7be68f` + `06654dcd`) |

3 novos commits empurrados nesta sessão `@devops`:
- `d8b7435b` fix(nexus-v2): resolve E2E auth via page.request cookie sharing
- `0d7be68f` docs(nexus-v2): handoff @dev → @devops Story 1.10 Iter 2 ready for push
- `06654dcd` docs(nexus-v2): handoff session-level Story 1.10 Iter 2 para novo terminal

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260510-story-1.10-pr-14-iter3-ci-vermelho-browser-crash-aguarda-dev-fix.md`. CONFIRMA QUE ESTÁ DENTRO DA PASTA DO PROJECTO NEXUS — SIM, ESTÁ. CONSULTAR `.claude/rules/handoff-location.md` SE EM DÚVIDA.

---

## Sintomas exactos do CI run 25604934662

Excerto reproduzido do log `gh run view 25604934662 --log-failed`:

```
[chromium] › tests/e2e/regression/regression.spec.ts:79:9
  › E2E Regression — 50 prompts PT-PT
  › R001 [multi-intent] amanhã reunião 15h, paguei €78,70 supermercado

  Test timeout of 30000ms exceeded.
  Error: Canonical prompt R001 must PASS
    (locator.count: Target page, context or browser has been closed)

  Pass: 0/1 (threshold ≥43)
  P95: 0ms (budget <2000ms)
  Canonical all PASS: false
  ::error::Pass rate below threshold

  1 failed
  49 did not run
```

### Padrões observados

| Sintoma | Implicação |
|---------|------------|
| R001 corre mas crasha a meio | Browser context fecha antes de `locator.count` resolver |
| 49/50 prompts "did not run" | Falha de R001 propaga-se e termina a execução do projecto chromium |
| `Test timeout 30000ms exceeded` | Algo bloqueia o teste por > 30s antes do crash |
| `Target page, context or browser has been closed` | Ou cleanup prematuro, ou crash do browser, ou `page.close()` indevido |
| `Pass: 0/1` (não 0/50) | Reporte só conta o que foi *attempted* — confirma que apenas R001 chegou a correr |
| Server CI loga `[auth] KV não configurado — sessão em memória apenas` | Login HTTP 200 OK (consistente com Iter 2 fix de cookie sharing) |

### Hipóteses de causa raiz para `@dev` investigar

**Hipótese A — Mock route removido prematuramente.** Se `installMockRoute(page)` registar handlers que dependem do `BrowserContext` e algo destruir esse contexto entre `beforeEach` e o `test()`, qualquer `await page.locator(...)` falha com browser closed.

**Hipótese B — `loginViaApi` falha silenciosamente em CI mas não em local.** Server CI retorna 200, mas se algo no `page.request.post('/api/auth/login')` lançar não-await em background, o teste pode prosseguir sem cookie e o middleware redireccionar — mas o sintoma seria `composer não encontrado`, não `browser closed`.

**Hipótese C — `streamPromptResponse` mock determinístico não fecha o stream / mantém a conexão pendente até timeout, e algo no `afterEach` faz `page.close()` antes do `locator.count` resolver.** O sintoma `30s timeout + browser closed` é compatível.

**Hipótese D — `page.request` com auth via `process.env.TEST_PASSWORD` correu mas SET_COOKIE não chegou ao BrowserContext em ambiente CI Linux/Chromium específico (path differente do dev local Windows).** Pouco provável dado que docs Playwright dizem que `page.request` partilha storage state com `page.context()`.

**Hipótese E — `npm ci` ou `npx playwright install chromium` em CI puxou versão diferente da local; Chromium pode estar a crashar no CI por OOM ou flag específica.** Verificar se `playwright.config.ts` tem `headless: true` consistente.

**Recomendação:** Dex deve reproduzir localmente em modo CI (`USE_REAL_API=false`, mock determinístico, headless, `npx playwright test --project=chromium`) e capturar trace + screenshot para diagnosticar. Não assumir hipótese sem evidência directa.

---

## Files relevantes

| Ficheiro | Notas |
|----------|-------|
| `imersao-tools/nexus/v2/tests/e2e/regression/regression.spec.ts` | Test file — verificar `beforeEach` ordem, mock route registration, cleanup |
| `imersao-tools/nexus/v2/tests/e2e/regression/helpers/auth.ts` | `loginViaApi(page)` — fix Iter 2 |
| `imersao-tools/nexus/v2/tests/e2e/regression/helpers/mock-route.ts` (se existir) | Verificar streaming response handler |
| `imersao-tools/nexus/v2/playwright.config.ts` | Config global — timeout, retries, projects |
| `.github/workflows/nexus-v2-e2e-regression.yml` | Workflow CI — verificar steps de setup |
| `imersao-tools/nexus/v2/middleware.ts` | Auth redirect logic |

---

## Next Action — `@dev *qa-loop-fix 1.10` (Iter 3)

### Comando para o Eurico

```
@dev *qa-loop-fix 1.10
```

### O que o `@dev` deve fazer

1. **Reproduzir localmente em modo CI:** `cd imersao-tools/nexus/v2 && USE_REAL_API=false TEST_PASSWORD=nexus-test-password NEXUS_PASSWORD_HASH='$2a$10$uibDFC5hXxc63B3pqCF4EufSXUsKMmkCKywf8pQ/hNeBSEAJic19K' SESSION_SECRET=0000000000000000000000000000000000000000000000000000000000000000 npx playwright test --project=chromium tests/e2e/regression/regression.spec.ts`
2. **Capturar trace:** adicionar `--trace on` para análise post-mortem
3. **Diagnosticar por evidência directa:** não assumir causa sem confirmar com trace + logs
4. **Aplicar fix mínimo focado** na causa raiz real (não cobertor)
5. **Validar localmente** que os 50 prompts correm + ≥43 PASS antes de re-empurrar
6. **Handoff de volta a `@devops`** quando ready

### Boas práticas anti-padrão (lições já aprendidas)

- **NÃO assumir o mesmo diagnóstico do handoff anterior.** Iter 1 assumiu 401 bcrypt (errado). Iter 2 fixou cookie sharing (parcialmente certo, não suficiente). Iter 3 deve diagnosticar do zero.
- **NÃO mudar `loginViaApi(page)` para `APIRequestContext` sem revalidar.** O fix de cookie sharing é necessário (mesmo que insuficiente).
- **Validar localmente em modo CI antes de empurrar.** O Iter 2 passou local mas falhou CI por causa que só se manifesta em CI ambiente Linux/headless.

---

## Risk Assessment

| Dimensão | Nível | Notas |
|----------|-------|-------|
| Scope | Narrow | Apenas test files E2E; zero código de produção tocado |
| Confidence diagnóstico | Low | Sintoma novo (browser crash) que não estava no Iter 1; precisa investigação focada |
| Reversibility | Trivial | Single revert para `d77ebf37` |
| Blast radius | Zero produção | Só toca tests E2E |
| Iter 3 risk | Médio | Já estamos no Iter 3 — Iter 4 entra em zona de hard-stop e escalation conforme convenção @devops das stories 1.5/1.6 |

---

## Decisões fechadas (NÃO REABRIR)

- 50 prompts canónicos PT-PT (~10 prompts por domínio)
- Pass rate threshold canónico: ≥43/50 (8/50 falhas toleradas) — confirmado em validate report step do CI workflow
- Mock determinístico via `page.route()` em `/api/agent/prompt`
- ADR-8 mocking E2E strategy formalizado em `architecture-v2.md`
- `loginViaApi(page: Page)` usando `page.request.post()` — manter este fix Iter 2

---

## Audit trail

- Push iter2 executado por @devops (Gage) em sessão atual: `d77ebf37 → 06654dcd`
- CI rerun automático disparou nos 32 jobs do PR #14
- 28 jobs PASS/SKIP, 2 jobs FAILURE (50-prompt regression + Playwright E2E)
- Comentário audit trail adicionado em https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/14
- Handoffs Iter 2 (`RETOMA-20260510-novo-terminal...` + `RETOMA-20260510-story-1.10-pr-14-fix-iter2...`) movidos para `archive/` com sufixo `-CONSUMIDO`

---

## Memórias persistentes relevantes

- `project_nexus_v2_producao.md` — URL produção, env vars Vercel
- `project_nexus_v2_architecture.md` — 5 ADRs Aria + ADR-6/7/8 in-story
- `feedback_mock_must_reflect_real_protocol.md` — mocks reflectem protocolo real

---

## Referências cruzadas

- **Handoff Iter 2 consumido (sessão):** [`archive/RETOMA-20260510-novo-terminal-story-1.10-iter2-aguarda-devops-push-CONSUMIDO.md`](archive/RETOMA-20260510-novo-terminal-story-1.10-iter2-aguarda-devops-push-CONSUMIDO.md)
- **Handoff Iter 2 consumido (técnico):** [`archive/RETOMA-20260510-story-1.10-pr-14-fix-iter2-aguarda-devops-push-CONSUMIDO.md`](archive/RETOMA-20260510-story-1.10-pr-14-fix-iter2-aguarda-devops-push-CONSUMIDO.md)
- **Story file:** `imersao-tools/nexus/docs/stories/active/1.10.story.md`
- **PR:** https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/14
- **CI run E2E (FAILURE):** https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/actions/runs/25604934662
- **CI run Nexus v2 (FAILURE):** https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/actions/runs/25604934685

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260510-story-1.10-pr-14-iter3-ci-vermelho-browser-crash-aguarda-dev-fix.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@devops` (Gage)
DATA: `10/05/2026`
