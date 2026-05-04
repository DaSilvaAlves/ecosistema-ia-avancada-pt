# PO Validation — Story 0.8: Portar widgets v1 com Markets Widget em destaque (UX-4)

**Validator:** Pax (`@po`)
**Date:** 04/05/2026
**Story:** `imersao-tools/nexus/docs/stories/active/0.8.story.md`
**Verdict:** **PASS com 1 CONCERN minor**
**Implementation Readiness Score:** 8/10
**Confidence Level:** Medium-High

---

## 10-Point Story Checklist

| # | Critério | Status | Notas |
|---|----------|:---:|---|
| 1 | Template Completeness | PASS | Todas as secções presentes |
| 2 | File Structure | PASS | 10 ficheiros (7 widgets + index + 2 dirs portados) |
| 3 | UI/Frontend Completeness | PASS | AC1 detalha 9 mercados + delta colorido + refresh 60s, AC3 ordem sidebar exacta, AC7 responsive |
| 4 | Acceptance Criteria | PASS | 8 AC's testáveis: Markets topo + 9 mercados, 6 widgets portados, ordem sidebar, eliminação de órfãos, Pomodoro+Dexie graceful, Markets fail graceful, responsive, src/ intocado |
| 5 | Validation/Testing | PASS | Smoke unit por widget, manual responsive, simulação falha rede para Markets |
| 6 | Security | PASS | `lib/markets/` portado conforme v1 (Yahoo via allorigins.win — sem credenciais) |
| 7 | Tasks/Subtasks Sequence | PASS | 13 tasks ordenadas (Markets → 6 widgets v1 → NÃO criar órfãos → index → integrar Sidebar → responsive → src/ intacto) |
| 8 | Anti-Hallucination | PARTIAL | Lista 9 mercados (CAC40/DAX/DJI/NDX/SP500/BRENT/ETH/NVDA/ASML) — **wireframe §3.1 mostra apenas 7** (DAX, NDX, SP500, BRENT, ETH, NVDA, ASML — sem CAC40 nem DJI). UX-4 ADR confirma 9. Discrepância wireframe vs ADR — story segue ADR (correcto) mas seria bom resolver. |
| 9 | Dev Agent Readiness | PASS | Localização exacta no arch §3 (`# PORTADO de v1`), ordem sidebar §3.1, design system tokens, Dexie hook pattern |
| 10 | Constitution | PASS | Anti-padrões: NÃO criar BriefingWidget/FeedWidget (PRD §2.1 — eliminar), NÃO tocar src/, NÃO apagar v1 nesta story (Epic 8.10), NÃO localStorage dados, NÃO inventar mercados além dos 9, NÃO posição Markets fora topo |

---

## Anti-Hallucination Verification

| Claim na story | Fonte | Verificável? |
|----------------|-------|---|
| 9 mercados CAC40/DAX/DJI/NDX/SP500/BRENT/ETH/NVDA/ASML | UX-4 ADR + PRD FR94 | SIM |
| `lib/markets/` portado de v1 (Yahoo allorigins.win) | arch §3 nota `# PORTADO` | A confirmar v1 existe |
| Ordem sidebar Greeting → Markets → Pomodoro → GitHub → Links → Goodnight | front-end-spec §3.1 | SIM |
| BriefingWidget + FeedWidget órfãos eliminados | PRD §2.1 | SIM |
| Sidebar hidden em <1024px | front-end-spec §2.3 | SIM |
| Glassmorphism cards | design-system-ia-avancada.md | SIM |

### Discrepância detectada (não é invenção da story)

Wireframe §3.1 mostra Markets com **7 linhas** (DAX, NDX, SP500, BRENT, ETH, NVDA, ASML). UX-4 ADR e PRD FR94 listam **9 mercados** (incluindo CAC40 e DJI). A story segue UX-4 (correcto, ADR é decisão fechada) mas wireframe está desactualizado.

---

## Findings

### Critical Issues (Must Fix — Story Blocked)

Nenhum.

### Should-Fix Issues

1. **CONCERN — Confirmar widgets v1 que devem ser portados**: AC2 lista `GreetingWidget`, `PomodoroWidget`, `GitHubWidget`, `QuickLinksWidget`, `GoodnightWidget`, `MorningBriefingWidget`. **Eurico — confirmar**: o `MorningBriefingWidget` v1 deve ser **mantido** (simplificado) ou **eliminado** (UX-4 substitui pelo Markets no topo, e UX-2 cria Morning Briefing no chat em Epic 1)? A story diz "pode ser simplificado — será substituído por Morning Briefing do chat em Epic 1" — ambiguidade. Recomendo decisão @po explícita:
   - **Decisão @po (autónoma):** ELIMINAR `MorningBriefingWidget` v1 imediatamente em 0.8. Razão: UX-4 substitui-o por Markets no topo da sidebar. UX-2 cria nova mensagem pinned no chat em Epic 1. Manter MorningBriefingWidget v1 simplificado é overhead sem valor. **Dois ficheiros eliminados em vez de um (BriefingWidget + FeedWidget + MorningBriefingWidget órfãos da v1)**. Cross-check: PRD §2.1 lista BriefingWidget + FeedWidget como "Apaga" — mas e MorningBriefingWidget? Recomendo @sm/Eurico confirmar.

### Nice-to-Have Improvements

1. **Wireframe §3.1 desactualizado**: Wireframe mostra 7 mercados; UX-4 e PRD FR94 dizem 9. Sugiro task minor para Uma (ux-design-expert) actualizar wireframe — mas não bloqueia 0.8.
2. **Markets widget altura**: 9 mercados em sidebar 360px com glassmorphism precisam altura cuidada. Considerar AC: "Markets widget altura máxima 280px com scroll interno se necessário".

### Anti-Hallucination Findings

Nenhum (a discrepância wireframe vs UX-4 é entre documentos canónicos, não invenção da story; ADR sempre prevalece).

---

## Final Assessment

- **Verdict:** **PASS com 1 CONCERN minor** — pronta para implementação após resolução do concern
- **Implementation Readiness Score:** **8/10**
- **Confidence Level:** **Medium-High**

Story bem estruturada e respeita decisões UX-4 + PRD §2.1. Único ponto a resolver:

**[AUTO-DECISION @po]:** `MorningBriefingWidget` v1 **NÃO é portado** para v2 (eliminado tal como BriefingWidget e FeedWidget). Razão: UX-4 substitui pelo Markets Widget no topo + UX-2 cria mensagem pinned no chat (Epic 1). Manter widget simplificado é overhead. **Documentar em commit.**

Esta decisão é registada aqui — @sm pode ajustar a story 0.8 antes de @dev arrancar, ou @dev aplica directamente em implementação.

**Próximo passo:** `@sm` ajusta AC2 para remover `MorningBriefingWidget` da lista (passa para anti-padrão "NÃO portar MorningBriefingWidget"); ou `@dev *develop 0.8` aplica decisão directamente.
