# RETOMA — Story 6.9 (Vista Gmail no dashboard) FECHADA em `main`, Epic 6 9/17, próximo 6.10 (tools cérebro Gmail) ou 6.11 (Telegram)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "Pax (@po) — *close-story 6.9 (após /sdc 6.9 --push: PR #83 auto-merge squash 04b724b8)"
to_agent: "any — próximo terminal: @sm *draft 6.10 (tools cérebro Gmail) ou *draft 6.11 (Telegram, paralelo)"
created: "2026-06-19T00:00:00Z"
status: pending
consumed: false
project: nexus-v2
next_action: "@sm *draft 6.10 (tools cérebro Gmail — listar_emails_importantes / criar_draft_gmail / arquivar_email, domínio gmail; criar_draft_gmail com requiresPreview:true por ser acção externa; nomes ASCII já validados nota EPIC-6 §5; consome o mesmo contrato KV nexus:cache:gmail:classify:<msgId> que a vista 6.9 lê; fecha o sub-módulo Gmail 4/4; gate @architect) OU *draft 6.11 (Telegram bot setup, paralelo — atenção GAP-6.4: decisão SDK Telegram + 2 criticals npm audit). A 6.9 fecha a vista Gmail; resta só 6.10 para completar o sub-módulo Gmail."
```

## Passo 0 (arranque em terminal novo)

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git checkout main && git pull --ff-only origin main
git rev-parse --short HEAD   # esperado: 19a88d1d (fecho docs-only @po 6.9) ou posterior; main sincronizado 0/0
```

**SHAs de referência da 6.9:** PR #83 squash em `main` = `04b724b8` (código da feature: route inbox + GmailWidget + testes); commit de fecho docs-only @po = `19a88d1d` (story→`completed/`, EPIC-6 9/17, bookkeeping handoffs: 6.8 arquivado, INDEX actualizado). Working tree limpa na app (`imersao-tools/nexus/v2/`) — restam apenas untracked/submódulos fora-scope pré-existentes, que NÃO se committam.

## Resumo (1 parágrafo)

