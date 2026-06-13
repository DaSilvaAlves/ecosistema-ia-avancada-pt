# Epic 5 — Diário + Brain Dump + Conhecimento

> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Criado por:** Morgan (`@pm`) em 07/06/2026
> **Estado:** EM CURSO — **9/13 stories DONE** (5.1 Schema + 5.2 Editor Markdown + 5.3 CRUD Diário/Mood/Heatmap + 5.4 Diário AI estrutura + 5.5 Pesquisa full-text diário + 5.6 Brain Dump UI + 5.7 Brain Dump AI parser + 5.8 Brain Dump approval flow + 5.9 CRUD áreas/cadernos/notas, todas em `main`). Sub-módulo Diário (5.3-5.5) completo; sub-módulo Brain Dump COMPLETO 3/3 (5.6 + 5.7 + 5.8); sub-módulo Conhecimento iniciado 1/5 (5.9). Resta o sub-módulo Conhecimento (5.10-5.13). Sucessor natural do Epic 4 (FECHADO 10/10) na ordem PRD §9 (`4 → 5 → 6`).
> **Fonte da verdade:** `PRD-NEXUS-V2.md` §6.8 (Diário, FR42-46), §6.9 (Brain Dump, FR47-50), §6.10 (Conhecimento, FR51-57), §9 (roadmap — linha "Epic 5 — Diário + Brain Dump + Conhecimento"), §10 Epic 5 (Stories sugeridas 5.1-5.13 + AC1-AC4) — Constitution Artigo IV (No Invention): cada story, FR e AC abaixo traça ao PRD.
> **Arquitectura:** `architecture-v2.md` — **ADR-3 (Markdown editor: Tiptap 2.x, não Lexical)** já decidido; §4.3 (config Tiptap restrita); §16 "Epic 5 — Pontos críticos arch" (Tiptap config, Brain Dump preview obrigatório, pesquisa web Anthropic→DuckDuckGo); §17 (pacotes `@tiptap/*` já listados). Os 5 ADRs base NÃO são reabertos.
> **Lições aplicadas:** Retrospectivas Epic 1 (A1/A2/A6), Epic 2 (A1/A2/A4), Epic 3 (A1-A7) e Epic 4 (A1-A7). Regras em vigor aplicadas preventivamente: `react-component-test-criteria.md` (Epic 3 A3), `external-contract-identifiers.md` (Epic 3 A4), `internal-state-contract-gate.md` (Epic 4 A1), `mock-protocol-fidelity.md` (Epic 1 A1), `separation-of-roles.md` (Epic 1 A6).

---

## 1. Goal

Implementar os três módulos de conhecimento pessoal do Nexus: **Diário** (entrada markdown diária com mood, AI estrutura texto livre, heatmap de mood, pesquisa full-text), **Brain Dump** (texto livre → AI estrutura em tarefas/projectos/ideias/decisões com aprovação item-a-item antes de persistir) e **Conhecimento** (hierarquia Áreas → Cadernos → Notas markdown, pesquisa full-text, tag system partilhado, e pesquisa web integrada que cria notas automaticamente). Editor markdown único (Tiptap 2, ADR-3) partilhado pelos três. Tools do cérebro multi-intent integradas para os três domínios. Trace: PRD §9 (linha "Epic 5 — Diário + Brain Dump + Conhecimento") + §10 Epic 5.

## 2. Contexto e posicionamento

| Dimensão | Detalhe |
|----------|---------|
| Continuidade | Diário + Conhecimento são instrumentos de **continuidade pessoal de médio/longo prazo** — alinhados à visão "sistema de continuidade pessoal, não dashboard de notícias" (`project_nexus_vision.md`). O diário captura o estado interno do Eurico ao longo do tempo; o conhecimento é o repositório onde a informação pesquisada e estruturada se acumula. O Brain Dump é a ponte entre o caos de ideias e as entidades estruturadas (tarefas/projectos) que os Epics 2/3 já gerem. |
| Base Epic 1 | O cérebro multi-intent + Tool Registry (Epic 1, em `main`) é onde as 9 tools de diário/brain-dump/conhecimento (FR46+FR50+FR57) se registam. Precedente: 2.10 registou `tasks`/`projects`; 3.11 registou `finance`; 4.10 registou `habits` (D-DOMAIN: agrupou hábitos/metas/lembretes no mesmo domínio do classifier). A story de tools (5.13) decide se há novo `ToolDomain` ou agrupamento (ver §7 GAP-5.5). |
| 1.ª feature com editor rico | Pela 1.ª vez o Nexus introduz um **editor markdown** (Tiptap 2 — ADR-3 já decidido). Uso restrito (PRD/arch §4.3): apenas Diário (FR42), Brain Dump (FR47) e Notas de Conhecimento (FR51-52). Restantes campos textuais do projecto continuam `<textarea>` simples. O quality gate do epic ("escolha definitiva de markdown editor", PRD §10) está **satisfeito antecipadamente** pela ADR-3 — não há decisão de editor por tomar; resta só a integração. |
| Brain Dump = preview obrigatório | O Brain Dump produz tarefas/projectos/notas via AI, mas com **aprovação item-a-item antes de persistir** (FR49). Arch §16: usa Sonnet com `requiresPreview: true` por chamada. Reutiliza o mecanismo preview-then-confirm do Epic 1 (Story 1.6) — não cria fluxo de confirmação novo. |
| Pesquisa web (1.º caminho server-side de fetch externo de conteúdo) | FR55/FR56: pesquisa web via Anthropic web search (incluída na API key) com fallback DuckDuckGo HTML scraping (arch §16: `lib/shared/web-search-ddg.ts` server-side). É o 1.º caminho do Nexus que vai buscar conteúdo externo arbitrário à web — exige decisão `@architect` de runtime + tratamento de falha (ver §7 GAP-5.4). Não é OAuth (isso é Epic 6); é fetch público. |
| Independência | PRD §9: ordem `0 → 1 → (2 \|\| 3) → 4 → 5 → 6`. Epic 5 depende do Epic 1 (tool registry/cérebro + preview-then-confirm) e do tag system global (introduzido no Epic 2, FR14/FR54 partilham tags). Epics 1-4 estão DONE em main — todas as dependências satisfeitas. O Epic 5 **não bloqueia** nenhum epic seguinte (PRD §9 coluna "Bloqueia" do Epic 5 = vazio). |

