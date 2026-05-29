# RETOMA — Story 1.10 PO Validation: 4 DECISIONS resolvidas, aguarda escrita do relatório PO-VALIDATION + apply de 5 fixes pelo @sm

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 09/05/2026
**Autor:** Pax (@po) — sessão interrompida pelo Eurico para mudar de terminal
**Para:** Pax (@po) — terminal seguinte (continuar onde parou)
**Acção esperada:** Escrever `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.10.md` com o conteúdo abaixo + comunicar veredicto ao Eurico

---

## TL;DR

@po (Pax) estava a validar Story 1.10 (`*validate-story-draft 1.10`) — a última story do Epic 1 (10/10). Já fez **toda a análise canónica** (PRD + Architecture) e **resolveu as 4 DECISIONS-NEEDED** que @sm tinha levantado. Estava prestes a escrever o relatório `PO-VALIDATION-STORY-1.10.md` quando o Eurico interrompeu para mudar de terminal.

**Veredicto pré-determinado:** **GO conditional → GO após @sm aplicar 5 fixes triviais**. Implementation Readiness Score: **8/10**. Confidence: **High** (todos os fixes fundados em fontes canónicas, zero decisões arbitrárias).

| Item | Valor |
|------|-------|
| Story | `1.10` |
| Ficheiro story | `imersao-tools/nexus/docs/stories/active/1.10.story.md` |
| Status story | Draft (mantém-se até @sm aplicar fixes) |
| Relatório a escrever | `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.10.md` (NÃO foi escrito ainda) |
| Bloqueia | Epic 2 arranque |
| Epic 1 progresso | 9/10 Done + 1 Draft em validação |

---

## Contexto da sessão interrompida

1. @sm criou Draft de 1.10 com 4 `[DECISION-NEEDED]` (D1-D4) deixados explicitamente para @po resolver — ver handoff de entrada `RETOMA-20260508-story-1.10-drafted-aguarda-po-validate.md` (movido para archive)
2. @po leu PRD-NEXUS-V2.md, architecture-v2.md, story 1.10 e validate-next-story.md task
3. @po cross-checked claims do draft → encontrou 2 omissões importantes (caminho fixture diverge da architecture; threshold 85% canónico não citado)
4. @po preparou relatório completo PO-VALIDATION-STORY-1.10.md
5. **Eurico interrompeu Write antes do ficheiro ser escrito** + mandou criar este handoff para mudar de terminal

---

## DECISÕES @po (já tomadas, fundamentadas em fontes canónicas)

### D1 — Mock vs API real → **Opção C (híbrida)** [RESOLVIDO]

**Decisão:** MSW para os 50 prompts em CI + subset opcional de **5 prompts canónicos** com tag `@real-api` para validação manual em staging.

**Fundamentação canónica:**
- `architecture-v2.md` §5.2 (linhas 332-370): MSW handlers Anthropic já definem **resposta determinística** para o prompt canónico AC1 Epic 1 (`"amanhã reunião 15h, paguei €78,70 supermercado"`) — 2 tool_use blocks
- `architecture-v2.md` §5.4 linha 384: `"E2E Playwright corre apenas no GitHub Actions pre-merge"` — sem referência a `ANTHROPIC_API_KEY` em CI
- `architecture-v2.md` §5.3 linha 378: fixture `tests/fixtures/prompts-pt-pt.json` é **a baseline para medir intent accuracy** — implica MSW (sem stochasticity)

### D2 — Pass rate threshold → **>= 43/50 (86%)** [RESOLVIDO via PRD]

**Decisão:** Pass rate threshold = **`>= 43/50` (>= 86%)** com **zero falhas** nos prompts canónicos `ac1-epic1`, `ac2-epic1`, `ac4-epic1`.

**Fundamentação canónica:**
- `PRD-NEXUS-V2.md` §10 linha 431 — Quality gates Epic 1: `"benchmark intent accuracy >= 85% (não 90% como Jarvis — aceita tolerância em uso pessoal)"`
- 85% × 50 = 42.5 → arredondamento conservador para inteiro = **43/50 PASS**
- Zero falhas em prompts canónicos é não-negociável (validam directamente AC1, AC2, AC4 do Epic 1 — PRD linhas 424-427)

