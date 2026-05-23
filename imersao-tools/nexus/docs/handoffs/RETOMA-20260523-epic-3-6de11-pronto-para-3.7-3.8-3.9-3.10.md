# RETOMA — Nexus v2 Epic 3 (6/11 Done) pronto para Stories 3.7 / 3.8 / 3.9 / 3.10 / 3.11

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 23/05/2026
**Projecto:** Nexus v2 (LIVE em https://imersao.ia.expressia.pt)
**Estado:** Epic 3 — 6/11 Done em main, pronto para próxima story (5 pendentes, todas desbloqueadas)
**Localização canónica:** `imersao-tools/nexus/`
**Branch:** `main` (sincronizado com origin/main)
**Tip main:** `e985b0d0` (closure Story 3.6)
**Autor:** sessão Claude Code 23/05/2026 (terminal low-context — handoff antes de fechar)

---

## Sumário executivo (1 parágrafo)

Sessão 23/05/2026 fechou **ciclo completo Story 3.6** (Compras parceladas FR19) end-to-end: Dex aplicou Fix #1 (`cardId` guard em `createInstallmentWithTransactions`) + Fix #2 (try/catch render-safe em `InstallmentsList`) ao CR Iter 1; Gage push + comment PR #35 com defesa de Fix #3 (test policy Epic 3); CR Iter 2 **APPROVED** + 8/8 CI checks SUCCESS; Eurico merge squash `7be125f4` em main; Pax `*close-story 3.6` v1.5 → commit closure `e985b0d0` em main. Epic 3 está agora **6/11 Done** (3.1, 3.2, 3.3, 3.4, 3.5, 3.6) com **waiver rate 0/6** e padrão **6 stories first-iter consecutivas** Epic 3 após PO Validation GO. As 5 stories pendentes (3.7, 3.8, 3.9, 3.10, 3.11) estão **todas desbloqueadas** pelas dependências cumpridas — 4 delas (3.7/3.8/3.9/3.10) paralelizáveis entre si. Próximo passo é decisão estratégica do Eurico sobre qual story arrancar (ou paralelizar).

---

## Estado real verificado em main

```
e985b0d0 docs(nexus-v2): fechar Story 3.6 + actualizar EPIC-3 (6/11 Done) [Story 3.6] [Epic 3]
7be125f4 feat(nexus-v2): Story 3.6 — Compras parceladas vinculadas a cartão [Epic 3] (#35)
51074f28 feat(nexus-v2): Story 3.5 — CRUD cartões + contas bancárias [Story 3.5] (#34)
54d7f851 feat(nexus-v2): Story 3.4 — CRUD recorrências financeiras [Epic 3] (#33)
9bc2b03f docs(nexus-v2): fechar Story 3.3 — CRUD transações variáveis Done [Story 3.3]
1a48855a feat(nexus-v2): Story 3.3 — CRUD transações variáveis [Epic 3] (#32)
```

| Métrica | Valor |
|---------|-------|
| Branch local + remote | `main` (sincronizado, 0 ahead / 0 behind) |
| Stories Done Epic 3 | **6/11** (3.1, 3.2, 3.3, 3.4, 3.5, 3.6) |
| Pendentes Epic 3 | **5** (3.7, 3.8, 3.9, 3.10, 3.11) — todas desbloqueadas |
| PRs Epic 3 merged | 6 (#30, #31, #32, #33, #34, #35) |
| QA Gate PASS first-iter consecutivos Epic 3 | **6 stories** |
| Waiver rate Epic 3 | **0/6** (alvo <20%) |
| Suite tests | **853/853 PASS** (16 testes novos da 3.6: `installmentSplit` 100% coverage) |
| Produção | LIVE em https://imersao.ia.expressia.pt — deploy 3.6 automático via Vercel post-merge |

**Working tree (esperado em qualquer terminal):**
- 2 submódulos modified (não staged): `imersao-tools/comunidade`, `imersao-tools/starter-builder` — INTACTOS, não mexer
- 150+ untracked fora-scope (`.agent/`, `.antigravity/`, `.aiox-pm-config.yaml`, etc.) — INTACTOS, não mexer

---

## O que foi feito nesta sessão (cronológico)

### Ciclo 1 — Story 3.6 QA loop Iter 1 → Iter 2 APPROVED

Sequência cross-agent executada na sessão:

| # | Agente | Acção | Commit/SHA | Resultado |
|---|--------|-------|------------|-----------|
| 1 | `@dev` Dex | `*qa-loop-fix 3.6` — consume handoff `RETOMA-20260523-story-3.6-pr-35-cr-iter1-fixes.md` | `ac224820` | Fix #1 + Fix #2 aplicados, quality gates 4/4 PASS local |
| 2 | `@dev` Dex | Consume handoff (move para archive + actualiza INDEX central + local) | `2508c7d8` | Handoff arquivado, INDEX sincronizado |
| 3 | `@devops` Gage | `*push feature/3.6-compras-parceladas` + comment PR #35 | push `65f9d829..2508c7d8` | Reply ao CR posted: https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/35#issuecomment-4525618109 |
| 4 | CodeRabbit Iter 2 | Server-side review | — | **APPROVED** (Fix #3 outside-diff aceite como policy Epic 3) |
| 5 | CI Nexus v2 | Lint+TS, Vitest, Playwright E2E, 50-prompt regression, CodeQL ×2, Vercel | — | **8/8 SUCCESS** |
| 6 | `@devops` Gage | Squash-merge PR #35 (via Eurico/admin) | `7be125f4` | Merged em main 14:18:21Z, branch eliminada |
| 7 | `@po` Pax | `*close-story 3.6` v1.5 — DoD 10/10 PASS, mv active→completed, EPIC-3 5/11→6/11 | `e985b0d0` | Story Done, INDEX central actualizado |
| 8 | `@devops` Gage | `*push main` (closure commit docs-only) | push `7be125f4..e985b0d0` | CodeQL + CI + Test IN_PROGRESS (não-bloqueante) |

**Fixes aplicados na Iter 1 (a Story 3.6 já estava implementada — só foram fixes de CR):**

- **Fix #1 (Major)** — `imersao-tools/nexus/v2/lib/db/repos/installments.ts:123-131` — guard `t.cardId === installment.cardId` em `createInstallmentWithTransactions` (paridade com `installmentId` existente, evita afectar transações de outros cartões em casos de migração)
- **Fix #2 (Minor)** — `imersao-tools/nexus/v2/components/financas/InstallmentsList.tsx:78-101` — try/catch render-safe à volta de `splitInstallmentAmount` com fallback `"N× — valor inválido"` (defensivo contra dados corrompidos em runtime)
- **Fix #3 (Major contestado)** — **NÃO APLICADO** — `app/(app)/financas/page.tsx:428-767` outside-diff "add unit tests for handlers" violava convenção testes Epic 3 declarada na story secção Testing e precedente 3.3/3.4/3.5; reply ao CR explicou e CR Iter 2 aceitou

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-epic-3-6de11-pronto-para-3.7-3.8-3.9-3.10.md`. ESTÁ DENTRO DA PASTA `imersao-tools/nexus/` (projecto Nexus v2 a que se refere). LOCALIZAÇÃO VÁLIDA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Estado das 5 stories pendentes Epic 3

Todas desbloqueadas. Dependências verificadas em `EPIC-3.md` §5 e §7.

| # | Story | FR | Executor previsto | Gate previsto | Desbloqueio (dependências cumpridas) | Risco/notas |
|---|-------|----|--------------------|----------------|--------------------------------------|-------------|
| 3.7 | Vista "este mês" | FR21 | `@ux-design-expert` | `@dev` | 3.4 (recorrentes) + 3.6 (prestações) — ambas Done | Projecção 30 dias inclui recorrentes + prestações já em DB |
| 3.8 | Vista cartões | FR18, FR19 | `@ux-design-expert` | `@dev` | 3.5 (cartões CRUD) + 3.6 (prestações) — ambas Done | Fatura corrente + próxima fatura + prestações por cartão |
| 3.9 | Vista património | FR20 | `@ux-design-expert` | `@dev` | 3.5 (contas/cartões CRUD) — Done | Saldo agregado por conta/banco com drilldown |
| 3.10 | Geração diária recorrentes + prestações | FR17, FR19 | `@dev` | `@architect` | 3.4 (motor recorrência via `runRecurrenceEngine` da 2.7) + 3.6 (prestações eager gen — A2 confirmada `@architect`) — ambas Done | Cron client-side one-shot on-mount (ADR-2.7-1) — NÃO gerar prestações (3.6 já é eager) |
| 3.11 | Tools cérebro finanças | FR23 | `@dev` | `@architect` | 3.3+3.4+3.5+3.6 (CRUDs todos prontos) — Done | 6 tools: `criar_finança_variavel`, `criar_finança_recorrente`, `criar_cartao`, `criar_parcelada`, `consultar_balanço`, `consultar_categoria` |

### Paralelização possível

| Combinação | Razão |
|------------|-------|
| 3.7 + 3.8 + 3.9 | 3 stories UI puras (`@ux-design-expert`), ficheiros separados (`/financas/mes`, `/financas/cartoes`, `/financas/patrimonio`), zero conflito de scope |
| 3.10 isolada | `@dev` puro, lógica de motor, não toca UI nova — pode correr em paralelo com qualquer das 3 vistas |
| 3.11 sequencial | Depende de tools registry estável + consome lógica das outras — mais seguro fazer por último |

---

## Próximas opções concretas (Eurico decide)

| # | Comando | Quando escolher |
|---|---------|-----------------|
| A | `@sm *draft 3.7` | Recomendada se queres demonstrar valor user-facing rápido (vista mensal é o angle de continuidade financeira do Nexus — projecção 30 dias) |
| B | `@sm *draft 3.8` | Vista cartões — relevante para quem usa muitos cartões/parcelas; complemento natural à 3.6 |
| C | `@sm *draft 3.9` | Vista património — saldo agregado, mais simples (UI puro sobre dados já existentes) |
| D | `@sm *draft 3.10` | Story de motor — sem UI nova mas crítica para que recorrentes "aconteçam" no dia certo |
| E | `@sm *draft 3.11` | Story de fecho — integra tudo no cérebro multi-intent. Recomendado por último |
| F | Paralelizar A+B+C+D em 4 terminais distintos | Maximiza throughput — Epic 3 fecha em ~1 sessão. Requer 4 terminais Claude Code abertos. |
| G | `@po *retrospective epic-3-intermedia` | Capturar lições antes das últimas 5 stories (precedente: Epic 1 retro foi pós-100%, Epic 2 não teve retro intermédia). Não recomendado — 6/11 ainda cedo. |

**Recomendação não-vinculativa:** Opção F (paralelizar 3.7+3.8+3.9+3.10) se tiveres bandwidth de 4 terminais. Senão, Opção A (3.7) — é a story que demonstra o angle de continuidade do Nexus (projecção 30 dias).

---

## Convenções operacionais Epic 3 consolidadas (NÃO reabrir)

| Convenção | Detalhe | Origem |
|-----------|---------|--------|
| Test policy Epic 3 | Componentes React do separador Finanças NÃO têm unit tests próprios — validação via `@architect` + CR server-side | Story 3.3 estabeleceu; 3.4/3.5/3.6 confirmaram; defendida em PR #35 comment 4525618109 |
| Repo isolation | Helpers de cálculo financeiro em `lib/financas/*.ts` (puros, 100% coverage); atomicidade em `db.transaction('rw', ...)` no repo, não na page | Story 3.5/3.6 |
| Page tab strip | `/financas` tem 5 separadores (Transações, Recorrências, Cartões, Contas, Parceladas) — 3.7/3.8/3.9 adicionam novas páginas/separadores conforme story | Story 3.6 estendeu para 5 |
| Categoria form-only | Compras parceladas: categoria pedida na form mas NÃO persistida na tabela `installments` ([GAP-3.6-1]) — herda da categoria default da transacção gerada | Story 3.6 `@architect` confirmou |
| Geração eager (3.6) vs lazy (3.10) | Parceladas: TODAS as N transações criadas no momento da compra (3.6, A2) — Story 3.10 NÃO gera prestações, só recorrentes | Story 3.6 `@architect` A2 |
| Hard-stop §8 | Máximo 2 iter CR. Iter 3 excepcional ou merge waived exigem autorização humana explícita no commit (trailer `Constraint:` + nome Eurico) | EPIC-3.md §8, herdado Epic 2 |

---

## Caveats operacionais críticos

| Caveat | Detalhe |
|--------|---------|
| `gh pr *` requer SEMPRE `--repo` | Memória `Nexus v2 Epic 3 em curso` + precedente Stories 3.1-3.6: `gh pr ... --repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Push exclusivo `@devops` | Constitution Artigo II — `@dev`/`@po`/`@sm`/`@qa` fazem commits locais, NUNCA push |
| Eurico faz merge manual | Convenção Nexus v2 desde Story 2.2 — `@devops` push + PR, Eurico faz `gh pr merge --squash --delete-branch` (não `@devops`) |
| Closure docs-only directo para main | Convenção Nexus v2 — `@po *close-story` cria commit local, `@devops *push main` directo sem PR |
| Submódulos `comunidade`/`starter-builder` modified | Pré-existentes fora-scope. Verificar `git status` no início de cada sessão e NÃO mexer |
| Pasta exacta terminal novo | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt` |
| Idioma | PT-PT obrigatório em TUDO (regras `language-standards.md`) |

---

## Ficheiros de referência (ordem de leitura cross-terminal)

1. `docs/HANDOFF-INDEX.md` — entrada deste handoff em pending
2. `.claude/rules/handoff-location.md` + `handoff-central.md` — regras de handoff
3. `imersao-tools/nexus/docs/EPIC-3.md` — estado completo Epic 3 (stories, FRs, débitos, lições)
4. `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §6.3 + §9 + §10 — fonte da verdade (Constitution Artigo IV)
5. `imersao-tools/nexus/docs/stories/completed/3.6.story.md` — última story fechada (referência de estrutura)
6. `imersao-tools/nexus/docs/architecture-v2.md` — 5 ADRs (NÃO reabrir)
7. `imersao-tools/nexus/docs/retrospectives/EPIC-1-retrospective.md` + `EPIC-2-retrospective.md` — lições aplicadas

Memórias relevantes para o próximo agente:
- `project_nexus_v2_epic_3.md` (estado Epic 3, padrão first-iter)
- `project_nexus_v2_architecture.md` (5 ADRs, NÃO reabrir)
- `project_nexus_v2_producao.md` (deploy info)
- `feedback_mock_must_reflect_real_protocol.md` (relevante para 3.11)

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260523-epic-3-6de11-pronto-para-3.7-3.8-3.9-3.10.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: sessão Claude Code Eurico (terminal low-context, encerramento)
DATA: `23/05/2026`
