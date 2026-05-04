# RETOMA — Nexus v2 — Epic 0: 10 stories validadas PASS, aguarda @dev (Dex) implementar pela ordem de dependência

**CONSUMED:** true
**CONSUMED_AT:** 2026-05-04
**CONSUMED_BY:** dev (Dex)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR

Pax (`@po`) consumiu o handoff SM→PO (04/05/2026, `RETOMA-20260504-epic-0-stories-draftadas-aguarda-po-validation.md`, agora em `archive/`) e validou as 10 stories Draft do Epic 0 com 10-point story checklist em cada.

**Resultado: 10/10 PASS.** Score médio 8,9/10. **Epic 0 está pronto para implementação.**

Foram produzidas 10 PO-VALIDATION-STORY-0.{N}.md em `imersao-tools/nexus/docs/`. Apenas 1 minor concern resolvido autonomamente: AUTO-DECISION em Story 0.8 (eliminar `MorningBriefingWidget` v1 — não portar para v2, alinhado com UX-4 que substitui pelo Markets Widget no topo da sidebar e UX-2 que cria mensagem pinned no chat em Epic 1).

**ZERO CÓDIGO foi tocado.** Apenas 11 ficheiros novos: 10 PO-VALIDATION + este handoff.

Próximo passo: `@dev` (Dex) implementa Epic 0 começando pela Story 0.1 (bloqueia tudo) → 0.5 (bloqueia Epic 1) → 0.6 (bloqueia 0.7) → restantes em paralelo.

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 |
| Localização | `imersao-tools/nexus/` |
| Sessão actual | 04/05/2026 (PO validation 10× story) |
| Agente que sai | Pax (`@po`) |
| Agente que entra | Dex (`@dev`) — implementar Stories 0.1 → 0.10 |
| Estado | Epic 0 com 10 stories validadas PASS. Pronto para implementação sequencial. |

---

## Verdict consolidado das 10 stories

| Story | Tema | Verdict | Score | Issues |
|-------|------|:---:|:---:|---|
| **0.1** | Setup Next.js 15 + TS strict + Tailwind 4 em `v2/` | **PASS** | 9/10 | 0 critical · 1 nice (Tailwind 4 versão estável) |
| **0.2** | Migrar utilities v1 (themes/useLocalStorage/usePomodoro/format) | **PASS** | 8/10 | 0 critical · 1 should-fix (confirmar nomes v1 antes Task 1) |
| **0.3** | Schema Dexie 4 base (13 tabelas + migrations) | **PASS** | 9/10 | 0 critical · 1 nice (export/import AC opcional) |
| **0.4** | Layout chat-first + sidebar 360px + InputBox sticky | **PASS** | 9/10 | 0 critical · 3 nice (nav `[Conhecimento]`, mock messages, MorningBriefing placeholder) |
| **0.5** | Proxy Anthropic Edge SSE + rate limit KV (BLOQUEIA EPIC 1) | **PASS** | **10/10** | 0 issues |
| **0.6** | Auth Node + bcrypt + cookie HttpOnly + session KV | **PASS** | **10/10** | 0 issues |
| **0.7** | OnboardingModal 4 steps (Web Push/Google/Telegram saltáveis) | **PASS** | 8/10 | 0 critical · 1 should-fix (`/api/onboarding/complete` stub explicit) |
| **0.8** | Portar widgets v1 + Markets Widget topo (UX-4) | **PASS com 1 CONCERN minor** | 8/10 | 0 critical · 1 concern resolvido (eliminar MorningBriefingWidget) |
| **0.9** | Setup Vitest + Playwright + MSW + fake-indexeddb | **PASS** | 9/10 | 0 critical · 1 nice (`webServer` config Playwright) |
| **0.10** | CI GitHub Actions + Vercel deploy `nexus-eurico.vercel.app` | **PASS** | 9/10 | 0 critical · 2 nice (branch protection, CodeRabbit Epic 8) |

