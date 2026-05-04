# RETOMA — Nexus v2 — PO Validation 2× PASS, aguarda @sm partir Epic 0 em stories 0.1-0.10

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR (para o agente que entra)

Sou o Eurico. Em sessão de 04/05/2026 (~tarde, after UX), Pax (`@po`) consumiu o handoff `RETOMA-20260504-front-end-spec-v2-completa-aguarda-po.md` e validou em paralelo os dois artefactos `architecture-v2.md` (Aria) + `front-end-spec-v2.md` (Uma) com 10-point checklist em cada.

**Verdict dual:** **2× PASS** — architecture v2 com **8,8/10**, front-end spec v2 com **8,9/10**. 6 issues minor identificados (3 por documento), nenhum bloqueante. Os 4 gaps originais (G1 wireframes, G2 domínio, G3 Edge/Node+Dexie+Tiptap, G4 test scaffold+mocks) estão **TODOS FECHADOS**.

**ZERO CÓDIGO foi tocado.** Apenas dois documentos novos `PO-VALIDATION-ARCHITECTURE-V2.md` + `PO-VALIDATION-FRONT-END-SPEC-V2.md`.

Próximo: `@sm` (River) parte Epic 0 em stories 0.1-0.10 baseadas em `architecture-v2.md §16` (pontos críticos arch por Epic) + `front-end-spec-v2.md §3` (wireframes) + §1 (user flows) + Epic 0 ACs do PRD §10.

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 |
| Localização | `imersao-tools/nexus/` |
| Sessão actual | 04/05/2026 (PO validation) |
| Agente que sai | Pax (`@po`) |
| Agente que entra | River (`@sm`) — partir Epic 0 em stories |
| Estado | PRD validado + Architecture PASS + UX spec PASS. Pronto para Epic 0 arrancar via Story 0.1 |

---

## Estado actual exacto

### Documentos do projecto

