# RETOMA — Story 5.11 (Pesquisa web) PR #72: CodeQL RESOLVIDO, merge bloqueado por CR (1 Critical + 5 Major)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

- **from_agent:** @devops (Gage)
- **to_agent:** dev (com ratificação @architect para o Critical SSRF)
- **created:** 2026-06-14
- **status:** pending
- **projecto:** Nexus v2 (`imersao-tools/nexus/`)
- **PR:** #72 (OPEN) `https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/72`
- **branch:** `feat/nexus-v2-5.11-pesquisa-web` — head `e2a9aff4`

## Resumo

A fase DevOps da Iter 1 CodeQL foi concluída com sucesso: **os 2 alertas CodeQL HIGH
foram RESOLVIDOS**. O @dev corrigiu `decodeHtmlEntities` (`&amp;` por último) e
`stripTags` (loop até estabilizar) + 4 testes de segurança. @devops fez commit Iter 2
`e2a9aff4`, push ff, e o **check CodeQL passou a SUCCESS** no head novo; query
`code-scanning/alerts?ref=...` com `state==open` = **vazio**.

**MAS o merge NÃO foi feito.** Ao aplicar merge-authority.md ao head novo, a verificação
das 6 condições expôs que o **CodeRabbit server-side no PR tem 7 findings actionable
abertos** (1 Critical + 5 Major + 1 Refactor) — que são **lógica de produção da
Story 5.11 original**, NÃO os fixes CodeQL. Estes nunca tinham sido reportados pelo
CodeRabbit CLI local (que só vê o diff uncommitted dos 2 ficheiros CodeQL — deu 0
findings, correctamente). O sinal de verdade é o CR **server-side** no PR.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/`. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Gates @devops Iter 2 (todos verdes)

| Gate | Resultado |
|------|-----------|
| lint | 0 erros (1 warning pré-existente fora-scope: `logout/route.ts` NextResponse) |
| typecheck | exit 0 |
| vitest run | **1807/1807** (157 ficheiros), +4 testes novos vs Iter 0 |
| CodeRabbit CLI `--agent -t uncommitted` | **0 findings** (só vê os 2 ficheiros CodeQL) |
| commit Iter 2 | `e2a9aff4` (pre-commit hooks OK, sem `--no-verify`) |
| push ff | `02ebf98b..e2a9aff4` (sem `-f`) |

## CI no head novo `e2a9aff4` (rollup limpo)

- 15 success + 15 skipped (framework AIOX), **0 FAILURE**
- **CodeQL = SUCCESS** (era FAILURE no head antigo) — 2 HIGH resolvidos
- `Analyze (javascript-typescript)` = SUCCESS, `Analyze (actions)` = SUCCESS
- code-scanning alerts open na branch = **vazio**
- CodeRabbit Status check = SUCCESS (é o gating, NÃO o veredicto de findings)
- mergeable = MERGEABLE / mergeStateStatus = UNSTABLE (skipped framework)

## Decisão de merge — 6 condições merge-authority.md (head `e2a9aff4`)

| # | Condição | Estado |
|---|----------|--------|
| 1 | CI 100% verde (incl. CodeQL) | PASS (0 FAILURE, CodeQL SUCCESS) |
| 2 | CodeRabbit Status = SUCCESS | PASS (check de gating) |
| 3 | **Zero comentários CR actionable no head** | **FAIL — 7 findings (1 Critical + 5 Major + 1 Refactor)** |
| 4 | Quality gate AIOX = PASS | (Architect Gate saída PASS High registado, mas anterior aos findings CR) |
| 5 | mergeable = MERGEABLE | PASS |
| 6 | Hard-stop §8 ≤2 iter CR | OK (CodeQL Iter 2; CR Iter 1 ainda por resolver) |

**Condição 3 falha → NÃO merge.** Escalação obrigatória (findings são produção, não @devops).
`reviewDecision = CHANGES_REQUESTED`: a única review formal CR é em `02ebf98b` (head
antigo) state CHANGES_REQUESTED. Re-trigger `@coderabbitai review` postado às 14:24Z
(issue-comment 4702029418), ack recebido, mas a review nova sobre `e2a9aff4` ainda não
foi submetida à hora deste handoff. NÃO é stale: os 7 comentários têm
`original_commit_id=02ebf98b` mas o GitHub re-ancorou `commit_id=e2a9aff4` porque NÃO
foram resolvidos. O código apontado existe inalterado no head actual.

## Os 7 findings CR (a resolver por @dev / @architect)

| Sev | Ficheiro:linha | Título | Destino |
|-----|----------------|--------|---------|
| **Critical** | `app/api/conhecimento/web-search/route.ts:175-176` | host-header SSRF + cookie leakage: `proxyUrl` deriva de `req.nextUrl.origin` (spoofável) e reenvia o `Cookie` de sessão → credenciais para host atacante. Fix CR: origem interna de confiança (`process.env.INTERNAL_API_ORIGIN`), 503 se ausente | **@architect ratifica + @dev** |
| Major | `app/(app)/knowledge/page.tsx:205-207,648-653` | Abortar pedidos web em curso quando `webSearchMode` desliga (hoje só aborta no unmount) | @dev |
| Major | `lib/shared/web-search-anthropic.ts:121-128` | Normalizar/allowlist de URLs (rejeitar esquemas não-http(s)) e validar título pós-trim | @dev |
| Major | `lib/shared/web-search-ddg.ts:128,152` | Limitar a busca de `result__snippet` ao scope do resultado actual (sem snippet → não roubar o do próximo) | @dev |
| Major | `tests/unit/api/conhecimento/web-search.test.ts:132` | Cobrir `query` não-string e query acima do limite (novos paths da route) | @dev |
| Major | `tests/unit/lib/shared/web-search-anthropic.test.ts:168` | Cobrir truncamento `MAX_EXCERPT_LENGTH` em `parseAnthropicWebSearch` | @dev |
| Refactor | `tests/unit/components/conhecimento/WebSearchSaveModal.test.tsx:153` | Testar fecho por Escape/backdrop + edge case validação de título | @dev |

## Lições

- CodeQL e CodeRabbit apanham coisas diferentes: o CodeQL Iter 2 ficou SUCCESS mas o
  CR server-side tinha findings de produção desde a Iter 1 que nunca foram resolvidos.
- O **CodeRabbit CLI local** (`-t uncommitted`) só vê o diff staged/uncommitted — NÃO
  substitui o CR server-side no PR. 0 findings no CLI não significa PR limpo.
- merge-authority condição 3 (0 comentários actionable no head) é o gate que apanhou isto.
  Verificar SEMPRE os comentários CR no head, não confiar só no check "CodeRabbit Status".
- `original_commit_id` antigo + `commit_id` re-ancorado ao head novo = finding NÃO resolvido
  (GitHub move comentários abertos para o head actual).

## Próximo (next_action)

1. **@architect** ratifica o fix do Critical SSRF (origem interna de confiança — decisão
   de config/env, ver `internal-state-contract-gate.md` para o padrão SSRF/cookie).
2. **@dev** `*apply-qa-fixes` aos 7 findings + testes; gates locais verdes (vitest +novos).
3. **@devops** push ff (dispara CodeQL Iter 2 já verde + CR re-review). Aguarda CR APPROVED
   no head novo + CodeQL SUCCESS + 0 actionable.
4. **@devops** auto-merge `gh pr merge 72 --repo DaSilvaAlves/ecosistema-ia-avancada-pt
   --admin --squash --delete-branch` se as 6 condições verdes.
5. **@po** `*close-story 5.11` (Epic 5 → 11/13).

## Comando de retoma (@devops, após @dev/@architect corrigirem)

```bash
cd "C:/Users/XPS/Documents/ecosistema-ia-avancada-pt"
git checkout feat/nexus-v2-5.11-pesquisa-web && git pull --ff-only
cd imersao-tools/nexus/v2 && npm run lint && npm run typecheck && npx vitest run
# push ff → poll CI (CodeQL SUCCESS) + CR APPROVED head novo + 0 actionable → merge --admin --squash
```

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/RETOMA-20260614-story-5.11-PR-72-codeql-RESOLVIDO-bloqueado-CR-critical-major.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@devops (Gage)`
DATA: `14/06/2026`
