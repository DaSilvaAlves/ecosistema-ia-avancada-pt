# EPIC 0 — Follow-Up Technical Debt

> **Origem:** Sessão 04/05/2026 — decisão Eurico **Opção C híbrido** sobre PR #2 (Epic 0 Nexus v2).
> Para desbloquear merge do Epic 0, foram aplicados 3 fixes temporários (coverage threshold rebaixado, 2 e2e tests `.skip`, Vercel root config adiada).
> Estas 3 stories de débito técnico DEVEM ser executadas no Epic 1 antes de qualquer feature nova depender destas áreas.

---

## Contexto

| Item | Valor |
|------|-------|
| Branch origem | `feat/nexus-v2-epic-0` |
| PR origem | `#2` — `https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/2` |
| Decisão Eurico | Opção C — híbrido (merge Epic 0 com fixes temporários, débito registado) |
| Sessão | 04/05/2026 |
| Agente que aplicou fixes | Dex (`@dev`) |
| Handoff técnico | `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-opcao-c-fixes-aplicados-aguarda-devops-merge.md` |

---

## Stories follow-up

### Story F.1 — Subir coverage threshold de 25% para 60%+

**Tipo:** Tech Debt (Quality Gate)

**User Story:**
Como `@qa` (Quinn), quero o coverage threshold do Nexus v2 voltar ao baseline arquitectural de 60% para garantir que `lib/agent/`, `lib/db/` e `lib/shared/` mantêm o nível de confiança definido em `architecture-v2.md` §5.4.

**Background:**
No Epic 0 o threshold foi rebaixado temporariamente para 25% em `imersao-tools/nexus/v2/vitest.config.ts` (linhas `lines/functions/branches/statements: 25`) porque os módulos `lib/shared/env.ts`, `lib/shared/format.ts`, `lib/shared/recurrence.ts` e `lib/shared/themes.ts` foram introduzidos sem testes acompanhantes (Lines: 29.06%, Statements: 29.06%, Branch: 68.42%, Funcs: 71.42%).

**Acceptance Criteria:**

1. Adicionar testes unitários para `lib/shared/env.ts`, `lib/shared/format.ts`, `lib/shared/recurrence.ts`, `lib/shared/themes.ts` cobrindo branches críticos.
2. Adicionar testes para componentes/utilities de `lib/agent/` e `lib/db/` que ainda não tenham coverage suficiente.
3. Restaurar `vitest.config.ts` thresholds para `lines/functions/branches/statements: 60` e remover o comentário `// Coverage threshold: 25% temporary baseline`.
4. CI job `Vitest unit + coverage` no workflow `nexus-v2-ci.yml` deve passar PASS com novo threshold.
5. Confirmar via `npm run test -- --coverage` local que os 4 thresholds atingem >= 60%.

**Referências:**
- `imersao-tools/nexus/docs/architecture-v2.md` §5.4 (Quality Gates)
- Sessão 04/05/2026 — decisão Eurico Opção C híbrido
- `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-pushed-pr-aberta.md` (análise CI failure original)

---

### Story F.2 — Re-activar 2 e2e tests `auth.spec.ts`

**Tipo:** Tech Debt (Test Reliability)

**User Story:**
Como `@dev` (Dex), quero os 2 e2e tests skipped em `tests/e2e/auth.spec.ts` voltar a correr verde em CI para garantir cobertura E2E completa do fluxo de auth (login com password errada + proxy 401 sem cookie).

**Background:**
Na sessão 04/05/2026 dois testes foram marcados `test.skip` no ficheiro `imersao-tools/nexus/v2/tests/e2e/auth.spec.ts`:

| Linha | Teste | Razão do skip |
|-------|-------|---------------|
| ~28 | `password errada mostra erro inline` | `getByRole('alert')` resolve a 2 elementos (Next.js route announcer com `role="alert" aria-live="assertive"` + custom alert do componente) — strict mode violation Playwright |
| ~36 | `proxy Anthropic devolve 401 sem cookie` | KV mock setup em CI difere de prod — comportamento sem KV real em CI provoca status code inesperado |

Os testes não foram apagados — apenas anotados com `// TODO Epic 1 follow-up Story F.2 — fix strict mode selector / KV mock setup`.

