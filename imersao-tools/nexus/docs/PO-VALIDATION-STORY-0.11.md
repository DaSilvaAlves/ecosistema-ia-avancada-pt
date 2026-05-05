# PO Validation — Story 0.11: OnboardingModal Step Google disable temporário (F.4)

**Validator:** Pax (`@po`)
**Date:** 05/05/2026
**Story:** `imersao-tools/nexus/docs/stories/active/0.11.story.md`
**Verdict:** **PASS**
**Implementation Readiness Score:** 9/10
**Confidence Level:** High

---

## 10-Point Story Checklist

| # | Critério | Status | Notas |
|---|----------|:---:|---|
| 1 | Template Completeness | PASS | Todas as secções presentes: User Story, 10 AC's, 8 Tasks com subtarefas, Dev Notes, File List, Testing, Anti-padrões, Referências, CodeRabbit Integration. Estimativa 30min-1h, Status Draft, Bloqueia/Bloqueada por explícitos |
| 2 | File Structure | PASS | 3 ficheiros tocados: 1 produção (`OnboardingModal.tsx`), 1 teste (`OnboardingModal.test.tsx` se ainda não existir), 1 doc (`EPIC-0-FOLLOW-UP-DEBT.md`). Anti-File List explícito — proibido criar `/api/google/*` |
| 3 | UI/Frontend Completeness | PASS | AC1-AC5 cobrem comportamento UI: `disabled` permanente, `title` tooltip exacto ("Disponível em breve — integração Google Calendar/Gmail a chegar."), Skip continua funcional, handler `onConnect` neutralizado, style segue convenção `PrimaryButton`/`GhostButton` existente |
| 4 | Acceptance Criteria | PASS | 10 AC's testáveis: AC1 disabled state, AC2 tooltip texto exacto, AC3 Skip funcional, AC4 onConnect removido, AC5 styling convencional, AC6 smoke production scripted, AC7 follow-up doc update, AC8 unit tests específicos, AC9 quality gates locais, AC10 coverage threshold mantém-se |
| 5 | Validation/Testing | PASS | Vitest + @testing-library/react detalhado (4 cenários unit incluindo `window.location` spy). Manual smoke 9 steps com instrução `localStorage.removeItem('nexus:onboarding:done')` para reset |
| 6 | Security | PASS | UI bug fix sem implicações de segurança. Rota inexistente continua inexistente — disable evita 404 sem expor superfície nova. KV/auth não tocados |
| 7 | Tasks/Subtasks Sequence | PASS | 8 tasks ordenadas: editar componente → verificar PrimaryButton interface → testes → quality gates locais → update doc → commit → delegar push → smoke production. Subtarefas granulares onde matter |
| 8 | Anti-Hallucination | PASS | Linha 181 confirmada (`window.location.href = '/api/google/oauth/google'`), path do componente confirmado via Glob (`v2/components/chat/OnboardingModal.tsx` — story corrige assumption errada do follow-up doc), `PrimaryButton` suporte para `disabled` confirmado linhas 400-434 |
| 9 | Dev Agent Readiness | PASS | Linha exacta do bug, decisão arquitectural (Opção B) explícita e fechada, anti-padrões enumerados, brandbook tooltip text validado contra regras (sem "fácil"/"automático"/"garantido") |
| 10 | Constitution | PASS | CLI First N/A (bug UI), Agent Authority respeitada (delega push @devops em Task 7), Story-Driven (Status Draft + ACs), No Invention (rastreável a F.4 + handoff Eurico), Quality First (AC9 lint/typecheck/test/build) |

---

## Anti-Hallucination Verification

| Claim na story | Fonte | Verificável? |
|----------------|-------|---|
| Linha 181 contém `window.location.href = '/api/google/oauth/google'` | Read directo `OnboardingModal.tsx` linhas 177-186 | SIM ✓ |
| Path real é `components/chat/OnboardingModal.tsx` (não `app/(app)/components/`) | Glob `**/OnboardingModal*` | SIM ✓ (story corrige assumption errada do F.4) |
| `PrimaryButton` já suporta `disabled` via interface existente | OnboardingModal.tsx linhas 400-434 | SIM ✓ |
| Decisão Opção B vs Opção A | EPIC-0-FOLLOW-UP-DEBT.md §F.4 + handoff Eurico 05/05/2026 | SIM ✓ |
| Coverage threshold actual = 25% (rebaixado em Epic 0) | EPIC-0-FOLLOW-UP-DEBT.md §F.1 | SIM ✓ |
| Endpoint `/api/google/oauth/google` não existe | Glob confirmou ausência de pasta `app/api/google/` | SIM ✓ |
| Story 0.7 já tinha notado problema | QA-GATE-STORY-0.7.md + Story 0.7 line 107 | SIM ✓ |
| Tooltip via `title` HTML é suficiente para a11y | Padrão HTML5 standard | SIM ✓ |

