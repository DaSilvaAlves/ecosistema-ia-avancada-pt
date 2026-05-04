# PO Validation — Story 0.3: Setup Dexie 4 + schema base + dexie-react-hooks

**Validator:** Pax (`@po`)
**Date:** 04/05/2026
**Story:** `imersao-tools/nexus/docs/stories/active/0.3.story.md`
**Verdict:** **PASS**
**Implementation Readiness Score:** 9/10
**Confidence Level:** High

---

## 10-Point Story Checklist

| # | Critério | Status | Notas |
|---|----------|:---:|---|
| 1 | Template Completeness | PASS | Todas as secções; estrutura idêntica a outras stories |
| 2 | File Structure | PASS | 6 ficheiros: `lib/db/client.ts`, `migrations/v1-to-v2.ts`, `migrations/index.ts`, `hooks/useDexie.ts`, `types/db.ts`, `tests/unit/db/client.test.ts` |
| 3 | UI/Frontend | N/A | Story de schema (sem UI directa) |
| 4 | Acceptance Criteria | PASS | 7 AC's testáveis: schema instancia, índices correctos, types completos, useLiveQuery wrapper, migration idempotente, typecheck, smoke test |
| 5 | Validation/Testing | PASS | Vitest com `fake-indexeddb`: instanciar DB, contar tabelas, idempotência da migration |
| 6 | Security | PASS | ADR-2 reforçado (localStorage não para dados); migration idempotente evita duplicação |
| 7 | Tasks/Subtasks Sequence | PASS | 10 tasks ordenadas (instalar → criar client → índices → types → hook → migration → tests setup → smoke test → typecheck) |
| 8 | Anti-Hallucination | PASS | Schema referencia `arch-v2 §4.2` (snippet exacto a copiar), interfaces `§6.1-§6.5`. AC explícito: "snippet exacto, não inventar campos" |
| 9 | Dev Agent Readiness | PASS | Lista 13 tabelas exactas, índices descritos, migration skeleton em `§4.4`, `useLiveQuery` pattern |
| 10 | Constitution | PASS | Anti-padrões: Article IV (não inventar tabelas/campos), ADR-2 (Dexie 4, não RxDB/idb/raw IndexedDB), nomes exactos `transactions` (não `finance_entries`), `knowledge_notes` (não `notes`) |

---

## Anti-Hallucination Verification

| Claim na story | Fonte | Verificável? |
|----------------|-------|---|
| 13 tabelas (tasks, projects, transactions, habits, habit_logs, goals, reminders, journal_entries, knowledge_areas, knowledge_notebooks, knowledge_notes, agent_runs, chat_messages) | `arch-v2 §4.2` | SIM (cruzado) |
| Índices `tasks: 'id, status, projectId, dueDate, *tags, createdAt, lastWorkedAt'` | `arch-v2 §4.2` snippet | SIM |
| Migration idempotente com flag `nexus_v1_migrated_to_v2` | `arch-v2 §4.4` | SIM |
| `dexie@^4.0.0`, `dexie-react-hooks@^4.0.0`, `dexie-export-import@^4.0.0` | `arch-v2 §17` | SIM |
| `fake-indexeddb@^6.0.0` | ADR-4 + arch §5 | SIM |

Nenhuma invenção detectada.

---

## Findings

### Critical Issues (Must Fix — Story Blocked)

Nenhum.

### Should-Fix Issues

Nenhum.

### Nice-to-Have Improvements

1. **AC8 explícito de export/import**: `dexie-export-import@^4.0.0` é instalado no Task 1 mas nenhum AC valida que está exportável. Considerar adicionar AC9: "`dexie-export-import` está importável e funcional para futuro Epic 8 backup ZIP". Não bloqueante — pacote será usado mais tarde.
2. **Coverage gate informativo**: `arch §5.4` define gate 60% para `lib/db/`. Nesta story os tests são smoke — cobertura real chega nos epics. Sugerir nota em Dev Notes: "Esta story estabelece scaffolding; cobertura dos 60% em `lib/db/` é progressiva nos Epics 2-7".

### Anti-Hallucination Findings

Nenhum.

---

## Final Assessment

- **Verdict:** **PASS** — pronta para implementação
- **Implementation Readiness Score:** **9/10**
- **Confidence Level:** **High**

Story exemplar: snippet exacto do schema, anti-padrões cobrem todas as alternativas rejeitadas (RxDB, idb, raw IndexedDB), nomes exactos das tabelas defendidos contra erros típicos. Migration idempotente bem desenhada.

**Próximo passo:** `@dev *develop 0.3` (após 0.1 done; em paralelo com 0.2).
