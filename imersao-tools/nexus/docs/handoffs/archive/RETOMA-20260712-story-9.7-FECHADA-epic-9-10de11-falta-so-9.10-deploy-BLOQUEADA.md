# RETOMA — Story 9.7 FECHADA (merged em main) — Epic 9 10/11 — falta SÓ a 9.10 (deploy, BLOQUEADA por verificação de produção)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md`
**Story desta retoma:** **9.7 FECHADA (Done, merged)** → **última: 9.10 (deploy automatizado) — BLOQUEADA, exige verificação de produção com o Eurico**
**Data:** 12/07/2026
**from_agent:** @aiox-master (Orion) · **to_agent:** any + **acção Eurico** (verificação de estado de produção — ver §4) · **status:** pending
**Branch de partida:** `main` (HEAD = `f6ac9f99` + closure commit docs — ver §2)

**Porquê este handoff:** a 9.7 (Restore import ZIP) — a peça de MAIOR risco de estado do Epic 9 — percorreu o ciclo `/sdc 9.7 --push` completo (draft→validate→dev→gate `@architect`→fix→push→PR→merge→close) e está DONE em `main`. Com a 9.6, fecha o round-trip de backup (NFR22). Substitui e arquiva o handoff anterior (`RETOMA-20260708-9.6`).

---

## 1. Resumo executivo (1 parágrafo)

O Epic 9 leva o Nexus v2 a production-ready. Progresso: **10/11 unidades Done** — 9.11 + unidade 9.1 + 9.2 + 9.8 + 9.9 + 9.3 + 9.4 + 9.5 + 9.6 + **9.7**. A 9.7 entregou o restore: UI em `/settings` (secção Backup, junto ao export da 9.6) → import do ZIP → `fflate.unzipSync` localiza `nexus-db-export.json` → **validação ANTES de escrever** (`peakImportFile` formato dexie + **`assertBackupParseable`** `JSON.parse` completo) → confirmação destrutiva (`window.confirm` PT-PT) → `importInto(db, blob, { clearTablesBeforeImport: true, overwriteValues: true })` (substitui todos os dados; NUNCA `noTransaction`). **Achado load-bearing:** o `@dev` descobriu por execução que a atomicidade nativa do `importInto` **NÃO reverte um JSON truncado a meio** (parser em streaming comita parcial sem lançar = silent-partial-loss, classe M4 da 4.9) — fechado com a validação pré-escrita. O `@architect` ratificou por execução real e o CR server-side não apanhou nenhum Major de estado. **9.6+9.7 = round-trip de backup completo.** Produção mantém-se LIVE via Anthropic; 9.10 (deploy) continua BLOQUEADA.

## 2. Estado exacto do repo (verificado 12/07/2026)

```
branch: main — HEAD f6ac9f99 (merge da 9.7, PR #112) + closure commit docs 9.7 (pendente do @devops)
f6ac9f99 feat(nexus-v2): restore import ZIP — validação antes de escrita destrutiva [Story 9.7] (#112)
6ac0a426 docs(nexus-v2): close-story 9.6 + handoff RETOMA — backup export ZIP DONE, Epic 9 9/11 [Story 9.6]
08e9c171 feat(nexus-v2): backup export ZIP — JSON dexie + notas.md via fflate [Story 9.6] (#111)
```

**Branch protection de `main` = ACTIVA com 5 required contexts** (4 CI + `CodeRabbit`). `strict=false`, `enforce_admins=false`.

**Closure commit docs da 9.7 — staged pelo `@po`:** rename `stories/active/9.7.story.md` → `stories/completed/9.7.story.md` (Done, AC1-AC11, Architect Gate) + `EPIC-9.md` (9.7→DONE, 10/11, round-trip backup registado). Consolidado neste handoff — o `@devops` committa closure + handoffs numa só operação (push directo docs-only passa com admin bypass).

> **Ruído fora-scope (NÃO committar):** submódulos (`comunidade`, `starter-builder`), untracked (`.agent/`, `.codex/`, `.antigravity/`, `.cursor/`, backups), docs `PO-VALIDATION-*`/`PR-BODY-*`/`QA-GATE-*`, e `9.1.story.md` (SUPERSEDED preservado). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.7 fixou / decisões e lições a NÃO reabrir

