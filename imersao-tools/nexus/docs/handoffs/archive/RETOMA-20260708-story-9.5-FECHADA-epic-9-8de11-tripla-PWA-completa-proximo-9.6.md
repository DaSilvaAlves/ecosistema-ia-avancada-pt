# RETOMA — Story 9.5 FECHADA (merged em main) — Epic 9 8/11 — tripla PWA completa — próximo 9.6 (backup ZIP)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.5 FECHADA (Done, merged)** → **próxima: 9.6 (backup export ZIP — recomendada) ou 9.7 (restore)**
**Data:** 08/07/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** any (preferência `@sm *draft 9.6` ou `/sdc 9.6 --push`) · **status:** pending
**Branch de partida:** `main` (HEAD = `f7f420c3` + closure commit docs — ver §2)

**Porquê este handoff:** a 9.5 (Modo offline degradado) percorreu o ciclo `/sdc 9.5 --push` completo (draft→validate→dev→gate `@architect`→fixes→push→PR→merge→close) e está DONE em `main`. **Fecha a tripla PWA** (9.3 SW + 9.4 instalabilidade + 9.5 offline UI). Substitui e arquiva o handoff anterior (`RETOMA-20260707-9.4`).

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a production-ready. Progresso: **8/11 unidades Done** — 9.11 + unidade 9.1 + 9.2 + 9.8 + 9.9 + 9.3 + 9.4 + **9.5**. A 9.5 entregou o modo offline degradado honesto: hook `useOnlineStatus` (detector novo, SSR-safe), `OfflineBanner` (banner "sem rede"), **fix de um bug latente real** (o indicador `● online` do `Header.tsx` era **hardcoded** e mentia sempre → agora dinâmico), e mensagem honesta do chat (`useAgentStream` distingue "sem rede" por `instanceof TypeError`, nunca finge sucesso — anti-M4/R5 da 4.9). O dashboard já era offline-first (lê Dexie via `useLiveQuery`) e os widgets de rede já degradavam honestamente — confirmado sem código novo. **A tripla PWA (9.3+9.4+9.5) está completa.** Produção mantém-se LIVE via Anthropic; 9.10 (deploy) continua BLOQUEADA por `production-state-verification-gate.md`.

## 2. Estado exacto do repo (verificado 08/07/2026)

```
branch: main — HEAD f7f420c3 (merge da 9.5, PR #110) + closure commit docs 9.5 (pendente do @devops)
f7f420c3 feat(nexus-v2): modo offline degradado — banner + indicador honesto + chat "sem rede" [Story 9.5] (#110)
d1cec3f9 docs(nexus-v2): close-story 9.4 + handoff RETOMA — manifest PWA + ícones DONE, Epic 9 7/11 [Story 9.4]
b4d200cc feat(nexus-v2): manifest PWA + ícones instaláveis [Story 9.4] (#109)
```

**Branch protection de `main` = ACTIVA com 5 required contexts** (4 CI + `CodeRabbit`). `strict=false`, `enforce_admins=false`.

**Closure commit docs da 9.5 — staged pelo `@po`:** rename `stories/active/9.5.story.md` → `stories/completed/9.5.story.md` (Done, AC1-AC12, Architect Gate) + `EPIC-9.md` (9.5→DONE, 8/11, **prosa §7 GAP-9.3 / §10 reconciliada** — app-shell offline = resolvido-por-diferimento fora de NFR21). Consolidado neste handoff — o `@devops` committa closure + handoffs numa só operação (push directo docs-only passa com admin bypass).

> **Ruído fora-scope (NÃO committar):** submódulos, untracked (`.agent/`, `.codex/`, `.antigravity/`, `.cursor/`, backups), docs `PO-VALIDATION-*`/`PR-BODY-*`/`QA-GATE-*`, e `9.1.story.md` (SUPERSEDED preservado). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.5 fixou / decisões e lições a NÃO reabrir

