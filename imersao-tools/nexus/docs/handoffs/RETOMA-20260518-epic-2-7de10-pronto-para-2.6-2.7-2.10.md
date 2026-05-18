# RETOMA — Nexus v2 Epic 2 (7/10 Done) pronto para Stories 2.6 / 2.7 / 2.10

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 18/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Estado:** Epic 2 — 7/10 Done em main, pronto para próxima story (2.6 / 2.7 / 2.10)
**Localização canónica:** `imersao-tools/nexus/`
**Branch:** `main` (sincronizado com origin/main)
**Tip main:** `142f4819` (closure Story 2.9)
**Autor:** sessão Claude Code 17-18/05/2026, ~18 sub-delegações

---

## Sumário executivo (1 parágrafo)

Sessão massiva de 17-18/05/2026 fechou **5 ciclos completos** no Nexus v2: Story 2.8 (CRUD projectos) merged PR #23, hotfix do classifier (markdown fences com prosa) merged PR #24 e validado em produção, débito D7 registado em EPIC-2 §10 (fallback PT-BR no classifier), Story 2.9 (vista detalhada projecto `/projectos/[id]`) drafted+validated+implemented+QA+merged PR #25, closure 2.9 em main. Epic 2 está agora **7/10 Done** (2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 2.9) com **0% waiver rate** e **11 stories consecutivas QA Gate PASS first-iter**. Próximo passo é decisão estratégica entre as 3 pendentes (2.6 tags, 2.7 recorrência, 2.10 tools cérebro) ou retrospectiva intermédia Epic 2.

---

## Estado real verificado em main

```
142f4819 docs(nexus-v2): close Story 2.9 — MERGED em main via PR #25 squash d2acca51 (Epic 2 7/10 Done)
d2acca51 feat(nexus-v2): Story 2.9 — vista detalhada de projecto com tabs Lista/Kanban (Epic 2 UI) (#25)
7c01fa55 docs(nexus-v2): EPIC-2 §10 — regista D7 (fallback intent vazio em PT-BR)
eff7955d fix(nexus-v2): classifier — strip markdown fences mesmo com prosa a seguir (#24)
3eeefaf9 docs(nexus-v2): close Story 2.8 — MERGED em main via PR #23 squash bebbd530 (Epic 2 6/10 Done)
```

