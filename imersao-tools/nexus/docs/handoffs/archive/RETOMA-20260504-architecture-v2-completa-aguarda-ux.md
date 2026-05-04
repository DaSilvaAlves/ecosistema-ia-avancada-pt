# RETOMA — Nexus v2 — Architecture v2 entregue, aguarda @ux-design-expert (Uma)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

> **CONSUMED:** true
> **CONSUMED_AT:** 2026-05-04 (sessão UX)
> **CONSUMED_BY:** ux-design-expert (Uma)
> **STATUS:** consumed
> **OUTPUT:** `imersao-tools/nexus/docs/front-end-spec-v2.md` (12 secções, 5 user flows, 7 wireframes, 5 componentes UI, design system [IA]AVANÇADA PT aplicado, G1 fechado)
> **HANDOFF DE SAÍDA:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-front-end-spec-v2-completa-aguarda-po.md`

---

## TL;DR (para o agente que entra)

Sou o Eurico. Em sessão de 04/05/2026 (~12:00), Orion (aiox-master) escreveu PRD v2 do Nexus + PO validation. Em sessão seguinte do mesmo dia, **Aria (architect)** consumiu esse handoff e produziu `architecture-v2.md` (resolve G3 e G4). Próximo: `@ux-design-expert` (Uma) precisa de produzir `front-end-spec-v2.md` com wireframes chat-first (resolve G1).

**ZERO CÓDIGO foi tocado.** Apenas documento novo `architecture-v2.md`.

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 |
| Localização | `imersao-tools/nexus/` |
| Sessão actual | 04/05/2026 (architecture) |
| Agente que sai | Aria (architect) |
| Agente que entra | Uma (`@ux-design-expert`) |
| Estado | PRD validado + Architecture entregue. Falta UX spec |

---

## Estado actual exacto

### Documentos do projecto

| Ficheiro | Linhas | Status | Autor |
|---------|--------|--------|-------|
| `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | 675 | ✅ entregue | Orion 04/05 |
| `imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md` | 174 | ✅ entregue | Orion 04/05 (em nome de @po) |
| `imersao-tools/nexus/docs/architecture-v2.md` | ~830 | ✅ NOVO 04/05 | **Aria** |
| `imersao-tools/nexus/docs/front-end-spec-v2.md` | — | ⏳ A CRIAR | **Uma (próxima)** |

### Código

```
git status imersao-tools/nexus/src/   → clean (intocado)
imersao-tools/nexus/v2/               → ainda não existe (criado em Epic 0 Story 0.1)
```

---

## O que Aria decidiu (top 5 ADRs do architecture-v2.md)

| # | Decisão | Resumo |
|---|---------|--------|
| ADR-1 | Edge vs Node por endpoint | Edge: agent/anthropic-proxy/telegram-webhook. Node: auth/google/ocr/push (sdks Node-only) |
| ADR-2 | **IndexedDB via Dexie 4 desde dia 1** (não localStorage) | Dataset estimado 6m ≈ 3MB chega a limite localStorage. FRs analíticos (projecção 30d, heatmap, full-text) precisam de índices |
| ADR-3 | Markdown editor: **Tiptap 2** (não Lexical) | Mais extensões prontas, suporta task-list nativo (Diário, Brain Dump, Notas) |
| ADR-4 | Testing: **Vitest + Playwright + MSW** | MSW para mocks Anthropic/Google/Telegram, mesmo handler em unit+E2E |
| ADR-5 | **Tool Registry pattern central** | `lib/agent/tools/registry.ts` — cada Epic regista tools sem tocar no executor |

### Decisões secundárias importantes

- Repo layout `imersao-tools/nexus/v2/` paralelo a `src/` v1 (não destrói v1 durante migração; Epic 8 Story 8.10 elimina v1)
- Cêntimos como integers em finanças (evita float arithmetic)
- Service Worker manual (não Workbox) — uso simples
- VAPID keys geradas one-time local + postas em env Vercel
- 39 tools totais distribuídas pelos 8 Epics; classifier filtra por domínio para não enviar 39 schemas em cada chamada
- Conflict resolution Calendar 2-way: Google wins (uso interno aceita)
- Telegram webhook autenticação via `secret_token` (Telegram não assina HMAC)

---

## O que Uma (`@ux-design-expert`) tem de fazer

### Output esperado

