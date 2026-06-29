# RETOMA — Epic 8 (Migração Anthropic→OpenAI): Story 8.5 VALIDADA (GO 9/10) — executar a parity cross-provider noutro terminal

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 8 — Migração de Provider de Inferência (dual-provider OpenAI) — `docs/EPIC-8.md`
**Story desta retoma:** **8.5 (MSW `tests/mocks/handlers/openai.ts` estendido + `tests/mocks/proxy-fetch-openai.ts` NOVO + suite de parity cross-provider nos 6 cenários canónicos)** → a seguir 8.6 (cutover em produção)
**Data:** 29/06/2026
**from_agent:** @po (Pax) · **to_agent:** @qa / @dev (executor a decidir no T1) + @architect (gate condicional) · **status:** pending
**Branch de partida:** `main` (sincronizado — HEAD `49efffb1`)
**Supersede:** `RETOMA-20260627-epic-8-arrancar-8.5-msw-parity.md` (esse pedia `@sm *draft 8.5`; o draft **já está feito e já o validei** — esta retoma arranca a partir da execução).

**Porquê este handoff:** o ciclo da 8.5 já passou duas etapas — o `@sm` draftou a story (`stories/active/8.5.story.md`, Status `Draft`) e eu (`@po`) acabei de a validar com **GO 9/10** (`docs/PO-VALIDATION-STORY-8.5.md`). O Eurico pediu para **continuar noutro terminal com contexto fresco**. A próxima etapa é decidir o executor/gate (T1 da story) e implementar — pura infra de teste, ZERO código de produção.

---

## 1. Resumo executivo (1 parágrafo)

