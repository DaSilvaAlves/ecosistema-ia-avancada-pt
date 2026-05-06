# RETOMA — Story 1.4 PR #7 OPEN, aguarda CodeRabbit + merge

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR (lê primeiro)

Em 06/05/2026, sessão executou **Stories 1.3 e 1.4 do Epic 1 Nexus v2** completas. Story 1.3 (Tool Registry com Zod) **Done** em prod (closure `df7ef040`, squash merge `433d74c3`). Story 1.4 (Classifier prompt PT-PT — Haiku 4.5) tem **PR #7 OPEN MERGEABLE em DaSilvaAlves/ecosistema-ia-avancada-pt** aguardando CodeRabbit pre-PR review automática + merge. Próximo passo no terminal novo: verificar estado CodeRabbit em PR #7 e fazer merge se APPROVED, ou `@dev *qa-loop-fix 1.4` se CHANGES_REQUESTED.

### Pasta exacta para abrir terminal novo

```powershell
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
```

NÃO abrir noutra pasta. NÃO abrir em `imersao-tools/nexus/v2/`. **Sempre na raiz do repo `ecosistema-ia-avancada-pt/`.**

### Agente AIOX a invocar

```
@devops
```

(persona: Gage, GitHub Repository Guardian — exclusive authority para merge/push)

### Comando exacto a executar (depois de verificar CodeRabbit)

**Cenário A — CodeRabbit APPROVED ou COMMENTED (esperado, scope contido):**

```
@devops *merge-pr 7
```

Depois closure:

```
@devops fecha Story 1.4: move active/1.4.story.md → completed/1.4.story.md, Status Done, commit chore(nexus-v2): close Story 1.4 — merged to main, deployed, push origin main
```

**Cenário B — CodeRabbit CHANGES_REQUESTED:**

```
@dev *qa-loop-fix 1.4
```

Após push directo (sem novo PR), CodeRabbit re-review automática.

---

## Mensagem inicial ao Claude (cola exacto)