| Ficheiro | Linhas | Status | Verdict |
|---------|--------|--------|---------|
| `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | 675 | ✅ entregue (validado @po) | CONCERNS 7,2/10 (4 gaps fechados) |
| `imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md` | 174 | ✅ entregue | — |
| `imersao-tools/nexus/docs/architecture-v2.md` | 1164 | ✅ entregue + ✅ **VALIDADO @po** | **PASS 8,8/10** |
| `imersao-tools/nexus/docs/front-end-spec-v2.md` | 1281 | ✅ entregue + ✅ **VALIDADO @po** | **PASS 8,9/10** |
| `imersao-tools/nexus/docs/PO-VALIDATION-ARCHITECTURE-V2.md` | NOVO 04/05 | ✅ entregue | autoria Pax |
| `imersao-tools/nexus/docs/PO-VALIDATION-FRONT-END-SPEC-V2.md` | NOVO 04/05 | ✅ entregue | autoria Pax |

### Código

```
git status imersao-tools/nexus/src/   → clean (intocado)
imersao-tools/nexus/v2/               → ainda não existe (criado em Epic 0 Story 0.1)
```

---

## Resultado da PO Validation dual

### Architecture v2 — PASS 8,8/10

| Ponto checklist | Verdict |
|-----------------|---------|
| 1. Cobertura 96 FRs + 24 NFRs | ✅ PASS |
| 2. Coerência com UX spec | ✅ PASS |
| 3. Constraints C1–C11 respeitadas | ✅ PASS |
| 4. Zero invenção (Article IV) | ✅ PASS |
| 5. Riscos com mitigação | ✅ PASS |
| 6. Testabilidade (stack tests) | ✅ PASS |
| 7. Quality gates Epic 0 ACs | ✅ PASS |
| 8. UX-1..5 vs ADR-1..5 sem conflito | ✅ PASS |
| 9. Pronto para @sm partir | ✅ PASS |
| 10. Integridade técnica global | ✅ PASS |

**Issues minor (3):**
- **I-A-1** UX admite FR63-68 (Gmail vista detalhada) como "não MVP UX". Aceitável para uso interno (push + briefing cobrem).
- **I-A-2** Story 2.7 instâncias recorrentes via Service Worker — Background Sync API tem suporte limitado em iOS Safari. Para Eurico Chrome/Edge desktop é OK.
- **I-A-3** Riscos PRD §11 não 1:1 com riscos arch §18. Aceitável, cobertura via §5.4 + §16 Epic 1.

### Front-end Spec v2 — PASS 8,9/10

| Ponto checklist | Verdict |
|-----------------|---------|
| 1. Cobertura FRs com componentes UX | ✅ PASS |
| 2. Sem contradição com architecture | ✅ PASS |
| 3. Constraints C1–C11 respeitadas | ✅ PASS |
| 4. Zero invenção (Article IV) | ✅ PASS |
| 5. Riscos com mitigação UX | ✅ PASS |
| 6. Estados (empty/loading/error/offline) testáveis | ✅ PASS |
| 7. WCAG AA mínima | ✅ PASS |
| 8. Mobile responsive + PWA | ✅ PASS |
| 9. Quality gates Epic 0 ACs | ✅ PASS |
| 10. Pronto para @sm partir | ✅ PASS |

**Issues minor (3):**
- **I-U-1** FR63-68 (Gmail) sem componente UX dedicado. Decisão Eurico se quer ou não vista `/email` (não bloqueia Epic 0).
- **I-U-2** UX-4 (Markets Widget topo sidebar) trace via memória persistente em vez de literal do PRD. Aceitável — Eurico pode adicionar linha ao PRD §6 a confirmar.
- **I-U-3** Wireframes contêm exemplos com nomes pessoais (Pedro, Maria, Frusoal, Carnegie). Aceitável para uso interno single-user.

---

## Gaps abertos após esta sessão

| # | Gap | Severidade | Estado |
|---|-----|-----------|--------|
| ~~G1~~ | ~~Wireframes chat-first~~ | ~~🔴~~ | ✅ FECHADO em front-end-spec-v2.md (UX 04/05) |
| ~~G2~~ | ~~Domínio Vercel~~ | ~~🟢~~ | ✅ DECIDIDO 04/05 — `nexus-eurico.vercel.app` |
| ~~G3~~ | ~~Edge/Node + Dexie + Tiptap~~ | ~~🟡~~ | ✅ FECHADO em architecture-v2.md (Aria 04/05) |
| ~~G4~~ | ~~Test scaffold + mocks~~ | ~~🟡~~ | ✅ FECHADO em architecture-v2.md (Aria 04/05) |
| ~~Validação @po dos 2 docs~~ | ~~🟡~~ | ✅ **CONCLUÍDO 04/05 (Pax)** — 2× PASS |

**Issues minor (6) listados acima — não bloqueiam Epic 0.** Podem ser endereçados em sessão dedicada futura ou ignorados sem risco.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-2x-pass-aguarda-sm-epic-0.md`. PROJECTO É NEXUS, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## O que River (`@sm`) tem de fazer

### Output esperado

Partir Epic 0 (PRD §10) em **10 stories formais** baseadas em:
- `architecture-v2.md §16 Epic 0` (pontos críticos arch + Story bloqueante 0.5 proxy Anthropic)
- `front-end-spec-v2.md §1.1 Flow 1` (login + onboarding 4 steps) + `§2 + §3.1` (layout chat-first)
- `PRD-NEXUS-V2.md §10 Epic 0` (6 ACs)
- `package.json` projectado em `architecture-v2.md §17`

### Stories Epic 0 sugeridas (lista de trabalho)

| Story | Resumo |
|-------|--------|
| 0.1 | Setup Next.js 15 em `imersao-tools/nexus/v2/` paralelo a `src/` v1 + tsconfig strict + Tailwind 4 + lucide-react |
| 0.2 | Migrar utilities v1 → v2: `themes.ts`, `useLocalStorage.ts`, `usePomodoro.ts` |
| 0.3 | Setup Dexie 4 + schema base + dexie-react-hooks (registry vazio para Epic 1+ adicionar) |
| 0.4 | Layout chat-first segundo `front-end-spec-v2.md §2 + §3.1` (Header + Chat panel + Sidebar fixa 360px + Input box sticky) |
| 0.5 | Proxy Anthropic Edge `api/anthropic/proxy/route.ts` (BLOQUEIA Epic 1) |
| 0.6 | Auth flow Node `api/auth/login` + bcrypt + cookie HttpOnly + session KV (architecture §9.1) |
| 0.7 | OnboardingModal 4 steps segundo `front-end-spec-v2.md §1.1` |
| 0.8 | Portar widgets v1 sidebar: Markets (topo, conforme UX-4), Pomodoro, GitHub, Quick Links, Greeting |
| 0.9 | Setup Vitest + Playwright + MSW + fake-indexeddb (architecture §5) — test scaffold |
| 0.10 | CI GitHub Actions completo (architecture §13) + Vercel deploy preview verde + AC5 verificado em `nexus-eurico.vercel.app` |

