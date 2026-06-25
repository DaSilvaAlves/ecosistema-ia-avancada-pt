# ADR-10 — Migração dual-provider da camada de inferência (Anthropic → OpenAI)

| Campo | Valor |
|-------|-------|
| Estado | Aceite |
| Data | 25/06/2026 |
| Autor | Aria (`@architect`) |
| Decisor | Eurico (decisão tomada — NÃO reabrir) |
| Supersede | Nada. **Estende** ADR-1 (Edge/Node split), ADR-5 (Tool Registry), ADR-8 (mock E2E), ADR-9 (executor client-side via proxy) |
| Trace | `architecture-v2.md` §1 (tabela ADR), §4.1 (Edge/Node), §7 (Tool Registry); PRD §6.1 (cérebro multi-intent) |
| Gatilho | Produção bloqueada — saldo Anthropic esgotado (HTTP 400 `credit balance too low`). Não é bug de nenhuma story. |

---

## 1. Contexto e decisão

### 1.1 Problema

A 25/06/2026 a produção do Nexus v2 deixou de ter cérebro: a Anthropic Messages API
passou a devolver `400 credit balance too low`. Todo o pipeline classifier→executor→tools
depende de `api.anthropic.com`, logo qualquer prompt do utilizador falha. O Eurico decidiu
**não recarregar créditos Anthropic** e migrar a camada de inferência para a OpenAI.

### 1.2 Decisão (3 escolhas do Eurico — vinculativas)

1. **Dual-provider com feature flag `LLM_PROVIDER`** (`anthropic` | `openai`). A Anthropic
   **mantém-se** como implementação de fallback e como alvo dos 2400+ testes existentes.
   A OpenAI é **adicionada em paralelo**, atrás das mesmas interfaces. **Não remover a
   Anthropic agora.**
2. **OpenAI directo** (`api.openai.com`) — não Azure, não gateway de terceiros. O receio
   do Eurico **não** é privacidade/RGPD; é custo/disponibilidade. Logo, nenhum requisito de
   data-residency ou proxy corporativo entra neste ADR.
3. **Produção fica sem cérebro** até a OpenAI estar live. A migração **não tem pressão de
   manter produção viva** — o critério é **correcção**, não uptime. Isto remove a urgência
   que tipicamente força atalhos: podemos seguir o caminho Architect-First completo.

### 1.3 Princípios herdados que esta decisão respeita

- **ADR-9**: o caminho quente de produção é client-side (`InferenceTransport` → proxy Edge).
  A migração tem de cobrir **os dois pontos de injecção** (client e server), não só o SDK.
- **CLI First / abstracção limpa**: a arquitectura já isola o provider atrás de
  `ClassifierProvider`/`ExecutorProvider`. A migração é uma adição de implementações, não um
  refactor do executor.
- **No Invention (Constitution Art. IV)**: o wire format OpenAI documentado aqui foi
  **validado contra a documentação oficial** (ver §8 Fontes), não assumido.

---

## 2. Estado actual da abstracção (mapa do que existe)

A camada de inferência tem **dois pontos de injecção** distintos, ambos atrás das mesmas
interfaces:

```
                        ClassifierProvider / ExecutorProvider   (lib/agent/providers/types.ts)
                                      ▲                ▲
                  ┌───────────────────┘                └────────────────────┐
         CAMINHO CLIENT (ADR-9, hot path prod)              CAMINHO SERVER (bridge Telegram, testes)
                  │                                                          │
   client-executor.ts:70                                       executor.ts:496 resolveServerExecutor()
   new InferenceTransport()  ──┐                                 → factory.ts getExecutor()
   injectado como executor+classifier                            → new AnthropicExecutor(apiKey)  (SDK directo)
                  │            │                                                 │
   fetch('/api/anthropic/proxy')  (Edge)                          fetch direct → api.anthropic.com
   parseia SSE Anthropic → LLMStreamEvent                         SDK parseia → LLMStreamEvent
                  │            │                                                 │
                  └──────► api.anthropic.com/v1/messages ◄─────────────────────┘
```

