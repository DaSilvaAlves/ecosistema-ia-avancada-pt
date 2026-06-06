# RETOMA — Story 4.2 CR Pre-PR Iter 1 CRITICAL escalado a @dev

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Gage (`@devops`)
**Para:** Dex (`@dev`)
**Data:** 29/05/2026
**Estado:** consumed
**consumed_at:** 2026-05-29
**consumed_by:** dev (Dex)
**Story:** 4.2 (CRUD Hábitos + extracção UI partilhada, Epic 4)

> CONSUMIDO 29/05/2026 por Dex (`@dev`) em `*qa-loop-fix 4.2` Iter 2. O CRITICAL foi resolvido (patch único atómico com chave `time` sempre presente; ver commit local `2ae7555f`). Continuação no handoff `RETOMA-20260529-story-4.2-cr-iter2-ready-for-devops-push.md` (to_agent: devops).

---

## Resumo

CodeRabbit pre-PR (Iter 1, `--base main`) sobre a branch `feat/story-4.2-crud-habitos` levantou **1 finding CRITICAL** em `app/(app)/habitos/page.tsx:155-167` (edit branch não persiste o `time` quando o campo é limpo). O CRITICAL bloqueia o push (hard-stop §8, NFR18). É um finding de **código de produção real** — `@devops` não aplica fixes de código (`agent-authority.md`), por isso escala a `@dev` para Iter 2. **NÃO houve push** — a branch fica local com o trabalho intacto.

---

## Contexto

### Estado git (antes da escalação)

- Branch local `feat/story-4.2-crud-habitos` (NÃO pushada — `git ls-remote` vazio), 2 commits sobre `origin/main` (`87168cd3`):
  - `ed042fac` — implementação @dev (17 ficheiros, +2315/-1)
  - `7760c422` — docs: QA gate PASS + InReview (QA Results do Quinn, +88/-2)
- `main` local sincronizado com `origin/main` (`87168cd3`, ahead/behind 0/0). O commit de feature foi movido para a branch via `git stash`/`reset --hard`/`checkout` (padrão 4.1).
- Working tree fora-scope intacto (submodules `comunidade`/`starter-builder`, `membros/README.md`, 150+ untracked).

### Gates pre-push (evidência fresca 29/05/2026) — TODOS PASS

| Gate | Resultado |
|------|-----------|
| `npm run lint` | PASS (1 warning pré-existente fora-scope `app/api/auth/logout/route.ts`) |
| `npm run typecheck` | PASS (exit 0) |
| `npm run test:unit` | **1068/1068** (81 ficheiros) |

### CodeRabbit Iter 1 — 1 finding CRITICAL

```
severity: critical
file: app/(app)/habitos/page.tsx, lines 155-167
```

**Descrição:** o edit branch só chama `updateHabit` para `time` quando `input.time !== undefined` e faz **duas chamadas**. Quando o utilizador limpa o campo (`input.time === undefined`), o primeiro `updateHabit(patch)` **não inclui `time`** e a Dexie `update()` **ignora chaves ausentes** — o `time` antigo persiste na DB. Resultado: limpar o horário não o remove de facto.

**Recomendação do CR:** construir um único patch que inclua sempre a chave `time`:
```
const patch: Partial<Habit> = { name, frequency, category };
patch.time = input.time === undefined ? null : input.time;
await updateHabit(modal.habit.id, patch);
```
(uma só chamada atómica que actualiza e limpa o `time`).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260529-story-4.2-pr-cr-iter1-critical-escalado-dev.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Análise (porquê escalo em vez de defender)

O finding é **válido**, não falso positivo nem doc-nit:

1. **O comentário do código mente.** `page.tsx:156-157` diz "`time` ausente no patch (sem horário) é removido explicitamente para o limpar" — mas o código NÃO remove a chave; a Dexie ignora-a no patch. O comportamento real diverge do comentário.
2. **Inconsistência interna com a D-RESTORE.** O `@dev` já identificou e resolveu correctamente este exacto padrão de bug Dexie no `restoreHabit` (com `.modify(h => delete h.archivedAt)`, ratificado pelo @qa como D-RESTORE). Deixar o mesmo padrão por resolver no edit do `time` é incoerente com a própria decisão da story.
3. **Decisão de scope documentada (story L299 + QA L406)** classifica-o como "refinamento futuro fora-scope FR24/FR25". Mas isso não cura a inconsistência do comentário enganador nem o padrão de bug já reconhecido — o CR tem fundamento ao marcá-lo CRITICAL.

`@devops` não aplica fixes de código (`agent-authority.md`). Não defendo uma inconsistência que a própria equipa já tratou como bug-padrão noutro sítio. Escalo para Iter 2.

## Próxima acção (`@dev` *qa-loop-fix 4.2 / Iter 2)

1. Aplicar a correcção do CR em `page.tsx:155-167`: patch único com `time` sempre presente (`null` quando limpo). Verificar que `updateHabit`/Dexie aceita `time: null` (o tipo é `time?: string`; usar a abordagem consistente com a D-RESTORE — ou patch com `null`, ou `.modify(delete)` se `null` não for aceite pelo tipo).
2. Adicionar/ajustar teste que prove o clear real do `time` no edit (não-tautológico, em linha com `mock-protocol-fidelity.md` e o teste `hasOwnProperty` da D-RESTORE).
3. Actualizar o comentário enganador L156-157 e reconciliar a story L299/L406 (deixa de ser "refinamento futuro" — fica resolvido).
4. Re-correr gates locais (lint / typecheck / `npm run test:unit`).
5. Devolver a `@devops`: re-correr CR pre-PR (Iter 2). **Hard-stop §8: Iter 2 é a última sem autorização do Eurico.** Iter 3 ou merge com waiver exigem autorização humana explícita no commit.

### Limites do fix
- Fix de comportamento de persistência — dentro da autoridade do `@dev`. Se houver dúvida sobre `time: null` vs `delete` ao nível do tipo/contrato → `FLAG @architect`.
- NÃO tocar o débito fora-scope `Header.tsx:93` `/tasks` (EN) — não é desta story.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260529-story-4.2-pr-cr-iter1-critical-escalado-dev.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Gage (@devops)`
DATA: `29/05/2026`
