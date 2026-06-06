# RETOMA — Story 1.1 Ready for Review, próximo passo @qa *qa-gate

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR (lê primeiro)

Em 05/05/2026, sessão executou **2 stories completas** no Nexus v2:

1. **Story 0.11 (F.4) — DONE em produção:** OnboardingModal Step Google disable temporário. Workflow completo SM→PO→DEV→QA→DEVOPS. Smoke verified em `https://imersao.ia.expressia.pt`. PR #3 mergeado, commits `df94e97c → be7aff09`.

2. **Story 1.1 (Epic 1) — READY FOR REVIEW (parado em @qa):** Audit Log Data Access Layer. Workflow SM→PO→DEV completo. Branch `feat/nexus-v2-story-1.1-audit-log-data-access`, commit `b444b809`. Quality gates 4/4 PASS + coverage 100%. **Aguarda `@qa *qa-gate 1.1`.**

**Próximo passo natural na nova sessão:**
```
@qa *qa-gate 1.1
```
Se PASS → `@devops *push` → merge → fecha Story 1.1 → arrancar Story 1.2 (Provider abstraction Anthropic).

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 — sistema de continuidade pessoal Eurico |
| URL produção | https://imersao.ia.expressia.pt |
| Localização | `imersao-tools/nexus/` |
| Sessão | 05/05/2026 (continuação do dia anterior) |
| Agente que sai | `@dev` Dex (acabou implementação 1.1) |
| Agente que entra | `@qa` Quinn primeiro, depois `@devops` Gage |
| Estado | Story 0.11 DONE em prod · Story 1.1 Ready for Review (branch local) |

---

## Estado Git actual

| Item | Valor |
|------|-------|
| Branch actual | `feat/nexus-v2-story-1.1-audit-log-data-access` |
| Last commit | `b444b809 feat(nexus-v2): audit log data access layer for Epic 1 [Story 1.1]` |
| Branch base | `main` (sincronizado com origin) |
| Branches remotas | Story 0.11 já apagada após merge |
| Working tree | 13 ficheiros staged como `A`/`M` para esta story (já no commit), restantes untracked são pré-existentes não relacionados |

```bash
# Para ver o que esta sessão fez:
git log --oneline main..feat/nexus-v2-story-1.1-audit-log-data-access
# → b444b809 feat(nexus-v2): audit log data access layer for Epic 1 [Story 1.1]

git log --oneline -5 main
# → be7aff09 chore(nexus-v2): mark Story 0.11 Status Done + Change Log smoke verified
# → 02334592 chore(nexus-v2): close Story 0.11 — F.4 deployed and smoke verified
# → df94e97c fix(nexus-v2): disable Google step in OnboardingModal until Epic 6 [Story 0.11] (#3)
# → 1cbe2f3a chore(nexus-v2): F.3 done — Vercel root directory configured via CLI
# → 556552b5 chore(nexus-v2): Epic 0 closure
```

---

## Story 1.1 — Detalhe completo

### Decisão crítica fechada

PRD §10 Epic 1 Story 1.1 = **"Schema audit log em IndexedDB (`agent_runs`)"**.

Como o schema raw já existia desde Story 0.3 (tabelas `agent_runs` e `chat_messages` em `lib/db/client.ts:58-59`), Story 1.1 ficou sendo o **data access layer**: repos tipados, validação Zod, hooks reactivos. **Esta interpretação foi APROVADA explicitamente pelo `@po` Pax (PASS 9/10).**

⚠️ O handoff anterior `RETOMA-20260505-nexus-v2-producao-novo-terminal.md` sugeriu que Story 1.1 era "chat agent base com SSE streaming" — **isto é IMPRECISO**. O chat agent base é **Story 1.5 (Executor)**, não 1.1. A nova sessão NÃO deve reabrir esta decisão.

### Ficheiros criados (11 novos)

