# QA Gate de Saída — Story 6.13 (Texto Telegram → cérebro multi-intent, FR71)

```yaml
schema: 1
story: '6.13'
gate: PASS
status_reason: 'AC1-AC8 satisfeitos (AC epic AC4 deferido a produção, padrão AC13); C1-C11 cumpridas no código real; segurança do bridge cookieless fail-closed validada; lint 0 erros / typecheck 0 / 2265 PASS (1 flake oauth-status pré-existente, isolado 6/6); CodeRabbit 0 critical/major (1 minor cosmético em mock de teste).'
reviewer: 'Quinn'
updated: '2026-06-21T08:50:00Z'
top_issues:
  - id: 'TEST-001'
    severity: low
    finding: 'Handler MSW sendMessage (tests/mocks/handlers/telegram.ts:82-93) valida text mas não chat_id — divergência menor de fidelidade do mock face à Bot API real.'
    suggested_action: 'Aditar validação de chat_id ao handler (não-bloqueante; o bridge de produção já garante chatId não-vazio no parse antes de chamar sendMessage). Débito menor para limpeza futura.'
waiver: { active: false }
```

## Veredicto: PASS

Gate de saída executado por Quinn (`@qa`) sobre o working tree não-committed da Story 6.13 (branch `main`, HEAD `bbc30abd`). Executor `@dev` (Dex) != gate `@qa` — `separation-of-roles.md` respeitado (a Aria fez o gate de entrada; o `@qa` é o gate de saída). Verificação ancorada no CÓDIGO REAL e em execução própria de lint/typecheck/testes/CodeRabbit, não apenas no relatório do `@dev`.

A 6.13 está pronta para Done. O único finding é minor, cosmético e num ficheiro de mock de teste — não bloqueia.

---

## Tabela dos 7 Quality Checks

| # | Quality Check | Resultado | Evidência |
|---|---------------|-----------|-----------|
| 1 | AC1-AC8 satisfeitos (vs código real) | PASS | 7/8 verificáveis em CI satisfeitos; AC epic AC4 (olá <3s real) deferido a produção (padrão AC13/4.9) |
| 2 | Condições C1-C11 do Architect Gate | PASS | Todas cumpridas; ver tabela C1-C11 |
| 3 | Segurança (endpoint cookieless público) | PASS | Shared-secret fail-closed ANTES de processar; sem vazamento; sem SSRF; OWASP aplicado |
| 4 | mock-protocol-fidelity (teste de degeneração) | PASS | Bridge usa wire SSE Anthropic real; teste de degeneração (sem text_delta → fallback) falsificável |
| 5 | internal-state-contract-gate (3 eixos) | PASS | Particionamento update→cérebro→resposta; sem órfão; cada falha tem status distinto |
| 6 | Evidência lint/typecheck/test (corrida pelo `@qa`) | PASS | lint 0 erros; typecheck 0; 2265 PASS; flake oauth-status isolado 6/6 |
| 7 | CodeRabbit `-t uncommitted` (route Node nova) | PASS | 0 critical, 0 major, 1 minor (mock de teste) |

---

## AC1-AC8 — verificação por critério

| AC | Estado | Evidência |
|----|--------|-----------|
| AC1 — roteamento texto → cérebro (FR71) | SATISFEITO | `webhook/route.ts:193-197`: ramo `type==='text'` → `dispatchTextToBridge` + `routed:true`; voz/foto/unknown continuam `routed:false`. Testes T5.3/T5.3b/T5.3c confirmam. |
| AC2 — resposta via `sendMessage` | SATISFEITO | `bot-api.ts:287-289` cria `sendMessage` via `callBotApi('sendMessage', {chat_id, text})`; `process-text/route.ts:142` chama com `chatId` validado. Teste happy-path: `sendMessage` 1× com chatId correcto e texto "OK feito.". |
| AC3 — reutilização do pipeline (sem fluxo novo) | SATISFEITO | Bridge importa `runAgent` de `@/lib/agent/executor` + barrel `@/lib/agent/tools`; zero lógica nova de classificação/execução. Teste usa wire Anthropic real (não mock de executor). |
| AC4 — ACK Telegram <5s (fire-and-forget) | SATISFEITO (CI) / DEFERIDO (timing real prod) | `dispatchTextToBridge` faz `void fetch(...).catch(...)` não aguardado. Teste T5.2: ACK imediato mesmo com bridge pendurado (promise que nunca resolve). Timing real <3s deferido a produção (P1-P4). |
| AC5 — fallback gracioso em erro | SATISFEITO | `process-text/route.ts:144-156`: try/catch → `sendMessage(ERROR_MESSAGE_PT)` + `console.error`; sempre 200. Teste T5.4 (Anthropic 500 → erro PT-PT + 200). |
| AC6 — guardas 6.12 (C1-C9) intactas | SATISFEITO | `git diff webhook/route.ts` toca só comentários + ramo `if(type==='text')` + `dispatchTextToBridge`. Guardas secret/parse/chatId/rate-limit/ordem byte-a-byte inalteradas. 39 testes webhook PASS (4 asserções de OUTPUT do ramo text adaptadas por design FR71 — não são guardas). |
| AC7 — mock fiel ao protocolo | SATISFEITO | Nível 2 usa handler MSW `anthropic.ts` real (wire SSE, magic strings `MOCK_EXECUTOR_TEXT_ONLY` l.786/790, `MOCK_EXECUTOR_CLASSIFIER_FAIL` l.719). Teste de degeneração (stream sem text_delta) falharia se o shape divergisse. |
| AC8 — baseline ≥ 2259 PASS, sem regressão | SATISFEITO | `npm run test:unit` → 2266 testes, 2265 PASS. Único FAIL = flake `oauth-status` cold-start timeout (pré-existente, isolado 6/6 PASS). 2265 ≥ 2259. |