| Símbolo | Ficheiro | Papel |
|---------|----------|-------|
| `ClassifierProvider` / `ExecutorProvider` | `lib/agent/providers/types.ts` | Interfaces — fronteira de abstracção (não tocar) |
| `getClassifier()` / `getExecutor()` | `lib/agent/providers/factory.ts` | Factory server-side — hoje hard-coded Anthropic |
| `AnthropicClassifier` / `AnthropicExecutor` | `lib/agent/providers/anthropic.ts` | SDK `@anthropic-ai/sdk@0.32.0`, caminho server |
| `InferenceTransport` | `lib/agent/inference-transport.ts` | Caminho client — `fetch` ao proxy, parseia SSE Anthropic |
| Proxy Edge | `app/api/anthropic/proxy/route.ts` | Pass-through para `api.anthropic.com/v1/messages` (auth `getSession` + rate-limit KV) |
| `toolsToAnthropicShape` | `lib/agent/tools/registry.ts` | Zod → `{name, description, input_schema}` via `zodToJsonSchema` |
| `DEFAULT_CLASSIFIER_MODEL` / `DEFAULT_EXECUTOR_MODEL` | `lib/agent/models.ts` | `claude-haiku-4-5-20251001` / `claude-sonnet-4-6` |
| `LLMStreamEvent` (canónico interno) | `lib/agent/schemas.ts` | `text_delta` \| `tool_use` \| `tool_result` \| `done` \| `error` |
| `ExecutorSSEEvent` (canónico UI) | `lib/agent/executor.ts:243` | `meta`/`tool_start`/`tool_complete`/`text_delta`/`preview_request`/`done{totals}`… |

**Insight decisivo:** o **contrato canónico interno** (`LLMStreamEvent` →
`ExecutorSSEEvent`) é **agnóstico ao provider**. Todo o `toolCallingLoop`, o gate de preview,
o undo e a UI consomem `LLMStreamEvent`/`ExecutorSSEEvent`. A diferença Anthropic↔OpenAI vive
**inteiramente** em 3 sítios: (a) construir o request, (b) converter as tools, (c) parsear o
stream e traduzir para `LLMStreamEvent`. **Tudo a jusante fica intocado.** Esta é a razão pela
qual a migração é tractável sem refactor do cérebro.

---

## 3. Design da abstracção dual-provider

### 3.1 Implementações OpenAI atrás das mesmas interfaces

Novo ficheiro `lib/agent/providers/openai.ts` com:

- **`OpenAIClassifier implements ClassifierProvider`** — SDK `openai`, `chat.completions.create`
  não-streaming, `response_format: { type: 'json_object' }` (ver §4.4), devolve
  `ClassificationResult`.
- **`OpenAIExecutor implements ExecutorProvider`** — SDK `openai`, `chat.completions.create`
  com `stream: true` + `stream_options: { include_usage: true }`, reagrega `tool_calls`
  fragmentados (ver §4.1) e emite os **mesmos** `LLMStreamEvent` que o `AnthropicExecutor`.

Por implementarem as interfaces existentes, são injectáveis em `runAgent` via
`RunAgentOpts.executor`/`.classifier` **sem tocar no `toolCallingLoop`** — exactamente o que o
`InferenceTransport` já faz para o caminho client.

### 3.2 Factory resolve por `LLM_PROVIDER` (caminho server)

`factory.ts` passa a ler `process.env.LLM_PROVIDER` (default `anthropic`):

```text
getExecutor():  LLM_PROVIDER === 'openai' ? new OpenAIExecutor(OPENAI_API_KEY)
                                           : new AnthropicExecutor(ANTHROPIC_API_KEY)
getClassifier(): idem
```

A leitura da key é por-provider (`readApiKey(provider)`), com fail-loud PT-PT se a key do
provider activo estiver ausente. Default `anthropic` garante retrocompatibilidade total: sem
a flag, o comportamento é byte-a-byte o de hoje → **os 2400 testes server-side permanecem
verdes por construção.**

### 3.3 Caminho client: transport por provider + proxy por provider

O caminho client (ADR-9) tem duas peças que conhecem o wire format: o **transport** (constrói
o body + parseia o SSE) e o **proxy** (escolhe o upstream + injecta a auth). Há duas formas de
introduzir OpenAI:

| Abordagem | Descrição | Trade-off |
|-----------|-----------|-----------|
| **A — proxy genérico normalizador** | Um `/api/inference/proxy` que recebe um body canónico, traduz para o provider activo, e **re-emite SSE canónico**. O `InferenceTransport` fica 100% agnóstico. | Elegante a jusante, mas **move a reagregação de `tool_calls` e a tradução de wire para o Edge** e **reescreve o caminho Anthropic** → superfície de regressão directa sobre os testes de fidelidade duramente conquistados (Story 1.2/1.11/hotfix 31/05). Rejeitada. |
| **B — sibling por provider (RECOMENDADA)** | `OpenAIInferenceTransport` (novo) constrói o body OpenAI e parseia SSE OpenAI; posta num **novo** `/api/openai/proxy` (Edge), espelho do Anthropic mas com upstream `api.openai.com/v1/chat/completions` + `Authorization: Bearer`. O `InferenceTransport` Anthropic e `/api/anthropic/proxy` ficam **intocados**. `client-executor.ts` escolhe o transport por `NEXT_PUBLIC_LLM_PROVIDER`. | Pequena duplicação de boilerplate (auth `getSession` + rate-limit KV) entre os dois proxies. Em troca: **zero regressão no caminho Anthropic** (intocado → fidelidade preservada por construção), isolamento total de auth-scheme por provider, e cada PR toca um provider só (respeita hard-stop §8). |

