# RETOMA — Hotfix Nexus v2 executor system prompt PT-PT — pronto para `@devops` push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 18/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Tipo:** **HOTFIX PRODUÇÃO** — sem story (SOP `docs/sops/hotfix-producao.md`)
**Severidade:** HIGH — produção LIVE com violação de brandbook + UX quebrada
**Localização canónica:** `imersao-tools/nexus/`
**Branch:** `fix/nexus-v2-executor-system-prompt-pt-pt` (local, NÃO pushed)
**Commit local:** `45682516` (4 ficheiros, +217/-4)
**De:** Dex (`@dev`) — implementação SOP Passo 2 concluída
**Para:** Gage (`@devops`) — push + PR + CodeRabbit + merge (SOP Passo 3)
**Handoff de entrada consumido:** `archive/RETOMA-20260518-bug-nexus-pt-br-executor-missing-system-prompt.md`

---

## 1. O que foi feito (SOP Passo 2)

### 1.1 Branch criada e commit local

| Item | Valor |
|------|-------|
| Branch | `fix/nexus-v2-executor-system-prompt-pt-pt` |
| Base | `main` (`b193dcbd`) — `docs(nexus-v2): handoff cross-terminal — Epic 2 7/10 Done, retoma 2.6/2.7/2.10` |
| Commit local | `45682516` |
| Ficheiros alterados | 4 (+217/-4) |

### 1.2 Patches aplicados (cirúrgicos — secções 3.1/3.2/3.3 do handoff de entrada)

| # | Ficheiro | Mudança | Tipo |
|---|----------|---------|------|
| 1 | `imersao-tools/nexus/v2/lib/agent/prompts/executor-system.ts` | NOVO ficheiro com `EXECUTOR_SYSTEM_PROMPT` (~30 linhas, PT-PT, identidade Nexus, regras intents vazios, tom brandbook) | CREATE |
| 2 | `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts` | +1 linha import `EXECUTOR_SYSTEM_PROMPT` + 1 linha `system: EXECUTOR_SYSTEM_PROMPT` na chamada `client.messages.stream()` (linhas 348-354) | MODIFY |
| 3 | `imersao-tools/nexus/v2/tests/mocks/handlers/anthropic.ts` | Comentário stale Story 1.5 AC2 actualizado (linhas 721-727) — executor agora TEM system prompt; discriminator MSW permanece `body.stream === true` | MODIFY (doc-only) |
| 4 | `imersao-tools/nexus/v2/tests/unit/agent/providers/anthropic.executor.system.test.ts` | NOVO ficheiro com 3 testes T1+T2+T3 (system prop passada, conteúdo do prompt, mock-protocol-fidelity body.system) | CREATE |

### 1.3 5 quality gates locais (SOP Passo 2.4)

| # | Gate | Resultado | Notas |
|---|------|-----------|-------|
| 1 | `npm run lint` | PASS | 1 warning pré-existente em `app/api/auth/logout/route.ts` (sem relação com o patch) |
| 2 | `npm run typecheck` | PASS | 0 erros (após fix narrow `Record<string, unknown> \| null` com non-null assertion) |
| 3 | `npx vitest run` (full suite) | PASS | **532/532 testes verdes em 41 ficheiros**, 38.61s |
| 4 | `npx vitest run --coverage` (full suite) | PASS | `lib/agent/prompts` = **100%** lines/branches/functions/statements; sem violação de threshold global |
| 5 | `npm run build` | PASS | Next.js compilou todas as routes (`/projectos`, `/tarefas`, `/login`, APIs, middleware) |

### 1.4 3 testes do hotfix isolados (confirmação explícita)

```
✓ tests/unit/agent/providers/anthropic.executor.system.test.ts (3 tests) 51ms
  ✓ passa system: EXECUTOR_SYSTEM_PROMPT à chamada client.messages.stream
  ✓ EXECUTOR_SYSTEM_PROMPT contém marcadores PT-PT + identidade Nexus + regras intents vazios
  ✓ MSW handler recebe body.system com EXECUTOR_SYSTEM_PROMPT exacto (mock-protocol-fidelity)
```

