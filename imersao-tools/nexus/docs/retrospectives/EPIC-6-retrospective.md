# Retrospectiva — Epic 6 Nexus v2 (OAuth Google Calendar + Gmail + Telegram)

> **Autor:** Pax (`@po`) | **Data:** 23/06/2026
> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Branch consolidação:** `main` (16 stories implementáveis merged via PRs #75-#90; closure commit Story 6.17 `3792ffe3`)
> **Período:** 17/06/2026 → 23/06/2026 (UTC+1, Lisboa)
> **Referência de formato:** `retrospectives/EPIC-5-retrospective.md` + `EPIC-4` + `EPIC-3` + `EPIC-2` + `EPIC-1`
> **Estado de fecho:** **16/17 — Epic 6 fechado com a 6.15 (foto→OCR, FR73) diferida ao Epic 7** (dependência externa não satisfeita: OCR não existe ainda). Critério de fecho: 16/16 stories implementáveis Done; a 17.ª (6.15) depende do Epic 7.

---

## 1. Sumário executivo

- **16/17 stories Done** em main (todas as implementáveis: 6.1-6.14, 6.16, 6.17). A única pendente é a **6.15 (foto recibo → OCR, FR73)**, **diferida ao Epic 7** porque depende de OCR (FR81/Epic 7) que ainda não existe — não é re-trabalho nem débito, é uma dependência externa não satisfeita. **O Epic 6 fecha com os três sub-módulos entregues: Calendar 6/6 (6.1-6.6), Gmail 4/4 (6.7-6.10), Telegram 6/7 (6.11-6.14, 6.16, 6.17).**
- **Waiver rate final: 0/16 (0%)** — nenhuma das 16 stories implementáveis fechou com merge waived. **Iguala o melhor padrão de sempre** (Epic 2 0/10, Epic 4 0/10, Epic 5 0/13) no epic de **maior superfície de segurança do roadmap** (refresh tokens OAuth de longa duração + webhook público + scopes `calendar`+`gmail.modify`).
- **Primeiro epic de integrações externas autenticadas do Nexus.** Pela 1.ª vez o Nexus delega autenticação a um terceiro (Google) e armazena refresh tokens de longa duração server-side; e abre o 1.º endpoint público de entrada (`/api/telegram/webhook`, Edge) que recebe input não-solicitado da internet. O quality gate específico do PRD §10 ("Epic 1 + revisão segurança tokens OAuth") foi satisfeito com Architect Gate de Entrada sistemático nas stories de risco.
- **Cobertura funcional: 18 dos 19 FRs (FR58-FR76).** Só o FR73 (foto recibo → OCR, Story 6.15) fica por entregar — diferido ao Epic 7 por dependência de OCR. Os 5 Epic ACs (§6 do `EPIC-6.md`): AC1 (OAuth <60s — 6.1/6.7), AC2 (evento aparece no Google <30s — 6.4), AC3 (classificação Gmail ≥80% — 6.8), AC4 (bot responde "olá" <3s — 6.12/6.13), AC5 (lembrete dispara push+Telegram — 6.16) — todos implementados; AC1/AC2/AC3/AC4/AC5 com componente de verificação manual em produção (chaves/contas reais não mockáveis em CI — padrão AC13 da 4.9, mapeado por AC no draft).
- **Padrão ADR-9 (tool client-side → route Node via `ctx.fetch`) reutilizado com sucesso em Gmail e Telegram.** O achado central do Architect Gate da 6.10 (o executor de tools corre client-side; `ctx.kv`/`getValidAccessToken()` são Node-only → as tools só podem usar `ctx.fetch` para routes server-side same-origin) tornou-se o padrão canónico das tools com efeito externo: aplicado na 6.10 (Gmail), 6.13 (texto→cérebro via bridge Node cookieless) e 6.17 (`enviar_telegram` → route Node `/api/telegram/send`). Aplicação directa da lição §5.3 do Epic 5 (reutilizar lógica de outro runtime força um seam explícito).
- **Anti-SSRF aplicado preventivamente: `chat_id` server-side, nunca aceite do cliente (6.17).** A lição central do Epic 5 (§5.1 — Critical SSRF por origin/cookie controlável) foi internalizada: a tool `enviar_telegram` (6.17) tem `argsSchema` só `{text}`, SEM `chat_id` — o destinatário é lido server-side de `TELEGRAM_CHAT_ID`. Nenhum Critical de segurança escapou ao gate neste epic — contraste directo com a 5.11.
- **`[GAP-6.4]` resolvido eliminando 2 vulnerabilidades critical de produção.** A decisão de SDK Telegram (ratificada pelo Eurico = Bot API por `fetch` directo, sem SDK) removeu `node-telegram-bot-api` do `package.json`+lockfile → as 2 criticals `npm audit` da cadeia `request`/`form-data` foram **eliminadas** (5→3 criticals; as 3 restantes são devDeps `vitest` pré-existentes fora de scope). Evidência antes/depois no Change Log da 6.11 (`package.json` é path bloqueador, `not-tested-trailer-rules.md`).
- **Lição central do epic — a regra `cr-base-main-no-gate-saida` (acção A1 do Epic 5) provou o seu valor no Epic 6.** A 6.17 mostra-o em concreto: o CR `--base main` no gate de saída deu 0 findings, mas o **CodeRabbit server-side no PR #90** apanhou um bug de produção (F1: body JSON não-objecto → crash 500 vs 400 esperado) que o `-t uncommitted` local não apanharia. Padrão idêntico em 6.11 (F1 timeout/`getMe` 502-vs-400) e 6.16 (3 Major reais `env.ts` `.refine` + mock-protocol). O CR server-side continua a ser a rede de segurança que apanha semântica de produção fina — ver §5.1.
- **`internal-state-contract-gate.md` (acção A1 do Epic 4) aplicada sistematicamente — o epic-alvo da regra.** A regra nasceu explicitamente "para existir antes do Epic 6" (roadmap P2.4). Foi exercitada na 6.2 (token lifecycle válido→expirado→renovado→revogado), 6.4 (sync push estado distribuído + anti-loop estrutural), 6.16 (`markScheduleSent` SÓ após TODOS os canais OK — anti silent-loss M1 da 4.9) e 6.17 (envio stateless, todos os caminhos de falha propagam Error, nunca `200{ok:false}` — anti-M4 da 4.9). Os 3 eixos foram assinados contra código real em cada gate.
- **Vercel production live** continuamente em `https://imersao.ia.expressia.pt`. Os AC de produção do Epic 6 (OAuth real, sync <30s, classificação ≥80%, bot <3s, push+Telegram) dependem de pré-requisitos de produção P1-P5 (Eurico + `@devops`: env Google OAuth + Telegram + `CRON_SECRET` + scheduler externo do briefing + invocar `setWebhook` 1× pós-deploy) — não-bloqueantes do fecho do epic (padrão AC13 da 4.9).

---

## 2. Métricas concretas

### 2.1 — Stories e iterações CodeRabbit

| Métrica | Valor | Observação |
|---------|-------|------------|
| Total stories do epic | 17 | 6.1 → 6.17 |
| Stories implementáveis (sem dependência externa) | **16** | Todas excepto a 6.15 (depende do OCR/Epic 7) |
| Stories implementáveis Done | **16/16** | Todas as que não dependem do Epic 7 |
| Stories diferidas | 1 | 6.15 (foto→OCR, FR73) — diferida ao Epic 7 |
| Stories com GO de validação `@po`/Architect Gate de Entrada à 1.ª passagem | **16/16** | Nenhuma story implementável rejeitada na validação |
| Stories com 0 iterações CR no PR (gate-limpo) | vários | ex: 6.3 (CR `--base main` 0 findings Iter 1), 6.4 (0 Iter 1), 6.12 (0 Iter 1) |
| Stories com iterações CR ≤2 | 16/16 | Hard-stop §8 (máx 2 iter) respeitado sem autorização em todas |
| Stories que ultrapassaram o hard-stop §8 | **0** | Contraste com a 5.11 do Epic 5 (3 iter por Critical SSRF) — nenhuma story do Epic 6 precisou de iter 3+ |
| Waiver rate ("merge waived") | **0/16 (0%)** | Nenhuma story fechou via waiver — iguala Epic 2/4/5 |

> **Nota sobre "quality gate" vs "CodeRabbit":** o quality gate AIOX (PO Validation / QA Gate Quinn / Architect Gate de Entrada+Saída Aria / `@dev` gate) é camada distinta das iterações CodeRabbit no PR. Distinção mantida desde a Retrospectiva Epic 1. A particularidade do Epic 6: graças à acção A1 do Epic 5 (`cr-base-main-no-gate-saida`), o CR `--base main` passou a correr no gate de saída — apanhando a maioria dos findings *antes* do PR. Mesmo assim, o CR server-side no PR continuou a apanhar bugs de produção fina (6.11/6.16/6.17) que mais nenhuma camada apanhava — ver §5.1.

### 2.2 — Distribuição por story (detalhe)

| Story | Executor → Gate | Gate AIOX | Iter CR (PR) | Resultado | Autorização |
|-------|-----------------|-----------|--------------|-----------|-------------|
| 6.1 — OAuth flow Google (Calendar scope) | `@dev` → `@architect` | PASS (gate entrada OAuth segurança) | ≤2 | Merge limpo | — |
| 6.2 — Refresh token storage Vercel KV | `@dev` → `@architect` | PASS (token lifecycle, encriptação at-rest AES-256-GCM) | ≤2 | Merge limpo | — |
| 6.3 — Sync calendário pull | `@dev` → `@qa` | PASS (helper puro 96,62%, fix D-6.3-POSITIVE-EPOCH) | 0 (CR `--base main` 0 findings Iter 1) | Merge limpo | — |
| 6.4 — Sync calendário push | `@dev` → `@architect` | PASS (estado distribuído + anti-loop estrutural) | 0 (CR `--base main` 0 findings Iter 1) | Merge limpo | — |
| 6.5 — Cron Vercel sync delta | `@devops` → `@architect` | PASS (orquestrador pull→push) | ≤2 | Merge limpo | — |
| 6.6 — Tools cérebro calendário | `@dev` → `@architect` | PASS (3 tools domínio `calendar`) | ≤2 | Merge limpo | — |
| 6.7 — OAuth incremental Gmail scope | `@dev` → `@architect` | PASS (achado: `prompt=consent` sobrescreve refresh) | 2 (CR `--base main` Iter 2 0 findings) | Merge limpo | — |
| 6.8 — Classifier Gmail 4 buckets | `@dev` → `@architect` | PASS (helper puro 96,38%, Anthropic directo server-side) | 2 (CR `--base main` 2 iter → 0) | Merge limpo | — |
| 6.9 — Vista Gmail no dashboard | `@ux-design-expert` → `@dev` | PASS (5 estados de render, Zod runtime no fix) | 2 (0 Major) | Merge limpo | — |
| 6.10 — Tools cérebro Gmail | `@dev` → `@architect`/`@qa` | PASS High (achado ADR-9 central: tool client-side → `ctx.fetch`) | 2 (CodeQL HIGH ReDoS + 3 Major + 2 Minor → 0) | Merge limpo | — |
| 6.11 — Telegram bot setup | `@dev` → `@architect` | PASS-COM-CONDIÇÕES (GAP-6.4 resolvido, 2 criticals eliminadas) | 2 (Iter 1 2 Major código + 2 doc → Iter 2 APPROVED) | Merge limpo | — |
| 6.12 — Webhook handler | `@dev` → `@architect` | PASS High (handler Edge real, C1-C9, fail-closed C2) | 0 (CR `--base main` 0 findings Iter 1) | Merge limpo | — |
| 6.13 — Texto → cérebro multi-intent | `@dev` → `@qa` | PASS (gate entrada 6 `[D-6.13-*]` + saída, bridge cookieless C11) | 0 critical/0 major (1 minor) | Merge limpo | — |
| 6.14 — Voz → transcrição (stub) | `@dev` → `@architect` | PASS (GAP-6.3 resolvido: DESBLOQUEADO-COMO-STUB) | gate de saída + CR `--base main` deferido `@devops` | Merge limpo | — |
| **6.15 — Foto → OCR** | `@dev` → `@architect` | **N/A — diferida ao Epic 7** (OCR não existe) | — | **Draft (diferida)** | — |
| 6.16 — Bot envia lembretes + briefing matinal | `@dev` → `@qa` | PASS (gate entrada 5 `[D-6.16-*]` + C1-C16 + 3 eixos) | 1 (3 Major reais: `env.ts` `.refine` + 2 MSW → limpo) | Merge limpo | — |
| 6.17 — Tool cérebro `enviar_telegram` | `@dev` → `@architect` | PASS High (gate entrada 5 `[D-6.17-*]` + C1-C7 + saída) | 2 (Iter 1 F1/F3 Major + F2 Minor → Iter 2 APPROVED) | Merge limpo | — |

**Síntese:** 0 waivers em 16 stories implementáveis. **Nenhuma ultrapassou o hard-stop §8** (contraste com a 5.11). O Architect Gate de Entrada foi aplicado em todas as stories de risco (OAuth, token, webhook, sync de estado externo, parsers AI, tools com efeito externo) — exactamente o território que o PRD §10 marcou para revisão de segurança. Os pares executor≠gate respeitaram `separation-of-roles.md` em todas.

### 2.3 — Velocidade do epic

| Métrica | Valor |
|---------|-------|
| Story 6.1 merged (PR #75 `e7e4994d`) | 17/06/2026 00:18 |
| Story 6.17 merged (PR #90 `5f3ab475`) | 23/06/2026 13:38 |
| Closure commit Story 6.17 (`3792ffe3`) | 23/06/2026 16:38 |
| **Duração total** | **~6 dias corridos** |
| Stories implementáveis/dia (média) | ~2,67 (16 stories / 6 dias) |
| Dia mais denso | 18/06 (6.4 + 6.6 + 6.5 + 6.7 merged — 4 stories) e 19/06 (6.8 + 6.9 + 6.10 — 3 stories) |

> O Epic 6 foi o **mais rápido de sempre por story implementável** (~2,67/dia vs ~1,63 do Epic 5), apesar de ser o epic de maior risco de segurança. Razões: três sub-módulos largamente independentes (Calendar/Gmail/Telegram correram em paralelo), o Architect Gate de Entrada cortou o re-trabalho à entrada (norma desde o Epic 5), e o padrão ADR-9 + helper puro estava já maduro dos Epics 3/4/5. A 6.1-6.6 (Calendar) e 6.7-6.10 (Gmail) fecharam em ~3 dias; o sub-módulo Telegram (6.11-6.17) em ~4 dias.

### 2.4 — Cronologia de merges em main

| Story | PR | Squash commit | Data de merge |
|-------|-----|---------------|---------------|
| 6.1 — OAuth Calendar scope | #75 | `e7e4994d` | 17/06/2026 |
| 6.2 — Refresh token storage | #76 | `1621e8a6` | 17/06/2026 |
| 6.3 — Sync calendário pull | #77 | `e149fc76` | 17/06/2026 |
| 6.4 — Sync calendário push | #78 | `22c984d7` | 18/06/2026 |
| 6.6 — Tools cérebro calendário | #79 | `eead5486` | 18/06/2026 |
| 6.5 — Cron sync delta | #80 | `105392b5` | 18/06/2026 |
| 6.7 — OAuth Gmail scope | #81 | `95772288` | 18/06/2026 |
| 6.8 — Classifier Gmail 4 buckets | #82 | `010f1db4` | 19/06/2026 |
| 6.9 — Vista Gmail no dashboard | #83 | `04b724b8` | 19/06/2026 |
| 6.10 — Tools cérebro Gmail | #84 | `5f0df386` (+ follow-up `134843ac`) | 19/06/2026 |
| 6.11 — Telegram bot setup | #85 | `7c6e141c` | 20/06/2026 |
| 6.12 — Webhook handler | #86 | `f8ca42c4` | 21/06/2026 |
| 6.13 — Texto → cérebro multi-intent | #87 | `2ed54bd8` | 21/06/2026 |
| 6.14 — Voz → transcrição (stub) | #88 | `30e22adb` | 22/06/2026 |
| 6.16 — Lembretes + briefing matinal | #89 | `476d66ae` | 23/06/2026 |
| 6.17 — Tool `enviar_telegram` | #90 | `5f3ab475` | 23/06/2026 |

> A 6.6 (tools calendário) mergeou antes da 6.5 (cron) — paralelizabilidade dos sub-módulos. PR #85-#90 (Telegram) seguiram a ordem numérica (excepto a 6.15, diferida). A 6.10 teve um follow-up test-only (`134843ac`) com os testes de falha de transporte das tools Gmail, no mesmo dia.

### 2.5 — Evolução da suite de testes

> Snapshots datados das stories (convenção A5 do Epic 3 — contagens vivem no Change Log/Dev Record, não em headers). A baseline de fecho do Epic 5 era 1896; a 6.1 abriu o Epic 6 já em 1938 (deltas acumulados na suite vitest desde o fecho do Epic 5).

| Marco | Testes (vitest) | Fonte |
|-------|-----------------|-------|
| Fim Epic 5 (baseline) | 1896/1896 | Retrospectiva Epic 5 |
| Story 6.1 | 1938/1938 | Story 6.1 Change Log |
| Story 6.2 | 1965/1965 | Story 6.2 Change Log |
| Story 6.4 | 2018/2018 | Story 6.4 Change Log |
| Story 6.6 | 2038/2038 | Story 6.6 Change Log |
| Story 6.8 | 2126 (+33) | EPIC-6.md §5 (6.8) |
| Story 6.9 | 2147/2148 | Story 6.9 Change Log (1 flake `oauth-status` pré-existente isolado-PASS) |
| Story 6.10 | 2188/2189 | Story 6.10 Change Log |
| Story 6.11 | 2224 (26+4) | EPIC-6.md §5 (6.11) |
| Story 6.12 | 2249 | EPIC-6.md §5 (6.12) |
| Story 6.13 | 2266 (2265 PASS) | EPIC-6.md §5 (6.13) |
| Story 6.14 | 2280 | EPIC-6.md §5 (6.14) |
| Story 6.16 | 2316 (+36) | EPIC-6.md §5 (6.16) |
| **Story 6.17 (estado final em main)** | **2352** | EPIC-6.md §5 (6.17) |

**Delta Epic 6: +456 testes** (1896 → 2352). Crescimento de ~24% na suite. Puxado pelos três sub-módulos (helpers puros Google + tools cérebro + 5 estados de render da vista Gmail) e pelos testes anti-tautológicos de protocolo e segurança: os testes de fidelidade Google/Telegram MSW (mock-protocol-fidelity), o teste RFC 2047 do subject Gmail (6.10), e os testes fail-closed do webhook/bridge Telegram (6.11/6.12/6.13/6.17). O flake `oauth-status` pré-existente (passa isolado 6/6) acompanhou todo o epic sem regredir a baseline.

### 2.6 — Cobertura

Todas as 16 stories implementáveis cumpriram NFR17 (≥60% em packages core) e os thresholds AC. Padrão "helper puro testável ~100% + route/componente/tool fina" mantido dos Epics 3/4/5:
- Story 6.3 — `lib/google/calendar.ts` 96,62%.
- Story 6.4 — `lib/google/calendar-push.ts` 100%.
- Story 6.8 — `lib/google/gmail.ts` 96,38%.
- Story 6.10 — `lib/google/gmail.ts` 92,26% (tools reutilizam helpers e routes existentes, open-closed).
- Story 6.11-6.17 — `lib/telegram/bot-api.ts` Edge-safe + bridges Node testados; tools cérebro (`lib/agent/tools/**` na allowlist de coverage desde 5.10).

---

## 3. Loved — o que funcionou bem

### 3.1 — O padrão ADR-9 (tool client-side → route Node via `ctx.fetch`) tornou-se canónico para tools com efeito externo

O achado central do Architect Gate da 6.10 (Aria) — o executor de tools corre **client-side** (ADR-9; `ctx.kv` é `noKvStub` que lança, `getValidAccessToken()` é Node-only), pelo que as tools com efeito externo só podem usar `ctx.fetch` para routes server-side same-origin — passou a ser o **padrão canónico** do epic. Aplicado em três stories independentes: 6.10 (Gmail: +2 routes Node novas `draft`/`archive`), 6.13 (texto→cérebro: bridge Node `process-text` cookieless porque o proxy Edge é cookie-gated), 6.17 (`enviar_telegram` → route Node `/api/telegram/send`). É a aplicação directa da lição §5.3 do Epic 5 (quando um runtime precisa de lógica que vive noutro, força-se um seam explícito) — desta vez antecipada no gate de entrada, não descoberta no gate de saída. **Evidência:** Architect Gates de Entrada de 6.10/6.13/6.17 (`[D-6.10-RUNTIME]`, `[D-6.13-RUNTIME]`, `[D-6.17-*]`).

### 3.2 — Anti-SSRF internalizado da lição central do Epic 5 — nenhum Critical de segurança escapou ao gate

A lição §5.1 do Epic 5 (Critical SSRF na 5.11 por origin/cookie controlável) foi internalizada preventivamente neste epic — o de maior superfície de segurança. Exemplos: a tool `enviar_telegram` (6.17) tem `argsSchema` só `{text}`, **SEM `chat_id`** — o destinatário é lido server-side de `TELEGRAM_CHAT_ID`, nunca aceite do cliente (`[D-6.17-CHATID]`, anti-SSRF); o token completo e o `secret_token` Telegram **nunca** entram em KV (6.11 `[D-6.11-KV-SCHEMA]` — só `tokenHint` últimos 4 chars); o `secret_token` do webhook é validado byte-a-byte com fail-closed (6.12 C2: segredo ausente → 403 incondicional ANTES de comparar headers). **Resultado:** zero Criticals de segurança escaparam ao gate em todo o epic — contraste directo com a 5.11. **Evidência:** Architect Gates de 6.11/6.12/6.17.

### 3.3 — `[GAP-6.4]` resolvido eliminando 2 vulnerabilidades critical de produção (decisão de SDK)

A decisão de SDK Telegram (`[GAP-6.4]`, adiada do roadmap P0.1 para cá) foi ratificada pelo Eurico = **Bot API por `fetch` directo, sem SDK**. Isto removeu `node-telegram-bot-api` do `package.json`+lockfile, **eliminando as 2 vulnerabilidades critical** da cadeia `request`/`form-data` (`npm audit` 5→3 criticals; as 3 restantes são devDeps `vitest` pré-existentes fora de scope). A decisão alinha-se com o runtime: o webhook é Edge, que não corre SDKs Node-only — `fetch` directo é o caminho natural. Evidência antes/depois registada no Change Log da 6.11 (`package.json` é path bloqueador por `not-tested-trailer-rules.md`). **Um epic que entra com uma dependência vulnerável e sai com menos vulnerabilidades do que entrou.**

### 3.4 — Architect Gate de Entrada como norma — confirmado pela 2.ª vez consecutiva

O padrão que se tornou norma no Epic 5 (§5.4) confirmou-se no Epic 6: praticamente todas as stories de risco tiveram Architect Gate de Entrada explícito com decisões `[D-6.x-*]` ratificadas antes de uma linha de código (6.7, 6.8, 6.10, 6.11, 6.12, 6.13, 6.14, 6.16, 6.17). A Aria ratificou as decisões-âncora no arranque; a `@dev` implementou directamente a abordagem certa; o gate de saída confirmou contra código real. **Resultado:** o ritmo mais alto de sempre (~2,67 stories implementáveis/dia) num epic de território novo e alto risco, com 0 stories a ultrapassar o hard-stop §8. **Evidência:** secções "Architect Gate de Entrada" das stories respectivas.

### 3.5 — `internal-state-contract-gate.md` aplicada no seu epic-alvo — silent-loss e falha-como-sucesso evitados à entrada

A regra (acção A1 do Epic 4) foi explicitamente criada "para existir antes do Epic 6" (roadmap P2.4). Foi exercitada nos pontos exactos para que foi desenhada: a 6.2 (token lifecycle válido→expirado→renovado→revogado), a 6.4 (sync push: estado criado→sincronizado→conflito, com anti-loop estrutural via `&googleId` único esparso), a 6.16 (`markScheduleSent` SÓ após TODOS os canais OK — replica a defesa contra o silent-loss M1 da 4.9 para o caso multi-canal push+Telegram) e a 6.17 (envio stateless; falha NUNCA `200{ok:false}`, sempre 401/400/503/502 — anti-M4 da 4.9). Os 3 eixos (classes de estado / transição-já-ocorrida / caminhos de falha) foram assinados contra código real em cada gate. **A regra que custou 4 Major à 4.9 evitou que o mesmo padrão explodisse no epic de mais estado distribuído.** **Evidência:** análise 3 eixos nos gates de 6.2/6.4/6.16/6.17.

### 3.6 — Aplicação efectiva das regras nascidas de epics anteriores

| Regra / acção anterior | Estado no Epic 6 |
|------------------------|------------------|
| **A1 Epic 5 — `cr-base-main-no-gate-saida`** | Aplicada. O CR `--base main` correu no gate de saída das stories server-side (6.3/6.4/6.12/6.17 com 0 findings no gate). A regra apanhou findings *antes* do PR — mas o CR server-side continuou a apanhar bugs de produção fina que mais nada apanha (§5.1). |
| **A1 Epic 4 — `internal-state-contract-gate.md`** | Aplicada na 6.2, 6.4, 6.16, 6.17 (o epic-alvo da regra). 3 eixos assinados contra código real. Ver §3.5. |
| **A4 Epic 3 — `external-contract-identifiers.md`** | Aplicada no draft do epic. Os 7 nomes de tools (6.6/6.10/6.17) validados ASCII no `EPIC-6.md` §5 (nota preventiva — "evento"/"actualizar"/"emails" sem acento) → nenhuma reconciliação de nomes (vs 3.11). `GAP-6.5-FINAL` encerrado na 6.17 com `classifier-system.ts` intocado. |
| **A1 Epic 1 — `mock-protocol-fidelity.md`** | Aplicada aos mocks Google Calendar/Gmail API (6.3/6.4/6.8) e Telegram updates (6.12/6.13). Os 3 Major da 6.16 (CR Iter 1) incluíam 2 capture-handlers MSW que não validavam `typeof body.text` — exactamente a fidelidade de protocolo. ≥1 teste falharia se o shape divergisse. |
| **A3 Epic 3 — `react-component-test-criteria.md`** | Aplicada preventivamente. A vista Gmail (6.9, 5 estados de render: loading/empty/content/erro-oauth/erro-fetch) teve teste de componente exigido no gate ANTES do CR. |
| **A6 Epic 1 — `separation-of-roles.md`** | Aplicada em 16/16 stories. OAuth/token/webhook/sync/parsers AI/tools (risco) → gate `@architect`; UI pura (6.9) → executor `@ux-design-expert`, gate `@dev`; roteamento/texto sem efeito externo (6.13) → gate `@qa`; cron (6.5) → executor `@devops`. |
| **A2 Epic 4 — varredura de bug-de-classe nas camadas adjacentes** | Aplicada na 6.7 (achado `prompt=consent` sobrescreve refresh combinado → verificado o seam AES-256-GCM da 6.2) e na 6.11 (timeout `AbortController` aplicado ao helper + `getMe` no mesmo ciclo). |
| **A3 Epic 4 — mapa de verificabilidade por AC** | Aplicada em todas as stories: AC1/AC2/AC3/AC4/AC5 mapeados como verificação manual de produção no draft (chaves/contas reais não mockáveis — padrão AC13 da 4.9). |

**O ciclo retrospectiva → regra → aplicação produziu resultados pela 5.ª vez consecutiva** (Epic 2, 3, 4, 5 e agora 6) — e o Epic 6 foi o teste de stress da regra `internal-state-contract-gate.md`, que foi desenhada especificamente para ele.

---

## 4. Os débitos não-bloqueadores

Nenhum é bloqueador. O Epic 6 gerou apenas débitos Baixa e a 6.15 diferida (que não é débito — é dependência externa). Manteve os herdados por coerência de domínio.

### 4.1 — A 6.15 diferida (não é débito — é dependência externa não satisfeita)

| Item | Detalhe |
|------|---------|
| Story | 6.15 (foto recibo → OCR → finança, FR73) |
| Razão | Depende de OCR (FR81/Epic 7 — Claude Vision), que **não existe ainda**. Marcada como parcial/diferida desde o draft do epic (`EPIC-6.md` §3, §5, §7 GAP-6.6). |
| Decisão | Diferida ao Epic 7, onde existe a 7.9 ("foto recibo via Telegram → OCR → finança"). Não implementar OCR no Epic 6 (fora de scope; é FR81/Epic 7). |
| Estado | **Draft.** O Epic 7 desbloqueia-a. O webhook Telegram já reconhece a foto (a 6.12 parseia `photo`); falta só o pipeline OCR→finança. |

### 4.2 — Novos débitos Baixa do Epic 6 (deferidos no Change Log das stories)

| # | Débito | Severidade | Origem | Recomendação |
|---|--------|-----------|--------|--------------|
| REC-6.4-PATCH / REC-6.4-ICALUID | Sync push: usar `events.patch` (vs `update`) e `iCalUID` para dedupe mais robusto | Baixa | Story 6.4 | Housekeeping de sync; allowlist actual cobre |
| REC-6.7-REFRESH-SCOPES / REC-6.7-REFRESH-TEST | Refinamento do refresh com scopes combinados + teste adicional | Baixa | Story 6.7/6.8 | Já resolvido em `token-store.ts` na 6.7; teste é housekeeping |
| REC-6.8-FIDELITY-WEAK | Reforçar fidelidade de mock do classifier Gmail | Baixa | Story 6.8 | Reforço de teste; não-bloqueador |
| REC-6.10-THREADING | `criar_draft_gmail` com `replyToMsgId` (threading de respostas) | Baixa | Story 6.10 | Funcionalidade adicional; deferida |
| REC-6.11-* (COHERENCE/RATELIMIT/ARCH-SCHEMA/TIMING/WEBHOOK-SECRET-ENV) | Hardening do setup/webhook Telegram (rate-limit defesa-em-profundidade single-user, etc.) | Baixa | Story 6.11/6.12 | Defesa-em-profundidade; single-user mitiga |
| REC-6.13-DB-BRIDGE / REC-6.13-WAITUNTIL | Tools de mutação via Telegram (`db:null` hoje) + `event.waitUntil` para fire-and-forget mais fiável | Baixa | Story 6.13 | Funcionalidade adicional; deferida |
| REC-6.14-TRANSCRIPTION-FUTURE | Transcrição real de voz Telegram (hoje stub `VOICE_DEFERRED_MESSAGE_PT`) | Baixa | Story 6.14 | Depende de mecanismo de transcrição server-side; candidata a Epic 7/Voice |
| REC-6.16-BRIEFING-RICH / CHATID-PREFLIGHT / BRIEFING-LEASE | Briefing matinal com dados Dexie ricos + preflight `chatId` + lease anti-corrida | Baixa | Story 6.16 | Conteúdo hoje honesto só server-side; deferido |
| TEST-001 | Asserções de descrição/contagem em `finance.test.ts`/`projects.test.ts` (housekeeping) + handler MSW `sendMessage` não valida `chat_id` | Baixa (advisory) | Story 6.10/6.13 | Housekeeping de testes |

**Síntese:** débitos Baixa novos, **0 Média/Alta** — mantém o padrão de maturidade dos Epics 3/4/5. A maioria são funcionalidades adicionais deferidas (threading Gmail, transcrição de voz real, briefing rico, tools de mutação via Telegram) e hardening de defesa-em-profundidade mitigado pelo facto de o Nexus ser single-user. REC-6.14-TRANSCRIPTION-FUTURE é candidata natural ao Epic 7 (Voice). O backlog de manutenção acumulado dos Epics 3/4/5 mantém-se (ver A3 da retrospectiva Epic 5).

---

## 5. Learned — lições do epic

### 5.1 — O CR `--base main` no gate de saída apanha cedo, mas o CR server-side no PR continua a apanhar bugs de produção fina (LIÇÃO CENTRAL — confirma a A1 do Epic 5)

| Item | Detalhe |
|------|---------|
| **Onde** | Stories 6.11 (PR #85), 6.16 (PR #89), 6.17 (PR #90) |
| **Contexto** | A acção A1 do Epic 5 (`cr-base-main-no-gate-saida`) foi aplicada: o gate de saída correu o CodeRabbit `--base main` (diff completo), não só `-t uncommitted`. Resultado positivo: várias stories (6.3/6.4/6.12) fecharam com 0 findings no PR porque o gate de saída já tinha visto o diff completo. |
| **O que ainda escapou** | Mesmo com o `--base main` no gate de saída, o CR **server-side** no PR continuou a apanhar bugs de produção fina: 6.17 F1 (body JSON não-objecto → crash 500 em vez de 400 esperado — guard de objecto pré-destructuring em falta); 6.11 (timeout `AbortController` em falta no helper + `getMe` devolvia 502 onde 400 era correcto); 6.16 (3 Major: `env.ts` sem `.refine(start<end)` + 2 capture-handlers MSW que não validavam `typeof body.text`). |
| **Causa raiz** | O CR `--base main` local e o CR server-side correm o mesmo motor mas em momentos e com contexto ligeiramente diferentes; o server-side beneficia do conjunto completo do PR consolidado e de uma passagem fresca. Os findings que escaparam são **semântica de produção** (tratamento de input malformado, códigos HTTP exactos, fidelidade de mock) — não estruturais. |
| **Lição** | A A1 do Epic 5 foi **validada**: o `--base main` no gate de saída reduziu drasticamente os findings no PR (a maioria das stories fechou com ≤2 iter e nenhuma ultrapassou o hard-stop §8 — contraste com a 5.11). Mas o CR server-side no PR **continua a ser uma rede de segurança não-redundante** para semântica de produção fina (guards de input, códigos de erro, mock-protocol). Não se deve tratar o gate de saída `--base main` como substituto do CR no PR — é um filtro a montante, não o último. O hard-stop §8 (≤2 iter) acomodou estes findings sem waiver em todas as stories. |
| **Acção** | Sem regra nova — a A1 do Epic 5 mantém-se e está validada. Reforço de processo: o gate de saída `--base main` é obrigatório (reduz iterações), mas o CR no PR continua a ser parte do ciclo de fecho, não opcional. Ver **A1** (confirmar adesão). |

### 5.2 — O padrão ADR-9 (tool client-side → route Node) deve ser decidido no gate de entrada, não descoberto no gate de saída

| Item | Detalhe |
|------|---------|
| **Onde** | 6.10 (Gmail), 6.13 (texto→cérebro), 6.17 (`enviar_telegram`) |
| **Contexto** | Na 6.10, o achado de que o executor de tools corre client-side (e portanto as tools com efeito externo precisam de routes Node via `ctx.fetch`) foi central e exigiu +2 routes novas. Nas 6.13 e 6.17, o mesmo padrão foi **antecipado no gate de entrada** — a Aria ratificou o seam runtime antes de uma linha de código. |
| **Lição** | A lição §5.3 do Epic 5 ("quando um runtime precisa de lógica de outro, força-se um seam explícito") foi totalmente internalizada: o que na 6.10 foi um achado de gate passou a ser uma decisão `[D-6.x-RUNTIME]` ratificada à entrada nas stories seguintes. Para o Epic 7 (que terá mais tools com efeito externo — OCR, voz), o seam runtime client-side/Node deve ser uma decisão default do gate de entrada de qualquer story de tool com efeito externo. |
| **Acção** | Sem regra nova — memória de processo para o Epic 7. Reforça o Architect Gate de Entrada como norma (§3.4). |

### 5.3 — Um epic pode entrar com dívida de segurança herdada e sair com menos do que entrou (decisão de SDK, 6.11)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 6.11, `[GAP-6.4]`, decisão de SDK Telegram |
| **Contexto** | O roadmap (P0.1) adiou explicitamente para o Epic 6 a decisão sobre 2 vulnerabilidades critical (cadeia `request` via `node-telegram-bot-api`). Em vez de aceitar a dívida ou migrar para outro SDK, a decisão (ratificada pelo Eurico) foi usar a Bot API por `fetch` directo, **eliminando** a dependência — e com ela as 2 criticals. |
| **Lição** | Quando uma decisão de dependência é deferida para o epic que a usa de facto, a escolha "sem SDK / `fetch` directo" pode ser simultaneamente a mais segura (elimina a cadeia vulnerável) e a mais alinhada com o runtime (Edge não corre SDKs Node-only). Vale a pena reavaliar dependências pesadas à luz do runtime real antes de as aceitar. A evidência antes/depois (`npm audit` 5→3) ficou no Change Log porque `package.json` é path bloqueador (`not-tested-trailer-rules.md`). |
| **Acção** | Sem regra nova — registado como padrão positivo. Memória de projecto. |

### 5.4 — Diferir uma story por dependência externa (6.15) é fechar o epic, não deixá-lo incompleto

| Item | Detalhe |
|------|---------|
| **Onde** | Story 6.15 (foto→OCR, FR73), decisão de fecho do epic |
| **Contexto** | A 6.15 depende de OCR (FR81/Epic 7) que não existe. Foi marcada como parcial/diferida desde o draft do epic (`EPIC-6.md` §3/§5/§7 GAP-6.6), não descoberta a meio. |
| **Lição** | Quando uma story tem uma dependência externa conhecida e documentada *no draft do epic*, e essa dependência pertence a um epic posterior na ordem do roadmap, o critério de fecho do epic é "todas as stories *implementáveis* Done" — não "todas as stories Done". O Epic 6 fecha 16/17 com a 6.15 a migrar para o Epic 7 (onde vive a 7.9, a sua continuação natural). Isto não é um waiver nem um débito — é a decomposição correcta de uma feature que atravessa dois epics (FR73 no Epic 6 ↔ FR81 no Epic 7), antecipada no PRD §9 (Epic 6 bloqueia 7). |
| **Acção** | Sem regra nova — critério de fecho documentado nesta retrospectiva e no `EPIC-6.md` §10. A 6.15 deve ser explicitamente puxada para o scope do Epic 7. Ver **A4**. |

---

## 6. Lacked — o que faltou

### 6.1 — O CR server-side no PR continua a apanhar bugs de produção fina mesmo com `--base main` no gate

A A1 do Epic 5 reduziu os findings no PR, mas não os zerou para semântica de produção fina (guards de input, códigos HTTP, fidelidade de mock — 6.11/6.16/6.17). É expectável e tratável dentro do hard-stop §8; o ponto é não tratar o gate de saída como substituto do CR no PR. — **Acção A1** (reforço/confirmação de adesão).

### 6.2 — Os AC de produção do Epic 6 dependem de pré-requisitos ainda não provisionados

AC1/AC2/AC3/AC4/AC5 só são plenamente verificáveis em produção com OAuth/Telegram reais, que dependem dos pré-requisitos P1-P5 (env Google + Telegram + `CRON_SECRET` + scheduler do briefing + `setWebhook` pós-deploy) — a cargo do Eurico + `@devops`, não-bloqueantes do fecho do epic mas pendentes para a verificação manual. — **Acção A2**.

### 6.3 — A continuação da 6.15 (e da transcrição de voz real, REC-6.14) precisa de ser explicitamente puxada para o Epic 7

A 6.15 (foto→OCR) e a REC-6.14-TRANSCRIPTION-FUTURE (voz real) são as duas peças do Epic 6 que dependem de capacidades do Epic 7 (OCR/Voice). Devem entrar no scope do Epic 7 explicitamente, não ficar implícitas. — **Acção A4**.

---

## 7. Decisões accionáveis

> **Nota de autoridade:** as acções que **criam ou alteram regras formais em `.claude/rules/`** são executadas por `@aiox-master` (Orion). `@po` (Pax) propõe; `@aiox-master` cria. Antes de propor regra nova, verificou-se se já está coberta pelas regras existentes (`mock-protocol-fidelity.md`, `separation-of-roles.md`, `not-tested-trailer-rules.md`, `react-component-test-criteria.md`, `external-contract-identifiers.md`, `internal-state-contract-gate.md`, `merge-authority.md`, `cr-base-main-no-gate-saida` / `coderabbit-integration.md`) — distinguindo "reforço" de "nova". **O Epic 6 não gerou nenhuma necessidade de regra nova** — todas as lições são confirmações/reforços de regras já existentes, o que é em si um sinal de maturidade do processo.

| # | Acção | Owner | Tipo | Nova regra ou reforço? | Deadline | Done quando |
|---|-------|-------|------|------------------------|----------|-------------|
| **A1** | Confirmar a **adesão à A1 do Epic 5** (`cr-base-main-no-gate-saida` / emenda a `coderabbit-integration.md`): o gate de saída correr CR `--base main` é obrigatório (reduziu iterações no Epic 6), MAS o CR server-side no PR continua a ser parte não-opcional do ciclo de fecho (apanhou bugs de produção fina em 6.11/6.16/6.17). Verificar que a regra está formalizada e que ambos os passos correm. | `@aiox-master` (Orion) verifica; `@po` reporta | **CONFIRMAÇÃO/REFORÇO** | NÃO — a regra já existe (A1 Epic 5). Confirmar formalização + adesão | Antes do Epic 7 | `coderabbit-integration.md` exige `--base main` no gate de saída E o CR no PR continua no ciclo de fecho |
| **A2** | **Provisionar os pré-requisitos de produção P1-P5** do Epic 6 e verificar manualmente os AC de produção: env Google OAuth (Client ID/Secret/Redirect + test user) + Telegram (`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`/`TELEGRAM_WEBHOOK_SECRET` ≥32 chars) + `CRON_SECRET` + scheduler externo do briefing 07h-09h Lisboa + invocar `POST /api/telegram/setup` 1× pós-deploy. Destranca AC1/AC2/AC3/AC4/AC5. | Eurico + `@devops` (Gage) | **PROCESSO** (env/produção) | NÃO — config | Próxima sessão de produção | Env provisionada + `setWebhook` feito + AC verificados em produção (padrão AC13 da 4.9) |
| **A3** | Decidir o destino do **backlog de débitos Baixa acumulado**: os herdados dos Epics 3/4/5 (4 finanças, D6 cascata, push/onboarding, REC-SSRF-2) + os novos do Epic 6 (REC-6.4-*, REC-6.7-*, REC-6.8-*, REC-6.10-THREADING, REC-6.11-*, REC-6.13-*, REC-6.16-*, TEST-001). Avaliar 1-2 stories técnicas de housekeeping. REC-6.14-TRANSCRIPTION-FUTURE deve entrar no scope do Epic 7 (Voice). | `@pm` (Morgan) + `@po` (Pax) | **PROCESSO** (backlog/scope) | NÃO — decisão de backlog | No arranque do Epic 7 | Os débitos têm destino (story técnica criada ou backlog confirmado) |
| **A4** | **Puxar explicitamente a 6.15 (foto→OCR, FR73) e a REC-6.14-TRANSCRIPTION-FUTURE (voz real) para o scope do Epic 7** (Voice + OCR). A 6.15 é a continuação directa da 7.9 (PRD §9: Epic 6 bloqueia 7). Confirmar que o `@pm` as inclui no `*create-epic 7`. | Eurico + `@pm` (Morgan) | **PROCESSO** (roadmap/scope) | NÃO — roadmap | No arranque do Epic 7 | Epic 7 inclui a continuação da 6.15 (foto→OCR) e a transcrição de voz real |
| **A5** | Memory log: actualizar a memória do Nexus v2 com Epic 6 = 16/17 Done (6.15 diferida ao Epic 7), waiver rate 0/16, PRs #75-#90, closure commit Story 6.17 `3792ffe3`, e referência a esta retrospectiva. | `@aiox-master` (Orion) ou Eurico | **MEMÓRIA** | NÃO — memória | 23/06/2026 | MEMORY.md actualizado com entrada que refere este documento |
| **A6** | Eurico + `@pm` decidem o **próximo epic**. Ordem PRD §9: `6 → 7`. Epic 7 (Voice + OCR) é o sucessor natural — desbloqueia a 6.15 e absorve a REC-6.14 (transcrição de voz real). | Eurico + `@pm` (Morgan) | **PROCESSO** (roadmap) | NÃO — roadmap | Próxima sessão | Epic escolhido → `@pm *create-epic 7` |

### Acções que requerem `@aiox-master` (Orion) — resumo

| Acção | Natureza | Estado |
|-------|----------|--------|
| **A1** | **CONFIRMAÇÃO/REFORÇO** — verificar que a A1 do Epic 5 (CR `--base main` no gate de saída) está formalizada em `coderabbit-integration.md` e que o CR no PR continua no ciclo de fecho. Não é regra nova | **PROPOSTA** — `@po` reporta; `@aiox-master` confirma |
| **A5** | **MEMÓRIA** — actualizar MEMORY.md com o fecho do Epic 6 | **PROPOSTA** — `@aiox-master` ou Eurico |

> `@po` (Pax) **não** cria regras formais — apenas as propõe. A criação/alteração de `.claude/rules/` é autoridade de `@aiox-master` (precedente Epics 1/3/4/5). **Sinal de maturidade: o Epic 6 não gerou nenhuma regra nova** — todas as lições são reforços/confirmações de regras existentes.

---

## 8. Comparação Epic 1 vs 2 vs 3 vs 4 vs 5 vs 6

| Métrica | Epic 1 | Epic 2 | Epic 3 | Epic 4 | Epic 5 | Epic 6 | Tendência |
|---------|--------|--------|--------|--------|--------|--------|-----------|
| Stories (total) | 10 | 10 | 11 | 10 | 13 | **17** | maior epic até hoje |
| Stories implementáveis Done | 10 | 10 | 11 | 10 | 13 | **16/16** | 6.15 diferida ao Epic 7 |
| Duração | 7 dias | ~6 dias | ~8 dias | ~9 dias | ~8 dias | **~6 dias** | mais rápido por story |
| Stories implementáveis/dia | ~1,43 | ~1,67 | ~1,38 | ~1,11 | ~1,63 | **~2,67** | mais alto de sempre |
| Waiver rate ("merge waived") | 50% (5/10) | 0% (0/10) | 9,1% (1/11) | 0% (0/10) | 0% (0/13) | **0% (0/16)** | iguala o melhor |
| Validação `@po`/gate GO à 1.ª passagem | — | — | — | 9/10 | 13/13 | **16/16** | melhor de sempre |
| Stories que ultrapassaram o hard-stop §8 | 1 (1.10) | 1 (2.6) | 4 | 2 (4.2, 4.9) | 1 (5.11) | **0** | desceu a zero |
| Iter 3+ por nitpicks de teste/doc | — | — | 3 das 4 | 0 | 0 | **0** | mantido |
| Iter 3+ por segurança/produção real | 1 | 0 | 0 | 1 (4.9) | 1 (5.11) | **0** | epic de mais segurança, 0 |
| Criticals de segurança escapados ao gate | — | 0 | 0 | 0 | 1 (5.11 SSRF) | **0** | anti-SSRF internalizado |
| Bugs produção pós-deploy dentro do epic | 0 | 0 | 0 | 0 (1 hotfix) | 0 | **0** | mantido |
| ADRs base reabertos | 0 | 0 | 0 | 0 | 0 | **0** | igual (OAuth + webhook) |
| Débitos Média/Alta gerados | — | 2 (D6,D7) | 0 | 0 | 0 | **0** | mantido |
| Contrato externo de protocolo novo | não | não | não | sim (Web Push) | sim (fetch web) | **sim (OAuth + Telegram)** | 1.º OAuth/integração autenticada |
| Vulnerabilidades critical eliminadas | — | — | — | — | — | **2 (`npm audit`)** | epic que sai mais seguro |
| Delta de testes | — | — | +260 | +395 | +513 | **+456** | 2.º maior delta |
| Acções da retrospectiva anterior aplicadas | n/a | A1,A2,A6 | A2,A6,A1 | A3,A4,A6,A1 | A1-A5 (Epic 4) | **A1-A6 (Epic 5)** | ciclo validado 5× |
| Regras novas geradas | — | — | 1 | 1 | 1 (A1) | **0** | processo maduro |

**Conclusão da comparação:** o Epic 6 foi o **maior epic em scope (17 stories)** e fechou **16/16 implementáveis com 0% de waiver, igualando o melhor padrão de sempre** — no epic de **maior superfície de segurança do roadmap** (1.º OAuth + 1.º webhook público). Métricas que se destacam: o ritmo mais alto de sempre (~2,67 stories implementáveis/dia), **0 stories a ultrapassar o hard-stop §8** (primeiro epic a consegui-lo desde o início), **0 Criticals de segurança escapados ao gate** (contraste directo com a 5.11), e **2 vulnerabilidades critical eliminadas** — um epic que entrou com dívida de segurança herdada e saiu com menos do que entrou. A lição central (§5.1) **valida a acção A1 do Epic 5**: o CR `--base main` no gate de saída reduziu drasticamente os findings no PR, mas o CR server-side continua a ser uma rede de segurança não-redundante para semântica de produção fina. Pela 1.ª vez, **a retrospectiva não gera regra nova** — todas as lições são reforços de regras existentes, e a `internal-state-contract-gate.md` (criada especificamente para este epic) provou o seu valor no seu epic-alvo. A 6.15 (foto→OCR) migra para o Epic 7, onde vive a sua continuação natural (7.9).

---

## 9. Próximas acções na sequência

1. **`@devops` (Gage)** — push do closure commit desta retrospectiva (docs-only). O closure da Story 6.17 (`3792ffe3`) já está em main; esta retrospectiva + o fecho do `EPIC-6.md` são um commit docs adicional.
2. **`@aiox-master` (Orion) ou Eurico** — executa **A5**: actualiza memória com Epic 6 = 16/17 Done (6.15 diferida ao Epic 7), waiver 0/16.
3. **`@aiox-master` (Orion)** — executa **A1** (confirmar que `coderabbit-integration.md` exige CR `--base main` no gate de saída e que o CR no PR continua no ciclo de fecho).
4. **Eurico + `@devops`** — executam **A2** (provisionar P1-P5 + verificar AC de produção do Epic 6).
5. **`@pm` (Morgan) + `@po` (Pax)** — executam **A3** (destino do backlog de débitos Baixa) e **A4** (puxar 6.15 + REC-6.14 para o Epic 7) no arranque do Epic 7.
6. **Eurico + `@pm` (Morgan)** — executam **A6**: decidem próximo epic → `@pm *create-epic 7` (Voice + OCR — desbloqueia a 6.15).

---

## 10. Convenções desta retrospectiva

| Regra | Verificação |
|-------|-------------|
| `workspace-governance.md` | Documento em `imersao-tools/nexus/docs/retrospectives/` (categoria 2: Projectos Próprios) — OK |
| `language-standards.md` | PT-PT, datas DD/MM/YYYY, separador decimal vírgula, sem PT-BR — OK |
| `output-format-standards.md` | Tabelas ASCII markdown, sem emojis, sem preâmbulo — OK |
| `mandatory-change-log.md` | Acções A1-A6 com owner + tipo + deadline + done + flag de autoridade `@aiox-master` — OK |
| `separation-of-roles.md` | Retrospectiva é trabalho de `@po`; documento de processo, sem quality gate sobre si mesma |
| `merge-authority.md` | Retrospectiva regista que todos os merges (PRs #75-#90) foram feitos pelo agente (`@devops`/`@aiox-master`), nunca merge manual pelo Eurico — OK |
| `agent-authority.md` | Criação de regras formais marcada como autoridade `@aiox-master` — `@po` propõe, não cria — OK (e o Epic 6 não gerou nenhuma) |
| `internal-state-contract-gate.md` | Aplicada nas stories de estado distribuído (6.2/6.4/6.16/6.17) — o epic-alvo da regra |
| `external-contract-identifiers.md` | Nomes de tools validados ASCII no draft (§5 EPIC-6.md) — sem reconciliação |
| Constitution Artigo IV (No Invention) | Todas as métricas derivadas de `git log` real (squash commits PRs #75-#90 + closure `3792ffe3`), `EPIC-6.md`, stories `completed/6.1-6.17.story.md`, e memórias de validação/fecho. Onde uma métrica não existia nas fontes, não foi inventada (ex: iterações CR exactas por story marcadas "≤2" quando o EPIC-6.md não as desagrega) |

---

**Documento criado por:** Pax (`@po`) em 23/06/2026
**Sources verificados:**
- `git log --format="%h %ai %s"` em `ecosistema-ia-avancada-pt` (squash commits PRs #75-#90 + closure `3792ffe3`)
- `imersao-tools/nexus/docs/EPIC-6.md` (estado 16/17, §1 histórico 6.1-6.17, §4 FRs, §5 stories, §6 ACs, §7 GAPs, §8 lições, §9 quality gates, §10 fecho + riscos)
- `imersao-tools/nexus/docs/stories/completed/6.1-6.17.story.md` (Change Logs, contagens de teste, Architect/QA Gates, iterações CR, decisões `[D-6.x-*]`)
- `imersao-tools/nexus/docs/retrospectives/EPIC-1/2/3/4/5-retrospective.md` (referência de formato e baseline comparativa)
- `.claude/rules/` (mock-protocol-fidelity, separation-of-roles, not-tested-trailer-rules, react-component-test-criteria, external-contract-identifiers, internal-state-contract-gate, merge-authority, cr-base-main-no-gate-saida) — verificadas para confirmar que nenhuma regra nova era necessária
