# RETOMA — Nexus v2 — Front-End Spec v2 entregue, aguarda @po validar arch + UX spec

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## ✅ CONSUMED 04/05/2026 (sessão PO)

| Campo | Valor |
|-------|-------|
| consumed | true |
| consumed_at | 2026-05-04T~tarde-after-UX (sessão PO) |
| consumed_by | po (Pax) |
| status | consumed |
| superseded_by | `RETOMA-20260504-po-validation-2x-pass-aguarda-sm-epic-0.md` |

Pax leu este handoff + os 2 documentos a validar (`architecture-v2.md` 1164 linhas + `front-end-spec-v2.md` 1281 linhas) + PRD-NEXUS-V2 (675 linhas) + PO-VALIDATION-PRD-V2 (174 linhas), aplicou 10-point checklist em cada documento e produziu:
- `imersao-tools/nexus/docs/PO-VALIDATION-ARCHITECTURE-V2.md` — verdict **PASS 8,8/10**, 3 issues minor
- `imersao-tools/nexus/docs/PO-VALIDATION-FRONT-END-SPEC-V2.md` — verdict **PASS 8,9/10**, 3 issues minor

**G1+G3+G4 fechados, G2 decidido. Pronto para Epic 0 arrancar via @sm.**

---

## TL;DR (para o agente que entra)

Sou o Eurico. Em sessão de 04/05/2026 (~tarde), Uma (`@ux-design-expert`) consumiu o handoff `RETOMA-20260504-architecture-v2-completa-aguarda-ux.md` e produziu `front-end-spec-v2.md` (~1100 linhas, 12 secções) que **fecha o gap G1** (wireframes chat-first inexistentes — bloqueava Story 0.4).

**ZERO CÓDIGO foi tocado.** Apenas documento novo `front-end-spec-v2.md`.

Próximo: `@po` (Pax) valida em paralelo `architecture-v2.md` + `front-end-spec-v2.md` (10-point checklist em cada). Após PASS dual, `@sm` (River) parte Epic 0 em stories 0.1-0.10.

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 |
| Localização | `imersao-tools/nexus/` |
| Sessão actual | 04/05/2026 (UX) |
| Agente que sai | Uma (ux-design-expert) |
| Agente que entra | Pax (`@po`) — validação de doc |
| Estado | PRD validado + Architecture entregue + UX spec entregue. Falta validação @po dos 2 docs antes de Epic 0 arrancar |

---

## Estado actual exacto

### Documentos do projecto

