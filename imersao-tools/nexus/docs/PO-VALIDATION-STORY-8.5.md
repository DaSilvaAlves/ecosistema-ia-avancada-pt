# PO Validation — Story 8.5 (MSW `handlers/openai.ts` fiel + `proxy-fetch-openai.ts` + parity cross-provider)

**Validador:** Pax (`@po`)
**Data:** 29/06/2026
**Story:** `imersao-tools/nexus/docs/stories/active/8.5.story.md`
**Task:** `validate-next-story.md` — 10-point checklist
**Veredicto:** **GO** — Pontuação **9 / 10**
**Decisão de status:** mantém `Draft` (a transição para `Approved` cabe ao `@sm` / executor após registar a decisão T1 de executor/gate — ver ponto 6)

---

## Sumário executivo

A Story 8.5 está **inteiramente prescrita pelo ADR-10** (S5) e é uma das stories mais bem ancoradas do Epic 8. Verifiquei **as 3 citações literais do ADR-10** (§6.2, §6.3, §8 row S5) contra o texto real do ADR — **batem fielmente**. Os 6 cenários C1-C6 cobrem **exactamente** os 6 cenários canónicos do ADR-10 §6.3 (AC3 cobre C1-C5; AC4 cobre C6). O teste falsificável (AC5) está presente e bem especificado. Todos os paths de produção e de infra de teste citados na File List e Dev Notes **existem no projecto** (verificados por mim) e os 2 ficheiros novos (`proxy-fetch-openai.ts`, suite de parity) correctamente **ainda não existem**. A afirmação de baseline "≥2527 PASS pós-8.4" é **factualmente correcta e verificada** (Change Log da 8.4, CR Iter 2: 2527 PASS + flake oauth-status isolado 6/6 = 0 FAIL real).

**Um achado não-bloqueador de traceability** (a regra `cr-base-main-no-gate-saida.md` é citada como ficheiro de regra mas não existe como ficheiro físico em `.claude/rules/` — é um princípio/memória, com o ficheiro real a ser `coderabbit-integration.md`) e **três notas menores de implementação** (nome da suite [VERIFICAR], convenção de nome do helper sibling, alinhamento dos mocks de classifier no C6) baixam a pontuação de 10 para 9. Nenhum fix é obrigatório para arrancar. GO.

---

## Verificações de facto que fiz no código real (não confiei só no draft)

### Existência de ficheiros (anti-hallucination)

| Afirmação da story | Verificado por mim | Resultado |
|--------------------|--------------------|-----------|
| `tests/mocks/handlers/openai.ts` já existe (8.2, 5 fixtures SSE) | Sim — `ls` + `grep` | **CONFIRMADO** (`textOnlyFixture`, `oneToolFixture`, `multiToolFixture`, `malformedToolFixture`, `noArgsToolFixture`) |
| Magic strings `MOCK_OPENAI_{TOOL,MULTITOOL,MALFORMED,NOARGS,TEXT}` no handler | Sim — `grep` linhas 341-351 | **CONFIRMADO** (discriminação por `userText.includes(...)` exactamente como a story descreve) |
| Handler **não** discrimina ainda `stream !== true` (caminho não-streaming a adicionar) | Sim — handler só serializa fixtures SSE | **CONFIRMADO** (AC1 estende, não reescreve — extensão real, não inventada) |
| `tests/mocks/proxy-fetch.ts` existe (espelho Anthropic) | Sim | **CONFIRMADO** (exporta `createMockProxyFetch` → `{ fetchFn: typeof fetch }`) |
| `tests/mocks/handlers/anthropic.ts` existe e suporta classifier JSON | Sim — `grep` | **CONFIRMADO** (`body.system` contém `MOCK_CLASSIFIER` → JSON; suporta o lado Anthropic do C6) |
| `lib/agent/providers/openai.ts` (`OpenAIExecutor`/`OpenAIClassifier`) | Sim | **CONFIRMADO** |
| `lib/agent/providers/openai-inference-transport.ts` com `constructor(fetchFn?: typeof fetch)` | Sim — linhas 276-277 | **CONFIRMADO** (D-FETCH-BIND real; `OPENAI_PROXY_URL='/api/openai/proxy'` linha 85) |
| `lib/agent/schemas.ts` — `ClassificationResultSchema` | Sim — linha 69 (story cita 69-75) | **CONFIRMADO** |
| `lib/agent/schemas.ts` — `LLMStreamEventSchema` | Sim — linha 162 (`z.discriminatedUnion('type', ...)`) | **CONFIRMADO** |
| `app/api/openai/proxy/route.ts`, `lib/agent/sse-lines.ts` (8.4) | Sim | **CONFIRMADO** |
| `tests/unit/agent/providers/` é o directório da suite nova | Sim — contém `openai.classifier.test.ts`, `openai.executor.test.ts`, etc. | **CONFIRMADO** (path coerente) |
| Ficheiros novos `proxy-fetch-openai.ts` + suite de parity | Sim — não existem ainda | **CORRECTO** (são para criar) |