**AC epic AC4 (bot responde "olá" < 3s em produção):** DEFERIDO a verificação manual pós-deploy (depende de P1-P4: tokens/chatId/secret/setup em Vercel). Padrão AC13 da 4.9 — aceitável.

---

## C1-C11 — condições do Architect Gate

| # | Condição | Estado | Evidência |
|---|----------|--------|-----------|
| C1 | Bridge `runtime='nodejs'` (não 'edge') | CUMPRIDA | `process-text/route.ts:55` |
| C2 | Bridge não importa `client-executor` nem chama `/api/anthropic/proxy` | CUMPRIDA | grep: matches só em comentários JSDoc (l.28/31); zero import real |
| C3 | `runAgent(text)` sem `executor`/`classifier`/`db` (factory SDK Node cookieless) | CUMPRIDA | `process-text/route.ts:95` (`runAgent(text)` puro); teste happy-path fala com `api.anthropic.com` (wire real), não proxy |
| C4 | `sendMessage` CRIADO em `bot-api.ts`; ficheiro MODIFICAR | CUMPRIDA | `bot-api.ts:287-289`; File List marca MODIFICAR |
| C5 | Webhook fire-and-forget; ACK imediato `{ok,routed:true,type:text}` | CUMPRIDA | `webhook/route.ts:194-195` + teste T5.2 |
| C6 | Outros tipos `routed:false` open-closed; `git diff` guardas vazio | CUMPRIDA | diff só toca ramo text; 39 testes webhook verdes |
| C7 | `runtime='edge'` preservado no webhook; sem import Node-only | CUMPRIDA | `webhook/route.ts:48` = edge; `node:`/`googleapis`/`getValidAccessToken` só em comentários |
| C8 | `sendMessage` nunca com texto/chatId vazio; texto vazio → fallback PT-PT | CUMPRIDA | `process-text/route.ts:141` (`finalText.length>0 ? finalText : ERROR_MESSAGE_PT`); teste de degeneração confirma |
| C9 | Erro → `sendMessage` erro PT-PT; webhook nunca 5xx ao Telegram | CUMPRIDA | `process-text/route.ts:144-156`; bridge sempre 200; teste T5.4 |
| C10 | Mock fiel (wire Anthropic real) + ≥1 teste de degeneração | CUMPRIDA | `process-text.test.ts:183-256` (degeneração); nível 2 wire real |
| C11 | `process-text` em `PUBLIC_PATHS` + shared-secret fail-closed | CUMPRIDA | `middleware.ts:52`; `process-text/route.ts:104-112` (403 se segredo ausente OU header errado, ANTES do cérebro); testes C11 (3 casos 403) |

---

## Segurança (quality gate Epic 6 — endpoint cookieless público)

O bridge `POST /api/telegram/process-text` é um endpoint público (em `PUBLIC_PATHS`, cookieless). Análise OWASP:

