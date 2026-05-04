# RETOMA — Nexus v2 — Epic 0 stories 0.1-0.10 draftadas, aguarda @po validar cada uma

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR

River (`@sm`) consumiu o handoff PO→SM (04/05/2026, `RETOMA-20260504-po-validation-2x-pass-aguarda-sm-epic-0.md`, agora em `archive/`) e produziu as 10 stories formais do Epic 0 em `imersao-tools/nexus/docs/stories/active/`.

**Nota importante:** stories 0.1-0.7 já existiam de uma sessão anterior (a mesma sessão que criou os documentos PRD/arch/UX). River criou as stories em falta: **0.8, 0.9, 0.10**. O Epic 0 está agora completo com 10 stories todas em status Draft.

**ZERO CÓDIGO foi tocado.** Apenas 3 ficheiros `.story.md` novos.

Próximo passo: `@po` (Pax) valida cada story draft com o 10-point story checklist antes de `@dev` poder implementar qualquer uma.

---

## Identificação

| Campo | Valor |
|-------|-------|
| Projecto | Nexus v2 |
| Localização | `imersao-tools/nexus/` |
| Sessão actual | 04/05/2026 (SM stories) |
| Agente que sai | River (`@sm`) |
| Agente que entra | Pax (`@po`) — validar as 10 stories |
| Estado | 10 stories Draft criadas. Pronto para PO validation story-a-story. |

---

## Stories criadas / verificadas

