# RETOMA — Epic 8 (Migração Anthropic→OpenAI): arrancar Story 8.3 (`OpenAIClassifier`) em sessão fresca

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 8 — Migração de Provider de Inferência (dual-provider OpenAI) — `docs/EPIC-8.md`
**Story a executar nesta retoma:** **8.3 (`OpenAIClassifier`, server, JSON nativo)** → a seguir 8.4 (proxy Edge + transport client)
**Data:** 27/06/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** @aiox-master / @devops (qualquer orquestrador) · **status:** pending
**Branch de partida:** `main` (sincronizado — último commit `55903789`)
**Porquê este handoff:** a sessão anterior fechou a Story 8.2 (`OpenAIExecutor`) mas esgotou o limite de uso (reset 22:00 Europe/Lisbon, 26/06 — o subagente `@devops` chegou a bater nele a meio). O Eurico pediu para arrancar a 8.3 **noutro terminal com contexto fresco após o reset**. A 8.2 é um marco limpo (merged, fechado, tudo em `main`).

---

## 1. Resumo executivo (1 parágrafo)

A produção do Nexus v2 (`imersao.ia.expressia.pt`) está **sem cérebro** desde 25/06 (Anthropic devolveu `400 credit balance too low`). O Eurico decidiu **NÃO recarregar a Anthropic** (recusa explícita) e migrar a inferência para a **OpenAI directo** (`api.openai.com`, não Azure/gateway) — Epic 8, dual-provider com flag `LLM_PROVIDER` (default `anthropic`; OpenAI em paralelo atrás das mesmas interfaces; critério = correcção, não uptime; ADR-10, **aceite, NÃO reabrir**). **Já estão Done e merged em `main`:** 8.1 (fundação — flag + factory + env + `toolsToOpenAIShape` + defaults + dep `openai@^6.45.0`; PR #95) e **8.2 (`OpenAIExecutor` — streaming + reagregação de `tool_calls` + `toOpenAIMessages`; PR #96, squash `29ba4046`)**. A 8.2 **criou o ficheiro `lib/agent/providers/openai.ts`** e os **helpers de cliente partilhados** que a 8.3 reutiliza. **Esta retoma implementa a 8.3:** o `OpenAIClassifier` (não-streaming, `response_format:{type:'json_object'}`, devolve o mesmo `ClassificationResult` que o Anthropic). É **a mais leve das três** stories de provider (sem streaming, sem reagregação, sem endpoint novo; estimativa 2-4h). O draft já existe (`stories/active/8.3.story.md`, Status Draft). Só depois de 8.3 + 8.4 (+ 8.5 parity + 8.6 cutover) é que a produção volta a ter cérebro via OpenAI.

## 2. Estado exacto do repo (verificado 27/06/2026)

```
branch: main (sincronizado com origin/main) — HEAD 55903789
55903789 docs(nexus-v2): handoff retoma — 8.2 FECHADA, retoma passa a 8.3->8.4
f8508efa docs(nexus-v2): close-story 8.2 — OpenAIExecutor FECHADA (S2 ADR-10)
29ba4046 feat(nexus-v2): OpenAIExecutor ... [Story 8.2] (#96)   ← 8.2 merged
f0a0e0b0 / 3965b2bf / 6d04e74d / e1fc19d3 / dec0b203 (#95)      ← 8.1 + drafts
```

Estado do Epic 8 (`docs/EPIC-8.md`): **2/6 stories Done.**
- **8.1** (fundação) — **Done** (PR #95, `dec0b203`), `stories/completed/8.1.story.md`.
- **8.2** (`OpenAIExecutor`) — **Done** (PR #96, `29ba4046`), `stories/completed/8.2.story.md`. Baseline de testes pós-8.2: **`npm run test:unit` ~2471 PASS** + 1 flake conhecido `oauth-status` (isola 6/6: `npx vitest run tests/unit/api/google/oauth-status.test.ts`).
- **8.3** (`OpenAIClassifier`) — **Draft**, `stories/active/8.3.story.md` (467 linhas). ← **ESTA RETOMA**
- **8.4 / 8.5 / 8.6** — por draftar (8.4 precisa de `@sm *draft 8.4` antes do ciclo).

> **Ruído fora-scope no working tree (NÃO committar):** submódulos sujos (`comunidade`, `starter-builder`), untracked (`.agent/`, `.codex/`, `.antigravity/`, `.claude/`, `PO-VALIDATION-*`, `PR-BODY-*`, `QA-GATE-*`), e o delete/move do handoff 6.13 (de OUTRA story). **Sempre `git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que está FEITO (não repetir)

- **ADR-10** aceite em `main`: `docs/architecture/ADR-10-dual-provider-openai-migration.md`. §4.4 (classifier JSON nativo), §3.1 (impl atrás das interfaces), §4.5 (modelo). **NÃO reabrir.**
- **8.1** em main: flag `LLM_PROVIDER`/`NEXT_PUBLIC_LLM_PROVIDER`, `OPENAI_API_KEY` no `ServerEnvSchema`, `readApiKey(provider)` fail-loud PT-PT, `resolveActiveProvider()`, defaults OpenAI em `models.ts` (`DEFAULT_OPENAI_CLASSIFIER_MODEL='gpt-4.1-mini'`, `:34`), dep `openai@^6.45.0`, `toolsToOpenAIShape`, guard nome ≤64 ASCII.
- **8.2** em main (PR #96, `29ba4046`): **criou `lib/agent/providers/openai.ts`** com `OpenAIExecutor` + **os helpers de cliente partilhados que a 8.3 REUTILIZA** — `isOpenAITestEnv()` e `buildOpenAIClientOptions(apiKey)` (espelho de `anthropic.ts:72-85`, `dangerouslyAllowBrowser` gateado a test env) — e a sentinela `StreamErrorAlreadyEmitted`. **A 8.3 NÃO recria nada disto: importa/reutiliza.** Trocou o branch `getExecutor()` `openai` da factory de fail-loud para `new OpenAIExecutor(...)`; o branch **`getClassifier()` `openai` continua em `throwOpenAINotImplemented('classifier')`** à espera da 8.3 (`factory.ts:91-103`).
- Lições da 8.2 a aplicar já na 8.3 (evitar repetir nitpicks CR): manter o **Status da story consistente** no texto todo; **markdownlint limpo** (blank lines à volta de tabelas MD058; linguagem nos fenced MD040); **cobrir os branches defensivos com testes desde o início** (a 8.2 gerou a dívida `REC-8.2-TEST-COVERAGE` por deixar o outer-catch/branches defensivos sem teste dedicado — não repetir na 8.3).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260627-epic-8-arrancar-8.3-openai-classifier.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. PRÓXIMA ACÇÃO (clara) — ciclo completo da Story 8.3

O mesmo ciclo que levou a 8.2 do draft ao merge (validado, funciona):

1. **`@po *validate-story-draft 8.3`** — o draft já existe; PO confirma AC traçáveis ao ADR-10 §4.4, fronteira de scope (8.3 só classifier server; executor é 8.2 Done; proxy client é 8.4), e que assenta nos helpers da 8.2.
2. **Gate de entrada `@architect` (recomendado, leve):** confirmar (a) `response_format:{type:'json_object'}` como garantia primária + `stripJsonMarkdownFences` defensivo (importado, não reescrito); (b) `ClassificationResult` byte-compatível validado por `ClassificationResultSchema.parse`; (c) que a 8.3 reutiliza `isOpenAITestEnv`/`buildOpenAIClientOptions` da 8.2 (não duplica). É "a mais leve das três" — o gate de entrada pode ser curto.
3. **Branch `feat/8.3-openai-classifier`** a partir de `main` sincronizado.
4. **`@dev *develop 8.3`** — implementa + testa; **commit selectivo na branch, NÃO push.**
5. **Gate de saída `@architect`** (executor `@dev` ≠ gate — `separation-of-roles.md`). Corre **CR `--base main`** (`cr-base-main-no-gate-saida.md`). Anota o gate na story.
6. **`@devops`:** push → `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main` → CR server-side `--base main` no head SHA → **6 condições `merge-authority.md`** → `gh pr merge {N} --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch` → `git checkout main && git pull --ff-only`.
7. **`@po *close-story 8.3`** (Status Done, mover active→completed, actualizar `EPIC-8.md` para 3/6).

**Depois de 8.3:** `@sm *draft 8.4` → ciclo da 8.4 (proxy `/api/openai/proxy` Edge + `OpenAIInferenceTransport` + selecção client + `sse-lines.ts` — **caminho QUENTE de produção, ADR-9; CR `--base main` OBRIGATÓRIO**). Depois 8.5 (parity, gate `@qa`) e 8.6 (cutover prod). **A produção só acende no 8.6.**

## 5. Detalhe técnico da 8.3 (do ADR-10 §4.4 + story draft — não inventar)

> Implementar **no MESMO** `lib/agent/providers/openai.ts` (já criado pela 8.2). Espelho a replicar: `AnthropicClassifier` em `anthropic.ts:98-159`. Gate `@architect`.

- **Classe:** `class OpenAIClassifier implements ClassifierProvider` (`types.ts:93-99`). Construtor recebe `apiKey: string`, cria cliente via `buildOpenAIClientOptions(apiKey)` **da 8.2** (reuso). `classify(systemPrompt, userPrompt, opts?)`.
- **Chamada non-streaming:** `client.chat.completions.create({ model: opts.model ?? DEFAULT_OPENAI_CLASSIFIER_MODEL, temperature: 0, messages:[{role:'system',content:systemPrompt},{role:'user',content:userPrompt}], response_format:{type:'json_object'} })`. **Sem `stream:true`.** Default model `gpt-4.1-mini` (`models.ts:34`).
- **`response_format:{type:'json_object'}`** = garantia primária de JSON puro (mata a saga das markdown fences do Haiku). **Mantém `stripJsonMarkdownFences(content)`** (importado de `lib/agent/classifier-json.ts`, **NÃO reescrever** — é Edge-safe e partilhado, `classifier-json.ts:106-147`) como rede defensiva de custo zero antes do `JSON.parse`.
- **Extração:** `choices[0].message.content` (string JSON). Falha de conteúdo (sem `choices[0].message.content`) → `Error` PT-PT.
- **Retorno:** candidate `{ intents, confidence, rawResponse, inputTokens, outputTokens }` → `ClassificationResultSchema.parse(candidate)` (`schemas.ts:69-75`). `rawResponse` preserva o conteúdo **original** (antes do strip), tal como `anthropic.ts:132,153`. Shape inválido → `ZodError` (paridade).
- **Usage:** `usage.prompt_tokens → inputTokens`, `usage.completion_tokens → outputTokens` (nomes OpenAI, não os Anthropic `input_tokens`/`output_tokens`).
- **Validação de inputs:** `systemPrompt`/`userPrompt` não-vazios → `Error` PT-PT (espelho `anthropic.ts:110-115`).
- **Factory (`factory.ts:getClassifier()`):** branch `openai` passa de `throwOpenAINotImplemented('classifier')` para `return new OpenAIClassifier(readApiKey('openai'))`. **NÃO tocar o branch `getExecutor()`** (já é da 8.2, Done).
- **Testes:** `tests/unit/agent/providers/openai.classifier.test.ts` (NOVO) — MSW non-streaming `{choices:[{message:{content:'<json>'}}], usage}` (local via `server.use(...)` ou contribuição a `handlers/openai.ts`). Cobrir: JSON válido, multi-intent, JSON malformado (defensivo), usage mapeada, default model, fail-loud de inputs, `rawResponse` preservado. **Cobrir os branches defensivos com teste dedicado** (lição da 8.2).

## 6. Regras operacionais que o próximo terminal TEM de respeitar

| Regra | Detalhe |
|-------|---------|
| `merge-authority.md` | O @devops faz o merge quando as **6 condições** estão verdes no **head SHA** (CI 100%, CR Status SUCCESS, **0 threads CR Major não-resolvidas**, gate `@architect` PASS, `mergeable`=MERGEABLE, hard-stop §8 ≤2 iter). NÃO pedir merge manual ao Eurico. `reviewDecision: CHANGES_REQUESTED` stale por **Minor** NÃO bloqueia se o head SHA está limpo de Major → `--admin --squash --delete-branch`. (Na 8.2: 4 nitpicks Minor não bloquearam; 2 doc corrigidos no fecho, 2 testes → dívida.) |
| `cr-base-main-no-gate-saida.md` | O CR **autoritativo** é o server-side do PR (`--base main`), não o local. Lição 7.2/8.1: o server-side apanha findings de classe contrato/parser que o `-t uncommitted` não vê. Reavaliar no head SHA; se Major real → bounce `@dev` (NÃO merge). |
| Verificar threads CR | Filtrar `isResolved==false` via GraphQL `reviewThreads`; esperar `CodeRabbit` StatusContext = `SUCCESS` (terminal) antes de contar. Distinguir **Major** (bloqueia) de **Minor/nitpick** (não bloqueia, vira dívida registada). |
| Hard-stop §8 | Máx **2 iterações** CR fix→re-review por story. Iter 3+ exige `Authorized-by:` do Eurico no commit. |
| `separation-of-roles.md` | executor `@dev` (Dex) ≠ gate `@architect` (Aria). O @devops só push/PR/merge. |
| `gh` | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`. |
| Commit selectivo | **NUNCA `git add -A`/`.`** Working tree com ruído (ver §2). `git add` ficheiro-a-ficheiro. Trailers no commit (`Constraint:`/`Confidence:`/`Scope-risk:`) + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. |
| Script de teste | `npm run test:unit` (NÃO `npm test`) a partir de `imersao-tools/nexus/v2/`. Baseline pós-8.2 ~2471 PASS. Flake `oauth-status` isola 6/6. |
| `internal-state-contract-gate.md` | A 8.3 é non-streaming, sem estado mutável atravessado — eixo (c) caminhos de falha (input inválido, conteúdo ausente, JSON malformado → fail-loud, nunca silent). |
| `external-contract-identifiers.md` | A 8.3 não introduz identificadores de tool novos (é classifier, não tool calling). Sem acção específica. |

## 7. GOTCHAs e decisões a não reabrir

- **A 8.3 ASSENTA na 8.2.** O ficheiro `openai.ts` e os helpers `isOpenAITestEnv`/`buildOpenAIClientOptions` JÁ EXISTEM em `main` (8.2 merged). **Reutilizar, nunca recriar nem duplicar.** A branch da 8.3 sai de `main` (que já tem a 8.2) — sem rebase necessário (a 8.2 já aterrou).
- **NÃO tocar (fronteira intocada — equivalente AC14):** `anthropic.ts`, `executor.ts`, `schemas.ts` (só importa `ClassificationResultSchema`), `classifier-json.ts` (só importa `stripJsonMarkdownFences`), `tools/registry.ts`, `app/api/anthropic/proxy/route.ts`, `inference-transport.ts`, `client-executor.ts`, e o branch `getExecutor()` da factory (é da 8.2). Único `factory.ts` editável: o branch `getClassifier()` `openai`. Qualquer teste Anthropic a falhar → tocaste onde não devias → STOP.
- **`response_format:json_object` é a garantia; o strip é defesa em profundidade** (ADR-10 §4.4 — não remover o strip "porque o json_object já garante"; é decisão explícita de custo zero contra regressão de modelo).
- **`OpenAIClassifier` é non-streaming** — NÃO tem o problema D-8.2-DRAIN (esse era do `Stream` do executor). É o caminho simples.
- **NÃO recarregar a Anthropic** (recusa explícita do Eurico). **OpenAI directo** (`api.openai.com`), não Azure/gateway. **Caminho Anthropic intocado** (default `anthropic` mantém ~2471 testes verdes por construção).
- **Modelos configuráveis por env** (`models.ts`): classifier `gpt-4.1-mini`, executor `gpt-4.1`. Não hard-codar.
- **Memória do projecto:** `project_nexus_v2_provider_migration` (decisão + âmbito). Ler na activação.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-*.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260627-epic-8-arrancar-8.3-openai-classifier.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `27/06/2026`
