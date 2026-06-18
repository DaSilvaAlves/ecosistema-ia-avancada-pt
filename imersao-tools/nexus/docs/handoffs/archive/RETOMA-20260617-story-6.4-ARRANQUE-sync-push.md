# RETOMA — Story 6.4 (Sync calendário push, Nexus → Google) ARRANQUE; Story 6.3 FECHADA, Epic 6 3/17

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "orquestrador /sdc 6.3 --push (SM→PO→Architect ratificação GAPs→DEV→QA→DEVOPS CR Iter1→merge→close)"
to_agent: "any — próximo terminal: orquestrador `/sdc 6.4 --push` (SM→PO→Architect Gate Entrada→DEV→Architect Gate Saída→DEVOPS→PO close)"
created: "2026-06-17T00:00:00Z"
status: consumed
consumed: true
consumed_at: "2026-06-18T00:00:00Z"
consumed_by: "Pax (@po) — close-story 6.4"
project: nexus-v2
next_action: "/sdc 6.4 --push   (sync calendário push Nexus → Google, completa o 2-way FR59; gate @architect; Architect Gate de Entrada OBRIGATÓRIO por estado distribuído criado/sincronizado/conflito — internal-state-contract-gate.md). Sem --push o pipeline pára antes do merge."
```

## Passo 0 (arranque em terminal novo)

```
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git checkout main
git pull --ff-only origin main      # HEAD esperado: 24ef6c9a
```

`main` está **sincronizado com `origin/main`**, sem trabalho uncommitted relevante. Migração para outra máquina é segura. Código do Nexus vive em `imersao-tools/nexus/v2/`; stories em `imersao-tools/nexus/docs/stories/` (activas em `active/`, concluídas em `completed/`); epic em `imersao-tools/nexus/docs/EPIC-6.md`.

## Story 6.3 — FECHADA (resumo, base directa da 6.4)

Sync calendário **pull** (Google → Nexus, FR59). `Done`, em `stories/completed/6.3.story.md`. Mergeada via PR #77, squash **`e149fc76`**; close docs-only `24ef6c9a`. Cadeia toda PASS: SM draft (10 AC) → PO GO 9/10 → `@architect` ratificou 3 GAPs (High) → DEV (vitest 1990/1990) → QA Gate Quinn PASS (3 eixos `internal-state-contract-gate.md` no código real) → CR `--base main` **0 findings na Iter 1** (após 1 Major corrigido) → merge → close. Waiver 0. Epic 6 **3/17**.

### O que a 6.3 entregou (a 6.4 REUTILIZA, não duplica)

- **`lib/google/calendar.ts`** — helper puro de reconciliação pull (96,62% cobertura). Mapeia Google Event → modelo Nexus; idempotência por `&googleId`; full resync + sync incremental por `syncToken`; 410 Gone → full resync automático; `mapEvent` devolve `null` para evento sem datas válidas → `reconcilePage` faz skip gracioso (contador `skipped` no `SyncResult`).
- **`lib/google/calendar-sync-token.ts`** — store KV do cursor na chave dedicada **`nexus:google:calendar:syncToken`** (get/set/delete). A 6.4 (push) NÃO deve corromper este cursor de pull.
- **`app/api/google/calendar/sync/route.ts`** — route Node fina (`runtime='nodejs'`); auth via `getValidAccessToken()`; 5xx Google → **503** (nunca `200{ok:false}`); persiste o cursor **atómico só no fim**.
- **Dexie `calendarEvents` (version 6)** — interface `CalendarEvent { id, googleId(&unique), title, startAt, endAt, allDay, updatedAt }`, campos temporais em **epoch ms** (`.positive()` no Zod `CalendarEventSchema`, alinhado com a convenção do codebase). A 6.4 escreve nesta mesma tabela ao criar eventos no Google e ao reconciliar o `googleId` devolvido.
- **MSW `tests/mocks/handlers/google.ts`** — handlers Calendar API v3 (camelCase, `status:'cancelled'`, `410 Gone`) com teste de fidelidade falsificável. A 6.4 acrescenta os handlers de `events.insert`/`events.update`.

### Decisões `[D-6.3-*]` (NÃO reabrir; a 6.4 herda-as)

- **[D-6.3-SCHEMA]** = tabela `calendarEvents` version(6), epoch ms, `&googleId` único para idempotência.
- **[D-6.3-SYNC-TOKEN]** = cursor em chave KV dedicada; a route persiste, não o helper; 410 apaga só esta chave.
- **[D-6.3-CANCELLED]** = `cancelled` no pull → delete por googleId; inexistente = no-op gracioso.
- **[D-6.3-POSITIVE-EPOCH]** (fix CR Iter 1) = `CalendarEventSchema` usa `.positive()`; eventos sem datas válidas são filtrados (skip), nunca persistidos com epoch 0.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = NEXUS V2 (`imersao-tools/nexus/`). CAMINHO CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Próxima Story — 6.4 Sync calendário push (Nexus → Google, FR59)

Fonte: `imersao-tools/nexus/docs/EPIC-6.md` (tabela §5 row 6.4 + §7 GAP-6.4 + §8 + Risco R6). Executor `@dev`, gate `@architect`, Status `Draft` (ainda por criar pelo `@sm`).

**Scope:** eventos criados/actualizados no Nexus → escritos no Google Calendar via `events.insert`/`events.update`. Completa o 2-way iniciado pela 6.3 (pull). Acceptance crítico do epic: **AC2 — evento criado no Nexus aparece no Google Calendar em < 30s**.

**Esta é a maior superfície de ESTADO DISTRIBUÍDO desde a 4.9 — Architect Gate de Entrada OBRIGATÓRIO.** O `@architect` (Aria) resolve, ANTES do `@dev` implementar, o estado de cada evento Nexus: **criado** (local, ainda sem `googleId`) → **sincronizado** (push fez `insert`, `googleId` reconciliado) → **conflito** (o mesmo evento foi alterado nos dois lados entre syncs). Aplicar `internal-state-contract-gate.md` — análise dos 3 eixos:
- **(a) Classes de estado:** evento local novo sem `googleId` / evento já sincronizado (tem `googleId`) / evento alterado localmente após sync / evento alterado no Google após sync (detectável via `updatedAt`/etag).
- **(b) Transição-já-ocorrida:** push de um evento cujo `googleId` já existe no Google (re-`insert` criaria **duplicado** — Risco R6); evento apagado no Google entre o read e o `update` (Google devolve 404/410); push concorrente do mesmo evento.
- **(c) Caminhos de falha:** Google indisponível a meio do push (5xx → 503, não persistir estado "sincronizado" parcial); token revogado a meio (401); rate limit Google (429).

**Risco R6 (loop/duplicados de sync 2-way) — mitigação central da 6.4:** idempotência por **ID de evento** (`googleId`); usar `syncToken`/`etag` do Google; o evento que volta no pull (6.3) **não** pode re-disparar um push (e vice-versa). O `@architect` define a fronteira anti-loop no Gate de Entrada.

**Gates e regras obrigatórias para a 6.4:**
- **Architect Gate de Entrada OBRIGATÓRIO** (estado distribuído + Risco R6). É o padrão da 6.2 — `@architect` ratifica o contrato de estado e a estratégia anti-loop antes da implementação.
- **`internal-state-contract-gate.md`** — análise dos 3 eixos registada no Architect Gate de Entrada **e** re-verificada contra o código real no Gate de Saída (padrão 6.2/6.3).
- **CodeRabbit `--base main` OBRIGATÓRIO** no gate de saída e no `@devops` (lição 5.11 — território Node server-side com fetch externo a escrever no Google; `-t uncommitted` é cego a findings de classe SSRF/segurança). Nota operacional da 6.3: o `--base main` puro deu `payload_too_large` por causa do working tree com untracked fora-scope; usar **`review --agent -t committed --base main`** na branch (avalia só os commits vs main).
- **`mock-protocol-fidelity.md`** — handlers MSW de `events.insert`/`events.update` reflectem o protocolo real (shape do request body Google, resposta com `id`/`etag`/`updated`). ≥1 teste falsificável.
- **A2 Epic 4 (varredura bug-de-classe):** se o CR/gate apanhar um CRITICAL/Major de classe (ex: duplicado por re-insert), `@dev` verifica a mesma classe nos caminhos adjacentes (insert ↔ update; pull ↔ push) no mesmo ciclo, para não gastar Iter 2.
- **`dexie_version_bump_full_suite.md`:** se a 6.4 precisar de campos novos em `calendarEvents` (ex: `syncStatus`, `etag`, `lastPushedAt`), o version bump (→ version 7) obriga a actualizar os testes de schema-upgrade e validar com a suite COMPLETA. Confirmar no Gate de Entrada se há bump.

## Pré-requisito humano (Eurico) — herdado, AINDA PENDENTE (NÃO bloqueia dev/merge)

OAuth real + sync end-to-end contra a conta Google só se validam em produção depois do provisionamento. A lógica + unit tests da 6.4 correm com MSW sem credenciais Google. AC de produção (AC2 < 30s real) ficam **deferidos** a verificação manual pós-deploy (padrão AC13 da 4.9). Pendentes:
- **P1** — Google Cloud Console: projecto + Calendar API + OAuth client (Web) + scope Calendar + redirect URI EXACTO `https://imersao.ia.expressia.pt/api/google/oauth/callback`.
- **P2** — Vercel env (server-only): `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `SESSION_SECRET`.
- **P3** — email do Eurico como test user no consent screen.

## Regras git (invioláveis)

- `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- **NUNCA `git add -A`** — o repo tem 150+ untracked fora-scope + submódulos sujos (`imersao-tools/comunidade`, `starter-builder`). Add SELECTIVO da File List da story.
- Push é exclusivo do `@devops`. Auto-merge se as 6 condições `merge-authority` ficarem verdes no head SHA (`reviewDecision: CHANGES_REQUESTED` não bloqueia se stale — usar `--admin`). Hard-stop §8 = máx 2 iter CR (Iter 3+ exige trailer `Authorized-by:` do Eurico).
- Commits de close docs-only vão directos a `main` por push do `@devops` (padrão 6.1/6.2/6.3).
- Após `git mv` + edição da story no close, confirmar sempre `git diff`/`git status` antes de declarar (lição close 6.1 — rename R100 deixou edições por staged).

## Alternativas paralelizáveis (se não se quiser a 6.4 já)

A 6.4 é o caminho recomendado (fecha o 2-way). Mas o Epic 6 tem sub-módulos independentes:
- **6.5** (cron Vercel diário para sync delta) — executor `@devops`, gate `@architect`; depende de 6.3/6.4 e serve também o trigger Gmail.
- **6.6** (tools cérebro calendário: `criar_evento_calendar`/`actualizar_evento_calendar`/`listar_eventos`) — lê os eventos sincronizados pela 6.3; nomes já validados ASCII (EPIC-6 nota §5).
- **6.11** (Telegram bot setup) — sub-módulo totalmente independente do Google; pode arrancar em paralelo. Gate `@architect` (webhook + decisão SDK + 2 criticals `npm audit`).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus-v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260617-story-6.4-ARRANQUE-sync-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `orquestrador /sdc (Claude Code)`
DATA: `17/06/2026`
