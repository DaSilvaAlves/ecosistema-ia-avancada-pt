# PO Validation Report — architecture-v2.md

**Validador:** Pax (`@po`)
**Data:** 04/05/2026
**Documento validado:** `imersao-tools/nexus/docs/architecture-v2.md` (1164 linhas, 21 secções, 5 ADRs)
**Autor do documento:** Aria (`@architect`)
**Trace de input:**
- `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` (96 FRs, 24 NFRs, 8 Epics, 11 Constraints)
- `imersao-tools/nexus/docs/PO-VALIDATION-PRD-V2.md` (verdict prévio CONCERNS 7,2/10, gaps G3+G4 atribuídos a `@architect`)
- `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-front-end-spec-v2-completa-aguarda-po.md` (handoff de input)
- `.claude/rules/design-system-ia-avancada.md` (constraint C4)
- `.aiox-core/constitution.md` (Article IV — No Invention)

---

## Sumário Executivo

| Verdict | Score |
|---------|-------|
| **PASS** (avança para Epic 0 sem revisão obrigatória) | **8,8 / 10** |

**Razão:** Architecture v2 fecha completamente os gaps G3 e G4 da PO validation prévia, respeita as 11 Constraints inegociáveis, mapeia os 24 NFRs a componentes architecturais concretos, e fornece blueprint suficiente para `@sm` partir Epic 0 em stories sem ambiguidade técnica bloqueante. As 5 ADRs estão justificadas com trade-offs explícitos. Os 7 riscos architecturais têm mitigação documentada. O `package.json` projectado (§17) está alinhado com a stack final acordada. Os 3 issues observados são minor — registos para discussão sem bloquear avanço.

---

## 10-Point Validation Checklist

### Ponto 1 — Architecture cobre 100% dos 96 FRs e 24 NFRs do PRD

| Status | Evidência |
|--------|-----------|
| ✅ PASS | §15 entrega tabela explícita NFR→componente architectural cobrindo NFR1 a NFR24. FRs estão cobertos via §16 (estratégia de implementação por Epic, mapeando bloqueios e pontos críticos por Story) + §6 (modelo de dados por Epic) + §7 (Tool Registry com inventário 39 tools distribuídas por 8 Epics que materializam FR2 multi-intent + FRs por domínio). |

**Notas:** FR93-96 (widgets v1 mantidos) está coberto pelo §3 (repo layout `v2/components/widgets/` portados de v1) e pela secção UX `front-end-spec-v2.md §3.1`. Não há FR órfão detectado.

### Ponto 2 — Architecture e UX spec não se contradizem

| Status | Evidência |
|--------|-----------|
| ✅ PASS | §3 (repo layout) prevê `v2/app/(app)/page.tsx` como rota raiz `/` (chat principal) + `(app)/tasks/`, `(app)/finance/`, etc. com modais via Next.js parallel routes — **bate exactamente** com UX-5 (vistas detalhadas como modais fullscreen com Esc para fechar). §8 (Streaming SSE) descreve o fluxo de eventos `meta`/`tool_start`/`tool_complete`/`text_delta`/`done` que **bate exactamente** com UX `front-end-spec-v2.md §1.2` (killer flow multi-intent com cards a aparecerem em tempo real). §6.1 schema `ChatMessage` + `AgentRun` suporta NFR4 (infinite scroll) que UX §2.1 materializa. §11 Service Worker manual com handler `push` suporta UX `§1.5b` (foto via Telegram) e o flow de notificações de lembretes. |

### Ponto 3 — Constraints C1–C11 do PRD respeitadas

| # | Constraint | Architecture trace |
|---|-----------|---------------------|
| C1 | Single-user (só Eurico) | §6 schema sem multi-tenancy; §9.1 auth single-user via `NEXUS_PASSWORD_HASH` env |
| C2 | Zero custos externos além API key Anthropic | §14 valida free tier Vercel + KV Upstash 10MB free; bandwidth/invocations dentro de free tier |
| C3 | PT-PT exclusivo | Documento todo em PT-PT; `lang="pt-PT"` na descrição §11; Web Speech `lang: 'pt-PT'` em §16 Epic 7 |
| C4 | Design system [IA]AVANÇADA PT | §3 referência `styles/globals.css` + `tokens.css` com paleta `#04040A` etc.; UX spec §5 aplica integralmente |
| C5 | Constitution AIOX (story-driven, agent authority, no invention) | §16 ordena por Epic do PRD; 5 ADRs todas trace ao PRD; §20 checklist auto-validação confirma "Sem invenção" |
| C6 | Telegram (não WhatsApp) | §3 `api/telegram/webhook/route.ts`; §17 `node-telegram-bot-api`; §9.5 secret token signature |
| C7 | Web Push (não SMS/email) | §3 `api/push/subscribe`, `api/push/send`; §17 `web-push` lib; §11 Service Worker handler push |
| C8 | Web Speech API (não Whisper backend) | §16 Epic 7 documenta Chrome/Edge support, Firefox best-effort — sem backend Whisper |
| C9 | Deploy Vercel | §13 CI/CD inclui Vercel preview/production; §9.2 env vars Vercel; §14 limites free tier |
| C10 | Build não destrói v1 — `v2/` paralelo | §3 repo layout explícito com `src/` v1 INTOCADO + `v2/` novo; Story 8.10 (Epic 8) elimina `src/` apenas após smoke E2E migration |
| C11 | Jarvis (SaaS) NÃO existe neste projecto | Zero menções a Jarvis no documento |

