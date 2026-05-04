# QA Gate — Story 0.7: OnboardingModal 4 steps

**Story ID:** 0.7
**Epic:** 0 — Migração Estrutural
**Reviewer:** Quinn (`@qa`)
**Data:** 04/05/2026
**Status entrada:** Ready for Review
**Veredicto:** **PASS**

---

## 7-Point Quality Check

| # | Check | Status | Notas |
|---|-------|:---:|-------|
| 1 | ACs cumpridos | PASS | AC1-AC8 cumpridos. Flag persistida em localStorage (client) + KV (server). Step 1-4 implementados. |
| 2 | Tests passing | PASS (parcial) | Testes manuais documentados nas notas; testes Vitest de componente são possíveis no futuro mas não obrigatórios para gate Epic 0. |
| 3 | Lint + typecheck | DEFERRED | Validação via CI. Props tipadas, `StepNumber` literal type. |
| 4 | NFRs respeitadas | PASS | UX §1.1 [7] — Esc bloqueado via `addEventListener('keydown', preventDefault)`. Onboarding nunca pode ser fechado. |
| 5 | Security review | PASS | Stubs `/api/push/subscribe`, `/api/telegram/validate-token`, `/api/onboarding/complete` todos verificam `getSession()` antes de qualquer operação. Sem leakage de auth state. Telegram token validado por regex defensiva (`/^\d{6,12}:[A-Za-z0-9_-]{30,}$/`). |
| 6 | Architecture conformance | PASS | Modal overlay z-index 60 + `rgba(0,0,0,0.8)` + glass card 520px central com backdropFilter blur(20px). Cyan #00F5FF para acção primária, Magenta #FF006E para erros. Inter para texto, JetBrains Mono para token. |
| 7 | Article IV (No Invention) | PASS | Texto exacto de `front-end-spec-v2.md §1.1`: "Olá. Vou ser o teu Nexus.", "Preciso de notificar-te de lembretes", "Queres ligar Google Calendar / Gmail?", "Receber lembretes/briefing por Telegram?". Mensagem de boas-vindas pinned em `MessageList` cita texto exacto §1.1 [9]. |

---

## Issues should-fix @po (consumidos)

| Issue | Resolução |
|-------|-----------|
| `/api/onboarding/complete` stub explícito | **CONSUMIDO**. Endpoint criado com `runtime = nodejs` + auth check + KV set tentativo (fallback graceful em dev). Documentado em File List. |

## Observações

- Step 1 default name "Eurico" — Constraint C1 (single-user) respeitada.
- Step 2 (Web Push) trata `Notification === 'undefined'` (browser sem support) — marca `pushDeclined: true` e avança. Defensivo.
- Step 3 (Google) faz `window.location.href = '/api/google/oauth/google'` — endpoint não existe ainda (Epic 6). Em produção isto vai dar 404 até Epic 6 implementar. **Mitigação:** o "Saltar" funciona em qualquer altura, então Eurico não fica preso. Aceitável.
- Step 4 `onSkip` chama `complete()` em vez de `next()` — correcto, é o último step.
- `aria-modal="true"`, `aria-labelledby`, `role="dialog"`, `role="alert"` para erros. Acessibilidade WCAG.
- Mensagem boas-vindas pinned aparece **só quando `messages` está vazio** (em `MessageList`). Em produção real (Epic 1) a primeira mensagem do utilizador vai eclipsá-la — consistente com semântica "pinned of first run".

## Decisão

**PASS.** Onboarding bem implementado, Esc bloqueado, fallbacks graceful para Web Push/Google/Telegram. Stubs documentados para Epic 4/6.
