# RETOMA — Story 1.10 PR #14 Iter 2 fix aplicado, aguarda @devops *push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## Metadata

| Campo | Valor |
|-------|-------|
| `from_agent` | `@dev` (Dex) |
| `to_agent` | `@devops` (Gage) |
| `created` | 2026-05-10T14:30:00Z |
| `status` | pending |
| `project` | Nexus v2 |
| `story_id` | 1.10 |
| `pr` | #14 |
| `branch` | `feat/nexus-v2-story-1.10-e2e-regression` |

---

## Summary

Iter 2 fix Story 1.10 commitado em `d8b7435b`. Real causa do CI vermelho era **cookie sharing entre `APIRequestContext` e `BrowserContext` no Playwright**, não 401 bcrypt como o handoff anterior assumia. Fix aplicado em `auth.ts` (assinatura passa a `Page`, usa `page.request.post()`) e `regression.spec.ts` (`beforeAll` → `beforeEach`). Validação local 321/321 PASS. Aguarda push para CI rerun.

---

## Context

### Estado actual

- **Branch:** `feat/nexus-v2-story-1.10-e2e-regression` (1 commit local à frente do remote)
- **PR:** #14 aberto contra `main`, CI run anterior 25601188406 vermelho
- **Commit do fix:** `d8b7435b`
- **Story status:** Ready for Review (Iter 2)

### Diagnóstico re-feito (descarta hipótese do handoff anterior)

O handoff `RETOMA-20260509-story-1.10-pr-14-ci-vermelho-aguarda-dev-fix-auth-401.md` (agora arquivado como `-CONSUMIDO.md`) afirmava que a causa era **401 bcrypt** com hash placeholder. Análise do CI run 25601188406 desmente:

1. **Server log:** imprimiu `[auth] KV não configurado — sessão em memória apenas` — prova que `createSession()` correu OK.
2. **Sintoma real do CI:** `locator.fill: timeout 30000ms exceeded` em `chat-composer-input` — não 401.
3. **Causa raiz:** `loginViaApi(request)` usava a fixture `APIRequestContext` cujo storage state é **independente** do `BrowserContext` da `page`. O cookie `nexus_session` da response 200 do login ficava no contexto do `request` mas a `page` não o via.
4. **Consequência:** `middleware.ts:30` redireccionava `/` → `/login`, o composer não existia na página de login, `locator.fill` falhava com timeout.

### Fix aplicado

| Ficheiro | Mudança |
|----------|---------|
| `imersao-tools/nexus/v2/tests/e2e/regression/helpers/auth.ts` | Assinatura `loginViaApi(request: APIRequestContext)` → `loginViaApi(page: Page)`. Internamente usa `page.request.post('/api/auth/login', ...)`. Docstring expandido com causa raiz. |
| `imersao-tools/nexus/v2/tests/e2e/regression/regression.spec.ts` | `loginViaApi(request)` em `beforeAll` → `loginViaApi(page)` em `beforeEach` (cada `page` tem `BrowserContext` próprio). |

**Justificação técnica:** Documentação Playwright — *"page.request shares cookie storage with the BrowserContext of the Page"*. É a única forma documentada de fazer o cookie do login HTTP chegar à `page` que vai ser navegada a seguir.

### Validação local

| Gate | Resultado |
|------|-----------|
| `npx tsc --noEmit` | OK |
| `npx next lint` | OK |
| `npx vitest run` | 321/321 PASS |
| Suite E2E real | NÃO testada (requer dev server + env CI) — só validável em CI rerun |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260510-story-1.10-pr-14-fix-iter2-aguarda-devops-push.md`. CONFIRMA QUE ESTÁ DENTRO DA PASTA DO PROJECTO NEXUS — SIM, ESTÁ. CONSULTAR `.claude/rules/handoff-location.md` SE EM DÚVIDA.

---

## Files Modified (commit `d8b7435b`)

```
imersao-tools/nexus/docs/handoffs/INDEX.md                                                                   |   5 +-
imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260509-story-1.10-pr-14-ci-vermelho-...-CONSUMIDO.md      | 256 +++++++++++++++++++++
imersao-tools/nexus/docs/stories/active/1.10.story.md                                                        |  12 +-
imersao-tools/nexus/v2/tests/e2e/regression/helpers/auth.ts                                                  |  53 +++--
imersao-tools/nexus/v2/tests/e2e/regression/regression.spec.ts                                               |  12 +-
5 files changed, 319 insertions(+), 19 deletions(-)
```

---

## Next Action — `@devops *push`

### Comando

```
@devops *push
```

### Sequência esperada

1. **`@devops *push`** — push da branch `feat/nexus-v2-story-1.10-e2e-regression` para origin
2. **CI rerun automático** no PR #14 — esperar status verde nos 2 jobs:
   - `50-prompt regression`
   - `Playwright E2E + bundle key check`
3. **Se verde:**
   - `@po *close-story 1.10` (Pax fecha story 1.10 → Done)
   - Epic 1 = 10/10 stories Done
   - **Epic 2 desbloqueia**
4. **Se vermelho:**
   - Handoff de volta a `@dev` com logs específicos
   - NÃO assumir o mesmo diagnóstico — investigar logs primeiro

### Comandos auxiliares

- Verificar commit: `git log --oneline -3` (deve mostrar `d8b7435b` no topo)
- Confirmar branch: `git branch --show-current` → `feat/nexus-v2-story-1.10-e2e-regression`
- Stat do commit: `git show d8b7435b --stat`

---

## Risk Assessment

| Dimensão | Nível | Notas |
|----------|-------|-------|
| Scope | Narrow | 2 ficheiros de tests + docs |
| Confidence | High | TS+lint+vitest 321/321 OK; mecanismo Playwright documentado |
| Reversibility | Trivial | Single revert de `d8b7435b` |
| Blast radius | Zero produção | Só toca tests E2E e story docs |
| Not-tested | Pass rate threshold contra real Anthropic API (só staging com env real) |

---

## Blockers

Nenhum. Pronto para `@devops *push`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260510-story-1.10-pr-14-fix-iter2-aguarda-devops-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@dev` (Dex), via finalização por claude-code (Dex agent timed out a meio de fluxo)
DATA: `10/05/2026`
