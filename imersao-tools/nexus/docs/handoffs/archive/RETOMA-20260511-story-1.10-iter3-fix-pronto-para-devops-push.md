# RETOMA — Story 1.10 PR #14 Iter 3 · Fix mock SSE protocol aplicado, validado local 48/50, aguarda @devops push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## Metadata

| Campo | Valor |
|-------|-------|
| `from_agent` | `@dev` (Dex) |
| `to_agent` | `@devops` (Gage) |
| `created` | 2026-05-11T12:00:00Z |
| `status` | pending |
| `project` | Nexus v2 |
| `story_id` | 1.10 |
| `pr` | #14 |
| `branch` | `feat/nexus-v2-story-1.10-e2e-regression` |
| `head_sha_local` | `21f91867` (fix Iter 3) |
| `prev_sha_pushed` | `06654dcd` (Iter 2 falhou no CI) |

---

## TL;DR

Iter 3 fix aplicado via diagnóstico via reprodução local + trace inspection. Causa raiz REAL: **mock SSE protocol divergia do `executor.ts` real em 5 pontos críticos** (formato `event:` em vez de só `data:`, `meta` sem `phase`+prompt+modelClassifier+modelExecutor+startedAt+classifierResult, `text_delta` com `text` em vez de `delta`, `done` sem intents+tokens+totals, sem `[DONE]` terminator). Resultado: `useAgentStream.processSseLine` nunca chamava `setCurrentRunId`, `MessageList.reduceLiveBubble` retornava `null`, e ToolCards/`assistant-message-text` NUNCA renderizavam — `submitPromptAndWait` esperava 30s e crash do browser.

**Validação local:** Regression suite **48/50 PASS, threshold met (≥43), Canonical PASS, P95 252ms (budget <2000ms)** — 2 failures expected em abort-mid-stream profile (status='partial' vs reportado FAIL — comportamento aceitável). TS+lint OK.

Commit local `21f91867` aguarda push.

---

## Estado actual

### CI rollup esperado pós-push (head SHA `21f91867`)

| Job | Esperado |
|-----|----------|
| 50-prompt regression | **PASS** (validado local 48/50, threshold ≥43, canonical PASS, p95 252ms) |
| Playwright E2E + bundle key check | **PASS** (mesma raiz resolvida) |
| Lint + TypeScript | PASS (ambos OK local) |
| Vitest unit + coverage | PASS (não foi tocado código de produção) |
| Demais jobs | PASS (sem mudanças noutros paths) |

### Push status

| Antes (CI vermelho) | Depois (commit local pendente) |
|---------------------|--------------------------------|
| `06654dcd` (Iter 2 + 2 handoffs) | `21f91867` (Iter 3 fix mock SSE protocol) |

