# RETOMA — Story 5.7 (Brain Dump AI parser) DRAFTED → Architect Gate de Entrada

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Data:** 11/06/2026
**De → Para:** River (`@sm`) → Aria (`@architect`) (Gate de Entrada) → depois Pax (`@po`) + Dex (`@dev`)
**Status:** CONSUMED — 12/06/2026 por Aria (`@architect`): Architect Gate de Entrada (T0) executado, 5 decisões `[D-5.7-*]` ratificadas + AC reconciliados na `5.7.story.md` (v0.2). Continuidade: handoff `RETOMA-20260612-story-5.7-gate-entrada-PASS-proximo-po-validate.md` (→ `@po`).
**Branch:** `feat/nexus-v2-5.7-brain-dump-parser` (local; **ver Passo 0** — pode precisar de push)

---

## Passo 0 — Sincronização (fazer SEMPRE primeiro)

```
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git fetch origin
git checkout feat/nexus-v2-5.7-brain-dump-parser   # se já pushada
# OU, se a branch ainda for só local noutro terminal:
git checkout main; git pull --ff-only origin main   # HEAD esperado: 7801489d (fecho 5.6)
```

- `main` HEAD esperado: **`7801489d`** (commit de fecho da Story 5.6).
- A Story 5.6 (Brain Dump UI) está **FECHADA** em `main` (`b3a538e7` merge + `7801489d` fecho). Epic 5 a **6/13**.
- **Caveats invioláveis:** `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`. **NUNCA `git add -A`** (submódulos `comunidade`/`starter-builder` sujos + 150+ untracked fora-scope) — stage selectivo por path.

---

## Resumo (1 parágrafo — aparece no INDEX)

Story 5.7 (Brain Dump AI parser, FR48) **DRAFTED** por River (`@sm`), Status `Draft`, `story-draft-checklist` **READY-COM-CONDIÇÃO 8/10**. Entrega o parser AI (texto livre → 4 buckets: tarefas/projectos/ideias/decisões) + persistência (`status:'parsed'`) + display read-only dos buckets — passos [4]-[5] da FE spec §1.4. **A 5.7 NÃO faz a aprovação item-a-item** (passos [6]-[8] = Story 5.8). Por ser story de risco (AI + estado), tem **5 decisões de arquitectura** deferidas ao **Architect Gate de Entrada** (`@architect`, task T0) em vez de inventadas — padrão `[D-5.4-ENDPOINT]` da 5.4. **PRÓXIMA ACÇÃO:** `@architect` ratifica `[D-5.7-*]` antes de `@po`/`@dev`.

---

## Contexto (tudo o que o próximo precisa de saber)

### Onde está a story
`imersao-tools/nexus/docs/stories/active/5.7.story.md` (Status `Draft`). Tem secções: Executor Assignment, Nota `@sm` (verificação em código), **Architect Gate de Entrada — Decisões a Ratificar**, User Story, Contexto, AC1-AC8, Tasks T0-T7, Dev Notes, File Locations, Testing, CodeRabbit Integration, Change Log.

### Decisão fixada nesta sessão
- Utilizador escolheu **5.7** (não 5.9) — continuar o sub-módulo Brain Dump, consumindo o seam `onStructure` que a 5.6 acabou de expor.

### As 5 decisões do Architect Gate de Entrada (T0 — `@architect` ratifica ANTES de `@dev`)
| ID | Decisão | Recomendação `@sm` (não-vinculativa) |
|----|---------|--------------------------------------|
| `[D-5.7-MECHANISM]` | Runtime/transporte: (A) reutilizar `/api/anthropic/proxy` JSON síncrono (precedente `[D-5.4-ENDPOINT]`) vs (B) novo `/api/agent/brain-dump` Edge SSE (FE spec §1.4 [4]) | (A) — consistência com 5.4; overlay não exige streaming |
| `[D-5.7-SHAPE]` | Tipo `BrainDumpParsed` (`parsedOutput`): Zod `.strict()`, 4 buckets ASCII (`tarefas`/`projectos`/`ideias`/`decisoes`), itens `{id, texto}` | definir schema + tipo exportado (seam p/ 5.8) |
| `[D-5.7-TOOLS]` | JSON estruturado ad-hoc (5.4) vs Tool Registry `criar_tarefa/projecto/nota` com `requiresPreview` (arch §16) | (A) ad-hoc — tools registam-se na 5.13; aprovação na 5.8 |
| `[D-5.7-SCOPE]` | Fronteira 5.7↔5.8: 5.7 = parse+persist(`parsed`)+display read-only; 5.8 = aprovação item-a-item + persist entidades + `status` partially/fully_approved | confirmar; `parsedOutput` persistido é o seam |
| `[D-5.7-PERSIST]` | `createBrainDump(status:'parsed')` só em parse com sucesso; falha → sem dump `pending` órfão | confirmar |

