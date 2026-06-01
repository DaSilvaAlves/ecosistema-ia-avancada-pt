# Epic 4 — Hábitos + Metas + Lembretes

> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Criado por:** Morgan (`@pm`) em 29/05/2026
> **Estado:** EM CURSO — 5/10 stories Done (4.1 schema/DAL, 4.2 CRUD hábitos, 4.3 heatmap calendário, 4.4 métricas por hábito, 4.6 CRUD lembretes). Próxima: 4.5 (CRUD metas) / 4.7 (setup Web Push — maior risco arquitectural) — ambas desbloqueadas.
> **Fonte da verdade:** `PRD-NEXUS-V2.md` §6.4 (Hábitos, FR24-28), §6.6 (Lembretes, FR33-38), §6.7 (Metas, FR39-41), §9 (roadmap), §10 Epic 4 — Constitution Artigo IV (No Invention): cada story, FR e AC abaixo traça ao PRD
> **Arquitectura:** `architecture-v2.md` (5 ADRs — não reabrir, ver `project_nexus_v2_architecture.md`). Epic 4 introduz território arquitectural novo (Web Push + Service Worker) — ver §7 (GAPs para o draft).
> **Lições aplicadas:** Retrospectiva Epic 1 (A1/A2/A6), Epic 2 (A1/A2/A4) e Epic 3 (A1-A7). Regras novas do Epic 3: `react-component-test-criteria.md` (A3) + `external-contract-identifiers.md` (A4) aplicadas preventivamente neste epic.

---

## 1. Goal

CRUD de hábitos, metas e lembretes com recorrência configurável, heatmap calendário estilo GitHub por hábito, progress bar + milestones por meta, e **notificações Web Push** disparadas no horário marcado (com botões "marcar feito" e "snooze" accionáveis sem abrir a app). Tools do cérebro multi-intent integradas para os três domínios. Trace: PRD §9 (linha "Epic 4 — Hábitos + Metas + Lembretes") + §10 Epic 4.

## 2. Contexto e posicionamento

| Dimensão | Detalhe |
|----------|---------|
| Continuidade | Os lembretes Web Push (FR34/FR36) são o primeiro mecanismo do Nexus que **alcança o utilizador fora da app** — alinhado à visão "overnight agent / antecipação" (`project_nexus_vision.md`). O hábito com heatmap (FR26) e a meta com milestones (FR40) são instrumentos de continuidade pessoal de médio/longo prazo, não dashboards de notícias. |
| Base Epic 1 | O cérebro multi-intent + Tool Registry (Epic 1, em `main` @ `5514b310`) é onde as 9 tools de hábitos/metas/lembretes (FR28+FR41+FR38) se registam. A story de tools (4.10) povoa o registry com os domínios `habits`, `goals`, `reminders` (precedente: Story 2.10 registou `tasks`/`projects`; Story 3.11 registou `finance`). |
| Reuso do motor de recorrência | FR33 (lembretes) usa recorrência "igual a tarefas"; FR24 (hábitos) tem frequência configurável (diária, X×/semana, dias específicos). O motor `runRecurrenceEngine` genérico por `ownerType` (Story 2.7, estendido no Epic 3 com `runFinanceRecurrenceEngine`) é reutilizado — não se cria motor novo. Ver §7. |
| Território novo: Web Push | Pela 1.ª vez o epic introduz um contrato externo de protocolo (Web Push API + VAPID) e um Service Worker. Isto exige decisão arquitectural (`@architect`) e gestão de secrets (`@devops`) — ver §7 GAPs e §8 riscos. É o análogo do que o Epic 6 fará com OAuth. |
| Independência | PRD §9 ordem `0 → 1 → (2 \|\| 3) → 4 → 5 → ...`. Epic 4 depende do Epic 1 (tool registry/cérebro) e reutiliza o motor de recorrência do Epic 2 (Story 2.7). Epics 2 e 3 estão DONE em main — todas as dependências satisfeitas. |

## 3. Dependências