**Acceptance Criteria:**

1. Resolver strict mode violation no teste `password errada mostra erro inline`:
   - Opção A: usar `getByRole('alert').filter({ hasText: /incorrecta|configurado/i })` para distinguir do route announcer Next.js
   - Opção B: alterar componente custom alert para usar `role` diferente ou `data-testid`
2. Configurar KV mock para o teste `proxy Anthropic devolve 401 sem cookie` funcionar em CI sem Vercel KV real (ex: mock via `next-test-utils` ou injecção de stub no setup Playwright).
3. Remover ambos `test.skip(` → `test(` em `imersao-tools/nexus/v2/tests/e2e/auth.spec.ts`.
4. Remover comentários `// TODO Epic 1 follow-up Story F.2`.
5. CI job `Playwright E2E + bundle key check` no workflow `nexus-v2-ci.yml` deve correr 4/4 testes verde.

**Referências:**
- `imersao-tools/nexus/docs/stories/active/0.6.story.md` (Story de auth)
- `imersao-tools/nexus/docs/QA-GATE-STORY-0.6.md` (gate WAIVED em AC3)
- CodeRabbit Review PR #2 — comment Critical em `auth.spec.ts:33` (strict mode violation)

---

### Story F.3 — Vercel root directory config para Nexus v2 — DONE

**Tipo:** Tech Debt (Deploy Config)
**Estado:** **Done — 04/05/2026** (configuração executada via Vercel CLI/API por `@devops` Gage por delegação directa do Eurico)

**User Story:**
Como `@devops` (Gage), quero o projecto Vercel do Nexus v2 configurado com root directory correcto para que cada PR gere preview deploy verde sem o build falhar a tentar compilar a raiz do monorepo.

**Background:**
Na sessão 04/05/2026 o job `Vercel Preview` falhou em CI porque o Vercel project actual está a tentar build na raiz do repo (`ecosistema-ia-avancada-pt/`) em vez de `imersao-tools/nexus/v2/` onde vive o Next.js app.

**Decisão Eurico 04/05/2026: Opção A escolhida** — configuração via Vercel UI (manual pelo Eurico, sem código). Eurico delegou execução ao `@devops` que executou via Vercel CLI/API (`PATCH /v9/projects/{id}` com `rootDirectory` + `framework`).

**Acceptance Criteria — todos cumpridos:**

1. **Opção A — Configuração via Vercel CLI/API (executada 04/05/2026):** ✅
   - Projecto Vercel identificado: `imercao-ia-pt` (`prj_dINwUiP0ocRnxu32wRm4YPZ2ngRU`) sob `euricojsalves-4744's projects`
   - `rootDirectory` configurado para `imersao-tools/nexus/v2` via `PATCH /v9/projects/{id}`
   - `framework` confirmado como `nextjs`
   - `ssoProtection` desactivado (era default automática) para permitir acesso público a previews
   - Preview deploy executado com sucesso: `dpl_AxYm7SSZ5RRmLxtGpz226K1nLaZw`
2. ~~Opção B — `vercel.json` na raiz~~ (descartada). ✅
3. Documentação actualizada em `architecture-v2.md` §13.2 — Deploy / Infrastructure / Vercel Configuration. ✅
4. Build Vercel concluído **READY** (58s) — Next.js 15 detectado correctamente, todas as rotas compiladas (`/`, `/login`, `/api/*`, middleware 34.5kB). ✅
5. **URL preview valida AC5:** ✅
   - `/login` → **HTTP 200** (página de login serve)
   - `/` → **HTTP 307 → /login** (middleware redirige correctamente quando sem cookie)
   - URL: `https://imercao-ia-qye5zybyl-euricojsalves-4744s-projects.vercel.app`

**Tarefas residuais fora do âmbito de F.3:**

