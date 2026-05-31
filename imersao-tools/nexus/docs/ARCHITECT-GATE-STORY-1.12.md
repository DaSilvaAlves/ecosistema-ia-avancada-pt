# Architect Gate — Story 1.12 (Phase 2 da 1.11, ADR-9)

**Gate por:** Aria (`@architect`) · **Data:** 31/05/2026 · **Tipo:** Gate de arranque (ratificação de design antes de `@dev *develop`)
**Executor:** `@dev` (Dex) · **Quality gate:** `@architect` (Aria) — `separation-of-roles.md` respeitado
**Story:** `imersao-tools/nexus/docs/stories/active/1.12.story.md` (v0.2, Approved)
**PO Validation:** `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.12.md` (GO 8/10, Confidence High)
**Trace:** ADR-9 (`architecture-v2.md`), gate v0.4 da Story 1.11 (A4/A5/D2), `mock-protocol-fidelity.md`, `not-tested-trailer-rules.md`, `external-contract-identifiers.md`, No-Invention (Constitution Art. IV)

---

## 1. Veredicto de arranque

**PROCEED-WITH-CHANGES.**

A story está bem ancorada em código real (zero invenção, PO confirmou anti-hallucination) e a ordem AC1→AC2→AC3 é correcta. Mas o `@dev` descobriu — e eu confirmei linha a linha — um **blocker arquitectural que invalida a premissa central do AC1 tal como B1 o descreve**. O AC1 não pode ser implementado como escrito sem violar No-Invention ou `mock-protocol-fidelity.md`. A decisão executável está na §4 e **redefine o âmbito do AC1**. Os AC2/AC3/AC4/AC5 ficam ratificados com ajustes menores.

Resumo do que muda vs a story v0.2:

| Item | Estado |
|------|--------|
| B1 (re-rota ao proxy, wire SSE real) | **Ratificado no princípio, redefinido no âmbito** (ver §4 — Opção D) |
| B2 (UndoStore client em `client-undo-store.ts`) | **Ratificado** |
| B3 (remover `prompt` após AC1 verde + auditoria) | **Ratificado** |
| B4 (auditar confirm/undo, remover só `prompt`) | **Ratificado** (alinhado com F1 do PO) |
| F1 (confirm/undo têm callers vivos → follow-up) | **Confirmado e adoptado** |
| F2 (verificação por UI; Dexie domínio opcional) | **Decidido: expor `window.__nexusDB` É scope desta story** (ver §3) |
| F3 (rewire `UndoToast.tsx` ao ClientUndoStore) | **Ratificado** |
| Blocker calendar/reminder | **RESOLVIDO — Opção D (híbrida)** (ver §4) |

---

## 2. Ratificação das AUTO-DECISIONS B1–B4 (do `@sm`)

### B1 — protocolo do mock da re-rota (AC1) — **RATIFICADO NO PRINCÍPIO, ÂMBITO REDEFINIDO**

O **princípio** está certo e é inegociável: a re-rota intercepta `**/api/anthropic/proxy` e emite o **wire SSE real da Anthropic** (`message_start` → `content_block_start` com `input:{}` → `input_json_delta` fragmentado em ≥2 chunks → `content_block_stop` → `message_delta`/`message_stop`), reutilizando o padrão **já provado** em `tests/mocks/proxy-fetch.ts` (Phase 1, Vitest). Isto é exigido por `mock-protocol-fidelity.md` (incidente Story 1.2).

O que B1 **não previu** (nem o `@sm` nem o `@po` o apanharam) é a consequência directa de mudar o nível de interceptação: ao mockar o proxy em vez do endpoint `/api/agent/prompt`, **as tools deixam de ser fabricadas e passam a executar de verdade no browser** (é precisamente o ponto do ADR-9). Isso colide com o fixture, que tem 21 prompts a depender de tools que **não existem no registry v2**. Ver §4 para a resolução.

### B2 — onde vive o UndoStore (AC2) — **RATIFICADO**

Novo `lib/agent/client-undo-store.ts` (`'use client'`, `implements UndoStore`), in-memory + timer 30s (`UNDO_TTL_SECONDS`, importado de `lib/agent/undo.ts:43` — constante pura, não toca KV), reverte mutações Dexie no cliente. Injectado em `runClientAgent` (`client-executor.ts:63-76`, onde hoje o `undoStore` é omitido). **Não tocar `executor.ts`** — a interface `UndoStore` (`:45-51`) e a chamada `register` (`:752-756`) já existem. Aprovado sem alterações.

Nota de design vinculativa: o `register(runId, reversibleToolCalls)` recebe `ToolCall[]` mas a reversão tem de saber **como** reverter cada mutação Dexie. O `@dev` deve confirmar na implementação que os `reversibleToolCalls` carregam a informação de reversão (ex.: `undoData`/`inverseOp`) que a Phase 1 já popula — se não carregarem, a reversão precisa do snapshot pré-mutação. Isto é detalhe de implementação dentro do âmbito do AC2, não um novo AC; mas se o `@dev` descobrir que a informação de reversão **não existe** no contrato actual, é `FLAG @architect` (não inventar o mecanismo silenciosamente).

### B3 — quando remover `/api/agent/prompt` (AC3) — **RATIFICADO**

Remover `app/api/agent/prompt/route.ts` **só depois** de o AC1 (redefinido) estar verde e de grep confirmar zero callers não-teste. O endpoint já é `@deprecated`+`console.warn`. A ordem AC1-antes-de-AC3 mantém-se. Aprovado.

### B4 — remover os 3 endpoints ou só `prompt` (AC3) — **RATIFICADO (refinado por F1)**

Só `prompt` é removido nesta story. `confirm`/`undo` têm callers vivos (F1) → follow-up explícito. Ver §3-F1.

---

## 3. Decisão sobre F1, F2, F3 (do `@po`)

### F1 — confirm/undo NÃO são órfãos — **CONFIRMADO E ADOPTADO**