## 3. Dependências

| Relação | Epic / Story | Estado |
|---------|--------------|--------|
| Depende de | Epic 1 (Cérebro Multi-Intent — Tool Registry, classifier, executor) | DONE — em main |
| Depende de | Epic 1 Story 1.6 (preview-then-confirm para confidence < 70%) — reutilizado pelo Brain Dump approval flow (FR49) | DONE — em main |
| Reutiliza (padrão) | Epic 2 tag system global (FR14) — o conhecimento partilha tags com tarefas (FR54) | DONE — em main |
| Reutiliza (padrão) | Epics 2/3/4 — padrão "helper puro em `lib/**` + modal/lista fina + tab strip acessível (`TabStrip` D-3.5-2/4.2) + `FormField` partilhado (4.2)" | DONE — em main |
| Reutiliza (padrão) | Epic 4 — padrão de teste de componente para vistas com ≥3 estados de render (`react-component-test-criteria.md`) | DONE — em main |
| Precede | Nenhum epic (PRD §9 coluna "Bloqueia" do Epic 5 = vazio) | — |
| Relação com Epic 6 | A pesquisa web (FR55) é fetch público, distinta do OAuth/integrações do Epic 6. Não há dependência mútua. | Epic 6 não iniciado |

Ordem PRD §9: `0 → 1 → (2 || 3) → 4 → 5 → 6 → 7 → 8`.

## 4. Functional Requirements cobertos

Trace directo a `PRD-NEXUS-V2.md` §6.8, §6.9, §6.10. 16 FRs no total.

### Diário (§6.8)

| FR | Descrição (PRD §6.8) | Stories |
|----|----------------------|---------|
| FR42 | Entrada de diário diária: texto livre markdown, mood (1-5), data automática | 5.2, 5.3 |
| FR43 | Cérebro AI propõe estrutura ao texto livre quando > 100 caracteres (ex: separa "fiz"/"senti"/"aprendi") | 5.4 |
| FR44 | Vista calendário com indicador de mood por dia (heatmap colorido) | 5.3 |
| FR45 | Pesquisa full-text nas entradas | 5.5 |
| FR46 | Tools cérebro: `criar_entrada_diario`, `consultar_diario`, `pesquisar_diario` | 5.13 |

### Brain Dump (§6.9)

| FR | Descrição (PRD §6.9) | Stories |
|----|----------------------|---------|
| FR47 | Input texto livre ("vomita ideias 10 min seguidos") | 5.6 |
| FR48 | AI estrutura output em: tarefas propostas, projectos propostos, ideias soltas, decisões a tomar | 5.7 |
| FR49 | Utilizador aprova item-a-item antes de persistir como tarefa/projecto/nota | 5.8 |
| FR50 | Tool cérebro: `brain_dump` | 5.13 |

### Conhecimento (§6.10)

| FR | Descrição (PRD §6.10) | Stories |
|----|----------------------|---------|
| FR51 | Hierarquia: Áreas → Cadernos → Notas (markdown) | 5.1, 5.9 |
| FR52 | CRUD de áreas, cadernos, notas | 5.9 |
| FR53 | Pesquisa full-text em notas | 5.10 |
| FR54 | Tag global system partilhado com tarefas | 5.9 |
| FR55 | Pesquisa web integrada via Anthropic web search (incluída) ou fallback DuckDuckGo HTML scraping | 5.11 |
| FR56 | Cérebro pode pesquisar web e criar notas automaticamente ("pesquisa Artemis 2 e cria área Espaço com caderno Artemis 2") | 5.12 |
| FR57 | Tools cérebro: `criar_area`, `criar_caderno`, `criar_nota`, `pesquisar_conhecimento`, `pesquisar_web_e_criar_nota` | 5.13 |

## 5. Stories (13) — trace PRD §10 Epic 5

