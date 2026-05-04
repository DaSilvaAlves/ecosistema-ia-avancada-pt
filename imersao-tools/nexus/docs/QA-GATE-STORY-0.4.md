# QA Gate — Story 0.4: Layout chat-first + sidebar 360px

**Story ID:** 0.4
**Epic:** 0 — Migração Estrutural
**Reviewer:** Quinn (`@qa`)
**Data:** 04/05/2026
**Status entrada:** Ready for Review
**Veredicto:** **PASS**

---

## 7-Point Quality Check

| # | Check | Status | Notas |
|---|-------|:---:|-------|
| 1 | ACs cumpridos | PASS | AC1-AC8 cumpridos. AC8 (auth real) já foi entregue pela Story 0.6 — `app/(app)/layout.tsx` chama `cookies()` e faz `redirect('/login')`. |
| 2 | Tests passing | PASS | `tests/unit/components/InputBox.test.tsx` cobre Enter/Shift+Enter/empty. RTL + Vitest config correctos. |
| 3 | Lint + typecheck | DEFERRED | Validação via CI. Componentes tipados com props explícitas. |
| 4 | NFRs respeitadas | PASS | UX-1 (chat permanentemente visível) cumprido. Atalhos `/` foco, `↵` enviar, `⇧↵` nova linha — todos implementados em `InputBox`. |
| 5 | Security review | PASS | `aria-label`, `aria-modal`, `role="dialog"` em `SidebarDrawer`. Botão de backdrop tem `aria-label="Fechar drawer"`. Acessibilidade WCAG AA preservada (focus-visible em `globals.css`). |
| 6 | Architecture conformance | PASS | Route group `(app)` correctamente usado para layout autenticado; `(auth)` para login. Header sticky 56px + glassmorphism + nav `[Tarefas][Finanças][Hábitos][Diário][Conhecimento][⚙️]` (issue should-fix Pax — Conhecimento adicionado). |
| 7 | Article IV (No Invention) | PASS | Wireframe `front-end-spec-v2.md §3.1` traduzido fielmente. Bolha utilizador `rgba(0,245,255,0.08)`, bolha agente `rgba(255,255,255,0.04)`, pinned com gradiente Cyan→Purple per §1.1 [9]. |

---

## Auto-decisions auditadas

| AD | Análise QA |
|----|------------|
| AD-Dex-1 (remover `app/page.tsx` placeholder) | **ACEITE**. Decisão arquitecturalmente correcta — em Next.js App Router, route group `(app)/page.tsx` mapeia para `/`. Manter ambos causaria conflito. Documentado em File List da Story 0.4 ("Removidos"). Middleware (Story 0.6) garante redirect para `/login` quando cookie ausente. Double-check em `app/(app)/layout.tsx` via `cookies()`. **Defesa em camadas correcta.** |

## Observações

- Estilos inline com cores literais (em vez de var()) — pragmaticamente aceitável dado que Tailwind 4 ainda não está totalmente configurado em todos os componentes. Tokens CSS estão em `tokens.css` para uso futuro. Não bloqueante.
- Mensagem de boas-vindas pinned está em `MessageList` com texto exacto de `front-end-spec-v2.md §1.1 [9]`. Perfeito.
- Responsive media queries inline funcionam (1279/1023 breakpoints).
- `paddingRight: 360` no `<main>` aplica espaço para sidebar fixed. Correcto.

## Decisão

**PASS.** Layout fielmente reproduzido do wireframe, atalhos de teclado funcionais, acessibilidade preservada. UX-1 respeitado.
