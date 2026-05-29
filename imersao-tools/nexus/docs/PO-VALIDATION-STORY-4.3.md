# PO Validation — Story 4.3 (Heatmap calendário por hábito)

**Validador:** Pax (`@po`)
**Data:** 29/05/2026
**Story:** `docs/stories/active/4.3.story.md`
**Epic:** 4 — Hábitos + Metas + Lembretes (2/10 Done; 4.1 schema/DAL + 4.2 CRUD hábitos merged em main `d0e14160`)
**Protocolo:** `*validate-story-draft` (10-point checklist + Executor Assignment + Anti-Hallucination)

---

## Veredicto

**GO — 10/10 — Confidence: High**

A story é implementável tal como está, sem fixes obrigatórios. É o draft mais limpo do Epic 4 até agora por três razões concretas: (1) **internalizou o FIX-1 da Story 4.2** — usa a assinatura real `{ from: string; to: string }` em `getLast6MonthsRange`/`buildHeatmapGrid` (a 4.2 tinha escrito `{ start, end }` por engano); (2) **aplicou `react-component-test-criteria.md` preventivamente** com a contagem de estados por componente registada antes do CodeRabbit (lição 3.6 vs 3.9, R6 do EPIC-4 §10); (3) **trata de raiz o bug mais provável desta feature** — o off-by-one de timezone — exigindo no helper a mesma derivação UTC (`toISOString().slice(0,10)`) com que a 4.2 gravou os logs, e passando `todayISO` por parâmetro para manter o helper puro e determinista ([AUTO-DECISION] A5). Todas as alegações de código foram verificadas no código real (não por suposição). Os scopes negativos (intensidade=4.4, overlay RRULE fora, tools=4.10, Web Push=4.7+) estão explícitos e correctos — zero invenção (Constitution Artigo IV).

Os 3 itens "nice-to-have" abaixo são cosméticos e não bloqueiam nem custam iterações — registo-os por transparência, não como condição.

---

## Resumo dos 10 pontos

| # | Critério | Veredicto | Nota |
|---|----------|-----------|------|
| 1 | Alignment epic/PRD (sem invenção) | PASS | 10 AC traçam a FR26 + AC1 epic; out-of-scope explícito (intensidade 4.4, RRULE overlay fora, tools 4.10, Web Push 4.7+) |
| 2 | AC testáveis | PASS | 10 AC objectivamente verificáveis; AC7 (helper ~100% incl. "30 dias seguidos"=AC1 epic), AC8 (C1-C5), AC9 (integração modal) |
| 3 | Executor Assignment (`separation-of-roles.md`) | PASS | executor `@ux-design-expert` ≠ gate `@dev`; ambos agentes conhecidos; tools `[lint,typecheck,vitest,build]`; consistente com EPIC-4 §5 (UI→ux-expert/dev) |
| 4 | Teste de componente (`react-component-test-criteria.md`) | PASS | `HabitHeatmap` 3 estados (undefined/vazio/conteúdo) → teste obrigatório (C1-C5); `HabitHeatmapModal` 2 estados (fronteira) → integração recomendada. Contagem registada no draft |
| 5 | Dependências satisfeitas | PASS | Repo/hook/tipos/modal-padrão da 4.1/4.2 EXISTEM (verificado em código); `lib/habitos/` correctamente marcado como 1.º ficheiro |
| 6 | `external-contract-identifiers.md` | PASS | Sem tools/identificadores externos; RRULE não interpretada (overlay fora de scope) — verificação preventiva correcta |
| 7 | Design system (`design-system-ia-avancada.md`) | PASS | AC3/AC5 com `#04040A`, glassmorphism, Lime `#39FF14` (concluído), Cyan `#00F5FF` (hoje), Inter+JetBrains Mono; sem nova dependência (CSS grid) |
| 8 | Scope claro + ficheiros corretos | PASS | 6 ficheiros a criar + 2 a modificar (extensão mínima); "NÃO tocar" explícito (repo/hook/schema/Header); paths verificados |
| 9 | Sequência de tasks coerente | PASS | T1/T2 (helper puro + testes PRIMEIRO) → T3/T4 (componente+modal) → T5 (integração mínima) → T6 (testes UI) → T7 (gate). Helper-first correcto |
| 10 | Qualidade/gates definidos | PASS | AC10 lint+typecheck+vitest+CR (NFR18 CRITICAL bloqueia); cobertura NFR17 ~100% helper; imports absolutos; zero `any`; PT-PT |

**Score:** 10 PASS = **10/10**.

---

## Confirmação de dependências (evidência real — não confiei só no texto da story)

