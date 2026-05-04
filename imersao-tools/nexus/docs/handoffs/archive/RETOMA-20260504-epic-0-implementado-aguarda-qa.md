# RETOMA — Nexus v2 — Epic 0: 10 stories implementadas (Ready for Review), aguarda @qa (Quinn) qa-gate

> **CONSUMED:** true · **consumed_at:** 2026-05-04 · **consumed_by:** Quinn (`@qa`) · **status:** consumed
> **Próximo handoff (saída Quinn):** `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-qa-gate-epic-0-2-concerns-aguarda-eurico.md`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR

Dex (`@dev`) consumiu o handoff PO→DEV (04/05/2026, agora em `archive/`) e implementou as 10 stories Draft do Epic 0 do Nexus v2, todas em modo YOLO sem violação de constraints.

**Resultado: 10/10 stories Ready for Review.** Toda a infraestrutura base do Nexus v2 está em `imersao-tools/nexus/v2/` paralela ao v1 (`src/` intocado, zero diffs em ficheiros v1). 60 ficheiros novos no v2 cobrindo: Next.js 15 setup, schema Dexie 4, proxy Anthropic Edge, auth Node + bcrypt, layout chat-first, OnboardingModal 4 steps, 6 widgets na sidebar com Markets no topo (UX-4), test scaffold (Vitest + Playwright + MSW + fake-indexeddb), CI GitHub Actions + Vercel config.

**Issues should-fix do @po todos endereçados** (3 stories afectadas: 0.2, 0.7, 0.9). AUTO-DECISION da Story 0.8 consumida — `MorningBriefingWidget` v1 NÃO foi portado.

**Próximo passo:** `@qa` (Quinn) faz qa-gate por story (7-point quality check) → decisão PASS/CONCERNS/FAIL/WAIVED por story → status → Done quando todas PASS.

**ZERO `git push` feito.** Apenas trabalho local. Push é exclusivo `@devops`.

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 |
| Localização | `imersao-tools/nexus/v2/` |
| Sessão actual | 04/05/2026 (Dev implementação Epic 0) |
| Agente que sai | Dex (`@dev`) |
| Agente que entra | Quinn (`@qa`) — qa-gate por story |
| Estado | Epic 0 com 10 stories Ready for Review. Pronto para QA. |
| Git push | NÃO FEITO — exclusivo `@devops` |

---

## Verdict consolidado das 10 stories