---

## 2. Constraints inegociáveis honradas

| # | Constraint | Estado |
|---|------------|--------|
| C1 | Branch a partir de `main` limpo (`b193dcbd`) | OK |
| C2 | NÃO mexer em `runAgent` signature | OK — só executor.execute internal |
| C3 | NÃO mexer em `classifier-system.ts` | OK — classifier intacto |
| C4 | NÃO mexer em prompts de tools | OK |
| C5 | NÃO mexer em MSW handlers de tests existentes (só doc-comment stale) | OK — só comentário linhas 721-727 |
| C6 | NÃO tocar em ficheiros de Stories 2.5/2.6/2.7/2.10 em curso | OK |
| C7 | Conventional Commit SEM Story ID | OK — `fix(nexus-v2): adicionar system prompt PT-PT...` |
| C8 | Push é EXCLUSIVO `@devops` Gage | OK — Dex NÃO fez push |
| C9 | Sem `--no-verify`, sem `--force` | OK |
| C10 | Validação local 5/5 PASS antes de commit | OK |

---

## 3. Mensagem de commit (já aplicada em `45682516`)

Conventional Commit com trailers obrigatórios `Constraint`, `Rejected`, `Confidence`, `Scope-risk`, `Directive`. Co-Authored-By Claude Opus 4.7. Mensagem integral está no commit `45682516` (`git log -1 45682516` para inspecção).

---

## 4. Próxima acção (Gage `@devops` — SOP Passo 3)

### 4.1 Sequência sugerida

```bash
cd C:\Users\XPS\Documents\ecosistema-ia-avancada-pt
git checkout fix/nexus-v2-executor-system-prompt-pt-pt
# Confirmar tip: 45682516
git log --oneline -1
# Push branch isolada
git push -u origin fix/nexus-v2-executor-system-prompt-pt-pt
# Abrir PR contra main com gh
gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt \
  --base main \
  --head fix/nexus-v2-executor-system-prompt-pt-pt \
  --title "fix(nexus-v2): adicionar system prompt PT-PT ao executor Sonnet" \
  --body-file imersao-tools/nexus/docs/PR-BODY-HOTFIX-EXECUTOR-SYSTEM-PROMPT.md
```

### 4.2 PR Body sugerido (extrair do commit message + secção 1 deste handoff)

```markdown
## Summary
- Hotfix produção: chatbot em https://imersao.ia.expressia.pt respondia em PT-BR com tom genérico
- Root cause: `AnthropicExecutor.execute()` em `anthropic.ts:348-353` não passava system prompt ao Sonnet
- Fix mínimo: novo `lib/agent/prompts/executor-system.ts` + 1 linha `system:` no executor + 3 testes

## Test plan
- [x] `npm run lint` — PASS (1 warning pré-existente sem relação)
- [x] `npm run typecheck` — PASS 0 erros
- [x] `npx vitest run` — PASS 532/532 testes em 41 ficheiros
- [x] `npx vitest run --coverage` — PASS, executor-system.ts 100% coverage
- [x] `npm run build` — PASS, Next.js todas as routes compilam
- [ ] CodeRabbit review (CI no PR)
- [ ] Eurico — testar manualmente em produção pós-merge (3 cenários da secção 7 do handoff de entrada)

## Refs
- Handoff entrada: `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260518-bug-nexus-pt-br-executor-missing-system-prompt.md`
- Handoff saída: `imersao-tools/nexus/docs/handoffs/RETOMA-20260518-hotfix-executor-system-prompt-pronto-para-devops-push.md`
- SOP: `docs/sops/hotfix-producao.md`
```

### 4.3 Pós-CR + merge — Eurico validação produção (SOP Passo 4.5)

Conforme secção 7 do handoff de entrada:

| Teste | Esperado |
|-------|----------|
| Escrever `"avança"` sem contexto | Resposta em PT-PT curta a pedir exemplo concreto. SEM "você", SEM "usuário", SEM emojis decorativos |
| Escrever `"cria tarefa: comprar pão amanhã"` | Funcionalidade canónica preserva — tarefa criada via tool, resposta confirmação em PT-PT |
| Escrever `"o céu é azul"` (caso AC8 empty intents) | Resposta PT-PT pedindo o que o utilizador quer realmente fazer, NÃO listas genéricas |

