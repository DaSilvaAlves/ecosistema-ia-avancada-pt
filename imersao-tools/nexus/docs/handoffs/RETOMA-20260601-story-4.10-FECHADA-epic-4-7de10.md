# RETOMA — Story 4.10 FECHADA. Epic 4 a 7/10 (restam só as 3 de Web Push)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 (Epic 4 — hábitos/metas/lembretes) |
| Data | 01/06/2026 |
| from_agent | @devops (Gage) |
| **to_agent** | **any** (próximo terminal — Eurico decide) |
| status | pending |
| Story | 4.10 — Tools cérebro (FR28/FR41/FR38) — **DONE** |

---

## Summary

A Story 4.10 (9 tools cérebro) está **fechada em `main`**. Cadeia completa nesta sessão: `@sm *draft` → `@po *validate` (GO 9/10) → `@architect *ratify D-DOMAIN` (Opção A) → `@dev *develop` → `@architect *gate` (PASS) → `@devops *push`. Merged PR #53 (squash `09d52b24`), closure `75f45137`. **Epic 4 a 7/10 Done.** O cérebro multi-intent passa a operar hábitos/metas/lembretes por linguagem natural.

---

## O que foi entregue

9 tools `domain:'habits'` (D-DOMAIN Opção A — enum `ToolDomain` NÃO estendido) em 3 módulos Edge-safe:

| Módulo | Tools |
|--------|-------|
| `v2/lib/agent/tools/habits.ts` | `criar_habito`, `registar_habito_concluido`, `consultar_evolucao_habito` |
| `v2/lib/agent/tools/goals.ts` | `criar_meta`, `actualizar_meta`, `consultar_metas` |
| `v2/lib/agent/tools/reminders.ts` | `criar_lembrete` (AC4 epic), `listar_lembretes`, `cancelar_lembrete` |

Barrel `index.ts` +3 imports (22 tools totais). 27 testes `fake-indexeddb`. Vitest 1274/1274.

---

## Decisões fixadas (NÃO reabrir)

| Decisão | Detalhe |
|---------|---------|
| **D-DOMAIN Opção A** | As 9 tools usam `domain:'habits'`. `domain` é bucket de routing + chave de `confidence[]`, não label semântico. Classifier já agrupa as 3 áreas (`classifier-system.ts:30`). Precedente A10 (`projects.ts:'tasks'`). Enum `ToolDomain` intacto. |
| **Edge-safety ADR-1** | Tools de cérebro NUNCA importam `@/lib/db/client` nem `repos` — só `ctx.db`. Helpers puros importáveis (`getGoalProgress`, `getMetricRecords`, classe `RRule`). |
| **Reverse por snapshot** | `actualizar_meta`/`cancelar_lembrete` capturam estado anterior no `result` para o `reverse`. |
| **`ctx.db.habit_logs`** | Nome real da tabela (snake_case), não `habitLogs`. |

---

## Estado do Epic 4 (após esta sessão)

| Story | Estado |
|-------|--------|
| 4.1, 4.2, 4.3, 4.4, 4.5, 4.6 | Done (em main) |
| **4.10 (tools cérebro)** | **DONE — PR #53 `09d52b24`, closure `75f45137`** |
| 4.7 (setup Web Push) | **BLOQUEADA em AC1** — falta o Eurico definir VAPID env vars no Vercel (`WEB_PUSH_VAPID_PRIVATE` + `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC`); KV já provisionado. Gate `@architect`. |
| 4.8 (agendamento push) | Por iniciar — depende de 4.7. Gate `@architect`. |
| 4.9 (SW push handler) | Por iniciar — depende de 4.7. Gate `@architect`. |

Epic 4: **7/10 Done. Restam SÓ as 3 de Web Push (4.7/4.8/4.9), em cadeia.**

---

## Próxima acção (to_agent = any)

**Caminho único restante — Web Push:** a cadeia 4.7→4.8→4.9 está bloqueada na origem pela 4.7.

1. **Eurico define no Vercel** as env vars `WEB_PUSH_VAPID_PRIVATE` + `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC` → destranca AC1 da 4.7.
2. Depois: `@dev *develop 4.7` (gate `@architect` — território arquitectural novo: Edge/Node runtime, Service Worker, contrato Web Push). Ver GAPs §7 do `EPIC-4.md` (GAP-4.3 runtime, GAP-4.4 VAPID, GAP-4.5 SW, GAP-4.6 disparo às 15h com app fechada).
3. 4.8 (agendamento) e 4.9 (SW handler) seguem em cadeia após 4.7.

> Fechar 4.7+4.8+4.9 fecha o Epic 4 a 10/10.

Notas de processo:
- `gh pr` precisa SEMPRE de `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`
- Branch `main` NÃO está protegida — esperar CI verde antes de merge (Vitest/Playwright/Lint+TS/Coverage)
- Hard-stop CR: máx 2 iter
- `@devops` (Gage) executa GAP-4.4 (gerar par VAPID + configurar secret) quando a 4.7 arrancar — mas o Eurico tem de definir as env vars no Vercel primeiro

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. CAMINHO DENTRO DA PASTA DO PROJECTO NEXUS V2. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260601-story-4.10-FECHADA-epic-4-7de10.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@devops (Gage)`
DATA: `01/06/2026`
