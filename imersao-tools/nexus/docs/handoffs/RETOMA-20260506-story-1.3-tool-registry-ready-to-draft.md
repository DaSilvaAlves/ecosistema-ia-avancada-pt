# RETOMA — Story 1.3 Tool Registry pronto para draft, Stories 1.1+1.2 Done

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR (lê primeiro)

Em 06/05/2026, sessão executou **Story 1.2 Nexus v2 (Provider Abstraction Anthropic)** completa em 3 iterações QA Loop. **Stories 1.1 e 1.2 do Epic 1 estão Done em produção.** Próximo passo: draftar Story 1.3 (Tool Registry com Zod, 1-2h).

### Pasta exacta para abrir terminal novo

```powershell
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
```

NÃO abrir noutra pasta. NÃO abrir em `imersao-tools/nexus/v2/`. NÃO abrir em `docs/handoffs/`. **Sempre na raiz do repo `ecosistema-ia-avancada-pt/`.**

### Agente AIOX a invocar

```
@sm
```

(persona: River, Scrum Master)

### Comando exacto a executar

```
@sm *draft 1.3
```

---

## Mensagem inicial ao Claude (cola exacto)

```
Estou a continuar trabalho no Nexus v2. Lê primeiro o handoff
imersao-tools/nexus/docs/handoffs/RETOMA-20260506-story-1.3-tool-registry-ready-to-draft.md
para contexto completo. Depois invoca @sm *draft 1.3 conforme indicado.
```

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 — sistema de continuidade pessoal Eurico |
| URL produção | https://imersao.ia.expressia.pt |
| Localização | `imersao-tools/nexus/` (working dir Nexus: `imersao-tools/nexus/v2/`) |
| Sessão | 06/05/2026 (continuação da sessão anterior) |
| Agente que sai | `@aiox-master` Orion (Orchestrator), após coordenar Story 1.2 fim-a-fim |
| Agente que entra | `@sm` River |
| Estado | Stories 1.1 + 1.2 Done em prod, Story 1.3 a draftar |

---

## Estado Git actual (06/05/2026)

| Item | Valor |
|------|-------|
| Branch actual | `main` (deve estar sincronizado) |
| Last commit em main | `c5e842eb chore(nexus-v2): close Story 1.2 — merged to main, deployed` |
| Commit anterior | `18bc7be2 feat(nexus-v2): provider abstraction Anthropic for Epic 1 [Story 1.2] (#5)` |
| Remote | `DaSilvaAlves/ecosistema-ia-avancada-pt` (NÃO o fork SynkraAI) |
| Vercel production | SUCCESS após Story 1.2 merge |

```powershell
# Para sincronizar local main no terminal novo:
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
git checkout main
git pull origin main
git log --oneline -5
# Deve ver:
# c5e842eb chore(nexus-v2): close Story 1.2 — merged to main, deployed
# 18bc7be2 feat(nexus-v2): provider abstraction Anthropic for Epic 1 [Story 1.2] (#5)
# ac5d647a chore(nexus-v2): close Story 1.1 — merged to main, deployed
# e70f6f5c feat(nexus-v2): audit log data access layer for Epic 1 [Story 1.1] (#4)
# be7aff09 chore(nexus-v2): mark Story 0.11 Status Done + Change Log smoke verified
```

---

## Stories Epic 1 — Estado actual

| Story | Descrição | Estado | Estimativa |
|-------|-----------|:---:|:---:|
| 1.1 | Audit log data access layer | **Done** (06/05/2026, merge `e70f6f5c`) | — |
| 1.2 | Provider Abstraction Anthropic (executor + classifier) | **Done** (06/05/2026, merge `18bc7be2`) | — |
| **1.3** | **Tool Registry com Zod (vazio inicialmente)** | **A draftar** | **1-2h** |
| 1.4 | Classifier prompt PT-PT → intents + confidence | Pending | 3-4h |
| 1.5 | Executor — chat agent + SSE streaming + tool calling loop | Pending | 5-8h |
| 1.6 | Preview-then-confirm (confidence < 70%) | Pending | 2-3h |
| 1.7 | Undo mechanism (storage 30s + endpoint reverse) | Pending | 2-3h |
| 1.8 | Endpoint `/api/agent/prompt` com auth + rate limit | Pending | 2-3h |
| 1.9 | UI: chat input + streaming response + cards de acções + toast undo | Pending | 4-6h |
| 1.10 | Conjunto manual de 50 prompts PT-PT para regression | Pending | 1-2h |

