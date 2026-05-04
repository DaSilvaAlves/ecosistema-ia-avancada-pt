# RETOMA — Nexus v2 — PRD validado, aguarda @architect + @ux-design-expert

> **CONSUMED:** true
> **CONSUMED_AT:** 2026-05-04 (sessão architecture)
> **CONSUMED_BY:** architect (Aria)
> **STATUS:** consumed — superseded por `RETOMA-20260504-architecture-v2-completa-aguarda-ux.md`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR (para o agente que entra agora)

Sou o Eurico. Há ~30 dias criei um dashboard pessoal chamado **Nexus** em `imersao-tools/nexus/` (Vite + React 19 + localStorage). Está commitado uma vez (08/04/2026, commit `866a44ae`) e parado desde então. Em 04/05/2026, decidi reactivá-lo e expandir com inspiração no `meu-jarvis` (SaaS separado em `C:\Users\XPS\Documents\meu-jarvis\` que **NÃO É DESENVOLVIDO AQUI**).

**Nesta sessão de 04/05/2026 (~12:00-12:40, agente Orion/aiox-master)** foi feito:
1. ✅ Auditoria forense completa do Nexus v1 (build OK, TypeScript OK, dev server testado em :5197)
2. ✅ PRD do Nexus v2 escrito (`imersao-tools/nexus/docs/PRD-NEXUS-V2.md`, 675 linhas, 96 FRs, 24 NFRs, 8 Epics)
3. ✅ Validação PO (`imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md`) — verdict CONCERNS 7,2/10, 4 gaps
4. ✅ Este handoff

**Próximo passo único e claro:** invocar `@architect` (Aria) e `@ux-design-expert` (Uma) **em paralelo** para produzirem `architecture-v2.md` e `front-end-spec-v2.md`. Eurico autorizou em 04/05/2026 ("ok"). Depois `@sm` parte Epic 0 em stories.

**ZERO CÓDIGO foi tocado.** Apenas documentos novos. Nexus v1 está intocado.

---

## Identificação do projecto

| Campo | Valor |
|-------|-------|
| Nome | Nexus v2 |
| Localização | `imersao-tools/nexus/` |
| Tipo | Brownfield (v1 existe) + UI/UX |
| Owner | Eurico Silva (single-user, uso interno pessoal) |
| Não é | SaaS, não é multi-tenant, não é para vender |
| Inspiração | `JARVIS.txt` em `C:\Users\XPS\Documents\meu-jarvis\` — **referência conceptual apenas** |
| Constraint absoluto | **Jarvis NÃO É DESENVOLVIDO NESTE PROJECTO**. Construir só no Nexus. Citação Eurico: "preocupa-te apenas com este projeto o jarvir não é para ser desenvolvido aqui" |

---

## Estado actual exacto (verificado em 04/05/2026)

### Build do Nexus v1

```
TypeScript: 0 erros (npx tsc --noEmit)
Build prod: OK (Vite 6.4.2, 1596 módulos, 256 KB JS / 18 KB CSS, 9.92s)
Dev server: corre OK em http://localhost:5197 (Vite v6.4.2, ready in 4.3s)
Lint: N/A — não há script lint no package.json
Tests: N/A — não há tests, não há test script
Git: Último commit do nexus em 08/04/2026 (866a44ae). 32 ficheiros tracked. ZERO alterações desde então.
```

### Dev server background

Foi arrancado nesta sessão com `npm run dev` em background (ID `buaiv69zp`).
**Pode ainda estar a correr.** Para parar: matar processo node ou fechar terminal.
Logs: `C:/Users/XPS/AppData/Local/Temp/claude/.../tasks/buaiv69zp.output`.

### Inventário de widgets v1 (verificado ficheiro a ficheiro)

| Ficheiro | Linhas | Estado | Acção em v2 |
|---------|--------|--------|-------------|
| `src/App.tsx` | 124 | Funcional | Vai ser reescrito — chat-first |
| `src/components/widgets/GreetingWidget.tsx` | — | Funcional | Manter |
| `src/components/widgets/MorningBriefingWidget.tsx` | 250 | Funcional | Manter (substitui Briefing+Feed) |
| `src/components/widgets/GoodnightWidget.tsx` | 240 | Funcional, chama `claude-haiku-4-5-20251001` | Manter |
| `src/components/widgets/TasksWidget.tsx` | 362 | Funcional, tem campo `context` "onde parei" | Refactor v2 (Kanban+calendar) |
| `src/components/widgets/NotesWidget.tsx` | — | Funcional, 3 notes max | Substituído por Diário+BrainDump v2 |
| `src/components/widgets/LinksWidget.tsx` | — | Funcional | Manter |
| `src/components/widgets/GitHubWidget.tsx` | — | Funcional | Manter |
| `src/components/widgets/PomodoroWidget.tsx` | 78 | Funcional, atalho **T** | Manter (ligar a tarefa específica em v2) |
| `src/components/widgets/MarketsWidget.tsx` | 121 | **ÓRFÃO — não montado em App.tsx** | Montar em sidebar v2 |
| `src/components/widgets/BriefingWidget.tsx` | 143 | **ÓRFÃO — substituído por MorningBriefing** | **APAGAR** em Story 0.8 |
| `src/components/widgets/FeedWidget.tsx` | 124 | **ÓRFÃO — substituído por MorningBriefing** | **APAGAR** em Story 0.8 |
| `src/lib/markets-api.ts` | 132 | Funcional, conecta Yahoo via allorigins.win, 9 símbolos | Manter |
| `src/lib/github-api.ts` | 53 | Funcional | Manter |
| `src/lib/rss-proxy.ts` | 134 | Funcional | Manter ou apagar (BriefingWidget órfão) |
| `src/lib/themes.ts` | — | 4 temas | Manter |
| `src/lib/config.ts` | 47 | Funcional | Adaptar v2 |
| `src/hooks/useLocalStorage.ts` | — | Funcional | Manter |
| `src/hooks/usePomodoro.ts` | 88 | Funcional, 25min/5min, beep | Manter |
| `src/types/index.ts` | 97 | Funcional | Expandir v2 |
| `src/components/onboarding/OnboardingModal.tsx` | 195 | Funcional, 4 steps | Refactor v2 |
| `src/components/layout/SettingsModal.tsx` | 109 | Funcional | Refactor v2 |

### Riscos técnicos identificados em v1

| # | Risco | Severidade | Resolução em v2 |
|---|-------|-----------|-----------------|
| 1 | API key Anthropic no browser (`anthropic-dangerous-direct-browser-access: true`) | 🔴 ALTO | Move para Vercel env (Epic 0 Story 0.5) |
| 2 | GitHub token no browser idem | 🟡 MÉDIO | Move para Vercel env |
| 3 | Sem deploy (só local) | 🟡 MÉDIO | Vercel deploy (Epic 0 Story 0.10) |
| 4 | Sem PWA / sem offline | 🟡 MÉDIO | PWA em Epic 8 |
| 5 | Sem tests, sem lint | 🟢 BAIXO | Setup em Epic 0 Story 0.9 |

---

## Decisões tomadas pelo Eurico em 04/05/2026 (com citações)

Durante a conversa de 04/05/2026, Eurico escolheu literalmente:

| Pergunta | Resposta dele | Implicação |
|----------|---------------|-----------|
| Paradigma central | **(C)** "Substitui o dashboard pelo paradigma chat-first" | Chat AI central. Widgets descem para sidebar |
| Stack | **(B)** "Migrar para Next.js + backend mínimo" | Vite morre. Vercel Functions. AI key server-side |
| Reuso código com Jarvis | **(C)** "Construir só no Nexus" | Jarvis fora deste repo |
| Frase exacta sobre Jarvis | "preocupa-te apenas com este projeto o jarvir não é para ser desenvolvido aqui" | NÃO mencionar Jarvis em código deste projecto |
| Módulos do Jarvis a portar | "**todas**" (15/15) | Cérebro multi-intent + Tarefas Kanban + Finanças completas + Hábitos + Projectos + Lembretes + Metas + Diário + Brain Dump + Conhecimento + Calendar + Gmail + Telegram + Voice + OCR |
| Dores actuais | "**todas**" | Sem priorização subjectiva — ordenar por dependências técnicas |
| WhatsApp/Telegram | "**A — vamos esquecer todo tipo de custos, podemos analizar o telegram**" | **Telegram Bot API** (oficial, gratuita). NÃO WhatsApp |
| Lembretes | "**B**" (browser push) | Web Push API + Service Worker + VAPID |
| Voice | "**C eliminar todo tipo de custos a**" → Web Speech API | Web Speech (Chrome/Edge nativo, gratuito) |
| Pesquisa web | "**D eliminar custos**" | Anthropic web search (incluído na key) ou DuckDuckGo |
| Domínio deploy | "**E pode ser vercel. isto é uso interno**" | Vercel default OK |
| Validação caminho | "ok" para roadmap 8 epics + paralelizar @architect + @ux | Avançar |
| Próximo passo | "**B**" (handoff) — "HANDOFF BEM DETALHADO PARA CONTINUAR EM TERMINAL SEM CONTEXTO. NÃO PODE HAVER ENGANOS, COMO RECOMEÇO, ONDE ... TUDO" | Pausar nesta sessão. Continuar em sessão fresca |

---

## Documentos criados nesta sessão

> Esta secção lista LINHA-A-LINHA os ficheiros criados (regra `mandatory-change-log.md`).

| Ficheiro | Linhas | Status | Conteúdo |
|---------|--------|--------|----------|
| `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | 675 | NOVO | PRD completo: 12 secções, 96 FRs, 24 NFRs, 8 Epics com stories sugeridas |
| `imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md` | ~200 | NOVO | Validação PO checklist, verdict CONCERNS 7,2/10, 4 gaps |
| `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-prd-v2-validado-aguarda-architect-ux.md` | (este ficheiro) | NOVO | Este handoff |
| `docs/HANDOFF-INDEX.md` | +1 linha | UPDATED | Adicionada entrada pending no topo |

**Nenhum ficheiro de código foi modificado.** `git status` mostra estes 3 ficheiros novos + 1 linha alterada no INDEX.

---

## Roadmap consolidado (validado pelo Eurico)

8 epics, ordem 0→1→2→3→4→5→6→7→8. **Decisão Eurico: "ok"** (sem alterações pedidas).

| # | Epic | Goal | Bloqueia | Estimativa |
|---|------|------|----------|-----------|
| 0 | **Migração estrutural** | Vite→Next.js 15 + Vercel Functions + AI key server-side + layout chat-first + auth single-user | Tudo | 1-2 semanas |
| 1 | **Cérebro multi-intent** | Function calling Anthropic Sonnet + Haiku classifier + preview + undo + audit log | 5, 7, 11, 12, 13 | 2-3 semanas |
| 2 | **Tarefas v2 + Projectos** | Kanban + calendário + recorrência + projectos + tools cérebro | 4 | 1-2 semanas |
| 3 | **Finanças completas** | Variáveis + recorrentes + cartões + prestações + património + projecção 30d | 12 | 1-2 semanas |
| 4 | **Hábitos + Metas + Lembretes** | Heatmap + recorrência + Web Push + tools cérebro | — | 1-2 semanas |
| 5 | **Diário + Brain Dump + Conhecimento** | Markdown + AI organiza + áreas/cadernos + pesquisa web | — | 2 semanas |
| 6 | **OAuth Google + Telegram Bot** | Calendar 2-way + Gmail Important/Reply + Telegram canal | 7 | 2 semanas |
| 7 | **Voice + OCR** | Web Speech (browser) + Claude Vision (recibo→finança) | — | 1-2 semanas |
| 8 | **Hardening + Deploy + PWA** | Tests + service worker offline + Vercel CD + backup export | — | 1-2 semanas |

**Estimativa total:** 12-20 semanas calendário (2-4 meses focado).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-prd-v2-validado-aguarda-architect-ux.md`. PROJECTO É NEXUS, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## Stack final decidida (NÃO REABRIR)

| Camada | Tecnologia | Razão |
|--------|-----------|-------|
| Framework | Next.js 15 App Router | Decisão Eurico (P2=B) |
| Linguagem | TypeScript strict | Padrão AIOX |
| Styling | Tailwind 4 (já existe v1) | Manter |
| UI components | Componentes custom + lucide-react (já existe v1) | Manter |
| AI Executor | Claude Sonnet 4.6 (`claude-sonnet-4-6`) | Multi-intent function calling |
| AI Classifier | Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) | Já em código v1 |
| Drag-drop | dnd-kit | Padrão React moderno |
| Datas/Recorrência | date-fns + rrule | Padrão indústria |
| Markdown editor | tiptap OU lexical | **Decisão @architect** |
| Push | Web Push API + VAPID self-generated | Zero custos |
| Voice | Web Speech API browser | Zero custos (Chrome/Edge nativo) |
| OAuth Google | googleapis SDK | Calendar + Gmail |
| Telegram | node-telegram-bot-api ou fetch directo | Bot API gratuita |
| Storage tokens | Vercel KV (free tier 10MB) | Suficiente single-user |
| Storage dados | localStorage primeiro (migration v1→v2); IndexedDB se exceder 5MB | **Decisão @architect** |
| Auth | Password única em env (cookie HttpOnly) | Uso interno single-user |
| Tests | Vitest + Playwright | Padrão moderno |
| CI | GitHub Actions + Vercel preview | Padrão |
| Deploy | Vercel (domínio default `nexus-eurico.vercel.app` ou similar) | Decisão Eurico (P E) |
| OCR | Claude Vision (incluído API key Anthropic) | Zero custos extra |
| Pesquisa web | Anthropic web search OU DuckDuckGo HTML scraping | Zero custos extra |

---

## Constraints inegociáveis (NÃO QUESTIONAR EM SESSÕES FUTURAS)

| # | Constraint | Origem |
|---|-----------|--------|
| C1 | Single-user. Só Eurico acede. NUNCA multi-tenant | Directiva Eurico 04/05/2026 |
| C2 | Zero custos externos além API key Anthropic já existente | Directiva Eurico 04/05/2026 |
| C3 | PT-PT exclusivo em copy/UI/comentários | `.claude/rules/language-standards.md` |
| C4 | Design system [IA]AVANÇADA PT — `#04040A`, glassmorphism, Inter + JetBrains Mono | `.claude/rules/design-system-ia-avancada.md` |
| C5 | Constitution AIOX — story-driven, agent authority, no invention | `.aiox-core/constitution.md` |
| C6 | Telegram Bot API. **NÃO WhatsApp** | Directiva Eurico 04/05/2026 |
| C7 | Web Push (não SMS, não email) | Directiva Eurico 04/05/2026 |
| C8 | Web Speech API (não Whisper backend) | Directiva Eurico 04/05/2026 |
| C9 | Deploy Vercel | Directiva Eurico 04/05/2026 |
| C10 | Build não destrói código v1 — reuso de widgets | Custo de retrabalho |
| C11 | Jarvis (SaaS) NÃO existe neste projecto | Directiva Eurico 04/05/2026 |

---

## Próximo passo concreto (para o agente que entra)

### Ordem sequencial obrigatória

```
1. LER (não saltar):
   ├── .claude/rules/handoff-central.md (regra do INDEX)
   ├── .claude/rules/handoff-location.md (esta regra)
   ├── docs/HANDOFF-INDEX.md (procurar entrada deste handoff)
   ├── imersao-tools/nexus/docs/PRD-NEXUS-V2.md (PRD completo)
   ├── imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md (verdict CONCERNS + 4 gaps)
   └── ESTE ficheiro (handoff completo)

2. CONFIRMAR com Eurico (uma única pergunta):
   "Encontrei handoff Nexus v2. Estado: PRD validado pela PO com CONCERNS, 4 gaps abertos.
    Próximo passo é invocar @architect e @ux-design-expert em paralelo. Avanço?"

3. SE Eurico autorizar:
   ├── Invocar @architect (Aria) — input: PRD + PO validation
   │     Output esperado: imersao-tools/nexus/docs/architecture-v2.md
   │     Deve resolver: G3 (Edge vs Node Runtime, IndexedDB lib, markdown editor)
   │                    G4 (Test scaffold, mocks Anthropic/Google/Telegram)
   │
   ├── Invocar @ux-design-expert (Uma) em paralelo — input: PRD + PO validation
   │     Output esperado: imersao-tools/nexus/docs/front-end-spec-v2.md
   │     Deve resolver: G1 (wireframes chat-first, sidebar widgets, modais)
   │     Deve respeitar: design-system-ia-avancada.md (#04040A, glassmorphism, Inter+JetBrains Mono)
   │
   └── (Eurico responde G2 quando puder — domínio Vercel default vs próprio)

4. QUANDO architecture + UX-spec estiverem entregues:
   ├── @po valida ambos (10-point checklist em cada)
   ├── @sm parte Epic 0 em stories: 0.1 → 0.2 → ... → 0.10
   ├── @po valida primeira story (0.1)
   └── @dev implementa Story 0.1 (setup Next.js 15 paralelo a v1)

5. SE @architect ou @ux trazer alterações que afectem o PRD:
   ├── Actualizar PRD-NEXUS-V2.md com change log
   └── Re-validar com PO
```

### Comandos AIOX exactos

| Quando | Comando |
|--------|---------|
| Inicial | `@architect` (Aria) carrega contexto |
| Em paralelo | `@ux-design-expert` (Uma) — outro terminal preferível |
| Após docs prontos | `@po *validate-doc {architecture-v2.md}` e idem para front-end-spec |
| Após PO PASS | `@sm *draft` (Story 0.1) |
| Após @sm | `@po *validate-story-draft 0.1` |
| Após PO PASS story | `@dev *develop 0.1` |
| Push final | `@devops *push` (EXCLUSIVO) |

---

## Gaps abertos (4 críticos)

| # | Gap | Severidade | Owner | Resolve em |
|---|-----|-----------|-------|-----------|
| G1 | Wireframes chat-first não existem | 🔴 BLOQUEIA Story 0.4 | `@ux-design-expert` | `front-end-spec-v2.md` |
| G2 | **Domínio Vercel** — default `*.vercel.app` ou subdomínio em `avancada.expressia.pt` | 🔴 BLOQUEIA Story 0.10 | **Eurico** | Resposta directa |
| G3 | Edge vs Node Runtime, IndexedDB lib, markdown editor | 🟡 | `@architect` | `architecture-v2.md` |
| G4 | Test scaffold + mocks Anthropic/Google/Telegram | 🟡 | `@architect` | `architecture-v2.md` |

---

## Anti-padrões absolutos (NUNCA fazer em sessões futuras)

| Anti-padrão | Razão | Origem |
|-------------|-------|--------|
| 🚫 Mexer em código v1 (`imersao-tools/nexus/src/`) sem story validada | Constitution Article III | `agent-authority.md` |
| 🚫 Apagar `BriefingWidget.tsx` ou `FeedWidget.tsx` antes de Epic 0 Story 0.8 | Pode quebrar imports não detectados | Verificar primeiro |
| 🚫 Inventar features que não estão no PRD | Constitution Article IV | `feedback_no_invented_cases.md` |
| 🚫 Mencionar Jarvis em ficheiros do Nexus | Directiva Eurico ("não é para ser desenvolvido aqui") | Citação literal |
| 🚫 Propor multi-tenant, billing, GDPR formal, Stripe | Uso interno single-user | Constraint C1 |
| 🚫 Adicionar custos externos novos | Constraint C2 | Directiva Eurico |
| 🚫 Adicionar WhatsApp em vez de Telegram | Decisão final | Constraint C6 |
| 🚫 Criar handoffs fora de `imersao-tools/nexus/docs/handoffs/` | Regra `handoff-location.md` | INEGOCIÁVEL |
| 🚫 Recomeçar do zero ou pedir explicações já dadas | Frustração registada | `feedback_never_restart_context.md` |
| 🚫 Reportar "feito" sem mostrar diff real verificado | Regra `mandatory-change-log.md` | INEGOCIÁVEL |
| 🚫 Tratar Eurico por "Sr." | Tratamento informal directo | `feedback_no_sr_treatment.md` |
| 🚫 Usar PT-BR em vez de PT-PT | `language-standards.md` | INEGOCIÁVEL |
| 🚫 Fazer push sem ser `@devops` | Constitution Article II | INEGOCIÁVEL |

---

## Como verificar que estás no projecto certo

```powershell
# 1. Confirmar que estás no repo correcto
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
git remote -v   # deve mostrar repo eurico

# 2. Confirmar que pasta nexus existe
ls imersao-tools/nexus/   # deve ter src/, package.json, vite.config.ts

# 3. Confirmar PRD existe
ls imersao-tools/nexus/docs/   # deve ter PRD-NEXUS-V2.md, PO-VALIDATION-PRD-V2.md, handoffs/

# 4. Confirmar que NÃO há código novo escrito por engano
git status imersao-tools/nexus/src/   # deve estar clean

# 5. Confirmar que dev server v1 ainda funciona (opcional)
cd imersao-tools/nexus && npm install && npm run dev
# Browser → http://localhost:5197 deve abrir Nexus v1
```

---

## Memórias relevantes (regra `handoff-central.md`)

Pertinentes a este handoff:

| Memória | Por que importa |
|---------|-----------------|
| `project_nexus_vision.md` | Visão original 08/04/2026 — "primeiro ecrã da manhã", overnight agent killer feature |
| `feedback_nexus_not_news.md` | Substituir feeds tech por mercados financeiros |
| `feedback_handoffs_detail.md` | Handoffs precisam de citações e contexto concreto |
| `feedback_never_restart_context.md` | NUNCA pedir explicações já dadas — ler RETOMA + memória, avançar directo |
| `feedback_no_invented_cases.md` | ZERO exemplos fictícios |
| `feedback_governance_never_blocks_execution.md` | Não invocar governance como bloqueador — propor 1 path concreto e executar |

---

## Estado git no final desta sessão

```
Modificados (não commitados):
M docs/HANDOFF-INDEX.md (linha adicionada para este handoff)

Novos (untracked):
?? imersao-tools/nexus/docs/PRD-NEXUS-V2.md
?? imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md
?? imersao-tools/nexus/docs/handoffs/RETOMA-20260504-prd-v2-validado-aguarda-architect-ux.md

Não foi feito commit nem push.
Comando para Eurico avançar quando quiser:
  @devops *push  (EXCLUSIVO @devops — NUNCA outro agente)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno do Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-prd-v2-validado-aguarda-architect-ux.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-prd-v2-validado-aguarda-architect-ux.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **Orion (aiox-master)**
DATA: **04/05/2026**

---

## Próxima acção quando Eurico voltar

Em sessão nova, abrir terminal aqui (`C:\Users\XPS\Documents\ecosistema-ia-avancada-pt`) e o agente **DEVE**:

1. **Ler `docs/HANDOFF-INDEX.md`** primeiro (regra `handoff-central.md`)
2. **Encontrar entrada Nexus v2** (data 04/05/2026)
3. **Abrir este RETOMA**
4. **Ler PRD + PO validation**
5. **Confirmar com Eurico em UMA frase:**
   > "Encontrei handoff Nexus v2 de 04/05/2026. PRD validado, 4 gaps abertos. Avanço com @architect + @ux-design-expert em paralelo?"
6. **Se SIM → executar passo 3 do roadmap acima**
7. **Marcar este handoff como consumed** (regra `handoff-central.md`):
   - Mover este `.md` para `imersao-tools/nexus/docs/handoffs/archive/`
   - Actualizar `docs/HANDOFF-INDEX.md` (mover linha pending → archived)

---

*Handoff escrito por Orion (aiox-master) em 04/05/2026 ~12:40 a pedido directo do Eurico ("HANDOFF BEM DETALHADO PARA CONTINUAR EM TERMINAL SEM CONTEXTO. NÃO PODE HAVER ENGANOS, COMO RECOMEÇO, ONDE ... TUDO"). Designed para zero ambiguidade.*
