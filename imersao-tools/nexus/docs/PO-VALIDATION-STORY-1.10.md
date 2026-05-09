# PO Validation — Story 1.10 (E2E Regression — 50 prompts PT-PT)

| Campo | Valor |
|-------|-------|
| Data | 09/05/2026 |
| Validador | Pax (@po) |
| Story | `1.10` |
| Ficheiro story | `imersao-tools/nexus/docs/stories/active/1.10.story.md` |
| Autor draft | River (@sm) |
| Tipo | E2E Regression Test (Quality Gate Final do Epic 1) |
| Executor | `@qa` |
| Quality Gate | `@architect` (corrigido — ver Fix F3) |

---

## Veredicto Final

**GO conditional → GO após @sm aplicar 5 fixes triviais.**

| Dimensão | Resultado |
|----------|-----------|
| Decisão | **GO conditional** |
| Implementation Readiness Score | **8/10** |
| Confidence Level | **High** |
| Bloqueante para Epic 2 | **Sim** — 1.10 é a última story do Epic 1; sem ela o Epic 1 não fecha |
| Tempo estimado para @sm aplicar fixes | ~15 min |

Todas as 4 `[DECISION-NEEDED]` que @sm levantou foram resolvidas com fundamentação canónica directa em PRD-NEXUS-V2.md e architecture-v2.md. Zero decisões arbitrárias. Após @sm aplicar F1-F5 (15 min), Status: Approved e @qa pode arrancar Task 1.

---

## §1 Resoluções dos 4 DECISIONS-NEEDED

### D1 — Mock vs API real → **Opção C (híbrida)**

**Decisão:** MSW para os 50 prompts em CI + subset opcional de 5 prompts canónicos com tag `@real-api` para validação manual em staging.

**Fundamentação canónica:**

| Fonte | Linhas | Citação relevante |
|-------|--------|-------------------|
| `architecture-v2.md` §5.2 | 332-370 | Handlers MSW Anthropic já definem resposta determinística para o prompt canónico AC1 do Epic 1 (`"amanhã reunião 15h, paguei €78,70 supermercado"`) — 2 tool_use blocks |
| `architecture-v2.md` §5.4 | 384 | "E2E Playwright corre apenas no GitHub Actions pre-merge" — sem referência a `ANTHROPIC_API_KEY` em CI |
| `architecture-v2.md` §5.3 | 378 | Fixture `tests/fixtures/prompts-pt-pt.json` é a baseline para medir intent accuracy — implica MSW (sem stochasticity) |

**Implicação para AC7 (story):** AC7 deve passar a ler — "Test executa **com MSW determinístico** em CI; subset `@real-api` (5 prompts canónicos) executa manualmente em staging com `ANTHROPIC_API_KEY` real."

### D2 — Pass rate threshold → **>= 43/50 (86%)**

**Decisão:** Pass rate threshold = `>= 43/50` (>= 86%) com **zero falhas** nos prompts canónicos `ac1-epic1`, `ac2-epic1`, `ac4-epic1`.

**Fundamentação canónica:**

| Fonte | Linhas | Citação relevante |
|-------|--------|-------------------|
| `PRD-NEXUS-V2.md` §10 | 431 | "benchmark intent accuracy >= 85% (não 90% como Jarvis — aceita tolerância em uso pessoal)" |
| `PRD-NEXUS-V2.md` §10 | 424-427 | AC1, AC2, AC4 do Epic 1 — definem prompts canónicos cuja falha invalida o Epic |

**Cálculo:** 85% × 50 = 42.5 → arredondamento conservador para inteiro = **43/50 PASS**.

**Zero falhas em prompts canónicos** é não-negociável (validam directamente AC1, AC2, AC4 do Epic 1).

### D3 — Integração CI → **Opção A (job dedicado bloqueante)**

**Decisão:** Job dedicado `.github/workflows/e2e-regression.yml` bloqueante no PR para `main`, em paralelo aos jobs lint/typecheck/test/build existentes (que permanecem obrigatórios).

**Fundamentação canónica:**