**Observação:** C12 (domínio `nexus-eurico.vercel.app`, decidido pelo Eurico em 04/05) é referenciado em §9.2 (`GOOGLE_OAUTH_REDIRECT_URI`).

| Status | Evidência |
|--------|-----------|
| ✅ PASS | Todas as 11 Constraints respeitadas. C12 (resolvido pelo Eurico) integrado no env layout. |

### Ponto 4 — Zero invenção (Constitution Article IV)

| Status | Evidência |
|--------|-----------|
| ✅ PASS | §1 declara explicitamente "Não reabre decisões já tomadas pelo Eurico". 5 ADRs todas com **trade-off aceite** documentado e trace ao PRD ou contexto técnico. §15 mostra cada NFR mapeado a um componente concreto. §20 auto-checklist confirma "Sem invenção de features — tudo trace ao PRD". Inventário 39 tools (§7.4) distribuído por Epic — cada tool corresponde a um FR ou conjunto de FRs do PRD. |

**Issue minor I-A-1 (não bloqueante):** §8 inclui evento SSE `tool_error` que é coerente com PRD FR3+FR5+FR6 (visibilidade de tool calls + undo) mas não é literalmente nomeado no PRD. É detalhe técnico de implementação correctamente derivado dos FRs — aceitável.

### Ponto 5 — Riscos identificados têm mitigação documentada

| Status | Evidência |
|--------|-----------|
| ✅ PASS | §18 lista 7 riscos architecturais (AR1-AR7) cada um com Severidade + Mitigação concreta. AR1 (Edge runtime) mitigado por matriz §4.1 com fallback Node. AR2 (Dexie migration) mitigado com `upgrade()` em transaction + fallback localStorage até Epic 8. AR3 (Tool registry coesão) mitigado por lint rule custom + cobertura no test set canónico. AR4 (KV exceder 10MB) mitigado por TTL agressivo. Riscos do PRD §11 (cobertura 60%, multi-intent confidence, OCR PT, OAuth Google verification, Telegram bot policy) ficam endereçados aqui ou em UX. |

### Ponto 6 — Testabilidade: stack de testes definida

| Status | Evidência |
|--------|-----------|
| ✅ PASS | §5 entrega estratégia completa. §5.1 stack por layer (Unit Vitest, Component Testing-Library, Integration Vitest+MSW+fake-indexeddb, E2E Playwright Chromium, Manual Eurico). §5.2 MSW handlers concretos para Anthropic/Google/Telegram. §5.3 test set canónico 50 prompts PT-PT em `tests/fixtures/prompts-pt-pt.json` para regression — permite medir AC1 do PRD ("intent accuracy >= 85%"). §5.4 cobertura 60% APENAS em packages core (decisão sensata para uso interno). Resolve gap G4 da PO prévia. |

### Ponto 7 — Cobertura quality gates Epic 0 (AC1–AC6 do PRD §10 Epic 0)

| AC Epic 0 | Architecture trace |
|-----------|---------------------|
| AC1 (Login funcional + redirect /) | §9.1 auth flow completo: bcrypt + sessionId KV + Set-Cookie HttpOnly; §3 routes `(auth)/login/page.tsx` |
| AC2 (Layout chat-first em `/` com sidebar) | §3 repo layout componentes `chat/` + `widgets/`; UX spec §2 layout exacto |
| AC3 (Pelo menos 3 widgets v1 portados a funcionar) | §3 lista widgets a portar (Greeting, Pomodoro, GitHub, Markets, Links, Goodnight, Morning); §16 Epic 0 explicita Story 0.2 migra `themes.ts`, `useLocalStorage.ts`, `usePomodoro.ts` |
| AC4 (Anthropic SDK + envio prompt + receber resposta texto) | §3 `api/anthropic/proxy/route.ts` (Edge); §16 Epic 0 Story 0.5 "bloqueante — sem isto Epic 1 não arranca" |
| AC5 (Vercel deploy verde via GitHub Actions) | §13 CI completo + §16 Epic 0 mencionam Vercel preview build verde como AC; C12 domínio decidido |
| AC6 (Build verde + lint + typecheck OK) | §13 jobs `lint-typecheck` + `unit-tests` + `e2e` + `coderabbit`; §17 stack completa em package.json projectado |