**Recomendação: Abordagem B (sibling por provider).** O critério decisivo, dado o constraint
"manter 2400 testes verdes + OpenAI em paralelo + foco em correcção", é **minimizar a
superfície de regressão sobre o caminho Anthropic**. A B consegue-o por não tocar nele. A
duplicação de ~40 linhas de boilerplate de proxy é dívida aceitável e extraível mais tarde
(helper partilhado de auth+rate-limit) sem risco para nenhum provider.

> **Nota DRY de baixo risco:** a função `iterateSseData` (framing de linhas `data: …\n\n`,
> já ignora `[DONE]`) é **idêntica** para os dois wire formats — só o JSON por-evento difere.
> Extrair `iterateSseData` para `lib/agent/sse-lines.ts` e reutilizá-la nos dois transports é
> seguro (puro framing, sem semântica de provider) e reduz duplicação real.

### 3.4 Selecção client-side e o acoplamento das duas flags

O `client-executor.ts` corre no browser, logo a sua selecção de transport precisa de uma flag
**pública**: `NEXT_PUBLIC_LLM_PROVIDER`. O proxy (Edge, server) usa a flag **server-only**
`LLM_PROVIDER` para escolher o upstream. As duas **têm de concordar** — senão o client constrói
um body OpenAI e posta-o num proxy que o reencaminha para a Anthropic.

**Mitigação (fail-loud, não fail-silent):** na Abordagem B o `OpenAIInferenceTransport` posta
em `/api/openai/proxy` e o `InferenceTransport` Anthropic em `/api/anthropic/proxy`. Um
mismatch de flags resulta no transport errado a falar com o proxy errado, mas como **cada
proxy tem um upstream fixo**, o erro manifesta-se como uma resposta de upstream malformada
(visível, debugável) e não como silent data corruption. Adicionar uma asserção de arranque
(`NEXT_PUBLIC_LLM_PROVIDER === LLM_PROVIDER`) no boot do server é barato e elimina a classe.

---

## 4. Diferenças de protocolo a resolver (validadas contra a doc oficial)

> Todas as afirmações desta secção foram confirmadas na documentação OpenAI de Junho/2026
> (ver §8). A API alvo é **Chat Completions** (`/v1/chat/completions`) — o espelho natural da
> Anthropic Messages API e o caminho com o wire de streaming `choices[].delta` mais estável.

### 4.1 Streaming — `tool_calls` SÃO fragmentados (corrige relatório anterior)

**Confirmação explícita:** na OpenAI Chat Completions com `stream: true`, os argumentos de
função **chegam fragmentados** através de múltiplos `delta`. Um relatório anterior afirmou
erradamente que os argumentos vêm completos — **está errado**. O parsing correcto é:

| Evento Anthropic (hoje) | Equivalente OpenAI (a implementar) |
|-------------------------|-------------------------------------|
| `message_start` (usage.input_tokens) | 1.º chunk e/ou chunk final de `usage` (com `stream_options:{include_usage:true}`) |
| `content_block_delta` / `text_delta` | `choices[0].delta.content` (string incremental) |
| `content_block_start` (tool_use, `input` vazio) | 1.º `delta.tool_calls[]` com `index`, `id`, `function.name`, `function.arguments: ""` |
| `content_block_delta` / `input_json_delta.partial_json` | chunks seguintes: `delta.tool_calls[].function.arguments` (fragmentos do JSON-string) |
| `content_block_stop` → `JSON.parse(accumulator)` | `finish_reason === 'tool_calls'` (ou fim do stream) → `JSON.parse` dos argumentos acumulados |
| `message_stop` | `data: [DONE]` |

Forma real dos chunks (confirmada na doc/cookbook):