| Ficheiro | Linhas | Status | Autor |
|---------|--------|--------|-------|
| `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | 675 | ✅ entregue (validado @po PRD) | Orion 04/05 |
| `imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md` | 174 | ✅ entregue | Orion 04/05 |
| `imersao-tools/nexus/docs/architecture-v2.md` | ~830 | ✅ entregue · pendente validação @po | Aria 04/05 |
| `imersao-tools/nexus/docs/front-end-spec-v2.md` | ~1100 | ✅ NOVO 04/05 · pendente validação @po | **Uma** |

### Código

```
git status imersao-tools/nexus/src/   → clean (intocado)
imersao-tools/nexus/v2/               → ainda não existe (criado em Epic 0 Story 0.1)
```

---

## O que Uma decidiu (top 5 UX-ADRs do front-end-spec-v2.md)

| # | Decisão | Resumo |
|---|---------|--------|
| UX-1 | Chat ocupa metade esquerda permanentemente · sidebar widgets coluna direita 360px fixa | Killer feature é overnight agent + multi-intent. Chat sempre acessível sem cliques |
| UX-2 | Morning Briefing aparece automaticamente como mensagem `pinned` no topo do chat ao 1º carregamento do dia (após 06:00) | Foco real do Nexus: continuidade pessoal. Eurico vê primeiro o overnight agent (G6 do PRD) |
| UX-3 | ToolCard renderiza inline para cada tool call, com 6 estados visuais distintos (loading/success/error/preview-required/reverted/interrupted) | PRD FR3+FR5+FR6 exigem visibilidade + undo. Inline é mais legível que toast empilhado para 3+ intents |
| UX-4 | Markets Widget no topo da sidebar (substitui MorningBriefingWidget v1 órfão), 9 mercados com delta vs ontem | Memória persistente Eurico: "Nexus é foco em mercados financeiros e continuidade, não notícias tech". Markets v1 era órfão — passa a ter destaque |
| UX-5 | Vistas detalhadas (`/tasks`, `/finance`, `/habits`, `/journal`, `/knowledge`, `/settings`) abrem como modais fullscreen com Esc para fechar e retornar ao chat | Eurico abre `/tasks` para ver Kanban e volta ao chat para registar — fluxo deve ser frictionless. Modal fullscreen evita perder draft |

### Decisões secundárias importantes

- **Atalhos novos:** `/` foca chat input (substitui scroll-to-search do v1), `B` abre BrainDump modal dedicado, `Esc` fecha qualquer modal
- **VoiceModeButton** com 5 estados (idle/listening/transcribing/error/unsupported), long-press para conversação contínua
- **PomodoroTaskLink** opcional com colapsável "Ligar a tarefa? ▾" — quando ligado, persiste `taskId` e actualiza `lastWorkedAt`
- **PreviewModal renderiza inline dentro do ToolCard** (não como modal flutuante) — preserva contexto visual do chat
- **UndoToast** bottom-center com countdown 30s visível, hover pausa, max 3 toasts empilhados
- **OnboardingModal 4 steps** (nome → Web Push → Google OAuth opcional → Telegram opcional) com Skip permitido em todos excepto Step 1
- **Brain Dump** com aprovação item-a-item em 4 secções colapsáveis (📋 Tarefas / 📂 Projectos / 💡 Ideias / 🤔 Decisões)
- **Foto recibo** suporta drag-and-drop no chat OU envio via Telegram bot — ambos os caminhos convergem em PreviewModal antes de persistir
- **Mobile:** chat fullwidth, sidebar vira drawer escondido (swipe right→left abre, ☰ no header), touch gestures definidos (long-press, swipe up/down em modais)
- **Acessibilidade WCAG AA**: contrastes calculados (Cyan sobre #04040A = 13.8:1 ✓), focus visible 2px Cyan, `prefers-reduced-motion` respeitado, lang="pt-PT" em raiz
- **Anti-padrões UX explícitos** documentados (sem light mode, sem cores arbitrárias, sem gradientes fora dos 3 permitidos, sem hover-only, sem fontes além de Inter/JetBrains Mono)

---

## O que Pax (`@po`) tem de fazer

### Output esperado

Validar `architecture-v2.md` + `front-end-spec-v2.md` segundo o 10-point checklist (`po-master-checklist.md` ou equivalente). Resultado em ficheiros separados:
- `imersao-tools/nexus/docs/PO-VALIDATION-ARCHITECTURE-V2.md`
- `imersao-tools/nexus/docs/PO-VALIDATION-FRONT-END-SPEC-V2.md`

### Pontos críticos a verificar

| # | Ponto crítico | Onde |
|---|--------------|------|
| 1 | Architecture cobre 100% dos 96 FRs e 24 NFRs do PRD | `architecture-v2.md` §15 (matriz NFR→componente) |
| 2 | UX spec cobre 100% das vistas necessárias para os FRs | `front-end-spec-v2.md` §9 (matriz FR→componente UX) |
| 3 | Architecture e UX spec não se contradizem (ex: layout chat-first em UX bate com routing Next.js em arch) | Comparar `arch §3` (repo layout) com `ux §2-3` (layout + wireframes) |
| 4 | Constraints C1-C11 do PRD respeitados em ambos | C1 single-user, C2 zero custos, C3 PT-PT, C4 design system, C6 Telegram, C7 Web Push, C8 Web Speech, C9 Vercel, C11 sem Jarvis |
| 5 | Zero invenção (Article IV Constitution) | Cada elemento UX trace a FR/NFR/architecture; cada decisão arch trace a PRD ou ADR |
| 6 | Riscos identificados em ambos os docs (PRD §11, arch §18) têm mitigação documentada | — |
| 7 | Testabilidade: arch §5 define test stack, ux §6 define estados (empty/loading/error/offline) testáveis | — |
| 8 | Cobertura quality gates Epic 0 (AC1-AC6 do PRD §10 Epic 0) | — |
| 9 | UX-1 a UX-5 são compatíveis com ADR-1 a ADR-5 do architecture | Sem conflito Edge/Node split, Dexie 4, Tiptap, Tool Registry, Vitest |
| 10 | Documentos prontos para `@sm` partir Epic 0 em stories sem ambiguidade bloqueante | — |

### Inputs obrigatórios para Pax ler

| Ordem | Ficheiro | Por quê |
|-------|----------|---------|
| 1 | `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | Source of truth dos 96 FRs |
| 2 | `imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md` | Verdict prévio CONCERNS, gaps G1/G2/G3/G4 |
| 3 | `imersao-tools/nexus/docs/architecture-v2.md` | A validar (resolveu G3+G4) |
| 4 | `imersao-tools/nexus/docs/front-end-spec-v2.md` | A validar (resolveu G1) |
| 5 | `.aiox-core/development/checklists/po-master-checklist.md` (se existir) | Checklist 10-point |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-front-end-spec-v2-completa-aguarda-po.md`. PROJECTO É NEXUS, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## Gaps abertos após esta sessão

| # | Gap | Severidade | Owner | Estado |
|---|-----|-----------|-------|--------|
| ~~G1~~ | ~~Wireframes chat-first~~ | ~~🔴~~ | ~~@ux-design-expert~~ | ✅ **FECHADO 04/05 em front-end-spec-v2.md** |
| ~~G3~~ | ~~Edge vs Node, IndexedDB lib, markdown editor~~ | ~~🟡~~ | ~~@architect~~ | ✅ FECHADO 04/05 em architecture-v2.md |
| ~~G4~~ | ~~Test scaffold + mocks~~ | ~~🟡~~ | ~~@architect~~ | ✅ FECHADO 04/05 em architecture-v2.md |
| G2 | Domínio Vercel default vs próprio | 🟢 RESOLVIDO | **Eurico** | ✅ **DECIDIDO 04/05: `nexus-eurico.vercel.app` (default)** |
| Validação @po dos 2 docs | 🟡 BLOQUEIA Epic 0 | **`@po` (Pax)** | ⏳ **AGORA** |

**Todos os gaps técnicos da PO validation original (G1, G3, G4) estão fechados. G2 está decidido pelo Eurico. Resta apenas a validação formal @po dos artefactos arch+UX antes de @sm partir Epic 0.**

---

## Constraints inegociáveis (NÃO QUESTIONAR)

| # | Constraint | Origem |
|---|-----------|--------|
| C1 | Single-user (só Eurico) | Directiva 04/05 |
| C2 | Zero custos externos além API key Anthropic | Directiva 04/05 |
| C3 | PT-PT exclusivo | `language-standards.md` |
| C4 | Design system [IA]AVANÇADA PT | `design-system-ia-avancada.md` |
| C5 | Constitution AIOX (story-driven, agent authority, no invention) | `.aiox-core/constitution.md` |
| C6 | Telegram (não WhatsApp) | Directiva 04/05 |
| C7 | Web Push (não SMS/email) | Directiva 04/05 |
| C8 | Web Speech API (não Whisper backend) | Directiva 04/05 |
| C9 | Deploy Vercel | Directiva 04/05 |
| C10 | Build não destrói v1 — `v2/` paralelo | architecture-v2.md §3 |
| C11 | Jarvis (SaaS) NÃO existe neste projecto | Directiva 04/05 |
| C12 | Domínio `nexus-eurico.vercel.app` (default Vercel) | **Decidido 04/05 G2** |

---

## Stack final (NÃO REABRIR — confirmado em arch v2 §17)

- **Framework:** Next.js 15 App Router + React 19 + TypeScript strict
- **Styling:** Tailwind 4 (mantém v1)
- **Storage local:** Dexie 4 (IndexedDB) desde dia 1
- **AI:** Anthropic SDK + Sonnet 4.6 + Haiku 4.5 + Vision
- **OAuth:** googleapis SDK
- **Push:** web-push lib + VAPID
- **Telegram:** node-telegram-bot-api (server) + setWebhook (one-time)
- **Markdown:** Tiptap 2 (Diário, Brain Dump, Notas)
- **Drag-drop:** dnd-kit
- **Datas:** date-fns + rrule
- **Validação:** Zod (args/results de tools)
- **Tests:** Vitest + Playwright + MSW + fake-indexeddb
- **CI:** GitHub Actions + CodeRabbit
- **Deploy:** Vercel (Edge + Node functions, KV free tier)
- **Ícones:** lucide-react (única lib permitida)

---

## Próximo passo concreto

### Sequência obrigatória para Pax (@po)

```
1. LER (ordem):
   ├── .claude/rules/handoff-central.md
   ├── .claude/rules/handoff-location.md
   ├── docs/HANDOFF-INDEX.md (procurar entrada Nexus v2 UX)
   ├── imersao-tools/nexus/docs/PRD-NEXUS-V2.md (96 FRs · source of truth)
   ├── imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md (verdict prévio + gaps)
   ├── imersao-tools/nexus/docs/architecture-v2.md (validar — resolveu G3+G4)
   ├── imersao-tools/nexus/docs/front-end-spec-v2.md (validar — resolveu G1)
   └── .claude/rules/design-system-ia-avancada.md (constraint C4)

