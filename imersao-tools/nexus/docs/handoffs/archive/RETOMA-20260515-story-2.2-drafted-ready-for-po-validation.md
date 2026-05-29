> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# Handoff — Story 2.2 Draft completo, pronto para `@po *validate-story-draft 2.2`

**From:** River (`@sm`)
**To:** Pax (`@po`)
**Data:** 15/05/2026
**Status:** Pending
**Projecto:** Nexus v2 (`imersao-tools/nexus/`)

---

## Resumo

A Story 2.2 foi criada em Draft com base em:
- `EPIC-2.md` §5 — scope confirmado: "Migrar dados de tarefas do `localStorage` v1 (`nexus_tasks`) para o schema Dexie v2"
- Código actual: `lib/db/migrations/v1-to-v2.ts` (skeleton Story 0.3) — usa `db.tasks.bulkAdd()` directamente
- Repos Story 2.1 — `createTask()` disponível com validação Zod e mensagens PT-PT
- `architecture-v2.md §4.4` — contrato da migration (idempotência, flag, localStorage v1 intacto)

**Interpretação validada contra o epic:** A 2.2 é um refactor cirúrgico do skeleton — substituir `db.tasks.bulkAdd()` por loop de `createTask()`. Tudo o resto (idempotência, mapeamento V1Task→Task, rollback strategy) já está correcto no skeleton e permanece inalterado.

---

## O que o `@sm` verificou antes de redigir

| Item | Verificado | Resultado |
|------|-----------|-----------|
| `EPIC-2.md` §5 scope da 2.2 | Sim | "Migrar dados localStorage v1 → Dexie v2" — confirmado |
| Código actual `v1-to-v2.ts` | Sim | Existe. Usa `db.tasks.bulkAdd()`. Mapeamento correcto. |
| Repos 2.1 disponíveis | Sim | `createTask()` em `lib/db/repos/tasks.ts` — assinatura confirmada |
| `architecture-v2.md §4.4` | Sim | Contrato de idempotência + localStorage v1 intacto confirmado |
| Perguntas abertas | 0 | Tudo decidível com o código e arquitectura existentes |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## O que Pax precisa de validar

**Acção:** `@po *validate-story-draft 2.2`

**Ficheiro:** `imersao-tools/nexus/docs/stories/2.2.story.md`

**Pontos de atenção para a validação:**

1. **Executor Assignment** — `@dev` executor, `@data-engineer` quality gate. Confirmar que este par é adequado (separação de roles A6).

2. **Extensão de `MigrationResult` com `skipped`** — AC2/AC3 adicionam `skipped: number` ao tipo existente. Verificar que esta extensão não quebra nenhuma das Stories 2.3+ que possam consumir `MigrationResult` (improvável mas vale confirmar).

3. **Decisão de não usar transacção Dexie no loop** — O refactor remove a `db.transaction()` wrapping e usa `createTask()` individualmente. O raciocínio é que a idempotência está garantida pelo flag e que falhas parciais são reportadas em `skipped`. Se Pax preferir transacção "tudo-ou-nada", é uma decisão que afecta os ACs 2, 3 e 4 — assinalar como feedback. [AUTO-DECISION documentada na secção Contexto da story.]

4. **Zero perguntas abertas** — River decidiu autonomamente por ter fundamentação directa no código. Pax pode converter qualquer decisão numa pergunta aberta explícita se discordar.

---

## Artefactos produzidos

| Artefacto | Caminho |
|-----------|---------|
| Story 2.2 Draft | `imersao-tools/nexus/docs/stories/2.2.story.md` |
| Este handoff | `imersao-tools/nexus/docs/handoffs/RETOMA-20260515-story-2.2-drafted-ready-for-po-validation.md` |

---

## Próxima acção

```
@po *validate-story-draft 2.2
```

Após aprovação de Pax:
```
@dev *develop 2.2
```

Nota: A Story 2.2 só pode avançar para Approved após o merge da Story 2.1 em `main` (branch `feature/2.1-schema-tarefas-projectos`, commit `c1f15a2b` — aguarda `@devops *push`). O draft pode ser validado antes do merge, mas a implementação só começa após a 2.1 estar em `main`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: 15/05/2026
