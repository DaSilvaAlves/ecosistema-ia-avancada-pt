# Epic 6 — Google Calendar + Gmail + Telegram (OAuth)

> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Criado por:** Morgan (`@pm`) em 16/06/2026
> **Estado:** **EM CURSO — 4/17 stories Done.** Sucessor natural do Epic 5 (FECHADO 13/13, waiver rate 0%) na ordem PRD §9 (`4 → 5 → 6`). É o **primeiro epic de integrações externas autenticadas** do Nexus: OAuth Google (Calendar + Gmail) + canal Telegram bot. Story 6.1 (OAuth flow Google, Calendar scope, FR58) FECHADA 17/06/2026 via PR #75 (squash `e7e4994d`) — fundação OAuth reutilizada pelas 6.2-6.7. Story 6.2 (Refresh token storage Vercel KV, encriptação at-rest + refresh flow + revogação, FR60, GAP-6.2) FECHADA 17/06/2026 via PR #76 (squash `1621e8a6`), waiver 0 — `getValidAccessToken()` é o único ponto de entrada de access token para 6.3/6.4/6.6/6.7. Story 6.3 (Sync calendário pull, eventos Google → Nexus via syncToken incremental, FR59) FECHADA 17/06/2026 via PR #77 (squash `e149fc76`), waiver 0 — helper puro `lib/google/calendar.ts` (96,62% cobertura) + cursor KV dedicado + version(6) Dexie `calendarEvents`; CodeRabbit `--base main` 0 findings na Iter 1 (após fix D-6.3-POSITIVE-EPOCH). Story 6.4 (Sync calendário push, eventos Nexus → Google via `events.insert`/`events.update`, FR59 — completa o 2-way) FECHADA 18/06/2026 via PR #78 (squash `22c984d7`), waiver 0 — helper puro `lib/google/calendar-push.ts` (100% cobertura) + route Node idempotente-vazia + `googleId` opcional SEM version bump + anti-loop ESTRUTURAL (`&googleId` único esparso + routes independentes + scope insert-only); CodeRabbit `--base main` 0 findings na Iter 1; débitos REC-6.4-PATCH/REC-6.4-ICALUID; AC2 (< 30s real) deferido a produção. **O sub-módulo Calendar está agora 4/6 (falta 6.5 cron sync delta + 6.6 tools cérebro calendário).** Próximo passo: `@sm *draft 6.6` (tools cérebro calendário — produtor de eventos locais que a route push da 6.4 passa a empurrar) ou `*draft 6.5` (cron sync delta) ou `*draft 6.11` (Telegram setup em paralelo).
> **Fonte da verdade:** `PRD-NEXUS-V2.md` §6.11 (Google Calendar, FR58-62), §6.12 (Gmail, FR63-68), §6.13 (Telegram Bot, FR69-76), §9 (roadmap — linha "Epic 6 — OAuth Google (Calendar + Gmail) + Telegram Bot", Bloqueia: 7), §10 Epic 6 (Stories sugeridas 6.1-6.17 + AC1-AC5 + Quality gates) — Constitution Artigo IV (No Invention): cada story, FR e AC abaixo traça ao PRD. As 17 stories sugeridas são a decomposição directa do PRD §10 Epic 6.
> **Arquitectura:** `architecture-v2.md` — **ADR-1 (split Edge/Node por endpoint)** já decidido e relevante a todo o Epic 6: `/api/telegram/webhook` em **Edge** (resposta <5s, fan-out); `/api/google/oauth/*`, `/api/google/calendar/sync`, `/api/google/gmail/classify` em **Node** (SDK `googleapis` precisa de Node). §4.1 (tabela runtime por endpoint), §9.2 (secrets OAuth/Telegram em Vercel env), §9.4 (CSP `connect-src` já inclui `api.telegram.org`), §9.5 (verificação de origem do webhook Telegram por **secret token**, não HMAC), §6 KV schema (`nexus:google:tokens`, `nexus:telegram:bot`, `nexus:cache:gmail:classify:<msgId>`), §7.2 (Tool Registry já lista domínios `calendar`, `gmail`, `telegram`). Os 5 ADRs base NÃO são reabertos.
> **Segurança (quality gate específico do epic):** PRD §10 Epic 6 quality gate = "Epic 1 + **revisão segurança tokens OAuth**". Este é o epic de maior superfície de segurança do roadmap (refresh tokens Google de longa duração, webhook público Telegram, scopes `calendar` + `gmail.modify`). Architect Gate de Entrada recomendado para 6.1/6.2 (OAuth + storage) e 6.11/6.12 (webhook).
> **Lições aplicadas:** Retrospectivas Epic 1 (A1/A2/A6), Epic 2 (A1/A2/A4), Epic 3 (A1-A7), Epic 4 (A1-A7) e Epic 5. Regras em vigor aplicadas preventivamente: `mock-protocol-fidelity.md` (Epic 1 A1 — mocks Google/Telegram reflectem o protocolo real), `react-component-test-criteria.md` (Epic 3 A3), `external-contract-identifiers.md` (Epic 3 A4 — nomes de tools ASCII), `internal-state-contract-gate.md` (Epic 4 A1 — estado distribuído OAuth/sync), `separation-of-roles.md` (Epic 1 A6). A regra `internal-state-contract-gate.md` foi explicitamente marcada (roadmap P2.4) para existir **antes do Epic 6**.

---

## 1. Goal

Integrar o Nexus com serviços externos via **OAuth Google** (Calendar + Gmail) e **bot Telegram**: sync 2-way de calendário (eventos Nexus ↔ Google), classificação AI da inbox Gmail em 4 buckets de prioridade, e um canal Telegram que recebe mensagens texto/voz/foto e responde com lembretes/briefings. Tools do cérebro multi-intent integradas para os três domínios (`calendar`, `gmail`, `telegram`). Trace: PRD §9 (linha "Epic 6 — OAuth Google (Calendar + Gmail) + Telegram Bot") + §10 Epic 6 (FR58-76).