```text
data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"id":"call_abc","type":"function","function":{"name":"listar_tarefas","arguments":""}}]}}]}
data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\""}}]}}]}
data: {"choices":[{"index":0,"delta":{"tool_calls":[{"index":0,"function":{"arguments":"filtro"}}]}}]}
...
data: {"choices":[{"index":0,"delta":{},"finish_reason":"tool_calls"}]}
data: {"choices":[],"usage":{"prompt_tokens":312,"completion_tokens":48}}
data: [DONE]
```

**Regra de parsing (idêntica em espírito ao bug da Story 1.2):** acumular
`function.arguments` por `tool_calls[].index` num buffer; **só** fazer `JSON.parse` quando o
tool call está completo (`finish_reason === 'tool_calls'` ou fim de stream). O `id` e o
`function.name` chegam no **primeiro** chunk de cada `index`; os chunks seguintes só trazem
fragmentos de `arguments` (sem `id`/`name`). Parsear cedo = mesma classe de bug que partiu a
1.2. O `OpenAIExecutor` reusa o padrão `Map<index, {id, name, argsAccumulator}>` do
`AnthropicExecutor`.

`usage` em streaming **exige** `stream_options: { include_usage: true }`; sem ele, o chunk
final de usage não vem e o `done.{inputTokens,outputTokens}` ficaria a zero. Mapear
`prompt_tokens → inputTokens`, `completion_tokens → outputTokens`.

### 4.2 Tool/function calling — envelope e conversão do registry

| Aspecto | Anthropic (hoje) | OpenAI (a implementar) |
|---------|------------------|-------------------------|
| Envelope de definição | `{ name, description, input_schema }` | `{ type: 'function', function: { name, description, parameters } }` |
| Schema dos args | `input_schema` (JSON Schema) | `function.parameters` (JSON Schema) — **mesmo `zodToJsonSchema`** |
| Selecção de tool | `tool_choice` (opcional) | `tool_choice: 'auto' \| 'required' \| 'none' \| { type:'function', function:{ name } }` |
| Chamada na resposta | content block `{ type:'tool_use', id, name, input(obj) }` | `tool_calls:[{ id, type:'function', function:{ name, arguments(string JSON) } }]` |
| Resultado de volta | `user` msg com block `{ type:'tool_result', tool_use_id, content }` | msg `{ role:'tool', tool_call_id, content }` |

**Conversão do registry:** adicionar `toolsToOpenAIShape(tools)` em `registry.ts`, irmão do
`toolsToAnthropicShape`. Reusa o **mesmo** `zodToJsonSchema(tool.argsSchema, {target:'openApi3'})`
e o **mesmo** fail-loud (shape sem `type:'object'` → Error com a tool culpada), apenas
embrulhando o resultado em `{ type:'function', function:{ name, description, parameters } }`.

> Decisão de forma: **dois helpers irmãos** (`toolsToAnthropicShape` / `toolsToOpenAIShape`)
> em vez de um `toolsToProviderShape(provider)` com `switch`. Razão: cada helper tem assinatura
> de retorno tipada distinta (`AnthropicToolShape[]` vs `OpenAIToolShape[]`), o `switch`
> degradaria o tipo de retorno para união e obrigaria os call-sites a narrowing. Os helpers
> irmãos preservam type-safety e mantêm o caminho Anthropic intocado.

**`strict` / Structured Outputs:** a OpenAI suporta `function.strict: true` +
`parameters.additionalProperties: false` para garantir args conformes ao schema. É uma
melhoria opcional (reduz args malformados) mas exige que **todos** os campos sejam `required`
no modo strict — incompatível com os `.optional()` de várias tools. **Decisão: NÃO activar
`strict` na v1** (manter `strict` ausente, paridade comportamental com Anthropic); reavaliar
por tool como dívida futura (`REC-ADR10-STRICT-OUTPUTS`).

### 4.3 Mapeamento de mensagens (`toOpenAIMessages`)

O `LLMMessage` canónico interno tem `content: string | ContentBlock[]` com blocos
**Anthropic-shaped** (`{type:'tool_use', id, name, input}` para assistant; role `'tool'` +
`toolCallId` para resultado). O `OpenAIExecutor` precisa de um `toOpenAIMessages` que:

1. **System prompt:** Anthropic usa o param top-level `system`; OpenAI usa uma mensagem
   `{ role:'system', content: EXECUTOR_SYSTEM_PROMPT }` **prepended** ao array.
2. **Resultado de tool:** `LLMMessage{ role:'tool', toolCallId, content }` →
   `{ role:'tool', tool_call_id: toolCallId, content }`.
3. **Assistant com tool call:** bloco `{type:'tool_use', id, name, input}` →
   `{ role:'assistant', content: null, tool_calls:[{ id, type:'function', function:{ name, arguments: JSON.stringify(input) } }] }`.
