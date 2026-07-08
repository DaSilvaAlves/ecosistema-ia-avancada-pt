# RETOMA — Story 9.6 FECHADA (merged em main) — Epic 9 9/11 — próximo 9.7 (restore import — contraparte da 9.6)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.6 FECHADA (Done, merged)** → **próxima: 9.7 (restore import ZIP — contraparte round-trip da 9.6)**
**Data:** 08/07/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** any (preferência `@sm *draft 9.7` ou `/sdc 9.7 --push`) · **status:** pending
**Branch de partida:** `main` (HEAD = `08e9c171` + closure commit docs — ver §2)

**Porquê este handoff:** a 9.6 (Backup export ZIP) percorreu o ciclo `/sdc 9.6 --push` completo (draft→validate→dev→gate `@qa`→push→PR→merge→close) e está DONE em `main`. Definiu o **formato-contrato** que a 9.7 (restore) consome. Substitui e arquiva o handoff anterior (`RETOMA-20260708-9.5`).

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a production-ready. Progresso: **9/11 unidades Done** — 9.11 + unidade 9.1 + 9.2 + 9.8 + 9.9 + 9.3 + 9.4 + 9.5 + **9.6**. A 9.6 entregou o export de backup: botão em `/settings` (secção Backup) → ZIP via `fflate.zipSync` contendo `nexus-db-export.json` (output CRU de `exportDB(db)` do `dexie-export-import`, 22 tabelas) + `notas.md` (markdown legível de `knowledge_notes`). Sem secrets (os tokens OAuth vivem em Vercel KV, não em Dexie → garantia por construção, AC6). `BackupSettings.tsx` com 4 estados de render. `fflate` promovido de transitiva a `dependencies` (npm audit sem vulns novas). Gate `@qa` PASS 11/11, CR `--base main` limpo, suite 2662 PASS. Falta a contraparte 9.7 (restore) e o deploy (9.10, bloqueado). Produção mantém-se LIVE via Anthropic.

## 2. Estado exacto do repo (verificado 08/07/2026)

```
branch: main — HEAD 08e9c171 (merge da 9.6, PR #111) + closure commit docs 9.6 (pendente do @devops)
08e9c171 feat(nexus-v2): backup export ZIP — JSON dexie + notas.md via fflate [Story 9.6] (#111)
ee2c620f docs(nexus-v2): close-story 9.5 + handoff RETOMA — modo offline degradado DONE [Story 9.5]
f7f420c3 feat(nexus-v2): modo offline degradado [Story 9.5] (#110)
```

**Branch protection de `main` = ACTIVA com 5 required contexts** (4 CI + `CodeRabbit`). `strict=false`, `enforce_admins=false`.

**Closure commit docs da 9.6 — staged pelo `@po`:** rename `stories/active/9.6.story.md` → `stories/completed/9.6.story.md` (Done, AC1-AC11, QA Results recuperado de stash) + `EPIC-9.md` (9.6→DONE, 9/11, formato-contrato registado). Consolidado neste handoff — o `@devops` committa closure + handoffs numa só operação (push directo docs-only passa com admin bypass).

> **Ruído fora-scope (NÃO committar):** submódulos, untracked (`.agent/`, `.codex/`, `.antigravity/`, `.cursor/`, backups), docs `PO-VALIDATION-*`/`PR-BODY-*`/`QA-GATE-*`, e `9.1.story.md` (SUPERSEDED preservado). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. FORMATO-CONTRATO DO BACKUP (input obrigatório para a 9.7 — NÃO re-derivar)

A 9.6 fixou o formato que a 9.7 (restore) DEVE consumir:

```
nexus-backup-{ISO-timestamp}.zip
├── nexus-db-export.json   ← output CRU de exportDB(db) (dexie-export-import 4.4.0, byte-a-byte,
│                             formatName==='dexie', 22 tabelas version(6)) → a 9.7 importa via
│                             importInto()/db.import() SEM transformação
└── notas.md                ← markdown legível de knowledge_notes — NÃO-reimportável (a 9.7 usa só o JSON)
```

A 9.7 arranca com este contrato estável — o draft NÃO re-deriva o formato.

## 4. O que a 9.6 fixou / decisões e lições a NÃO reabrir

