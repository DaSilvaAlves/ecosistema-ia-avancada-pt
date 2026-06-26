# RETOMA — Epic 8 (Migração de Provider Anthropic→OpenAI): arrancar 8.2 → 8.3 → 8.4 (devolver cérebro à produção via OpenAI)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 8 — Migração de Provider de Inferência (dual-provider OpenAI) — `EPIC-8.md`
**Stories a executar nesta retoma:** 8.2 (`OpenAIExecutor`) → 8.3 (`OpenAIClassifier`) → 8.4 (proxy Edge OpenAI + transport client)
**Data:** 26/06/2026
**from_agent:** @devops (Gage) · **to_agent:** @devops (Gage) / @aiox-master (qualquer orquestrador) · **status:** pending
**Branch de partida:** `main` (sincronizado — último commit `3965b2bf`)
**Porquê este handoff:** o Eurico pediu para atacar a 8.2→8.4 **noutro terminal com contexto fresco** mal o limite de sessão resete (era **04:30 Europe/Lisbon**, 26/06). Os subagentes `@sm` bateram no limite ao draftar a 8.2/8.3 (as stories ficaram criadas e committed à mesma).

---

> ## ⏩ ACTUALIZAÇÃO 26/06/2026 (sessão de execução) — STORY 8.2 FECHADA
>
> Ciclo completo da **8.2** corrido por Orion (`@aiox-master`) orquestrando subagentes: `@po` GO (9/10) → Architect Gate de entrada PASS (resolveu 2 `[AUTO-DECISION]`: `max_completion_tokens` condicional; sentinela duplicada) → `@dev` implementou (`openai.ts` 460L NOVO + factory branch + MSW + 19 testes) → Architect Gate de saída PASS (D-8.2-DRAIN ratificada; 3 eixos do contrato de estado PASS; CR `--base main` 0 findings) → `@devops` PR #96 → **merge squash `29ba4046`** (6 condições `merge-authority.md` verdes; 4 nitpicks Minor — 2 doc corrigidos, 2 testes → dívida `REC-8.2-TEST-COVERAGE`) → close-story `f8508efa`.
>
> **Estado Epic 8: 2/6 Done** (8.1 + 8.2). Gates: typecheck 0 · lint 0 · `test:unit` **2471 PASS** (+19) · AC14 diff vazio nos 6 ficheiros intocados · waiver 0%.
>
> **A RETOMA passa a ser 8.3 → 8.4** (o detalhe técnico de ambas, abaixo, mantém-se válido). A **8.3 (`OpenAIClassifier`)** assenta no `lib/agent/providers/openai.ts` que a 8.2 estabeleceu — reutiliza os helpers `isOpenAITestEnv`/`buildOpenAIClientOptions` e a sentinela `StreamErrorAlreadyEmitted` (já lá estão; NÃO recriar). A 8.3 só **adiciona** o `OpenAIClassifier` (não-streaming + `response_format:json_object`) e troca o branch `getClassifier()` `openai` de fail-loud para `new OpenAIClassifier(...)`. Story draft já existe: `stories/active/8.3.story.md`.
>
> **Branch de partida actualizada:** `main` sincronizado em **`f8508efa`** (não `3965b2bf`).
>
> **Nota de limite:** a sessão de execução da 8.2 esgotou o limite de uso (reset 22:00 Europe/Lisbon, 26/06) — o subagente `@devops` chegou a bater nele a meio (a parte final do merge/close foi feita directamente por Orion). Arrancar a 8.3 com contexto fresco após o reset.

---

## 1. Resumo executivo (1 parágrafo)