## 2. Contexto e posicionamento

| Dimensão | Detalhe |
|----------|---------|
| Continuidade | O sync de calendário e a classificação Gmail são instrumentos de **continuidade pessoal e antecipação** — alinhados à visão "sistema de continuidade pessoal" + "overnight agent" (`project_nexus_vision.md`). O Telegram é o **segundo canal que alcança o utilizador fora da app** (o primeiro foi o Web Push do Epic 4): o briefing matinal (FR75) e os lembretes via Telegram (FR74) completam o FR37 que ficou **parcial** no Epic 4 (só Web Push). |
| Base Epic 1 | O cérebro multi-intent + Tool Registry (Epic 1, em `main`) é onde as tools de calendar/gmail/telegram (FR62+FR68+FR76) se registam. A arquitectura (§7.2) **já reserva** os domínios `calendar`, `gmail`, `telegram` no `ToolDefinition.domain`. Precedente: 2.10 registou `tasks`/`projects`; 3.11 `finance`; 4.10 `habits`; 5.13 (D-5.13-DOMAIN) `journal`/`knowledge`. As stories de tools (6.6, 6.10, 6.17) decidem a granularidade dos domínios no classifier (ver §7 GAP-6.5). |
| 1.º epic de OAuth / integração autenticada | Pela 1.ª vez o Nexus delega autenticação a um terceiro (Google) e armazena **refresh tokens de longa duração** server-side. É o análogo, em risco de segurança, do que o Epic 4 fez com Web Push/VAPID — mas com superfície maior (scopes `calendar` + `gmail.modify`, tokens revogáveis, refresh flow). Exige `@architect` cedo + revisão de segurança dedicada (quality gate do PRD §10). |
| 1.º webhook público de entrada | `/api/telegram/webhook` (Edge, ADR-1) é o 1.º endpoint do Nexus que **recebe input não solicitado da internet pública**. Arch §9.5: Telegram não assina com HMAC; a verificação de origem é por **secret token** (`x-telegram-bot-api-secret-token`) configurado no `setWebhook`. É o ponto de segurança mais sensível depois dos tokens OAuth (ver §7 GAP-6.4). |
| Reuso de canais e cérebro | FR71 (texto → cérebro) reutiliza o cérebro multi-intent do Epic 1 directamente; FR74 (lembretes via Telegram) reutiliza o disparo de lembretes do Epic 4 (`channels: ('push'\|'telegram')[]` já previsto no interface `Reminder`, arch §6); FR73 (foto recibo → OCR) **depende do Epic 7** (OCR não existe ainda — ver §3 e §7 GAP-6.6). Não se cria mecanismo de canal novo onde já existe. |
| Dependência de produção (vulnerabilidades) | O `npm audit` (roadmap §1) reporta **2 vulnerabilidades critical na cadeia `request` via `node-telegram-bot-api`** + 11 moderate, cuja decisão foi explicitamente **adiada para o Epic 6** (roadmap P0.1). O Epic 6 é onde a dependência Telegram entra de facto — a decisão de SDK Telegram (manter `node-telegram-bot-api`, migrar para `telegraf`/`grammY`, ou usar a Bot API por `fetch` directo sem SDK) é parte do scope (ver §7 GAP-6.4 + §8). |
| Independência e bloqueio | PRD §9: ordem `0 → 1 → (2 \|\| 3) → 4 → 5 → 6 → 7 → 8`. O Epic 6 **bloqueia o Epic 7** (PRD §9 coluna "Bloqueia" do Epic 6 = `7`): o Epic 7 (Voice + OCR) integra-se com o canal Telegram (FR73 foto recibo via Telegram → OCR → finança; 7.9). A story 6.15 (foto → OCR) fica **stub/parcial** no Epic 6 e completa-se no Epic 7. |

## 3. Dependências

| Relação | Epic / Story | Estado |
|---------|--------------|--------|
| Depende de | Epic 1 (Cérebro Multi-Intent — Tool Registry, classifier, executor) | DONE — em main |
| Depende de | Epic 0 Story 0.5/0.6 (proxy Anthropic server-side + login single-user) — base para os endpoints Node `/api/google/*` e cookies de sessão | DONE — em main |
| Reutiliza (não-bloqueante) | Epic 4 (disparo de lembretes; interface `Reminder.channels` inclui `'telegram'`) — FR74 entrega lembretes via Telegram, completando o FR37 parcial do Epic 4 | DONE — em main |
| Reutiliza (padrão) | Epic 1 preview-then-confirm (Story 1.6) — `criar_evento_calendar`/`criar_draft_gmail` são acções com efeito externo → preview obrigatório | DONE — em main |
| Reutiliza (padrão) | Epics 2/3/4/5 — padrão "helper puro em `lib/**` + modal/lista fina + `TabStrip`/`FormField` partilhados" e padrão de teste de componente (`react-component-test-criteria.md`) | DONE — em main |
| Precede / Bloqueia | **Epic 7 (Voice + OCR)** — FR73 (foto recibo via Telegram → OCR) e 7.9 dependem do canal Telegram do Epic 6; a 6.15 fica parcial até o OCR existir (Epic 7) | Não iniciado |
| Relação com Epic 8 | O Service Worker mínimo (Epic 4) e o hardening completo (Epic 8) são independentes do Epic 6; o `npm audit` das 2 criticals (cadeia `request`) é resolvido aqui, não diferido para o Epic 8 | Epic 8 não iniciado |

Ordem PRD §9: `0 → 1 → (2 || 3) → 4 → 5 → 6 → 7 → 8`. Epic 6 **bloqueia 7**.