| Fonte | Linhas | Citação relevante |
|-------|--------|-------------------|
| `architecture-v2.md` §5.4 | 384 | Pre-merge = bloqueante |
| `architecture-v2.md` §G4 | 1191 | Test scaffold completo já marcado done |

**Justificação operacional:** Como D1 = Opção C, o job em CI é determinístico (MSW), portanto pode ser bloqueante sem flakiness. Subset `@real-api` corre fora do CI (manual em staging).

### D4 — Performance budget p95 → **dois targets distintos**

**Decisão:**

| Ambiente | Target p95 | Justificação |
|----------|------------|---------------|
| **CI (MSW mocks)** | `< 2s` | Sem latência LLM real (inferência operacional — flagado em SF1 para @architect formalizar em ADR-7) |
| **Staging (real API, subset @real-api)** | `< 6s` | `PRD-NEXUS-V2.md` §10 AC5 linha 428 + NFR1 linha 274 |

**Fundamentação canónica:**

| Fonte | Linhas | Citação relevante |
|-------|--------|-------------------|
| `PRD-NEXUS-V2.md` §10 (AC5) | 428 | Performance budget p95 < 6s |
| `PRD-NEXUS-V2.md` NFR1 | 274 | NFR de latência |

---

## §2 Template Compliance

| Secção do template | Presente no draft? | Estado |
|--------------------|---------------------|--------|
| Story header (As a / I want / So that) | Sim | OK |
| Story Context (Why / Scope / Out-of-scope) | Sim | OK — mas contém 4 placeholders `[DECISION-NEEDED]` (resolvidos via F1) |
| Acceptance Criteria | Sim (10 ACs) | OK estrutural; AC6/AC7/AC8 carecem de resolução D1-D4 (Fix F1) |
| Tasks/Subtasks | Sim | OK; Sub-task 1.1 substituível (Fix F5) |
| Dev Notes (Files to create/modify, References) | Sim | OK; caminho fixture errado (Fix F2) |
| Testing Strategy | Sim | OK |
| Executor Assignment YAML | Sim | OK estrutural; `quality_gate` errado (Fix F3) |
| Definition of Done | Sim | OK |
| Status field | Sim — Draft | Mantém-se Draft até F1-F5 aplicados |

**Resultado §2:** Compliance estrutural OK. 4 placeholders + 3 valores específicos a corrigir.

### §2.1 Executor Assignment Validation — VIOLAÇÃO CRITICAL

| Campo YAML | Valor no draft | Esperado | Status |
|------------|----------------|----------|--------|
| `executor` | `@qa` | `@qa` | OK |
| `quality_gate` | `@qa` | `@architect` | **VIOLAÇÃO — `executor == quality_gate`** |

**Constraint violado:** `validate-next-story.md §1.1` (CRITICAL) — `executor` e `quality_gate` **não podem** ser o mesmo agente. Princípio de separação de papéis: quem implementa não pode auto-validar.

**Resolução:** Fix F3 → `quality_gate: "@architect"` (justificável porque a Story 1.10 é o gate final do Epic 1 e o Architect já é o owner do scaffold E2E em §5.4 da architecture).

---

## §3 File Structure / Source Tree Validation

| Ficheiro proposto no draft | Caminho canónico (architecture) | Estado |
|----------------------------|-----------------------------------|--------|
| `tests/e2e/regression/prompts-50.json` | `tests/fixtures/prompts-pt-pt.json` | **DIVERGÊNCIA — Fix F2** |
| `tests/e2e/regression/run.spec.ts` | OK (sub-path e2e/) | OK |
| `tests/e2e/regression/report.html` | OK (artefacto opcional — N1) | OK |
| `.github/workflows/e2e-regression.yml` | OK (workflow dedicado — D3 Opção A) | OK |

**Fundamentação F2:**

| Fonte | Linhas | Citação relevante |
|-------|--------|-------------------|
| `architecture-v2.md` §5.3 | 378 | "Fixture canónico vive em `tests/fixtures/prompts-pt-pt.json`" |
| `architecture-v2.md` §G4 | 1065 | Mesmo path canónico repetido |

