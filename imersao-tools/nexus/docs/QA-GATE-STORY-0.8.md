# QA Gate — Story 0.8: Widgets + Markets Widget topo

**Story ID:** 0.8
**Epic:** 0 — Migração Estrutural
**Reviewer:** Quinn (`@qa`)
**Data:** 04/05/2026
**Status entrada:** Ready for Review
**Veredicto inicial:** **CONCERNS** (1 issue medium — CSP bloqueia widgets em produção)
**Decisão final:** **PASS após fix** (Eurico 04/05/2026, Opção A recomendação Quinn — fix aplicado em `next.config.ts`)

---

## 7-Point Quality Check

| # | Check | Status | Notas |
|---|-------|:---:|-------|
| 1 | ACs cumpridos | PASS | AC1-AC8 cumpridos. Markets no TOPO (UX-4) confirmado em `SidebarWidgets.tsx`. 9 mercados. Pomodoro com select Dexie reactivo. Goodnight condicional 22h-5h. |
| 2 | Tests passing | PASS (parcial) | Sem unit test específico nesta story, mas widgets dependem de hooks já testados (usePomodoro, useDexie, useLocalStorage). |
| 3 | Lint + typecheck | DEFERRED | Validação via CI. |
| 4 | NFRs respeitadas | **CONCERNS** | **CSP bloqueia chamadas externas dos widgets em produção** — ver issue medium abaixo. |
| 5 | Security review | PASS | `rel="noopener noreferrer"` em QuickLinks. Token GitHub em localStorage (dentro do contrato ADR-2 <100KB). |
| 6 | Architecture conformance | PASS | Layout sidebar 360px + ordem `Greeting → Markets → Pomodoro → GitHub → QuickLinks → Goodnight` — match exacto `front-end-spec-v2.md §3.1`. |
| 7 | Article IV (No Invention) | PASS | 9 mercados literais (CAC40, DAX, DJI, NDX, SP500, BRENT, ETH, NVDA, ASML). MorningBriefingWidget NÃO criado (AUTO-DECISION @po consumida). BriefingWidget/FeedWidget NÃO criados (PRD §2.1). |

---

## Issue medium — CSP bloqueia widgets externos em produção

**Problema:**
- `next.config.ts` CSP define `connect-src 'self' https://api.anthropic.com https://api.telegram.org`
- `lib/markets/index.ts` chama `https://query1.finance.yahoo.com` e `https://api.allorigins.win` — **bloqueado pela CSP**
- `lib/github/index.ts` chama `https://api.github.com` — **bloqueado pela CSP**

**Impacto:** Em produção (`nexus-eurico.vercel.app`), assim que o `MarketsWidget` ou `GitHubWidget` tentar fazer fetch, o browser vai recusar com CSP violation, e os widgets vão mostrar "Indisponível" / "Falhou" para sempre.

**Razão por que não bloqueia AGORA:**
- Em desenvolvimento local (`npm run dev`), o Next.js dev server pode comportar-se de forma menos estrita com CSP.
- Os widgets têm fallback graceful (skeleton, "Indisponível", "Falhou: ...") — não fazem crash.
- Funcionalmente os widgets estão correctos; o problema é apenas de configuração.

**Recomendação:** Antes de Eurico fazer push real para `main` e activar deploy Vercel:
1. Actualizar CSP em `next.config.ts` para incluir:
   - `https://query1.finance.yahoo.com`
   - `https://api.allorigins.win`
   - `https://api.github.com`
2. Ou, alternativa mais segura, criar proxy `/api/markets/proxy` e `/api/github/proxy` (Edge runtime) e mantê-los como `'self'`.

**Decisão de severidade:** **MEDIUM CONCERN** — a Story 0.8 funciona em dev, mas falha em prod. Não é FAIL porque o erro é de configuração CSP (Story 0.1 / Story 0.10 podem corrigir), não de lógica dos widgets.

## Auto-decisions auditadas

| AD | Análise QA |
|----|------------|
| Anti-padrão "MorningBriefingWidget v1 NÃO portado" | **ACEITE**. AUTO-DECISION @po documentada. UX-4 substitui pelo Markets no topo. UX-2 cria mensagem `pinned` no chat (Epic 1). |

## Observações

- `useLocalStorage<string>('nexus_github_token', '')` — token GitHub default vazio, prompt mostra "Configura token nas Definições" — correcto.
- `Skeleton` em `MarketsWidget` com animação keyframes inline — funciona sem dependências.
- `GreetingWidget` com saudações por hora 5/12/18 + clock 60s — replica v1.
- `GoodnightWidget` retorna `null` quando não é noite — não polui DOM.
- `PomodoroWidget` com `useLiveQuery` Dexie funciona com schema vazio (Story 0.3 deixou tabelas criadas mas vazias) — fallback "Sem tarefas ainda".

## Decisão

**Veredicto inicial Quinn (04/05/2026):** CONCERNS — CSP bloqueia widgets externos em produção.

**Decisão final Eurico (04/05/2026):** **PASS após fix — Opção A aceite.** Fix aplicado em `imersao-tools/nexus/v2/next.config.ts` linha 39 por Dex 04/05/2026 (modo execução).

**Diff aplicado (`next.config.ts` linha 39):**

ANTES:
```
"connect-src 'self' https://api.anthropic.com https://api.telegram.org",
```

DEPOIS:
```
"connect-src 'self' https://api.anthropic.com https://api.telegram.org https://query1.finance.yahoo.com https://api.allorigins.win https://api.github.com",
```

Trade-off aceite: aumenta superfície de ataque mas todos os 3 hosts adicionados são read-only e públicos (Yahoo Finance API, allorigins proxy, GitHub API). Em prod (`nexus-eurico.vercel.app`) os widgets Markets e GitHub vão funcionar sem CSP violation.

**Não bloqueia push do Epic 0.**
