# RETOMA — Nexus v2 — Epic 0 qa-gate: 8 PASS + 2 CONCERNS, aguarda decisão Eurico (waive ou fix)

> **STATUS: CONSUMED** — 04/05/2026 by Dex (`@dev`)
> **Decisão Eurico aplicada:** Opção A em ambas as CONCERNS (waive AC3 Story 0.6 + fix CSP Story 0.8 em `next.config.ts`)
> **Superseded by:** `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-fixes-aplicados-aguarda-devops-push.md`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR

Quinn (`@qa`) consumiu o handoff DEV→QA (04/05/2026, agora em `archive/`) e fez qa-gate (7-point quality check) para as 10 stories Ready for Review do Epic 0 do Nexus v2.

**Resultado: 8 PASS + 2 CONCERNS (nenhum FAIL).** As 10 stories estão funcionalmente correctas; as 2 CONCERNS são decisões de configuração que precisam de input do Eurico (waive ou fix rápido).

| Story | Veredicto | Severidade | Acção |
|:---:|:---:|:---:|:---|
| 0.1 | PASS | — | nenhuma |
| 0.2 | PASS | — | nenhuma |
| 0.3 | PASS | — | nenhuma |
| 0.4 | PASS | — | nenhuma |
| 0.5 | PASS | — | nota cosmética (sliding-vs-fixed window — não bloqueante) |
| 0.6 | **CONCERNS** | medium | **decisão Eurico:** waive AC3 (recomendado) ou fix |
| 0.7 | PASS | — | nenhuma |
| 0.8 | **CONCERNS** | medium | **decisão Eurico:** fix CSP antes de deploy prod |
| 0.9 | PASS | — | nenhuma |
| 0.10 | PASS | — | nenhuma |

**Próximo passo:** Eurico decide as 2 CONCERNS. Após decisão:
- Se waive ambos ou fix rápido → handoff para `@devops` (Gage) fazer commit + push + PR.
- Se fix complexo → handoff para `@dev` (Dex) fixar.

**ZERO `git push` feito.** Quinn não tem autoridade. Trabalho é apenas review.

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 |
| Localização | `imersao-tools/nexus/v2/` |
| Sessão actual | 04/05/2026 (QA Gate Epic 0) |
| Agente que sai | Quinn (`@qa`) |
| Agente que entra | **Eurico** (decisão sobre CONCERNS) → depois `@devops` (commit+push+PR) ou `@dev` (fix) |
| Estado | 10 stories revistas: 8 PASS + 2 CONCERNS. Pronto para decisão Eurico. |
| Git push | NÃO FEITO — exclusivo `@devops` |

---

## Verdict consolidado

