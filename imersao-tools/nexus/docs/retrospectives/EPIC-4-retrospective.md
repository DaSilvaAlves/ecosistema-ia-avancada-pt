# Retrospectiva — Epic 4 Nexus v2 (Hábitos + Metas + Lembretes + Web Push)

> **Autor:** Pax (`@po`) | **Data:** 07/06/2026
> **Projecto:** Nexus v2 (`imersao-tools/nexus/`)
> **Branch consolidação:** `main` (10 stories merged via PRs #41-#58; closure commit `852449c7`)
> **Período:** 29/05/2026 → 06/06/2026 (UTC+1, Lisboa); AC13 da 4.9 validado em produção 07/06/2026
> **Referência de formato:** `retrospectives/EPIC-3-retrospective.md` + `EPIC-2-retrospective.md` + `EPIC-1-retrospective.md`

---

## 1. Sumário executivo

- **10/10 stories Done** em main (4.1 a 4.10) — Epic 4 fechado 100%.
- Cobertura funcional integral: 14 FRs — Hábitos (FR24-28), Lembretes (FR33-36, FR38; FR37 Telegram diferido p/ Epic 6 por design), Metas (FR39-41). Os 4 Epic ACs (§6 do `EPIC-4.md`) satisfeitos — AC2/AC3 (push dispara ±60s + "marcar feito" fecha sem abrir app) validados em produção (Chrome+Edge) pelo Eurico em 07/06; AC4 (cérebro cria lembrete por linguagem natural) coberto pela Story 4.10.
- **Waiver rate final: 0/10 (0%)** — nenhuma story fechou com merge waived. **Iguala o Epic 2** (0%) e bate o alvo `EPIC-4.md` §8 (<2/10) e a meta interna de 0%. Contraste com Epic 3 (1/11) e Epic 1 (5/10).
- **Quality gate PASS first-iter em 9/10 stories** — só a Story 4.9 consumiu iterações de gate AIOX (Architect Gate Aria reabriu 3 vezes: CONCERNS auth → PASS → CHANGES REQUESTED 4 Major snooze → PASS). As restantes 9 passaram o gate AIOX (PO/QA/Architect/`@dev`) à primeira.
- **Território arquitectural novo entregue com sucesso: Web Push completo end-to-end** — subscrição (4.7) → agendamento server-side + dispatch ao minuto via scheduler externo cron-job.org (4.8) → SW handler com display visível + botões accionáveis (4.9). Primeira vez que o Nexus alcança o utilizador fora da app. Os 6 GAPs arquitecturais (`[GAP-4.1]` a `[GAP-4.6]`) foram todos resolvidos por decisão `@architect` no draft, não por suposição.
- **Lição central do epic — gap de validação semântica nos gates internos (Story 4.9):** o CodeRabbit apanhou **4 Major de semântica de snooze** (M1 silent loss; M2/M3 reconciliação re-rotulava lembretes normais como adiados; M4 SW não tratava `!response.ok`) que **a validação `@po` e o Architect Gate Iter 2 PASS deixaram passar** — validaram auth, estrutura e contrato externo, mas não a semântica fina do contrato `pending`/`snooze`. Levou ao D-SNOOZE-CONTRACT (Iter 3) + RF1-RF7 + re-gate Iter 4 PASS. É a acção mais importante desta retrospectiva (A1).
- **9 débitos Baixa herdados do Epic 3 endereçados:** D-3.5-2 (roving tabindex) e D-3.5-3 (FormField partilhado) **pagos** pela Story 4.2 (fundação de UI partilhada reutilizada por 4.5/4.6); os 4 de finanças (D-3.3-1, D-3.4-1/2, D-3.5-1) mantidos em backlog (coerência de domínio). D6/D7 do Epic 2 fora-de-scope (D7 → hotfix dedicado já decidido).
- **Zero débitos de severidade Média/Alta gerados** — mantém o padrão do Epic 3. Apenas débitos Baixa novos (NavLink EN/PT, hardening opcional de secrets, recorrência de série diferida).
- **Vercel production live** continuamente em `https://imersao.ia.expressia.pt`. AC13 só deu em produção (preview do PR sem env vars VAPID) — ver §6.2.

---

## 2. Métricas concretas

### 2.1 — Stories e iterações CodeRabbit

| Métrica | Valor | Observação |
|---------|-------|------------|
| Total stories | 10 | 4.1 → 4.10 |
| Stories first-iter PASS no quality gate AIOX | **9/10** | Só a 4.9 reabriu o gate (Architect Gate 4 iter — ver §5.1) |
| Stories com 0-1 iter CodeRabbit no PR | 6 | 4.1 (1 Minor), 4.3 (Iter 1 + Iter 2 stale), 4.6 (1 minor), 4.7 (Iter 2 APPROVED), 4.8 (1 major falso-positivo), 4.10 (F5) |
| Stories com 2 iter CodeRabbit no PR | 2 | 4.4 (5 minor → 0), 4.5 (F1 major + 2 a11y → 0 scope) |
| Stories com 3 iter CodeRabbit/gate | 1 | **4.2** (CRITICAL classe `time` propagado page→modal; Iter 3 autorizada Eurico) |
| Stories com 4 iter Architect Gate | 1 | **4.9** (CONCERNS→PASS→CHANGES REQUESTED→PASS — ver §5.1) |
| Hard-stop max-2-iter respeitado sem autorização | 9/10 | Só a 4.2 (Iter 3, autorizada por trailer `Authorized-by: Eurico`) e a 4.9 (Iter 3/4 justificadas por Major de produção do CR no PR) ultrapassaram 2 |
| Waiver rate ("merge waived") | **0/10 (0%)** | Nenhuma story fechou via waiver — iguala o Epic 2 |

> **Nota sobre "quality gate" vs "CodeRabbit":** o quality gate AIOX (PO Validation / QA Gate Quinn / Architect Gate Aria / `@dev` gate) é camada distinta das iterações CodeRabbit no PR. Distinção mantida desde a Retrospectiva Epic 1. A particularidade do Epic 4: na Story 4.9 o CodeRabbit (no PR) apanhou Major **depois** de o Architect Gate ter dado PASS (Iter 2) — o que forçou a reabertura do gate (Iter 3). É o sinal central da §5.1.

### 2.2 — Distribuição por story (detalhe)

| Story | Executor → Gate | Gate AIOX | Iter CR (PR) | Resultado | Autorização |
|-------|-----------------|-----------|--------------|-----------|-------------|
| 4.1 — Schema hábitos/metas/lembretes | `@data-engineer` → `@architect` | PASS first-iter | 1 (1 Minor) | Merge limpo | — |
| 4.2 — CRUD hábitos + UI partilhada | `@dev` → `@qa` | PASS first-iter | **3** (CRITICAL classe `time` page→modal) | Merge limpo (Iter 3 fix defesa-em-profundidade) | Eurico (trailer Iter 3) |
| 4.3 — Heatmap calendário | `@ux-design-expert` → `@dev` | PASS first-iter | 1 (6 Minor) + Iter 2 stale | Merge limpo | — |
| 4.4 — Métricas por hábito | `@dev` → `@qa` | PASS first-iter | 2 (5 minor → 0) | Merge limpo | — |
| 4.5 — CRUD metas + vista | `@dev` → `@qa` | PASS first-iter | 2 (F1 major + 2 a11y → 0 scope) | Merge limpo | — |
| 4.6 — CRUD lembretes | `@dev` → `@qa` | PASS first-iter (100/100) | 1 (1 minor) | Merge limpo | — |
| 4.7 — Setup Web Push | `@dev` → `@architect` | CONCERNS (2 follow-ups) | 2 (Iter 2 APPROVED) | Merge limpo (mergedBy Eurico) | Eurico (merge manual) |
| 4.8 — Disparo server-side | `@dev` → `@architect` | PASS (gate-entrada Opção A′ + gate-saída) | 1 (1 major falso-positivo single-user) | Merge limpo + hotfix PR #56 | — |
| 4.9 — SW push handler | `@dev` → `@architect` | **4 iter** (CONCERNS→PASS→CHANGES REQ→PASS) | 4 Major no PR #58 (semântica snooze) | Merge limpo (D-SNOOZE-CONTRACT) | Iter justificadas por Major de produção |
| 4.10 — Tools cérebro | `@dev` → `@architect` | PASS first-iter | 1 (F5 `onlyPending`) | Merge limpo | — |

**Síntese:** 0 waivers em 10 stories. A reabertura de gate concentrou-se numa única story (4.9) e por razão substantiva (Major de produção de semântica de snooze), não por nitpicks de teste/doc como dominou o Epic 3. A acção A1 do Epic 3 (afinar `.coderabbit.yaml`) parece ter funcionado: zero stories do Epic 4 atingiram Iter 3 por causa de findings só-de-teste/doc.

### 2.3 — Velocidade do epic

| Métrica | Valor |
|---------|-------|
| Story 4.1 merged (PR #41 `aa74ce56`) | 29/05/2026 16:49 |
| Story 4.9 merged (PR #58 `64a41445`) | 06/06/2026 21:01 |
| Closure commit Epic 4 (`852449c7`) | 07/06/2026 01:45 |
| **Duração total** | **~9 dias corridos** |
| Stories/dia (média) | ~1,11 |
| Dia mais denso | 01/06 (4.4 + 4.5 + 4.6 + 4.10 merged — 4 stories) |

> Epic 4 foi o mais lento dos quatro (~9 dias vs ~6 Epic 2, ~7 Epic 1, ~8 Epic 3) — coerente com a introdução de território arquitectural inteiramente novo (Web Push + Service Worker + scheduler externo + gestão de secrets VAPID/KV/CRON), que exigiu 3 passagens de validação na 4.7, gate-entrada+saída na 4.8, e 4 iterações de Architect Gate na 4.9. Os CRUDs (4.1-4.6, 4.10) correram rápido; o atraso vive todo no caminho Web Push.

### 2.4 — Cronologia de merges em main

| Story | PR | Squash commit | Data de merge |
|-------|-----|---------------|---------------|
| 4.1 — Schema hábitos/metas/lembretes | #41 | `aa74ce56` | 29/05/2026 |
| 4.2 — CRUD hábitos + UI partilhada | #42 | `d0e14160` | 29/05/2026 |
| 4.3 — Heatmap calendário | #43 | `1be785a3` | 30/05/2026 |
| 4.4 — Métricas por hábito | #50 | `192b488c` | 01/06/2026 |
| 4.5 — CRUD metas + vista | #52 | `a7078291` | 01/06/2026 |
| 4.6 — CRUD lembretes | #51 | `d13a6067` | 01/06/2026 |
| 4.10 — Tools cérebro | #53 | `09d52b24` | 01/06/2026 |
| 4.7 — Setup Web Push | #54 | `25d1c780` | 02/06/2026 |
| 4.8 — Disparo server-side | #55 (+ hotfix #56 `017a032c`) | `6b429560` | 03/06/2026 |
| 4.9 — SW push handler | #58 | `64a41445` | 06/06/2026 |

> Ordem de merge ≠ ordem numérica: a 4.10 (tools) foi mergeada antes da 4.7/4.8/4.9 (Web Push), porque depende apenas dos CRUDs (4.2/4.5/4.6) e era paralelizável com o caminho de push. Reflecte a paralelizabilidade documentada em `EPIC-4.md` §10. A 4.6 (PR #51) mergeou antes da 4.5 (PR #52) apesar do número maior de PR.

### 2.5 — Evolução da suite de testes

| Marco | Testes (test:unit) | Fonte |
|-------|--------------------|-------|
| Fim Epic 3 (baseline) | 988/988 | Retrospectiva Epic 3 |
| Story 4.1 | 1032/1032 | Story 4.1 Change Log (+44) |
| Story 4.2 (pós CR Iter 3) | 1074/1074 | Story 4.2 Change Log |
| Story 4.3 (pós CR Iter 1) | 1101/1101 | Story 4.3 Change Log |
| Story 4.4 | 1171/1171 | Story 4.4 Dev Agent Record |
| Story 4.6 | 1198/1198 | Story 4.6 QA Results |
| Story 4.5 | 1246/1246 | Story 4.5 Change Log |
| Story 4.10 | 1274/1274 | Story 4.10 Dev Agent Record |
| Story 4.7 | 1292/1292 | Story 4.7 Change Log |
| Story 4.8 (pós CR Iter 1) | 1329/1329 | Story 4.8 Change Log |
| **Story 4.9 (estado final em main)** | **1383/1383** | Story 4.9 Change Log v0.8 |

**Delta Epic 4: +395 testes** (988 → 1383). Crescimento de ~40% na suite ao longo do epic — o maior delta absoluto de qualquer epic até hoje, puxado pelo schema (4.1, +44), pela UI partilhada (4.2), e pelos testes de protocolo do Web Push (4.7/4.8/4.9). Os 17 testes finais da 4.9 (M1-M4 + RF7) são não-tautológicos por design (cada um com comentário que explica que falharia se o bug do CR regredisse) — aplicação directa de `mock-protocol-fidelity.md`.

### 2.6 — Cobertura

Todas as stories cumpriram NFR17 (>=60% em packages core) e os thresholds AC por story. Padrão "helper puro testável ~100% + componente/página fina" mantido do Epic 3:
- Story 4.3 — `lib/habitos/heatmap.ts` 100% + `HabitHeatmap` 100%.
- Story 4.4 — `lib/habitos/metrics.ts` 100% (22 testes).
- Story 4.5 — `lib/metas/progress.ts` 100% (18 testes).
- Story 4.7 — `utils.ts` ~100%; `subscriptions-store.ts` com `vi.mock('@vercel/kv')`.
- Story 4.9 — 6 suites de push 45/45 PASS; testes de fidelidade de protocolo SW.

---

## 3. Loved — o que funcionou bem

### 3.1 — Web Push end-to-end entregue em território inteiramente novo, sem reabrir os 5 ADRs base

O Epic 4 introduziu o primeiro contrato externo de protocolo do projecto (Web Push API + VAPID + Service Worker + scheduler externo) e mesmo assim **nenhum dos 5 ADRs base foi reaberto**. As decisões novas (Node runtime para `web-push`, Vercel KV para persistência server-side, public key VAPID via `NEXT_PUBLIC_*` sem rota dedicada, SW mínimo extensível, dispatch server-side via cron-job.org) foram tomadas como decisões de story ratificadas por `@architect`, não como reabertura de arquitectura. **Evidência:** Architect Gates das 4.7/4.8/4.9; `EPIC-4.md` §7 (6 GAPs todos resolvidos por decisão, não suposição). O risco arquitectural mais alto do projecto até hoje foi absorvido sem retrabalho de fundação.

### 3.2 — Os 6 GAPs arquitecturais resolvidos por verificação/decisão, não por suposição

O `EPIC-4.md` §7 marcou explicitamente 6 GAPs (`[GAP-4.1]` a `[GAP-4.6]`) para resolução no draft — não preenchidos com palpite (Constitution Artigo IV). Cada um foi fechado com decisão rastreável: GAP-4.3 (`web-push` não corre em Edge → Node runtime explícito); GAP-4.4 (VAPID self-generated, public via `NEXT_PUBLIC_*`, private só servidor); GAP-4.5 (SW mínimo só `push`/`notificationclick`, fronteira documentada para Epic 8); **GAP-4.6 (o crítico — disparo ±60s com app fechada)** resolvido pela **Opção A′** da 4.8: o padrão "cron client on-mount" do Epic 3 foi explicitamente rejeitado por `@architect` (só corre com app aberta) e substituído por agendamento server-side + scheduler externo. O risco R1 do epic (o mais alto) foi fechado **antes** de implementar a 4.8.

### 3.3 — Validação `@po` em 3 passagens na 4.7 evitou implementação sobre fundação inventada

A Story 4.7 (Setup Web Push) levou **3 passagens de validação `@po`** antes de chegar a GO: NO-GO 4/10 (env vars VAPID inventadas, rota public-key vs `NEXT_PUBLIC_`, persistência IndexedDB server-side inviável → Vercel KV), NO-GO 4/10 (re-draft v0.2 nunca transcrito para o corpo + 0/5 fixes da Architect Direction aplicados aos AC), e finalmente GO 9/10 (v0.2 gravado, 5 fixes resolvidos contra código real). **Evidência:** memórias `project_nexus_v2_story_4_7_validated/revalidated/validated_go`. A validação `@po` rejeitou duas vezes uma story que teria gerado implementação sobre env vars inexistentes e persistência inviável. É a função de gate a funcionar exactamente como deve no território de maior risco.

### 3.4 — Architect Gate de entrada (Opção A′) na 4.8 mudou a estratégia antes de uma linha de código

A 4.8 teve um **Architect Gate de entrada** (não só de saída): a Aria impôs a Opção A′ (disparo server-side, não client on-mount) no arranque da story, fechando o R1/GAP-4.6 antes da implementação. A `@dev` implementou directamente a estratégia certa. **Evidência:** Story 4.8 §"Decisão de entrada"; gate de saída PASS Confidence High com 4 DEV-DECISIONS ratificadas (D-KV-HASH e D-RECON-MOUNT code-discovered superiores às de entrada). O gate de entrada é um padrão novo e valioso para stories de risco arquitectural — evita o ciclo "implementar → gate rejeita → re-implementar".

### 3.5 — Débitos do Epic 3 pagos como fundação genuína, não housekeeping forçado

A decisão A6 do Epic 3 atribuiu D-3.5-2 (roving tabindex) e D-3.5-3 (FormField partilhado) à Story 4.2 — não como "limpeza de finanças forçada no Epic 4", mas como **extracção de UI partilhada que o Epic 4 genuinamente reutiliza**. A 4.2 criou `components/ui/FormField.tsx` + `TabStrip` (roving tabindex) ANTES dos modais de hábitos, e as Stories 4.5 (metas) e 4.6 (lembretes) reutilizaram-nos directamente. **Evidência:** Change Log 4.2 v0.4 ("UI partilhada PRIMEIRO"); PO Validation 4.6 confirma `FormField`/`TabStrip` existentes. Pagar o débito de caminho evitou propagá-lo a 3 novos modais.

### 3.6 — Aplicação efectiva das regras nascidas de epics anteriores

| Regra / acção anterior | Estado no Epic 4 |
|------------------------|------------------|
| **A3 Epic 3 — `react-component-test-criteria.md`** | Aplicada preventivamente. Heatmap (4.3, 3 estados) e vista meta (4.5) tiveram teste de componente contado no gate ANTES do CR. A 4.3 PO Validation regista "aplicou `react-component-test-criteria.md` preventivamente". Zero Major do CR por ausência de teste de componente (vs Story 3.9). |
| **A4 Epic 3 — `external-contract-identifiers.md`** | Aplicada duplamente. Os 9 nomes de tools (4.10) validados ASCII no draft do epic → 4.10 não precisou de reconciliação de nomes (vs 3.11). E o Web Push trouxe contratos externos novos (eventos SW `push`/`notificationclick`, `action: 'marcar-feito'`/`'snooze'`, campo `pending` do schedule) — todos validados contra a Web Push spec no draft da 4.9 (tabela §"external-contract-identifiers" da story). |
| **A6 Epic 1 — `separation-of-roles.md`** | Aplicada em 10/10 stories. Casos: schema → gate `@architect` (4.1); UI → executor `@ux-design-expert`, gate `@dev` (4.3); lógica → gate `@qa` (4.4/4.5/4.6); Web Push (território novo) → gate `@architect` (4.7/4.8/4.9/4.10). Quando a 4.5 mudou de executor previsto (`@ux-design-expert` → `@dev`), o gate subiu correctamente a `@qa`. |
| **A1 Epic 1 — `mock-protocol-fidelity.md`** | **Plenamente aplicada pela 1.ª vez** (como o `EPIC-4.md` §8 antecipou). Os testes do SW (4.9) tratam `sw.js` como JS puro com `vi.stubGlobal`; `event.data.json()` devolve o shape real serializado por `sendPushNotification`; C6 falha se o protocolo divergir. Os 17 testes M1-M4/RF7 são não-tautológicos por design. |
| **A1 Epic 3 — afinar `.coderabbit.yaml`** | Efeito visível: zero stories do Epic 4 atingiram Iter 3 por findings só-de-teste/doc (vs 3 das 4 Iter-3 do Epic 3). As reaberturas do Epic 4 foram por código de produção (4.2 `time`, 4.9 snooze), não por nitpicks. |

**O ciclo retrospectiva → regra → aplicação produziu resultados pela 3.ª vez consecutiva** (Epic 2, 3 e agora 4).

---

## 4. Os débitos não-bloqueadores

Nenhum é bloqueador. O Epic 4 gerou apenas débitos Baixa e endereçou os herdados do Epic 3.

### 4.1 — Herdados do Epic 3 (decisões A6/A7) — estado de fecho

| Débito | Decisão Epic 3 | Estado no fecho Epic 4 |
|--------|----------------|------------------------|
| D-3.5-2 (tab strip sem roving tabindex) | Absorvido pela 4.2 | **PAGO** — `TabStrip` com roving tabindex criado na 4.2, reutilizado por 4.5/4.6 |
| D-3.5-3 (FormField + inputStyle duplicados) | Absorvido pela 4.2 | **PAGO** — `components/ui/FormField.tsx` criado na 4.2, reutilizado por 4.5/4.6 |
| D-3.3-1 (error inerte), D-3.4-1 (teste cascata), D-3.4-2 (copy "Tarefa recorrente"), D-3.5-1 (referências órfãs) | Mantêm-se em backlog (finanças) | **EM BACKLOG** — domínio finanças; o Epic 4 não tocou esse código (coerência de domínio mantida) |
| D6 (delete projecto cascata) | Fora-de-scope; 4.1 fixa a convenção de cascata como referência | **CONVENÇÃO FIXADA** pela 4.1 (cascade nos filhos sem vida própria; set null nas associações; hard-delete) — pendente story técnica dedicada pós-Epic-4 |
| D7 (fallback intent PT-BR) | Hotfix dedicado (decisão Eurico 29/05) | **FORA-DE-SCOPE** — SOP Hotfix Produção, independente do ciclo de epics |

### 4.2 — Novos débitos Baixa do Epic 4

| # | Débito | Severidade | Origem | Recomendação |
|---|--------|-----------|--------|--------------|
| D-4.2-1 | `Header.tsx:93` `NavLink href="/tasks"` (EN) divergente da rota real `/tarefas` (PT) | Baixa | Story 4.2 (gotcha #3) | Housekeeping — mesmo padrão do FIX-2 da 4.2. Absorver por story de UI que toque o Header |
| D-4.7-1 | FR35 (subscrição no onboarding) entregue como prompt em `/lembretes`, não no fluxo de onboarding | Baixa | Story 4.7 Architect CONCERN follow-up | Follow-up rastreado — mover o `PushPermissionPrompt` para o onboarding quando este existir |
| D-4.8-1 | Recorrência de série de lembretes server-side (AC5) DIFERIDA | Baixa | Story 4.8 backlog | Backlog `@po`/`@pm` — o disparo one-shot funciona; a série recorrente server-side fica para story dedicada |
| D-4.8-2 | Rotação do `CRON_SECRET` + `env.ts` min-length opcional (hardening) | Baixa | Story 4.8 §D handoff | `@devops` — hardening de secret, não-bloqueador (secret server-provisioned) |

**Síntese:** 4 débitos Baixa novos, **0 Média/Alta** — mantém o padrão de maturidade do Epic 3. Os 2 débitos de a11y/UI de finanças mais "absorvíveis" (D-3.5-2/3) foram pagos. O backlog de manutenção fica com: 4 débitos de finanças (Epic 3), D6 (convenção já fixada, falta a story), e os 4 novos Baixa acima. Continua forte a oportunidade de uma story técnica de housekeeping de finanças (4 débitos numa só story).

---

## 5. Learned — lições do epic

### 5.1 — Gap de validação semântica nos gates internos: a Story 4.9 e os 4 Major de snooze (LIÇÃO CENTRAL)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 4.9 (SW push handler), CodeRabbit no PR #58, 04/06/2026 |
| **Sintoma** | A validação `@po` deu GO e o **Architect Gate Iter 2 deu PASS Confidence High** com os testes de fidelidade a provar "o contrato real". Mesmo assim, o CodeRabbit no PR levantou **4 Major de semântica de produção** que ambos os gates internos deixaram passar. |
| **Os 4 Major** | **M1** (`action/route.ts`) — `snooze` com entrada KV ausente devolvia `{ok:true, applied:false}` (silent loss: o utilizador pensa que adiou, mas nada acontece). **M2** (`schedule/route.ts` GET) — devolvia TODAS as `pending`, não só as adiadas por snooze. **M3** (`reconcile-snooze.ts`) — consequência de M2: re-rotulava lembretes `pending` normais (futuros, nunca accionados) como `snoozed` em Dexie. **M4** (`sw.js`) — `postAction` não verificava `response.ok`; 401/500 passava como sucesso (com cookie-auth, sessão expirada → falha silenciosa). |
| **Causa raiz** | Os gates internos validaram o que sabem validar bem — **auth** (D-ACTION-AUTH-COOKIE, corrigida no Iter 1), **estrutura** (Node runtime, schemas Zod, File List), **contrato externo** (eventos SW, nomes de acção ASCII via `external-contract-identifiers.md`), e **fidelidade de mock** (`event.data.json()` reflecte o protocolo). Mas **não validaram a semântica fina do contrato interno `pending`/`snooze`**: o que significa uma entrada `pending` (normal vs adiada), o que a reconciliação on-mount faz a cada classe, e o que acontece a um snooze quando a entrada já foi disparada/removida (análise de ciclo de vida). `mock-protocol-fidelity.md` cobre o protocolo *externo*; não há regra análoga para a coerência do *contrato de estado interno* que atravessa SW + endpoint + reconciliação. |
| **Resolução** | D-SNOOZE-CONTRACT (Aria, Architect Gate Iter 3): marcador dedicado `snoozedAt` ortogonal a `status`; GET filtra por `snoozedAt`; reconciliação confia na fonte estreita; `postAction` trata `!response.ok` como falha (re-mostra a notificação); snooze de entrada ausente → 409 `schedule-gone` (não silent loss). RF1-RF7 aplicados; re-gate Iter 4 PASS com verificação linha-a-linha + 17 testes não-tautológicos. |
| **Lição** | Quando uma feature distribui um **contrato de estado interno** por vários ficheiros (SW + endpoint + reconciliação client), a coerência semântica desse contrato — em especial os caminhos de ciclo de vida (entrada ausente, estado já transitado, falha de rede/auth) — não é apanhada pela validação de auth/estrutura nem pela fidelidade de mock externo. O Architect Gate Iter 2 deu PASS porque os testes provavam o caminho feliz e o protocolo externo; faltou exigir a **análise de ciclo de vida do contrato interno** (o que a Aria acabou por fazer no Iter 3, e que apanhou M1/M2/M3 na raiz). |
| **Acção** | Ver **A1** (check de "coerência de contrato de estado interno" no Architect/QA Gate para features que distribuem estado por múltiplas camadas) |

### 5.2 — Auth de servidor não pode viver num ficheiro estático servido ao cliente (4.9 Iter 1)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 4.9, Architect Gate Iter 1 (CONCERNS), 03/06/2026 |
| **Sintoma** | O draft propôs (D-ACTION-AUTH) que `/api/push/action` usasse o mesmo `CRON_SECRET` Bearer da 4.8, com um placeholder `self.__NEXUS_PUSH_ACTION_SECRET__` no SW. A Aria deu CONCERNS bloqueador: o placeholder **nunca era injectado** no `sw.js` estático → Bearer nunca enviado → 401 sempre em produção; e embeber o `CRON_SECRET` (que protege o dispatch) num ficheiro servido ao cliente seria **escalada de privilégio**. |
| **Causa raiz** | Reutilização cega de um padrão de auth (Bearer server-to-server da 4.8) num contexto diferente (SW same-origin no browser do utilizador). O `notificationclick` corre same-origin com cookie de sessão — não precisa de secret. |
| **Resolução** | D-ACTION-AUTH-COOKIE: `/api/push/action` usa cookie de sessão same-origin via `getSession` (o cookie `SameSite=Strict` envia-se em fetch same-origin do SW). O `CRON_SECRET` Bearer fica restrito ao `/api/push/dispatch` (cron real). Os dois caminhos de auth separam-se. |
| **Lição** | A escolha de auth depende do **contexto de execução** (server-to-server vs same-origin no browser autenticado). Um secret de servidor nunca vive num artefacto servido ao cliente. Este ponto foi apanhado pelo Architect Gate (não chegou ao CR nem a produção) — o gate de auth funcionou. É o complemento positivo da §5.1: os gates internos são fortes em auth, fracos em semântica de estado. |
| **Acção** | Sem regra nova — é aplicação de NFR5 (secrets nunca no client). Memória de processo. |

### 5.3 — Reutilização cega de padrão de persistência: KV server-side vs IndexedDB client (4.7)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 4.7, 1.ª passagem de validação `@po` (NO-GO), 01/06/2026 |
| **Sintoma** | O draft inicial assumiu persistência da subscrição Web Push em IndexedDB (Dexie) — o padrão de todo o resto do Nexus. Mas o `/api/push/send` corre no **servidor**, que não tem acesso ao IndexedDB do browser. A subscrição tem de estar acessível ao servidor → Vercel KV. |
| **Causa raiz** | O Nexus é client-first (Dexie/IndexedDB desde o ADR-2). O Web Push é a 1.ª feature com estado que o **servidor** precisa de ler. O padrão dominante do projecto (IndexedDB) não se aplica ao caminho server. |
| **Lição** | A introdução de um caminho server-side (push, e no futuro OAuth/integrações do Epic 6) quebra a premissa client-first de persistência. Estado que o servidor precisa de ler vive em KV/servidor, não em IndexedDB. A validação `@po` apanhou-o no draft (CRIT-3) — não chegou à implementação. |
| **Acção** | Sem regra nova — registado para o Epic 6 (OAuth) antecipar o mesmo. Memória de projecto. |

### 5.4 — CRITICAL de classe propaga-se entre camadas: o `time` da 4.2 (page → modal)

| Item | Detalhe |
|------|---------|
| **Onde** | Story 4.2, CodeRabbit Iter 1 (page) → Iter 2 (modal) → Iter 3 (fix defesa-em-profundidade), 29/05/2026 |
| **Sintoma** | O CR Iter 1 apanhou um CRITICAL em `page.tsx`: limpar o horário no edit não removia o `time` da DB (Dexie ignora chave ausente do patch). Corrigido. O CR Iter 2 apanhou a **mesma classe de bug no `HabitFormModal`** (o modal omitia a chave em vez de a emitir com `undefined`) — falso positivo funcional (o parent compensava) mas com lacuna de teste real. |
| **Resolução** | Iter 3 (autorizada Eurico): fix defesa-em-profundidade no modal (em edit, chave `time` sempre presente, `undefined` quando limpa) + 2 testes não-tautológicos. O modal deixa de depender do parent. |
| **Lição** | Um bug de classe (aqui: "chave ausente vs `undefined` no patch Dexie") raramente existe num só sítio. Quando o CR apanha um CRITICAL numa camada, vale verificar se a mesma classe existe nas camadas adjacentes (parent/child, page/modal/repo) **no mesmo ciclo** — em vez de o CR a descobrir uma iteração depois. A 4.2 gastou Iter 2+3 por não ter feito essa varredura de classe no Iter 1. |
| **Acção** | Ver **A2** (varredura de bug-de-classe nas camadas adjacentes quando o CR/gate apanha um CRITICAL) |

### 5.5 — Preview sem env vars: o AC manual só verificável em produção (4.7/4.8/4.9)

| Item | Detalhe |
|------|---------|
| **Onde** | Stories 4.7 (AC14), 4.8 (AC8), 4.9 (AC13) — todos os AC de teste manual de push |
| **Sintoma** | Os AC manuais de Web Push (notificação dispara, botões aparecem, "marcar feito" fecha sem abrir app) exigem um push service real com VAPID. **O preview do PR não tem as env vars VAPID** (só produção tem). Logo, o AC13 da 4.9 não foi verificável no preview do PR — só em produção pós-merge, com autorização explícita do Eurico para fechar a story sob essa condição. |
| **Padrão usado** | Cadeia de evidência acumulada: 4.7 provou recepção (smoke Chrome+Edge, FCM 200); 4.8 provou disparo agendado (401/200, scheduler LIVE); 4.9 herda ambos e o AC13 confirma o display+botões em produção. O `Not-tested:` no commit da 4.9 referente ao AC13 foi classificado como **waiver válido** (edge de runtime que exige browser+push service, delegado ao gate `@architect`) — não toca path bloqueador (`not-tested-trailer-rules.md`). |
| **Lição** | Features que dependem de secrets só-de-produção têm AC manuais que o pipeline normal (preview/CI) não consegue verificar. O padrão de "evidência acumulada por story + verificação final em produção autorizada pelo humano" funcionou, mas deve ser **explícito no draft** da 1.ª story da cadeia (qual AC é verificável onde), para o `@po`/`@architect` não darem por isso só no gate. |
| **Acção** | Ver **A3** (no draft de features com secrets só-de-produção, mapear por AC onde é verificável: CI / preview / produção) |

### 5.6 — Gate de entrada do `@architect` em story de risco arquitectural (4.8) — padrão positivo a preservar

| Item | Detalhe |
|------|---------|
| **Onde** | Story 4.8, Architect Gate de entrada (Opção A′), 02/06/2026 |
| **Resolução** | A Aria interveio no **arranque** da 4.8 (não só na saída), impondo a estratégia server-side e fechando o GAP-4.6/R1 antes de qualquer código. A `@dev` implementou directamente a abordagem certa; o gate de saída deu PASS Confidence High. |
| **Lição** | Para stories de risco arquitectural alto (contrato externo, runtime split, estratégia de scheduling), um Architect Gate **de entrada** evita o ciclo caro "implementar com o padrão errado → gate rejeita → re-implementar". Contrasta com a 4.9, onde a semântica de snooze só foi profundamente analisada no Iter 3 (gate de saída tardio). Não requer acção — é um padrão a replicar nos epics de risco (Epic 6/OAuth). |

---

## 6. Lacked — o que faltou

### 6.1 — Sem check de coerência de contrato de estado interno distribuído por camadas

Os gates internos validam auth/estrutura/contrato-externo/mock-fidelity, mas não a semântica de um contrato de estado que atravessa SW + endpoint + reconciliação (os 4 Major de snooze da 4.9). — **Acção A1**.

### 6.2 — Sem varredura sistemática de bug-de-classe nas camadas adjacentes

Quando o CR/gate apanha um CRITICAL, a mesma classe nas camadas vizinhas não é verificada no mesmo ciclo (a 4.2 descobriu o `time` no modal uma iteração depois). — **Acção A2**.

### 6.3 — Verificabilidade dos AC manuais não mapeada no draft

Os AC de push só verificáveis em produção (preview sem VAPID) não foram explicitados por AC no draft da 1.ª story da cadeia. — **Acção A3**.

---

## 7. Decisões accionáveis

> **Nota de autoridade:** as acções que **criam ou alteram regras formais em `.claude/rules/`** são executadas por `@aiox-master` (Orion). `@po` (Pax) propõe; `@aiox-master` cria. Antes de criar regra nova, verificou-se se já está coberta pelas regras existentes (`mock-protocol-fidelity.md`, `separation-of-roles.md`, `not-tested-trailer-rules.md`, `react-component-test-criteria.md`, `external-contract-identifiers.md`) — distinguindo "reforço" de "nova".

| # | Acção | Owner | Tipo | Nova regra ou reforço? | Deadline | Done quando |
|---|-------|-------|------|------------------------|----------|-------------|
| **A1** | Adicionar ao Architect/QA Gate uma verificação explícita de **coerência de contrato de estado interno** para features que distribuem estado por múltiplas camadas (ex: SW + endpoint + reconciliação): exigir uma **análise de ciclo de vida** que cubra (a) cada classe de estado e o que cada camada lhe faz; (b) os caminhos de transição-já-ocorrida (entrada ausente/já disparada); (c) os caminhos de falha (rede, auth expirada, HTTP não-ok). Resolve de raiz os 4 Major de snooze da 4.9 que os gates internos deixaram passar. | **`@aiox-master` (Orion)** — `@po` propõe | **NOVA REGRA** (ou secção em regra de gate) | **NOVA.** `mock-protocol-fidelity.md` cobre o protocolo *externo*; nenhuma regra existente cobre a coerência semântica do *contrato de estado interno* distribuído por camadas. Não é redundante | **Antes do Epic 6 (OAuth — estado distribuído por callback + sessão + store)** | Regra/secção existe em `.claude/rules/` + a 1.ª story do Epic 6 com estado multi-camada aplica a análise de ciclo de vida no gate |
| **A2** | Adicionar ao processo de fix do CR/gate uma **varredura de bug-de-classe**: quando o CR ou o gate apanha um CRITICAL/Major de uma classe identificável (ex: "chave ausente vs `undefined`"), o `@dev` verifica e corrige a mesma classe nas camadas adjacentes (parent/child, page/modal/repo) **no mesmo ciclo**, antes de re-submeter. Evita o gasto de Iter 2+3 da 4.2. | `@dev` (Dex) + `@qa` (Quinn) no gate | **PROCESSO** (checklist de fix) | **REFORÇO** — alinha com a separação de gate existente; não exige regra `.claude/rules/`. Avaliar com `@aiox-master` se justifica nota em `story-lifecycle.md` | **Antes do Epic 5/6** | Checklist de fix do CR inclui a varredura + 1 story fecha um CRITICAL de classe num só ciclo |
| **A3** | No draft da **1.ª story de uma cadeia de features que dependem de secrets/infra só-de-produção** (Web Push, e futuro OAuth/integrações do Epic 6), mapear **por AC onde é verificável** (CI automatizado / preview / só produção com autorização humana). Torna explícito desde o início que AC fica para verificação manual em produção — em vez de o `@po`/`@architect` o descobrirem no gate. | `@sm` (River) + `@po` (Pax) na validação | **PROCESSO** (secção de draft) | **REFORÇO** de `not-tested-trailer-rules.md` (que já classifica `Not-tested:` de AC manual como waiver válido) — acrescenta o mapeamento proactivo no draft. Não é regra `.claude/rules/` nova | **Antes do Epic 6** | A 1.ª story do Epic 6 com infra só-de-produção tem o mapa de verificabilidade por AC no draft |
| **A4** | Decidir o destino do **backlog de débitos Baixa acumulado**: 4 de finanças (Epic 3: D-3.3-1, D-3.4-1, D-3.4-2, D-3.5-1) + 4 novos do Epic 4 (D-4.2-1 NavLink, D-4.7-1 onboarding push, D-4.8-1 recorrência série, D-4.8-2 rotação CRON_SECRET) + D6 (convenção de cascata já fixada pela 4.1, falta a story técnica). Avaliar 1-2 stories técnicas de housekeeping (UI/a11y de finanças + cascata D6). | `@pm` (Morgan) + `@po` (Pax) | **PROCESSO** (backlog/scope) | NÃO — decisão de backlog | **No arranque do próximo epic** | Os débitos têm destino (story técnica criada ou backlog confirmado) |
| **A5** | Confirmar o destino do **D7** (fallback intent PT-BR) — decisão Eurico 29/05 foi hotfix dedicado via SOP Hotfix Produção, independente do ciclo de epics. Verificar se o hotfix foi agendado/executado. | Eurico + `@devops` (Gage) | **PROCESSO** (hotfix) | NÃO — hotfix | **Próxima sessão** | D7 confirmado agendado ou fechado via SOP Hotfix |
| **A6** | Memory log: actualizar a memória do Nexus v2 com Epic 4 = 10/10 Done, waiver rate 0/10, PRs #41-#58 + hotfix #56, closure commit `852449c7`, AC13 validado em produção 07/06, e referência a esta retrospectiva. | `@aiox-master` (Orion) ou Eurico | **MEMÓRIA** | NÃO — memória | **07/06/2026** | MEMORY.md actualizado com entrada que refere este documento |
| **A7** | Eurico + `@pm` decidem o **próximo epic**. Ordem PRD §9: `4 → 5 → 6`. Epic 5 (sucessor natural) ou Epic 6 (Telegram/OAuth — onde A1/A3 desta retrospectiva e a lição de estado server-side da §5.3 se aplicam directamente). | Eurico + `@pm` (Morgan) | **PROCESSO** (roadmap) | NÃO — roadmap | **Próxima sessão** | Epic escolhido → `@pm *create-epic {N}` |

### Acções que requerem `@aiox-master` (Orion) — resumo

| Acção | Natureza | Estado |
|-------|----------|--------|
| **A1** | **NOVA REGRA** proposta — coerência de contrato de estado interno distribuído por camadas (análise de ciclo de vida no gate). Não coberta por nenhuma regra existente | **PROPOSTA** — `@po` propõe; `@aiox-master` decide/cria |
| **A2** | **REFORÇO** — varredura de bug-de-classe; avaliar nota em `story-lifecycle.md` (processo de fix), não regra nova | **PROPOSTA** — a avaliar por `@aiox-master` |
| **A3** | **REFORÇO** de `not-tested-trailer-rules.md` — mapa de verificabilidade por AC no draft; processo de `@sm`/`@po`, não regra nova | **PROPOSTA** — a avaliar por `@aiox-master` |

> `@po` (Pax) **não** cria regras formais — apenas as propõe. A criação/alteração de `.claude/rules/` é autoridade de `@aiox-master` (precedente Epic 1/3).

---

## 8. Comparação Epic 1 vs Epic 2 vs Epic 3 vs Epic 4

| Métrica | Epic 1 | Epic 2 | Epic 3 | Epic 4 | Tendência |
|---------|--------|--------|--------|--------|-----------|
| Stories | 10 | 10 | 11 | 10 | — |
| Duração | 7 dias | ~6 dias | ~8 dias | **~9 dias** | +1 (território Web Push) |
| Waiver rate ("merge waived") | 50% (5/10) | 0% (0/10) | 9,1% (1/11) | **0% (0/10)** | iguala o melhor (Epic 2) |
| Quality gate PASS first-iter | — | 10/10 | 11/11 | **9/10** | só a 4.9 reabriu (Major de produção) |
| Stories na 3.ª iter (CR ou gate) | 1 (1.10) | 1 (2.6) | 4 | **2** (4.2, 4.9) | desceu vs Epic 3 |
| Iter 3+ por nitpicks de teste/doc | — | — | 3 das 4 | **0** | A1 do Epic 3 funcionou |
| Bugs produção pós-deploy dentro do epic | 0 (1 hotfix fora) | 0 | 0 | **0** (1 hotfix middleware #56 dentro do epic) | mantido |
| ADRs base reabertos | 0 | 0 | 0 | **0** (em território novo) | igual |
| ADRs locais criados | — | 1 (ADR-2.7-1) | 0 | 0 (D-decisions ratificadas em gate) | — |
| Débitos Média/Alta gerados | — | 2 (D6, D7) | 0 | **0** | mantido |
| Contrato externo de protocolo novo | não | não | não (registry interno) | **sim (Web Push/VAPID/SW)** | 1.º do projecto |
| Delta de testes | — | — | +260 | **+395** | maior delta absoluto |
| Acções da retrospectiva anterior aplicadas | n/a | A1, A2, A6 | A2, A6, A1, a11y | **A3, A4, A6, A1** | ciclo validado 3× |

**Conclusão da comparação:** o Epic 4 foi o mais lento (território arquitectural inteiramente novo) mas fechou com **0% de waiver — igualando o melhor epic (Epic 2)** — e gerou **0 débitos Média/Alta**. A acção A1 do Epic 3 (afinar `.coderabbit.yaml`) resolveu o problema dos nitpicks de teste/doc: zero Iter-3 por essa causa (vs 3 das 4 no Epic 3). As duas reaberturas de gate/CR (4.2, 4.9) foram por **código de produção real**, não por metadados de doc — exactamente o que se queria. A lição mais valiosa é a §5.1: os gates internos são fortes em auth/estrutura/contrato-externo/mock-fidelity mas têm um ponto cego na **semântica de contratos de estado distribuídos por camadas** — o que A1 endereça antes do Epic 6 (OAuth), onde o mesmo padrão de estado multi-camada vai reaparecer.

---

## 9. Próximas acções na sequência

1. **`@devops` (Gage)** — push do closure commit desta retrospectiva (docs-only). O closure do Epic 4 (`852449c7`) já está em main; esta retrospectiva é um commit docs adicional.
2. **`@aiox-master` (Orion) ou Eurico** — executa **A6**: actualiza memória com Epic 4 = 10/10 Done, waiver 0/10.
3. **`@aiox-master` (Orion)** — avalia **A1** (nova regra: coerência de contrato de estado interno) + **A2/A3** (reforços de processo).
4. **`@pm` (Morgan) + `@po` (Pax)** — executam **A4** (destino do backlog de débitos Baixa) e **A5** (confirmar D7) no arranque do próximo epic.
5. **Eurico + `@pm` (Morgan)** — executam **A7**: decidem próximo epic → `@pm *create-epic {N}`.

---

## 10. Convenções desta retrospectiva

| Regra | Verificação |
|-------|-------------|
| `workspace-governance.md` | Documento em `imersao-tools/nexus/docs/retrospectives/` (categoria 2: Projectos Próprios) — OK |
| `language-standards.md` | PT-PT, datas DD/MM/YYYY, separador decimal vírgula, sem PT-BR — OK |
| `output-format-standards.md` | Tabelas ASCII markdown, sem emojis, sem preâmbulo — OK |
| `mandatory-change-log.md` | Acções A1-A7 com owner + tipo + deadline + done + flag de autoridade `@aiox-master` — OK |
| `separation-of-roles.md` | Retrospectiva é trabalho de `@po`; documento de processo, sem quality gate sobre si mesma |
| `agent-authority.md` | Criação de regras formais marcada como autoridade `@aiox-master` (A1) — `@po` propõe, não cria — OK |
| Constitution Artigo IV (No Invention) | Todas as métricas derivadas de `git log` real, `EPIC-4.md`, stories `completed/4.1-4.10.story.md`, e memórias de validação/fecho. Onde uma métrica não existia nas fontes, não foi inventada |

---

**Documento criado por:** Pax (`@po`) em 07/06/2026
**Sources verificados:**
- `git log --format="%h %ai %s"` em `ecosistema-ia-avancada-pt` (squash commits PRs #41-#58 + hotfix #56 + closure `852449c7`)
- `imersao-tools/nexus/docs/EPIC-4.md` (10/10 FECHADO, §5 stories, §7 GAPs, §8 lições/débitos, §9 quality gates, §10 fecho)
- `imersao-tools/nexus/docs/stories/completed/4.1-4.10.story.md` (Change Logs, PO/QA/Architect Gates, contagens de teste, iterações CR, DEV-DECISIONS, D-SNOOZE-CONTRACT)
- `imersao-tools/nexus/docs/retrospectives/EPIC-1/2/3-retrospective.md` (referência de formato e baseline comparativa)
- `.claude/rules/` (mock-protocol-fidelity, separation-of-roles, not-tested-trailer-rules, react-component-test-criteria, external-contract-identifiers) — verificadas para distinguir nova regra de reforço
