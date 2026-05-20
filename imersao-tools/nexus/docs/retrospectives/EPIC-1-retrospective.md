# Retrospectiva — Epic 1 Nexus v2 (Cérebro Multi-Intent)

> **Autor:** Pax (`@po`) | **Data:** 12/05/2026
> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Branch consolidação:** `main` @ `5514b310` (squash PR #14)
> **Período:** 05/05/2026 17:18 → 12/05/2026 14:00 (UTC+1, Lisboa)

---

## 1. Sumário executivo

- **10/10 stories Done** em main (1.1 a 1.10) — Epic 1 fechado 100%.
- Pipeline E2E validado: classifier → Tool Registry → executor SSE → `ConfirmationProvider` → `UndoToast` → Dexie audit log.
- **5 ADRs Aria** (ver `project_nexus_v2_architecture.md`) mantidos sem reabertura durante todo o epic.
- **Padrão "merge waived" consolidado** em 5 stories consecutivas (1.5, 1.6, 1.7, 1.8, 1.9) — Story 1.10 foi a primeira do epic a fechar com merge limpo (CR não-bloqueante).
- **Story 1.10 outlier:** 5 iterações de fix CI (3 dias) por causa de mock SSE divergente + cookie sharing E2E + `testIgnore` Playwright na CI discovery.
- **Vercel production live:** `https://imersao.ia.expressia.pt` (continuamente desde Epic 0, 04/05/2026).
- **Zero bugs em produção pós-deploy** durante o Epic 1 (excepto hotfix PR #15 classifier markdown fences detectado 09/05, em curso fora do epic).

---

## 2. Métricas concretas

### 2.1 — Stories e iterações

| Métrica | Valor | Observação |
|---------|-------|------------|
| Total stories | 10 | 1.1 → 1.10 |
| Stories com 0 iter CR | 1 | 1.3 (Tool Registry — única clean) |
| Stories com 1 iter CR | 6 | 1.1, 1.2, 1.4, 1.6, 1.7, 1.8 |
| Stories com 2 iter CR | 2 | 1.5, 1.9 |
| Stories com 5 iter CR | 1 | **1.10** (outlier — E2E regression) |
| Mediana de iterações | 1 | |
| Total iterações de fix CR/CI | **16** (1+1+0+1+2+1+1+1+2+5+ closure) | Mediana é 1; concentração em 1.10 |
| Stories com decisão "merge waived" pelo Eurico | 5 | 1.5, 1.6, 1.7, 1.8, 1.9 (consecutivas) |
| Stories merged-clean (sem waiver) | 5 | 1.1, 1.2, 1.3, 1.4, 1.10 |
| Hard-stop max-2-iter respeitado | 10/10 | Em nenhuma story houve >2 iter de qa-loop-fix (Story 1.10 foram 5 iter de **CI fix**, não qa-loop) |

### 2.2 — Velocidade do epic

| Métrica | Valor |
|---------|-------|
| Início Epic 1 (1.1 primeiro commit) | 05/05/2026 17:18 |
| Fim Epic 1 (PR #14 merge) | 12/05/2026 14:00 |
| **Duração total** | **7 dias corridos** |
| Stories/dia (média) | 1.43 |
| Stories/dia ignorando Story 1.10 (9 stories em 3.5 dias) | **2.57** |
| Story mais rápida (start → merge) | 1.8 (~1h) |
| Story mais lenta | 1.10 (~3 dias) |

### 2.3 — PRs e CI

| Métrica | Valor |
|---------|-------|
| Total PRs Epic 1 | 10 (PRs #4 a #14, sequenciais 1 por story) |
| PRs com CodeRabbit CHANGES_REQUESTED stale | 5 (todas as "merge waived") |
| Total commits Story 1.10 | 16+ commits (Iter 1 → Iter 5 + handoffs + closure) |
| Total commits Epic 1 | ~80+ commits |
| Bugs produção pós-deploy | 1 (classifier markdown fences — fora do epic, hotfix PR #15) |

---

## 3. Loved — o que funcionou bem

### 3.1 — Arquitectura pré-validada (5 ADRs Aria) zero retrabalho

Os 5 ADRs decididos pela Aria a 04/05/2026 (Edge/Node split, Dexie 4 desde dia 1, Tiptap 2, Vitest+MSW, Tool Registry pattern) **não foram reabertos** durante todo o Epic 1. **Evidência:** memória `project_nexus_v2_architecture.md` + zero handoffs de architecture-review post-Story 1.1.

### 3.2 — Story 1.3 (Tool Registry) — exemplo de execução perfeita

Story 1.3 foi a única com **0 iterações de CR** e duração de ~2h (start → merge). Mostra que stories bem-scopeadas com tooling pronto (Zod + fail-loud já decidido em ADR) executam linearmente. **Evidência:** commits `feat...17:59` → `chore close...20:16` em 06/05.

### 3.3 — Hard-stop max-2-iter QA loop respeitado em 10/10 stories

Em nenhuma story o `qa-loop-fix` ultrapassou 2 iterações. Quando o CR Iter 2 ainda devolvia CHANGES_REQUESTED stale, **o padrão "merge waived" foi accionado correctamente** (CR status check head SHA confirma SUCCESS, reviewDecision fica stale, escalação para Eurico). Esse processo poupou ciclos infinitos.

### 3.4 — Handoff lifecycle disciplinado

Todos os handoffs do epic seguiram a regra `handoff-location.md` (em `imersao-tools/nexus/docs/handoffs/`), foram consumidos e arquivados sem perdas. **Evidência:** 47 handoffs arquivados em `archive/`, INDEX actualizado em cada transição.

### 3.5 — Constraint `executor != quality_gate` enforçado em Story 1.10

Na Story 1.10, @qa (Quinn) executou parte do trabalho (fixtures + scripts) e **@architect (Aria)** foi o quality gate independente. Em v0.4 deu CONCERNS; em v0.5 deu APPROVED após F-CONCERNS 1/2/3 resolvidos. **Separação de papéis funcionou.**

---

## 4. Learned — lições novas (CRÍTICAS)

### 4.1 — Mock vs real protocol drift (Story 1.10 Iter 1-3)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 1.10, Iter 1-3 (06/05 → 09/05) |
| **Sintoma** | E2E regression suite passava localmente com mock MSW, mas falhava em CI no `50-prompt regression` |
| **Causa raiz** | Mock MSW SSE divergia do protocolo real de `executor.ts` em **5 pontos**: meta phase, `text_delta` vs `delta`, `done` fields, wire format, terminator |
| **Memória já existente** | `feedback_mock_must_reflect_real_protocol.md` — confirmada e em vigor |
| **Lição** | Mocks de protocolos externos espelham o protocolo real, não apenas fazem tests passar. **Esta lição é canónica e deve ser regra formal AIOX**, não apenas memória local |
| **Acção** | Ver **A1** (regra formal `.claude/rules/mock-protocol-fidelity.md`) |

### 4.2 — `testIgnore` Playwright filtra na discovery (Story 1.10 Iter 4-5)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 1.10, Iter 4 commit `887e6c2f` (11/05 23:51), Iter 5 commit `3ca33962` (12/05 11:52) |
| **Sintoma** | CI workflow `nexus-v2-ci.yml` corria `npm run test:e2e` que descobria **0 tests**, mesmo apontando explicitamente para `auth.spec.ts + smoke.spec.ts` |
| **Premissa errada (Iter 4)** | "`testIgnore: ['**/regression/**']` exclui regression dos workflows regulares mas mantém `npm run test:e2e` global a funcionar" → FALSO |
| **Causa raiz** | `testIgnore` filtra na **fase de discovery** do Playwright, **antes** de aplicar paths CLI. Tornou o `test:e2e` global vazio em qualquer contexto |
| **Fix Iter 5** | Remover `testIgnore` + scope explícito `test:e2e` no `package.json` para `auth.spec.ts auth+smoke.spec.ts`. Workflow regression dedicado em `e2e-regression.yml` |
| **Red flag não vista a tempo** | A correcção Iter 4 foi commitada com `Not-tested:` no commit message para "regression CI run". O `Not-tested:` em commit que toca **config de CI** deveria ter sido red flag (não waiver válido) |
| **Acção** | Ver **A2** (gate template story) + **A3** (regra `not-tested-on-ci-config.md`) |

### 4.3 — Cookie sharing E2E entre `APIRequestContext` e `BrowserContext` (Story 1.10 Iter 2)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 1.10, Iter 2 commit `d8b7435b` (09/05 16:05) |
| **Sintoma** | Auth via `request.post` (login API) não partilhava cookies com `page.goto` no mesmo test |
| **Causa raiz** | Playwright `APIRequestContext` (`request`) e `BrowserContext` (`page`) são contextos isolados por defeito |
| **Fix** | Usar `page.request` (não `request` global) — partilha cookies automaticamente com a page |
| **Lição** | E2E auth pattern em Playwright requer `page.request` para login + browser actions na mesma sessão. Documentar como skill/snippet em `.aiox-core/data/playwright-patterns.md` para futuras stories E2E |
| **Acção** | Ver **A4** (snippet Playwright auth pattern) |

### 4.4 — Padrão "merge waived" recorrente (5 stories consecutivas)

| Item | Detalhe |
|------|---------|
| **Onde** | Stories 1.5, 1.6, 1.7, 1.8, 1.9 (07/05 → 08/05) |
| **Sintoma** | CR submetia `CHANGES_REQUESTED` em SHAs antigos; após fixes, head SHA tinha status check `CodeRabbit Status: PASS`; mas `reviewDecision` no GitHub-formal ficava stale (`CHANGES_REQUESTED`) |
| **Causa raiz** | GitHub Reviews não auto-dismiss em novos pushes. CR submete novos `COMMENTED` (não `APPROVED`) → `reviewDecision` fica congelado em Iter 1 |
| **Decisão** | CR status check head SHA = autoridade canónica; `reviewDecision` stale = ignorar com waiver documentado |
| **Comparação 1.5-1.9 vs 1.10** | Story 1.10 fechou **sem waiver** porque a equipa: (a) refactorou mock alinhando ao protocolo real (resolveu Iter 1-3 sem deixar drift), (b) o CR Iter 4+5 submeteu apenas `COMMENTED` (não CHANGES_REQUESTED). Diferença: trabalho foi mais profundo, menos cosmético |
| **Lição** | "Merge waived" é mecanismo de escape válido mas indicador de fricção. Quando recorrente, **investigar se o problema está no scope da story ou no estilo de CR feedback**, não tratar como normal |
| **Acção** | Ver **A5** (review do CR onboarding + tuning de severidade) |

### 4.5 — Constraint executor ≠ quality_gate (regra implícita até Story 1.10)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 1.10 quality gate (Aria APPROVED v0.5, não Quinn que executou as fixtures) |
| **Sintoma** | Em stories anteriores (1.1-1.9), @qa fazia qa-gate sobre código que `@dev` implementava. Em 1.10, parte da Story foi feita por @qa (fixtures + scripts) — quem faz quality gate? |
| **Decisão tomada** | @architect (Aria) actuou como quality gate quando @qa foi parcial executor |
| **Lição** | Constraint **executor != quality_gate** deve virar regra formal AIOX, não apenas decisão ad-hoc. Aplicável a qualquer agente que execute parte do trabalho |
| **Acção** | Ver **A6** (regra `.claude/rules/separation-of-roles.md`) |

---

## 5. Lacked — o que faltou (gaps de framework)

### 5.1 — CodeRabbit local skipped sistematicamente em worktrees Windows

Em **todas** as iterações de Story 1.10 (e várias anteriores), o CR local foi `SKIPPED` por incompatibilidade WSL + linked-worktree Windows. Resultado: CR só corre no PR remoto, fechando o loop **depois** do push, não antes.

- **Limitação documentada de forma informal** em handoffs (`RETOMA-20260511-story-1.10-iter5-fix-ready-for-push.md`).
- **Nunca foi formalizada em regra.**
- **Acção:** A7

### 5.2 — Template de story não exige evidência local para `Not-tested:`

O commit message `887e6c2f` Iter 4 incluiu `Not-tested: regression CI run` sem evidência local de que o `testIgnore` não quebraria a discovery. **Template story actual permite isto.**

- **Acção:** A2

### 5.3 — Retrospectiva Epic 0 não existe

Não há documento de retrospectiva Epic 0 em `imersao-tools/nexus/docs/retrospectives/` (pasta acabou de ser criada hoje). Lições do Epic 0 ficaram apenas em `project_nexus_v2_producao.md` (memória) sem template estruturado.

- **Acção:** A8

### 5.4 — Sem dashboard de iter-por-story para detectar outliers cedo

Story 1.10 ultrapassou 3 iter antes de ser sinalizada explicitamente como outlier. Em projectos maiores, isto pode passar despercebido.

- **Acção:** A9

---

## 6. Longed for — wishlist para Epic 2

| # | Wish | Tipo |
|---|------|------|
| W1 | Skill `mock-fidelity-check` que compara mock vs protocolo real automaticamente | Skill nova |
| W2 | Comando `@po *iter-status` que reporta iter count por story em curso vs threshold | Comando agent |
| W3 | Pre-push check que falha se `Not-tested:` aparece em commit que toca `.github/workflows/**` ou `*.config.ts` | Quality gate |
| W4 | CR local funcional em Windows (Docker container?) ou política explícita "CR só remoto" | Tooling |
| W5 | Template retrospective formal para correr automaticamente ao fechar epic | Template @po |
| W6 | Snippets library de patterns E2E recorrentes (Playwright auth, cookie share, SSE mock) | Docs / skill |

---

## 7. Decisões accionáveis

Lista numerada de acções concretas — cada uma com owner, deadline e critério de Done.

| # | Acção | Owner | Deadline | Done quando |
|---|-------|-------|----------|-------------|
| **A1** | Criar regra formal `.claude/rules/mock-protocol-fidelity.md` que codifica a memória `feedback_mock_must_reflect_real_protocol.md`. Aplica-se a TODOS os mocks de protocolos externos (SSE, HTTP, WebSocket). | `@aiox-master` | **Antes Epic 2** | Regra existe no projecto + 1 PR Epic 2 refactora 1 mock aplicando-a |
| **A2** | Adicionar gate ao template story (`.aiox-core/development/templates/story-tmpl.yaml`): `Not-tested:` em commits que tocam `.github/workflows/**`, `playwright.config.ts`, `vitest.config.ts`, `package.json` (scripts) requer **evidência local prévia** (output `--list` ou similar) anexada ao Change Log da story. | `@sm` (River) | **Antes Epic 2** | Template alterado + 1 story Epic 2 aplica o gate |
| **A3** | Criar regra `.claude/rules/not-tested-trailer-rules.md`: define onde `Not-tested:` é waiver válido e onde é red flag bloqueador (CI config, build config, security). | `@aiox-master` | **Antes Epic 2** | Regra existe + referenciada no commit-protocol global do CLAUDE.md |
| **A4** | Adicionar snippet `playwright-auth-cookie-sharing` em `.aiox-core/data/playwright-patterns.md` (criar ficheiro se não existir). Inclui pattern `page.request` para sharing cookies entre login API e browser. | `@dev` (Dex) | **Sprint 1 Epic 2** | Ficheiro existe + 1 story E2E Epic 2 referencia o snippet |
| **A5** | Review do CodeRabbit onboarding `.coderabbit.yaml` (se existe) — afinar severidade para reduzir CHANGES_REQUESTED em nitpicks doc-only. Objectivo: reduzir "merge waived" de 50% (5/10 Epic 1) para <20% no Epic 2. | `@devops` (Gage) | **Sprint 1 Epic 2** | `.coderabbit.yaml` ajustado + 1ª story Epic 2 fecha sem waiver |
| **A6** | Criar regra `.claude/rules/separation-of-roles.md`: codifica `executor != quality_gate` como princípio AIOX universal. Define escalação (quem é gate quando executor primário é o gate natural). | `@aiox-master` | **Antes Epic 2** | Regra existe + cross-link em `agent-authority.md` |
| **A7** | Documentar limitação CR local em Windows worktrees em `.claude/rules/coderabbit-local-windows.md`. Inclui workaround (CR só remoto, política explícita) e nota de quando se torna bloqueador (ex: PR contra `main` sem CR remoto). | `@devops` (Gage) | **Rolling — pode ser feito hoje** | Regra existe + handoffs futuros referenciam-na em vez de re-explicar |
| **A8** | Criar template de retrospective em `.aiox-core/development/templates/epic-retrospective-tmpl.md` baseado neste documento (4Ls + métricas + decisões accionáveis). | `@po` (Pax) | **Antes Epic 2** | Template existe + Epic 0 retrospective backfilled (mínimo métricas + lições críticas) |
| **A9** | Comando novo `@po *iter-status [epic-id]` que: lê handoffs archive, conta iter por story, sinaliza outliers (>2 iter). Substitui inspecção manual de archive. | `@aiox-master` | **Epic 2** | Comando funciona + integrado em INDEX.md auto-update |
| **A10** | Memory log: actualizar `project_nexus_v2_producao.md` com Epic 1 = 10/10, merge commit `5514b310`, e top 3 lições críticas (A1, A2, A6). | `@aiox-master` ou Eurico | **Hoje 12/05/2026** | MEMORY.md actualizado + entry tem ref a esta retrospectiva |

---

## 8. Comparação Epic 0 vs Epic 1

| Métrica | Epic 0 | Epic 1 | Delta |
|---------|--------|--------|-------|
| Stories | 11 (0.1 a 0.11) | 10 (1.1 a 1.10) | -1 |
| Duração | 04/05 (Eurico ref. memória) | 05/05 → 12/05 = 7 dias | comparável |
| Bugs produção pós-deploy | 0 conhecidos | 0 dentro do epic (1 hotfix detectado após — PR #15 markdown fences fora do epic) | comparável |
| Retrospectiva escrita | **NÃO** (gap — apenas memória `project_nexus_v2_producao.md`) | **SIM** (este documento) | melhoria |

**Gap identificado:** Epic 0 não tem retrospectiva estruturada. **Acção A8** propõe backfill mínimo (métricas + lições críticas) usando template novo. Sem isso, perdemos a baseline para medir velocidade/qualidade ao longo do projecto.

---

## 9. Próximas acções na sequência Pax

1. **Eurico ou `@aiox-master`** — executa **A10**: actualiza `project_nexus_v2_producao.md` em MEMORY.md.
2. **`@pm` (Morgan)** — executa `@pm *create-epic 2` (Tarefas v2 + Projectos). Dependência Epic 1 consolidada em main. Antes de iniciar, ler esta retrospectiva (especialmente lições 4.1, 4.2, 4.5 + acções A1, A2, A6).
3. **`@devops`** — opcional: `@devops *release v0.9` se policy semver-tag aplica ao fecho de epic.

---

## 10. Convenções desta retrospectiva

| Regra | Verificação |
|-------|-------------|
| `workspace-governance.md` | Documento em `imersao-tools/nexus/docs/retrospectives/` (categoria 2: Projectos Próprios) — OK |
| `language-standards.md` | PT-PT, datas DD/MM/YYYY, sem PT-BR — OK |
| `output-format-standards.md` | Tabelas ASCII markdown, sem emojis, sem preâmbulo — OK |
| `mandatory-change-log.md` | Decisões A1-A10 com owner+deadline+done — OK |
| Constitution Artigo IV (No Invention) | Todas as métricas derivadas de commits git reais + handoffs archive — OK |

---

**Documento criado por:** Pax (`@po`) em 12/05/2026
**Sources verificados:**
- `git log --all --format="%ai %s"` em `ecosistema-ia-avancada-pt`
- `imersao-tools/nexus/docs/handoffs/archive/` (47 handoffs Epic 1)
- `imersao-tools/nexus/docs/handoffs/RETOMA-20260512-pr-14-merged-epic-1-in-main.md`
- `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260512-story-1.10-closed-epic-1-completed.md`
- Memórias `project_nexus_v2_architecture.md`, `project_nexus_v2_producao.md`, `feedback_mock_must_reflect_real_protocol.md`
