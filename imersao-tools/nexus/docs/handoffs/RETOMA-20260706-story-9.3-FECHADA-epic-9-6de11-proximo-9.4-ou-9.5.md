# RETOMA — Story 9.3 FECHADA (merged em main) — Epic 9 6/11 — fundação PWA posta — próximo 9.4 (manifest) ou 9.5 (offline)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.3 FECHADA (Done, merged)** → **próxima: 9.4 (manifest PWA + ícones — continua a cadeia) ou 9.5 (offline degradado — consome o contrato da 9.3)**
**Data:** 06/07/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** any (preferência `@sm *draft 9.4` ou `/sdc 9.4 --push`) · **status:** pending
**Branch de partida:** `main` (HEAD = `733e1424` + closure commit docs — ver §2)

**Porquê este handoff:** a 9.3 (Service Worker + cache strategy) percorreu o ciclo `/sdc 9.3 --push` completo (draft→validate→dev→gate `@architect`→fixes→push→PR→merge→close) e está DONE em `main`. Abre a fundação PWA. Substitui e arquiva o handoff anterior (`RETOMA-20260705-9.9`).

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a production-ready. Progresso: **6/11 unidades Done** — 9.11 + unidade 9.1 + 9.2 + 9.8 + 9.9 + **9.3**. A 9.3 acrescentou o handler **`fetch`** ao SW manual existente (`public/sw.js`, do Epic 4): **network-first para `/api/*` GET** (fallback `503 {offline:true}` **só quando o `fetch` rejeita** — erro real 4xx/5xx é devolvido tal qual, nunca 503 sintético; anti-M4/silent-success da 4.9), **cache-first para assets** estáticos, **navegações HTML não interceptadas**, e `activate` com limpeza de caches versionados (`CACHE_NAME='nexus-static-v1'`). Os handlers `push`/`notificationclick` do Web Push (Epic 4) ficaram **byte-a-byte intactos** (Risco R4, verificado por diff). Registo do SW passou a nível de app (`ServiceWorkerRegister`). Produção mantém-se LIVE via Anthropic; 9.10 (deploy) continua BLOQUEADA por `production-state-verification-gate.md`.

## 2. Estado exacto do repo (verificado 06/07/2026)

```
branch: main — HEAD 733e1424 (merge da 9.3, PR #108) + closure commit docs 9.3 (pendente do @devops)
733e1424 feat(nexus-v2): Service Worker cache strategy — network-first /api/* + cache-first assets [Story 9.3] (#108)
f7cf11a2 docs(nexus-v2): close-story 9.9 + handoff RETOMA — CodeRabbit obrigatório DONE [Story 9.9]
ca4764be docs(nexus-v2): prepara AC4 branch protection 5º context CodeRabbit — Fase 3 [Story 9.9] (#107)
```

**Branch protection de `main` = ACTIVA com 5 required contexts** (4 CI + `CodeRabbit`). `strict=false`, `enforce_admins=false`.

**Closure commit docs da 9.3 — staged pelo `@po`:** rename `stories/active/9.3.story.md` → `stories/completed/9.3.story.md` (Done, AC1-AC11, Architect Gate, Story Closure) + `EPIC-9.md` (9.3→DONE, 6/11). Consolidado neste handoff — o `@devops` committa closure + handoffs numa só operação (push directo docs-only passa com admin bypass).

> **Ruído fora-scope (NÃO committar):** submódulos, untracked (`.agent/`, `.codex/`, `.antigravity/`, `.cursor/`, backups), docs `PO-VALIDATION-*`/`PR-BODY-*`/`QA-GATE-*`, e `9.1.story.md` (SUPERSEDED preservado). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.3 fixou / decisões e lições a NÃO reabrir

