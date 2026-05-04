# PO Validation Report — front-end-spec-v2.md

**Validador:** Pax (`@po`)
**Data:** 04/05/2026
**Documento validado:** `imersao-tools/nexus/docs/front-end-spec-v2.md` (1281 linhas, 12 secções, 5 UX-ADRs)
**Autor do documento:** Uma (`@ux-design-expert`)
**Trace de input:**
- `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` (96 FRs, 24 NFRs, 8 Epics, 11 Constraints)
- `imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md` (verdict prévio CONCERNS 7,2/10, gap G1 atribuído a `@ux-design-expert`)
- `imersao-tools/nexus/docs/architecture-v2.md` (5 ADRs — input, não tema de validação UX)
- `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-front-end-spec-v2-completa-aguarda-po.md` (handoff de input)
- `.claude/rules/design-system-ia-avancada.md` + `.claude/rules/brandbook.md` (constraint C4)
- `.aiox-core/constitution.md` (Article IV — No Invention)

---

## Sumário Executivo

| Verdict | Score |
|---------|-------|
| **PASS** (avança para Epic 0 sem revisão obrigatória) | **8,9 / 10** |

**Razão:** Front-end Spec v2 fecha completamente o gap G1 da PO validation prévia (wireframes chat-first inexistentes). Entrega 5 user flows críticos com passos numerados (login/onboarding, multi-intent killer flow, criar tarefa via UI, brain dump, foto recibo), 7 wireframes ASCII low-fi para todas as vistas detalhadas (`/`, `/tasks`, `/finance`, `/habits`, `/journal`, `/knowledge`, `/settings`), 5 componentes UI especificados com props/layouts/tokens/dimensões exactas (ToolCard, PreviewModal, UndoToast, VoiceModeButton, PomodoroTaskLink), aplicação 100% do design system [IA]AVANÇADA PT (paleta, tipografia, glassmorphism, gradientes restritos), estados (empty/loading/error/offline) cobertos, acessibilidade WCAG AA com contrastes calculados, mobile responsive com breakpoints e touch gestures, e tabela de cobertura PRD FRs/NFRs→componentes UX. As 5 UX-ADRs estão justificadas e compatíveis com as 5 ADRs do architecture. Os 3 issues observados são minor — registos para discussão sem bloquear avanço.

---

## 10-Point Validation Checklist

### Ponto 1 — UX spec cobre 100% das vistas necessárias para os FRs

| Status | Evidência |
|--------|-----------|
| ✅ PASS | §9 entrega tabela explícita de cobertura FR/NFR → componente UX. FR1-FR8 (chat input, multi-intent, audit, preview, undo, consultas, histórico) materializados em §1.2 + §2.1 + §3.1 + §4. FR9-FR15 (tarefas) em §3.2 (3 vistas Lista/Kanban/Calendário). FR16-FR23 (finanças) em §3.3 (4 tabs). FR24-FR28 (hábitos) em §3.4 (heatmap). FR42-FR46 (diário) em §3.5 (calendário mood + Tiptap). FR47-FR50 (brain dump) em §1.4 + BrainDumpModal. FR51-FR57 (conhecimento) em §3.6 (árvore 3-níveis). FR77-FR80 (voice) em §4.4 (VoiceModeButton 5 estados). FR81-FR85 (OCR) em §1.5a (drag-drop) + §1.5b (Telegram). FR86-FR89 (briefing matinal/nocturno) em §1.1 + §3.1 (mensagem `pinned`). FR90-FR92 (auth/setup) em §1.1 (login + OnboardingModal 4 steps). FR93-FR96 (widgets v1) em §2.1 + §3.1 (sidebar). |

**Notas:** Ver Issue I-U-1 abaixo sobre FR63-68 (Gmail vista detalhada) marcado como "futuro Epic 6 — não MVP de UX".

### Ponto 2 — UX spec não contradiz architecture v2 (ADRs respeitadas)

