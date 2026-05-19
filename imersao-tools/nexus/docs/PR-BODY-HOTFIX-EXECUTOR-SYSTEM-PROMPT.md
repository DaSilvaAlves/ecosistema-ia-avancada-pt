# Hotfix — Nexus v2 executor system prompt PT-PT

> **Tipo:** Hotfix produção (sem story — SOP `docs/sops/hotfix-producao.md`)
> **Severidade:** HIGH — produção LIVE em https://imersao.ia.expressia.pt
> **Branch:** `fix/nexus-v2-executor-system-prompt-pt-pt`
> **Commit:** `45682516`

## Summary

- **Bug em produção:** chatbot em `https://imersao.ia.expressia.pt` respondia em **PT-BR** com tom genérico e voltava a oferecer listas de capacidades mesmo para inputs como `"o céu é azul"` (caso AC8 empty intents).
- **Root cause:** `AnthropicExecutor.execute()` em `lib/agent/providers/anthropic.ts:348-353` chamava `client.messages.stream()` **sem** parâmetro `system`. O classifier tem system prompt PT-PT mas o executor Sonnet não recebia identidade nem regras de tom.
- **Fix mínimo:** novo `lib/agent/prompts/executor-system.ts` com `EXECUTOR_SYSTEM_PROMPT` (PT-PT, identidade Nexus, regras intents vazios, tom brandbook) + 1 linha `system: EXECUTOR_SYSTEM_PROMPT` no executor + 3 testes (T1+T2+T3 incluindo mock-protocol-fidelity).

## Files Changed (4)

**Novos (2):**
- `imersao-tools/nexus/v2/lib/agent/prompts/executor-system.ts` — `EXECUTOR_SYSTEM_PROMPT` (~30 linhas)
- `imersao-tools/nexus/v2/tests/unit/agent/providers/anthropic.executor.system.test.ts` — 3 testes T1+T2+T3

**Modificados (2):**
- `imersao-tools/nexus/v2/lib/agent/providers/anthropic.ts` — +1 import, +1 linha `system:` na chamada `client.messages.stream()` (linhas 348-354)
- `imersao-tools/nexus/v2/tests/mocks/handlers/anthropic.ts` — comentário stale Story 1.5 AC2 actualizado (linhas 721-727, doc-only; discriminator MSW permanece `body.stream === true`)

Total: **+217 / -4**.

## Quality Gates — 5/5 PASS locais

| Gate | Resultado |
|------|-----------|
| `npm run lint` | PASS (1 warning pré-existente em `app/api/auth/logout/route.ts` — scope alheio) |
| `npm run typecheck` | PASS — 0 erros |
| `npx vitest run` (full suite) | **532/532 verdes em 41 ficheiros** — 38.61s |
| `npx vitest run --coverage` | `lib/agent/prompts` = **100%** lines/branches/functions/statements |
| `npm run build` | PASS — Next.js compila todas as routes (`/projectos`, `/tarefas`, `/login`, APIs, middleware) |

## 3 Testes do hotfix isolados (mock-protocol-fidelity honrada)

```
✓ tests/unit/agent/providers/anthropic.executor.system.test.ts (3 tests) 51ms
  ✓ passa system: EXECUTOR_SYSTEM_PROMPT à chamada client.messages.stream
  ✓ EXECUTOR_SYSTEM_PROMPT contém marcadores PT-PT + identidade Nexus + regras intents vazios
  ✓ MSW handler recebe body.system com EXECUTOR_SYSTEM_PROMPT exacto (mock-protocol-fidelity)
```

T3 valida o wire format real Anthropic — MSW recebe `body.system === EXECUTOR_SYSTEM_PROMPT` exacto, sem divergir do protocolo.

## Constraints inegociáveis honradas

| # | Constraint | Estado |
|---|------------|--------|
| C1 | Branch a partir de `main` limpo (`b193dcbd`) | OK |
| C2 | NÃO mexer em `runAgent` signature | OK — só `executor.execute` internal |
| C3 | NÃO mexer em `classifier-system.ts` | OK |
| C4 | NÃO mexer em prompts de tools | OK |
| C5 | NÃO mexer em MSW handlers de tests existentes (só doc-comment stale) | OK |
| C6 | NÃO tocar em ficheiros de Stories 2.5/2.6/2.7/2.10 em curso | OK |
| C7 | Conventional Commit SEM Story ID (é hotfix, não story) | OK |
| C8 | Push exclusivo `@devops` Gage | OK — Dex NÃO fez push |
| C9 | Sem `--no-verify`, sem `--force` | OK |
| C10 | Validação local 5/5 PASS antes de commit | OK |

## Test plan

- [x] `npm run lint` — PASS
- [x] `npm run typecheck` — PASS
- [x] `npx vitest run` — PASS 532/532
- [x] `npx vitest run --coverage` — PASS, `executor-system.ts` 100% coverage
- [x] `npm run build` — PASS
- [ ] CodeRabbit review (este PR)
- [ ] **Eurico — validação manual em produção pós-merge** (3 cenários abaixo)

### Validação manual Eurico pós-merge (SOP §4.5)

| Teste | Esperado |
|-------|----------|
| Escrever `"avança"` sem contexto | Resposta em PT-PT curta a pedir exemplo concreto. SEM "você", SEM "usuário", SEM emojis decorativos |
| Escrever `"cria tarefa: comprar pão amanhã"` | Funcionalidade canónica preservada — tarefa criada via tool, resposta confirmação em PT-PT |
| Escrever `"o céu é azul"` (caso AC8 empty intents) | Resposta PT-PT pedindo o que o utilizador quer realmente fazer, NÃO listas genéricas |

## Out-of-scope (não arrastar neste PR)

| Item | Próximo passo |
|------|---------------|
| B3 — Ignora histórico multi-turn (arquitectural — `runAgent` single-turn) | Spec/story Epic 3+ |
| Refactor classifier para usar mesmo base prompt | Opcional pós-Epic 2 |
| 150+ untracked dívida workspace governance | Backlog separado |
| Submódulos `comunidade` + `starter-builder` modified pré-existentes | Manter intacto |

## Refs

- **Handoff entrada** (consumido): `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260518-bug-nexus-pt-br-executor-missing-system-prompt.md`
- **Handoff saída** (este PR): `imersao-tools/nexus/docs/handoffs/RETOMA-20260518-hotfix-executor-system-prompt-pronto-para-devops-push.md`
- **SOP hotfix produção:** `docs/sops/hotfix-producao.md`
- **Mock-protocol-fidelity rule:** `.claude/rules/mock-protocol-fidelity.md`
