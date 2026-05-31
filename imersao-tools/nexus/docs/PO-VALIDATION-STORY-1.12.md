# PO Validation — Story 1.12 (Phase 2 da 1.11)

**Validador:** Pax (`@po`) · **Data:** 31/05/2026 · **Veredicto:** **GO — 8/10 — Confidence: High**
**Story:** `imersao-tools/nexus/docs/stories/active/1.12.story.md`
**Task:** `validate-next-story` (10-point checklist + anti-hallucination + verificação independente de código)

---

## 1. Quick Summary

- **Readiness:** GO (Approved) com 3 Should-Fix vinculativos incorporados inline.
- **Implementation Readiness Score:** 8/10.
- **Confidence:** High (com os 3 findings baked-in; o `@architect` ratifica no gate de arranque, como na 1.11 com A1-A7).
- **Major gaps:** nenhum bloqueante. 3 Should-Fix (B4 refutado, AC1 verificação Dexie sobrestimada, AC2 falta UndoToast.tsx).

---

## 2. Validation Table

| Categoria | Status | Notas |
|-----------|--------|-------|
| 1. Goal & Context Clarity | PASS | Phase 2 da 1.11 claramente enquadrada; valor (undo + CI verde) explícito; dependência (1.11 Done) identificada |
| 1.1 Executor Assignment | PASS | `executor: @dev` ≠ `quality_gate: @architect`; ambos agentes conhecidos; tipo Architecture→@dev/@architect consistente; `quality_gate_tools` inclui `e2e:regression` (correcto — o AC1 É a suite) |
| 2. File Structure | **PARTIAL** | Falta `UndoToast.tsx` em "Ficheiros a modificar" (AC2 — ver F3). AC1 precisa de nota sobre exposição de `window.__nexusDB` (ver F2) |
| 3. UI/Frontend | PASS | Sem UI nova; rewiring de `UndoToast` é o único toque de UI (incorporado via F3) |
| 4. AC Satisfaction | **PARTIAL** | AC1 verificação Dexie sobrestimada (F2); AC3 scope confirm/undo refutado (F1). ACs testáveis após correcção |
| 5. Testing Instructions | PASS | Vitest+fake-indexeddb (AC2), Playwright proxy+UI (AC1), cenário de fidelidade obrigatório |
| 6. Security | N/A | Sem nova auth; key já server-only (mantida); remoção de rota é a única superfície |
| 7. Tasks Sequence | PASS | AC1→AC2→AC3 lógico e bem justificado (regression primeiro repõe CI + torna remoção segura) |
| 8. CodeRabbit Integration | PASS | Secção completa (Architecture+Integration, self-healing @dev light 2 iter, focus areas alinhadas) |
| 9. Anti-Hallucination | PASS | Todas as âncoras confirmadas em código real; zero invenções. A premissa confirm/undo "a auditar" estava correctamente marcada como hipótese, não facto — a auditoria (feita nesta validação) revela os callers |
| 10. Dev Readiness | **PARTIAL → PASS** | Com os 3 findings incorporados inline, a story fica self-contained e sem risco de rework |

---

## 3. Findings (Should-Fix — incorporados inline na story v0.2)

### F1 — AC3/B4: `/api/agent/confirm` e `/api/agent/undo` NÃO são órfãos (auditoria feita)

**Verificado em código real:**

| Endpoint | Callers vivos (não-teste) |
|----------|---------------------------|
| `/api/agent/confirm` | `components/chat/ChatPanel.tsx:138` e `:170` (`fetch('/api/agent/confirm', …)`, flow de confirmação Story 1.9) |
| `/api/agent/undo` | `components/chat/UndoToast.tsx:123` (`fetch('/api/agent/undo', …)`, botão "Anular") |

**Decisão PO:** a premissa B4 ("remover se a auditoria provar zero callers") está **factualmente refutada** — há callers de UI vivos. **AC3 estreita-se a:** remover SÓ `/api/agent/prompt` (caller único `useAgentStream` já desligado na Phase 1) + **documentar** a auditoria (callers vivos encontrados) + **registar follow-up explícito** para confirm/undo. A remoção de confirm/undo exige rewiring de `ChatPanel`/`UndoToast` (próprio scope) → **NÃO nesta story.**

### F2 — AC1: verificação "Dexie no browser" sobrestimada

**Verificado em código real:**

