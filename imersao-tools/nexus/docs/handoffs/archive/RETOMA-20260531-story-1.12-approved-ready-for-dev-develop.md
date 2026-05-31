# RETOMA — Story 1.12 (Phase 2 da 1.11) Approved · pronta para `@dev *develop` (gate `@architect`)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** po (Pax)
**to_agent:** dev (Dex) — gate `@architect` (Aria)
**created:** 2026-05-31
**status:** consumed
**consumed:** true
**consumed_at:** 2026-05-31
**consumed_by:** dev (Dex)

> CONSUMIDO por Dex (`@dev`). Gate de arranque `@architect` (PROCEED-WITH-CHANGES) + FLAG resolvida (Opção D + seeding, `ARCHITECT-GATE-STORY-1.12.md` §4.4). `*develop 1.12` completo: AC1-AC5, quality gate local GREEN (e2e:regression 30/30), CR Iter 1 = 2 minor. Story `Approved → Ready for Review`. Handoff de saída: `RETOMA-20260531-story-1.12-ready-for-architect-final-gate.md` (Pending) para gate final `@architect`.

## Summary

Pax (`@po`) validou a **Story 1.12** (Phase 2 da 1.11): **GO 8/10, Confidence High**, Status **Approved**. A validação fez verificação independente de código e incorporou **3 Should-Fix inline (v0.2)**. Próximo passo SDC: `@dev *develop 1.12` com gate `@architect` (que ratifica as B1-B4 do `@sm` **e** as F1/F2/F3 do `@po` no arranque, e decide scope/ordem final). Hard-stop EPIC §8: máx 2 iter CodeRabbit.

## Estado

| Item | Valor |
|------|-------|
| Story | `imersao-tools/nexus/docs/stories/active/1.12.story.md` (v0.2) |
| Status | **Approved** |
| Doc validação | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.12.md` |
| Executor / Gate | `@dev` / `@architect` (`quality_gate_tools: [lint, typecheck, vitest, build, e2e:regression]`) |
| Ordem | AC1 → AC2 → AC3 (regression primeiro repõe CI verde + torna remoção segura) |

## 3 Should-Fix do PO (vinculativos — já inline na story v0.2)

| # | Onde | Decisão |
|---|------|---------|
| **F1** | AC3/B4 | `/api/agent/confirm` (callers `ChatPanel.tsx:138,170`) e `/api/agent/undo` (caller `UndoToast.tsx:123`) **NÃO são órfãos**. AC3 estreita-se a remover SÓ `/api/agent/prompt` + documentar auditoria + **follow-up** para confirm/undo (rewiring de UI é próprio scope). NÃO remover confirm/undo. |
| **F2** | AC1 | `dexie-eval.ts` só lê `agentRuns`; `window.__nexusDB` **nunca exposto** no v2 → asserções Dexie inertes. AC1 verifica por **UI** (ToolCards — mecanismo real actual). Verificação Dexie de domínio (`tasks`/`transactions`) = scope adicional opcional (expor singleton + estender helper) — decisão do `@architect`. |
| **F3** | AC2 | Undo real passa por `UndoToast.tsx:123` (POST `/api/agent/undo`, fluxo Edge morto na Phase 1 → undo desligado em produção). AC2 exige **rewiring de `UndoToast.tsx`** ao `ClientUndoStore`. Já adicionado a "Ficheiros a modificar". |

## Âncoras verificadas (PO, independente do `@sm`)

- `executor.ts:45-51` interface `UndoStore` (método `register(runId, reversibleToolCalls)`) · `:222` `undoStore?` injectável · `:511-527` `noKvStub` · `:752-756` `register` chamado
- `components/chat/ChatPanel.tsx:138,170` POST `/api/agent/confirm` · `components/chat/UndoToast.tsx:123` POST `/api/agent/undo` (callers VIVOS)
- `tests/e2e/regression/regression.spec.ts:97-157` verifica por UI; `dexie-eval.ts` só `agentRuns`; `window.__nexusDB` 0 atribuições no v2
- `prompt/route.ts:18` `@deprecated` (caller único `useAgentStream` já desligado na Phase 1)

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-story-1.12-approved-ready-for-dev-develop.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## next_action

`@dev *develop 1.12` — modo conforme `dev-develop-story`. **Gate `@architect` (Aria) no arranque** ratifica B1-B4 (do `@sm`) + F1/F2/F3 (do `@po`) e decide:
1. Se a verificação Dexie de domínio (F2) entra ou se AC1 fica só UI.
2. Se confirm/undo ficam estritamente follow-up (F1) — recomendação PO: SIM.
3. Superfície de UI do rewiring de undo (F3 — UndoToast + possível `regression.spec.ts:143-147`).

Hard-stop §8: máx 2 iter CR; Iter 3 ou merge waived exigem autorização humana no commit. `gh pr` sempre `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-story-1.12-approved-ready-for-dev-develop.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Pax (@po)`
DATA: `31/05/2026`