| Verificação | Status |
|-------------|--------|
| UX modais fullscreen (UX-5) compatível com Next.js parallel routes (arch §3) | ✅ |
| UX ToolCard inline 6 estados compatível com SSE events `tool_start`/`tool_complete`/`tool_error` (arch §8) | ✅ Os 6 estados (loading/success/error/preview-required/reverted/interrupted) mapeiam aos eventos SSE do executor |
| UX UndoToast 30s compatível com `reverse()` no Tool Registry (arch §7.2 reversible flag) | ✅ |
| UX `pinned` Morning Briefing compatível com `chat_messages` schema (arch §6.1) | ✅ Nada na schema bloqueia uma flag `pinned` ou `role: 'assistant-pinned'` |
| UX Tiptap editor (§3.5 diário) compatível com ADR-3 (Tiptap 2 com extensions limitados StarterKit + TaskList + Link + Placeholder, arch §16 Epic 5) | ✅ Bate exactamente |
| UX dnd-kit no Kanban (§3.2) e drag-and-drop foto recibo (§1.5a) compatível com `@dnd-kit/core` em arch §17 | ✅ |
| UX mobile drawer + touch gestures (§8) compatível com PWA + Service Worker arch §11 | ✅ Service Worker manual já prevê pull-to-refresh, push notifications |

| Status | Evidência |
|--------|-----------|
| ✅ PASS | Sem contradição detectada. UX explicitamente declara em §0 "Não reabre ADRs do architecture-v2.md. Aceita-os como input." e em §11 "Constrangimentos do architecture-v2 respeitados". |

### Ponto 3 — Constraints C1–C11 do PRD respeitadas

| # | Constraint | UX trace |
|---|-----------|----------|
| C1 | Single-user (só Eurico) | Wireframes assumem único utilizador (sem multi-tenant UI, sem switcher de utilizador, sem "convidados") |
| C2 | Zero custos externos | Sem componentes UI que requeiram serviços pagos extra |
| C3 | PT-PT exclusivo | Documento todo em PT-PT; §7.6 confirma `<html lang="pt-PT">`; Web Speech `lang: 'pt-PT'`; placeholders em PT-PT (ex: "Vomita ideias 10 minutos seguidos. Sem censura.") |
| C4 | Design system [IA]AVANÇADA PT | §5 inteiramente dedicado à aplicação operacional do design system: paleta CSS custom properties, mapeamento semântico→cor, tipografia Inter/JetBrains Mono escalas exactas, glassmorphism, gradientes restritos a 3 (§5.5), iconografia lucide-react (§5.6) |
| C5 | Constitution AIOX | §11 confirma "Constrangimentos do architecture-v2 respeitados" + §10 anti-padrões + §12 auto-checklist; cada componente UX trace a FR ou NFR |
| C6 | Telegram (não WhatsApp) | §1.5b Path B foto via Telegram bot; §3.7 Tab Integrações com `@nexus_eurico_bot` |
| C7 | Web Push | §1.1 step 7 (Onboarding step 2: "Activar Web Push"); sem componentes SMS/email |
| C8 | Web Speech API | §4.4 VoiceModeButton com 5 estados, §7.6 confirma Web Speech recognition + synthesis em PT-PT, §4.4 estado `unsupported` para browsers sem suporte |
| C9 | Deploy Vercel | UX assume deploy Vercel (URL `nexus-eurico.vercel.app` em §1.1) |
| C10 | Build não destrói v1 | §3.1 wireframe lista widgets v1 mantidos no sidebar (Greeting, Pomodoro, GitHub, Markets, Links, Goodnight) |
| C11 | Jarvis NÃO existe | Zero menções a Jarvis no documento |

**Observação:** C4 é o constraint mais crítico para uma UX spec. §5 + §10 (anti-padrões) garantem aplicação rigorosa.

| Status | Evidência |
|--------|-----------|
| ✅ PASS | Todas as 11 Constraints respeitadas. C4 (design system) tem aplicação operacional integral em §5 + §10. |

### Ponto 4 — Zero invenção (Constitution Article IV)

| Status | Evidência |
|--------|-----------|
| ✅ PASS | §0 declara "Não reabre ADRs do architecture-v2.md". §9 entrega tabela rastreável FR/NFR → componente UX → secção do documento. §12 auto-checklist confirma "Sem invenção de features fora do PRD". |

