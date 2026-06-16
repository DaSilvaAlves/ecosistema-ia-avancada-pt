# Retrospectiva — Epic 5 Nexus v2 (Diário + Brain Dump + Conhecimento)

> **Autor:** Pax (`@po`) | **Data:** 16/06/2026
> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Branch consolidação:** `main` (13 stories merged via PRs #59-#74; closure commit Story 5.13 `d2db59d0`)
> **Período:** 08/06/2026 → 16/06/2026 (UTC+1, Lisboa)
> **Referência de formato:** `retrospectives/EPIC-4-retrospective.md` + `EPIC-3` + `EPIC-2` + `EPIC-1`

---

## 1. Sumário executivo

- **13/13 stories Done** em main (5.1 a 5.13) — Epic 5 fechado 100%. Três sub-módulos completos sobre a fundação 5.1 (schema) + 5.2 (editor Tiptap): Diário (5.3-5.5), Brain Dump (5.6-5.8), Conhecimento (5.9-5.13).
- Cobertura funcional integral: 16 FRs — Diário (FR42-46), Brain Dump (FR47-50), Conhecimento (FR51-57). Os 4 Epic ACs (§6 do `EPIC-5.md`) satisfeitos: AC1 (diário markdown formatação preservada — 5.2/5.3), AC2 (brain dump 200 palavras < 8s — 5.7), AC3 (3 níveis com pesquisa cruzada — 5.9/5.10), AC4 (pesquisa web cria nota com resumo + URL — 5.11/5.12, verificável em produção).
- **Waiver rate final: 0/13 (0%)** — nenhuma story fechou com merge waived. **Iguala o melhor padrão de sempre** (Epic 2 0/10, Epic 4 0/10) e bate o alvo `EPIC-5.md` §8 (0%). Contraste: Epic 3 (1/11), Epic 1 (5/10).
- **Quality gate AIOX PASS first-pass (sem NO-GO de validação) em 13/13 stories** — nenhuma story foi rejeitada na validação `@po` (contraste com a 4.7 do Epic 4, que levou 3 passagens). Os pares executor≠gate respeitaram `separation-of-roles.md` em todas.
- **Quality gate principal do PRD §10 satisfeito antecipadamente pela ADR-3** (Tiptap 2.x, não Lexical). O `[GAP-5.2]` (escolha de editor) estava fechado antes de o epic começar; a 5.2 só integrou o editor já escolhido. Os 5 GAPs (`[GAP-5.1]` a `[GAP-5.5]`) foram todos resolvidos por decisão `@architect` no draft/gate, não por suposição (Constitution Artigo IV).
- **Território novo entregue com sucesso: editor markdown rico (1.ª vez) + 1.º fetch externo de conteúdo arbitrário (pesquisa web).** O editor Tiptap 2 (5.2) passou a ser o componente partilhado dos três módulos. A pesquisa web (5.11) é o 1.º caminho do Nexus que vai buscar conteúdo arbitrário à web — e foi onde se concentrou o risco do epic (ver §5.1).
- **Lição central do epic — o gate de saída do `@architect` correu CodeRabbit com escopo demasiado estreito (Story 5.11) e deixou escapar um Critical de segurança (SSRF/host-header + fuga de cookie de sessão).** O CR CLI local que alimentou o gate de saída v1.0 só inspeccionou o diff *uncommitted*; o CodeRabbit server-side no PR #72 viu o conjunto completo e levantou 1 Critical + 6 Major. A regra `cr-base-main-no-gate-saida` (memória de feedback) nasceu exactamente desta lição — é a acção mais importante desta retrospectiva (A1).
- **Architect Gate de entrada aplicado sistematicamente nas stories de risco** (5.4, 5.7, 5.8, 5.9, 5.11, 5.12, 5.13) — o padrão positivo da 4.8 (§5.6 da retrospectiva Epic 4) tornou-se norma do epic. As decisões `[D-5.x-*]` foram ratificadas no arranque, antes de uma linha de código, evitando o ciclo "implementar com o padrão errado → gate rejeita → re-implementar".
- **Zero débitos de severidade Média/Alta gerados** — mantém o padrão dos Epics 3 e 4. Apenas débitos Baixa novos (REC-SSRF-2 refactor do proxy, OBS-5.13-TZ timezone UTC, OBS-5.13-SCAN `toArray()` single-user, FLAG env Vercel) e os herdados do Epic 3/4 mantidos em backlog por coerência de domínio.
- **Vercel production live** continuamente em `https://imersao.ia.expressia.pt`. AC4 (pesquisa web cria nota) é o único AC do epic que só é plenamente verificável em produção/preview com fetch externo real — mapeado por AC no draft da 5.11 (aplicação da acção A3 do Epic 4).

---

## 2. Métricas concretas

### 2.1 — Stories e iterações CodeRabbit

| Métrica | Valor | Observação |
|---------|-------|------------|
| Total stories | 13 | 5.1 → 5.13 |
| Stories com GO de validação `@po` à 1.ª passagem | **13/13** | Nenhuma story rejeitada na validação (contraste com a 4.7 do Epic 4, 3 passagens) |
| Stories com 0 iterações CR no PR | 5 | 5.1, 5.4, 5.6 (gate interno só), 5.8 (Iter 1 nitpick), 5.12 (Iter 1 anti-tautológico) |
| Stories com 1 iteração CR no PR | 6 | 5.2 (1 Major import relativo), 5.3 (Iter 1 F1-F3 + Iter 2 stale), 5.5, 5.7 (input vazio), 5.9 (1 Major error-handling), 5.10 (branch epoch) |
| Stories com 3+ iterações CR/gate | 1 | **5.11** (CodeQL Iter 1 + CR server-side 1 Critical + 6 Major Iter 2 + Major abort Iter 3) |
| Hard-stop max-2-iter respeitado sem autorização | 12/13 | Só a 5.11 ultrapassou 2, por findings de segurança REAIS server-side (Critical SSRF) — escalado e justificado, não waiver |
| Waiver rate ("merge waived") | **0/13 (0%)** | Nenhuma story fechou via waiver — iguala Epic 2 e Epic 4 |

> **Nota sobre "quality gate" vs "CodeRabbit":** o quality gate AIOX (PO Validation / QA Gate Quinn / Architect Gate de entrada+saída Aria / `@dev` gate) é camada distinta das iterações CodeRabbit no PR. Distinção mantida desde a Retrospectiva Epic 1. A particularidade do Epic 5: na Story 5.11 o CodeRabbit server-side (no PR) apanhou um Critical de segurança **depois** de o Architect Gate de saída ter dado PASS v1.0 — porque o CR local do gate só viu o diff uncommitted. É o sinal central da §5.1.

### 2.2 — Distribuição por story (detalhe)

| Story | Executor → Gate | Gate AIOX | Iter CR (PR) | Resultado | Autorização |
|-------|-----------------|-----------|--------------|-----------|-------------|
| 5.1 — Schema diário/brain-dump/conhecimento | `@data-engineer` → `@architect` | PASS (gate + re-confirmação `brain_dumps`) | 0 | Merge limpo | — |
| 5.2 — Editor markdown Tiptap 2 | `@dev` → `@qa` | PASS first-pass | 1 (1 Major import relativo) | Merge limpo | — |
| 5.3 — CRUD diário + mood + heatmap | `@dev` → `@qa` | CONCERNS→RESOLVIDO (QC-5.3-A teste componente) | 1 (F1-F3 Minor) + Iter 2 stale | Merge limpo | — |
| 5.4 — Diário AI estrutura | `@dev` → `@architect` | PASS (gate entrada + saída) | 0 | Merge limpo | — |
| 5.5 — Pesquisa full-text diário | `@dev` → `@qa` | PASS first-pass | 1 | Merge limpo | — |
| 5.6 — Brain Dump UI | `@ux-design-expert` → `@dev` | PASS Iter 2 (G-5.6-1 placeholder) | 0 (gate interno só) | Merge limpo | — |
| 5.7 — Brain Dump AI parser | `@dev` → `@architect` | PASS (gate entrada 5 `[D-5.7-*]` + saída) | 1 (input vazio/whitespace) | Merge limpo | — |
| 5.8 — Brain Dump approval flow | `@dev` → `@architect` | PASS (gate entrada 7 `[D-5.8-*]` + saída) | 1 (Iter 1 commitEdit vazio + 3 nitpicks → Iter 2 APPROVED) | Merge limpo | — |
| 5.9 — CRUD áreas/cadernos/notas | `@dev` → `@architect`/`@qa` | PASS (gate entrada 3 `[D-5.9-*]` ratif.) | 1 (1 Major error-handling `handleSaveNote`) | Merge limpo | — |
| 5.10 — Pesquisa full-text conhecimento | `@dev` → `@qa` | PASS first-pass | 1 (branch epoch negativo) | Merge limpo | — |
| 5.11 — Pesquisa web | `@dev` → `@architect` | PASS-condicionado→re-gate PASS | **3** (CodeQL + 1 Critical SSRF + 6 Major + 1 Major abort) | Merge limpo (findings de segurança reais) | Escalado por Critical server-side |
| 5.12 — Cérebro pesquisa web + cria nota | `@dev` → `@architect` | PASS-CC (gate entrada C1-C5 + 4 `[D-5.12-*]`) | 1 (2 Minor anti-tautológicos em testes) | Merge limpo | — |
| 5.13 — Tools cérebro | `@dev` → `@architect` | PASS-CC (gate entrada 4 `[D-5.13-*]` + saída) | 1 (6 findings; 2 reconciliam AC) | Merge limpo | — |

**Síntese:** 0 waivers em 13 stories. A única story a ultrapassar o hard-stop §8 foi a 5.11, por **findings de segurança reais** descobertos server-side (Critical SSRF + fuga de cookie) — não por nitpicks de teste/doc. Todas as outras 12 fecharam dentro de ≤2 iterações CR. O Architect Gate de entrada (7 das 13 stories) ratificou as decisões `[D-5.x-*]` antes da implementação.

### 2.3 — Velocidade do epic

| Métrica | Valor |
|---------|-------|
| Story 5.1 merged (PR #59 `7171a99f`) | 08/06/2026 20:32 |
| Story 5.13 merged (PR #74 `79626969`) | 16/06/2026 01:19 |
| Closure commit Story 5.13 (`d2db59d0`) | 16/06/2026 01:25 |
| **Duração total** | **~8 dias corridos** |
| Stories/dia (média) | ~1,63 |
| Dia mais denso | 13/06 (5.8 + 5.9 + 5.10 merged — 3 stories) |

> Epic 5 foi mais rápido que o Epic 4 (~8 vs ~9 dias) apesar de ter mais 3 stories (13 vs 10) — o ritmo de ~1,63 stories/dia é o mais alto de qualquer epic até hoje. Razões: a maioria das stories segue padrões já estabelecidos (helper puro + lista/modal fina, herança directa dos Epics 3/4), a ADR-3 fechou o GAP do editor antes de começar, e o Architect Gate de entrada cortou o retrabalho. O atraso relativo concentrou-se na 5.11 (pesquisa web), a única story de território genuinamente novo (fetch externo + segurança).

### 2.4 — Cronologia de merges em main

| Story | PR | Squash commit | Data de merge |
|-------|-----|---------------|---------------|
| 5.1 — Schema | #59 | `7171a99f` | 08/06/2026 |
| 5.2 — Editor markdown | #60 | `094f1f35` | 09/06/2026 |
| 5.3 — CRUD diário + mood + heatmap | #61 | `e0d45ea4` | 09/06/2026 |
| 5.4 — Diário AI estrutura | #62 | `a2eec5cc` | 10/06/2026 |
| 5.5 — Pesquisa full-text diário | #63 | `3ec0664f` | 11/06/2026 |
| 5.6 — Brain Dump UI | #64 | `b3a538e7` | 11/06/2026 |
| 5.7 — Brain Dump AI parser | #66 | `4b69331b` | 12/06/2026 |
| 5.8 — Brain Dump approval flow | #67 | `a7efbd2c` | 13/06/2026 |
| 5.9 — CRUD áreas/cadernos/notas | #70 | `4e19cbb4` | 13/06/2026 |
| 5.10 — Pesquisa full-text conhecimento | #71 | `a2c68164` | 13/06/2026 |
| 5.11 — Pesquisa web | #72 | `22f3b985` | 15/06/2026 |
| 5.12 — Cérebro pesquisa web + cria nota | #73 | `aa385a04` | 15/06/2026 |
| 5.13 — Tools cérebro | #74 | `79626969` | 16/06/2026 |

> A ordem de merge seguiu largamente a ordem numérica (ao contrário do Epic 4, onde a 4.10 mergeou antes do caminho de push). A 5.13 (tools) ficou genuinamente para o fim porque depende dos CRUDs (5.3/5.9) e dos fluxos AI (5.7/5.11) estarem todos disponíveis. PR #65 e #68/#69 não correspondem a stories do epic (#65 foi um `npm audit fix` de Next.js intercalar).

### 2.5 — Evolução da suite de testes

| Marco | Testes (test:unit) | Fonte |
|-------|--------------------|-------|
| Fim Epic 4 (baseline) | 1383/1383 | Retrospectiva Epic 4 |
| Story 5.1 | 1435/1437 | Story 5.1 Change Log (schema + upgrade tests) |
| Story 5.2 | 1447 | Story 5.2 Dev Agent Record (editor, coverage `lib/editor` 100%) |
| Story 5.3 | 1482/1482 | Story 5.3 Change Log v0.6 |
| Story 5.4 | 1524/1524 | Story 5.4 Change Log |
| Story 5.5 | 1563/1563 | Story 5.5 Dev Agent Record |
| Story 5.6 | 1582/1582 | Story 5.6 Change Log v0.3 |
| Story 5.7 | 1627/1627 | Story 5.7 Change Log |
| Story 5.8 | 1664/1664 | Story 5.8 Change Log (pós CR Iter 1) |
| Story 5.9 | 1744/1744 | Story 5.9 QA Results |
| Story 5.10 | 1764/1764 | Story 5.10 Change Log |
| Story 5.11 | 1829/1829 | Story 5.11 Change Log v1.3 (pós SSRF fix) |
| Story 5.12 | 1849/1849 | Story 5.12 Dev Agent Record |
| **Story 5.13 (estado final em main)** | **1896/1896** | Story 5.13 DoD #6 (1849 + 39 v1.1 + 8 CR Iter 1) |

**Delta Epic 5: +513 testes** (1383 → 1896). Crescimento de ~37% na suite ao longo do epic — supera o delta absoluto do Epic 4 (+395, o anterior recorde). Puxado pelos 3 sub-módulos (cada um com helpers puros + componentes de vista), pelos testes de protocolo da pesquisa web (5.11) e pelos 47 testes das 9 tools (5.13). Os testes anti-tautológicos mantêm-se a norma: o teste SSRF da 5.11 (Host malicioso → cookie não exfiltrado → DDG) e os T25/T25b da 5.13 (inspecção de corpo da resposta web) falhariam se o bug regredisse.

### 2.6 — Cobertura

Todas as stories cumpriram NFR17 (≥60% em packages core) e os thresholds AC. Padrão "helper puro testável ~100% + componente/página/tool fina" mantido dos Epics 3/4:
- Story 5.2 — `lib/editor` 100%.
- Story 5.3 — `lib/diario/mood-heatmap.ts` + `mood-scale.ts` 100%.
- Story 5.5 / 5.10 — `lib/diario/pesquisa.ts` reutilizado por `lib/conhecimento/` (helpers puros importados, não duplicados).
- Story 5.11 — `lib/shared/web-search-url.ts` (`isSafeHttpUrl`) + parsers DDG/Anthropic testados.
- Story 5.13 — `lib/agent/tools/journal.ts` + `knowledge.ts` (helpers puros Edge-safe; `lib/agent/tools/**` já na allowlist de coverage desde 5.10).

---

## 3. Loved — o que funcionou bem

### 3.1 — Editor markdown rico (Tiptap 2) introduzido sem reabrir os 5 ADRs base e partilhado pelos 3 módulos

O Epic 5 introduziu o primeiro editor rico do projecto e **nenhum dos 5 ADRs base foi reaberto**. A ADR-3 (Tiptap 2.x, não Lexical) já existia, pelo que o quality gate do PRD §10 ("escolha definitiva de markdown editor") estava **fechado antes de começar**. A 5.2 só decidiu a serialização (`[D-5.2-SERIALIZE]` → `tiptap-markdown@0.8.10`) e entregou `components/ui/MarkdownEditor.tsx` com config restrita (StarterKit + TaskList + TaskItem + Link + Placeholder). Os três consumidores (Diário 5.3, Brain Dump 5.6, Notas 5.9) reutilizaram-no directamente. **Evidência:** `EPIC-5.md` §7 (`[GAP-5.2]` fechado pela ADR-3); Story 5.2 Change Log v0.3.

### 3.2 — Os 5 GAPs arquitecturais resolvidos por decisão rastreável, não por suposição

O `EPIC-5.md` §7 marcou 5 GAPs (`[GAP-5.1]` a `[GAP-5.5]`) para resolução no draft — não preenchidos com palpite. Cada um foi fechado com decisão `@architect`: GAP-5.1 (versão Dexie verificada em código real → `version(5)` aditivo, `[D-BRAINDUMP-STORE]`); GAP-5.2 (editor já decidido pela ADR-3); GAP-5.3 (preview obrigatório reutiliza o preview-then-confirm do Epic 1, `requiresPreview` por chamada); **GAP-5.4 (o crítico — runtime + falha da pesquisa web)** resolvido pela 5.11 (`[D-5.11-RUNTIME]` Node DDG + reutiliza Edge Anthropic + cookie propagation; `[D-5.11-FALLBACK]` erro Anthropic = HTTP200 com body de erro, inspeccionar BODY não `response.ok`); GAP-5.5 (domínio das tools → `[D-5.13-DOMAIN]` Opção A, 2 ficheiros `journal`+`knowledge`, verificado contra o classifier real, não assumido). O precedente D-DOMAIN da 4.10 foi seguido à letra.

### 3.3 — Architect Gate de entrada tornou-se a norma das stories de risco — e funcionou

O padrão positivo da 4.8 (§5.6 da retrospectiva Epic 4 — gate de entrada antes de uma linha de código) **deixou de ser excepção e tornou-se a norma** do Epic 5: 7 das 13 stories tiveram Architect Gate de entrada explícito (5.4, 5.7 com 5 `[D-5.7-*]`, 5.8 com 7 `[D-5.8-*]`, 5.9 com 3 `[D-5.9-*]`, 5.11, 5.12 com C1-C5, 5.13 com 4 `[D-5.13-*]`). Em todas, a Aria ratificou as decisões-âncora no arranque e a `@dev` implementou directamente a abordagem certa. **Evidência:** secções "Architect Gate de Entrada" das stories respectivas. Resultado: ritmo de ~1,63 stories/dia (o mais alto de sempre) apesar de 13 stories e território novo.

### 3.4 — Reutilização de helpers puros entre sub-módulos sem duplicação (5.5 → 5.10)

A pesquisa full-text do diário (5.5) extraiu `lib/diario/pesquisa.ts` com funções genéricas (`extractExcerpt`, `highlightMatches`, etc.). A pesquisa full-text do conhecimento (5.10) **importou directamente** esses helpers em vez de os duplicar — `searchKnowledgeNotes` reutiliza a mesma aritmética de termos. **Evidência:** Story 5.10 Dev Agent Record (R11/AC1 — importação directa sem duplicação). O mesmo padrão de "helper de domínio partilhado" aplicou-se às 9 tools da 5.13 (`searchEntries`/`searchKnowledgeNotes` importados, não reimplementados). Zero código de pesquisa duplicado entre os dois sub-módulos.

### 3.5 — O Brain Dump approval flow (5.8) aplicou `internal-state-contract-gate.md` (acção A1 do Epic 4) e fechou limpo

A 5.8 foi a 1.ª story do Epic 5 a exercitar a regra nascida da lição central do Epic 4 (estado distribuído por camadas). O gate `@architect` de entrada fez a análise de ciclo de vida do estado proposto→aceite/rejeitado→persistido: transacção `rw` única sobre 7 stores all-or-nothing com `updateBrainDump` DENTRO da transacção; IDs de sistema UUID fixos get-or-create idempotente; AC8 schema intocado. O CR Iter 1 apanhou 1 Major real (`commitEdit` de texto vazio) — corrigido na Iter 2 APPROVED, dentro do hard-stop §8. **Evidência:** Story 5.8 Architect Gate de entrada (7 `[D-5.8-*]`) + DoD 12/12. A regra que custou 4 Major à 4.9 evitou que o mesmo padrão de estado distribuído explodisse na 5.8.

### 3.6 — Aplicação efectiva das regras nascidas de epics anteriores

| Regra / acção anterior | Estado no Epic 5 |
|------------------------|------------------|
| **A1 Epic 4 — `internal-state-contract-gate.md`** | Aplicada na 5.8 (approval flow), 5.11 (caminho de falha do SSRF fix, eixo c1/c2/c3), 5.12 (rollback total, proposta carrega NOMES não IDs) e 5.13 (3 eixos de `pesquisar_web_e_criar_nota` verificados contra código real no gate de saída). O padrão de estado distribuído reapareceu 4 vezes e foi tratado em todas. |
| **A3 Epic 3 — `react-component-test-criteria.md`** | Aplicada preventivamente. A vista diário+heatmap (5.3) teve o teste de `JournalEntriesList` exigido pelo gate `@qa` ANTES do CR (QC-5.3-A — exactamente o padrão que custou Iter 2+3 à Story 3.9). O `BrainDumpModal` (5.6, 3 estados) e a UI de aprovação (5.8) também tiveram teste de componente contado no gate. |
| **A4 Epic 3 — `external-contract-identifiers.md`** | Aplicada no draft do epic. Os 9 nomes de tools (5.13) foram validados ASCII no `EPIC-5.md` §5 (nota preventiva — "diario"/"area" sem acento) → a 5.13 não precisou de reconciliação de nomes (vs 3.11). A grafia humana PT-PT vive na camada semântica do LLM. |
| **A1 Epic 1 — `mock-protocol-fidelity.md`** | Aplicada ao parser AI do brain dump (5.7), à estruturação do diário (5.4) e à pesquisa web (5.11/5.13). Os mocks reflectem o shape real da resposta Sonnet/web (`{ results, source }`, `WebSearchResult{title,url,excerpt}`); ≥1 teste falharia se o protocolo divergisse. |
| **A6 Epic 1 — `separation-of-roles.md`** | Aplicada em 13/13 stories. Casos: schema → gate `@architect` (5.1); UI pura → executor `@ux-design-expert`, gate `@dev` (5.6); lógica/cálculo → gate `@qa` (5.5/5.10); AI/parser/pesquisa web/tools (risco) → gate `@architect` (5.4/5.7/5.8/5.11/5.12/5.13). Na 5.11 a Aria fez gates de entrada/saída mas NÃO implementou o SSRF fix (foi o `@dev`) — pôde assinar o re-gate. |
| **A2 Epic 4 — varredura de bug-de-classe nas camadas adjacentes** | Aplicada na 5.11: a falta de allowlist de URL era o mesmo padrão nos dois parsers (`web-search-anthropic.ts` e `web-search-ddg.ts`) → `isSafeHttpUrl` foi aplicado a AMBOS no mesmo ciclo. E na 5.13: o get-or-create distingue "nova" de "existente" para área E caderno (não só um). |
| **A3 Epic 4 — mapa de verificabilidade por AC** | Aplicada na 5.11/5.13: o draft mapeou que `pesquisar_web_e_criar_nota` (fetch real) só é verificável em preview/produção; o resto cobre-se em CI. AC4 do epic explicitamente marcado como verificação manual. |

**O ciclo retrospectiva → regra → aplicação produziu resultados pela 4.ª vez consecutiva** (Epic 2, 3, 4 e agora 5).

---

## 4. Os débitos não-bloqueadores

Nenhum é bloqueador. O Epic 5 gerou apenas débitos Baixa e manteve os herdados por coerência de domínio.

### 4.1 — Herdados (decisões A4/A5 do Epic 4, registadas em `EPIC-5.md` §8) — estado de fecho

| Débito | Decisão Epic 5 | Estado no fecho Epic 5 |
|--------|----------------|------------------------|
| D-4.2-1 (NavLink `/tasks` EN vs rota real `/tarefas` PT) | Absorvível pela 1.ª story que toque o `Header.tsx` | **PAGO** — a 5.3 corrigiu `/journal`→`/diario` E `/tasks`→`/tarefas` no `Header.tsx` (D-4.2-1 absorvido de caminho) |
| D-3.3-1, D-3.4-1, D-3.4-2, D-3.5-1 (finanças) | Mantêm-se em backlog (story técnica de housekeeping) | **EM BACKLOG** — domínio finanças; o Epic 5 não tocou esse código (coerência de domínio mantida) |
| D6 (delete projecto cascata) | Story técnica dedicada, convenção já fixada pela 4.1 | **EM BACKLOG** — o Epic 5 não toca código de projectos/tarefas; candidata a juntar à story de housekeeping de finanças |
| D-4.7-1, D-4.8-1, D-4.8-2 (push/onboarding) | Backlog dedicado ao domínio Epic 4/push | **EM BACKLOG** — o Epic 5 não toca onboarding nem push |
| D7 (fallback intent PT-BR) | Hotfix dedicado via SOP Hotfix Produção (decisão Eurico) | **ABERTO** — ver A5. UX visível na 1.ª interacção em produção; do domínio classifier/Epic 1, não do Epic 5 |

### 4.2 — Novos débitos Baixa do Epic 5

| # | Débito | Severidade | Origem | Recomendação |
|---|--------|-----------|--------|--------------|
| REC-SSRF-2 | Eliminar o fetch HTTP Node→Edge da pesquisa web (invocar a lógica do proxy directamente, sem reenvio de cookie). A Opção C da 5.11 (origin de confiança + allowlist) fecha o SSRF, mas a Opção A (refactor do proxy em helper puro) é o destino arquitectural correcto | Baixa | Story 5.11 `[D-5.11-SSRF-FIX]` | `@architect` + `@dev` — refactor pós-Epic 5; não-bloqueador (o SSRF está fechado por allowlist) |
| FLAG env Vercel | Confirmar se `VERCEL_PROJECT_PRODUCTION_URL` está exposta ao runtime Node de `/api/conhecimento/web-search`. Se não, o fail-safe usa a allowlist de host (`imersao.ia.expressia.pt`) | Baixa | Story 5.11 FLAG `@devops` | `@devops` — confirmação de env, não-bloqueador (allowlist cobre o caso) |
| OBS-5.13-TZ | `toISOString()` UTC no default de data de `criar_entrada_diario` — alinhar com timezone local se o utilizador mudar de fuso | Baixa (advisory) | Story 5.13 gate de saída | Cosmético para PT (UTC+0/+1); housekeeping |
| OBS-5.13-SCAN | Padrão `toArray()`+helper puro nas tools de pesquisa (`pesquisar_diario`/`pesquisar_conhecimento`) — by-design para single-user; reavaliar com índice/paginação só se o Nexus escalar | Baixa (advisory) | Story 5.13 gate de saída | Cross-cutting (todas as tools de pesquisa); reavaliar se multi-utilizador |
| OBS-5.10-A2 | Observação advisory da 5.10 (`extractExcerpt` assinatura `(text, terms[], maxLen)` — passar `terms`, não `query` cru) | Baixa (advisory) | Story 5.10 | Já tratada como convenção; registo |

**Síntese:** 5 débitos Baixa novos, **0 Média/Alta** — mantém o padrão de maturidade dos Epics 3/4. O D-4.2-1 (NavLink), o mais "absorvível", foi pago pela 5.3. O Critical SSRF da 5.11 NÃO é débito — foi resolvido (Opção C) e mergeado; só o refactor ideal (Opção A) fica como REC-SSRF-2. O backlog de manutenção continua com: 4 débitos de finanças (Epic 3), D6 (convenção já fixada, falta a story), 3 de push/onboarding (Epic 4), D7 (hotfix classifier), e os 5 novos Baixa acima.

---

## 5. Learned — lições do epic

### 5.1 — O gate de saída do `@architect` correu CodeRabbit com escopo demasiado estreito: a Story 5.11 e o Critical SSRF (LIÇÃO CENTRAL)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 5.11 (pesquisa web), CodeRabbit server-side no PR #72, 15/06/2026 |
| **Sintoma** | A validação `@po` deu GO 9/10 e o **Architect Gate de saída deu PASS v1.0** com os testes a provar o caminho feliz + fallback. Mesmo assim, o CodeRabbit **server-side** no PR levantou **1 Critical + 6 Major** que o gate de saída deixou passar — incluindo um SSRF/host-header com fuga do cookie de sessão da Eurico. |
| **Causa raiz** | O CR CLI local que alimentou o gate de saída v1.0 corria `coderabbit ... -t uncommitted` — só inspeccionava o diff **uncommitted**, não o conjunto completo dos ficheiros como o CodeRabbit server-side os vê no PR (`--base main`). Findings que vivem na interacção entre ficheiros já committed e novos (o `route.ts` construía `proxyUrl` de `req.nextUrl.origin` e reenviava o cookie) escaparam ao escopo estreito do CR local. O gate de saída validou auth, protocolo de fallback e estrutura — mas não viu o caminho de exfiltração de cookie porque o CR local não o viu. |
| **O Critical** | `web-search/route.ts:175` construía `proxyUrl` a partir de `req.nextUrl.origin` (controlável via `Host` header em Vercel) e reenviava o cookie de sessão nesse fetch. Um atacante que controle o `Host` redirige o fetch interno para um host arbitrário levando o cookie da Eurico — exfiltração de credencial. |
| **Resolução** | `[D-5.11-SSRF-FIX]` (Opção C): origin de confiança fixa (`VERCEL_PROJECT_PRODUCTION_URL` ou allowlist de host), nunca `req.nextUrl.origin` cru; cookie só viaja para a origin validada; fail-safe para DDG (sem cookie) se o host não estiver na allowlist; **proibido** fail-open. `internal-state-contract-gate.md` aplicado ao caminho de falha (eixos c1/c2/c3). Teste anti-tautológico obrigatório (Host malicioso → cookie não exfiltrado → DDG). Re-gate de saída PASS Confidence High após `@dev *apply-qa-fixes`. |
| **Lição** | O gate de saída do `@architect` (e o pre-commit do `@dev`) tem de correr o CodeRabbit com o **mesmo diff que o servidor verá no PR** (`--base main`, diff completo), não só o `-t uncommitted`. Senão findings que vivem na fronteira entre código existente e novo — em especial os de segurança server-side, que são exactamente os mais perigosos — escapam ao gate e explodem no PR, custando iterações (a 5.11 foi a única story do epic a ultrapassar o hard-stop §8). É o complemento da lição §5.1 do Epic 4: lá o ponto cego era a *semântica de estado interno*; aqui é o *escopo do diff que o gate inspecciona*. |
| **Acção** | Ver **A1** (gate de saída e pre-commit correm CodeRabbit `--base main`, não só `-t uncommitted`) — já materializada na memória de feedback `cr-base-main-no-gate-saida`; A1 propõe formalizá-la em `.claude/rules/` |

### 5.2 — Verificação de filesystem do gate pode ter falsos negativos: o `WebSearchSaveModal.test.tsx` "inexistente" (5.11)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 5.11, Architect Gate de saída v1.2 (Glob) vs re-gate v1.3 (Bash), 14-15/06/2026 |
| **Sintoma** | O gate de saída usou `Glob` para verificar a existência de `WebSearchSaveModal.test.tsx` e reportou "o ficheiro NÃO existe" (Constitution Artigo IV — discrepância com o Change Log). O `@dev`, ao tentar criá-lo de raiz, descobriu que **existia** (6 testes, datado 13/06). A premissa do finding 5 estava errada, embora o finding em si (faltavam 3 cenários) fosse legítimo. |
| **Causa raiz** | Limitação de pathing do `Glob` no ambiente (reproduzida no re-gate). A verificação de existência por uma única ferramenta produziu um falso negativo. |
| **Resolução** | O `@dev` registou a discrepância honestamente (Artigo IV — não recriou de raiz, o que apagaria 6 testes válidos; adicionou os 3 cenários em falta). O re-gate confirmou via `Bash` que o ficheiro existia. O finding manteve-se legítimo; só a premissa "inexistente" era falsa. |
| **Lição** | Uma verificação de existência de ficheiro que vai sustentar um veredicto de gate (especialmente "este ficheiro não existe, foi inventado") deve ser confirmada por ≥2 ferramentas (Glob + Bash/Read) antes de se afirmar inexistência. Um falso negativo de Glob quase fez recriar um ficheiro de raiz, apagando testes válidos. O reflexo de honestidade do `@dev` (não recriar, registar a discrepância) evitou o dano. |
| **Acção** | Sem regra nova — memória de processo. Reforça `mandatory-change-log.md` (verificar o estado real antes de afirmar). |

### 5.3 — Reutilizar lógica de proxy Edge a partir de um runtime Node força um fetch HTTP com cookie (5.11)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 5.11, `[D-5.11-RUNTIME]` + `[D-5.11-SSRF-FIX]`, 13-15/06/2026 |
| **Sintoma** | A pesquisa web Anthropic queria reutilizar o proxy Edge já existente (que tem rate-limit KV + `ANTHROPIC_API_KEY`). Mas o endpoint de pesquisa web corre em Node (DDG scraping precisa de Node). Reutilizar o proxy Edge a partir do Node implicou um fetch HTTP same-origin Node→Edge — e para o proxy não devolver 401, esse fetch reenvia o cookie de sessão. Foi exactamente esse reenvio de cookie que abriu o SSRF (§5.1). |
| **Causa raiz** | O split Edge/Node (ADR-1) significa que código Edge não é directamente invocável de Node sem extrair um helper puro. O atalho "fetch HTTP same-origin com cookie" funciona mas acopla a segurança ao `Host` header. |
| **Lição** | Quando um runtime (Node) precisa de lógica que vive noutro (Edge), as opções são (a) extrair um helper puro chamável de ambos — o destino correcto, mas refactor desproporcionado para um fix de PR; ou (b) fetch HTTP same-origin — rápido, mas exige que a origin de destino do cookie NUNCA derive de um header controlável sem validação. A 5.11 ficou na (b) com allowlist (Opção C) e registou a (a) como REC-SSRF-2. O Epic 6 (OAuth, com mais caminhos server-side) deve antecipar este trade-off no draft. |
| **Acção** | Sem regra nova — registado para o Epic 6 + REC-SSRF-2 (débito Baixa §4.2). Memória de projecto. |

### 5.4 — O Architect Gate de entrada como padrão sistemático (não excepção) acelerou o epic

| Item | Detalhe |
|------|---------|
| **Onde** | 7 das 13 stories (5.4, 5.7, 5.8, 5.9, 5.11, 5.12, 5.13) |
| **Resolução** | O que na 4.8 foi um padrão positivo isolado (§5.6 retrospectiva Epic 4) tornou-se a norma do Epic 5 para stories de risco (AI/parser/pesquisa web/estado distribuído/tools). A Aria ratificou as decisões-âncora `[D-5.x-*]` no arranque; a `@dev` implementou directamente a abordagem certa; o gate de saída confirmou contra código real. |
| **Lição** | O Architect Gate de entrada paga-se: o Epic 5 fechou 13 stories em ~8 dias (~1,63/dia, o ritmo mais alto de sempre) apesar de território novo, em grande parte porque o retrabalho "implementar com o padrão errado → re-implementar" foi cortado à entrada. As decisões `[D-5.x-*]` ratificadas tornaram-se não-reabríveis, evitando re-discussão no gate de saída. É um padrão a preservar e a tornar default para stories de risco no Epic 6. |

### 5.5 — A verificabilidade do AC4 (pesquisa web cria nota) mapeada no draft evitou surpresa no gate (5.11)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 5.11 (AC4 do epic), 13/06/2026 |
| **Resolução** | Aplicação da acção A3 do Epic 4 (mapa de verificabilidade por AC). O draft da 5.11 explicitou que `pesquisar_web_e_criar_nota` (fetch externo real) só é plenamente verificável em preview/produção, e que o resto (validação de URL, inspecção de corpo, fallback) se cobre em CI com mocks que reflectem o protocolo. AC4 do epic foi marcado como verificação manual desde o início. |
| **Lição** | O padrão de "mapear por AC onde é verificável (CI / preview / produção)" no draft da 1.ª story de uma cadeia com infra externa funcionou — o `@po`/`@architect` não descobriram o AC manual só no gate, como aconteceria sem o mapa. A acção A3 do Epic 4 provou o seu valor. |

---

## 6. Lacked — o que faltou

### 6.1 — O escopo do diff que o gate de saída inspecciona não estava normalizado

O Architect Gate de saída corria o CR local com `-t uncommitted` (diff estreito), não `--base main` (diff completo como o servidor). Um Critical de segurança (SSRF) escapou ao gate e só apareceu no CR server-side do PR #72. — **Acção A1**.

### 6.2 — Verificação de existência de ficheiro por ferramenta única produziu falso negativo

O gate da 5.11 afirmou que um ficheiro de teste "não existia" (Glob falhou) quando existia — quase recriado de raiz, o que apagaria testes válidos. — **Acção A2** (reforço de processo).

### 6.3 — O destino arquitectural correcto da pesquisa web (helper puro, sem fetch HTTP com cookie) ficou como débito

A Opção C (allowlist) fecha o SSRF, mas a Opção A (refactor do proxy) é a correcta a prazo — fica como REC-SSRF-2, a antecipar no Epic 6. — **Acção A3** (decisão de backlog).

---

## 7. Decisões accionáveis

> **Nota de autoridade:** as acções que **criam ou alteram regras formais em `.claude/rules/`** são executadas por `@aiox-master` (Orion). `@po` (Pax) propõe; `@aiox-master` cria. Antes de propor regra nova, verificou-se se já está coberta pelas regras existentes (`mock-protocol-fidelity.md`, `separation-of-roles.md`, `not-tested-trailer-rules.md`, `react-component-test-criteria.md`, `external-contract-identifiers.md`, `internal-state-contract-gate.md`, `merge-authority.md`) — distinguindo "reforço" de "nova".

| # | Acção | Owner | Tipo | Nova regra ou reforço? | Deadline | Done quando |
|---|-------|-------|------|------------------------|----------|-------------|
| **A1** | Formalizar que o **Architect/QA Gate de saída e o pre-commit do `@dev` correm CodeRabbit com `--base main`** (diff completo, como o servidor verá no PR), não só `-t uncommitted`. Concretamente: **emendar `.claude/rules/coderabbit-integration.md`** — que hoje só documenta `-t uncommitted` (L71/L74), exactamente o escopo estreito que deixou escapar o Critical SSRF da 5.11. A directiva já existe como memória de feedback (`cr-base-main-no-gate-saida`); A1 eleva-a a regra formal no ficheiro existente. | **`@aiox-master` (Orion)** — `@po` propõe | **EMENDA A REGRA EXISTENTE** (`coderabbit-integration.md`) | **NOVA na substância.** O ficheiro `coderabbit-integration.md` existe mas só prescreve `-t uncommitted`; nenhuma regra exige `--base main` no gate de saída. Complementa `internal-state-contract-gate.md` (ponto cego semântico) com o ponto cego de *escopo do diff* | **Antes do Epic 6 (OAuth — caminhos server-side com mais superfície de segurança)** | `coderabbit-integration.md` exige `--base main` no gate de saída + a 1.ª story do Epic 6 com endpoint server-side aplica-o |
| **A2** | Adicionar ao processo de gate uma **verificação de existência de ficheiro por ≥2 ferramentas** (Glob + Bash/Read) antes de qualquer veredicto que afirme inexistência ("ficheiro inventado/ausente"). Evita o falso negativo da 5.11 que quase recriou um ficheiro de teste de raiz, apagando 6 testes válidos. | `@architect` (Aria) + `@qa` (Quinn) no gate | **PROCESSO** (checklist de gate) | **REFORÇO** de `mandatory-change-log.md` (verificar estado real) — não exige regra `.claude/rules/` nova; avaliar nota em `story-lifecycle.md` | **Antes do Epic 6** | Checklist de gate inclui a dupla verificação + 1 gate confirma existência por 2 ferramentas |
| **A3** | Decidir o destino do **backlog de débitos Baixa acumulado**: 4 de finanças (Epic 3) + D6 (cascata, convenção fixada) + 3 de push/onboarding (Epic 4) + 5 novos do Epic 5 (REC-SSRF-2, FLAG env Vercel, OBS-5.13-TZ, OBS-5.13-SCAN, OBS-5.10-A2). Avaliar 1-2 stories técnicas de housekeeping. REC-SSRF-2 (refactor do proxy) deve ser antecipado no planeamento do Epic 6 (mais caminhos server-side). | `@pm` (Morgan) + `@po` (Pax) | **PROCESSO** (backlog/scope) | NÃO — decisão de backlog | **No arranque do Epic 6** | Os débitos têm destino (story técnica criada ou backlog confirmado) |
| **A4** | Confirmar o destino do **D7** (fallback intent PT-BR no classifier) — UX visível em produção, do domínio Epic 1, decisão Eurico foi hotfix via SOP Hotfix Produção mas continua sem evidência de execução. Verificar se foi agendado ou despriorizado. | Eurico + `@devops` (Gage) | **PROCESSO** (hotfix) | NÃO — hotfix | **Próxima sessão** | D7 confirmado agendado ou despriorizado conscientemente |
| **A5** | Confirmar a **FLAG env Vercel** da 5.11: verificar se `VERCEL_PROJECT_PRODUCTION_URL` está exposta ao runtime Node de `/api/conhecimento/web-search`. Se sim, caminho feliz idêntico ao actual; se não, o fail-safe usa a allowlist (`imersao.ia.expressia.pt`). | `@devops` (Gage) | **PROCESSO** (env) | NÃO — config | **Próxima sessão** | Env confirmada exposta ou allowlist confirmada como caminho activo |
| **A6** | Memory log: actualizar a memória do Nexus v2 com Epic 5 = 13/13 Done, waiver rate 0/13, PRs #59-#74, closure commit Story 5.13 `d2db59d0`, e referência a esta retrospectiva. | `@aiox-master` (Orion) ou Eurico | **MEMÓRIA** | NÃO — memória | **16/06/2026** | MEMORY.md actualizado com entrada que refere este documento |
| **A7** | Eurico + `@pm` decidem o **próximo epic**. Ordem PRD §9: `5 → 6`. Epic 6 (Telegram/OAuth/integrações) é o sucessor natural — onde A1 (escopo do CR no gate), a lição de estado server-side (§5.3) e REC-SSRF-2 se aplicam directamente. | Eurico + `@pm` (Morgan) | **PROCESSO** (roadmap) | NÃO — roadmap | **Próxima sessão** | Epic escolhido → `@pm *create-epic 6` |

### Acções que requerem `@aiox-master` (Orion) — resumo

| Acção | Natureza | Estado |
|-------|----------|--------|
| **A1** | **EMENDA A `coderabbit-integration.md`** proposta — gate de saída + pre-commit correm CodeRabbit `--base main` (escopo de diff completo). O ficheiro existe mas só prescreve `-t uncommitted`; já há memória de feedback, falta elevar a regra formal | **PROPOSTA** — `@po` propõe; `@aiox-master` decide/emenda |
| **A2** | **REFORÇO** — verificação de existência de ficheiro por ≥2 ferramentas; avaliar nota em `story-lifecycle.md`, não regra nova | **PROPOSTA** — a avaliar por `@aiox-master` |

> `@po` (Pax) **não** cria regras formais — apenas as propõe. A criação/alteração de `.claude/rules/` é autoridade de `@aiox-master` (precedente Epics 1/3/4).

---

## 8. Comparação Epic 1 vs 2 vs 3 vs 4 vs 5

| Métrica | Epic 1 | Epic 2 | Epic 3 | Epic 4 | Epic 5 | Tendência |
|---------|--------|--------|--------|--------|--------|-----------|
| Stories | 10 | 10 | 11 | 10 | **13** | maior epic até hoje |
| Duração | 7 dias | ~6 dias | ~8 dias | ~9 dias | **~8 dias** | rápido p/ 13 stories |
| Stories/dia | ~1,43 | ~1,67 | ~1,38 | ~1,11 | **~1,63** | 2.º mais alto |
| Waiver rate ("merge waived") | 50% (5/10) | 0% (0/10) | 9,1% (1/11) | 0% (0/10) | **0% (0/13)** | iguala o melhor |
| Validação `@po` GO à 1.ª passagem | — | — | — | 9/10 (4.7 falhou 2×) | **13/13** | melhor de sempre |
| Stories na 3.ª iter (CR ou gate) | 1 (1.10) | 1 (2.6) | 4 | 2 (4.2, 4.9) | **1** (5.11) | desceu |
| Iter 3+ por nitpicks de teste/doc | — | — | 3 das 4 | 0 | **0** | A1 do Epic 3 mantém-se |
| Iter 3+ por segurança/produção real | 1 | 0 | 0 | 1 (4.9 snooze) | **1** (5.11 SSRF) | só código real |
| Bugs produção pós-deploy dentro do epic | 0 | 0 | 0 | 0 (1 hotfix) | **0** | mantido |
| ADRs base reabertos | 0 | 0 | 0 | 0 | **0** | igual (editor + fetch externo) |
| Débitos Média/Alta gerados | — | 2 (D6,D7) | 0 | 0 | **0** | mantido |
| Contrato externo de protocolo novo | não | não | não | sim (Web Push) | **sim (fetch web arbitrário)** | 2.º do projecto |
| Delta de testes | — | — | +260 | +395 | **+513** | maior delta absoluto |
| Acções da retrospectiva anterior aplicadas | n/a | A1,A2,A6 | A2,A6,A1 | A3,A4,A6,A1 | **A1,A2,A3,A4,A6 (Epic 4)** | ciclo validado 4× |

**Conclusão da comparação:** o Epic 5 foi o **maior epic até hoje (13 stories)** e fechou com **0% de waiver, igualando o melhor padrão (Epic 2 e Epic 4)**, ao 2.º ritmo mais alto de sempre (~1,63/dia) e com **0 débitos Média/Alta**. A validação `@po` deu GO à 1.ª passagem em 13/13 stories — o melhor registo de sempre (contraste com a 4.7 que falhou 2×). A única reabertura além do hard-stop (5.11) foi por um **Critical de segurança real** (SSRF), não por metadados — exactamente o tipo de finding que justifica iteração extra. A lição mais valiosa é a §5.1: o gate de saída tinha um ponto cego no **escopo do diff que o CodeRabbit inspeccionava** (`-t uncommitted` vs `--base main`), análogo ao ponto cego semântico do Epic 4 (§5.1 dessa retrospectiva). A acção A1 endereça-o antes do Epic 6 (OAuth), onde os caminhos server-side de segurança multiplicam-se.

---

## 9. Próximas acções na sequência

1. **`@devops` (Gage)** — push do closure commit desta retrospectiva (docs-only). O closure da Story 5.13 (`d2db59d0`) e o arquivo de handoff (`fbf261e4`) já estão em main; esta retrospectiva é um commit docs adicional.
2. **`@aiox-master` (Orion) ou Eurico** — executa **A6**: actualiza memória com Epic 5 = 13/13 Done, waiver 0/13.
3. **`@aiox-master` (Orion)** — avalia **A1** (nova regra: gate de saída + pre-commit correm CR `--base main`) + **A2** (reforço de verificação de existência por ≥2 ferramentas).
4. **`@pm` (Morgan) + `@po` (Pax)** — executam **A3** (destino do backlog de débitos Baixa, incl. REC-SSRF-2) no arranque do Epic 6.
5. **Eurico + `@devops`** — executam **A4** (confirmar D7) e **A5** (confirmar FLAG env Vercel da 5.11).
6. **Eurico + `@pm` (Morgan)** — executam **A7**: decidem próximo epic → `@pm *create-epic 6`.

---

## 10. Convenções desta retrospectiva

| Regra | Verificação |
|-------|-------------|
| `workspace-governance.md` | Documento em `imersao-tools/nexus/docs/retrospectives/` (categoria 2: Projectos Próprios) — OK |
| `language-standards.md` | PT-PT, datas DD/MM/YYYY, separador decimal vírgula, sem PT-BR — OK |
| `output-format-standards.md` | Tabelas ASCII markdown, sem emojis, sem preâmbulo — OK |
| `mandatory-change-log.md` | Acções A1-A7 com owner + tipo + deadline + done + flag de autoridade `@aiox-master` — OK |
| `separation-of-roles.md` | Retrospectiva é trabalho de `@po`; documento de processo, sem quality gate sobre si mesma |
| `merge-authority.md` | Retrospectiva regista que todos os merges (PRs #59-#74) foram feitos pelo agente (`@devops`/`@aiox-master`), nunca merge manual pelo Eurico — OK |
| `agent-authority.md` | Criação de regras formais marcada como autoridade `@aiox-master` (A1) — `@po` propõe, não cria — OK |
| Constitution Artigo IV (No Invention) | Todas as métricas derivadas de `git log` real, `EPIC-5.md`, stories `completed/5.1-5.13.story.md`, e memórias de validação/fecho. Onde uma métrica não existia nas fontes, não foi inventada |

---

**Documento criado por:** Pax (`@po`) em 16/06/2026
**Sources verificados:**
- `git log --format="%h %ai %s"` em `ecosistema-ia-avancada-pt` (squash commits PRs #59-#74 + closure `d2db59d0`)
- `imersao-tools/nexus/docs/EPIC-5.md` (13/13 FECHADO, §5 stories, §6 ACs, §7 GAPs, §8 lições/débitos, §9 quality gates, §10 fecho)
- `imersao-tools/nexus/docs/stories/completed/5.1-5.13.story.md` (Change Logs, PO/QA/Architect Gates de entrada+saída, contagens de teste, iterações CR, decisões `[D-5.x-*]`, `[D-5.11-SSRF-FIX]`)
- `imersao-tools/nexus/docs/retrospectives/EPIC-1/2/3/4-retrospective.md` (referência de formato e baseline comparativa)
- `.claude/rules/` (mock-protocol-fidelity, separation-of-roles, not-tested-trailer-rules, react-component-test-criteria, external-contract-identifiers, internal-state-contract-gate, merge-authority) — verificadas para distinguir nova regra de reforço
