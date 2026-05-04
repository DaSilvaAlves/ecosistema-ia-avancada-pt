# PO Validation — Story 0.7: OnboardingModal 4 steps

**Validator:** Pax (`@po`)
**Date:** 04/05/2026
**Story:** `imersao-tools/nexus/docs/stories/active/0.7.story.md`
**Verdict:** **PASS**
**Implementation Readiness Score:** 8/10
**Confidence Level:** High

---

## 10-Point Story Checklist

| # | Critério | Status | Notas |
|---|----------|:---:|---|
| 1 | Template Completeness | PASS | Todas as secções; bloqueada por 0.1+0.3+0.4+0.6 explicado |
| 2 | File Structure | PASS | 4 ficheiros: OnboardingModal.tsx, 2 stub routes (push/subscribe + telegram/validate-token), page.tsx actualizado |
| 3 | UI/Frontend Completeness | PASS | AC2-AC5 cobrem 4 steps com texto exacto, AC6 mensagem boas-vindas pinned exacta, AC7 overlay z-index 60 + glassmorphism, comportamento Tab/Enter/Esc |
| 4 | Acceptance Criteria | PASS | 8 AC's testáveis: KV flag, cada step, cancelamento opcional, mensagem final, overlay, push declined handling |
| 5 | Validation/Testing | PASS | Vitest+Testing Library + manual: limpar storage→modal abre, navegação Tab/Enter, Esc não fecha |
| 6 | Security | PASS | KV flag, sem credenciais expostas, OAuth/push são stubs (real em outras stories) |
| 7 | Tasks/Subtasks Sequence | PASS | 10 tasks ordenadas (Modal → Step1 → Step2 push → stub /api/push/subscribe → Step3 OAuth stub → Step4 Telegram stub → flag KV → mensagem boas-vindas → integração → testes navigation) |
| 8 | Anti-Hallucination | PASS | UX §1.1 steps numerados [1]-[10] com texto exacto, mensagem boas-vindas exacta, KV flag pattern arch §9.1, UX-2 ADR (briefing Epic 1), Constraint C1 single-user (default "Eurico") |
| 9 | Dev Agent Readiness | PASS | Texto exacto de cada step, KV pattern, fallback localStorage dev, endpoints stubs, navegação keyboard |
| 10 | Constitution | PASS | Anti-padrões: NÃO bloquear se push/Google/Telegram saltado, NÃO reutilizar para outros utilizadores (C1), NÃO Web Push real (Epic 4), NÃO OAuth Google real (Story 6 epic), NÃO Esc fecha |

---

## Anti-Hallucination Verification

| Claim na story | Fonte | Verificável? |
|----------------|-------|---|
| 4 steps numerados | UX §1.1 [1]-[10] | SIM |
| Mensagem boas-vindas pinned exacta | UX §1.1 [9] | SIM (citada literal) |
| KV flag `nexus:onboarding:done` | arch §9.1 | SIM |
| `Notification.requestPermission()` Web Push | PRD FR35 + Web Push API standard | SIM |
| Default nome "Eurico" | Constraint C1 single-user | SIM |
| Endpoints stubs em outras stories: `/api/push/*` em Epic 4, OAuth Google em Epic 6 | PRD Epic 4 + Epic 6 | SIM |
| Erro Magenta inline para Telegram token inválido | UX §1.1 + design-system | SIM |

Nenhuma invenção detectada.

---

## Findings

### Critical Issues (Must Fix — Story Blocked)

Nenhum.

### Should-Fix Issues

1. **Stub routes em File List**: `app/api/push/subscribe/route.ts` e `app/api/telegram/validate-token/route.ts` aparecem como stubs nesta story. Falta documentar protocolo `/api/onboarding/complete` (mencionado em Task 7) — é stub também? Sugerir adicionar 5º ficheiro no File List: `app/api/onboarding/complete/route.ts` com KV write da flag. Sem isto, "fallback localStorage dev" pode mascarar problema em produção.

### Nice-to-Have Improvements

1. **Storybook ou screenshot para revisão UX**: Modal de 4 steps tem fluxo crítico. Considerar screenshot manual no PR para Eurico validar visualmente antes de merge.
2. **Web Push permission denied UX**: AC8 cobre o caso mas a story poderia incluir teste explícito para "verifica que após denied, marca KV `pushDeclined: true` e Settings (futuro Epic 8) lê este flag para mostrar aviso". Documentar o flag para Epic 8 não esquecer.
3. **OAuth Google redirect fluxo**: Step 3 abre OAuth — a story não diz para onde volta após sucesso ou cancelamento. Sugerir nota: "OAuth real é Epic 6; em 0.7 botão é stub que redirige para `/api/google/oauth/google` (404 OK em dev)".

### Anti-Hallucination Findings

Nenhum.

---

## Final Assessment

- **Verdict:** **PASS** — pronta para implementação
- **Implementation Readiness Score:** **8/10**
- **Confidence Level:** **High**

Story bem desenhada com texto exacto da UX e respeito por separação de responsabilidades (push real Epic 4, OAuth Epic 6). Should-fix sobre stub `/api/onboarding/complete` é o único item para clareza de @dev — mas pode ser resolvido durante implementação.

**Próximo passo:** `@dev *develop 0.7` — após 0.1, 0.3, 0.4, 0.6 done.