### Evidência verificada em código (Constitution Art IV — não reabrir)
- **Seam 5.6:** `components/brain-dump/BrainDumpLauncher.tsx:47-49` — `onStructure` placeholder a substituir.
- **Dados (5.1):** `types/db.ts:261-267` — `BrainDump{ id, createdAt, bodyMarkdown, parsedOutput?: unknown, status }`; `status: pending|parsed|partially_approved|fully_approved`. **5.7 tipa o `parsedOutput`** (hoje `unknown`). Repo `lib/db/repos/brain-dumps.ts` pronto (`createBrainDump`/`updateBrainDump`/etc.). `BrainDumpStatus` em `@/lib/db/schemas`.
- **Padrão a reutilizar (5.4):** `lib/diario/ai-estrutura.ts` (helper puro Zod `.strict()` + `parse...` PT-PT + `hasStructuredContent`) e `lib/diario/estruturar-cliente.ts` (client `/api/anthropic/proxy`, JSON síncrono, Sonnet `DEFAULT_EXECUTOR_MODEL='claude-sonnet-4-6'`, `temperature:0`, `stripJsonMarkdownFences`, `res.ok` antes do body, throw PT-PT, `fetchFn` injectável). **NÃO há endpoint dedicado** — `[D-5.4-ENDPOINT]` reutilizou o proxy.
- **FE spec §1.4** (`docs/front-end-spec-v2.md:205-249`): [4] overlay "A estruturar…" + POST; [5] 4 secções colapsáveis com itens; [6]-[8] (selecção/editar/rejeitar/guardar) = **5.8**.

### Regras aplicáveis (já citadas na story)
- `mock-protocol-fidelity.md` (A1 Epic 1) — **obrigatório**: mock reflecte a Anthropic Messages API; ≥1 teste falsificável (`.strict()`).
- `internal-state-contract-gate.md` — eixo (c) falhas na 5.7; ciclo completo (a/b) é da 5.8.
- `external-contract-identifiers.md` — nomes de bucket ASCII; tools `criar_*` são da 5.13.
- `react-component-test-criteria.md` — display tem ≥3 estados (idle/loading/parsed/error) ⇒ teste de componente obrigatório.
- `separation-of-roles.md` — executor `@dev` ≠ gate `@architect`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2 = `imersao-tools/nexus/`), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Próxima acção (o que o próximo deve fazer primeiro)

1. **`@architect` (Aria) — Architect Gate de Entrada (T0):** abrir `5.7.story.md`, ratificar as 5 decisões `[D-5.7-*]`, registá-las (com fonte) na story, reconciliar AC se divergir da recomendação. **É o pré-requisito de tudo o resto.**
2. **`@po *validate-story-draft 5.7`** (pode correr já com T0 pendente, mas idealmente após T0 para validar AC reconciliados).
3. **`@dev *develop 5.7`** (gate de saída `@architect`).
4. **`@devops *pre-push` + PR** quando Ready for Review → CodeRabbit `--base main` → auto-merge (`merge-authority.md`, sem merge manual do Eurico).
5. **`@po *close-story 5.7`** → Epic 5 a 7/13.

Alternativa paralela (se preferir diversificar): `@sm *draft 5.9` (Conhecimento/Notas, FR51 — sub-módulo independente, menor risco).

### Pendente de push (se cross-terminal noutra máquina)
A branch `feat/nexus-v2-5.7-brain-dump-parser` + o draft 5.7 + este handoff estão **locais**. Para outro terminal os ver, o `@devops` deve fazer push selectivo (story 5.7 + handoff + INDEX). No mesmo PC, basta `git checkout` da branch.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2 (imersao-tools/nexus/)`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260611-story-5.7-DRAFTED-architect-gate-entrada.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260611-story-5.7-DRAFTED-architect-gate-entrada.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `River (@sm)`
DATA: `11/06/2026`
