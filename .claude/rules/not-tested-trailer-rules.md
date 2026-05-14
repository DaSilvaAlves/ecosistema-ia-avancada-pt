# Not-Tested Trailer Rules — Regra Obrigatória

## Origem

Incidente Nexus v2 Story 1.10 Iter 4 (commit `887e6c2f`, 11/05/2026). A correcção alterou `playwright.config.ts` (`testIgnore: ['**/regression/**']`) e foi commitada com o trailer `Not-tested: regression CI run`. A premissa era que `testIgnore` excluía apenas os regression tests dos workflows regulares — falso. `testIgnore` filtra na fase de discovery do Playwright, antes dos paths CLI, tornando `npm run test:e2e` vazio em qualquer contexto. O `Not-tested:` num commit que toca configuração de CI deveria ter sido red flag bloqueador, não waiver aceite. Custou 1 iteração extra (Iter 5) a corrigir.

## Princípio

O trailer `Not-tested:` (definido no commit-protocol) declara honestamente o que não foi coberto por testes. **Mas há contextos em que `Not-tested:` não é waiver válido — é red flag bloqueador.** A diferença está no que o commit toca.

## Classificação

### `Not-tested:` é WAIVER VÁLIDO quando o commit toca

| Contexto | Exemplo |
|----------|---------|
| Edge case de runtime de difícil reprodução | Cold-start latency, race condition rara |
| Código de aplicação num caminho não-crítico | Branch de erro defensivo improvável |
| Cenário que exige ambiente externo indisponível | Integração com serviço de terceiros sem sandbox |

### `Not-tested:` é RED FLAG BLOQUEADOR quando o commit toca

| Contexto | Paths típicos |
|----------|---------------|
| Configuração de CI/CD | `.github/workflows/**` |
| Configuração de test runner | `playwright.config.ts`, `vitest.config.ts`, `jest.config.js` |
| Scripts de build/test | `package.json` (campo `scripts`), `tsconfig*.json` |
| Configuração de build | `*.config.ts`, `*.config.js`, `vite.config.ts` |
| Segurança | Auth, RLS, gestão de secrets, middleware de sessão |

## Regra para Contextos Bloqueadores

Um commit que toca um path da tabela "red flag" **não pode** usar `Not-tested:` como waiver. Em vez disso:

1. **Exige evidência local prévia** anexada ao commit ou ao Change Log da story — output de `--list`, dry-run, ou execução local que prove o efeito real da alteração
2. Se a evidência não for possível de obter localmente, o commit **não avança** — escala para `@devops` ou `@architect`
3. O agente que aceita um `Not-tested:` em contexto bloqueador sem evidência é responsável pela regressão que daí resultar

## Aplicação

| Quem | Responsabilidade |
|------|------------------|
| `@dev` | Não usar `Not-tested:` em contexto bloqueador — anexar evidência local ou escalar |
| `@qa` | No QA gate, rejeitar story cujo Change Log tenha `Not-tested:` em commit que toca path bloqueador sem evidência |
| `@devops` | No pre-push, tratar `Not-tested:` + path bloqueador como gate falhado até haver evidência |
| `@sm` | O template de story exige o campo de evidência (ver acção A2 da retrospectiva Epic 1) |

## Referência

Complementa o bloco `<commit_protocol>` do CLAUDE.md global. O trailer `Not-tested:` continua obrigatório quando aplicável — esta regra define quando deixa de ser suficiente sozinho.

---

*Origem: Retrospectiva Epic 1 Nexus v2, acção A3. Criada por Orion (`@aiox-master`) em 14/05/2026.*
