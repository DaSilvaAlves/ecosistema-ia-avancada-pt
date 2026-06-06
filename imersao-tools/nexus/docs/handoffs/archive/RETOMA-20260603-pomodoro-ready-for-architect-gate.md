# RETOMA — Pomodoro (duração configurável + alarme): ready for `@architect` gate

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 03/06/2026
**from_agent:** `@dev` (Dex)
**to_agent:** `@architect` (Aria)
**Story:** `docs/stories/active/pomodoro-custom-duration-alarm.story.md`
**Status:** Ready for Review — gate `@architect`
**Branch:** `feat/nexus-v2-story-4.8-push-dispatch`
**Commit de produção:** `fd7fbd12` (código já existente)
**Commit do gate local `@dev`:** `473fb8b7` (teste SF-2 + story) — local, NÃO pushed

---

## Resumo

A story `pomodoro-custom-duration` levou GO (9/10) do `@po` (Pax). O código de produção já existe em `fd7fbd12`. O meu trabalho como `@dev` foi: confirmar AC↔código, correr os quality gates frescos, tratar os should-fix, e preparar para o gate `@architect`. Não fiz push, PR nem cherry-pick (exclusivo `@devops`).

## Mapa AC → código (verificado contra `fd7fbd12`)

| AC | Verificado |
|----|-----------|
| AC1 — duração 1-180, input desactivado em `isRunning` | `PomodoroWidget.tsx` L73-92 + `normalizeWorkDuration` L75-79 |
| AC2 — persiste em `localStorage` `nexus_pomodoro` | effect L171 + `loadState` L129 |
| AC3 — `endsAt` deadline real após remount | `toggle` L209 + recompute L142 |
| AC4 — sessão vencida resolvida no remount | `completeExpiredState` L98-119 (load L143) |
| AC5 — alarme `AudioContext` default `clear` (6 bips, 0.5) | `playBeep` L43-69 + `ALARM_PATTERNS.clear` L35 |
| AC6 — 3 perfis soft=3/clear=6/urgent=8, persiste | `ALARM_PATTERNS` L33-37 + select L107-125 |
| AC7 — scope isolado | `git show --stat fd7fbd12` → só os 4 ficheiros, sem push/4.8 |

Todos os 7 AC batem ao código. Nenhuma alucinação.

## Quality gates FRESCOS (03/06/2026)

> `node_modules` do submódulo `v2/` estava incompleto (faltavam `@dnd-kit/*`, `@anthropic-ai/sdk`). Corri `npm install` (80 pacotes) antes dos gates. `npm install` não toca config de test/build → fora da regra `not-tested-trailer-rules.md`.

| Gate | Resultado |
|------|-----------|
| `npm run typecheck` | PASS (exit 0) |
| `npm run lint` | PASS (exit 0; 1 warning pré-existente fora de scope) |
| `npm run test:unit` | PASS 1329/1329, 113 ficheiros (`usePomodoro` 5/5) |
| `npm run build` | PASS (exit 0, 23 rotas; widget na home `/` 40.9 kB) |
| CodeRabbit (`-t uncommitted`, base `main`) | **0 findings** |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. O PROJECTO É O NEXUS v2 (`imersao-tools/nexus/`). CAMINHO CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Should-Fix do PO

**SF-1 (nota para `@architect`):** corrigida na story. Contagem real do `PomodoroWidget.tsx` é **>=3 estados de render** (input `isRunning`; toggle `taskLinkOpen`; tasks loading/empty/content) — mas **todos pré-existentes da Story 0.8**. `fd7fbd12` só adiciona input + select sempre-presentes, **sem ramo de render novo**. Não exige teste de componente. **Acção pedida ao `@architect`:** registar esta contagem (>=3, todos pré-existentes) na secção de gate, para que o CR não a reabra como Major (regra `react-component-test-criteria.md`).

**SF-2 (decidido por `@dev`):** **manter comportamento.** O input de duração activo durante `isBreak` é correcto — o hook preserva `timeLeft` quando `isRunning || isBreak` (L229), logo alterar a duração na pausa configura só a próxima sessão de trabalho, sem perturbar a pausa em curso. Desactivar em `isBreak` removeria flexibilidade sem ganho. Em vez de alterar código de produção, **adicionei um teste de invariante** (`usePomodoro.test.tsx`, teste SF-2) que prova `timeLeft`/`isBreak` inalterados e `workDurationMinutes=45` guardado. Código de produção (`usePomodoro.ts`/`PomodoroWidget.tsx`) intacto.

## Pontos para o `@architect` rever (T2)

1. **ADR-2 (localStorage):** chave `nexus_pomodoro` retrocompatível (`normalizeWorkDuration`/`normalizeAlarmSound`, fallbacks 25/`clear`); `toStoredState` exclui `alarmDue`.
2. **Concorrência `endsAt`:** `setInterval` só em `isRunning`; `endsAt` é fonte de verdade no remount; `completeExpiredState` no load (L143) e no interval (L190).
3. **`AudioContext` fallback:** `webkitAudioContext` fallback + silent fail SSR.
4. **SF-1:** registar contagem de estados (>=3, pré-existentes).
5. **Separation of roles:** `executor=@dev`, `quality_gate=@architect` — distintos (`separation-of-roles.md`).

## next_action (`@architect`)

Executar o gate de saída (T2): rever `usePomodoro.ts` + `PomodoroWidget.tsx` + 5 testes; registar a contagem de estados (SF-1); decidir PASS / CONCERNS / FAIL. Se PASS → `@devops` cherry-pick `fd7fbd12` (+ commit `473fb8b7` do teste SF-2) para branch isolada `feat/nexus-v2-pomodoro-custom-duration` + PR contra `main` (T3).

## Restrições respeitadas

- `@dev` NÃO fez push, PR nem cherry-pick (exclusivo `@devops`).
- Sem alterações fora de scope: só `usePomodoro.test.tsx` (teste) + story `.md`.
- Código de produção `fd7fbd12` intacto.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-pomodoro-ready-for-architect-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@dev` (Dex)
DATA: `03/06/2026`
