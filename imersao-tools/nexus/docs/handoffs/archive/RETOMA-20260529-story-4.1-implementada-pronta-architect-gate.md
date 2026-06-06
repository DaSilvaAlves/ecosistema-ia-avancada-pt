# RETOMA — Story 4.1 implementada, pronta para Architect Gate final

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Data:** 29/05/2026
**Autor da sessão:** cadeia @devops → @pm → @sm → @po → @data-engineer → @architect → @data-engineer
**Branch:** `main` (HEAD `9691295e`)
**Estado:** Epic 4 arrancado; Story 4.1 implementada e testada; **a aguardar Architect Gate final (Aria)**

---

## 1. Resumo executivo (1 parágrafo)

Nesta sessão fechou-se o pós-Epic-3 (handoffs commitados+pushados: `1518f9b5`, `9691295e`; ficheiro corrompido eliminado; `.gitignore` em `handoffs/`). Decidiu-se arrancar o **Epic 4 — Hábitos + Metas + Lembretes** (acção A9 da retrospectiva): `@pm` criou `EPIC-4.md` (10 stories, 14 FRs, 6 GAPs com destaque Web Push); D7 decidido pelo Eurico como **hotfix dedicado**. A **Story 4.1 (schema)** foi: draftada (`@sm`), validada GO 9/10 (`@po`), ratificada no design checkpoint (`@architect` — milestones embebido + cascata + D6=set null) e **implementada (`@data-engineer`, T3-T8)**. Gates locais verdes (typecheck PASS, Vitest **1032/1032**, lint limpo no código novo). **Falta só o Architect Gate final (Aria) sobre o código** — a Dara não pode auto-aprovar (`separation-of-roles.md`).

## 2. Próxima acção (o que o próximo terminal deve fazer PRIMEIRO)

**`@architect *develop`/quality gate final da Story 4.1** — Aria revê o código implementado (schemas Zod, repos, cascata atómica, qualidade dos testes não-tautológicos) e emite veredicto PASS/CONCERNS/FAIL. Se PASS → `git add`/commit local (`@dev`/`@data-engineer`) → `@devops *push` + criar PR. Story fica InReview → (após CR) Done via `@po *close-story 4.1`.

> Ler primeiro: `imersao-tools/nexus/docs/stories/active/4.1.story.md` (secções "Dev Agent Record" T3-T8, "Architect Gate — Design Checkpoint"). Tudo o que a Aria precisa está lá.

## 3. Estado detalhado por artefacto

### Epic 4 (PLANEADO)
- `imersao-tools/nexus/docs/EPIC-4.md` — criado. Goal: CRUD recorrência + Web Push + tools cérebro. 10 stories (4.1→4.10). FRs: Hábitos FR24-28, Lembretes FR33-38, Metas FR39-41. 6 GAPs (`[GAP-4.1]` a `[GAP-4.6]`) — os 3 de Web Push (4.3 runtime Node / 4.5 SW mínimo vs Epic 8 / 4.6 disparo com app fechada) exigem decisão `@architect` no draft dessas stories.
- Decisões A6/A7 registadas em `EPIC-4.md` §8.

### Story 4.1 (schema hábitos/metas/lembretes) — IMPLEMENTADA, aguarda gate final
- Draft + validação + checkpoint + implementação, tudo em `docs/stories/active/4.1.story.md` (Change Log até v0.4).
- **Descoberta-chave:** 4 das 5 tabelas (`habits`/`habit_logs`/`goals`/`reminders`) já existiam em `version(1)` (scaffold Story 0.3); `ownerType` já tinha `'habit'`/`'reminder'`. **Sem version bump** — `client.ts` NÃO tocado.
- **Decisões ratificadas (Aria):** `goal_milestones` EMBEBIDO (não tabela); cascata composição→cascade + hard-delete; **corolário D6: `Task.projectId` → set null** (referência para resolver o débito D6 numa story técnica futura).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. Working tree (NÃO commitado — push é `@devops`)