### D3 — Integração CI → **Opção A (job dedicado bloqueante)** [RESOLVIDO]

**Decisão:** Job dedicado `.github/workflows/e2e-regression.yml` bloqueante no PR para `main`, em paralelo aos jobs lint/typecheck/test/build existentes (que permanecem obrigatórios).

**Fundamentação canónica:**
- `architecture-v2.md` §5.4 linha 384: pre-merge = bloqueante
- `architecture-v2.md` §G4 linha 1191: test scaffold completo já marcado done
- Como D1 = Opção C, o job é determinístico (MSW), portanto pode ser bloqueante sem flakiness

### D4 — Performance budget p95 → **dois targets distintos** [RESOLVIDO]

**Decisão:**

| Ambiente | Target p95 | Justificação |
|----------|------------|---------------|
| **CI (MSW mocks)** | `< 2s` | Sem latência LLM real (inferência operacional — Should-Fix: pedir @architect formalizar em ADR-7) |
| **Staging (real API, subset @real-api)** | `< 6s` | PRD §10 AC5 linha 428 + NFR1 linha 274 |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 5 FIXES OBRIGATÓRIOS para @sm aplicar antes de Status: Approved

| # | Fix | Localização no draft `1.10.story.md` | Acção |
|---|-----|---------------------------------------|-------|
| **F1** | Resolver D1, D2, D3, D4 | Secção Contexto + AC6, AC7, AC8 | Substituir os 4 placeholders `[DECISION-NEEDED]` pelas resoluções acima (com citação canónica) |
| **F2** | Corrigir caminho canónico do fixture | Dev Notes (Ficheiros a criar) + AC1 + AC9 + Task 1.2 | Mudar `tests/e2e/regression/prompts-50.json` → **`tests/fixtures/prompts-pt-pt.json`** (canónico architecture §5.3 linha 378 + §G4 linha 1065) |
| **F3** | Corrigir `quality_gate` (executor != quality_gate constraint) | Executor Assignment YAML | Mudar `quality_gate: "@qa"` → **`quality_gate: "@architect"`** (constraint do validate-next-story.md §1.1 — CRITICAL) |
| **F4** | Adicionar referência canónica ao threshold 85% | AC6 + Contexto | Citar PRD §10 linha 431 (`"benchmark intent accuracy >= 85%"`) como fundamento explícito |
| **F5** | Substituir Sub-task 1.1 | Tasks/Subtasks | Remover `"Confirmar com @po D1, D2"` e adicionar nota: `"D1-D4 resolvidos em PO-VALIDATION-STORY-1.10.md (09/05/2026)"` |

**Estimativa @sm para aplicar:** ~15 min. Após apply → Status: Approved → @qa pode arrancar Task 1.

---

## Relatório PO-VALIDATION-STORY-1.10.md (CONTEÚDO PRONTO PARA WRITE)

O conteúdo completo do relatório (16 secções) ficou redigido na sessão interrompida. Ao retomar, o @po deve **escrever directamente** o ficheiro `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.10.md` com a estrutura abaixo (template para reconstruir):

### Estrutura obrigatória do relatório

