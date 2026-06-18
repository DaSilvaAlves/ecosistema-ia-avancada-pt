# RETOMA — Story 6.6 (Tools cérebro calendário) ARRANQUE; Story 6.4 FECHADA, Epic 6 4/17

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "Pax (@po) — close-story 6.4 (Review→Done, move active→completed, EPIC-6 3/17→4/17, consome handoff 6.4)"
to_agent: "any — próximo terminal: orquestrador `/sdc 6.6` (SM draft→Architect Gate Entrada→PO validate→DEV→Architect Gate Saída→DEVOPS→PO close); alternativas paralelas 6.5 ou 6.11"
created: "2026-06-18T00:00:00Z"
status: pending
consumed: false
project: nexus-v2
next_action: "/sdc 6.6   (tools cérebro calendário: criar_evento_calendar/actualizar_evento_calendar/listar_eventos no Tool Registry, domínio calendar; FR61+FR62; é o PRODUTOR de eventos locais que dá vida à route push da 6.4, hoje idempotente-vazia). Gate @architect. Sem --push o pipeline pára antes do merge. Alternativas paralelizáveis: /sdc 6.5 (cron sync delta, executor @devops) ou /sdc 6.11 (Telegram setup, sub-módulo independente)."
```

## Passo 0 (arranque em terminal novo)

```
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git checkout main
git pull --ff-only origin main      # HEAD esperado: commit de close docs-only da 6.4 (após push @devops)
```

`main` está sincronizado com `origin/main` após o merge da 6.4 (PR #78, squash `22c984d7`) e o respectivo commit de close docs-only (push exclusivo do `@devops`). Código do Nexus vive em `imersao-tools/nexus/v2/`; stories em `imersao-tools/nexus/docs/stories/` (activas em `active/`, concluídas em `completed/`); epic em `imersao-tools/nexus/docs/EPIC-6.md`.

## Story 6.4 — FECHADA (resumo, base da 6.6)

Sync calendário **push** (Nexus → Google, FR59 — completa o 2-way). `Done`, em `stories/completed/6.4.story.md`. Mergeada via **PR #78**, squash **`22c984d7`**; close docs-only por push do `@devops`. Cadeia toda PASS: SM draft (10 AC) → Architect Gate de Entrada Aria PASS-COM-CONDIÇÕES (4 decisões D-6.4-* + 5 condições C1-C5) → PO GO → DEV (vitest 2016→2018 PASS) → Architect Gate de Saída Aria PASS (Confidence High, 3 eixos `internal-state-contract-gate.md` re-verificados contra código real) → CodeRabbit `--base main` **0 findings na Iter 1** → merge → close. **Waiver 0. Epic 6 a 4/17. O 2-way de calendário está COMPLETO (6.3 pull + 6.4 push).**

### O que a 6.4 entregou (a 6.6 USA directamente)

- **`v2/lib/google/calendar-push.ts`** — helper puro de push (100% cobertura). `pushCalendarEvent(accessToken, event)` discrimina por `googleId`: ausente → `POST events.insert`; presente → `PUT events.update` (full replace). 4 erros tratáveis: `CalendarPushAuthError`/`CalendarPushError`/`CalendarPushNotFoundError`/`CalendarPushRateLimitError`. Mapeamento `title→summary`, `startAt/endAt` epoch ms → `dateTime` ISO ou `date` (all-day). `fetch` directo (precedente D-6.3-FETCH-DIRECT).
- **`v2/app/api/google/calendar/push/route.ts`** — route Node fina, **idempotente-vazia** (C1-a): lê `db.calendarEvents.filter(e => !e.googleId).toArray()`, e hoje devolve `{ok:true, pushed:0, updated:0, failed:0}` porque **ainda não há produtor de eventos locais**. A 6.6 (`criar_evento_calendar`) é exactamente esse produtor — ao criar eventos em `calendarEvents` sem `googleId`, a route da 6.4 passa a empurrá-los de facto para o Google.
- **`v2/types/db.ts` + `v2/lib/db/schemas.ts`** — `CalendarEvent.googleId` agora é **opcional** (`googleId?: string` + Zod `.min(1).optional()`), SEM version bump. `&googleId` continua único e esparso em `client.ts` version(6) (intocado). Esta é a alteração que torna a classe "evento local-pendente" representável — pré-requisito directo da 6.6.
- **`v2/tests/mocks/handlers/google.ts`** — handlers MSW de `events.insert` (POST 201) / `events.update` (PUT 200) / 404 / 429 / 5xx, camelCase real, com teste de fidelidade falsificável.

### Decisões `[D-6.4-*]` (NÃO reabrir; relevantes à 6.6)

- **[D-6.4-SCOPE]** = push insert-only; o update bidireccional fica para uma story futura de conflito. A 6.6, ao criar eventos locais, alimenta o ramo insert.
- **[D-6.4-SYNCSTATUS]** = inferência por `googleId` (sem `syncStatus`/`lastPushedAt`). A 6.6 cria eventos SEM `googleId` (a route push reconcilia-o após o insert no Google).
- **[D-6.4-LOOP]** = anti-loop ESTRUTURAL (`&googleId` único esparso + routes `/sync` e `/push` independentes + scope insert-only). A 6.6 não pode quebrar este invariante: eventos criados pela tool entram sem `googleId`; o pull (6.3) só toca registos COM `googleId`.

### Débitos abertos pela 6.4 (não-bloqueantes, NÃO são dívida da 6.6)

- **REC-6.4-PATCH** — avaliar `events.patch` no update bidireccional para não destruir campos Google não-modelados (`attendees`, `conferenceData`); para a story de update/conflito, não para a 6.6.
- **REC-6.4-ICALUID** — `iCalUID` determinístico anti-duplicado para quando houver multi-device; conhecido-aceite single-user (R7).
- **AC2 produção** (< 30s real contra a conta Google do Eurico) DEFERIDO a verificação manual pós-deploy (padrão AC13 da 4.9). Destranca-se com os pré-requisitos humanos P1/P2/P3 abaixo.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = NEXUS V2 (`imersao-tools/nexus/`). CAMINHO CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Próxima Story RECOMENDADA — 6.6 Tools cérebro calendário (FR61 + FR62)

Fonte: `imersao-tools/nexus/docs/EPIC-6.md` (tabela §5 row 6.6 + §7 GAP-6.5 + nota §5 sobre nomes ASCII). Executor `@dev`, gate `@architect`, Status `Draft` (ainda por criar pelo `@sm`).

**Scope:** registar três tools no Tool Registry do cérebro multi-intent (Epic 1), domínio `calendar`: `criar_evento_calendar`, `actualizar_evento_calendar`, `listar_eventos`. FR61 ("amanhã 15h reunião com Paulo" cria evento via tool) + FR62 (as três tools). **Porque é a recomendada:** é o **produtor de eventos locais** que dá vida funcional à route push da 6.4 (hoje idempotente-vazia) — fecha o ciclo Nexus → Google de ponta a ponta.

**Pontos de atenção para o draft (`@sm`) e validação (`@po`):**
- **`external-contract-identifiers.md` (A4 Epic 3):** os nomes das 3 tools JÁ estão validados ASCII no draft do epic (EPIC-6 nota §5 — `criar_evento_calendar`, `actualizar_evento_calendar`, `listar_eventos`, sem acentos/cedilha). Não deve haver reconciliação de AC por nomes (precedente 3.11 evitado). A grafia humana PT-PT vive na camada semântica do LLM (D-FUZZY).
- **Domínio `calendar` no classifier (`[GAP-6.5]`):** `architecture-v2.md` §7.2 já reserva `'calendar'` no `ToolDefinition.domain`. `@architect` confirma no draft se o classifier do Epic 1 trata `calendar` como domínio distinto ou agrupa (precedente D-5.13-DOMAIN da 5.13, D-DOMAIN da 4.10). Verificar em código real (`v2/lib/agent/tools/index.ts` `toolRegistry`), não assumir.
- **Reutilização (NÃO duplicar):** `criar_evento_calendar` cria um `CalendarEvent` em `calendarEvents` SEM `googleId` (classe local-pendente da 6.4) — a route push da 6.4 reconcilia o `googleId` depois. `listar_eventos` lê os eventos já sincronizados pela 6.3. `actualizar_evento_calendar` altera localmente; o push bidireccional do update está fora de scope da 6.4 (REC-6.4-PATCH) — `@architect` decide se o update via tool entra na 6.6 ou fica diferido.
- **Padrão preview-then-confirm (Epic 1 Story 1.6):** `criar_evento_calendar` e `actualizar_evento_calendar` têm **efeito externo** (escrevem no Google via push) → `requiresPreview: true` (precedente `criar_draft_gmail` da 6.10, e acções com efeito externo do Epic 1). `@architect` confirma.
- **`mock-protocol-fidelity.md`:** as tools assentam nos helpers/route já testados por MSW; se houver chamada nova à Google, handler reflecte o protocolo real com ≥1 teste falsificável.
- **Edge/Node-safety:** tools `calendar` que tocam `googleapis`/push são Node; verificar que o módulo da tool é Node-safe (não importado em contexto Edge). `@architect` no draft.

## Alternativas paralelizáveis (se não se quiser a 6.6 já)

A 6.6 é o caminho recomendado (dá vida ao push). Mas o Epic 6 tem sub-módulos largamente independentes:
- **6.5** (cron Vercel diário para sync delta) — executor `@devops`, gate `@architect`; depende de 6.3/6.4 (DONE) e serve também o trigger Gmail (6.8). Padrão do scheduler de push da 4.8.
- **6.11** (Telegram bot setup) — sub-módulo **totalmente independente** do Google; pode arrancar em paralelo. Gate `@architect` de Entrada OBRIGATÓRIO (webhook `secret_token` + decisão de SDK Telegram + 2 criticals `npm audit` da cadeia `request`, `[GAP-6.4]`).

## Pré-requisito humano (Eurico) — herdado, AINDA PENDENTE (NÃO bloqueia dev/merge)

OAuth real + sync end-to-end contra a conta Google só se validam em produção depois do provisionamento. A lógica + unit tests da 6.6 correm com MSW sem credenciais Google. AC de produção ficam **deferidos** a verificação manual pós-deploy (padrão AC13 da 4.9). Pendentes:
- **P1** — Google Cloud Console: projecto + Calendar API + OAuth client (Web) + scope Calendar + redirect URI EXACTO `https://imersao.ia.expressia.pt/api/google/oauth/callback`.
- **P2** — Vercel env (server-only): `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `SESSION_SECRET`.
- **P3** — email do Eurico como test user no consent screen.

## Regras git (invioláveis)

- `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- **NUNCA `git add -A`** — o repo tem 150+ untracked fora-scope + submódulos sujos (`imersao-tools/comunidade`, `starter-builder`). Add SELECTIVO da File List da story.
- Push é exclusivo do `@devops`. Auto-merge se as 6 condições `merge-authority` ficarem verdes no head SHA (`reviewDecision: CHANGES_REQUESTED` não bloqueia se stale — usar `--admin`). Hard-stop §8 = máx 2 iter CR (Iter 3+ exige trailer `Authorized-by:` do Eurico).
- Commits de close docs-only vão directos a `main` por push do `@devops` (padrão 6.1/6.2/6.3/6.4).
- **Lição R100 (close 6.1/6.2/6.4):** após `git mv` + edição de uma story/handoff no close, **re-adicionar explicitamente** o ficheiro (`git add`) e **confirmar o blob staged** (`git show :path | grep`), não só `git status` — o rename R100 pode deixar o blob ANTIGO no índice.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus-v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260618-story-6.6-ARRANQUE-tools-calendario.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `Pax (@po) — close-story 6.4`
DATA: `18/06/2026`