---

## Story 1.3 — O que River vai draftar

PRD §10 (linhas 414): "Tool registry (vazio inicialmente)". Arch §7 (linhas 550-673) tem o pattern completo.

### Foco da Story 1.3

- Esqueleto do Tool Registry
- Pattern de registo (registry vazio inicialmente, Stories 1.4/1.5 alimentam com tools concretas)
- Helpers para validação Zod e conversão para shape SDK Anthropic
- Tests do registry vazio + pattern de registo + conversor Zod→JSON Schema

### Convenções fixadas (Stories 1.1+1.2) que a 1.3 DEVE seguir

1. `ToolDefinition.argsSchema: z.ZodObject<z.ZodRawShape>` (alinhado arch §7.2 + Nitpick A da Story 1.2)
2. Validação Zod centralizada em `lib/agent/schemas.ts`
3. Repos pattern em `lib/db/repos/` para audit log writes
4. Default models em `lib/agent/models.ts` (single source — Story 1.2)
5. Coverage ≥80% nos ficheiros novos
6. Schema 0.3 (`lib/db/client.ts`) NÃO modificar
7. `LLMMessage` role 'tool' converte para `role:'user'` com `content:[{type:'tool_result',...}]`
8. Tool_use streaming reagrega `input_json_delta` chunks (Story 1.2)
9. `dangerouslyAllowBrowser` env-gated (test-only)

### Tech debt OBRIGATÓRIO integrar

CodeRabbit nitpick #5 da Story 1.2 (registado nesta sessão para Story 1.3):

> `toAnthropicTools` defensive fallback fail-loud quando `zodToJsonSchema` retorna shape inesperado, em vez de retornar empty schema silenciosamente.

Esta funcionalidade vive em `lib/agent/providers/anthropic.ts` actual, mas será **canonical home na Story 1.3 (Tool Registry)**. Story 1.3 deve:
- Mover/extrair `toAnthropicTools` para o registry
- Acrescentar fail-loud com erro útil quando zodToJsonSchema retorna shape inesperado
- Test cobrindo este edge case

---

## Próximos passos exactos (copiar e usar na nova sessão)

### Passo 1 — Abrir terminal no sítio certo

```powershell
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
```

### Passo 2 — Sincronizar main (sanidade)

```powershell
git checkout main
git pull origin main
git status  # deve estar clean
```

### Passo 3 — Iniciar Claude Code

```powershell
claude
```

### Passo 4 — Cola a mensagem inicial (TL;DR acima)

### Passo 5 — Workflow esperado para Story 1.3

```
@sm *draft 1.3                   # River draft (1-2h estimativa)
                                  # Output: imersao-tools/nexus/docs/stories/active/1.3.story.md
@po *validate-story-draft 1.3    # Pax 10-point checklist (esperado: PASS, story pequena)
@dev *develop 1.3                # Dex implementa (branch feat/nexus-v2-story-1.3-...)
@qa *qa-gate 1.3                 # Quinn 7-check gate
@devops *push                    # Gage push + PR (--repo DaSilvaAlves explicito)
                                  # CodeRabbit review automático
                                  # Se PASS → @devops *merge-pr {N}
                                  # Closure commit move active → completed
```

Após Story 1.3 fechada, **opção próxima**: `@sm *draft 1.4` para Story 1.4 (Classifier prompt PT-PT).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260506-story-1.3-tool-registry-ready-to-draft.md`. PROJECTO É NEXUS V2, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## Anti-padrões CRITICAL aprendidos (NÃO REPETIR)

Estes são todos confirmados pelas Stories 1.1 e 1.2 — não voltar a tropeçar:

| Anti-padrão | Causa | Como evitar |
|-------------|-------|-------------|
| `gh pr create` sem `--repo` | gh tenta upstream do fork SynkraAI:main | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt --head DaSilvaAlves:branch --base main` |
| PowerShell here-string `@'...'@` para git/gh | PowerShell parte mensagens longas no parser | Escrever para ficheiro temp + `git commit -F` ou `gh pr create --body-file` |
| Mocks que reproduzem o bug do código sob teste | Tests passam mas bug fica escondido (Story 1.2 iter 2) | MSW SSE deve reflectir protocolo real verificado contra docs API + SDK issues |
| Dexie 4 compound `[a+b]` index com `.between()` | Só constrange primeiro elemento | `where(simpleIndex).aboveOrEqual(x).filter(predicate)` |
| Zod `z.unknown()` output infere `?: unknown` opcional | Quebra contract de tipo | `Schema.parse(input)` valida, retornar `input` original |
| `db.update()` retorna 0 silently | Data integrity falha sem aviso | Sempre check return e throw se 0 |
| Concorrência sem `db.transaction('rw', ...)` | TOCTOU race em get+update | Wrap em transacção Dexie |
| `dangerouslyAllowBrowser: true` hardcoded | API key leak risk em prod | Env-gate via `NODE_ENV === 'test' \|\| VITEST` |
| Push sem CodeRabbit pre-PR review | Loop reactivo iter 2 da Story 1.2 | Considerar `wsl bash -c '... coderabbit --prompt-only --base main'` antes de PR (mas pode falhar PAYLOAD_TOO_LARGE em diffs grandes) |