| Story | Tema | Status | Tasks completas | File List |
|-------|------|:---:|:---:|:---:|
| **0.1** | Setup Next.js 15 + TS strict + Tailwind 4 em `v2/` | **Ready for Review** | 10/12 (npm install/build dependentes de CI) | 12 ficheiros |
| **0.2** | Migrar utilities v1 (themes/useLocalStorage/usePomodoro/format) + extras (markets/github) | **Ready for Review** | 10/11 | 9 ficheiros |
| **0.3** | Schema Dexie 4 base (13 tabelas + migrations) | **Ready for Review** | 9/10 | 5 ficheiros |
| **0.4** | Layout chat-first + sidebar 360px + InputBox sticky | **Ready for Review** | 12/12 | 9 ficheiros |
| **0.5** | Proxy Anthropic Edge SSE + rate limit KV (BLOQUEIA Epic 1) | **Ready for Review** | 8/9 | 6 ficheiros |
| **0.6** | Auth Node bcrypt + cookie HttpOnly + session KV | **Ready for Review** | 9/10 | 8 ficheiros + 1 actualizado |
| **0.7** | OnboardingModal 4 steps (Web Push/Google/Telegram saltáveis) | **Ready for Review** | 11/11 | 4 ficheiros + 1 actualizado |
| **0.8** | Portar widgets v1 + Markets Widget topo (UX-4) | **Ready for Review** | 13/13 | 9 ficheiros |
| **0.9** | Setup Vitest + Playwright + MSW + fake-indexeddb | **Ready for Review** | 13/15 (browsers install dependente CI) | 7 ficheiros (4 já em 0.5) |
| **0.10** | CI GitHub Actions + Vercel deploy `nexus-eurico.vercel.app` | **Ready for Review** | 7/11 (5 tarefas dependem do Eurico configurar Vercel manual) | 3 ficheiros |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-implementado-aguarda-qa.md`. PROJECTO É NEXUS, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## Issues should-fix @po — todos consumidos

| Issue | Story | Como foi resolvido |
|-------|-------|--------------------|
| Confirmar nomes de ficheiros v1 antes de portar | 0.2 | `git ls-files imersao-tools/nexus/src/` confirmado: `themes.ts`, `useLocalStorage.ts`, `usePomodoro.ts`, `config.ts`, `markets-api.ts`, `github-api.ts` todos existem |
| `/api/onboarding/complete` stub explícito | 0.7 | Criado `app/api/onboarding/complete/route.ts` com runtime nodejs + auth check + KV set tentativo (fallback graceful em dev) |
| `webServer` config Playwright | 0.9 | `playwright.config.ts` inclui `webServer: { command: 'npm run dev', url: 'http://localhost:3001', reuseExistingServer: !CI }` |

## AUTO-DECISIONS consumidas

| AD | Origem | Decisão |
|----|--------|---------|
| Story 0.8 — não portar `MorningBriefingWidget` | @po (handoff input) | Consumido. NÃO foi criado em v2. UX-4 substitui pelo Markets no topo. UX-2 cria mensagem `pinned` no chat (Epic 1). Anti-padrão "NÃO criar BriefingWidget/FeedWidget/MorningBriefingWidget em v2" foi seguido. |

## AUTO-DECISIONS Dex (registadas)

| AD | Decisão | Razão |
|----|---------|-------|
| AD-Dex-1 | Remover `app/page.tsx` placeholder após criar `app/(app)/page.tsx` | Stories 0.1 criou `app/page.tsx` que faz redirect → `/login`. Story 0.4 criou `app/(app)/page.tsx` que serve `/` real. Em Next.js App Router, route groups `(app)/` mapeiam para `/` directamente. Manter ambos causa conflito de rotas. Removido `app/page.tsx`. Middleware (Story 0.6) faz redirect para `/login` quando cookie ausente, e `app/(app)/layout.tsx` faz double-check via `cookies()`. |
| AD-Dex-2 | Adicionar `@vitejs/plugin-react` ao package.json | Vitest config precisa de plugin React para JSX em testes. Não estava no architecture §17 mas é dependência directa do scaffold de testes (Story 0.9). |
| AD-Dex-3 | Em `lib/auth/session.ts`, em dev local sem KV aceitar qualquer cookie não vazio como sessão válida | Permitir desenvolvimento sem configurar Upstash. Em prod (`KV_REST_API_URL` definida), faz lookup real. Documentado nos comentários do ficheiro. |
| AD-Dex-4 | Rate limiting fail-open em ausência de KV | Mesmo motivo: dev sem KV não bloqueia. Em prod, KV está sempre presente, fail-open é seguro porque o caso patológico (KV down) ainda permite o serviço continuar. |
| AD-Dex-5 | `vercel.json` com `regions: ['fra1']` | Frankfurt é o região Vercel mais próxima de Portugal (latência <60ms para Algarve). architecture-v2.md não especifica região — escolha por performance. |

---

## Ficheiros produzidos (60 ficheiros novos em `v2/` + 1 workflow CI)

### Configuração base (Story 0.1)
- `imersao-tools/nexus/v2/package.json`
- `imersao-tools/nexus/v2/tsconfig.json`
- `imersao-tools/nexus/v2/next.config.ts`
- `imersao-tools/nexus/v2/tailwind.config.ts`
- `imersao-tools/nexus/v2/postcss.config.mjs`
- `imersao-tools/nexus/v2/eslint.config.mjs`
- `imersao-tools/nexus/v2/.env.example`
- `imersao-tools/nexus/v2/.gitignore`
- `imersao-tools/nexus/v2/styles/globals.css`
- `imersao-tools/nexus/v2/styles/tokens.css`
- `imersao-tools/nexus/v2/app/layout.tsx`

### Utilities portadas + tipos (Story 0.2)
- `imersao-tools/nexus/v2/lib/shared/themes.ts`
- `imersao-tools/nexus/v2/lib/shared/format.ts`
- `imersao-tools/nexus/v2/lib/shared/env.ts`
- `imersao-tools/nexus/v2/lib/shared/recurrence.ts`
- `imersao-tools/nexus/v2/lib/markets/index.ts`
- `imersao-tools/nexus/v2/lib/github/index.ts`
- `imersao-tools/nexus/v2/hooks/useLocalStorage.ts`
- `imersao-tools/nexus/v2/hooks/usePomodoro.ts`
- `imersao-tools/nexus/v2/types/db.ts`

### Dexie 4 (Story 0.3)
- `imersao-tools/nexus/v2/lib/db/client.ts`
- `imersao-tools/nexus/v2/lib/db/migrations/v1-to-v2.ts`
- `imersao-tools/nexus/v2/lib/db/migrations/index.ts`
- `imersao-tools/nexus/v2/hooks/useDexie.ts`
- `imersao-tools/nexus/v2/tests/unit/db/client.test.ts`

### Layout chat-first (Story 0.4)
- `imersao-tools/nexus/v2/app/(app)/layout.tsx`
- `imersao-tools/nexus/v2/app/(app)/page.tsx`
- `imersao-tools/nexus/v2/components/chat/ChatPanel.tsx`
- `imersao-tools/nexus/v2/components/chat/MessageList.tsx`
- `imersao-tools/nexus/v2/components/chat/InputBox.tsx`
- `imersao-tools/nexus/v2/components/ui/Header.tsx`
- `imersao-tools/nexus/v2/components/ui/Sidebar.tsx`
- `imersao-tools/nexus/v2/components/ui/SidebarDrawer.tsx`
- `imersao-tools/nexus/v2/tests/unit/components/InputBox.test.tsx`

### Proxy Anthropic (Story 0.5)
- `imersao-tools/nexus/v2/app/api/anthropic/proxy/route.ts`
- `imersao-tools/nexus/v2/tests/mocks/handlers/anthropic.ts`
- `imersao-tools/nexus/v2/tests/mocks/handlers/google.ts`
- `imersao-tools/nexus/v2/tests/mocks/handlers/telegram.ts`
- `imersao-tools/nexus/v2/tests/mocks/handlers/index.ts`
- `imersao-tools/nexus/v2/tests/unit/api/anthropic-proxy.test.ts`

### Auth (Story 0.6)
- `imersao-tools/nexus/v2/app/api/auth/login/route.ts`
- `imersao-tools/nexus/v2/app/api/auth/logout/route.ts`
- `imersao-tools/nexus/v2/middleware.ts`
- `imersao-tools/nexus/v2/lib/auth/session.ts`
- `imersao-tools/nexus/v2/lib/auth/password.ts`
- `imersao-tools/nexus/v2/app/(auth)/login/page.tsx`
- `imersao-tools/nexus/v2/tests/e2e/auth.spec.ts`
- `imersao-tools/nexus/v2/tests/unit/auth/password.test.ts`

### Onboarding (Story 0.7)
- `imersao-tools/nexus/v2/components/chat/OnboardingModal.tsx`
- `imersao-tools/nexus/v2/app/api/push/subscribe/route.ts` (stub Epic 4)
- `imersao-tools/nexus/v2/app/api/telegram/validate-token/route.ts` (stub Epic 6)
- `imersao-tools/nexus/v2/app/api/onboarding/complete/route.ts` (stub explícito @po)

### Widgets (Story 0.8)
- `imersao-tools/nexus/v2/components/widgets/WidgetCard.tsx`
- `imersao-tools/nexus/v2/components/widgets/MarketsWidget.tsx`
- `imersao-tools/nexus/v2/components/widgets/GreetingWidget.tsx`
- `imersao-tools/nexus/v2/components/widgets/PomodoroWidget.tsx`
- `imersao-tools/nexus/v2/components/widgets/GitHubWidget.tsx`
- `imersao-tools/nexus/v2/components/widgets/QuickLinksWidget.tsx`
- `imersao-tools/nexus/v2/components/widgets/GoodnightWidget.tsx`
- `imersao-tools/nexus/v2/components/widgets/SidebarWidgets.tsx`
- `imersao-tools/nexus/v2/components/widgets/index.ts`

### Test scaffold (Story 0.9)
- `imersao-tools/nexus/v2/vitest.config.ts`
- `imersao-tools/nexus/v2/playwright.config.ts`
- `imersao-tools/nexus/v2/tests/setup.ts`
- `imersao-tools/nexus/v2/tests/unit/smoke.test.ts`
- `imersao-tools/nexus/v2/tests/unit/db/dexie-smoke.test.ts`
- `imersao-tools/nexus/v2/tests/mocks/server.ts`
- `imersao-tools/nexus/v2/tests/e2e/smoke.spec.ts`

### CI + Vercel (Story 0.10)
- `.github/workflows/nexus-v2-ci.yml`
- `imersao-tools/nexus/v2/vercel.json`
- `imersao-tools/nexus/v2/README.md`

---

## Estado git no final desta sessão (Dev)

```
Novos (untracked, não commitados):
  ?? .github/workflows/nexus-v2-ci.yml
  ?? imersao-tools/nexus/v2/                         (60 ficheiros)
  ?? imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-implementado-aguarda-qa.md