| Artefacto que a 4.3 diz consumir | Estado verificado | Evidência |
|----------------------------------|-------------------|-----------|
| `v2/lib/db/repos/habit-logs.ts` — `listHabitLogsByHabit(habitId, range?)` | EXISTE | `habit-logs.ts:50`; comentário `:9-10` _"A Story 4.3 (heatmap) consome `listHabitLogsByHabit` por range de datas"_. Range real = `{ from, to }` — **a 4.3 usa a assinatura certa** (corrigiu o erro da 4.2) |
| `v2/hooks/useHabitLogs.ts` — `useHabitLogs(habitId, range?)` reactivo | EXISTE | `useHabitLogs.ts:17-23` — deps `[habitId, range?.from, range?.to]` (primitivas, não identidade do objecto → chamada inline de `getLast6MonthsRange` no render é segura) |
| `v2/types/db.ts` — `HabitLog { date, value? }` | EXISTE | `db.ts:181-185` — `date: string` (`:184`), `value?: number` (`:185`). A 4.3 plota presença (binário), ignora `value` — correcto (FR27=4.4) |
| `v2/lib/habitos/` | NÃO existe (a criar) | glob vazio — correcto, é o 1.º ficheiro do directório (T1) |
| `v2/components/habitos/HabitFormModal.tsx` (padrão de modal) | EXISTE | `components/habitos/` — padrão de focus trap/`role=dialog`/Escape a replicar no `HabitHeatmapModal` |
| `v2/components/habitos/HabitsList.tsx` | EXISTE | onde se adiciona a prop opcional `onShowHeatmap` (extensão mínima — não altera acções existentes) |
| `v2/app/(app)/habitos/page.tsx` | EXISTE | onde se adiciona estado `heatmapHabit` + render do modal (AC6) |
| `v2/components/ui/FormField.tsx` + `TabStrip.tsx` (4.2) | EXISTEM | reutilizáveis se necessário (não obrigatório nesta story) — correcto |

**Conclusão:** a camada de dados (4.1) e de UI de hábitos (4.2) está realmente entregue. A 4.3 só **lê** via `useHabitLogs`/`listHabitLogsByHabit` e estende a `HabitsList` com **1** callback opcional. Não recria nada. Todas as afirmações de código são exactas.

---

## Pontos fortes que justificam 10/10 (não 8-9)

1. **Off-by-one de timezone resolvido no draft** ([AUTO-DECISION] A5 + R2): é o bug clássico deste tipo de feature. Os logs foram gravados pela 4.2 em UTC (`toISOString().slice(0,10)`); se o heatmap derivasse "hoje" ou os limites do range em hora local, marcaria a célula errada ou excluiria logs no limite. O draft força a mesma derivação UTC e tira `Date.now()` de dentro do helper (recebe `todayISO`). Apanhado antes do `@dev` — exactamente o trabalho do draft.
2. **`react-component-test-criteria.md` aplicado preventivamente**: a contagem (HabitHeatmap=3 estados→obrigatório; Modal=2→recomendado) está na story, não vai ser reaberta como Major pelo CR (lição 3.9).
3. **Helper-first**: T1/T2 entregam `lib/habitos/heatmap.ts` puro + testes ~100% ANTES da UI. Padrão consolidado do Epic 3 (`lib/financas/*Aggregations.ts`).
4. **Scope binário honesto**: a 4.2 garante ≤1 log por `(habitId, date)` → contagem por dia é 0 ou 1 → não há gradiente possível sem métricas. Forçar níveis agora seria inventar dados; A1 deixa `HeatmapDay.completed: boolean` extensível para `level` na 4.4. Correcto.

---

## Nice-to-have (cosméticos — NÃO bloqueiam, NÃO são condição de GO)

- **N1 — Referência de linha:** a Nota do `@sm` cita `types/db.ts:182-187`; o real é `181-185`. Trivial; o `@dev` encontra a interface na mesma.
- **N2 — Asserção de AC7 mais afiada:** AC7 diz que `getLast6MonthsRange` "cobre 26 semanas (175-182 dias conforme alinhamento)". Com 26 colunas alinhadas a segunda e `to === todayISO`, o intervalo `[from, to]` tem **exactamente 182 dias** (26×7) quando `from` é a segunda 25 semanas antes da semana actual. O limite inferior "175" pode confundir o `@dev` no teste de determinismo — recomenda-se afirmar "≈182 dias (26 semanas completas a partir de segunda)" e deixar o teste fixar o valor exacto para um `todayISO` concreto. Detalhe de precisão de teste, não de comportamento.
- **N3 — Cenário de padding no teste:** AC7 já cobre "alinhamento (padding `inRange: false`)". Sugestão (não obrigatória) de escolher um `todayISO` que caia a meio da semana (ex.: quarta) para exercitar padding inicial **e** final num único caso.

---

## Anti-Hallucination Findings

Nenhum. Cada afirmação técnica do draft traça a (a) uma secção do PRD/EPIC-4, (b) uma `[AUTO-DECISION]` documentada, ou (c) uma linha de código verificada. Sem bibliotecas/padrões inventados (heatmap em CSS grid nativo, sem nova dependência). RRULE/overlay esperado-vs-feito explicitamente fora de scope com trace a FR26 (No Invention).

---

## Final Assessment

- **Decisão:** **GO** — Story aprovada para implementação.
- **Implementation Readiness Score:** 10/10
- **Confidence Level:** High
- **Status:** Draft → **Ready**
- **Próximo passo SDC:** `@ux-design-expert *develop 4.3` (executor) com quality gate `@dev` (Dex). Depois: quality gate → `@devops *push` → CodeRabbit (hard-stop §8 = máx 2 iter) → merge manual (Eurico) → `@po *close-story 4.3` → Epic 4 **3/10 Done**.

---

*Validação por Pax (`@po`) em 29/05/2026. Ancorada em `4.3.story.md` v0.1 (River), `EPIC-4.md` §4/§5/§6/§8/§9/§10, `PRD-NEXUS-V2.md` §6.4 (FR26), e verificação directa de `habit-logs.ts`/`useHabitLogs.ts`/`types/db.ts`/`components/habitos/`. Regras aplicadas: `separation-of-roles.md`, `react-component-test-criteria.md`, `external-contract-identifiers.md`, `design-system-ia-avancada.md`.*