| Relação | Epic / Story | Estado |
|---------|--------------|--------|
| Depende de | Epic 1 (Cérebro Multi-Intent — Tool Registry, classifier, executor) | DONE — 10/10 em main (`5514b310`) |
| Reutiliza (não-bloqueante) | Epic 2 Story 2.7 (motor de recorrência genérico `runRecurrenceEngine` por `ownerType`) + ADR-2.7-1 (activação one-shot on-mount) | DONE — em main (`d977ade1`) |
| Reutiliza (padrão) | Epic 3 — padrão "helper puro em `lib/**` + modal/lista fina + tab strip"; padrão "atomicidade no repo" (`db.transaction('rw', ...)`) | DONE — em main |
| Precede | Epic 6 (Telegram) — FR37 (lembrete via Telegram) fica **parcial** no Epic 4 (só Web Push); a entrega via Telegram bot é FR70/Epic 6 | Não iniciado |
| Antecipa parcialmente | Epic 8 Story 8.3 (Service Worker registro + cache strategy completa) — o Epic 4 introduz um SW mínimo para push; o Epic 8 estende-o | Não iniciado |

Ordem PRD §9: `0 → 1 → (2 || 3) → 4 → 5 → 6 → 7 → 8`.

## 4. Functional Requirements cobertos

Trace directo a `PRD-NEXUS-V2.md` §6.4, §6.6, §6.7. 14 FRs no total.

### Hábitos (§6.4)

| FR | Descrição (PRD §6.4) | Stories |
|----|----------------------|---------|
| FR24 | CRUD de hábitos: nome, frequência (diária, X×/semana, dias específicos), categoria, horário opcional | 4.1, 4.2 |
| FR25 | Registo diário de hábito concluído (check manual ou via cérebro) | 4.2, 4.10 |
| FR26 | Heatmap calendário (estilo GitHub contributions) por hábito, últimos 6 meses | 4.3 |
| FR27 | Hábitos com métricas (km, páginas, peso): registar valor + ver evolução mensal e recordes | 4.4 |
| FR28 | Tools cérebro: `criar_habito`, `registar_habito_concluido`, `consultar_evolucao_habito` | 4.10 |

### Lembretes (§6.6)

| FR | Descrição (PRD §6.6) | Stories |
|----|----------------------|---------|
| FR33 | CRUD lembretes: texto, horário, recorrência opcional (igual a tarefas) | 4.6 |
| FR34 | Notificação Web Push disparada no horário marcado | 4.7, 4.8 |
| FR35 | Subscrição Web Push pedida no onboarding (utilizador autoriza) | 4.7 |
| FR36 | Notificação contém texto + botão "marcar feito" + botão "snooze 10min" | 4.9 |
| FR37 | (parcial) Lembretes via Telegram bot — **só a parte Web Push entra no Epic 4**; Telegram é FR70/Epic 6 | — (Epic 6) |
| FR38 | Tools cérebro: `criar_lembrete`, `listar_lembretes`, `cancelar_lembrete` | 4.10 |

### Metas (§6.7)

| FR | Descrição (PRD §6.7) | Stories |
|----|----------------------|---------|
| FR39 | CRUD metas: título, descrição, prazo, métrica (numérica/booleana), valor target, valor actual, milestones opcionais | 4.1, 4.5 |
| FR40 | Vista meta: progress bar + histórico de updates + milestones | 4.5 |
| FR41 | Tools cérebro: `criar_meta`, `actualizar_meta`, `consultar_metas` | 4.10 |

## 5. Stories (10) — trace PRD §10 Epic 4

> **Decomposição directa das "Stories sugeridas" do PRD §10 Epic 4 (4.1 a 4.10)** — nenhuma story inventada nem omitida face ao PRD. Os pares executor/quality-gate são **previsões** (Quality-First Planning) e respeitam `executor != quality_gate` (`separation-of-roles.md`). `@sm` (River) finaliza a atribuição em cada story draft; `@po` (Pax) valida.