| Item | Estado | Quem trata |
|------|--------|-----------|
| Configurar env vars (`ANTHROPIC_API_KEY`, `NEXUS_PASSWORD_HASH`, `SESSION_SECRET`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`) | Pending — projecto tem **0 env vars** configuradas actualmente | Eurico (segredos) — runtime falhará sem isto, mas build/deploy passa |
| Promover deploy a produção (`vercel --prod`) | Pending — só faz sentido após env vars | `@devops` quando Eurico der OK |
| CI workflow `nexus-v2-ci.yml` job `Vercel Preview` revalidar | Próximo PR | Auto-trigger no GitHub Action |

**Referências:**
- Sessão 04/05/2026 — Vercel Preview FAILURE em PR #2
- `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-pushed-pr-aberta.md` §3 Vercel Preview
- Deploy preview validado: `https://imercao-ia-qye5zybyl-euricojsalves-4744s-projects.vercel.app/login` (HTTP 200)

---

### Story F.4 — OnboardingModal Google link → 404 — DONE

**Tipo:** Tech Debt (Bug Fix)
**Estado:** **Done — 05/05/2026 (Opção B aplicada)** via Story `0.11.story.md` (`imersao-tools/nexus/docs/stories/active/0.11.story.md`). Implementado por `@dev` Dex em branch `fix/nexus-v2-story-0.11-onboarding-google-disable`. Quality gates 4/4 PASS local. Aguarda `@qa *qa-gate 0.11` + `@devops *push`.

**User Story:**
Como Eurico, quero que o passo Google do OnboardingModal aponte para uma rota válida (ou seja claramente skippable sem 404) para não cair numa página `404 This page could not be found` durante o primeiro login.

**Background:**
Após login bem-sucedido em produção (`https://imersao.ia.expressia.pt`, sessão 04/05/2026), ao clicar no passo Google do OnboardingModal, o browser navegou para `/api/google/oauth/google` que devolveu **404** porque a pasta `app/api/google/` não existe (será implementada em Epic 1).

**Acceptance Criteria:**

1. Identificar onde o OnboardingModal define o link Google (`app/(app)/components/OnboardingModal.tsx` ou similar) e a rota esperada.
2. **Decisão entre Opção A e B:**
   - **Opção A — Stub temporário:** criar `app/api/google/oauth/start/route.ts` que redirige para `/?onboarding-google=skipped` com mensagem "Google OAuth disponível em Epic 1".
   - **Opção B — Disable temporário do passo:** marcar o passo Google como `disabled` no OnboardingModal com tooltip "Disponível em Epic 1". Botão Skip continua activo.
3. Garantir que clicar nesse passo não leva a 404. Smoke test em produção.
4. Documentar a opção escolhida em `EPIC-0-FOLLOW-UP-DEBT.md` (este documento).
5. CI passa após fix.

**Referências:**
- Sessão 04/05/2026 — primeiro login produção, Eurico reportou 404 em `/api/google/oauth/google`
- Story 0.7 (OnboardingModal) — gate PASS com note "Google/Telegram/Push são saltáveis"
- `imersao-tools/nexus/v2/app/(app)/components/OnboardingModal.tsx` (a confirmar path)

---

## Prioridade sugerida

| Story | Prioridade | Estado | Estimativa |
|-------|-----------|--------|------------|
| F.3 | ALTA | **Done — 04/05/2026** (config Vercel CLI/API + preview verde) | Real: ~30min |
| F.4 | ALTA | **Done — 05/05/2026** (Story 0.11 — Opção B disable temporário, aguarda @qa + @devops) | Real: ~30min |
| F.2 | MÉDIA | Pending — bloqueador: confiança no fluxo auth E2E em CI | 1-2h |
| F.1 | MÉDIA | Pending — bloqueador: restaurar quality gate arquitectural de 60% | 3-5h (depende de quanto código `lib/shared/*` precisa de testes) |

---

## Quem cria estas stories

`@sm` (River) deve transformar F.1, F.2, F.4 em stories formais sob naming convention `1.X.story.md` quando Epic 1 arrancar (ou criar `0.11.story.md`, `0.12.story.md`, `0.14.story.md` se Eurico preferir manter Epic 0 como container). F.3 já fechada.

---

*Documento criado por Dex (`@dev`) em 04/05/2026 após aplicar fixes Opção C híbrido decididos por Eurico. Próxima acção: `@devops` faz push dos fixes na branch `feat/nexus-v2-epic-0` (PR #2 já aberta) + aguarda CI verde + merge + move stories Epic 0 para `completed/`.*
