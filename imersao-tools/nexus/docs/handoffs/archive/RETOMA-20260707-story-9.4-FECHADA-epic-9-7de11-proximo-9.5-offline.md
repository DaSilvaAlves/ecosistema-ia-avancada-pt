# RETOMA — Story 9.4 FECHADA (merged em main) — Epic 9 7/11 — instalabilidade PWA completa — próximo 9.5 (offline degradado)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.4 FECHADA (Done, merged)** → **próxima: 9.5 (offline degradado — fecha a tripla PWA) ou 9.6 (backup ZIP — independente)**
**Data:** 07/07/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** any (preferência `@sm *draft 9.5` ou `/sdc 9.5 --push`) · **status:** pending
**Branch de partida:** `main` (HEAD = `b4d200cc` + closure commit docs — ver §2)

**Porquê este handoff:** a 9.4 (Manifest PWA + ícones) percorreu o ciclo `/sdc 9.4 --push` completo (draft→validate→dev `@ux`→gate `@dev`→push→PR→fix CR Major→merge→close) e está DONE em `main`. Com a 9.3 (SW), fecha a **instalabilidade PWA**. Substitui e arquiva o handoff anterior (`RETOMA-20260706-9.3`).

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a production-ready. Progresso: **7/11 unidades Done** — 9.11 + unidade 9.1 + 9.2 + 9.8 + 9.9 + 9.3 + **9.4**. A 9.4 criou `app/manifest.ts` (Next 15 `MetadataRoute.Manifest`, servido em `/manifest.webmanifest`, campos obrigatórios + cores do design-system `theme_color:#00F5FF` / `background_color:#04040A`) + ícones 192/512/maskable/apple-touch via route handlers `app/icons/*/route.tsx` (`ImageResponse` de `next/og`, glyph "N" cyan sobre fundo escuro, **zero binários comitados**). **Com a 9.3 (SW registado), fecha a instalabilidade PWA** (os 2 pré-requisitos de "Add to Home Screen"). A verificação Lighthouse PWA + Add-to-Home real (AC9) fica **DEFERIDA a produção** (verificação manual pós-deploy pelo Eurico+`@devops`). Produção mantém-se LIVE via Anthropic; 9.10 (deploy) continua BLOQUEADA por `production-state-verification-gate.md`.

## 2. Estado exacto do repo (verificado 07/07/2026)

```
branch: main — HEAD b4d200cc (merge da 9.4, PR #109) + closure commit docs 9.4 (pendente do @devops)
b4d200cc feat(nexus-v2): manifest PWA + ícones instaláveis [Story 9.4] (#109)
3eb36553 docs(nexus-v2): close-story 9.3 + handoff RETOMA — Service Worker cache strategy DONE, Epic 9 6/11 [Story 9.3]
733e1424 feat(nexus-v2): Service Worker cache strategy — network-first /api/* + cache-first assets [Story 9.3] (#108)
```

**Branch protection de `main` = ACTIVA com 5 required contexts** (4 CI + `CodeRabbit`). `strict=false`, `enforce_admins=false`.

**Closure commit docs da 9.4 — staged pelo `@po`:** rename `stories/active/9.4.story.md` → `stories/completed/9.4.story.md` (Done, AC status, gate `@dev`) + `EPIC-9.md` (9.4→DONE, 7/11). Consolidado neste handoff — o `@devops` committa closure + handoffs numa só operação (push directo docs-only passa com admin bypass).

> **Ruído fora-scope (NÃO committar):** submódulos, untracked (`.agent/`, `.codex/`, `.antigravity/`, `.cursor/`, backups), docs `PO-VALIDATION-*`/`PR-BODY-*`/`QA-GATE-*`, e `9.1.story.md` (SUPERSEDED preservado). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.4 fixou / decisões e lições a NÃO reabrir

