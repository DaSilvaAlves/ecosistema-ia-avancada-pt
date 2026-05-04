# PO Validation — Story 0.2: Migrar utilities v1 para `v2/lib/` sem alterar lógica

**Validator:** Pax (`@po`)
**Date:** 04/05/2026
**Story:** `imersao-tools/nexus/docs/stories/active/0.2.story.md`
**Verdict:** **PASS**
**Implementation Readiness Score:** 8/10
**Confidence Level:** High

---

## 10-Point Story Checklist

| # | Critério | Status | Notas |
|---|----------|:---:|---|
| 1 | Template Completeness | PASS | Todas as secções presentes; status Draft correcto |
| 2 | File Structure | PASS | 7 ficheiros novos; paths em `v2/lib/shared/` e `v2/hooks/` conforme arch §3 |
| 3 | UI/Frontend | N/A | Story de utilities (sem UI) |
| 4 | Acceptance Criteria | PASS | 8 AC's mensuráveis (existência ficheiros, formato PT-PT, Zod validation, src/ intocado, typecheck pass) |
| 5 | Validation/Testing | PASS | Vitest unit tests com casos concretos: `formatCurrency(7870)`→`€78,70`, `formatDate("2026-03-14")`→`14/03/2026`, env validation lança erro |
| 6 | Security | PASS | AC5 implementa Zod env validation — falha cedo se env var ausente; comentário ADR-2 reforça uso restrito de localStorage |
| 7 | Tasks/Subtasks Sequence | PASS | 10 tasks lógicas (ler v1 → portar → criar utilities → Dexie types → verificar src/ intocado → typecheck) |
| 8 | Anti-Hallucination | PASS | Todas as utilities referenciam ficheiros v1 reais (`src/lib/themes.ts`, `src/hooks/useLocalStorage.ts`, etc.) ou arch §16 Epic 0 |
| 9 | Dev Agent Readiness | PASS | Dev Notes explica formato cêntimos PT-PT, restrição localStorage por ADR-2, `rrule` wrapper futuro, env vars |
| 10 | Constitution | PASS | Anti-padrões: não alterar lógica ao migrar, não tocar src/, ADR-2 localStorage restrito, Article IV (não inventar campos types/db.ts) |

---

## Anti-Hallucination Verification

| Claim na story | Fonte | Verificável? |
|----------------|-------|---|
| `themes.ts`, `useLocalStorage.ts`, `usePomodoro.ts` em v1 | `arch-v2 §16 Epic 0` + ficheiros físicos `src/lib/` e `src/hooks/` v1 | A confirmar pelo @dev no momento da implementação (ler ficheiros v1) |
| Cêntimos como integers | `arch-v2 §16 Epic 3` | SIM |
| ADR-2 localStorage restrito | `arch-v2` ADRs | SIM |
| Recurrence wrapper sobre `rrule` | `arch-v2 §16 Epic 3` + §17 packages | SIM |
| Schema v1 utilities portáveis | Verificável via `git ls-files imersao-tools/nexus/src/lib/` | SIM (a confirmar @dev) |

### Should-verify durante implementação

Os ficheiros v1 originais (`themes.ts`, `useLocalStorage.ts`, `usePomodoro.ts`, `lib/config.ts`) **devem existir** em `imersao-tools/nexus/src/`. Se algum não existir, esta story tem gap. Recomendo @dev confirmar com `git ls-files` antes de Task 1.

---

## Findings

### Critical Issues (Must Fix — Story Blocked)

Nenhum.

### Should-Fix Issues

1. **Confirmação prévia de existência v1**: AC1-AC3 assumem que os ficheiros v1 existem com nomes exactos (`themes.ts`, `useLocalStorage.ts`, `usePomodoro.ts`). Recomendo Task 0 implícita: "Verificar `git ls-files imersao-tools/nexus/src/lib/themes.ts` retorna o ficheiro antes de Task 1". Se não existirem com esses nomes exactos, story precisa fix com nome correcto. Não bloqueante mas evita surpresa em runtime.

### Nice-to-Have Improvements

1. **Tests de cobertura**: AC8 valida typecheck mas não cobertura. `format.ts` deveria ter Vitest tests dedicados (já implícito em Testing). Considerar AC adicional: "Vitest tests em `tests/unit/lib/shared/format.test.ts` cobrem casos: zero, negativo, milhar separator".
2. **Cross-link com Story 0.3**: `types/db.ts` é parcialmente preenchido aqui (AC §step 8) e completado em 0.3. Dev Notes mencionam isto mas seria útil flag explícito: "Tipos completos em 0.3 — esta story implementa apenas tipos base que `format.ts` ou `recurrence.ts` precisem".

### Anti-Hallucination Findings

Nenhum, pendente confirmação dos nomes exactos dos ficheiros v1.

---

## Final Assessment

- **Verdict:** **PASS** — pronta para implementação
- **Implementation Readiness Score:** **8/10**
- **Confidence Level:** **High**

Story bem estruturada com migração honesta (copiar+adaptar imports, não reescrever). Single concern minor: confirmação prévia de nomes v1. Decisão @po: PASS — @dev pode confirmar no momento de Task 1.

**Próximo passo:** `@dev *develop 0.2` (após 0.1 done).
