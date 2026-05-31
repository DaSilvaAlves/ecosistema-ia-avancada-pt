# RETOMA — Story 1.12 (Phase 2 da 1.11) Draft criada · pronta para validação `@po`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** sm (River)
**to_agent:** po (Pax)
**created:** 2026-05-31
**status:** consumed
**consumed:** true
**consumed_at:** 2026-05-31
**consumed_by:** po (Pax)
**consumed_note:** Pax (`@po`) executou `*validate-story-draft 1.12` → **GO 8/10, Confidence High**. Status `Draft → Approved`. Verificação independente de código revelou 3 Should-Fix incorporados inline (v0.2): F1 (confirm/undo têm callers vivos — `ChatPanel.tsx:138,170` + `UndoToast.tsx:123` — não órfãos → AC3 só remove `prompt`, confirm/undo a follow-up), F2 (AC1 verifica por UI; `dexie-eval.ts` só lê `agentRuns` + `window.__nexusDB` nunca exposto), F3 (AC2 exige rewiring de `UndoToast.tsx`, adicionado a Ficheiros a modificar). 4 pontos do `@sm` respondidos (numeração 1.12 OK; confirm/undo follow-up; Dexie via UI; mapeamento OK). Doc `docs/PO-VALIDATION-STORY-1.12.md`. Handoff de saída `RETOMA-20260531-story-1.12-approved-ready-for-dev-develop.md` criado para `@dev *develop 1.12` com gate `@architect`.

## Summary

River (`@sm`) executou `*draft` da **Phase 2 da Story 1.11** (decisão do Eurico: Phase 2 vs Epic 4). Criada **Story 1.12** em `docs/stories/active/1.12.story.md` (Status **Draft**). É a continuação directa da Story 1.11 (Done Phase 1 em `main`, PR #44 `d0f2739c`), executando os 3 AC que o Architect Gate v0.4 atribuiu à Phase 2. story-draft-checklist: **READY, clarity 9/10**. Próximo passo SDC: `@po *validate-story-draft 1.12`.

## Estado

| Item | Valor |
|------|-------|
| Story | `imersao-tools/nexus/docs/stories/active/1.12.story.md` |
| Status | **Draft** |
| Epic | 1 — Cérebro Multi-Intent (hardening pós-Epic; Phase 2 da 1.11) |
| Numeração | **1.12** (sequencial; `1.11` fechada em `completed/`; formato `{epic}.{num}` parseável) |
| Git | `main` sincronizado (HEAD `d007fa91`), `active/` só com a 1.12 nova |

## AC da Story 1.12 (herdados da 1.11)

| AC 1.12 | = 1.11 | Âmbito | [Dec] |
|---------|--------|--------|-------|
| AC1 | AC11 | Regression 50-prompt E2E re-rotada `**/api/agent/prompt` → `**/api/anthropic/proxy` + Dexie no browser | A4/A5, D2 |
| AC2 | AC8 | UndoStore client-side (`lib/agent/client-undo-store.ts`, in-memory + timer 30s) | A4 |
| AC3 | AC10 | Remoção física `/api/agent/prompt` + auditoria callers `/confirm` e `/undo` | A5 |
| AC4 | — | Fechar concern `noKvStub` vs Epic 4 (nenhuma tool nova usa `ctx.kv` no client) | gate §6 |
| AC5 | — | Qualidade + `e2e:regression` verde (evidência local — `not-tested-trailer-rules.md`) | NFR |

**Ordem de execução: AC1 → AC2 → AC3** (handoff da 1.11: regression primeiro repõe o sinal de CI verde e torna a remoção do AC3 segura).

## Âncoras verificadas em código real (no draft, princípio No Invention)

- `executor.ts:222` `undoStore?: UndoStore` injectável · `:752-756` `register` chamado · `:511-527` `noKvStub` falha-loud · `:22` `UNDO_TTL_SECONDS`
- `app/api/agent/{prompt,confirm,undo}/route.ts` existem · `prompt/route.ts:18` já `@deprecated`+`console.warn`
- `client-undo-store.ts` **não existe** (é o AC2 a criar)
- `tests/e2e/regression/helpers/route-handler.ts:68,122,132,133` intercepta `**/api/agent/prompt` · `dexie-eval.ts` + `tests/mocks/proxy-fetch.ts` reutilizáveis

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-story-1.12-draft-ready-for-po-validation.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Pontos para o `@po` confirmar na validação

1. **Numeração 1.12** — aceitável como Phase 2 da 1.11 (vs `1.11-phase2`)? River escolheu 1.12 por ser sequencial e parseável `{epic}.{num}`.
2. **B4 — `confirm`/`undo`**: sair nesta story (se auditoria provar zero callers) ou follow-up? Decisão final do `@architect` no gate de arranque.
3. **AC1 — estratégia Dexie-no-browser**: confirmar que `dexie-eval.ts` cobre a verificação de efeitos de domínio no fluxo re-rotado.
4. **Mapeamento de AC**: a story usa números próprios (AC1-AC5) com o `(= 1.11 ACx)` entre parênteses — confirmar que não gera confusão no tracker.

## next_action

`@po *validate-story-draft 1.12` (10-point checklist). Se GO → `@dev *develop 1.12` com gate `@architect` (que ratifica B1-B4 + a ordem AC1→AC2→AC3). Hard-stop EPIC §8: máx 2 iter CodeRabbit; Iter 3 ou merge waived exigem autorização humana. `gh pr` sempre com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-story-1.12-draft-ready-for-po-validation.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `River (@sm)`
DATA: `31/05/2026`
