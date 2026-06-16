# RETOMA — Story 6.1 (OAuth Google Calendar) IMPLEMENTADA, todos os gates PASS, aguarda `/sdc 6.1 --push`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "orquestrador /sdc 6.1 — sessão que implementou a Story 6.1 e fechou os Gates 3 e 4"
to_agent: "any — próximo terminal: @devops via `/sdc 6.1 --push` (criar branch+commit, CR --base main, PR, auto-merge)"
created: "2026-06-16T00:00:00Z"
status: pending
consumed: false
project: nexus-v2
next_action: "/sdc 6.1 --push  (fase devops: branch+commit, CodeRabbit --base main OBRIGATÓRIO, PR, auto-merge se 6 condições merge-authority verdes; depois Eurico provisiona credenciais Google P1/P2/P3 e verifica AC1/AC5 em produção)"
```

## ⚠️ AVISO CRÍTICO — TRABALHO UNCOMMITTED NO WORKING TREE

A implementação completa da Story 6.1 (11 ficheiros de produção + 7 de teste + edições da story) **está apenas no working tree, NÃO committed e NÃO pushed** (o ciclo `/sdc` correu sem `--push`).

- **Migração na MESMA máquina** (mesmo repo em disco): o working tree é partilhado — os ficheiros estão lá. O próximo terminal continua directamente. **NÃO** correr `git stash`, `git checkout .`, `git reset --hard`, nem `git clean` — apagaria o trabalho. `git checkout main` (já estás em main) e `git pull --ff-only` são seguros (não removem untracked nem modified sem conflito).
- **Migração para máquina DIFERENTE:** o trabalho perde-se se não for committed primeiro. Nesse caso, correr `/sdc 6.1 --push` ANTES de fechar este terminal (o `@devops` cria branch + commit + push), e só depois migrar.

## Summary

Nesta sessão, sobre o handoff anterior (`/sdc 6.1 --from dev`), correu-se o ciclo `/sdc 6.1` (sem `--push`) da Story 6.1 (OAuth flow Google, Calendar scope, Epic 6). **Fases 3 (DEV) e 4 (Architect Gate de Saída) fechadas com PASS.** A story está `Ready for Review`, implementação verde (**vitest 1938/1938**), a aguardar só a fase devops (push/PR/merge) e o pré-requisito humano das credenciais Google para os AC de produção.

`main` em **`d3015cdf`** (inalterado — a 6.1 não foi committed). Commits desta sessão anterior já em main: `dd3caeb9` (retro Epic 5), `249bb7d3` (regra A1), `cd5290ce` (Epic 6), `d3015cdf` (handoffs).

## Estado da Story 6.1

Ficheiro: `imersao-tools/nexus/docs/stories/active/6.1.story.md` — **Status `Ready for Review`**, Change Log v1.4.

| Fase /sdc | Agente | Veredicto |
|-----------|--------|-----------|
| 1 — SM draft | `@sm` | PASS — 8 AC, 7 tasks |
| 2 — PO validar | `@po` | GO 9/10 |
| Architect Gate Entrada | `@architect` | PASS-COM-CONDIÇÕES — 5 `[D-6.1-*]` ratificadas |
| 3 — DEV | `@dev` | **Gate 3 PASS** — T1-T7, 1938/1938, typecheck/lint limpos |
| 4 — Architect Gate Saída | `@architect` | CHANGES-REQUESTED (F2) → fix `@dev` → **re-review PASS** |
| 5 — DEVOPS (push/PR) | `@devops` | **PENDENTE** (exige `--push`) |

### Decisão-chave do Gate de Saída: AC6 reconciliado 403 → 302

O F2 do CodeRabbit: o callback devolvia **403** em state inválido, mas o header `Location` de um 403 não é seguido pelos browsers (RFC 9110) → utilizador legítimo com state expirado via página em branco, sem alcançar a UI de erro (AC4 inalcançável). **Aria reconciliou AC6 → 302** (`redirectWithError(req,'invalid_state')`). A defesa CSRF NÃO foi enfraquecida — vem do short-circuit `verifyAndConsumeState`→não-trocar-code (ortogonal ao status HTTP); o assert anti-tautológico `saveMock not.toHaveBeenCalled` foi preservado nos 2 testes. Change Log v1.3/v1.4.

### Decisões `[D-6.1-*]` (5/5 PASS, NÃO reabrir)

- **PKCE** = state HMAC-SHA256 (`SESSION_SECRET` via `getServerEnv`) + KV TTL 600s single-use (`kv.del` antes da troca), nonce `randomUUID`, `timingSafeEqual`. Sem PKCE.
- **CALLBACK** = route literal `app/api/google/oauth/callback/route.ts` (Node). Redirect URI = contrato externo.
- **ERROR** = tipo fechado `OAuthErrorType` → redirect 302 `?error=<tipo>`; UI PT-PT; zero token/code em URL/logs.
- **TESTMODE** = documentado em `v2/docs/setup-oauth.md`.
- **SCOPE** = KV sem encriptação na 6.1; seam `lib/google/token-store.ts` (a 6.2 reimplementa por dentro = GAP-6.2).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = NEXUS V2 (`imersao-tools/nexus/`). CAMINHO CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## File List (working tree, por committar)

**Produção NOVOS (9):** `v2/lib/google/oauth.ts`, `v2/lib/google/oauth-state.ts`, `v2/lib/google/token-store.ts`, `v2/app/api/google/oauth/start/route.ts`, `v2/app/api/google/oauth/callback/route.ts`, `v2/app/api/google/oauth/status/route.ts`, `v2/components/settings/GoogleCalendarSettings.tsx`, `v2/app/(app)/settings/page.tsx`, `v2/docs/setup-oauth.md`
**Produção EDITADOS (2):** `v2/tests/mocks/handlers/google.ts` (stub→handler), `v2/vitest.config.ts` (coverage allowlist)
**Testes NOVOS (7):** `v2/tests/unit/lib/google/{oauth,oauth-state,token-store}.test.ts`, `v2/tests/unit/components/settings/GoogleCalendarSettings.test.tsx`, `v2/tests/unit/api/google/{oauth-callback,oauth-start,oauth-status}.test.ts`
**INTOCADO (confirmado por git status):** `v2/lib/shared/env.ts` (vars OAuth já existiam).
**Story:** `imersao-tools/nexus/docs/stories/active/6.1.story.md` (modified).

## Próximo passo (retoma)

```
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git status            # confirmar que os ficheiros da 6.1 estão lá (untracked/modified)
git pull --ff-only origin main   # seguro; não remove o trabalho uncommitted
/sdc 6.1 --push
```

O `--push` entrega ao `@devops` (Gage):
1. Cria branch (ex.: `feat/nexus-v2-6.1-oauth-google-calendar`) + commit (add SELECTIVO dos ficheiros acima — **NUNCA `git add -A`**).
2. **CodeRabbit `--base main` OBRIGATÓRIO** antes do PR — não-negociável (regra A1 formalizada esta sessão em `coderabbit-integration.md`). Perfil de RISCO idêntico ao SSRF da 5.11 (PR #72): endpoint server-side com `fetch` externo + tokens sensíveis; o `-t uncommitted` é cego a isso. O `@dev` já correu CR `-t uncommitted` no working tree (2 Major, ambos resolvidos), mas o `--base main` é o gate de merge real.
3. PR → auto-merge se as 6 condições `merge-authority` ficarem verdes (CR APPROVED + CI verde + etc.). Hard-stop §8 = máx 2 iter CR. `gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
4. `@po *close-story 6.1` → Done, `git mv` active→completed, `EPIC-6.md` 0/17→1/17.