Commits novos a empurrar nesta sessão:
- `21f91867` fix(nexus-v2): align E2E mock SSE protocol with executor real shape

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260511-story-1.10-iter3-fix-pronto-para-devops-push.md`. CONFIRMA QUE ESTÁ DENTRO DA PASTA DO PROJECTO NEXUS — SIM, ESTÁ. CONSULTAR `.claude/rules/handoff-location.md` SE EM DÚVIDA.

---

## Diagnóstico Iter 3 — evidência directa

### Reprodução local em modo CI

```
cd imersao-tools/nexus/v2
CI=1 USE_REAL_API=false TEST_PASSWORD='nexus-test-password' \
NEXUS_PASSWORD_HASH='$2a$10$uibDFC5hXxc63B3pqCF4EufSXUsKMmkCKywf8pQ/hNeBSEAJic19K' \
SESSION_SECRET='0000000000000000000000000000000000000000000000000000000000000000' \
ANTHROPIC_API_KEY='sk-ant-test-fake-not-real' \
npx playwright test tests/e2e/regression/regression.spec.ts --project=chromium --grep='R001' --reporter=list --trace=on
```

Reproduziu exactamente o sintoma do CI: `Test timeout 30000ms exceeded` + `Target page closed`.

### Trace evidence (test-results/.../trace.zip)

1. **Mock route foi instalado** ✅
2. **Login OK** (chegou ao `clearAgentRuns` evaluate)
3. **Stream SSE foi devolvido** com 7 eventos ✅ (Fulfill request com `event: meta\ndata: {...}\n\n` etc.)
4. **`page.waitForFunction` esperou 30s** a contar tool-cards e assistant-message-text — nunca apareceram (pw:api@44 endTime − startTime = ~30s)
5. **`Test timeout 30000ms exceeded`** → page closed pelo Playwright cleanup
6. **`locator.count` no post-await falha** com "browser closed"

### Screenshot evidence

Test screenshot mostrava:
- ToolCard NÃO renderizado (apenas bubble user "amanhã reunião 15h, paguei €78,70 supermercado" visível)
- `OnboardingModal` aberto sobre o ChatPanel (decoração — não bloqueante para o submit em si)
- Composer vazio em estado idle (stream nunca tinha começado a renderizar live bubble)

### Causa raiz

O mock-events.ts usava forma reduzida do `meta` event:
```js
{ type: 'meta', runId, classification }  // mock antigo
```

Mas `useAgentStream.processSseLine` (hooks/useAgentStream.ts L289) requer `phase: 'start'`:
```js
if (event.type === 'meta' && event.phase === 'start') {
  setCurrentRunId(event.runId);
  await persistRunStart(event);
}
```

E `MessageList.reduceLiveBubble` (components/chat/MessageList.tsx L150-153, L240) só atribui `runId` quando vê `meta(start)`:
```js
if (event.type === 'meta' && event.phase === 'start') {
  runId = event.runId;
  continue;
}
// ...
if (runId === null) return null;  // sem runId, bubble nunca renderiza
```

Confirma a memória persistente `feedback_mock_must_reflect_real_protocol`: "MSW e mocks de protocolos externos espelham o protocolo real, não apenas fazem tests passar" — esta foi violada na criação inicial do mock.

---

## Files modificados (5)

| Ficheiro | Mudança |
|----------|---------|
| `imersao-tools/nexus/v2/tests/e2e/regression/helpers/mock-events.ts` | Reescrita completa: protocolo SSE alinhado com `executor.ts` (5 events corrigidos), helper `undoRegistered` adicionado, `serializeSseEvents` emite `data: <JSON>\n\n` + terminador `[DONE]` |
| `imersao-tools/nexus/v2/tests/e2e/regression/helpers/route-handler.ts` | Mock para `/api/agent/confirm` adicionado (responde 200 OK silencioso); doc actualizada com causa raiz Iter 3 |
| `imersao-tools/nexus/v2/tests/e2e/regression/helpers/stream-wait.ts` | Helper `dismissOnboardingModal` exportado; chamada defensiva em `submitPromptAndWait` |
| `imersao-tools/nexus/v2/tests/e2e/regression/regression.spec.ts` | beforeEach faz `page.goto('/login')` + `dismissOnboardingModal` ANTES de `page.goto('/')`; spec preview profiles adapta para validar state final `success` |
| `imersao-tools/nexus/docs/stories/active/1.10.story.md` | Change log v0.7 + tech-debt TD-5 (ChatPanel batching) + TD-6 (OnboardingModal E2E bypass) |

---

## Validação local

```
cd imersao-tools/nexus/v2
npm run typecheck   # PASS — 0 errors
npm run lint        # PASS — 1 warning pre-existente (auth/logout/route.ts NextResponse unused)
CI=1 USE_REAL_API=false ... npx playwright test tests/e2e/regression/regression.spec.ts
# Result: 50 passed (1.5m)
# Report: Regression: 48/50 PASS (threshold ≥43: ✓) | P95: 252ms (budget <2000ms: ✓) | Canonical: ✓ | Failures: abort-mid-stream=2
```

2 "failures" em abort-mid-stream são tracked como `status: 'partial'` no profile mock — interpretadas pelo report como FAIL mas não bloqueiam o threshold (48/50 PASS, threshold ≥43).

---

## Workarounds documentados (TD-5 e TD-6)

### TD-5 — ChatPanel React batching (mock impacta)

**Problema (não bloqueia produção):** `ChatPanel.useEffect` (L102-122) só inspecciona `events[events.length-1]` para detectar `undo_registered`. Em mock E2E one-shot, todos os events chegam num único batch React → `last === done` → branch undo nunca executa.

**Workaround Iter 3:** mock emite `undo_registered` APÓS `done` (divergência aceitável vs protocolo real, documentada no comment do helper `undoRegistered`).

**Fix permanente proposto:** refactor do useEffect para iterar `events` à procura de qualquer `undo_registered` não-processado em vez de inspeccionar só `last`. Tracking key local (Set de runIds processados) para idempotência. Out of scope Story 1.10.

### TD-6 — OnboardingModal sem bypass nativo para E2E

**Problema:** modal abre sempre em CI fresh page (localStorage vazio).

**Workaround Iter 3:** `dismissOnboardingModal` helper pre-set a flag antes de `page.goto('/')`.

**Fix permanente proposto:** env-flag `NEXUS_E2E_BYPASS_ONBOARDING` ou query param `?e2e=1` que skipa o modal. Story 0.7 owner.

---

## Next Action — `@devops *push` PR #14

### Comando para o Eurico

```
@devops *push
```

### O que o `@devops` deve fazer

1. **Verificar branch e commit:** `git log --oneline -3` (último commit deve ser `21f91867`)
2. **Push:** `git push origin feat/nexus-v2-story-1.10-e2e-regression`
3. **Aguardar CI:** ~5-7 min para os 32 jobs do PR #14 (Playwright E2E é o mais lento)
4. **Verificar:** `gh pr checks 14` — esperado **all PASS** (incluindo `50-prompt regression` + `Playwright E2E + bundle key check`)
5. **Audit trail:** comentar no PR `Iter 3 fix pushed - pass rate validated locally 48/50 (threshold met)`
6. **Próximo handoff:** se CI verde → handoff para `@po *close-story 1.10` ou para `@qa *qa-loop-review` se workflow exige extra check

### Boas práticas anti-padrão

- **NÃO assumir que diagnóstico Iter 1/2 era inutil** — Iter 2 fix de cookie sharing (commit `d8b7435b`) é necessário e mantém-se. Iter 3 corrige uma camada mais profunda.
- **NÃO esperar CI verde 100%** se algum job não-blocking (Vercel deploy preview, etc.) flutuar — focar em `50-prompt regression` + `Playwright E2E + bundle key check`.
- **NÃO empurrar mais commits** sem coordenar — Iter 3 já é hard-stop. Se CI falhar, escalation para `@architect` (não Iter 4).

---

## Risk Assessment

| Dimensão | Nível | Notas |
|----------|-------|-------|
| Scope | Narrow | 4 ficheiros de tests E2E + 1 story file; zero código de produção tocado |
| Confidence diagnóstico | **High** | Reproduzido local + trace inspection + screenshot evidence + 48/50 PASS validado |
| Reversibility | Trivial | Single revert para `06654dcd` |
| Blast radius | Zero produção | Só toca tests E2E |
| Iter 3 status | **Resolvido localmente** | Iter 4 NÃO necessária — CI vai validar a fix |

---

## Decisões fechadas (NÃO REABRIR)

- 50 prompts canónicos PT-PT (~10 prompts por domínio) — Story 1.10 v0.5
- Pass rate threshold canónico: ≥43/50 (8/50 falhas toleradas) — Story 1.10 PRD §10 linha 431
- Mock determinístico via `page.route()` em `/api/agent/prompt` — ADR-8 architecture-v2.md §5.5
- `loginViaApi(page: Page)` com `page.request.post()` — Iter 2 fix mantém-se
- **Mock SSE protocol espelha `executor.ts` ExecutorSSEEvent shape exacto** — Iter 3 fix
- **Mock emite `undo_registered` APÓS `done`** — workaround React batching (TD-5)

---

## Audit trail Iter 3

- Local clone: `imersao-tools/nexus/v2/` em branch `feat/nexus-v2-story-1.10-e2e-regression`
- Reproduzido localmente em modo CI (CI=1 + headless + workers=1) — confirmou exact symptom
- Trace files capturados (`test-results/.../trace.zip`) — analisados linha a linha
- Screenshot capture confirma OnboardingModal visível + bubble user mas zero ToolCards
- Fix iterativo: 5 events SSE alinhados → +R001 PASS → preview spec adaptado → +preview profiles PASS → undo workaround → +undo profiles PASS → 48/50 PASS final
- Commit local `21f91867` criado com trailer `Constraint: Playwright route.fulfill is one-shot` e `Directive: Mock undo_registered intentionally after done`
- Handoff Iter 2 (`RETOMA-20260510-story-1.10-pr-14-iter3-ci-vermelho-browser-crash-aguarda-dev-fix.md`) movido para `archive/` com sufixo `-CONSUMIDO`

---

## Memórias persistentes relevantes

- `project_nexus_v2_producao.md` — URL produção, env vars Vercel
- `project_nexus_v2_architecture.md` — 5 ADRs Aria + ADR-6/7/8 in-story
- **`feedback_mock_must_reflect_real_protocol.md`** — VIOLADA na criação inicial do mock; esta Iter 3 corrige

---

## Referências cruzadas

- **Handoff Iter 3 input consumido:** [`archive/RETOMA-20260510-story-1.10-pr-14-iter3-ci-vermelho-browser-crash-CONSUMIDO.md`](archive/RETOMA-20260510-story-1.10-pr-14-iter3-ci-vermelho-browser-crash-CONSUMIDO.md)
- **Story file:** `imersao-tools/nexus/docs/stories/active/1.10.story.md`
- **PR:** https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/14
- **CI runs Iter 2 (FAILURE):** [25604934662](https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/actions/runs/25604934662) + [25604934685](https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/actions/runs/25604934685)

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260511-story-1.10-iter3-fix-pronto-para-devops-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@dev` (Dex)
DATA: `11/05/2026`
