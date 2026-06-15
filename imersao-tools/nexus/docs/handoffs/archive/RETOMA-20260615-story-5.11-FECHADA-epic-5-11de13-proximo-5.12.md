# RETOMA — Story 5.11 (Pesquisa web, FR55) FECHADA em main — Epic 5 11/13 — próximo 5.12

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "Orquestrador /sdc 5.11 --push (River @sm + Aria @architect + Pax @po + Dex @dev + Gage @devops)"
to_agent: "any — próximo terminal decide próxima story do Epic 5 (5.12 ou 5.13) ou P1.3/P2.x do roadmap"
created: "2026-06-15T18:30:00Z"
status: consumed
consumed: true
consumed_at: "2026-06-15T18:30:00Z"
consumed_by: "Pax (@po) — *close-story 5.11 (handoff de fecho, auto-consumido)"
project: nexus-v2
last_command: "/sdc 5.11 --push (ciclo completo até merge — PR #72 MERGED squash 22f3b985)"
```

## Summary

Sessão de 13-15/06/2026. Ciclo `/sdc 5.11 --push` completo para a **Story 5.11 (Pesquisa web, FR55)** — o **1.º caminho de fetch externo** do Nexus. Gate `@architect` (entrada + saída, não `@qa`, por território de risco). Todas as fases PASS. **PR #72 MERGED** (squash `22f3b985` em `main`). Epic 5 passou de 9/13 a **11/13** nesta sessão (a 5.10 fechou primeiro, depois a 5.11). Sub-módulo Conhecimento 3/5 (5.9 + 5.10 + 5.11).

| Fase SDC | Agente | Veredicto |
|----------|--------|-----------|
| 1 SM | River | Draft 5.11 (11 AC, T0-T7) |
| 1.5 Architect (entrada) | Aria | GO — GAP-5.4 ratificado (`[D-5.11-RUNTIME/FALLBACK/NO-CACHE/MANUAL-SAVE]`) + 3 correcções de protocolo |
| 2 PO | Pax | GO **9/10** (corrigiu 4 resíduos de protocolo no path de impl.) |
| 3 DEV | Dex | Impl — endpoint Node + helpers + 2 componentes + integração `/knowledge` |
| 4 Architect (saída) | Aria | PASS High (M4 da 4.9 fechado — fallback por inspecção de body) |
| 5 DEVOPS | Gage | PR #72 → merge squash `22f3b985` |

## O que foi entregue (em `imersao-tools/nexus/v2/`)

- `app/api/conhecimento/web-search/route.ts` — endpoint **Node runtime**, cascata Anthropic web search → DuckDuckGo HTML → 503. Origin de confiança validada (allowlist por origin completa) para o fetch ao proxy Edge; cookie só viaja para origin allowlisted (fix SSRF).
- `lib/shared/web-search-anthropic.ts` — `parseAnthropicWebSearch` (gatilho de fallback por inspecção do **body**: `web_search_tool_result_error` vem em HTTP 200).
- `lib/shared/web-search-ddg.ts` — `parseDdgHtml` (scraping HTML DDG, sanitização robusta, snippet por scope de resultado).
- `lib/shared/web-search-url.ts` — `isSafeHttpUrl` (allowlist de esquemas http(s), rejeita `javascript:`/`data:`).
- `components/conhecimento/WebSearchResults.tsx` (5 estados) + `WebSearchSaveModal.tsx` (guardar-como-nota manual).
- `app/(app)/knowledge/page.tsx` — toggle pesquisa web + abort ao desligar web mode.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/archive/`. O PROJECTO A QUE SE REFERE É O NEXUS V2 (`imersao-tools/nexus/`). CAMINHO CORRECTO — não mover. CONSULTAR `.claude/rules/handoff-location.md`.

---

## PR #72 — o mais difícil do Epic 5 (3 ciclos de remediação)