Verifiquei: a auditoria do PO está correcta. `/api/agent/confirm` tem callers em `ChatPanel.tsx:138,170`; `/api/agent/undo` em `UndoToast.tsx:123`. **Não remover nesta story.** AC3 estreita-se a `/api/agent/prompt` + documentar auditoria + follow-up. Atenção à interacção com F3: o AC2 vai **rewire** `UndoToast.tsx:123` para parar de chamar `/api/agent/undo` e passar a usar o `ClientUndoStore`. Logo, **depois do AC2, `/api/agent/undo` perde o seu único caller**. Mesmo assim **não o removemos nesta story** — fica como o primeiro item do follow-up (a remoção é trivial mas é alteração de contrato e merece o seu próprio commit auditável). Registar isto explicitamente no follow-up (§6).

### F2 — verificação Dexie vs UI — **DECISÃO: expor `window.__nexusDB` ENTRA NO ÂMBITO**

O PO ofereceu a exposição de `window.__nexusDB` + extensão de `dexie-eval.ts` como "scope adicional opcional". **Decido torná-lo obrigatório nesta story**, por três razões arquitecturais:

1. **A verificação por UI sozinha tornou-se mais frágil com a re-rota.** Hoje (mock fabricado) a UI renderiza ToolCards a partir de eventos `tool_complete` que o mock garante. Com a re-rota (tools reais a executar), o ToolCard só chega a `success` se a tool **escreveu mesmo em Dexie**. Verificar o efeito de domínio em Dexie é o que prova que a execução client-side real funcionou ponta-a-ponta — é o coração do ADR-9. Verificar só a UI deixaria um buraco: um ToolCard pode renderizar `success` sem a escrita ter persistido (regressão silenciosa do tipo que o `mock-protocol-fidelity.md` existe para apanhar).
2. **O assert `lastStatus === 'reverted'` (`regression.spec.ts:143-147`) está inerte hoje** porque `window.__nexusDB` nunca é exposto (`getAgentRunsSnapshot().available` é sempre `false`). Esse assert é justamente o que prova o undo do AC2 ao nível E2E. Sem expor o singleton, o AC2 não tem verificação E2E do undo — só unit. Expor `window.__nexusDB` activa esse assert e fecha o buraco.
3. O custo é baixo e contido: um dev/staging-only assignment em `app/layout.tsx` (guardado por `process.env.NODE_ENV !== 'production'`, como o próprio `dexie-eval.ts:6-7` já assume) + estender `dexie-eval.ts` com leitura das tabelas de domínio (`tasks`, `transactions`). Nenhuma superfície de produção muda.

**Vinculativo:** T1 inclui (a) expor o singleton Dexie em `window.__nexusDB` em `app/layout.tsx` **só** quando `NODE_ENV !== 'production'`; (b) estender `dexie-eval.ts` com um helper de leitura de tabelas de domínio (`getDomainSnapshot(page, table)` ou equivalente). Edge-safety: o assignment é client-side (`'use client'` boundary já existente no layout/provider) — nunca em código `runtime='edge'`. NFR11 mantém-se (nada de prompt cru exposto em `window`).

### F3 — rewire `UndoToast.tsx` — **RATIFICADO**

`components/chat/UndoToast.tsx` entra em "Ficheiros a modificar" do AC2 (já está na story v0.2). O botão "Anular" reverte via `ClientUndoStore` em vez de `fetch('/api/agent/undo')` (`:123`). Confirmo que esta é a **única** superfície de UI do undo real — não há outra (o `ChatPanel.tsx:102-122` apenas detecta `undo_registered` para **criar** o toast; a reversão em si vive no `UndoToast`).

---

## 4. RESOLUÇÃO DO BLOCKER calendar/reminder — **Opção D (híbrida), executável**

### 4.1 Diagnóstico ratificado (verificado em código por mim)

| Facto | Evidência |
|-------|-----------|
| Registry v2 tem **13 tools**: tasks (5) + projects (2) + finance (6) | `lib/agent/tools/index.ts:15-17` |
| **Não existe** tool `calendar` nem `reminder` no v2 (Epic futuro) | `index.ts` (sem import de calendar/reminder); registry vazio para esses domínios |
| Tool não registada → `tool_error: tool "..." não registada` → ToolCard nunca chega a `success` | `executor.ts:1224-1255` |
| O mock fabricado actual emite tools inexistentes (`criar_evento_calendar`, `criar_lembrete`) e **nomes com cedilha** (`criar_finança_variavel`, `criar_finança_cartao`) — stale, pré-DEV-DECISION D-NAMES | `mock-events.ts:275,283,328,330,432,470,483,496` |
| Nome de finance de cartão no mock (`criar_finança_cartao`) nem sequer bate com o registry real (`criar_cartao`) | `index.ts:17` vs `mock-events.ts:470` |
| 21 dos 50 prompts dependem de calendar/reminder (ver contabilidade abaixo) | fixture `prompts-pt-pt.json` |
| Canónicos afectados: **R001** (`ac1-epic1`), **R021** (`ac2-epic1`), **R029** (`ac2-epic1`) | fixture; `CANONICAL_TAGS = ['ac1-epic1','ac2-epic1','ac4-epic1']` (`report-generator.ts:24`) |

**Contabilidade exacta dos 50 prompts** (verificada prompt a prompt):

| Grupo | Prompts | Tools reais? |
|-------|---------|--------------|
| Executáveis com tools reais (tasks/finance/projects) | R009–R020, R030, R031, R032, R034, R035, R038–R043, R045–R050 | **SIM — 29 prompts** |
| Dependem de calendar/reminder (tools inexistentes) | R001, R002, R003, R004, R005, R006, R007, R008, R021, R022, R023, R024, R025, R026, R027, R028, R029, R033, R036, R037, R044 | **NÃO — 21 prompts** |

Com 29 executáveis e threshold `>= 43` (`report-generator.ts:21`), **estreitar pura e simplesmente às tools reais (Opção C) NÃO atinge o threshold** — e parte 3 canónicos (R001/R021/R029). Opção C como descrita é inviável sem mexer no threshold E nos canónicos ao mesmo tempo, o que enfraquece o sinal de CI em vez de o repor. Rejeito também:

