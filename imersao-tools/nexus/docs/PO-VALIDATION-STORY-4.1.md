# PO Validation — Story 4.1 (Schema hábitos/metas/lembretes — Data Access Layer)

**Validador:** Pax (`@po`)
**Data:** 2026-05-29
**Story:** `imersao-tools/nexus/docs/stories/active/4.1.story.md` v0.1
**Task executada:** `.aiox-core/development/tasks/validate-next-story.md` (10-point checklist + executor assignment + anti-hallucination + CodeRabbit integration)
**Decisão final:** **GO** — score **9/10**, Implementation Readiness 9/10, Confidence **High**. Status: `Draft → Approved`.
**Modalidade:** GO directo com 1 condição de processo (não-bloqueadora) — ver §3 e §4. Zero findings de invenção; zero correcções inline necessárias.

---

## 0. Sumário executivo

A Story 4.1 é a story de fundação do Epic 4 (Hábitos + Metas + Lembretes) e bloqueia as 9 stories seguintes (4.2-4.10). É a quarta story de schema do Nexus v2 (depois de 1.1, 2.1, 3.1). A validação cruzou **todos** os claims de código directamente contra `client.ts` e `types/db.ts`.

**Resultado:** GO com confiança alta. A grande força do draft é ter resolvido o `[GAP-4.1]` por **verificação real** (não suposição): descobriu que 4 das 5 tabelas já existem em `version(1)` e que a recorrência genérica já suporta `'habit'`/`'reminder'`. A única condição é que a decisão `[GAP-4.1b]` (`goal_milestones` embebido vs tabela) e a convenção de cascata (AC7) — correctamente deixadas para o `@architect` — sejam ratificadas num **design checkpoint no arranque** (antes da T5), não só no gate final, por determinarem o que se implementa.

---

## 1. Verificação anti-hallucination — claims cruzados com código real

> Constitution Artigo IV (No Invention). Cada claim factual aberto no ficheiro real — dimensão crítica numa story de schema de fundação.

| # | Claim da story | Verificação independente `@po` | Veredicto |
|---|----------------|-------------------------------|-----------|
| C1 | `habits`/`habit_logs`/`goals`/`reminders` já existem em `version(1)` | `client.ts:89-92` — `habits: 'id, frequency, category, createdAt'`, `habit_logs: 'id, habitId, date, [habitId+date]'`, `goals: 'id, status, deadline'`, `reminders: 'id, fireAt, status, [status+fireAt]'` — literal | CONFIRMADO |
| C2 | `ownerType` da `recurrences` já inclui `'habit'`/`'reminder'` | `types/db.ts:84` — `ownerType: 'task' \| 'transaction' \| 'habit' \| 'reminder'` | CONFIRMADO |
| C3 | `goal_milestones` não existe como tabela; `Goal.milestones` é array embebido | `types/db.ts:194` — `milestones: Array<{ at: number; reached: boolean; note?: string }>` | CONFIRMADO |
| C4 | `Habit` não tem `time`; `Goal` não tem `description` | `types/db.ts:170-177` (Habit: id/name/frequency/category/metric?/createdAt) e `:186-195` (Goal: id/title/type/target/current/deadline/status/milestones) — ambos os campos ausentes | CONFIRMADO |
| C5 | `Reminder.recurrenceId` e `Reminder.channels` (push/telegram) já existem | `types/db.ts:201-202` — `recurrenceId: string \| null; channels: Array<'push' \| 'telegram'>` | CONFIRMADO |
| C6 | `version(4)` (Story 3.4) é a última; próxima seria `version(5)` | `client.ts:145` — `this.version(4).stores({ financeRecurrences: ... })`; não há `version(5)` | CONFIRMADO |
| C7 | `HabitLog.value` já suporta as métricas do FR27 | `types/db.ts:183` — `value?: number` | CONFIRMADO |
| C8 | Índices scaffold servem o Epic 4 (`[habitId+date]` heatmap, `[status+fireAt]` disparo) | `client.ts:90,92` — ambos os índices compostos presentes | CONFIRMADO |

**Conclusão da dimensão:** 8/8 claims confirmados em código. Zero invenção. Nenhuma correcção inline necessária (contraste com a Story 3.1 que teve F1 trivial). As citações de linha do draft estão correctas.

---

## 2. Resolução do [GAP-4.1] (versão Dexie + upgrade path)

**Pergunta original (`EPIC-4.md` §7):** próxima versão Dexie livre + preservação do upgrade path?

