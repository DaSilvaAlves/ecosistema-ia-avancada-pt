# Story — Pomodoro: duração configurável + alarme sonoro

**Story ID:** pomodoro-custom-duration (feature standalone, não pertence a nenhum Epic numerado)
**Epic:** — (funcionalidade isolada; commit `fd7fbd12` em branch partilhada, **não em `main`**)
**Status:** Reviewed — gate `@architect` PASS (ready for `@devops` cherry-pick + PR)
**Branch de origem:** `feat/nexus-v2-story-4.8-push-dispatch` (commit `fd7fbd12fe8183b5dca2c24b5a34684267d3e7f8`)
**Nota de ciclo:** Esta funcionalidade foi implementada (`fd7fbd12`) numa branch partilhada com a Story 4.8. A Story 4.8 foi isolada (cherry-pick) e mergeada via PR #55. Este commit **não está em `main`** e precisa de ciclo SDC próprio (PR isolado, gate @architect, CodeRabbit). Ver histórico em `RETOMA-20260603-story-4.8-scheduler-live-AC8-pendente-pomodoro-promo.md` §E.
**Bloqueia:** nenhuma
**Bloqueada por:** nenhuma (funcionalidade independente)
**Estimativa:** 2-4h (código já escrito — ciclo = gate @architect + CodeRabbit + PR isolado)
**Tipo:** Frontend (hook + widget) — modificação de `usePomodoro.ts` + `PomodoroWidget.tsx` + testes unitários