> **Nota:** River pode ajustar números/granularidade conforme template AIOX standard. Esta é orientação base — não imposição.

### Inputs obrigatórios para River ler

| Ordem | Ficheiro | Por quê |
|-------|----------|---------|
| 1 | `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | Source of truth dos 96 FRs + 8 Epics + 24 NFRs |
| 2 | `imersao-tools/nexus/docs/architecture-v2.md` (§3, §16, §17) | Repo layout + estratégia por Epic + package.json |
| 3 | `imersao-tools/nexus/docs/front-end-spec-v2.md` (§1, §2, §3) | User flows + layout + wireframes |
| 4 | `imersao-tools/nexus/docs/PO-VALIDATION-ARCHITECTURE-V2.md` | Verdict + 3 issues minor |
| 5 | `imersao-tools/nexus/docs/PO-VALIDATION-FRONT-END-SPEC-V2.md` | Verdict + 3 issues minor |
| 6 | `.aiox-core/development/templates/story-tmpl.yaml` (se existir) | Template AIOX standard de story |

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
| C12 | Domínio `nexus-eurico.vercel.app` (default Vercel) | Decidido 04/05 G2 |

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

### Sequência obrigatória para River (@sm)

```
1. LER (ordem):
   ├── .claude/rules/handoff-central.md
   ├── .claude/rules/handoff-location.md
   ├── docs/HANDOFF-INDEX.md (procurar entrada Nexus v2 PO)
   ├── imersao-tools/nexus/docs/PRD-NEXUS-V2.md (96 FRs + 8 Epics + 24 NFRs)
   ├── imersao-tools/nexus/docs/architecture-v2.md (focar §3, §16, §17)
   ├── imersao-tools/nexus/docs/front-end-spec-v2.md (focar §1, §2, §3)
   ├── imersao-tools/nexus/docs/PO-VALIDATION-ARCHITECTURE-V2.md (verdict + issues)
   └── imersao-tools/nexus/docs/PO-VALIDATION-FRONT-END-SPEC-V2.md (verdict + issues)

2. CONFIRMAR com Eurico (uma única pergunta):
   "Encontrei handoff Nexus v2 — architecture+UX+PO 2× PASS, pronto para Epic 0.
    Avanço com criação das 10 stories Epic 0 conforme lista sugerida no handoff?"

3. SE Eurico autorizar:
   ├── Criar imersao-tools/nexus/docs/stories/0.1.story.md (template AIOX standard)
   ├── Criar imersao-tools/nexus/docs/stories/0.2.story.md
   ├── ... até 0.10
   │   Cada story tem: User Story + 6-10 ACs específicos + File List + Tasks/Subtasks + Dev Notes (referenciando PRD/arch/UX)
   │
   └── Criar handoff de saída em imersao-tools/nexus/docs/handoffs/
       Apontar próximo passo: @po valida cada story draft (10-point story checklist) antes de @dev develop
       Convencer ordem por dependência:
         - Story 0.1 PRIMEIRO (setup base bloqueia tudo)
         - Story 0.5 (proxy Anthropic) BLOQUEIA Epic 1
         - Story 0.6 (auth) BLOQUEIA Onboarding 0.7
         - Story 0.10 (CI+deploy) PODE arrancar em paralelo com 0.4

4. MARCAR ESTE handoff (po→sm) como consumed:
   ├── Editar este YAML/MD: consumed:true, consumed_at, consumed_by:sm
   └── Mover para imersao-tools/nexus/docs/handoffs/archive/

5. ACTUALIZAR docs/HANDOFF-INDEX.md (mover linha pending → archived deste handoff,
   adicionar nova entrada pending para o handoff de saída de River)