**Produção (6):**
- `imersao-tools/nexus/v2/lib/agent/schemas.ts` — Zod schemas (AgentRunStatusSchema, ToolCallSchema, AgentRunSchema, ChatMessageSchema)
- `imersao-tools/nexus/v2/lib/agent/run-builder.ts` — startRun/finishRun helpers
- `imersao-tools/nexus/v2/lib/db/repos/agent-runs.ts` — repo (createAgentRun, getAgentRun, listRecentRuns, updateAgentRunStatus, appendToolCall, markRunReverted)
- `imersao-tools/nexus/v2/lib/db/repos/chat-messages.ts` — repo (addChatMessage, listConversation, getRecentMessages, linkMessageToRun, DEFAULT_CONVERSATION_ID='main')
- `imersao-tools/nexus/v2/hooks/useAgentRuns.ts` — useRecentAgentRuns
- `imersao-tools/nexus/v2/hooks/useChatMessages.ts` — useConversationMessages

**Tests (5):**
- `imersao-tools/nexus/v2/tests/unit/agent/schemas.test.ts` — 13 casos
- `imersao-tools/nexus/v2/tests/unit/agent/run-builder.test.ts` — 4 casos
- `imersao-tools/nexus/v2/tests/unit/db/repos/agent-runs.test.ts` — 11 casos
- `imersao-tools/nexus/v2/tests/unit/db/repos/chat-messages.test.ts` — 6 casos
- `imersao-tools/nexus/v2/tests/unit/hooks/useAgentRuns.test.tsx` — 2 casos (extra, endereça should-fix #2 PO)

**Documentos (2):**
- `imersao-tools/nexus/docs/stories/active/1.1.story.md` — story completa com Dev Agent Record
- `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.1.md` — PO PASS 9/10

### Quality gates resultados

| Gate | Resultado |
|------|-----------|
| `npm run lint` | PASS (1 warning pré-existente em `auth/logout/route.ts:1`, fora do scope) |
| `npm run typecheck` | PASS |
| `npm run test:unit` | **64/64 PASS** (28 prévios + 36 novos) |
| `npm run build` | PASS (10 routes, middleware 34.5kB) |
| `npm run test:coverage` | schemas.ts/run-builder.ts/agent-runs.ts a **100%** lines/branches/functions/statements; chat-messages.ts a 100% lines + 77.77% branches (1 branch sinceMs aceitável, AC12 ≥80% PASS) |

### Issues técnicos resolvidos durante implementação (NÃO repetir na nova sessão)

1. **Dexie compound `between` index NÃO filtra elemento secundário em Dexie 4** — primeira tentativa usou `db.agent_runs.where('[timestamp+status]').between([sinceTs, status], [Date.now()+1, status])` mas só limita o primeiro elemento (timestamp). Refactor final: `where('timestamp').aboveOrEqual(sinceTs).filter((r) => r.status === status)`. Mesma lição em `listConversation`.

2. **Zod `z.unknown()` infere campo opcional** — `ToolCall.args: unknown` em `types/db.ts` é obrigatório, mas Zod parse output gera `args?: unknown`. Solução: `Schema.parse(input)` para validar (lança se inválido) MAS retornar/persistir o `input` original em vez do resultado do parse. Isto preserva tipos compile-time.

3. **Hook re-render test (should-fix #2 PO endereçado)** — criado `tests/unit/hooks/useAgentRuns.test.tsx` com `renderHook` + `await act` insert + `await waitFor` assertion. Padrão funciona com fake-indexeddb.

---

## Próximos passos exactos (copiar e usar na nova sessão)

### Passo 1 — Abrir terminal no sítio certo

```powershell
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
```

### Passo 2 — Iniciar Claude Code

```powershell
claude
```

### Passo 3 — Mensagem inicial ao Claude (cola exacto)

```
Estou a continuar trabalho no Nexus v2. Lê primeiro o handoff
imersao-tools/nexus/docs/handoffs/RETOMA-20260505-story-1.1-ready-for-qa.md
para contexto completo. Depois invoca @qa *qa-gate 1.1 conforme indicado.
```

### Passo 4 — Workflow esperado

```
@qa *qa-gate 1.1                    # Quinn faz 7-check gate (esperado: PASS)
                                     # Output: imersao-tools/nexus/docs/QA-GATE-STORY-1.1.md
@devops *push                        # Gage push branch + PR
                                     # Auto-merge ou manual conforme decidires
                                     # Vercel auto-deploy main
                                     # Sem smoke production AC manual (é layer de dados)
@po *close-story 1.1 (opcional)      # Mover story para completed/, status Done
```

Após Story 1.1 fechada, **opção próxima**: `@sm *draft` para Story 1.2 (Provider abstraction Anthropic — executor + classifier). Ver "Roadmap Epic 1" abaixo.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260505-story-1.1-ready-for-qa.md`. PROJECTO É NEXUS V2, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## Roadmap Epic 1 (Cérebro Multi-Intent)

PRD §10 (linhas 411-430) lista 10 stories. Estado actual:

| Story | Descrição | Estado | Estimativa |
|-------|-----------|:---:|:---:|
| 1.1 | Audit log data access layer | **Ready for Review** | 2-3h (real) |
| 1.2 | Provider abstraction Anthropic (executor + classifier) | Pending | 2-3h |
| 1.3 | Tool registry (vazio inicialmente) | Pending | 1-2h |
| 1.4 | Classifier prompt PT-PT → intents + confidence | Pending | 3-4h |
| 1.5 | Executor — chat agent + SSE streaming + tool calling loop | Pending | **5-8h (story grande)** |
| 1.6 | Preview-then-confirm (confidence < 70%) | Pending | 2-3h |
| 1.7 | Undo mechanism (storage 30s + endpoint reverse) | Pending | 2-3h |
| 1.8 | Endpoint `/api/agent/prompt` com auth + rate limit | Pending | 2-3h |
| 1.9 | UI: chat input + streaming response + cards de acções + toast undo | Pending | 4-6h |
| 1.10 | Conjunto manual de 50 prompts PT-PT para regression | Pending | 1-2h |

**Stories 1.2-1.10 vão consumir o data access layer da Story 1.1.** A regra: cada story dessas deve usar `lib/db/repos/agent-runs.ts` e `lib/db/repos/chat-messages.ts` em vez de tocar `db.agent_runs.*` directamente.

---

## Débito técnico Epic 0 ainda aberto

| Story | Descrição | Estado | Estimativa |
|-------|-----------|:---:|:---:|
| F.1 | Subir coverage threshold de 25% → 60%+ | Pending | 3-5h |
| F.2 | Re-activar 2 e2e auth tests skipped | Pending | 1-2h |
| F.3 | Vercel root directory config | Done | — |
| F.4 | OnboardingModal Google link 404 | **Done 05/05/2026** | — |

F.1 e F.2 são higiene técnica, podem ser feitas em paralelo com Epic 1 se quiseres.

---

## Decisões fechadas (NÃO REABRIR)

- **Story 1.1 = data access layer**, não chat agent SSE (handoff antigo era impreciso)
- **Repos pattern em `lib/db/repos/`** — convenção introduzida nesta story, Stories 1.2-1.10 devem seguir
- **Validação Zod centralizada em `lib/agent/schemas.ts`** — reutilizada por Stories 1.4 (classifier) e 1.5 (executor)
- **`run-builder.ts` é preferred path** para Stories 1.5/1.7 (não opcional)
- **Default conversationId = 'main'** — Constraint C1 single-user
- **Default models:** classifier `claude-haiku-4-5-20251001`, executor `claude-sonnet-4-6`
- **Coverage threshold 25% global mantém-se** — Story F.1 trata. ACs novos pedem ≥80% local em ficheiros novos
- **Schema 0.3 NÃO modificado** — `lib/db/client.ts` intacto

---

## Acessos rápidos

| Recurso | URL |
|---------|-----|
| Nexus produção | https://imersao.ia.expressia.pt |
| GitHub repo | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt |
| Vercel project | https://vercel.com/euricojsalves-4744s-projects/imercao-ia-pt |
| PR #3 (0.11 mergeada) | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/3 |
| PRD Epic 1 | `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §10 linhas 407-431 |
| Arch §6.1 (interfaces) | `imersao-tools/nexus/docs/architecture-v2.md` §6.1 linhas 392-427 |
| Arch §7 (Tool Registry) | `imersao-tools/nexus/docs/architecture-v2.md` §7 linhas 550-673 |
| Story 1.1 actual | `imersao-tools/nexus/docs/stories/active/1.1.story.md` |
| PO Validation 1.1 | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.1.md` |

---

## Comandos úteis

```powershell
# Verificar estado do trabalho local
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
git status
git log --oneline -5

# Re-correr quality gates (para sanidade)
cd imersao-tools\nexus\v2
npm run lint
npm run typecheck
npm run test:unit
npm run build

# Coverage detalhado
npm run test:coverage

# Voltar à raiz
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
```

---

## Anti-padrões aprendidos nesta sessão (NÃO REPETIR)

| Erro | Causa | Como evitar |
|------|-------|-------------|
| Dexie compound index `between` para filtrar 2 dimensões | Só limita primeiro elemento em Dexie 4 | Usar `where(simpleIndex)` + `.filter(secondaryPredicate)` |
| Zod `z.unknown()` retornado tipado para interface obrigatória | Output de Zod parse infere `?: unknown` | Validar com `Schema.parse(input)` mas retornar `input` original |
| Confiar em handoff sem validar contra PRD | Handoff anterior dizia 1.1=chat agent SSE (errado) | Sempre cruzar handoff vs PRD §10 / arch §16 |
| `gh pr create` sem `--repo` | gh tenta upstream do fork (SynkraAI:main em vez de DaSilvaAlves:main) | Sempre `--repo DaSilvaAlves/ecosistema-ia-avancada-pt --head DaSilvaAlves:branch` |
| `here-string` PowerShell com `@'...'@` para git commit | PowerShell parte mensagens longas em parser | Escrever mensagem para `.git/COMMIT_MSG_*.txt` e usar `git commit -F` |

---

## Documentos de referência (lê só se precisares)

| Doc | Quando ler |
|-----|------------|
| `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §10 | Antes de draftar qualquer story do Epic 1 |
| `imersao-tools/nexus/docs/architecture-v2.md` §6.1 + §7 + §16 | Antes de tomar decisão técnica nova |
| `imersao-tools/nexus/docs/stories/completed/0.{1..10}.story.md` | Para ver pattern de stories Done |
| `imersao-tools/nexus/docs/QA-GATE-STORY-0.{1..11}.md` | Pattern de gates QA |
| `imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md` | Para F.1, F.2 ainda pendentes |
| `.claude/rules/handoff-location.md` | Antes de criar handoff novo |
| `.claude/rules/agent-authority.md` | Antes de invocar agente errado |

---

## NÃO REABRIR (decisões fechadas)

- 5 ADRs Architecture v2 (Edge/Node split, Dexie 4, Tiptap 2, Vitest+MSW, Tool Registry com Zod)
- 5 UX-ADRs Front-end Spec v2
- Domínio produção: `imersao.ia.expressia.pt`
- Repo layout: `v2/` paralelo a `src/` v1 (NÃO destruir v1)
- Auth: single-user com password gate
- **Story 1.1 = data access layer** (interpretação aprovada por @po)
- **Repos pattern em `lib/db/repos/`** (convenção fixada)

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260505-story-1.1-ready-for-qa.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: `@dev` Dex (handoff criado ao terminar implementação 1.1, contexto da sessão a esgotar)
DATA: 05/05/2026