2. CONFIRMAR com Eurico (uma única pergunta):
   "Encontrei handoff Nexus v2 — architecture+UX entregues, faltam validar antes de Epic 0.
    Avanço com PO validation dos 2 docs em paralelo?"

3. SE Eurico autorizar:
   ├── Produzir imersao-tools/nexus/docs/PO-VALIDATION-ARCHITECTURE-V2.md
   ├── Produzir imersao-tools/nexus/docs/PO-VALIDATION-FRONT-END-SPEC-V2.md
   │   Ambos com 10-point checklist + verdict (PASS/CONCERNS/FAIL)
   │
   └── Criar handoff de saída em imersao-tools/nexus/docs/handoffs/
       Apontar próximo passo conforme verdict:
         - 2× PASS: @sm parte Epic 0 em stories 0.1-0.10
         - CONCERNS: documentar gaps adicionais e devolver a Aria/Uma
         - FAIL: bloqueia Epic 0, escalate para Eurico

4. MARCAR ESTE handoff (ux→po) como consumed:
   ├── Editar este YAML/MD: consumed:true, consumed_at, consumed_by:po
   └── Mover para imersao-tools/nexus/docs/handoffs/archive/

5. ACTUALIZAR docs/HANDOFF-INDEX.md (mover linha pending → archived deste handoff,
   adicionar nova entrada pending para o handoff de saída de Pax)
