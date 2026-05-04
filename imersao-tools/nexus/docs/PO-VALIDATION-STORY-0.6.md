# PO Validation — Story 0.6: Auth flow Node runtime: bcrypt + cookie HttpOnly + session KV

**Validator:** Pax (`@po`)
**Date:** 04/05/2026
**Story:** `imersao-tools/nexus/docs/stories/active/0.6.story.md`
**Verdict:** **PASS**
**Implementation Readiness Score:** 10/10
**Confidence Level:** High

---

## 10-Point Story Checklist

| # | Critério | Status | Notas |
|---|----------|:---:|---|
| 1 | Template Completeness | PASS | Todas as secções presentes |
| 2 | File Structure | PASS | 8 ficheiros: 2 routes auth, middleware, 2 helpers, login page, 2 testes |
| 3 | UI/Frontend | PASS | AC6 detalha glass card 480px + estados loading/erro com cores exactas (Cyan spinner + Magenta error) conforme UX §1.1 |
| 4 | Acceptance Criteria | PASS | 8 AC's testáveis: route login, route logout, middleware, helpers session/password, UI login, E2E redirect, hash não em bundle |
| 5 | Validation/Testing | PASS | Vitest unit (verifyPassword), E2E Playwright (sem cookie→/login, password ok→/, password errada→msg) |
| 6 | Security | PASS — **CRÍTICO** | bcryptjs (não bcrypt nativo), cookie HttpOnly+Secure+SameSite=Strict, sessão stateful em KV (revogável), Node runtime para crypto, hash apenas server-side |
| 7 | Tasks/Subtasks Sequence | PASS | 10 tasks ordenadas (login → logout → middleware → session helper → password helper → UI → substituir placeholder em layout → substituir placeholder em proxy → E2E → unit test) |
| 8 | Anti-Hallucination | PASS | ADR-1 Node runtime, arch §9.1 flow exacto, arch §17 bcryptjs version, UX §1.1 mensagens exactas (PT-PT), Constraint C1 single-user, FR90-FR91 |
| 9 | Dev Agent Readiness | PASS | Flow completo descrito (bcrypt.compare → randomUUID → KV TTL 30d → Set-Cookie), middleware matcher pattern, dev local KV graceful fallback, mensagens UI exactas |
| 10 | Constitution | PASS | Anti-padrões: NÃO Edge runtime aqui (ADR-1), NÃO hash em client, NÃO JWT sem KV (revogabilidade), NÃO SameSite=Lax, NÃO segundo utilizador (C1), NÃO magic link (não MVP) |

---

## Anti-Hallucination Verification

| Claim na story | Fonte | Verificável? |
|----------------|-------|---|
| Node runtime para bcrypt | ADR-1 | SIM |
| `bcryptjs@^2.4.3` (não bcrypt nativo) | arch §17 | SIM |
| Cookie `HttpOnly; Secure; SameSite=Strict; Path=/` | arch §9.1 | SIM |
| Session KV TTL 30d com `crypto.randomUUID` | arch §9.1 | SIM |
| Middleware matcher excluding `api/auth/`, `_next/`, `favicon.*` | arch §9.1 | SIM |
| Mensagem PT-PT "Password incorrecta. Verifica no Vercel." | front-end-spec §1.1 | SIM |
| Single-user (Constraint C1) | Constraint inegociável + PRD FR90-FR91 | SIM |

Nenhuma invenção detectada.

---

## Findings

### Critical Issues (Must Fix — Story Blocked)

Nenhum.

### Should-Fix Issues

Nenhum.

### Nice-to-Have Improvements

1. **Logout no header**: Story foca login mas não menciona UI de logout. Sugiro Task adicional ou nota: "Header (criado em Story 0.4) deve ter botão `[⚙️]` que mostra opção logout — conexão com `/api/auth/logout` real implementada nesta story". Pode ficar para Epic 8 settings, mas vale flag.
2. **Brute force protection**: Rate limit por IP no `/api/auth/login` (ex: 5 tentativas/15min) seria ideal. Não está no AC mas single-user mitiga risco. Sugerir nota: "Rate limit /api/auth/login considerado em Epic 8 hardening — para MVP single-user, omitido".
3. **Sessão refresh**: Cookie expira em 30d mas se Eurico estiver activo, ideal seria renovar TTL. Não bloqueante — refresh pode ser Epic 8.

### Anti-Hallucination Findings

Nenhum.

---

## Final Assessment

- **Verdict:** **PASS** — pronta para implementação
- **Implementation Readiness Score:** **10/10**
- **Confidence Level:** **High**

Story de segurança de altíssima qualidade. Cobre auth flow completo (login, logout, middleware, helpers), com decisões arquitecturais defendidas (Node vs Edge, KV stateful vs JWT stateless, SameSite=Strict). Mensagens UI exactas em PT-PT.

**Próximo passo:** `@dev *develop 0.6` — prioridade alta após 0.1 (paralelo com 0.5).