- **Ficheiros da 9.3:** `public/sw.js` (estendido, +handler `fetch`), `components/system/ServiceWorkerRegister.tsx` (novo, registo app-level), `app/(app)/layout.tsx` (mount), `tests/unit/sw/fetch-handler.test.ts` (10 testes).
- **R4 — handlers `push`/`notificationclick` INTACTOS.** Verificado por diff (não aparecem no diff) e por testes (push-handler 6 + notificationclick 9 verdes sem alteração). **NÃO tocar o Web Push do Epic 4 em stories futuras do SW.**
- **AC2/AC10 — as 3 classes de estado NUNCA colapsam** (`internal-state-contract-gate.md`): (i) rede OK → tal qual; (ii) erro real 4xx/5xx → devolvido tal qual (nunca 503 sintético); (iii) `fetch` rejeita → `503 {offline:true}` (só GET). O 503 nasce **só no `catch`**. NÃO reabrir esta semântica.
- **[D-9.3-NO-PRECACHE] (ratificado `@architect`):** install sem precache de lista estática; cache-first popula preguiçosamente (evita território Workbox/No Invention). **Consequência para a 9.5:** cache-first sobre assets hashed **NÃO dá navegação offline** — o app-shell offline (NFR21 real) fica para a 9.5 decidir (precache-shell mínimo vs navigation-fallback).
- **Testes SW — `caches.*` só DENTRO dos handlers**, nunca a top-level do módulo (senão o import rebenta os testes SW que não stubam `caches`). Padrão a manter.
- **AC6/D-9.11-TIMEOUT:** o flake `oauth-status.test.ts` (cold-start `await import()` googleapis sob paralelismo) NÃO é regressão da 9.3 — verde isolado 6/6. Isolar antes de declarar regressão.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260706-story-9.3-FECHADA-epic-9-6de11-proximo-9.4-ou-9.5.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. CONTRATO DE DOIS SINAIS OFFLINE (input obrigatório para a 9.5)

A 9.3 emite **dois sinais distintos de "sem rede"** que a 9.5 (UI offline) TEM de tratar ambos — não assumir só o 503:

| Sinal | Quando | Como a 9.5 o distingue |
|-------|--------|------------------------|
| `503 {offline:true}` | GET a `/api/*` com `fetch` rejeitado (sem rede) | Pelo **body `{offline:true}`**, NÃO só por `status===503` (um 503 real upstream é diferente) |
| `TypeError` nativo | Não-GET a `/api/*` offline (ex: chat `POST /api/anthropic/proxy`) | O fetch do cliente rejeita com TypeError — sem 503 sintético (re-tentar/mascarar um POST offline é perigoso) |

A 9.5 (banner "sem rede", dashboard a ler local, chat honesto) consome estes dois sinais. Ratificado pelo `@architect` no gate da 9.3.

## 5. Próxima peça: 9.4 (recomendada, continua a cadeia) ou 9.5

- **9.4 — Manifest PWA + ícones (RECOMENDADA).** O SW já é instalável (9.3); falta o `manifest.json` + ícones para "Add to Home Screen" (NFR21). Executor **`@ux-design-expert`**, gate **`@dev`** (UI pura com estados de render → EPIC-9 §87). Baixo acoplamento ao contrato de estado, risco baixo. Nota: `public/` só tem `sw.js` hoje — a 9.4 adiciona manifest + ícones. → `@sm *draft 9.4`.
- **9.5 — Modo offline degradado.** Consome o **contrato de dois sinais** da 9.3 (§4) + decide o app-shell offline ([D-9.3-NO-PRECACHE]). Banner "sem rede" + dashboard/widgets a lerem localStorage/IndexedDB + chat honesto (não finge sucesso). Executor `@dev`, gate `@architect` (`internal-state-contract-gate.md` + `react-component-test-criteria.md` — gate mais pesado). Maior valor de fecho da tripla PWA 9.3/9.4/9.5.
- **9.6 — Backup export ZIP (independente, paraleliza).** `dexie-export-import`→JSON→ZIP (NFR22). `@dev`/gate `@qa`. Contraparte 9.7 restore.
- **9.10 — deploy: BLOQUEADA** por `production-state-verification-gate.md`.

**Débito registado:** `REC-9.3-CACHE-PUT-WAITUNTIL` (Baixa — CR Minor: envolver `cache.put` do fetch handler em `event.waitUntil().catch()` para o write sobreviver ao ciclo de vida do fetch event; follow-up não-bloqueante).

## 6. Ciclo padrão / Git

`@sm *draft {id}` → `@po *validate-story-draft` → gate de entrada → branch (de `733e1424`) → impl → **CR `--base main` no gate de saída E verificar CR server-side no head do PR** → `@devops` PR + **6 condições `merge-authority` no head SHA** (5 required checks incl. `CodeRabbit`) + merge `--admin --squash` → `@po *close-story` → `@devops` closure commit. `gh` SEMPRE `--repo DaSilvaAlves/...`; NUNCA `git add -A`; hard-stop §8. CR CLI: `coderabbit review --agent --type committed --base main` (`--prompt-only` REMOVIDO), WSL `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`. O `CodeRabbit` (revisão real) settla ~7-30 min; outage→`--admin` bypass.

```
git checkout main
git pull --ff-only origin main   # HEAD = 733e1424 (+ closure commit docs 9.3 quando o @devops o fizer)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260706-story-9.3-FECHADA-epic-9-6de11-proximo-9.4-ou-9.5.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `06/07/2026`