- **Ficheiros da 9.5:** `hooks/useOnlineStatus.ts` (novo), `components/ui/OfflineBanner.tsx` (novo), `components/ui/layout-constants.ts` (novo, `HEADER_HEIGHT_PX`), `components/ui/Header.tsx` (indicador dinâmico), `hooks/useAgentStream.ts` (ramo `TypeError`), `vitest.config.ts` (allowlist), + testes.
- **Análise de ciclo de vida do estado offline (AC10, `internal-state-contract-gate.md`) — PASS verificado por propagação REAL:** o `@architect` traçou `InferenceTransport`→`executor.runAgent`→`runClientAgent`→`useAgentStream` e confirmou que o `TypeError` propaga **cru** (o executor re-lança o objecto original, nunca embrulha) → `instanceof TypeError` verdadeiro em produção. As classes "sem rede" (TypeError) e "erro real do servidor" (`new Error` por `!res.ok`) NUNCA colapsam. O chat NÃO finge sucesso. Reconexão não prende. **NÃO reabrir.**
- **`useOnlineStatus` — hydration-safe:** o `useState` initializer retorna **sempre `true`** (alinha com o render do server); a leitura real de `navigator.onLine` faz-se no `useEffect` (mount) + eventos. NÃO reverter (evita hydration mismatch React — foi um Major do CR).
- **`OfflineBanner` — `role="status"`** (implica `aria-live="polite"`; NÃO usar `role="alert"`+`aria-live` juntos, é contraditório).
- **[D-9.5-NO-APP-SHELL] (ratificada):** navegação offline **a frio** (F5 sem rede) está **fora do NFR21** — o NFR21 (EPIC-9 L60) diz literalmente "modo offline degradado... **chat precisa de rede**". O layout autenticado faz `cookies()`+`redirect` server-side (sem shell estático seguro); uma `offline.html` seria invenção (Art. IV). Cobre só "app aberta, rede cai a meio". **NÃO é falha — é o âmbito do NFR.**
- **[D-9.5-NO-STALE-CACHE] (ratificada):** não servir cache stale (ex: cotações velhas) como fresco offline — oposto do "degradado honesto".
- **AC9 — `sw.js` INTOCADO** (a 9.5 é UI cliente; não reabriu o SW da 9.3).
- **Débito:** `REC-9.5-CONST-COVERAGE` (Baixa — CR Minor: incluir `layout-constants.ts` no `coverage.include`; trivial).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260708-story-9.5-FECHADA-epic-9-8de11-tripla-PWA-completa-proximo-9.6.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. Próxima peça: 9.6 (recomendada) ou 9.7

Com a tripla PWA fechada, restam a frente de backup/restore + o deploy:

- **9.6 — Backup export ZIP (RECOMENDADA, independente).** Dexie `db.export()` via `dexie-export-import` (já em dependencies, arch §17) → JSON (+ markdown, arch §14/§16) → ZIP (NFR22). Serve directamente a visão "sistema de continuidade pessoal" (dados exportáveis). Executor `@dev`, gate `@qa` (export sem efeito destrutivo → gate `@qa`, EPIC-9 §87). Contraparte natural da 9.7. → `@sm *draft 9.6`.
- **9.7 — Restore import (contraparte da 9.6).** Import ZIP → escrita em Dexie. Executor `@dev`, gate `@architect` (**escrita destrutiva em Dexie → `internal-state-contract-gate.md`**; gate mais pesado). Depende conceptualmente do formato definido na 9.6.
- **9.10 — deploy: BLOQUEADA** por `production-state-verification-gate.md` (`vercel env ls` + SHA activo + reconciliar `4e2b1c4`/J-6). Incógnitas (a)/(b) do §10.

**Estado do Epic 9:** Done: 9.11, 9.1, 9.2, 9.8, 9.9, 9.3, 9.4, 9.5 (8). Falta: 9.6, 9.7, 9.10 (3).

## 5. Ciclo padrão / Git

`@sm *draft {id}` → `@po *validate-story-draft` → gate de entrada → branch (de `f7f420c3`) → impl → **CR `--base main` no gate de saída E verificar CR server-side no head do PR** (lição repetida nesta sessão: o server-side apanhou Major na 9.8 e na 9.4 que o local não viu) → `@devops` PR + **6 condições `merge-authority` no head SHA** (5 required checks incl. `CodeRabbit`) + merge `--admin --squash` → `@po *close-story` → `@devops` closure commit. `gh` SEMPRE `--repo DaSilvaAlves/...`; NUNCA `git add -A`; hard-stop §8 (Iter 3+ = `Authorized-by: Eurico`). CR CLI: `coderabbit review --agent --type committed --base main` (`--prompt-only` REMOVIDO), WSL `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`. O `CodeRabbit` settla ~7-30 min; outage→`--admin` bypass.

```
git checkout main
git pull --ff-only origin main   # HEAD = f7f420c3 (+ closure commit docs 9.5 quando o @devops o fizer)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260708-story-9.5-FECHADA-epic-9-8de11-tripla-PWA-completa-proximo-9.6.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `08/07/2026`
