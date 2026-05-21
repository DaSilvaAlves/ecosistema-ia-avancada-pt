# RETOMA — Story 3.2 fechada · push pendente · próximo `@sm *draft 3.3`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

| Campo | Valor |
|-------|-------|
| from_agent | Pax (`@po`) — `*close-story 3.2` |
| to_agent | Gage (`@devops`) — `*push` · depois River (`@sm`) — `*draft 3.3` |
| created | 21/05/2026 |
| status | pending |
| projecto | Nexus v2 — Epic 3 (Finanças) |
| branch | `main` (1 commit à frente de `origin/main`) |

---

## Summary

Sessão de hoje (21/05/2026) executou **dois ciclos SDC completos** do Epic 3 do Nexus v2:

- **Story 3.1** (Schema finanças DAL Dexie v3) — fechada. Ciclo difícil: CR Iter 1 → fix Iter 2 → CR Iter 2 CHANGES_REQUESTED (2 bugs de código) → **Iter 3 excepcional autorizada pelo Eurico** → CR Iter 3 APPROVED → PR #30 squash-merged `06e3cfb6`. Fecho commit `ec307d1b` (já em `origin/main`).
- **Story 3.2** (Categorias default PT — seed das 10 categorias FR22) — fechada. Ciclo limpo: @sm draft → @po NO-GO 4/10 (interface `Category` descrita por suposição, errada) → @sm fix → @po GO 9/10 → @dev implementação → @qa gate PASS → PR #31 squash-merged `25fce8a8` (CodeRabbit Iter 1 APPROVED, 0 findings, single-iteration).

**Epic 3 está agora 2/11 stories Done.** EPIC-3.md actualizado.

## Context

### Estado git (CRÍTICO para o @devops)

`main` local tem **1 commit por fazer push**:

```
6227f561 docs(nexus-v2): fechar Story 3.2 — Categorias default PT Done [Story 3.2]
```

É docs-only (mv da story para `completed/` + EPIC-3.md actualizado 1/11→2/11). `origin/main` está em `25fce8a8`. Não dispara CI de código relevante.

Os 6 commits da Story 3.2 (`bc8d6a82..fca839fb`) JÁ foram para o remote via PR #31 (a feature branch foi criada pelo @devops a partir de `main`, porque tinham sido acumulados directamente em `main` por engano — `main` foi depois `reset --hard origin/main`). NÃO repetir esse erro: stories futuras devem nascer em feature branch.

### Débito técnico registado

`EPIC-3.md §8` tem nova subsecção "Débitos técnicos do Epic 3" com **D-3.2-1**: `vitest.config.ts` → `coverage.include` não cobre `lib/financas/**`, por isso `seedCategories.ts` e `formatCurrency.ts` (3.1) não aparecem no report de `npm run test:coverage` (coverage real é 100%, verificada). A absorver pela Story 3.3 ou story técnica dedicada. NOTA: `vitest.config.ts` é path bloqueador (`not-tested-trailer-rules.md`) — qualquer alteração exige evidência local.

### Artefactos disponíveis (entregues pelas Stories 3.1 + 3.2)

- Dexie `version(3)` aditivo — 4 tabelas novas + índice `[cardId+date]` em `transactions`
- 5 schemas Zod, 5 repos tipados (`lib/db/repos/`), 2 hooks reactivos
- `lib/financas/formatCurrency.ts` (helper), `lib/financas/seedCategories.ts` + `DEFAULT_CATEGORIES` (10 categorias)
- `hooks/useFinancasInit.ts` — hook de activação one-shot (montado em `SidebarWidgets.tsx`)
- `recurrences` reutilizável com `ownerType: 'transaction'`

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. É a pasta canónica de handoffs do projecto Nexus v2. CONSULTAR `.claude/rules/handoff-location.md` e `.claude/rules/handoff-central.md`.

---

## Next action

Duas acções sequenciais:

1. **`@devops *push`** — push do commit de fecho `6227f561` (`main` → `origin/main`). Docs-only, não bloqueia nada. Stage selectivo — NÃO arrastar os ~147 ficheiros não-rastreados de `handoffs/` nem submódulos (`comunidade`, `starter-builder`).

2. **`@sm *draft 3.3`** — próxima story do Epic 3. Ler `EPIC-3.md` para confirmar o scope da 3.3 (a recomendação do @po foi 3.3 CRUD transações variáveis ou 3.4 CRUD recorrências — ambas desbloqueadas pela 3.1). A story 3.3 deve nascer numa **feature branch** dedicada, não em `main`. Considerar absorver o débito D-3.2-1 se a 3.3 tocar testes.

### Lições da sessão a aplicar

- **Verificar o código real antes de descrever interfaces nas stories.** O NO-GO da 3.2 foi causado pelo @sm descrever a interface `Category` por suposição. O @po apanhou. Custou 1 ciclo extra.
- **Hard-stop EPIC-3 §8:** máximo 2 iterações de CodeRabbit por story. Iter 3 exige autorização humana explícita registada no commit (trailer `Constraint:`). A 3.1 precisou; a 3.2 não.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (Epic 3)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Claude (orquestração de sessão)`
DATA: `21/05/2026`