| Status | Evidência |
|--------|-----------|
| ✅ PASS | Os 6 ACs do Epic 0 têm correspondência directa em componentes architecturais ou estratégia de implementação por Story. |

### Ponto 8 — UX-1 a UX-5 da spec UX são compatíveis com ADR-1 a ADR-5

| Verificação | Status |
|-------------|--------|
| UX-1 (chat sempre visível + sidebar widgets fixa) compatível com ADR-1 (Edge runtime para `/api/agent/prompt`) | ✅ Edge SSE alimenta o chat sem latência adicional para o widget de sidebar (independente) |
| UX-2 (Morning Briefing pinned) compatível com ADR-2 (Dexie 4) | ✅ Mensagem `pinned` lê-se de `chat_messages` table com índice `[conversationId+timestamp]` (§6.1) |
| UX-3 (ToolCard inline 6 estados) compatível com ADR-5 (Tool Registry) | ✅ `requiresPreview` flag no contract da tool (§7.2) materializa o estado `preview-required` da UX |
| UX-4 (Markets Widget topo sidebar) compatível com ADR-1+ADR-4 | ✅ Markets é widget cliente puro (cached via lib `markets/` portada), sem dependência de runtime split; testes via MSW se necessário |
| UX-5 (vistas como modais fullscreen) compatível com ADR-1 | ✅ Next.js parallel routes ou `(modal)` group já previsto no repo layout §3 |

| Status | Evidência |
|--------|-----------|
| ✅ PASS | Sem conflitos detectados entre as 5 UX-ADRs e as 5 ADRs architecturais. |

### Ponto 9 — Documento pronto para `@sm` partir Epic 0 em stories sem ambiguidade bloqueante

| Status | Evidência |
|--------|-----------|
| ✅ PASS | §16 entrega "Pontos críticos arch" para cada Epic (0 a 8), explicitando Stories bloqueantes (ex: Story 0.5 proxy Anthropic é bloqueante). §17 fornece `package.json` projectado com versões específicas — `@sm` parte Story 0.1 directamente sobre esta lista. §6 fornece schema lógico por Epic — `@dev` implementa Dexie schema sem inventar campos. §3 repo layout dá estrutura de pastas exacta. |

### Ponto 10 — Integridade técnica e operacional global

| Aspecto | Evidência |
|---------|-----------|
| CI/CD pipeline funcional | §13 GitHub Actions completo com 4 jobs |
| Performance budget numérico | §10 com alvos mensuráveis (FCP <2s, p95 prompt <6s, etc.) |
| Segurança | §9 cobre auth flow, secrets layout (12 env vars), rate limiting (KV sliding window), CSP + security headers, Telegram webhook signature |
| Observabilidade | §12 com NFR11 (privacidade logs) garantido (prompts não vão em claro para Vercel logs) |
| Vercel free tier validado | §14 com estimativas concretas vs limites |
| Stack final coerente | §17 package.json com versões específicas alinhadas com directiva Eurico 04/05 |

| Status | Evidência |
|--------|-----------|
| ✅ PASS | Documento operacionalmente completo. |

---

## Issues Identificados (3 minor, não bloqueantes)

### I-A-1 — UX spec admite FR63-68 (vista detalhada Gmail) como "futuro Epic 6 não MVP de UX"

**Severidade:** 🟢 minor (informativo)
**Detalhe:** `front-end-spec-v2.md §9` marca FR63-68 (Gmail) sem componente UX dedicado — apenas Tab Integrações em `/settings`. Architecture v2 §16 Epic 6 prevê classifier corre via Vercel Cron a cada 30 min, mas não detalha vista de revisão de classificação no dashboard.
**Impacto:** Coerência arch-UX preservada (UX é o ponto fraco, não architecture). Para uso interno é aceitável — emails importantes são notificados via push e/ou aparecem no Morning Briefing.
**Recomendação:** Aria não precisa actualizar. Quando @sm partir Epic 6 em stories, validar com Eurico se quer ou não vista dedicada de revisão Gmail (pode tornar-se Story 6.X opcional).

### I-A-2 — Story 2.7 (instâncias recorrentes via Service Worker)