- **Ficheiros da 9.4:** `app/manifest.ts` (novo), `app/icons/_lib/icon-image.tsx` + `app/icons/{icon-192,icon-512,icon-maskable-512,apple-touch-icon}/route.tsx` (novos), `app/layout.tsx` (aditivo: só `metadata.icons`), `vitest.config.ts` (allowlist `app/manifest.ts`), `tests/unit/app/manifest.test.ts` (novo, 5 testes).
- **Decisão `/icons/` vs convenção Next (NÃO reabrir):** evitou `app/icon.tsx`/`app/apple-icon.tsx` porque servem em `/icon`/`/apple-icon` — **fora dos `PUBLIC_PREFIXES` do `middleware.ts`** → redirect `/login` sem sessão (favicon partido). Usou route handlers em `/icons/*` (já público) + `metadata.icons` aditivo no layout. `middleware.ts` INTOCADO.
- **[LIÇÃO — CR server-side apanha Major que o CR local não vê]** (reforço da lição 9.8): o CR local (`@dev` gate) deu 2 Minor; o **CR server-side no PR apanhou 1 Major real de código** — as 4 route handlers de ícone eram **dynamic por defeito** (Next 15) → regeneravam o ícone a CADA request. Fix: `export const dynamic = 'force-static'` (+ remover `runtime='edge'`, incompatível) → `npm run build` provou as rotas passarem de `ƒ` (Dynamic) a `○` (Static). **Sempre verificar o CR no head SHA do PR.**
- **Cores do design-system (NÃO divergir):** `theme_color:#00F5FF` (single source, replicado de `viewport.themeColor`) + `background_color:#04040A`. Blindado no teste AC8.
- **C1/C2 (`not-tested-trailer-rules.md`):** `vitest.config.ts` foi tocado (allowlist `app/manifest.ts`) → allowlist COM o teste no mesmo commit (SF-1/SF-2), trailer `Evidence:` (não `Not-tested:`), `test:coverage` EXIT 0, `manifest.ts` 100%. As rotas de ícone ficaram FORA do allowlist (ImageResponse, sem unit test — decisão consciente).
- **AC9 DEFERIDO:** Lighthouse PWA + Add-to-Home real = verificação manual pós-deploy (Eurico+`@devops`), padrão dos AC de produção diferidos. NÃO é AC falhado.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260707-story-9.4-FECHADA-epic-9-7de11-proximo-9.5-offline.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. Próxima peça: 9.5 (recomendada, fecha a tripla PWA) ou 9.6

- **9.5 — Modo offline degradado (RECOMENDADA).** Fecha a tripla PWA (9.3 SW + 9.4 instalabilidade + 9.5 offline UI). **Consome os inputs deixados pela 9.3:** (a) o **contrato de dois sinais offline** — `503 {offline:true}` (GET reads, discriminar pelo **body** `{offline:true}`, não só `status===503`) vs `TypeError` nativo (não-GET writes, ex: chat `POST /api/anthropic/proxy`); (b) **[D-9.3-NO-PRECACHE]** — cache-first não dá navegação offline; a 9.5 decide o app-shell (precache-shell mínimo vs navigation-fallback). Âmbito: banner "sem rede" + dashboard/widgets a lerem localStorage/IndexedDB + **chat mostra "sem rede" honestamente (não finge sucesso — Risco R5, anti-M4 da 4.9)**. Executor `@dev`, gate `@architect` (`internal-state-contract-gate.md` + `react-component-test-criteria.md` — estados de render do banner; gate mais pesado). → `@sm *draft 9.5`.
- **9.6 — Backup export ZIP (independente, paraleliza).** `dexie-export-import`→JSON→ZIP (NFR22). `@dev`/gate `@qa`. Contraparte 9.7 restore (escrita em Dexie → `internal-state-contract-gate.md`).
- **9.10 — deploy: BLOQUEADA** por `production-state-verification-gate.md` (`vercel env ls` + SHA activo + reconciliar `4e2b1c4`/J-6).

**Estado do Epic 9:** Done: 9.11, 9.1, 9.2, 9.8, 9.9, 9.3, 9.4 (7). Falta: 9.5, 9.6, 9.7, 9.10 (4).

## 5. Ciclo padrão / Git

`@sm *draft {id}` → `@po *validate-story-draft` → gate de entrada → branch (de `b4d200cc`) → impl → **CR `--base main` no gate de saída E verificar CR server-side no head do PR** (a lição da 9.4/9.8 repete-se: o server-side apanha Major que o local não vê) → `@devops` PR + **6 condições `merge-authority` no head SHA** (5 required checks incl. `CodeRabbit`) + merge `--admin --squash` → `@po *close-story` → `@devops` closure commit. `gh` SEMPRE `--repo DaSilvaAlves/...`; NUNCA `git add -A`; hard-stop §8 (Iter 3+ = `Authorized-by: Eurico`). CR CLI: `coderabbit review --agent --type committed --base main` (`--prompt-only` REMOVIDO), WSL `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`. O `CodeRabbit` settla ~7-30 min; outage→`--admin` bypass.

```
git checkout main
git pull --ff-only origin main   # HEAD = b4d200cc (+ closure commit docs 9.4 quando o @devops o fizer)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260707-story-9.4-FECHADA-epic-9-7de11-proximo-9.5-offline.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `07/07/2026`