**Score médio: 8,9/10. Confidence Level: High em todas.**

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-10-stories-pass-aguarda-dev.md`. PROJECTO É NEXUS, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## Ficheiros produzidos

| Ficheiro | Tipo | Tamanho aprox |
|---------|------|--------------|
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.1.md` | Validation | ~3 KB |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.2.md` | Validation | ~3 KB |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.3.md` | Validation | ~3 KB |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.4.md` | Validation | ~3 KB |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.5.md` | Validation | ~3 KB |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.6.md` | Validation | ~3 KB |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.7.md` | Validation | ~3 KB |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.8.md` | Validation | ~4 KB |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.9.md` | Validation | ~3 KB |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.10.md` | Validation | ~3 KB |
| `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-10-stories-pass-aguarda-dev.md` | Este handoff | ~6 KB |

ZERO ficheiros de código modificados. ZERO ficheiros em `nexus/src/` (v1) tocados. Apenas docs.

---

## AUTO-DECISIONS registadas

### AD-1 — Story 0.8: eliminar MorningBriefingWidget v1

**Contexto:** AC2 da Story 0.8 lista `MorningBriefingWidget` entre os widgets a portar de v1, com nota "pode ser simplificado — será substituído por Morning Briefing do chat em Epic 1". Ambiguidade: portar simplificado vs eliminar.

**Decisão @po (autónoma):** **NÃO portar `MorningBriefingWidget` v1** para v2. Eliminar tal como `BriefingWidget` e `FeedWidget` (PRD §2.1).

**Razão:**
- UX-4 ADR substitui MorningBriefingWidget pelo **Markets Widget** no topo da sidebar
- UX-2 ADR cria nova mensagem `pinned` no chat em Epic 1 (Morning Briefing diferente, gerado pelo agente)
- Manter widget v1 simplificado é overhead sem valor entregue

**Como aplicar:** @sm pode ajustar AC2 da Story 0.8 antes de @dev arrancar (remover `MorningBriefingWidget` da lista, adicionar à lista de eliminados); ou @dev aplica directamente em implementação.

**Cross-impacto:** Anti-padrão "NÃO criar BriefingWidget/FeedWidget em v2" passa a "NÃO criar BriefingWidget/FeedWidget/MorningBriefingWidget em v2".

---

## Ordem de implementação para @dev

Ordem por dependência técnica + criticidade (decisão Eurico no handoff de input):

```
1. Story 0.1  ← PRIMEIRO (bloqueia TUDO)
   ↓
2. Story 0.5  ← BLOQUEIA EPIC 1 (proxy Anthropic seguro é pré-requisito do cérebro)
3. Story 0.6  ← BLOQUEIA 0.7 (auth real precisa de existir antes do onboarding)
   ↓