Ficheiros desta sessão (Story 4.1 + Epic 4):

| Ficheiro | Estado |
|----------|--------|
| `v2/types/db.ts` | M — `Habit.time?`, `Goal.description?`, nota `milestones.at` |
| `v2/lib/db/schemas.ts` | M — secção Epic 4 (10 schemas Zod + tipos) |
| `v2/lib/db/repos/habits.ts` | novo — CRUD + `deleteHabit` cascade logs |
| `v2/lib/db/repos/habit-logs.ts` | novo — CRUD + `listHabitLogsByHabit` + validação `value`↔`metric` |
| `v2/lib/db/repos/goals.ts` | novo — CRUD + `listGoals(status?)` |
| `v2/lib/db/repos/reminders.ts` | novo — CRUD + `listPendingReminders` + `deleteReminder` cascade Recurrence |
| `v2/hooks/useHabits.ts`, `useGoals.ts`, `useReminders.ts`, `useHabitLogs.ts` | novos |
| `v2/tests/unit/db/repos/{habits,habit-logs,goals,reminders}.test.ts` | novos — 44 testes |
| `docs/EPIC-4.md` | novo |
| `docs/stories/active/4.1.story.md` | novo |
| `docs/PO-VALIDATION-STORY-4.1.md` | novo |

> Nota: o working tree do repo tem ainda outros docs untracked PRÉ-EXISTENTES (PO-VALIDATION/QA-GATE/PR-BODY antigos, `Apresentação do Néctar.txt`) **não desta sessão** — não misturar no commit da 4.1. Commitar apenas os ficheiros da tabela acima.

## 5. Gates locais já corridos (evidência)

| Gate | Resultado | Comando |
|------|-----------|---------|
| typecheck | PASS (0 erros) | `cd imersao-tools/nexus/v2 && npm run typecheck` |
| Vitest suite | **1032/1032 PASS** (+44 vs 988 fim Epic 3) | `npm run test:unit` |
| Testes novos | 44/44 (habits 11, habit-logs 10, goals 13, reminders 10) | `npx vitest run tests/unit/db/repos/{habits,habit-logs,goals,reminders}.test.ts` |
| lint | limpo no código novo (1 warning pré-existente em `app/api/auth/logout/route.ts`) | `npm run lint` |

> Gotcha resolvido: o Zod desta versão NÃO aceita `z.number('msg')` (string posicional) — usar `z.number({ invalid_type_error: 'msg' })`. Já corrigido.

## 6. Acções pendentes do Epic 4 (não bloqueiam a 4.1)

| Acção | Owner | Quando |
|-------|-------|--------|
| A1 — afinar `.coderabbit.yaml` | `@devops` | antes da 1ª story de UI (4.2/4.3) |
| A7/D7 — hotfix do fallback intent PT-BR (classifier) | TU + `@dev`→`@devops` | agendar (decidido: hotfix dedicado) |
| A6 — 4 débitos Baixa de finanças (D-3.3-1, D-3.4-1, D-3.4-2, D-3.5-1) | `@pm`+`@po` | backlog (story técnica de housekeeping finanças) |
| Story 4.2 deve absorver D-3.5-2/3 (FormField + roving tabindex) + oferecer "arquivar hábito" | `@sm`/`@dev` | no draft da 4.2 (orientação Aria) |
| GAPs Web Push 4.3/4.5/4.6 | `@architect` | no draft das stories de push |

## 7. Sequência de stories do Epic 4 (de `EPIC-4.md` §10)

4.1 (schema, ESTA) → 4.2 (CRUD hábitos, absorve UI partilhada) → 4.3 (heatmap) / 4.4 (métricas) → 4.5 (metas) / 4.6 (lembretes) → 4.7 (Web Push, arrancar cedo em paralelo) → 4.8 (agendamento push) → 4.9 (SW handler) → 4.10 (tools cérebro).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260529-story-4.1-implementada-pronta-architect-gate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@data-engineer (Dara)`
DATA: `29/05/2026`
