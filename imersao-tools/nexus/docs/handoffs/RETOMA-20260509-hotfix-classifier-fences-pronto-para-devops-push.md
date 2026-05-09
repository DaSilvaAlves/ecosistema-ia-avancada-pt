# RETOMA — Hotfix classifier markdown fences pronto para push (@devops)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## Metadata

| Campo | Valor |
|-------|-------|
| **Data criação** | 2026-05-09 |
| **Criado por** | `@dev` (Dex) — implementação do hotfix |
| **Para agente** | `@devops` (Gage) — push + abertura de PR |
| **Projecto** | Nexus v2 (`imersao-tools/nexus/`) |
| **Branch** | `fix/nexus-v2-classifier-strip-markdown-fences` (criada a partir de `main` em SHA `2adb6810`) |
| **Commit local** | `765e422c` — `fix(nexus-v2): strip markdown fences from Haiku JSON before parse` |
| **Story relacionada** | Nenhuma — hotfix isolado, NÃO é Story 1.10 |
| **Severidade** | Alta — bug em produção bloqueia qualquer prompt em https://imersao.ia.expressia.pt |
| **Tipo** | Hotfix sem story — não passa por `@po` nem `@qa` antes do push |

---

## Estado actual

- Branch criada limpa a partir de `main` (NÃO está dentro de `feat/nexus-v2-story-1.10-e2e-regression`).
- Patch aplicado em `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts` (helper `stripJsonMarkdownFences()` + uso no try/catch).
- 4 testes novos adicionados em `tests/unit/agent/providers/anthropic.test.ts` (caso markdown com tag `json`, sem tag, regressão JSON puro, whitespace extra).
- Validação local PASS (lint, typecheck, vitest 325/325).
- Commit local feito (`765e422c`). NÃO push'ed (autoridade exclusiva de `@devops`).

---

## Acção pedida ao @devops

1. **Pull da branch local** ou checkout do commit `765e422c` na máquina onde correm os comandos de push.
   - Branch: `fix/nexus-v2-classifier-strip-markdown-fences`
   - Base: `main` SHA `2adb6810`
2. **Push para origin:**
   ```
   git push -u origin fix/nexus-v2-classifier-strip-markdown-fences
   ```
3. **Abrir PR contra `main`** com título e body sugeridos abaixo.
4. **Aguardar CodeRabbit Iter 1** (politica hard-stop padrão Nexus v2 — CR pode pedir ajustes).
5. **Aguardar CI verde** (vitest na pipeline + lint + typecheck).
6. **Decisão do Eurico** sobre merge — porque é hotfix em produção e sem story, sugiro escalação directa ao Eurico assim que CI verde + CR PASS.
7. Após merge → arquivar este handoff e o handoff de input (`RETOMA-20260509-bug-classifier-json-markdown-fences.md`) para `archive/`.

### Sugestão de PR title

```
fix(nexus-v2): strip markdown fences from Haiku JSON before parse
```

### Sugestão de PR body

```markdown
## Bug em produção (2026-05-09)

Ao escrever prompts simples (`oi`, `ola`) em https://imersao.ia.expressia.pt o chat mostra:

> Classifier: resposta da API não é JSON válido — recebido: ```json {"intents":[],"confidence":{}} ```

Causa: a Haiku 4.5 ocasionalmente envolve a resposta do classifier em markdown
fences (` ```json … ``` `) apesar do system prompt pedir "APENAS JSON válido,
sem markdown". `JSON.parse()` rejeita imediatamente.

## Fix

Helper `stripJsonMarkdownFences()` em `lib/agent/providers/anthropic.ts` normaliza
apenas o input para `JSON.parse`. O `rawResponse` original (com fences) é
PRESERVADO em:
- `ClassificationResult.rawResponse` — debug e PII redaction downstream
- `Error.message` no catch — debuggability quando o parse falha mesmo após strip

## Scope cirúrgico

- Não toca em `classifier.ts` (wrapper)
- Não altera `prompts/classifier-system.ts`
- Não altera `ClassificationResultSchema`
- Não silencia o erro original

## Testes

4 casos novos no test file existente:
- Markdown fences com tag `json`
- Markdown fences sem tag
- Whitespace extra à volta dos fences
- Regressão JSON puro (sem fences) continua a funcionar

Suite completa: 325/325 PASS (zero regressão em 26 test files).

## Validação local

- [x] `npm run lint`: clean
- [x] `npm run typecheck`: clean
- [x] `npx vitest run`: 325/325 PASS

## Tipo

Hotfix em produção. Não tem story associada (Story 1.10 está em CI vermelho/escalation paralela e o fix NÃO foi misturado com essa branch).

Ref handoff: `imersao-tools/nexus/docs/handoffs/RETOMA-20260509-bug-classifier-json-markdown-fences.md`
```

---

## Ficheiros alterados

| Ficheiro | Tipo | Mudança | Linhas |
|----------|------|---------|--------|
| `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts` | M | Helper `stripJsonMarkdownFences()` + uso no try/catch da `AnthropicClassifier.classify` | +29 / -1 |
| `imersao-tools/nexus/v2/tests/unit/agent/providers/anthropic.test.ts` | M | Novo `describe('AnthropicClassifier — markdown fences hotfix (2026-05-09)')` com 4 testes | +115 / 0 |

Total: 2 ficheiros, +144 / -1 linhas.

---

## Validação local executada

| Check | Comando | Resultado |
|-------|---------|-----------|
| Lint | `npm run lint` (em `imersao-tools/nexus/v2/`) | PASS — apenas 1 warning pré-existente em `app/api/auth/logout/route.ts` (não relacionado) |
| Typecheck | `npm run typecheck` | PASS — zero erros |
| Vitest (target) | `npx vitest run tests/unit/agent/providers/anthropic.test.ts` | 32/32 PASS (28 originais + 4 novos) |
| Vitest (full suite) | `npx vitest run` | 325/325 PASS — 26 test files — zero regressão |

---

## Constraints respeitados (do handoff de input)

- [x] NÃO modificar `lib/agent/classifier.ts` — fix está no provider
- [x] NÃO modificar `prompts/classifier-system.ts` — system prompt intacto
- [x] NÃO alterar `ClassificationResultSchema` — `rawResponse` mantém-se original (com fences)
- [x] NÃO silenciar `Error.message` — `rawResponse.slice(0, 200)` preservado no catch
- [x] NÃO misturar com Story 1.10 — branch separada criada de `main` limpo
- [x] Imports absolutos respeitados (sem alterar imports do ficheiro)
- [x] Comments em PT-PT (Constitution Article V)

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260509-hotfix-classifier-fences-pronto-para-devops-push.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Referências canónicas

| Doc | Path | Para que serve |
|-----|------|---------------|
| Handoff de input (bug original) | `imersao-tools/nexus/docs/handoffs/RETOMA-20260509-bug-classifier-json-markdown-fences.md` | Sintoma + root cause + patch sugerido |
| Provider modificado | `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts` | Helper + uso no classify |
| Tests modificados | `imersao-tools/nexus/v2/tests/unit/agent/providers/anthropic.test.ts` | 4 casos novos no describe `markdown fences hotfix` |
| Regra autoridade push | `.claude/rules/agent-authority.md` | `git push` exclusivo do `@devops` |
| Regra Iter hard-stop | Memória `project_nexus_v2_story_1_5_pr_8_iter3_doc_nits_only` | Padrão CR Iter caps no Nexus v2 |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus` (Nexus v2)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260509-hotfix-classifier-fences-pronto-para-devops-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@dev` (Dex) — implementou hotfix e criou este handoff
DATA: 09/05/2026