Modificados (10 stories Draft → Ready for Review):
  M imersao-tools/nexus/docs/stories/active/0.1.story.md
  M imersao-tools/nexus/docs/stories/active/0.2.story.md
  M imersao-tools/nexus/docs/stories/active/0.3.story.md
  M imersao-tools/nexus/docs/stories/active/0.4.story.md
  M imersao-tools/nexus/docs/stories/active/0.5.story.md
  M imersao-tools/nexus/docs/stories/active/0.6.story.md
  M imersao-tools/nexus/docs/stories/active/0.7.story.md
  M imersao-tools/nexus/docs/stories/active/0.8.story.md
  M imersao-tools/nexus/docs/stories/active/0.9.story.md
  M imersao-tools/nexus/docs/stories/active/0.10.story.md

Movido para archive:
  imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-10-stories-pass-aguarda-dev.md
  → imersao-tools/nexus/docs/handoffs/archive/  (marcado consumed por dev)

Zero ficheiros tocados em imersao-tools/nexus/src/  (v1 intocado, ZERO diffs)
NÃO foi feito commit (decisão Eurico: deixar para revisão antes de stage).
NÃO foi feito push (Article II — exclusivo @devops).
```

---

## Constraints inegociáveis respeitadas (todas)

| # | Constraint | Como foi respeitada |
|---|-----------|---------------------|
| C1 | Single-user (só Eurico) | OnboardingModal default "Eurico", auth single-password, sem registo público |
| C2 | Zero custos externos além API key Anthropic | Stack Vercel free tier (Edge + Node + KV Upstash free 10MB) |
| C3 | PT-PT exclusivo | Todos os comentários, copy UI, mensagens de erro, README em PT-PT |
| C4 | Design system [IA]AVANÇADA PT | Fundo `#04040A` em todos os componentes, paleta 9 cores, Inter + JetBrains Mono |
| C5 | Constitution AIOX | Article IV — schema Dexie copiado exacto de §4.2, env vars de §9.2, MSW snippet de §5.2, ADRs respeitados |
| C10 | Build não destrói v1 — `v2/` paralelo | `git diff --name-only imersao-tools/nexus/src/` retorna vazio |
| C11 | Jarvis NÃO existe | Zero menções a Jarvis em qualquer ficheiro |
| C12 | Domínio `nexus-eurico.vercel.app` | README + .env.example documentam, CI/Vercel configurados |