**Issue minor I-U-2 (não bloqueante):** UX-4 (Markets Widget no topo da sidebar substituindo MorningBriefingWidget v1 órfão) não é literal do PRD — é interpretação da memória persistente do Eurico ("Nexus é foco em mercados financeiros e continuidade, não notícias tech"). Trace é via memória persistente declarada no handoff de input + alinha com FR93-96 (widgets v1 mantidos). É decisão de design legítima mas convém flag.

### Ponto 5 — Riscos identificados em PRD §11 têm mitigação UX documentada

| Risco PRD | Mitigação UX |
|-----------|--------------|
| Risco #1 — cobertura 60% adiada para Epic 8 | Não aplicável a UX directamente — endereçado em arch §5 |
| Risco #2 — multi-intent confidence baixa | UX §1.2 estado `preview-required` (Gold borda + botões Confirmar/Cancelar/Editar) materializa FR5 (preview <70% confidence) — utilizador vê e decide |
| Risco #3 — OCR Anthropic Vision em recibos PT | UX §1.5a PreviewModal sempre aparece para recibos (porque OCR sempre tem confidence < 70%) — utilizador edita campos antes de gravar |
| Risco #4 — OAuth Google verification screen | UX §1.1 Step 3 onboarding admite "Saltar" — Eurico pode ligar Google mais tarde nas Definições. Reduz fricção inicial. |
| Risco #5 — Telegram bot policy | UX §1.1 Step 4 onboarding admite "Saltar" — não bloqueia uso da app |

| Status | Evidência |
|--------|-----------|
| ✅ PASS | Riscos do PRD têm contrapartida UX que reduz impacto operacional. |

### Ponto 6 — Estados (empty/loading/error/offline) testáveis

| Status | Evidência |
|--------|-----------|
| ✅ PASS | §6 dedicado completo. §6.1 estado vazio para cada uma das 7 vistas com texto e acção sugerida. §6.2 7 tipos de loading com indicador específico. §6.3 6 tipos de erro com manifestação visual. §6.4 estado offline com tabela de operações que continuam vs operações que ficam em fila. Cada estado é testável em isolamento via Vitest+Testing Library (alinhado com arch §5.1 Component layer). |

### Ponto 7 — Acessibilidade WCAG AA mínima

| Critério WCAG | UX trace |
|---------------|----------|
| Contraste >= 4.5:1 (texto normal) | §7.3 contrastes calculados: White sobre #04040A = 16,5:1 ✅, Grey sobre #04040A = 7,8:1 ✅, Cyan sobre #04040A = 13,8:1 ✅, Magenta sobre #04040A = 4,6:1 ✅ |
| Contraste >= 3:1 (texto large) | Todos os contrastes acima superam |
| Focus visible | §7.2 outline 2px Cyan + offset 2px em todos elementos interactivos; nunca remover sem alternativa |
| Keyboard navigation | §7.1 atalhos completos; §3.7 footer com `?` para overlay de lista completa |
| Screen readers | §7.4 `role="dialog"` + `aria-modal` em modais; ToolCards com `role="status"` (loading) e `role="alert"` (erro); UndoToast com `role="alert"` + `aria-live="polite"`; alt/aria-label em PT-PT |
| Reduced motion | §7.5 `prefers-reduced-motion: reduce` desactiva pulsing, slide animations, streaming word-by-word, shake errors — restantes animações reduzem 50% |
| Idioma identificado | §7.6 `lang="pt-PT"` em raiz |

**Alerta documentado:** §7.3 nota que Grey2 `#4A5568` sobre `#04040A` é ~3,4:1 — só usar para texto desactivado/placeholders, NUNCA para informação importante. Boa prática.

| Status | Evidência |
|--------|-----------|
| ✅ PASS | WCAG AA mínima cumprida com critérios concretos verificáveis. |

### Ponto 8 — Mobile responsive com breakpoints + touch + PWA

| Status | Evidência |
|--------|-----------|
| ✅ PASS | §8 dedicado completo. §8.1 4 breakpoints (desktop >=1280, laptop 1024-1279, tablet 768-1023, mobile <768) com layout específico. §8.2 drawer sidebar mobile com triggers (click ☰, swipe right→left, Esc, click backdrop). §8.3 7 touch gestures definidos (swipe drawer, swipe up input multi-line, swipe down fechar modal, long-press mensagem, long-press voice, pull-to-refresh widgets). §8.4 input multi-line modal fullscreen mobile. §8.5 PWA installable com manifest, theme-color, icons 192/512, iOS Safari support. Bate com NFR24 (mobile responsive) e NFR21 (PWA offline). |

