---
from_agent: po
to_agent: sm
created: 2026-05-15T01:00:00Z
consumed: true
consumed_at: 2026-05-15T02:00:00Z
consumed_by: sm
status: consumed
project: nexus-v2
epic: 2
story: 2.1
next_action: apply_f1_and_approve_story_2.1
verdict: GO_conditional
readiness_score: 10
result: F1 aplicado (7 edits + SF2) em imersao-tools/nexus/docs/stories/2.1.story.md. Status Draft → Approved. Q1/Q2/Q3 baked-in nos AC3/AC6/AC9. Change Log v1.1 adicionada. Handoff de saída @sm → @data-engineer criado.
---

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# Story 2.1 validada — GO conditional → `@sm` aplica F1 trivial (~5 min)

## Sumário

Pax (`@po`) validou a Story 2.1 com **GO conditional** — Implementation Readiness Score **10/10** (vs Story 1.1: 9/10, Story 1.10: 8/10). É o draft mais bem-preparado do projecto até hoje. Relatório completo em `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.1.md`.

**As 3 perguntas abertas Q1/Q2/Q3 foram resolvidas pela `@po`** (não escaladas a `@architect` — todas as decisões fundamentadas em fontes canónicas, não em opinião). A interpretação "Data Access Layer" e as 3 reconciliações R1-R3 foram aprovadas. Confirmado non-scope das Stories 2.2/2.6/2.7.

**F1 (única fix bloqueante):** apply mecânico das resoluções Q1-Q3 no ficheiro da story (~5 min, zero alteração de scope/AC). Após F1, Status: Draft → Approved → handoff `@sm → @data-engineer *develop 2.1`.

## Estado consolidado

| Item | Valor |
|------|-------|
| Story file | `imersao-tools/nexus/docs/stories/2.1.story.md` (Status: Draft) |
| PO validation | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-2.1.md` |
| Verdict | **GO conditional** |
| Score | **10/10** |
| Confidence | **High** |
| Fixes bloqueantes | **1** (F1 trivial, ~5 min) |
| Should-Fix (não-bloqueantes) | 3 (SF1-SF3) |
| Nice-to-have | 3 (N1-N3) |
| Próximo executor | `@data-engineer` (após F1) |
| Quality gate | `@dev` (respeita `separation-of-roles.md` A6) |

## Resoluções `@po` (já documentadas em PO-VALIDATION-STORY-2.1.md §1)

| # | Pergunta | Decisão `@po` | Fonte |
|---|----------|---------------|-------|
| Q1 | `Task.tags: string[]` guarda ids ou nomes? | **ids** | `architecture-v2.md` §6.2 (Tag.id explícito); rename-safety crítica em ferramenta de continuidade pessoal |
| Q2 | Tabela `tags` com índice único `&name`? | **Não — índice simples + verificação repo-level com normalização case-insensitive (`name.trim().toLowerCase()`)** | UX (erro PT-PT vs `ConstraintError` opaco); apanha "Urgente"/"URGENTE" |
| Q3 | Índice `recurrences`? | **`'id, ownerType, ownerId, [ownerType+ownerId]'`** | Derivação directa de `architecture-v2.md` §6.2 + padrão consistente com `[habitId+date]`/`[conversationId+timestamp]` (§4.2). Não-invenção. |

## F1 — Apply mecânico (lista exacta, ~5 min)

`@sm`, abre `imersao-tools/nexus/docs/stories/2.1.story.md` e:

1. **Secção "Perguntas abertas — `@po` → `@architect`"** → substituir cabeçalho e conteúdo por **"Resoluções (`@po` 15/05/2026)"**, copiando a tabela de §1 do PO-VALIDATION (3 linhas Q1/Q2/Q3 com decisão + fundamentação). Pode manter sub-nota "Histórico: perguntas originais ver `PO-VALIDATION-STORY-2.1.md` §1" se útil.

2. **AC3** → remover parêntese final "(Ver Q2/Q3 — se `@po`/`@architect` decidirem diferente na validação, ajustar antes de `version(2)` ser implementada)". Agora é decisão firme.

3. **AC6** → adicionar nota no fim: "Filtro por tag recebe **tag id** (decisão `@po` Q1) — `db.tasks.where('tags').anyOf([tagId])` via índice multi-entry `*tags`."

4. **AC9** → adicionar nota no fim: "Verificação de duplicado com normalização case-insensitive (`name.trim().toLowerCase()` para comparação, persiste `name` com capitalização original) — decisão `@po` Q2."

5. **Secção "Próximo passo natural"** (fim do ficheiro) → substituir "decidir Q1/Q2/Q3 ou escalar a `@architect`" por "**Q1/Q2/Q3 decididas em `PO-VALIDATION-STORY-2.1.md` (15/05/2026) — apply F1 feito.**" E mudar `@po *validate-story-draft 2.1` (que já foi feito) por `@data-engineer *develop 2.1`.

6. **Status** (header) → mudar `**Status:** Draft` → `**Status:** Approved`.

7. **Change Log** → adicionar linha:
   ```
   | 15/05/2026 | 1.1 | F1 aplicado: Q1-Q3 baked-in. Status Draft → Approved. | @po (decisões via PO-VALIDATION-STORY-2.1.md), @sm (apply) |
   ```

Optativo (Should-Fix, mesmo ~30s):

- **SF2** (recomendado fazer junto): na secção "🤖 CodeRabbit Integration" da story, adicionar linha "**Local CLI skip** — CR corre via integração GitHub no PR (convenção Nexus v2, ver PO-VALIDATION-STORY-1.10 §7)".

SF1 (tags `(AC: N)` nas tasks) e SF3 (placement final de `lib/db/schemas.ts`) ficam para `@data-engineer` decidir/aplicar durante implementação. Não bloqueante.

## Após F1 — sequência

```
1. @sm aplica F1 (~5 min) e bumpa Status → Approved
2. @sm cria handoff @sm → @data-engineer (link a PO-VALIDATION-STORY-2.1.md)
3. @data-engineer *develop 2.1
   - PRIMEIRA acção: ler PO-VALIDATION-STORY-2.1.md §1 (resoluções Q1-Q3)
   - Implementa T1-T9 (~3-4h)
   - Hard-stop 2 iter qa-loop-fix (EPIC-2 §8)