4. **user/assistant texto simples:** passa directo (`content` string).

**Risco de contrato de estado interno (ver §7):** o `id` que o `OpenAIExecutor` emite no
`tool_use` (vindo do stream) é o mesmo que o `toolCallingLoop` re-injecta como `tool_call_id`
na ronda seguinte. O round-trip `id` (stream) → `LLMMessage` → `tool_call_id` (request) **tem
de fechar**. A OpenAI **rejeita** uma mensagem `role:'tool'` cujo `tool_call_id` não
corresponda a um `tool_calls[].id` da mensagem `assistant` imediatamente anterior. Os testes
de parity (§6 S5) têm de exercer o cenário multi-tool para falsificar isto.

### 4.4 Classifier — JSON nativo elimina a saga das fences

O `AnthropicClassifier` sofreu uma saga de hotfixes (`stripJsonMarkdownFences`, 09/05 + 18/05 +
31/05) porque o Haiku envolvia o JSON em ```` ```json ````. A OpenAI suporta
`response_format: { type: 'json_object' }` (e `json_schema` para structured outputs), que
**garante** que `choices[0].message.content` é JSON puro sem fences. **Decisão:** o
`OpenAIClassifier` usa `response_format: { type:'json_object' }`, **mas mantém
`stripJsonMarkdownFences` defensivamente** (custo zero, e protege contra regressões de modelo).
Resposta: `choices[0].message.content` (string JSON) → `JSON.parse` → `ClassificationResultSchema`.
Usage: `usage.prompt_tokens` / `usage.completion_tokens`.

### 4.5 Modelos OpenAI recomendados (Junho/2026, validados na doc de pricing)

> Nomes **configuráveis** via `lib/agent/models.ts` — os defaults abaixo são o ponto de
> partida, não um contrato. O Eurico pode trocar por env sem alterar código.

| Papel | Default recomendado | Custo (1M in/out) | Alternativas |
|-------|---------------------|-------------------|--------------|
| Classifier (rápido, barato, JSON, multi-intent) | **`gpt-4.1-mini`** | baixo | `gpt-4.1-nano` (mais barato, $0.10/$0.40 — validar qualidade multi-intent); `gpt-4o-mini` |
| Executor (tool use fiável, streaming) | **`gpt-4.1`** | $2/1M in | `gpt-5.4` ($2.50/$15, qualidade superior); `gpt-5.5` (flagship, mais caro) |

Justificação: `gpt-4.1-mini` dá o melhor equilíbrio latência/custo para classificação JSON
determinística (temperature 0). `gpt-4.1` tem function calling fiável e bem documentado a custo
contido; `gpt-5.4` é o upgrade natural se a qualidade de tool use o exigir. Adicionar
`DEFAULT_OPENAI_CLASSIFIER_MODEL` / `DEFAULT_OPENAI_EXECUTOR_MODEL` a `models.ts` (ou um mapa
`DEFAULT_MODELS[provider]`), mantendo as constantes Anthropic existentes intactas.

---

## 5. Análise de impacto

| Ficheiro / Artefacto | Mudança | Esforço | Risco |
|----------------------|---------|---------|-------|
| `lib/agent/providers/openai.ts` | **NOVO** — `OpenAIClassifier` + `OpenAIExecutor` (SDK `openai`), `toOpenAIMessages`, reagregação `tool_calls` | Alto | Médio (parsing streaming = território da §7) |
| `lib/agent/providers/openai-inference-transport.ts` | **NOVO** — transport client-side, body OpenAI + parser SSE OpenAI | Alto | Médio (mock-fidelity §6) |
| `lib/agent/tools/registry.ts` | `toolsToOpenAIShape` (irmão de `toolsToAnthropicShape`); `OpenAIToolShape` em `tools/types.ts` | Baixo | Baixo (aditivo; Anthropic intocado) |
| `lib/agent/providers/factory.ts` | branch por `LLM_PROVIDER`; `readApiKey(provider)` | Baixo | Baixo (default `anthropic` = retrocompat) |
| `lib/agent/models.ts` | defaults OpenAI (aditivo) | Baixo | Baixo |
| `app/api/openai/proxy/route.ts` | **NOVO** — Edge, espelho do Anthropic, upstream `api.openai.com/v1/chat/completions`, `Authorization: Bearer` | Médio | **Alto** (endpoint Edge novo, auth + rate-limit + superfície SSRF → CR `--base main` obrigatório) |
| `lib/agent/client-executor.ts` | selecção de transport por `NEXT_PUBLIC_LLM_PROVIDER` | Baixo | Médio (caminho quente prod) |
| `lib/agent/inference-transport.ts` | extrair `iterateSseData` → `sse-lines.ts` (refactor sem mudança de comportamento) | Baixo | Baixo |
| `lib/agent/sse-lines.ts` | **NOVO** — framing SSE partilhado | Baixo | Baixo |
| `lib/shared/env.ts` | validar `OPENAI_API_KEY`, `LLM_PROVIDER`, `NEXT_PUBLIC_LLM_PROVIDER`; asserção de concordância | Baixo | Baixo |
| `.env.example` | secção `# ─── OpenAI ───`, `OPENAI_API_KEY=sk-...`, `LLM_PROVIDER=anthropic`, `NEXT_PUBLIC_LLM_PROVIDER=anthropic` | Baixo | Baixo |
| `package.json` | `+ "openai": "^<latest>"` (dep runtime; sem remover `@anthropic-ai/sdk`) | Baixo | Baixo |
| `tests/mocks/handlers/openai.ts` | **NOVO** — MSW para `api.openai.com/v1/chat/completions` (SSE fiel: args fragmentados + usage chunk + `[DONE]`) | Alto | **Alto** (fidelidade = correcção de toda a suite OpenAI) |
| `tests/mocks/proxy-fetch.ts` | variante OpenAI do mock de proxy | Médio | Médio |
| `tests/unit/agent/openai*.test.ts` + parity | **NOVO** — unit + parity cross-provider | Alto | Médio |
| `app/api/anthropic/proxy/route.ts` | **INTOCADO** | — | — (regressão evitada por construção) |
| `lib/agent/providers/anthropic.ts`, `executor.ts`, `schemas.ts` | **INTOCADOS** (executor consome `LLMStreamEvent` agnóstico) | — | — |

