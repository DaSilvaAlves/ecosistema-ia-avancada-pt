# RETOMA — Retrospectiva Epic 9 CONCLUÍDA — decisão A1 pendente (MVP completo vs Epic 7 a 4/10)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Artefacto desta retoma:** `docs/retrospectives/EPIC-9-retrospective.md` (NOVO, não committed)
**Data:** 01/08/2026
**from_agent:** Orion (`@aiox-master`), executando `@po *retrospective epic-9` · **to_agent:** any (preferência `@devops` para o commit; depois **Eurico** para a decisão A1) · **status:** pending
**Branch de partida:** `main` (HEAD `8a555104`, sincronizado com `origin/main`)

**Porquê este handoff:** a retrospectiva do Epic 9 — o `next_action` do handoff de 16/07 — está **escrita e completa**. Fecha o ciclo de nove epics do Nexus v2. Mas produziu **uma decisão bloqueadora que só o Eurico pode tomar (A1)** e que condiciona todo o trabalho seguinte. O documento **não está committed**.

---

## 1. Resumo executivo

A retrospectiva do Epic 9 (Hardening + Deploy + PWA) foi produzida em `docs/retrospectives/EPIC-9-retrospective.md`, seguindo o formato canónico das retros Epic 1-8. **Epic 9 fechou 11/11 unidades com waiver rate 0/11 (0%)** — 6.ª série consecutiva a 0%. O achado central é positivo e inédito: **a regra `production-state-verification-gate.md`, criada pela retro do Epic 8 por causa do incidente 8.6, evitou no seu primeiro uso real exactamente o erro que a originou** — na 9.10 a verificação correu no arranque, revelou que o auto-deploy já estava operacional, e a story re-escopou-se de *implementação* para *formalização* antes de qualquer investimento. É a primeira validação empírica de que o ciclo retro → regra → prevenção fecha.

A retro gera **6 acções (A1-A6) e ZERO regras novas** — o 2.º epic (depois do 6) a fechar sem propor regra, sinal de que o corpo de regras cobre o território actual. **A A1 é bloqueadora e é decisão do Eurico.**

## 2. Estado exacto do repo (verificado 01/08/2026)

```
branch: main — HEAD 8a555104 (sincronizado com origin/main, mesmo SHA)
8a555104 docs(nexus-v2): close-story 9.10 + EPIC 9 FECHADO 11/11 — Nexus v2 production-ready [Story 9.10]
26a22080 docs(nexus-v2): runbook deploy contínuo Vercel + evidência NFR19/NFR20 [Story 9.10] (#113)
bab96e49 docs(nexus-v2): close-story 9.7 + handoff RETOMA — restore import ZIP DONE [Story 9.7]
```

- **Zero commits desde 16/07/2026.** Nada do Epic 9 ficou por commitar.
- **Por committar (trabalho desta sessão, docs-only):**
  - `imersao-tools/nexus/docs/retrospectives/EPIC-9-retrospective.md` (NOVO)
  - `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260716-EPIC-9-FECHADO-...md` (movido de `handoffs/` + bloco de consumo)
  - `imersao-tools/nexus/docs/handoffs/RETOMA-20260801-...md` (este ficheiro, NOVO)
  - `imersao-tools/nexus/docs/handoffs/INDEX.md` (actualizado)
  - `docs/HANDOFF-INDEX.md` (actualizado)

> **Ruído fora-scope (NÃO committar):** submódulos (`comunidade`, `starter-builder`), untracked (`.agent/`, `.agents/`, `.codex/`, `.antigravity/`, `PO-VALIDATION-*`, `PR-BODY-*`, backups `*.backup*`), e `9.1.story.md` (SUPERSEDED preservado em `active/`). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. As 6 acções da retrospectiva