- **Ficheiros da 9.6:** `lib/backup/export.ts` (novo), `components/settings/BackupSettings.tsx` (novo), `app/(app)/settings/page.tsx` (secção Backup), `package.json`/lock (fflate promovido), `vitest.config.ts` (allowlist), 2 ficheiros de teste (17 testes).
- **[D-9.6-ZIPLIB]:** `fflate` (promovido de transitiva `0.8.2` a dependencies; zero-deps, ~8KB, `zipSync` client-side). `CompressionStream` nativo rejeitado (só gzip 1 stream, não ZIP multi-ficheiro). `npm audit` limpo (fflate 0 vulns).
- **AC6 — sem secrets por construção:** `exportDB` só toca as 22 tabelas Dexie; tokens OAuth em Vercel KV (AES-256). NÃO adicionar "sanitização" inventada (Art. IV).
- **AC7 — JSON cru:** o `nexus-db-export.json` é o output byte-a-byte de `exportDB()` — NÃO transformar (a 9.7 depende).
- **GOTCHA (jsdom/vite realm mismatch):** `fflate.strToU8`/`TextEncoder().encode()` directo falham `instanceof Uint8Array` entre realms sob jsdom → `zipSync` trataria a string como directório. Correcção: `new Uint8Array(new TextEncoder().encode(...))`. Inócua e correcta no browser real. O Blob de `exportDB` sob jsdom não expõe `arrayBuffer()` → fallback `FileReader`. Relevante se a 9.7 testar import sob jsdom.
- **Débitos (Baixa, não-bloqueantes):** `REC-9.6-MD-FENCE` (fence sem label no story doc) + `REC-9.6-TEST-ASSERT` (assertion byte-equality não estrita no teste).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260708-story-9.6-FECHADA-epic-9-9de11-proximo-9.7-restore.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 5. Próxima peça: 9.7 (recomendada, contraparte round-trip) ou 9.10 (bloqueada)

- **9.7 — Restore import ZIP (RECOMENDADA).** Contraparte round-trip da 9.6: import do ZIP → `importInto()`/`db.import()` sobre o `nexus-db-export.json`. **Consome o formato-contrato do §3 — NÃO re-derivar.** Executor `@dev`, **gate `@architect` PESADO** — a 9.7 **escreve em Dexie** (destrutivo) → território bloqueador de `internal-state-contract-gate.md`. A análise de ciclo de vida (3 eixos) tem de cobrir: **substituir-vs-fundir explícito** (o import limpa a DB actual ou funde? decisão de contrato), **import parcial/corrompido → falha honesta via transaction** (all-or-nothing, não deixar a DB meio-importada — anti-M4/silent-loss da 4.9), **idempotência**, **compatibilidade de versão de schema** (o backup foi feito na `version(6)`; se o schema evoluir, o import valida/migra?). É a peça de MAIOR risco de estado do que resta.
- **9.10 — deploy: BLOQUEADA** por `production-state-verification-gate.md` (`vercel env ls` + SHA activo + reconciliar `4e2b1c4`/J-6). Incógnitas (a)/(b) do §10.

**Estado do Epic 9:** Done: 9.11, 9.1, 9.2, 9.8, 9.9, 9.3, 9.4, 9.5, 9.6 (9). Falta: 9.7, 9.10 (2). Com a 9.7, só o deploy (9.10) fica por fazer.

## 6. Ciclo padrão / Git

`@sm *draft {id}` → `@po *validate-story-draft` → gate de entrada → branch (de `08e9c171`) → impl → **CR `--base main` no gate de saída E verificar CR server-side no head do PR** (lição repetida: server-side apanhou Major na 9.8/9.4) → `@devops` PR + **6 condições `merge-authority` no head SHA** (5 required checks incl. `CodeRabbit`) + merge `--admin --squash` → `@po *close-story` → `@devops` closure commit. `gh` SEMPRE `--repo DaSilvaAlves/...`; NUNCA `git add -A`; hard-stop §8 (Iter 3+ = `Authorized-by: Eurico`). CR CLI: `coderabbit review --agent --type committed --base main` (`--prompt-only` REMOVIDO), WSL `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`. O `CodeRabbit` settla ~7-30 min; outage→`--admin` bypass.

```
git checkout main
git pull --ff-only origin main   # HEAD = 08e9c171 (+ closure commit docs 9.6 quando o @devops o fizer)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260708-story-9.6-FECHADA-epic-9-9de11-proximo-9.7-restore.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `08/07/2026`