---

## Decisões fechadas Stories 1.1+1.2 (NÃO REABRIR)

- Story 1.1 = data access layer (chat agent SSE é Story 1.5)
- Story 1.2 = abstracção de provider (não classifier prompt — isso é 1.4; não executor com SSE end-to-end — isso é 1.5)
- Repos pattern em `lib/db/repos/` é convenção fixada para Epic 1
- `lib/agent/models.ts` é single source de truth para `DEFAULT_CLASSIFIER_MODEL`/`DEFAULT_EXECUTOR_MODEL`
- `ToolDefinition.argsSchema: z.ZodObject<z.ZodRawShape>` (alinhado arch §7.2)
- Conversão Zod→JSON Schema **mover para Story 1.3 (Tool Registry)** — actualmente em `anthropic.ts` (executor)
- `LLMMessage` role 'tool' convertido para `role: 'user'` com `content: [{ type: 'tool_result', tool_use_id, content }]`
- `LLMMessageSchema.superRefine`: `toolCallId` required when `role === 'tool'`
- Tool_use streaming via Map<index, { id, name, jsonAccumulator }> + reaggregation no `content_block_stop`
- `dangerouslyAllowBrowser` env-gated (test-only)
- Default `conversationId='main'` (single-user constraint C1)
- Default models hardcoded: classifier `claude-haiku-4-5-20251001`, executor `claude-sonnet-4-6`
- zod `^3.25.28` (peer requirement zod-to-json-schema)
- Schema 0.3 (`lib/db/client.ts`) NÃO modificado
- 5 ADRs Architecture v2 (Edge/Node split, Dexie 4, Tiptap 2, Vitest+MSW, Tool Registry com Zod)
- Domínio produção: `imersao.ia.expressia.pt`
- Repo layout: `v2/` paralelo a `src/` v1 (NÃO destruir v1)
- Auth: single-user com password gate
- Deploy command (se necessário manual): `vercel --prod --archive=tgz --yes` (`--archive=tgz` é OBRIGATÓRIO porque repo tem 16K+ ficheiros, limite Vercel é 15K)

---

## Lição operacional crítica (Story 1.2 iter 2 ensinou)

**Mocks devem reflectir o protocolo real, não apenas fazer tests passar.**

Story 1.2 iter 2: Quinn deu PASS high confidence porque MSW mock do Anthropic SSE reproduzia o mesmo bug do executor (emitia `tool_use` com input completo no `content_block_start` em vez de chunks `input_json_delta`). Tests 95/95 PASS. CodeRabbit cruzou com Anthropic API docs + SDK issue #960 e apanhou o bug — ia partir Story 1.5 em produção.

**Como aplicar na Story 1.3:**
- Tool Registry tem conversão Zod→JSON Schema. Tests devem validar contra shape **real** SDK Anthropic, não só "tests passam"
- Se Story 1.3 acrescentar mocks novos, verificar contra docs SDK
- Memória persistente: `feedback_mock_must_reflect_real_protocol.md` em `~/.claude/projects/.../memory/`

---

## Débito técnico ainda em aberto

### Epic 0 (não bloqueia Epic 1)

| Story | Descrição | Estado | Estimativa |
|-------|-----------|:---:|:---:|
| F.1 | Subir coverage threshold global de 25% → 60%+ | Pending | 3-5h |
| F.2 | Re-activar 2 e2e auth tests skipped | Pending | 1-2h |

F.1 e F.2 podem ser paralelizadas se quiseres, mas o caminho natural é continuar Epic 1 (Stories 1.3 → 1.10).

### Outside-diff vulnerabilities (registar quando relevante)

`node-telegram-bot-api@0.66.0` puxa `form-data` (GHSA-fjxv-7rqg-78g4) e `request` (GHSA-p8p7-x288-28g6) com vulns críticas. Story dedicada de security debt do Epic 0 quando puder.

