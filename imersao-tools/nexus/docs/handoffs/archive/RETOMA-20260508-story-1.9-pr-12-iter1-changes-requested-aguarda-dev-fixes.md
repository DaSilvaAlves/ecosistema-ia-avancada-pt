# RETOMA — Story 1.9 PR #12 Iter 1 CHANGES_REQUESTED → @dev *qa-loop-fix

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 08/05/2026
**Autor:** Gage (@devops)
**Para:** Dex (@dev)
**Acção esperada:** `@dev *qa-loop-fix 1.9` — fixes Iter 2 baseados em CodeRabbit Iter 1 (8 actionables + 4 nitpicks)

---

## TL;DR

PR #12 push'ed `fb4ed57f` OK, CI core PASS (Lint+TS, Vitest 299/299, Playwright, CodeQL, Vercel preview). CodeRabbit Iter 1 verdict **CHANGES_REQUESTED** com 8 actionable comments (3 majors técnicos + 5 minors) + 4 nitpicks. Handoff entra agora no @dev para fixes Iter 2.

| Item | Valor |
|------|-------|
| PR | [#12](https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/12) |
| Branch | `feat/nexus-v2-story-1.9-ui-chat-consumer` |
| Head SHA | `fb4ed57f` |
| Base | `main@f8723a0d` (Story 1.8 merged) |
| CR Iter 1 verdict | **CHANGES_REQUESTED** |
| CR Status check | `pass` ("Review completed") |
| Reviews count | 1 (coderabbitai @ 17:57Z) |
| Actionables | 8 (3 majors + 5 minors) |
| Nitpicks | 4 (3 imports + 1 test branches) |
| CI core | PASS (Lint+TS, Vitest, Playwright, CodeQL, Vercel) |
| CI tech debt | Coverage Report + Record Quality Metrics fail (pre-existing infra) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Status checks PR #12 @ HEAD `fb4ed57f`

### CI core (PASS — relevantes para merge)

| Check | Status | Detalhe |
|-------|--------|---------|
| Lint + TypeScript | pass | 40s |
| Vitest unit + coverage | pass | 38s |
| Playwright E2E + bundle key check | pass | 1m30s |
| CodeQL Analyze (javascript-typescript) | pass | 1m39s |
| CodeQL Analyze (actions) | pass | 59s |
| Vercel | pass | Deployment completed |
| Vercel Preview Comments | pass | — |
| **CodeRabbit** | **pass** | Review completed |
| CodeRabbit Status | pass | 3s |

### Tech debt pre-existing (FAIL — não bloqueante)

| Check | Status | Histórico |
|-------|--------|-----------|
| Coverage Report | fail | Falha consistente desde Story 1.5 (infra workflow) |
| Record Quality Metrics | fail | Falha consistente desde Story 1.5 (infra workflow) |

Estes 2 checks falham desde Story 1.5 — não relacionados com Story 1.9. **Não bloquear merge waived.**

---

## Reviews snapshot

```json
{
  "reviewDecision": "CHANGES_REQUESTED",
  "reviewCount": 1,
  "latestReview": {
    "author": "coderabbitai",
    "state": "CHANGES_REQUESTED",
    "submittedAt": "2026-05-08T17:57:05Z"
  }
}
```

---

## CodeRabbit Iter 1 — 8 ACTIONABLE comments

### MAJORS (3) — devem ser corrigidos

#### 1. ChatPanel.tsx ~L150-187 — Stream/persisted message duplication

**Issue:** Component renders both `stream.events` (live) AND `persistedMessages` (Dexie). Quando run termina (`done`), `addChatMessage(assistant)` persiste em Dexie, mas `stream.events` ainda contém o assistant text até `reset()` ser chamado. Bubble pode aparecer duas vezes.

**Fix:** Detectar runId em stream events; se `persistedMessages` já contém mensagem com mesmo runId (ou `stream.status === 'finished'`), suprimir o stream bubble. Usar identificadores únicos (`stream.events[].runId` vs `persistedMessages[].runId`).

#### 2. MessageList.tsx ~L115-123 — Reducer key colapsa multiple invocations

**Issue:** Reducer usa `event.toolName` como Map key. Se um agent chama o mesmo tool múltiplas vezes na mesma run (ex: 2 web-fetch sequenciais), as 2 invocations colapsam-se num único ToolCard.

**Fix:** Usar identificador per-invocation:
- Preferir `event.invocationId` ou `event.id` ou `requestId` (se já existe no protocolo SSE)
- Caso contrário, gerar `invocationId` em `tool_start` e propagar para `tool_complete`/`tool_error`/`preview_request`/`preview_confirmed`
- Usar este id para reducer Map key

**Nota:** Verificar primeiro se Story 1.5 (executor) já emite `invocationId` no SSE. Se não, é cross-story — reportar.

#### 3. ToolCard.tsx ~L359-396 — `<style jsx>` inválido

**Issue:** Block `<style jsx>{...}</style>` não funciona — `styled-jsx` não está instalado. React trata `jsx` como atributo HTML inválido. Keyframes `pulse-cyan` e `pulse-gold-slow` não são aplicados (ou aplicados como global por acidente).

**Fix:** 3 opções:
- **A (recomendada):** Remover `jsx` attribute → `<style>` global plain (keyframes ficam globals)
- **B:** Mover keyframes para CSS file (ex: `app/globals.css`) ou CSS module importado
- **C:** Instalar `styled-jsx` + configurar Next/Vitest (mais complexo, evita)

Validar visualmente que `pulse-cyan` 1.5s e `pulse-gold-slow` 2.4s continuam a funcionar após o fix.

### MINORS (5)

#### 4. ChatPanel.tsx ~L97-126 — handleConfirmPreview/handleCancelPreview silenciam erros

**Issue:** Handlers chamam `setPendingPreview(null)` sempre, mesmo em response 4xx/5xx. Erro do server fica silenciado — UX pensa que foi confirmado.

**Fix:**
```typescript
const res = await fetch(...);
if (!res.ok) {
  console.error('Confirm failed', res.status, await res.text());
  // Surface error to user (toast Magenta? aria-live?)
  return; // NÃO chamar setPendingPreview(null)
}
setPendingPreview(null);
```

#### 5. MessageList.tsx ~L230-239 — distanceFromBottom calculado pós-update

**Issue:** `useEffect` usa `containerRef.scrollHeight - scrollTop - clientHeight` DEPOIS do DOM update. Large inserts podem empurrar utilizador além dos 80px threshold antes da medição.

**Fix:** Usar `useLayoutEffect` para snapshot pre-update em ref:
```typescript
const prevDistanceRef = useRef(0);
useLayoutEffect(() => {
  if (!containerRef.current) return;
  prevDistanceRef.current = containerRef.scrollHeight - scrollTop - clientHeight;
}, [bubbles, events.length]);

useEffect(() => {
  const wasAtBottom = prevDistanceRef.current <= 80;
  if (wasAtBottom) scrollTo(...);
}, [bubbles, events.length]);
```

#### 6. UndoToast.tsx ~L249-273 — aria-label pluralização

**Issue:** aria-label sempre plural "Anular N acções". Para `undoableToolCount === 1` deveria ser "Anular 1 acção".

**Fix:**
```typescript
aria-label={`Anular ${undoableToolCount} ${undoableToolCount === 1 ? 'acção' : 'acções'}`}
```

#### 7. UndoToast.test.tsx ~L119-125 — matcher fragile

**Issue:** Test usa `screen.getByRole('button', { name: /anular 1 acções/i })` — vai partir após pluralização fix.

**Fix:** Matcher tolerante:
```typescript
screen.getByRole('button', { name: /anular 1 acç(ão|ões)/i })
// OU mais robusto:
screen.getByRole('button', { name: /anular 1/i })
```

#### 8. useAgentStream.ts ~L332-380 — submit sem AbortController

**Issue:** Submit dispara fetch/stream sem mecanismo de cancellation. Se utilizador chama `submit()` 2x rapidamente, ou unmount durante stream, o stream antigo continua + Dexie side-effects executam (race conditions).

**Fix:**
```typescript
const controllerRef = useRef<AbortController | null>(null);

const submit = useCallback(async (prompt: string) => {
  // Abort qualquer controller anterior
  controllerRef.current?.abort();
  const controller = new AbortController();
  controllerRef.current = controller;

  const response = await fetch('/api/agent/prompt', {
    signal: controller.signal,
    // ...
  });
  // Passar signal a consumeStream se necessário
}, []);

const reset = useCallback(() => {
  controllerRef.current?.abort();
  // ...
}, []);

useEffect(() => {
  return () => controllerRef.current?.abort(); // cleanup unmount
}, []);
```

---

## CodeRabbit Iter 1 — 4 NITPICKS

| # | Ficheiro | Issue | Fix |
|---|----------|-------|-----|
| N1 | UndoToast.tsx ~L84-110 | `onDismiss` em useEffect deps causa restart do timer em cada parent re-render | Pattern `onDismissRef` (já feito para `pausedRef`/`dismissedRef`) |
| N2 | MessageList.tsx ~L3-7 | Sibling import `'./ToolCard'` em vez de absolute alias | Usar `@/...` alias do projecto |
| N3 | ChatPanel.tsx ~L4-6 | Sibling imports `'./MessageList'`, `'./InputBox'`, `'./UndoToast'` | Usar `@/...` alias do projecto |
| N4 | InputBox.test.tsx ~L14-40 | Test só cobre legacy send/keyboard path — falta `streamingState` branches | Adicionar tests para `streaming`, `preview-pending`, `null/undefined` (textarea disabled, placeholder, aria-describedby, onSend não invocado) |

---

## Recomendação @dev (Iter 2)

### Prioridade 1 (CRITICAL — fix obrigatório)

1. **MAJOR #5 ToolCard `<style jsx>`** — quebra animações em produção. Provavelmente `pulse-cyan` e `pulse-gold-slow` não funcionam. **Fix Opção A** (remover `jsx` attribute → `<style>` global).
2. **MAJOR #7 useAgentStream AbortController** — race conditions em submit duplicado / unmount. Implementar pattern.
3. **MAJOR #1 ChatPanel stream/persisted dedup** — UX issue real (bubble duplicado).
4. **MAJOR #3 MessageList invocationId** — confirmar primeiro se Story 1.5 emite `invocationId`. Se sim, usar. Se não, gerar localmente em `tool_start`.

### Prioridade 2 (MINORS)

5. **MINOR #4 ChatPanel preview error handling** — não silenciar 4xx/5xx
6. **MINOR #6 UndoToast pluralização aria-label** + **MINOR #8 test matcher** (fix together)
7. **MINOR #2 MessageList scroll position pre-update** (useLayoutEffect)

### Prioridade 3 (NITPICKS — quick wins)

8. **N1 UndoToast onDismissRef** — pattern já estabelecido na própria componente
9. **N2+N3 absolute imports** — find/replace simples (3 ficheiros)
10. **N4 InputBox.test.tsx streamingState branches** — completar coverage do extend

### Quality gates esperados após Iter 2

| Gate | Comando | Esperado |
|------|---------|----------|
| Lint | `npm run lint` | 0 warnings |
| Typecheck | `npm run typecheck` | exit 0 |
| Tests | `npm run test:unit` | 299+/299+ (4-6 novos para InputBox streamingState) |
| Build | `npm run build` | edge runtime preservado |
| Coverage AC11 | `npm run test:coverage` | manter thresholds (useAgentStream/ToolCard/UndoToast/InputBox >= 85% / 75%) |

---

## Hard-Stop Policy aplicável (precedente Stories 1.5/1.6/1.7/1.8)

- **Iter 2 = última iteração automática.**
- Se CR Iter 2 ainda CHANGES_REQUESTED com majors → **escalação Eurico** com 3 opções (A merge waived / B Iter 3 com aprovação / C reverter).
- **Iter 3 PROIBIDA sem aprovação explícita do Eurico.**

Esta Iter 1 trouxe issues técnicos legítimos (especialmente ToolCard `<style jsx>` e AbortController) — diferente do padrão Stories 1.5-1.8 onde Iter 1 trouxe issues marginais. Espera-se que Iter 2 resolva todos os majors e converja para PASS.

---

## Próxima acção

```text
@dev *qa-loop-fix 1.9
```

1. Implementar fixes em prioridade 1 → 2 → 3
2. Re-correr quality gates 5/5
3. Commit `fix(nexus-v2): Iter 2 fixes para Story 1.9 [Story 1.9]`
4. Handoff `@devops *push` com resumo dos fixes aplicados

---

## Arquivos afectados pela Iter 2 (estimativa)

| Ficheiro | Tipo de fix |
|----------|-------------|
| `imersao-tools/nexus/v2/components/chat/ToolCard.tsx` | MAJOR `<style jsx>` |
| `imersao-tools/nexus/v2/hooks/useAgentStream.ts` | MAJOR AbortController |
| `imersao-tools/nexus/v2/components/chat/ChatPanel.tsx` | MAJOR dedup + MINOR error handling + N3 imports |
| `imersao-tools/nexus/v2/components/chat/MessageList.tsx` | MAJOR invocationId + MINOR scroll + N2 imports |
| `imersao-tools/nexus/v2/components/chat/UndoToast.tsx` | MINOR pluralização + N1 onDismissRef |
| `imersao-tools/nexus/v2/components/chat/InputBox.tsx` | (nenhum se test cobrir) |
| `imersao-tools/nexus/v2/tests/unit/components/chat/UndoToast.test.tsx` | MINOR matcher fix |
| `imersao-tools/nexus/v2/tests/unit/components/InputBox.test.tsx` | N4 streamingState branches |
| `imersao-tools/nexus/docs/stories/active/1.9.story.md` | Change Log v0.5 |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.9-pr-12-iter1-changes-requested-aguarda-dev-fixes.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@devops` (Gage)
DATA: `08/05/2026`