### Pré-requisito humano (Eurico) — deferido, NÃO bloqueia o merge do código

**AC1** (OAuth real <60s) e **AC5 produção** (estado `ligado` real) ficam deferidos e verificados manualmente pós-deploy (padrão AC13 da 4.9). Eurico tem de provisionar:
- **P1** — Google Cloud Console: OAuth client (Web), scope Calendar, redirect URI EXACTO `https://imersao.ia.expressia.pt/api/google/oauth/callback`.
- **P2** — Vercel env: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `SESSION_SECRET` (confirmar em produção).
- **P3** — adicionar email do Eurico como test user no consent screen.

## Notas não-bloqueantes

- Nit: JSDoc do topo de `v2/tests/unit/api/google/oauth-callback.test.ts:24` ainda diz "403" (o corpo dos testes e o `describe` já estão em 302) — alinhar de passagem.
- Débitos para a Story 6.2: REC-6.1-PKCE, REC-6.1-ENCRYPT (encriptação at-rest do token em KV = GAP-6.2), REC-6.1-ARCH.
- Nota técnica de produção (já no código, não reabrir): `createOAuth2Client` fixa `transporter.defaults.fetchImplementation = globalThis.fetch` para o MSW interceptar determinísticamente (zero impacto em prod, Vercel Node 18+).

## Git

- `main` em `d3015cdf`. A Story 6.1 NÃO está committed (working tree). Commits da sessão anterior já em main: `dd3caeb9`, `249bb7d3`, `cd5290ce`, `d3015cdf`.
- NUNCA `git add -A` (submódulos sujos + 150+ untracked fora-scope). `gh` SEMPRE `--repo DaSilvaAlves/...`.
- Fonte de verdade viva do roadmap: `imersao-tools/nexus/docs/AUDITORIA-20260612-ROADMAP-CONCLUSAO.md`. Epic doc: `imersao-tools/nexus/docs/EPIC-6.md` (17 stories; 6.1 é a fundação Google).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus-v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260616-story-6.1-IMPLEMENTADA-gates-PASS-aguarda-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `orquestrador /sdc 6.1 (Claude Code)`
DATA: `16/06/2026`