| Story | Ficheiro | Status | Notas |
|-------|---------|--------|-------|
| 0.1 | `stories/active/0.1.story.md` | Draft | Já existia — Setup Next.js 15 + TypeScript strict + Tailwind 4 em `v2/` |
| 0.2 | `stories/active/0.2.story.md` | Draft | Já existia — Migrar utilities v1 para `v2/lib/` |
| 0.3 | `stories/active/0.3.story.md` | Draft | Já existia — Schema Dexie 4 base |
| 0.4 | `stories/active/0.4.story.md` | Draft | Já existia — Layout chat-first (UX §2 + §3.1) |
| 0.5 | `stories/active/0.5.story.md` | Draft | Já existia — Proxy Anthropic Edge SSE streaming (BLOQUEIA EPIC 1) |
| 0.6 | `stories/active/0.6.story.md` | Draft | Já existia — Auth flow Node (bcrypt + cookie + session KV) |
| 0.7 | `stories/active/0.7.story.md` | Draft | Já existia — OnboardingModal 4 steps |
| 0.8 | `stories/active/0.8.story.md` | Draft | **NOVA (River 04/05)** — Portar widgets v1 com Markets Widget em destaque (UX-4) |
| 0.9 | `stories/active/0.9.story.md` | Draft | **NOVA (River 04/05)** — Setup Vitest + Playwright + MSW + fake-indexeddb |
| 0.10 | `stories/active/0.10.story.md` | Draft | **NOVA (River 04/05)** — CI GitHub Actions + Vercel deploy preview em `nexus-eurico.vercel.app` |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-stories-draftadas-aguarda-po-validation.md`. PROJECTO É NEXUS, LOCALIZAÇÃO COINCIDE. CONSULTAR `.claude/rules/handoff-location.md` SE PRECISO MOVER ALGO.

---

## Dependências entre stories (não reabrir — determinadas por arch §16)

| Story | Bloqueia | Bloqueada por |
|-------|---------|---------------|
| 0.1 | TUDO | nada — primeira |
| 0.2 | 0.4, 0.8 | 0.1 |
| 0.3 | 0.4, 0.7, 0.8 (Dexie) | 0.1 |
| 0.4 | 0.7, 0.8 | 0.1, 0.2, 0.3 |
| 0.5 | **Epic 1 completo** | 0.1 |
| 0.6 | 0.7 | 0.1 |
| 0.7 | — | 0.1, 0.3, 0.4, 0.6 |
| 0.8 | Epic 8 Story 8.10 | 0.1, 0.2 |
| 0.9 | Epic 1 (coverage gate) | 0.1 |
| 0.10 | Epic 1 (deploy pipeline) | 0.1, 0.5, 0.6, 0.9 |

---

## O que @po (Pax) tem de fazer

### Inputs obrigatórios

1. Ler cada story (`0.1.story.md` → `0.10.story.md`)
2. Aplicar **10-point story checklist** a cada uma (task `validate-next-story.md` se existir no AIOX)
3. Verdict por story: **GO** (>= 7/10) ou **NO-GO** (lista de fixes obrigatórios)

### Ordem de validação sugerida

Prioridade = ordem de dependência técnica:

```
1. Story 0.1 (setup — bloqueia tudo)
2. Story 0.5 (proxy Anthropic — bloqueia Epic 1)
3. Story 0.6 (auth — bloqueia 0.7)
4. Stories 0.2, 0.3, 0.4, 0.7, 0.8, 0.9, 0.10 (sem bloqueios críticos entre si)
```

### Após PO validation

```
@po PASS story 0.1 → @dev *develop 0.1
@po PASS story 0.5 → @dev *develop 0.5 (após 0.1 done)
... e assim por diante
Push final → @devops *push (exclusivo)
```

---

## Constraints inegociáveis para @po

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

## Anti-padrões para @dev quando implementar

| Anti-padrão | Razão |
|-------------|-------|
| Mexer em `src/` v1 | Constitution Article III + C10 |
| Apagar widgets órfãos antes Story 0.8 | Pode quebrar imports |
| Inventar features fora do PRD | Constitution Article IV |
| Light mode ou cores arbitrárias | C4 |
| Mencionar Jarvis | C11 |
| Push sem @devops | Constitution Article II |
| Reabrir ADRs ou UX-ADRs | Decisões finais |

---

## Documentos de referência

| Ficheiro | Por quê |
|---------|---------|
| `docs/PRD-NEXUS-V2.md` | Source of truth 96 FRs + Epic 0 ACs (§10) |
| `docs/architecture-v2.md` | ADRs + §3 repo layout + §16 estratégia por Epic + §17 packages |
| `docs/front-end-spec-v2.md` | UX-ADRs + §1 user flows + §2 layout + §3 wireframes |
| `docs/PO-VALIDATION-ARCHITECTURE-V2.md` | Verdict PASS 8,8/10 + 3 issues minor |
| `docs/PO-VALIDATION-FRONT-END-SPEC-V2.md` | Verdict PASS 8,9/10 + 3 issues minor |

---

## Estado git no final desta sessão (SM)

```
Novos (untracked):
  ?? imersao-tools/nexus/docs/stories/active/0.8.story.md
  ?? imersao-tools/nexus/docs/stories/active/0.9.story.md
  ?? imersao-tools/nexus/docs/stories/active/0.10.story.md
  ?? imersao-tools/nexus/docs/handoffs/RETOMA-20260504-epic-0-stories-draftadas-aguarda-po-validation.md

Movido para archive:
  imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-2x-pass-aguarda-sm-epic-0.md
  → imersao-tools/nexus/docs/handoffs/archive/ (marcado consumed)

Não foi feito commit nem push (push é exclusivo @devops).
Comando para Eurico avançar quando quiser:
  @devops *push
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2** (uso interno do Eurico)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260504-epic-0-stories-draftadas-aguarda-po-validation.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260504-epic-0-stories-draftadas-aguarda-po-validation.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: **River (`@sm`)**
DATA: **04/05/2026**

---

## CONSUMED

- consumed: true
- consumed_at: 2026-05-04T00:00:00Z (sessão PO ~late afternoon)
- consumed_by: po (Pax)
- status: consumed
- superseded_by: `imersao-tools/nexus/docs/handoffs/RETOMA-20260504-po-validation-10-stories-pass-aguarda-dev.md`

---

*Handoff escrito por River (`@sm`) em 04/05/2026 após criar stories 0.8, 0.9, 0.10 e verificar existência de 0.1-0.7. Epic 0 completo com 10 stories Draft. Designed para Pax (`@po`) consumir e validar cada story antes de Dex (`@dev`) implementar.*