- **Ficheiros da 9.7:** `lib/backup/restore.ts` (novo), `components/settings/RestoreSettings.tsx` (novo), `app/(app)/settings/page.tsx` (+`<RestoreSettings/>` aditivo), 2 ficheiros de teste (13 testes). `lib/backup/export.ts` (9.6) e `vitest.config.ts` INTOCADOS (allowlist já cobria).
- **[LIÇÃO load-bearing — silent-partial-loss no `importInto`]:** a atomicidade nativa do dexie-export-import NÃO protege contra um JSON **truncado a meio dos dados** — o parser em streaming comita as linhas válidas e conclui sem lançar → tabelas limpas por `clearTablesBeforeImport` + só parcialmente reescritas = **perda de dados silenciosa** (M4 da 4.9). A defesa é **em 2 camadas**: `assertBackupParseable` (`JSON.parse` do texto COMPLETO ANTES de qualquer escrita — rejeita corrompido com zero escrita) + a transacção nativa (para erros genuínos de escrita). **NÃO reabrir/remover o pre-parse.**
- **Contrato de estado:** SUBSTITUIR (não fundir), com confirmação destrutiva obrigatória (`window.confirm` PT-PT explícito) ANTES de qualquer escrita. Ordem inviolável: unzip→localizar→peakImportFile→assertBackupParseable→confirmação→importInto. **NUNCA** `noTransaction:true`/`acceptVersionDiff`/`acceptNameDiff` (a segurança de version/name mismatch depende dos defaults).
- **5 `RestoreError.reason` PT-PT distintos:** `missing-json` / `invalid-format` / `name-mismatch` / `version-mismatch` / `transaction-failed`. Cada falha deixa a DB intocada (antes ≡ depois, provado por execução).
- **Débitos (Baixa, não-bloqueantes):** `REC-9.7-CONFIRM-MODAL` (window.confirm vs modal design-system) + `REC-9.7-SEMANTIC-VALIDATE` (validação semântica do JSON além da sintáctica — só relevante para ficheiro adversarial, impossível de gerar pela 9.6; aceite para MVP single-user) + `REC-9.7-ACT-FLUSH` (**RESOLVIDO** pré-merge).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260712-story-9.7-FECHADA-epic-9-10de11-falta-so-9.10-deploy-BLOQUEADA.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. ÚLTIMA PEÇA: 9.10 (deploy automatizado) — BLOQUEADA, exige verificação de produção com o Eurico

A **9.10 (deploy contínuo Vercel, NFR19)** é a **última** story do Epic 9 e do roadmap MVP (PRD §9). Está **BLOQUEADA por `production-state-verification-gate.md`** — NÃO pode ser desenhada (`@sm *draft`) nem validada (`@po`) sem verificar o estado **real** de produção contra a plataforma. **Acção que precisa do Eurico** (verificação de produção):

| # | Verificação obrigatória | Comando |
|---|-------------------------|---------|
| 1 | Env vars/flags reais de produção | `vercel env ls --environment production` (nomes, sem valores) |
| 2 | Deployment/SHA activo em produção | Vercel Dashboard / `vercel ls` |
| 3 | **Reconciliar o deployment paralelo `4e2b1c4` ("observabilidade J-6")** | trabalho de outra sessão, fora dos handoffs — é (ou era) o deployment activo; o estado real pode divergir do que os handoffs assumem |
| 4 | Auto-deploy on-push em `main` ligado? ou deploy manual/CLI? | Vercel project settings |

Se a verificação **contradisser** a premissa → **STOP + correct-course ANTES de implementar** (foi exactamente o erro da 8.6, onde a premissa "produção sem cérebro" evaporou e só se detectou no gate final — ver `production-state-verification-gate.md`). Executor `@devops`, gate `@architect` (config de deploy = território bloqueador `not-tested-trailer-rules.md` → `Evidence:`, não `Not-tested:`). **A 9.10 NÃO está pronta para arrancar sem esta verificação.**

Com a 9.10 fechada, o Epic 9 fica 11/11 e o Nexus v2 fica **production-ready** — roadmap MVP (PRD §9) completo.

**Estado do Epic 9:** Done: 9.11, 9.1, 9.2, 9.8, 9.9, 9.3, 9.4, 9.5, 9.6, 9.7 (10). Falta: **9.10 (1, BLOQUEADA)**.

## 5. Ciclo padrão / Git

`@sm *draft {id}` → `@po *validate-story-draft` → gate de entrada → branch (de `f6ac9f99`) → impl → **CR `--base main` no gate de saída E verificar CR server-side no head do PR** → `@devops` PR + **6 condições `merge-authority` no head SHA** (5 required checks incl. `CodeRabbit`) + merge `--admin --squash` → `@po *close-story` → `@devops` closure commit. Para a 9.10, ANTES de tudo: a verificação de produção do §4. `gh` SEMPRE `--repo DaSilvaAlves/...`; NUNCA `git add -A`; hard-stop §8 (Iter 3+ = `Authorized-by: Eurico`). CR CLI: `coderabbit review --agent --type committed --base main` (`--prompt-only` REMOVIDO), WSL `/mnt/c/Users/XPS/Documents/ecosistema-ia-avancada-pt`. `CodeRabbit` settla ~7-30 min; outage→`--admin` bypass.

```
git checkout main
git pull --ff-only origin main   # HEAD = f6ac9f99 (+ closure commit docs 9.7 quando o @devops o fizer)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260712-story-9.7-FECHADA-epic-9-10de11-falta-so-9.10-deploy-BLOQUEADA.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@aiox-master (Orion)`
DATA: `12/07/2026`
