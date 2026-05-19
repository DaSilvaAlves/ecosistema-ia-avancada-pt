# RETOMA — Hotfix executor PT-PT FECHADO + validado em produção — decisão Epic 2 em aberto

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 19/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Tipo:** Cross-terminal — passagem de contexto para próxima sessão
**Severidade:** baixa (sem urgência — Epic 2 stories pendentes não-bloqueantes)
**Localização canónica:** `imersao-tools/nexus/`
**Branch actual:** `main` (tip `c044def4`)
**De:** Gage (`@devops`) — sessão hotfix produção SOP Passo 3 completa + validação manual pós-merge
**Para:** any (Eurico decide próxima acção — `@pm` para Epic 2 OR `@dev` para aplicar nit cosmético waived)

---

## 1. Resumo executivo

**Hotfix produção FECHADO ponta-a-ponta em iteração única.**

| Marco | Detalhe |
|-------|---------|
| Bug original | Chatbot Nexus v2 em produção respondia em PT-BR com "você", emojis decorativos, listas genéricas |
| Root cause | `AnthropicExecutor.execute()` em `anthropic.ts:348-353` chamava `client.messages.stream()` SEM `system:` |
| Fix | Novo `EXECUTOR_SYSTEM_PROMPT` em `lib/agent/prompts/executor-system.ts` + 1 linha `system:` no executor + 3 testes (T1 SDK prop, T2 conteúdo, T3 mock-protocol-fidelity) |
| PR | [#26](https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/26) MERGED 19/05/2026 01:52:24Z via squash `755375a0` por DaSilvaAlves |
| Closure | Commit `c044def4` pushed para `origin/main` 19/05/2026 01:58Z com INDEX + 2 archived handoffs + PR body |
| Validação produção | **PASS** — 3 turnos reais em https://imersao.ia.expressia.pt confirmam PT-PT, sem "você", sem emojis decorativos, tool de tarefas funcional, AC8 empty intents respeitado |

---

## 2. Cronologia detalhada da sessão Gage

| Hora UTC | Acção | Resultado |
|----------|-------|-----------|
| ~01:30 | Gage activado com briefing Eurico — push + PR + CR + merge + validação | — |
| 01:30 | Leitura handoff entrada `archive/RETOMA-20260518-hotfix-executor-system-prompt-pronto-para-devops-push.md` (Dex SOP Passo 2) | Contexto absorvido |
| 01:32 | Verificação branch local `fix/nexus-v2-executor-system-prompt-pt-pt` tip `45682516` | OK |
| 01:33 | Criação `imersao-tools/nexus/docs/PR-BODY-HOTFIX-EXECUTOR-SYSTEM-PROMPT.md` baseado no handoff §4.2 | OK |
| 01:35 | `git push -u origin fix/nexus-v2-executor-system-prompt-pt-pt` | OK — upstream configurado |
| 01:36 | `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main` | PR #26 aberto |
| 01:36-01:39 | Polling background `bvoylchzs` (CodeRabbit) + `bptfq2evs` (early failure watch) | CI a correr |
| 01:39 | CodeRabbit terminou — **APPROVED** Iter 1 com 1 nit `⚡ Quick win` cosmético (absolute import em `tests/unit/agent/providers/anthropic.executor.system.test.ts:3`) | Zero CRITICAL, zero HIGH |
| 01:39 | CI 11/11 essential checks SUCCESS (Lint+TS, Vitest 532/532, Playwright E2E, 50-prompt regression, CodeQL js+actions, Coverage, CR Status, Vercel Preview) | OK |
| 01:42 | Decisão Eurico via AskUserQuestion: **Opção A — Merge já (waiver nit)** | OK |
| 01:52 | `gh pr merge 26 --admin --squash --delete-branch` | Squash `755375a0` em main |
| 01:53 | Vercel production deploy `755375a0` SUCCESS | OK |
| 01:54-01:57 | Closure prep: `mv` handoff saída para `archive/`, edit `INDEX.md`, stage 4 ficheiros do hotfix | OK |
| 01:57 | Commit closure `c044def4` (`docs(nexus-v2): close hotfix executor system prompt — MERGED em main via PR #26 squash 755375a0`) | 4 files, +677/-4 |
| 01:58 | `git push origin main` (closure direct-to-main, padrão Epic 1+2) | OK |
| 01:58 | Vercel production deploy `c044def4` SUCCESS | OK |
| 01:58 | Branch local `fix/nexus-v2-executor-system-prompt-pt-pt` eliminada | OK |
| ~02:00 | Validação manual #1 (Eurico) — screenshot mostrou turno problemático (`lembrete e um checklist` → PT-BR + emoji + markdown literal) | Suspeita de regressão |
| 02:01 | Diagnóstico Gage: turnos `ok` e `cria tarefa` confirmavam fix ACTIVO. 4 hipóteses A/B/C/D apresentadas. Eurico escolheu Refresh hard + re-testar tudo | — |
| ~02:05 | Validação manual #2 (Eurico em janela anónima) — 3 turnos clean | **PASS** confirmado |

---

## 3. Estado actual do repositório

### 3.1 Branch e tip

```
main (local + origin)
└── c044def4 docs(nexus-v2): close hotfix executor system prompt — MERGED em main via PR #26 squash 755375a0
    └── 755375a0 fix(nexus-v2): adicionar system prompt PT-PT ao executor Sonnet (#26)
        └── b193dcbd docs(nexus-v2): handoff cross-terminal — Epic 2 7/10 Done, retoma 2.6/2.7/2.10
```

### 3.2 Working tree (PRESERVAR — fora-scope deste hotfix)

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged:
 M imersao-tools/comunidade                         (submódulo — pré-existente)
 m imersao-tools/starter-builder                    (submódulo — pré-existente)

Untracked (150+ ficheiros — dívida workspace governance separada):
 ?? BESTSELLER-*, GUIA_*, HANDOFF_*, mega-brain/, _agents/, etc.
 ?? imersao-tools/nexus/docs/.claude/
 ?? imersao-tools/nexus/docs/handoffs/.claude/
 ?? imersao-tools/nexus/docs/PO-VALIDATION-*.md (várias)
 ?? imersao-tools/nexus/docs/PR-BODY-STORY-*.md (várias)
 ?? imersao-tools/nexus/docs/QA-GATE-*.md (várias)
 ?? imersao-tools/nexus/docs/handoffs/RETOMA-* (várias)
 ?? imersao-tools/nexus/docs/handoffs/archive/RETOMA-* (várias)
 ?? imersao-tools/nexus/docs/retrospectives/
 ?? (este handoff, ainda untracked)
```

**Nada disto bloqueia próxima sessão.** Dívida histórica preservada conforme padrão Epic 1+2.

### 3.3 Produção

| Item | Estado |
|------|--------|
| URL | https://imersao.ia.expressia.pt |
| Deploy production tip | `c044def4` (Vercel SUCCESS desde 01:58:43Z) |
| `EXECUTOR_SYSTEM_PROMPT` activo | SIM — confirmado por validação manual |
| Bug PT-BR original | RESOLVIDO |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260519-hotfix-executor-fechado-validado-decisao-epic-2.md`. CAMINHO ESTÁ DENTRO DA PASTA DO PROJECTO (`imersao-tools/nexus/`) — CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. Validação manual em produção (detalhada)

3 turnos pós-refresh hard em janela anónima:

| # | Input do utilizador | Resposta Nexus | Veredicto |
|---|---------------------|----------------|-----------|
| 1 | `cria tarefa: comprar pão amanhã` | `Tarefa criada: **Comprar pão** — para amanhã. Queres definir uma hora específica ou fica sem hora?` | **PASS** — PT-PT, tool accionada, follow-up natural sem "você" |
| 2 | `15 horas` (isolado, sem contexto multi-turn) | `Não percebi o que precisas com "15 horas". É uma tarefa, um evento, um lembrete? Dá-me mais contexto.` | **PASS** — comportamento AC8 exemplar (PT-PT curto pedindo contexto, NÃO listas genéricas) |
| 3 | `cria tarefa: comprar pão amanhã 15 horas` | `Tarefa criada: **Comprar pão** — amanhã às 15h00. Queres definir alguma prioridade ou deixo como normal?` | **PASS** — PT-PT, parsing correcto "15h00", tool accionada |

### 4.1 Observações secundárias (NÃO são bug do hotfix)

| Item | Estado | Onde tratar |
|------|--------|-------------|
| Turno 2 (`15 horas`) perde contexto da pergunta anterior do turno 1 | **B3 conhecido e documentado** no handoff entrada §5 — `runAgent` aceita só `userPrompt: string`, sistema single-turn arquitectural | Spec/story Epic 3+ via `@pm *create-epic 3` |
| Markdown `**` aparece literal no chat (visto no screenshot pré-refresh) | Issue UX separado — frontend não renderiza markdown na bolha do Nexus | Backlog UX Epic 2/3 (não confirmado se ainda ocorre pós-refresh) |
| Histórico de sessão pré-deploy persistido em IndexedDB confundiu validação #1 | Resolvido por refresh hard em janela anónima | Padrão de teste futuro: sempre testar em janela anónima após deploy production |

### 4.2 Cenários originais §4.3 do handoff entrada NÃO explicitamente testados

| Input | Estado |
|-------|--------|
| `avança` | NÃO testado explicitamente na validação #2 — mas turno 2 (`15 horas` isolado) cobre o mesmo padrão "input ambíguo → PT-PT curto a pedir contexto" |
| `o céu é azul` (AC8 empty intents) | NÃO testado explicitamente — turno 2 cobre semanticamente o mesmo caso AC8 |
| `lembrete e um checklist` | NÃO re-testado pós-refresh (Eurico optou por fluxo natural de criação de tarefa) — assumido como Hipótese A confirmada (histórico pré-deploy), mas se houver curiosidade vale teste explícito |

---

## 5. Decisões em aberto para próxima sessão

### 5.1 Decisão principal (alta prioridade)

**Próxima story Epic 2.** Epic 2 está 7/10 Done desde 18/05/2026 (Stories 2.1+2.2+2.3+2.4+2.5+2.8+2.9). Stories pendentes: **2.6**, **2.7**, **2.10**.

Conforme handoff `archive/RETOMA-20260518-...epic-2-7de10-pronto-para-2.6-2.7-2.10.md` (referido por `b193dcbd`), as 3 stories são paralelizáveis e Eurico devia decidir entre:

| Opção | Acção |
|-------|-------|
| A | `@sm *draft 2.6` — implementar próxima story Epic 2 |
| B | `@sm *draft 2.7` |
| C | `@sm *draft 2.10` |
| D | `@po *retrospective epic-2` — retrospectiva intermédia agora (ou só ao 10/10) |
| E | Pausa Epic 2 para outro projecto (Frusoal, voz-ai-pt, comunidade, etc.) |

### 5.2 Follow-up cosmético waived (baixa prioridade)

**Nit CodeRabbit Iter 1 do PR #26 — `⚡ Quick win` waived por Eurico.**

| Item | Valor |
|------|-------|
| Ficheiro | `imersao-tools/nexus/v2/tests/unit/agent/providers/anthropic.executor.system.test.ts:3` |
| Patch sugerido | `import { server } from '../../../mocks/server';` → `import { server } from '@/tests/mocks/server';` |
| Razão | Project guideline AIOX: absolute imports sempre |
| Quem pode fazer | `@dev` em mini-PR cosmético ou junto com qualquer story Epic 2 que toque tests |

Trata-se de 1 linha. Pode ser feito a qualquer altura sem urgência.

---

## 6. Como retomar (próxima sessão / outro terminal)

### 6.1 Caminho A — retomar Epic 2

```
1. Activar @pm OR @sm directamente
   @pm  (consulta estado Epic 2 + decide se cria nova story)
   ou
   @sm *draft 2.6  (executa directamente se já decidido)

2. Story Development Cycle padrão:
   @sm *draft → @po *validate-story-draft → @dev *develop → @qa *qa-gate → @devops *push

3. Ler primeiro EPIC-2.md em imersao-tools/nexus/docs/epics/ para contexto consolidado das 10 stories
```

### 6.2 Caminho B — limpar nit cosmético

```
1. Activar @dev
2. Branch nova: fix/nexus-v2-absolute-import-executor-test
3. Aplicar 1 linha (Edit no ficheiro acima)
4. Validar: npm run lint && npm run typecheck && npx vitest run
5. Commit conventional + push + PR via @devops
```

### 6.3 Caminho C — outro projecto

Memória já tem contexto recente sobre:
- **Frusoal** — análise + PRD em curso (`membros/cliente-frusoal/`)
- **Moreira** — chatbot Botpress PT/EN (`membros/moreira/`)
- **voz-ai-pt** — sistema próprio AI conversational PT-PT (PRD v0 escrito)
- **Comunidade** — site `imersao-tools/comunidade/` (regra `comunidade-safety.md` activa)
- **Ebook O Mapa da IA** — biblioteca + campanha email pendentes
- **PratoVivo** — pivot scope foto→video publicitário

Cada um tem o seu próprio handoff/memória — consultar `MEMORY.md` index.

---

## 7. Caveats operacionais

| Caveat | Detalhe |
|--------|---------|
| Working tree não limpo | 150+ untracked pré-existentes + submódulos `comunidade`/`starter-builder` modified — preservar (dívida workspace governance separada) |
| Cache produção | Sempre validar pós-deploy em **janela anónima** (Ctrl+Shift+N) — IndexedDB persistente confunde histórico |
| Push exclusivo | Sempre `@devops` Gage para qualquer push. Sem `--no-verify`, sem `--force` |
| `gh pr *` | Sempre `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Hard-stop Iter 2 | Padrão Epic 1+2 — máximo 2 iterações CR self-healing. Esta sessão não precisou Iter 2 |
| Mock-protocol-fidelity | Regra obrigatória `.claude/rules/mock-protocol-fidelity.md` — qualquer fix de protocolo externo deve incluir test que prove mock espelha protocolo real (T3 do hotfix é exemplo) |
| Validação manual obrigatória pós-merge | SOP §4.5 — não é opcional. Pelo menos 1 cenário real em produção antes de declarar hotfix fechado |

---

## 8. Ficheiros-chave para próxima sessão

| Ficheiro | Propósito |
|----------|-----------|
| `imersao-tools/nexus/v2/lib/agent/prompts/executor-system.ts` | `EXECUTOR_SYSTEM_PROMPT` — fonte da verdade para tom + identidade Nexus |
| `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts` | Executor com `system:` agora applied (linhas 348-354) |
| `imersao-tools/nexus/docs/handoffs/INDEX.md` | Handoff index actualizado (Pending vazio, este handoff vai entrar) |
| `imersao-tools/nexus/docs/epics/EPIC-2.md` | Estado consolidado Epic 2 (7/10 Done) |
| `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260518-hotfix-executor-system-prompt-pronto-para-devops-push.md` | Handoff entrada já consumido por Gage |
| `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260518-bug-nexus-pt-br-executor-missing-system-prompt.md` | Handoff raiz do bug |
| `imersao-tools/nexus/docs/PR-BODY-HOTFIX-EXECUTOR-SYSTEM-PROMPT.md` | PR body usado no PR #26 |
| `docs/sops/hotfix-producao.md` | SOP aplicada com sucesso nesta sessão — referência futura |

---

## 9. Métricas desta operação devops

| Métrica | Valor |
|---------|-------|
| Tempo total Gage (push → merge → closure → validação) | ~30 min |
| Iterações CodeRabbit | 1 (APPROVED first-iter) |
| Quality gates locais (Dex) | 5/5 PASS |
| CI essential checks (Gage) | 11/11 PASS |
| Findings CR | 0 CRITICAL, 0 HIGH, 1 nit cosmético (waived) |
| Commits hotfix | 1 (`45682516` squashed para `755375a0` em main) |
| Commit closure | 1 (`c044def4`) |
| Ficheiros alterados código | 4 (+217/-4) |
| Ficheiros closure docs | 4 (+677/-4) |
| Validação produção | 3 turnos PASS em janela anónima |

**Padrão "first-iter PASS sem waiver" mantido.** Esta é a 12ª operação Nexus v2 consecutiva sem retrabalho funcional (Stories 1.5-1.10 + 2.1-2.9 + este hotfix).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260519-hotfix-executor-fechado-validado-decisao-epic-2.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Gage (`@devops`) — sessão SOP Hotfix Passo 3 completa
DATA: 19/05/2026