**Acção:** Substituir `tests/e2e/regression/prompts-50.json` → `tests/fixtures/prompts-pt-pt.json` em **3 locais** do draft: Dev Notes (Files to create), AC1, AC9 e Task 1.2.

---

## §4 UI/Frontend Completeness

**N/A** — Story 1.10 é E2E test puro, sem componentes UI novos. Reaproveita o `MainLayout` + `ChatComposer` já existentes (Stories 1.6-1.9). Nenhuma mudança visual, nenhum novo componente.

---

## §5 AC Satisfaction Assessment

| AC | Descrição (resumo) | Validável? | Estado | Resolução |
|----|--------------------|------------|--------|-----------|
| AC1 | Fixture com 50 prompts PT-PT em `tests/fixtures/prompts-pt-pt.json` | Sim | **FIX** | F2 (caminho) |
| AC2 | Cada prompt tem `id`, `prompt`, `expected_intent`, `expected_tool_calls` | Sim | OK | — |
| AC3 | 3 prompts canónicos taggeados (`ac1-epic1`, `ac2-epic1`, `ac4-epic1`) | Sim | OK | — |
| AC4 | Test runner executa todos os 50 prompts via Playwright + MSW | Sim | OK | — |
| AC5 | Cada prompt avalia intent classification + tool calls | Sim | OK | — |
| AC6 | Pass rate threshold | Sim | **FIX** | F1 (resolver D2 → >= 43/50) + F4 (citar PRD §10 linha 431) |
| AC7 | Modo execução | Sim | **FIX** | F1 (resolver D1 → MSW em CI + subset `@real-api` staging) |
| AC8 | Integração CI | Sim | **FIX** | F1 (resolver D3 → workflow dedicado bloqueante) |
| AC9 | Report HTML em `tests/e2e/regression/report.html` | Sim | OK | — |
| AC10 | Performance p95 | Sim | **FIX** | F1 (resolver D4 → `< 2s` CI + `< 6s` staging) |

**Resultado §5:** 5/10 ACs OK out-of-the-box. 5/10 ACs ficam OK após @sm aplicar F1+F2+F4 (decisões já tomadas — só apply mecânico).

---

## §6 Tasks/Subtasks Sequence

| Task | Subtasks | Sequência | Estado |
|------|----------|-----------|--------|
| Task 1 — Fixture | 1.1, 1.2, 1.3 | OK (linear) | Sub-task 1.1 substituível (Fix F5) |
| Task 2 — Runner | 2.1, 2.2, 2.3 | OK | OK |
| Task 3 — CI workflow | 3.1, 3.2 | OK | OK (ajusta após F1/D3) |
| Task 4 — Report | 4.1, 4.2 | OK | OK |
| Task 5 — Verificação final | 5.1, 5.2 | OK | OK |

**Sub-task 1.1 actual:** "Confirmar com @po D1, D2."
**Após F5:** "D1-D4 resolvidos em PO-VALIDATION-STORY-1.10.md (09/05/2026)."

Sequência é linear, sem dependências circulares. Estimativa total razoável (~6h dev) para uma E2E suite com 50 prompts + CI workflow.

---

## §7 CodeRabbit Integration

**N/A — project-level disabled.** O Nexus v2 não tem CodeRabbit configurado a nível de repositório (decisão Eurico — handoffs anteriores das Stories 1.5-1.9 documentaram extensivamente as iterações CR e os limites do tooling). Story 1.10 segue a mesma convenção.

**Should-Fix SF3:** adicionar nota explícita na story sobre skip CR (não bloqueante).

---

## §8 Anti-Hallucination Cross-Check