| # | Acção | Owner | Bloqueia? |
|---|-------|-------|-----------|
| **A1** | **Reconciliar o âmbito do MVP com o Epic 7 (4/10).** O `EPIC-9.md` declara "roadmap MVP do PRD §9 completo", mas o **sub-âmbito OCR do Epic 7 (7.5-7.10, 6 stories, incl. a 7.9 herdeira da 6.15) nunca arrancou**. Decisão binária: **(a)** o OCR é MVP → o MVP não está completo e o Epic 7 retoma; **(b)** o OCR é pós-MVP → `EPIC-7.md`/`EPIC-9.md` reconciliados para o dizerem. **Não resolver por reescrita de documentação** | **Eurico** + `@pm` + `@po` | **SIM — condiciona o próximo trabalho** |
| A2 | **Observar, não legislar** — 3 padrões com gatilho: (i) hard-stop §8 em stories docs-only (1 ocorrência, 9.10 — só propor clarificação à 2.ª); (ii) contrato cross-story escrito (2 sucessos: 9.3→9.5, 9.6→9.7); (iii) `cr-base-main-no-gate-saida` revalidada 3.ª vez | `@po` regista; `@aiox-master` avalia no gatilho | Não |
| A3 | **Decidir o destino do backlog de débitos** — pendente desde a retro Epic 6, repetido na Epic 8, nunca decidido. Inventário: 8 Baixa + 1 Média do Epic 9, `[GAP-9.10-1]`, Baixa dos Epics 3-6, `REC-8.4-CR-1`+`REC-ADR10-PROXY-DRY`, P1.3/P2.x. **Prioridade recomendada: `REC-REPO-HYGIENE-GITLINKS` (Média)** — é a fricção que obriga a `git add` ficheiro-a-ficheiro em todas as stories | `@pm` + `@po` | Não |
| A4 | **Fechar as incógnitas (a)/(c)/(e) do `EPIC-9.md` §10** com resposta ou dono+gatilho: (a) decisão explícita de manter Anthropic; (c) FR86-FR96 funcional vs hardening; (e) `npm audit` actual (2 critical `request`/`node-telegram-bot-api` + 11 moderate). Juntar a incógnita da 9.9 AC3 (automação do veto por severidade) | Eurico + `@pm` + `@devops` | Não |
| A5 | **Memory log** — `MEMORY.md` com Epic 9 = 11/11, waiver 0/11, PRs #101-#113, branch protection 5 contexts, tripla PWA + round-trip backup, NFR19 mediana ~1m38s | `@aiox-master` ou Eurico | Não |
| A6 | **Sessão única de verificação manual de produção (~30 min)** sobre `https://imersao.ia.expressia.pt`, fechando a fila acumulada: AC9 da 9.4 (Lighthouse ≥85/90 + Add-to-Home), AC3 do epic (PWA instalável), AC6 da 9.10 (merge → deploy → novo SHA), + herdados AC13 da 4.9, AC6 da 7.3, AC8 da 7.4 | **Eurico** + `@devops` | Não (mas o MVP não está verificado end-to-end sem ela) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260801-retrospectiva-epic-9-CONCLUIDA-decisao-A1-mvp-vs-epic-7.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. PRÓXIMA ACÇÃO

**Passo 1 (mecânico) — `@devops` (Gage):** commit docs-only dos 5 ficheiros listados em §2 (`git add` ficheiro-a-ficheiro) + push. Precedente: o closure de cada retrospectiva anterior foi um commit docs adicional. Mensagem sugerida: `docs(nexus-v2): retrospectiva Epic 9 — 11/11 Done, waiver 0/11, 6 acções A1-A6, zero regras novas [Epic 9]`.

**Passo 2 (bloqueador) — Eurico:** decisão **A1**. É a bifurcação real:

| Se A1 = (a) OCR é MVP | Se A1 = (b) OCR é pós-MVP |
|-----------------------|---------------------------|
| O Epic 7 retoma: `@sm *draft 7.5` (sub-âmbito OCR, 6 stories 7.5-7.10). A 7.9 (foto recibo Telegram → OCR → finança) fecha a 6.15 diferida no Epic 6. `EPIC-9.md` reconciliado para "último epic de hardening", não "roadmap completo" | `EPIC-7.md` marcado como fechado-em-âmbito-Voice (4/4) com o OCR declarado pós-MVP; `@po *retrospective epic-7`; o Nexus v2 fica em modo evolução/manutenção |

**Passo 3 (independente da A1):** A3 + A4 (decisões de backlog e incógnitas) e A6 (verificação manual de produção) podem correr em qualquer altura. A A6 é a mais barata e a que falta para o "production-ready" ser verificado, não só declarado.

## 5. O que NÃO reabrir

- Nenhum ADR base (ADR-1 a ADR-10) — intactos ao longo dos 9 epics.
- Decisões seladas do Epic 9: `[D-9.11-TIMEOUT]`, `[D-9.3-NO-PRECACHE]`, `[D-9.5-NO-APP-SHELL]`, `[D-9.5-NO-STALE-CACHE]`, `[D-9.6-ZIPLIB]`.
- `[GAP-9.10-1]` (eliminar `src/` v1) — decidido **FORA DE ÂMBITO** pelo `@po`; débito técnico próprio, não bloqueador do epic.
- `REC-8.6-CUTOVER-DEFERIDO` — alavanca on-demand (Eurico + `@devops`); produção corre via Anthropic e está saudável. **Não voltar a propor recarregar/comutar sem gatilho.**
- A retrospectiva **não propõe regras novas** — não inventar uma a partir da observação A2 sem a 2.ª ocorrência.

## 6. Ciclo padrão / Git (referência)

`gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; **NUNCA `git add -A`**; hard-stop §8 (Iter 3+ = `Authorized-by: Eurico`). CR CLI: `coderabbit review --agent --type committed --base main`. Merge por `@devops`/`@aiox-master` (`merge-authority.md`) — **nunca merge manual ao Eurico**. `main` protegido com **5 required contexts** (4 CI Nexus v2 + `CodeRabbit`).

```
git checkout main
git pull --ff-only origin main   # HEAD = 8a555104
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260801-retrospectiva-epic-9-CONCLUIDA-decisao-A1-mvp-vs-epic-7.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `Orion (@aiox-master)`, executando `@po *retrospective epic-9`
DATA: `01/08/2026`