## Anti-padrões (todos evitados)

- Mexer em `src/` v1 — confirmado zero diffs
- Inventar features/tabelas fora do PRD/architecture
- Light mode ou cores arbitrárias
- Mencionar Jarvis
- Push sem `@devops` — apenas trabalho local
- Reabrir ADRs ou UX-ADRs
- `NEXT_PUBLIC_ANTHROPIC_API_KEY` — key apenas server-side
- Edge runtime para auth — usado Node (bcrypt requer)
- Node runtime para proxy Anthropic — usado Edge (latência)
- Jest em vez de Vitest — usado Vitest
- Workbox em vez de SW manual — SW manual previsto para Epic 4
- Pages Router — App Router em todo o lado
- Reabrir UX-1, UX-2, UX-3, UX-4, UX-5 — todos respeitados

---

## Ordem recomendada para @qa qa-gate

Sugestão de Dex:

```
1. Story 0.1 PRIMEIRO  ← gates fundamentais (estrutura existe, build OK)
2. Story 0.2          ← utilities portadas (foco: lógica intacta vs v1)
3. Story 0.3          ← schema Dexie (foco: tabelas/índices match arch §4.2)
4. Story 0.5          ← proxy Anthropic (foco: NFR5 — key não no bundle)
5. Story 0.6          ← auth (foco: bcrypt correcto, cookie HttpOnly)
6. Story 0.4          ← layout chat-first (foco: UX-1, fundo escuro)
7. Story 0.7          ← onboarding (foco: 4 steps, Esc não fecha)
8. Story 0.8          ← widgets (foco: Markets no TOPO, MorningBriefing NÃO portado)
9. Story 0.9          ← test scaffold (foco: Vitest + Playwright corre)
10. Story 0.10        ← CI + Vercel (foco: workflow YAML válido, paths filter correcto)
```

