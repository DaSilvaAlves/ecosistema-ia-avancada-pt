# Epic 8 — Migração de Provider de Inferência (dual-provider OpenAI)

> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Criado por:** Morgan (`@pm`) em 25/06/2026
> **Estado:** **Em curso — 2/6 stories Done.** Story 8.1 (S1, fundação) **Done** — merged em `main` via **PR #95** (squash, `dec0b203`) a 25/06/2026, Architect Gate de saída PASS (Confiança Alta), CR `--base main` 1 iteração (1 Major guard de nome de tool + 2 Minor resolvidos em `40dc1fdb`, re-review APPROVED), waiver 0%. **A 8.1 desbloqueia a 8.2 (`OpenAIExecutor`) e a 8.3 (`OpenAIClassifier`), agora paralelizáveis** (ADR-10 §8 caminho crítico `S1 → S2/S3`). **8.2 (`OpenAIExecutor`) Done** (PR #96, squash `29ba4046` em `main`, 26/06/2026; Architect Gate de saída PASS, CR `--base main` 0 findings Major, waiver 0%); **8.3 (`OpenAIClassifier`) em Draft** (`stories/active/8.3.story.md`); restantes 8.4-8.6 por draftar. **Este é um epic não previsto no roadmap original do PRD (§9), criado em resposta a um gatilho de produção:** a 25/06/2026 a Anthropic Messages API passou a devolver `400 credit balance too low` e a produção do Nexus v2 ficou **sem cérebro** (todo o pipeline classifier→executor→tools depende de `api.anthropic.com`). O Eurico decidiu **não recarregar créditos Anthropic** e migrar a camada de inferência para a OpenAI (decisão vinculativa — ADR-10 §1.2). Por bloquear produção, esta migração **tem prioridade sobre o Hardening**, que desliza para **Epic 9** (ver nota de numeração abaixo).
> **Fonte da verdade:** `architecture/ADR-10-dual-provider-openai-migration.md` (Aceite em `main`, decisor Eurico — NÃO reabrir). O ADR-10 decompõe a migração em **6 stories sequenciais (S1-S6)** e atribui-as ao `@sm` (ADR-10 §8). Estende ADR-1 (split Edge/Node), ADR-5 (Tool Registry), ADR-8 (mock E2E) e **ADR-9** (executor client-side via proxy Edge — caminho quente de produção). Trace adicional: `architecture-v2.md` §1 (tabela ADR), §4.1 (Edge/Node), §7 (Tool Registry); `PRD-NEXUS-V2.md` §6.1 (cérebro multi-intent).
> **Arquitectura:** A camada de inferência já isola o provider atrás de `ClassifierProvider`/`ExecutorProvider` (`lib/agent/providers/types.ts`). A migração é uma **adição de implementações** atrás das mesmas interfaces — **não** um refactor do executor (ADR-10 §1.3, §2). O contrato canónico interno (`LLMStreamEvent` → `ExecutorSSEEvent`) é **agnóstico ao provider**: toda a diferença Anthropic↔OpenAI vive em três sítios (construir o request, converter as tools, parsear o stream) — tudo a jusante (toolCallingLoop, gate de preview, undo, UI) fica intocado (ADR-10 §2). Há **dois pontos de injecção**: o caminho server (factory → SDK directo) e o caminho client (ADR-9 — `InferenceTransport` → proxy Edge), ambos cobertos pela migração.
> **Constitution Artigo IV (No Invention):** cada story, âmbito, AC-resumo e gate abaixo traça ao **ADR-10** (aceite) e a código real verificado em `main`. **Nenhum FR novo é inventado** — esta é uma migração de infra/arquitectura derivada do ADR-10, não a entrega de um requisito funcional novo do PRD (ver §4).

---