- **Auth fail-closed (A01 Broken Access Control):** segredo ausente em env → 403 incondicional (`route.ts:106-108`); header ausente/errado → 403 (`route.ts:109-112`). A validação ocorre ANTES de qualquer parse de corpo ou invocação do cérebro — não se gasta Anthropic em chamadas não autenticadas. Testes confirmam 0 `sendMessage` nos 3 casos 403.
- **Sem vazamento de segredo (A02):** o webhook envia o segredo no header `x-telegram-bridge-secret` (não no corpo nem em log); o bridge não devolve o segredo em nenhuma resposta. Mensagem de erro ao utilizador é genérica PT-PT (NFR11 — sem detalhes técnicos). `console.error` regista o erro server-side (observability) sem o expor ao utilizador.
- **Sem SSRF (A10):** o bridge não aceita URLs do input; a única chamada de saída é a `api.anthropic.com` (SDK, env key) e `api.telegram.org` (token env). O `text` do utilizador vai como prompt ao cérebro — não como destino de fetch. O webhook constrói `bridgeUrl` a partir de `new URL(req.url).origin` (same-origin, não input do utilizador).
- **Input validado (A03):** parse estrito `{text,chatId}`; `text` não-string ou vazio/whitespace → 400; `chatId` não-string/number ou vazio → 400 (`route.ts:120-128`).
- **DoS:** o rate-limit da 6.12 (60/janela 60s) protege o webhook a montante; o bridge só é alcançável com o shared-secret que só o webhook autenticado possui.

Veredicto de segurança: PASS. O modelo de auth é o paralelo correcto do hotfix 4.8 (CRON_SECRET) e C6b da 6.12 (secret_token) — "público" significa apenas "salta o redirect de cookie", com auth própria fail-closed no handler.

---

## internal-state-contract-gate — 3 eixos do estado distribuído

- **Eixo (a) particionamento:** 3 fronteiras (Edge webhook ACK → bridge Node cérebro → api.telegram.org entrega). Estados terminais distintos e observáveis: `routed:true` = "aceite para processamento" (não "respondido") — semântica honesta. Verificado no código + testes.
- **Eixo (b) sem órfão:** bridge stateless (`db:null`, sem escrita KV/Dexie no caminho 6.13). Crash a meio → catch envia erro PT-PT; processo morto → utilizador não recebe nada (aceitável single-user, sem fila/retry — não over-engineered).
- **Eixo (c) cada falha com status distinto, zero erro-como-sucesso:** webhook nunca 5xx ao Telegram (sempre 200/400/403/429); bridge erro do cérebro → erro PT-PT + 200; texto vazio → fallback PT-PT (nunca `sendMessage('')`); resposta degenerada → erro PT-PT (não crash); falha de despacho fire-and-forget → `console.error` (anti-M4, não silencioso). Todos os caminhos cobertos por teste.

---

## Evidência de execução (corrida pelo `@qa`)

```
LINT (npm run lint):       0 erros, 1 warning pré-existente (app/api/auth/logout/route.ts — fora de scope)
TYPECHECK (npm run typecheck): 0 erros
TESTES ALVO 6.13:          49 PASS (10 process-text + 39 webhook)
SUITE FULL (npm run test:unit): 2266 testes — 2265 PASS, 1 FAIL
  FAIL único: oauth-status > "sem sessão → 401" — Test timed out 5000ms (flake cold-start)
  Isolado:    oauth-status 6/6 PASS (2010ms) — NÃO regressão da 6.13
CODERABBIT (--agent -t uncommitted, dir v2): 1 finding minor
  0 CRITICAL · 0 MAJOR · 1 MINOR (mock de teste telegram.ts — chat_id não validado)
```

### CodeRabbit por severidade

| Severidade | Contagem | Ficheiro | Bloqueia? |
|------------|----------|----------|-----------|
| Critical | 0 | — | — |
| Major | 0 | — | — |
| Minor | 1 | `tests/mocks/handlers/telegram.ts:82-93` (handler `sendMessage` valida `text` mas não `chat_id`) | NÃO — cosmético, mock de teste; bridge de produção já valida chatId no parse |

---

## Para o `@dev` (não-bloqueante — débito menor)

Um único item de limpeza opcional, classificado low/TEST-001:

- **TEST-001:** Em `tests/mocks/handlers/telegram.ts` (handler MSW `sendMessage`, ~l.82-93), aditar validação de `chat_id` (presença + tipo number) por simetria com a validação de `text`, para o mock recusar `chat_id` ausente tal como a Bot API real (400 `"chat_id is empty"`). Não-bloqueante: o bridge de produção (`process-text/route.ts:123-128`) já garante `chatId` não-vazio antes de chamar `sendMessage`, pelo que o caminho real nunca atinge esta lacuna do mock. Melhoria de fidelidade defensiva.

---

## Próximo passo

Story 6.13 pode ir a **Done** (PASS). Sequência: `@po *close-story 6.13` → ou, se o Eurico pedir push, `@devops *push` (auto-merge se PR verde — `merge-authority.md`).

REC-6.13-DB-BRIDGE (tools de mutação inacessíveis via Telegram até bridge Dexie server-side) mantém-se deferido para story futura — documentado no Architect Gate, não afecta o scope FR71 desta story.

---

*Gate de saída executado por Quinn (`@qa`), 21/06/2026. Evidência corrida localmente no dir `imersao-tools/nexus/v2`.*
