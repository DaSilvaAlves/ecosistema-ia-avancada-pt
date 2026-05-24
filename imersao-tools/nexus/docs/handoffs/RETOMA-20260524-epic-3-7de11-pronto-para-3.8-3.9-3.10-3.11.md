# RETOMA — Nexus v2 Epic 3 7/11 Done em main, pronto para 3.8 / 3.9 / 3.10 / 3.11

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 24/05/2026
**Projecto:** Nexus v2 — LIVE em https://imersao.ia.expressia.pt
**Localização canónica:** `imersao-tools/nexus/`
**Branch:** `main` sincronizado com `origin/main` em `783faca2`
**Estado:** Epic 3 EM CURSO — **7/11 stories Done**, próxima story livre à escolha do Eurico

---

## Sumário 1-parágrafo

Story 3.7 (Vista "Este mês" FR21) fechada hoje 24/05/2026 — merge squash `deac687b` em main via PR #36 + closure docs-only `783faca2` em main. Sessão consumiu 3 iterações CodeRabbit (Iter 1 = bug funcional `getProjectionWindow` + lint MD; Iter 2 = aritmética manual ms → `addDays` DST-safe + render HTML em handoff; Iter 3 = CR continuou a pedir nitpicks cosméticos em tabelas markdown — Eurico decidiu merge directo bypass do CR loop infinito). Iter 3 foi excepcional ao hard-stop §8 EPIC-3 e registada via trailer `Authorized-by: Eurico` no commit `26e78d0e`. Epic 3 agora **7/11 stories Done** (3.1+3.2+3.3+3.4+3.5+3.6+3.7), **waiver rate 0/7** mantido (zero waivers), **first-iter PASS rate 7/7** mantido. 4 stories restantes (3.8/3.9/3.10/3.11) estão **todas desbloqueadas** — Eurico decide a próxima ou paraleliza em terminais distintos. Próximo passo do próximo terminal: `@sm *draft 3.X` (X à escolha) ou `@po *retrospective epic-3-intermedia` se quiser capturar lições antes das últimas 4.

---

## Estado real verificado

| Item | Valor |
|------|-------|
| Branch | `main` |
| HEAD local | `783faca2` (closure Story 3.7) |
| HEAD remote | `783faca2` (sincronizado) |
| Branch `feature/3.7-vista-este-mes` | ELIMINADA server + local |
| PR #36 | MERGED squash `deac687b` 24/05/2026 |
| Production | Deploy automático Vercel concluído → https://imersao.ia.expressia.pt |
| Epic 3 status | **7/11 stories Done** |
| Waiver rate | **0/7** (zero waivers) |
| First-iter PASS rate | **7/7** |
| Working tree | 150+ untracked fora-scope + 2 submódulos modified (`comunidade`+`starter-builder`) — **INTACTOS, NÃO MEXER** |

---

## Próximas opções — Eurico decide

| # | Story | Descrição | FR | Executor | Quality Gate | Bloqueada por? |
|---|-------|-----------|----|----|--------------|----------------|
| 1 | **3.8** Vista cartões | Fatura corrente + próxima fatura + prestações por cartão | FR18+FR19 | `@ux-design-expert` | `@dev` | NÃO — desbloqueada pela 3.6 |
| 2 | **3.9** Vista património | Saldo agregado por banco/conta com drilldown | FR20 | `@ux-design-expert` | `@dev` | NÃO |
| 3 | **3.10** Geração diária | Motor client-side de geração diária de transações recorrentes + prestações (reutiliza `runRecurrenceEngine` da Story 2.7) | FR17+FR19 | `@dev` | `@architect` | NÃO — desbloqueada por 3.4+3.6 |
| 4 | **3.11** Tools cérebro finanças | Registar 6 tools no Tool Registry: `criar_finança_variavel`, `criar_finança_recorrente`, `criar_cartao`, `criar_parcelada`, `consultar_balanço`, `consultar_categoria` | FR23 | `@dev` | `@architect` | **Recomendada por ÚLTIMO** — integra tudo o resto |

**Decisão Eurico no próximo terminal:** uma das opções acima OU paralelizar 2-3 stories em terminais distintos (são independentes entre si conforme `EPIC-3.md` §10) OU `@po *retrospective epic-3-intermedia` para capturar lições antes das últimas 4.

---

## Comando para o próximo terminal