| Claim do draft | Fonte canónica esperada | Match? |
|----------------|---------------------------|--------|
| "50 prompts PT-PT" | `architecture-v2.md` §5.3 (378) + §G4 (1065, 1191) | OK |
| "Intent accuracy benchmark" | `PRD-NEXUS-V2.md` §10 (431) | OK |
| "3 prompts canónicos taggeados" | `architecture-v2.md` §5.3 (378) — refere "AC1/AC2/AC4 Epic 1" | OK |
| "Performance p95" | `PRD-NEXUS-V2.md` §10 AC5 (428) + NFR1 (274) | OK |
| Caminho `tests/e2e/regression/prompts-50.json` | **NÃO consta na architecture** — canónico é `tests/fixtures/prompts-pt-pt.json` | **OMISSÃO 1** |
| Threshold 85% | **NÃO citado no draft** — está em PRD §10 linha 431 | **OMISSÃO 2** |
| MSW determinístico para AC1 Epic 1 | `architecture-v2.md` §5.2 (332-370) | OK (resolvido por D1) |
| Pre-merge bloqueante | `architecture-v2.md` §5.4 (384) | OK (resolvido por D3) |

**Conclusão §8:** 2 omissões (não invenções). Ambas resolvidas por F2 e F4. Zero alucinações detectadas.

---

## §9 Dev Agent (Executor) Implementation Readiness

| Pré-requisito | Estado |
|---------------|--------|
| MSW handlers Anthropic existem | OK (`architecture-v2.md` §5.2 linhas 332-370) |
| Fixture canónico path conhecido | OK após F2 |
| Threshold definido | OK após F1 (D2 → >= 43/50) |
| Targets p95 definidos | OK após F1 (D4 → < 2s CI / < 6s staging) |
| Integração CI definida | OK após F1 (D3 → workflow dedicado bloqueante) |
| Modo execução definido | OK após F1 (D1 → MSW + subset `@real-api`) |
| Quality gate atribuído correctamente | OK após F3 (`@architect`) |
| GAP-2 (`window.__nexusDB`) — bloqueante? | Não — já documentado no draft, @qa verifica em runtime |

**Resultado §9:** Após F1-F5 aplicados, @qa tem todos os inputs necessários para arrancar Task 1 sem ambiguidade.

---

## §10 Lista Consolidada de 5 Fixes Obrigatórios para @sm

| # | Fix | Localização no draft `1.10.story.md` | Acção |
|---|-----|---------------------------------------|-------|
| **F1** | Resolver D1, D2, D3, D4 | Secção Contexto + AC6, AC7, AC8, AC10 | Substituir os 4 placeholders `[DECISION-NEEDED]` pelas resoluções deste relatório (com citação canónica) |
| **F2** | Corrigir caminho canónico do fixture | Dev Notes (Files to create) + AC1 + AC9 + Task 1.2 | Mudar `tests/e2e/regression/prompts-50.json` → **`tests/fixtures/prompts-pt-pt.json`** (canónico architecture §5.3 linha 378 + §G4 linha 1065) |
| **F3** | Corrigir `quality_gate` (CRITICAL — constraint executor != quality_gate) | Executor Assignment YAML | Mudar `quality_gate: "@qa"` → **`quality_gate: "@architect"`** (validate-next-story.md §1.1) |
| **F4** | Adicionar referência canónica ao threshold 85% | AC6 + Contexto | Citar PRD §10 linha 431 (`"benchmark intent accuracy >= 85%"`) como fundamento explícito |
| **F5** | Substituir Sub-task 1.1 | Tasks/Subtasks | Remover `"Confirmar com @po D1, D2"` e adicionar nota: `"D1-D4 resolvidos em PO-VALIDATION-STORY-1.10.md (09/05/2026)"` |

**Estimativa apply:** ~15 min. Após apply → Status: Approved → @qa arranca Task 1.

---

## §11 Should-Fix (não-bloqueante)

| # | Fix | Razão | Owner |
|---|-----|-------|-------|
| **SF1** | Pedir @architect para formalizar target `< 2s` em CI (com MSW) num ADR-7 | Inferência operacional não documentada formalmente; sólida mas merece ADR | @architect (durante implementação ou após Story 1.10 closed) |
| **SF2** | Confirmar sub-paths E2E (`tests/e2e/regression/...` vs `tests/e2e/...`) | Architecture não fixa estrutura interna abaixo de `tests/e2e/` — convenção implícita | @qa (decide durante Task 1) |
| **SF3** | Adicionar nota explícita "CodeRabbit skip — project-level disabled" no story header | Documenta convenção do Nexus v2 para futuro auditing | @sm (pode fazer junto com F1-F5) |

