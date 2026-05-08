# RETOMA — Story 1.7 PR #10 Iter 1 CHANGES_REQUESTED, aguarda @dev Dex fixes

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR

PR #10 (Story 1.7 Undo mechanism) push'ed e CodeRabbit Iter 1 retornou **CHANGES_REQUESTED** com **1 Major + 2 Minor + 1 Nitpick**. CI verde nos pontos relevantes (lint, typecheck, vitest, build, playwright, codeql, vercel preview). Coverage Report + Record Quality Metrics fail = tech debt pre-existing aceitável (Stories 1.4/1.5/1.6 mesmo padrão). Hard-stop policy: este é Iter 1 — @dev Dex aplica fixes em commit adicional na mesma branch, push, aguarda Iter 2. Iter 2 ainda CHANGES_REQUESTED → escalação Eurico.

---

## AGENTE A INVOCAR NO TERMINAL NOVO

| Cenário | Agente | Comando |
|---------|--------|---------|
| **DEFAULT** | `@dev` Dex | `@dev *qa-loop-fix 1.7` (aplicar fixes CodeRabbit Iter 1 e push commit adicional) |
| Cenário B — Eurico quer rever os comments antes do fix | qualquer agente | `gh api repos/DaSilvaAlves/ecosistema-ia-avancada-pt/pulls/10/comments` |
| Cenário C — Eurico quer escalar imediatamente (skip Iter 2) | `@devops` Gage | `*push 1.7 --merge-waived` (apenas se Eurico explicitar) |

**Default se Eurico responder apenas "executa"/"avança"/"continua":** invocar `@dev` Dex com Cenário A.

---

## Estado actual (08/05/2026)

| Item | Valor |
|------|-------|
| PR | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/10 |
| Branch | `feat/nexus-v2-story-1.7-undo-mechanism` |
| Commits push'ed | 4 (`5e6dc5b0` feat, `c1c0be4b` test, `cfccbc65` docs, `27baf3d8` handoff) |
| Verdict CodeRabbit Iter 1 | **CHANGES_REQUESTED** (3 actionable + 1 nitpick) |
| CI relevante | ✅ Lint+TS, ✅ Vitest, ✅ Playwright, ✅ Build, ✅ CodeQL, ✅ Vercel Preview |
| CI tech debt aceitável | ❌ Coverage Report, ❌ Record Quality Metrics (Stories 1.4/1.5/1.6 igual) |
| Iteração actual | 1 (max 2 antes hard-stop) |

---

## Findings CodeRabbit Iter 1 (em ordem de prioridade)

### 1. MAJOR — `app/api/agent/undo/route.ts` L190-194 + L260-265

**Issue:** Prevent duplicate reversals when KV cleanup fails.

**Comportamento actual:**
1. Verifica TTL → se expirado, `deleteUndoEntry` (sem try/catch) + 410
2. Faz reverse loop best-effort (cada tool.reverse com try/catch — OK)
3. `deleteUndoEntry` no fim (sem try/catch)

**Problema arquitectural:** Se o `deleteUndoEntry` no fim (L264) **falhar** (KV down, network), o cliente pode fazer retry com mesmo `runId` e os `tool.reverse()` executam **duas vezes**. **Viola at-most-once semantics** prometidas pela Story 1.7 (RESOLVED-5: "2º POST → 410").

**Fix recomendado pelo CodeRabbit:**

```typescript
// 4. Defense-in-depth TTL guard
if (entry.expiresAt < Date.now()) {
  try {
    await deleteUndoEntry(runId, kvClient);
  } catch (e) {
    undoLogger.error('Failed to cleanup expired undo entry', {
      runId,
      error: errorMessageString(e),
    });
  }
  return jsonResponse({ error: 'undo_window_expired', ... }, 410);
}

// NOVO PASSO 4.5: Consume entry BEFORE reverse loop (at-most-once)
try {
  await deleteUndoEntry(runId, kvClient);
} catch (e) {
  undoLogger.error('Failed to consume undo entry before reverse', {
    runId,
    error: errorMessageString(e),
  });
  return jsonResponse({
    error: 'undo_cleanup_failed',
    message: 'Falha ao preparar operação de undo',
  }, 503);
}

// 5. Reverse loop best-effort (existente, sem alterações)
// ...

// 6. REMOVER deleteUndoEntry final — já consumido em 4.5
return jsonResponse({ reverted, errors }, 200);
```

**Impacto em tests:**
- `tests/unit/api/agent/undo.test.ts` test idempotência (RESOLVED-5) — verificar se ainda passa com nova ordem de delete
- Adicionar 1 test novo: `delete falha antes do reverse → 503` (não estava no scope original)
- Possivelmente actualizar test do happy path (delete chamado **antes** do reverse, não depois)

**Validação CodeRabbit:** "As per coding guidelines, 'Include comprehensive error handling in all code'."

### 2. MINOR — `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.7-ready-for-review-aguarda-devops-push.md` L108-112 + L134-136

**Issue:** Fenced code blocks sem language tag (MD040).

**Fix:** Adicionar `text` ao fence:

```diff
-```
+```text
 lib/agent/undo.ts             100   84.61    100   100   100,135
 ...
```

```diff
-```
+```text
 @devops *push 1.7
 ```