**Variáveis de ambiente novas:**

```bash
# ─── OpenAI ───────────────────────────────────────────────────
OPENAI_API_KEY=sk-...
# Provider activo do cérebro (server). 'anthropic' | 'openai'
LLM_PROVIDER=anthropic
# Espelho público para selecção client-side do transport (TEM de igualar LLM_PROVIDER)
NEXT_PUBLIC_LLM_PROVIDER=anthropic
```

---

## 6. Estratégia de testes

### 6.1 Invariante: os 2400+ testes Anthropic ficam verdes por construção

O caminho Anthropic (provider, transport, proxy, MSW `anthropic.ts`) **não é tocado**. O
default `LLM_PROVIDER=anthropic` mantém o comportamento idêntico. Qualquer falha num teste
Anthropic durante esta migração é sinal de que se tocou onde não se devia → STOP.

### 6.2 Cobertura OpenAI nova

- **MSW `tests/mocks/handlers/openai.ts`** para `https://api.openai.com/v1/chat/completions`.
  Conforme `mock-protocol-fidelity.md`, o mock **tem de espelhar o wire real**:
  - `tool_calls.function.arguments` **fragmentados** em ≥2 deltas (um mock que entregue os args
    completos num só delta torna o teste do acumulador trivialmente verde → **fidelidade
    falsa**; incluir um teste falsificável que assegura que o acumulador é exercido);
  - chunk final de `usage` só presente com `stream_options.include_usage`;
  - terminador `data: [DONE]`;
  - `finish_reason: 'tool_calls'` vs `'stop'`.
- **`proxy-fetch.ts`** ganha variante OpenAI (SSE OpenAI através do proxy) para o transport
  client.

### 6.3 Testes de parity cross-provider (a peça-chave)

Uma suite partilhada de cenários canónicos corre contra **os dois** providers e afirma
**`LLMStreamEvent`/`ExecutorSSEEvent` idênticos**:

| Cenário | Falsifica |
|---------|-----------|
| Só texto | mapeamento `text_delta` / `content` |
| 1 tool call simples | reagregação de args + envelope tool |
| Multi tool call (≥2 no mesmo run) | acumulação por `index`; round-trip `id`↔`tool_call_id` (§4.3) |
| Args malformados | caminho de `error` event (paridade com `StreamErrorAlreadyEmitted`) |
| Tool sem args | `arguments: ""` → `{}` |
| Classifier multi-intent | JSON sem fences (`json_object`) → `ClassificationResult` |

Conforme `internal-state-contract-gate.md`: o estado de tool-calling atravessa
stream→loop→message→request; o cenário multi-tool é o que prova que o contrato não parte na
fronteira do provider. É **obrigatório** e **falsificável**.