| # | Story | Descrição | FR | Executor previsto | Quality gate previsto | Estado |
|---|-------|-----------|-----|-------------------|------------------------|--------|
| 4.1 | Schema hábitos/metas/lembretes | Schema Dexie `habits`, `habit_logs`, `goals`, `goal_milestones`, `reminders` (`version(N)` aditivo) — estende o schema dos Epics 1/2/3. Define a **convenção de delete-cascata** das relações pai-filho (ver §8 decisão A7/D6) | FR24, FR27, FR39 | `@data-engineer` | `@architect` | **DONE** — PR #41 merged `aa74ce56` (29/05). EMBEBIDO ratificado, sem `version(5)`. Convenção cascata fixada (composição→cascade, hard-delete; corolário D6 = `Task.projectId` set null) |
| 4.2 | CRUD hábitos | CRUD de hábitos com frequência configurável (diária, X×/semana, dias específicos), categoria, horário opcional + registo diário de concluído. **Absorveu a extracção de UI partilhada (`FormField` D-3.5-3 + `TabStrip` roving tabindex D-3.5-2) — §8 decisão A6** | FR24, FR25 | `@dev` | `@qa` | **DONE** — PR #42 merged `d0e14160` (29/05). `archivedAt?` + `archiveHabit`/`restoreHabit` (D-RESTORE via `.modify(delete)` ratificada); `FormField`+`TabStrip` partilhados criados; rota `/habitos`. CR 3 iter (Iter 3 autorizada Eurico), No findings, zero waivers, Vitest 1074/1074 |
| 4.3 | Heatmap calendário | Heatmap estilo GitHub contributions por hábito, últimos 6 meses. **Componente com múltiplos estados de render → teste de componente obrigatório (`react-component-test-criteria.md`)** | FR26 | `@ux-design-expert` | `@dev` | **DONE** — PR #43 merged `1be785a3` (30/05). Helper puro UTC `lib/habitos/heatmap.ts` (1.º de `lib/habitos/`) + `HabitHeatmap`/`HabitHeatmapModal`; CR Iter 1 6 Minor (0 CRITICAL), 0 waivers; PO Validation GO 10/10 + @dev gate PASS; vitest 1101/1101 |
| 4.4 | Métricas por hábito | Hábitos com métrica opcional (km, páginas, peso): registar valor + evolução mensal + recordes. Lógica de agregação/recordes em helper puro (`lib/habitos/**`) | FR27 | `@dev` | `@qa` | **DONE** — PR #50 merged `192b488c` (01/06). Helper puro `lib/habitos/metrics.ts` (evolução mensal + recordes); `HabitMetricsModal` + `HabitMonthlyChart`; intensidade heatmap por valor de métrica. Vitest verde, CI 100% verde, zero waivers |
| 4.5 | CRUD metas + vista | CRUD metas (título, prazo, métrica numérica/booleana, target, actual, milestones) + vista com progress bar + histórico + milestones | FR39, FR40 | `@ux-design-expert` | `@dev` | Pendente (desbloqueada por 4.1) |
| 4.6 | CRUD lembretes | CRUD lembretes (texto, horário, recorrência opcional) reutilizando a estrutura de recorrência das tarefas (Story 2.7) | FR33 | `@dev` | `@qa` | **DONE** — PR #51 merged `d13a6067` (01/06). UI fina sobre DAL da 4.1 + componentes partilhados da 4.2: `ReminderFormModal` (create/edit, `datetime-local` fireAt + RRULE opcional), `RemindersList` (4 estados, variant pending/cancelled), página `/lembretes` (TabStrip Pendentes/Cancelados); recorrência via `createRecurrence(ownerType:'reminder')` sem activar motor (é a 4.8). QA gate PASS 100/100, CI 100% verde, CR 0 findings, Vitest 1198/1198, zero waivers |
| 4.7 | Setup Web Push | VAPID keys (self-generated), fluxo de subscrição no browser (FR35), endpoint `/api/push/send`. **GAP arquitectural: Edge vs Node runtime; secrets VAPID — ver §7** | FR34, FR35 | `@dev` | `@architect` | Pendente |
| 4.8 | Agendamento client de push | Ao primeiro carregamento do dia, regista os próximos lembretes a disparar (reutiliza padrão ADR-2.7-1 one-shot on-mount). **GAP: como garantir disparo às 15h ±60s com app possivelmente fechada — ver §7** | FR34 | `@dev` | `@architect` | Pendente (depende de 4.6+4.7) |
| 4.9 | Service Worker push handler | SW handler de push notifications: mostra notificação + botões "marcar feito"/"snooze 10min" accionáveis sem abrir a app (FR36). **GAP: SW mínimo no Epic 4 vs SW completo no Epic 8 (story 8.3) — ver §7** | FR36 | `@dev` | `@architect` | Pendente (depende de 4.7) |
| 4.10 | Tools cérebro | Registar 9 tools no Tool Registry (nomes ASCII validados — ver §4 e nota abaixo): `criar_habito`, `registar_habito_concluido`, `consultar_evolucao_habito`, `criar_meta`, `actualizar_meta`, `consultar_metas`, `criar_lembrete`, `listar_lembretes`, `cancelar_lembrete` | FR28, FR41, FR38 | `@dev` | `@architect` | Pendente (depende dos CRUDs) |