`imersao-tools/nexus/docs/front-end-spec-v2.md` — front-end specification + wireframes que resolvem **G1** (wireframes chat-first inexistentes — bloqueante para Story 0.4).

### Conteúdo mínimo do front-end-spec-v2.md

1. **User Flows** — 5 fluxos críticos:
   - Login → primeiro carregamento → onboarding
   - Prompt multi-intent: "amanhã reunião 15h, paguei €78,70 supermercado, lembra-me sexta de pagar a luz"
   - Criar tarefa via UI (sem chat)
   - Brain Dump → aprovação item-a-item
   - Foto recibo (drag chat OU Telegram) → finança

2. **Layout do paradigma chat-first**
   - ChatPanel central (input always-visible, histórico infinite-scroll)
   - Sidebar direita com widgets v1 portados (Pomodoro, Markets, GitHub, Links, Greeting, Goodnight, Morning Briefing)
   - Header: logo NEXUS, status conexão, settings
   - Mobile responsive (PWA installable)

3. **Wireframes (low-fi ASCII ou descritivo)**
   - / (chat principal)
   - /tasks (3 vistas: Lista / Kanban / Calendário semanal)
   - /finance (este mês + cartões + património + projecção 30d)
   - /habits (heatmap GitHub-style + lista)
   - /journal (calendário mood + editor Tiptap)
   - /knowledge (árvore Áreas → Cadernos → Notas)
   - /settings (audit log + integrações + backup)

4. **Componentes UI**
   - ToolCard (renderiza resultado de cada tool call no chat — tarefa criada / finança criada / etc.)
   - PreviewModal (confidence < 70% → confirma antes de persistir)
   - UndoToast (30s countdown visível)
   - VoiceModeButton (microfone + indicador visual)
   - PomodoroTaskLink (ligar pomodoro a tarefa específica)

5. **Design system [IA]AVANÇADA PT (inegociável — `.claude/rules/design-system-ia-avancada.md`)**
   - Background `#04040A` (dark only, sem light mode)
   - Glassmorphism em superfícies elevadas: `rgba(255,255,255,0.025)` + blur 12px
   - Tipografia Inter (UI) + JetBrains Mono (código, badges, números técnicos)
   - Paleta restrita: White `#F0F4FF`, Cyan `#00F5FF` (acção), Gold `#FFB800` (premium), Purple `#9D00FF` (IA), Magenta `#FF006E` (erro), Lime `#39FF14` (sucesso), Grey `#8892A4`/`#4A5568`
   - Border-radius mínimo 8px cards, 20px badges
   - Sem cores arbitrárias

6. **Estados (loading / empty / error / offline)**
   - Cada vista tem estado vazio descrito (ex: "ainda não tens tarefas — escreve no chat ou clica +")
   - Banner offline persistente (NFR21 PWA degradado)
   - Estados de confidence baixa do cérebro

7. **Acessibilidade mínima**
   - Keyboard shortcuts mantidos (N nova tarefa, T pomodoro, ESC fechar)
   - Novos: `/` foca chat input, `Cmd+K` palette comandos (futuro)
   - Tab order lógico, focus visible

8. **Mobile**
   - Sidebar widgets vira drawer no mobile
   - Chat fullscreen
   - Touch gestures: swipe entre vistas

### Inputs obrigatórios para Uma ler

| Ordem | Ficheiro | Por quê |
|-------|----------|---------|
| 1 | `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | 96 FRs + 24 NFRs — fonte da verdade do scope |
| 2 | `imersao-tools/nexus/docs/architecture-v2.md` | NOVO 04/05 — Aria. Estrutura de routes, componentes, repo layout |
| 3 | `imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md` | Verdict CONCERNS + 4 gaps (G1 é responsabilidade de Uma) |
| 4 | `.claude/rules/design-system-ia-avancada.md` | Design system inegociável |
| 5 | `imersao-tools/nexus/src/App.tsx` | Layout actual v1 (referência do que existe) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-architecture-v2-completa-aguarda-ux.md`. PROJECTO É NEXUS, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## Gaps abertos após esta sessão