```

### Comandos AIOX

| Quando | Comando |
|--------|---------|
| Inicial | `@po` carrega contexto |
| Validar architecture | `@po *validate-doc {architecture-v2.md}` (ou inline 10-point checklist) |
| Validar UX spec | `@po *validate-doc {front-end-spec-v2.md}` |
| Após 2× PASS | `@sm *draft` (Story 0.1) |
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
| 🚫 Reabrir UX-1 a UX-5 | front-end-spec-v2.md §0 | Decisões UX fechadas |
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
| `feedback_nexus_not_news.md` | Substituir feeds tech por mercados financeiros (drove UX-4) |
| `feedback_handoffs_detail.md` | Handoffs com citações e contexto concreto |
| `feedback_never_restart_context.md` | NUNCA pedir explicações já dadas |
| `feedback_no_invented_cases.md` | ZERO exemplos fictícios |
| `feedback_governance_never_blocks_execution.md` | Não invocar governance como bloqueador |

---

## Estado git no final desta sessão (UX)

```
Modificados (não commitados):
  M  imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260504-architecture-v2-completa-aguarda-ux.md
     (handoff de input marcado consumed e movido para archive)
  M  docs/HANDOFF-INDEX.md (a actualizar — Uma adiciona linha pending nova + move linha consumida)

Novos (untracked):
  ?? imersao-tools/nexus/docs/front-end-spec-v2.md (~1100 linhas)
  ?? imersao-tools/nexus/docs/handoffs/RETOMA-20260504-front-end-spec-v2-completa-aguarda-po.md

Não foi feito commit nem push (push é exclusivo @devops).
Comando para Eurico avançar quando quiser:
  @devops *push
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno do Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-front-end-spec-v2-completa-aguarda-po.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-front-end-spec-v2-completa-aguarda-po.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **Uma (ux-design-expert)**
DATA: **04/05/2026**

---

*Handoff escrito por Uma (ux-design-expert) em 04/05/2026 a seguir à entrega de `front-end-spec-v2.md`. Designed para Pax (`@po`) consumir em sessão fresca sem ambiguidade, validando architecture+UX spec em paralelo antes de @sm partir Epic 0 em stories.*
