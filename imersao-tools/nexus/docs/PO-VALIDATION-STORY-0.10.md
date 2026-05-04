# PO Validation — Story 0.10: CI GitHub Actions + Vercel deploy preview verde em `nexus-eurico.vercel.app`

**Validator:** Pax (`@po`)
**Date:** 04/05/2026
**Story:** `imersao-tools/nexus/docs/stories/active/0.10.story.md`
**Verdict:** **PASS**
**Implementation Readiness Score:** 9/10
**Confidence Level:** High

---

## 10-Point Story Checklist

| # | Critério | Status | Notas |
|---|----------|:---:|---|
| 1 | Template Completeness | PASS | Todas as secções; bloqueia Epic 1 (deploy pipeline) |
| 2 | File Structure | PASS | 3 ficheiros: workflow CI, vercel.json, README.md (setup) |
| 3 | UI/Frontend | N/A | Story de infraestrutura/CI |
| 4 | Acceptance Criteria | PASS | 8 AC's testáveis: workflow 3 jobs paralelos, lint+typecheck job, unit+coverage job, e2e job + grep API key, Vercel preview por PR + prod nexus-eurico.vercel.app, vercel.json rootDirectory, env vars Vercel, Lighthouse >=80 |
| 5 | Validation/Testing | PASS | CI verde como gate, deploy preview verifica via PR, deploy prod responde redirect /login, grep `sk-ant-` em bundle, Lighthouse score |
| 6 | Security | PASS | NÃO commitar valores reais (`.env.example` apenas), grep API key gate, paths filter evita corridas desnecessárias |
| 7 | Tasks/Subtasks Sequence | PASS | 11 tasks ordenadas (workflow → paths filter → grep step → vercel.json → projecto Vercel → env vars → preview → prod → script test:ci → Lighthouse → README) |
| 8 | Anti-Hallucination | PASS | arch §13 esboço CI completo, §17 packages, PRD Epic 0 AC4 grep `sk-ant-`, AC6 Lighthouse 80, decisão G2 04/05/2026 domínio nexus-eurico.vercel.app, arch §11 SW manual (anti-Workbox) |
| 9 | Dev Agent Readiness | PASS | Workflow YAML referenciado, paths filter pattern, vercel.json schema, env vars listadas, Lighthouse CLI pattern |
| 10 | Constitution | PASS | Anti-padrões: NÃO commitar secrets, NÃO push --force (Article II push exclusivo @devops), NÃO CI no repo inteiro, NÃO Workbox SW, NÃO domain custom (G2), NÃO bloquear deploy por coverage Epic 0 (gate Epic 1+), NÃO src/, NÃO push sem CI verde |

---

## Anti-Hallucination Verification

| Claim na story | Fonte | Verificável? |
|----------------|-------|---|
| 3 jobs paralelos lint-typecheck/unit-tests/e2e | arch §13 | SIM |
| Paths filter `imersao-tools/nexus/v2/**` | arch §13 + prática mono-repo | SIM |
| Grep `sk-ant-` em `.next/static/` | PRD Epic 0 AC4 | SIM |
| Domínio nexus-eurico.vercel.app | Decisão G2 04/05/2026 (handoff input) | SIM |
| Vercel rootDirectory `imersao-tools/nexus/v2` | Vercel docs públicas | SIM |
| 12 env vars (ANTHROPIC_API_KEY, NEXUS_PASSWORD_HASH, KV_*, SESSION_SECRET, etc.) | arch §9.2 | SIM |
| Lighthouse >=80 mobile | PRD Epic 0 AC6 | SIM |
| Retries 2 CI Playwright | Story 0.9 + arch §5.1 | SIM |

Nenhuma invenção detectada.

---

## Findings

### Critical Issues (Must Fix — Story Blocked)

Nenhum.

### Should-Fix Issues

Nenhum.

### Nice-to-Have Improvements

1. **GitHub branch protection rules**: Story menciona "Todos os jobs devem passar antes de merge em `main`" — isto requer GitHub branch protection configurada no repo. Sugerir Task adicional ou nota: "Eurico configura GitHub Settings → Branches → Branch protection rules para `main`: require status checks → seleccionar `lint-typecheck`, `unit-tests`, `e2e`. Documentado em README.md".
2. **Vercel preview cleanup**: Sem cleanup automático, previews de PRs antigos acumulam. Vercel tem "Preview Deployment Suffix" mas não cleanup automático. Sugerir nota: "Vercel preview deploys são apagados ~7 dias após PR fechado por omissão; sem acção adicional necessária".
3. **CodeRabbit integration**: Dev Notes menciona "CI inclui job `coderabbit` para PRs. Configurar opcionalmente — não bloqueia Epic 0". Recomendo definir explicitamente: "CodeRabbit é Epic 8 hardening — fora de scope Story 0.10".
4. **Lighthouse CI vs CLI**: Task 10 sugere "Lighthouse CLI ou Lighthouse CI". CLI é manual; LHCI é automated. Para deploy verde recorrente, LHCI no workflow é mais robusto mas mais complexo. Aceitável manual em Epic 0 — automatizar em Epic 8.

### Anti-Hallucination Findings

Nenhum.

---

## Final Assessment

- **Verdict:** **PASS** — pronta para implementação
- **Implementation Readiness Score:** **9/10**
- **Confidence Level:** **High**

Story bem estruturada como deploy gate. Nice-to-have sobre GitHub branch protection é importante mas é configuração de uma vez (Eurico no Vercel/GitHub UI), não código. CI workflow YAML referenciado em arch §13 é o single source of truth.

**Nota crítica:** Story menciona AC4 grep `sk-ant-` (PRD AC4) — esta verificação assegura constitutional compliance NFR5. Se @dev tem dúvida, este é o gate inegociável.

**Próximo passo:** `@dev *develop 0.10` — pode arrancar em paralelo com 0.4-0.9; deploy preview verde em PR antes de Eurico fazer merge.