> **NOTA DE NUMERAÇÃO — RATIFICADA PELO EURICO (25/06/2026):**
>
> O PRD-NEXUS-V2.md §9 (roadmap) e os EPIC-*.md anteriores **reservavam "Epic 8" para "Hardening + Deploy + PWA"**. Com o gatilho de produção (saldo Anthropic esgotado), o Eurico **ratificou** a seguinte numeração:
>
> - **Epic 8 = Migração de Provider de Inferência** (este epic — urgente, devolve cérebro à produção).
> - **Epic 9 = Hardening + Deploy + PWA** (o antigo "Epic 8", não iniciado, sem ficheiro `EPIC-*.md` próprio, logicamente posterior — fazer hardening de um cérebro que não funciona não faz sentido antes da migração).
>
> **Razão (ADR-10 §1.2.3 + §1.1):** a migração é a única coisa que devolve cérebro à produção e é o trabalho real a seguir; o Hardening pode deslizar para 9 sem custo (ainda não existia como artefacto). A proposta `[AUTO-DECISION]` partiu do `@sm` no draft da 8.1; o `@pm` (Morgan) formalizou-a e o Eurico ratificou-a. Os documentos de roadmap vivos (PRD §9-10, `EPIC-7.md` §2/§10, `AUDITORIA-20260612-ROADMAP-CONCLUSAO.md`, `architecture-v2.md` §16) foram renumerados em conformidade. As referências históricas a "Epic 8" que significam Hardening (stories fechadas, retrospectivas, QA gates, PO validations, `archive/`, e os planos fechados EPIC-2/4/5/6) são registos point-in-time e **lêem-se como "Epic 9 (Hardening)"** — não são reescritas retroactivamente; o futuro `@pm *create-epic 9` reconcilia a numeração 9.x do Hardening num passo coerente.

---

## 1. Goal

Migrar a camada de inferência do Nexus v2 de **Anthropic** para **OpenAI** sob um modelo **dual-provider com feature flag** (`LLM_PROVIDER` = `anthropic` | `openai`), sem partir o caminho Anthropic existente nem os ~2400 testes que o cobrem. A OpenAI é **adicionada em paralelo**, atrás das interfaces `ClassifierProvider`/`ExecutorProvider` já existentes; a Anthropic **mantém-se** como fallback até a OpenAI estar provada em produção. O critério da migração é **correcção, não uptime** (ADR-10 §1.2.3 — produção fica sem cérebro até a OpenAI estar live, sem pressão de atalhos). Trace: ADR-10 §1 (contexto e decisão), §3 (design da abstracção), §8 (decomposição em stories).

## 2. Contexto e posicionamento

| Dimensão | Detalhe |
|----------|---------|
| Gatilho | **Produção bloqueada** (ADR-10 §1.1): a 25/06/2026 a Anthropic devolveu `400 credit balance too low`. Não é bug de nenhuma story — é a camada de inferência inteira sem créditos. Decisão do Eurico: migrar para OpenAI, não recarregar Anthropic. |
| Decisão vinculativa (ADR-10 §1.2) | (1) **Dual-provider com flag `LLM_PROVIDER`** — Anthropic mantém-se como fallback e alvo dos testes; não remover agora. (2) **OpenAI directo** (`api.openai.com`) — não Azure, não gateway; o critério é custo/disponibilidade, não RGPD. (3) **Produção sem cérebro** até a OpenAI estar live — caminho Architect-First completo, sem atalhos. |
| Princípio herdado (ADR-9) | O caminho quente de produção é **client-side** (`InferenceTransport` → proxy Edge). A migração cobre **os dois pontos de injecção** (client e server), não só o SDK — ver §2 do ADR-10. |
| Abstracção limpa | O executor já isola o provider atrás de `ClassifierProvider`/`ExecutorProvider`. A migração é adição de implementações, não refactor. O contrato interno (`LLMStreamEvent`/`ExecutorSSEEvent`) é agnóstico ao provider → tudo a jusante (loop, preview, undo, UI) fica intocado (ADR-10 §2). |
| Prioridade no roadmap | Por bloquear produção, **precede o Hardening** (agora Epic 9). É o trabalho real a seguir ao Epic 7 (em curso). Não bloqueia o Epic 7 nem é bloqueado por ele — o Epic 7 (Voice + OCR) corre em paralelo no que resta. |
| Sem custo de regressão por construção | O default `LLM_PROVIDER=anthropic` garante que, sem a flag, o comportamento é **byte-a-byte o de hoje** → os ~2400 testes server-side permanecem verdes por construção (ADR-10 §3.2, §6.1). |

## 3. Dependências

