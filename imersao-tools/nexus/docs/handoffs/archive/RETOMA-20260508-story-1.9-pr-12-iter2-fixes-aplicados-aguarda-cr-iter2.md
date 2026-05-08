# RETOMA — Story 1.9 PR #12 Iter 2 fixes aplicados → @devops *push (CR Iter 2)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 08/05/2026
**Autor:** Dex (@dev)
**Para:** Gage (@devops)
**Acção esperada:** `@devops *push` — push 6 commits Iter 2 para `feat/nexus-v2-story-1.9-ui-chat-consumer`, aguarda CodeRabbit Iter 2

---

## TL;DR

Story 1.9 Iter 2 fixes aplicados em resposta a CodeRabbit Iter 1 CHANGES_REQUESTED
(8 actionable comments + 4 nitpicks). Os 4 majors técnicos legítimos foram
todos endereçados; minors e nitpicks também aplicados. 22 tests novos
adicionados (321/321 PASS, +22 vs baseline 299). Quality gates 5/5 PASS.

| Item | Valor |
|------|-------|
| Branch | `feat/nexus-v2-story-1.9-ui-chat-consumer` |
| HEAD local | `46969755` |
| Base | `main@f8723a0d` (Story 1.8 merged) |
| Commits Iter 2 | 6 (9b6d656c → 46969755) |
| Tests | 321/321 PASS (+22 vs Iter 1 baseline) |
| Coverage components/chat | 87.16% lines (>85% AC11 target) |
| Quality gates | 5/5 PASS |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Commits Iter 2 (6 commits granulares)

```
46969755 docs(nexus-v2): Story 1.9 file maintenance Iter 2 + Change Log v0.5
a92abc10 test(nexus-v2): InputBox streamingState branches + coverage scope
1603d017 fix(nexus-v2): ChatPanel dedup + UndoToast plural + tests Iter 2
ba3f5ff7 fix(nexus-v2): AbortController em useAgentStream submit/unmount
43a8b268 fix(nexus-v2): migra keyframes de <style jsx> para globals.css
9b6d656c feat(nexus-v2): toolCallId? opcional em SSE events tool_*/preview_*
```

---

## Issues CodeRabbit Iter 1 endereçados

### MAJORS (4) — todos endereçados

| # | Issue | Solução | Commit |
|---|-------|---------|--------|
| 1 | ChatPanel duplica live bubble + persisted ChatMessage com mesmo runId | `dedupedMessages` filter por `currentRunId` | 1603d017 |
| 2 | MessageList key=toolName colapsa múltiplas invocations | Executor adiciona `toolCallId?` opcional + reducer usa `toolCallId` ou fallback `toolName#index` | 9b6d656c + 43a8b268 |
| 3 | ToolCard `<style jsx>` inert (styled-jsx não instalado) | Keyframes migrados para `globals.css` com prefixo `nexus-*`; ThinkingIndicator do MessageList também | 43a8b268 |
| 4 | useAgentStream submit sem AbortController (race em duplo-submit/unmount) | `controllerRef` per-hook + cleanup unmount + abort em reset() + signal em fetch+consumeStream | ba3f5ff7 |

### MINORS (5) — todos endereçados

| # | Issue | Solução | Commit |
|---|-------|---------|--------|
| 4 | ChatPanel preview handlers silenciam 4xx/5xx | `res.ok` check + banner aria-live="assertive" via `previewError` state | 1603d017 |
| 5 | MessageList scroll calculado pós-update | `useLayoutEffect` snapshot pre-update em `prevDistanceRef` | 43a8b268 |
| 6 | UndoToast aria-label sempre plural | `Anular ${N} ${N === 1 ? 'acção' : 'acções'}` | 1603d017 |
| 7 | UndoToast.test matcher fragile | Matcher tolerante `/anular 1 acç(ão|ões)/i` + test plural específico | 1603d017 |
| 8 | InputBox.test faltam streamingState branches | 6 tests novos cobrindo idle/streaming/preview-pending/disabled-legacy | a92abc10 |

### NITPICKS (4) — todos endereçados