A produção do Nexus v2 (`imersao.ia.expressia.pt`) está **sem cérebro**: a 25/06/2026 a Anthropic Messages API começou a devolver `400 credit balance too low`. O Eurico decidiu **NÃO recarregar a Anthropic** (recusa explícita, não voltar a propor) e **migrar a camada de inferência para a OpenAI** (decisão vinculativa — ADR-10). A migração é o **Epic 8** (dual-provider com flag `LLM_PROVIDER`; Anthropic fica como fallback/testes; OpenAI **directo**, `api.openai.com`, não Azure/gateway; o critério é correcção, não uptime). A **Story 8.1 (fundação)** já está **Done e merged em main** (PR #95, `dec0b203`) — instalou a "cablagem" (flag + factory branch + `OPENAI_API_KEY` + `toolsToOpenAIShape` + defaults), mas **o branch `openai` da factory falha-loud de propósito** porque o código que fala com a OpenAI ainda não existe. **Esta retoma implementa esse código**: 8.2 (executor streaming), 8.3 (classifier JSON), 8.4 (proxy Edge + transport client — o caminho QUENTE de produção, ADR-9). Só depois de 8.2+8.3+8.4 (+ 8.5 parity + 8.6 cutover) é que a produção volta a ter cérebro via OpenAI. As stories **8.2 e 8.3 já estão em Draft e committed em main** (`stories/active/8.2.story.md`, `8.3.story.md`); a **8.4 ainda não foi draftada**.

## 2. Estado exacto do repo (verificado 26/06/2026)

```
branch: main (sincronizado com origin/main)
HEAD:   3965b2bf docs(nexus-v2): EPIC-8 tracking — rows 8.2/8.3 Não iniciado → Draft
        6d04e74d docs(nexus-v2): criar Stories 8.2 + 8.3 — drafts S2/S3
        e1fc19d3 docs(nexus-v2): close-story 8.1 — fundação dual-provider FECHADA
        dec0b203 feat(nexus-v2): fundação dual-provider ... (#95)  ← 8.1 merged
```

Estado do Epic 8 (`EPIC-8.md`): **1/6 stories Done.**
- **8.1** (fundação) — **Done** (PR #95, `dec0b203`), em `stories/completed/8.1.story.md`.
- **8.2** (`OpenAIExecutor`) — **Draft**, `stories/active/8.2.story.md` (528 linhas).
- **8.3** (`OpenAIClassifier`) — **Draft**, `stories/active/8.3.story.md` (467 linhas).
- **8.4 / 8.5 / 8.6** — por draftar.

> **Ruído fora-scope no working tree (NÃO committar nada disto):** submódulos sujos (`comunidade`, `starter-builder`), ~150 untracked (`.agent/`, `.codex/`, `.antigravity/`, `.claude/`, `PO-VALIDATION-*`, `PR-BODY-*`, `QA-GATE-*`, memórias de agente em `docs/handoffs/.claude/agent-memory/`), e o delete/move do handoff 6.13 (de OUTRA story). **Sempre `git add` ficheiro-a-ficheiro.**

## 3. O que está FEITO (não repetir)

- **ADR-10** aceite e em main: `imersao-tools/nexus/docs/architecture/ADR-10-dual-provider-openai-migration.md` — decisão + design da abstracção + decomposição S1-S6 + diferenças de protocolo OpenAI validadas contra a doc real. **NÃO reabrir.**
- **8.1 (fundação)** em main: flag `LLM_PROVIDER` (default `anthropic`) + `NEXT_PUBLIC_LLM_PROVIDER`; `resolveLLMProvider()` fail-loud em valor inválido (`lib/shared/env.ts`); branch na `factory.ts` (`openai` → fail-loud "não implementado"); `OPENAI_API_KEY` no `ServerEnvObject` (server-only, NFR5; keys `.optional()`+refine da key do provider activo; `key.trim().length` fail-loud em whitespace); `toolsToOpenAIShape`+`OpenAIToolShape`+`assertValidToolName` (guard ≤64 ASCII partilhado, `registry.ts`); defaults `gpt-4.1-mini`/`gpt-4.1` (`models.ts`); dep `openai@^6.45.0`. Baseline de testes pós-8.1: **~2452 `npm run test:unit` PASS** (1 flake conhecido `oauth-status` isola 6/6).
- **8.2 e 8.3 draftadas** (Status Draft) com AC traçáveis ao ADR-10, gate `@architect`, e **nota de coordenação** (partilham `lib/agent/providers/openai.ts`).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260626-epic-8-migracao-openai-arrancar-8.2-8.3-8.4.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. PRÓXIMA ACÇÃO (clara) — implementar 8.2 → 8.3 → 8.4 EM SEQUÊNCIA

**COORDENAÇÃO CRÍTICA: NÃO implementar 8.2 e 8.3 em paralelo.** As duas tocam o MESMO ficheiro `lib/agent/providers/openai.ts`. A **8.2 estabelece o ficheiro + helpers partilhados** (`toOpenAIMessages`, opções de cliente). A **8.3 assenta sobre ela** (sequencial; ou, se em branch separada, rebase da 8.3 sobre a 8.2 antes do PR). A 8.4 depende de 8.1+8.2. Ordem: **8.2 → 8.3 → 8.4**.

Para CADA story, correr o mesmo ciclo (o mesmo que levou a 8.1 do draft ao merge):
1. `@po *validate-story-draft {id}` (a 8.2/8.3 já têm draft; a 8.4 precisa de `@sm *draft 8.4` primeiro).
2. Criar branch `feat/{id}-{slug}` a partir de `main` sincronizado.
3. `@dev *develop {id}` — implementa + testa; **commit selectivo na branch, NÃO push** (o @devops faz push).
4. Gate de saída `@architect` (executor `@dev` ≠ gate — `separation-of-roles.md`). Anota o gate na story.
5. `@devops`: push branch → `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main` → deixar o **CR server-side `--base main`** correr → avaliar as **6 condições de `merge-authority.md` no head SHA** → `gh pr merge {N} --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch` → `git checkout main && git pull --ff-only`.
6. `@po *close-story {id}` (Status Done, mover active→completed, actualizar `EPIC-8.md`).

**Depois de 8.4:** seguem-se 8.5 (MSW parity cross-provider, gate `@qa`) e 8.6 (cutover prod `LLM_PROVIDER=openai` + runbook rollback, `@qa`+manual `@devops`). **A produção só volta a ter cérebro no 8.6.** Este handoff cobre 8.2→8.4; reavaliar com o Eurico antes do cutover 8.6.

## 5. Detalhe técnico por story (do ADR-10 — não inventar)

### 8.2 — `OpenAIExecutor` (server, streaming) — gate `@architect`, CR `--base main`
- Implementar em `lib/agent/providers/openai.ts` atrás da interface `ExecutorProvider` (`lib/agent/providers/types.ts`). Espelho a replicar: `AnthropicExecutor` em `lib/agent/providers/anthropic.ts`.
- SDK `openai` streaming (`chat.completions.create({stream:true, stream_options:{include_usage:true}})`); terminador `data: [DONE]`.
- **GOTCHA R1 (mesma classe do bug da Story 1.2):** a OpenAI **fragmenta** `tool_calls[].function.arguments` em múltiplos deltas. O 1.º chunk de cada tool call traz `index`/`id`/`name`; os seguintes só fragmentos de `arguments`. Acumular num `Map<index,{id,name,argsAccumulator}>` e `JSON.parse` **só** em `finish_reason:'tool_calls'`/fim. Parsear antes = bug. Teste multi-tool falsificável obrigatório.
- **GOTCHA R2:** round-trip `id`↔`tool_call_id` — a OpenAI **rejeita `role:'tool'` órfão**. `toOpenAIMessages()` tem de preservar o `id`. Parity multi-tool.
- `usage`: mapear `prompt_tokens→inputTokens`, `completion_tokens→outputTokens`.
- Emite os **mesmos** `LLMStreamEvent` canónicos (`text_delta`/`tool_use`/`error`/`done`) que o caminho Anthropic → tudo a jusante (`executor.ts` toolCallingLoop, preview, undo, UI) fica **intocado**.
- Branch server da factory para `openai` passa a devolver `OpenAIExecutor` (deixa de falhar-loud no caminho executor).
- Testes: MSW handler fiel a `api.openai.com/v1/chat/completions` com **args fragmentados** (`mock-protocol-fidelity.md` — espelhar o wire real, não a versão "completa"). `internal-state-contract-gate.md`: análise de ciclo de vida do buffer (chunk fora de ordem, `finish_reason`, args parcial inválido).

### 8.3 — `OpenAIClassifier` (server, JSON nativo) — gate `@architect`
- Implementar no MESMO `lib/agent/providers/openai.ts` (reutiliza helpers da 8.2). Espelho: `AnthropicClassifier`.
- `chat.completions.create` **não-streaming** + `response_format:{type:'json_object'}` → JSON garantido (**mata a saga das markdown fences** do Haiku; o `stripJsonMarkdownFences` mantém-se só como defensivo). Default classifier `gpt-4.1-mini`.
- Devolve `ClassificationResult` idêntico ao caminho Anthropic, validado por Zod. Branch classifier server da factory para `openai` → `OpenAIClassifier`.
- Testes: MSW non-streaming `{choices:[{message:{content:'<json>'}}]}`; casos JSON válido / malformado defensivo / multi-intent.

### 8.4 — Proxy OpenAI + transport client (caminho QUENTE de produção, ADR-9) — gate `@architect`, **CR `--base main` OBRIGATÓRIO**
- **Porque é imprescindível:** em produção o cérebro corre **client-side** (browser → proxy Edge), não server-side. Sem este proxy, a app real não fala com a OpenAI sem expor a chave. As 8.2/8.3 sozinhas NÃO chegam para produção.
- `/api/openai/proxy` (Edge runtime, auth `getSession`, rate-limit Vercel KV sliding-window, upstream `https://api.openai.com/v1/chat/completions`, header `Authorization: Bearer ${OPENAI_API_KEY}`, SSE pass-through). Espelho: `app/api/anthropic/proxy/route.ts`.
- `OpenAIInferenceTransport` (client) que constrói o body OpenAI e parseia o SSE OpenAI — espelho de `InferenceTransport` (`lib/agent/providers/inference-transport.ts`).
- `client-executor` selecciona o transport por `NEXT_PUBLIC_LLM_PROVIDER`.
- Refactor sugerido pelo ADR-10: extrair o parser de linhas SSE (`iterateSseData`) para `sse-lines.ts` partilhado.

## 6. Regras operacionais que o próximo terminal TEM de respeitar

| Regra | Detalhe |
|-------|---------|
| `merge-authority.md` | O @devops faz o merge quando as **6 condições** estão verdes no **head SHA** (CI 100%, CR Status SUCCESS, **0 threads CR actionable não-resolvidas**, gate `@architect` PASS, `mergeable`=MERGEABLE, hard-stop §8 ≤2 iter). NÃO pedir merge manual ao Eurico. `reviewDecision: CHANGES_REQUESTED` stale NÃO bloqueia se o head SHA está limpo → `--admin --squash --delete-branch`. |
| `cr-base-main-no-gate-saida.md` | O CR **autoritativo** é o server-side do PR (`--base main`), não o CR local. **Lição 7.2 e 8.1**: o server-side apanha Major que o local não vê (na 8.1 apanhou o guard ≤64 em falta no caminho OpenAI puro). Reavaliar findings no head SHA; se Major real → bounce `@dev` (NÃO merge). |
| Verificar threads CR | Filtrar por `isResolved==false` via GraphQL `reviewThreads` (comentários re-ancorados ao head SHA podem ser carried-forward stale enquanto o CR não fecha — esperar o `CodeRabbit` StatusContext = `SUCCESS`, estado terminal, antes de contar). |
| Hard-stop §8 | Máx **2 iterações** de CR fix→re-review por story. Iter 3+ exige autorização humana do Eurico (trailer `Authorized-by:`). |
| `separation-of-roles.md` | executor `@dev` (Dex) ≠ gate `@architect` (Aria). O @devops só push/PR/merge. |
| `gh` | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`. |
| Commit selectivo | **NUNCA `git add -A`/`git add .`.** Working tree com ruído (ver §2). `git add` ficheiro-a-ficheiro. |
| Script de teste | `npm run test:unit` (NÃO `npm test`) a partir de `imersao-tools/nexus/v2/`. Baseline pós-8.1 ~2452 PASS. 1 flake `oauth-status > sem sessão → 401` isola: `npx vitest run tests/unit/api/google/oauth-status.test.ts` → 6/6. |
| `mock-protocol-fidelity.md` | MSW handlers OpenAI espelham o wire real (args de tool **fragmentados** em streaming; `[DONE]`; `role:'tool'` com `tool_call_id`). |
| `internal-state-contract-gate.md` | Aplica-se à 8.2 (buffer de tool_calls atravessa stream→loop→message→request) e à 8.4 (proxy+transport+selecção). Análise de ciclo de vida obrigatória no gate. |
| `external-contract-identifiers.md` | Nomes de tools ASCII já validados; o envelope OpenAI (`function.name`) não os altera (guard ≤64 já em main). |

## 7. GOTCHAs e decisões a não reabrir

- **A 8.1 não liga a OpenAI.** O branch `openai` da factory falha-loud por design até a 8.2/8.3 estarem feitas. Ligar a flag em prod hoje = erro propositado (não silent-fallback).
- **8.2 + 8.3 server-side não chegam para produção.** O caminho quente é client-side (ADR-9) → a **8.4** (proxy + transport) é tão essencial como o motor. Produção só acende no **8.6 (cutover)**, fora deste handoff.
- **NÃO recarregar a Anthropic** (recusa explícita do Eurico). Não voltar a propor.
- **OpenAI directo** (`api.openai.com`), não Azure nem gateway (o receio do Eurico não é privacidade/RGPD).
- **Caminho Anthropic intocado** (default `anthropic` mantém ~2452 testes verdes por construção). Não refactorizar `anthropic.ts`/`executor.ts`/`inference-transport.ts` Anthropic.
- **Modelos:** classifier `gpt-4.1-mini`, executor `gpt-4.1` (já em `models.ts`; configuráveis).
- **Memória do projecto:** `project_nexus_v2_provider_migration` (decisão + âmbito). Ler na activação.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-*.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260626-epic-8-migracao-openai-arrancar-8.2-8.3-8.4.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `@devops (Gage)`
DATA: `26/06/2026`
