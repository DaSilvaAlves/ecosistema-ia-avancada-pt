# RETOMA — Story 1.10 Draft criada, aguarda @po validate (última story Epic 1)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 08/05/2026
**Autor:** River (@sm)
**Para:** Pax (@po)
**Acção esperada:** `@po *validate-story-draft 1.10`

---

## TL;DR

Story 1.10 Draft criada em `imersao-tools/nexus/docs/stories/active/1.10.story.md`. Esta é a **última story do Epic 1 (10/10)** — 50 prompts regression test exercitando pipeline completo via UI. O draft está completo em estrutura e contexto mas contém **4 DECISIONS-NEEDED** que @po (em coordenação com @architect quando relevante) deve resolver antes de marcar GO.

| Item | Valor |
|------|-------|
| Story | `1.10` |
| Ficheiro | `imersao-tools/nexus/docs/stories/active/1.10.story.md` |
| Status | Draft |
| Bloqueadas por | 1.1–1.9 (todas Done) |
| Bloqueia | Epic 2 arranque |
| Epic 1 progresso | 9/10 Done + 1 Draft = 10/10 stories criadas |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Decisions-Needed para @po resolver (bloqueantes para GO)

### D1 — Mock vs API real nos testes (AC1 + AC2 + AC3)

**Pergunta:** Os 50 prompts são executados contra API real Anthropic ou contra MSW mocks?

| Opção | Pros | Cons |
|-------|------|------|
| A — API real | Valida qualidade real do LLM + latência real | Custo por run, não-determinismo, requer `ANTHROPIC_API_KEY` em CI |
| B — MSW mocks | Reproduzível, gratuito, determinístico, CI fast | Não valida o modelo LLM |
| C — Híbrida | 50 estruturais com mocks + 5-10 manual com `@real-api` tag | Mais complexo de configurar |

**Recomendação @sm:** Opção C. @po confirma?

---

### D2 — Pass rate threshold para fechar Epic 1 (AC6)

**Pergunta:** Quantos dos 50 devem PASS para a story ser marcada Done e o Epic 1 fechado?

| Opção | Threshold | Nota |
|-------|-----------|------|
| A | >= 48/50 (96%) | Com zero falhas nos prompts `ac1-epic1`, `ac2-epic1`, `ac4-epic1` |
| B | >= 45/50 (90%) | Com zero falhas nos prompts AC canónicos |
| C | 50/50 (100%) | Apenas se todos os prompts usam mocks determinísticos |

**Referência PRD:** AC5 Epic 1 define `p95 < 6s` mas não define threshold de pass rate explícito. **@po decide.**

---

### D3 — Integração CI (AC8)

**Pergunta:** Como integrar o job de regressão no CI?

| Opção | Descrição |
|-------|-----------|
| A | Job dedicado `e2e-regression.yml` bloqueante no PR |
| B | Job `workflow_dispatch` opcional (corre manualmente antes de fechar Epic) |
| C | Integrado no job CI existente com flag `E2E_REGRESSION=true` |

**Nota:** O pipeline existente (lint + typecheck + test + build) continua obrigatório independente desta decisão.

---

### D4 — Performance budget p95 (AC7)

**Pergunta:** O budget de `< 6s` (PRD AC5) aplica-se em CI com mocks ou apenas em staging com API real?

- Em CI com mocks: p95 esperado < 500ms (sem latência LLM real)
- Em staging com API real: PRD define `< 6s`
- **@architect deve confirmar** se o budget de 6s é válido apenas para ambiente real ou se um target distinto se aplica a CI

---

## GAPs identificados

| GAP | Descrição | Responsável |
|-----|-----------|------------|
| GAP-1 | Os 50 prompts específicos não estão no PRD — apenas a contagem ("50 prompts PT-PT"). @qa deve derivar a lista a partir das categorias do AC2 + prompts canónicos AC1/AC2/AC4 | @qa (após D1 confirmado) |
| GAP-2 | `window.__nexusDB` pode não estar exposto em `app/layout.tsx` — verificar e expor em ambiente non-production para `page.evaluate()` Playwright funcionar | @dev (durante implementação) |

---

## O que foi feito nesta sessão (@sm)

1. Lidas fontes canónicas: handoff de entrada, PRD §10 linha 421, Architecture §8, Front-end Spec §1.2 Flow 2, Stories 1.1–1.9 todas Done
2. Confirmado que PRD §10 linha 421 define o scope: `"1.10 Conjunto manual de 50 prompts PT-PT para regression testing"` — spec existe no PRD
3. Confirmado que os 50 prompts específicos **não constam** em nenhuma fonte canónica — apenas a contagem e o objectivo genérico (GAP-1)
4. Draft criado com 10 AC, 8 Tasks, Dev Notes completas, Testing Strategy, 4 DECISIONS-NEEDED documentados
5. Handoff de entrada movido para `archive/`
6. Este handoff de saída criado + INDEX actualizado

---

## Próxima acção

```
@po *validate-story-draft 1.10
```

Pax (@po) deve:
1. Ler `imersao-tools/nexus/docs/stories/active/1.10.story.md`
2. Resolver D1, D2, D3, D4 (ou consultar @architect para D4)
3. Completar os campos `[DECISION-NEEDED]` directamente na story
4. Executar o po-master-checklist
5. Emitir GO (>= 7/10) ou NO-GO (com lista de fixes)

---

## Estado actual do Epic 1

| Story | Status |
|-------|--------|
| 1.1 | Done |
| 1.2 | Done |
| 1.3 | Done |
| 1.4 | Done |
| 1.5 | Done |
| 1.6 | Done |
| 1.7 | Done |
| 1.8 | Done |
| 1.9 | Done |
| **1.10** | **Draft — aguarda @po validate** |

**Epic 1: 9/10 Done + 1/10 Draft. Fecha quando 1.10 = Done.**

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.10-drafted-aguarda-po-validate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@sm` (River)
DATA: `08/05/2026`