4-10. Stories 0.2, 0.3, 0.4, 0.7, 0.8, 0.9, 0.10  ← em paralelo (sem bloqueios críticos)
```

**Recomendação @po:** após Story 0.1 done, @dev pode arrancar em paralelo (terminal split):
- Terminal A: Story 0.5 (proxy — alta prioridade segurança)
- Terminal B: Story 0.2 + 0.3 (utilities + Dexie — base para 0.4 e 0.8)
- Terminal C: Story 0.10 (CI scaffold — pode preparar enquanto outros codam)

Após 0.5 e 0.6 done, desbloqueia 0.4 + 0.7 + 0.9. Depois 0.8 (precisa 0.2). Depois validar 0.10 deploy.

---

## Constraints inegociáveis para @dev

| # | Constraint | Origem |
|---|-----------|--------|
| C1 | Single-user (só Eurico) | Directiva 04/05 |
| C2 | Zero custos externos além API key Anthropic | Directiva 04/05 |
| C3 | PT-PT exclusivo | `language-standards.md` |
| C4 | Design system [IA]AVANÇADA PT | `design-system-ia-avancada.md` |
| C5 | Constitution AIOX | `.aiox-core/constitution.md` |
| C10 | Build não destrói v1 — `v2/` paralelo | architecture-v2.md §3 |
| C11 | Jarvis NÃO existe neste projecto | Directiva 04/05 |
| C12 | Domínio `nexus-eurico.vercel.app` | Decidido 04/05 |

---

## Anti-padrões inegociáveis para @dev

| Anti-padrão | Razão |
|-------------|-------|
| Mexer em `src/` v1 | Constitution Article III + C10 (Story 8.10 elimina v1, NÃO esta epic) |
| Apagar widgets órfãos antes Story 0.8 | Pode quebrar imports |
| Inventar features fora do PRD | Constitution Article IV — No Invention |
| Light mode ou cores arbitrárias | C4 |
| Mencionar Jarvis | C11 |
| Push sem `@devops` | Constitution Article II |
| Reabrir ADRs ou UX-ADRs | Decisões finais |
| Inventar tabelas/campos Dexie | Article IV — schema é arch §4.2 e interfaces §6 |
| `NEXT_PUBLIC_ANTHROPIC_API_KEY` | NFR5 — key apenas server-side |
| Edge runtime para auth | ADR-1 — bcrypt exige Node |
| Node runtime para proxy Anthropic | ADR-1 — Edge para latência |
| Jest em vez de Vitest | ADR-4 — Vitest |
| Workbox em vez de SW manual | architecture-v2.md §11 |

---

## Documentos de referência

| Ficheiro | Por quê |
|---------|---------|
| `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | Source of truth 96 FRs + Epic 0 ACs (§10) |
| `imersao-tools/nexus/docs/architecture-v2.md` | ADRs + §3 repo layout + §16 estratégia por Epic + §17 packages |
| `imersao-tools/nexus/docs/front-end-spec-v2.md` | UX-ADRs + §1 user flows + §2 layout + §3 wireframes |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.{1..10}.md` | 10 validations PASS por story |
| `imersao-tools/nexus/docs/stories/active/0.{1..10}.story.md` | 10 stories Draft a implementar |

---

## Checklist para @dev arrancar

Antes de `*develop 0.1`:

- [ ] Ler este handoff (estás a fazê-lo)
- [ ] Ler Story 0.1 (`stories/active/0.1.story.md`)
- [ ] Ler PO-VALIDATION-STORY-0.1.md (1 nice-to-have sobre Tailwind 4 versão)
- [ ] Confirmar pwd (`pwd` deve mostrar root do repo `ecosistema-ia-avancada-pt`)
- [ ] Verificar git branch (não fazer push — `@devops` exclusivo)
- [ ] Marcar Story 0.1 status como `InProgress` no início

---

## Estado git no final desta sessão (PO)

```
Novos (untracked):
  ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.1.md
  ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.2.md
  ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.3.md
  ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.4.md
  ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.5.md
  ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.6.md
  ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.7.md
  ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.8.md
  ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.9.md
  ?? imersao-tools/nexus/docs/PO-VALIDATION-STORY-0.10.md
  ?? imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-10-stories-pass-aguarda-dev.md

Movido para archive:
  imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-stories-draftadas-aguarda-po-validation.md
  → imersao-tools/nexus/docs/handoffs/archive/ (marcado consumed)

INDEX actualizado:
  docs/HANDOFF-INDEX.md  ← Pending novo + Archived novo

Não foi feito commit nem push (push é exclusivo @devops).
Comando para Eurico avançar quando quiser:
  @dev *develop 0.1   (depois 0.5 → 0.6 → restantes paralelo)
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno do Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-10-stories-pass-aguarda-dev.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-10-stories-pass-aguarda-dev.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **Pax (`@po`)**
DATA: **04/05/2026**

---

*Handoff escrito por Pax (`@po`) em 04/05/2026 após validar as 10 stories Draft do Epic 0 com 10-point checklist em cada. Verdict: 10/10 PASS, score médio 8,9/10. Designed para Dex (`@dev`) consumir e implementar Epic 0 pela ordem de dependência. Story 0.1 PRIMEIRO, Story 0.5 e 0.6 logo a seguir, restantes em paralelo.*
