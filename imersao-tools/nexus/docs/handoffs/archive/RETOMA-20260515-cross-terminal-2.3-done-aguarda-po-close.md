# RETOMA — Cross-Terminal: Story 2.3 DONE, aguarda `@po *close-story`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Tipo:** Cross-terminal handoff (continuidade de sessão)
**From:** Sessão anterior (terminal A) — @sm + @po + @ux-design-expert + @dev encadeados
**To:** Próximo terminal (terminal B) — provavelmente `@po *close-story 2.3` como primeira acção
**Data:** 15/05/2026
**Próxima acção imediata:** `@po *close-story 2.3`
**Consumed:** true
**Consumed at:** 2026-05-15
**Consumed by:** Pax (`@po`) — Terminal B executou `*close-story 2.3` como primeira acção, consumindo este cross-terminal handoff + o RETOMA qa-PASS. Pipeline completo do dia (Story 2.3 draft → validate → develop → qa-gate → close) executado em 2 sessões (Terminal A: sm→po→sm→ux→dev; Terminal B: po close-story). Próximo: `@devops *push` da 2.2 → merge → rebase 2.3 → push 2.3.
**Status:** consumed

---

## TL;DR para o próximo terminal

Story 2.3 (Vista lista de tarefas) está **Done v0.4** com quality gate Dex PASS. Falta:
1. `@po *close-story 2.3` (DoD checklist + mover para `completed/`)
2. `@devops *push feature/2.2-migration-refactor` (pendente há horas — esta é a 2.2 que ainda não foi pushed!)
3. `@devops *push feature/2.3-vista-lista` (após push 2.2 + rebase contra main actualizado)

**Branch actual:** `feature/2.3-vista-lista` em tip `7b0c201a` (3 ahead de main: 2.2 + 2.2 closure docs + 2.3).

---

## Pipeline executado nesta sessão (Terminal A)

| # | Comando | Agente | Resultado |
|---|---------|--------|-----------|
| 1 | `*draft 2.3` | River (@sm) | Story Draft v0.1 — 12 ACs, 4 [AUTO-DECISION] D1-D4, 5 reconciliações R1-R5 |
| 2 | `*validate-story-draft 2.3` | Pax (@po) | GO conditional Score 9/10, F1 trivial (11 edições) delegado a River |
| 3 | `*correct-course apply-f1 2.3` | River (@sm) | 13 edições aplicadas (11 oficiais + 2 coerência interna), Status `Draft → Approved` v0.2 |
| 4 | `*develop 2.3` | Uma (@ux-design-expert) | 11 ficheiros novos + 3 modificados, commit `7b0c201a`, 5/5 gates locais PASS, Status `Approved → Ready for Review` v0.3 |
| 5 | `*qa-gate 2.3` | Dex (@dev) | Veredicto **PASS** 0/2 iterações, 12/12 ACs + 4/4 D1-D4 + 3/3 SFs + 8/8 pontos focais confirmados, Status `Ready for Review → Done` v0.4 |

Toda a sequência num único terminal, sem regressões, separação A6 honrada em cada step.

---

## Estado actual no disco (verificado)

| Item | Valor |
|------|-------|
| Branch actual | `feature/2.3-vista-lista` (current, tip `7b0c201a`) |
| Ahead of main | **3 commits** — `dd6dc0d8` (2.2 work) + `ff86773c` (2.2 closure docs) + `7b0c201a` (2.3 implementação) |
| Branch 2.2 | `feature/2.2-migration-refactor` (tip `ff86773c`) — **NÃO pushed**, push pendente desde sessão anterior |
| Story 2.3 file | `docs/stories/2.3.story.md` — Done v0.4 (ainda em `stories/`, não em `completed/` — Pax move) |
| Working tree (modificações Dex) | `M EPIC-2.md`, `M INDEX.md`, `M stories/2.3.story.md` (encerramento qa-gate) |
| Untracked novos | `PO-VALIDATION-STORY-2.3.md`, `QA-GATE-STORY-2.3.md`, handoffs novos |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-cross-terminal-2.3-done-aguarda-po-close.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Primeira acção no Terminal B

```
@po *close-story 2.3
```

Checklist DoD que Pax vai executar (referência rápida):

1. Verificar `Status: Done` (linha 5 da story) — já feito por Dex
2. Verificar `## QA Results` completa com veredicto PASS — Dex adicionou (linhas 605+ da story)
3. Confirmar File List coincide com `git show --stat 7b0c201a` — deve ter 14 files (11 novos + 3 modificados)
4. Confirmar Tasks T1-T9 `[x]`, T10 `[ ]` (push delegado) — já marcado
5. Ratificar as 4/4 [AUTO-DECISION] D1-D4 honradas
6. Ratificar 4 Pontos de Atenção (PA1-PA4) como retrospectiva Epic 2 ou backlog (Stories 2.4-2.6)
7. Mover `docs/stories/2.3.story.md` → `docs/stories/completed/2.3.story.md` via `git mv`
8. Actualizar `EPIC-2.md` counter (será efectivo 3/10 Done quando ambos pushes 2.2 + 2.3 estiverem em main)
9. Criar handoff `po → devops` para `*push feature/2.3-vista-lista`

