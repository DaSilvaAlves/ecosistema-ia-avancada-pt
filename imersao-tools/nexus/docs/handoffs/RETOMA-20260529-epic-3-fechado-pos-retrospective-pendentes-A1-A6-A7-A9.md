# RETOMA — Nexus v2: Epic 3 fechado + retrospective + regras em main; pendentes A1 (.coderabbit), A6/A7 (débitos), A9 (decidir Epic 4)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## Metadata

| Campo | Valor |
|-------|-------|
| **Data criação** | 29/05/2026 |
| **Criado por** | Claude (orquestrador main) — fim da sessão de fecho + retrospective do Epic 3 |
| **Projecto** | Nexus v2 (`imersao-tools/nexus/`) |
| **Epic** | Epic 3 — Finanças Completas (**✅ 11/11 Done — COMPLETO, retrospective feita, regras criadas**) |
| **Story activa** | Nenhuma (entre epics) |
| **Status handoff** | pending |
| **to_agent** | `@pm` (Morgan) — primeiro (A9 decidir Epic 4 + A6/A7 com Eurico); `@devops` (Gage) — em paralelo (A1 `.coderabbit.yaml`) |

---

## Summary

O Epic 3 do Nexus v2 está **100% fechado em `main`** e a retrospective já foi executada e empacotada. Toda a cadeia pós-fecho está feita: closure commit `c11ec286` (Epic 3 11/11), retrospective `045d1f95` (`retrospectives/EPIC-3-retrospective.md`), e as acções de regra A2/A3/A4/A5 executadas pelo `@aiox-master` no commit `1344a121` (2 regras novas + `story-lifecycle.md` actualizado). A8 (memória) feita pelo Pax. **Restam 4 acções não-executadas da retrospective**, nenhuma bloqueante do estado actual: **A1** (`@devops` afina `.coderabbit.yaml`), **A6** (`@pm`+`@po` decidem destino dos 6 débitos Baixa), **A7** (`@pm`+Eurico reavaliam D6/D7 do Epic 2), **A9** (Eurico+`@pm` decidem o próximo epic → `@pm *create-epic 4`). A acção que destrava as outras é a **A9** — A6/A7 são "no arranque do Epic 4". A1 é independente e pode correr já.

---

## Context — Estado consolidado

### O que já está em `main` (nada por fazer aqui)

| Item | Commit | Estado |
|------|--------|--------|
| Epic 3 — 11/11 stories Done | `c11ec286` (closure docs-only) | COMPLETO. Waiver rate 1/11 |
| Retrospective Epic 3 | `045d1f95` | `imersao-tools/nexus/docs/retrospectives/EPIC-3-retrospective.md` |
| Regras A3+A4 (novas) + A2/A5 (`story-lifecycle.md`) | `1344a121` | `.claude/rules/react-component-test-criteria.md`, `.claude/rules/external-contract-identifiers.md`, `.claude/rules/story-lifecycle.md` |
| A8 — memória do Nexus v2 actualizada | — | `MEMORY.md` + `project_nexus_v2_epic_3_retrospective.md` (fora do repo) |

- `origin/main` em `1344a121`. Sem branch de feature aberta. Vercel production live em `https://imersao.ia.expressia.pt`.

### As 2 regras novas que entraram (contexto para o Epic 4)

- **`react-component-test-criteria.md`** — componente React com >= 3 estados de render distintos exige teste de componente; trivial não. Aplica-se já na 1ª story de UI do Epic 4 (resolve a inconsistência 3.6 vs 3.9).
- **`external-contract-identifiers.md`** — validar identificadores (tool names, API fields, enums) contra o contrato externo no **draft** da story. Relevante quando o Epic 4 tocar tools/integrações.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260529-epic-3-fechado-pos-retrospective-pendentes-A1-A6-A7-A9.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Acções para o próximo terminal

> Fonte de verdade das acções: `imersao-tools/nexus/docs/retrospectives/EPIC-3-retrospective.md` §7 (tabela A1-A9) e §9 (sequência). Ler antes de executar.

### Acção A9 (primeiro — destrava A6/A7) — Eurico + `@pm` (Morgan) — decidir o próximo epic

O sucessor natural é o **Epic 4 — Hábitos + Metas + Lembretes** (ordem PRD §9 `2 || 3 → 4`; reutiliza `runRecurrenceEngine` genérico por `ownerType` para hábitos/lembretes recorrentes — a aposta de motor genérico do Epic 2/3 paga-se de novo). Ver `architecture-v2.md` §16 (Epic 4).
- **Comando quando decidido:** `@pm *create-epic 4`.
- Confirmar com o Eurico que Epic 4 é mesmo o próximo (e não um epic diferente do roadmap).