A produção do Nexus v2 está **sem cérebro** desde 25/06 (Anthropic `400 credit balance too low`). O Eurico decidiu **NÃO recarregar a Anthropic** e migrar para **OpenAI directo** sob dual-provider com flag `LLM_PROVIDER` (default `anthropic`; critério = correcção, não uptime; ADR-10 **aceite, NÃO reabrir**). **Done e merged em `main`:** 8.1 (fundação, PR #95), 8.2 (`OpenAIExecutor` server, PR #96), 8.3 (`OpenAIClassifier` server, PR #97) e 8.4 (proxy Edge + `OpenAIInferenceTransport` + `sse-lines.ts`, PR #98). **A 8.5 está DRAFTADA e VALIDADA (GO 9/10).** Implementa a **parity cross-provider**: estende o MSW handler OpenAI com o caminho não-streaming (classifier), cria o sibling `proxy-fetch-openai.ts`, e cria uma suite parametrizada que afirma `LLMStreamEvent`/`ClassificationResult` **idênticos** entre Anthropic e OpenAI nos **6 cenários canónicos** (ADR-10 §6.3) + 1 teste falsificável de fragmentação (§6.2). É a **penúltima** story; a produção só acende no **8.6 (cutover)**.

## 2. Estado exacto do repo (verificado 29/06/2026)

```
branch: main (sincronizado com origin/main) — HEAD 49efffb1
49efffb1 docs(nexus-v2): handoff RETOMA-20260627 — arrancar Story 8.5 ...
1fcfaad5 docs(nexus-v2): close-story 8.4 ...
839d0828 feat(nexus-v2): proxy /api/openai/proxy Edge + OpenAIInferenceTransport + sse-lines [Story 8.4] (#98)
fc74ea89 feat(nexus-v2): OpenAIClassifier [Story 8.3] (#97)
29ba4046 feat(nexus-v2): OpenAIExecutor [Story 8.2] (#96)
```

Estado do Epic 8 (`docs/EPIC-8.md`): **4/6 stories Done.**
- 8.1/8.2/8.3/8.4 — **Done** em `main` (`stories/completed/8.{1,2,3,4}.story.md`).
- **8.5** — **Draft + VALIDADA GO 9/10** (`stories/active/8.5.story.md` + `docs/PO-VALIDATION-STORY-8.5.md`). ← **ESTA RETOMA: executar.**
- 8.6 — por draftar (cutover prod).

**Baseline de testes pós-8.4 (verificado no Change Log da 8.4, CR Iter 2):** `npm run test:unit` → **2527 PASS** + flake conhecido `oauth-status` (isola 6/6: `npx vitest run tests/unit/api/google/oauth-status.test.ts`). A 8.5 só **cresce** este número (≥6 testes novos de parity).

> **Ruído fora-scope no working tree (NÃO committar):** submódulos sujos (`comunidade`, `starter-builder`), untracked (`.agent/`, `.agents/`, `.codex/`, `.antigravity/`, `PO-VALIDATION-*`, etc.). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`** (O `PO-VALIDATION-STORY-8.5.md` que escrevi é legítimo e pode ser committado pelo `@devops` junto com a story.)

## 3. Resultado da minha validação (Pax, @po) — GO 9/10

Ficheiro completo: `docs/PO-VALIDATION-STORY-8.5.md`. Resumo do que **verifiquei no código real** (não confiei só no draft):
- **As 3 citações literais do ADR-10** (§6.2 teste falsificável, §6.3 os 6 cenários, §8 row S5 âmbito+gate) — cruzadas linha-a-linha contra o ADR: **FIÉIS**.
- **6 cenários C1-C6** = exactamente os 6 do ADR-10 §6.3 (C1-C5 executor em AC3; C6 classifier em AC4). Teste falsificável (AC5) presente e bem especificado.
- **Todos os ficheiros citados existem:** `handlers/openai.ts` (5 fixtures + magic strings `MOCK_OPENAI_*` exactos), `proxy-fetch.ts`, `openai-inference-transport.ts` (`constructor(fetchFn?)`, `OPENAI_PROXY_URL='/api/openai/proxy'`), `schemas.ts` (`ClassificationResultSchema:69`, `LLMStreamEventSchema:162`). Os 2 ficheiros novos correctamente ainda não existem.
- **Baseline "≥2527 PASS": confirmado** (não assumido).
- **D-8.5-HANDLER-EXTEND confirmado:** o test da 8.3 diz literalmente que o classifier vive `server.use(...)` local e "a consolidação canónica é a 8.5".

**4 achados não-bloqueadores (recomendações para o executor — nenhum impede o arranque):**
1. **`cr-base-main-no-gate-saida.md` não existe como ficheiro de regra** em `.claude/rules/` — é um princípio/memória, documentado em `EPIC-8.md §8` com esse nome. O ficheiro de regra real é `coderabbit-integration.md`. A substância (CR `--base main` no gate de saída) está correcta e **mantém-se obrigatória**. Corrigir a referência na story (ou citá-la como norma do Epic 8).
2. Os 2 marcadores **[VERIFICAR]** referem só o nome da suite — fixar `cross-provider-parity.test.ts` no T4 e remover os marcadores antes de implementar.
3. O helper sibling: alinhar o nome ao existente (`proxy-fetch.ts` exporta `createMockProxyFetch`; sugiro `createMockOpenAIProxyFetch` em vez de `buildOpenAIProxyFetchFn`). Cosmético.
4. **C6:** o lado Anthropic discrimina por `body.system` contendo `MOCK_CLASSIFIER`; o OpenAI por `MOCK_OPENAI_CLASSIFIER_MULTI_INTENT` na última `user`. Garantir que **ambos os mocks devolvem os mesmos `intents`** para a asserção de parity ser significativa (nota para o T4.7).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260629-epic-8-story-8.5-VALIDADA-GO-executar.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. PRÓXIMA ACÇÃO (clara) — restante ciclo da Story 8.5

O draft e a validação `@po` já estão feitos. Falta:

1. **T1 — decidir e REGISTAR executor/gate** (pré-condição, na secção QA Results da story). **Regra `separation-of-roles.md`:** o executor de infra de teste é o `@qa`; **se o `@qa` autora as fixtures/suite, ele NÃO pode ser o seu próprio gate → o gate sobe a `@architect`**.
   - **Minha recomendação (@po):** **`@dev` autora → gate `@qa`**. Porquê: não há decisão de arquitectura nova (tudo fixado pelo ADR-10 + 8.2/8.4); o `@qa` (Quinn) é a autoridade natural de **fidelidade de mock** (`mock-protocol-fidelity.md`), o eixo crítico desta story; é o caminho mais leve da matriz. Alternativa válida: `@qa` autora → gate `@architect`. **Registar a escolha e não mudar a meio.**
2. **Gate de entrada** — opcional/leve para infra de teste; o essencial é o T1 registado. (A story não exige Architect Gate de entrada como as 8.1-8.4; é `@qa`-grade.)
3. **Branch `feat/8.5-openai-parity`** a partir de `main` sincronizado.
4. **Implementação** (executor conforme T1): T2 estende `handlers/openai.ts` (caminho não-streaming classifier, magic strings `MOCK_OPENAI_CLASSIFIER_*`) → T3 cria `proxy-fetch-openai.ts` → T4 cria a suite de parity (C1-C5 executor + C6 classifier + teste falsificável AC5) → T5 gates locais. **Commit selectivo na branch, NÃO push.** Aplicar os 4 recs do §3.
5. **Gate de saída** (executor ≠ gate). Corre **CR `--base main`** (norma do Epic 8 — lição directa da 8.4: CR local deu 0/0 mas o server-side deu 5 findings/2 Major). Registar o gate na story.
6. **`@devops`:** push → `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main` → CR server-side `--base main` no head SHA → **6 condições `merge-authority.md`** → `gh pr merge {N} --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch` → `git checkout main && git pull --ff-only`.
7. **`@po *close-story 8.5`** (Status Done, mover active→completed, `EPIC-8.md` → **5/6**).

**Depois de 8.5:** `@sm *draft 8.6` → cutover prod (`LLM_PROVIDER=openai` + `NEXT_PUBLIC_LLM_PROVIDER=openai` em prod, smoke test com key real, runbook de rollback). **A produção só acende no 8.6**, e só após a parity (8.5) verde + key OpenAI real (verificação manual deferida ao Eurico + `@devops`, padrão AC13/4.9).

## 5. Âmbito técnico da 8.5 (do ADR-10 §6.2/§6.3 + AC da story — NÃO inventar; tudo já no draft)

> ZERO código de produção. Qualquer alteração fora de `tests/` = scope errado → STOP.

- **`tests/mocks/handlers/openai.ts` — ESTENDER (não recriar):** os 5 fixtures SSE da 8.2 ficam **byte-a-byte intactos**; acrescentar só o caminho **não-streaming** (discriminar `stream !== true`) que devolve `{choices:[{message:{content:'<json>'}}], usage:{prompt_tokens, completion_tokens}}` para o C6, com magic strings `MOCK_OPENAI_CLASSIFIER_{MULTI_INTENT,SINGLE,MALFORMED}`.
- **`tests/mocks/proxy-fetch-openai.ts` — NOVO (sibling):** `fetchFn` injectável em `new OpenAIInferenceTransport(fetchFn)` que intercepta `/api/openai/proxy` e devolve SSE fiel ao wire OpenAI (mesmos magic strings do handler), com `tool_calls.function.arguments` **fragmentados em ≥2 deltas**, usage só com `include_usage`, `[DONE]`.
- **`tests/unit/agent/providers/cross-provider-parity.test.ts` — NOVO:** suite **parametrizada** (não duplicada) — C1 texto, C2 1-tool (FALSIFICÁVEL AC5), C3 multi-tool ≥2 índices (obrigatório — prova que o `Map<index>` não mistura `id`), C4 args malformados→`error`, C5 tool sem args→`{}`, C6 classifier multi-intent. Afirma **shape idêntico** de `LLMStreamEvent`; **NÃO** compara `inputTokens`/`outputTokens` entre providers.
- **Teste falsificável (AC5) — INEGOCIÁVEL** (`mock-protocol-fidelity.md` + ADR-10 §6.2): ≥1 teste que **falharia** se o mock entregasse os args completos num único delta (prova que o accumulator é exercido). Comentar explicitamente `// FALSIFICÁVEL: ...`.
- **Não-regressão (AC6):** `handlers/anthropic.ts` e `proxy-fetch.ts` com **zero linhas alteradas**; os 5 fixtures SSE da 8.2 intactos; suite ≥2527 PASS.

## 6. Regras operacionais que o próximo terminal TEM de respeitar

| Regra | Detalhe |
|-------|---------|
| `separation-of-roles.md` | **CRÍTICO na 8.5 (T1):** se o `@qa` autora as fixtures, o gate sobe a `@architect`. Registar a escolha; não mudar a meio. |
| `mock-protocol-fidelity.md` | A 8.5 é o ALVO: o MSW reflecte o wire real; ≥1 teste falsificável que falha se os args vierem num só delta. |
| CR `--base main` no gate de saída | Norma do Epic 8 (princípio em `EPIC-8.md §8`; ficheiro real de CR = `coderabbit-integration.md`). O CR autoritativo é o **server-side no head SHA** do PR, não o local (lição 8.4: local 0/0 vs server-side 5 findings/2 Major). |
| `merge-authority.md` | O @devops faz o merge com as **6 condições** verdes no **head SHA**. NÃO pedir merge manual ao Eurico. `CHANGES_REQUESTED` stale por Minor não bloqueia se o head SHA está limpo → `--admin --squash --delete-branch`. |
| `not-tested-trailer-rules.md` | A 8.5 NÃO toca CI/test-runner/build/segurança → `Not-tested:` é waiver válido só para edge cases de runtime improváveis. |
| Hard-stop §8 | Máx **2 iterações** CR fix→re-review por story. Iter 3+ exige `Authorized-by:` do Eurico no commit. |
| `gh` | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`. |
| Commit selectivo | **NUNCA `git add -A`/`.`** Working tree com ruído (§2). `git add` ficheiro-a-ficheiro. Trailers + `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. |
| Script de teste | `npm run test:unit` (NÃO `npm test`) a partir de `imersao-tools/nexus/v2/`. Baseline ~2527 PASS. Flake `oauth-status` isola 6/6. |
| Glob não alcança `nexus/v2/**` | Usar `Read`/`Bash` com paths absolutos para os ficheiros do projecto (lição recorrente). |

## 7. GOTCHAs e decisões a não reabrir

- **A 8.5 ASSENTA em 8.2 + 8.4** (ambos os caminhos JÁ existem em `main`). A parity **compara-os** — não reimplementa nada. Branch sai de `main` sem rebase.
- **8.5 é infra de teste — ZERO produção.** Se precisares de mexer em produção para a parity passar, o problema é uma regressão da 8.2/8.4 a **escalar**, não a "corrigir de lado" na 8.5.
- **O teste falsificável é inegociável** (ADR-10 §6.2) — mock com args num só delta dá parity verde FALSA.
- **NÃO recarregar a Anthropic** (recusa explícita do Eurico). **OpenAI directo.** Caminho Anthropic intocado (default `anthropic` mantém ~2527 testes verdes por construção).
- **Produção só acende no 8.6 cutover** — a 8.5 NÃO faz flip de flag em produção.
- **Memória do projecto:** `project_nexus_v2_provider_migration` (decisão + âmbito). Ler na activação.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-*.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260629-epic-8-story-8.5-VALIDADA-GO-executar.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `@po (Pax)`
DATA: `29/06/2026`