**Severidade:** 🟢 minor (technical caveat)
**Detalhe:** §16 Epic 2 menciona "Story 2.7 instâncias recorrentes geradas por **ServiceWorker** (não setInterval do tab) usando Background Sync ou no `activate` event do SW". Background Sync API tem suporte limitado em Safari — pode falhar em iOS PWA.
**Impacto:** Para uso pessoal Eurico em Chrome/Edge desktop é OK (NFR23). Em iOS PWA (Safari) pode falhar.
**Recomendação:** Documentar fallback no Epic 2 Story 2.7 — se SW Background Sync indisponível, gerar instâncias on-load do tab + cron Vercel diário 06:00 (já existente em §16 Epic 4 para push).

### I-A-3 — Riscos do PRD §11 não 1:1 com riscos architecturais §18

**Severidade:** 🟢 minor (rastreabilidade)
**Detalhe:** PRD §11 lista 5 riscos do projecto (cobertura 60% adiada, multi-intent confidence baixa, OCR PT, OAuth Google verification, Telegram bot policy). Architecture §18 lista 7 riscos architecturais (AR1-AR7) que são parcialmente sobrepostos. AR6 (Anthropic Vision em recibos PT) bate com risco PRD #3. AR5 (OAuth verification) bate com risco PRD #4. Mas riscos PRD #1 (cobertura) e #2 (multi-intent) não estão explicitamente em §18.
**Impacto:** Sem impacto directo. PRD §11 está coberto por §5.4 (cobertura) e §16 Epic 1 (multi-intent confidence via classifier→executor split + test set 50 prompts).
**Recomendação:** Aceitável. Se Aria quiser fechar formalmente, pode adicionar AR8 (cobertura adiada) e AR9 (multi-intent confidence) numa próxima revisão — não bloqueante.

---

## Adequação Constitutional

| Article | Compliance |
|---------|-----------|
| **I — CLI First** | ⚠️ N/A parcial — Nexus é UI-first por natureza (single-user dashboard pessoal). Vercel Functions são CLI-acessíveis (curl), e API Anthropic via proxy também. Aceitável (mesmo critério que PO Validation PRD). |
| **II — Agent Authority** | ✅ Architecture documenta Aria como autor; @dev implementa, @qa valida, @devops faz push. Sem violação. |
| **III — Story-Driven** | ✅ §16 mapeia trabalho a Stories por Epic, alinhado com PRD §10. |
| **IV — No Invention** | ✅ §1 + §20 auto-checklist confirmam zero invenção. Cada decisão trace ao PRD ou ADR. |
| **V — Quality First** | ✅ §5 estratégia testes completa, §13 CI com lint+typecheck+unit+e2e+coderabbit. Cobertura 60% é abaixo da Constitution geral mas justificada para uso interno. |
| **VI — Absolute Imports** | ✅ §3 prevê `tsconfig.json` com `paths "@/*"` — imports absolutos. |

---

## Decisão Final

### Verdict: **PASS — PROCEED PARA EPIC 0**

**Pode avançar para `@sm` (River) partir Epic 0 em stories 0.1-0.10 sem revisão obrigatória deste documento.**

Os 3 issues identificados (I-A-1, I-A-2, I-A-3) são minor e não bloqueiam Story 0.1. Podem ser endereçados em sessão dedicada ou diferidos para revisão futura sem risco.

### Score detalhado

| Critério | Peso | Score | Pontos |
|----------|------|-------|--------|
| Cobertura FRs/NFRs | 15% | 9/10 | 1,35 |
| Coerência com UX spec | 15% | 10/10 | 1,50 |
| Constraints respeitadas | 15% | 10/10 | 1,50 |
| Zero invenção (Article IV) | 10% | 9/10 | 0,90 |
| Riscos com mitigação | 5% | 9/10 | 0,45 |
| Testabilidade | 10% | 9/10 | 0,90 |
| Quality gates Epic 0 | 10% | 10/10 | 1,00 |
| Pronto para @sm | 10% | 9/10 | 0,90 |
| Integridade global | 10% | 9/10 | 0,90 |
| **Total** | **100%** | — | **8,80** |

---

## Action Items

| Owner | Acção | Quando |
|-------|-------|--------|
| Pax (Eu) | Produzir handoff de saída para `@sm` (River) com referência a esta validation + PO-VALIDATION-FRONT-END-SPEC-V2.md | Imediato |
| Pax (Eu) | Marcar handoff de input consumed + mover para archive + actualizar HANDOFF-INDEX | Imediato |
| Aria (eventualmente) | Considerar adicionar AR8 (cobertura adiada) e AR9 (multi-intent confidence) em revisão futura | Não bloqueante |
| @sm (River) | Partir Epic 0 em stories 0.1-0.10 baseadas em §16 deste documento + UX `front-end-spec-v2.md §3` | Após handoff entregar |

---

*PO validation completa por Pax (`@po`) em 04/05/2026. Verdict: PASS 8,8/10 — proceder para Epic 0 sem revisão obrigatória.*
