# RETOMA — Story 6.7 FECHADA (OAuth incremental Gmail scope), sub-módulo Gmail iniciado, Epic 6 7/17, próximo 6.8

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "orquestrador /sdc 6.7 --push (sessão 18/06/2026) — correu o ciclo /sdc completo da 6.7 (SM→PO→Architect Entrada→DEV→Architect Saída→DEVOPS push+CR+merge+close+push)"
to_agent: "any — próximo terminal: orquestrador `/sdc 6.8 --push` (classifier Gmail 4 buckets, 1.ª consumidora do scope gmail.modify) OU `/sdc 6.11 --push` (Telegram setup, paralelo independente)"
created: "2026-06-18T23:00:00Z"
status: consumed
consumed: true
consumed_at: "2026-06-19T00:00:00Z"
consumed_by: "orquestrador /sdc 6.8 (sessão 19/06/2026) — arrancou a 6.8 (SM→PO→Architect Entrada→DEV→Architect Saída, gates internos PASS; falta devops/--push). Continuação em RETOMA-20260619-story-6.8-GATES-PASS-aguarda-push.md"
project: nexus-v2
next_action: "/sdc 6.8 --push   (classifier Gmail: lê últimos ~50 emails, AI classifica em 4 buckets — Importante / Para responder hoje / Pode esperar / Descartável; cache por msgId nexus:cache:gmail:classify TTL 7d; FR64+FR65; executor @dev, gate @architect). Depende do scope gmail.modify autorizado pela 6.7 (Done). Alternativa paralelizável: /sdc 6.11 --push (Telegram bot setup, sub-módulo independente — atenção GAP-6.4: decisão SDK Telegram + 2 criticals npm audit no Architect Gate de Entrada). Sem --push o pipeline pára antes do merge."
```

## Passo 0 (arranque em terminal novo)

```
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git checkout main
git pull --ff-only origin main      # HEAD esperado: 581422c0 (close-story 6.7 docs-only)
```

`main` sincronizado com `origin/main` em `581422c0`. Código Nexus em `imersao-tools/nexus/v2/`; stories em `imersao-tools/nexus/docs/stories/` (`active/` vazio, concluídas em `completed/`); epic em `imersao-tools/nexus/docs/EPIC-6.md`.

HEAD de `main` (commits desta sessão):
```
581422c0 docs(nexus-v2): close-story 6.7 oauth incremental gmail scope — Done, Epic 6 7/17 [Story 6.7]
95772288 feat(nexus-v2): oauth incremental gmail scope — generateGmailAuthUrl + status multi-scope [Story 6.7] (#81)
```

## O que esta sessão fez (resumo executivo)

Ciclo `/sdc 6.7 --push` completo, **waiver 0**, Story 6.7 FECHADA em `main` e Epic 6 a 7/17. A 6.7 inicia o sub-módulo Gmail (§6.12) reutilizando o OAuth do sub-módulo Calendar.

### Story 6.7 — OAuth flow Google (Gmail scope incremental, FR63) — FECHADA
- **PR #81**, squash `95772288`; close docs-only `581422c0`. Em `stories/completed/6.7.story.md`.
- OAuth **incremental**: adiciona scope `gmail.modify` à autorização Google existente, **reutilizando** o fluxo da 6.1 (`app/api/google/oauth/*`) e o token storage da 6.2 (`getValidAccessToken`, KV AES-256-GCM). Não recriou OAuth do zero.
- **Ficheiros (14):** `lib/google/oauth.ts` (nova `generateGmailAuthUrl`, `exchangeCode` devolve `scope`, `GoogleTokens.scope?`), `lib/google/token-store.ts` (`scopes?` aditivo), `app/api/google/oauth/{start,callback,status}/route.ts`, `app/(app)/settings/page.tsx`, `components/settings/GmailSettings.tsx` (novo, 5 estados de render) + 7 testes.
- **Gates:** PO GO 9/10 → Architect Gate Entrada (Aria) PASS-COM-CONDIÇÕES (4 `[D-6.7-*]` + 5 condições C1-C5) → DEV (vitest 2092 PASS) → Architect Gate Saída (Aria) PASS High → CR CLI `--base main` Iter 1 (1 Major: gap teste preservação `scopes` no refresh) → fix → Iter 2 0 findings. CR App: 3 comentários inline resolvidos (`hasOwnProperty.call` no `ERROR_MESSAGES`, reconciliação doc AC2/AC7 com C3). 6 condições `merge-authority` verdes → auto-merge `--admin --squash`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = NEXUS V2 (`imersao-tools/nexus/`). CAMINHO CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Decisões `[D-6.7-*]` (NÃO reabrir)

- **[D-6.7-INCREMENTAL]=(B-mod):** função NOVA `generateGmailAuthUrl(state)` em `oauth.ts`; `generateAuthUrl` Calendar-only intocada (open-closed, 6.1 Done). Route `start` discrimina `?scope=gmail`; callback único.
- **[D-6.7-SCOPE-STORE]=(A):** sobrescreve o registo único `nexus:google:tokens` com o token combinado calendar+gmail. Google emite UM token; revogação é tudo-ou-nada. Sem `authorizedScopes` separado.
- **[D-6.7-STATUS]=(C-ajustada):** `exchangeCode` devolve `scope`; `saveTokens` persiste `scopes?` (aditivo, em claro); `/api/google/oauth/status` expande para `{connected, calendarConnected, gmailConnected}` mantendo `connected` legado.
- **[D-6.7-UI-COMPONENT]=(A):** `GmailSettings.tsx` novo autónomo (não unificar com Calendar).
- **Achado crítico de segurança (eixo b ciclo de vida):** `prompt:'consent'` no fluxo incremental GARANTE novo `refresh_token` no 2.º consent. Invariante = "registo resultante tem `refreshToken` não-vazio + `scope` combinado" — **sobrescreve, nunca preserva o refresh antigo**. NUNCA testar "refreshToken igual ao da 6.1". `exchangeCode` já rejeita resposta sem refresh.

## Débito técnico (endereçar na 6.8)

- **REC-6.7-REFRESH-SCOPES (Baixa):** adicionar teste falsificável em `v2/tests/unit/lib/google/refresh.test.ts` que prove que `getValidAccessToken` preserva `scopes` (incl. `gmail.modify`) num refresh — o código de produção está correcto (`token-store.ts:405-415`), falta só o teste dedicado (o `refresh.test.ts` herdado da 6.2 seed sem `scopes`).

## Próxima Story RECOMENDADA — 6.8 classifier Gmail (FR64+FR65)

Fonte: `EPIC-6.md` §5 row 6.8. Executor `@dev`, gate `@architect`, Status `Draft` (por criar pelo `@sm`).
- Lê últimos N (~50) emails via Gmail API; AI classifica em 4 buckets (Importante / Para responder hoje / Pode esperar / Descartável). Cache por `msgId` (`nexus:cache:gmail:classify`, TTL 7d, arch §6). Classificar só emails novos não classificados; usar Haiku para a triagem (R4 — custo de tokens).
- **`mock-must-reflect-real-protocol.md`:** o mock do classifier reflecte o protocolo real Gmail API (`tests/mocks/handlers/google.ts` estende para `messages.list`/`messages.get`).
- A 6.5 deixou o gancho: `CronSyncResponse.gmail?: null` — a 6.8 preenche o trigger de classificação em background (FR65).
- **Alternativa paralelizável:** `/sdc 6.11 --push` (Telegram setup, FR69/FR70) — sub-módulo independente. Atenção GAP-6.4 (`EPIC-6.md` §7+§8): decisão SDK Telegram + 2 criticals `npm audit` no Architect Gate de Entrada.

## Estado do Epic 6 — 7/17

**Done:** 6.1 (OAuth flow), 6.2 (refresh token KV), 6.3 (sync pull), 6.4 (sync push), 6.5 (cron sync delta), 6.6 (tools cérebro calendário), **6.7 (OAuth Gmail scope)**.
- Sub-módulo **Calendar (6.1-6.6) COMPLETO 6/6**.
- Sub-módulo **Gmail (§6.12, FR63-68): 1/4** — falta 6.8 (classifier) → 6.9 (vista dashboard) → 6.10 (tools cérebro Gmail).
- Sub-módulo **Telegram (§6.13, FR69-76): 0** — 6.11+ independente, paralelizável.
- Nota: o `EPIC-6.md` tinha desfasamento de contagem (dizia 4/17 + 6.5/6.6 marcadas `Draft` na tabela §5 apesar de merged); **corrigido nesta sessão para 7/17** no commit de fecho `581422c0`.

## AÇÕES OPERACIONAIS PENDENTES (Eurico) — NÃO bloqueiam CI/dev

- **OP1 (da 6.5, AINDA PENDENTE):** registar `https://imersao.ia.expressia.pt/api/cron/sync` no painel **cron-job.org** com schedule `0 6 * * *` + header `Authorization: Bearer <CRON_SECRET>` (tal como `/api/push/dispatch` da 4.8). Bloqueia a produção do cron, não o CI.
- **P1-Gmail (NOVO, da 6.7):** activar a **Gmail API** no Google Cloud Console (além da Calendar API já prevista na 6.1). Necessária para o OAuth Gmail real e para a 6.8 (classifier). AC5-Produção da 6.7 (OAuth Gmail <60s real) fica deferido a verificação manual pós-deploy (padrão AC13 4.9).
- **P2/P3 (herdados da 6.1):** Vercel env (`GOOGLE_OAUTH_CLIENT_ID/SECRET`, `SESSION_SECRET`, `CRON_SECRET`); email do Eurico como test user no consent screen (agora com scope `gmail.modify`).

## Regras git (invioláveis)

- `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- **NUNCA `git add -A`** — repo tem 150+ untracked fora-scope + submódulos sujos (`comunidade`, `starter-builder`). Add SELECTIVO da File List.
- Push exclusivo do `@devops`. Auto-merge se as 6 condições `merge-authority` verdes no head SHA (`reviewDecision: CHANGES_REQUESTED` stale não bloqueia — usar `--admin`). Hard-stop §8 = máx 2 iter CR.
- Gate de saída CodeRabbit corre **`--base main`** (diff completo), não só `-t uncommitted` — território OAuth server-side é onde findings SSRF/segurança escapam (lição 5.11).
- **R100:** após `git mv` + edição da story no close, fazer `git add` EXPLÍCITO do destino — senão o blob arquivado vai como `Status` antigo.
- Commits de close docs-only vão directos a `main` por push do `@devops` (padrão 6.1-6.7).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus-v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260618-story-6.7-FECHADA-epic-6-7de17-proximo-6.8.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `orquestrador /sdc 6.7 --push (sessão 18/06/2026)`
DATA: `18/06/2026`