### Citações literais do ADR-10 (foco No Invention — Art. IV)

| Citação na story | Fonte ADR-10 | Resultado |
|------------------|--------------|-----------|
| §6.2 (cobertura OpenAI nova — args fragmentados, usage só com `include_usage`, `[DONE]`, `finish_reason`, "proxy-fetch.ts ganha variante OpenAI") | ADR-10 linhas 329-337 | **FIEL** (verbatim; a story omite apenas o prefixo "MSW", substância idêntica) |
| §6.3 (tabela dos 6 cenários + parágrafo `internal-state-contract-gate.md` "obrigatório e falsificável") | ADR-10 linhas 342-356 | **FIEL** (tabela e coluna "Falsifica" idênticas; afirma `LLMStreamEvent`/`ExecutorSSEEvent` idênticos) |
| §8 row S5 (âmbito + AC + gate `@qa` → escala `@architect` se `@qa` autorar) | ADR-10 linha 399 | **FIEL** (verbatim, incluindo a ressalva de gate) |

### Baseline de testes

| Afirmação | Verificado | Resultado |
|-----------|-----------|-----------|
| "≥2527 PASS pós-8.4" | Sim — Change Log da 8.4 (`stories/completed/8.4.story.md`, linha 492, CR Iter 2 head `8ff2062e`) | **CONFIRMADO** ("suite 2527 PASS + flake oauth-status isolado 6/6 = 0 FAIL real") — **não assumido** |

### Justificação D-8.5-HANDLER-EXTEND

| Afirmação | Verificado | Resultado |
|-----------|-----------|-----------|
| O classifier da 8.3 era `server.use(...)` local, a consolidar em `handlers/openai.ts` na 8.5 | Sim — `openai.classifier.test.ts` linhas 33-34: _"vive LOCAL neste test file via `server.use(...)` — NÃO toca o handler streaming da 8.2 ... a consolidação canónica é a 8.5"_ | **CONFIRMADO** (justificação factualmente correcta) |

---

## 10-Point Checklist

| # | Critério | Verdicto | Pontuação |
|---|----------|----------|-----------|
| 1 | Template completo (todas as secções presentes) | PASS | 1,0 |
| 2 | AC claros, testáveis, traçados ao ADR-10 §6.2/§6.3/§8 S5 | PASS | 1,0 |
| 3 | Tasks/subtasks cobrem todos os AC, ordem lógica (handler→proxy-fetch→suite→gates) | PASS | 1,0 |
| 4 | Dev Notes com contexto técnico verificado (não inventado) | PASS* | 0,5 |
| 5 | Dependências identificadas e satisfeitas (8.2 + 8.4 Done; ambos caminhos em main) | PASS | 1,0 |
| 6 | Separation-of-roles (mecanismo de gate registado e accionável em T1) | PASS | 1,0 |
| 7 | Escopo contido (ZERO código de produção; só `tests/`) | PASS | 1,0 |
| 8 | Regras do projecto aplicadas (mock-fidelity, CR --base main, merge-authority, not-tested) | PASS* | 0,5 |
| 9 | Riscos/gotchas identificados (fidelidade do mock, parametrização, lição 8.4) | PASS | 1,0 |
| 10 | Alinhamento ADR-10 + ausência de invenção (Art. IV) — 6 cenários = §6.3 | PASS | 1,0 |