---

## 5. Out-of-scope deste hotfix (NÃO arrastar)

| Item | Motivo | Próximo passo |
|------|--------|---------------|
| B3 — Ignora histórico multi-turn | Arquitectural — `runAgent` aceita só `userPrompt: string`, sistema desenhado single-turn | Spec/story Epic 3+ — backlog `@pm *create-epic 3` |
| Refactor classifier para usar mesmo base prompt | Classifier tem comportamento diferente (output JSON estrito + few-shot) | Refactor opcional pós-Epic 2 — não-bloqueante |
| Limpeza dívida untracked fora-scope (150+ ficheiros raiz repo) | Dívida separada não-relacionada com este hotfix | Workspace governance backlog |
| Submódulos `comunidade` + `starter-builder` modified | Working tree pré-existente, fora-scope deste hotfix | Manter intacto |

---

## 6. Estado real do working tree pós-commit

```
On branch fix/nexus-v2-executor-system-prompt-pt-pt
Last commit: 45682516 fix(nexus-v2): adicionar system prompt PT-PT ao executor Sonnet

Changes not staged for commit (PRESERVAR — fora-scope deste hotfix):
 M imersao-tools/comunidade                       (submódulo)
 M imersao-tools/nexus/docs/handoffs/INDEX.md     (vai ser actualizado neste handoff)
 m imersao-tools/starter-builder                  (submódulo)

Untracked (PRESERVAR — fora-scope):
 ?? 150+ ficheiros e pastas (BESTSELLER, _agents/, mega-brain/, etc.)
 ?? imersao-tools/nexus/docs/handoffs/RETOMA-20260518-hotfix-executor-system-prompt-pronto-para-devops-push.md (NESTE HANDOFF)
```

Após a fase de arquivamento do handoff de entrada (`archive/`) + actualização INDEX, o working tree terá:
- 4 ficheiros committed em `45682516` (o hotfix)
- 1 ficheiro novo de handoff de saída (este) — `imersao-tools/nexus/docs/handoffs/RETOMA-20260518-hotfix-executor-system-prompt-pronto-para-devops-push.md`
- 1 ficheiro renamed (handoff de entrada) — `archive/RETOMA-20260518-bug-nexus-pt-br-executor-missing-system-prompt.md`
- 1 ficheiro modified — `INDEX.md` (entrada Pending substituída, entrada Archived adicionada para input)

**Gage decide se commita estes ficheiros de handoff/INDEX no mesmo commit do push (recomendado) ou em commit separado. Padrão Epic 1+2 é commit separado `docs(nexus-v2): close hotfix XYZ ...`.**

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260518-hotfix-executor-system-prompt-pronto-para-devops-push.md`. CAMINHO ESTÁ DENTRO DA PASTA DO PROJECTO (`imersao-tools/nexus/`) — CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 7. Caveats operacionais

| Caveat | Detalhe |
|--------|---------|
| Push exclusivo | Só `@devops` Gage. Dex NUNCA pode fazer `git push` |
| PR vs merge directo | Hotfix produção SEMPRE via PR contra main + CodeRabbit + aprovação manual Eurico (SOP §3.5 + §4) — diferente do closure docs-only que é direct-to-main |
| `gh pr *` | Requer SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| CR self-healing | CodeRabbit pode pedir minor fixes nos doc-comments — padrão Epic 1+2 com hard-stop Iter 2 |
| Mock-protocol-fidelity | T3 já valida `body.system === EXECUTOR_SYSTEM_PROMPT` exacto via MSW. Wire format honrado |
| Não tocar em untracked | 150+ ficheiros e submódulos modified pré-existentes — dívida separada, fora-scope |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260518-hotfix-executor-system-prompt-pronto-para-devops-push.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: Dex (`@dev`) — implementação SOP Passo 2 concluída
DATA: 18/05/2026
