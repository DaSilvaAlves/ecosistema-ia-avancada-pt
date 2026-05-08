# RETOMA — Story 1.8 PR #11 CR Iter 1 CHANGES_REQUESTED → @dev Dex fixes

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 08/05/2026
**Autor:** Gage (@devops)
**Para:** Dex (@dev)
**Acção:** `@dev *qa-loop-fix 1.8`

---

## TL;DR

PR #11 https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/11 push'ed com 5 commits (4 implementação Story 1.8 + 1 admin chore handoff). Quality Gates locais 5/5 PASS. CI verde nos pontos relevantes (Lint+TS, Vitest 264/264, Build 12/12, CodeQL, Vercel Preview SUCCESS). Coverage Report + Record Quality Metrics fail = tech debt pre-existing aceitável (precedente Stories 1.4/1.5/1.6/1.7 — não bloqueia).

**CR Iter 1 verdict: CHANGES_REQUESTED** com 2 actionable + 2 nitpicks + 1 outside-diff + 1 inline (markdown). **Note: CR Status check no head SHA `38785e7d` é `SUCCESS` mas review formal é `CHANGES_REQUESTED`.** Limite hard-stop: max 2 iters automáticas.

---

## Estado actual

| Item | Valor |
|------|-------|
| PR | #11 https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/11 |
| Branch | `feat/nexus-v2-story-1.8-agent-prompt-endpoint` |
| Head SHA | `38785e7d` |
| CR Iter 1 | CHANGES_REQUESTED (2 actionable + 2 nitpicks + 1 outside-diff + 1 inline MD040) |
| CR Status check | SUCCESS (no head SHA) |
| Vercel Preview | SUCCESS |
| CI relevante | PASS (Lint+TS, Vitest 264/264, CodeQL, Playwright, Validation Summary) |
| CI tech debt aceitável | Coverage Report + Record Quality Metrics FAILURE (precedente Stories 1.4/1.5/1.6/1.7) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO A QUE SE REFERE: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## CR Iter 1 — Issues a resolver

### (1) ACTIONABLE — Inline `lib/agent/kv-confirmation-provider.ts` L137-155

**Severidade:** Outside-diff range comment + Actionable
**Tipo:** Robustness — try/catch around `kvClient.get`

**O que CR diz:**

> Wrap the call to `this.kvClient.get` inside a try/catch in `requestConfirmation` so transient KV read errors don't escape; if `get` throws, log the error with `kvConfirmLogger.error` (include `runId`, `toolName` and the error message) and return the safe default `'cancel'` (optionally attempt the same best-effort cleanup via `this.kvClient.del` wrapped in try/catch as done below), leaving the existing polling loop using `CONFIRM_POLL_INTERVAL_MS` and deadline unchanged.

**Acção:** Em `imersao-tools/nexus/v2/lib/agent/kv-confirmation-provider.ts`, dentro do polling loop em `requestConfirmation`, envolver a chamada `await this.kvClient.get(...)` num `try/catch`. No `catch`, logar `kvConfirmLogger.error('[KvProvider] KV read failed', { runId, toolName, error: errMsg })` e retornar `'cancel'` (default seguro) com cleanup best-effort. Loop polling intervalo + deadline mantidos.

**Validação:** Adicionar teste em `tests/unit/agent/kv-confirmation-provider.test.ts` que mock-eja `kvClient.get` a fazer `throw` e assert que retorna `'cancel'` + log error. Coverage 95.83% deve manter ou subir.

### (2) NITPICK — `app/api/agent/confirm/route.ts` L118 (Quick win)

**Severidade:** Nitpick/Quick win
**Tipo:** Eliminate drift risk — export `kvConfirmKey` helper

**O que CR diz:**

> The template literal on line 118 exactly mirrors the private `kvConfirmKey()` function in `kv-confirmation-provider.ts`. If the key format ever changes, both locations must be updated in sync. Exporting the helper removes this coupling.

**Acção:**

Em `imersao-tools/nexus/v2/lib/agent/kv-confirmation-provider.ts`:

```diff
-function kvConfirmKey(runId: string, toolName: string): string {
+export function kvConfirmKey(runId: string, toolName: string): string {
   return `${KV_CONFIRM_NAMESPACE}:${runId}:${toolName}`;
 }
```

Em `imersao-tools/nexus/v2/app/api/agent/confirm/route.ts`:

```diff
 import {
   CONFIRM_TTL_SECONDS,
   KV_CONFIRM_NAMESPACE,
+  kvConfirmKey,
 } from '@/lib/agent/kv-confirmation-provider';

-const key = `${KV_CONFIRM_NAMESPACE}:${runId}:${toolName}`;
+const key = kvConfirmKey(runId, toolName);
```

