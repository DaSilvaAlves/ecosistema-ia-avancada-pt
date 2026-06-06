# RETOMA — Nexus v2: fix do cérebro (ADR-9) via Story 1.11

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 30/05/2026 · **De → Para:** sessão Claude Code 30/05 → próximo terminal (qualquer agente AIOX; Eurico decide)
**Projecto:** Nexus v2 (`imersao-tools/nexus/`) · **Pasta raiz:** `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt`

---

## Passo 0 obrigatório no terminal novo

```
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git status
git log --oneline -5    # esperar HEAD = 76d2505d (closure Story 4.3) em main
```

---

## TL;DR — o que importa

1. **Story 4.3 (heatmap hábitos) está FECHADA e em produção** — merged `1be785a3`, closure `76d2505d`. Epic 4 = **3/10 Done**. Não há nada a fazer aqui.
2. **Bug HIGH de produção descoberto:** o **cérebro do chat não persiste** — escrever "anota a tarefa de comprar pão" dá `Cannot read properties of null (reading 'tasks')`. A funcionalidade headline ("escreves uma frase e o Nexus trata") está partida.
3. **Decisão arquitectural tomada (ADR-9):** mover o executor para client-side com `ctx.db` Dexie real. Edge fica só com `/api/anthropic/proxy`.
4. **Story 1.11 criada e validada (Ready, GO 9/10).** Falta: **corrigir 1 erro no Architect Gate da story** (ver Blocker abaixo) → depois `@dev` implementa a **Phase 1**.
5. **HÁ DOCS POR COMMITAR** (ver secção Git) — committar cedo (docs-only) ou perde-se.

---

## Causa raiz do bug (verificada em código real — não suposição)

| Facto | Evidência |
|-------|-----------|
| Executor corre Edge e injecta `db = null` | `v2/lib/agent/executor.ts:416` |
| `executor.ts:1` importa `kv` de `@vercel/kv` no topo | problema para bundle client — tem de ser injectável |
| As 12 tools chamam `ctx.db.*` directamente | `v2/lib/agent/tools/tasks.ts:198,220,244,281,327,368`; idem `finance.ts`/`projects.ts` |
| Command pattern (server emite, cliente aplica) nunca implementado | `executor.ts:415` `@todo` aberto |
| `useAgentStream` já persiste **chat-log** (agent_runs/chat_messages) mas **nunca a entidade de domínio** | `v2/hooks/useAgentStream.ts:107-123`; `:405` faz `fetch('/api/agent/prompt')` |
| Único caller de `runAgent`: `/api/agent/prompt` (Edge) | grep confirmado |
| `/api/anthropic/proxy` é proxy Anthropic genérico (messages/model/stream/tools/system + SSE) | `v2/app/api/anthropic/proxy/route.ts:26-33,152-160` |

---

## ⚠️ BLOCKER a resolver ANTES do `@dev` (erro meu por confirmar)

Na secção **"## Architect Gate — Ratificação"** que adicionei a `v2/docs/stories/active/1.11.story.md`, o "Achado que de-risca" cita um ficheiro **ERRADO**: `lib/agent/anthropic-client.ts` / `callAnthropicMessages` — **esse ficheiro NÃO existe**.

**Realidade (a confirmar com 1 leitura):** o executor chama a Anthropic via `getExecutor` (`v2/lib/agent/providers/factory.ts`) → `AnthropicExecutor` em **`v2/lib/agent/providers/anthropic.ts`**, que usa `getProxyUrl()` → `/api/anthropic/proxy` (no browser usa URL relativa). A conclusão arquitectural mantém-se (**o transporte já passa pelo proxy e já é runtime-agnostic → A2 quase de-graça**), mas **a referência de ficheiro no Architect Gate tem de ser corrigida** para `providers/anthropic.ts` antes que o `@dev` confie nela.

**Acção:** ler `v2/lib/agent/providers/anthropic.ts` (procurar `getProxyUrl`/`/api/anthropic/proxy`/`fetch`) e `providers/factory.ts`; corrigir o parágrafo "Achado" e a linha A2 da tabela na story 1.11. Foi exactamente aqui que a sessão foi interrompida (o grep de verificação foi rejeitado pelo Eurico).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. REFERE-SE AO PROJECTO NEXUS v2 — LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## ADR-9 (já registado em `v2/docs/architecture-v2.md`, tabela de ADRs)

**Executor corre client-side**, `ctx.db` = Dexie real. Edge mantém só `/api/anthropic/proxy`. Supersede a implicação do ADR-1 (executor Edge). Simplifica ADR-6/ADR-7 (undo + confirmação passam a in-process no browser, sem KV cross-process).