**Tempo estimado:** ~15 min (DoD checklist routine, sem surprises esperados).

---

## Acções seguintes (Terminal B continua)

### Fase 2 — DevOps push 2.2 (URGENTE — pendente há horas)

```
@devops *push (consume RETOMA-20260515-story-2.2-closed-ready-for-devops-push.md)
```

Handoff já existe em pending desde a sessão anterior. Branch `feature/2.2-migration-refactor` commit `dd6dc0d8` + closure docs `ff86773c`. PR contra `main`, CodeRabbit Iter 1 (hard-stop 2 conforme EPIC-2 §8), merge squash.

### Fase 3 — DevOps push 2.3 (após 2.2 merged)

```
@devops *push (consume handoff que Pax acabou de criar em Fase 1)
```

**Importante:** branch `feature/2.3-vista-lista` foi criada a partir de `feature/2.2-migration-refactor` (antes da 2.2 ser pushed). Quando 2.2 for squash-mergeada em main, **fazer rebase** desta branch contra main actualizado — o commit `dd6dc0d8`+`ff86773c` desaparecem da diff (já em main) e fica só `7b0c201a` ahead.

```bash
# Sequência sugerida para Gage após merge 2.2:
git fetch origin
git checkout feature/2.3-vista-lista
git rebase origin/main   # 3 ahead → 1 ahead após rebase
git push -u origin feature/2.3-vista-lista
gh pr create ...
```

---

## Handoffs pendentes no INDEX (consultar primeiro no Terminal B)

Ordem cronológica de criação:

| # | Handoff | De | Para | Acção |
|---|---------|-----|------|-------|
| 1 | `RETOMA-20260515-story-2.2-closed-ready-for-devops-push.md` | `@po` | `@devops` | Push da 2.2 — pendente desde sessão anterior, ainda não consumido |
| 2 | `RETOMA-20260515-story-2.3-qa-PASS.md` | `@dev` | `@po` | **Próxima acção: `@po *close-story 2.3`** — criado nesta sessão |
| 3 | `RETOMA-20260515-cross-terminal-2.3-done-aguarda-po-close.md` | (este ficheiro) | any | Meta-handoff de continuidade cross-terminal |

> **Recomendação para Terminal B:** abrir primeiro este ficheiro (cross-terminal), depois `RETOMA-20260515-story-2.3-qa-PASS.md` antes de invocar `@po`.

---

## Artefactos chave (Terminal B deve abrir conforme necessário)

| Tipo | Path | Quando ler |
|------|------|-----------|
| Story | `imersao-tools/nexus/docs/stories/2.3.story.md` | Pax DoD checklist (sobretudo §QA Results linhas 605+) |
| QA Gate doc | `imersao-tools/nexus/docs/QA-GATE-STORY-2.3.md` | Pax fundamentação do veredicto PASS |
| PO Validation | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.3.md` | Referência do 10-point checklist anterior |
| Epic | `imersao-tools/nexus/docs/EPIC-2.md` | Verificar contagem Done (linha tabela 2.3) |
| INDEX | `imersao-tools/nexus/docs/handoffs/INDEX.md` | Sempre primeiro — fonte da verdade |

---

## Contexto técnico que pode ressurgir

Estas decisões podem ser questionadas pelo Eurico ou CodeRabbit no push — preparado para responder:

### 1. `vitest.config.ts` allowlist `coverage.include` expandida com 6 paths Story 2.3

**Razão:** precedente Story 1.9 que adicionou paths similares com comentário `// Story 1.9 — UI consumer`. Thresholds globais 25% **inalterados** — apenas allowlist `include` que controla **observabilidade** do report, não gates. AC12 lê "NÃO alterar o **threshold global**" — interpretação literalmente cumprida.

**Se for questionado:** apontar para precedente 1.9 + verificar threshold via `grep -A3 thresholds vitest.config.ts` (mantém 25%/25%/25%/25%).

### 2. Helper `isOverdue` parser local-date (D3 extension)

**Razão:** `new Date('YYYY-MM-DD')` parseia como UTC midnight, causando off-by-one em timezones com offset (Portugal BST +1h). `parseDueDateMs` interpreta `YYYY-MM-DD` via `new Date(Number(y), Number(m)-1, Number(d), 0, 0, 0, 0)` (constructor local). Operacionalmente correcto: "due date" é dia inteiro do calendário, não instante UTC.

**Lição para retrospectiva Epic 2:** padrão aplicável a futuros componentes date-aware (calendar 2.5, journal 5.5, hábitos 4.x).

### 3. Hook `useTags` NÃO criado (inline `useLiveQuery(() => listTags())`)