**Total: 9,0 / 10** — limiar GO é ≥7. (*) Pontos 4 e 8 perdem 0,5 cada pelos achados menores abaixo (nenhum bloqueante).

### Detalhe por ponto

**1. Template completo — PASS.** Todas as secções presentes: Decisões de Design Centrais (com citações), Executor Assignment, Story, AC (6), CodeRabbit Integration, Tasks (5), Dev Notes (mapa de artefactos, regras, wire SSE, magic strings, [AUTO-DECISIONS]), Testing, Change Log, Not-Tested Evidence Gate, Dev Agent Record, QA Results.

**2. AC testáveis e traçados — PASS.** Os 6 AC são objectivos e verificáveis, cada um com `[Trace: ...]` ao ADR-10. AC1 (handler estendido não-streaming/C6), AC2 (`proxy-fetch-openai.ts`), AC3 (parity C1-C5), AC4 (parity C6), AC5 (falsificável), AC6 (não-regressão + baseline). Cada cenário tem critério de igualdade concreto (shape de `LLMStreamEvent`; `ClassificationResult` via `ClassificationResultSchema.parse()`).

**3. Tasks cobrem AC, ordem lógica — PASS.** T1 (decidir gate) → T2 (estender handler) → T3 (proxy-fetch-openai) → T4 (suite parity C1-C6) → T5 (gates + não-regressão). Ordem por dependência correcta. Mapeamento AC↔Task explícito.

**4. Dev Notes verificadas — PASS com nota.** Quase tudo verificado por mim no código real (ver tabelas acima). O mapa de artefactos é preciso. **Imprecisão menor:** a regra `cr-base-main-no-gate-saida.md` é citada como ficheiro de regra (§10 header, Dev Notes, Executor Assignment) mas **não existe como ficheiro em `.claude/rules/`** — é um princípio estabelecido (memória + documentado em `EPIC-8.md §8` exactamente com esse nome + aplicado na 8.4); o ficheiro de regra real que o cobre é `coderabbit-integration.md`. **Não é invenção de substância** (o princípio "CR `--base main` no gate de saída" é genuíno e foi aplicado na 8.4 com 5 findings server-side vs 0 local); é apenas uma referência a um nome de ficheiro inexistente, herdada do EPIC-8.

