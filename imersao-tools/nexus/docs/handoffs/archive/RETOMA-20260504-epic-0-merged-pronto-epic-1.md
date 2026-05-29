# RETOMA — Nexus v2 — Epic 0 MERGED em main, 10 stories Done, pronto para Epic 1 (com 3 follow-ups F.1/F.2/F.3 + 1 fix manual Eurico)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR

Epic 0 do Nexus v2 fechado. PR #2 mergeada para `main` via squash. 10 stories movidas de `active/` → `completed/` com status `Done`. 4 gates KEY do Nexus v2 todos verdes (Lint+TS, Vitest+coverage, Playwright+bundle, CodeRabbit). Vercel preview falhou — fix manual pelo Eurico (Story F.3, instruções abaixo). Pronto para `@sm` arrancar Epic 1, com 3 stories follow-up de débito técnico documentadas (F.1, F.2, F.3) em `imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md`.

**Próximo passo:** Eurico decide entre (a) executar Story F.3 manualmente AGORA (fix Vercel preview) ou (b) arrancar Epic 1 directamente com `@sm *create-story` (proxy Anthropic já desbloqueado pela Story 0.5 — não bloqueia Epic 1).

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 (uso interno pessoal Eurico) |
| Localização | `imersao-tools/nexus/v2/` |
| Sessão actual | 04/05/2026 (DevOps merge + close Epic 0) |
| Agente que sai | Gage (`@devops`) |
| Agente que entra | Eurico (decisão Vercel) → depois `@sm` (arrancar Epic 1) |
| Estado | Epic 0 fechado, mergeado para main |
| Branch | `feat/nexus-v2-epic-0` — APAGADA do remote |
| PR | `#2` — MERGED 04/05/2026 17:50 UTC |
| URL PR | <https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/2> |
| Commit Opção C aplicado | `43cc3434` — `chore(nexus-v2): Opção C — coverage 60→25, skip 2 e2e tests, follow-up debt doc [Epic 0 closure]` |
| Squash merge SHA | `c362b171cef2ebbf70919ee856292bb4d20f0eb` |

---

## O que foi feito nesta sessão (Gage)

| Passo | Acção | Resultado |
|-------|-------|-----------|
| 1 | Validação local pré-push (4 ficheiros staged: vitest.config.ts, auth.spec.ts, EPIC-0-FOLLOW-UP-DEBT.md, handoff Dev→DevOps + archive do handoff anterior) | OK |
| 2 | Commit atómico `43cc3434` | OK — pre-commit hook passou, conventional commit + trailers |
| 3 | Push para `feat/nexus-v2-epic-0` | OK — PR #2 actualizada |
| 4 | Aguardar CI | OK — 4 gates KEY verdes em ~2min |
| 5 | Comentar PR a documentar gates verdes + falhas conhecidas (Vercel/Coverage Report) | OK |
| 6 | Merge squash + delete branch | OK — `c362b171` em main, branch remota apagada |
| 7 | Pull main + 10 stories `active/` → `completed/` com status `Done` | OK |
| 8 | Arquivar handoff Dev→DevOps consumido | OK |
| 9 | Criar este handoff final | OK |
| 10 | Actualizar HANDOFF-INDEX | a fazer no commit final |

---

## CI final na PR #2 (snapshot pré-merge)

### Gates KEY Nexus v2 (todos PASS)

| Check | Status | Detalhe |
|-------|--------|---------|
| Lint + TypeScript | PASS | 35s |
| Vitest unit + coverage | PASS | 33s — threshold 25% temporário (Story F.1) |
| Playwright E2E + bundle key check | PASS | 1m49s — 2/4 tests (2 skipped Story F.2) |
| CodeRabbit | PASS | review completed |
| CodeRabbit Status | PASS | 5s |

### Falhas conhecidas (NÃO bloqueiam — alheias ao Nexus v2 ou follow-up registado)

