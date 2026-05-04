# RETOMA — Nexus v2 — Epic 0 fixes aplicados (CSP + AC3 waiver), aguarda @devops para commit + push + PR

> **CONSUMED:** true
> **CONSUMED_AT:** 2026-05-04T19:30:00+01:00
> **CONSUMED_BY:** @devops (Gage) — commit + push + PR #2 executados
> **STATUS:** consumed
> **SUPERSEDED_BY:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-pushed-pr-aberta.md`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR

Dex (`@dev`) consumiu o handoff QA→Eurico (04/05/2026, decisão Eurico: **Opção A em ambas as CONCERNS**) e aplicou os 2 fixes em modo execução:

1. **CONCERN 2 (Story 0.8) — CSP fix:** adicionados 3 hosts ao `connect-src` em `imersao-tools/nexus/v2/next.config.ts` linha 39.
2. **CONCERN 1 (Story 0.6) — AC3 waiver:** AC3 reescrito para reflectir o design em camadas (middleware Edge verifica presença do cookie; `getSession()` em `/api/*` Node faz KV lookup real). Waived por Eurico, recomendação Quinn.

QA Gates 0.6 e 0.8 actualizados com decisão final. As 10 stories permanecem **Ready for Review** (não Done) — só `@devops` arquiva após push verde em CI.

**Próximo passo:** `@devops` (Gage) faz commit + push + PR para `main`.

**ZERO `git push` feito.** Dex não tem autoridade — exclusivo `@devops` (Article II).

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 |
| Localização | `imersao-tools/nexus/v2/` |
| Sessão actual | 04/05/2026 (fixes Epic 0 — pós-decisão Eurico) |
| Agente que sai | Dex (`@dev`) |
| Agente que entra | **Gage (`@devops`)** — commit + push + PR para `main` |
| Estado | 2 fixes aplicados (CSP + AC3 waiver) + 2 QA gates actualizados. Pronto para commit + push. |
| Git push | NÃO FEITO — exclusivo `@devops` |

---

## Decisões Eurico consumidas (04/05/2026)

| CONCERN | Story | Decisão Eurico | Acção Dex |
|---------|:---:|----------------|-----------|
| CONCERN 1 — middleware sem KV lookup | 0.6 | **Opção A** (waive AC3, actualizar redacção) | AC3 reescrito em `0.6.story.md` para reflectir design em camadas + nota "Waived 04/05/2026 by Eurico — Opção A (recomendação Quinn)" |
| CONCERN 2 — CSP bloqueia widgets externos | 0.8 | **Opção A** (fix CSP rápido, 3 linhas) | 3 hosts adicionados ao `connect-src` em `next.config.ts` linha 39 |

---

## Diff aplicado — `imersao-tools/nexus/v2/next.config.ts`

### ANTES (linha 39)

```typescript
"connect-src 'self' https://api.anthropic.com https://api.telegram.org",
```

### DEPOIS (linha 39)

```typescript
"connect-src 'self' https://api.anthropic.com https://api.telegram.org https://query1.finance.yahoo.com https://api.allorigins.win https://api.github.com",
```

**Hosts adicionados:**
- `https://query1.finance.yahoo.com` — Markets Widget (cotações 9 mercados)
- `https://api.allorigins.win` — Markets Widget (proxy CORS)
- `https://api.github.com` — GitHub Widget (repos/commits)

**Trade-off:** aumenta surface de attack mas todos os 3 hosts são read-only e públicos. Aceite por Eurico para desbloquear Epic 0.

---

## AC3 reescrito — `imersao-tools/nexus/docs/stories/active/0.6.story.md`

### ANTES

```
- **AC3:** `middleware.ts` (Next.js Middleware) interceta todos os paths excepto `api/auth/`, `_next/`, e `favicon.*`; lê cookie `nexus_session`; faz KV lookup; se inválido ou ausente redireciona para `/login`.
```

### DEPOIS

```
- **AC3 (Waived 04/05/2026 by Eurico — Opção A recomendação Quinn):** `middleware.ts` (Next.js Middleware Edge runtime) interceta todos os paths excepto `api/auth/`, `_next/`, e `favicon.*`; lê cookie `nexus_session` e verifica **apenas presença** (não faz KV lookup — Edge runtime não consegue aceder KV com latência aceitável: KV REST fetch adicionaria 50-200ms ao first-byte de cada request). Se cookie ausente, redireciona para `/login`. **Defesa em camadas:** o KV lookup real ocorre nos handlers `/api/*` via `getSession()` (Node runtime), onde a auth real importa. Surface de ataque mínima: cookie inválido (sem entrada KV) só permite ver páginas estáticas; todas as operações backend (proxy Anthropic, etc.) bloqueiam via `getSession()` real.
```

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-fixes-aplicados-aguarda-devops-push.md`. PROJECTO É NEXUS V2, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER.

---

## QA Gates actualizados

### `imersao-tools/nexus/docs/QA-GATE-STORY-0.6.md`

- Cabeçalho actualizado com `Veredicto inicial: CONCERNS` + `Decisão final: WAIVED (Eurico 04/05/2026)`
- Secção "Decisão" reescrita para reflectir waiver Opção A aceite

### `imersao-tools/nexus/docs/QA-GATE-STORY-0.8.md`

- Cabeçalho actualizado com `Veredicto inicial: CONCERNS` + `Decisão final: PASS após fix (Eurico 04/05/2026)`
- Secção "Decisão" reescrita com diff exacto aplicado (`next.config.ts` linha 39 antes/depois)

---

## Status global das 10 stories Epic 0

| Story | Tema | Status | QA Gate Final |
|:---:|:---|:---:|:---:|
| 0.1 | Setup Next.js 15 + TS strict + Tailwind 4 | Ready for Review | PASS |
| 0.2 | Migrar utilities v1 + extras | Ready for Review | PASS |
| 0.3 | Schema Dexie 4 base (13 tabelas) | Ready for Review | PASS |
| 0.4 | Layout chat-first + sidebar 360px | Ready for Review | PASS |
| 0.5 | Proxy Anthropic Edge SSE + rate limit KV | Ready for Review | PASS |
| 0.6 | Auth Node bcrypt + cookie + KV | Ready for Review | **WAIVED** (AC3 redacção actualizada) |
| 0.7 | OnboardingModal 4 steps | Ready for Review | PASS |
| 0.8 | Widgets + Markets Widget topo | Ready for Review | **PASS após fix CSP** |
| 0.9 | Vitest + Playwright + MSW + fake-indexeddb | Ready for Review | PASS |
| 0.10 | CI + Vercel config | Ready for Review | PASS |

**Decisão Eurico:** stories permanecem **Ready for Review** — só `@devops` marca Done após push verde em CI.

---

## Ficheiros modificados nesta sessão

### Modificados (3 ficheiros)

| Ficheiro | Mudança |
|----------|---------|
| `imersao-tools/nexus/v2/next.config.ts` | Linha 39: adicionados 3 hosts ao `connect-src` |
| `imersao-tools/nexus/docs/stories/active/0.6.story.md` | AC3 reescrito + nota waiver no QA Results |
| `imersao-tools/nexus/docs/QA-GATE-STORY-0.6.md` | Cabeçalho + secção Decisão actualizados (WAIVED) |
| `imersao-tools/nexus/docs/QA-GATE-STORY-0.8.md` | Cabeçalho + secção Decisão actualizados (PASS após fix) |

### Criados (1 ficheiro)

- `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-fixes-aplicados-aguarda-devops-push.md` (este ficheiro)

### Movidos para archive (1 ficheiro)

- `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260504-qa-gate-epic-0-2-concerns-aguarda-eurico.md` (consumido nesta sessão)

### NÃO modificados

- Dex NÃO modificou nenhuma das 10 stories Ready for Review (excepto 0.6 onde reescreveu AC3)
- Dex NÃO fez `git add`, `git commit`, `git push` (exclusivo `@devops`)
- Dex NÃO modificou `app/`, `components/`, `lib/`, `hooks/`, `tests/`, `middleware.ts` (auth flow intacto — só `next.config.ts` mudou)
- Dex NÃO criou ficheiros novos em `imersao-tools/nexus/v2/`

---

## Constraints respeitadas

| # | Constraint | Validação |
|---|-----------|-----------|
| C1 | Single-user (só Eurico) | Mantido — auth single-password |
| C2 | Zero custos externos | Mantido — 3 hosts adicionados são todos free-tier |
| C3 | PT-PT exclusivo | Mantido — comentários e nota waiver em PT-PT |
| C5 | Constitution AIOX (Article II) | Respeitado — Dex não fez push |
| C10 | Build não destrói v1 | Mantido — só `v2/` modificado |

---

## Próxima acção (commit + push + PR)

`@devops` (Gage) deve:

### 1. Validar pré-push localmente (opcional mas recomendado)

```bash
cd imersao-tools/nexus/v2
npm install         # Primeira vez — gera package-lock.json
npm run lint
npm run typecheck
npm test
```

### 2. Stage + commit (preferir commits separados)

**Commit 1 — fix CSP:**
```bash
git add imersao-tools/nexus/v2/next.config.ts
git commit -m "fix(nexus-v2): allow widget hosts in CSP connect-src [Story 0.8]

Add 3 read-only public hosts required by Markets and GitHub widgets:
- query1.finance.yahoo.com (Markets Widget cotacoes)
- api.allorigins.win (Markets Widget proxy CORS)
- api.github.com (GitHub Widget repos/commits)

Without these hosts, widgets fail with CSP violation in production
(nexus-eurico.vercel.app). Trade-off accepted by Eurico: increased
attack surface vs unblocking Epic 0 deploy.

Decision: Eurico 2026-05-04 (Opcao A recomendacao Quinn QA-GATE 0.8).

Constraint: Cannot break v1 (src/ paralelo intacto)
Confidence: high
Scope-risk: narrow"
```

**Commit 2 — AC3 waiver + QA gates update:**
```bash
git add imersao-tools/nexus/docs/stories/active/0.6.story.md \
        imersao-tools/nexus/docs/QA-GATE-STORY-0.6.md \
        imersao-tools/nexus/docs/QA-GATE-STORY-0.8.md
git commit -m "docs(nexus-v2): waive Story 0.6 AC3 + update QA gates 0.6/0.8

Story 0.6 AC3 rewritten to reflect layered defense design:
- middleware (Edge runtime) verifies cookie presence only (no KV lookup
  due to latency: KV REST fetch would add 50-200ms first-byte)
- getSession() in /api/* handlers (Node runtime) does real KV lookup
- attack surface: invalid cookie sees only static pages; backend ops
  blocked by getSession()

QA Gate 0.6 final decision: WAIVED (Eurico 2026-05-04, Opcao A Quinn).
QA Gate 0.8 final decision: PASS after CSP fix (Eurico 2026-05-04).

Constraint: AC3 literal would impose unacceptable latency on Edge
Rejected: Add KV lookup in middleware | latency >50ms per request
Confidence: high
Scope-risk: narrow"
```

**Commit 3 — handoffs:**
```bash
git add imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-fixes-aplicados-aguarda-devops-push.md \
        imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260504-qa-gate-epic-0-2-concerns-aguarda-eurico.md \
        docs/HANDOFF-INDEX.md
git rm imersao-tools/nexus/docs/handoffs/RETOMA-20260504-qa-gate-epic-0-2-concerns-aguarda-eurico.md
git commit -m "chore(handoffs): archive QA→Eurico handoff + open dev→devops handoff for Epic 0 push"
```

### 3. Push + PR

```bash
git push origin <branch>
gh pr create --title "feat(nexus-v2): Epic 0 — 10 stories Ready for Review (8 PASS + 2 fixes aplicados)" \
  --body "$(cat <<'EOF'
## Summary

Epic 0 do Nexus v2: 10 stories implementadas em modo YOLO, validadas com 7-point QA gate (8 PASS + 2 CONCERNS), 2 CONCERNS resolvidas em modo execução por decisão Eurico (Opção A em ambas, recomendação Quinn).

## Fixes aplicados

- **Story 0.8 CSP fix** — adicionados 3 hosts a `next.config.ts` connect-src (Yahoo Finance, allorigins, GitHub API) para desbloquear widgets em prod
- **Story 0.6 AC3 waiver** — AC3 reescrito para reflectir design em camadas (middleware Edge sem KV lookup; `getSession()` em /api/* faz KV lookup real)

## Test plan

- [ ] CI passa em `nexus-v2` (lint + typecheck + Vitest + Playwright)
- [ ] Vercel preview deploy verde em `nexus-eurico.vercel.app`
- [ ] Markets Widget carrega cotações em prod (sem CSP violation)
- [ ] GitHub Widget carrega repos em prod (sem CSP violation)
- [ ] Login flow funciona (cookie + middleware redirect)
- [ ] V1 (`src/`) intocado — `git diff main -- imersao-tools/nexus/src/` retorna vazio

## Decisões consumidas

- Eurico 2026-05-04: Opção A em ambas as CONCERNS (waive AC3 + fix CSP rápido)
- Quinn QA: 8 PASS + 2 CONCERNS resolvidos
- Article II: push exclusivo @devops (este PR)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 4. Após CI verde + merge

`@devops` deve marcar as 10 stories como **Done** (mover de `active/` para `completed/` ou actualizar status).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno do Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-fixes-aplicados-aguarda-devops-push.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-fixes-aplicados-aguarda-devops-push.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **Dex (`@dev`)**
DATA: **04/05/2026**

---

*Handoff escrito por Dex (`@dev`) em 04/05/2026 após aplicar fixes das 2 CONCERNS do Epic 0 (decisão Eurico: Opção A em ambas, recomendação Quinn). Trabalho desta sessão: 1 fix CSP em `next.config.ts` (3 hosts adicionados ao connect-src) + reescrita AC3 da Story 0.6 + actualização dos 2 QA gates (0.6 WAIVED, 0.8 PASS após fix). Próximo: `@devops` (Gage) faz commit + push + PR para `main`. Stories permanecem Ready for Review até CI verde.*