---

## §12 Nice-to-Have

| # | Item | Razão |
|---|------|-------|
| **N1** | Generate `report.html` HTML report Playwright (AC9 já cobre) | Bom DX — accionável durante PR review |
| **N2** | Adicionar prompts de regressão para bugs encontrados nas Stories 1.1-1.9 | Aumenta cobertura histórica do benchmark |
| **N3** | Adicionar campo `epic` no fixture (ex: `epic: "1"`) | Facilita filtragem futura quando Epic 2/3 adicionarem mais prompts |

---

## §13 Final Assessment — Scores por Dimensão

| Dimensão | Score (0-2) | Notas |
|----------|-------------|-------|
| Template Compliance | 2 | Estrutura completa; só apply mecânico de placeholders |
| Source Truth Alignment | 1 | 1 divergência (F2 — caminho fixture); resto canonicamente correcto |
| AC Validability | 2 | Todos os 10 ACs medíveis após F1 |
| Anti-Hallucination | 2 | Zero invenções; 2 omissões resolúveis por F2+F4 |
| Implementation Readiness | 1 | Pronto após F1-F5 (~15 min) — não está pronto agora mas falta trivial |
| **TOTAL** | **8/10** | **GO conditional** |

---

## §14 Próxima Acção

```
1. @sm aplica F1-F5 no draft (~15 min)
2. @sm bumpa Status: Draft → Approved
3. @qa *develop 1.10
4. @qa implementa Tasks 1-5 (estimativa ~6h)
5. @qa pede *qa-gate 1.10 — quality gate executado por @architect (não @qa)
6. @architect valida: 50 prompts PASS >= 43/50 + p95 < 2s CI + workflow CI verde
7. @po *close-story 1.10
8. Epic 1 fecha (10/10 Done) → @pm pode arrancar Epic 2
```

---

## §15 Riscos / Pontos de atenção

| Risco | Mitigação |
|-------|-----------|
| @sm aplicar fixes mas esquecer F3 (quality_gate) | F3 é CRITICAL — bloqueia validação seguinte. Verificar explicitamente após apply |
| @architect ainda não confirmou formalmente target `< 2s` em CI | Should-Fix SF1, não bloqueante para arrancar Task 1 |
| `window.__nexusDB` pode não estar exposto em produção | GAP-2 já documentado no draft 1.10 — @qa verifica durante implementação |
| Subset `@real-api` corre manualmente em staging — esquecimento | Adicionar checklist no Definition of Done para "subset `@real-api` executado em staging antes de fechar story" |

---

## §16 Validation Result

- [x] **GO conditional** — Story 1.10 aprovada para implementação após @sm aplicar F1-F5
- [ ] GO unconditional
- [ ] NO-GO

| Métrica final | Valor |
|---------------|-------|
| Implementation Readiness Score | **8/10** |
| Confidence Level | **High** |
| Decisões resolvidas | **4/4** (D1, D2, D3, D4) |
| Fixes bloqueantes | **5** (F1-F5) |
| Fixes não-bloqueantes (Should-Fix) | 3 (SF1-SF3) |
| Nice-to-have | 3 (N1-N3) |
| Bloqueante para Epic 2 | **Sim** |
| Próxima entidade a actuar | **@sm** (apply F1-F5) |

---

**Validador:** Pax (@po) — Product Owner
**Data:** 09/05/2026
**Fontes canónicas consultadas:**
- `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` (linhas 274, 421, 424-427, 428, 431)
- `imersao-tools/nexus/docs/architecture-v2.md` (linhas 27, 332-370, 378, 384, 1065, 1191)
- `imersao-tools/nexus/docs/stories/active/1.10.story.md`
- `.aiox-core/development/tasks/validate-next-story.md` (constraint §1.1)

— Pax, equilibrando prioridades 🎯