> **Padrão de gate herdado dos Epics 2/3:** schema → gate `@architect`; UI → executor `@ux-design-expert`, gate `@dev`; lógica de domínio/backend/cálculo → gate `@architect` ou `@qa`. As stories de Web Push (4.7/4.8/4.9) têm gate `@architect` por serem território arquitectural novo (contrato externo).

> **Nota A4 (`external-contract-identifiers.md`) — validação preventiva dos nomes de tools:** ao contrário das tools de finanças (FR23, que vinham com cedilha no PRD e foram rejeitadas pelo `TOOL_NAME_PATTERN` na Story 3.11), os 9 nomes de tools do PRD §10 Epic 4 **já estão em ASCII** (`criar_habito`, `consultar_evolucao_habito`, etc. — sem acentos nem cedilha). Validados contra `TOOL_NAME_PATTERN` (`[a-z0-9_]`) + Anthropic tool spec **no draft deste epic**, não na implementação. A grafia humana PT-PT ("hábito", "evolução") vive na camada semântica do LLM (DEV-DECISION D-FUZZY, precedente Story 3.11), não no identificador técnico. A Story 4.10 não deve precisar de reconciliação de AC por nomes.

## 6. Acceptance Criteria (nível epic) — trace PRD §10 Epic 4

Cópia fiel dos AC Epic 4 do PRD §10 (linhas 507-510).

| # | Critério | Story principal |
|---|----------|-----------------|
| AC1 | Hábito "leitura diária" registado 30 dias seguidos mostra heatmap correcto | 4.3 |
| AC2 | Lembrete às 15h dispara push notification às 15h (tolerância 60s) | 4.7, 4.8 |
| AC3 | Botão "marcar feito" no push fecha lembrete sem abrir a app | 4.9 |
| AC4 | Cérebro "lembra-me sexta às 10h de pagar a luz" cria lembrete correcto | 4.10 |

## 7. Reconciliação PRD ↔ Arquitectura — GAPs para o draft

> O Epic 4 introduz território arquitectural novo (Web Push + Service Worker). Os pontos abaixo são marcados para resolução por `@architect` no draft das stories respectivas — **não preenchidos com suposição** (Constitution Artigo IV, precedente `[GAP-3.1]` do EPIC-3.md §7). Nenhum dos 5 ADRs base é reaberto.

| Ponto | PRD diz | Arquitectura actual | GAP a resolver no draft |
|-------|---------|---------------------|-------------------------|
| **[GAP-4.1]** Persistência | Story 4.1 "schema habits, habit_logs, goals, goal_milestones, reminders" | ADR-2: Dexie 4 IndexedDB desde dia 1 | Story 4.1 cria 5 tabelas Dexie `version(N)` aditivo (precedente: 3.1 fez `version(3)`/`version(4)`). Confirmar próximo número de versão livre e que o upgrade path dos dados de produção do Eurico é preservado (não reescrever versões anteriores). |
| **[GAP-4.2]** Recorrência de lembretes/hábitos | FR33 "recorrência igual a tarefas"; FR24 "frequência diária/X×semana/dias específicos" | Motor `runRecurrenceEngine` genérico por `ownerType` (Story 2.7) | Stories 4.2/4.6 reutilizam o motor com `ownerType: 'reminder'`/`'habit'` (ou equivalente). Confirmar no draft da 4.1 se a frequência de hábitos (X×/semana, dias específicos) encaixa no modelo de recorrência existente ou exige extensão. Não reimplementar lógica de recorrência. |
| **[GAP-4.3]** `/api/push/send` runtime | Story 4.7 "endpoint `/api/push/send`" | ADR-1: split Edge/Node (Edge para streaming, Node para libs pesadas) | A biblioteca `web-push` (envio com VAPID) **não corre em Edge runtime**. `@architect` decide no draft da 4.7: endpoint em Node runtime explícito (`export const runtime = 'nodejs'`). Confirmar compatibilidade com o deploy Vercel actual. |
| **[GAP-4.4]** VAPID keys / secrets | Story 4.7 "VAPID keys self-generated"; PRD linha 338 "VAPID self-generated, zero custos" | Sem gestão de secrets de push actual | `@devops` (Gage) gera o par VAPID e configura como secret (`.env` local + Vercel env). A chave pública vai para o cliente (subscrição); a privada só no servidor (`/api/push/send`). Nunca commitar a chave privada. |
| **[GAP-4.5]** Service Worker | Story 4.9 "SW handler de push"; NFR21 + Story 8.3 "SW registro + cache strategy" (Epic 8) | Não há SW completo ainda (Epic 8) | Tensão: o Epic 4 precisa de um SW para receber push, mas o SW completo (cache strategy) é Epic 8. `@architect` decide no draft da 4.9: SW mínimo focado em `push`/`notificationclick` no Epic 4, estendido com cache strategy no Epic 8. Confirmar que não colide com o registo de SW que o Epic 8 fará. |
| **[GAP-4.6]** Disparo às 15h ±60s com app fechada | AC2 "push às 15h ±60s"; Story 4.8 "cron client ao 1.º carregamento do dia" | ADR-2.7-1: activação one-shot on-mount (corre só com a app aberta) | **Ponto crítico:** um "cron client on-mount" só corre com a app aberta — não garante disparo às 15h se a app estiver fechada. `@architect` decide no draft da 4.8 a estratégia real de agendamento (ex: agendamento server-side do push, ou `setTimeout` no SW, ou serviço de scheduling). AC2 (±60s com app fechada) é o critério que força esta decisão. Não assumir que o padrão on-mount do Epic 3 chega. |