4. @dev quality gate (lint, typecheck, test:unit, build, coverage ≥80%, AC13 PASS, CodeRabbit no PR)
5. @po *close-story 2.1 (após gate PASS)
6. @sm *draft 2.2 (pode arrancar paralelo após 2.1 começar — migration depende dos repos da 2.1)
```

## Notas para `@sm`

- **Não tens de re-validar nada.** F1 é apply mecânico. Já passei o 10-step checklist completo (PO-VALIDATION-STORY-2.1.md §2-§10).
- **Não escales nenhuma das 3 perguntas a `@architect`.** Q1, Q2, Q3 foram decididas com fundamentação canónica directa, não opinião. Se `@architect` quiser sanity-check Q3 durante qa-gate, é não-bloqueante.
- **A interpretação "Data Access Layer" está aprovada** explicitamente em PO-VALIDATION §11. Mesma reinterpretação que aprovaste na Story 1.1.
- **As 3 reconciliações R1-R3 estão aprovadas** explicitamente. Story segue arquitectura sobre PRD, conforme `EPIC-2.md` §7.
- **Non-scope confirmado:** Stories 2.2 (migration), 2.6 (sistema tags UI), 2.7 (motor recorrência) ficam fora — `@data-engineer` apenas referencia, não toca.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-validated-go-conditional-f1-trivial-apply.md`. PROJECTO: nexus-v2 → dentro de `imersao-tools/nexus/`. COINCIDE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Estado da sessão (15/05/2026)

- Branch: `main` (working tree com submódulos modificados)
- Story 2.1 e PO-VALIDATION-STORY-2.1.md NÃO committados ainda (`@devops` empurra quando o Eurico decidir, alinhado à decisão de 14/05)
- Handoff `RETOMA-20260514-epic-2-created-ready-for-sm-draft.md` consumido pela `@sm`
- Handoff `RETOMA-20260515-story-2.1-drafted-ready-for-po-validation.md` consumido pela `@po`, movido para `archive/`
- INDEX local actualizado

## Ficheiros lidos pela `@po` para validar

- `imersao-tools/nexus/docs/stories/2.1.story.md` (draft inteiro — 569 linhas)
- `imersao-tools/nexus/docs/EPIC-2.md` (cross-check contra draft)
- `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` (FR9-FR15, FR29-FR32, NFR17)
- `imersao-tools/nexus/docs/architecture-v2.md` (ADR-2, §4.2, §6.2, §16 linhas 1120-1128)
- `imersao-tools/nexus/v2/lib/db/client.ts` (estado real `version(1)`)
- `imersao-tools/nexus/v2/types/db.ts` (linhas 54-92)
- `imersao-tools/nexus/v2/lib/db/migrations/v1-to-v2.ts` (existência confirmada)
- `imersao-tools/nexus/docs/stories/completed/1.1.story.md` (precedente Data Access Layer)
- `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.10.md` (formato + convenção)
- `.aiox-core/development/tasks/validate-next-story.md` (10-step checklist canónico)
- `.aiox-core/product/templates/story-tmpl.yaml` (template para compliance check)

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **nexus-v2**
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.1-validated-go-conditional-f1-trivial-apply.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Pax (`@po`)
DATA: 15/05/2026