**Porquê client-side e não command pattern:** as tools de **leitura** (`listar_tarefas`, `listar_atrasadas`, `consultar_balanco`, `consultar_categoria`, `consultar_projecto`) precisam de dados reais re-injectados no LLM a meio do loop (`executor.ts:937 messages.push(tr)`). O command pattern só serve escritas; leituras exigiriam round-trip KV por cada query. App local-first → orquestrar onde a data vive (browser).

---

## Faseamento decidido (Architect Gate, vinculativo)

- **Phase 1 (fix de produção, mergeável sozinha):** A1 (injectar `db`; tornar `kv` injectável; mover `import '@/lib/agent/tools'` para o bundle client) + A2 (transporte já é proxy — verificar) + A3 (`ClientConfirmationProvider` in-process) + A6 + A7 → **AC1, AC3, AC4, AC5, AC6, AC7, AC9(path client), AC11, AC12**. Resolve **escrita E leitura** (porque `ctx.db` passa a real para ambas).
- **Phase 2 (hardening):** A4 (undo client in-memory+timer 30s) + A5 (remover `/api/agent/prompt`) → AC8, AC10, expansão AC9.

**Insight que de-risca tudo:** as 12 tools **NÃO mudam** — já usam `ctx.db`. A mudança é só na orquestração.

**Critério de aceitação real (Phase 1):** em produção, "anota a tarefa de comprar pão" cria mesmo uma `Task` em Dexie (aparece em `/tarefas`); "quais as minhas atrasadas?" lê dados reais. Zero `ctx.db null`.

---

## AUTO-DECISIONS ratificadas (A1-A7) — detalhe na story 1.11 §Architect Gate

A1 executor injectável (+`kv` injectável, +tool-registry import client) · A2 transporte proxy (já existe) · A3 confirmação in-process · A4 undo in-memory client · A5 deprecar→remover `/api/agent/prompt` (Phase 2) · A6 classifier via proxy (já) · A7 persistência nas tools.

---

## Git — ESTADO E ACÇÃO

- `main` local + remoto = `76d2505d` (sincronizados).
- **POR COMMITAR (working tree, docs-only — NÃO se perdem se committados já):**
  - `v2/docs/architecture-v2.md` (ADR-9 adicionado)
  - `v2/docs/stories/active/1.11.story.md` (NOVO — Ready, mas com o erro de ref a corrigir)
  - `v2/docs/PO-VALIDATION-STORY-1.11.md` (NOVO)
  - este handoff
- **Recomendado:** corrigir o BLOCKER acima → depois `@devops` committa estes docs em main (docs-only, convenção Nexus v2) com mensagem `docs(nexus-v2): ADR-9 + Story 1.11 Ready (fix cérebro) [Story 1.11]`. Push é exclusivo `@devops`.
- Caveats: `gh pr *` requer sempre `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; merge manual do Eurico; push exclusivo `@devops`.

---

## Próximo passo (Eurico decide entre)

1. **Ciclo formal:** corrigir BLOCKER (Architect Gate ref) → `@devops` committa docs → `@dev *develop 1.11` (Phase 1) com gate `@architect` → push → CR → merge → `@po *close-story` (ou fecha só após Phase 2).
2. **Modo directo (recomendado pela sessão):** um agente implementa já a Phase 1 (injectar Dexie real + `useAgentStream` a correr o loop no browser + `import '@/lib/agent/tools'` client + ClientConfirmationProvider), testa "anota a tarefa", e só depois formaliza. Menos handoffs para um projecto de 1 pessoa.
3. **Continuar Epic 4** (4.4/4.5/4.6/4.7) — **NÃO recomendado** antes do fix do cérebro (é a funcionalidade central partida).

> Recomendação da sessão: o fix do cérebro (1.11 Phase 1) vale mais do que o resto do roadmap agora.

---

## Ficheiros-chave (para o terminal novo abrir primeiro)

| Ficheiro | Porquê |
|----------|--------|
| `v2/docs/stories/active/1.11.story.md` | a story (Ready) + Architect Gate (corrigir ref) |
| `v2/docs/architecture-v2.md` (ADR-9) | a decisão |
| `v2/lib/agent/executor.ts` | `buildExecutionContext:412-422` (db:null), import kv:1, getExecutor:4 |
| `v2/lib/agent/providers/anthropic.ts` | transporte real (getProxyUrl → /api/anthropic/proxy) — CONFIRMAR |
| `v2/hooks/useAgentStream.ts` | `:405` fetch a mudar; já persiste chat-log |
| `v2/lib/agent/tools/tasks.ts` | tools que usam `ctx.db` (NÃO mudar) |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260530-cerebro-fix-adr9-story-1.11.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: sessão Claude Code (cadeia @po→@ux→@dev→@devops→@architect→@sm)
DATA: `30/05/2026`
