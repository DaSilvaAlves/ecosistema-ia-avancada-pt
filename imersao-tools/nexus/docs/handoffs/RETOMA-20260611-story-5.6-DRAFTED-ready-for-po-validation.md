# RETOMA — Nexus v2 — Story 5.6 (Brain Dump UI) DRAFTED → próximo `@po *validate-story-draft 5.6`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 11/06/2026
**De:** River (`@sm`) — draft da Story 5.6
**Para:** Pax (`@po`) — validação — OU qualquer terminal novo (Eurico decide)
**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Estado:** Story 5.6 (Brain Dump UI) **DRAFTED, Status `Draft`, READY para validação PO**. Epic 5 a **5/13 Done**.

---

## Passo 0 obrigatório (terminal novo)

```
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git checkout main
git pull --ff-only origin main
git status
```

HEAD esperado de `main` = `6f19aac9` (ou mais recente se houve push do close-story 5.5). Pasta exacta de trabalho do código: `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt\imersao-tools\nexus\v2`.

**Caveats operacionais (inegociáveis):**
- `gh pr *` requer SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- NUNCA `git add -A` — a raiz tem submódulos sujos (`comunidade`, `starter-builder`) + 150+ untracked fora-scope. Add SELECTIVO sempre.
- Push/PR/merge = exclusivo `@devops` (Gage). Merge feito pelo agente quando PR verde (`merge-authority.md`) — NÃO se pede merge manual ao Eurico.

---

## O que foi feito nesta sessão

1. **`@sm *draft 5.6`** executado. Criado: `imersao-tools/nexus/docs/stories/active/5.6.story.md` (Status **Draft**).
2. Contexto recolhido em código real (não assumido): `EPIC-5.md` §5/§7/§8, `front-end-spec-v2.md` §1.4 (Flow 4), interface `BrainDump` (`types/db.ts:261`), repo `brain-dumps.ts` (5.1), editor 5.2 (`MarkdownEditor`), padrão de modal (`JournalEntryModal` 5.3), `HomePage`+`OnboardingModal`, `Header.tsx`.
3. `story-draft-checklist` corrido pelo `@sm`: **READY**, clarity 9/10, 6/6 categorias PASS.

**Único ficheiro novo não-committed:** `imersao-tools/nexus/docs/stories/active/5.6.story.md`. (Mais este handoff + linha no INDEX.) Nada mais tocado. Sem código de produto alterado.

---

## Story 5.6 — resumo do âmbito

| Campo | Valor |
|-------|-------|
| FR | FR47 (PRD §6.9 — "Input texto livre: vomita ideias 10 min seguidos") |
| Tipo | Frontend — modal de captura + integração no chat |
| Executor | `@ux-design-expert` (Uma) |
| Quality gate | `@dev` (Dex) — `separation-of-roles.md` A6 |
| Bloqueada por | 5.1 + 5.2 (ambas DONE em `main`) |
| Bloqueia | 5.7 (parser AI consome o seam `onStructure` + `bodyMarkdown`) |

**Entrega:** SÓ o **estado de input** do `BrainDumpModal` — `textarea` ~70% altura + contador de palavras + botão "Estruturar com AI" (Cyan, activo ≥50 chars) + placeholder exacto + abrir/fechar + atalho "B". 8 ACs.