Nenhuma invenção detectada.

---

## IDS Verification (Gate G3)

| Artefacto referenciado | Existe? | Notas |
|------------------------|:---:|---|
| `imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md` §F.4 | SIM | Confirmado linhas 127-150 |
| `imersao-tools/nexus/docs/stories/completed/0.7.story.md` | SIM | Glob confirmou |
| `imersao-tools/nexus/docs/QA-GATE-STORY-0.7.md` | SIM | Glob confirmou |
| `imersao-tools/nexus/docs/handoffs/RETOMA-20260505-...` | SIM | Lido no início desta sessão |
| `imersao-tools/nexus/docs/front-end-spec-v2.md` §1.1 | SIM | Referenciado em 0.7 (frozen ADR) |
| `imersao-tools/nexus/v2/components/chat/OnboardingModal.tsx:181` | SIM | Read directo confirmou |

Decisão IDS: **REUSE** dos componentes existentes (`PrimaryButton`, `Step3` structure, `OnboardingModal` shell). Nenhum artefacto novo de larga escala — apenas modificações in-place com surface area mínima. Adaptação <30%, não quebra consumers (Step 3 continua a renderizar com mesmo contrato).

---

## Findings

### Critical Issues (Must Fix — Story Blocked)

Nenhum.

### Should-Fix Issues

1. **CodeRabbit Self-Healing Configuration minimalista** — A secção "CodeRabbit Integration" existe (tabela com Coverage/Specialized agents/Tipo/Risco) mas falta detalhe explícito de Self-Healing Mode segundo `.claude/rules/coderabbit-integration.md`:
   ```yaml
   mode: light
   max_iterations: 2
   timeout_minutes: 30
   severity_filter: [CRITICAL, HIGH]
   ```
   Recomendação: `@dev` adiciona este bloco YAML quando começar `*develop` — não bloqueia validação. Bug Fix story tem risco baixo, light mode é apropriado.

2. **Acessibilidade do tooltip em botão `disabled`** — Em alguns browsers, botões com atributo `disabled` HTML não disparam `mouseenter`/`focus` events, o que pode suprimir o `title` tooltip. Considerar usar `aria-disabled="true"` + handler no-op em vez de `disabled` HTML para garantir que o tooltip sempre aparece. Decisão fica para `@dev` durante implementação — não é blocker mas é a única zona que pode degradar UX no objectivo desta story.

### Nice-to-Have Improvements

1. **Screenshot/print no PR** — Step 3 antes vs depois (botão activo cyan vs disabled fade). Útil para Eurico validar visualmente antes de merge sem ter de testar produção.

2. **Test setup para `window.location` spy** — AC8 menciona "verificar via `window.location` spy ou `assign` mock". Sugestão concreta: usar `Object.defineProperty(window, 'location', { writable: true, value: { href: '' } })` em `beforeEach` do teste — padrão consolidado em testes E2E do mesmo repo.

3. **Story 0.7 cleanup linkage** — A story 0.7 linha 107 do QA gate previa este problema ("Step 3 redirige para `/api/google/oauth/google` — endpoint só existe em Epic 6"). Após 0.11 fechar, vale referenciar 0.11 no QA-GATE-STORY-0.7.md para fechar o loop de débito.

### Anti-Hallucination Findings

Nenhum. A story corrige inclusivé uma assumption errada do follow-up doc (path do componente).

---

## Constitution Compliance

| Artigo | Compliance | Notas |
|--------|:---:|---|
| I — CLI First | N/A | Bug fix UI — não introduz nova feature CLI |
| II — Agent Authority | PASS | Task 7 delega push a `@devops`, story não tenta push directo |
| III — Story-Driven | PASS | Status Draft, 10 ACs claros, File List explícito, checkboxes para tracking |
| IV — No Invention | PASS | Cada AC traceável a F.4, handoff Eurico, ou inspecção real do código |
| V — Quality First | PASS | AC9 explicita lint + typecheck + test + build; AC10 protege coverage |
| VI — Absolute Imports | N/A | Modificação in-place de componente existente; sem imports novos |

---

## Final Assessment

- **Verdict:** **PASS** — pronta para implementação
- **Implementation Readiness Score:** **9/10**
- **Confidence Level:** **High**

Story exemplar para tech debt bug fix: surface area mínima (1 ficheiro produção), decisão arquitectural fechada antes de draft (Opção B vs A já decidida), traceabilidade completa, anti-padrões explícitos. O 1 ponto não-PASS é a CodeRabbit Self-Healing config minimalista — corrigível durante `*develop` sem bloquear.

**Próximo passo:** `@dev *develop 0.11`

— Pax, equilibrando prioridades 🎯