1. **CodeQL — 2 alertas HIGH** em `web-search-ddg.ts` (`js/double-escaping` em `decodeHtmlEntities`; `js/incomplete-multi-character-sanitization` em `stripTags`). Caminho de segurança (HTML externo). Fix v1.1 + 4 testes.
2. **CR server-side — 7 findings** (1 Critical SSRF host-header/cookie-leakage + 6 Major) que o **CR CLI `-t uncommitted` NÃO via** (só vê o diff local). Fix v1.3 (`resolveTrustedProxyOrigin` fail-safe, `isSafeHttpUrl` nos 2 parsers, snippet scope, +testes) + re-gate Architect PASS High.
3. **CR Major abort web-mode** (v1.5) + **CR Major origin-validation só-por-hostname** (v1.7 — `localhost:porta-arbitrária` passava → allowlist por origin completa scheme+host+porta). A v1.7 foi **Iter 3 do hard-stop §8, AUTORIZADA explicitamente pelo Eurico** (trailer `Authorized-by: Eurico`, commit `813c7380`).

Merge no head final `813c7380`: 6 condições `merge-authority` verdes (CI verde incl. CodeQL SUCCESS, CR APPROVED no head, 0 actionable, Architect re-gate PASS High, MERGEABLE, Iter 3 autorizada). `reviewDecision: CHANGES_REQUESTED` era stale (reviews em commits antigos). Squash `22f3b985`.

## LIÇÃO DE PROCESSO (aplicar em todas as stories futuras)

O gate de saída `@architect`/`@qa` tem de correr CodeRabbit contra **`--base main`** (diff completo do branch), **NÃO só `-t uncommitted`** — senão os findings server-side (incluindo o Critical SSRF) escapam ao gate interno e só aparecem no PR, gerando múltiplas iterações evitáveis. Registado em memória `feedback`.

## Decisões firmes (NÃO reabrir)

`[D-5.11-RUNTIME]` (endpoint Node; Anthropic via proxy Edge; cookie só p/ origin allowlisted) · `[D-5.11-FALLBACK]` (erros Anthropic web search = HTTP 200 com `web_search_tool_result_error` no body; fallback inspecciona body, não `!response.ok`) · `[D-5.11-SSRF-FIX]` (allowlist por origin COMPLETA scheme+host+porta; fail-safe → DDG sem cookie; PROIBIDO fail-open) · `[D-5.11-NO-CACHE]` · `[D-5.11-MANUAL-SAVE]` (guardar é manual; automático é a 5.12) · `[D-5.11-EMPTY-VS-ERROR]` · `[D-5.11-SAVE-INDEPENDENT]`.

## Próximo passo

- **`/sdc 5.12 --push`** — Cérebro pesquisa web e cria nota (FR56): combina a pesquisa web (5.11) + criação de área/caderno/nota (5.9) numa intent multi-passo do cérebro, com modo preview antes de persistir. Gate `@architect`. É o consumidor directo da 5.11 + 5.9.
- Em alternativa: **`/sdc 5.13`** (tools cérebro, onde `[D-5.8-CHAT-RETRO]` é entregue) ou os itens P1.3/P2.x de `imersao-tools/nexus/docs/AUDITORIA-20260612-ROADMAP-CONCLUSAO.md`.
- **Git p/ próximo terminal:** `git checkout main && git pull --ff-only origin main` (HEAD = fecho da 5.11). Branch 5.11 eliminada no merge.

## Débitos registados (não-bloqueadores)

- **REC-SSRF-2:** eliminar o fetch HTTP interno do endpoint Node ao proxy Edge — invocar a lógica do proxy directamente (sem reenvio de cookie). Destino arquitectural; pós-Epic 5.
- **FLAG env Vercel:** confirmar que `VERCEL_PROJECT_PRODUCTION_URL` está exposta ao runtime Node em produção (senão o fail-safe da allowlist cobre `imersao.ia.expressia.pt`).
- **Herdados:** OBS-5.10-A2 (`.then()` sem `.catch()` no useEffect de pesquisa em `app/(app)/diario/page.tsx`, da 5.5) e limpeza do `.claude/agent-memory/` órfão untracked.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus-v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/archive/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260615-story-5.11-FECHADA-epic-5-11de13-proximo-5.12.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Pax (@po)`
DATA: `15/06/2026`