**Verificação independente `@po`:** a última versão é `version(4)` (`client.ts:145`). As 4 tabelas de hábitos/metas/lembretes vivem em `version(1)` desde o scaffold da Story 0.3 — logo **não são recriadas**. A conclusão do draft é correcta e mais subtil que o esperado: a story pode não precisar de `version(5)` de todo (campos `time`/`description` são não-indexados; Dexie só versiona índices). O `[GAP-4.1]` está resolvido por evidência verificada.

---

## 3. Checklist de 10 pontos

| # | Critério | Veredicto | Nota |
|---|----------|-----------|------|
| 1 | Goal & context clarity | PASS | Objetivo de schema fundacional claro; ligado a `EPIC-4.md` §5 e PRD §6.4/6.6/6.7. |
| 2 | Technical implementation guidance | PASS | Dev Notes ricas; padrões referenciados (atomicidade no repo 3.4/3.6; `fake-indexeddb`); 8 tasks ordenadas. |
| 3 | Testable AC | PASS (c/ condição) | 8 AC testáveis. AC2/AC7 dependem de ratificação `@architect` — testáveis quanto a "decisão registada", mas o **conteúdo** da decisão determina T5/T7. Ver condição §4. |
| 4 | Anti-hallucination | PASS (forte) | 8/8 claims confirmados em código (§1). |
| 5 | Self-contained | PASS | Contém reconciliação, evidência, padrões e testes. |
| 6 | Dependencies & sequencing | PASS | Bloqueia 4.2-4.10; bloqueada por Epic 1 (DONE) + `version(4)` (DONE). Sequência T1→T8 coerente (verificação antes de implementar). |
| 7 | Executor assignment | PASS | `@data-engineer` executa, `@architect` gate — `separation-of-roles.md` (A6) respeitado, paridade com Story 3.1. |
| 8 | Quality/CodeRabbit planning | PASS | AC8 cobre lint+typecheck+vitest+CodeRabbit (NFR15/17/18); convenção A5 de contagem de testes referenciada nas Dev Notes. |
| 9 | File structure / source tree | PASS | `lib/db/repos/*.ts`, schemas Zod, `types/db.ts` — coerente com o existente do Epic 3. |
| 10 | Alignment epic/PRD + regras | PASS | Traça FR24-28/33-38/39-41 + `EPIC-4.md` §5. `external-contract-identifiers.md` N/A (tools são da 4.10 — confirmado, a 4.1 não regista identificadores externos). `react-component-test-criteria.md` N/A (sem componentes React — confirmado). |

**Score: 9/10.** Único ponto com reserva: #3 (AC2/AC7 dependentes de decisão `@architect`) — resolvido pela condição de processo §4, não bloqueador.

---

## 4. Condição de GO (processo, não-bloqueadora)

O draft deixa **deliberadamente** duas decisões para o `@architect` (correctamente — são arquitecturais, não de PO):
- **`[GAP-4.1b]`** — `goal_milestones` embebido (recomendado pelo `@sm`) vs tabela separada.
- **AC7** — convenção de delete-cascata + corolário para D6.

Estas decisões **determinam o que o executor implementa** (que repos, se há `version(5)`, como é a cascata). Para evitar que o `@data-engineer` implemente e tenha de refazer no gate final, a condição de GO é:

> **O `@architect` (Aria) ratifica `[GAP-4.1b]` e a convenção de cascata (AC7) num design checkpoint no arranque da implementação — antes da T5 (repos)/T7 (cascata) — não só no quality gate final.** A T2 da story já posiciona esta consulta cedo; esta validação reforça-a como condição.

Isto é coerente com o precedente da Story 3.1 (`[AUTO-DECISION]` A3 "ratificado com nota de gate"), com a diferença de que aqui a decisão tem impacto material no scope de implementação — daí o checkpoint ser no arranque, não no fim.

**Recomendação `@po` sobre `[GAP-4.1b]`:** concordo com o `@sm` — **array embebido**. Nenhum FR (FR39/FR40) pede query independente de milestones; o agregado Goal é o contexto natural; evita `version(5)` e um join. Mas a decisão é do `@architect`.

---

## 5. Decisão

**GO — score 9/10, Confidence High. Status: `Draft → Approved`.**

A Story 4.1 está pronta para `@data-engineer` (Dara) implementar, com o design checkpoint `@architect` (§4) no arranque para `[GAP-4.1b]` e a convenção de cascata. Próximo passo no SDC: `@data-engineer *develop 4.1` (com consulta `@architect` early conforme §4).

---

**Documento criado por:** Pax (`@po`) em 29/05/2026
**Sources verificados:** `4.1.story.md` (draft), `EPIC-4.md` §5/§7/§8, `PRD-NEXUS-V2.md` §6.4/6.6/6.7, `v2/lib/db/client.ts:85-147`, `v2/types/db.ts:79-204`, `PO-VALIDATION-STORY-3.1.md` (formato).