## 4. Functional Requirements cobertos

Trace directo a `PRD-NEXUS-V2.md` §6.11, §6.12, §6.13. 19 FRs no total (FR58-FR76).

### Google Calendar — 2-way sync (§6.11)

| FR | Descrição (PRD §6.11) | Stories |
|----|------------------------|---------|
| FR58 | OAuth flow Google (scope `calendar`) iniciado pelo utilizador nas definições | 6.1 |
| FR59 | Sync 2-way: eventos criados no Nexus aparecem no Google Calendar e vice-versa | 6.3, 6.4 |
| FR60 | Refresh token armazenado server-side (Vercel KV ou env) | 6.2 |
| FR61 | Cérebro: "amanhã 15h reunião com Paulo" cria evento via tool `criar_evento_calendar` | 6.6 |
| FR62 | Tools cérebro: `criar_evento_calendar`, `actualizar_evento_calendar`, `listar_eventos` | 6.6 |

### Gmail — importante vs descartável (§6.12)

| FR | Descrição (PRD §6.12) | Stories |
|----|------------------------|---------|
| FR63 | OAuth flow Google (scope `gmail.modify`) iniciado pelo utilizador | 6.7 |
| FR64 | Inbox classificada por AI em 4 buckets: Importante / Para responder hoje / Pode esperar / Descartável | 6.8 |
| FR65 | Classificação corre em background (Vercel Cron ou trigger manual) para últimos N emails | 6.5, 6.8 |
| FR66 | Vista Gmail no dashboard: só Importantes + Para responder hoje; resto oculto por defeito | 6.9 |
| FR67 | Cérebro: "responde à Maria a confirmar reunião sexta" cria draft no Gmail | 6.10 |
| FR68 | Tools cérebro: `listar_emails_importantes`, `criar_draft_gmail`, `arquivar_email` | 6.10 |

### Telegram Bot (§6.13)

| FR | Descrição (PRD §6.13) | Stories |
|----|------------------------|---------|
| FR69 | Bot Telegram criado via BotFather; token em Vercel env | 6.11 |
| FR70 | Bot recebe texto/voz/foto e envia para `/api/telegram/webhook` | 6.11, 6.12 |
| FR71 | Mensagens texto vão directas para o cérebro multi-intent | 6.13 |
| FR72 | Mensagens voz transcrevidas (Anthropic ou Web Speech) e processadas pelo cérebro | 6.14 |
| FR73 | Fotos identificadas como recibo passam para OCR (FR81) e criam finança | 6.15 (parcial — completa no Epic 7) |
| FR74 | Bot envia lembretes (FR37) e briefings matinais (FR75) | 6.16 |
| FR75 | Briefing matinal automático 07h-09h (configurável) por Telegram com o estado do dia | 6.16 |
| FR76 | Tool cérebro: `enviar_telegram` (responder ao próprio utilizador via bot) | 6.17 |

## 5. Stories (17) — trace PRD §10 Epic 6

> **Decomposição directa das "Stories sugeridas" do PRD §10 Epic 6 (6.1 a 6.17)** — nenhuma story inventada nem omitida face ao PRD. Os pares executor/quality-gate são **previsões** (Quality-First Planning) e respeitam `executor != quality_gate` (`separation-of-roles.md`). `@sm` (River) finaliza a atribuição em cada story draft; `@po` (Pax) valida. Dado o peso de segurança do epic, **território de risco (OAuth, webhook, sync de estado externo, parsers AI) tem gate `@architect`**.