| # | Gap | Severidade | Owner | Estado |
|---|-----|-----------|-------|--------|
| ~~G3~~ | ~~Edge vs Node, IndexedDB lib, markdown editor~~ | ~~🟡~~ | ~~@architect~~ | ✅ **FECHADO 04/05 em architecture-v2.md** |
| ~~G4~~ | ~~Test scaffold + mocks~~ | ~~🟡~~ | ~~@architect~~ | ✅ **FECHADO 04/05 em architecture-v2.md** |
| G1 | Wireframes chat-first | 🔴 BLOQUEIA Story 0.4 | **`@ux-design-expert` (Uma)** | ⏳ **AGORA** |
| G2 | Domínio Vercel default vs próprio | 🔴 BLOQUEIA Story 0.10 | **Eurico** | ⏳ aguarda resposta |

---

## Constraints inegociáveis (NÃO QUESTIONAR)

| # | Constraint | Origem |
|---|-----------|--------|
| C1 | Single-user (só Eurico) | Directiva 04/05 |
| C2 | Zero custos externos além API key Anthropic | Directiva 04/05 |
| C3 | PT-PT exclusivo | `language-standards.md` |
| C4 | Design system [IA]AVANÇADA PT (`#04040A`, glassmorphism, Inter+JetBrains Mono) | `design-system-ia-avancada.md` |
| C5 | Constitution AIOX (story-driven, agent authority, no invention) | `.aiox-core/constitution.md` |
| C6 | Telegram (não WhatsApp) | Directiva 04/05 |
| C7 | Web Push (não SMS/email) | Directiva 04/05 |
| C8 | Web Speech API (não Whisper backend) | Directiva 04/05 |
| C9 | Deploy Vercel | Directiva 04/05 |
| C10 | Build não destrói v1 — `v2/` paralelo | architecture-v2.md §3 |
| C11 | Jarvis (SaaS) NÃO existe neste projecto | Directiva 04/05 |

---

## Stack final (NÃO REABRIR)

Já totalmente fechado. Ver `architecture-v2.md` §17 para `package.json` final projectado.

Resumo:
- **Framework:** Next.js 15 App Router + React 19 + TypeScript strict
- **Styling:** Tailwind 4 (mantém v1)
- **Storage local:** Dexie 4 (IndexedDB) desde dia 1
- **AI:** Anthropic SDK + Sonnet 4.6 + Haiku 4.5 + Vision
- **OAuth:** googleapis SDK
- **Push:** web-push lib + VAPID
- **Telegram:** node-telegram-bot-api (server) + setWebhook (one-time)
- **Markdown:** Tiptap 2
- **Drag-drop:** dnd-kit
- **Datas:** date-fns + rrule
- **Validação:** Zod (args/results de tools)
- **Tests:** Vitest + Playwright + MSW + fake-indexeddb
- **CI:** GitHub Actions + CodeRabbit
- **Deploy:** Vercel (Edge + Node functions, KV free tier)

---

## Próximo passo concreto

### Sequência obrigatória para Uma

```
1. LER (ordem):
   ├── .claude/rules/handoff-central.md
   ├── .claude/rules/handoff-location.md
   ├── docs/HANDOFF-INDEX.md (procurar entrada Nexus v2 architecture)
   ├── imersao-tools/nexus/docs/PRD-NEXUS-V2.md (96 FRs)
   ├── imersao-tools/nexus/docs/architecture-v2.md (NOVO 04/05)
   ├── imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md (G1 é teu)
   ├── .claude/rules/design-system-ia-avancada.md (paleta + glassmorphism)
   └── imersao-tools/nexus/src/App.tsx (layout actual v1)

2. CONFIRMAR com Eurico (uma única pergunta):
   "Encontrei handoff Nexus v2 — architecture entregue por Aria, falta UX spec.
    Avanço com front-end-spec-v2.md + wireframes chat-first?"

3. SE Eurico autorizar:
   ├── Produzir imersao-tools/nexus/docs/front-end-spec-v2.md
   │   Cobertura mínima — 8 secções listadas acima neste handoff
   │   Respeitar 100% design system [IA]AVANÇADA PT
   │
   └── Criar handoff de saída em imersao-tools/nexus/docs/handoffs/
       Apontar próximo passo: @po valida arch + UX spec, depois @sm parte Epic 0

4. MARCAR ESTE handoff (architect→ux) como consumed:
   ├── Editar este YAML/MD: consumed:true, consumed_at, consumed_by:ux-design-expert
   └── Mover para imersao-tools/nexus/docs/handoffs/archive/

5. ACTUALIZAR docs/HANDOFF-INDEX.md (mover linha pending → archived deste handoff,
   adicionar nova entrada pending para o handoff de saída de Uma)
```

