# RETOMA — Stories 6.6 + 6.5 FECHADAS, sub-módulo Calendar COMPLETO, Epic 6 6/17, próximo 6.7 (Gmail OAuth)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "orquestrador /sdc (sessão 18/06/2026) — aterrou a 6.6 (implementada+PASS mas não commitada) e correu o ciclo /sdc completo da 6.5 (SM→PO→Architect Entrada→DEV→Architect Saída→DEVOPS push+merge+close)"
to_agent: "any — próximo terminal: orquestrador `/sdc 6.7 --push` (OAuth Gmail scope, inicia sub-módulo Gmail) OU `/sdc 6.11 --push` (Telegram setup, paralelo independente)"
created: "2026-06-18T00:00:00Z"
status: consumed
consumed: true
consumed_at: "2026-06-18T23:10:00Z"
consumed_by: "orquestrador /sdc 6.7 --push (sessão 18/06/2026)"
project: nexus-v2
next_action: "/sdc 6.7 --push   (OAuth incremental Google scope gmail.modify, FR63 — reutiliza o fluxo OAuth da 6.1/6.2 com scope adicional; executor @dev, gate @architect). Sub-módulo Calendar (6.1-6.6) está COMPLETO; o sub-módulo Gmail começa na 6.7. Alternativa paralelizável: /sdc 6.11 --push (Telegram bot setup, sub-módulo independente — atenção GAP-6.4: decisão de SDK Telegram + 2 criticals npm audit). Sem --push o pipeline pára antes do merge."
```

## Passo 0 (arranque em terminal novo)

```
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git checkout main
git pull --ff-only origin main      # HEAD esperado: aad74c0d (close-story 6.5 docs-only)
```

`main` está sincronizado com `origin/main` após os merges da 6.6 (PR #79) e 6.5 (PR #80) e os respectivos commits de close docs-only. Código do Nexus vive em `imersao-tools/nexus/v2/`; stories em `imersao-tools/nexus/docs/stories/` (activas em `active/`, concluídas em `completed/`); epic em `imersao-tools/nexus/docs/EPIC-6.md`.

HEAD de `main` (4 commits desta sessão):
```
aad74c0d docs(nexus-v2): close-story 6.5 cron sync delta calendário — Done, Epic 6 6/17 [Story 6.5]
105392b5 feat(nexus-v2): cron diário sync delta calendário — orquestrador pull→push [Story 6.5] (#80)
b2baf3da docs(nexus-v2): close-story 6.6 tools cérebro calendário — Done, Epic 6 5/17 [Story 6.6]
eead5486 feat(nexus-v2): tools cérebro calendário — criar/actualizar/listar eventos [Story 6.6] (#79)
```

## O que esta sessão fez (resumo executivo)

O `/sdc` (sem args) detectou que a **6.6 estava implementada e PASS no QA mas NÃO aterrada** (working tree suja em `main`: `calendar.ts`/`index.ts`/testes por commitar; story marcada `Done` em `active/` sem merge nem close). O Eurico decidiu **aterrar a 6.6 primeiro com push** e depois correr o ciclo completo da 6.5. Resultado: ambas FECHADAS em `main`, waiver 0 nas duas.

### Story 6.6 — Tools cérebro calendário (FR61 + FR62) — FECHADA
- **PR #79**, squash `eead5486`; close docs-only `b2baf3da`. Em `stories/completed/6.6.story.md`.
- Entregou `v2/lib/agent/tools/calendar.ts` — 3 tools no Tool Registry, domínio `calendar`: `criar_evento_calendar` (cria evento local-pendente SEM `googleId`, `requiresPreview:true`), `actualizar_evento_calendar` (patch por id, `requiresPreview:true`), `listar_eventos` (lê só Dexie, `requiresPreview:false`). Barrel `index.ts` `all().length` 31→34. Testes `calendar.test.ts` (20→ depois 22 na suite final). Sem version bump Dexie (a 6.4 já tornou `googleId` opcional e esparso).
- É o **produtor de eventos locais** que dá vida à route push da 6.4 (antes idempotente-vazia): criar evento via tool → `calendarEvents` sem `googleId` → push da 6.4 faz `events.insert` no Google.
- Gates: Architect Entrada+Saída Aria PASS Confidence High; vitest 2016→2038 PASS; CodeRabbit `--base main` 0 findings.

### Story 6.5 — Cron diário sync delta calendário (FR59 + FR65) — FECHADA
- **PR #80**, squash `105392b5`; close docs-only `aad74c0d`. Em `stories/completed/6.5.story.md`.
- Entregou `v2/app/api/cron/sync/route.ts` — route Node que orquestra serial **pull (6.3) → push (6.4)** do calendário. `tests/unit/api/cron/sync.test.ts` (26 testes). `vercel.json` NÃO tocado.
- **Descoberta material do Architect Gate de Entrada (reconfiguração de desenho):** as routes `/api/google/calendar/sync` (POST) e `/api/google/calendar/push` (POST) validam **sessão por cookie** (`getSession` + middleware 307→/login). Um cron server-to-server NÃO tem cookie → **não pode chamá-las via HTTP interno** (forjar sessão = anti-padrão). Desenho correcto: o cron **importa os helpers de domínio directamente** (`syncCalendarEvents`/`pushCalendarEvent`/`getValidAccessToken`/cursor KV/`db.calendarEvents`) — zero `fetch` interno, zero superfície SSRF.
- Gates: Architect Entrada+Saída Aria PASS Confidence High; vitest 2038→2064 PASS; cobertura `route.ts` 94,77%; CodeRabbit `--base main` Iter 1 (1 Major real corrigido: `getServerEnv()` fora do try escapava ao 503 fail-closed) → Iter final 0 findings. 1 iteração CR (hard-stop §8 respeitado).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = NEXUS V2 (`imersao-tools/nexus/`). CAMINHO CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Estado do Epic 6 — sub-módulo Calendar COMPLETO

**6/17 Done:** 6.1 (OAuth flow), 6.2 (refresh token storage KV), 6.3 (sync pull), 6.4 (sync push), **6.5 (cron sync delta)**, **6.6 (tools cérebro)**. O **sub-módulo Google Calendar (§6.11, FR58-62) está funcionalmente FECHADO**: OAuth → token → pull → push → cron periódico → tools cérebro. O fluxo end-to-end FR61 fica operacional ("amanhã 15h reunião com Paulo" → tool cria evento local → cron/push empurra para o Google).

Restam 11 stories no Epic 6, em 2 sub-módulos:
- **Gmail (§6.12, FR63-68):** 6.7 OAuth scope gmail → 6.8 classifier 4 buckets → 6.9 vista dashboard → 6.10 tools cérebro Gmail.
- **Telegram (§6.13, FR69-76):** 6.11 setup/webhook → 6.12 ... (independente, paralelizável).
- A 6.5 já deixou o gancho de extensibilidade Gmail: `CronSyncResponse.gmail?: null` (a 6.8 preenche o trigger de classificação em background, FR65).

## Próxima Story RECOMENDADA — 6.7 OAuth flow Google (Gmail scope, FR63)

Fonte: `EPIC-6.md` §5 row 6.7 + §6 (FR63). Executor `@dev`, gate `@architect`, Status `Draft` (por criar pelo `@sm`).

**Scope:** OAuth incremental para adicionar o scope `gmail.modify` à autorização Google existente. **Reutiliza** o fluxo OAuth da 6.1 (`app/api/google/oauth/*`) e o token storage da 6.2 (`getValidAccessToken`, KV encriptado AES-256-GCM). NÃO recria fluxo OAuth do zero — adiciona scope. É a fundação do sub-módulo Gmail (destranca 6.8/6.9/6.10).

**Alternativa paralelizável:** `/sdc 6.11 --push` (Telegram bot setup, FR69/FR70) — sub-módulo totalmente independente do Gmail. Atenção ao **GAP-6.4** (`EPIC-6.md` §7 + §8): decisão de SDK Telegram + 2 criticals `npm audit` a resolver no Architect Gate de Entrada.

## Decisões `[D-6.5-*]` e `[D-6.6-*]` (NÃO reabrir)

- **[D-6.5-ORCHESTRATION]** = cron importa helpers de domínio (NÃO fetch HTTP às routes internas, que exigem cookie de sessão). Serial pull→push. Zero SSRF.
- **[D-6.5-CRON-CONFIG]** = trigger é **cron-job.org** (NÃO Vercel Cron nativo), schedule `0 6 * * *`, `vercel.json` SEM campo `crons`, plano Vercel mantém-se Hobby. Coerente com o scheduler da 4.8 (`app/api/push/dispatch/route.ts` + `lib/push/cron-auth.ts`).
- **[D-6.5-PARTIAL-FAILURE]** = route responde SEMPRE 200 (nunca 5xx, evita re-agendamento descontrolado); push corre independente do pull excepto curto-circuito por token revogado.
- **[D-6.5-RUNTIME]** = `nodejs` (helpers Google/KV/crypto Node-only).
- **[D-6.5-GMAIL-TRIGGER]** = calendário-only nesta story; `gmail?: null` extensível (6.8 preenche).
- **6.6:** tools criam eventos SEM `googleId` (classe local-pendente); `requiresPreview:true` para acções com efeito externo; nomes ASCII (`TOOL_NAME_PATTERN`).

---

## AÇÃO OPERACIONAL PENDENTE (Eurico) — NOVA, bloqueia produção do cron, NÃO bloqueia CI/dev

A route `/api/cron/sync` está em `main` e testada, mas o **trigger periódico ainda não está registado**. Pós-deploy:
- **OP1** — registar `https://imersao.ia.expressia.pt/api/cron/sync` no painel **cron-job.org** com schedule `0 6 * * *` (1×/dia) e header `Authorization: Bearer <CRON_SECRET>` — exactamente como já está feito para `/api/push/dispatch` (4.8).
- **OP2** — confirmar que `CRON_SECRET` está provisionado em Vercel env (já deve estar, da 4.8).
- Zero upgrade de plano Vercel (mantém-se Hobby).

## Pré-requisito humano (Eurico) — herdado da 6.1, AINDA PENDENTE (NÃO bloqueia dev/merge)

OAuth real + sync end-to-end contra a conta Google só se validam em produção depois do provisionamento. A lógica + unit tests correm com MSW sem credenciais Google. AC de produção ficam **deferidos** a verificação manual pós-deploy (padrão AC13 da 4.9). Pendentes:
- **P1** — Google Cloud Console: projecto + Calendar API (+ **Gmail API** para a 6.7) + OAuth client (Web) + scopes + redirect URI EXACTO `https://imersao.ia.expressia.pt/api/google/oauth/callback`.
- **P2** — Vercel env (server-only): `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `SESSION_SECRET`, `CRON_SECRET`.
- **P3** — email do Eurico como test user no consent screen.

## Regras git (invioláveis)

- `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- **NUNCA `git add -A`** — o repo tem 150+ untracked fora-scope + submódulos sujos (`imersao-tools/comunidade`, `starter-builder`). Add SELECTIVO da File List da story.
- Push é exclusivo do `@devops`. Auto-merge se as 6 condições `merge-authority` ficarem verdes no head SHA (`reviewDecision: CHANGES_REQUESTED` não bloqueia se stale — usar `--admin`). Hard-stop §8 = máx 2 iter CR (Iter 3+ exige trailer `Authorized-by:` do Eurico).
- Gate de saída CodeRabbit corre **`--base main`** (diff completo do branch), NÃO só `-t uncommitted` — senão findings server-side (SSRF/auth) escapam (lição 5.11).
- Commits de close docs-only vão directos a `main` por push do `@devops` (padrão 6.1-6.6).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus-v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260618-stories-6.5-6.6-FECHADAS-epic-6-6de17-proximo-6.7.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `orquestrador /sdc (sessão 18/06/2026)`
DATA: `18/06/2026`
