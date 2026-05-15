> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# Handoff — Story 2.2 APPROVED, pronto para `@data-engineer *develop 2.2` (após merge PR #18)

**From:** Pax (`@po`)
**To:** Dara (`@data-engineer`) — executor delegado conforme nota infra
**Data:** 15/05/2026
**Status:** Pending
**Projecto:** Nexus v2 (`imersao-tools/nexus/`)

---

## Resumo

Story 2.2 (Migration localStorage v1 → IndexedDB v2 — refactor via repos) validada por `@po` Pax com **score 10/10** no 10-point checklist. Veredicto: **APPROVED**. Status `Draft → Approved` no story file.

Todas as decisões autónomas de River (`@sm`) ratificadas:
1. Par executor `@dev` + quality gate `@data-engineer` (separation-of-roles A6)
2. Extensão de `MigrationResult` com `skipped: number`
3. Sem transacção Dexie wrapping o loop (`[AUTO-DECISION]` explícita)
4. Exclusão de migration de notas v1 (escopo do Epic 2 é tarefas + projectos)

Zero items requeridos para fix. Zero perguntas abertas.

---

## Nota sobre executor

A story (linhas 17-22) declara executor `@dev` (Dex). O briefing original ao Pax pedia "Dara começa após merge". Para evitar ambiguidade:

- **Executor formal conforme story:** `@dev` (Dex)
- **Quality gate formal conforme story:** `@data-engineer` (Dara)
- **EPIC-2 §5 linha 57:** "Migration v1 → v2 | … | Executor previsto: `@dev` | Quality gate previsto: `@data-engineer`"

Se Eurico preferir que Dara execute (em vez de Dex), seria uma alteração ao Executor Assignment da story (linhas 17-22) e à tabela EPIC-2 §5 — fora do âmbito desta validação. Por agora, o Approved respeita a designação do draft: **`@dev` executa, `@data-engineer` faz o quality gate.**

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Constraint contextual (CRÍTICO)

A Story 2.2 **NÃO pode arrancar** até a Story 2.1 estar merged em `main`:

| Item | Estado |
|------|--------|
| Story 2.1 — branch `feature/2.1-schema-tarefas-projectos` | Done (CLOSED 15/05/2026) |
| Commit local | `c1f15a2b` |
| PR | #18 — aguarda CodeRabbit + merge |
| Story 2.2 implementação | **bloqueada até merge** |

Esta validação não bloqueia o merge — é trabalho paralelo. O Approved autoriza Dex a começar **após** o merge.

---

## Verificações de campo confirmadas pela validação

| Item | Path | Resultado |
|------|------|-----------|
| Migration skeleton existe | `imersao-tools/nexus/v2/lib/db/migrations/v1-to-v2.ts` | SIM (96 linhas, usa `db.tasks.bulkAdd()`) |
| Reexportação skeleton | `imersao-tools/nexus/v2/lib/db/migrations/index.ts` | SIM (reexporta `migrateV1ToV2`, `MIGRATION_FLAG_KEY`, tipo `MigrationResult`) |
| `createTask` repo | `imersao-tools/nexus/v2/lib/db/repos/tasks.ts` linhas 25-29 | SIM (`createTask(input: Task): Promise<Task>`) |
| `TaskSchema` | `imersao-tools/nexus/v2/lib/db/schemas.ts` | SIM |
| Padrão de teste | `imersao-tools/nexus/v2/tests/unit/db/repos/` | SIM (existe — usar como referência para `tests/unit/db/migrations/v1-to-v2.test.ts`) |
| Setup global | `imersao-tools/nexus/v2/tests/setup.ts` | SIM (fake-indexeddb + jsdom) |

---

## Próxima acção

**Após merge do PR #18 em `main`:**

```
@dev *develop 2.2
```

Sequência completa:
1. `@devops *push` (PR #18 Story 2.1 — externo a esta cadeia)
2. Merge PR #18 em `main`
3. `@dev *develop 2.2` (refactor + 6 testes + gates locais)
4. `@data-engineer *qa-gate 2.2`
5. `@devops *push` (PR Story 2.2)

---

## Artefactos produzidos por esta validação

| Artefacto | Caminho | Estado |
|-----------|---------|--------|
| Story 2.2 actualizada | `imersao-tools/nexus/docs/stories/2.2.story.md` | Status: `Draft → Approved`. Change Log v0.2 adicionado. Secção PO Validation com checklist + ratificações + verificações de campo. |
| Este handoff | `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.2-approved-ready-for-data-engineer.md` | Pending |
| Handoff de entrada (consumido) | `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260515-story-2.2-drafted-ready-for-po-validation.md` | Consumed por Pax 15/05/2026 |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Pax (`@po`)
DATA: 15/05/2026