---

## 7. Riscos e mitigação

| # | Risco | Severidade | Mitigação |
|---|-------|-----------|-----------|
| R1 | Reagregação errada de `tool_calls` (parsear args antes de completos) | Alta | Padrão `Map<index,…>` + `JSON.parse` só em `finish_reason:'tool_calls'`/fim; teste multi-tool falsificável. É a **mesma classe de bug** da Story 1.2 — tratada como `internal-state-contract-gate.md` |
| R2 | Round-trip `id`↔`tool_call_id` parte (OpenAI rejeita `role:'tool'` órfão) | Alta | `toOpenAIMessages` preserva `id`; parity multi-tool obrigatório (§4.3/§6.3) |
| R3 | MSW OpenAI não fiel (args completos / sem usage / sem `[DONE]`) → testes passam mas prod falha | Alta | `mock-protocol-fidelity.md` + teste falsificável que força a fragmentação (§6.2) |
| R4 | Mismatch `LLM_PROVIDER` ↔ `NEXT_PUBLIC_LLM_PROVIDER` | Média | Sibling-proxy por provider → falha visível, não silenciosa; asserção de concordância no boot (§3.4) |
| R5 | Proxy OpenAI Edge — superfície SSRF/auth (1.º endpoint novo a encaminhar input para upstream externo) | Alta | Espelhar auth `getSession` + rate-limit KV do Anthropic; **CR `--base main` obrigatório** no gate de saída (lição 5.11 — `-t uncommitted` não chega); upstream URL **constante** (sem SSRF) |
| R6 | Hard-stop §8 (≤2 iterações CR) | Média | PRs pequenos, um provider-concern por story (S1…S6); Iter 3+ exige `Authorized-by:` |
| R7 | Nomes de tools quebram no envelope OpenAI | Baixa | **Confirmado seguro** (ver §7.1) |
| R8 | Produção sem cérebro durante a transição | Aceite | Decisão do Eurico (§1.2.3). Os `error` events existentes degradam graciosamente; cutover (S6) só após parity verde + key validada |
| R9 | `strict`/structured outputs incompatível com tools `.optional()` | Baixa | NÃO activar `strict` na v1 (§4.2); dívida `REC-ADR10-STRICT-OUTPUTS` |

### 7.1 `external-contract-identifiers.md` — nomes de tools (confirmado)

O registry valida nomes com `TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]*$/` (snake_case lowercase,
100% ASCII). A OpenAI exige nomes de função em `^[a-zA-Z0-9_-]{1,64}$`. **snake_case lowercase é
subconjunto estrito** → os nomes actuais (`listar_tarefas`, `processar_recibo`,
`pesquisar_web_e_criar_nota`, …) **passam inalterados** no envelope OpenAI. Único cuidado: a
OpenAI impõe **≤ 64 caracteres** (a Anthropic é mais permissiva). Os nomes actuais estão muito
abaixo, mas adicionar um guard de comprimento ≤64 em `register()` + um teste fecha a classe.
**Conclusão: o envelope OpenAI NÃO altera os identificadores de contrato externo.**

---

## 8. Decomposição em stories (para o `@sm`)

6 stories sequenciais. Heurística de gate herdada dos Epics 2–7: parser AI / endpoint Edge com
input externo / reagregação de estado de tool-calling → **`@architect`**; infra de teste e
lógica sem efeito externo → **`@qa`** (com a ressalva `separation-of-roles.md`: se o `@qa`
**autorar** fixtures, o gate dessa unidade sobe para `@architect`).