**Fora de scope (5.7/5.8):** chamada AI / POST `/api/agent/brain-dump` SSE, overlay "A estruturar...", 4 buckets colapsáveis, edição/desmarcação item-a-item, persistência dos itens aprovados, `createBrainDump`/máquina de `status`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260611-story-5.6-DRAFTED-ready-for-po-validation.md`. ESTE CAMINHO ESTÁ DENTRO DA PASTA DO PROJECTO NEXUS A QUE O HANDOFF SE REFERE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Decisões de reconciliação fixadas no draft (NÃO reabrir sem motivo — todas com fonte)

| ID | Decisão | Fonte / racional |
|----|---------|------------------|
| **`[D-5.6-INPUT]`** | **`textarea`, NÃO o editor 5.2.** O EPIC §5 dizia "textarea grande (ou editor 5.2)" — a `front-end-spec-v2.md` (validada) §1.4 [2] + §1014 + §1174 resolve a favor de `textarea`. Captura de fluxo de consciência sem fricção; `bodyMarkdown` aceita texto puro. | front-end-spec-v2.md#1.4/#1014; EPIC §5. **Não montar `MarkdownEditor` aqui.** |
| **`[D-5.6-SEAM]`** | **5.6 é presentational.** Expõe `onStructure(markdown: string)` — NÃO chama AI, NÃO invoca `createBrainDump`, NÃO escreve em Dexie. `createBrainDump` + parse + transições de `status` pertencem à **5.7**. | Mantém gate `@dev` leve; `internal-state-contract-gate.md` fica fora de scope (é da 5.8, gate `@architect`). EPIC §5/§8. |
| **Paradigma modal + atalho "B"** | Sem rota `/brain-dump`, **sem NavLink no `Header`**. Modal fullscreen sobreposto ao chat; launcher client em `HomePage` (padrão `OnboardingModal`); handler "B" com guarda (ignora foco em input/textarea/contenteditable). | front-end-spec-v2.md#1.4 [1]-[2]/#1066/#1207. |
| **D-4.2-1 já pago** | A decisão A4 do EPIC §8 ("absorver D-4.2-1 na 1.ª story que toque o Header") **NÃO se aplica** à 5.6 — não toca o Header. `Header.tsx:93` já é `/tarefas`. | components/ui/Header.tsx:93. |
| **Threshold = 50 caracteres** | Botão activa ≥50 chars (brain dump). **NÃO confundir** com os 100 chars do diário (5.4). | front-end-spec-v2.md#1.4 [3]. |

**Factos de código verificados (não assumir):**
- `BrainDump` (`types/db.ts:261-267`): `{ id, createdAt, bodyMarkdown, parsedOutput?, status }`; `status: 'pending'|'parsed'|'partially_approved'|'fully_approved'`; `parsedOutput?: unknown` (tipo definido na 5.7).
- Repo `lib/db/repos/brain-dumps.ts` já existe (5.1) — `createBrainDump`/`listBrainDumps`/etc. NÃO usado na 5.6 (`[D-5.6-SEAM]`).
- **Sem `useBrainDumps` hook** (não necessário na 5.6).
- **Sem infra de atalhos global** — a 5.6 introduz o handler "B".
- `HomePage` (`app/(app)/page.tsx`) é server component; já monta `OnboardingModal` (client) — ponto de montagem do `BrainDumpLauncher`.

**Ficheiros esperados (File Locations da story):** `v2/lib/brain-dump/input.ts`, `v2/components/brain-dump/BrainDumpModal.tsx`, `v2/components/brain-dump/BrainDumpLauncher.tsx`, edição de `v2/app/(app)/page.tsx`, + 2 ficheiros de teste.

---

## Próxima acção

1. **`@po` (Pax)** — `*validate-story-draft 5.6` (10-point checklist). Pontos a confirmar:
   - `[D-5.6-INPUT]` (textarea vs editor) bem fundamentado na FE spec validada;
   - `[D-5.6-SEAM]` mantém a 5.6 sem persistência/AI (boundary limpo com 5.7);
   - ACs testáveis; threshold 50 (≠100); a11y de modal; design system.
2. Após **GO** → `@ux-design-expert *develop 5.6` (executor) → gate `@dev`.
3. Hard-stop §8: máximo 2 iterações CR por story; Iter 3 ou merge waived exigem autorização explícita do Eurico no commit.

**Sequência Epic 5 (EPIC §10):** sub-módulos Diário (5.3-5.5 ✅), Brain Dump (5.6→5.7→5.8), Conhecimento (5.9-5.12), Tools (5.13). 5.6 desbloqueia 5.7. Alternativa paralelizável: `*draft 5.9` (Conhecimento, independente do Brain Dump sobre a fundação 5.1+5.2). Envolver `@architect` cedo nos GAPs 5.7 (parser AI), 5.8 (approval flow/estado distribuído), 5.11 (pesquisa web), 5.13 (tools).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260611-story-5.6-DRAFTED-ready-for-po-validation.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260611-story-5.6-DRAFTED-ready-for-po-validation.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: River (`@sm`)
DATA: `11/06/2026`
