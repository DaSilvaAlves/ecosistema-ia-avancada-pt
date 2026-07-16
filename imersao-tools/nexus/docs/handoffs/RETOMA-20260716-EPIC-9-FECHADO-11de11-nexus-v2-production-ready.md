# RETOMA — EPIC 9 FECHADO 11/11 — Nexus v2 PRODUCTION-READY (roadmap MVP do PRD §9 completo)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Epic:** 9 — Hardening + Deploy + PWA — `imersao-tools/nexus/docs/EPIC-9.md` — **FECHADO 11/11**
**Story desta retoma:** **9.10 (Deploy contínuo Vercel, NFR19) FECHADA (Done, merged)** — ÚLTIMA do Epic 9 e do roadmap MVP
**Data:** 16/07/2026
**from_agent:** @po (Pax) · **to_agent:** any (próxima acção = `@po *retrospective epic-9`) · **status:** pending
**Branch de partida:** `main` (HEAD = `26a22080` + closure commit docs desta retoma)

**Porquê este handoff:** a 9.10 — a ÚLTIMA unidade do Epic 9 — percorreu o ciclo completo (verificação de produção → draft → validate → dev → gate `@architect` → CR Iter 1→2→3 → push → PR #113 → merge → close) e está DONE em `main`. **Com este fecho o Epic 9 fica 11/11 e o Nexus v2 fica production-ready.** Substitui e arquiva o handoff anterior (`RETOMA-20260712-story-9.7-...`).

---

## 1. Resumo executivo (1 parágrafo)

O **Epic 9 (Hardening + Deploy + PWA) está FECHADO — 11/11 unidades Done, waiver rate 0/11 (0%)**. A 9.10 formalizou o deploy contínuo Vercel (NFR19): não foi implementação de raiz — o `production-state-verification-gate.md` (regra A1 nascida do incidente 8.6) foi executado **no arranque** contra a plataforma e revelou que o **auto-deploy on-push em `main` já estava operacional** (Git Integration nativa, `productionBranch=main`, 12 deployments recentes `GIT:main@sha`), o `4e2b1c4`/J-6 já **superado**, e as env vars de produção sem `OPENAI_API_KEY` (Epic 8 deferido). A story consolidou tudo num **runbook** (`docs/runbooks/deploy-continuo-vercel.md` — fluxo push→build→prod, previews por PR, rollback Dashboard+CLI mapeado a NFR20, env vars por nome, medição NFR19, checklist pós-merge) + evidência de verificação na story + 1 correcção documental (`architecture-v2.md` §13.2 região `iad1`→`fra1`). NFR19 medido: 4/5 deployments <2min (mediana `build→ready` ~1m38s). Architect Gate PASS Confiança Alta; CR APPROVED 0 actionable; hard-stop §8 respeitado (`Authorized-by: Eurico` Iter 3). **O roadmap MVP (PRD §9) está completo — o Nexus v2 está production-ready.**

## 2. Estado exacto do repo (verificado 16/07/2026)

```
branch: main — HEAD 26a22080 (merge da 9.10, PR #113) + closure commit docs 9.10 (esta retoma)
26a22080 docs(nexus-v2): runbook deploy contínuo Vercel + evidência NFR19/NFR20 [Story 9.10] (#113)
bab96e49 docs(nexus-v2): close-story 9.7 + handoff RETOMA — restore import ZIP DONE, round-trip backup completo, Epic 9 10/11 [Story 9.7]
f6ac9f99 feat(nexus-v2): restore import ZIP — validação antes de escrita destrutiva [Story 9.7] (#112)
```

- PR #113 merged squash `26a22080` (head final `89274eab`), branch `feat/9.10-deploy-continuo-runbook` eliminada.
- **Branch protection de `main` = ACTIVA com 5 required contexts** (4 CI Nexus v2 + `CodeRabbit`). `strict=false`, `enforce_admins=false`.
- **Closure commit docs da 9.10 — staged pelo `@po`:** rename `stories/active/9.10.story.md` → `stories/completed/9.10.story.md` (Done, Change Log v1.0, decisão `[GAP-9.10-1]` fora de âmbito) + `EPIC-9.md` (9.10→DONE, estado FECHADO 11/11, §5/§10/§172/§176 reconciliados, production-ready) + este handoff + arquivo do handoff 9.7 + INDEX local + `docs/HANDOFF-INDEX.md` central.

> **Ruído fora-scope (NÃO committar):** submódulos (`comunidade`, `starter-builder`), untracked (`.agent/`, `.agents/`, `.codex/`, `.antigravity/`, backups `*.backup*`), e `9.1.story.md` (SUPERSEDED preservado em `active/`). **`git add` ficheiro-a-ficheiro. NUNCA `git add -A`/`.`**

## 3. O que a 9.10 fixou / decisões e lições a NÃO reabrir

- **Ficheiros da 9.10:** `docs/runbooks/deploy-continuo-vercel.md` (NOVO), `docs/stories/{active→completed}/9.10.story.md` (movida), `docs/architecture-v2.md` §13.2 (`iad1`→`fra1`, 1 linha). **Zero código de aplicação, `vercel.json`, `.vercel/project.json`, `.github/workflows/**`, `package.json` — AC7 por diff.**
- **[LIÇÃO — a regra `production-state-verification-gate.md` funcionou]:** ao contrário da 8.6 (que descobriu a premissa evaporada só no gate final), a 9.10 verificou o estado real de produção **no arranque**. A premissa confirmou-se → a story redefiniu-se de "implementar" para "formalizar/documentar". É o padrão a repetir em qualquer story futura de estado LIVE.
- **[DECISÃO `@po` — `[GAP-9.10-1]` FORA DE ÂMBITO]:** eliminar `src/` v1 legacy fica como **débito técnico próprio** para decisão futura do Eurico. Fundamentação: (a) a condição de arch (`§16`: eliminar só se `tests/e2e/migration-smoke.spec.ts` passar) é **insatisfazível hoje** — esse ficheiro NÃO existe; (b) é **ortogonal ao deploy** — produção só constrói `imersao-tools/nexus/v2/` (`rootDirectory`); (c) o critério de fecho do Epic 9 (PRD §10, "11/11 Done") não o lista como AC. **NÃO reabrir como bloqueador do epic.**
- **Região de produção = `fra1` (Frankfurt)**, não `iad1` — a entrada `iad1` de `architecture-v2.md` §13.2 era histórica (04/05/2026). Confirmado por API v13 (deployment activo `regions:["fra1"]` coincide com `v2/vercel.json`). **NÃO tocar `vercel.json`.**
- **Waiver M1 (env vars `KV_*`/VAPID não expandidos para nomes literais):** pré-adjudicado justificado pelo `@architect` — `KV_*` é set fixo da integração Vercel KV (notação precisa, não invenção — Constitution Art. IV). 0 waivers substantivos.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260716-EPIC-9-FECHADO-11de11-nexus-v2-production-ready.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. PRÓXIMA ACÇÃO: `@po *retrospective epic-9`

Com o Epic 9 fechado 11/11, o passo natural (precedente Epics 1/2/3/4/5/8) é a **retrospectiva do Epic 9**. Pontos de partida sugeridos para a retro (não exaustivo):

| Tema | Nota |
|------|------|
| **`production-state-verification-gate.md` provou-se** | A regra A1 do Epic 8 evitou na 9.10 exactamente o erro que a originou (8.6). Registar como validação da regra (não só de correcções — também de sucessos). |
| **Split operacional 9.1a/9.1b** | Hard-stop §8 antecipado pelo `@po` evitou Iter 3+ num PR gigante de cobertura. Padrão a manter. |
| **CR server-side ≠ CR local** | Lição recorrente (9.4/9.8): o CR `--base main` local deu limpo mas o server-side apanhou Major reais. Verificar sempre o head SHA do PR. |
| **Débitos Baixa acumulados** | REC-9.3/9.5/9.6/9.7-* + `[GAP-9.10-1]` (eliminar `src/` v1) + incógnitas (c)/(d)/(e) do §10 (FR86-96, backlog débitos, npm audit) — decidir destino: story de housekeeping ou backlog. |
| **Waiver rate 0/11** | Alvo cumprido (série 0% desde o Epic 2). |

**Débito aberto formal:** `[GAP-9.10-1]` — eliminar `src/` v1 legacy (decisão futura do Eurico; requer criar `migration-smoke.spec.ts` primeiro OU decisão de eliminar sem esse gate).

**Estado do Epic 9:** Done 11/11 — 9.11, 9.1 (9.1a+9.1b), 9.2, 9.8, 9.9, 9.3, 9.4, 9.5, 9.6, 9.7, **9.10**. Falta: nada. **Nexus v2 production-ready.**

## 5. Ciclo padrão / Git (referência)

`gh` SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; NUNCA `git add -A`; hard-stop §8 (Iter 3+ = `Authorized-by: Eurico`). CR CLI: `coderabbit review --agent --type committed --base main`. Merge por `@devops`/`@aiox-master` (`merge-authority.md`) — nunca merge manual ao Eurico. Para trabalho futuro pós-MVP: é evolução, não âmbito do MVP (o roadmap PRD §9 está fechado).

```
git checkout main
git pull --ff-only origin main   # HEAD = 26a22080 (+ closure commit docs 9.10)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260716-EPIC-9-FECHADO-11de11-nexus-v2-production-ready.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@po (Pax)`
DATA: `16/07/2026`
