# RETOMA — Story 1.6 PR #9 CodeRabbit Iter 1 CHANGES_REQUESTED

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

**Data:** 2026-05-08
**De:** @devops (Gage)
**Para:** orquestrador (delegar a `@dev *qa-loop-fix 1.6`)
**Story:** 1.6 — Tool Preview Gate
**PR:** #9 — https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/9
**Branch:** `feat/nexus-v2-story-1.6-preview-gate`
**Iter actual:** 1 (de max 2 automáticas)
**Status:** pending
**Blockers:** Nenhum — fixes claros, todos com sugestões directas

---

## Resumo executivo

CodeRabbit Iter 1 deu verdict **CHANGES_REQUESTED** com 3 actionables:
- 2 MAJORS no `executor.ts` (lógica de preview gate) — bugs reais
- 1 NIT no `1.6.story.md` (markdownlint MD040 — fenced blocks sem language tag)

Todos os checks importantes (lint, typecheck, vitest, build, CodeQL, Vercel) passam.
2 falhas em GitHub Actions (`Coverage Report` + `Record Quality Metrics`) são **infra tech debt pre-existing** — `aiox-capabilities-guardian.js` falha a restaurar backup que não existe no CI runner. Mesmo padrão das stories 1.4/1.5 anteriores. Não bloqueia.

**Decisão Gage**: não fixei autonomamente porque há lógica real envolvida (preview-gate flow) e o fix #2 sugerido pelo CR exige introduzir um campo novo na interface `SdkEventHandled` (`toolUseSeen`) — alteração de tipo público de função interna. Quero @dev a executar com awareness do fix completo.

---

## Os 3 actionables — análise detalhada

### Actionable 1 — MAJOR — `executor.ts:995-1005` — preview_request usa `event.input` em vez de `validatedArgs`

**Ficheiro:** `imersao-tools/nexus/v2/lib/agent/executor.ts`
**Linhas:** 995-1005
**Tipo:** Major (correctness bug)
**Comment ID:** 3205259076

**Issue:**
O `previewRequest` enviado ao utilizador usa `event.input` (payload bruto vindo do modelo) mas a tool é depois executada com `validatedArgs` (payload validado pelo Zod schema). Se um schema fizer strip / coerce / default / transform de campos, o utilizador confirma X mas o executor corre Y. Falha de correctness — quebra o contrato de preview.

**Fix sugerido (committable):**
```diff
       const previewRequest: ExecutorSSEEvent = {
         type: 'preview_request',
         runId: ctx.runId,
         toolName,
-        args: event.input,
+        args: validatedArgs,
         reason: gateResult.reason,
         domain: tool.domain,
         ...(gateResult.confidence !== undefined
           ? { confidence: gateResult.confidence }
           : {}),
       };
```

**Verificação manual:** A variável `validatedArgs` já existe no scope local (definida acima na função `handleSdkEvent` quando o SDK valida o input). Mudança trivial.

**Acção Dex:**
1. Substituir `event.input` por `validatedArgs` na linha 999
2. Adicionar/actualizar test que valide que o `args` enviado em `preview_request` reflecte o resultado da validação Zod (não o input bruto). Se o schema modificar o payload (ex: `.transform()` ou `.default()`), o teste deve confirmar que o preview vê o payload PÓS-validação.
3. Re-correr `npm run test:unit` em `imersao-tools/nexus/v2`

---

### Actionable 2 — MAJOR — `executor.ts:1035-1041` + `1069-1075` — preview-error branches short-circuit follow-up turn

**Ficheiro:** `imersao-tools/nexus/v2/lib/agent/executor.ts`
**Linhas:** 1035-1041 (provider-error branch) + 1069-1075 (cancel branch)
**Tipo:** Major (lógica do loop)
**Comment ID:** 3205259084