> **Decomposição directa das "Stories sugeridas" do PRD §10 Epic 5 (5.1 a 5.13)** — nenhuma story inventada nem omitida face ao PRD. Os pares executor/quality-gate são **previsões** (Quality-First Planning) e respeitam `executor != quality_gate` (`separation-of-roles.md`). `@sm` (River) finaliza a atribuição em cada story draft; `@po` (Pax) valida.

| # | Story | Descrição | FR | Executor previsto | Quality gate previsto | Estado |
|---|-------|-----------|-----|-------------------|------------------------|--------|
| 5.1 | Schema diário/brain-dump/conhecimento | Schema Dexie `journal_entries`, `brain_dumps`, `knowledge_areas`, `knowledge_notebooks`, `knowledge_notes` (`version(N)` aditivo — estende o schema dos Epics 1/2/3/4). Aplica a **convenção de delete-cascata** fixada pela Story 4.1 (cascade nos filhos sem vida própria — `areas → notebooks → notes`; hard-delete). Arch §4.2 propõe `knowledge_notebooks: 'id, areaId'`, `knowledge_notes: 'id, notebookId, *tags, updatedAt'` | FR42, FR47, FR51 | `@data-engineer` | `@architect` | ✅ Done (PR #59 `7171a99f`) |
| 5.2 | Editor markdown (Tiptap 2) | Componente editor markdown partilhado baseado em Tiptap 2 (ADR-3 — **editor já decidido**), config restrita StarterKit + TaskList + TaskItem + Link + Placeholder (arch §4.3/§16). Sem images iniciais (Epic 8 se necessário). Reutilizado por Diário (5.3), Brain Dump (5.6) e Notas (5.9) | FR42, FR47, FR51 | `@dev` | `@qa` | ✅ Done (PR #60 `094f1f35`) |
| 5.3 | CRUD diário + mood + heatmap mood | CRUD diário (texto markdown, mood 1-5, data automática) + vista calendário com heatmap de mood colorido. **Componente com múltiplos estados de render (loading/empty/content/dias-com-mood vs sem) → teste de componente obrigatório (`react-component-test-criteria.md`)**. Reutiliza editor da 5.2 + padrão heatmap da 4.3 | FR42, FR44 | `@dev` | `@qa` | ✅ Done (PR #61 `e0d45ea4`) |
| 5.4 | Diário AI estrutura | AI propõe estrutura ao texto livre do diário quando > 100 caracteres (separar fiz/senti/aprendi). Helper puro de threshold/parsing + chamada AI. Modo preview (utilizador aceita ou ignora a estrutura proposta) | FR43 | `@dev` | `@architect` | ✅ Done (PR #62 `a2eec5cc`) |
| 5.5 | Pesquisa full-text diário | Pesquisa full-text nas entradas de diário. Lógica de pesquisa/indexação em helper puro (`lib/diario/**`) | FR45 | `@dev` | `@qa` | ✅ Done (PR #63 `3ec0664f`) |
| 5.6 | Brain Dump UI | UI Brain Dump: textarea grande (ou editor 5.2) + botão "estruturar". Estado de input antes do parse AI | FR47 | `@ux-design-expert` | `@dev` | ✅ Done (PR #64 `b3a538e7`) |
| 5.7 | Brain Dump AI parser | Parser AI: texto livre → output estruturado em 4 buckets (tarefas propostas / projectos propostos / ideias soltas / decisões a tomar). Arch §16: Sonnet com tools `criar_tarefa`/`criar_projecto`/`criar_nota` em modo **`requiresPreview: true` por chamada**. **Mock do parser AI reflecte o protocolo real (`mock-protocol-fidelity.md`)** | FR48 | `@dev` | `@architect` | ✅ Done (PR #66 `4b69331b`) |
| 5.8 | Brain Dump approval flow | Aprovação item-a-item antes de persistir (FR49): cada item proposto é aceite/rejeitado individualmente antes de virar tarefa/projecto/nota. Reutiliza o preview-then-confirm do Epic 1 (Story 1.6) — não cria fluxo novo. **Estado distribuído (proposta → aceite/rejeitado → persistido) → `internal-state-contract-gate.md` aplica-se (ver §8)** | FR49 | `@dev` | `@architect` | ✅ Done (PR #67 `a7efbd2c`) |
| 5.9 | CRUD áreas/cadernos/notas (3 níveis) | CRUD da hierarquia de 3 níveis Áreas → Cadernos → Notas (markdown via editor 5.2). Tag system global partilhado com tarefas (FR54 — reutiliza tags do Epic 2, não cria sistema novo). Reutiliza `FormField`/`TabStrip` partilhados (4.2) | FR51, FR52, FR54 | `@dev` | `@qa` | ✅ Done (PR #70 `4e19cbb4`) |
| 5.10 | Pesquisa full-text conhecimento | Pesquisa full-text em notas (cruzada com áreas/cadernos). Helper puro de pesquisa (`lib/conhecimento/**`) | FR53 | `@dev` | `@qa` | PLANEADO |
| 5.11 | Pesquisa web | Pesquisa web via Anthropic web search (a partir do Sonnet 4); fallback DuckDuckGo HTML scraping (`lib/shared/web-search-ddg.ts` server-side, arch §16). **GAP arquitectural: runtime do endpoint de pesquisa web + tratamento de falha do fetch externo — ver §7 GAP-5.4** | FR55 | `@dev` | `@architect` | PLANEADO |
| 5.12 | Cérebro pesquisa web e cria nota | Fluxo completo: "pesquisa Artemis 2 e cria área Espaço com caderno Artemis" — combina pesquisa web (5.11) + criação de área/caderno/nota (5.9) numa única intent multi-passo do cérebro. Modo preview antes de persistir | FR56 | `@dev` | `@architect` | PLANEADO |
| 5.13 | Tools cérebro | Registar 9 tools no Tool Registry (nomes ASCII validados — ver §4 e nota abaixo): `criar_entrada_diario`, `consultar_diario`, `pesquisar_diario`, `brain_dump`, `criar_area`, `criar_caderno`, `criar_nota`, `pesquisar_conhecimento`, `pesquisar_web_e_criar_nota` | FR46, FR50, FR57 | `@dev` | `@architect` | PLANEADO |

> **Padrão de gate herdado dos Epics 2/3/4:** schema → gate `@architect`; UI pura → executor `@ux-design-expert`, gate `@dev`; lógica de domínio/cálculo → gate `@qa`; AI/parser/pesquisa web/tools (território de risco — protocolo AI, fetch externo, estado distribuído) → gate `@architect`. `@sm`/`@po` confirmam a atribuição final em cada draft.

> **Nota (`external-contract-identifiers.md`) — validação preventiva dos nomes de tools:** os 9 nomes de tools do PRD §10 Epic 5 (`criar_entrada_diario`, `consultar_diario`, `pesquisar_diario`, `brain_dump`, `criar_area`, `criar_caderno`, `criar_nota`, `pesquisar_conhecimento`, `pesquisar_web_e_criar_nota`) **já estão em ASCII** (sem acentos nem cedilha — note-se "diario" sem acento, "area" sem acento). Validados contra `TOOL_NAME_PATTERN` (`[a-z0-9_]`) + Anthropic tool spec **no draft deste epic**, não na implementação (precedente Story 3.11 onde nomes com cedilha foram rejeitados). A grafia humana PT-PT ("diário", "área") vive na camada semântica do LLM (DEV-DECISION D-FUZZY, precedente 3.11/4.10), não no identificador técnico. A Story 5.13 não deve precisar de reconciliação de AC por nomes.

## 6. Acceptance Criteria (nível epic) — trace PRD §10 Epic 5

Cópia fiel dos AC Epic 5 do PRD §10 (linhas 535-539).

| # | Critério | Story principal |
|---|----------|-----------------|
| AC1 | Diário aceita markdown com formatação preservada | 5.2, 5.3 |
| AC2 | Brain dump 200 palavras gera output estruturado em < 8s | 5.7 |
| AC3 | Áreas/cadernos/notas suportam 3 níveis com pesquisa cruzada | 5.9, 5.10 |
| AC4 | Pesquisa web cria nota com resumo + fonte URL | 5.11, 5.12 |

## 7. Reconciliação PRD ↔ Arquitectura — GAPs para o draft

> Os pontos abaixo são marcados para resolução por `@architect` no draft das stories respectivas — **não preenchidos com suposição** (Constitution Artigo IV, precedente `[GAP-4.1]` a `[GAP-4.6]` do EPIC-4.md §7). Nenhum dos 5 ADRs base é reaberto. Ao contrário do Epic 4 (território Web Push inteiramente novo), o Epic 5 tem menos GAPs porque a ADR-3 (Tiptap) e a §16 da arquitectura já anteciparam os pontos críticos.

| Ponto | PRD diz | Arquitectura actual | GAP a resolver no draft |
|-------|---------|---------------------|-------------------------|
| **[GAP-5.1]** Persistência | Story 5.1 "schema journal_entries, brain_dumps, knowledge_areas, knowledge_notebooks, knowledge_notes" | ADR-2: Dexie 4 IndexedDB desde dia 1; arch §4.2 propõe os índices das tabelas de conhecimento; client.ts em main está em `version(N)` pós-Epic-4 | Story 5.1 cria 5 tabelas Dexie `version(N+1)` aditivo. **Confirmar contra o `client.ts` real em main qual o próximo número de versão livre** (o Epic 4 acrescentou tabelas de hábitos/metas/lembretes — verificar a versão actual, não assumir). Garantir que o upgrade path dos dados de produção do Eurico é preservado (não reescrever versões anteriores). Aplicar a convenção de cascata da 4.1. |
| **[GAP-5.2]** Editor markdown | Story 5.2 "tiptap ou lexical, decisão @architect"; PRD §10 quality gate "escolha definitiva de markdown editor" | **ADR-3: Tiptap 2.x já decidido** (não Lexical); arch §4.3 lista a config + pacotes; §17 lista as deps `@tiptap/*` | **GAP fechado antecipadamente pela ADR-3.** Não há decisão de editor por tomar. Resta confirmar no draft da 5.2: serialização markdown vs JSON em Dexie (Tiptap suporta ambos out-of-box, arch §4.3) e que a config restrita (StarterKit + TaskList + TaskItem + Link + Placeholder) cobre os 3 consumidores. O quality gate do epic está satisfeito antes de começar. |
| **[GAP-5.3]** Preview obrigatório do Brain Dump | FR49 "aprova item-a-item antes de persistir"; arch §16 "Sonnet com tools em modo `requiresPreview: true`" | Epic 1 Story 1.6: preview-then-confirm para confidence < 70% | Story 5.8 reutiliza o mecanismo preview-then-confirm do Epic 1 com `requiresPreview: true` **por chamada** (não por confidence), porque o Brain Dump exige sempre aprovação. `@architect` confirma no draft da 5.7/5.8 se o flag `requiresPreview` já existe por-tool no Tool Registry ou se precisa de extensão. Não criar fluxo de confirmação novo. |
| **[GAP-5.4]** Runtime + falha da pesquisa web | Story 5.11 "Anthropic web search ou DuckDuckGo HTML scraping"; FR55 | ADR-1: split Edge/Node; arch §16 `lib/shared/web-search-ddg.ts` server-side | `@architect` decide no draft da 5.11: (a) endpoint de pesquisa web em que runtime (DuckDuckGo HTML scraping pode precisar de Node; Anthropic web search corre no proxy existente); (b) **tratamento de falha do fetch externo** — timeout, rede indisponível, HTML inesperado do DuckDuckGo, rate limit. É o 1.º caminho do Nexus que vai buscar conteúdo externo arbitrário; a falha não pode silenciar (lição Epic 4 §5.1 / `internal-state-contract-gate.md`). Confirmar custo de tokens (risco PRD §11 R2). |
| **[GAP-5.5]** Domínio das tools no Tool Registry | Story 5.13 "9 tools de diário/brain-dump/conhecimento" | ADR-5 Tool Registry por domínio; precedente 4.10 D-DOMAIN (agrupou 3 áreas num domínio porque o classifier já as agrupava) | `@architect` decide no draft da 5.13: as 9 tools usam um novo `ToolDomain` (`knowledge`? `journal`?) ou agrupam-se como a 4.10 fez? Depende de como o classifier do Epic 1 agrupa diário/brain-dump/conhecimento. Verificar em código (precedente D-DOMAIN da 4.10), não assumir. Módulos Edge-safe (sem import client/repos, usar `ctx.db`) como na 4.10. |

## 8. Qualidade e processo — lições das Retrospectivas Epic 1/2/3/4

| Acção / lição | Aplicação no Epic 5 |
|---------------|---------------------|
| **A1 Epic 4 — `internal-state-contract-gate.md`** | Aplica-se à **Story 5.8 (Brain Dump approval flow)** — o estado de um item proposto distribui-se por: parser AI (proposta) → UI de aprovação (aceite/rejeitado) → persistência (tarefa/projecto/nota criada). O gate `@architect` da 5.8 deve fazer a análise de ciclo de vida: (a) classes de estado (proposto/aceite/rejeitado/persistido); (b) transição-já-ocorrida (item aprovado duas vezes, item cuja entidade-alvo já não existe); (c) falha (persistência falha a meio de um batch de aprovações). Menor superfície que a 4.9, mas o padrão existe. |
| **A1 Epic 1 — `mock-protocol-fidelity.md`** | Aplica-se ao **parser AI do Brain Dump (5.7)** e à **estruturação AI do diário (5.4)** e à **pesquisa web (5.11)**. O mock da resposta do Sonnet (4 buckets do brain dump; estrutura fiz/senti/aprendi; resultados de pesquisa web) reflecte o protocolo real da API, não apenas faz os tests passar. ≥1 teste que falharia se o shape da resposta divergisse. |
| **A3 Epic 3 — `react-component-test-criteria.md`** | Aplicada preventivamente. A vista de diário com heatmap de mood (5.3) tem múltiplos estados de render (loading/empty/content/dias-com-mood vs sem) → **teste de componente obrigatório**, contado no gate ANTES do CodeRabbit. O editor markdown (5.2) e a UI de aprovação do brain dump (5.8) também têm estados distintos — avaliar a contagem no gate. |
| **A4 Epic 3 — `external-contract-identifiers.md`** | Aplicada. Os 9 nomes de tools (5.13) validados ASCII no draft do epic (ver nota §5). |
| **A6 Epic 1 — `separation-of-roles.md`** | Aplicada na tabela §5 — nenhum executor é o seu próprio quality gate. |
| **A2 Epic 4 — varredura de bug-de-classe nas camadas adjacentes** | Quando o CR/gate apanha um CRITICAL/Major de classe identificável, `@dev` verifica a mesma classe nas camadas adjacentes (editor↔persistência, parser↔preview) **no mesmo ciclo** — evita o gasto de Iter 2+3 (lição da 4.2). |
| **A3 Epic 4 — mapa de verificabilidade por AC** | Aplica-se à pesquisa web (5.11/5.12) **se** depender de chaves/infra só-de-produção (Anthropic web search pode exigir feature flag). No draft da 5.11, mapear por AC onde é verificável (CI / preview / produção). AC4 (pesquisa web cria nota) pode precisar de verificação manual se o fetch externo não for mockável de forma fiável. |
| **A1 Epic 3 — `.coderabbit.yaml` afinado** | Já em vigor (efeito visível no Epic 4: 0 Iter-3 por nitpicks de teste/doc). Mantém-se. |
| **A5 Epic 3 — convenção de contagem de testes** | Stories do Epic 5 não mantêm contagens exactas de testes em headers/File List — só no Change Log/Dev Record como snapshot datado (`story-lifecycle.md`). |
| Alvo de waiver rate | Epic 4 fechou 0/10 (0%). **Alvo Epic 5: 0%** (manter o melhor padrão de sempre, igualado por Epic 2 e Epic 4). |
| Hard-stop QA loop | Máximo 2 iterações de `qa-loop-fix`/CR por story; Iter 3 ou merge waived exigem autorização humana explícita do Eurico no commit. Mantido dos Epics 1/2/3/4. |

### Decisão A4 (Retrospectiva Epic 4) — destino do backlog de débitos Baixa acumulado

A Retrospectiva Epic 4 (acção A4) atribuiu a `@pm` + `@po` a decisão do destino do backlog de débitos Baixa acumulado, no arranque do Epic 5. Decisão de `@pm` (Morgan) — `@po` (Pax) valida:

| Débito | Origem | Decisão | Racional |
|--------|--------|---------|----------|
| **D-3.3-1** (error inerte), **D-3.4-1** (teste cascata), **D-3.4-2** (copy "Tarefa recorrente"), **D-3.5-1** (referências órfãs conta/cartão) | Epic 3 (finanças) | **MANTÊM-SE em backlog** para **story técnica de housekeeping de finanças dedicada** — NÃO entram no Epic 5 | São específicos do domínio finanças (FR16-23). O Epic 5 (diário/brain-dump/conhecimento) **não toca** código de finanças — forçá-los aqui violaria coerência de domínio (mesma lógica que manteve D6/D7 fora dos Epics 3/4). |
| **D-4.2-1** (NavLink `/tasks` EN vs rota real `/tarefas` PT no `Header.tsx`) | Epic 4 | **ABSORVÍVEL pela 1.ª story do Epic 5 que toque o `Header.tsx`** (provável: 5.3 diário ou 5.9 conhecimento adicionam NavLinks novos ao Header) — caso contrário mantém-se em backlog | O Epic 5 adiciona rotas novas (`/diario`, `/conhecimento`/`/brain-dump`) que exigem NavLinks no Header. Quem tocar o Header de caminho corrige o `/tasks`→`/tarefas`. Pagar de caminho é eficiente e in-scope (mesma lógica de A6 do Epic 3 com D-3.5-2/3). |
| **D-4.7-1** (FR35 subscrição push no `/lembretes`, não no onboarding) | Epic 4 | **MANTÉM-SE em backlog** — follow-up para quando existir fluxo de onboarding v2 | O Epic 5 não toca onboarding nem push. Fora de scope. |
| **D-4.8-1** (recorrência de série de lembretes server-side, diferida) | Epic 4 | **MANTÉM-SE em backlog** (domínio lembretes/Epic 4) — story dedicada | O disparo one-shot funciona; a série recorrente server-side é do domínio do Epic 4. Fora de scope do Epic 5. |
| **D-4.8-2** (rotação `CRON_SECRET` + `env.ts` min-length, hardening) | Epic 4 | **`@devops` — hardening de secret**, não-bloqueador, independente do ciclo de epics | Secret server-provisioned. Não é trabalho de produto; `@devops` agenda quando conveniente. |
| **D6** (delete projecto com cascata `Task.projectId`) | Epic 2 | **Story técnica dedicada pós-Epic-4** usando a convenção de cascata fixada pela 4.1 — NÃO no Epic 5 | O Epic 5 não toca código de projectos/tarefas. A convenção está fixada (4.1); falta só a story de aplicação a D6. Candidata a juntar à story técnica de housekeeping de finanças. |

**Síntese A4 (recomendação `@pm`):** **1 story técnica de housekeeping** consolidando os 4 débitos de finanças (D-3.3-1, D-3.4-1, D-3.4-2, D-3.5-1) + D6 (cascata projectos, convenção já fixada) — agendável **em paralelo com o Epic 5** (toca domínios diferentes, sem conflito) ou imediatamente após. Os débitos de push/onboarding (D-4.7-1, D-4.8-1, D-4.8-2) ficam em backlog dedicado ao domínio Epic 4/push. O D-4.2-1 (NavLink) é absorvido de caminho pela 1.ª story do Epic 5 que toque o `Header.tsx`. Não criar a story de housekeeping como bloqueador do arranque do Epic 5 — o Epic 5 arranca pela 5.1 (schema) independentemente. `@po` valida a story técnica quando `@sm` a draftar.

### Estado A5 (Retrospectiva Epic 4) — destino do D7 (fallback intent PT-BR)

| Item | Estado verificado (07/06/2026) |
|------|--------------------------------|
| **D7** — Fallback de intent vazio em PT-BR no classifier (UX visível em produção) | **DECIDIDO mas APARENTEMENTE NÃO EXECUTADO.** A decisão (Eurico, 29/05/2026, registada em EPIC-4.md §8 A7 e na retrospectiva Epic 4 §4.1) foi: **hotfix dedicado via SOP Hotfix Produção** (`reference_sop_hotfix_producao.md`), independente do ciclo de epics. **Verificação:** o `INDEX.md` de handoffs lista D7 como item "Não-urgente" ainda pendente no handoff de fecho do Epic 4 (`RETOMA-20260607-...-aguarda-A1-rule-push.md`). Não há, nos handoffs nem no histórico recente, evidência de um hotfix do fallback PT-BR do classifier agendado ou merged (distinto do hotfix `executor-system-prompt` de 18/05 e da saga `classifier-fences` de 31/05, que são bugs diferentes). |

**Síntese A5 (recomendação `@pm`):** D7 **continua aberto** — a decisão de o resolver via SOP Hotfix foi tomada mas não consta como executada. Como é UX visível na 1.ª interacção em produção (`https://imersao.ia.expressia.pt`) e é do domínio classifier/Epic 1 (NÃO do Epic 5), **não deve entrar no Epic 5**. Recomendação: o Eurico confirma se quer agendar o hotfix D7 via SOP Hotfix Produção (fluxo TU → `@dev` → `@devops`) **em paralelo com o arranque do Epic 5**, ou se o despriorizou conscientemente. A5 fica **fechada quando o Eurico confirmar agendado ou despriorizado** — não é bloqueador do Epic 5.

## 9. Quality gates do epic

Trace PRD §10 Epic 5: "Epic 1 + escolha definitiva de markdown editor".

| Gate | Detalhe |
|------|---------|
| Pré-requisito | Epic 1 consolidado em main — SATISFEITO |
| **Escolha definitiva de markdown editor** | **SATISFEITO ANTECIPADAMENTE pela ADR-3** (Tiptap 2.x, não Lexical) — o quality gate do PRD §10 está fechado antes de o epic começar. Não há decisão de editor por tomar; a 5.2 integra o editor já escolhido. |
| Por story | lint + typecheck + test + CodeRabbit (CRITICAL bloqueia — NFR18) |
| Teste de componente | A3 (`react-component-test-criteria.md`): vista diário+heatmap mood (5.3), editor (5.2) e UI de aprovação brain dump (5.8) com ≥3 estados de render → teste de componente obrigatório, verificado no gate antes do CR. |
| Mock fidelity | A1 Epic 1 (`mock-protocol-fidelity.md`): mocks das respostas AI (parser brain dump 5.7, estrutura diário 5.4, pesquisa web 5.11) reflectem o protocolo real da API Anthropic, com ≥1 teste que falharia se o shape divergisse. |
| Estado distribuído | A1 Epic 4 (`internal-state-contract-gate.md`): a 5.8 (brain dump approval flow) faz análise de ciclo de vida do estado proposto→aceite/rejeitado→persistido no gate `@architect`. |
| Cobertura | NFR17: ≥60% em packages core. Lógica de pesquisa/parsing/threshold em helpers puros `lib/diario/**`, `lib/conhecimento/**`, `lib/shared/web-search-ddg.ts` testados ~100% (padrão Epics 3/4). |
| AC2 performance | AC2 do epic exige brain dump de 200 palavras estruturado em < 8s — verificar latência no gate da 5.7 (alinha com NFR1 p95 < 6s para multi-intent; o brain dump é mais pesado, daí 8s). |

## 10. Próximo passo

**Epic 5 EM CURSO — 3/13 stories DONE (5.1 Schema + 5.2 Editor Markdown + 5.3 CRUD Diário/Mood/Heatmap, todas em `main`).** Sucessor natural do Epic 4 (FECHADO 10/10) na ordem PRD §9 (`4 → 5 → 6`). O quality gate principal do PRD §10 ("escolha definitiva de markdown editor") está **satisfeito antecipadamente** pela ADR-3 (Tiptap 2) — o que reduz o risco arquitectural face ao Epic 4 (que introduziu Web Push de raiz). Os GAPs §7 são menos e mais contidos: apenas a pesquisa web (5.11, GAP-5.4) e o domínio das tools (5.13, GAP-5.5) exigem decisão `@architect` no draft; o editor (GAP-5.2) já está decidido.

### Próximas acções na sequência

1. **`@sm` (River)** — `*draft 5.1` (Schema diário/brain-dump/conhecimento) — pré-requisito de todas as outras. Verifica em código real (não assume) a versão Dexie actual em main pós-Epic-4 (GAP-5.1) e aplica a convenção de cascata da 4.1.
2. **`@po` (Pax)** — `*validate-story-draft 5.1` (10-point checklist).
3. **`@data-engineer` (Dara)** — `*develop 5.1` com gate `@architect` (Aria).
4. **`@architect` (Aria)** — envolvida cedo no draft das stories de risco (5.7 parser AI, 5.8 approval flow, 5.11 pesquisa web, 5.12 fluxo multi-passo, 5.13 tools) para resolver `[GAP-5.3]`, `[GAP-5.4]`, `[GAP-5.5]` antes da implementação. **Padrão de Architect Gate de entrada** (lição positiva 4.8 §5.6) recomendado para a 5.11 (1.º fetch externo) e 5.8 (estado distribuído).
5. **`@pm` (Morgan) + `@po` (Pax)** — agendar a **story técnica de housekeeping** (4 débitos finanças + D6) em paralelo com o Epic 5 (decisão A4 §8) — não-bloqueador do arranque.
6. **Eurico + `@devops`** — confirmar destino do **D7** (A5 §8): agendar hotfix via SOP Hotfix Produção ou despriorizar — não-bloqueador do Epic 5.

### Sequência sugerida (não rígida — `@sm`/`@po` confirmam paralelizabilidade)

- **5.1** (schema) → pré-requisito de todas. Bloqueante. Aplica convenção de cascata.
- **5.2** (editor markdown Tiptap) → pré-requisito de 5.3, 5.6, 5.9 (os 3 consumidores do editor). Pode arrancar cedo, em paralelo com 5.1.
- **5.3** (diário + mood + heatmap) → depende de 5.1 + 5.2.
- **5.4** (diário AI estrutura), **5.5** (pesquisa full-text diário) → dependem de 5.3.
- **5.6** (brain dump UI) → depende de 5.2; **5.7** (parser AI) → depende de 5.6; **5.8** (approval flow) → depende de 5.7.
- **5.9** (CRUD áreas/cadernos/notas) → depende de 5.1 + 5.2; **5.10** (pesquisa full-text conhecimento) → depende de 5.9.
- **5.11** (pesquisa web) → independente dos CRUDs; pode arrancar cedo (precisa de `@architect` — GAP-5.4); **5.12** (cérebro pesquisa+cria nota) → depende de 5.9 + 5.11.
- **5.13** (tools cérebro) → depende dos CRUDs (5.3/5.9) e dos fluxos AI (5.7/5.11) estarem disponíveis.

> Os 3 sub-módulos (Diário 5.3-5.5, Brain Dump 5.6-5.8, Conhecimento 5.9-5.12) são largamente independentes entre si depois da fundação (5.1 + 5.2) — paralelizáveis se `@sm` criar stories independentes (precedente Epics 2/3 paralelos).

### Riscos do Epic 5

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| R1 | **Custo de tokens dispara** com pesquisa web + parsing AI do brain dump + estruturação do diário (PRD §11 R2) | Média | Médio | Cache de resultados; brain dump e estruturação de diário são acções explícitas do utilizador (não automáticas); rate limit. Pesquisa web tenta Anthropic primeiro, DuckDuckGo (gratuito) como fallback. |
| R2 | **DuckDuckGo HTML scraping frágil** (`[GAP-5.4]`) — HTML muda, rate limit, bloqueio | Média | Médio | `@architect` define tratamento de falha robusto na 5.11; Anthropic web search é o caminho preferido, DuckDuckGo é fallback. Falha não pode silenciar (lição Epic 4 §5.1). |
| R3 | **Mock do parser AI diverge do protocolo real** (A1 `mock-protocol-fidelity.md`) — tests passam, brain dump/diário falham em produção | Média | Médio | `mock-protocol-fidelity.md` — mock reflecte o shape real da resposta Sonnet; ≥1 teste que falharia se o protocolo divergisse (5.4/5.7/5.11). |
| R4 | **Brain dump approval flow tem caminho de estado não tratado** (`internal-state-contract-gate.md`) — item aprovado cuja entidade-alvo já não existe; falha a meio de batch | Baixa | Médio | Gate `@architect` da 5.8 faz análise de ciclo de vida do estado proposto→persistido (§8). Superfície menor que a 4.9. |
| R5 | **Serialização markdown Tiptap ↔ Dexie** (`[GAP-5.2]`) — JSON vs markdown, formatação perdida no round-trip (AC1) | Baixa | Médio | Tiptap suporta ambos out-of-box (arch §4.3); `@architect` confirma a escolha no draft da 5.2; AC1 (formatação preservada) testado no round-trip. |
| R6 | Vista diário+heatmap (5.3), editor (5.2), aprovação brain dump (5.8) geram findings CR de a11y/teste (padrão 3.9) | Média | Baixo — iterações CR extra | A3 (`react-component-test-criteria.md`) + checklist a11y reforçado no gate — apanhar antes do CR. |

---

*Epic 5 preparado por Morgan (`@pm`) em 07/06/2026. Ancorado em `PRD-NEXUS-V2.md` §6.8 + §6.9 + §6.10 + §9 + §10 Epic 5, `architecture-v2.md` (ADR-3 Tiptap + §4.3 + §16 pontos críticos Epic 5 + §17 pacotes), e Retrospectivas Epic 1 (A1/A2/A6), Epic 2 (A1/A2/A4), Epic 3 (A1-A7) e Epic 4 (A1-A7). Decisões A4 (backlog de débitos Baixa) e A5 (estado do D7) da Retrospectiva Epic 4 registadas na §8. Zero invenção — cada FR, story e AC traça a uma secção do PRD; os 5 GAPs (`[GAP-5.1]` a `[GAP-5.5]`) estão explicitamente marcados para o draft, sendo o GAP-5.2 (editor) já fechado pela ADR-3.*