```bash
# Passo 0 obrigatório - validar estado real (5 segundos)
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git status
git log --oneline -5

# Esperado:
# - branch: main
# - HEAD: 783faca2 docs(nexus-v2): fechar Story 3.7 + actualizar EPIC-3 (7/11 Done)
# - Up to date with 'origin/main'

# Depois Eurico decide:
@sm *draft 3.8    # OU 3.9, 3.10, 3.11
# OU
@po *retrospective epic-3-intermedia
```

---

## Caveats operacionais (NÃO ignorar)

| # | Caveat |
|---|--------|
| 1 | `gh pr *` requer **sempre** `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| 2 | Push para origin é **EXCLUSIVO** do `@devops` (Gage) |
| 3 | Eurico faz merge manual via GitHub (não `@devops`) — convenção desde Story 2.2 |
| 4 | Closure docs-only vai **directo para main sem PR** — convenção Nexus v2 desde Story 2.2 |
| 5 | Cada feature story em branch dedicada `feature/3.X-...` (não em main) |
| 6 | Hard-stop §8 EPIC-3 = **máx 2 iter CR automáticas** — Iter 3 exige autorização Eurico em trailer `Authorized-by:` |
| 7 | Working tree tem 150+ untracked + 2 submódulos modified — TODOS fora-scope, **NÃO mexer** |
| 8 | Pasta exacta no Windows: `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt` |

---

## Convenções consolidadas Epic 3 (NÃO reabrir)

| # | Convenção |
|---|-----------|
| C1 | Helpers em `lib/financas/*.ts` puros — coverage 100% obrigatório |
| C2 | Componentes UI Finanças sem unit tests próprios — validação via @architect + CR |
| C3 | Atomicidade obrigatória em operações multi-tabela (`db.transaction('rw', ...)` no repo) |
| C4 | Repo isolation — page nunca chama `db.*` directo, sempre via repo |
| C5 | Tab strip `/financas` com 5 separadores activos (Transacções, Recorrências, Cartões, Parceladas, Mês) |
| C6 | Geração eager na 3.6 (prestações) vs geração lazy na 3.10 (recorrentes) — boundaries claras |
| C7 | Hard-stop §8 = máx 2 iter CR; Iter 3 excepcional requer autorização humana no trailer do commit |
| C8 | `getProjectionWindow` usa `addDays(start, days - 1)` (DST-safe) — semântica inclusiva preservada |

---

## Padrão consolidado Nexus v2

**14 stories consecutivas first-iter PASS após PO Validation GO** (1.5/1.6/1.7/1.8/1.9/2.1/2.3/2.4/2.5/2.8/2.9/3.1/3.2/3.3/3.4/3.5/3.6/3.7 — 18 contando todas mas algumas tinham fluxos differentes). Zero waivers em Epic 3 (0/7), zero waivers significativos em Epic 2 (0/10).

---

## Decisões importantes registadas hoje

| # | Decisão | Onde |
|---|---------|------|
| D1 | Iter 3 excepcional autorizada por Eurico para refactor DST-safe (`addDays`) + handoff render fix | trailer `Authorized-by:` no commit `26e78d0e` |
| D2 | Bypass do CR loop infinito (CR Iter 3 continuou a pedir nitpicks markdown) via merge directo Eurico | screenshot do GitHub "Merged" badge confirmado |
| D3 | Convenção Epic 3 §8 mantida — Iter 3 conta como excepção autorizada, não como precedente automático | EPIC-3.md §0 actualizado para "1 excepção autorizada" |

---

## Ordem de leitura para cold start

| # | Ficheiro | Porquê |
|---|----------|--------|
| 1 | `docs/HANDOFF-INDEX.md` | Ponto de entrada — esta entrada PENDING aparece no topo |
| 2 | Este handoff | Contexto pós-Story 3.7 + opções próximas |
| 3 | `imersao-tools/nexus/docs/EPIC-3.md` | Estado Epic 3 + tabela de 11 stories |
| 4 | `imersao-tools/nexus/docs/stories/completed/3.7.story.md` (secção PO Closure) | Como foi a última story fechada |
| 5 | `imersao-tools/nexus/v2/lib/financas/monthAggregations.ts` | Código produzido pela 3.7 (reutilizado pela 3.11 tools) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260524-epic-3-7de11-pronto-para-3.8-3.9-3.10-3.11.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (sub-projecto de `imersao-tools/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260524-epic-3-7de11-pronto-para-3.8-3.9-3.10-3.11.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Dex (`@dev`) → Pax (`@po`) → handoff cross-terminal por sessão Claude Code 24/05/2026
DATA: 24/05/2026
