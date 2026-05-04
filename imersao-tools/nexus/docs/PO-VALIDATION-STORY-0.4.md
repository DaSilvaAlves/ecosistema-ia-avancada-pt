# PO Validation — Story 0.4: Layout chat-first com chat metade esquerda + sidebar 360px

**Validator:** Pax (`@po`)
**Date:** 04/05/2026
**Story:** `imersao-tools/nexus/docs/stories/active/0.4.story.md`
**Verdict:** **PASS**
**Implementation Readiness Score:** 9/10
**Confidence Level:** High

---

## 10-Point Story Checklist

| # | Critério | Status | Notas |
|---|----------|:---:|---|
| 1 | Template Completeness | PASS | Todas as secções presentes |
| 2 | File Structure | PASS | 9 ficheiros: route groups, layout, ChatPanel, MessageList, InputBox, Header, Sidebar, SidebarDrawer |
| 3 | UI/Frontend Completeness | PASS | AC2-AC5 cobrem dimensões exactas (h:56px header, 360px sidebar, max-w 900px chat), glassmorphism, atalhos teclado, breakpoints responsive 4 níveis |
| 4 | Acceptance Criteria | PASS | 8 AC's verificáveis: layout split, header sticky+glass, InputBox autosize+atalhos, sidebar 360px, responsive breakpoints, fundo `#04040A`, message bubbles, redirect placeholder |
| 5 | Validation/Testing | PASS | Vitest+Testing Library para `/`, `↵`, `⇧↵`; smoke manual; E2E placeholder até Story 0.9 |
| 6 | Security | PASS | Auth placeholder claramente marcado para substituir em 0.6; comentário `// TODO` no código |
| 7 | Tasks/Subtasks Sequence | PASS | 12 tasks ordenadas (route groups → layout → ChatPanel → MessageList → InputBox → Header → Sidebar → SidebarDrawer → responsive → tokens → smoke) |
| 8 | Anti-Hallucination | PASS | Cada AC referencia `front-end-spec-v2.md §2.1, §2.2, §2.3, §3.1, §8.2` ou ADR UX-1; dimensões exactas do wireframe |
| 9 | Dev Agent Readiness | PASS | Dev Notes apontam wireframe exacto §3.1 + tabela dimensional §2.2; breakpoints §2.3; max-w 900px; sidebar border 1px |
| 10 | Constitution | PASS | Anti-padrões: light mode, cores fora paleta, gradientes não-permitidos, fontes além Inter/JetBrains, ícones além lucide-react, lógica chat real (Epic 1), auth real (0.6), reabertura UX-1 |

---

## Anti-Hallucination Verification

| Claim na story | Fonte | Verificável? |
|----------------|-------|---|
| Sidebar 360px | UX-1 (front-end-spec §0) + §2.2 | SIM |
| Header sticky h:56px glassmorphism | front-end-spec §2.2 | SIM |
| InputBox h min:64px max:200px + atalhos `/`, `↵`, `⇧↵` | front-end-spec §3.1 + §2.1 | SIM |
| Responsive breakpoints 1280/1024/768 | front-end-spec §2.3 | SIM |
| Bolha utilizador `rgba(0,245,255,0.08)` | design-system + front-end-spec §5 | SIM |
| Mobile drawer com triggers (☰/swipe/Esc/backdrop) | front-end-spec §8.2 | SIM |
| Logo `⚡ NEXUS` + nav `[Tarefas][Finanças][Hábitos][Diário][⚙️]` | wireframe §3.1 | SIM |

Nenhuma invenção detectada.

---

## Findings

### Critical Issues (Must Fix — Story Blocked)

Nenhum.

### Should-Fix Issues

Nenhum.

### Nice-to-Have Improvements

1. **AC2 nav com `[⚙️]`**: O wireframe §3.1 mostra nav `[Tarefas][Finanças][Hábitos][Diário][⚙️]` — porém UX-5 menciona vistas `/tasks`, `/finance`, `/habits`, `/journal`, `/knowledge`, `/settings`. Falta `[Conhecimento]` no nav da Story 0.4. Sugiro confirmar com Aria/Uma: ou ajustar wireframe ou adicionar Conhecimento ao header. Não bloqueante para 0.4 (header pode ser placeholder; Epic 5 é Knowledge).
2. **Mensagem mock**: Tasks descrevem chat com bolhas mas não menciona que mostrar mensagens mock. Sugerir Task 13: "Inserir 2 mensagens mock estáticas em `MessageList` (uma utilizador, uma agente) para validar visualmente bolhas + alinhamento". Anti-padrão diz "não implementar lógica chat real" — mas mock estático é UX validation legítima.
3. **MorningBriefing pinned**: Wireframe §3.1 mostra "⭐ MORNING BRIEFING" pinned no topo do chat (UX-2). Story 0.4 não menciona. UX-2 ADR pode ser implementado em Epic 1, mas Story 0.4 deveria ter placeholder visual ou nota: "Morning Briefing é UX-2; implementação Epic 1 — em 0.4 não renderizar".

### Anti-Hallucination Findings

Nenhum.

---

## Final Assessment

- **Verdict:** **PASS** — pronta para implementação
- **Implementation Readiness Score:** **9/10**
- **Confidence Level:** **High**

Story muito bem dimensionada e respeita decisões UX (UX-1 inegociável). Os 3 nice-to-haves são refinamentos minor — não bloqueiam @dev.

**Próximo passo:** `@dev *develop 0.4` (após 0.1, 0.2, 0.3 done).