### Ponto 9 — Cobertura quality gates Epic 0 (AC1–AC6 do PRD §10 Epic 0)

| AC Epic 0 | UX trace |
|-----------|----------|
| AC1 (Login funcional) | §1.1 Flow 1 com login completo + OnboardingModal 4 steps |
| AC2 (Layout chat-first em `/`) | §2 (paradigma central) + §3.1 (wireframe `/` chat principal) — bloqueia desbloqueia Story 0.4 |
| AC3 (Pelo menos 3 widgets v1 portados) | §3.1 wireframe mostra Markets, Pomodoro, GitHub, Quick Links, Greeting (>3 widgets) — UX-4 prioriza Markets como destaque |
| AC4 (Anthropic SDK + envio prompt + receber texto) | §1.2 Flow 2 multi-intent com streaming SSE, ToolCards, texto agente — UX completa para a primeira interacção real |
| AC5 (Vercel deploy verde) | URL `nexus-eurico.vercel.app` referenciada em §1.1 |
| AC6 (Build verde + lint + typecheck) | UX não impacta directamente — endereçado em arch |

| Status | Evidência |
|--------|-----------|
| ✅ PASS | Os 6 ACs do Epic 0 com correspondência a UX (especialmente AC2 chat-first layout, que era o gap G1). |

### Ponto 10 — Documento pronto para `@sm` partir Epic 0 e Stories de UI sem ambiguidade bloqueante

| Status | Evidência |
|--------|-----------|
| ✅ PASS | Story 0.4 (layout chat-first) tem §2 + §3.1 como input directo. Story 0.7 (onboarding) tem §1.1 com 4 steps numerados. Story 1.X (multi-intent UI) tem §1.2 + §4.1 (ToolCard). Story 2.X (Kanban tarefas) tem §3.2. Story 3.X (finanças) tem §3.3 (4 tabs). Story 5.X (brain dump) tem §1.4. Story 7.X (voice + OCR) tem §4.4 + §1.5a/b. §11 explicitamente diz "Stories de UI (0.4 layout chat-first, 0.7 onboarding) usam wireframes desta spec como referência directa". |

---

## Issues Identificados (3 minor, não bloqueantes)

### I-U-1 — FR63-68 (vista detalhada Gmail) marcado como "futuro Epic 6 — não MVP de UX"

**Severidade:** 🟢 minor (informativo)
**Detalhe:** §9 declara que FR63-68 (Gmail) não tem componente UX dedicado nesta v1.0 da spec — apenas Tab Integrações em `/settings`. Architecture §16 Epic 6 confirma classifier corre via Vercel Cron a cada 30 min e emails importantes são notificados via push e/ou Morning Briefing.
**Impacto:** Para uso interno é aceitável — Eurico vê Gmail importantes via push + briefing. Mas FR63-68 do PRD parecem prever uma vista de revisão classificada que não está materializada na UX.
**Recomendação:** Pax (Eu) propõe: confirmar com Eurico antes de @sm partir Epic 6 se quer ou não vista dedicada `/email` (lista de emails importantes do dia). Se sim, adicionar ao backlog UX como v1.1. Se não, marcar FR63-68 como "satisfeitos via notificação push + briefing matinal" no PRD.

### I-U-2 — UX-4 (Markets Widget topo sidebar) — trace via memória persistente, não literal do PRD

**Severidade:** 🟢 minor (rastreabilidade)
**Detalhe:** A decisão UX-4 (Markets Widget no topo da sidebar substituindo MorningBriefingWidget v1 órfão) é justificada pela memória persistente do Eurico ("Nexus é foco em mercados financeiros e continuidade, não notícias tech") + alinha com FR93-96 (widgets v1 mantidos). Mas não é literal do PRD — é interpretação UX legítima do contexto.
**Impacto:** Sem impacto operacional. Decisão de design coerente com a visão do projecto. Apenas trace é menos directo que outras decisões.
**Recomendação:** Aceitável. Se Eurico quiser garantir alinhamento futuro, pode adicionar uma linha ao PRD §6 (widgets sidebar) confirmando que Markets é destaque visual prioritário — não bloqueante.