**Issue:**
Ambos os ramos enqueueiam um `tool_result` em `ctx.toolResultsToInject` mas retornam `toolUseProcessed: false`. O outer loop em `runAgent()` interpreta `toolUseProcessed: false` como "não houve tool_use neste turno" e quebra ANTES de injectar as mensagens enfileiradas. Resultado: o modelo nunca vê o tool_result do cancelamento/falha-de-provider, e a promessa "continua loop" do comentário (linha 988) não acontece. Bug funcional real.

**Fix sugerido (direcção arquitectural):**

CodeRabbit sugere desacoplar dois conceitos hoje colapsados:
- **toolUseSeen** (boolean) — houve um SDK tool_use neste turno? (afecta `toolUsesInThisIteration`)
- **toolUseProcessed** (boolean) — a tool foi de facto executada? (afecta `totals.toolCalls`)

**Diff sugerido:**
```diff
 interface SdkEventHandled {
+  toolUseSeen: boolean;
   toolUseProcessed: boolean;
   // ...
 }

-        if (handled.toolUseProcessed) {
+        if (handled.toolUseSeen) {
           toolUsesInThisIteration += 1;
+        }
+        if (handled.toolUseProcessed) {
           toolCallCount += 1;
         }
```

E nos returns dos branches preview-error:
```diff
         return {
           events,
+          toolUseSeen: true,
           toolUseProcessed: false,
           errorEmitted: true,
           fatalError: false,
           previewGated,
         };
```

**Acção Dex:**
1. Adicionar `toolUseSeen: boolean` à interface `SdkEventHandled` (procurar declaração no top do ficheiro)
2. Em todos os returns de `handleSdkEvent` (e similares) — definir `toolUseSeen: true` para os casos onde houve tool_use observado, mesmo que não executado:
   - L1035-1041 (provider-error branch) — `toolUseSeen: true`
   - L1069-1075 (cancel branch) — `toolUseSeen: true`
   - Caminho de execução normal — `toolUseSeen: true`
   - Caminhos onde NÃO houve tool_use — `toolUseSeen: false`
3. No outer loop `runAgent()`:
   - `toolUsesInThisIteration += 1` passa a depender de `handled.toolUseSeen`
   - `toolCallCount += 1` continua a depender de `handled.toolUseProcessed`
4. Adicionar/actualizar tests:
   - `it('cancel branch should still inject tool_result on next turn')`
   - `it('provider-error branch should still inject tool_result on next turn')`
   - Verificar que após cancel, o modelo vê o tool_result com `error: 'Cancelado pelo utilizador'` na próxima iteração
5. Re-correr `npm run test:unit` + `npm run test:coverage` (manter ≥ 90% executor.ts)

**Importante**: este fix toca em interface pública dentro do módulo. Procurar todos os call sites de `SdkEventHandled` e garantir que todos definem `toolUseSeen` correctamente. Provavelmente são poucos (apenas em `runAgent()` e `handleSdkEvent()`).

---

### Actionable 3 — NIT — `1.6.story.md:48-67` + `242-249` — fenced blocks sem language tag (markdownlint MD040)

**Ficheiro:** `imersao-tools/nexus/docs/stories/active/1.6.story.md`
**Linhas:** 48-67 + 242-249
**Tipo:** Nitpick (markdownlint warning)
**Comment ID:** 3205259074

**Issue:** Os fenced code blocks que mostram o flow de `runAgent()` e a sequência de eventos não têm language tag, disparando warning `MD040`. Apenas afecta lint de Markdown.

**Fix sugerido:** Adicionar `text` como language tag aos 2 blocos:

```diff
-```
+```text
 runAgent() a correr normalmente
   │
   ├─ Antes de executar tool:
 ...
```

E ao segundo bloco em torno de L242-249.

