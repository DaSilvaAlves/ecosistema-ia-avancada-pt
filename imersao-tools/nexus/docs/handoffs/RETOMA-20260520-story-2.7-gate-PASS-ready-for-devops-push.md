# RETOMA — Story 2.7 Motor de recorrência (FR10) · Architect Gate PASS · Pronto para push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**De:** Aria (`@architect`) — quality gate de implementação da Story 2.7 (`EPIC-2.md` §5; `separation-of-roles.md` A6 — Dex executou, Aria fez o gate)
**Para:** Gage (`@devops`) — `*push feature/2.7-motor-recorrencia` + PR contra `main`
**Data:** 2026-05-20
**Projecto:** Nexus v2 — Epic 2 (Tarefas v2 + Projectos)
**Estado:** PENDING (aguarda push `@devops`)

---

## Sumário executivo

Architect Gate de implementação da Story 2.7 (Motor de recorrência, FR10) executado — **veredicto PASS**. Os 5 quality gates foram reproduzidos de forma independente num **worktree dedicado** (`ecosistema-gate-2.7`, branch `feature/2.7-motor-recorrencia`), isolado da branch `feature/2.10-tools-cerebro` que tinha outro gate a correr em paralelo. 15/15 AC honrados. Story `Ready for Review` → `Done`.

Branch `feature/2.7-motor-recorrencia` — commits `ccfd545e` (feat) + `3caa21bd` (handoff dev→architect) + commit de gate (este — `docs(nexus-v2): architect quality gate Story 2.7 — PASS`). Pronta para push.

---

## Veredicto: PASS

| Dimensão | Resultado |
|----------|-----------|
| AC honrados | 15/15 — AC7 cumprido via [AUTO-DECISION A11] ratificada |
| Quality gates | 5/5 PASS — reproduzidos byte-a-byte em worktree limpo |
| ADR-2.7-1 | Honrada — motor agnóstico ao mecanismo de activação |
| Invenção (Constitution Art. IV) | Zero — rastreabilidade completa a FR10 |
| Fixes exigidos | Nenhum |

---

## Quality gates reproduzidos (worktree limpo branch 2.7, a partir de `imersao-tools/nexus/v2/`)

| Gate | Resultado | Nota |
|------|-----------|------|
| `npm run lint` | exit 0 | 1 warning pré-existente em `app/api/auth/logout/route.ts` — não introduzido pela 2.7 |
| `npm run typecheck` | exit 0 — zero erros | No worktree limpo da 2.7 não há ficheiros da 2.10; typecheck dá 0 absoluto (confirma que os 2 erros do reporte `@dev` eram contaminação da 2.10) |
| `npm run test:unit` | **588/588 PASS** | Ver PA-5 abaixo. 31 testes da 2.7 verificados isoladamente: 31/31 PASS |
| `npm run build` | exit 0 | rota `/tarefas` 23.5 kB |
| `npm run test:coverage` | thresholds AC15 cumpridos | `recurrence.ts` 98.58% / `RecurrenceFieldset.tsx` 98.38% / `lib/tarefas` 100% / all-files 89.46% |

`vitest.config.ts` e `package.json:scripts` **não alterados** — `not-tested-trailer-rules.md` (A2) não violado.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.7-gate-PASS-ready-for-devops-push.md`. O projecto a que se refere é o **Nexus v2** (dentro de `imersao-tools/nexus/`). O caminho coincide com a pasta do projecto. CONSULTAR `.claude/rules/handoff-location.md` se em dúvida.

---

## [AUTO-DECISION A11] — AC7 parcial — RATIFICADA pelo gate

A11 foi avaliada e **ratificada — não é FAIL nem CONCERNS**. Factos verificados directamente em código:

- Não existe `TaskFormModal.tsx` em `components/tarefas/` (12 componentes, nenhum é formulário de criação/edição de tarefa).
- O botão "+ Nova" em `app/(app)/tarefas/page.tsx` está `disabled` + `aria-disabled="true"` (linha 319-320).
- A própria Story 2.4 já tinha ratificado `[A4] "+Nova mantém disabled"` (`page.tsx:38`) — a inexistência do formulário é facto consolidado do projecto desde a 2.4.

O AC7 antecipava este caso mas pressupunha um handler `onSubmit` de tarefa que o projecto ainda não tem. Criar um formulário "+ Nova" completo seria invenção de escopo (Constitution Art. IV). O `@dev` entregou `RecurrenceFieldset` standalone totalmente testado (props limpas, injectável sem refactor) + `cancelTaskRecurrence` helper de domínio testado — a entrega completa do que é viável. **AC7 considerado PASS.**

**Débito D-2.7-1:** quando uma story futura criar o formulário "+ Nova" de tarefa, injectar `RecurrenceFieldset` e ligar `cancelTaskRecurrence` ao botão de cancelamento da task-mãe. Registar em `EPIC-2.md` §10.

---

## Ponto de atenção para o push (PA-5)

O handoff dev→architect reportava `616/616` testes. O gate reproduziu **588/588** na branch 2.7 limpa. A diferença (28 testes) são os testes da Story 2.10 paralela — o `@dev` da 2.7 correu a suite num working tree partilhado contaminado por ficheiros untracked da 2.10. **O número canónico da branch `feature/2.7-motor-recorrencia` é 588.** Não é uma falha — é imprecisão de relatório. Quando o `@devops` correr o pre-push gate na branch 2.7, deve esperar **588 testes**, não 616.

---

## Próxima acção

**`@devops` (Gage)** — `*push feature/2.7-motor-recorrencia`:
1. Push da branch para `origin`.
2. PR contra `main` — corpo do PR deve referenciar Story 2.7, FR10, ADR-2.7-1, débito D-2.7-1, e o veredicto Architect Gate PASS.
3. Pre-push gate: esperar **588 testes** na branch 2.7 (ver PA-5).
4. CI + CodeRabbit (convenção Nexus v2: CR corre server-side no PR; Self-Healing light max 2 iterações no fix loop pós-PR).
5. Push é **EXCLUSIVO do `@devops`** — Aria não empurra.

> Nota operacional: o gate correu num worktree dedicado `ecosistema-gate-2.7` (criado via `git worktree add` para isolar a branch 2.7 do gate paralelo da 2.10). O `@devops` pode fazer o push a partir desse worktree ou de outro checkout da branch — o commit do gate está na branch `feature/2.7-motor-recorrencia`. O worktree temporário pode ser removido após o push (`git worktree remove`).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (Epic 2 — Tarefas v2 + Projectos)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260520-story-2.7-gate-PASS-ready-for-devops-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Aria (@architect)`
DATA: `20/05/2026`
