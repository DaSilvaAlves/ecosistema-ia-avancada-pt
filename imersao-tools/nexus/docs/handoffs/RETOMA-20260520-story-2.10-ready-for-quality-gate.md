# RETOMA — Story 2.10 Tools cérebro tarefas/projectos — pronta para quality gate

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Dex (`@dev`) — `*develop 2.10` concluído (continuação de sessão anterior interrompida)
**Para:** `@architect` (Aria) — quality gate; depois `@devops` (Gage) — push
**Data:** 20/05/2026
**Status:** pending
**Branch:** `feature/2.10-tools-cerebro` (commit `ac169e8f`, NÃO empurrada — push é exclusivo `@devops`)
**Story:** `imersao-tools/nexus/docs/stories/active/2.10.story.md` (Status `Ready for Review`)

---

## Summary

A Story 2.10 (Tools cérebro tarefas/projectos — FR15 + FR32) foi retomada a partir
de trabalho parcial não-commitado da sessão anterior. Avaliação confirmou que os 5
ficheiros untracked estavam **completos e correctos** — não havia bugs por terminar
(os "2 erros de typecheck" reportados eram de ficheiros da Story 2.7, que não existem
nesta branch). Todos os 9 AC cumpridos, 9 tasks `[x]`. Commit `ac169e8f` criado com
8 ficheiros. Quality gates locais 5/5 PASS. Pronta para o quality gate de
`@architect` (Aria) — separação A6: Dex executa, Aria faz o gate (backend puro, sem UI).

---

## Context

### O que a Story 2.10 entrega

7 tools de domínio `'tasks'` registadas no `toolRegistry` singleton:
- `lib/agent/tools/tasks.ts` — 5 tools FR15: `criar_tarefa`, `completar_tarefa`,
  `listar_tarefas`, `listar_atrasadas`, `vincular_tarefa_projecto`
- `lib/agent/tools/projects.ts` — 2 tools FR32: `criar_projecto`, `consultar_projecto`
- `lib/agent/tools/index.ts` — barrel de inicialização (side-effect imports)
- `app/api/agent/prompt/route.ts` — `import '@/lib/agent/tools'` (L13, GAP A9 resolvido)
- `vitest.config.ts` — `'lib/agent/tools/**'` em `coverage.include` (thresholds inalterados)
- 28 testes Vitest novos (20 tasks + 8 projects)

### Trabalho parcial vs trabalho completado

Toda a implementação já estava feita pela sessão anterior (a story marca tudo `[x]`,
Dev Agent Record preenchido, File List e Change Log completos). Esta sessão:
- Mudou para a branch `feature/2.10-tools-cerebro` (os ficheiros untracked seguiram)
- Avaliou os 5 ficheiros — confirmou que estavam correctos e completos
- Validou `route.ts` (L13 import) e `vitest.config.ts` (L58-62)
- Correu os 5 quality gates locais — todos PASS
- Fez o commit `ac169e8f` dos 8 ficheiros (não havia commit ainda)

Nenhum ficheiro foi reescrito; nenhum bug foi encontrado.

### Quality gates locais (reproduzidos byte-a-byte)

| Gate | Resultado |
|------|-----------|
| `npm run typecheck` | exit 0 — limpo (zero erros; os 2 erros da 2.7 não existem nesta branch) |
| `npm run lint` | exit 0 — 1 warning pré-existente em `app/api/auth/logout/route.ts` (não tocado) |
| `npm run test:unit` (full suite) | **585/585** PASS, 46 ficheiros (inclui os 28 novos + 36 do registry 1.3) |
| `npm run build` | exit 0 — `/api/agent/prompt` compila com o novo import (Edge-safe) |
| `npm run test:coverage` (tools) | `lib/agent/tools` **99,36% lines** (AC9 ≥ 80%) |

### Decisões-chave (Dev Agent Record)

- **D1:** leituras complexas inline com `ctx.db` em vez dos helpers de repo —
  `route.ts` é Edge runtime; chamar repos puxaria o singleton Dexie para o bundle Edge
  (viola ADR-1). `ctx.db` é injectado (`import type` apenas) — Edge-safe.
- **D3:** helper `registar()` local encapsula o único cast de variância
  (`ToolDefinition<TArgs,TResult>` → `ToolDefinition`) — evita `any` (Constitution).
- `vincular_tarefa_projecto` registada **1x** (FR15+FR32 partilham a tool).

### Notas para o quality gate (PA-1 a PA-5 do architect-gate)

- **PA-1** (isolamento de testes): testes importam o barrel `@/lib/agent/tools`, não os
  módulos directos — Vitest isola cada ficheiro num worker; `beforeEach` limpa só as
  tabelas Dexie, não o registry. Verificado: 64 testes verdes em conjunto (tasks +
  projects + registry.test.ts da 1.3).
- **PA-2** (`criar_tarefa` campos obrigatórios): `recurrenceId`/`parentTaskId`/`context`/
  timestamps todos preenchidos no `execute` — `tasks.ts:194-210`.
- **PA-3/PA-5** (`vitest.config.ts`): apenas `coverage.include` tocado, `thresholds`
  inalterado — não é path bloqueador (`not-tested-trailer-rules.md`). Change Log da
  story regista a alteração (linha vitest.config.ts:58-62).
- **PA-4** (mapeamento prioridade): dois sentidos cobertos por T2 (PT→EN) e T10 (EN→PT).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Next action

1. **`@architect` (Aria)** — executar o quality gate de implementação da Story 2.10
   (lint/typecheck/vitest/build conforme `quality_gate_tools` na story). Verificar PA-1
   a PA-5. Veredicto PASS/CONCERNS/FAIL na secção "Secção de Testes (QA Gate)" da story.
2. Após gate PASS → **`@devops` (Gage)** — `*push feature/2.10-tools-cerebro` + PR
   contra `main`. Commit a empurrar: `ac169e8f`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.10-ready-for-quality-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Dex (@dev)`
DATA: `20/05/2026`