- **Opção A** (mock fabrica `ExecutorSSEEvent` completo no proxy): **REJEITADA.** No client-side o consumidor (`useAgentStream` → `runClientAgent` → `runAgent`) já não lê `ExecutorSSEEvent` da rede; o `runAgent` **gera** esses eventos no browser a partir do wire Anthropic + execução real das tools. O proxy só entrega wire Anthropic. Fabricar `ExecutorSSEEvent` no proxy não é sequer interpretável pelo consumer. Tecnicamente impossível.
- **Opção B** (registar stubs de calendar/reminder só-para-teste): **REJEITADA.** Viola No-Invention (Constitution Art. IV) e antecipa scope de Epic futuro. Criar tools fantasma para o teste passar é exactamente o anti-padrão que `mock-protocol-fidelity.md` combate (mock que esconde a realidade).

### 4.2 Decisão — **Opção D (híbrida)**

O AC1 re-rota ao proxy com wire SSE real **e** a suite passa a operar em **dois conjuntos de prompts**, sem inventar tools e sem baixar a fasquia de forma artificial:

**(D1) Conjunto ACTIVO (29 prompts) — re-rotado e executado a sério.**
Os 29 prompts de tasks/finance/projects correm contra `**/api/anthropic/proxy` mockado (wire SSE real), com as tools reais a executar no browser e a escrever em Dexie. Verificação por UI (ToolCards `success`) **e** por Dexie de domínio (via `window.__nexusDB` exposto, F2). Para o mock classifier emitir os intents certos e o mock executor emitir os `tool_use` com os **nomes ASCII reais do registry** (`criar_tarefa`, `criar_financa_variavel`, `criar_cartao`, `consultar_balanco`, etc.), o `@dev` reescreve os profile builders destes 29 prompts em `mock-events.ts` para o padrão de `proxy-fetch.ts` (args fragmentados em ≥2 `input_json_delta`). **Os nomes de tool no mock DEVEM corresponder exactamente ao registry** (`external-contract-identifiers.md` — o contrato é o `toolRegistry`; nomes com cedilha são proibidos e os nomes stale do mock antigo são corrigidos para ASCII).

**(D2) Conjunto DIFERIDO (21 prompts) — re-tag `pending-tool-epic` + `test.fixme`.**
Os 21 prompts de calendar/reminder são marcados no fixture com uma tag nova `pending-tool-epic` e **excluídos da execução** via `test.fixme`/skip explícito na suite (não apagados — ficam documentados como pendentes de registo de tool num Epic futuro). Isto NÃO é baixar a fasquia: é reconhecer honestamente que esses prompts exercitam tools que o sistema ainda não tem. Apagá-los esconderia o gap; mantê-los a falhar mascararia o sinal de CI. `test.fixme` documenta-os como "conhecido, diferido" — visível no relatório Playwright.

**(D3) Threshold e canónicos — recalibrados ao universo real, com trace.**
- O `promptsToRun` passa a excluir os `pending-tool-epic` (filtro em `regression.spec.ts:43-45`, ao lado do filtro `@real-api` existente).
- `PASS_RATE_THRESHOLD` recalibra de `43` (sobre 50) para o equivalente proporcional sobre 29 executáveis. Mantendo a mesma exigência relativa (43/50 = 86%), o novo threshold é `>= 25` (25/29 = 86,2%). **Decisão: threshold = 25/29.** Documentar a derivação no `report-generator.ts` (comentário) e na story.
- **Canónicos:** R001 (`ac1-epic1`) e R021/R029 (`ac2-epic1`) caem no conjunto diferido. **Re-designar os canónicos para prompts equivalentes do conjunto activo:**
  - `ac1-epic1` (multi-intent) → **re-tag R040** (`criar tarefa A e tarefa B`, multi-tool tasks, `mockProfile: multi-intent-with-error`) **ou**, preferível, criar a designação canónica num multi-intent **100% tasks/finance**. Como o fixture não tem hoje um multi-intent só-tasks-finance limpo, o `@dev` **adiciona** ao fixture **1 prompt novo** `R051` multi-intent `tasks+finance` (ex.: "criar tarefa pagar renda e registar €450 renda") com `tags: ["ac1-epic1","canonical"]` e um `mockProfile` novo `multi-intent-tasks-finance` (tools reais `criar_tarefa` + `criar_financa_variavel`/`criar_financa_recorrente`). Isto **não é inventar uma tool** — usa só tools reais; é mover a âncora canónica do AC1 para um prompt que o sistema consegue mesmo executar.
  - `ac2-epic1` (preview/calendar) → R029 era preview+calendar. Re-designar para **R030** (`se calhar criar tarefa para depois`, `preview-low-confidence`, intent `tasks` real) que já existe e exercita o mesmo gate de preview com tool real. Adicionar `ac2-epic1` à R030.
  - `ac4-epic1` (undo) → R034/R035 já são tasks/finance reais e ficam **inalterados** — continuam canónicos válidos.
- A constante `CANONICAL_TAGS` mantém-se (`ac1-epic1`, `ac2-epic1`, `ac4-epic1`); só muda **que prompts** as carregam (via fixture). `ac5-epic1` continua fora dos canónicos (como hoje).

**(D4) Cenário de fidelidade obrigatório (mock-protocol-fidelity.md).**
≥1 prompt do conjunto activo tem de **falhar** se o mock regredir para emitir `input` completo no `content_block_start` (em vez de fragmentado em `input_json_delta`). Reutilizar a técnica de `proxy-fetch.ts`: fragmentar sempre os args em ≥2 chunks e ter um assert que prova a reconstrução. Sem este cenário, o AC1 não passa o gate.

### 4.3 Porque é que a Opção D respeita as três regras-âncora