| Relação | Epic / Artefacto | Estado |
|---------|------------------|--------|
| Depende de | **ADR-10** (aceite em `main`) — define a decisão, o design da abstracção dual-provider e a decomposição S1-S6 | DONE — em main |
| Depende de | Epic 1 (Cérebro Multi-Intent — `ClassifierProvider`/`ExecutorProvider`, factory, Tool Registry, `LLMStreamEvent`/`ExecutorSSEEvent`) — é a abstracção sobre a qual a migração assenta | DONE — em main |
| Depende de | Epic 0 Story 0.5 (proxy Anthropic server-side + AI key Node-only) — o proxy OpenAI (S4) espelha este padrão | DONE — em main |
| Estende (não reabre) | ADR-1 (split Edge/Node), ADR-5 (Tool Registry), ADR-8 (mock E2E), **ADR-9** (executor client-side via proxy Edge) | Aceites — não reabrir |
| Bloqueia / Precede | **Nenhum epic funcional.** Devolve cérebro à produção; o Hardening (Epic 9) é logicamente posterior mas não depende formalmente desta migração | Epic 9 não iniciado |
| Corre em paralelo com | Epic 7 (Voice + OCR — em curso 4/10). Os dois são independentes; o cérebro que o Voice/OCR usam beneficia da migração quando o cutover (S6) acontecer | Epic 7 em curso |

## 4. Functional Requirements cobertos

**Nenhum FR novo.** Esta é uma **migração de infra/arquitectura da camada de inferência**, derivada do ADR-10 — não a entrega de um requisito funcional novo do PRD. O comportamento funcional do cérebro (classificação multi-intent, tool calling, preview, undo, audit) **não muda** para o utilizador: muda apenas **quem** executa a inferência por trás das mesmas interfaces. Os FRs do cérebro (PRD §6.1, cobertos pelo Epic 1) continuam a ser satisfeitos — agora por qualquer um dos dois providers atrás da flag.

> Constitution Artigo IV (No Invention): não se inventa um FR para justificar este epic. O âmbito traça inteiramente ao ADR-10 (gatilho de produção + decisão vinculativa do Eurico). Se o roadmap do PRD vier a numerar requisitos não-funcionais de provider (ex: NFR de disponibilidade/custo de inferência), isso é decisão futura do `@pm`/`@po` — não é assumido aqui.

## 5. Stories (6) — trace ADR-10 §8

> **Decomposição directa do ADR-10 §8 (S1-S6 → 8.1-8.6)** — nenhuma story inventada nem omitida face ao ADR. Os pares executor/quality-gate respeitam `separation-of-roles.md` (executor ≠ quality_gate). Heurística de gate herdada dos Epics 2-7 e fixada no ADR-10 §8: **parser AI / endpoint Edge com input externo / reagregação de estado de tool-calling → `@architect`**; infra de teste sem efeito externo → `@qa` (com a ressalva: se o `@qa` **autorar** as fixtures, o gate dessa unidade sobe para `@architect`). `@sm` (River) finaliza a atribuição em cada draft; `@po` (Pax) valida.

