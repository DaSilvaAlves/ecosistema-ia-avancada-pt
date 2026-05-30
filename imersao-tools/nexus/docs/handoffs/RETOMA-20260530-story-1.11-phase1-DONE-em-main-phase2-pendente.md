# RETOMA — Story 1.11 Phase 1 DONE em main · Phase 2 pendente · CI regression vermelho esperado

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** po (Pax)
**to_agent:** any (Eurico / `@pm` / `@sm` — decidir Phase 2 ou retomar Epic 4)
**created:** 2026-05-30
**status:** pending

## Summary

Story 1.11 **Phase 1** (fix do cérebro client-side, ADR-9) está **DONE em `main`**. PR #44 mergeado (squash `d0f2739c`; head pré-squash `62a955ca`). Gate de implementação PASS (Aria `@architect`), CodeRabbit 2 iter só Minor (zero CRITICAL/MAJOR). `@po *close-story 1.11` concluído: Status `InProgress → Done (Phase 1)`, story movida `active/ → completed/`, Change Log v0.7. A **Phase 2 NÃO está feita** — é story/PR separado a planear. Há um **check de CI vermelho esperado** ("50-prompt regression") que só fica verde com a Phase 2.

## Estado

| Item | Valor |
|------|-------|
| Story | `imersao-tools/nexus/docs/stories/completed/1.11.story.md` (movida de `active/`) |
| Status | **Done (Phase 1)** |
| Epic | 1 — Cérebro Multi-Intent (hardening pós-Epic; Epic 1 já estava 10/10 fechado) |
| Merge | PR #44 squash `d0f2739c` em `main` (commit head pré-squash `62a955ca` — `fix(nexus-v2): executor client-side…`) |
| Gate impl. | PASS (Aria) — lint 0, typecheck limpo, vitest **1120/1120**, build 18/18, bundle client sem `ANTHROPIC_API_KEY` eager, Edge-safety mantida |
| Bug resolvido | "anota a tarefa de comprar pão" cria mesmo uma `Task` em Dexie (escrita) + "quais as atrasadas?" lê dados reais (leitura). Zero `Cannot read properties of null`. |
| AC entregues | AC1-AC7, AC9 (path client), AC11 (path client via Vitest), AC12 |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260530-story-1.11-phase1-DONE-em-main-phase2-pendente.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Phase 2 — PENDENTE (story/PR separado)

A Phase 1 foi mergeada sozinha por decisão de faseamento do gate de design v0.4 (é auto-suficiente — entrega escrita **e** leitura end-to-end). A Phase 2 fica como trabalho separado:

| AC | Âmbito | [Dec] |
|----|--------|-------|
| **AC8** | UndoStore client-side (memória + timer 30s, reverte mutações Dexie no cliente) | A4 |
| **AC10** | Remoção física de `/api/agent/prompt` (Edge) + auditoria de callers de `/api/agent/confirm` e `/api/agent/undo` (fluxo KV antigo) antes de remover | A5 |
| **AC11** | Regression 50-prompt E2E completa **re-rotada** ao fluxo client-side (`page.route()` em `/api/anthropic/proxy` + Dexie no browser) | A4/A5, D2 |

### ⚠️ ITEM PRIORITÁRIO Phase 2 — CI "50-prompt regression" VERMELHO (esperado)

O check de CI **"50-prompt regression"** (suite E2E da Story 1.10) está e **continuará VERMELHO** em PRs futuros. Razão: a suite testa o fluxo **Edge antigo** (`/api/agent/prompt`), que a Phase 1 **substituiu** pelo fluxo client-side e deprecou. **Não é uma regressão de funcionalidade** — é a suite a apontar para um endpoint deprecated. Só fica verde quando o **AC11 da Phase 2** re-rotar a suite ao fluxo client-side (`/api/anthropic/proxy` + Dexie no browser). Até lá:

- Este check vermelho é **esperado** e **não deve bloquear merges**.
- Avaliar cada PR pelos **restantes** checks de CI.
- A re-rota da suite é o **primeiro** item da Phase 2 (destrava o sinal de CI).

### Concerns do gate para a Phase 2 (não-bloqueantes da Phase 1)

1. **`noKvStub` falha-loud** (`executor.ts`) — confirmar que nenhuma tool futura do **Epic 4** (hábitos/metas/lembretes) passa a depender de `ctx.kv` no caminho client; senão o stub explode em runtime.
2. **`/api/agent/confirm` e `/api/agent/undo`** continuam Edge e vivos (fluxo KV antigo). A auditoria de A5 deve confirmar que ficam órfãos com o client-side antes de qualquer remoção.

## ✅ Estado git — RESOLVIDO (push concluído 31/05/2026)

Tudo em `main`, local e remoto sincronizados. Nada pendente do lado git.

| Item | Estado |
|------|--------|
| `main` HEAD (local = remoto) | **`d5a11870`** — `docs(nexus-v2): fechar Story 1.11 (Done Phase 1)…` |
| Merge da Phase 1 | PR #44 squash **`d0f2739c`** em `main` (pai do commit de fecho) |
| Commit de fecho docs-only | `d5a11870` (story `active→completed`, Status Done, Change Log v0.7, handoffs/INDEX) |
| Branch `fix/nexus-1.11-cerebro-client-side` | **apagada** (local + remoto, mergeada via #44) |
| Commit local órfão `28409281` (Architect Gate v0.4) | **descartado** — nunca foi pushed; o seu conteúdo já entrou no squash `d0f2739c`. Divergência `main` resolvida com `reset --hard origin/main` + cherry-pick do fecho |

> Nota: o ficheiro untracked `docs/PR-BODY-STORY-1.11.md` ficou fora do commit de fecho (artefacto de PR, não do close-story) — pode ser apagado.

## next_action (para o próximo terminal)

**Passo 0 — sincronizar:** `cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt" && git fetch && git status` (esperar `main` = `d5a11870`, sincronizado).

**Decisão Eurico/`@pm`** — duas vias (a Phase 1 já resolveu o bug de produção; a Phase 2 é hardening, não urgência):

1. **Abrir a Phase 2 já** — `@sm *draft` de uma story 1.11-Phase2 com **AC8 + AC10 + AC11**. Quando arrancar, começar pelo **AC11** (re-rota da suite E2E ao fluxo client-side) para repor o sinal de CI verde, depois AC8 + AC10.
2. **Retomar o Epic 4** (em curso, 3/10) e tratar a Phase 2 como dívida agendada. ⚠️ Se seguir por aqui, ter presente o concern do gate: nenhuma tool nova do Epic 4 (hábitos/metas/lembretes) deve depender de `ctx.kv` no caminho client (`noKvStub` falha-loud).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260530-story-1.11-phase1-DONE-em-main-phase2-pendente.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Pax (@po)` · git resolvido + push por `Claude (orquestrador main)` em 31/05/2026
DATA: `30/05/2026` (fecho) · `31/05/2026` (push de `main` concluído)