**5. Dependências satisfeitas — PASS.** 8.2 (`Done`, PR #96 `29ba4046`) entrega o `OpenAIExecutor` (lado OpenAI de C1-C5 via SDK server); 8.4 (`Done`, PR #98 `839d0828`) entrega `OpenAIInferenceTransport` + proxy + `sse-lines.ts` (lado OpenAI client). **Ambos os caminhos que a parity compara existem em `main`** — verificado. A parity COMPARA, não reimplementa.

**6. Separation-of-roles — PASS.** O mecanismo está correctamente registado e accionável: T1 é uma **pré-condição** que obriga a registar quem autora e quem é o gate, com `executor != gate` (T1.2). A matriz está correcta: `@qa` autora → gate `@architect`; `@dev` autora → gate `@qa` (ADR-10 §8 S5 + `separation-of-roles.md`). A story não fixa o gate prematuramente — deixa-o à decisão T1, como deve ser. Conforme.

**7. Escopo contido — PASS.** ZERO código de produção. A File List enumera explicitamente 11 ficheiros de produção + 2 de infra Anthropic como **INTOCADOS**, e a regra "qualquer modificação fora de `tests/` é sinal de scope errado → STOP" (Tasks header) sela o limite. AC6 exige `handlers/anthropic.ts` e `proxy-fetch.ts` com zero linhas alteradas.

**8. Regras do projecto — PASS com nota.** `mock-protocol-fidelity.md` (fundadora desta story), `separation-of-roles.md`, `merge-authority.md`, `not-tested-trailer-rules.md`, `internal-state-contract-gate.md` — todas existem e estão correctamente aplicadas. A única regra com referência problemática é `cr-base-main-no-gate-saida.md` (ver ponto 4). PT-PT, sem `any`, imports absolutos — todos declarados/implícitos no contexto de teste.

**9. Riscos/gotchas — PASS.** A "Lição da 8.4 propagada — CR local ≠ CR server-side" está explicitamente registada (CR autoritativo = server-side no head SHA). A fidelidade do mock (args fragmentados em ≥2 deltas) é tratada como risco central com o teste falsificável (AC5). O wire SSE OpenAI está documentado (ADR-10 §4.1) sem invenção.

**10. Alinhamento ADR-10 / sem invenção — PASS.** Os 6 cenários C1-C6 mapeiam **exactamente** os 6 do ADR-10 §6.3. As 3 citações são fiéis. Nenhum AC inventado. As 2 [AUTO-DECISIONS] (nome do ficheiro; comparação de tokens no C6) são justificadas e razoáveis, não inventadas.

---

## Pontos de atenção específicos (avaliação dirigida)

### A — Cobertura de scope: os 6 cenários C1-C6
**VEREDICTO: cobertura exacta e completa.** AC3 entrega C1 (texto), C2 (1 tool), C3 (multi-tool ≥2 índices), C4 (args malformados→error), C5 (tool sem args→`{}`); AC4 entrega C6 (classifier multi-intent). Estes são precisamente os 6 da tabela ADR-10 §6.3, na mesma ordem semântica. O C3 (multi-tool) é correctamente identificado como **obrigatório e falsificável** (`internal-state-contract-gate.md` — round-trip `id`↔`tool_call_id` na fronteira do provider).

### B — O teste falsificável (AC5)
**VEREDICTO: presente e bem especificado.** AC5 exige ≥1 teste que prove que os `arguments` chegam fragmentados em ≥2 deltas **e que falharia se viessem completos num único delta**, com comentário explícito a marcá-lo como o teste falsificável de `mock-protocol-fidelity.md` (obrigação 3). Traça a ADR-10 §6.2. Bem ancorado e não-trivial. T4.3 implementa-o no C2.

### C — Os marcadores [VERIFICAR] (2 ocorrências — nome da suite)
**VEREDICTO: aceitáveis num draft; não bloqueiam.** Ambos os [VERIFICAR] referem o **nome final do ficheiro de teste** (`parity.cross-provider.test.ts` vs `cross-provider-parity.test.ts`). A story **já resolveu** com uma [AUTO-DECISION] (`cross-provider-parity.test.ts`, kebab-case, consistente com `openai-inference-transport.test.ts` que existe no directório) e a File List já usa esse nome. O [VERIFICAR] é uma confirmação cosmética sem ambiguidade funcional. **Recomendação:** o executor fixa `cross-provider-parity.test.ts` no T4 e remove os 2 marcadores antes de implementar — não é necessário resolvê-los antes do arranque, mas devem desaparecer no commit final.

### D — As 2 [AUTO-DECISIONS]
**VEREDICTO: ambas razoáveis.**
- **Nome do ficheiro:** consistente com a convenção do directório. Aceite.
- **Não comparar `inputTokens`/`outputTokens` entre providers no C6 (e no `done` de C1-C5):** correcta. Os mocks têm contadores fixos distintos; afirmar igualdade tornaria o teste frágil sem valor de parity semântica. A parity é no shape + `intents`/`confidence`. Alinha com ADR-10 §6.3 ("shape idêntico", não valores de usage idênticos). Aceite.

---

## Fixes

**Obrigatórios (bloqueiam):** nenhum.

**Recomendados (não-bloqueantes, para o executor/`@sm`):**
1. **Referência de regra:** `cr-base-main-no-gate-saida.md` não existe como ficheiro em `.claude/rules/`. Substituir a referência por `coderabbit-integration.md` (ficheiro real) ou citá-la explicitamente como **princípio/norma do Epic 8** (`EPIC-8.md §8`) em vez de ficheiro de regra. A substância (CR `--base main` no gate de saída) está correcta e mantém-se obrigatória.
2. **[VERIFICAR] do nome da suite:** fixar `cross-provider-parity.test.ts` no T4 e remover os 2 marcadores antes da implementação.
3. **Convenção do helper sibling (AC2):** `proxy-fetch.ts` exporta `createMockProxyFetch` (retorna `{ fetchFn }`), não `buildOpenAIProxyFetchFn`. A story diz "ou equivalente", mas para consistência sugiro alinhar o nome ao existente (ex: `createMockOpenAIProxyFetch`). Cosmético.
4. **Alinhamento dos mocks de classifier no C6:** o lado Anthropic discrimina por `body.system` contendo `MOCK_CLASSIFIER`; o lado OpenAI por `MOCK_OPENAI_CLASSIFIER_MULTI_INTENT` na última mensagem `user`. Para a asserção de parity ser significativa, ambos os mocks têm de devolver **os mesmos `intents`** (ex: `['tarefas','calendario']`). O executor deve garantir este alinhamento ao construir o cenário C6 — nota para o T4.7.

---

## Recomendação sobre o executor (separation-of-roles)

A 8.5 é **infra de teste pura, ZERO código de produção**, com a arquitectura inteiramente fixada pelo ADR-10 + 8.2/8.4 (nenhuma decisão arquitectural nova a tomar). Por isso:

- **Recomendação preferida: `@dev` autora → gate `@qa`.** Razões: (a) não há decisão de arquitectura nova que justifique puxar `@architect` para infra de teste; (b) `@qa` (Quinn) é a autoridade natural de **fidelidade de mock** (`mock-protocol-fidelity.md`), que é precisamente o eixo crítico desta story (o teste falsificável); (c) é o caminho mais leve da matriz `separation-of-roles.md` (executor `@dev` → gate `@qa`, padrão histórico).
- **Alternativa válida: `@qa` autora → gate `@architect`** (padrão da ADR-10 §8 S5 quando `@qa` autora as fixtures). Aceitável, apenas mais pesado.

Qualquer das duas é conforme. O essencial — e a story acerta nisto — é que **a decisão seja registada na secção QA Results no T1 antes do arranque** e não mude a meio. Recomendo `@dev`/`@qa` salvo indisponibilidade do `@dev`.

---

## Confirmações de conformidade do validador

- **NÃO implementei código.** Apenas li ficheiros e corri `grep`/`ls` para verificar factos (handler, schemas, transport, proxy-fetch, baseline 8.4, classifier 8.3, regras).
- **NÃO alterei a Story 8.5** — nem AC, nem tasks, nem scope, nem [AUTO-DECISIONS], nem status (mantém-se `Draft`).
- Única acção de escrita: este relatório de validação.

---

*Validação produzida por Pax (`@po`) em 29/06/2026. Veredicto **GO 9/10**. A 8.5 está pronta para o registo da decisão de executor/gate (T1) e arranque. Próximo passo: o executor regista T1 → `Approved` → implementação → gate de saída com CR `--base main` (norma do Epic 8) → `@devops` PR+merge → `@po *close-story 8.5` (desbloqueia 8.6, o cutover em produção).*
