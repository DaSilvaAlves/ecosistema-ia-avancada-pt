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

## ⚠️ Estado git do commit de fecho (para `@devops`)

O commit de fecho docs-only desta sessão é **`f069dc64`** (`docs(nexus-v2): fechar Story 1.11 (Done Phase 1)…`) e está na branch **`fix/nexus-1.11-cerebro-client-side`** (a branch da Phase 1), **NÃO em `main`**. Razão: o `main` **local** ainda está em `28409281` (atrás do remote) — **não tem** o merge do PR #44 (squash `d0f2739c`) que já está no remote. A 1.11 no `main` local está em `active/` com Status `Ready` (versão pré-implementação), por isso um cherry-pick directo do fecho para `main` local entraria em conflito.

**Acção `@devops`:**
1. `git fetch` + actualizar `main` local com o merge remoto `d0f2739c` (passa a ter a story em `completed/`? NÃO — o squash mergeou só o conteúdo da story v0.6; o move `active→completed` + Change Log v0.7 vivem no commit de fecho `f069dc64`).
2. Aplicar o fecho docs-only sobre o `main` actualizado: cherry-pick de `f069dc64` para `main` (ou recriar o fecho — `git mv active→completed` + as edições de Status/Change Log v0.7 + handoffs/INDEX) e **push para `origin/main`**.
3. Apagar a branch `fix/nexus-1.11-cerebro-client-side` (já mergeada via PR #44).

> Nota: o ficheiro untracked `docs/PR-BODY-STORY-1.11.md` ficou **fora** do commit de fecho (artefacto de PR do `@devops`, não do close-story).

## next_action

1. **Decisão Eurico/`@pm`:** abrir a Phase 2 já (story/PR separado — `@sm *draft` de uma 1.11-Phase2) **OU** retomar o Epic 4 (em curso, 3/10) e tratar a Phase 2 como dívida agendada. A Phase 1 já resolveu o bug de produção do cérebro, por isso a Phase 2 é hardening, não urgência.
2. Quando a Phase 2 arrancar: começar pelo **AC11** (re-rota da suite E2E) para repor o sinal de CI verde, depois AC8 + AC10.
3. `@devops` (Gage): aterrar o commit de fecho `f069dc64` em `main` + push (ver "Estado git" acima) — exclusivo `@devops`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260530-story-1.11-phase1-DONE-em-main-phase2-pendente.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Pax (@po)`
DATA: `30/05/2026`