## 8. Qualidade e processo — lições das Retrospectivas Epic 1/2/3

| Acção / lição | Aplicação no Epic 4 |
|---------------|---------------------|
| **A3 Epic 3 — `react-component-test-criteria.md`** | Aplicada preventivamente. O heatmap (4.3) e a vista de meta com progress bar (4.5) têm múltiplos estados de render (loading/empty/content/dias-preenchidos vs vazios/meta-completa vs em-progresso) → **teste de componente obrigatório**, contado no gate ANTES do CodeRabbit. Resolve de raiz a inconsistência 3.6 vs 3.9. |
| **A4 Epic 3 — `external-contract-identifiers.md`** | Aplicada. Os 9 nomes de tools (4.10) validados ASCII no draft do epic (ver nota §5). Adicionalmente, o Web Push introduz contratos externos (nomes de eventos SW `push`/`notificationclick`, formato do payload de notificação, acções `marcar-feito`/`snooze`) — `@architect`/`@dev` validam-nos contra a Web Push spec no draft das 4.7/4.9. |
| **A6 Epic 1 — `separation-of-roles.md`** | Aplicada na tabela §5 — nenhum executor é o seu próprio quality gate. |
| **A1 Epic 2 — checklist a11y reforçado no QA Gate** | Stories de UI (4.2, 4.3, 4.5) passam pelo checklist a11y (navegação teclado, roving tabindex, aria-live para progress, não-só-cor no heatmap). |
| **A1 Epic 3 — afinar `.coderabbit.yaml`** | `@devops` (Gage) executa A1 ANTES do Epic 4 (reduzir findings CR de nitpick em teste/doc). Meta: 1.ª story de UI do Epic 4 fecha em ≤2 iter CR. |
| **A5 Epic 3 — convenção de contagem de testes** | Stories do Epic 4 não mantêm contagens exactas de testes em headers/File List — só no Change Log/Dev Record como snapshot datado (`story-lifecycle.md`). |
| **A1 Epic 1 — `mock-protocol-fidelity.md`** | **Crítico no Epic 4.** O Web Push tem protocolo externo real (push subscription, encriptação payload, eventos SW). Qualquer mock do fluxo de push deve reflectir o protocolo real Web Push, não apenas fazer os tests passar. É o primeiro epic onde A1 se aplica plenamente (a par do Epic 6/OAuth). |
| Alvo de waiver rate | Epic 3 fechou 1/11 (9,1%). **Alvo Epic 4: <2/10**, meta interna 0% (igualar Epic 2). |
| Hard-stop QA loop | Máximo 2 iterações de `qa-loop-fix`/CR por story; Iter 3 ou merge waived exigem autorização humana explícita do Eurico no commit. Mantido dos Epics 1/2/3. |

### Decisão A6 (Retrospectiva Epic 3) — destino dos 6 débitos Baixa do Epic 3