| Regra | Como a Opção D a respeita |
|-------|----------------------------|
| `mock-protocol-fidelity.md` | O mock do proxy espelha o wire SSE real Anthropic (args fragmentados); cenário D4 falha se regredir. As tools executam a sério — zero fabricação de resultados. |
| `No-Invention` (Art. IV) | Zero tools inventadas. Calendar/reminder ficam diferidos e visíveis (`test.fixme`), não stubbed. |
| `not-tested-trailer-rules.md` | Toda a infra de teste (route-handler, spec, fixture, threshold) é red-flag → exige evidência local (suite re-rotada verde) anexa ao Change Log; `Not-tested:` não é waiver. |
| `external-contract-identifiers.md` | Os nomes de tool no mock passam a bater exactamente com o `toolRegistry` (ASCII, sem cedilha) — o contrato é o registry. |

> **NOTA (§4.4 prevalece sobre os parágrafos D1–D3 acima onde houver conflito).** O §4.4 é o addendum executável após FLAG do `@dev` e verificação prompt-a-prompt por mim. Em particular: (a) a contagem activos↔diferidos passa a **30↔20** (não 29↔21); (b) o **R051 deixa de ser necessário** (o canónico `ac1` ancora em R040, já existente e executável); (c) os profiles error/abort são redefinidos via modos de falha REAIS. Onde D1–D3 dizem "29 prompts" / "criar R051" / "re-tag R030 para ac2", **vale o §4.4**.

---

## 4.4 — ADDENDUM (FLAG RESOLVIDO): seeding determinístico + error/abort + contagem revista

**FLAG do `@dev`:** verificada e confirmada por mim linha a linha. A premissa D1 ("29 prompts executam com tools reais contra Dexie") é **falsa para a maioria das tools de finance e para `completar_tarefa`/`vincular_tarefa_projecto`**, porque a suite arranca com Dexie vazio (`regression.spec.ts:79` só faz `clearAgentRuns`, não semeia domínio) e essas tools têm pré-condições duras:

| Tool real | Pré-condição dura | Evidência (verificada por mim) |
|-----------|-------------------|-------------------------------|
| `criar_financa_variavel` / `criar_financa_recorrente` | `resolveCategoriaByNome` **lança** se não houver categoria que faça match | `finance.ts:257-262`, chamada em `:328` e `:382` |
| `criar_cartao` | `contaId` tem de ser **UUID de conta existente** (`accounts.get` → lança) + `argsSchema` exige `z.string().uuid()` | `finance.ts:464-467`, `CriarCartaoArgs:126` |
| `criar_parcelada` | exige **cartão existente** + categoria (`resolveCartaoByNome` + `resolveCategoriaByNome` lançam) | `finance.ts:503-504` |
| `completar_tarefa` | exige **tarefa existente** (`tasks.get` → lança) | `tasks.ts:244-246` |
| `vincular_tarefa_projecto` | exige **tarefa + projecto existentes** | `tasks.ts:368-376` |
| `criar_tarefa` com `projecto:null` | **nenhuma** — escreve directo | `tasks.ts:197` (validação só se `projecto !== null`) |
| `eliminar_tarefa` | **NÃO EXISTE no registry** (tasks = criar/completar/listar/listar_atrasadas/vincular) → `tool_error: não registada` | `tasks.ts` (sem eliminar); `index.ts:15` |

### Decisão 1 — Seeding determinístico no `beforeEach`: **APROVADO** (entra no scope do AC1/T1a)

Aprovo o **seeding determinístico** via `window.__nexusDB` (que já vou expor em T1a, F2). Rejeito a alternativa de "shrink sem finance": eliminaria os canónicos de finance (R035 `ac4`) e enfraqueceria o sinal do Epic 3 em CI — o oposto do objectivo desta story (repor CI verde end-to-end no fluxo client-side real). Seeding é a opção que torna as tools reais **executáveis a sério** (coração do ADR-9) sem inventar nada.

**Vinculativo — helper `seedRegressionDb(page)` chamado no `beforeEach` ANTES de `clearAgentRuns`, semeando o mínimo determinístico:**

| Seed | Valor fixo | Desbloqueia |
|------|-----------|-------------|
| `categories` | ≥1 categoria com `name` conhecido (ex.: `'Alimentação'`, `'Transporte'`, `'Geral'`) | `criar_financa_variavel`, `criar_financa_recorrente`, `criar_parcelada` (categoria), `consultar_categoria` |
| `accounts` | 1 conta com **UUID fixo** conhecido (constante `SEED_ACCOUNT_ID`) + `balance` | `criar_cartao` (contaId), `consultar_balanco` |
| `cards` | 1 cartão com `name` conhecido (ex.: `'Visa'`), `accountId = SEED_ACCOUNT_ID` | `criar_parcelada`, finance com `cartaoNome` |
| `tasks` | 1 tarefa com **id fixo** conhecido (constante `SEED_TASK_ID`) | `completar_tarefa`, `vincular_tarefa_projecto` |
| `projects` | 1 projecto com **id fixo** (constante `SEED_PROJECT_ID`) | `vincular_tarefa_projecto`, `criar_tarefa` com projecto |

**Regras vinculativas do seeding:**

1. O seed corre via `window.__nexusDB` (mesmo singleton dev/staging exposto em T1a) — escreve nas tabelas Dexie reais, não num mock. Edge-safety: o seed é client-side (Playwright `page.evaluate`), nunca em código `runtime='edge'`.
2. Os `tool_use` que o mock do proxy emite **referenciam os seeds pelos nomes/ids semeados** (ex.: `categoriaNome: 'Alimentação'`, `contaId: SEED_ACCOUNT_ID`, `cartaoNome: 'Visa'`, `id: SEED_TASK_ID`). As constantes `SEED_*` vivem num módulo partilhado entre o helper de seed e os profile builders — **nunca hardcoded duplicado** (DRY; uma fonte de verdade para os ids).
3. O seed é **idempotente e isolado por teste**: `beforeEach` semeia, o teste corre, `afterEach` limpa o domínio (`clearAgentRuns` já existe; estender para limpar `tasks`/`transactions`/`cards`/`accounts`/`projects`/`categories`/`financeRecurrences`/`installments` semeados ou usar `db.delete()`+reopen). Sem isto, a contagem de `agentRuns`/domínio acumula entre testes (`mode: 'serial'`) e os asserts de `count` quebram.
4. O seed **não conta como tool executada** — é setup. Os asserts continuam a medir ToolCards `success` + escrita de domínio **adicional** ao seed (ex.: após `criar_financa_variavel`, `transactions.count()` aumentou em 1 face ao seed).

