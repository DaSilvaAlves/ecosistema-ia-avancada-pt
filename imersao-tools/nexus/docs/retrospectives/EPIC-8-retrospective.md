# Retrospectiva — Epic 8 Nexus v2 (Migração de Provider de Inferência — dual-provider OpenAI)

> **Autor:** Pax (`@po`) | **Data:** 01/07/2026
> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Branch consolidação:** `main` (6 stories merged via PRs #95-#100; closure commit Story 8.6 `8e370829`)
> **Período:** 25/06/2026 → 01/07/2026 (UTC+1, Lisboa)
> **Referência de formato:** `retrospectives/EPIC-6-retrospective.md` + `EPIC-5` + `EPIC-4` + `EPIC-3` + `EPIC-2` + `EPIC-1`
> **Estado de fecho:** **6/6 stories Done — Epic 8 FECHADO pela capacidade dual-provider entregue.** A Story 8.6 fecha em **âmbito revisto** (correct-course 01/07/2026): runbook + capacidade dual-provider entregues e verdes; **cutover LIVE para OpenAI deferido on-demand** (`REC-8.6-CUTOVER-DEFERIDO`). Critério de fecho: a promessa de valor do epic é a *capacidade* de comutar de provider (ADR-10 §1.2.3 — "o critério é correcção, não uptime"), não o *acto* do cutover.

---

## 1. Sumário executivo

- **6/6 stories Done** em `main` (8.1-8.6), migração dual-provider Anthropic↔OpenAI derivada inteiramente do **ADR-10** (aceite, decisor Eurico — NÃO reabrir). **Waiver rate final: 0/6 (0%)** — iguala o melhor padrão de sempre (Epic 2 0/10, Epic 4 0/10, Epic 5 0/13, Epic 6 0/16). **Nenhuma story ultrapassou o hard-stop §8** (≤2 iterações CR em todas).
- **Epic não previsto no roadmap do PRD (§9), criado em resposta a um gatilho de produção.** A 25/06/2026 a Anthropic Messages API passou a devolver `400 credit balance too low` e a produção ficou sem cérebro. O Eurico decidiu **não recarregar créditos Anthropic** e migrar a inferência para OpenAI sob modelo dual-provider com flag `LLM_PROVIDER`. Por bloquear produção, teve prioridade sobre o Hardening (que deslizou para Epic 9 — renumeração ratificada pelo Eurico, `EPIC-8.md` nota de numeração).
- **A abstracção de providers (ADR-1/ADR-9, Epic 1) provou-se boa: a migração foi *adição de implementações*, não refactor.** Toda a diferença Anthropic↔OpenAI vive em três sítios (construir o request, converter as tools, parsear o stream); tudo a jusante (toolCallingLoop, gate de preview, undo, UI) ficou intocado. O default `LLM_PROVIDER=anthropic` garantiu zero regressão por construção — os ~2400 testes server-side permaneceram verdes.
- **Parity cross-provider verde nos 6 cenários canónicos (8.5)** — texto, 1 tool, multi-tool, args malformados, tool sem args, classifier multi-intent — provada em CI via MSW fiel (`mock-protocol-fidelity.md`). **Baseline de fecho: 2536 PASS / 0 FAIL real** (10 failures do full-suite isolam verde — contaminação cross-test sob carga, não regressão; ver §2.5).
- **8.1-8.5: execução limpa e rápida.** Cinco stories consecutivas com Architect Gate de saída PASS (8.5 gate `@qa`), CR `--base main` 1-2 iterações, e dívidas de CR **registadas explicitamente** (REC-8.3-CR-1/2 = 2 Minor não-bloqueadores; REC-8.4-CR-1 = 1 Major rate-limit ratificado como dívida partilhada com thread CR respondida). Nenhum Critical de segurança escapou ao gate no proxy Edge OpenAI (R5) — o CR `--base main` obrigatório na 8.4 (endpoint com input externo) cumpriu o seu papel.
- **8.6 (cutover) foi o ponto de aprendizagem do epic — e um caso-modelo de correct-course honesto.** A sequência técnica foi limpa (draft `@sm` → PO GO 9/10 → runbook `@dev` → QA PASS → PR #100 CR Iter 1 APPROVED, merged `eb5d18a5`). Mas no gate de cutover, o `vercel env ls` revelou que **o cutover LIVE nunca tinha sido executado** (produção sem `OPENAI_API_KEY` nem flags; só `ANTHROPIC_API_KEY` provisionada há ~57 dias) e que **a premissa central do Epic 8 tinha evaporado** — a produção respondia via Anthropic (cérebro vivo, smoke test PASS via Anthropic). O Eurico decidiu manter Anthropic; o cutover foi deferido on-demand (`REC-8.6-CUTOVER-DEFERIDO`). O epic fechou 6/6 pelo **valor entregue** (capacidade dual-provider + runbook validado), com AC1/AC2/AC3(letra)/AC6 **deferidos explicitamente — não waived em silêncio**.
- **A separação proponente≠gate funcionou no re-scope.** O correct-course foi proposto pelo `@aiox-master` (Orion); a validação do re-scope foi um gate independente do `@po` (Pax, ACEITE-condicional); o fecho só ocorreu após a reconciliação do `EPIC-8.md` §6/§10 pelo `@aiox-master`. `separation-of-roles.md` aplicada a uma decisão de âmbito, não só a código.
- **Vercel production live** contínua em `https://imersao.ia.expressia.pt`. Facto novo descoberto no gate: o deployment activo em produção é o commit `4e2b1c4` (observabilidade "J-6") — **trabalho paralelo de outra sessão, fora dos handoffs do Epic 8**. A produção não estava no estado que os handoffs do epic assumiam. Lição de coordenação multi-sessão (§5.3).

---

## 2. Métricas concretas

### 2.1 — Stories e iterações CodeRabbit

| Métrica | Valor | Observação |
|---------|-------|------------|
| Total stories do epic | 6 | 8.1 → 8.6 (decomposição directa ADR-10 §8 S1-S6) |
| Stories Done | **6/6** | Todas em `main` |
| Stories com GO de validação `@po`/Architect Gate à 1.ª passagem | **6/6** | Nenhuma rejeitada na validação |
| Stories com iterações CR ≤2 | **6/6** | Hard-stop §8 respeitado sem autorização em todas |
| Stories que ultrapassaram o hard-stop §8 | **0** | Mantém o padrão do Epic 6 (0) |
| Waiver rate ("merge waived") | **0/6 (0%)** | Iguala Epic 2/4/5/6 |
| Stories com re-scope / correct-course | **1 (8.6)** | Cutover LIVE deferido on-demand — fecho honesto, não waiver |

> **Nota "quality gate" vs "CodeRabbit":** o quality gate AIOX (PO Validation / QA Gate Quinn / Architect Gate Aria / `@dev` gate) é camada distinta das iterações CodeRabbit no PR. Distinção mantida desde a Retrospectiva Epic 1. Como no Epic 6, o CR `--base main` no gate de saída (`cr-base-main-no-gate-saida`, A1 Epic 5) reduziu findings antes do PR; o CR server-side no PR continuou a apanhar semântica de produção fina (ex: 8.5 Iter 1 2 Major + 4 Minor).

### 2.2 — Distribuição por story (detalhe)

| Story | Âmbito (ADR-10 §8) | Executor → Gate | Gate AIOX | Iter CR (PR) | Resultado | Dívida CR |
|-------|--------------------|-----------------|-----------|--------------|-----------|-----------|
| 8.1 — Fundação: flag + factory + env (S1) | `LLM_PROVIDER`, `OPENAI_API_KEY`, `toolsToOpenAIShape`, guard nome ≤64 | `@dev` → `@architect` | PASS Confiança Alta (cross-layer) | 1 (1 Major guard nome de tool + 2 Minor → `40dc1fdb`, re-review APPROVED) | — |
| 8.2 — `OpenAIExecutor` server streaming (S2) | reagregação `tool_calls` por `index`, `toOpenAIMessages` | `@dev` → `@architect` | PASS (streaming + contrato de estado tool-calling) | CR `--base main` 0 findings Major | — |
| 8.3 — `OpenAIClassifier` server JSON (S3) | `response_format:{json_object}`, `stripJsonMarkdownFences` defensivo | `@dev` → `@architect` | PASS Confiança Alta (parser AI) | 2 Minor não-bloq. → registados | REC-8.3-CR-1/2 |
| 8.4 — Proxy `/api/openai/proxy` Edge + transport client (S4, caminho QUENTE) | endpoint Edge + input externo, `sse-lines.ts` | `@dev` → `@architect` | PASS Confiança Alta (**CR `--base main` obrigatório**) | Iter 2 (4 fixes aplicados + 1 Major rate-limit ratificado como dívida) | REC-8.4-CR-1 |
| 8.5 — MSW non-streaming + parity cross-provider (S5) | `handlers/openai.ts` fiel + `proxy-fetch-openai.ts` + 6 cenários | `@dev` (autora) → `@qa` | PASS (`separation-of-roles`: `@dev` autora → gate `@qa`) | Iter 2 (2 Major + 4 Minor da Iter 1 → `07516ea3`, re-review APPROVED) | — |
| 8.6 — Cutover + runbook (S6) | runbook cutover/rollback + capacidade dual-provider validada | `@dev` (runbook) → `@qa` + manual | PO GO 9/10 + QA PASS; **re-scope validado `@po`** | Iter 1 APPROVED (1 Major guard `vercel env rm` + 1 Minor handoff → corrigidos) | — |

**Síntese:** 0 waivers em 6 stories. Nenhuma ultrapassou o hard-stop §8. O Architect Gate foi aplicado em todas as stories de risco (factory cross-layer, streaming/estado tool-calling, parser AI, endpoint Edge com input externo); a 8.5 (infra de teste, autora `@dev`) foi para `@qa`; a 8.6 (operacional) foi para `@qa` + gate manual. Todos os pares executor≠gate respeitaram `separation-of-roles.md`.

### 2.3 — Velocidade do epic

| Métrica | Valor |
|---------|-------|
| Epic 8 criado (`ff7dbac3`) | 25/06/2026 23:33 |
| Story 8.1 merged (PR #95 `dec0b203`) | 26/06/2026 01:37 |
| Story 8.6 merged (PR #100 `eb5d18a5`) | 01/07/2026 00:14 |
| Closure commit Story 8.6 (`8e370829`) | 01/07/2026 02:25 |
| **Duração total** | **~6 dias corridos** |
| Stories/dia (média) | ~1,0 (6 stories / 6 dias) |
| Dia mais denso | 27/06 (8.3 + 8.4 merged — 2 stories, S2/S3 paralelizadas após S1) |

> O ritmo (~1,0 story/dia) é inferior ao Epic 6 (~2,67), mas as stories do Epic 8 são de natureza diferente: cada uma toca o caminho quente de inferência (streaming, reagregação de estado de tool-calling, proxy Edge), com Architect Gate obrigatório e CR `--base main`. O caminho crítico ADR-10 §8 (`S1 → S2/S3 → S4 → S5 → S6`) é largamente sequencial — só S2/S3 paralelizam. A 8.1 (fundação) desbloqueou todas.

### 2.4 — Cronologia de merges em main

| Story | PR | Squash commit | Closure | Data de merge |
|-------|-----|---------------|---------|---------------|
| 8.1 — Fundação dual-provider | #95 | `dec0b203` | `e1fc19d3` | 26/06/2026 |
| 8.2 — `OpenAIExecutor` | #96 | `29ba4046` | `f8508efa` | 26/06/2026 |
| 8.3 — `OpenAIClassifier` | #97 | `fc74ea89` | `df07c1bc` | 27/06/2026 |
| 8.4 — Proxy OpenAI Edge + transport | #98 | `839d0828` | `1fcfaad5` | 27/06/2026 |
| 8.5 — MSW + parity cross-provider | #99 | `e082edf4` | `1a995f5e` | 30/06/2026 |
| 8.6 — Runbook cutover (âmbito revisto) | #100 | `eb5d18a5` | `8e370829` | 01/07/2026 |

> A 8.5 mergeou a 30/06 (2 dias após a 8.4) — dependia de 8.2 + 8.4 (precisa dos dois caminhos para testar parity). A 8.6 fechou a 01/07 com um correct-course intercalado no gate de cutover (§5.2).

### 2.5 — Evolução da suite de testes

> Snapshots datados (convenção A5 do Epic 3 — contagens vivem no Change Log/Dev Record). Baseline pré-Epic-8: ~2406 PASS pós-7.4 (`EPIC-8.md` §9).

| Marco | Testes (vitest) | Fonte |
|-------|-----------------|-------|
| Pré-Epic 8 (pós-7.4) | ~2406 | EPIC-8.md §9 |
| Story 8.1 | 2452 | Story 8.1 (memória de fecho) |
| Story 8.5 (baseline pós-parity) | 2535 | Story 8.5 / Story 8.6 T1.2 |
| **Story 8.6 (nº efectivo PASS)** | **2536** | QA Gate 8.6 v0.4 (0 FAIL real) |

**Delta Epic 8: ~+130 testes** (2406 → 2536). Crescimento modesto vs Epic 6 (+456) — coerente com um epic de *migração de infra* (adição de implementações atrás de interfaces existentes), não de features novas. O grosso são os testes de parity cross-provider (8.5) e os testes falsificáveis de fragmentação de `tool_calls` no MSW OpenAI (R3). O flake `oauth-status` pré-existente (isola 6/6) acompanhou todo o epic. **Nota de honestidade (QA Gate 8.6):** o full-suite deu 2526/2536 sob carga; os 10 failures (6 ficheiros) isolam verde (130/130) — é contaminação cross-test, não regressão (a 8.6 não toca código). Isto gerou um débito de isolamento de testes (§4.2, A3).

### 2.6 — Cobertura e invariante de não-regressão

- **Invariante ADR-10 §6.1 respeitada:** o caminho Anthropic (`anthropic.ts`, `executor.ts`, `schemas.ts`, `/api/anthropic/proxy`, `inference-transport.ts`, transport Anthropic em `client-executor.ts`) ficou intocado. Nenhuma falha num teste Anthropic durante a migração — sinal de que se tocou onde não se devia — ocorreu.
- **Padrão "helper puro + shape fina" mantido:** `openai.ts` (executor + classifier partilham `isOpenAITestEnv`/`buildOpenAIClientOptions`/sentinela), `sse-lines.ts` extraído (`iterateSseData`), proxy Edge com upstream constante.

---

## 3. Loved — o que funcionou bem

### 3.1 — A abstracção de providers do Epic 1 provou-se boa: migração foi adição, não refactor

A decisão arquitectural do Epic 1 (isolar o provider atrás de `ClassifierProvider`/`ExecutorProvider`, com contrato interno `LLMStreamEvent`/`ExecutorSSEEvent` agnóstico ao provider — ADR-1/ADR-9) pagou dividendos aqui. A migração inteira coube em **três pontos de diferença** (construir o request, converter as tools, parsear o stream) mais dois pontos de injecção (factory server + transport client). Tudo a jusante — toolCallingLoop, gate de preview, undo, UI — ficou intocado (ADR-10 §2). **Evidência:** a 8.2/8.3 vivem num só ficheiro `openai.ts`; a 8.3 reutilizou os helpers da 8.2; o default `anthropic` manteve ~2400 testes verdes por construção. **Uma abstracção limpa desenhada 2 meses antes permitiu uma migração de provider em ~6 dias sem tocar no caminho existente.** Este é o retorno directo de "Architect-First" — as decisões de ADR do Epic 1 não foram cerimónia.

### 3.2 — Waiver 0% num epic de caminho quente de produção — 5.ª vez consecutiva

O Epic 8 tocou o caminho mais crítico do produto (a inferência do cérebro, streaming em tempo real, reagregação de estado de tool-calling, um endpoint Edge novo a encaminhar para upstream externo) e fechou **0/6 waived, com 0 stories a ultrapassar o hard-stop §8**. Iguala o padrão Epic 2/4/5/6. **Evidência:** tabela §2.2. As dívidas de CR que surgiram (REC-8.3-CR-1/2 Minor; REC-8.4-CR-1 Major rate-limit) foram **ratificadas explicitamente com thread CR respondida**, não empurradas por baixo do tapete — o padrão maduro de "dívida registada, não silent-waive".

### 3.3 — O proxy Edge OpenAI (R5) passou o gate de segurança sem Critical escapado

A 8.4 abriu o 1.º endpoint OpenAI a encaminhar para upstream externo (`api.openai.com`) — exactamente a classe de superfície que gerou o Critical SSRF da 5.11. Desta vez, o padrão anti-SSRF foi aplicado preventivamente: **upstream URL constante** (sem componente controlável pelo cliente), auth `getSession` + rate-limit KV espelhados do proxy Anthropic, e **CR `--base main` obrigatório** no gate de saída (ADR-10 §7 R5). **Resultado:** nenhum Critical de segurança escapou ao gate; o único Major (rate-limit) foi ratificado como dívida partilhada com o proxy Anthropic (REC-8.4-CR-1), não uma vulnerabilidade. A lição §5.1 do Epic 5 (SSRF) continua internalizada.

### 3.4 — MSW fiel + teste falsificável apanharam o risco R3 (mock que passa mas prod falha)

O risco R3 do ADR-10 (MSW OpenAI não fiel → testes passam mas produção falha) é a materialização directa de `mock-protocol-fidelity.md` (A1 Epic 1). A 8.5 respondeu com um `handlers/openai.ts` que reflecte o wire real (args **fragmentados** em ≥2 deltas, chunk de usage só com `include_usage`, `[DONE]`, `finish_reason`) e **≥1 teste falsificável** que falharia se o mock entregasse os args completos num só delta. **Evidência:** a parity cross-provider (8.5) só é credível porque o mock OpenAI força a fragmentação — sem isso, seria uma tautologia verde. A regra nascida do Epic 1 continua a fechar a classe de bug que o CR sozinho não apanharia.

### 3.5 — Correct-course honesto: capacidade entregue permitiu fechar o epic com o cutover deferido

O momento decisivo do epic (§5.2) foi tratado como manda `correct-course` + `not-tested-trailer-rules.md` + Constitution Art. IV: quando o `vercel env ls` revelou que a premissa central tinha evaporado, **nada foi fingido**. A v0.5 da story distingue explicitamente "responde via Anthropic" de "via OpenAI (deferido)"; os AC deferidos foram **listados um a um** (não silent-waived); o cutover foi reclassificado como operação on-demand com item pendente rastreado (`REC-8.6-CUTOVER-DEFERIDO`, dono Eurico + `@devops`, gatilho explícito). **A promessa de valor do Epic 8 é a *capacidade* dual-provider (ADR-10 §1.2.3 — "correcção, não uptime"), que está entregue e verde.** Fechar 6/6 pelo valor de engenharia — com o acto operacional deferido de forma rastreável — é a decomposição correcta, não um atalho.

### 3.6 — Aplicação efectiva das regras nascidas de epics anteriores

| Regra / acção anterior | Estado no Epic 8 |
|------------------------|------------------|
| **A1 Epic 1 — `mock-protocol-fidelity.md`** | Crítica na 8.5. MSW OpenAI reflecte o wire real; teste falsificável que força a fragmentação de `tool_calls`. Ver §3.4. |
| **A1 Epic 4 — `internal-state-contract-gate.md`** | Aplicada na 8.2 (estado de tool-calling atravessa stream→loop→message→request; round-trip `id`↔`tool_call_id` no cenário multi-tool) e na 8.1 (eixo (c) caminhos de falha: fail-loud em key ausente / provider sem impl / mismatch de flags — sem silent-fallback). |
| **A4 Epic 3 — `external-contract-identifiers.md`** | Aplicada na 8.1: envelope OpenAI `{type:'function',...}` + limite ≤64 ASCII validados no draft como contrato externo (OpenAI function spec). Guard em `register()`. |
| **A6 Epic 1 — `separation-of-roles.md`** | Aplicada em 6/6. Factory/streaming/parser/endpoint Edge → `@architect`; infra de teste autora `@dev` (8.5) → `@qa`; operacional (8.6) → `@qa` + manual. **Estendida ao re-scope da 8.6:** proponente (`@aiox-master`) ≠ gate (`@po`). |
| **A1 Epic 5 + A1 Epic 6 — `cr-base-main-no-gate-saida`** | Crítica na 8.1 (secret `OPENAI_API_KEY` + env) e na 8.4 (endpoint Edge com input externo). CR `--base main` obrigatório; o CR server-side no PR continuou a apanhar findings (8.5 Iter 1). |
| **`not-tested-trailer-rules.md`** | Crítica na 8.6: a story toca env vars de produção → `Not-tested:` não é waiver; exige `Evidence:` (smoke test / `vercel logs`). O Evidence Gate estava correctamente definido na story. |
| **Hard-stop §8** | Respeitado em 6/6 — nenhuma story precisou de Iter 3+ nem de `Authorized-by:`. |

**O ciclo retrospectiva → regra → aplicação produziu resultados pela 6.ª vez consecutiva** (Epics 2-6 e agora 8). Nenhuma regra existente foi violada.

---

## 4. Os débitos não-bloqueadores

Nenhum é bloqueador. O Epic 8 gerou débitos Baixa/Média e um item operacional deferido explícito (o cutover), além dos herdados do ADR-10 §9.

### 4.1 — O item operacional deferido (não é débito de qualidade — é uma alavanca on-demand)

| Item | Detalhe |
|------|---------|
| `REC-8.6-CUTOVER-DEFERIDO` | Cutover LIVE da inferência de produção Anthropic → OpenAI (flip `LLM_PROVIDER`/`NEXT_PUBLIC_LLM_PROVIDER` + provisão `OPENAI_API_KEY` na Vercel + redeploy + smoke test). |
| Dono | **Eurico + `@devops`** |
| Gatilho | "se/quando o Anthropic esgotar (saldo/quota) **ou** por decisão de negócio" |
| Acção | Seguir `docs/runbooks/cutover-openai-rollback.md` (§3 cutover, §4 rollback). Não é uma story nova — é procedimento operacional já documentado e validado (AC4). On-demand, sem SLA. |
| Estado | **Não bloqueia o Epic 9** — o cérebro está vivo em produção (via Anthropic) e a capacidade de comutar está pronta e testada (parity verde + runbook). |

### 4.2 — Débitos técnicos do Epic 8 (deferidos no Change Log das stories)

| # | Débito | Severidade | Origem | Recomendação |
|---|--------|-----------|--------|--------------|
| REC-8.3-CR-1 / REC-8.3-CR-2 | 2 Minor de CR não-bloqueadores no `OpenAIClassifier` | Baixa | Story 8.3 | Housekeeping; registados na thread CR |
| REC-8.4-CR-1 | Rate-limit do proxy OpenAI Edge — dívida partilhada com o proxy Anthropic (ambos com a mesma limitação) | Média | Story 8.4 | Endereçar em conjunto com `REC-ADR10-PROXY-DRY` quando ambos os proxies forem consolidados |
| **REC-8.6-ISOLAMENTO-TESTES** (NOVO) | Full-suite dá 10 failures sob carga (6 ficheiros) que isolam verde — contaminação cross-test, além do flake `oauth-status`. Não é regressão, mas polui a baseline | Média | QA Gate 8.6 v0.4 | Story técnica de isolamento de testes — candidata ao Epic 9 (Hardening). Ver A3 |

### 4.3 — Dívidas herdadas do ADR-10 §9 (NÃO deste epic)

| ID | Descrição |
|----|-----------|
| `REC-ADR10-STRICT-OUTPUTS` | Avaliar `function.strict:true` + `additionalProperties:false` por tool (incompatível com `.optional()` actuais) |
| `REC-ADR10-PROXY-DRY` | Extrair helper partilhado de auth+rate-limit entre `/api/anthropic/proxy` e `/api/openai/proxy` após ambos estáveis (liga-se a REC-8.4-CR-1) |
| `REC-ADR10-ANTHROPIC-REMOVAL` | Decisão futura (NÃO agora): remover Anthropic + ~2400 testes quando OpenAI estiver provada em prod — requer decisão explícita do Eurico |

**Síntese:** 1 débito Média novo (isolamento de testes) + 1 Média herdado da 8.4 (rate-limit partilhado) + os do ADR-10 §9. O backlog de débitos Baixa acumulado dos Epics 3-6 mantém-se (ver A3 da retrospectiva Epic 6).

---

## 5. Learned — lições do epic

### 5.1 — Uma abstracção de provider limpa transforma uma migração num trabalho aditivo de baixo risco (confirmação de Architect-First)

| Item | Detalhe |
|------|---------|
| **Onde** | Todo o epic — em especial 8.1/8.2/8.3 |
| **Contexto** | A migração de provider de inferência é tipicamente um refactor caro e arriscado. Aqui foi *adição de implementações* atrás de interfaces existentes (`ClassifierProvider`/`ExecutorProvider`), com o contrato interno agnóstico ao provider. |
| **Lição** | O investimento em abstracção do Epic 1 (ADR-1/ADR-9) tornou possível migrar em ~6 dias sem tocar no caminho Anthropic e sem regressão por construção. **Quando uma decisão de arquitectura isola bem uma dependência externa atrás de uma interface, uma troca futura dessa dependência é aditiva, não destrutiva.** Vale como argumento a favor de gastar o esforço de abstracção no momento certo — o retorno vem quando o mundo muda (aqui: saldo Anthropic esgotado). |
| **Acção** | Sem regra nova — padrão positivo. Memória de projecto (§7 A5). |

### 5.2 — Stories de cutover/config de produção têm de verificar o estado real de produção no ARRANQUE, não no gate final (LIÇÃO CENTRAL — gera regra nova)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 8.6, gate de cutover, 01/07/2026 |
| **Contexto** | A 8.6 avançou por todo o pipeline (draft → PO GO 9/10 → runbook → QA PASS → PR #100 merged) assumindo a premissa do Epic 8: "produção sem cérebro por saldo Anthropic esgotado desde 25/06" (ADR-10 §1.1). Só no gate de cutover — o **último** passo — o `vercel env ls` revelou que (a) o cutover LIVE nunca fora executado (produção só com `ANTHROPIC_API_KEY`, sem flags OpenAI) e (b) a produção respondia normalmente **via Anthropic** (premissa evaporada). |
| **Causa raiz** | A premissa que justificava o epic (§1.1 do ADR-10) foi tratada como verdade estável durante ~6 dias, quando era um **estado de produção verificável a qualquer momento** com um comando (`vercel env ls` / `vercel logs` / SHA do deployment activo). Nenhum gate anterior à 8.6 verificou o estado real de produção; a 8.6 herdou a premissa do draft do epic em vez de a re-confirmar contra a realidade. |
| **Lição** | Uma story cujo âmbito é *alterar ou depender do estado de produção* (cutover, flip de flags, provisão de env vars, migração de config) **deve verificar o estado real de produção como primeira tarefa do draft/gate de entrada** — não assumir a premissa herdada do epic. A verificação (`vercel env ls`, `vercel logs`, SHA do deployment activo) custa 1 comando e teria detectado a premissa evaporada 6 dias mais cedo. Isto **não invalidou o trabalho** (a capacidade dual-provider é valor real), mas evitaria o correct-course tardio e o desalinhamento entre os handoffs e a realidade. |
| **Acção** | **Regra nova proposta** — ver **A1** (`production-state-verification-gate.md`). |

### 5.3 — Trabalho paralelo entre sessões/terminais tem de ser reconciliado contra o estado real, não contra os handoffs (LIÇÃO — reforço + amenda a handoff)

| Item | Detalhe |
|------|---------|
| **Onde** | Descoberta no gate da 8.6: o deployment activo em produção é `4e2b1c4` ("observabilidade J-6"), trabalho de outra sessão fora dos handoffs do Epic 8. Adicionalmente, o handoff `RETOMA-20260630` dizia "PO gate 8.6 pendente" quando o gate já estava feito (PO GO 9/10, com ficheiros untracked ainda não committados). |
| **Contexto** | O Eurico trabalha em múltiplos terminais/sessões em paralelo (ver memória `feedback_never_close_terminals`). Um handoff committed é um snapshot point-in-time; entre o momento em que é escrito e o momento em que é consumido, o mundo (produção, git, ficheiros no disco) pode ter mudado por trabalho paralelo. |
| **Lição** | (a) O estado de produção pode divergir dos handoffs por trabalho paralelo — a fonte de verdade da produção é a própria produção (`vercel`), não o handoff. (b) O agente que consome um handoff deve **verificar as suas afirmações contra o estado real (git status + ficheiros no disco + produção) antes de agir** — um handoff que diz "gate pendente" pode estar desactualizado; confiar nele cegamente arrisca repetir trabalho já feito. |
| **Acção** | **Amenda proposta a `handoff-central.md`** — ver **A2** (não é regra nova; é um passo de verificação no protocolo de consumo de handoff). Liga-se à A1 (a verificação de produção é o mesmo mecanismo). |

### 5.4 — Deferir o acto e entregar a capacidade é fechar o epic pelo valor, não deixá-lo incompleto (padrão positivo, paralelo à 6.15)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 8.6, decisão de fecho do Epic 8 |
| **Contexto** | O Epic 8 tinha duas camadas de valor: a **capacidade** dual-provider (engenharia: flag + `OpenAIExecutor`/`OpenAIClassifier` + proxy Edge + parity verde + runbook) e o **acto** do cutover LIVE (operacional: flip de flags em produção). A capacidade estava 100% entregue e verde; o acto tornou-se desnecessário quando a premissa evaporou. |
| **Lição** | Quando a promessa de valor de um epic é uma *capacidade* e não um *acto* (ADR-10 §1.2.3 — "o critério é correcção, não uptime"), o epic fecha quando a capacidade está entregue e verificável, mesmo que o acto operacional que a exercia seja deferido on-demand. É o mesmo princípio da 6.15 (diferida ao Epic 7 por dependência externa): a decomposição correcta separa o que foi entregue do que é uma alavanca futura rastreada. O critério é: **os AC deferidos estão listados explicitamente (não silent-waived) e o item deferido tem dono + gatilho rastreados.** |
| **Acção** | Sem regra nova — padrão positivo documentado nesta retrospectiva e no `EPIC-8.md` §10. Memória de projecto (§7 A5). |

### 5.5 — O CR `--base main` no gate de saída continua a não substituir o CR server-side no PR (confirmação da A1 Epic 5/6)

| Item | Detalhe |
|------|---------|
| **Onde** | 8.5 (PR #99 — Iter 1 2 Major + 4 Minor server-side) |
| **Contexto** | Como no Epic 6, o CR `--base main` no gate de saída reduziu findings, mas o CR server-side no PR da 8.5 continuou a apanhar 2 Major + 4 Minor (aplicados no `07516ea3`, re-review APPROVED). |
| **Lição** | Confirmação directa: o `--base main` no gate de saída é um filtro a montante obrigatório, não o último. O CR no PR continua no ciclo de fecho. |
| **Acção** | Sem regra nova — a A1 do Epic 5/6 mantém-se validada. Reforço em **A4**. |

---

## 6. Lacked — o que faltou

### 6.1 — A premissa de produção não foi verificada cedo — só no gate final (8.6)

A premissa que justificava o epic ("produção sem cérebro") foi tratada como estável durante ~6 dias e desmentida no último gate. Um `vercel env ls`/`vercel logs` no arranque da 8.6 (ou de qualquer story de config de produção) tê-lo-ia detectado logo. — **Acção A1** (regra nova: `production-state-verification-gate.md`).

### 6.2 — Os handoffs assumiram um estado de produção que trabalho paralelo tinha alterado

O deployment activo (`4e2b1c4`, observabilidade J-6) veio de outra sessão fora dos handoffs do Epic 8, e um handoff dizia "gate pendente" quando estava feito. Falta um passo de reconciliação do handoff contra o estado real no momento do consumo. — **Acção A2** (amenda a `handoff-central.md`).

### 6.3 — Isolamento de testes: o full-suite não é determinístico sob carga

O full-suite dá 10 failures que isolam verde (além do flake `oauth-status`). Não é regressão, mas polui a baseline e obriga a análise manual a cada gate. — **Acção A3** (story técnica candidata ao Epic 9).

---

## 7. Decisões accionáveis

> **Nota de autoridade:** as acções que **criam ou alteram regras formais em `.claude/rules/`** são executadas por `@aiox-master` (Orion). `@po` (Pax) **propõe**; `@aiox-master` cria. Antes de propor regra nova, verificou-se se já está coberta pelas regras existentes (`internal-state-contract-gate.md`, `not-tested-trailer-rules.md`, `separation-of-roles.md`, `cr-base-main-no-gate-saida`/`coderabbit-integration.md`, `external-contract-identifiers.md`, `mock-protocol-fidelity.md`, `merge-authority.md`, `handoff-central.md`). O Epic 8 gera **1 regra nova** (A1 — verificação de estado de produção; genuinamente não coberta) e **1 amenda** (A2 — passo de verificação no protocolo de handoff).

| # | Acção | Owner | Tipo | Nova regra ou reforço? | Deadline | Done quando |
|---|-------|-------|------|------------------------|----------|-------------|
| **A1** | **Criar regra `production-state-verification-gate.md`**: qualquer story cujo âmbito seja *alterar ou depender do estado de produção* (cutover, flip de flags, provisão/alteração de env vars, migração de config, deploy dirigido) **deve verificar o estado real de produção como primeira tarefa do draft/gate de entrada** — `vercel env ls` (ou equivalente do provider), `vercel logs`, e o SHA do deployment activo — em vez de herdar a premissa do epic. A verificação fica registada na story. Origem: Story 8.6 (premissa evaporada detectada só no gate final). | `@aiox-master` (Orion) cria; `@po` (Pax) propõe | **REGRA NOVA** | **SIM** — `production-state-verification-gate.md`. Não coberta: `internal-state-contract-gate` cobre estado *interno multi-camada em código*, não o estado *live de produção/config* | Antes do Epic 9 (e retroactivamente aplicável a qualquer story de deploy/config) | Regra criada em `.claude/rules/` + referenciada no template de story de tipo deployment/config |
| **A2** | **Amendar `handoff-central.md`** com um passo de verificação no consumo: o agente que consome um handoff **verifica as afirmações-chave do handoff contra o estado real (git status, ficheiros no disco, e — para stories de produção — o estado live) antes de agir**. Um handoff é um snapshot point-in-time; trabalho paralelo entre sessões pode tê-lo desactualizado. Origem: Story 8.6 (handoff dizia "gate pendente" quando estava feito; deployment `4e2b1c4` de sessão paralela). | `@aiox-master` (Orion) amenda; `@po` (Pax) propõe | **AMENDA** (não regra nova) | NÃO — amenda a `handoff-central.md` (regra global existente) | Antes do Epic 9 | `handoff-central.md` inclui o passo "verificar contra estado real no consumo" |
| **A3** | **Decidir o destino do débito `REC-8.6-ISOLAMENTO-TESTES`** (full-suite não-determinístico sob carga — 10 failures que isolam verde) + o backlog Baixa acumulado dos Epics 3-6. Candidato natural: story técnica de isolamento de testes no Epic 9 (Hardening). REC-8.4-CR-1 (rate-limit) liga-se a REC-ADR10-PROXY-DRY. | `@pm` (Morgan) + `@po` (Pax) | **PROCESSO** (backlog/scope) | NÃO — decisão de backlog | No arranque do Epic 9 | Os débitos têm destino (story técnica criada ou backlog confirmado) |
| **A4** | Confirmar a **adesão à A1 do Epic 5/6** (`cr-base-main-no-gate-saida`): validada de novo na 8.5 (CR server-side no PR apanhou 2 Major + 4 Minor mesmo com `--base main` no gate). O `--base main` no gate de saída é obrigatório, mas o CR no PR continua no ciclo de fecho. | `@aiox-master` (Orion) verifica; `@po` reporta | **CONFIRMAÇÃO/REFORÇO** | NÃO — regra já existe (A1 Epic 5) | Antes do Epic 9 | `coderabbit-integration.md` continua a exigir ambos os passos |
| **A5** | Memory log: actualizar a memória do Nexus v2 com Epic 8 = 6/6 Done (8.6 âmbito revisto — cutover deferido on-demand), waiver 0/6, PRs #95-#100, closure `8e370829`, baseline 2536 PASS, e referência a esta retrospectiva + a `REC-8.6-CUTOVER-DEFERIDO`. | `@aiox-master` (Orion) ou Eurico | **MEMÓRIA** | NÃO — memória | 01/07/2026 | MEMORY.md actualizado com entrada que refere este documento |
| **A6** | Eurico + `@pm` decidem o **próximo epic**. Ordem renumerada: `8 → 9`. Epic 9 (Hardening + Deploy + PWA) é o sucessor natural — absorve o débito de isolamento de testes (A3) e a decisão de consolidação de proxies (REC-ADR10-PROXY-DRY). O Epic 7 (Voice + OCR) continua em paralelo no que resta. | Eurico + `@pm` (Morgan) | **PROCESSO** (roadmap) | NÃO — roadmap | Próxima sessão | Epic escolhido → `@pm *create-epic 9` |

### Acções que requerem `@aiox-master` (Orion) — resumo

| Acção | Natureza | Estado |
|-------|----------|--------|
| **A1** | **REGRA NOVA** — `production-state-verification-gate.md` (verificar estado real de produção no arranque de stories de cutover/config) | **PROPOSTA** — `@po` propõe; `@aiox-master` cria |
| **A2** | **AMENDA** — passo de verificação no consumo de handoff em `handoff-central.md` | **PROPOSTA** — `@po` propõe; `@aiox-master` amenda |
| **A4** | **CONFIRMAÇÃO/REFORÇO** — adesão à A1 Epic 5/6 (`cr-base-main-no-gate-saida`) | **PROPOSTA** — `@po` reporta; `@aiox-master` confirma |
| **A5** | **MEMÓRIA** — actualizar MEMORY.md com o fecho do Epic 8 | **PROPOSTA** — `@aiox-master` ou Eurico |

> `@po` (Pax) **não** cria regras formais — apenas as propõe. A criação/alteração de `.claude/rules/` é autoridade de `@aiox-master` (precedente Epics 1/3/4/5). **O Epic 8 gera 1 regra nova (A1) — o 1.º desde o Epic 5** — porque expôs um ponto cego genuíno (verificação de estado de produção) que nenhuma regra existente cobre.

---

## 8. Comparação Epic 1 vs 2 vs 3 vs 4 vs 5 vs 6 vs 8

> Epic 7 (Voice + OCR) corre em paralelo e não fechou ainda — não entra na comparação de fecho.

| Métrica | Epic 1 | Epic 2 | Epic 3 | Epic 4 | Epic 5 | Epic 6 | Epic 8 | Tendência |
|---------|--------|--------|--------|--------|--------|--------|--------|-----------|
| Stories (total) | 10 | 10 | 11 | 10 | 13 | 17 | **6** | epic mais pequeno (migração focada) |
| Stories Done | 10 | 10 | 11 | 10 | 13 | 16/16 | **6/6** | completo |
| Duração | 7 dias | ~6 dias | ~8 dias | ~9 dias | ~8 dias | ~6 dias | **~6 dias** | rápido para o risco |
| Waiver rate | 50% (5/10) | 0% | 9,1% (1/11) | 0% | 0% | 0% (0/16) | **0% (0/6)** | iguala o melhor |
| Validação/gate GO à 1.ª passagem | — | — | — | 9/10 | 13/13 | 16/16 | **6/6** | mantido |
| Stories que ultrapassaram o hard-stop §8 | 1 | 1 | 4 | 2 | 1 | 0 | **0** | mantido a zero |
| Criticals de segurança escapados ao gate | — | 0 | 0 | 0 | 1 (5.11) | 0 | **0** | proxy Edge OpenAI seguro |
| ADRs base reabertos | 0 | 0 | 0 | 0 | 0 | 0 | **0** | migração aditiva, sem refactor |
| Débitos Média/Alta gerados | — | 2 | 0 | 0 | 0 | 0 | **1 (Média — isolamento testes)** | 1 débito de infra de teste |
| Contrato externo de protocolo novo | não | não | não | sim (Web Push) | sim (fetch web) | sim (OAuth+Telegram) | **sim (OpenAI wire)** | 2.º provider de inferência |
| Delta de testes | — | — | +260 | +395 | +513 | +456 | **~+130** | modesto (migração aditiva) |
| Correct-course / re-scope | 0 | 0 | 0 | 0 | 0 | 0 (6.15 diferida no draft) | **1 (8.6 no gate)** | premissa evaporada |
| Acções da retro anterior aplicadas | n/a | A1,A2,A6 | A2,A6,A1 | A3,A4,A6,A1 | A1-A5 (Epic 4) | A1-A6 (Epic 5) | **A1-A6 (Epic 6)** | ciclo validado 6× |
| Regras novas geradas | — | — | 1 | 1 | 1 | 0 | **1 (A1)** | 1.ª desde Epic 5 |

**Conclusão da comparação:** o Epic 8 foi o **mais pequeno e focado** (6 stories, migração de infra) e fechou **6/6 com 0% de waiver e 0 stories a ultrapassar o hard-stop §8** — no epic que toca o **caminho mais quente do produto** (a inferência do cérebro). Destaca-se: (a) a **abstracção de providers do Epic 1 provou-se boa** — a migração foi aditiva, sem reabrir ADRs nem tocar o caminho Anthropic (§5.1); (b) **0 Criticals no proxy Edge OpenAI** (lição SSRF do Epic 5 internalizada); (c) a **parity cross-provider verde** com MSW fiel fechou o risco R3. O ponto de aprendizagem foi a **8.6**: a premissa central do epic (saldo Anthropic esgotado) evaporou e só foi detectada no gate final — o que gera a **1.ª regra nova desde o Epic 5** (`production-state-verification-gate.md`, A1). Mas o correct-course foi tratado de forma exemplar: capacidade entregue e verde, AC deferidos listados explicitamente (não silent-waived), cutover reclassificado como alavanca on-demand rastreada. **Fechar um epic pela *capacidade* entregue quando o *acto* operacional deixou de ser necessário — de forma honesta e rastreável — é a decomposição correcta, não um atalho.**

---

## 9. Próximas acções na sequência

1. **`@devops` (Gage)** — push do closure commit desta retrospectiva (docs-only). O closure da Story 8.6 (`8e370829`) já está em `main`; esta retrospectiva é um commit docs adicional.
2. **`@aiox-master` (Orion) ou Eurico** — executa **A5**: actualiza memória com Epic 8 = 6/6 Done (8.6 âmbito revisto), waiver 0/6, cutover deferido on-demand.
3. **`@aiox-master` (Orion)** — executa **A1** (criar `production-state-verification-gate.md`) e **A2** (amendar `handoff-central.md`); confirma **A4** (adesão `cr-base-main-no-gate-saida`).
4. **`@pm` (Morgan) + `@po` (Pax)** — executam **A3** (destino de `REC-8.6-ISOLAMENTO-TESTES` + backlog Baixa) no arranque do Epic 9.
5. **Eurico + `@devops`** — mantêm `REC-8.6-CUTOVER-DEFERIDO` como alavanca on-demand (gatilho: Anthropic esgotar ou decisão de negócio); runbook `docs/runbooks/cutover-openai-rollback.md` pronto.
6. **Eurico + `@pm` (Morgan)** — executam **A6**: decidem próximo epic → `@pm *create-epic 9` (Hardening + Deploy + PWA).

---

## 10. Convenções desta retrospectiva

| Regra | Verificação |
|-------|-------------|
| `workspace-governance.md` | Documento em `imersao-tools/nexus/docs/retrospectives/` (categoria 2: Projectos Próprios) — OK |
| `language-standards.md` | PT-PT, datas DD/MM/YYYY, separador decimal vírgula, sem PT-BR — OK |
| `output-format-standards.md` | Tabelas ASCII markdown, sem emojis, sem preâmbulo — OK |
| `mandatory-change-log.md` | Acções A1-A6 com owner + tipo + deadline + done + flag de autoridade `@aiox-master` — OK |
| `separation-of-roles.md` | Retrospectiva é trabalho de `@po`; documento de processo, sem quality gate sobre si mesma. Regista que o re-scope da 8.6 respeitou proponente (`@aiox-master`) ≠ gate (`@po`) — OK |
| `merge-authority.md` | Regista que todos os merges (PRs #95-#100) foram feitos pelo agente (`@devops`/`@aiox-master`), nunca merge manual pelo Eurico — OK |
| `agent-authority.md` | Criação de regras formais marcada como autoridade `@aiox-master` — `@po` propõe, não cria — OK (A1 nova + A2 amenda propostas, não criadas) |
| `not-tested-trailer-rules.md` | A 8.6 toca env vars de produção → Evidence Gate correctamente exigido na story — OK |
| Constitution Artigo IV (No Invention) | Todas as métricas derivadas de `git log` real (squash commits PRs #95-#100 + closure `8e370829`), `EPIC-8.md`, `stories/completed/8.6.story.md` (Change Log v0.1-v0.7), ADR-10, e memórias de validação/fecho. Onde uma métrica não existia nas fontes, não foi inventada (ex: contagens de teste intermédias 8.2/8.3/8.4 não desagregadas → citadas só 8.1/8.5/8.6). O facto de produção (deployment `4e2b1c4`) é registado como "a confirmar com o Eurico", conforme a v0.5 da story — não re-verificado por este agente (sem acesso a produção) |

---

**Documento criado por:** Pax (`@po`) em 01/07/2026
**Sources verificados:**
- `git log --format="%h %ai %s"` em `ecosistema-ia-avancada-pt` (squash commits PRs #95-#100 + closures 8.1-8.6 + closure `8e370829`)
- `imersao-tools/nexus/docs/EPIC-8.md` (estado FECHADO 6/6, §1 histórico, §5 stories, §6 ACs revistos, §8 lições/pré-req, §10 fecho + `REC-8.6-CUTOVER-DEFERIDO` + riscos R1-R7)
- `imersao-tools/nexus/docs/stories/completed/8.6.story.md` (ATUALIZAÇÃO DE ÂMBITO, Change Log v0.1-v0.7, AC1-AC6, QA Gate, Evidence Gate, PO Re-Scope Validation, PO Closure)
- `imersao-tools/nexus/docs/architecture/ADR-10-dual-provider-openai-migration.md` (§1 decisão vinculativa, §2 abstracção, §4 protocolo, §6 parity, §7 riscos, §8 decomposição S1-S6, §9 dívidas)
- `imersao-tools/nexus/docs/retrospectives/EPIC-1/2/3/4/5/6-retrospective.md` (referência de formato e baseline comparativa)
- `.claude/rules/` (internal-state-contract-gate, not-tested-trailer-rules, separation-of-roles, cr-base-main-no-gate-saida/coderabbit-integration, external-contract-identifiers, mock-protocol-fidelity, merge-authority, handoff-central) — verificadas para distinguir "regra nova" de "reforço/amenda"