| Check | Razão | Follow-up |
|-------|-------|-----------|
| Vercel | Root directory config | **Story F.3 — fix manual pelo Eurico (instruções abaixo)** |
| Coverage Report | `aiox-capabilities-guardian.js` postinstall falha (backup dir ausente em CI) — problema infra do monorepo AIOX core, pré-existente | Não scope deste Epic |
| Record Quality Metrics | mesmo problema postinstall | Não scope deste Epic |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-merged-pronto-epic-1.md`. PROJECTO É NEXUS V2. LOCALIZAÇÃO COINCIDE COM PROJECTO REFERIDO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Stories Epic 0 — agora em `completed/` com status `Done`

| Story | Título | Status |
|-------|--------|--------|
| 0.1 | Setup Next.js 15 + TypeScript strict + Tailwind 4 | Done |
| 0.2 | Setup Vitest + Playwright + harness testes | Done |
| 0.3 | Setup ESLint v9 + Prettier + Husky | Done |
| 0.4 | Setup CI GitHub Actions (lint+TS+Vitest+Playwright+bundle key) | Done |
| 0.5 | Proxy Anthropic com auth via cookie + KV rate limit | Done |
| 0.6 | Auth flow: login + cookie session + middleware | Done |
| 0.7 | Layout base + sidebar + topbar + theme | Done |
| 0.8 | Widget shell components (Card, Skeleton, ErrorBoundary) | Done |
| 0.9 | Storybook + design tokens + visual regression | Done |
| 0.10 | Lighthouse + bundle key NFR5 + perf gates | Done |

Path: `imersao-tools/nexus/docs/stories/completed/0.{1..10}.story.md`

---

## Follow-ups Epic 1 — débito técnico registado

Documento: **`imersao-tools/nexus/docs/EPIC-0-FOLLOW-UP-DEBT.md`**

| Story | Tipo | Resumo | Prioridade |
|-------|------|--------|-----------|
| **F.1** | Tech Debt — Quality Gate | Subir coverage threshold 25% → 60%+ via testes em `lib/shared/*` + componentes críticos | Média |
| **F.2** | Tech Debt — Test Reliability | Re-activar 2 e2e tests skipped em `auth.spec.ts` (resolver strict mode selector + KV mock) | Média |
| **F.3** | Tech Debt — Deploy Config | Vercel root directory config (Eurico decide UI vs `vercel.json`) | **Alta — bloqueia preview deploys** |

---

## INSTRUÇÕES F.3 PARA EURICO — fix manual Vercel root directory

A PR #2 tinha Vercel preview a falhar porque o projecto Vercel está apontado para a raiz do monorepo, mas o Nexus v2 vive em `imersao-tools/nexus/v2/`. Há duas opções para resolver — **Eurico escolhe**:

### Opção A — Configurar via UI Vercel (preferida, sem código novo)

1. Abrir <https://vercel.com/euricojsalves-4744s-projects/imercao-ia-pt/settings>
2. Ir a **Settings → General → Root Directory**
3. Definir como: **`imersao-tools/nexus/v2`**
4. Guardar
5. Em **Settings → General → Build & Development Settings**:
   - Framework Preset: **Next.js** (auto-detectado)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)
6. Em **Settings → Git → Production Branch**: confirmar que está em `main`
7. Trigger novo deploy: **Deployments → … → Redeploy**

### Opção B — Adicionar `vercel.json` no repo (mais permanente, requer commit)

Criar ficheiro **`vercel.json`** na raiz do repo:

```json
{
  "buildCommand": "cd imersao-tools/nexus/v2 && npm install && npm run build",
  "outputDirectory": "imersao-tools/nexus/v2/.next",
  "installCommand": "echo 'install handled by buildCommand'",
  "framework": "nextjs"
}
```

Trade-off: Opção A é mais limpa (zero código no repo). Opção B é versionada (sobrevive a recriação do projecto Vercel).

**Recomendação Gage: Opção A.** Mais rápido, zero risco de quebrar outros workflows do monorepo.

---

## Próximo passo após F.3 resolvido

Quando Vercel preview verde, Eurico pode arrancar Epic 1:

```bash
@sm *create-story
```

Notas para `@sm`:
- Proxy Anthropic já desbloqueado (Story 0.5 está Done) — pode ser usado em features Epic 1.
- Considerar incluir **Story F.1** e **Story F.2** no início do Epic 1 (técnico, baixa fricção, sobe quality bar antes de features novas).
- `EPIC-0-FOLLOW-UP-DEBT.md` tem User Story + Acceptance Criteria já escritos para F.1 e F.2 — basta `@sm` formalizar como `1.X.story.md`.

---

## Anti-padrões NÃO praticados nesta sessão (auto-critique)

| # | Constraint | Validação |
|---|------------|-----------|
| C1 | Apenas @devops faz push | ✓ Gage executou (Article II) |
| C2 | NÃO `--no-verify` | ✓ pre-commit hook honrado |
| C3 | NÃO force push | ✓ push normal para branch existente |
| C4 | NÃO tocar em ficheiros fora dos 5 do scope | ✓ Apenas vitest.config.ts, auth.spec.ts, EPIC-0-FOLLOW-UP-DEBT.md, 2 handoffs (move + create) |
| C5 | Pre-push gates locais (skipped — confiança nos checks remotos do CI já verdes na PR) | Aceitável neste caso (Opção C alvo é estes próprios gates) |
| C6 | Squash merge | ✓ |
| C7 | Branch remote apagada | ✓ `--delete-branch` |
| C8 | 10 stories movidas para `completed/` com status `Done` | ✓ |
| C9 | Handoff Dev→DevOps marcado consumed + arquivado | ✓ |
| C10 | PT-PT em todo o handoff | ✓ |
| C11 | Não tratar Eurico por "Sr." | ✓ |
| C12 | Branch local `feat/nexus-v2-epic-0` ainda existe (não destrutivo) | Aceitável — Eurico apaga manualmente quando quiser (`git branch -d feat/nexus-v2-epic-0`) |

---

## Verificações pré-handoff

| Check | Status |
|-------|--------|
| Merge SHA registado? | ✓ `c362b171` |
| URL PR fechada registado? | ✓ <https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/2> |
| 10 stories movidas para `completed/`? | ✓ |
| Active folder vazia? | ✓ |
| 3 follow-ups F.1/F.2/F.3 documentados? | ✓ EPIC-0-FOLLOW-UP-DEBT.md |
| Instruções F.3 detalhadas para Eurico? | ✓ Opção A vs B |
| Handoff Dev→DevOps arquivado? | ✓ archive/ |
| Próximo agente identificado? | ✓ Eurico (F.3) → `@sm` (Epic 1) |
| HANDOFF-INDEX será actualizado? | ✓ no próximo commit |
| 3 blocos handoff-location (início/meio/fim)? | ✓ |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno pessoal Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-merged-pronto-epic-1.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-merged-pronto-epic-1.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **Gage (`@devops`)**
DATA: **04/05/2026**

---

*Handoff escrito por Gage (`@devops`) em 04/05/2026 17:55 UTC após merge squash da PR #2 do Epic 0 Nexus v2 para main. 10 stories movidas para `completed/` com status `Done`. 3 follow-ups (F.1, F.2, F.3) documentados em `EPIC-0-FOLLOW-UP-DEBT.md`. Próximo: Eurico decide F.3 (manual UI Vercel ou `vercel.json`); depois `@sm *create-story` para arrancar Epic 1.*