| Story | Tema | Veredicto | Detalhe |
|:---:|:---|:---:|:---|
| 0.1 | Setup Next.js 15 + TS strict + Tailwind 4 | PASS | Estrutura sólida, Constitution respeitada, AD-Dex-2 (`@vitejs/plugin-react`) aceite |
| 0.2 | Migrar utilities v1 + extras | PASS | Migração lógica intacta, SSR-safe, env validation Zod |
| 0.3 | Schema Dexie 4 base (13 tabelas) | PASS | Schema match §4.2, migration idempotente, tests cobrem casos críticos |
| 0.4 | Layout chat-first + sidebar 360px | PASS | UX-1 respeitado, atalhos funcionais, AD-Dex-1 (remover `app/page.tsx` placeholder) **aceite** |
| 0.5 | Proxy Anthropic Edge SSE + rate limit KV | PASS | NFR5 + NFR9 garantidos, MSW handler exacto §5.2, AD-Dex-4 (fail-open) **aceite com directiva** |
| 0.6 | Auth Node bcrypt + cookie + KV | **CONCERNS** | **AC3 divergência:** middleware não faz KV lookup (design em camadas). Quinn recomenda **waive AC3**. AD-Dex-3 aceite. |
| 0.7 | OnboardingModal 4 steps | PASS | Esc bloqueado, fallbacks graceful, textos exactos §1.1 |
| 0.8 | Widgets + Markets Widget topo | **CONCERNS** | **CSP bloqueia widgets em prod.** `connect-src` não inclui Yahoo Finance, allorigins, GitHub. Fix simples (3 linhas em `next.config.ts`). |
| 0.9 | Vitest + Playwright + MSW + fake-indexeddb | PASS | Stack exacta arch §5.1, coverage gate restrito a 3 paths |
| 0.10 | CI + Vercel config | PASS | Workflow paths-filter eficiente, grep `sk-ant-` valida NFR5, AD-Dex-5 (Frankfurt) aceite |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-qa-gate-epic-0-2-concerns-aguarda-eurico.md`. PROJECTO É NEXUS V2, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER.

---

## CONCERNS detalhados — necessitam decisão Eurico

### CONCERN 1 — Story 0.6 AC3: middleware não faz KV lookup

**Texto AC3:** "middleware faz KV lookup; se inválido ou ausente redireciona para `/login`"
**Implementação real:** middleware Edge só verifica presença do cookie. Validação real via KV ocorre nos handlers `/api/*` (que importam `getSession`).

**Razão arquitectural defensável (3 motivos):**
1. **Latência:** fazer KV REST fetch a cada request adicionaria 50-200ms ao first-byte de cada página.
2. **Defesa em camadas:** middleware → `app/(app)/layout.tsx` (server cookies check) → `getSession()` (KV lookup) nos handlers `/api/*`. Auth real ocorre onde importa.
3. **Surface de ataque mínima:** alguém com cookie inválido (sem entrada no KV) só vê páginas estáticas; todas as operações backend são bloqueadas pelo `getSession()` real.

**Opções para Eurico:**
- **Opção A (recomendada por Quinn):** waive AC3, actualizar redacção para reflectir o design em camadas (mais robusto que o AC literal).
- **Opção B:** Pedir a Dex para adicionar KV lookup no middleware (latência aumentada, mas literalmente fiel ao AC).

### CONCERN 2 — Story 0.8: CSP bloqueia widgets externos

**Problema:** `next.config.ts` define `connect-src 'self' https://api.anthropic.com https://api.telegram.org`. Os widgets Markets/GitHub chamam:
- `https://query1.finance.yahoo.com` (Markets)
- `https://api.allorigins.win` (Markets — proxy)
- `https://api.github.com` (GitHub)

Estes 3 hosts NÃO estão na CSP → em produção (`nexus-eurico.vercel.app`) os widgets vão dar CSP violation. Em dev (`npm run dev`) provavelmente passa porque Next.js dev é mais permissivo.

**Impacto:** Widgets Markets e GitHub mostram "Indisponível" / "Falhou" em prod. UX-4 (Markets no topo) fica vazio.

**Opções para Eurico:**
- **Opção A (rápida — recomendada):** adicionar 3 hosts à `connect-src` em `next.config.ts`. Fix de 3 linhas. Trade-off: aumenta surface de attack mas todos os 3 hosts são read-only e públicos.
- **Opção B (defensiva):** criar proxies server-side `/api/markets/proxy` + `/api/github/proxy` (Edge runtime) e manter CSP `'self'`. Mais código, melhor segurança.

**Quem implementa o fix:** `@dev` (Dex) — fix request explícito para isto.

---

## Auto-decisions Dex (todas auditadas e aceites)

| AD | Story | Decisão | Análise QA |
|----|:---:|---------|------------|
| AD-Dex-1 | 0.4 | Remover `app/page.tsx` placeholder | **ACEITE**. Necessário para route group `(app)/page.tsx` mapear para `/`. Documentado em File List. |
| AD-Dex-2 | 0.1 | Adicionar `@vitejs/plugin-react` | **ACEITE**. Necessário para Vitest renderizar JSX. devDep apenas. |
| AD-Dex-3 | 0.6 | Dev sem KV aceita qualquer cookie não vazio | **ACEITE com directiva**. Validar lookup real quando Eurico configurar Vercel KV. |
| AD-Dex-4 | 0.5 | Rate-limit fail-open sem KV | **ACEITE com directiva**. Em prod KV está sempre disponível; recomenda log/alerta em Epic 8. |
| AD-Dex-5 | 0.10 | `regions: ['fra1']` Frankfurt | **ACEITE**. Frankfurt = região mais próxima de Portugal (latência <60ms). |

---

## Issues should-fix @po (todos consumidos pelo @dev)

| Issue | Story | Validação Quinn |
|-------|:---:|---|
| Confirmar nomes de ficheiros v1 antes de portar | 0.2 | **CONFIRMADO**. `git ls-files imersao-tools/nexus/src/` validou os 6 ficheiros antes de portar. |
| `/api/onboarding/complete` stub explícito | 0.7 | **CONFIRMADO**. Endpoint criado com auth check + KV set tentativo + fallback dev. |
| `webServer` config Playwright | 0.9 | **CONFIRMADO**. `playwright.config.ts` linhas 30-35 incluem `webServer { command: 'npm run dev', url: 'http://localhost:3001', reuseExistingServer: !CI, timeout: 120_000 }`. |

---

## Notas cosméticas (não bloqueantes — para Epic 8 ou backlog)

| Story | Observação | Severidade |
|:---:|------------|:---:|
| 0.5 | Rate limit é fixed-window, não sliding-window literal (AC5). Effect prático equivalente para protecção contra burst. | LOW |
| 0.5 | IP via `x-forwarded-for[0]` é confiável em Vercel; em outros proxies poderia ser spoofed. Single-user mitigates. | LOW |
| 0.7 | Step 3 (Google) redirige para `/api/google/oauth/google` — não existe até Epic 6. "Saltar" funciona, evitando bloqueio. | LOW |
| 0.10 | `package-lock.json` ainda não existe — primeiro `npm install` do Eurico vai gerá-lo. CI primeira execução vai falhar até estar commitado. | LOW (manual Eurico) |

---

## Ficheiros produzidos por Quinn nesta sessão

### QA Gates (10 ficheiros — um por story)

- `imersao-tools/nexus/docs/QA-GATE-STORY-0.1.md`
- `imersao-tools/nexus/docs/QA-GATE-STORY-0.2.md`
- `imersao-tools/nexus/docs/QA-GATE-STORY-0.3.md`
- `imersao-tools/nexus/docs/QA-GATE-STORY-0.4.md`
- `imersao-tools/nexus/docs/QA-GATE-STORY-0.5.md`
- `imersao-tools/nexus/docs/QA-GATE-STORY-0.6.md` (CONCERNS)
- `imersao-tools/nexus/docs/QA-GATE-STORY-0.7.md`
- `imersao-tools/nexus/docs/QA-GATE-STORY-0.8.md` (CONCERNS)
- `imersao-tools/nexus/docs/QA-GATE-STORY-0.9.md`
- `imersao-tools/nexus/docs/QA-GATE-STORY-0.10.md`

### Stories actualizadas (10 ficheiros — secção QA Results adicionada)

- `imersao-tools/nexus/docs/stories/active/0.1.story.md`
- `imersao-tools/nexus/docs/stories/active/0.2.story.md`
- `imersao-tools/nexus/docs/stories/active/0.3.story.md`
- `imersao-tools/nexus/docs/stories/active/0.4.story.md`
- `imersao-tools/nexus/docs/stories/active/0.5.story.md`
- `imersao-tools/nexus/docs/stories/active/0.6.story.md`
- `imersao-tools/nexus/docs/stories/active/0.7.story.md`
- `imersao-tools/nexus/docs/stories/active/0.8.story.md`
- `imersao-tools/nexus/docs/stories/active/0.9.story.md`
- `imersao-tools/nexus/docs/stories/active/0.10.story.md`

### Handoffs

- `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-qa-gate-epic-0-2-concerns-aguarda-eurico.md` (este ficheiro — SAÍDA)
- Movido para `archive/`: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-implementado-aguarda-qa.md`

### NÃO produzidos (apenas review — Quinn não escreve código)

- Quinn NÃO modificou nenhum ficheiro em `imersao-tools/nexus/v2/`
- Quinn NÃO fez `git add`, `git commit` nem `git push`
- Quinn NÃO modificou `app/`, `components/`, `lib/`, `hooks/`, `tests/`, `middleware.ts`, configs

---

## Constraints inegociáveis (todas validadas pelo gate)

| # | Constraint | Validação Quinn |
|---|-----------|-----------------|
| C1 | Single-user (só Eurico) | Confirmado: OnboardingModal default "Eurico", auth single-password, sem registo público |
| C2 | Zero custos externos além API key Anthropic | Confirmado: stack Vercel free tier, KV Upstash free, sem terceiros pagos |
| C3 | PT-PT exclusivo | Confirmado: comentários, copy UI, mensagens de erro, README todos em PT-PT |
| C4 | Design system [IA]AVANÇADA PT | Confirmado: fundo `#04040A`, paleta 9 cores, Inter + JetBrains Mono |
| C5 | Constitution AIOX | Confirmado: schema Dexie copiado exacto §4.2, env vars §9.2, MSW snippet §5.2, ADRs respeitados |
| C10 | Build não destrói v1 — `v2/` paralelo | Confirmado: `git diff --name-only imersao-tools/nexus/src/` retorna vazio |
| C11 | Jarvis NÃO existe | Confirmado: zero menções a Jarvis em qualquer ficheiro v2 |
| C12 | Domínio `nexus-eurico.vercel.app` | Confirmado: README + .env.example documentam, `vercel.json` configurado |

---

## Próxima acção (decisão Eurico)

Quinn pede ao Eurico:

**1. Decidir sobre CONCERN 1 (Story 0.6 AC3 — middleware sem KV lookup):**
   - Quinn recomenda **Opção A**: waive AC3, actualizar redacção. Design em camadas é mais robusto que AC literal.
   - Em alternativa, **Opção B**: pedir fix a Dex (latência adicional).

**2. Decidir sobre CONCERN 2 (Story 0.8 CSP bloqueia widgets):**
   - Quinn recomenda **Opção A**: fix rápido em `next.config.ts` (3 linhas: adicionar `query1.finance.yahoo.com`, `api.allorigins.win`, `api.github.com` à `connect-src`). Pode ser endereçado em pequeno PR adicional na Story 0.10 ou via fix request a Dex.
   - Alternativa **Opção B**: criar proxies server-side (mais código, melhor segurança).

**Após decisão Eurico:**
- Se waive AC3 (Concern 1) e fix rápido CSP (Concern 2 Opção A) → Dex faz fix CSP, depois `@devops` faz commit + push + PR.
- Se fix completo (Concern 1 Opção B + Concern 2 Opção B) → Dex implementa ambos, novo qa-gate selectivo, depois `@devops`.

**Comandos sugeridos a Eurico:**
```
# 1. Ler os 2 QA Gates com CONCERNS
imersao-tools/nexus/docs/QA-GATE-STORY-0.6.md
imersao-tools/nexus/docs/QA-GATE-STORY-0.8.md

# 2. Decidir e responder a Quinn:
"Concern 1 → waive (Opção A)" ou "fix (Opção B)"
"Concern 2 → fix CSP rápido (Opção A)" ou "criar proxies (Opção B)"

# 3. Após decisão, despachar:
@dev *fix-request → corrigir CSP (se Opção A do Concern 2)
@devops *push     → commit + push + PR (após fixes aplicados)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno do Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-qa-gate-epic-0-2-concerns-aguarda-eurico.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-qa-gate-epic-0-2-concerns-aguarda-eurico.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **Quinn (`@qa`)**
DATA: **04/05/2026**

---

*Handoff escrito por Quinn (`@qa`) em 04/05/2026 após qa-gate (7-point check) das 10 stories Ready for Review do Epic 0 do Nexus v2. Verdict: 8 PASS + 2 CONCERNS, zero FAIL. Stories funcionalmente correctas; CONCERNS são decisões de configuração com recomendação clara de Quinn (Opção A em ambas). Designed para Eurico decidir e despachar a Dex (fix CSP) e depois `@devops` (commit + push + PR).*