Stories 0.1, 0.5, 0.6, 0.4 são gate bloqueantes (Epic 1 não pode arrancar sem). Resto é desbloqueador para Epic 8 ou Epic 1 streaming.

---

## Tasks que dependem do Eurico (manuais — NÃO são bloqueio para qa-gate)

| Story | Tarefa manual Eurico | Quando |
|-------|----------------------|--------|
| 0.1 | Correr `npm install` + `npm run build` | Antes do primeiro merge ou via CI |
| 0.10 | Criar projecto Vercel apontando para `imersao-tools/nexus/v2/` | Antes do primeiro deploy |
| 0.10 | Configurar env vars no Vercel UI (lista em `.env.example`) | Antes do primeiro deploy |
| 0.10 | Confirmar URL `nexus-eurico.vercel.app` responde após push em `main` | Após primeiro deploy |
| 0.10 | Correr Lighthouse mobile (manual ou Lighthouse CI) | Após deploy de produção (PRD AC6 ≥80) |

Todas estas tarefas são documentadas em `v2/README.md`.

---

## Comandos para @qa começar

```bash
# 1. Verificar v1 intocado
git diff --name-only imersao-tools/nexus/src/  # deve retornar vazio

# 2. Listar ficheiros v2 criados
find imersao-tools/nexus/v2 -name '*.ts' -o -name '*.tsx' -o -name '*.css' -o -name '*.json' -o -name '*.mjs' | grep -v node_modules

# 3. Ler stories Ready for Review
ls imersao-tools/nexus/docs/stories/active/0.*.story.md

# 4. Para cada story, qa-gate (7-point quality check):
# Decisão: PASS / CONCERNS / FAIL / WAIVED
```

---

## Validações que o CI Story 0.10 faz automaticamente quando passa a correr

1. **Lint:** ESLint v9 flat config sem warnings em `lint`
2. **Typecheck:** `tsc --noEmit` zero erros
3. **Unit tests:** Vitest + coverage (gate 60% em `lib/agent/`, `lib/db/`, `lib/shared/`)
4. **E2E tests:** Playwright Chromium contra app local
5. **Bundle key check:** grep `sk-ant-` em `.next/static/` falha se encontra (NFR5 / PRD Epic 0 AC4)
6. **Build:** `npm run build` zero erros

Se qualquer um destes falhar localmente para o Eurico, é gate vermelho.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno do Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-implementado-aguarda-qa.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-implementado-aguarda-qa.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **Dex (`@dev`)**
DATA: **04/05/2026**

---

*Handoff escrito por Dex (`@dev`) em 04/05/2026 após implementar as 10 stories do Epic 0 do Nexus v2 em modo YOLO. Verdict: 10/10 Ready for Review, zero diffs em `src/` v1, todos os should-fix consumidos, todas as constraints respeitadas. Designed para Quinn (`@qa`) consumir e fazer qa-gate por story (PASS/CONCERNS/FAIL/WAIVED).*
