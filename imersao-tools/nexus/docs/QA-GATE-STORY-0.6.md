# QA Gate — Story 0.6: Auth Node bcrypt + cookie + KV

**Story ID:** 0.6
**Epic:** 0 — Migração Estrutural
**Reviewer:** Quinn (`@qa`)
**Data:** 04/05/2026
**Status entrada:** Ready for Review
**Veredicto inicial:** **CONCERNS** (1 issue medium — não bloqueante)
**Decisão final:** **WAIVED** (Eurico 04/05/2026, Opção A recomendação Quinn)

---

## 7-Point Quality Check

| # | Check | Status | Notas |
|---|-------|:---:|-------|
| 1 | ACs cumpridos | **CONCERNS** | AC1, AC2, AC4, AC5, AC6, AC8 — PASS. **AC3 — DIVERGÊNCIA:** AC pede "lê cookie + faz **KV lookup** + redirect se inválido". Implementação real: middleware (Edge) só verifica **presença** do cookie, sem KV lookup. Validação completa via KV está dentro de cada handler `/api/*` (que importa `getSession`). |
| 2 | Tests passing | PASS | `tests/unit/auth/password.test.ts` cobre 5 cenários (correcta, errada, vazia, hash vazio, hash inválido). `tests/e2e/auth.spec.ts` cobre redirect, login UI, password errada, proxy 401. |
| 3 | Lint + typecheck | DEFERRED | Validação via CI. Tipos `LoginBody`, `SessionData`, `SessionCheckResult` definidos. |
| 4 | NFRs respeitadas | PASS | NFR5/NFR8 (password hash/key server-only) — confirmado. Cookie HttpOnly + Secure (em prod) + SameSite=Strict + Path=/. |
| 5 | Security review | **PASS com nota** | bcryptjs (não nativo) — correcto para Vercel serverless. `crypto.randomUUID()` para sessionId — boa entropia. KV TTL 30d. **Nota AC3:** ver abaixo, é trade-off documentado. |
| 6 | Architecture conformance | PASS | `runtime = 'nodejs'` em login/logout (ADR-1). bcryptjs (architecture §17). KV stateful (não JWT) — permite logout imediato. |
| 7 | Article IV (No Invention) | PASS | Auth flow segue `architecture-v2.md §9.1`. Cookie name `nexus_session`, TTL 30d, KV key `nexus:auth:session:{sessionId}`. |

---

## Issue medium — AC3 vs implementação middleware

**Problema:** AC3 textualmente diz "middleware faz KV lookup; se inválido ou ausente redireciona". Implementação só verifica presença do cookie.

**Razão arquitectural defensável:**
1. Middleware corre em Edge runtime — fazer KV REST fetch a cada request adicionaria 50-200ms de latência ao primeiro byte de cada página.
2. Sessão real é validada nos handlers `/api/*` que importam `getSession()` — auth check ocorre onde realmente importa (operações).
3. Defesa em camadas: middleware faz redirect rápido para `/login`; `app/(app)/layout.tsx` (Story 0.4) faz double-check via `cookies()` server-side; `getSession()` faz KV lookup quando `/api/*` é chamado.
4. Surface de ataque: alguém que descobre a key de cookie (sem ser cookie real do KV) **só consegue ver páginas estáticas** — todas as operações backend (login real, proxy Anthropic, etc.) são bloqueadas pelo `getSession()` real.

**Recomendação:**
- **Opção A (preferida)**: Aceitar a divergência como decisão arquitectural; **actualizar AC3** para reflectir o design em camadas. Quinn recomenda a Eurico waive este ponto.
- **Opção B**: Adicionar KV lookup no middleware mesmo (latência aumentada).

## Auto-decisions auditadas

| AD | Análise QA |
|----|------------|
| AD-Dex-3 (dev sem KV aceita qualquer cookie não vazio) | **ACEITE com directiva**. Permite desenvolvimento local sem Upstash. Em prod (`KV_REST_API_URL` definida), faz lookup real. **DIRECTIVA:** quando Eurico configurar Vercel KV, validar que o lookup real está a ocorrer (pode-se confirmar via teste manual: gerar cookie inválido e tentar `/api/anthropic/proxy` → deve dar 401). |

## Observações

- E2E test `auth.spec.ts` linha 32: usa regex `/incorrecta|configurado/i` — cobre cenário CI sem `NEXUS_PASSWORD_HASH` (mensagem "configurado") e cenário com hash mas password errada ("incorrecta"). Robust.
- Login UI `app/(auth)/login/page.tsx` segue `front-end-spec-v2.md §1.1 [3]-[5b]` — glass card 480px, shake animation, texto Magenta, autoFocus. Perfeito.
- `buildSessionCookie` correctamente omite `Secure` em dev (NODE_ENV !== 'production') para permitir cookie em http://localhost.

## Decisão

**Veredicto inicial Quinn (04/05/2026):** CONCERNS — divergência AC3 é decisão arquitectural defensável, não bug.

**Decisão final Eurico (04/05/2026):** **WAIVED — Opção A aceite.** AC3 actualizado em `imersao-tools/nexus/docs/stories/active/0.6.story.md` para reflectir o design em camadas (middleware Edge verifica presença do cookie; `getSession()` em handlers `/api/*` faz KV lookup real). Design em camadas é mais robusto que o AC literal.

**Não bloqueia push do Epic 0.** Aplicado por Dex 04/05/2026 (modo execução).