### Acção A1 (independente — pode correr já) — `@devops` (Gage) — afinar `.coderabbit.yaml`

Reduzir findings de severidade Major/CHANGES_REQUESTED em **nitpicks de ficheiro de teste e markdown** (contagens de teste, IDs de teste determinísticos, MD lint) — foram a causa de 3 das 4 Iter-3 do Epic 3 (3.7, 3.9, 3.10), nenhuma por bug de produção.
- Objectivo: baixar a média de iterações CR para perto da do Epic 2.
- **Done quando:** `.coderabbit.yaml` ajustado + 1ª story de UI do Epic 4 fecha em <= 2 iter CR.
- Nota: a regra `react-component-test-criteria.md` (já em main) faz o gate AIOX apanhar a falta de testes de componente ANTES do CR — A1 complementa-a do lado do CR.

### Acção A6 (no arranque do Epic 4) — `@pm` (Morgan) + `@po` (Pax) — destino dos 6 débitos Baixa

Os 6 débitos Baixa abertos do Epic 3 (todos em `EPIC-3.md` §8): **D-3.3-1** (error inerte `TransactionFormModal`), **D-3.4-1** (teste de sobrevivência ao delete — confirmar se já fechado pela T7b da 3.4), **D-3.4-2** (copy "Tarefa recorrente" herdada), **D-3.5-1** (referências órfãs account/card), **D-3.5-2** (roving tabindex tab strip), **D-3.5-3** (`Field`+`inputStyle` duplicados → extrair `FormField.tsx`).
- 5 dos 6 são absorvíveis numa **story técnica de housekeeping de UI/a11y de finanças**.
- **Done quando:** os 6 débitos têm destino (story técnica criada ou backlog confirmado).

### Acção A7 (no arranque do Epic 4) — Eurico + `@pm` (Morgan) — reavaliar D6/D7 do Epic 2

Débitos Média herdados do Epic 2, deixados fora-de-scope do Epic 3 correctamente: **D6** (delete projecto cascata) e **D7** (fallback intent PT-BR). No Epic 4 (domínio CRUD afim a tarefas/projectos), D6 é candidato natural; D7 continua candidato a hotfix.
- **Done quando:** D6 e D7 têm destino reconfirmado (story, epic-slot ou hotfix agendado).

---

## Tasks tracking

```
Epic 3 — fechado, retrospective + regras em main:
  ✓ Closure commit c11ec286 (Epic 3 11/11)
  ✓ Retrospective 045d1f95 (EPIC-3-retrospective.md)
  ✓ Regras A2/A3/A4/A5 — commit 1344a121 (2 regras novas + story-lifecycle)
  ✓ A8 memória actualizada (Pax)
  ○ A9 — Eurico + @pm decidem Epic 4 → @pm *create-epic 4 — PENDING (primeiro)
  ○ A1 — @devops afina .coderabbit.yaml — PENDING (independente, pode já)
  ○ A6 — @pm + @po destino dos 6 débitos Baixa — PENDING (arranque Epic 4)
  ○ A7 — Eurico + @pm reavaliam D6/D7 do Epic 2 — PENDING (arranque Epic 4)
```

---

## Notas e avisos

- **Branch actual da sessão:** `main` está em `1344a121` (já com tudo o acima). Não há feature branch aberta.
- **`gh pr` precisa SEMPRE de `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.**
- **Working tree tem muito ruído** (submodules `comunidade`/`starter-builder`, `.agent`/`.antigravity`/`.cursor`/`.aiox-*`, 150+ untracked). NÃO commitar no closure de qualquer acção — staging explícito sempre.
- **Comunidade safety** (`comunidade-safety.md`): nunca tocar/push do submodule `comunidade`.
- Hard-stop CR §8 do EPIC-3 (máx 2 iter; Iter 3/merge waived exigem autorização humana no commit) deve transitar para o `EPIC-4.md` quando criado.
- Regras novas a aplicar no Epic 4: `react-component-test-criteria.md` (1ª story de UI), `external-contract-identifiers.md` (qualquer story de tools/integração).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Nexus v2 (`imersao-tools/nexus/`)
- **LOCALIZAÇÃO CORRECTA:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260529-epic-3-fechado-pos-retrospective-pendentes-A1-A6-A7-A9.md`
- **LOCALIZAÇÃO ACTUAL:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260529-epic-3-fechado-pos-retrospective-pendentes-A1-A6-A7-A9.md`
- **COINCIDEM?** `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

**AGENTE RESPONSÁVEL:** Claude (orquestrador main)
**DATA:** 29/05/2026
