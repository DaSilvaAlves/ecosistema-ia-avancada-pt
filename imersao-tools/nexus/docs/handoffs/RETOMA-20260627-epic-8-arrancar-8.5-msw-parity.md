# RETOMA — Epic 8 (Migração Anthropic→OpenAI): arrancar Story 8.5 (MSW `handlers/openai.ts` + parity cross-provider) em sessão fresca

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 8 — Migração de Provider de Inferência (dual-provider OpenAI) — `docs/EPIC-8.md`
**Story a executar nesta retoma:** **8.5 (MSW `tests/mocks/handlers/openai.ts` fiel + variante OpenAI de `proxy-fetch.ts` + suite de parity cross-provider nos 6 cenários canónicos)** → a seguir 8.6 (cutover em produção)
**Data:** 27/06/2026
**from_agent:** @devops (Gage) · **to_agent:** @aiox-master / @devops (qualquer orquestrador) · **status:** pending
**Branch de partida:** `main` (sincronizado — último commit `1fcfaad5`)
**Porquê este handoff:** a sessão anterior fechou a Story 8.4 (proxy OpenAI Edge + transport client, caminho QUENTE) com merge `839d0828` e close-story `1fcfaad5`. O Eurico pediu para arrancar o próximo passo (**8.5**) **noutro terminal com contexto fresco**. A 8.4 é um marco limpo (merged, fechado, tudo em `main`). Com 8.2 (executor) + 8.4 (proxy/transport client) Done, os DOIS caminhos que a parity precisa de comparar existem — a 8.5 é agora desbloqueável.

---

## 1. Resumo executivo (1 parágrafo)