**Acção Dex:**
1. Editar `imersao-tools/nexus/docs/stories/active/1.6.story.md` — substituir as 2 aberturas de fence por ` ```text `
2. Confirmar com `npm run lint` ou markdownlint local (warning MD040 deve desaparecer)

---

## Tech debt pre-existing — Coverage Report + Record Quality Metrics

| Check | Erro | Causa |
|-------|------|-------|
| Coverage Report | `npm ci` exit 1 | `aiox-capabilities-guardian.js restore` falha porque `aiox-core-backup-pre-5.0.4-update-20260407-224807` não existe no CI runner |
| Record Quality Metrics | `npm ci` exit 1 | Mesma causa |

Ambos falharam nas stories 1.4 e 1.5 também. Não é regressão da 1.6. Não fixar nesta iteração — abrir issue separado se necessário.

---

## Próximos passos (orquestrador)

1. **Delegar** a `@dev *qa-loop-fix 1.6` — referência este handoff
2. Executar fix 1, 2, 3 nesta ordem (1 e 3 são triviais; 2 requer pensar no diff da interface)
3. Validar local com:
   - `cd imersao-tools/nexus/v2 && npm run lint`
   - `npm run typecheck`
   - `npm run test:unit`
   - `npm run test:coverage` (≥ 90% executor.ts mandatory)
   - `npm run build`
4. Commit message sugerido: `fix(nexus-v2): preview gate uses validatedArgs and propagates toolUseSeen on error branches [Story 1.6 — CR Iter 1 fixes]`
5. **Delegar de volta a `@devops *push`** para Iter 2 (push + monitor CR Iter 2)

**Limite hard-stop:** Iter 2 é o máximo automático. Se Iter 2 voltar com CHANGES_REQUESTED, escalar ao Eurico (ver convenção Story 1.5 — Opção A merge waived).

---

## Estado dos ficheiros

| Ficheiro | Estado |
|----------|--------|
| `imersao-tools/nexus/v2/lib/agent/executor.ts` | A editar (fix 1 + fix 2) |
| `imersao-tools/nexus/v2/tests/unit/agent/executor.test.ts` | A actualizar (cobertura para 2 branches preview-error) |
| `imersao-tools/nexus/docs/stories/active/1.6.story.md` | A editar (fix 3 — markdownlint) |
| `imersao-tools/nexus/v2/tests/mocks/handlers/anthropic.ts` | Provavelmente intocado (CR não pediu changes aqui) |

---

## Comandos prontos a executar

### Verificar estado actual
```powershell
gh pr view 9 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json reviews,statusCheckRollup,mergeStateStatus
```

### Após fixes do @dev — push Iter 2
```powershell
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git add imersao-tools/nexus/v2/lib/agent/executor.ts `
        imersao-tools/nexus/v2/tests/unit/agent/executor.test.ts `
        imersao-tools/nexus/docs/stories/active/1.6.story.md
git commit -m "fix(nexus-v2): preview gate uses validatedArgs and propagates toolUseSeen on error branches [Story 1.6 — CR Iter 1 fixes]"
git push origin feat/nexus-v2-story-1.6-preview-gate
gh pr view 9 --repo DaSilvaAlves/ecosistema-ia-avancada-pt
```

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.6-pr-9-coderabbit-iter1-CHANGES_REQUESTED.md`. PERTENCE AO PROJECTO `imersao-tools/nexus`. CAMINHO CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Caveats operacionais @devops

| Caveat | Comando |
|--------|---------|
| `gh pr *` REQUER SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` | Sem flag, gh usa `upstream` (SynkraAI/aiox-core) por default e falha |
| Push authority | EXCLUSIVO @devops |
| Convenção merge | squash + delete-branch |
| Iter limit | max 2 automáticas (esta é Iter 1; próxima será Iter 2 = última) |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `imersao-tools/nexus` (Nexus v2)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.6-pr-9-coderabbit-iter1-CHANGES_REQUESTED.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: @devops (Gage)
DATA: 08/05/2026

---

```yaml
consumed: true
consumed_at: 2026-05-08T01:50:00Z
consumed_by: aiox-devops
status: consumed
closure_commit: pending
merge_commit: 115d7033c2249aad6f9912331c7c1c93b3743e67
note: "Story 1.6 PR #9 squash-merged 2026-05-08T01:41:18Z. Cenário A executado (merge waived + closure absorve 4 nits doc/test polish). Story status Ready for Review → Done."
```