### Decisão 2 — Mover `eliminar_tarefa` (R032) para diferido: **RATIFICADO**

`eliminar_tarefa` não existe no registry v2 (Epic futuro). **R032 e R033** (ambos `preview-destructive` → `eliminar_tarefa`) vão para o conjunto **diferido** `pending-tool-epic` + `test.fixme`. No-Invention respeitado: não stubbar, não apagar — diferir visível. (Correcção à minha contabilidade original: R033 também depende de `eliminar_tarefa`, logo também difere — não estava explícito na §4.2.)

### Decisão 3 — Redefinir profiles error/abort via modos de falha REAIS: **RATIFICADO com mapeamento exacto**

Com execução real, os profiles error/abort mudam de semântica. Redefinição vinculativa (todos usam modos de falha **reais**, zero fabricação):

| Prompt | Profile actual | Redefinição (modo de falha REAL) | Justificação verificada |
|--------|----------------|----------------------------------|--------------------------|
| **R038** | `tool-error` (`criar_tarefa` "erro") | **Re-tag como sucesso normal** (profile `single-task`) — com args válidos `criar_tarefa` **tem sucesso**, não há erro a fabricar. O fixture deixa de ter um "erro genérico inventado". | `tasks.ts:193-221` — `criar_tarefa` com `projecto:null` nunca lança |
| **R039** | `tool-error-bad-args` (finance) | **Args que o Zod schema rejeita**: emitir `tool_use` de `criar_financa_variavel` com `montante` ≤ 0 → `argsSchema.parse` lança `montante deve ser positivo` → `tool_error` **legítimo**. | `finance.ts:100` (`z.number().int().positive(...)`) |
| **R041** | `tool-error-unknown` | **Mantém** — o mock emite `tool_use` com nome inexistente (`tool_xyz_inexistente`) → `executor` devolve `tool_error: não registada` real. Único profile error que já era fiel. | `executor.ts:1224-1255` |
| **R042/R043/R044** | `abort-during-stream` | **Mock fecha o stream sem `message_stop`/`done`** (não fabricar `done` partial). O wire Anthropic termina abruptamente; o `runAgent` client trata o abort real. R044 (prompt "3 reuniões") usa `criar_tarefa` no profile — **não toca calendar**, logo fica activo. | `mock-events.ts:628-646` (abort actual fabrica `done` partial — **proibido** pós-re-rota) |
| **R040** | `multi-intent-with-error` | **Mantém a semântica** (2× `criar_tarefa`: 1 sucesso + 1 com `titulo` que o Zod rejeita por `min`). Partial success real. **R040 torna-se o canónico `ac1-epic1`** (multi-intent tasks-only, executável sem calendar). | `tasks.ts` `CriarTarefaArgs` (titulo tem `min`) |

### Decisão 4 — Threshold, contagem e canónicos revistos: **DEFINITIVO**

Recontagem prompt-a-prompt (verificada por mim, ver tabela §4.4-A abaixo):

- **DIFERIDOS = 20:** R001–R008 (multi-intent com calendar/reminder), R021–R028 (single calendar/reminder), R032/R033 (`eliminar_tarefa`), R036/R037 (undo calendar/reminder). Tag `pending-tool-epic` + `test.fixme`.
- **ACTIVOS = 30:** R009–R020, R029–R031, R034, R035, R038–R050. Todos executam contra Dexie **semeado** (excepto os text-only R045/R048/R049/R050 e os abort R042–R044, que não precisam de seed).

**Threshold:** mantendo a exigência relativa de 86% (era 43/50), sobre 30 activos → **`PASS_RATE_THRESHOLD = 26`** (26/30 = 86,7%). **Decisão: threshold = 26/30.** (Revê o 25/29 do §4.2 D3 — a contagem real é 30↔20, não 29↔21.) Documentar a derivação em comentário no `report-generator.ts` e na story.

**Canónicos (re-designação DEFINITIVA — `CANONICAL_TAGS` inalterado: `ac1-epic1`, `ac2-epic1`, `ac4-epic1`):**

| Tag canónica | Prompt | Profile | Estado | Nota |
|--------------|--------|---------|--------|------|
| `ac1-epic1` (multi-intent) | **R040** | `multi-intent-with-error` (2× `criar_tarefa`, tasks-only) | activo | **Substitui R051** — R040 já existe, é multi-intent real, executa com seed-free. Não inventar prompt novo. Remover `ac1-epic1` de R001; adicionar a R040. |
| `ac2-epic1` (preview/low-confidence) | **R029** (mantém) | `preview-low-confidence` (emite `criar_tarefa`, executável) | activo | **R029 NÃO difere** — o seu profile é tasks, não calendar (só o texto do prompt fala de "agendar"). Mantém `ac2-epic1`. (Revê o §4.2 D3, que assumia R029 diferido e propunha mover para R030 — desnecessário.) |
| `ac4-epic1` (undo) | **R034 + R035** (mantêm) | `single-task` / `single-finance-variable` | activos | Inalterados. R035 (finance) executa com categoria semeada. |

`ac5-epic1` (R045/R046/R047 perf) continua fora dos canónicos, como hoje.

### §4.4-A — Tabela definitiva de contagem (verificada prompt-a-prompt)

| Conjunto | Prompts | N |
|----------|---------|---|
| **Diferido** (`pending-tool-epic`) | R001,R002,R003,R004,R005,R006,R007,R008,R021,R022,R023,R024,R025,R026,R027,R028,R032,R033,R036,R037 | **20** |
| **Activo — precisa seed** (finance/completar) | R012,R015,R016,R017,R018,R019,R020,R035,R039,R047 | 10 |
| **Activo — seed-free** (criar_tarefa null / preview tasks / abort / text) | R009,R010,R011,R013,R014,R029,R030,R031,R034,R038,R040,R041,R042,R043,R044,R045,R046,R048,R049,R050 | 20 |
| **TOTAL ACTIVO** | — | **30** |