A produção do Nexus v2 (`imersao.ia.expressia.pt`) está **sem cérebro** desde 25/06 (Anthropic devolveu `400 credit balance too low`). O Eurico decidiu **NÃO recarregar a Anthropic** (recusa explícita — não voltar a propor) e migrar a inferência para a **OpenAI directo** (`api.openai.com`, não Azure/gateway) — Epic 8, dual-provider com flag `LLM_PROVIDER` (default `anthropic`; critério = correcção, não uptime; ADR-10, **aceite, NÃO reabrir**). **Já estão Done e merged em `main`:** 8.1 (fundação, PR #95 `dec0b203`), 8.2 (`OpenAIExecutor` server streaming, PR #96 `29ba4046`), 8.3 (`OpenAIClassifier` server JSON, PR #97 `fc74ea89`) e **8.4 (proxy `/api/openai/proxy` Edge + `OpenAIInferenceTransport` + `client-executor` select + `sse-lines.ts`, PR #98 squash `839d0828`)**. **Esta retoma implementa a 8.5:** a infra de teste de **parity cross-provider** — um MSW handler fiel ao wire SSE da OpenAI (`tests/mocks/handlers/openai.ts`), a variante OpenAI do helper de teste `proxy-fetch.ts`, e uma suite partilhada que afirma que os `LLMStreamEvent`/`ExecutorSSEEvent` emitidos pelo caminho OpenAI são **idênticos** aos do Anthropic nos **6 cenários canónicos** (ADR-10 §6.3). É a **penúltima** story; a produção só acende no **8.6 (cutover)**. **A 8.5 ainda NÃO está draftada** — começa por `@sm *draft 8.5`.

## 2. Estado exacto do repo (verificado 27/06/2026)

```
branch: main (sincronizado com origin/main) — HEAD 1fcfaad5
1fcfaad5 docs(nexus-v2): close-story 8.4 — proxy OpenAI Edge + transport client FECHADA (S4 ADR-10)
839d0828 feat(nexus-v2): proxy /api/openai/proxy Edge + OpenAIInferenceTransport + sse-lines [Story 8.4] (#98)  ← 8.4 merged
df07c1bc docs(nexus-v2): close-story 8.3 — OpenAIClassifier FECHADA (S3 ADR-10)
fc74ea89 feat(nexus-v2): OpenAIClassifier ... [Story 8.3] (#97)   ← 8.3 merged
29ba4046 feat(nexus-v2): OpenAIExecutor ... [Story 8.2] (#96)     ← 8.2 merged
```

Estado do Epic 8 (`docs/EPIC-8.md`): **4/6 stories Done.**
- **8.1** (fundação) — **Done** (PR #95, `dec0b203`), `stories/completed/8.1.story.md`.
- **8.2** (`OpenAIExecutor`) — **Done** (PR #96, `29ba4046`), `stories/completed/8.2.story.md`.
- **8.3** (`OpenAIClassifier`) — **Done** (PR #97, `fc74ea89`), `stories/completed/8.3.story.md`.
- **8.4** (proxy Edge + transport client) — **Done** (PR #98, squash `839d0828`), `stories/completed/8.4.story.md`. Baseline de testes pós-8.4: **`npm run test:unit` ~2527 PASS** + 1 flake conhecido `oauth-status` (isola 6/6: `npx vitest run tests/unit/api/google/oauth-status.test.ts`).
- **8.5** (MSW + parity) — **por draftar** (`@sm *draft 8.5`). ← **ESTA RETOMA**
- **8.6** (cutover prod) — por draftar.

> **Ruído fora-scope no working tree (NÃO committar):** submódulos sujos (`comunidade`, `starter-builder`), untracked (`.agent/`, `.agents/`, `.codex/`, `.antigravity/`, `.claude/`, `PO-VALIDATION-*`, `PR-BODY-*`, `QA-GATE-*`), e o delete/move do handoff 6.13 (de OUTRA story). **Sempre `git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que está FEITO (não repetir) — base sobre a qual a 8.5 assenta

- **ADR-10** aceite em `main`: `docs/architecture/ADR-10-dual-provider-openai-migration.md`. **§6.2** (teste falsificável de fragmentação), **§6.3** (os 6 cenários de parity), §4 (diferenças de wire). **NÃO reabrir.**
- **8.2** em main: `lib/agent/providers/openai.ts` com `OpenAIExecutor` (streaming server-side via SDK) + `OpenAIClassifier` (8.3) + helpers `isOpenAITestEnv`/`buildOpenAIClientOptions` + sentinela. Emite os `LLMStreamEvent` canónicos.
- **8.4** em main: caminho **client** OpenAI completo — `app/api/openai/proxy/route.ts` (Edge), `lib/agent/providers/openai-inference-transport.ts` (`OpenAIInferenceTransport` — body+SSE OpenAI, accumulator `Map<index>` para `tool_calls` fragmentados), `lib/agent/sse-lines.ts` (`iterateSseData` partilhado), e `client-executor.ts` a seleccionar transport por `NEXT_PUBLIC_LLM_PROVIDER` (via `getPublicEnv()`, fail-visible). **Anthropic intocado.**
- **Espelho a replicar para a 8.5:** o MSW handler Anthropic e a parity existente já vivem em `tests/mocks/` — a 8.5 cria o **sibling** OpenAI, não reescreve o Anthropic.
- **Dívidas registadas (não bloqueiam a 8.5):** `REC-8.4-CR-1` (rate-limit fixed-window dos DOIS proxies — espelho byte-fiel, correcção transversal futura), `REC-8.2-TEST-COVERAGE`, `REC-8.3-CR-1/2`. Nenhuma é pré-requisito da parity.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260627-epic-8-arrancar-8.5-msw-parity.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. PRÓXIMA ACÇÃO (clara) — ciclo completo da Story 8.5

A 8.5 ainda não tem draft. O ciclo é o mesmo que levou 8.1→8.4 do draft ao merge:

1. **`@sm *draft 8.5`** — cria `stories/active/8.5.story.md`. AC traçáveis ao ADR-10 §6.2 (teste falsificável) + §6.3 (6 cenários de parity); fronteira de scope (8.5 é só infra de teste + parity — NÃO toca produção; o cutover é 8.6).
2. **`@po *validate-story-draft 8.5`** — 10-point checklist; confirma que a parity assenta nos dois caminhos já Done (8.2 server + 8.4 client) e que o MSW reflecte o wire real.
3. **Gate de entrada (`@qa`, OU `@architect` se o `@qa` for quem autora as fixtures — `separation-of-roles.md`).** **ATENÇÃO ao papel:** a 8.5 é infra de teste cujo executor natural é o `@qa`; se o `@qa` escrever as fixtures, ele NÃO pode ser o seu próprio gate → o gate sobe a `@architect` (matriz da `separation-of-roles.md`). Registar a escolha na story.
4. **Branch `feat/8.5-openai-parity`** a partir de `main` sincronizado.
5. **Implementação** (executor conforme o gate decidido) — MSW handler + variante `proxy-fetch.ts` + suite de parity; **commit selectivo na branch, NÃO push.**
6. **Gate de saída** (executor ≠ gate). Corre **CR `--base main`** (`cr-base-main-no-gate-saida.md`). Anota o gate na story.
7. **`@devops`:** push → `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main` → CR server-side `--base main` no head SHA → **6 condições `merge-authority.md`** → `gh pr merge {N} --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch` → `git checkout main && git pull --ff-only`.
8. **`@po *close-story 8.5`** (Status Done, mover active→completed, actualizar `EPIC-8.md` para **5/6**).

**Depois de 8.5:** `@sm *draft 8.6` → cutover em produção (`LLM_PROVIDER=openai` + `NEXT_PUBLIC_LLM_PROVIDER=openai` em prod, smoke test com key real, runbook de rollback). **A produção só acende no 8.6** — e só após a parity (8.5) verde + key OpenAI real validada (verificação manual deferida ao Eurico + `@devops`, padrão AC13/4.9).

## 5. Detalhe técnico da 8.5 (do ADR-10 §6.2/§6.3 + EPIC-8.md §3 — não inventar; confirmar no draft)

> Toda a 8.5 é **infra de teste** — ZERO código de produção alterado. Gate `@qa` (→ `@architect` se autora as fixtures).

- **MSW handler OpenAI (`tests/mocks/handlers/openai.ts`, NOVO):** intercepta `POST /api/openai/proxy` (e/ou `api.openai.com/v1/chat/completions`, conforme o draft definir) e devolve SSE **fiel ao wire real da OpenAI**:
  - `tool_calls.function.arguments` **fragmentados em ≥2 deltas** (`id`+`name` só no 1.º chunk de cada `index`; continuação só traz fragmentos de `arguments`);
  - chunk de `usage` (`prompt_tokens`/`completion_tokens`) **só** com `stream_options:{include_usage:true}`;
  - terminador literal `data: [DONE]`; `finish_reason:'tool_calls'`/`'stop'`.
- **`mock-protocol-fidelity.md` (A1 Epic 1) — OBRIGATÓRIO:** ≥1 teste **falsificável** que **falharia** se o mock entregasse os `arguments` completos num único delta (prova que o accumulator `Map<index>` do `OpenAIInferenceTransport` é exercido). É a mesma classe do bug que partiu a 1.2 (parsear cedo).
- **Variante OpenAI de `proxy-fetch.ts`:** o helper de teste que injecta o `fetchFn` no transport — espelho do já existente para o caminho Anthropic.
- **Suite de parity cross-provider — os 6 cenários canónicos (ADR-10 §6.3):** afirma `LLMStreamEvent`/`ExecutorSSEEvent` **idênticos** entre o caminho Anthropic e o OpenAI em: (1) texto-only, (2) 1 tool, (3) multi-tool (≥2 `index` — prova que o Map não mistura `id`), (4) args malformados → `error` event, (5) tool sem args → `{}`, (6) classifier multi-intent. A suite é **partilhada/parametrizada** por provider — falsificável.
- **NÃO tocar produção:** `openai.ts`, `openai-inference-transport.ts`, `sse-lines.ts`, `route.ts`, `client-executor.ts`, `anthropic.ts`, `inference-transport.ts` — a 8.5 só lê/exercita. Qualquer alteração de produção = sinal de scope errado → STOP.

## 6. Regras operacionais que o próximo terminal TEM de respeitar

| Regra | Detalhe |
|-------|---------|
| `separation-of-roles.md` | **CRÍTICO na 8.5:** se o `@qa` autora as fixtures/parity, o gate sobe a `@architect` (o executor não pode ser o seu próprio gate). Registar a escolha na secção QA Results/Architect Gate. |
| `merge-authority.md` | O @devops faz o merge quando as **6 condições** estão verdes no **head SHA** (CI 100%, CR Status SUCCESS, **0 threads CR Major não-resolvidas**, gate PASS, `mergeable`=MERGEABLE, hard-stop §8 ≤2 iter). NÃO pedir merge manual ao Eurico. `reviewDecision: CHANGES_REQUESTED` stale por **Minor** NÃO bloqueia se o head SHA está limpo → `--admin --squash --delete-branch`. |
| `cr-base-main-no-gate-saida.md` | O CR **autoritativo** é o server-side do PR (`--base main`), não o local. **Lição directa da 8.4:** o CR local do gate deu 0/0 mas o **server-side** levantou 5 findings (2 Major) no head SHA — reavaliar SEMPRE no head SHA do PR; se Major real → bounce `@dev`/executor (NÃO merge). |
| `mock-protocol-fidelity.md` | A 8.5 é o ALVO desta regra: o MSW reflecte o wire real; ≥1 teste falsificável que falha se os args vierem num só delta. |
| Verificar threads CR | Filtrar `isResolved==false` via GraphQL `reviewThreads`; esperar `CodeRabbit` StatusContext = `SUCCESS` (terminal) antes de contar. Distinguir **Major** (bloqueia) de **Minor/nitpick** (não bloqueia, vira dívida). `original_commit_id != head` = re-ancoragem de posição, NÃO finding novo. |
| Hard-stop §8 | Máx **2 iterações** CR fix→re-review por story. Iter 3+ exige `Authorized-by:` do Eurico no commit. |
| `gh` | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`. |
| Commit selectivo | **NUNCA `git add -A`/`.`** Working tree com ruído (ver §2). `git add` ficheiro-a-ficheiro. Trailers (`Constraint:`/`Confidence:`/`Scope-risk:`) + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. |
| Script de teste | `npm run test:unit` (NÃO `npm test`) a partir de `imersao-tools/nexus/v2/`. Baseline pós-8.4 ~2527 PASS. Flake `oauth-status` isola 6/6. |

## 7. GOTCHAs e decisões a não reabrir

- **A 8.5 ASSENTA em 8.2 + 8.4.** Os dois caminhos (server executor + client transport/proxy) JÁ EXISTEM em `main`. A parity **compara-os** — não reimplementa nenhum. A branch da 8.5 sai de `main` (que já tem tudo) — sem rebase.
- **8.5 é infra de teste — ZERO produção.** Se precisares de mexer em produção para a parity passar, o problema é a 8.2/8.4 (e isso seria uma regressão/bug a escalar, não a "corrigir de lado" na 8.5).
- **O teste falsificável é inegociável** (ADR-10 §6.2) — um mock que entrega args completos num só delta dá parity verde FALSA. O accumulator tem de ser exercido por ≥2 deltas.
- **NÃO recarregar a Anthropic** (recusa explícita do Eurico). **OpenAI directo** (`api.openai.com`). **Caminho Anthropic intocado** (default `anthropic` mantém ~2527 testes verdes por construção).
- **Produção só acende no 8.6 cutover** — a 8.5 NÃO faz flip de flag em produção.
- **Memória do projecto:** `project_nexus_v2_provider_migration` (decisão + âmbito). Ler na activação.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-*.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260627-epic-8-arrancar-8.5-msw-parity.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `@devops (Gage)`
DATA: `27/06/2026`