| # | Issue | Solução | Commit |
|---|-------|---------|--------|
| N1 | UndoToast onDismiss em deps causa restart timer | `onDismissRef` pattern (já usado para pausedRef/dismissedRef) | 1603d017 |
| N2 | MessageList sibling import './ToolCard' | `@/components/chat/ToolCard` | 43a8b268 |
| N3 | ChatPanel sibling imports | `@/components/chat/{MessageList,InputBox,UndoToast}` | 1603d017 |
| N4 | InputBox.test legacy-only | 6 streamingState branches (overlap com Minor #8) | a92abc10 |

---

## Quality gates Iter 2 — 5/5 PASS

```bash
$ npm run lint
0 erros, 1 warning pre-existing (NextResponse unused em logout/route.ts)

$ npm run typecheck
exit 0

$ npm run test:unit
Test Files  26 passed (26)
     Tests  321 passed (321)   # +22 vs Iter 1 baseline (299)
  Duration  10.16s

$ npm run build
✓ Compiled successfully
12 routes (10 dynamic + 2 static), edge runtime preservado em api/agent/*

$ npm run test:coverage
Coverage report from v8
All files          |   87.71 |    87.5  |   92.91 |   87.71
 components/chat   |   87.16 |   89.51  |    84   |   87.16  <-- AC11 target 85% PASS
  ChatPanel.tsx    |   63.93 |   82.14  |   100   |   63.93  (NEW scope, dedup tests)
  InputBox.tsx     |   98.33 |   87.8   |   100   |   98.33
  MessageList.tsx  |   80.57 |   90.54  |    80   |   80.57  (NEW scope, toolCallId tests)
  ToolCard.tsx     |   99.14 |   95.08  |   100   |   99.14
  UndoToast.tsx    |   95.65 |   86.36  |    60   |   95.65
 hooks             |   89.39 |   72     |   100   |   89.39
  useAgentStream.ts|   89.39 |   72     |   100   |   89.39  (+0.7pp Iter 2)
 lib/agent         |   96.15 |   88.7   |   96.15 |   96.15
  executor.ts      |   94.67 |   87.15  |   100   |   94.67
```

---

## Tests novos Iter 2 (22 tests)

| Ficheiro | Tests | Cobertura |
|----------|-------|-----------|
| `tests/unit/components/chat/MessageList.test.tsx` | 7 NEW | toolCallId distintos = 2 cards · fallback toolName#index · preview→confirm→complete mesmo toolCallId = 1 card · animation classes nexus-pulse-cyan/gold-slow/tool-card-enter · welcome bubble |
| `tests/unit/components/chat/ChatPanel.test.tsx` | 5 NEW | dedup com agentRunId · sem dedup currentRunId null · persisted undefined safe · erro 500 surfaced · erro de rede surfaced PT-PT |
| `tests/unit/hooks/useAgentStream.test.ts` | 3 NEW | duplo submit aborta anterior · unmount aborta · reset() aborta + limpa state |
| `tests/unit/components/chat/UndoToast.test.tsx` | 1 NEW | aria-label pluralização exact-match singular/plural |
| `tests/unit/components/InputBox.test.tsx` | 6 NEW | idle/streaming/preview-pending placeholder + disabled + onSend bloqueado |

---

## Decisões IDS (Iter 2)

1. **toolCallId opcional (`?`) em SSE events** — breaking change em events
   seria custo elevado para 39 tests do executor + Stories 1.5-1.8 já merged.
   Opcional permite migração gradual e UI tem fallback.
2. **Keyframes globais com prefixo `nexus-*`** (em vez de CSS modules) —
   minimiza mudanças, evita criar build pipeline novo. Keyframes de chat
   centralizadas em `globals.css`.
3. **Erro de preview confirm/cancel via banner aria-live** (em vez de toast
   Magenta separado) — utilizador deve ouvir o erro imediatamente (screen
   readers); banner é menos código e suficiente para AC9 WCAG.

---

## Próxima acção

```text
@devops *push
```

1. Push branch `feat/nexus-v2-story-1.9-ui-chat-consumer` para origem (HEAD `46969755`)
2. Aguardar CI core (Lint+TS, Vitest, Playwright, CodeQL, Vercel) e CodeRabbit Iter 2
3. Se CR Iter 2 APPROVED ou só nits docs-only → caminho normal (CR closure ou merge waived)
4. Se CR Iter 2 ainda CHANGES_REQUESTED com majors → **PARA, escala ao Eurico** (hard-stop policy precedente Stories 1.5/1.6/1.7/1.8 — Iter 3 PROIBIDA sem aprovação explícita)

---

## Hard-Stop Policy aplicável (precedente Stories 1.5/1.6/1.7/1.8)

| Iter 2 verdict | Próxima acção |
|----------------|---------------|
| APPROVED | Merge waived → @sm draft Story 1.10 |
| Só nitpicks docs-only | CR closure commit + merge waived → @sm draft Story 1.10 |
| **CHANGES_REQUESTED com majors** | **PARA — escalação Eurico (3 opções: A merge waived / B Iter 3 com aprovação / C reverter)** |

**Iter 3 PROIBIDA sem aprovação explícita do Eurico.**

---

## Files modificados Iter 2

| Ficheiro | Linhas | Tipo |
|----------|--------|------|
| `imersao-tools/nexus/v2/lib/agent/executor.ts` | +23 -2 | UPDATE (toolCallId opcional) |
| `imersao-tools/nexus/v2/styles/globals.css` | +46 -0 | UPDATE (keyframes nexus-*) |
| `imersao-tools/nexus/v2/components/chat/ToolCard.tsx` | +13 -39 | UPDATE (style jsx removido) |
| `imersao-tools/nexus/v2/components/chat/MessageList.tsx` | +89 -41 | UPDATE (toolCallId key + scroll fix) |
| `imersao-tools/nexus/v2/components/chat/ChatPanel.tsx` | +98 -10 | UPDATE (dedup + error + imports) |
| `imersao-tools/nexus/v2/components/chat/UndoToast.tsx` | +14 -7 | UPDATE (plural + onDismissRef) |
| `imersao-tools/nexus/v2/hooks/useAgentStream.ts` | +75 -2 | UPDATE (AbortController) |
| `imersao-tools/nexus/v2/tests/unit/components/chat/MessageList.test.tsx` | +212 -0 | NEW (7 tests) |
| `imersao-tools/nexus/v2/tests/unit/components/chat/ChatPanel.test.tsx` | +234 -0 | NEW (5 tests) |
| `imersao-tools/nexus/v2/tests/unit/hooks/useAgentStream.test.ts` | +156 -0 | UPDATE (3 abort tests) |
| `imersao-tools/nexus/v2/tests/unit/components/chat/UndoToast.test.tsx` | +20 -2 | UPDATE (matcher + plural test) |
| `imersao-tools/nexus/v2/tests/unit/components/InputBox.test.tsx` | +51 -0 | UPDATE (6 streamingState tests) |
| `imersao-tools/nexus/v2/vitest.config.ts` | +4 -0 | UPDATE (coverage scope) |
| `imersao-tools/nexus/docs/stories/active/1.9.story.md` | +99 -7 | UPDATE (DAR Iter 2 + Change Log v0.5) |

**Total:** 14 ficheiros, +1134 -110 linhas líquidas.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.9-pr-12-iter2-fixes-aplicados-aguarda-cr-iter2.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@dev` (Dex)
DATA: `08/05/2026`