---

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@architect"
quality_gate_tools: [lint, typecheck, vitest, build, manual-test-browser]
```

> Trace: funcionalidade de hook/widget com lógica de timer, persistência e AudioContext. Gate `@architect` por ADR-2 (localStorage) + padrão Epic 4 para funcionalidades novas de hook. `executor != quality_gate` — `separation-of-roles.md`.

---

## Nota do `@sm` River

### Contexto e âmbito desta story

O Eurico pediu dois melhoramentos ao widget Pomodoro em 02/06/2026:
1. **Duração configurável** — em vez de 25 minutos fixos, poder escolher qualquer duração de 1-180 min.
2. **Alarme sonoro** — ao terminar a sessão, tocar um sinal audível (3 perfis: Suave / Claro / Urgente).

O commit `fd7fbd12` ("feat: add configurable pomodoro alarm") implementou estas funcionalidades. O código existe e os testes passam localmente — **o ciclo SDC que falta é o gate + PR isolado**. Esta story não exige nova implementação pelo `@dev`; o `@dev` executa o gate local (quality gates), o `@architect` faz o gate de saída, e o `@devops` cria o PR isolado.

### O que já existe (commit `fd7fbd12`)

| Ficheiro | Alterações |
|---------|-----------|
| `v2/hooks/usePomodoro.ts` | `workDurationMinutes` (1-180, default 25) + `endsAt` (deadline real — persiste no `localStorage`) + `alarmSound` (3 perfis) + `setWorkDurationMinutes` / `setAlarmSound` exportados; `playBeep` com `AudioContext`; `normalizeWorkDuration` + `normalizeAlarmSound`; `alarmDue` flag; `completeExpiredState` reconhece expiração no re-mount |
| `v2/components/widgets/PomodoroWidget.tsx` | Input `number` (1-180, desactivado enquanto a correr) + select de alarme (Suave/Claro/Urgente) + consumo de `setWorkDurationMinutes` / `setAlarmSound` |
| `v2/tests/unit/hooks/usePomodoro.test.tsx` | 4 testes: duração configurável + persistência, escolha e persistência de alarme, `endsAt` após remount, sessão vencida com alarme |

### O que NÃO está feito neste commit

- PR isolado contra `main` (branch partilhada com 4.8 — o commit está em `feat/nexus-v2-story-4.8-push-dispatch`)
- Gate `@architect` formal
- CodeRabbit

### [AUTO-DECISIONS]

[AUTO-DECISION] D-NO-EPIC → Não pertence a nenhum Epic numerado (funcionalidade transversal ao widget Pomodoro, sem FR no PRD). Referenciada pelo Eurico como pedido pontual. Trace: handoff §E do closure da 4.8.

[AUTO-DECISION] D-STORY-ID → ID `pomodoro-custom-duration` (não numérico) porque não pertence a nenhum epic. Convenção para features isoladas.

[AUTO-DECISION] D-LOCALSTORAGE → `workDurationMinutes` e `alarmSound` persistem em `localStorage` key `nexus_pomodoro` (já existente). Dentro do contrato ADR-2 (localStorage <100KB, dados não-críticos de UI).

---

## Story

**As a** Eurico (utilizador único do Nexus v2),
**I want** poder escolher a duração do bloco Pomodoro e receber um sinal sonoro ao terminar,
**so that** consigo usar blocos de foco de tamanhos diferentes e não perco o fim da sessão quando mudo de página.

---

## Acceptance Criteria

> Derivados da descrição do pedido do Eurico (02/06/2026) e verificados contra o código do commit `fd7fbd12`.

**AC1 — Duração configurável antes de iniciar**
O widget Pomodoro mostra um campo de entrada numérico (1-180 minutos). O utilizador pode alterar a duração quando o timer não está a correr. Enquanto o timer está a correr, o campo está desactivado.

**AC2 — Duração persiste entre reloads**
A duração escolhida persiste no `localStorage` (chave `nexus_pomodoro`, campo `workDurationMinutes`). Após reload, o timer carrega a duração persistida.

**AC3 — Timer usa deadline real (`endsAt`) após remount/reload/background**
Ao iniciar, o hook calcula `endsAt = Date.now() + timeLeft * 1000` e persiste-o. Após remount/reload enquanto o timer está a correr, o `timeLeft` é recomputado como `Math.ceil((endsAt - Date.now()) / 1000)` — mantém-se correcto mesmo que o browser tenha ficado em background.

**AC4 — Sessão vencida durante background é resolvida no remount**
Se `endsAt` já passou quando a app remonta, o hook detecta a expiração, incrementa `sessionsToday`, transita para pausa, e toca o alarme uma vez.

**AC5 — Alarme sonoro ao terminar sessão**
Ao terminar uma sessão de trabalho, o Pomodoro toca um sinal sonoro via `AudioContext`. O sinal usa o perfil `clear` por defeito (6 bips, volume 0.5).

**AC6 — 3 perfis de alarme configuráveis**
O utilizador pode escolher entre 3 perfis: `Suave` (3 bips suaves), `Claro` (6 bips — defeito), `Urgente` (8 bips intensos). A escolha persiste no `localStorage` (campo `alarmSound`).

**AC7 — Scope limitado ao widget Pomodoro v2**
As alterações limitam-se a `hooks/usePomodoro.ts` + `components/widgets/PomodoroWidget.tsx` + testes associados. Sem alterações a outros componentes, rotas ou schemas Dexie.

---

## Tasks / Subtasks

> O código já existe no commit `fd7fbd12`. As tasks abaixo são de **promoção e gate**, não de nova implementação.

- [x] T0 — Confirmar branch e commit (AC7)
  - [x] Verificar que `fd7fbd12` está na branch `feat/nexus-v2-story-4.8-push-dispatch` (não em `main`)
  - [x] Confirmar ficheiros afectados: apenas `usePomodoro.ts`, `PomodoroWidget.tsx`, `usePomodoro.test.tsx` e esta story — `git show --stat fd7fbd12` confirma exactamente esses 4 ficheiros
  - [x] Confirmar que nenhum ficheiro de push/4.8 está incluído no commit — confirmado

- [x] T1 — Quality gates locais (confirmar que o código do commit passa) — **TODOS PASS (frescos, 03/06/2026)**
  - [x] `npm run typecheck` → exit 0 (após `npm install` para repor `node_modules` incompleto — faltavam `@dnd-kit/*` e `@anthropic-ai/sdk`)
  - [x] `npm run lint` → exit 0 (1 warning pré-existente fora de scope: `NextResponse` unused em `app/api/auth/logout/route.ts`)
  - [x] `npm run test:unit` → 1329/1329 PASS, 113 ficheiros (inclui os 4 testes de `usePomodoro.test.tsx` + 1 novo teste SF-2)
  - [x] `npm run build` → exit 0, 23 rotas geradas

- [x] T2 — Gate `@architect` de saída (revisão do código existente) — **PASS (@architect Aria, 03/06/2026)**
  - [x] `@architect` revê `usePomodoro.ts` — ADR-2 (localStorage), `endsAt` concurrency model, `AudioContext` fallback
  - [x] `@architect` revê `PomodoroWidget.tsx` — input desactivado enquanto a correr, sem regressão
  - [x] `@architect` revê testes — 5 cenários cobrem os AC principais (4 originais + SF-2)
  - [x] `@architect` regista a contagem de estados de render do `PomodoroWidget.tsx` (SF-1) — **5 estados, todos pré-existentes da Story 0.8**
  - [x] Gate: **PASS**

- [ ] T3 — Criar PR isolado (responsabilidade `@devops`)
  - [ ] Cherry-pick `fd7fbd12` para branch nova `feat/nexus-v2-pomodoro-custom-duration`
  - [ ] Confirmar que **nenhum ficheiro de push/4.8** está no PR
  - [ ] Pre-push gates: typecheck + lint + vitest + build → todos PASS
  - [ ] `gh pr create` contra `main`
  - [ ] CodeRabbit Iter 1

---

## Dev Notes

### Ficheiros tocados pelo commit `fd7fbd12`

| Ficheiro | Tipo | Linha aprox. de mudança principal |
|---------|------|----------------------------------|
| `v2/hooks/usePomodoro.ts` | Modificado | +159 linhas — `workDurationMinutes`, `endsAt`, `AlarmSound`, `playBeep`, `normalizeWorkDuration`, `normalizeAlarmSound`, `completeExpiredState` |
| `v2/components/widgets/PomodoroWidget.tsx` | Modificado | +69 linhas — input `number` + select de alarme |
| `v2/tests/unit/hooks/usePomodoro.test.tsx` | Criado/modificado | 98 linhas — 4 testes com `FakeAudioContext` + `vi.useFakeTimers` |
| `docs/stories/active/pomodoro-custom-duration-alarm.story.md` | Esta story | — |

### Interface do hook (estado após `fd7fbd12`)

```typescript
// v2/hooks/usePomodoro.ts
export type AlarmSound = 'soft' | 'clear' | 'urgent';

export interface PomodoroState {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
  sessionsToday: number;
  lastResetDate: string;
  workDurationMinutes: number;   // NOVO — 1-180, default 25
  endsAt: number | null;          // NOVO — epoch ms; null quando parado
  alarmSound: AlarmSound;         // NOVO — 'soft'|'clear'|'urgent'
  alarmDue?: boolean;             // INTERNO — dispara playBeep uma vez
}

export function usePomodoro(): {
  state: PomodoroState;
  toggle: () => void;
  reset: () => void;
  setWorkDurationMinutes: (minutes: number) => void;  // NOVO
  setAlarmSound: (sound: AlarmSound) => void;          // NOVO
}
```

### localStorage key `nexus_pomodoro` (ADR-2)

Antes de `fd7fbd12`: `{ timeLeft, isRunning, isBreak, sessionsToday, lastResetDate }`.
Após `fd7fbd12`: adiciona `workDurationMinutes`, `endsAt`, `alarmSound`. Retrocompatível: `normalizeWorkDuration` / `normalizeAlarmSound` tratam valores ausentes ou inválidos com fallbacks (`DEFAULT_WORK_MINUTES = 25`, `DEFAULT_ALARM_SOUND = 'clear'`).

### Padrão `endsAt` — concorrência e background

O hook usa `Math.ceil((endsAt - Date.now()) / 1000)` para recomputar `timeLeft` no re-mount. Sem `setInterval` quando a app está em background — o `endsAt` é a fonte de verdade. Ao voltar ao foreground e remontar, o hook detecta se `endsAt < Date.now()` (sessão vencida) e chama `completeExpiredState`.

### Alarme — `AudioContext` e fallback

`playBeep` usa `AudioContext` (ou `webkitAudioContext` para Safari). Se não disponível (SSR, ambiente sem API de áudio), retorna silenciosamente (`silent fail`). Sem dependência de ficheiro de áudio externo.

### Testing — padrões

```
v2/tests/unit/hooks/usePomodoro.test.tsx
```
- `vi.useFakeTimers()` + `vi.setSystemTime` para controlar tempo
- `FakeAudioContext` (classe local) → `vi.stubGlobal('AudioContext', FakeAudioContext)`
- `@testing-library/react` `renderHook` + `act`
- Padrão de persistência: `window.localStorage.getItem('nexus_pomodoro')` → JSON parse

### `react-component-test-criteria.md` — verificação

`PomodoroWidget.tsx` pós-`fd7fbd12` tem **>=3 estados de render** (contagem rigorosa, corrigida via SF-1):
1. `isRunning` → input de duração desactivado vs activado
2. Toggle `taskLinkOpen` (bloco "Ligar a tarefa?" expandido vs colapsado)
3. Bloco de tarefas: `tasks === undefined` (a carregar) / `tasks.length === 0` (sem tarefas) / `tasks.length > 0` (com select)

[AUTO-DECISION] D-COMPONENT-TEST (corrigida) → Embora o componente tenha **>=3 estados de render**, **todos são pré-existentes da Story 0.8**. O commit `fd7fbd12` apenas adiciona dois controlos **sempre-presentes** (input numérico + select de alarme) — **sem introduzir ramo de render novo**. A regra `react-component-test-criteria.md` aplica-se ao que esta story **altera**: a alteração é de baixo risco (input + select estáticos) e a lógica nova vive no hook (função testável, coberta por 5 testes). Logo, **não exige teste de componente adicional**. `@architect` regista a contagem real (>=3, todos pré-existentes) no gate para o CR não a reabrir como Major.

---

## Dev Agent Record

**Agente:** Dex (`@dev`) — Opus 4.8 (1M context)
**Data:** 03/06/2026
**Modo:** YOLO (confirmação de código existente + gates + SF-2)

### Mapa AC → Código/Teste (verificado contra `fd7fbd12`)

| AC | Implementação | Teste |
|----|---------------|-------|
| AC1 — Duração configurável 1-180, desactivada enquanto a correr | `PomodoroWidget.tsx` L73-92 (input `number` min=1 max=180 `disabled={state.isRunning}`); `usePomodoro.ts` `normalizeWorkDuration` L75-79 (clamp 1-180) | `usePomodoro.test.tsx` "permite configurar e persistir a duracao" |
| AC2 — Duração persiste em `localStorage` | `usePomodoro.ts` L171 (effect persiste `toStoredState`); `loadState` L129 reidrata via `normalizeWorkDuration` | mesmo teste — `storedPomodoro().workDurationMinutes === 50` |
| AC3 — Deadline real `endsAt` após remount | `usePomodoro.ts` L209 (`toggle` define `endsAt = Date.now() + timeLeft*1000`); L142 recomputa `Math.ceil((endsAt-now)/1000)` no load | "usa endsAt persistido para manter o contador correto apos remount" |
| AC4 — Sessão vencida no remount | `usePomodoro.ts` L143 (`remaining<=0` → `completeExpiredState`) L98-119 (incrementa `sessionsToday`, transita a pausa, `alarmDue=true`) | "completa sessao vencida apos remount e toca alarme uma vez" |
| AC5 — Alarme via `AudioContext`, default `clear` (6 bips, vol 0.5) | `usePomodoro.ts` `playBeep` L43-69; `ALARM_PATTERNS.clear` L35; `DEFAULT_ALARM_SOUND='clear'` L31 | "completa sessao vencida..." (`createOscillatorSpy` chamado 6×) |
| AC6 — 3 perfis (soft=3, clear=6, urgent=8 bips), escolha persiste | `usePomodoro.ts` `ALARM_PATTERNS` L33-37 (soft 3 freq, clear 6, urgent 8); `PomodoroWidget.tsx` L107-125 (select Suave/Claro/Urgente) | "permite escolher e persistir um alarme mais intenso" |
| AC7 — Scope limitado ao widget Pomodoro v2 | `git show --stat fd7fbd12` → só `usePomodoro.ts` + `PomodoroWidget.tsx` + `usePomodoro.test.tsx` + story. Sem schema Dexie, sem rotas | — |

### Resultados reais dos quality gates (frescos, 03/06/2026)

> Nota: `node_modules` do submódulo `v2/` estava incompleto (faltavam `@dnd-kit/*`, `@anthropic-ai/sdk`). Corri `npm install` (80 pacotes adicionados) antes dos gates — só assim os gates correm sobre ambiente íntegro. `npm install` não toca config de test/build (não cai na regra `not-tested-trailer-rules.md`).

| Gate | Comando | Resultado | Detalhe |
|------|---------|-----------|---------|
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | **PASS** (exit 0) | Zero erros após install |
| Lint | `npm run lint` (`next lint`) | **PASS** (exit 0) | 1 warning pré-existente fora de scope (`NextResponse` unused em `logout/route.ts`) |
| Testes unitários | `npm run test:unit` (`vitest run`) | **PASS** | 1329/1329 testes, 113 ficheiros; `usePomodoro.test.tsx` 5/5 (4 originais + SF-2) |
| Build | `npm run build` (`next build`) | **PASS** (exit 0) | 23 rotas; widget embebido na home `/` (40.9 kB) |

### Decisão sobre Should-Fix do PO

**SF-1 (nota para `@architect`):** Confirmo que o commit `fd7fbd12` **não introduz ramo de render novo** no `PomodoroWidget.tsx`. Adiciona dois controlos sempre-presentes (input numérico + select de alarme) — sem novo `if`/condicional de árvore. Os estados de render (>=3: input disabled em `isRunning`; bloco "Ligar a tarefa?" loading/empty/content; toggle `taskLinkOpen`) são todos **pré-existentes da Story 0.8**. A regra `react-component-test-criteria.md` aplica-se ao que esta story **altera** — e a alteração é de baixo risco, sem novo estado. A lógica nova vive no hook (função testável) e está coberta pelos 5 testes. `@architect` regista a contagem real no gate para o CR não a reabrir como Major. **Não exige teste de componente novo.**

**SF-2 (avaliação + acção `@dev`):** **DECISÃO: manter o comportamento; o input ESTAR activo durante `isBreak` é correcto.**
- Análise: o hook `setWorkDurationMinutes` (L229) preserva `timeLeft` quando `isRunning || isBreak`. Logo, alterar a duração durante a pausa muda `workDurationMinutes` (próxima sessão de trabalho) **sem** perturbar o `timeLeft` da pausa em curso. O widget desactiva o input só em `isRunning` (L79) — durante a pausa o input fica activo, o que é uma feature útil: permite configurar o próximo bloco de foco enquanto se descansa.
- Desactivar o input em `isBreak` removeria essa flexibilidade sem ganho de correcção (o hook já protege a integridade do timer).
- **Acção tomada:** em vez de alterar comportamento, **adicionei um teste de invariante** (`usePomodoro.test.tsx` "alterar a duracao durante a pausa nao perturba o timer da pausa em curso (SF-2)") que prova que `setWorkDurationMinutes(45)` durante `isBreak` mantém `timeLeft` e `isBreak` inalterados e guarda `workDurationMinutes=45`. Isto blinda a decisão contra regressão e contra o CR reabrir.
- Diff: ver File List (`usePomodoro.test.tsx` +24 linhas, 1 `it()` novo). Zero alteração a código de produção (`usePomodoro.ts` / `PomodoroWidget.tsx` intactos).

### File List

| Ficheiro | Estado | Mudança |
|---------|--------|---------|
| `v2/hooks/usePomodoro.ts` | Existente (`fd7fbd12`) | Sem alteração nesta sessão — só verificado |
| `v2/components/widgets/PomodoroWidget.tsx` | Existente (`fd7fbd12`) | Sem alteração nesta sessão — só verificado |
| `v2/tests/unit/hooks/usePomodoro.test.tsx` | Modificado (`@dev`, 03/06) | +1 teste SF-2 (invariante duração-durante-pausa); 4 → 5 testes |
| `docs/stories/active/pomodoro-custom-duration-alarm.story.md` | Modificado (`@dev`, 03/06) | Dev Agent Record, gates reais, checkboxes T0/T1, Status → Ready for Review |

### Notas para o gate `@architect`

1. **ADR-2 (localStorage):** chave `nexus_pomodoro` retrocompatível via `normalizeWorkDuration`/`normalizeAlarmSound` (fallbacks 25 / `clear`). `toStoredState` exclui `alarmDue` (flag interna) da persistência.
2. **Concorrência `endsAt`:** `setInterval` só activo quando `isRunning`; `endsAt` é a fonte de verdade no remount (resiste a background). `completeExpiredState` chamado tanto no load (L143) como no interval (L190).
3. **`AudioContext` fallback:** `window.AudioContext ?? webkitAudioContext`; silent fail em SSR/sem-áudio (try/catch). Sem ficheiro de áudio externo.
4. **CodeRabbit:** corrido pré-commit (uncommitted, `-t uncommitted`, base `main`) — **0 findings**.

---

## Change Log

| Data | Versão | Descrição | Autor |
|------|--------|-----------|-------|
| 02/06/2026 | v0.1 | Implementação original (commit `fd7fbd12`) em branch partilhada. Story técnica mínima criada. | Dex (`@dev`) / GPT-5 Codex |
| 03/06/2026 | v0.2 | Refinamento pelo `@sm` River: alinhamento ao SDC, AC testáveis, Tasks de gate/promoção, Dev Notes com código real. Status: Draft — Ready for PO validation. | River (`@sm`) |
| 03/06/2026 | v0.3 | Gate local `@dev` Dex: 4 quality gates frescos PASS (typecheck/lint/test 1329/build, após `npm install` que repôs `node_modules` incompleto). SF-2 avaliado → manter comportamento + teste de invariante adicionado (5 testes). Dev Agent Record + File List. Status: Ready for Review (gate `@architect`). | Dex (`@dev`) |
| 03/06/2026 | v0.4 | Gate de saída `@architect` Aria: **PASS**. AC→código fiel; SF-1 registado (5 estados de render, todos pré-existentes Story 0.8 → não exige teste de componente); SF-2 arquitecturalmente sã; ADR-2 retrocompatível; scope isolado (4 ficheiros, zero push/4.8). Status: Reviewed (ready for `@devops` cherry-pick + PR). | Aria (`@architect`) |

## Not-Tested Evidence Gate

N/A — nenhum commit desta story toca paths bloqueadores (CI config, test-runner, build config, segurança). Ficheiros: `usePomodoro.ts`, `PomodoroWidget.tsx`, `usePomodoro.test.tsx`.

---

## Validação story-draft-checklist (v0.2)

| Categoria | Status | Notas |
|-----------|--------|-------|
| 1. Goal & Context Clarity | PASS | Pedido do Eurico claro; commit de origem identificado; branch e status SDC documentados |
| 2. Technical Implementation Guidance | PASS | 3 ficheiros exactos; interface do hook documentada; localStorage key + ADR-2; `endsAt` pattern; `AudioContext` fallback |
| 3. Reference Effectiveness | PASS | Commit `fd7fbd12` referenciado; handoff §E referenciado; código real citado |
| 4. Self-Containment Assessment | PASS | D-NO-EPIC, D-STORY-ID, D-LOCALSTORAGE, D-COMPONENT-TEST; nota de retrocompatibilidade localStorage |
| 5. Testing Guidance | PASS | 4 testes existentes documentados; padrão `FakeAudioContext` + `vi.useFakeTimers`; tasks de gate |
| 6. CodeRabbit Integration | N/A — gate `@architect` + CR no PR (T3) |

**Score (auto-avaliação @sm): 5/5**
**Resultado @sm: READY for PO validation**

---

## Validação PO (Pax) — 03/06/2026 — VEREDICTO: GO (Implementation Readiness 9/10)

> Task `validate-next-story.md` — 10-point checklist. Verificação anti-alucinação cruzada com código real do commit `fd7fbd12` (`hooks/usePomodoro.ts`, `components/widgets/PomodoroWidget.tsx`, `tests/unit/hooks/usePomodoro.test.tsx`).

| # | Ponto do checklist | Status | Nota |
|---|--------------------|--------|------|
| 1 | Template Completeness | PASS | Secções presentes; sem placeholders |
| 1.1 | Executor Assignment | PASS | `executor: @dev`, `quality_gate: @architect`, distintos; conforme `separation-of-roles.md` |
| 2 | File Structure & Source Tree | PASS | 3 ficheiros confirmados existentes; scope isolado (sem schema Dexie, sem rotas) |
| 3 | AC Satisfaction / testable | PASS | AC1-AC7 verificáveis. Verificado: `workDurationMinutes` 1-180 default 25 (usePomodoro.ts L28/L75-79); `endsAt` deadline real (L141-145/L209); 3 perfis soft=3/clear=6/urgent=8 bips (L33-37) — AC5/AC6 batem ao código |
| 4 | Validation & Testing Instructions | PASS | 4 testes existentes; `FakeAudioContext` + `vi.useFakeTimers`; ficheiro confirmado (98 linhas) |
| 5 | Security | N/A | Feature client-only, sem auth/dados sensíveis |
| 6 | Tasks/Subtasks Sequence | PASS | T0-T3 são tasks de gate/promoção (código já existe), ordem lógica |
| 7 | external-contract-identifiers | N/A | Sem identificadores que cruzem contrato externo (localStorage key pré-existente `nexus_pomodoro`) |
| 8 | CodeRabbit Integration | N/A | Gate @architect + CR no PR (T3) |
| 9 | Anti-Hallucination | PASS | Todas as afirmações técnicas verificadas contra `fd7fbd12`. Retrocompatibilidade localStorage confirmada (normalizadores L75-83) |
| 10 | Dev Agent Implementation Readiness | PASS | Self-contained; código existe; tasks de gate accionáveis |

**Confiança: Alta.** Código já implementado e verificado; ciclo restante é gate + PR isolado.

### react-component-test-criteria.md — verificação PO

A D-COMPONENT-TEST declara "2 estados → fronteira → não obrigatório". Contagem PO rigorosa do `PomodoroWidget.tsx`: o componente como um todo tem **>=3** estados de render (input `isRunning` disabled; bloco "Ligar a tarefa?" com `tasks` loading/empty/content; toggle `taskLinkOpen`). **Mas estes estados são PRÉ-EXISTENTES da Story 0.8** — o commit `fd7fbd12` apenas adiciona dois controlos sempre-presentes (input numérico + select de alarme), sem introduzir novo ramo de render material. A regra aplica-se ao que a story **altera**: a alteração desta story é de baixo risco e não exige teste de componente novo. **A D-COMPONENT-TEST chega à conclusão correcta (não exige), mas pela razão errada (sub-conta os estados).** Não bloqueia — ver SF-1.

### Should-Fix (não bloqueia — GO mantém-se)

- **SF-1 — Corrigir a contagem de estados na D-COMPONENT-TEST.** Substituir "2 estados → fronteira" por: "o componente tem >=3 estados de render, mas todos pré-existentes da Story 0.8; a alteração desta story (input + select sempre-presentes, baixo risco) não introduz ramo de render novo, logo não exige teste de componente adicional — os 4 testes do hook cobrem a lógica nova". O `@architect` regista a contagem real no gate (a regra exige a contagem registada para o CR não a reabrir como Major).
- **SF-2 — AC sobre o input desactivado durante `isBreak`.** O código (`setWorkDurationMinutes` L229) preserva `timeLeft` quando `isRunning || isBreak`, mas o widget só desactiva o input em `isRunning` (L79), não em `isBreak`. Coerência menor: confirmar no gate @architect se alterar a duração durante a pausa é comportamento aceite (provavelmente sim — a duração só se aplica à próxima sessão de trabalho). Documentar.

### Próxima acção
`@dev *develop pomodoro-custom-duration` (T1 quality gates locais — código já existe) → gate `@architect` (T2, com SF-1/SF-2 endereçados no registo do gate) → `@devops` cherry-pick `fd7fbd12` + PR isolado (T3). Status pode passar Draft → Approved.

---

## Architect Gate (Aria) — 03/06/2026 — VEREDICTO: PASS

> Gate de saída T2. `separation-of-roles.md`: `@dev` executou/validou; o gate sobe para `@architect` (gate de feature isolada já implementada, designado pelo handoff). **Não toquei neste código antes** — gate sobre código pré-existente de `fd7fbd12`. Verificação cruzada com código real (`hooks/usePomodoro.ts`, `components/widgets/PomodoroWidget.tsx`, `tests/unit/hooks/usePomodoro.test.tsx`) e `git show --stat`.

| # | Ponto do gate | Status | Nota |
|---|---------------|--------|------|
| 1 | AC → código (amostra) | PASS | Mapa AC1-AC7 da story fiel ao código. Verificado: AC1 input min=1/max=180 `disabled={isRunning}` (Widget L73-92) + clamp `normalizeWorkDuration` (hook L75-79); AC3 `endsAt=Date.now()+timeLeft*1000` (L209) + recompute `Math.ceil` (L142); AC5/AC6 `ALARM_PATTERNS` soft=3/clear=6/urgent=8 (L33-37), default `clear` vol 0.5; teste confirma 6 oscillators (test L122) |
| 2 | SF-1 — contagem de estados de render | PASS | **5 estados de render distintos** (ver tabela abaixo). Todos PRÉ-EXISTENTES da Story 0.8. `fd7fbd12` adiciona só 2 controlos sempre-presentes (input + select) sem novo ramo de árvore. `react-component-test-criteria.md` aplica-se ao que a story **altera** (baixo risco, sem novo estado). Lógica nova vive no hook (5 testes). **Não exige teste de componente.** |
| 3 | SF-2 — input activo em `isBreak` | PASS | Arquitecturalmente sã. `setWorkDurationMinutes` (L229) preserva `timeLeft` em `isRunning\|\|isBreak`: alterar duração na pausa só configura a próxima sessão. `@dev` blindou com teste de invariante (test L81-105) sem tocar código de produção — abordagem correcta |
| 4 | ADR-2 / localStorage retrocompatível | PASS | `loadState` (L121-152): normalizadores com fallbacks 25/`clear`; `endsAt` defensivo; reset diário preservado; `toStoredState` exclui `alarmDue` interno. Estado pré-`fd7fbd12` não quebra (spread `...baseState`). Dentro do contrato ADR-2 (<100KB, UI não-crítica) |
| 5 | Scope isolation | PASS | `git show --stat fd7fbd12` → exactamente 4 ficheiros (story + Widget + hook + teste). **Zero ficheiros de push/4.8.** `473fb8b7` toca só story + teste. Cherry-pick `@devops` será limpo |

### SF-1 — Contagem de estados de render registada (para o CR não reabrir como Major)

`PomodoroWidget.tsx` tem **5 estados de render distintos**:

| # | Estado de render | Localização | Origem |
|---|------------------|-------------|--------|
| 1 | `isRunning` true vs false (input `disabled`, cor do tempo, botão Iniciar/Pausar) | L43, L79, L134-144 | Story 0.8 |
| 2 | `taskLinkOpen` colapsado vs expandido (bloco condicional) | L183 `{taskLinkOpen && ...}` | Story 0.8 |
| 3 | `tasks === undefined` (a carregar) | L193 | Story 0.8 |
| 4 | `tasks.length === 0` (sem tarefas) | L194-196 | Story 0.8 |
| 5 | `tasks.length > 0` (select de tarefas) | L197-220 | Story 0.8 |

**Conclusão SF-1:** contagem = 5 (>= 3), **todos pré-existentes da Story 0.8**. O commit `fd7fbd12` adiciona o input numérico (L73-92) e o select de alarme (L107-125) — **ambos renderizam incondicionalmente**, sem introduzir ramo de render novo. Pela `react-component-test-criteria.md`, a regra incide sobre o que a story **altera**: alteração de baixo risco, sem novo estado de render. A lógica nova é toda do hook e está coberta por 5 testes unitários. **Ausência de teste de componente é deliberada e defensável — não exige teste de componente adicional.**

### Observação não-bloqueadora (transparência)

O `useEffect` de alarme (L174-178) inclui `state.alarmSound` nas dependências; `alarmDue` é reposto a `false` no mesmo efeito (L177), pelo que mudar o alarme com `alarmDue` activo não causa duplo disparo na prática. Não é defeito — registo só para transparência ao `@devops`/CR.

### Cobertura de testes (5 cenários)

| Teste | AC coberto |
|-------|-----------|
| "permite configurar e persistir a duracao" | AC1, AC2 |
| "permite escolher e persistir um alarme mais intenso" | AC6 |
| "usa endsAt persistido... apos remount" | AC3 |
| "alterar a duracao durante a pausa nao perturba o timer (SF-2)" | invariante SF-2 |
| "completa sessao vencida apos remount e toca alarme uma vez" | AC4, AC5 |

### Próxima acção (T3 — `@devops`)
`@devops` cherry-pick `fd7fbd12` + `473fb8b7` para branch isolada `feat/nexus-v2-pomodoro-custom-duration` → confirmar que nenhum ficheiro de push/4.8 entra → pre-push gates (typecheck + lint + vitest + build) → `gh pr create` contra `main` (--repo DaSilvaAlves/ecosistema-ia-avancada-pt) → CodeRabbit Iter 1. Handoff: `RETOMA-20260603-pomodoro-gate-PASS-ready-for-devops.md`.