| Métrica | Valor |
|---------|-------|
| Branch local + remote | `main` (sincronizado, 0 ahead/0 behind) |
| Stories Done Epic 2 | **7/10** (2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 2.9) |
| Pendentes Epic 2 | 3 (2.6 tags, 2.7 recorrência, 2.10 tools cérebro) |
| PRs Epic 2 merged | 7 (#18, #19, #20, #21, #22, #23, #25) |
| QA Gate PASS first-iter consecutivos (Epic 1+2) | **11 stories** |
| Waiver rate Epic 2 | **0%** (alvo <20%) |
| Produção | LIVE em https://imersao.ia.expressia.pt — hotfix #24 validado |

**Working tree (esperado em qualquer terminal):**
- 2 submódulos modified (não staged): `imersao-tools/comunidade`, `imersao-tools/starter-builder` — INTACTOS, não mexer
- 150+ untracked fora-scope (`.agent/`, `.antigravity/`, `BESTSELLER-*`, `.aiox-pm-config.yaml`, etc.) — INTACTOS, não mexer

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260518-epic-2-7de10-pronto-para-2.6-2.7-2.10.md`. ESTÁ DENTRO DA PASTA `imersao-tools/nexus/` (projecto Nexus v2 a que se refere). LOCALIZAÇÃO VÁLIDA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## O que foi feito nesta sessão (cronológico)

### Ciclo 1 — Story 2.8 (CRUD projectos) merged

- PR #23 já existia OPEN com QA Gate PASS pendente quando sessão começou
- Quinn re-validou: 511/511 tests PASS, coverage 73.71% page / 91.76% components
- 1 CONCERN minor M1 não-bloqueante (aria-describedby select status)
- Eurico fez merge manual: squash `bebbd530`
- Pax closure commit `3eeefaf9` → push origin/main
- Epic 2: 5/10 → 6/10 Done

### Ciclo 2 — Hotfix classifier PR #24

- **Bug produção:** Eurico viu erro "Classifier: resposta da API não é JSON válido" ao escrever "avança"/"AVANÇA"
- **Causa:** Haiku 4.5 retorna JSON em ``` ```json ... ``` ``` + prosa explicativa PT-PT a seguir; hotfix anterior (`15de4f74`) só cobria fence simétrico no fim absoluto da string
- **Fix por Dex:** `stripJsonMarkdownFences` reescrito (4 casos) + `extractFirstJsonObject` (escape-aware counter) em `v2/lib/agent/providers/anthropic.ts`
- **3 tests novos:** copiam output literal do screenshot do Eurico (`mock-protocol-fidelity.md` cumprida)
- **QA Quinn:** PASS — red→green provado (substituiu temp pela versão pré-fix, viu test partir com mensagem idêntica ao screenshot, restaurou)
- **PR #24 merged:** squash `eff7955d`
- **Validado em produção:** Eurico testou "avança"/"AVANÇA" pós-deploy + hard refresh, sistema responde graceful sem partir

### Ciclo 3 — D7 registado

- Observação pós-hotfix #24: resposta de fallback em PT-BR com emojis ("Parece que **sua** mensagem foi curta 😊...")
- Viola `language-standards.md` (PT-PT) + `output-format-standards.md` (emojis)
- D7 registado em EPIC-2 §10 — Pax commit `7c01fa55` → push origin/main
- Solução proposta: PT-PT no system prompt + template fixo PT-PT + test regex anti-PT-BR

### Ciclo 4 — Story 2.9 drafted + validated

- River draft com 15 ACs em `docs/stories/2.9.story.md` (rota `/projectos/[id]`, header sticky, tabs Lista/Kanban WAI-ARIA, edit reaproveitado, etc.)
- Pax validate GO 10/10 (todos os 10 critérios PASS)
- Status: Draft → Ready

### Ciclo 5 — Story 2.9 implemented + merged

- **A7 decidido pelo Dex:** `ProjectTaskRow.tsx` novo (4 razões — `<tr>` vs lista, handlers obrigatórios out-of-scope, coluna redundante, complexidade `TaskKebabMenu`)
- **9 ficheiros:** 6 criados (page + Header + TaskRow + colors.ts + tests + story doc) + 3 modificados cirúrgicos (ProjectCard + ProjectsGrid + projectos/page.tsx)
- **Quality gates Dex:** 529/529 tests PASS, coverage page 99.31% / components 91.41% / all-files 88.76%, lint+typecheck+build clean
- **QA Quinn:** PASS first-iter (11ª consecutiva), 6 CONCERNS Dex + 1 novo (M2 — divergência label "Feita" canónico vs "Concluídas" AC4/AC11)
- **PR #25 merged:** squash `d2acca51`
- **Pax closure:** `142f4819` → push origin/main
- Epic 2: 6/10 → **7/10 Done**

---

## Próximo passo — 5 opções estratégicas

### Opção 1: `@sm *draft 2.10` (Recomendada — sequência natural)

**Tools cérebro tarefas/projectos (FR?)** — integra Epic 1 (orchestrator/executor) com Epic 2 (UI). Desbloqueada por 2.1 (tasks) + 2.8 (projectos). Fecha o ciclo cérebro+UI antes de ir para features horizontais.

```
@sm *draft 2.10
```

### Opção 2: `@sm *draft 2.6` (Tags global FR14)

Funcionalidade horizontal independente. Tags transversais a tasks/projectos/notas com gestão central + autocomplete + filtragem.

```
@sm *draft 2.6
```

### Opção 3: `@sm *draft 2.7` (Motor recorrência FR10)

Mais complexo tecnicamente. State machine + cron-like para gerar instâncias automáticas (diária/semanal/mensal/custom).

```
@sm *draft 2.7
```

### Opção 4: Paralelizar 2.6 + 2.7 + 2.10 em 3 sessões distintas

Útil se quiseres ter 3 stories Ready em paralelo. Cada draft é independente — podem ser feitos em terminais diferentes.

### Opção 5: `@po *retrospective epic-2-intermedia`

Capturar lições aprendidas com 7/10 Done antes das últimas 3. Útil para validar padrões consolidados (11 first-iter PASS, 0% waiver) e identificar riscos para as pendentes.

```
@po *retrospective epic-2-intermedia
```

---

## Como retomar noutro terminal — passos exactos

1. **Abrir terminal em qualquer máquina/sessão**

2. **Confirmar estado:**
   ```bash
   cd "C:/Users/XPS/Documents/ecosistema-ia-avancada-pt/imersao-tools/nexus"
   git status
   git log --oneline -5 main
   ```
   Espera ver tip em `142f4819` e working tree com submódulos modificados + 150+ untracked fora-scope (todos legítimos, não tocar).

3. **Confirmar produção LIVE:**
   ```bash
   curl -sI https://imersao.ia.expressia.pt | head -5
   ```
   Espera 200 OK.

4. **Ler este handoff:**
   ```bash
   cat docs/handoffs/RETOMA-20260518-epic-2-7de10-pronto-para-2.6-2.7-2.10.md
   ```

5. **Decidir entre as 5 opções acima** e executar comando AIOX correspondente

6. **NÃO mexer:**
   - Submódulos `comunidade` e `starter-builder` (modified mas legítimos, fora-scope)
   - 150+ untracked fora-scope (`.agent/`, `.antigravity/`, `BESTSELLER-*`, etc.)
   - Ficheiros pré-existentes em `docs/handoffs/` (todos legítimos)

7. **Marcar este handoff como CONSUMIDO** quando começar a trabalhar:
   - Mover para `docs/handoffs/archive/`
   - Actualizar entry em `docs/HANDOFF-INDEX.md` (raiz do ecosistema)

---

## Débitos abertos EPIC-2 §10 (consultar antes de planear closure final)

| ID | Título | Prioridade |
|----|--------|-----------|
| D1-D5 | Retrospectiva Epic 2 (vários) | Várias |
| D6 | Delete projecto com cascata `Task.projectId` (set null vs bloquear vs cascade) | Média |
| D7 | Fallback de intent vazio em PT-BR no classifier | Média |
| M1 | aria-describedby ausente em select `status` ProjectFormModal:268-279 | Baixa |
| M2 | Divergência label "Feita" canónico vs "Concluídas" em AC/comments 2.9 | Baixa |

Detalhe completo em `imersao-tools/nexus/docs/EPIC-2.md` §10.

---

## Regras críticas a respeitar (todas validadas nesta sessão)

| Regra | Resumo |
|-------|--------|
| `mock-protocol-fidelity.md` | Mocks reflectem protocolo real (provada em hotfix #24 — copia output literal de produção) |
| `not-tested-trailer-rules.md` | `Not-tested:` é red flag se commit toca CI/test-runner config; é waiver válido em código de aplicação |
| `separation-of-roles.md` | Executor ≠ Quality gate. Dex impl, Quinn gate; nunca o mesmo agente |
| `mandatory-change-log.md` | Change Log em stories + `Changes:` block em commits |
| `language-standards.md` | PT-PT obrigatório (sem "você"/"sua"/"em um") |
| `handoff-location.md` | Handoffs dentro da pasta do projecto a que se referem (este handoff cumpre) |
| `frusoal-source-of-truth.md` | N/A nesta sessão |
| `comunidade-safety.md` | N/A nesta sessão (não tocada) |
| `imersao-pipeline-rules.md` | N/A (Nexus v2 não usa portas 5190-5196) |

---

## Padrões consolidados Nexus v2 (12+ stories)

- **11 stories consecutivas QA Gate PASS first-iter** (Epic 1 1.5-1.10 + Epic 2 2.1, 2.3, 2.4, 2.5, 2.8, 2.9)
- **0% waiver rate Epic 2** (alvo <20% atingido com folga)
- **`--admin --squash --delete-branch`** padrão para todos os PRs Epic 2
- **Closure commit docs-only directo para main** (sem PR, sem CI) — convenção Nexus v2 desde Story 2.2
- **Pre-push CodeRabbit local** — findings fora-scope em untracked são aceitáveis
- **Stage selectivo crítico** — submódulos + 150+ untracked fora-scope NUNCA staged
- **PT-PT em todo o código, copy, comentários, stories** (zero "você"/"sua"/"em um")
- **Agente CodeRabbit server-side em PR Iter 1** — review automático no abrir do PR
- **Eurico faz merge manual** (não @devops) — convenção rígida cimentada em 12 stories

---

## Referências (commits + PRs desta sessão)

| Ciclo | Commits / PR | URL |
|-------|--------------|-----|
| Story 2.8 merge | PR #23 squash `bebbd530` | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/23 |
| Story 2.8 closure | `3eeefaf9` | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/commit/3eeefaf9 |
| Hotfix classifier | PR #24 squash `eff7955d` | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/24 |
| D7 registo | `7c01fa55` | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/commit/7c01fa55 |
| Story 2.9 merge | PR #25 squash `d2acca51` | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/25 |
| Story 2.9 closure | `142f4819` | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/commit/142f4819 |

## Ficheiros chave (para retoma)

- **Stories completadas:** `docs/stories/completed/2.*.story.md`
- **Story 2.9 (mais recente):** `docs/stories/completed/2.9.story.md`
- **Epic backlog:** `docs/EPIC-2.md` (estado 7/10 + débitos §10)
- **INDEX handoffs Nexus:** `docs/handoffs/INDEX.md`
- **INDEX handoffs central:** `../../../docs/HANDOFF-INDEX.md` (raiz ecosistema)
- **Memória persistente agentes:** `docs/handoffs/.claude/agent-memory/{agent}/MEMORY.md`

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- **PROJECTO A QUE SE REFERE:** Nexus v2 (Epic 2)
- **LOCALIZAÇÃO CORRECTA:** `imersao-tools/nexus/docs/handoffs/RETOMA-{data}-{slug}.md`
- **LOCALIZAÇÃO ACTUAL:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260518-epic-2-7de10-pronto-para-2.6-2.7-2.10.md`
- **COINCIDEM?** **SIM**

SE NÃO COINCIDISSEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

**AGENTE RESPONSÁVEL:** Claude Code main (sessão 17-18/05/2026, 18+ sub-delegações)
**DATA:** 18/05/2026
**STATUS:** PENDING (aguarda próxima sessão)
**TO_AGENT:** any (Eurico decide qual agente AIOX activar conforme opção escolhida)
