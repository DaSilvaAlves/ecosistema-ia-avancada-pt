# RETOMA — Acção preventiva JSON-em-fences do LLM — READY FOR @devops PUSH

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

| Campo | Valor |
|-------|-------|
| from_agent | dev (Dex) |
| to_agent | devops (Gage) |
| created | 31/05/2026 |
| status | pending |
| projecto | Nexus v2 (`imersao-tools/nexus/v2`) |
| branch | `fix/json-fences-prevention` (de `main` `ac89c118`) |
| commit local | `c1d60cfe` (NÃO pushed) |
| next_action | push da branch + abrir PR para `main` |

---

## Sumário

Acção preventiva transversal para fechar de vez a classe de bug "JSON do LLM vem
em markdown fences e o `JSON.parse` rebenta" (INCIDENT-20260531-classifier-fences,
reincidente 3x: 09/05 server, 18/05 prosa-variant server, 31/05 client). Auditado
todo o `v2/`, confirmada a cobertura completa do strip partilhado, corrigida uma
lacuna real (múltiplos blocos fenced) e adicionada cobertura directa exaustiva ao
módulo single-source-of-truth.

## Auditoria — todos os pontos de parse de JSON do LLM

| Ponto | Veredicto | Nota |
|-------|-----------|------|
| `providers/anthropic.ts` `classify` (server) | SEGURO | Já aplica `stripJsonMarkdownFences` (hotfixes 09/05+18/05). Confirmado sem regressão. |
| `inference-transport.ts` `classify` (client) | SEGURO | Já aplica `stripJsonMarkdownFences` (hotfix 31/05 PR #46). Confirmado sem regressão. |
| `providers/anthropic.ts` executor `tool_use` (`JSON.parse(jsonAccumulator)`) | SEGURO — N/A | Parseia o wire protocol nativo `input_json_delta` (args estruturados do SDK), NÃO texto livre. Strip seria incorrecto. |
| `inference-transport.ts` executor `tool_use` | SEGURO — N/A | Idem (paridade client). |
| `inference-transport.ts` SSE frames (L157/166) + error body (L189) | SEGURO — N/A | Wire JSON / corpo de erro, não texto-livre-com-fences. |
| `app/api/anthropic/proxy/route.ts` | SEGURO — N/A | Pass-through transparente, não parseia conteúdo do modelo. |
| `lib/markets/index.ts` | SEGURO — N/A | Parseia API Yahoo Finance (não-LLM). |
| `lib/auth/session.ts` | SEGURO — N/A | Parseia sessão KV (não-LLM). |
| `lib/db/migrations/v1-to-v2.ts` | SEGURO — N/A | Parseia localStorage (não-LLM). |
| Telegram / push / onboarding routes | SEGURO — N/A | Não consomem output do LLM. |

Conclusão: os únicos pontos que parseiam texto livre do LLM são os 2 classifiers,
e ambos já passam pelo strip partilhado. A correcção 09/05 e 18/05 (classifier
server) e 31/05 (classifier client) continuam aplicadas e não regrediram. A nota
"executor" na tabela de reincidência do INCIDENT refere o PR #24 (variante de prosa
do classifier), não o executor real — clarificado pela leitura do git history.

## Alterações

| Ficheiro | Alteração |
|----------|-----------|
| `v2/lib/agent/classifier-json.ts` | Robustez: Caso 1 (strip simétrico) cai para extracção balanceada quando o conteúdo entre os fences extremos ainda tem marcador ` ``` ` residual (múltiplos blocos). +JSDoc. |
| `v2/tests/unit/agent/classifier-json.test.ts` | NOVO — 18 testes directos ao módulo SSOT (fences com/sem language tag, whitespace, prosa antes/depois, múltiplos blocos, fence sem fecho, chavetas em strings, JSON-only intacto; `extractFirstJsonObject` isolado). |

## Gates locais (todos GREEN)

| Gate | Resultado |
|------|-----------|
| typecheck (`tsc --noEmit`) | PASS |
| lint (`next lint`) | PASS (só warning pré-existente em `logout/route.ts`, não tocado) |
| vitest (`vitest run`) | 1136/1136 PASS (+18 novos) |
| build (`next build`) | PASS |
| CodeRabbit pre-commit (`-t uncommitted`) | 0 findings |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Para o @devops (Gage)

1. `git push` da branch `fix/json-fences-prevention` (commit `c1d60cfe`).
2. Abrir PR para `main`:
   - Título sugerido: `fix(nexus-v2): fecha classe de bug JSON-em-fences do LLM — strip partilhado robusto + audit [ADR-9]`
   - Corpo: resumo da auditoria + alterações + gates (acima).
   - `gh pr create` precisa de `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
3. Aguardar CI verde + CodeRabbit server-side. Política hard-stop §8: máx 2 iterações CR; Iter 3 ou merge waived exigem autorização humana.

Notas:
- Submódulos `comunidade`/`starter-builder` e `INDEX.md` aparecem modificados no working tree mas NÃO fazem parte deste trabalho — não staged, não incluir.
- Sem alterações de runtime no caminho server/client além da robustez do módulo partilhado (zero risco de regressão: todos os casos previamente verdes continuam verdes; multi-block passa de FAIL a OK).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-json-fences-prevention-ready-for-devops-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `dev (Dex)`
DATA: `31/05/2026`

---

## CONSUMO (Gage / @devops)

- consumed: true
- consumed_at: 2026-05-31T21:21:00Z
- consumed_by: devops (Gage)
- status: consumed
- resultado: branch pushed `c1d60cfe`, PR #49 OPEN vs main, CI 100% verde (CLEAN), CR server-side em rate limit (re-trigger postado, ack "Review triggered"). NÃO merged — aguarda decisão do Eurico.