### Decisão 5 — D4 (fidelidade) reconfirmado no contexto de seed

O cenário de fidelidade obrigatório (≥1 prompt activo **falha** se o mock regredir para emitir `input` completo no `content_block_start` em vez de fragmentado em `input_json_delta`) aplica-se a um prompt **com seed** (ex.: R015 `criar_financa_variavel`) — assim o teste prova simultaneamente (a) wire fragmentado real e (b) tool real a escrever em Dexie semeado. Reutilizar a técnica de `tests/mocks/proxy-fetch.ts`.

### Resumo executável para o `@dev`

1. **T1a** estende-se: além de expor `window.__nexusDB` + `dexie-eval.ts`, criar `seedRegressionDb(page)` (helper) + módulo de constantes `SEED_*` partilhado. `beforeEach` semeia antes de `clearAgentRuns`; `afterEach` limpa o domínio semeado.
2. **T1b** reescreve os profile builders dos **30 activos** para wire Anthropic real (args fragmentados ≥2 `input_json_delta`), nomes ASCII do registry, `tool_use` a referenciar os `SEED_*`. Os 4 profiles error/abort seguem o mapeamento da Decisão 3.
3. **T1c**: fixture — tag `pending-tool-epic` + `test.fixme` nos 20 diferidos; re-tag canónicos (R040 ganha `ac1`, R001 perde `ac1`; R029/R034/R035 mantêm); threshold `26` em `report-generator.ts` + filtro `promptsToRun` exclui `pending-tool-epic`. **Não criar R051.**
4. Tudo o resto da §5 (ordem T1→T7) e §6 (scope vs follow-up) mantém-se, com a única alteração de que o seeding entra no scope desta story e o R051 sai (o canónico `ac1` é R040).

**Veredicto da FLAG: RESOLVIDA — PROCEED.** As 5 decisões acima são vinculativas. Qualquer novo desvio (ex.: se um seed revelar uma pré-condição adicional não mapeada, ou se `clearAgentRuns` não conseguir limpar uma tabela semeada) é novo `FLAG @architect` antes de avançar.

---

## 5. Ordem de execução ratificada

**AC1 → AC2 → AC3** (com AC4/AC5 transversais). Ratifico a ordem do handoff (regression primeiro repõe CI verde e torna a remoção do AC3 segura), **com um ajuste interno ao AC1** decorrente da §4:

1. **T1a** — Expor `window.__nexusDB` (dev/staging-only) + estender `dexie-eval.ts` para tabelas de domínio (F2).
2. **T1b** — Re-rotar `route-handler.ts` a `**/api/anthropic/proxy` (wire SSE real, padrão `proxy-fetch.ts`); reescrever os profile builders dos 29 prompts activos com nomes de tool ASCII reais e args fragmentados.
3. **T1c** — Fixture: adicionar tag `pending-tool-epic` aos 21 prompts diferidos + `R051` (canónico `ac1-epic1` multi-intent tasks+finance) + re-tag `ac2-epic1` em R030. Ajustar filtro `promptsToRun` e threshold (25/29) em `regression.spec.ts`/`report-generator.ts`. Cenário de fidelidade D4.
4. **T2** — Correr `e2e:regression` localmente; snapshot verde no Change Log (evidência `not-tested-trailer-rules.md`).
5. **T3** — `client-undo-store.ts` + injecção em `runClientAgent` (AC2).
6. **T4** — Testes do UndoStore (`fake-indexeddb`) + rewire `UndoToast.tsx` (F3) + activar assert `lastStatus==='reverted'` na suite (agora que `window.__nexusDB` existe).
7. **T5** — Auditar + remover `app/api/agent/prompt/route.ts` (AC3, após T2 verde); documentar auditoria confirm/undo; registar follow-up.
8. **T6** — Fechar concern `noKvStub` vs Epic 4 (AC4): grep às tools do Epic 4 por `ctx.kv`.
9. **T7** — Quality gate local (AC5).

---

## 6. Scope desta story vs Follow-up explícito

### Scope DESTA story (1.12)

- AC1 re-rotado ao proxy (Opção D): 29 prompts activos executados a sério + 21 diferidos com `test.fixme`/`pending-tool-epic`; threshold 25/29; canónicos re-designados (R051 novo `ac1`, R030 ganha `ac2`, R034/R035 mantêm `ac4`); cenário de fidelidade.
- Expor `window.__nexusDB` (dev/staging-only) + estender `dexie-eval.ts` (F2).
- `client-undo-store.ts` + injecção em `runClientAgent` + testes (AC2).
- Rewire de `UndoToast.tsx` ao `ClientUndoStore` (F3).
- Activar o assert E2E `lastStatus==='reverted'` do undo.
- Remoção física de `app/api/agent/prompt/route.ts` + auditoria documentada de confirm/undo (AC3).
- Fechar concern `noKvStub` vs Epic 4 (AC4).
- Quality gate local com evidência da suite verde (AC5).

### Follow-up EXPLÍCITO (NÃO nesta story)

1. **Remoção de `/api/agent/confirm` e `/api/agent/undo`** + rewire dos seus callers (`ChatPanel.tsx:138,170`, `UndoToast.tsx:123` — este último já rewired no AC2, logo `/api/agent/undo` fica órfão após esta story e é o candidato nº1). Próprio scope, próprio commit auditável (alteração de contrato interno).
2. **Registo das tools `calendar` e `reminder`** (Epic futuro). Quando existirem no registry, reactivar os 21 prompts `pending-tool-epic` (remover `test.fixme`), restaurar o threshold para 43/50 e re-designar os canónicos originais (R001/R021/R029). A tag `pending-tool-epic` é o marcador de rastreio deste follow-up.
3. **Refactor do `ChatPanel.useEffect`** de `undo_registered` para iterar `events` em vez de inspeccionar só `last` (tech-debt já registado na 1.10) — só relevante se a re-rota reexpuser o problema de batching; se não reexpuser, mantém-se diferido. **(CUMPRIDO nesta story — DEV-DECISION ChatPanel undo_registered iter-all; a re-rota reexpôs o batching.)**
4. **Semântica de abort verdadeiro (mid-stream)** — adicionado no gate final (§9.3, D-ABORT). R042/R043/R044 executam hoje multi-tool success (a §4.4 Decisão 3 era inconsistente com o assert `expectedToolCount`). Quando se quiser testar abort real, ou se relaxa o assert de contagem para esses 3 prompts, ou se introduz um mecanismo de corte de stream que não perca cards. Tracking: comentário em `mock-events.ts:262-272` + esta entrada.