| # | Story | Âmbito (1 linha — ADR-10 §8) | Gate de cada story (ADR-10 §8) | Estado |
|---|-------|------------------------------|--------------------------------|--------|
| 8.1 | **Fundação: interface, flag, factory, env** (S1) | `LLM_PROVIDER`/`NEXT_PUBLIC_LLM_PROVIDER`, `OPENAI_API_KEY`, dep `openai`, defaults OpenAI em `models.ts`, branch na `factory.ts` (fail-loud se key ausente; default `anthropic`; `openai` sem impl → fail-loud claro), `toolsToOpenAIShape`+`OpenAIToolShape`, asserção de concordância de flags, guard nome de tool ≤64 ASCII | **`@architect`** (factory + env + flag, cross-layer) | **Done (PR #95, `dec0b203`)** (`stories/completed/8.1.story.md`) |
| 8.2 | **`OpenAIExecutor` (server, streaming)** (S2) | SDK `openai` streaming + `stream_options.include_usage`; reagregação de `tool_calls` fragmentados por `index`; `toOpenAIMessages` (system/tool/assistant-tool_call); emite os **mesmos** `LLMStreamEvent` canónicos | **`@architect`** (streaming + contrato de estado de tool-calling) | **Done (PR #96, `29ba4046`)** (`stories/completed/8.2.story.md`) |
| 8.3 | **`OpenAIClassifier` (server, JSON)** (S3) | `chat.completions` não-streaming + `response_format:{type:'json_object'}`; `stripJsonMarkdownFences` defensivo; devolve `ClassificationResult` validado por Zod; usage mapeada | **`@architect`** (parser AI — a mais leve das três) | Draft (`stories/active/8.3.story.md`) |
| 8.4 | **Proxy OpenAI + transport client** (S4) | `/api/openai/proxy` (Edge, auth `getSession`, rate-limit KV, upstream `api.openai.com/v1/chat/completions`, `Authorization: Bearer`); `OpenAIInferenceTransport` (body+SSE OpenAI); `client-executor` selecciona por `NEXT_PUBLIC_LLM_PROVIDER`; extrair `iterateSseData`→`sse-lines.ts` | **`@architect`** (endpoint Edge + input externo — **CR `--base main` obrigatório**) | Não iniciado |
| 8.5 | **MSW + parity tests** (S5) | `tests/mocks/handlers/openai.ts` (SSE fiel: args fragmentados em ≥2 deltas, chunk de usage, `[DONE]`, `finish_reason`); variante OpenAI de `proxy-fetch.ts`; suite de parity cross-provider nos 6 cenários canónicos | **`@qa`** (infra de teste) — escala a **`@architect`** se o `@qa` autorar as fixtures (`separation-of-roles.md`) | Não iniciado |
| 8.6 | **Cutover + runbook** (S6) | `LLM_PROVIDER=openai` + `NEXT_PUBLIC_LLM_PROVIDER=openai` em prod; smoke test com key real; runbook de rollback (flip para `anthropic`); validação de key | **`@qa`** + manual (deploy por `@devops`) | Não iniciado |

**Caminho crítico (ADR-10 §8):** `S1 → S2/S3 (paralelizáveis após S1) → S4 → S5 → S6`. A 8.5 depende de 8.2 + 8.4 (precisa dos dois caminhos para testar parity). A 8.6 é a **única story com efeito em produção** e só arranca com a parity (8.5) verde + key validada. A 8.1 (**Done** — PR #95, `dec0b203`) desbloqueou todas. A **8.2 (`OpenAIExecutor`) está Done** (PR #96, `29ba4046`); o próximo trabalho é a **8.3 (`OpenAIClassifier`)** — mesmo ficheiro `openai.ts`, reutiliza os helpers da 8.2 (`isOpenAITestEnv`/`buildOpenAIClientOptions`/sentinela) — e depois a 8.4.

## 6. Acceptance Criteria (nível epic) — trace ADR-10

Não há AC do PRD para este epic (não é um epic do roadmap original — ver §4). Os critérios de aceitação de nível epic derivam directamente da decisão vinculativa do ADR-10:

| # | Critério | Trace | Story principal |
|---|----------|-------|-----------------|
| AC1 | Com `LLM_PROVIDER` ausente ou `anthropic`, o comportamento é **byte-a-byte o de hoje**; os ~2400 testes server-side ficam verdes por construção | ADR-10 §3.2, §6.1 | 8.1 (fundação) |
| AC2 | Com `LLM_PROVIDER=openai`, o cérebro responde via OpenAI com **`LLMStreamEvent`/`ExecutorSSEEvent` idênticos** aos da Anthropic nos 6 cenários de parity (texto, 1 tool, multi-tool, args malformados, tool sem args, classifier multi-intent) | ADR-10 §6.3 | 8.5 (parity) |
| AC3 | A produção responde via OpenAI após o cutover, com runbook de rollback documentado e testado (flip para `anthropic`) | ADR-10 §8 row S6 | 8.6 (cutover) |
| AC4 | A `OPENAI_API_KEY` é **server-only** (NFR5) — nunca `NEXT_PUBLIC_*`, nunca no bundle client; o proxy OpenAI Edge tem upstream constante (sem SSRF) e auth/rate-limit espelhados do Anthropic | ADR-10 §3.4, §5, §7 R5 | 8.1, 8.4 |

> **Verificabilidade só-de-produção:** o cutover (AC3) só é plenamente verificável com a key OpenAI real em produção (padrão AC13 da 4.9 / AC6 da 7.3) — verificação manual deferida ao Eurico + `@devops`, mapeada no draft da 8.6. A parity (AC2) é verificável em CI via MSW fiel (8.5).

## 7. Diferenças de protocolo e riscos herdados do ADR-10 (para o draft de cada story)

> Os pontos abaixo já estão **resolvidos no ADR-10** (validados contra a doc oficial OpenAI, ADR-10 §4 e §10 Fontes) — **não são GAPs em aberto**, são o contrato que cada story implementa. Listados aqui para o `@dev`/`@architect` os terem à mão no draft.

| Ponto | Resolução no ADR-10 | Story |
|-------|---------------------|-------|
| `tool_calls` **fragmentados** em streaming | Acumular `function.arguments` por `tool_calls[].index` num buffer; `JSON.parse` **só** em `finish_reason:'tool_calls'`/fim (mesma classe de bug da Story 1.2). `Map<index,{id,name,argsAccumulator}>` (ADR-10 §4.1) | 8.2 |
| `usage` em streaming | Exige `stream_options:{include_usage:true}`; mapear `prompt_tokens→inputTokens`, `completion_tokens→outputTokens` (ADR-10 §4.1) | 8.2 |
| Envelope de tools | `toolsToOpenAIShape` (irmão de `toolsToAnthropicShape`) → `{type:'function',function:{name,description,parameters}}`, mesmo `zodToJsonSchema` (ADR-10 §4.2) | 8.1 |
| Round-trip `id`↔`tool_call_id` | A OpenAI rejeita `role:'tool'` órfão; `toOpenAIMessages` preserva o `id`; parity multi-tool obrigatório (ADR-10 §4.3, §6.3) | 8.2, 8.5 |
| Classifier JSON nativo | `response_format:{type:'json_object'}` elimina a saga das fences; manter `stripJsonMarkdownFences` defensivo (ADR-10 §4.4) | 8.3 |
| Nomes de tools | snake_case lowercase ASCII é subconjunto estrito do padrão OpenAI; único cuidado é o limite ≤64 caracteres → guard em `register()` (ADR-10 §7.1) | 8.1 |
| Proxy OpenAI Edge — SSRF/auth | Espelhar auth `getSession` + rate-limit KV do Anthropic; upstream URL **constante**; **CR `--base main` obrigatório** no gate de saída (ADR-10 §7 R5) | 8.4 |
| Mismatch de flags | Sibling-proxy por provider → falha visível, não silenciosa; asserção de concordância no boot (ADR-10 §3.4, §7 R4) | 8.1, 8.4 |

## 8. Qualidade e processo — lições das Retrospectivas Epic 1 a 6 + hard-stop

| Acção / lição | Aplicação no Epic 8 |
|---------------|---------------------|
| **A1 Epic 1 — `mock-protocol-fidelity.md`** | Crítico na **8.5**: o MSW `handlers/openai.ts` reflecte o wire real (args **fragmentados** em ≥2 deltas, chunk de usage só com `include_usage`, `[DONE]`, `finish_reason`). ≥1 teste **falsificável** que falharia se o mock entregasse args completos num só delta (ADR-10 §6.2). |
| **A1 Epic 4 — `internal-state-contract-gate.md`** | Aplica-se à **8.2**: o estado de tool-calling atravessa stream→loop→message→request; o cenário multi-tool prova que o round-trip `id`↔`tool_call_id` não parte na fronteira do provider (ADR-10 §4.3, §6.3). Na **8.1** aplica-se ao eixo (c) caminhos de falha (fail-loud em key ausente / provider sem impl / mismatch de flags — sem silent-fallback). |
| **A4 Epic 3 — `external-contract-identifiers.md`** | Aplicada na **8.1**: o envelope OpenAI e o limite ≤64 são contrato externo (OpenAI function spec); validados no draft (ADR-10 §7.1). |
| **A6 Epic 1 — `separation-of-roles.md`** | Aplicada na tabela §5 — nenhum executor é o seu próprio quality gate. Ressalva explícita na 8.5 (se `@qa` autorar fixtures → gate sobe a `@architect`). |
| **A1 Epic 5 + A1 Epic 6 — `cr-base-main-no-gate-saida`** | Crítico na **8.1** (secret `OPENAI_API_KEY` + env validation) e na **8.4** (endpoint Edge novo com input externo → superfície SSRF/auth): o gate de saída corre CR `--base main` (o `-t uncommitted` não apanha findings de classe segurança server-side). |
| **`not-tested-trailer-rules.md`** | A 8.1 toca `lib/shared/env.ts` (validação de secret) e a 8.4 toca CI/Edge — contexto sensível: `Not-tested:` **não** é waiver; exige `Evidence:` (output local) ou escala. |
| **Hard-stop QA loop (§8 herdado dos Epics 1-7)** | **Máximo 2 iterações** de `qa-loop-fix`/CR por story; **Iter 3+ ou merge waived exigem autorização humana explícita do Eurico no commit** (trailer `Authorized-by:`). Mantido sem alteração. |
| **Alvo de waiver rate** | Epic 6 fechou 0/16 (0%); Epic 5 0/13; Epic 4 0/10. **Alvo Epic 8: 0%.** |
| **Invariante de não-regressão (ADR-10 §6.1)** | Qualquer falha num teste Anthropic durante a migração é sinal de que se tocou onde não se devia → **STOP**. O caminho Anthropic (`anthropic.ts`, `executor.ts`, `schemas.ts`, `/api/anthropic/proxy`, `inference-transport.ts`, `client-executor.ts` no que respeita ao transport Anthropic) é intocado. |

### Pré-requisitos a confirmar antes do arranque (bloqueantes do cutover, não da criação do epic)

| # | Item | Responsável | Estado |
|---|------|-------------|--------|
| 1 | **`OPENAI_API_KEY` real provisionada** em produção (Vercel UI) — necessária para o smoke test do cutover (8.6) | Eurico + `@devops` | Pendente — necessário antes da 8.6 |
| 2 | **Ratificação de numeração de epic** (Epic 8 = Migração; Hardening → Epic 9) | `@pm` (Morgan) + Eurico | **CONCLUÍDO — ratificado 25/06/2026** |
| 3 | **Versão estável da dep `openai`** confirmada no momento da implementação (npm/context7) — placeholder `^<latest>` no ADR-10 §5 | `@dev` (Dex) | **CONCLUÍDO — dep `openai` adicionada na 8.1 (PR #95)** |

## 9. Quality gates do epic

| Gate | Detalhe |
|------|---------|
| Pré-requisito | ADR-10 aceite + Epic 1 (abstracção de providers) consolidado em main — SATISFEITO |
| Não-regressão Anthropic | Suite completa `npm run test:unit` verde com `LLM_PROVIDER` ausente/`anthropic` (baseline ~2406 PASS pós-7.4) — invariante ADR-10 §6.1 |
| Parity cross-provider | Suite partilhada afirma `LLMStreamEvent`/`ExecutorSSEEvent` idênticos nos 6 cenários (ADR-10 §6.3) — obrigatória e falsificável (8.5) |
| Mock fidelity | `handlers/openai.ts` reflecte o wire real OpenAI; ≥1 teste falsificável que força a fragmentação dos `tool_calls` (ADR-10 §6.2) |
| Por story | lint + typecheck + `npm run test:unit` + CodeRabbit (CRITICAL bloqueia — NFR18); **CR `--base main`** no gate de saída das stories sensíveis (8.1 secret/env, 8.4 endpoint Edge) |
| Secret handling | `OPENAI_API_KEY` server-only (NFR5), nunca `NEXT_PUBLIC_*`, nunca logada (8.1, 8.4) |
| Cutover | Smoke test com key real em produção + runbook de rollback testado (8.6) — verificação manual deferida (padrão AC13 da 4.9) |

## 10. Fecho do epic

> **Estado: Epic 8 EM CURSO — 2/6 stories Done.** Stories 8.1 (fundação, PR #95, `dec0b203`) e 8.2 (`OpenAIExecutor`, PR #96, `29ba4046`) **Done**; próximo: 8.3 (`OpenAIClassifier`, mesmo ficheiro `openai.ts`). Critério de fecho: **6/6 stories Done** com a parity (8.5) verde e o cutover (8.6) validado em produção pelo Eurico. Com o Epic 8 fechado, o cérebro do Nexus volta a responder em produção (via OpenAI), a Anthropic fica como fallback atrás da flag, e o roadmap segue para o **Epic 9 (Hardening + Deploy + PWA)**.

**Epic 8 = Migração de Provider de Inferência (dual-provider OpenAI).** Epic não previsto no roadmap original, criado em resposta ao gatilho de produção (saldo Anthropic esgotado — ADR-10 §1.1) e **ratificado pelo Eurico (25/06/2026)** com prioridade sobre o Hardening (que desliza para Epic 9). É uma migração de infra/arquitectura **sem FR novo** (§4): muda quem executa a inferência, não o comportamento funcional do cérebro. A decomposição (6 stories S1-S6) e todo o design vêm do **ADR-10** (aceite em `main`, decisor Eurico — NÃO reabrir). O default `LLM_PROVIDER=anthropic` garante zero regressão por construção; a OpenAI entra em paralelo atrás das interfaces existentes; o cutover (8.6) é a única story com efeito em produção e só arranca com a parity verde.

### Sequência (ADR-10 §8 — caminho crítico)

- **8.1** (fundação: flag + factory + env + `toolsToOpenAIShape` + defaults + dep) → desbloqueia todas. Architect Gate.
- **8.2** (`OpenAIExecutor` server streaming) e **8.3** (`OpenAIClassifier` server JSON) → paralelizáveis após 8.1. Architect Gate.
- **8.4** (proxy `/api/openai/proxy` Edge + `OpenAIInferenceTransport` + selecção client + `sse-lines.ts`) → depende de 8.1/8.2. Architect Gate (CR `--base main`).
- **8.5** (MSW `handlers/openai.ts` fiel + parity cross-provider) → depende de 8.2 + 8.4. `@qa` (→ `@architect` se autorar fixtures).
- **8.6** (cutover em produção + smoke test + runbook de rollback) → só após 8.5 verde + key real. `@qa` + manual (deploy `@devops`).

### Dívidas registadas (ADR-10 §9 — NÃO neste epic)

| ID | Descrição |
|----|-----------|
| `REC-ADR10-STRICT-OUTPUTS` | Avaliar `function.strict:true` + `additionalProperties:false` por tool (exige todos os campos `required`; incompatível com `.optional()` actuais) |
| `REC-ADR10-PROXY-DRY` | Extrair helper partilhado de auth+rate-limit entre `/api/anthropic/proxy` e `/api/openai/proxy` após ambos estáveis |
| `REC-ADR10-ANTHROPIC-REMOVAL` | Decisão futura (NÃO agora): remover Anthropic + 2400 testes quando OpenAI estiver provada em prod — requer decisão explícita do Eurico |

### Riscos do Epic 8 (ADR-10 §7)

| # | Risco | Sev. | Mitigação |
|---|-------|------|-----------|
| R1 | Reagregação errada de `tool_calls` (parsear args antes de completos) | Alta | `Map<index,…>` + `JSON.parse` só em `finish_reason:'tool_calls'`/fim; teste multi-tool falsificável (mesma classe da 1.2) — 8.2 |
| R2 | Round-trip `id`↔`tool_call_id` parte (OpenAI rejeita `role:'tool'` órfão) | Alta | `toOpenAIMessages` preserva `id`; parity multi-tool obrigatório — 8.2/8.5 |
| R3 | MSW OpenAI não fiel (args completos / sem usage / sem `[DONE]`) → testes passam mas prod falha | Alta | `mock-protocol-fidelity.md` + teste falsificável que força a fragmentação — 8.5 |
| R4 | Mismatch `LLM_PROVIDER` ↔ `NEXT_PUBLIC_LLM_PROVIDER` | Média | Sibling-proxy por provider (falha visível); asserção de concordância no boot — 8.1/8.4 |
| R5 | Proxy OpenAI Edge — superfície SSRF/auth (1.º endpoint novo a encaminhar para upstream externo) | Alta | Auth `getSession` + rate-limit KV espelhados; upstream constante; **CR `--base main`** obrigatório — 8.4 |
| R6 | Hard-stop §8 (≤2 iterações CR) | Média | PRs pequenos, um provider-concern por story (S1…S6); Iter 3+ exige `Authorized-by:` |
| R7 | Produção sem cérebro durante a transição | Aceite | Decisão do Eurico (ADR-10 §1.2.3); cutover (8.6) só após parity verde + key validada |

---

*Epic 8 preparado por Morgan (`@pm`) em 25/06/2026, formalizando a decisão de roadmap **ratificada pelo Eurico** (Epic 8 = Migração de Provider; Hardening → Epic 9). Ancorado inteiramente no `ADR-10-dual-provider-openai-migration.md` (aceite em `main`, decisor Eurico — NÃO reabrir): objectivo, design da abstracção dual-provider, decomposição em 6 stories (S1-S6 → 8.1-8.6), gates por story (§8), diferenças de protocolo validadas contra a doc oficial OpenAI (§4, §10 Fontes) e riscos (§7). Estende ADR-1/ADR-5/ADR-8/ADR-9. Zero invenção — sem FR novo (é migração de infra/arquitectura, §4); cada story, âmbito e gate traça ao ADR-10. Próximo passo: `@po *validate-story-draft 8.1` → Architect Gate de entrada → `@dev *develop 8.1`.*