### (3) NITPICK — `app/api/agent/prompt/route.ts` L134 (Low value)

**Severidade:** Nitpick (Low value, opcional)
**Tipo:** Type alignment — eliminate `kv as unknown as VercelKV` double-cast

**O que CR diz:**

> The `kv as unknown as VercelKV` pattern suggests a type mismatch between the actual `@vercel/kv` export and the internal `VercelKV` type definition. While functional, this could be improved by ensuring the internal type accurately reflects the actual KV client interface.

**Acção (opcional — Dev pode adiar como tech debt):**

Em `imersao-tools/nexus/v2/app/api/agent/prompt/route.ts`:

```diff
-import type { Logger, VercelKV } from '@/lib/agent/tools/types';
+import type { VercelKV } from '@vercel/kv';
+import type { Logger } from '@/lib/agent/tools/types';
```

E remover `as unknown as VercelKV` em L134.

**Decisão recomendada:** Aplicar se trivial sem afectar outros consumers de `VercelKV` em `lib/agent/tools/types`. Caso contrário, deixar em tech debt + comentário no código `// TODO Story 1.9: align VercelKV type with @vercel/kv`.

### (4) OUTSIDE-DIFF — `vitest.config.ts` L10 (Doc fix)

**Severidade:** Stale comment
**Tipo:** Documentação inconsistente com código

**O que CR diz:**

> Line 10: Update the stale coverage comment that currently says "APENAS em `lib/agent/`, `lib/db/`, `lib/shared/`" to reflect that `app/api/agent/**` is now included in the coverage scope.

**Acção:**

Em `imersao-tools/nexus/v2/vitest.config.ts` L10:

```diff
- * Coverage gate 60% APENAS em `lib/agent/`, `lib/db/`, `lib/shared/` (architecture §5.4).
+ * Coverage gate 60% em `lib/agent/`, `lib/db/`, `lib/shared/`, `app/api/agent/` (architecture §5.4).
```

### (5) INLINE — Handoff `RETOMA-20260508-story-1.8-ready-for-review-aguarda-devops-push.md` L43-49 (MD040)

**Severidade:** MD040 (markdown lint)
**Tipo:** Fence code block sem language tag

**Acção:** Em `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.8-ready-for-review-aguarda-devops-push.md` L42 e L49, alterar `` ``` `` para `` ```text `` (linguagem `text` para MD040 conformity).

---

## Resumo dos fixes (5 alterações)

| # | Ficheiro | Tipo | Severidade |
|---|----------|------|------------|
| 1 | `lib/agent/kv-confirmation-provider.ts` | Robustness — try/catch em get | Actionable |
| 2 | `lib/agent/kv-confirmation-provider.ts` + `app/api/agent/confirm/route.ts` | Export `kvConfirmKey` | Nitpick (recomendado) |
| 3 | `app/api/agent/prompt/route.ts` | Align VercelKV type | Nitpick (opcional, pode adiar) |
| 4 | `vitest.config.ts` L10 | Stale comment fix | Doc-only |
| 5 | Handoff RETOMA L43-49 | MD040 language tag | Doc-only |

---

## Sequência esperada

1. `git checkout feat/nexus-v2-story-1.8-agent-prompt-endpoint` (já lá)
2. Aplicar fixes (1) (2) (4) (5) — obrigatórios. Fix (3) opcional/adiável.
3. Adicionar teste de cobertura para fix (1) — KV get throws cenário
4. `npm run lint && npm run typecheck && npm run test:unit && npm run build && npm run test:coverage`
5. Quality Gates 5/5 PASS obrigatório
6. `git add` + `git commit -m "fix(nexus-v2): KvProvider try/catch + kvConfirmKey export + doc fixes [Story 1.8]"`
7. Story 1.8 file maintenance: incrementar Change Log v0.6 ou similar com fixes Iter 1
8. `git push origin feat/nexus-v2-story-1.8-agent-prompt-endpoint`
9. Criar handoff `RETOMA-20260508-story-1.8-pr-11-iter2-fixes-aplicados-aguarda-cr-iter2.md` para @devops Gage retomar push/merge

---

## Hard-stop policy

Se CR Iter 2 ainda CHANGES_REQUESTED com majors substantives → escalar ao Eurico (precedente Stories 1.5/1.6/1.7). Iter 3 PROIBIDA sem aprovação Eurico.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.8-pr-11-iter1-changes-requested-aguarda-dev-fixes.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@devops` (Gage)
DATA: `08/05/2026`