```

### Comandos AIOX

| Quando | Comando |
|--------|---------|
| Inicial | `@sm` carrega contexto |
| Criar story | `@sm *draft 0.1` (ou `*create-story 0.1`) |
| Após @sm draftar | `@po *validate-story-draft 0.1` |
| Após PO PASS | `@dev *develop 0.1` |
| Após @dev concluir | `@qa *review 0.1` |
| Push final | `@devops *push` (EXCLUSIVO) |

---

## Anti-padrões absolutos (NUNCA fazer)

| Anti-padrão | Razão | Origem |
|-------------|-------|--------|
| 🚫 Mexer em código v1 (`src/`) durante Epic 0 | Constitution Article III | `agent-authority.md` |
| 🚫 Apagar widgets órfãos antes de Epic 0 Story 0.8 | Pode quebrar imports | architecture-v2.md §3 |
| 🚫 Inventar features fora do PRD | Constitution Article IV | `feedback_no_invented_cases.md` |
| 🚫 Criar stories sem ACs específicos e mensuráveis | Story-driven sem rigor é mau | Constitution Article III |
| 🚫 Stories enormes (>20 ACs) | Indica que devem ser partidas em sub-stories | AIOX standard |
| 🚫 Light mode ou cores arbitrárias | Constraint C4 | `design-system-ia-avancada.md` |
| 🚫 Mencionar Jarvis em ficheiros do Nexus | Constraint C11 | Directiva 04/05 |
| 🚫 Reabrir os 4 gaps fechados (G1, G2, G3, G4) | Decisões finais | — |
| 🚫 Reabrir as 5 ADRs do architecture | Decisão arquitectural | architecture-v2.md ADR-1..5 |
| 🚫 Reabrir as 5 UX-ADRs | Decisão UX | front-end-spec-v2.md UX-1..5 |
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
| `feedback_nexus_not_news.md` | Mercados financeiros + continuidade > notícias tech (drove UX-4) |
| `feedback_handoffs_detail.md` | Handoffs com citações e contexto concreto |
| `feedback_never_restart_context.md` | NUNCA pedir explicações já dadas |
| `feedback_no_invented_cases.md` | ZERO exemplos fictícios |
| `feedback_governance_never_blocks_execution.md` | Não invocar governance como bloqueador |

---

## Estado git no final desta sessão (PO)

```
Modificados (não commitados):
  M  imersao-tools/nexus/docs/handoffs/RETOMA-20260504-front-end-spec-v2-completa-aguarda-po.md
     (handoff de input marcado consumed e movido para archive)
  M  docs/HANDOFF-INDEX.md (Pax actualiza — mover linha pending UX→PO para archived, adicionar nova linha pending PO→SM)

Novos (untracked):
  ?? imersao-tools/nexus/docs/PO-VALIDATION-ARCHITECTURE-V2.md (verdict PASS 8,8/10)
  ?? imersao-tools/nexus/docs/PO-VALIDATION-FRONT-END-SPEC-V2.md (verdict PASS 8,9/10)
  ?? imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-2x-pass-aguarda-sm-epic-0.md (este handoff)

Não foi feito commit nem push (push é exclusivo @devops).
Comando para Eurico avançar quando quiser:
  @devops *push
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno do Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-2x-pass-aguarda-sm-epic-0.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-2x-pass-aguarda-sm-epic-0.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **Pax (`@po`)**
DATA: **04/05/2026**

---

## Consumo deste handoff

- **consumed:** true
- **consumed_at:** 2026-05-04
- **consumed_by:** River (`@sm`)
- **status:** consumed
- **resultado:** 3 stories criadas (0.8, 0.9, 0.10) — stories 0.1-0.7 já existiam de sessão anterior. Epic 0 completo com 10 stories em `imersao-tools/nexus/docs/stories/active/`.

---

*Handoff escrito por Pax (`@po`) em 04/05/2026 a seguir à validação dual architecture+UX (2× PASS). Designed para River (`@sm`) consumir em sessão fresca sem ambiguidade, partindo Epic 0 em 10 stories formais que vão para validação `@po *validate-story-draft` antes de `@dev *develop`.*