1. **Cabeçalho** (data, validador, story, autor, tipo, executor, quality gate)
2. **§ Veredicto Final** — GO conditional / Score 8/10 / Confidence High / Bloqueante para Epic 2: Sim
3. **§1 Resoluções dos 4 DECISIONS-NEEDED** — D1-D4 com fundamentação canónica completa (texto acima)
4. **§2 Template Compliance** — tabela de secções template vs draft (todas OK excepto 4 placeholders)
5. **§2.1 Executor Assignment Validation** — flagar violação `executor == quality_gate` (ambos @qa) → fix F3
6. **§3 File Structure / Source Tree Validation** — flagar divergência do caminho fixture → fix F2
7. **§4 UI/Frontend Completeness** — N/A (E2E test)
8. **§5 AC Satisfaction Assessment** — tabela com 10 ACs, marcar AC6/AC7/AC8 como FIX após D-resolutions
9. **§6 Tasks/Subtasks Sequence** — todas OK; Sub-task 1.1 substituível
10. **§7 CodeRabbit Integration** — N/A (project-level disabled)
11. **§8 Anti-Hallucination** — tabela cross-check claims vs fontes; flagar 2 omissões (caminho + threshold)
12. **§9 Dev Agent Implementation Readiness** — OK após fixes
13. **§10 Lista Consolidada de 5 Fixes Obrigatórios para @sm** — tabela F1-F5 (texto acima)
14. **§11 Should-Fix (não-bloqueante)** — SF1 (@architect ADR-7 para `< 2s` CI), SF2 (sub-paths e2e), SF3 (CodeRabbit skip notice)
15. **§12 Nice-to-Have** — N1 report.html, N2 prompts de regressão de bugs, N3 campo `epic` no fixture
16. **§13 Final Assessment** — tabela com scores por dimensão (TOTAL 8/10)
17. **§14 Próxima Acção** — fluxo `@sm aplica F1-F5 → Status: Approved → @qa *develop 1.10 → @qa *qa-gate 1.10 → @po *close-story 1.10 → Epic 1 fecha`
18. **§ Validation Result** — checkbox `[x] GO conditional` + scores finais

### Onde ir buscar texto exacto

- Resoluções D1-D4: secção acima neste handoff (texto canónico final)
- Lista F1-F5: tabela acima
- Citações exactas: ler PRD-NEXUS-V2.md linhas 421, 428, 431 + architecture-v2.md linhas 27, 332-370, 378, 384, 1065, 1191
- Padrão de relatório existente: `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.1.md` ou `PO-VALIDATION-STORY-1.2.md`

---

## Próxima acção (terminal seguinte)

```
1. @po lê este handoff
2. @po escreve imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.10.md (conteúdo definido nas secções acima)
3. @po comunica ao Eurico: "Relatório escrito. Veredicto GO conditional. 5 fixes triviais para @sm aplicar. Devo invocar @sm agora ou esperas?"
4. Se Eurico OK → invocar @sm com instrução para aplicar F1-F5 no draft + bumpar Status para Approved
5. Após Status: Approved → @qa *develop 1.10 (próximo passo do Story Development Cycle)
```

---

## Riscos / Pontos de atenção

| Risco | Mitigação |
|-------|-----------|
| @po terminal seguinte tentar **redecidir** D1-D4 | Decisões já fundamentadas e canonicamente trazadas — **NÃO REDISCUTIR**. Apenas escrever relatório e comunicar |
| @sm aplicar fixes mas esquecer F3 (quality_gate) | F3 é **CRITICAL** segundo validate-next-story.md §1.1 — bloqueante absoluto. Verificar explicitamente após apply |
| @architect ainda não confirmou formalmente target `< 2s` em CI | Should-Fix SF1, não bloqueante para arrancar Task 1. Pode resolver-se durante implementação |
| `window.__nexusDB` pode não estar exposto em produção | GAP-2 já documentado no draft 1.10 — @qa verifica durante implementação. Não é bloqueante para validação |

---

## Estado actual do Epic 1

| Story | Status |
|-------|--------|
| 1.1 — 1.9 | Done |
| **1.10** | **Draft — aguarda escrita do PO-VALIDATION + apply de F1-F5 pelo @sm** |

**Epic 1: 9/10 Done + 1/10 Draft em validação. Fecha quando 1.10 = Done.**

---

## Ficheiros relevantes (paths absolutos)

| Ficheiro | Tipo |
|----------|------|
| `imersao-tools/nexus/docs/stories/active/1.10.story.md` | Draft a validar (REQUER F1-F5) |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.10.md` | **Não existe ainda — a criar** |
| `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` | Fonte canónica (linhas 421, 428, 431) |
| `imersao-tools/nexus/docs/architecture-v2.md` | Fonte canónica (linhas 27, 332-370, 378, 384, 1065, 1191) |
| `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260508-story-1.10-drafted-aguarda-po-validate.md` | Handoff de entrada (já consumido) |
| `imersao-tools/nexus/docs/PO-VALIDATION-STORY-1.1.md` | Padrão de referência para estrutura |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260509-story-1.10-po-validation-decisions-ready.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@po` (Pax)
DATA: `09/05/2026`