---

## 7. Condições de PASS do gate final (quando o `@dev` voltar)

O gate final (`@architect`, mesmas ferramentas) só dá PASS se:

1. `lint + typecheck + vitest + build` PASS **e** `e2e:regression` verde no fluxo re-rotado, com **snapshot datado anexo ao Change Log** (red-flag de `not-tested-trailer-rules.md` — sem evidência, não avança).
2. Mock do proxy espelha o wire SSE real Anthropic; cenário de fidelidade (D4) presente e a falhar se o mock regredir.
3. Nenhum nome de tool no mock com cedilha ou inexistente no registry (`external-contract-identifiers.md`).
4. Zero tools inventadas; os **20** prompts diferidos visíveis como `pending-tool-epic`/`test.fixme` (não apagados). `eliminar_tarefa` (R032/R033) entre eles.
5. **Threshold 26/30** (§4.4 prevalece sobre o 25/29 do §4.2) e canónicos: **R040 `ac1`**, **R029 `ac2`**, **R034/R035 `ac4`** — todos PASS. **R051 NÃO criado** (R040 é a âncora `ac1`). Seeding determinístico (`seedRegressionDb`) presente, idempotente, com cleanup em `afterEach`; `tool_use` referenciam constantes `SEED_*` partilhadas.
6. `client-undo-store.ts` com cobertura ≥60%; undo reverte dentro de 30s e não reverte após; sem `@vercel/kv`.
7. `UndoToast.tsx` rewired ao `ClientUndoStore`; assert E2E `lastStatus==='reverted'` activo e verde.
8. `app/api/agent/prompt/route.ts` removido; zero referências não-teste; auditoria confirm/undo documentada; follow-up registado.
9. `window.__nexusDB` exposto só em `NODE_ENV !== 'production'`; Edge-safety mantida (proxy sem Dexie; client-undo-store nunca em código edge); bundle client sem `ANTHROPIC_API_KEY`/`@vercel/kv` eager.
10. CodeRabbit 0 CRITICAL; logs com hash do prompt (NFR11); imports absolutos; zero `any`; PT-PT.

---

## 8. Nota de separação de papéis

Eu (`@architect`) sou o quality gate desta story porque ela mexe na fronteira Edge/cliente, no contrato de execução e na infra de regressão E2E — território arquitectural — e o executor é `@dev`. `separation-of-roles.md` respeitado: executor (`@dev`) ≠ gate (`@architect`). Não implementei nada; produzi esta decisão de design. O `@dev` implementa exactamente o que está nas §4–§6; qualquer desvio (em especial se a informação de reversão do UndoStore não existir no contrato actual — ver §2-B2) é `FLAG @architect` antes de avançar.

---

## 9. GATE FINAL — veredicto pós-implementação

**Gate final por:** Aria (`@architect`) · **Data:** 31/05/2026 · **Tipo:** Gate final (mesmas ferramentas, condições §7)
**Veredicto:** **PASS — Confidence ALTA**

### 9.1 Quality gates reproduzidos independentemente (não confiei no relatório do `@dev`)

CWD `imersao-tools/nexus/v2/`, corridos por mim a 31/05/2026:

| Gate | Resultado (minha execução) | §7 |
|------|----------------------------|----|
| `npm run typecheck` (`tsc --noEmit`) | **PASS** (exit 0) | §7.1 |
| `npm run lint` (`next lint`) | **PASS** (1 warning pré-existente `app/api/auth/logout/route.ts`, alheio) | §7.1 |
| `npx vitest run` | **1115/1115 PASS** (88 ficheiros) | §7.1 |
| `npm run build` | **PASS** — 18 páginas; `/api/agent/prompt` **ausente** da lista de rotas; `confirm`/`undo` presentes (follow-up F1) | §7.1, §7.8, §7.9 |
| `e2e:regression` (Playwright, env CI mock) | **30/30 PASS · threshold ≥26 ✓ · P95 813ms (<2000ms) ✓ · Canonical ✓ · Failures: none · 20 skipped (`test.fixme`)** | §7.1, §7.4, §7.5 |

Snapshot da minha execução E2E (evidência `not-tested-trailer-rules.md`):
`Regression: 30/30 PASS (threshold ≥26: ✓) | P95: 813ms (budget <2000ms: ✓) | Canonical: ✓ | Failures: none`

### 9.2 Verificação das 10 condições §7 (contra código real)