```
Estou a continuar trabalho no Nexus v2. Story 1.4 (Classifier prompt PT-PT)
tem PR #7 OPEN em DaSilvaAlves/ecosistema-ia-avancada-pt aguardando CodeRabbit
review automática. Lê primeiro o handoff completo:

imersao-tools/nexus/docs/handoffs/RETOMA-20260506-story-1.4-pr-7-aguarda-coderabbit-merge.md

Depois invoca @devops para verificar estado CodeRabbit do PR #7 e:
- Se APPROVED/COMMENTED → @devops *merge-pr 7 + closure (move active→completed, Status Done, commit chore + push main)
- Se CHANGES_REQUESTED → @dev *qa-loop-fix 1.4
```

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 — sistema de continuidade pessoal Eurico |
| URL produção | https://imersao.ia.expressia.pt |
| Localização | `imersao-tools/nexus/` (working dir Nexus: `imersao-tools/nexus/v2/`) |
| Sessão | 06/05/2026 (continuidade da sessão anterior 1.3-ready-to-draft) |
| Agente que sai | `@devops` Gage (Stories 1.3 closed + 1.4 PR #7 OPEN) |
| Agente que entra | `@devops` Gage (verificar CodeRabbit + merge) |
| Estado | Stories 1.1+1.2+1.3 Done em prod, Story 1.4 PR #7 OPEN MERGEABLE aguarda CodeRabbit |

---

## Estado Git actual (06/05/2026)

| Item | Valor |
|------|-------|
| Branch local actual | `feat/nexus-v2-story-1.4-classifier-pt-pt` |
| Commits no branch (2 acima de main) | `656b25b8 chore(nexus-v2): QA gate PASS for Story 1.4 — Quinn approves` <br> `485b6d87 feat(nexus-v2): classifier prompt PT-PT (Haiku 4.5) for Epic 1 [Story 1.4]` |
| Last commit em main | `df7ef040 chore(nexus-v2): close Story 1.3 — merged to main, deployed` |
| Branch remote | `origin/feat/nexus-v2-story-1.4-classifier-pt-pt` (pushed) |
| Remote | `DaSilvaAlves/ecosistema-ia-avancada-pt` (NÃO o fork SynkraAI) |
| Vercel production | LIVE em https://imersao.ia.expressia.pt (Stories 1.1+1.2+1.3 Done) |

```powershell
# Para sincronizar local no terminal novo (primeira opção: ficar no branch da PR):
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
git fetch origin
git checkout feat/nexus-v2-story-1.4-classifier-pt-pt
git pull origin feat/nexus-v2-story-1.4-classifier-pt-pt
git log --oneline -5
# Deve ver:
# 656b25b8 chore(nexus-v2): QA gate PASS for Story 1.4 — Quinn approves [Story 1.4]
# 485b6d87 feat(nexus-v2): classifier prompt PT-PT (Haiku 4.5) for Epic 1 [Story 1.4]
# df7ef040 chore(nexus-v2): close Story 1.3 — merged to main, deployed
# 433d74c3 feat(nexus-v2): tool registry with Zod fail-loud for Epic 1 [Story 1.3] (#6)
# c5e842eb chore(nexus-v2): close Story 1.2 — merged to main, deployed

# OU (se preferir voltar a main após verificar):
git checkout main
git pull origin main
```

---

## Stories Epic 1 — Estado actual (06/05/2026)

| Story | Descrição | Estado | Estimativa |
|-------|-----------|:---:|:---:|
| 1.1 | Audit log data access layer | **Done** (05/05/2026, merge `e70f6f5c`/closure `ac5d647a`) | — |
| 1.2 | Provider Abstraction Anthropic (executor + classifier) | **Done** (06/05/2026, merge `18bc7be2`/closure `c5e842eb`) | — |
| 1.3 | Tool Registry com Zod (vazio inicialmente + fail-loud) | **Done** (06/05/2026, merge `433d74c3`/closure `df7ef040`) | — |
| **1.4** | **Classifier prompt PT-PT (Haiku 4.5)** | **PR #7 OPEN MERGEABLE — aguarda CodeRabbit** | 3-4h (foi ~1h efectivo) |
| 1.5 | Executor — chat agent + SSE streaming + tool calling loop | Pending (depende 1.3+1.4 Done) | 5-8h |
| 1.6 | Preview-then-confirm (confidence < 70%) | Pending | 2-3h |
| 1.7 | Undo mechanism (storage 30s + endpoint reverse) | Pending | 2-3h |
| 1.8 | Endpoint `/api/agent/prompt` com auth + rate limit | Pending | 2-3h |
| 1.9 | UI: chat input + streaming response + cards de acções + toast undo | Pending | 4-6h |
| 1.10 | Conjunto manual de 50 prompts PT-PT para regression | Pending | 1-2h |

**3/10 Done + 1 em PR.** Foundation completa para Story 1.5 arrancar o cérebro real depois da 1.4 fechar.

---

## PR #7 — detalhes para verificação

| Item | Valor |
|------|-------|
| URL | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/7 |
| Title | `feat(nexus-v2): classifier prompt PT-PT (Haiku 4.5) for Epic 1 [Story 1.4]` |
| Base | `main` |
| Head | `DaSilvaAlves:feat/nexus-v2-story-1.4-classifier-pt-pt` |
| State | OPEN |
| Mergeable | MERGEABLE |
| Body file | `imersao-tools/nexus/docs/PR-BODY-STORY-1.4.md` (untracked, fonte do `--body-file`) |
| Quality gates locais | 5/5 PASS (lint, typecheck, test:unit 158/158, build 10/10, coverage agent/classifier 97.14% + agent/prompts/classifier-system 100%) |
| QA gate | PASS limpo (Quinn) — `imersao-tools/nexus/docs/QA-GATE-STORY-1.4.md` |
| CodeRabbit | A correr automático após push (esperado clean — scope contido 5 ficheiros) |

### Comando para verificar estado CodeRabbit

```powershell
gh pr view 7 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json reviewDecision,reviews,statusCheckRollup,mergeable,mergeStateStatus
```

Cenários esperados:
- **`reviewDecision: "APPROVED"` ou `reviews` contém apenas `state: "COMMENTED"`** → prosseguir merge
- **`reviewDecision: "CHANGES_REQUESTED"`** → ALERTA Eurico, sugerir `@dev *qa-loop-fix 1.4`
- **Reviews vazio (CodeRabbit ainda a correr)** → aguardar (pode levar 7-30 min)

---

## Sequência de merge (cenário A — CodeRabbit OK)

Pattern alinhado com Stories 1.1+1.2+1.3 (squash merge):

### Passo 1 — Verificar estado

```powershell
gh pr view 7 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json reviewDecision,reviews,statusCheckRollup
```

### Passo 2 — Squash merge + delete branch

```powershell
gh pr merge 7 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --squash --delete-branch
```

### Passo 3 — Sincronizar local main

```powershell
git checkout main
git pull origin main
git log --oneline -3
# Deve ver squash commit: feat(nexus-v2): classifier prompt PT-PT (Haiku 4.5) for Epic 1 [Story 1.4] (#7)
```

### Passo 4 — Closure commit

```powershell
git mv imersao-tools/nexus/docs/stories/active/1.4.story.md imersao-tools/nexus/docs/stories/completed/1.4.story.md
# Editar Status: "Ready for Review" → "Done" no ficheiro novo
# Criar ficheiro temp com mensagem closure (lição: NÃO PowerShell here-string)
```

Mensagem de commit closure (criar ficheiro temp `nexus/v2/.commit-msg-1.4-close.txt`):

```
chore(nexus-v2): close Story 1.4 — merged to main, deployed

PR #7 merged via squash em {SHA}. Branch
feat/nexus-v2-story-1.4-classifier-pt-pt deletada do remote.

Story 1.4 (Classifier prompt PT-PT — Haiku 4.5) movida para completed/.
Status: Ready for Review → Done.

CodeRabbit pre-PR: {APPROVED|COMMENTED} (registar nitpicks se relevantes
para Story 1.5+ ou Story 1.10 regression suite).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### Passo 5 — Commit + push main

```powershell
git add imersao-tools/nexus/docs/stories/completed/1.4.story.md
git commit -F imersao-tools/nexus/v2/.commit-msg-1.4-close.txt
Remove-Item imersao-tools/nexus/v2/.commit-msg-1.4-close.txt
git push origin main
```

---

## Decisões fechadas Story 1.4 (NÃO REABRIR)

- `intents = domains` (não tool names) — alinha optimização token economy arch §7.4
- `ClassificationResultSchema` (Story 1.2) **intacto** — validação adicional vive APENAS no wrapper `classifier.ts`
- `temperature = 0`, `maxTokens = 512` defaults conservadores
- `DEFAULT_CLASSIFIER_MODEL` em `lib/agent/models.ts` é single source (Story 1.2) — Story 1.4 não duplica
- Edge runtime safe (ADR-1) — zero imports `fs`/`path`/`crypto.createHmac`/`child_process`
- `ToolDomain` enum (10 literais — Story 1.3) é fonte de verdade dos domains
- Few-shot examples obrigatórios: AC6 multi-intent benchmark Epic 1 AC1, AC7 low-confidence Story 1.6 trigger, AC8 empty intents
- SF-1 (PT-BR + typo combo) endereçado num único example: `"vamos deletar a tarefa antigua"`
- SF-2 (subset behaviour) JSDoc 4 pontos no `buildClassifierSystemPrompt`
- Magic strings MSW handler com detecção dual `triggers = system + userMsgText` (Story 1.4 wrapper constrói system internamente; tests injectam via prefix do user prompt)
- 7 magic strings novas no MSW handler: MULTI_INTENT, TASKS, EMPTY, INVALID_DOMAIN, OUT_OF_RANGE_HIGH/LOW, ORPHAN

---

## Tech debt opcional registável (não bloqueador)

Quando o @architect tiver bandwidth, abrir 1 item agrupado de tech debt:

```
@po *backlog-add 1.4 tech-debt low "Tech debt agrupado Stories 1.3+1.4:
- SF-3 Story 1.3: Alinhar arch-v2.md §7.2 line 570 (z.ZodType<TArgs>) → z.ZodObject<z.ZodRawShape>
- Tech debt Story 1.4: Alinhar arch-v2.md §6.1 line 399 exemplo `['criar_tarefa']` → `['tasks','finance']`
- SF-3 Story 1.4: PII redaction em rawResponse error messages para Story 1.8 endpoint público
- SF-4 Story 1.4: Calibração Haiku real para Story 1.10 regression suite manual de 50 prompts PT-PT"
```

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260506-story-1.4-pr-7-aguarda-coderabbit-merge.md`. PROJECTO É NEXUS V2, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## Anti-padrões CRITICAL aprendidos (NÃO REPETIR)

Confirmados pelas Stories 1.1, 1.2, 1.3 e 1.4:

| Anti-padrão | Causa | Como evitar |
|-------------|-------|-------------|
| `gh pr create` sem `--repo` | gh tenta upstream do fork SynkraAI:main | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt --head DaSilvaAlves:branch --base main` |
| PowerShell here-string `@'...'@` para git/gh | PowerShell parte mensagens longas no parser | Escrever para ficheiro temp + `git commit -F` ou `gh pr create --body-file` |
| Mocks que reproduzem o bug do código sob teste | Tests passam mas bug fica escondido (Story 1.2 iter 2) | MSW handlers devem reflectir protocolo real verificado contra docs API + SDK issues |
| `gh pr merge` sem `--repo` e `--delete-branch` | gh tenta upstream do fork; branches feature ficam stale | `gh pr merge {N} --repo DaSilvaAlves/... --squash --delete-branch` |
| Editar story file ANTES de `git mv` | Edit precisa de path actual | Fazer `git mv` PRIMEIRO, depois `Edit` no novo path |
| Push force ou merge sem confirmar mergeable | Histórico corrompido, conflitos | Verificar `gh pr view --json mergeable` antes |
| Schema Zod canonical de Story anterior alterado por Story posterior | Quebra contracts existentes | Validação adicional vive em wrapper, não em schema (lição Story 1.4) |
| Silent fallback em vez de fail-loud | Bugs escondidos até prompt errar em runtime | Lançar `Error` PT-PT com contexto identificador (lição Story 1.3 → aplicada Story 1.4) |

---

## Verificações especiais Story 1.4 (8/8 PASS pela Quinn)

1. ✓ AC6 multi-intent benchmark Epic 1 AC1 (`"amanhã reunião 15h, paguei €78,70 supermercado"`) obrigatório + tested
2. ✓ AC7 low-confidence < 0.7 (Story 1.6 trigger preview-then-confirm) obrigatório
3. ✓ AC8 empty intents (`"o céu é azul hoje"` → `[], {}`) obrigatório + tested
4. ✓ AC14 Edge runtime safety (grep zero imports `fs`/`path`/`crypto.createHmac`/`child_process`)
5. ✓ ClassificationResultSchema intacto (`git diff` retorna vazio)
6. ✓ ClassifierOpts pass-through (model/maxTokens/temperature) verificado via test request capture
7. ✓ ALL_DOMAINS sync 10 literais (TypeScript-enforced via `readonly ToolDomain[]`)
8. ✓ Validação adicional fail-loud com PT-PT messages + rawResponse truncado (200 chars)

---

## Acessos rápidos

| Recurso | URL/Path |
|---------|----------|
| Nexus produção | https://imersao.ia.expressia.pt |
| GitHub repo | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt |
| **PR #7 (1.4 OPEN)** | **https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/7** |
| PR #6 (1.3 mergeada) | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/6 |
| PR #5 (1.2 mergeada) | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/5 |
| Vercel project | https://vercel.com/euricojsalves-4744s-projects/imercao-ia-pt |
| Story 1.4 file (active) | `imersao-tools/nexus/docs/stories/active/1.4.story.md` |
| Story 1.3 file (completed) | `imersao-tools/nexus/docs/stories/completed/1.3.story.md` |
| QA Gate Story 1.4 | `imersao-tools/nexus/docs/QA-GATE-STORY-1.4.md` |
| QA Gate Story 1.3 | `imersao-tools/nexus/docs/QA-GATE-STORY-1.3.md` |
| PR Body Story 1.4 | `imersao-tools/nexus/docs/PR-BODY-STORY-1.4.md` |
| Implementação 1.4 | `imersao-tools/nexus/v2/lib/agent/classifier.ts` (167 linhas) |
| Prompt 1.4 | `imersao-tools/nexus/v2/lib/agent/prompts/classifier-system.ts` (146 linhas) |
| Tests 1.4 | `imersao-tools/nexus/v2/tests/unit/agent/classifier.test.ts` (20 tests) |
| MSW handler estendido | `imersao-tools/nexus/v2/tests/mocks/handlers/anthropic.ts` (7 magic strings novas) |
| PRD Epic 1 | `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §10 |
| Architecture §6.1, §7.4, §8 | `imersao-tools/nexus/docs/architecture-v2.md` |

---

## Comandos úteis (PowerShell)

```powershell
# Estado git
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
git status
git log --oneline -5

# Verificar PR #7 estado
gh pr view 7 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --json reviewDecision,reviews,statusCheckRollup,mergeable,mergeStateStatus

# Re-correr quality gates do Nexus v2 (sanidade no branch)
cd imersao-tools\nexus\v2
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:coverage

# Voltar à raiz
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt

# Listar stories
ls imersao-tools\nexus\docs\stories\active\
ls imersao-tools\nexus\docs\stories\completed\
```

---

## Após Story 1.4 fechada — próximas opções no Epic 1

```
@sm *draft 1.5    # Executor chat agent + SSE streaming + tool calling loop (5-8h)
                  # Depende: 1.3 Done (registry) + 1.4 Done (classifier) — ambas prontas
                  # Story 1.4 retorna domains → 1.5 faz toolRegistry.byDomain()
                  # → envia ~10 tools ao Sonnet em vez de 39 (token economy)

@sm *draft 1.6    # Preview-then-confirm para confidence < 0.7 (2-3h)
                  # Depende: 1.4 Done (calibração confidence threshold)
```

Recomendação: **`@sm *draft 1.5`** (path crítico do cérebro real — desbloqueia 1.6, 1.7, 1.8 em cascata).

---

## Sumário entregáveis Story 1.4 (consolidação)

- 2 ficheiros novos produção: `lib/agent/prompts/classifier-system.ts` (146 linhas), `lib/agent/classifier.ts` (167 linhas)
- 1 ficheiro novo tests: `tests/unit/agent/classifier.test.ts` (20 tests Vitest+MSW — acima de estimado 14-16)
- 1 ficheiro modificado tests: `tests/mocks/handlers/anthropic.ts` (7 magic strings novas + helper inline `classifierResponse` + detecção dual `triggers`)
- 1 commit feat (`485b6d87`) + 1 commit chore QA gate (`656b25b8`)
- 14 ACs cumpridos + 4 SF endereçados (SF-1+SF-2 in-line; SF-3+SF-4 strategy documentada)
- Quality gates 5/5 PASS, 158/158 tests, coverage 97.14%/100%
- Tech debt da Story 1.2 (CodeRabbit Iter 3 Nitpick #5) **fechado** na Story 1.3 antes (já merged)

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260506-story-1.4-pr-7-aguarda-coderabbit-merge.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: `@devops` Gage (após criar PR #7 Story 1.4 + observar contexto baixo no terminal)
DATA: 06/05/2026
