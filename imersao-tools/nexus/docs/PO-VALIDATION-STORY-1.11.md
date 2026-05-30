# PO Validation — Story 1.11 (Executor client-side: cérebro persiste, ADR-9)

**Validador:** Pax (`@po`)
**Data:** 30/05/2026
**Story:** `docs/stories/active/1.11.story.md`
**Epic:** 1 — Cérebro Multi-Intent (hardening pós-Epic; correcção ADR-9)
**Protocolo:** `*validate-story-draft` (10-point + Executor Assignment + Anti-Hallucination)

---

## Veredicto

**GO — 9/10 — Confidence: High** (com recomendação de faseamento)

A story está implementável e excelentemente fundamentada. É uma correcção a um **bug HIGH de produção** (a funcionalidade headline — "escreve uma frase e o Nexus trata" — está partida) e ancora tudo em ADR-9 + código real verificado, sem invenção. O ponto mais forte: o **insight de scope de que as 12 tools não mudam** (já usam `ctx.db.*`), o que reduz drasticamente o risco — a mudança é na orquestração, não na lógica de domínio. Confirmei a alegação mais arriscada (AC2): o `/api/anthropic/proxy` é um proxy Anthropic genérico que já aceita `messages/model/stream/tools/system` com passthrough SSE — logo a Opção B (executor client-side) é viável com **infra existente**, sem novos endpoints.

O **-1** é a única reserva real: é uma story **COMPLEX** que toca o runtime core do cérebro numa só unidade. O draft já o sinaliza e propõe split 1.11a/1.11b — mitigação correcta. Recomendo (não-bloqueante) implementar em 2 fases para destrancar a escrita rapidamente.

---

## Confirmação de dependências (evidência real — verificada nesta sessão)

| Alegação da story | Estado | Evidência |
|-------------------|--------|-----------|
| Executor Edge injecta `db = null` | ✅ verdadeiro | `executor.ts:416` + comentário "Edge runtime NÃO tem IndexedDB" |
| 12 tools chamam `ctx.db.*` directamente | ✅ verdadeiro | `tasks.ts:198,220,244,281,327,368` (`ctx.db.tasks/projects`); idem `finance.ts`/`projects.ts` |
| Command pattern nunca implementado | ✅ verdadeiro | `executor.ts:415` `@todo` aberto |
| `useAgentStream` persiste chat-log mas não a entidade de domínio | ✅ verdadeiro | `useAgentStream.ts:107-123` (ToolCall metadata); `:405` faz `fetch('/api/agent/prompt')`; nunca `db.tasks.add` |
| `/api/agent/prompt` itera `runAgent` (Edge) | ✅ verdadeiro | `prompt/route.ts:53,166` |
| `/api/anthropic/proxy` serve inferência streaming p/ classifier+executor | ✅ verdadeiro | `proxy/route.ts:26-33` (`messages,model,stream,tools,system`), `:152-160` (SSE passthrough), `runtime='edge'`, key server-only |

**Conclusão:** o bug é real e a infra para a correcção (proxy genérico, tools que já usam `ctx.db`, hook client com `db` real) **já existe**. A story não inventa nada.

---

## Resumo dos 10 pontos

| # | Critério | Veredicto |
|---|----------|-----------|
| 1 | Alignment ADR/arch (sem invenção) | PASS |
| 2 | AC testáveis | PASS |
| 3 | Executor Assignment (`separation-of-roles.md`) | PASS |
| 4 | Teste de componente (`react-component-test-criteria.md`) | N/A → PASS (sem UI nova) |
| 5 | Dependências satisfeitas (verificadas em código) | PASS |
| 6 | `external-contract-identifiers.md` | PASS |
| 7 | Design system | N/A → PASS (UI inalterada) |
| 8 | Scope claro + ficheiros corretos | PASS |
| 9 | Sequência de tasks coerente | PASS |
| 10 | Qualidade/gates definidos | PASS |

**Score:** 10 PASS, **-1** por sizing COMPLEX numa só unidade (mitigado pela nota de split) = **9/10**.

---

## Recomendações (não-bloqueantes)

- **REC-1 (faseamento) — recomendado:** implementar em 2 fases para destrancar produção depressa:
  - **Fase 1 (1.11a):** AC1 (executor injectável) + AC2 (transport proxy) + AC3 (`ctx.db` real) + AC5 (escrita "anota a tarefa") + AC12 (qualidade). Isto faz "anota a tarefa de comprar pão" funcionar — o bug do Eurico — e pode ir para produção sozinho.
  - **Fase 2 (1.11b):** AC6 (leitura) + AC7 (confirmação in-process) + AC8 (undo client) + AC9 (fidelidade mock) + AC10 (deprecar) + AC11 (regression 50-prompt).
  - A decisão final de split (1 story em 2 fases vs 2 stories) fica para o `@architect` no arranque do `*develop`, como o draft já prevê.
- **REC-2 (AUTO-DECISIONS):** as 7 [AUTO-DECISIONS] (A1-A7) são propostas do `@sm` — o `@architect` **deve ratificá-las explicitamente** no início do `*develop` (em especial A1 forma injectável, A4 undo sem KV, A5 deprecação). Não bloqueia o GO; é o gate de design.
- **REC-3 (AC10 — callers de `runAgent`):** confirmar zero outros consumidores de `/api/agent/prompt`/`runAgent` (Telegram Epic 6 não existe ainda) antes de remoção física. O draft já difere a remoção para follow-up — correcto.
- **REC-4 (governança Epic 1):** a 1.11 é uma correcção pós-fecho do Epic 1 (10/10 Done). Registar no EPIC-1 que a 1.11 é hardening post-hoc (não altera o histórico das 1.1-1.10). Cosmético.

---

## Anti-Hallucination Findings

Nenhum. Todas as afirmações técnicas verificadas contra o código real nesta sessão (ver tabela de dependências). O contrato externo (Anthropic via proxy) é existente e a story respeita `mock-protocol-fidelity.md` (AC9) na fronteira correcta.

---

## Final Assessment

- **Decisão:** **GO** — aprovada para implementação.
- **Implementation Readiness Score:** 9/10
- **Confidence:** High
- **Status:** Draft → **Ready**
- **Próximo passo SDC:** `@dev *develop 1.11` com gate `@architect` (Aria ratifica A1-A7 + decide faseamento no arranque) → quality gate → `@devops *push` → CodeRabbit (hard-stop máx 2 iter) → merge (Eurico) → `@po *close-story 1.11`.

---

*Validação por Pax (`@po`) em 30/05/2026. Ancorada em `1.11.story.md` v0.1 (River), `architecture-v2.md` ADR-9 + §8 + §9.2, e verificação directa de `executor.ts`/`tools/*.ts`/`useAgentStream.ts`/`api/agent/prompt/route.ts`/`api/anthropic/proxy/route.ts`. Regras aplicadas: `separation-of-roles.md`, `mock-protocol-fidelity.md`, `external-contract-identifiers.md`.*