```

### 3. MINOR — `imersao-tools/nexus/docs/stories/active/1.7.story.md` L161-164

**Issue:** Fenced env snippet sem language tag (MD040).

**Fix:**

```diff
-```
+```dotenv
 KV_REST_API_URL=https://example.upstash.io
 KV_REST_API_TOKEN=...
 ```
```

### 4. NITPICK — `imersao-tools/nexus/v2/tests/unit/api/agent/undo.test.ts` L465-516

**Issue:** Regex `runtimeDbImport` não cobre TypeScript 4.5+ inline modifier `import { type Foo } from '@/lib/db/client'`.

**Decisão recomendada:** **SKIP — adicionar comentário explicativo no test em vez de alterar regex.** A code base actual não usa essa syntax, é apenas para futuro proofing. Adicionar comment do tipo:

```typescript
// Note: matches `import { … }` runtime imports; `import type { … }` is excluded
// but TS 4.5+ inline `import { type Foo }` is NOT excluded. Use `import type { … }`
// in source to stay compatible with this guard.
const runtimeDbImport = /^\s*import\s+(?!type\s)[^;]*from\s+['"]@\/lib\/db\/client['"]/m;
```

---

## Plano de execução para @dev Dex

### Passo 1 — Aplicar fix Major em `route.ts`
- Reorganizar lógica delete: consumir antes do reverse loop
- Adicionar try/catch no delete inicial (caso TTL expirado) e no consume principal
- Remover delete final (linha ~264)

### Passo 2 — Actualizar tests `undo.test.ts`
- Verificar test idempotência (RESOLVED-5): mock `kvClient.del` chamado **antes** do reverse loop
- Adicionar 1 test novo: `delete falha antes do reverse → 503 + reverses NÃO executam`
- Verificar test happy path: ordem de chamadas no mock

### Passo 3 — Aplicar fixes Minor MD040
- Edit RETOMA-20260508-story-1.7-ready-for-review: 2 fences com `text`
- Edit 1.7.story.md L161-164: 1 fence com `dotenv`

### Passo 4 — Nitpick (skip ou comment-only)
- Adicionar comentário explicativo em undo.test.ts L491 (sem alterar regex)

### Passo 5 — Quality gates AC11 5/5
- `npm run lint && npm run typecheck && npm run test:unit && npm run build && npm run test:coverage`
- Confirmar undo.ts ≥90%, route.ts ≥85%, executor.ts ≥93% (não regredir)

### Passo 6 — Commit + push
- 1 commit conventional: `fix(nexus-v2): consume undo entry before reverse + MD040 fixes [Story 1.7]`
- Trailers: `Constraint:` `Rejected:` `Confidence:` `Scope-risk:`
- Push **na mesma branch** (não criar novo PR), aguardar CodeRabbit Iter 2

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.7-pr-10-iter1-changes-requested-aguarda-dev-fixes.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE.

---

## Hard-stop policy (precedente Stories 1.5+1.6)

| Iteração | Acção |
|----------|-------|
| Iter 1 — CHANGES_REQUESTED | @dev fixes + push commit adicional (este handoff) |
| Iter 2 — APPROVED | @devops merge + closure |
| Iter 2 — CHANGES_REQUESTED | **HARD-STOP — escalação Eurico, não tentar Iter 3** |

Precedente Story 1.5: Iter 3 doc-only nits → merge waived com fixes em closure commit (apenas se Eurico aprovar).

---

## Caveat operacional

| Caveat | Detalhe |
|--------|---------|
| Working directory | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt` |
| Branch | `feat/nexus-v2-story-1.7-undo-mechanism` (não criar nova branch) |
| `gh` requer | `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` em todos os comandos |
| Push | `git push origin feat/nexus-v2-story-1.7-undo-mechanism` (sem `--force`, sem `--no-verify`) |
| PR aberto | #10 — não recriar |
| PT-PT | Comunicações + commits |
| Conventional commits | Obrigatório com trailers |

---

## Recovery / Edge cases

| Situação | Acção |
|----------|-------|
| Test idempotência quebra com nova ordem de delete | Refactor test para verificar `kvClient.del` chamado pré-reverse |
| Build falha após refactor route.ts | Verificar imports e signatures `errorMessageString` |
| Coverage route.ts cai abaixo 85% | Adicionar test do branch `delete falha antes do reverse → 503` |
| CodeRabbit Iter 2 demora >15 min | Normal — aguardar |
| Iter 2 ainda CHANGES_REQUESTED | Hard-stop, criar handoff de escalação para Eurico |

---

## Acessos rápidos

| Recurso | Path / URL |
|---------|------------|
| PR #10 | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/10 |
| Branch | `feat/nexus-v2-story-1.7-undo-mechanism` |
| Story file | `imersao-tools/nexus/docs/stories/active/1.7.story.md` |
| Commits diff | `git diff main..feat/nexus-v2-story-1.7-undo-mechanism` |
| CodeRabbit comments | `gh api repos/DaSilvaAlves/ecosistema-ia-avancada-pt/pulls/10/comments` |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2**
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.7-pr-10-iter1-changes-requested-aguarda-dev-fixes.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: `@devops` Gage (push + create PR + monitor CR Iter 1) → próximo agente: `@dev` Dex com `*qa-loop-fix 1.7`
DATA: 08/05/2026