| # | Condição | Verificação | Estado |
|---|----------|-------------|--------|
| 1 | gates verdes + e2e + snapshot | Reproduzidos por mim (§9.1); snapshot anexo ao Change Log v0.3 | ✅ |
| 2 | Mock espelha wire SSE real + fidelidade D4 | `anthropic-wire-fidelity.test.ts` (3 tests PASS): verifica `input:{}` no `content_block_start`, ≥2 `input_json_delta`, **e** reconstrução real via `InferenceTransport.execute`. Falha se o mock regredir. | ✅ |
| 3 | Zero nomes com cedilha/inexistentes | Cross-check `mock-events.ts` vs registry (`tasks/projects/finance`): todos ASCII e existentes; `tool_xyz_inexistente` é o erro intencional do R041. Comentários sobre `criar_finança_cartao` referem o nome **removido**. | ✅ |
| 4 | Zero tools inventadas; 20 diferidos visíveis | 20 `pending-tool-epic` na fixture; **20 skipped** na minha execução; `eliminar_tarefa` (R032/R033) entre eles; `DEFERRED_PROFILES` lança se invocado. | ✅ |
| 5 | Threshold 26/30 + canónicos + seeding; R051 NÃO criado | `PASS_RATE_THRESHOLD = 26`; R040 `ac1`/R029 `ac2`/R034+R035 `ac4` todos PASS; `seedRegressionDb` idempotente (`bulkPut`) + `clearRegressionDb` em `afterEach`; `SEED_*` em módulo partilhado (DRY); R051 inexistente. | ✅ |
| 6 | UndoStore cobertura + janela 30s + sem KV | `client-undo-store.ts` `implements UndoStore`, memória + `UNDO_TTL_SECONDS`, reverse loop ordem reversa at-most-once; sem `@vercel/kv`; testes `fake-indexeddb` PASS (incluídos nos 1115). | ✅ |
| 7 | UndoToast rewired + assert `reverted` activo | `UndoToast.handleUndo` chama `clientUndoStore.undo(runId)` (não `fetch`); R034/R035 passam com reversão de domínio (`tasks`/`transactions` ao baseline) — assert `lastStatus==='reverted'` activo e verde. | ✅ |
| 8 | `prompt/route.ts` removido; zero refs não-teste; auditoria | Ficheiro inexistente (git `D`); refs restantes são **só comentários históricos** (zero callers `fetch`); auditoria confirm/undo documentada no Dev Agent Record + follow-up. | ✅ |
| 9 | `window.__nexusDB` só dev; edge-safety; bundle limpo | `DevDbExposer` guarda `NODE_ENV === 'production'` (ramo morto eliminado); montado em `app/(app)/layout.tsx`; `client-undo-store`/`DevDbExposer` são `'use client'`; build sem key/KV eager. | ✅ |
| 10 | CR 0 CRITICAL; NFR11; imports absolutos; zero any; PT-PT | CR Iter 1 = 2 minor (0 CRITICAL/HIGH); typecheck strict PASS (zero `any`); imports `@/`; logs com hash. CR server-side é gate downstream do `@devops`. | ✅ |

### 9.3 Ratificação das 3 DEV-DECISIONS

| DEV-DECISION | Veredicto | Fundamentação |
|--------------|-----------|---------------|
| **D-FETCH-BIND** | **RATIFICADA** | `globalThis.fetch.bind(globalThis)` é a correcção certa: o `fetch` nativo exige `this===Window`; invocá-lo como `this.fetchFn(...)` detached lança `Illegal invocation`. É correcção de bug (não mudança de lógica) — tocar `inference-transport.ts` é legítimo. **ESCALAÇÃO DE PRODUÇÃO (ver §9.4).** |
| **D-ABORT** | **RATIFICADA com nota** | Desvio à minha §4.4 Decisão 3 — **mas a Decisão 3 era internamente inconsistente** ("fechar stream sem `done`" **vs** assert `expectedToolCount` cards, R043/R044=3, mutuamente incompatíveis). A resolução (multi-tool success real, sem fabricação) é a saída honesta. **Não silencioso** (DEV-DECISION + comentários extensos). **Gap menor:** o follow-up "semântica de abort verdadeiro" não consta da lista explícita §6/story — adicionado agora (§6 item 4). |
| **ChatPanel undo_registered iter-all** | **RATIFICADA** | Correcta: o executor emite `undo_registered` ANTES de `done`, logo inspeccionar só `events[last]` nunca o via (R034 falharia). Iterar todos com dedupe por `runId` (FIFO max 3) é a correcção. |

### 9.4 ESCALAÇÃO — implicação de produção do D-FETCH-BIND (CONCERN HIGH, não-bloqueante do gate)

O D-FETCH-BIND revela que o `inference-transport.ts` entregue na **Phase 1 (Story 1.11, PR #44, em `main`/produção desde 30/05)** tinha o `fetch` default **não-vinculado**. No caminho client REAL (`runClientAgent` → `new InferenceTransport()` sem `fetchFn` injectado), a 1ª chamada a `this.fetchFn(...)` lança `TypeError: Illegal invocation`. Os testes da 1.11 nunca o apanharam (unit injecta mock; E2E 1.10 mockava `/api/agent/prompt`, fora do transport).

**Implicação:** o fluxo headline (prompt→tool) provavelmente **falha em produção** para qualquer prompt que dispare tools, desde 30/05. A premissa da story ("headline já funciona em produção") fica **parcialmente refutada** para prompts-com-tools (prompts text-only não passam pelo executor streaming, logo não afectados).

**Acção:** a correcção **está nesta story (1.12)** — logo **expedir o merge da 1.12 para produção resolve o bug**. Recomendo: (a) `@devops` priorizar o push/PR; (b) após deploy, **verificação manual em produção** de 1 prompt-com-tool ("anota tarefa comprar pão"); (c) se o intervalo 30/05→deploy 1.12 for relevante para o Eurico, considerar que o cérebro esteve degradado nesse período. Isto **não bloqueia** o gate da 1.12 (que corrige) — é um aviso de saúde de produção para o `@devops`/Eurico.

### 9.5 Separação de papéis

`separation-of-roles.md` respeitado: executor `@dev` (Dex) ≠ gate `@architect` (Aria). Não implementei nada; reproduzi gates e verifiquei código. Os 3 DEV-DECISIONS foram sinalizados para ratificação (não auto-aprovados pelo executor).

**Veredicto final: PASS.** Próximo passo SDC: `@devops *push` (branch + PR contra `main`, `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`) + CR server-side. Hard-stop §8: máx 2 iter CR (1 local, 0 CRITICAL). Atenção à §9.4 (saúde de produção).

---

*Gate de arranque concluído. Veredicto: **PROCEED-WITH-CHANGES**. Próximo passo SDC: `@dev *develop 1.12` seguindo a ordem T1a→T7 da §5.*

*Gate final concluído (31/05/2026). Veredicto: **PASS** (Confidence ALTA). Ver §9. Próximo passo: `@devops *push`. CONCERN HIGH de produção (D-FETCH-BIND) em §9.4.*