| Story | Âmbito | AC principais | Gate |
|-------|--------|---------------|------|
| **S1 — Fundação: interface, flag, factory, env** | `LLM_PROVIDER`/`NEXT_PUBLIC_LLM_PROVIDER`, `OPENAI_API_KEY`, dep `openai`, defaults OpenAI em `models.ts`, branch na `factory.ts` (fail-loud se key ausente; default `anthropic`), `toolsToOpenAIShape`+`OpenAIToolShape`, asserção de concordância de flags | Default `anthropic` = comportamento idêntico (2400 verdes); `LLM_PROVIDER=openai` sem impl ainda → fail-loud claro; `toolsToOpenAIShape` produz envelope `{type:'function',function:{…}}` com `parameters` do `zodToJsonSchema`; nomes ≤64 ASCII | **`@architect`** (factory + env + flag, cross-layer) |
| **S2 — `OpenAIExecutor` (server, streaming)** | SDK `openai` streaming + `stream_options.include_usage`; reagregação `tool_calls` por `index`; `toOpenAIMessages` (system/tool/assistant-tool_call); emite `LLMStreamEvent` canónicos | text-only → `text_delta`+`done`; 1 tool → `tool_use` com input completo; multi-tool → ids distintos; args malformados → `error`; usage mapeada | **`@architect`** (streaming + contrato de estado de tool-calling) |
| **S3 — `OpenAIClassifier` (server, JSON)** | `chat.completions` não-streaming + `response_format:json_object`; `stripJsonMarkdownFences` defensivo; `ClassificationResultSchema` | multi-intent → `ClassificationResult` válido; usage mapeada; JSON sem fences | **`@architect`** (parser AI) — a mais leve das três |
| **S4 — Proxy OpenAI + transport client** | `/api/openai/proxy` (Edge, auth `getSession`, rate-limit KV, upstream `api.openai.com/v1/chat/completions`, Bearer); `OpenAIInferenceTransport` (body+SSE OpenAI); `client-executor` selecciona por `NEXT_PUBLIC_LLM_PROVIDER`; extrair `iterateSseData`→`sse-lines.ts` | proxy só encaminha (URL constante, sem SSRF); key nunca no bundle client; transport emite os mesmos `LLMStreamEvent` que o server; Anthropic intocado | **`@architect`** (endpoint Edge + input externo; **CR `--base main` obrigatório**) |
| **S5 — MSW + parity tests** | `handlers/openai.ts` (SSE fiel: args fragmentados, usage chunk, `[DONE]`); variante OpenAI de `proxy-fetch.ts`; suite de parity cross-provider | mock falsificável (fragmentação exercida); parity idêntica nos 6 cenários §6.3; 2400 Anthropic verdes | **`@qa`** (infra de teste) — escala a **`@architect`** se o `@qa` autorar as fixtures (`separation-of-roles.md`) |
| **S6 — Cutover + runbook** | `LLM_PROVIDER=openai` + `NEXT_PUBLIC_LLM_PROVIDER=openai` em prod; smoke test com key real; runbook de rollback (flip para `anthropic`); validação de key | cérebro responde em prod via OpenAI; rollback documentado e testado; sem regressão de UI | **`@qa`** + manual (deploy por `@devops`) |

**Caminho crítico:** S1 → S2/S3 (paralelizáveis após S1) → S4 → S5 → S6. S5 depende de S2+S4
(precisa dos dois caminhos para testar parity). S6 é o único com efeito em produção e só arranca
com parity (S5) verde.

---

## 9. Dívidas registadas

| ID | Descrição |
|----|-----------|
| `REC-ADR10-STRICT-OUTPUTS` | Avaliar `function.strict:true` + `additionalProperties:false` por tool (exige todos os campos `required`; incompatível com `.optional()` actuais) |
| `REC-ADR10-PROXY-DRY` | Extrair helper partilhado de auth+rate-limit entre `/api/anthropic/proxy` e `/api/openai/proxy` após ambos estáveis (sem risco para nenhum provider) |
| `REC-ADR10-ANTHROPIC-REMOVAL` | Decisão futura (NÃO agora): remover Anthropic + 2400 testes quando OpenAI estiver provada em prod. Requer decisão explícita do Eurico |

---

## 10. Fontes consultadas (doc oficial OpenAI, Junho/2026)

- Function calling — envelope `tools`/`tool_choice`, `tool_calls`, `role:'tool'`/`tool_call_id`:
  <https://developers.openai.com/api/docs/guides/function-calling>
- Streaming responses (Chat Completions) — formato `choices[].delta`, `[DONE]`:
  <https://developers.openai.com/api/docs/guides/streaming-responses>
- Chat Completions streaming events (API reference) — estrutura do chunk:
  <https://developers.openai.com/api/reference/resources/chat/subresources/completions/streaming-events>
- OpenAI cookbook — `How_to_stream_completions` (fragmentação de `tool_calls`):
  <https://github.com/openai/openai-cookbook/blob/main/examples/How_to_stream_completions.ipynb>
- Pricing / modelos (Junho/2026): <https://developers.openai.com/api/docs/pricing>

> **Validação `tool_calls` fragmentados:** confirmado que, em streaming, `function.arguments`
> chega em fragmentos através de múltiplos `delta`, com `index`/`id`/`function.name` no
> primeiro chunk de cada tool call e os fragmentos de `arguments` nos chunks seguintes. Isto
> **contradiz** o relatório anterior que afirmava args completos — o parser DEVE acumular por
> `index` e só fazer `JSON.parse` no fim.
