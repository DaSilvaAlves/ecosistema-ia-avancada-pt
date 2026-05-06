# QA Gate — Story 1.3 (Tool Registry com Zod)

**Story:** `imersao-tools/nexus/docs/stories/active/1.3.story.md`
**Reviewed By:** Quinn (`@qa` Test Architect)
**Review Date:** 06/05/2026
**Branch:** `feat/nexus-v2-story-1.3-tool-registry-zod`
**Commit re-validado:** `e5ee4afb feat(nexus-v2): tool registry with Zod fail-loud for Epic 1 [Story 1.3]`

---

## Verdict

**PASS** (high confidence — limpo, scope pequeno, zero regressão, refactor positivo)

**Razão:** 13/13 ACs cumpridos com trace verificável linha-a-linha contra arch §7.2 (canonical). 4 SF do PO endereçados (3 in-line + SF-3 fica como tech debt opcional). Tech debt herdado (CodeRabbit Iter 3 Nitpick #5 da Story 1.2) fechado: `toAnthropicTools` movido para canonical home com fail-loud. Zero CRITICAL/HIGH/MEDIUM. 1 LOW defensável.

---

## Quality Gates Re-corridos pela `@qa` (independente)

| Gate | Comando | Resultado @dev | Resultado @qa Iter 1 | Match? |
|------|---------|---------------|----------------------|:--:|
| Lint | `npm run lint` | PASS (1 warning fora scope) | PASS (1 warning idêntico em `app/api/auth/logout/route.ts:1`) | ✓ |
| Typecheck | `npm run typecheck` | PASS exit 0 | PASS exit 0 | ✓ |
| Unit tests | `npm run test:unit` | 138/138 PASS | **138/138 PASS** Duration 6.54s | ✓ |
| Build | `npm run build` | 10/10 routes | **10/10 routes** | ✓ |
| Coverage tools/registry | `npm run test:coverage` | 100% lines | **100% lines** (100% statements / 100% branches / 93.75% functions) | ✓ |
| Coverage providers/anthropic | `npm run test:coverage` | 95.77% lines | **95.77% lines** (subiu vs Story 1.2 95.63% — refactor positivo) | ✓ |

5/5 quality gates PASS limpo. Zero regressão em tests Story 1.1+1.2 (102 prévios). 36 novos PASS.

---

## 7-Point Quality Check

| # | Check | Verdict | Evidência |
|:--:|------|:--:|-----------|
| 1 | Requirements Traceability | PASS | 13 ACs ↔ 36 tests + tasks. Trace canónico arch §7.2 (lines 565-609) + PRD §10 (line 414) + Story 1.2 Iter 3 (Nitpick A+#5) → ToolDefinition 9 campos → ToolRegistry class → tests Vitest puros |
| 2 | Risk-Based Testing | PASS | Risco principal (schema malformado silently aceito) mitigado por fail-loud (AC5). Tests cobrem 4 casos non-object (z.string, z.array, z.number reais + null defensivo via vi.mock). Estratégia: schemas Zod genuinamente non-object com cast TypeScript em vez de mock que reproduz protocolo (lição Story 1.2 Iter 2 aplicada) |
| 3 | Quality Attributes (NFRs) | PASS | Performance: zero impacto (mesmo `target: 'openApi3'`, sem cache adicionado conforme story spec). Reliability: aumentou — schema malformado apanha cedo via fail-loud. Security: N/A directo (registry é puro, sem rede/I/O); Constitution Article VI cumprido (zero `any`) |
| 4 | Testability | PASS | Singleton com `clear()` exposto para isolation. Helper `toolsToAnthropicShape` exportado pure (statelessness do executor preservada). `defineTool` com Zod runtime validation. `it.each` para parameterização (7 nomes inválidos cobertos vs 4 estimados). `vi.mock` isolado num bloco com `vi.resetModules()` |
| 5 | Test Coverage | PASS | `agent/tools/registry.ts` **100% lines / 100% statements / 100% branches**. `agent/tools/types.ts` 0% (interfaces apenas — esperado). `providers/anthropic.ts` **95.77% lines** (subiu vs 95.63%). 36 tests novos + 102 prévios PASS. Coverage AC11 (>= 80%) cumprido com folga em ambos os scopes |
| 6 | Code Quality | PASS | Lint PASS (1 warning fora scope). Typecheck strict PASS sem `any`. Imports limpos (`zodToJsonSchema` removido de `anthropic.ts`). PT-PT em todas as mensagens de erro (Constitution Article V). Imports absolutos `@/`. JSDoc canónico em todos os exports |
| 7 | Documentation | PASS | JSDoc canónico em todos os exports com `@trace` para arch §7.2. SF-2 comentário in-line (`tools/types.ts` linhas 95-98) documenta desvio deliberado. Story file completa com File List, Dev Agent Record, Change Log, Coverage por ficheiro. Decisões técnicas registadas (re-export pattern, `z.custom` vs `z.function`, mocks strategy) |

7/7 PASS.

---

## AC Trace (13/13)

| AC | Localização | Verificação | Status |
|:--:|-------------|-------------|:--:|
| AC1 | `lib/agent/tools/types.ts:48-57, 100-110` | `ToolDomain` 10 literals; `ToolDefinition` 9 campos (name, description, domain, argsSchema: z.ZodObject<z.ZodRawShape>, resultSchema, requiresPreview, reversible, execute, reverse?); `ExecutionContext` 6 campos com placeholders documentados | ✓ |
| AC2 | `lib/agent/tools/registry.ts:147-202, 208` | Class ToolRegistry com 8 métodos (`register`, `unregister`, `get`, `has`, `all`, `byDomain`, `toAnthropicTools`, `clear`); singleton `toolRegistry` exportado | ✓ |
| AC3 | `lib/agent/tools/registry.ts:150-165` | 3 validações PT-PT: nome vazio, pattern inválido (`/^[a-z][a-z0-9_]*$/`), nome duplicado | ✓ |
| AC4 | `lib/agent/tools/registry.ts:88-112` | `convertToolToAnthropicShape` com `target: 'openApi3'`, retorna `{ name, description, input_schema: { type: 'object', ... } }` | ✓ |
| AC5 | `lib/agent/tools/registry.ts:93-105` | FAIL-LOUD: lança `Error('Tool registry: zodToJsonSchema produziu shape inesperado para tool "${name}" — esperado { type: "object", ... }, recebido: ${JSON.stringify(shape).slice(0, 200)}')` | ✓ |
| AC6 | `lib/agent/tools/registry.ts:132-137` | `defineTool` com Zod runtime via `ToolDefinitionShapeSchema.parse(def)` (8 campos verificados) | ✓ |
| AC7 | `lib/agent/providers/types.ts:23, 81` | `import type { ToolDefinition } from '@/lib/agent/tools/types';` + `export type { ToolDefinition };` retrocompat | ✓ |
| AC8 | `lib/agent/providers/anthropic.ts` (git diff) | `toAnthropicTools` local (linhas 188-205) **removido**; `zodToJsonSchema` import **removido**; `toolsToAnthropicShape` import **adicionado**; uso na linha 222 (era 248). 102/102 tests Story 1.2 continuam PASS | ✓ |
| AC9 | grep `@/lib/agent/tools/registry` | Apenas 2 files importam: o próprio test + `providers/anthropic.ts` (esperado). Zero imports em `app/` ou outros `lib/`. Smoke check: `toolRegistry.all().length === 0` em boot | ✓ |
| AC10 | `tests/unit/agent/tools/registry.test.ts` | **36 tests** distribuídos em 9 describe blocks: empty (5) + register happy (2) + register errors (4) + unregister (2) + byDomain (1) + toAnthropicTools happy (4) + fail-loud (4) + defineTool (6) + isolation (2) + duplicado | ✓ |
| AC11 | Coverage report | `lib/agent/tools/**` aggregate 100% lines (`registry.ts` 100%, `types.ts` 0% interfaces). `providers/anthropic.ts` 95.77% (subiu vs 95.63% — zero regressão) | ✓ |
| AC12 | git diff `lib/db/` | **Zero alterações** em `lib/db/client.ts` ou qualquer ficheiro de schema. Schema 0.3 intacto | ✓ |
| AC13 | Quality gates re-corridos | Lint PASS / Typecheck PASS / test:unit 138/138 PASS / Build 10/10 / Coverage AC11 cumprido | ✓ |

13/13 ACs cumpridos.

---

## Should-Fixes do PO Pax (verified)

| # | Should-Fix | Status | Localização do fix |
|:--:|-----------|:--:|---------------------|
| SF-1 | Confirmar offset exacto da `ToolDefinition` em `providers/types.ts` antes do refactor (linhas 84-88) | ENDEREÇADO ✓ | Story file Task 3.1 anota "linhas 84-88 confirmadas — SF-1 do PO". Refactor cirúrgico via `Edit` tool, sem alteração de imports não relacionados |
| SF-2 | Comentário in-line documentar desvio arch §7.2 (`z.ZodType<TArgs>`) vs aperto Iter 3 (`z.ZodObject<z.ZodRawShape>`) | ENDEREÇADO ✓ | `lib/agent/tools/types.ts:95-98` — comentário SF-2 explícito mencionando arch §7.2 line 570, razão técnica (Anthropic SDK requer object), e referência a SF-3 como tech debt registado |
| SF-3 | Alinhar arch §7.2 retrospectivamente (z.ZodType<TArgs> → z.ZodObject<z.ZodRawShape>) | TECH DEBT REGISTADO | Defensável, documentado in-line. **QA decision:** abrir item de backlog para alinhamento da arch quando @architect tiver bandwidth — não bloqueia Stories 1.4-1.10. Sugiro `@po *backlog-add 1.3 tech-debt low "Alinhar arch §7.2 line 570 (z.ZodType<TArgs>) → z.ZodObject<z.ZodRawShape>"` |
| SF-4 | `z.function()` vs `z.custom<Function>(typeof === 'function')` | ENDEREÇADO ✓ | `lib/agent/tools/registry.ts:64-73` — `z.custom<(...args: unknown[]) => unknown>(...)` em vez de `z.function()` para futureproof (Zod 4 deprecated). Comentário linhas 36-38 explica razão. 4 tests do `defineTool` cobrem branch `execute deve ser função` |

3/4 endereçados in-line, 1/4 (SF-3) registado como tech debt opcional.

---

## Tech Debt da Story 1.2 (CodeRabbit Iter 3) — fechado

| Item | Origem | Status | Localização |
|------|--------|:--:|-------------|
| Nitpick #5 — `toAnthropicTools` fail-loud | CodeRabbit Iter 3 review da Story 1.2 | FECHADO ✓ | `lib/agent/tools/registry.ts:88-112` — função movida para canonical home com `Error` identificando tool culpada e shape recebido (slice 200 chars) |

---

## Estratégia de Testes — Cross-check com lições anteriores

**Lição Story 1.2 Iter 2:** "Mocks devem reflectir o protocolo real, não apenas fazer tests passar" (gravada em memória `feedback_mock_must_reflect_real_protocol.md`).

**Aplicação na Story 1.3:**

| Caso | Estratégia | Razão |
|------|------------|-------|
| AC5 fail-loud com z.string() | Schema Zod genuinamente non-object via cast TypeScript | Testa o `convertToolToAnthropicShape` real, não um mock que reproduz o bug. Se algum dev contornar via cast, o branch defensivo apanha |
| AC5 fail-loud com z.array() | Schema Zod genuinamente non-object via cast TypeScript | Idem |
| AC5 fail-loud com z.number() | Schema Zod genuinamente non-object via cast TypeScript | Idem + verifica mensagem inclui nome da tool e shape recebido |
| AC5 fail-loud com null defensivo | `vi.doMock('zod-to-json-schema')` num bloco isolado com `vi.resetModules()` | Caso defensivo que `zodToJsonSchema` real não produz com schemas válidos — só mock pode forçar |

Lição aplicada correctamente. ✓

---

## Issues por Severidade

| Severidade | Count | Items |
|:--:|:--:|-------|
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 0 | — |
| LOW | 1 | **SF-3** (alinhar arch §7.2 line 570 retrospectivamente) — defensável e documentado in-line; tech debt opcional para Stories futuras |

LOW issue não bloqueia PASS. Defensável via comentário SF-2 in-line.

---

## Coverage Detalhado por Ficheiro

| Ficheiro | Lines | Statements | Branches | Functions |
|----------|:-----:|:----------:|:--------:|:---------:|
| `lib/agent/tools/registry.ts` | **100%** | 100% | 100% | 93.75% |
| `lib/agent/tools/types.ts` | 0% (interfaces apenas) | — | — | — |
| `lib/agent/providers/anthropic.ts` | **95.77%** (era 95.63%) | 95.77% | 85.07% | 100% |
| `lib/agent/providers/factory.ts` | 100% | 100% | 100% | 100% |
| `lib/agent/providers/types.ts` | 0% (interfaces apenas) | — | — | — |
| `lib/agent/run-builder.ts` | 100% | 100% | 100% | 100% |
| `lib/agent/schemas.ts` | 100% | 100% | 100% | 100% |
| `lib/agent/models.ts` | 100% | 100% | 100% | 100% |

Uncovered lines em `providers/anthropic.ts` (121-124, 305, 356-357, 362-363) são paths defensivos pré-existentes da Story 1.2 — Story 1.5 (executor end-to-end) vai exercitar naturalmente. Sem regressão introduzida pela Story 1.3.

---

## Gate Status

**Gate Iter 1: PASS** (limpo, high confidence)

---

## Próximo passo recomendado

```
@devops *push
```

Gage cria PR (sequência operacional):

1. `git push -u origin feat/nexus-v2-story-1.3-tool-registry-zod`
2. `gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --head DaSilvaAlves:feat/nexus-v2-story-1.3-tool-registry-zod --base main --title "feat(nexus-v2): tool registry with Zod fail-loud for Epic 1 [Story 1.3]" --body-file <bodyfile>` (lição Stories 1.1+1.2 — `--repo` explícito + `--body-file` para evitar PowerShell here-string parser issues)
3. CodeRabbit pre-PR review automática — esperado clean dado scope pequeno e SF-2/SF-4 já endereçados in-line. Caso CodeRabbit dispare iteração, voltar a `@dev *qa-loop-fix 1.3`.

**Tech debt opcional (não bloqueador):**
- `@po *backlog-add 1.3 tech-debt low "SF-3: Alinhar arch-v2.md §7.2 line 570 (z.ZodType<TArgs>) → z.ZodObject<z.ZodRawShape>"` — alinhar arch retrospectivamente quando @architect tiver bandwidth

---

— Quinn (`@qa` Guardian), gate limpo, prossegue 🛡️
