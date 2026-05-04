# PO Validation — Story 0.9: Setup Vitest + Playwright + MSW + fake-indexeddb

**Validator:** Pax (`@po`)
**Date:** 04/05/2026
**Story:** `imersao-tools/nexus/docs/stories/active/0.9.story.md`
**Verdict:** **PASS**
**Implementation Readiness Score:** 9/10
**Confidence Level:** High

---

## 10-Point Story Checklist

| # | Critério | Status | Notas |
|---|----------|:---:|---|
| 1 | Template Completeness | PASS | Todas as secções presentes |
| 2 | File Structure | PASS | 11 ficheiros: vitest.config, playwright.config, setup, smoke unit, dexie smoke, MSW server + 4 handlers, e2e smoke |
| 3 | UI/Frontend | N/A | Story de scaffold (sem UI) |
| 4 | Acceptance Criteria | PASS | 8 AC's verificáveis: test:unit pass, test:e2e pass, MSW configurado, fake-indexeddb global, dexie-smoke test, handlers stubs criados, coverage report, playwright config |
| 5 | Validation/Testing | PASS — **self-validating** | A story é o próprio scaffold; os testes que cria devem passar |
| 6 | Security | PASS | MSW evita chamadas reais a APIs em testes; `fake-indexeddb` em ambiente jsdom isolado |
| 7 | Tasks/Subtasks Sequence | PASS | 15 tasks ordenadas (deps → vitest config → setup file → smoke test → MSW server → handler Anthropic → handlers stubs → handlers index → dexie-smoke → playwright config → install browsers → E2E smoke → scripts package.json → verificar passa) |
| 8 | Anti-Hallucination | PASS | arch §5.1 stack, §5.2 MSW snippet exacto, §5.4 coverage gate 60% restrito a `lib/agent/`, `lib/db/`, `lib/shared/`, ADR-4 Vitest, §13 CI pipeline, port 3001 |
| 9 | Dev Agent Readiness | PASS | Setup file pattern, MSW server pattern, vitest.config thresholds, playwright retries CI, scripts package.json |
| 10 | Constitution | PASS | Anti-padrões: NÃO Jest (ADR-4 Vitest), NÃO `jest.mock`, NÃO `jest-environment-jsdom`, NÃO Workbox, NÃO Firefox/Safari (Chromium only), NÃO inventar handlers MSW (snippet exacto), NÃO src/, NÃO coverage gate em UI |

---

## Anti-Hallucination Verification

| Claim na story | Fonte | Verificável? |
|----------------|-------|---|
| Vitest unit/component/integration | ADR-4 + arch §5.1 | SIM |
| Playwright Chromium only | ADR-4 + arch §5.1 | SIM |
| MSW para mocks API | arch §5.1 + §5.2 | SIM |
| fake-indexeddb para Dexie tests | ADR-4 + arch §5.1 | SIM |
| Coverage gate 60% só em `lib/agent/`, `lib/db/`, `lib/shared/` | arch §5.4 | SIM |
| MSW handler Anthropic snippet | arch §5.2 (snippet exacto a copiar) | SIM |
| Port 3001 baseURL | Story 0.1 AC7 | SIM |
| Retries CI 2, local 0 | arch §5.1 e prática Playwright standard | SIM |

Nenhuma invenção detectada.

---

## Findings

### Critical Issues (Must Fix — Story Blocked)

Nenhum.

### Should-Fix Issues

Nenhum.

### Nice-to-Have Improvements

1. **AC8 webServer config Playwright**: `playwright.config.ts` deveria incluir `webServer: { command: 'npm run dev', port: 3001, reuseExistingServer: !process.env.CI }` para que `npm run test:e2e` arranque a app automaticamente. Sem isto o E2E falha quando dev server não está manualmente iniciado. Sugerir Task adicional: "Adicionar `webServer` config a playwright.config.ts".
2. **Vitest UI mode opcional**: Task 14 sugere script `test:ui` (Vitest UI dashboard). Útil para dev local mas não é AC. Confirmar com @dev se incluir.
3. **AC7 coverage thresholds**: Coverage gate de 60% é configurável via `vitest.config.ts → coverage.thresholds`. Sugerir explicitar thresholds: `branches: 60, functions: 60, lines: 60, statements: 60` aplicado a paths `include: ['lib/agent/**', 'lib/db/**', 'lib/shared/**']`.

### Anti-Hallucination Findings

Nenhum.

---

## Final Assessment

- **Verdict:** **PASS** — pronta para implementação
- **Implementation Readiness Score:** **9/10**
- **Confidence Level:** **High**

Story bem desenhada como scaffold meta-test. Self-validating é elegante (testes da story validam-se a si próprios). MSW snippet de arch §5.2 a copiar literalmente — anti-padrão "NÃO inventar handlers" defende Article IV.

**Próximo passo:** `@dev *develop 0.9` — pode correr em paralelo com 0.4-0.8.