**Story 6.9 (Vista Gmail no dashboard, FR66) FECHADA em `main`, waiver 0, Epic 6 a 9/17.** Ciclo `/sdc 6.9` completo: SM draft (7 AC, 4 `[GAP-6.9-*]`) → PO **NO-GO 6/10** (1.ª ronda — opção (A) READ-ENDPOINT não implementável sem `kv.keys()`, anti-padrão D-KV-HASH → escalou `@architect`) → Architect Gate de Entrada (Aria) **PASS-COM-CONDIÇÕES** (C1-C6 + re-derivação a-1) → SM fix dos 5 pontos → PO **RE-VALIDAÇÃO GO 9/10** (2.ª ronda, Draft→Approved) → UX (Uma) impl (`GmailWidget.tsx` 5 estados + route Node `GET /api/google/gmail/inbox` + MSW aditivo + 22 testes; vitest **2147/2148** — 1 flake `oauth-status` pré-existente passa isolado 6/6; tsc 0; lint 0) → Quality Gate de Saída (`@dev` Dex) **PASS Alta** (tabela C1-C6 verificada contra código; 3 eixos `internal-state-contract-gate.md`; flake confirmado) → CR `--base main` 2 iter (4 Major + 3 Minor → fixes via A, 0 waiver; #5 import relativo NÃO aplicado por consistência com os 5 widgets) → **0 Major finais** → **PR #83 auto-merge squash `04b724b8`** → close-story @po (Status→Done, `git mv` completed/, **EPIC-6 8/17→9/17**). **Sub-módulo Calendar COMPLETO 6/6; sub-módulo Gmail a 3/4 (6.7 OAuth scope + 6.8 classifier + 6.9 vista; falta só 6.10 tools).**

## Decisões `[D-6.9-*]` ratificadas (NÃO reabrir)

| Decisão | Conteúdo |
|---------|----------|
| READ-ENDPOINT | **Re-derivação a-1**: route Node `GET /api/google/gmail/inbox` → `messages.list?labelIds=INBOX&maxResults=50` (1 chamada) → `kv.get(classifyCacheKey(id))` O(1) por id → **PROIBIDO `kv.keys()`/`scan`** (D-KV-HASH, precedente `schedule-store.ts:17-19`) → filtra só buckets `importante`+`responder_hoje` → `messages.get?format=metadata` em lotes ≤10 `Promise.all` ([D-6.8-BATCH], reimplementado) → 404 (email eliminado pós-classificação) omitido determinístico via sentinela `OMIT`, NÃO 503. Devolve `{ emails: EmailSummary[] }`. Opções a-2/b/c REJEITADAS. |
| REUSE | **Open-closed**: `getMessageMetadata` (l.255) e `getMessagesInBatches` (l.295) de `lib/google/gmail.ts` são PRIVADAS — a route **reimplementa** o padrão, NÃO importa nem exporta. `git diff lib/google/gmail.ts` + `app/api/google/gmail/classify/route.ts` = VAZIO (C2). Reutiliza só símbolos já exportados: `classifyCacheKey`, `GmailBucket`, `GMAIL_BUCKETS`, `getValidAccessToken()`. |
| LOCATION | `components/widgets/GmailWidget.tsx`, widget do Sidebar integrado em `SidebarWidgets.tsx` **entre `GitHubWidget` e `QuickLinksWidget`**. Sempre visível (quando Gmail não ligado → estado `erro-oauth` com CTA). |
| TRIGGER | **Híbrido**: leitura passiva no mount (`GET inbox`, custo zero de tokens — cron 6.5 alimenta a KV) + botão "Actualizar inbox" **opt-in** que chama `POST /api/google/gmail/classify` e re-faz `GET inbox`. NUNCA classify automático on-mount (R4 EPIC-6 custo de tokens). `!response.ok` nunca tratado como sucesso (anti-M4). |
| EMPTY-VS-NOT-CONNECTED | **HTTP-status-based na origem**: 401 → `erro-oauth`; **200** `{ emails: [] }` → `empty`. SEM 2.ª chamada ao `/status`, SEM prop `statusEndpoint`. |

**Estados de render do `GmailWidget` (5):** `loading` / `empty` (200+vazio, sem CTA) / `content` / `erro-oauth` (401, com CTA de ligação) / `erro-fetch` (503, transitório, sem CTA — separado por `[OBS-6.9-1]` do @po, ratificado por Uma porque o 503 tem CTA oposto ao 401). Validação runtime Zod `parseInbox`/`EmailSummarySchema` no componente (fix CR — cast `as` substituído).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260619-story-6.9-FECHADA-epic-6-9de17-proximo-6.10.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Próximo passo (Eurico decide)

- **`@sm *draft 6.10`** (tools cérebro Gmail, FR67/FR68) — **próximo passo natural** (completa o sub-módulo Gmail 4/4). Registar no Tool Registry: `listar_emails_importantes`, `criar_draft_gmail`, `arquivar_email` (domínio `gmail`). `criar_draft_gmail` com `requiresPreview: true` (acção externa — escreve no Gmail do utilizador). Nomes ASCII já validados (nota EPIC-6 §5; `external-contract-identifiers.md`). `listar_emails_importantes` consome o mesmo contrato KV `nexus:cache:gmail:classify:<msgId>` que a vista 6.9 lê / a route inbox re-deriva. Gate `@architect`.
- **Alternativa paralelizável:** `@sm *draft 6.11` (Telegram bot setup, FR69/FR70) — sub-módulo Telegram independente do Google; **atenção GAP-6.4** (decisão de SDK Telegram + 2 criticals `npm audit`). Gate `@architect` (webhook + segurança).

## Arranque imediato da 6.10 — comando único (terminal novo)

Decisão do Eurico (19/06/2026): seguir com a **6.10**. No terminal novo, depois do Passo 0:

```
/sdc 6.10 --push
```

O `/sdc` sem ficheiro de story existente arranca na fase SM (cria a `6.10.story.md`), corre o ciclo completo SM→PO→DEV→QA e, com `--push`, fecha em `main` (CR `--base main` + PR + auto-merge + close-story). **Precedente directo: a Story 6.6** (tools cérebro **calendário** — `criar_evento_calendar`/`actualizar_evento_calendar`/`listar_eventos`, PR #79 `eead5486`) é o molde exacto da 6.10 para o domínio `gmail` — mesmo padrão de registo no Tool Registry, mesmo gate `@architect`. Ler `docs/stories/completed/6.6.story.md` como referência de estrutura/decisões antes do draft.

**Pontos que o `@architect` (Gate de Entrada) deve fechar no draft da 6.10:**
- **GAP-6.5** (EPIC-6 §7) — confirmar em código se o classifier do Epic 1 trata `gmail` como domínio distinto ou agrupa (precedente D-5.13-DOMAIN da 5.13, D-DOMAIN da 4.10). Verificar, não assumir.
- **Preview obrigatório** — `criar_draft_gmail` é acção com efeito externo → reutiliza o padrão preview-then-confirm da Story 1.6 (EPIC-6 §3). `arquivar_email` também muta estado no Gmail do utilizador → avaliar `requiresPreview`.
- **Módulo Node-safe** — as tools Gmail usam `googleapis` (Node), não Edge (ADR-1). O helper de tools vive em `lib/agent/tools/gmail.ts` (padrão dos Epics 3/4/5, testado ~100%).
- **Reuso open-closed** — `listar_emails_importantes` deve reutilizar o contrato/leitura já existente (route inbox 6.9 / `classifyCacheKey`) sem reabrir `gmail.ts` nem a route classify (mesma disciplina C2 da 6.9).

## Débitos / deferidos (não-bloqueantes)

- **P1-Gmail-API** — activar **Gmail API** no Google Cloud Console (necessário para a route `GET /api/google/gmail/inbox` funcionar em produção; herdado da 6.7/6.8; não-bloqueante para CI mock MSW).
- **AC4 (integração visual no dashboard) e AC6 (design system + acessibilidade)** — verificáveis só em produção/preview visual (padrão A3 Epic 4 / AC13 da 4.9); registar resultado pós-deploy.
- **Flake `oauth-status.test.ts`** — timeout-flake pré-existente da 6.7 (não tocado pela 6.9, confirmado por C2 + File List), passa isolado 6/6; não é defeito da 6.9.
- **REC-6.8-FIDELITY-WEAK / REC-6.7-REFRESH-TEST** — débitos Baixa herdados (não dívida da 6.9).

## Regras operacionais

`gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; NUNCA `git add -A` (submódulos sujos + untracked fora-scope); push exclusivo `@devops`; gate de saída CR `--base main` (território server-side com tokens OAuth + fetch Gmail); hard-stop §8 (máx 2 iter CR; Iter 3 exige `Authorized-by:`); auto-merge só com `merge-authority.md` §1-6 verdes no head SHA.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260619-story-6.9-FECHADA-epic-6-9de17-proximo-6.10.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Pax (@po)`
DATA: `19/06/2026`