- `tests/e2e/regression/helpers/dexie-eval.ts` expõe **apenas** `getAgentRunsSnapshot` (lê a tabela `agentRuns` — chat-log) e `clearAgentRuns`. **Não** lê tabelas de domínio (`tasks`/`transactions`).
- `window.__nexusDB` **nunca é atribuído** em todo o `v2` (grep excluindo `dexie-eval.ts` → 0 matches). Logo `getAgentRunsSnapshot().available` é sempre `false` e as asserções Dexie do `regression.spec.ts` (`if (snapshot.available && …)`, linhas 144-156) são **inertes hoje**.
- A verificação **real** que a suite faz hoje é via **UI**: `submitResult.toolCardCount` (ToolCards), texto, `UndoToast`, estado `success` do ToolCard (`regression.spec.ts:97-157`).

**Decisão PO:** AC1 pode re-rotar ao proxy **mantendo a verificação por UI** (que funciona). Verificar "Task criada em Dexie" é **scope adicional opcional** que exige: (a) expor o singleton Dexie em `window.__nexusDB` (dev/staging, `app/layout.tsx`), (b) estender `dexie-eval.ts` com leitura de tabelas de domínio. A story deve declarar isto honestamente — não assumir que `dexie-eval.ts` já cobre efeitos de domínio.

### F3 — AC2: rewiring de `UndoToast.tsx` em falta

**Verificado em código real:**

- O undo real chega ao utilizador via `components/chat/UndoToast.tsx`, que hoje faz `fetch('/api/agent/undo', …)` (`:123`) ao clicar "Anular".
- Na Phase 1, o `undoStore` é no-op no cliente → **o undo está efectivamente desligado em produção** (o executor já não regista no KV, e o UndoToast aponta para o endpoint Edge do fluxo morto).

**Decisão PO:** AC2 (UndoStore client-side) só entrega undo funcional se `UndoToast.tsx` for **rewired** para reverter via o novo `ClientUndoStore` (em vez de POST ao endpoint Edge). **`components/chat/UndoToast.tsx` entra em "Ficheiros a modificar" do AC2.** O `@architect` confirma no gate se há mais superfície de UI (ex.: a verificação `lastStatus === 'reverted'` da suite, `regression.spec.ts:143-147`, que depende de `window.__nexusDB`).

---

## 4. Respostas aos 4 pontos do `@sm`

| # | Pergunta | Resposta PO |
|---|----------|-------------|
| **1** | Numeração 1.12 vs `1.11-phase2` | **APROVADO.** 1.12 sequencial é correcto — `1.11-phase2` quebraria o parse `{epic}.{num}` e a 1.11 já está em `completed/`. Trace explícito no título resolve a ligação. Tracker limpo. |
| **2** | confirm/undo nesta story vs follow-up | **FOLLOW-UP (ver F1).** Auditoria feita: ambos têm callers vivos de UI. AC3 estreita-se a `/api/agent/prompt` only + documentar + diferir confirm/undo. |
| **3** | Estratégia Dexie-no-browser do AC1 | **NÃO confirmada como estava (ver F2).** `dexie-eval.ts` só lê `agentRuns` e `window.__nexusDB` não é exposto. AC1 verifica via UI; verificação Dexie de domínio é scope adicional. |
| **4** | Mapeamento AC1-AC5↔1.11 | **APROVADO.** Números próprios + `(= 1.11 ACx)` com a tabela de mapeamento na Nota do `@sm` é claro. Mantém-se. |

---

## 5. Developer Perspective

Implementável como escrita **após** os 3 findings (incorporados inline na v0.2). Sem os findings, o `@dev` descobriria a meio: (a) que confirm/undo têm callers e não pode removê-los (rework do AC3), (b) que `dexie-eval.ts` não lê domínio e `window.__nexusDB` não existe (rework do AC1), (c) que o undo não funciona sem rewire do UndoToast (gap do AC2). Os findings eliminam estes 3 pontos de rework — exactamente o objectivo do gate PO antes do CodeRabbit (cumpre o espírito de `react-component-test-criteria.md` A2 e `external-contract-identifiers.md`).

**Próximo passo SDC:** `@dev *develop 1.12` com gate `@architect` — que ratifica B1-B4 (do `@sm`) **+** F1/F2/F3 (do `@po`) no arranque, e decide a ordem/scope final.