A Retrospectiva Epic 3 (acção A6) atribuiu a `@pm` + `@po` a decisão do destino dos 6 débitos Baixa abertos do Epic 3, no arranque do Epic 4. Decisão de `@pm` (Morgan) — `@po` (Pax) valida no draft das stories afectadas:

| Débito | Decisão | Racional |
|--------|---------|----------|
| **D-3.5-3** (FormField + inputStyle duplicados nos modais) e **D-3.5-2** (tab strip sem roving tabindex) | **ABSORVIDOS pela Story 4.2** (1.º CRUD do Epic 4), como extracção de componentes de UI partilhados (`components/ui/FormField.tsx` + tab strip acessível) ANTES de criar os novos modais/tab strips de hábitos/metas/lembretes. | Não é "housekeeping de finanças forçado no Epic 4" — é fundação de UI partilhada que o Epic 4 **genuinamente reutiliza**. Resolver agora evita propagar o débito aos novos modais (4.2/4.5/4.6) e tab strips. Pagar de caminho D-3.5-2/3 é eficiente e in-scope. |
| **D-3.3-1** (error inerte), **D-3.4-1** (teste cascata — verificar se T7b já fechou), **D-3.4-2** (copy "Tarefa recorrente"), **D-3.5-1** (referências órfãs conta/cartão) | **MANTÊM-SE em backlog** como candidatos a story técnica de housekeeping de **finanças** dedicada. NÃO entram no Epic 4. | São específicos do domínio finanças (FR16-23) — o Epic 4 não toca esse código. Forçá-los no Epic 4 violaria coerência de domínio (mesma lógica que manteve D6/D7 fora do Epic 3). D-3.4-1 deve ser verificado: a Story 3.4 CR Iter 1 pode tê-lo fechado com o teste T7b. |

**Síntese A6:** 2 dos 6 débitos (D-3.5-2, D-3.5-3) são absorvidos pela Story 4.2 por serem fundação de UI partilhada que o Epic 4 reutiliza. Os outros 4 são de finanças e ficam em backlog para story técnica dedicada de housekeeping de finanças (a agendar fora do Epic 4).

### Decisão A7 (Retrospectiva Epic 3) — débitos Média D6 e D7 herdados do Epic 2

| Débito | Decisão | Racional |
|--------|---------|----------|
| **D6** — Delete projecto com cascata `Task.projectId` (set null vs bloquear vs cascade) | **FORA-DE-SCOPE do Epic 4 como item**, MAS o Epic 4 **define a convenção de delete-cascata** para as suas próprias relações pai-filho (`goals → goal_milestones`, `habits → habit_logs`) na Story 4.1. Essa convenção passa a ser a referência para resolver D6 numa story técnica dedicada pós-Epic-4. | O Epic 4 não toca código de projectos/tarefas (Epic 2), logo não absorve D6 directamente. Mas levanta a MESMA questão de política de cascata para entidades novas — decidi-la uma vez no Epic 4 e aplicá-la retroactivamente a D6 é coerente e evita decisão ad-hoc. |
| **D7** — Fallback de intent vazio em PT-BR no classifier (UX visível em produção) | **FORA-DE-SCOPE do Epic 4** (domínio classifier/Epic 1, não hábitos/metas/lembretes). **DECIDIDO: hotfix dedicado** (Eurico, 29/05/2026 — SOP Hotfix Produção `reference_sop_hotfix_producao.md`). Resolução da acção A3 da Retrospectiva Epic 2 + A7 da Epic 3. | D7 é UX visível na 1.ª interacção em produção (`https://imersao.ia.expressia.pt`); não deve ficar indefinidamente em backlog. O Epic 4 não é o veículo — D7 é do classifier. O caminho rápido é o SOP Hotfix, independente do ciclo de epics. |

**Síntese A7:** nem D6 nem D7 são absorvidos pelo Epic 4. D6 → story técnica dedicada pós-Epic-4, usando a convenção de cascata que a Story 4.1 fixar. D7 → **hotfix dedicado** (decisão do Eurico em 29/05/2026; A7 fechada) — fluxo TU → `@dev` → `@devops` do SOP Hotfix Produção.

## 9. Quality gates do epic

Trace PRD §10 Epic 4: "Epic 1 + teste manual push em Chrome + Edge".

