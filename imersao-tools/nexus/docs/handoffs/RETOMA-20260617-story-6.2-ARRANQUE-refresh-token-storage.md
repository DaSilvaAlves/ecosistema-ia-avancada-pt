# RETOMA — Story 6.2 (Refresh token storage Vercel KV) ARRANQUE; Story 6.1 FECHADA, Epic 6 1/17

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "@devops Gage — sessão que fechou a Story 6.1 (/sdc 6.1 --push: branch, CR --base main, PR #75, merge, close-story)"
to_agent: "any — próximo terminal: orquestrador `/sdc 6.2` (SM→PO→Architect Gate Entrada→DEV→Architect Gate Saída→DEVOPS)"
created: "2026-06-17T00:00:00Z"
status: pending
consumed: false
project: nexus-v2
next_action: "/sdc 6.2  (refresh token storage Vercel KV, FR60, GAP-6.2; gate @architect; Architect Gate de Entrada obrigatório por ser story de segurança de tokens). Acrescentar --push quando se quiser fechar até ao merge."
```

## Estado — sem trabalho uncommitted (migração segura para qualquer máquina)

Ao contrário do handoff anterior (6.1), **NÃO há trabalho uncommitted**. Tudo está committed e pushed em `origin/main`. `git status` deve estar limpo de tracked relevantes (só submódulos sujos + untracked fora-scope pré-existentes). Migração para máquina diferente é segura — basta `git checkout main && git pull --ff-only origin main`.

`main` em **`e932e54a`**. Commits desta sessão (todos em `origin/main`):
- `edaee8ee` — docs: handoff 6.1 IMPLEMENTADA + índices
- `e7e4994d` — feat: OAuth Google Calendar (Story 6.1, squash do PR #75)
- `a76b21d8` — docs: close-story 6.1 (renames active→completed, pending→archive)
- `e932e54a` — docs: edições de conteúdo do close 6.1 (Status Done + handoff consumed)

## Story 6.1 — FECHADA (resumo)

OAuth flow Google (Calendar scope, FR58), fundação do Epic 6. `Done`, em `stories/completed/6.1.story.md`. Cadeia de gates toda PASS: SM draft → PO GO 9/10 → Architect Gate Entrada PASS-COM-CONDIÇÕES (5 `[D-6.1-*]`) → DEV (vitest 1938/1938) → Architect Gate Saída PASS (re-gate F2: AC6 403→302) → **CodeRabbit `--base main` No findings** → merge squash `e7e4994d`. Waiver 0. Entregue: `lib/google/{oauth,oauth-state,token-store}.ts`, `app/api/google/oauth/{start,callback,status}/route.ts`, `components/settings/GoogleCalendarSettings.tsx` + `app/(app)/settings/page.tsx`, `v2/docs/setup-oauth.md`.

### Decisões `[D-6.1-*]` (NÃO reabrir na 6.2)
- **PKCE** = state HMAC-SHA256 (`SESSION_SECRET`) + KV TTL 600s single-use, `timingSafeEqual`. Sem PKCE.
- **CALLBACK** = route literal `app/api/google/oauth/callback/route.ts` (Node). Redirect URI = contrato externo.
- **ERROR** = `OAuthErrorType` → redirect 302 `?error=`; UI PT-PT; zero token/code em URL/logs.
- **TESTMODE** = `v2/docs/setup-oauth.md`.
- **SCOPE** = na 6.1 o token vai para KV **sem encriptação**; o seam é `lib/google/token-store.ts`. **A 6.2 reimplementa por dentro deste seam = GAP-6.2.**

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = NEXUS V2 (`imersao-tools/nexus/`). CAMINHO CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Próxima Story — 6.2 Refresh token storage Vercel KV (FR60)

Fonte: `imersao-tools/nexus/docs/EPIC-6.md` (linha 88 da tabela + §7 GAP-6.2 + §8). Executor `@dev`, gate `@architect`, Status `Draft`.

**Scope (arch §6 KV `nexus:google:tokens → { accessToken, refreshToken, expiresAt }`):**
- **(a) Encriptação at-rest** do refresh token em KV — o Vercel KV **não encripta por defeito**; é uma decisão de segurança que o `@architect` ratifica no Gate de Entrada (esta é a `REC-6.1-ENCRYPT` deixada pela 6.1).
- **(b) Refresh flow** — renovar o `accessToken` antes de expirar **sem perder o `refreshToken`** (Google só devolve refresh token na 1.ª autorização).
- **(c) Revogação** — utilizador desliga OAuth nas definições → revogar o token no Google + limpar o KV.

**Gates e regras obrigatórias para a 6.2:**
- **Architect Gate de Entrada OBRIGATÓRIO** (story de segurança de tokens — PRD §10 quality gate Epic 6 = "Epic 1 + revisão segurança tokens OAuth"). `@architect` ratifica (a)/(b)/(c) ANTES da implementação.
- **`internal-state-contract-gate.md`** aplica-se ao **token lifecycle** (estado distribuído: válido → expirado → renovado → revogado). A regra **já existe** em `.claude/rules/` (confirmado — era a acção P2.4 do roadmap). O gate `@architect` faz a análise dos 3 eixos: classes de estado (válido/expirado/revogado), transição-já-ocorrida (refresh concorrente / token já revogado pelo Google), caminhos de falha (Google indisponível a meio do refresh; refresh token inválido → forçar re-auth).
- **CodeRabbit `--base main` OBRIGATÓRIO** no gate de saída e no `@devops` (lição 5.11 / regra A1 — território server-side com tokens sensíveis; `-t uncommitted` é cego a findings de classe SSRF/segurança).
- **`mock-protocol-fidelity.md`** — o mock do endpoint de refresh Google (`tests/mocks/handlers/google.ts`, já existe e foi expandido na 6.1) reflecte o protocolo real do refresh flow.
- **A2 Epic 4 (varredura bug-de-classe):** se o CR/gate apanhar um CRITICAL/Major de classe (ex: token não-revogado num caminho), `@dev` verifica a mesma classe nas camadas adjacentes (OAuth Calendar ↔ futura OAuth Gmail) no mesmo ciclo.

## Pré-requisito humano (Eurico) — herdado da 6.1, AINDA PENDENTE

A 6.1 está completa em CI mas os AC de produção (AC1 OAuth real <60s, AC5 estado `ligado` real) ficaram **deferidos** (padrão AC13 da 4.9). A 6.2 (refresh flow real) também só se valida em produção depois disto. Eurico tem de provisionar quando quiser verificar OAuth end-to-end:
- **P1** — Google Cloud Console: projecto + Calendar API + OAuth client (Web) + scope Calendar + redirect URI EXACTO `https://imersao.ia.expressia.pt/api/google/oauth/callback`.
- **P2** — Vercel env (server-only): `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `SESSION_SECRET`.
- **P3** — email do Eurico como test user no consent screen.

Isto **não bloqueia** o desenvolvimento nem o merge do código da 6.2 (lógica + unit tests com MSW correm sem credenciais Google).

## Regras git (invioláveis)

- `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- **NUNCA `git add -A`** — o repo tem 150+ untracked fora-scope + submódulos sujos (`imersao-tools/comunidade`, `starter-builder`). Add SELECTIVO da File List da story.
- Push é exclusivo do `@devops`. Auto-merge se as 6 condições `merge-authority` ficarem verdes no head SHA. Hard-stop §8 = máx 2 iter CR (Iter 3+ exige `Authorized-by:` do Eurico).
- **Lição desta sessão (close 6.1):** um `git mv` seguido de edição pode ser registado como rename **R100** (conteúdo idêntico) e deixar as edições de conteúdo por staged. **Após `git mv` + edição, confirmar sempre `git diff`/`git status` antes de declarar o close** — foi preciso o commit extra `e932e54a` para aplicar Status→Done e YAML→consumed que o commit de close `a76b21d8` não capturou.

## Débitos abertos (da 6.1, endereçar na 6.2 onde aplicável)

- **REC-6.1-ENCRYPT** — encriptação at-rest dos tokens em KV = exactamente o GAP-6.2 (núcleo desta story).
- **REC-6.1-PKCE** — reavaliar PKCE S256 (decisão `@architect`, não obrigatório).
- **REC-6.1-ARCH** — corrigir `architecture-v2.md` §3:102 (`[provider]` → `callback`+`start`).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus-v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260617-story-6.2-ARRANQUE-refresh-token-storage.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@devops Gage (Claude Code)`
DATA: `17/06/2026`