---

## Acessos rápidos

| Recurso | URL |
|---------|-----|
| Nexus produção | https://imersao.ia.expressia.pt |
| GitHub repo | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt |
| Vercel project | https://vercel.com/euricojsalves-4744s-projects/imercao-ia-pt |
| PR #4 (1.1 mergeada) | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/4 |
| PR #5 (1.2 mergeada) | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/5 |
| PRD Epic 1 | `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §10 (linhas 407-431) |
| Arch §6.1 (interfaces) | `imersao-tools/nexus/docs/architecture-v2.md` (linhas 392-427) |
| Arch §7 (Tool Registry — base Story 1.3) | `imersao-tools/nexus/docs/architecture-v2.md` (linhas 550-673) |
| Story 1.1 fechada | `imersao-tools/nexus/docs/stories/completed/1.1.story.md` |
| Story 1.2 fechada | `imersao-tools/nexus/docs/stories/completed/1.2.story.md` |
| QA Gate 1.1 | `imersao-tools/nexus/docs/QA-GATE-STORY-1.1.md` |
| QA Gate 1.2 | `imersao-tools/nexus/docs/QA-GATE-STORY-1.2.md` (3 iterações) |
| PO Validation 1.1 | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.1.md` |
| PO Validation 1.2 | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.2.md` |

---

## Comandos úteis

```powershell
# Estado git
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
git status
git log --oneline -5

# Re-correr quality gates do Nexus v2 (sanidade)
cd imersao-tools\nexus\v2
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:coverage

# Voltar à raiz
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt

# Listar stories
ls imersao-tools\nexus\docs\stories\active\
ls imersao-tools\nexus\docs\stories\completed\
```

---

## Documentos de referência (lê só se precisares)

| Doc | Quando ler |
|-----|------------|
| `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §10 | Antes de draftar Story 1.3 |
| `imersao-tools/nexus/docs/architecture-v2.md` §7 (linhas 550-673) | **OBRIGATÓRIO antes da Story 1.3** — Tool Registry pattern |
| `imersao-tools/nexus/docs/architecture-v2.md` §6.1 + §16 | Antes de tomar decisão técnica nova |
| `imersao-tools/nexus/docs/stories/completed/1.1.story.md` + `1.2.story.md` | Pattern de stories Done |
| `imersao-tools/nexus/docs/QA-GATE-STORY-1.{1,2}.md` | Pattern de gates QA |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.{1,2}.md` | Pattern de validação PO |
| `.claude/rules/handoff-location.md` | Antes de criar handoff novo |
| `.claude/rules/agent-authority.md` | Antes de invocar agente errado |
| `~/.claude/projects/.../memory/feedback_mock_must_reflect_real_protocol.md` | Antes de escrever mocks de protocolos externos |
| `~/.claude/projects/.../memory/project_nexus_v2_producao.md` | Estado de produção e convenções |
| `~/.claude/projects/.../memory/project_nexus_v2_architecture.md` | 5 ADRs fechados |

---

## Sumário de entregáveis Stories 1.1+1.2 (consolidação)

### Story 1.1 — Audit Log Data Access Layer

- 6 ficheiros produção: `lib/agent/{schemas.ts,run-builder.ts}`, `lib/db/repos/{agent-runs.ts,chat-messages.ts}`, `hooks/{useAgentRuns.ts,useChatMessages.ts}`
- 5 ficheiros tests: ~36 casos
- 2 iterações QA (CodeRabbit apanhou TOCTOU appendToolCall, guards numéricos, silent no-ops)
- Final: 74/74 tests, coverage 100% lines em ambos os repos

### Story 1.2 — Provider Abstraction Anthropic

- 4 ficheiros novos lib/agent/{models.ts, providers/{types.ts, anthropic.ts, factory.ts}}
- 1 ficheiro novo tests/unit/agent/providers/anthropic.test.ts (28 casos finais)
- 4 ficheiros modificados: schemas.ts, run-builder.ts, mocks/anthropic.ts, package.json/lock
- 3 iterações QA Loop (CodeRabbit apanhou tool_use streaming bug, dangerouslyAllowBrowser, zod bump)
- Final: 102/102 tests, coverage providers 95.95% lines

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260506-story-1.3-tool-registry-ready-to-draft.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: `@aiox-master` Orion (após coordenar Story 1.2 fim-a-fim em 3 iterações QA Loop)
DATA: 06/05/2026