| Gate | Detalhe |
|------|---------|
| Pré-requisito | Epic 1 consolidado em main — SATISFEITO |
| Por story | lint + typecheck + test + CodeRabbit (CRITICAL bloqueia — NFR18) |
| Teste manual de push | AC2/AC3 exigem teste manual real em **Chrome + Edge** (PRD §10): subscrição → lembrete às 15h → push dispara ±60s → "marcar feito" fecha sem abrir app. Não é automatizável de forma fiável — verificação manual obrigatória no gate das stories 4.7/4.8/4.9. |
| Teste de componente | A3 (`react-component-test-criteria.md`): heatmap (4.3) e vista meta (4.5) com ≥3 estados de render → teste de componente obrigatório, verificado no gate antes do CR. |
| Cobertura | NFR17: ≥60% em packages core. Lógica de heatmap/recordes/agregação em helpers puros `lib/habitos/**`, `lib/metas/**` testados ~100% (padrão Epic 3). |
| Mock fidelity | A1 (`mock-protocol-fidelity.md`): mocks do fluxo Web Push reflectem o protocolo real (subscription, payload, eventos SW), com ≥1 teste que falharia se o protocolo divergisse. |

## 10. Próximo passo

**Epic 4 EM CURSO — 5/10 stories Done (4.1, 4.2, 4.3, 4.4, 4.6).** As Stories 4.1 (schema/DAL, PR #41 merge `aa74ce56`), 4.2 (CRUD hábitos, PR #42), 4.3 (heatmap calendário), 4.4 (métricas por hábito, PR #50 merge `192b488c`) e 4.6 (CRUD lembretes, PR #51 merge `d13a6067`) estão DONE em `main`. Restam 5 stories: 4.5 (CRUD metas), 4.7 (setup Web Push — maior risco arquitectural), 4.8 (agendamento push), 4.9 (SW push handler) e 4.10 (tools cérebro). **Próxima sugerida: 4.5 / 4.7** — ambas desbloqueadas. As decisões arquitecturais da 4.1 estão fixadas: `goal_milestones` EMBEBIDO (sem `version(5)`); convenção de delete-cascata = *cascade nos filhos sem vida própria (composição); set null nas referências a entidades com vida própria (associação)*; hard-delete; corolário D6 (`Task.projectId` → set null) ratificado como referência para a story técnica pós-Epic-4.

### Orientação herdada da 4.1 para a Story 4.2 (CRUD hábitos) — REGISTADA

A Story 4.2 deve absorver, além do CRUD de hábitos:

1. **"Arquivar/desactivar hábito" como acção distinta de "apagar"** — orientação não-bloqueadora do Architect Gate da 4.1 (Aria, secção Architect Gate Design Checkpoint da 4.1, ~linha 276). A 4.1 implementou o `deleteHabit` com **cascade** dos `habit_logs` (delete real); o caso de uso "parar um hábito sem perder histórico" resolve-se com **archive/estado**, não com soft-delete genérico. A 4.2 oferece archive (estado) como acção separada do delete (cascade).
2. **Débito D-3.5-3** (FormField + inputStyle duplicados) — extrair `components/ui/FormField.tsx` partilhado ANTES de criar o modal de hábitos (decisão A6, §8).
3. **Débito D-3.5-2** (tab strip sem roving tabindex) — extrair tab strip acessível com roving tabindex ANTES de criar a tab strip de hábitos/metas/lembretes (decisão A6, §8).

> Trace: 4.1 Architect Gate (orientação archive na 4.2) + §8 decisão A6 (D-3.5-2/3 absorvidos pela 4.2).

### Próximas acções na sequência

1. **`@sm` (River)** — `*draft` da próxima story: **4.5 (CRUD metas)** ou **4.6 (CRUD lembretes)** (ambas reutilizam a UI partilhada já extraída pela 4.2), ou **4.7 (setup Web Push)** para desbloquear cedo o caminho de maior risco. A orientação herdada acima (archive + D-3.5-2/3, decisão A6) já foi absorvida e realizada pela 4.2.
2. **`@devops` (Gage)** — executa **[GAP-4.4]** (gerar par VAPID + configurar secret) quando a Story 4.7 arrancar. A1 (afinar `.coderabbit.yaml`) já não bloqueia — as stories de UI 4.2/4.3/4.4 estão fechadas.
3. **Eurico** — **A7/D7 DECIDIDO** (29/05/2026): hotfix dedicado via SOP Hotfix Produção. Agendar o hotfix do fallback de intent PT-BR do classifier independentemente do Epic 4.
4. **`@architect` (Aria)** — envolvida cedo no draft das stories de Web Push (4.7/4.8/4.9) para resolver `[GAP-4.3]`, `[GAP-4.5]`, `[GAP-4.6]` antes da implementação.

### Sequência sugerida (não rígida — `@sm`/`@po` confirmam paralelizabilidade)

- **4.1** (schema) → pré-requisito de todas. Bloqueante. Fixa convenção de cascata.
- **4.2** (CRUD hábitos) → depende de 4.1; absorve a extracção de UI partilhada (A6).
- **4.3** (heatmap), **4.4** (métricas) → dependem de 4.2.
- **4.5** (CRUD metas) e **4.6** (CRUD lembretes) → dependem de 4.1; reutilizam a UI partilhada da 4.2.
- **4.7** (setup Web Push) → independente do CRUD; pode arrancar cedo em paralelo (precisa de `@architect` + VAPID do `@devops`).
- **4.8** (agendamento push) → depende de 4.6 (lembretes) + 4.7 (infra push).
- **4.9** (SW push handler) → depende de 4.7.
- **4.10** (tools cérebro) → depende dos CRUDs (4.2/4.5/4.6) estarem disponíveis.

> Web Push (4.7/4.8/4.9) é o caminho de maior risco arquitectural — recomenda-se arrancar a 4.7 cedo, em paralelo com os CRUDs, para desbloquear os GAPs §7 sem atrasar o epic.

### Riscos do Epic 4

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| R1 | **Disparo de push às 15h ±60s com app fechada** (`[GAP-4.6]`) — o padrão "cron client on-mount" do Epic 3 só corre com a app aberta; não garante AC2 | Alta | Alto — AC2 é critério de aceitação do epic | `@architect` decide a estratégia real de agendamento no draft da 4.8 (server-side scheduling, SW `setTimeout`, ou serviço dedicado). Não assumir o padrão on-mount. Risco a fechar ANTES de implementar 4.8. |
| R2 | **`web-push` em Edge runtime** (`[GAP-4.3]`) — a lib de envio VAPID não corre em Edge; `/api/push/send` pode falhar no deploy | Média | Médio | `@architect` força Node runtime explícito na 4.7. Confirmar no deploy Vercel antes de fechar a story. |
| R3 | **SW do Epic 4 colide com o SW do Epic 8** (`[GAP-4.5]`) | Média | Médio | `@architect` desenha SW mínimo (só push/notificationclick) com header de extensão previsto para o Epic 8. Documentar a fronteira no draft da 4.9. |
| R4 | **Mock de Web Push diverge do protocolo real** (A1) — tests passam, push falha em produção | Média | Alto — push é a feature central do epic | `mock-protocol-fidelity.md` — cruzar com a Web Push spec; ≥1 teste que falharia se o protocolo divergisse; teste manual real Chrome+Edge no gate (§9). |
| R5 | **Frequência de hábitos (X×/semana, dias específicos) não encaixa no motor de recorrência genérico** (`[GAP-4.2]`) | Média | Médio | Story 4.1 verifica em código (não assume); `@architect` decide extensão vs modelo novo no draft. Reutilizar `runRecurrenceEngine` por `ownerType` se compatível. |
| R6 | Heatmap (4.3) e vista meta (4.5) geram findings CR de a11y/teste não apanhados pelo gate (padrão 3.9) | Média | Baixo — iterações CR extra | A3 (`react-component-test-criteria.md`) + checklist a11y reforçado no gate — apanhar antes do CR. |

---

*Epic 4 preparado por Morgan (`@pm`) em 29/05/2026. Ancorado em `PRD-NEXUS-V2.md` §6.4 + §6.6 + §6.7 + §9 + §10 Epic 4, `architecture-v2.md` (5 ADRs), e Retrospectivas Epic 1 (A1/A2/A6), Epic 2 (A1/A2/A4) e Epic 3 (A1-A7). Decisões A6 (6 débitos Baixa) e A7 (D6/D7) registadas na §8. Zero invenção — cada FR, story e AC traça a uma secção do PRD; os 6 pontos não resolvidos (`[GAP-4.1]` a `[GAP-4.6]`) estão explicitamente marcados para o draft, com destaque para os GAPs de Web Push (4.3/4.5/4.6) que exigem decisão arquitectural antes da implementação.*