### I-U-3 — Wireframes ASCII §3 contêm exemplos com nomes pessoais ("Pedro", "Maria", "Frusoal", "Carnegie")

**Severidade:** 🟢 minor (uso interno aceitável)
**Detalhe:** Os wireframes ASCII das vistas detalhadas mostram exemplos de tarefas/notas/projectos com nomes que são identificáveis (Pedro = Frusoal, Carnegie = livro pessoal, etc.). Para uso interno de Eurico isto é zero problema — é o vocabulário real dele.
**Impacto:** Apenas seria flag para uma SaaS multi-utilizador. Para Nexus single-user é informação útil que ajuda a visualizar o uso real.
**Recomendação:** Manter — bate com a realidade do Eurico. Se um dia o Nexus for partilhado externamente (ex: para Hub Lendário), substituir por nomes genéricos.

---

## Adequação Constitutional

| Article | Compliance |
|---------|-----------|
| **I — CLI First** | ⚠️ N/A parcial — UX é por natureza UI-first. Mas operações estão acessíveis via chat (paradigma "tudo via chat") que é semanticamente próximo de CLI. Aceitável. |
| **II — Agent Authority** | ✅ UX documenta Uma como autora; @dev implementa, @qa valida. Sem violação. |
| **III — Story-Driven** | ✅ §11 mapeia Stories de UI a secções específicas. |
| **IV — No Invention** | ✅ §0 + §9 + §12 auto-checklist confirmam zero invenção. UX-4 é flag minor (I-U-2) mas com trace via memória persistente declarada. |
| **V — Quality First** | ✅ §6 estados testáveis, §7 acessibilidade WCAG AA, §10 anti-padrões, §12 auto-checklist. |
| **VI — Absolute Imports** | ✅ N/A directo a UX (responsabilidade do código). |

---

## Decisão Final

### Verdict: **PASS — PROCEED PARA EPIC 0**

**Pode avançar para `@sm` (River) partir Epic 0 em stories 0.1-0.10 sem revisão obrigatória deste documento.**

Os 3 issues identificados (I-U-1, I-U-2, I-U-3) são minor e não bloqueiam Story 0.1 ou Story 0.4 (chat-first layout, que foi o gap original G1 a fechar). Podem ser endereçados em sessão dedicada ou diferidos para revisão futura sem risco.

### Score detalhado

| Critério | Peso | Score | Pontos |
|----------|------|-------|--------|
| Cobertura FRs/NFRs | 15% | 9/10 | 1,35 |
| Coerência com architecture | 15% | 10/10 | 1,50 |
| Constraints respeitadas | 15% | 10/10 | 1,50 |
| Zero invenção (Article IV) | 10% | 9/10 | 0,90 |
| Riscos com mitigação UX | 5% | 9/10 | 0,45 |
| Estados testáveis | 10% | 10/10 | 1,00 |
| Acessibilidade WCAG AA | 10% | 9/10 | 0,90 |
| Mobile responsive | 5% | 10/10 | 0,50 |
| Quality gates Epic 0 | 5% | 10/10 | 0,50 |
| Pronto para @sm | 10% | 9/10 | 0,90 |
| **Total** | **100%** | — | **8,90** |

---

## Action Items

| Owner | Acção | Quando |
|-------|-------|--------|
| Pax (Eu) | Produzir handoff de saída para `@sm` (River) com referência a esta validation + PO-VALIDATION-ARCHITECTURE-V2.md | Imediato |
| Pax (Eu) | Marcar handoff de input consumed + mover para archive + actualizar HANDOFF-INDEX | Imediato |
| Eurico (eventualmente) | Decidir se quer vista dedicada `/email` (FR63-68) — opcional, não bloqueia Epic 0 | Quando puder |
| @sm (River) | Partir Epic 0 em stories 0.1-0.10 baseadas em §3 (wireframes) + §1 (user flows) deste documento + §16 do architecture | Após handoff entregar |

---

*PO validation completa por Pax (`@po`) em 04/05/2026. Verdict: PASS 8,9/10 — proceder para Epic 0 sem revisão obrigatória.*