| # | Story | Descrição (1 linha — PRD §10 Epic 6) | FR | Executor previsto | Quality gate previsto | Estado |
|---|-------|--------------------------------------|-----|-------------------|------------------------|--------|
| 6.1 | OAuth flow Google (Calendar scope) | UI definições para iniciar OAuth (scope `calendar`) + callback handler `/api/google/oauth/*` (Node, `googleapis`). **GAP segurança — ver §7 GAP-6.1** | FR58 | `@dev` | `@architect` | **Done** (PR #75 `e7e4994d`, 17/06) |
| 6.2 | Refresh token storage Vercel KV | Armazenar refresh token server-side em Vercel KV (`nexus:google:tokens`, arch §6). Refresh flow + revogação. **GAP segurança — ver §7 GAP-6.2** | FR60 | `@dev` | `@architect` | **Done** (PR #76 `1621e8a6`, 17/06) |
| 6.3 | Sync calendário pull | Eventos Google → Nexus (sync incremental via syncToken Google). Helper puro de reconciliação em `lib/google/calendar.ts` | FR59 | `@dev` | `@qa` | **Done** (PR #77 `e149fc76`, 17/06) |
| 6.4 | Sync calendário push | Eventos Nexus → Google. Completa o 2-way. **Estado distribuído (criado/sincronizado/conflito) → `internal-state-contract-gate.md` aplica-se (ver §8)** | FR59 | `@dev` | `@architect` | **Done** (PR #78 `22c984d7`, 18/06) |
| 6.5 | Cron Vercel diário para sync delta | Vercel Cron dispara sync delta de calendário (e trigger de classificação Gmail) periodicamente. Padrão do scheduler de push da 4.8 | FR65 | `@devops` | `@architect` | Draft |
| 6.6 | Tools cérebro calendário | Registar `criar_evento_calendar`, `actualizar_evento_calendar`, `listar_eventos` no Tool Registry (domínio `calendar`, arch §7.2). Nomes ASCII validados (ver nota §5) | FR61, FR62 | `@dev` | `@architect` | Draft |
| 6.7 | OAuth flow Google (Gmail scope) | OAuth incremental para adicionar scope `gmail.modify`. Reutiliza o fluxo da 6.1/6.2 com scope adicional | FR63 | `@dev` | `@architect` | Draft |
| 6.8 | Classifier Gmail (4 buckets) | Lê últimos N (~50) emails, AI classifica em Importante / Para responder hoje / Pode esperar / Descartável. Cache por `msgId` (`nexus:cache:gmail:classify`, TTL 7d). **Mock do classifier reflecte o protocolo real (`mock-protocol-fidelity.md`)** | FR64, FR65 | `@dev` | `@architect` | Draft |
| 6.9 | Vista Gmail no dashboard | Vista com só Importantes + Para responder hoje (resto oculto por defeito). **Múltiplos estados de render (loading/empty/content/erro-OAuth) → teste de componente (`react-component-test-criteria.md`)** | FR66 | `@ux-design-expert` | `@dev` | Draft |
| 6.10 | Tools cérebro Gmail | Registar `listar_emails_importantes`, `criar_draft_gmail`, `arquivar_email` (domínio `gmail`). `criar_draft_gmail` com `requiresPreview: true` (acção externa) | FR67, FR68 | `@dev` | `@architect` | Draft |
| 6.11 | Telegram bot setup | Token BotFather em Vercel env; webhook `/api/telegram/webhook` registado via `setWebhook` com `secret_token` (arch §9.5). **Decisão de SDK Telegram + 2 criticals `npm audit` — ver §7 GAP-6.4 + §8** | FR69, FR70 | `@dev` | `@architect` | Draft |
| 6.12 | Webhook handler | Edge handler (ADR-1) que valida `x-telegram-bot-api-secret-token`, faz parse de texto/voz/foto e roteia (fan-out <5s). **GAP segurança — ver §7 GAP-6.4** | FR70 | `@dev` | `@architect` | Draft |
| 6.13 | Texto → cérebro multi-intent | Mensagem texto do Telegram entra directa no cérebro do Epic 1. Reutiliza o pipeline existente, não cria fluxo novo | FR71 | `@dev` | `@qa` | Draft |
| 6.14 | Voz → transcrição | Voz Telegram → transcrição (Anthropic se disponível; Web Speech client-side se na app) → cérebro. **GAP — decisão de transcrição @architect (ver §7 GAP-6.3, FR72)** | FR72 | `@dev` | `@architect` | Draft |
| 6.15 | Foto → OCR | Foto recibo via Telegram → OCR → finança. **Depende do Epic 7 (OCR não existe ainda) — fica stub/parcial neste epic** (ver §3 e §7 GAP-6.6) | FR73 | `@dev` | `@architect` | Draft (parcial) |
| 6.16 | Bot envia lembretes + briefing matinal | Bot entrega lembretes (FR37/Epic 4 via canal `telegram`) e briefing matinal automático 07h-09h (FR75) com o estado do dia. Reutiliza disparo de lembretes do Epic 4 | FR74, FR75 | `@dev` | `@qa` | Draft |
| 6.17 | Tool cérebro `enviar_telegram` | Registar `enviar_telegram` no Tool Registry (domínio `telegram`) — o cérebro responde ao próprio utilizador via bot | FR76 | `@dev` | `@architect` | Draft |

> **Padrão de gate herdado dos Epics 2/3/4/5:** OAuth/token/webhook/sync de estado externo/parsers AI (território de risco) → gate `@architect`; UI pura → executor `@ux-design-expert`, gate `@dev`; lógica de domínio/roteamento sem efeito externo → gate `@qa`; cron/infra → executor `@devops`, gate `@architect`. `@sm`/`@po` confirmam a atribuição final em cada draft.

> **Nota (`external-contract-identifiers.md`) — validação preventiva dos nomes de tools:** os 7 nomes de tools do PRD §10 Epic 6 (`criar_evento_calendar`, `actualizar_evento_calendar`, `listar_eventos`, `listar_emails_importantes`, `criar_draft_gmail`, `arquivar_email`, `enviar_telegram`) **já estão em ASCII** (sem acentos nem cedilha — note-se "evento", "actualizar", "eventos", "emails", "arquivar"). Validados contra `TOOL_NAME_PATTERN` (`[a-z0-9_]`) + Anthropic tool spec **no draft deste epic**, não na implementação (precedente Story 3.11 onde nomes com cedilha foram rejeitados; precedente 5.13 onde "diario"/"area" sem acento). A grafia humana PT-PT vive na camada semântica do LLM (D-FUZZY, precedente 3.11/4.10/5.13), não no identificador técnico. As stories 6.6/6.10/6.17 não devem precisar de reconciliação de AC por nomes.

## 6. Acceptance Criteria (nível epic) — trace PRD §10 Epic 6

Cópia fiel dos AC Epic 6 do PRD §10 (linhas 569-573).

| # | Critério | Story principal |
|---|----------|-----------------|
| AC1 | OAuth Google completa em < 60s | 6.1, 6.7 |
| AC2 | Evento criado no Nexus aparece no Google Calendar em < 30s | 6.4 |
| AC3 | Classificação Gmail tem precisão >= 80% em conjunto manual de 30 emails | 6.8 |
| AC4 | Bot Telegram responde a "olá" em < 3s | 6.12, 6.13 |
| AC5 | Lembrete agendado dispara push browser E mensagem Telegram | 6.16 |

## 7. Reconciliação PRD ↔ Arquitectura — GAPs para o draft

> Os pontos abaixo são marcados para resolução por `@architect` no draft das stories respectivas — **não preenchidos com suposição** (Constitution Artigo IV, precedente `[GAP-4.1]`-`[GAP-4.6]` do EPIC-4.md §7 e `[GAP-5.1]`-`[GAP-5.5]` do EPIC-5.md §7). Nenhum dos 5 ADRs base é reaberto. O Epic 6 tem **mais GAPs de segurança** que os anteriores porque introduz OAuth + webhook público pela 1.ª vez; em contrapartida, a ADR-1 (split Edge/Node) e a §9 da arquitectura já anteciparam os pontos de runtime e a verificação de origem do webhook.

| Ponto | PRD diz | Arquitectura actual | GAP a resolver no draft |
|-------|---------|---------------------|-------------------------|
| **[GAP-6.1]** OAuth flow Google | Story 6.1 "OAuth flow Google (Calendar scope)"; FR58 | ADR-1: `/api/google/oauth/*` em Node (`googleapis`); §9.2 lista `GOOGLE_OAUTH_CLIENT_ID/SECRET/REDIRECT_URI` | `@architect` confirma no draft da 6.1: (a) state/PKCE no fluxo OAuth (proteção CSRF do callback); (b) onde corre o callback (`google/oauth/callback`, Node); (c) tratamento de `access_denied`/erro do consent screen. PRD §11 R4: app fica em **test mode** (single-user, sempre <100 utilizadores) — documentar; não pedir verification Google. AC1 (< 60s) verificável manualmente. |
| **[GAP-6.2]** Refresh token storage | Story 6.2 "refresh token storage Vercel KV"; FR60 "armazenado server-side" | arch §6 KV: `nexus:google:tokens → { accessToken, refreshToken, expiresAt }`; §9.2 secrets server-only | `@architect` decide no draft da 6.2: (a) encriptação at-rest do refresh token em KV (KV não encripta por defeito — decisão de segurança); (b) refresh flow (renovar accessToken antes de expirar, sem perder refreshToken); (c) revogação (utilizador desliga OAuth nas definições → revogar token Google + limpar KV). **Revisão de segurança dedicada (quality gate do PRD §10) foca aqui.** |
| **[GAP-6.3]** Transcrição de voz Telegram | Story 6.14 "voz → transcrição (Anthropic se disponível, ou Web Speech client-side)"; FR72 "decisão @architect" | PRD §10 marca explicitamente "decisão @architect"; Web Speech é browser-only (não corre num webhook server-side) | **GAP explicitamente deferido pelo PRD.** `@architect` decide no draft da 6.14: a voz que chega pelo webhook Telegram (server-side) **não pode** usar Web Speech (browser-only) — precisa de transcrição server-side (Anthropic, ou outro). Confirmar se a API Anthropic transcreve áudio no plano actual ou se a voz via Telegram fica fora de scope (texto-only) até existir solução. Não assumir. |
| **[GAP-6.4]** Segurança do webhook Telegram + SDK | Story 6.11/6.12 "webhook `/api/telegram/webhook`"; FR70 | ADR-1: webhook em **Edge**; §9.5: verificação por **secret token** (`x-telegram-bot-api-secret-token`), não HMAC; §9.4 CSP `connect-src` inclui `api.telegram.org` | `@architect` resolve no draft da 6.11/6.12: (a) validação obrigatória do `secret_token` no Edge (rejeitar 401 se não bater); (b) **decisão de SDK Telegram** — `node-telegram-bot-api` traz 2 criticals (`npm audit`, roadmap §1/P0.1): manter, migrar para `grammY`/`telegraf`, ou usar a Bot API por `fetch` directo (Edge não corre SDKs Node-only — favorece `fetch`). Decisão de aceitar/eliminar as 2 criticals é do `@architect` + Eurico (ver §8). (c) Edge não tem `crypto.createHmac` Node — confirmar que a validação por secret token é suficiente (é, por design Telegram). |
| **[GAP-6.5]** Domínios das tools no Tool Registry | Stories 6.6/6.10/6.17 "tools calendar/gmail/telegram" | arch §7.2: `ToolDefinition.domain` **já lista** `'calendar' \| 'gmail' \| 'telegram'`; §8 classifier agrupa por domínio | `@architect` confirma no draft da 6.6/6.10/6.17: os 3 domínios `calendar`/`gmail`/`telegram` já estão no contrato (arch §7.2) — verificar se o classifier do Epic 1 os trata como 3 domínios distintos ou se agrupa (precedente D-5.13-DOMAIN da 5.13, D-DOMAIN da 4.10). Módulos Edge/Node-safe consoante a tool (calendar/gmail = Node `googleapis`; telegram = Edge `fetch`). Verificar em código, não assumir. |
| **[GAP-6.6]** Foto recibo → OCR (dependência Epic 7) | Story 6.15 "foto → OCR (depende Epic 7)"; FR73 "OCR (FR81)" | FR81/Epic 7 (OCR via Claude Vision) **não existe ainda**; PRD §9 Epic 6 bloqueia 7 | `@architect`/`@po` decidem no draft da 6.15: a story fica **stub/parcial** — o webhook reconhece a foto e responde "OCR disponível no Epic 7", OU a 6.15 é diferida para o Epic 7 (onde existe a 7.9 "foto recibo via Telegram → OCR"). Não implementar OCR no Epic 6 (fora de scope; é FR81/Epic 7). Decisão registada no draft. |

## 8. Qualidade e processo — lições das Retrospectivas Epic 1/2/3/4/5

| Acção / lição | Aplicação no Epic 6 |
|---------------|---------------------|
| **A1 Epic 4 — `internal-state-contract-gate.md`** (criar antes do Epic 6: roadmap P2.4) | Aplica-se à **Story 6.4 (sync push)** e **6.2 (token lifecycle)** — estado distribuído por: evento local (criado) → push para Google (sincronizado) → conflito (Google alterou o mesmo evento); e token (válido → expirado → renovado → revogado). O gate `@architect` da 6.4/6.2 faz a análise de ciclo de vida: classes de estado, transição-já-ocorrida (sync duplicado), falha (Google indisponível a meio do sync delta). É a maior superfície de estado distribuído desde a 4.9. **Confirmar que a regra existe antes de arrancar a 6.2/6.4** (roadmap P2.4). |
| **A1 Epic 1 — `mock-protocol-fidelity.md`** | Aplica-se ao **classifier Gmail (6.8)**, ao **sync de calendário (6.3/6.4)** e ao **webhook Telegram (6.12)**. Os mocks das respostas Google Calendar/Gmail API e dos updates Telegram (arch §5: `tests/mocks/handlers/google.ts` + `telegram.ts` já previstos via MSW, ADR-4) reflectem o protocolo real, não apenas fazem os tests passar. ≥1 teste que falharia se o shape da resposta divergisse. |
| **A3 Epic 3 — `react-component-test-criteria.md`** | Aplicada preventivamente. A **vista Gmail (6.9)** tem múltiplos estados de render (loading/empty/content/erro-OAuth/token-expirado) → **teste de componente obrigatório**, contado no gate ANTES do CodeRabbit. A UI de definições OAuth (6.1) também tem estados (não-ligado/a-ligar/ligado/erro). |
| **A4 Epic 3 — `external-contract-identifiers.md`** | Aplicada. Os 7 nomes de tools (6.6/6.10/6.17) validados ASCII no draft do epic (ver nota §5). |
| **A6 Epic 1 — `separation-of-roles.md`** | Aplicada na tabela §5 — nenhum executor é o seu próprio quality gate. |
| **A2 Epic 4 — varredura de bug-de-classe nas camadas adjacentes** | Quando o CR/gate apanha um CRITICAL/Major de classe identificável (ex: token não-revogado num caminho), `@dev` verifica a mesma classe nas camadas adjacentes (OAuth Calendar ↔ OAuth Gmail; pull ↔ push sync) **no mesmo ciclo** — evita o gasto de Iter 2+3. |
| **A3 Epic 4 — mapa de verificabilidade por AC** | Crítico neste epic: OAuth, sync e classificação Gmail dependem de **chaves/contas reais só-de-produção** que podem não ser mockáveis em CI. No draft de cada story, mapear por AC onde é verificável (CI mock MSW / preview / produção manual). AC1 (OAuth <60s), AC2 (evento em <30s), AC3 (classificação >=80% em 30 emails reais), AC5 (push+telegram) provavelmente exigem **verificação manual em produção** (precedente AC13 da 4.9). |
| **A1 Epic 3 — `.coderabbit.yaml` afinado** | Já em vigor. Mantém-se. |
| **A5 Epic 3 — convenção de contagem de testes** | Stories do Epic 6 não mantêm contagens exactas de testes em headers/File List — só no Change Log/Dev Record como snapshot datado (`story-lifecycle.md`). |
| **Lição 5.11 — CR `--base main` no gate de saída** (`feedback_cr_base_main_no_gate_saida`) | Crítico neste epic: território server-side com fetch externo (OAuth callback, sync Google, webhook público) é exactamente onde findings de classe SSRF/segurança escapam ao `-t uncommitted`. O gate de saída corre CodeRabbit `--base main` (diff completo) nas stories de OAuth/webhook (6.1, 6.2, 6.7, 6.11, 6.12). |
| Alvo de waiver rate | Epic 5 fechou 0/13 (0%); Epic 4 0/10; Epic 2 0%. **Alvo Epic 6: 0%** — mas reconhecendo que é o epic de maior risco de segurança, espera-se mais iterações CR legítimas (não waivers). |
| Hard-stop QA loop | Máximo 2 iterações de `qa-loop-fix`/CR por story; Iter 3 ou merge waived exigem autorização humana explícita do Eurico no commit (trailer `Authorized-by:`). Mantido dos Epics 1-5. |
| **Revisão de segurança dedicada (quality gate PRD §10)** | O quality gate do PRD §10 Epic 6 = "Epic 1 + **revisão segurança tokens OAuth**". Recomendação `@pm`: **Architect Gate de Entrada** (lição positiva 4.8/5.7/5.11 §5.6) obrigatório para 6.1+6.2 (OAuth+storage) e 6.11+6.12 (webhook) — `@architect` ratifica decisões de segurança ANTES da implementação, não depois. Considerar `@qa` ou `@architect` a correr o `security-reviewer`/checklist OWASP nas stories de token. |

### Pré-requisitos a confirmar antes do arranque (não-bloqueantes da criação do epic, bloqueantes do arranque)

| # | Item | Responsável | Estado |
|---|------|-------------|--------|
| 1 | **Retrospectiva Epic 5** ainda pendente (`@po *retrospective epic-5`) — pode gerar acções A* novas a aplicar ao Epic 6 | `@po` (Pax) | Pendente (próximo passo do roadmap) |
| 2 | **Regra `internal-state-contract-gate.md`** confirmada a existir (roadmap P2.4: "antes do Epic 6") | `@aiox-master` / `@architect` | Verificar antes da 6.2/6.4 |
| 3 | **Decisão das 2 criticals `npm audit`** (cadeia `request` via `node-telegram-bot-api`) adiada para cá (roadmap P0.1) — resolver na 6.11 via GAP-6.4 | `@architect` + Eurico | Em aberto — parte do scope (§7 GAP-6.4) |
| 4 | **Credenciais Google OAuth** (Client ID/Secret/Redirect URI) + bot Telegram (BotFather token) provisionados em Vercel env (arch §9.2) | Eurico + `@devops` | Necessário antes da 6.1/6.11 (provisionamento de secret, padrão 4.8) |

## 9. Quality gates do epic

Trace PRD §10 Epic 6: "Epic 1 + revisão segurança tokens OAuth".

| Gate | Detalhe |
|------|---------|
| Pré-requisito | Epic 1 consolidado em main — SATISFEITO |
| **Revisão de segurança tokens OAuth** | Quality gate específico do PRD §10. Architect Gate de Entrada obrigatório para 6.1+6.2 (OAuth flow + token storage/refresh/revogação) e 6.11+6.12 (webhook secret token + decisão SDK). Foco: encriptação at-rest do refresh token (GAP-6.2), state/PKCE no OAuth (GAP-6.1), validação de origem do webhook (GAP-6.4). |
| Por story | lint + typecheck + test + CodeRabbit (CRITICAL bloqueia — NFR18); gate de saída CR `--base main` nas stories server-side (OAuth/webhook). |
| Teste de componente | A3 (`react-component-test-criteria.md`): vista Gmail (6.9) e UI definições OAuth (6.1) com ≥3 estados de render → teste de componente obrigatório, verificado no gate antes do CR. |
| Mock fidelity | A1 Epic 1 (`mock-protocol-fidelity.md`): mocks Google Calendar/Gmail API (6.3/6.4/6.8) e Telegram updates (6.12) reflectem o protocolo real (MSW handlers `google.ts`/`telegram.ts`, arch §5/ADR-4), com ≥1 teste que falharia se o shape divergisse. |
| Estado distribuído | A1 Epic 4 (`internal-state-contract-gate.md`): a 6.4 (sync push) e 6.2 (token lifecycle) fazem análise de ciclo de vida no gate `@architect`. |
| Cobertura | NFR17: ≥60% em packages core. Lógica de reconciliação de sync/parsing/roteamento em helpers puros (`lib/google/calendar.ts`, `lib/google/gmail.ts`, `lib/agent/tools/calendar.ts`/`gmail.ts`/`telegram.ts`) testados ~100% (padrão Epics 3/4/5). |
| AC performance | AC1 (OAuth <60s), AC2 (evento em <30s), AC4 (bot responde <3s) — verificar latência no gate das stories respectivas; o webhook Telegram (Edge) tem orçamento <5s (arch §4.1) para o fan-out. |
| Verificabilidade só-de-produção | A3 Epic 4: AC2/AC3/AC5 (e OAuth real) provavelmente exigem verificação manual em produção (chaves reais não mockáveis em CI) — mapear por AC no draft, padrão AC13 da 4.9. |

## 10. Próximo passo

**Epic 6 EM CURSO — 4/17 stories Done.** Sucessor natural do Epic 5 (FECHADO 13/13, waiver 0%) na ordem PRD §9 (`4 → 5 → 6`); o Epic 6 **bloqueia o Epic 7** (Voice + OCR integra-se com o canal Telegram). Os três sub-módulos (Calendar 6.1-6.6, Gmail 6.7-6.10, Telegram 6.11-6.17) assentam na fundação OAuth (6.1+6.2 — DONE). **O 2-way de calendário está COMPLETO: 6.3 (sync pull) e 6.4 (sync push) fechadas.** O sub-módulo Calendar está 4/6 — faltam 6.5 (cron sync delta) e 6.6 (tools cérebro calendário). O quality gate específico do PRD §10 ("revisão segurança tokens OAuth") concentra-se nas stories de OAuth/token/webhook, com Architect Gate de Entrada recomendado. Os GAPs restantes (`[GAP-6.3]`, `[GAP-6.4]`, `[GAP-6.5]`, `[GAP-6.6]`) ficam marcados para o `@architect` resolver no draft das stories respectivas.

**Próximas candidatas (sequência não rígida — `@sm`/`@po` confirmam paralelizabilidade):**
- **6.6 (tools cérebro calendário)** — `criar_evento_calendar`/`actualizar_evento_calendar`/`listar_eventos`. É o **produtor de eventos locais** que a route push da 6.4 (`/api/google/calendar/push`, hoje idempotente-vazia) passa a empurrar de facto para o Google — fecha funcionalmente o FR61/FR62 e dá vida ao push. Nomes já validados ASCII (nota §5). Gate `@architect`.
- **6.5 (cron Vercel diário para sync delta)** — dispara o sync delta de calendário e o trigger de classificação Gmail periodicamente; depende de 6.3/6.4 (ambas DONE). Executor `@devops`, gate `@architect`. Padrão do scheduler de push da 4.8.
- **6.11 (Telegram bot setup)** — sub-módulo **totalmente independente** do Google; pode arrancar em paralelo. Gate `@architect` (webhook + decisão SDK Telegram + 2 criticals `npm audit`, `[GAP-6.4]`).

### Próximas acções na sequência

1. **`@sm` (River)** — `*draft 6.6` (tools cérebro calendário — produtor de eventos locais para o push da 6.4) OU `*draft 6.5` (cron sync delta) OU `*draft 6.11` (Telegram setup, paralelo).
2. **`@architect` (Aria)** — **Architect Gate de Entrada** da story escolhida (recomendado para 6.6 por território de tools/classifier, e obrigatório para 6.11/6.12 por webhook + decisão SDK Telegram + 2 criticals `npm audit`, `[GAP-6.4]`).
3. **`@po` (Pax)** — `*validate-story-draft` (10-point checklist).
4. **`@dev` (Dex)** — `*develop` com o gate previsto.
5. **Eurico (humano, em paralelo, não-bloqueante):** provisionar os pré-requisitos OAuth reais (P1 Google Cloud Console + P2 Vercel env + P3 test user) para destrancar a verificação manual em produção dos AC deferidos (AC1 OAuth < 60s, AC2 evento < 30s — padrão AC13 da 4.9).

### Sequência sugerida (não rígida — `@sm`/`@po` confirmam paralelizabilidade)

- **6.1** (OAuth Calendar scope) → fundação. Bloqueante de todo o sub-módulo Google. Architect Gate de Entrada.
- **6.2** (refresh token storage) → depende de 6.1; pré-requisito de qualquer chamada Google autenticada. Architect Gate de Entrada.
- **6.3** (sync pull), **6.4** (sync push) → dependem de 6.1+6.2; 6.4 tem análise de estado distribuído.
- **6.5** (cron sync delta) → depende de 6.3/6.4 e serve também o trigger Gmail (6.8).
- **6.6** (tools calendário) → depende de 6.3/6.4 estarem disponíveis.
- **6.7** (OAuth Gmail scope) → incremental sobre 6.1/6.2 (adiciona scope `gmail.modify`).
- **6.8** (classifier Gmail) → depende de 6.7; **6.9** (vista Gmail) → depende de 6.8; **6.10** (tools Gmail) → depende de 6.8.
- **6.11** (Telegram setup) → independente do sub-módulo Google; pode arrancar cedo, em paralelo com 6.1. Architect Gate de Entrada (webhook + SDK + criticals).
- **6.12** (webhook handler) → depende de 6.11; **6.13** (texto → cérebro) → depende de 6.12.
- **6.14** (voz → transcrição) → depende de 6.12 + decisão GAP-6.3.
- **6.15** (foto → OCR) → **parcial/diferida** (depende do Epic 7).
- **6.16** (lembretes + briefing via Telegram) → depende de 6.11/6.12 + reutiliza disparo de lembretes do Epic 4.
- **6.17** (tool `enviar_telegram`) → depende de 6.11/6.12.

> Os 3 sub-módulos (Calendar 6.1-6.6, Gmail 6.7-6.10, Telegram 6.11-6.17) são largamente independentes entre si: o Telegram (6.11+) pode correr em paralelo com o Google desde o início; o Gmail (6.7+) depende do OAuth do Calendar (6.1/6.2) por partilharem o cliente OAuth. Paralelizáveis se `@sm` criar stories independentes (precedente Epics 2/3 paralelos).

### Riscos do Epic 6

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| R1 | **Refresh token Google comprometido / mal armazenado** (`[GAP-6.2]`) — acesso ao calendário e Gmail do Eurico | Baixa | Alto | Encriptação at-rest em KV (decisão 6.2); revisão de segurança dedicada (quality gate PRD §10); revogação + limpeza em definições; token server-only (NFR6). |
| R2 | **Webhook Telegram público recebe input malicioso** (`[GAP-6.4]`) — endpoint exposto à internet | Média | Médio | Validação obrigatória do `secret_token` (arch §9.5) — rejeitar 401; rate limiting Edge (arch §9.3, 60 req/min); só processa updates do `chatId` do Eurico. |
| R3 | **2 vulnerabilidades critical na cadeia `request` (`node-telegram-bot-api`)** entram em produção (roadmap §1/P0.1, `[GAP-6.4]`) | Alta (se não decidido) | Alto | Decisão de SDK no draft da 6.11: migrar para `grammY`/`telegraf` ou usar Bot API por `fetch` directo (Edge favorece `fetch`, elimina o SDK Node-only e as criticals). Decisão `@architect` + Eurico. |
| R4 | **Custo de tokens dispara** com classificação Gmail (FR65) — 50 emails × Sonnet/Haiku por trigger (PRD §11 R2) | Média | Médio | Cache por `msgId` (TTL 7d, arch §6); classificar só emails novos não classificados; rate limit por dia; usar Haiku para a triagem. |
| R5 | **Mock Google/Telegram diverge do protocolo real** (A1 `mock-protocol-fidelity.md`) — tests passam, sync/classificação falham em produção | Média | Médio | MSW handlers `google.ts`/`telegram.ts` (ADR-4) reflectem o shape real das respostas; ≥1 teste que falharia se o protocolo divergisse (6.3/6.4/6.8/6.12). |
| R6 | **Sync 2-way de calendário cria loop ou duplicados** (`[GAP-6.4]` da 6.4, `internal-state-contract-gate.md`) — evento sincronizado em ciclo | Média | Médio | Gate `@architect` da 6.4 faz análise de ciclo de vida; uso de syncToken/etag Google; idempotência por ID de evento. |
| R7 | **OAuth Google exige verification se >100 utilizadores** (PRD §11 R4) | Baixa | Baixo | Single-user — sempre <100, fica em test mode permanente. Documentar na 6.1. |
| R8 | **Transcrição de voz via Telegram inviável server-side** (`[GAP-6.3]`, FR72) — Web Speech é browser-only | Média | Baixo | `@architect` decide na 6.14: transcrição server-side (Anthropic) ou voz via Telegram fora de scope (texto-only) até existir solução. Não bloqueia o resto do epic. |

---

*Epic 6 preparado por Morgan (`@pm`) em 16/06/2026. Ancorado em `PRD-NEXUS-V2.md` §6.11 + §6.12 + §6.13 + §9 (Bloqueia: 7) + §10 Epic 6 (Stories 6.1-6.17, AC1-AC5, quality gate "revisão segurança tokens OAuth"), `architecture-v2.md` (ADR-1 split Edge/Node + §4.1 runtime por endpoint + §6 KV schema tokens + §7.2 domínios calendar/gmail/telegram + §9.2 secrets + §9.4 CSP + §9.5 webhook secret token), `AUDITORIA-20260612-ROADMAP-CONCLUSAO.md` (§1 npm audit 2 criticals adiados para cá + P0.1 + P2.4) e Retrospectivas Epic 1 (A1/A2/A6), Epic 2 (A1/A2/A4), Epic 3 (A1-A7), Epic 4 (A1-A7) e Epic 5. Zero invenção — cada FR, story e AC traça a uma secção do PRD; os 6 GAPs (`[GAP-6.1]` a `[GAP-6.6]`) estão explicitamente marcados para o draft, com foco de segurança nos tokens OAuth (GAP-6.2) e no webhook público (GAP-6.4).*