**Razão:** T3.4 explícita autorizou inline. AR2 reformulado por River no F1 cobre exactamente este trade-off. Hook pode ser extraído na Story 2.6 (sistema tags global) — não-bloqueador.

### 4. 4 PAs (Pontos de Atenção) não-bloqueadores

| PA | Descrição | Owner sugerido |
|----|-----------|----------------|
| PA1 | Coverage `page.tsx` 82.12% (skeleton/empty visual states) | Retrospectiva Epic 2 |
| PA2 | `components/tarefas/*` funcs 55.17% (hover handlers difíceis em jsdom) | Retrospectiva Epic 2 |
| PA3 | Hook `useTags` inline | Story 2.6 |
| PA4 | Tab arrow key navigation entre tabs | Story 2.4/2.5 |

Pax decide em `*close-story` se ratifica para retrospectiva ou backlog.

---

## Comandos diagnóstico (no Terminal B)

```bash
# Verificar branch e estado actual
cd C:/Users/XPS/Documents/ecosistema-ia-avancada-pt
git branch --show-current      # → feature/2.3-vista-lista
git log --oneline main..HEAD   # → 7b0c201a, ff86773c, dd6dc0d8
git status -s imersao-tools/nexus/

# Verificar story 2.3 status
grep "^\*\*Status:\*\*" imersao-tools/nexus/docs/stories/2.3.story.md
# → **Status:** Done

# Verificar gates locais (reprodutibilidade)
cd imersao-tools/nexus/v2
npm run typecheck    # exit 0
npm run lint         # 1 warn pré-existente NextResponse
npm run test:unit    # 418/418 PASS
npm run build        # rota /tarefas 6.86 kB
npm run test:coverage  # paths 2.3: 82-100%

# Ler handoffs pendentes
cat imersao-tools/nexus/docs/handoffs/INDEX.md | grep -A2 Pending
```

---

## Working tree noise para IGNORAR

Conforme handoffs anteriores, o working tree global tem ruído pré-existente que **não pertence a esta story**:

- `M imersao-tools/comunidade` (submódulo ponteiro divergente — não relacionado)
- `?? .agent/`, `?? .aiox-* configs`, `?? .cursor/`, `?? .antigravity/` (backups de regras IDE)
- `?? imersao-tools/nexus/Apresentação do Néctar.txt` (ficheiro pessoal)
- `?? imersao-tools/nexus/docs/handoffs/.claude/` (ficheiro inesperado)
- `?? imersao-tools/nexus/docs/handoffs/CUsers...cr-review-iter3.txt` (temp file mal-localizado)
- `?? PR-BODY-STORY-*.md`, `?? QA-GATE-STORY-*.md` antigos (admin docs de stories já fechadas)

Pax e Gage devem focar **apenas** em ficheiros que dizem respeito à 2.3 e 2.2.

---

## Regras AIOX aplicáveis (recap)

| Regra | Aplicação no Terminal B |
|-------|--------------------------|
| `separation-of-roles.md` A6 | Pax faz close-story (não tocar código produção 2.3); Gage faz push (não tocar story file) |
| `handoff-location.md` | Todos os handoffs em `imersao-tools/nexus/docs/handoffs/` com 3 blocos obrigatórios |
| `not-tested-trailer-rules.md` A3 | Commit `7b0c201a` toca `vitest.config.ts` mas tem evidência local presente (Change Log v0.3) |
| `mock-protocol-fidelity.md` A1 | N/A para esta story (sem mocks de protocolos externos) |
| Constitution Artigo II (Agent Authority) | Pax aprova close; só Gage pode push |
| Language Standards PT-PT | Todos os outputs em PT-PT canónico |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-cross-terminal-2.3-done-aguarda-po-close.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Sessão anterior (Terminal A) — encadeamento completo @sm + @po + @ux-design-expert + @dev
DATA: 15/05/2026
TIPO: Cross-terminal handoff de continuidade

---

## Próxima acção recomendada no Terminal B

```
@"aiox-po (agent)" *close-story 2.3
```

Pax vai ler:
1. Este handoff (cross-terminal context)
2. `RETOMA-20260515-story-2.3-qa-PASS.md` (handoff Dex → Pax)
3. Story 2.3 `## QA Results` + `## Dev Agent Record`
4. Executar DoD checklist + mover story para `completed/`

Após close-story 2.3, ordem das próximas acções:

```
@po *close-story 2.3 (no Terminal B — começa aqui)
  → @devops *push feature/2.2-migration-refactor (URGENTE — handoff pendente desde sessão anterior)
  → @devops *push feature/2.3-vista-lista (após rebase contra main pós-merge 2.2)
  → Ambos merged em main → Epic 2 fica 3/10 Done (2.1 + 2.2 + 2.3)
```

---

*Cross-terminal handoff preparado por Dex (@dev) no encerramento da sessão Terminal A em 15/05/2026, após qa-gate PASS da Story 2.3. Próximo terminal pode arrancar `@po *close-story 2.3` directamente.*