### Comandos AIOX

| Quando | Comando |
|--------|---------|
| Inicial | `@ux-design-expert` carrega contexto |
| Após docs prontos | `@po *validate-doc {architecture-v2.md}` + idem para `front-end-spec-v2.md` |
| Após PO PASS | `@sm *draft` (Story 0.1) |
| Após @sm | `@po *validate-story-draft 0.1` |
| Após PO PASS story | `@dev *develop 0.1` |
| Push final | `@devops *push` (EXCLUSIVO) |

---

## Anti-padrões absolutos (NUNCA fazer)

| Anti-padrão | Razão | Origem |
|-------------|-------|--------|
| 🚫 Mexer em código v1 (`src/`) | Constitution Article III | `agent-authority.md` |
| 🚫 Apagar widgets órfãos antes de Epic 0 Story 0.8 | Pode quebrar imports | architecture-v2.md §3 |
| 🚫 Inventar features/wireframes não rastreáveis ao PRD | Constitution Article IV | `feedback_no_invented_cases.md` |
| 🚫 Light mode ou cores arbitrárias | Constraint C4 | `design-system-ia-avancada.md` |
| 🚫 Mencionar Jarvis em ficheiros do Nexus | Constraint C11 | Directiva 04/05 |
| 🚫 Multi-tenant, billing, GDPR formal, Stripe | Single-user (C1) | Directiva 04/05 |
| 🚫 Custos externos novos | C2 | Directiva 04/05 |
| 🚫 Reabrir decisão WhatsApp vs Telegram | C6 | Decisão final |
| 🚫 Reabrir decisão Web Push | C7 | Decisão final |
| 🚫 Reabrir decisão Web Speech vs Whisper backend | C8 | Decisão final |
| 🚫 Reabrir decisão Dexie vs localStorage / Tiptap vs Lexical | architecture-v2.md ADR-2/3 | Decisão arquitectural |
| 🚫 Criar handoffs fora de `imersao-tools/nexus/docs/handoffs/` | `handoff-location.md` | INEGOCIÁVEL |
| 🚫 Recomeçar do zero ou pedir explicações já dadas | Frustração Eurico | `feedback_never_restart_context.md` |
| 🚫 Reportar "feito" sem mostrar diff real | `mandatory-change-log.md` | INEGOCIÁVEL |
| 🚫 Tratar Eurico por "Sr." | `feedback_no_sr_treatment.md` | Tom informal directo |
| 🚫 Usar PT-BR em vez de PT-PT | `language-standards.md` | INEGOCIÁVEL |
| 🚫 Fazer push sem ser `@devops` | Constitution Article II | INEGOCIÁVEL |

---

## Memórias relevantes

| Memória | Por que importa |
|---------|-----------------|
| `project_nexus_vision.md` | Visão original — primeiro ecrã da manhã, overnight agent killer feature |
| `feedback_nexus_not_news.md` | Substituir feeds tech por mercados financeiros |
| `feedback_handoffs_detail.md` | Handoffs com citações e contexto concreto |
| `feedback_never_restart_context.md` | NUNCA pedir explicações já dadas |
| `feedback_no_invented_cases.md` | ZERO exemplos fictícios |
| `feedback_governance_never_blocks_execution.md` | Não invocar governance como bloqueador |

---

## Estado git no final desta sessão (architect)

```
Modificados (não commitados):
  Pendente actualização de docs/HANDOFF-INDEX.md (Uma adiciona quando entrar)

Novos (untracked):
  ?? imersao-tools/nexus/docs/architecture-v2.md
  ?? imersao-tools/nexus/docs/handoffs/RETOMA-20260504-architecture-v2-completa-aguarda-ux.md

Não foi feito commit nem push (push é exclusivo @devops).
Comando para Eurico avançar quando quiser:
  @devops *push
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno do Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-architecture-v2-completa-aguarda-ux.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-architecture-v2-completa-aguarda-ux.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **Aria (architect)**
DATA: **04/05/2026**

---

*Handoff escrito por Aria (architect) em 04/05/2026 a seguir à entrega de `architecture-v2.md`. Designed para Uma (`@ux-design-expert`) consumir em sessão fresca sem ambiguidade.*
