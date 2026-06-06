# RETOMA — Saga classifier-fences (sessão 31/05/2026) · continuação

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** sessão principal (orquestração @devops/@dev/@po)
**to_agent:** any / Eurico
**created:** 2026-05-31
**status:** consumed
**consumed:** true
**consumed_at:** 2026-05-31T21:47:25Z
**consumed_by:** devops (Gage)
**prioridade:** MÉDIA — 1 decisão pendente (merge PR #49), sem urgência. Produção já recuperada.

> **CONSUMIDO 31/05/2026 21:47Z por Gage (`@devops`):** A decisão pendente (merge PR #49) foi resolvida. Eurico autorizou **Opção A**. PR #49 **MERGED** em `main` (squash commit `d553f91a`, `mergedAt 2026-05-31T21:47:25Z`), branch `fix/json-fences-prevention` eliminada no remote. `origin/main` avançou `ac89c118 → d553f91a`. CodeRabbit server-side correu e passou (SUCCESS 21:25:58Z) antes do merge — a janela de rate limit libertou. Saga classifier-fences 100% encerrada (4 PRs: #46 hotfix, #47 follow-up, #48 incident doc, #49 acção preventiva — todos em `main`).

## Summary

Sessão fechou o incidente de produção classifier-fences do Nexus v2 (produção down para prompts-com-ferramenta) e avançou até à acção preventiva da classe de bug. Hotfix + follow-up + registo de incidente já em `main` e produção verificada. Resta **uma decisão**: fazer merge do PR #49 (acção preventiva) — Opção A (merge já) ou Opção B (aguardar CodeRabbit server-side, bloqueado por rate limit Pro Plus).

## Estado consolidado — o que já está em `main`

| PR | O quê | Merge commit | Estado |
|----|-------|--------------|--------|
| #46 | Hotfix classifier-fences (strip de markdown fences client-side, ADR-9) | `77108b6e` | Merged · **verificado em produção** |
| #47 | Follow-up CR F2/F3 (JSDoc + teste edge) | `6191bc4c` | Merged |
| #48 | Registo de fecho do incidente (`docs/incidents/`) | `ac89c118` | Merged |

`origin/main` actual = `ac89c118`. Branch local actual = `main` (limpa, branches órfãs eliminadas).

**Verificação de produção (PASS):** prompt "anota a tarefa de comprar pão" → tool `criar_tarefa` correu OK, tarefa "Comprar pão" criada (id `2160a5e7-bd54-47bf-9a18-bfbef2e2701a`), banner UndoStore "1 acção criada".

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## DECISÃO PENDENTE — PR #49 (acção preventiva)

| Item | Valor |
|------|-------|
| PR | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt/pull/49 — OPEN, `CLEAN` |
| Branch | `fix/json-fences-prevention` (base `main` `ac89c118`) |
| SHA | `c1d60cfe` (pushed) |
| Ficheiros | `v2/lib/agent/classifier-json.ts` (corrige multi-block fenced + JSDoc) · `v2/tests/unit/agent/classifier-json.test.ts` (NOVO, 18 testes) |
| Gates locais | typecheck PASS · lint PASS · vitest 1136/1136 · build PASS · CR pre-commit 0 findings |
| CI server-side | 100% verde |
| CodeRabbit server-side | **NÃO correu** — rate limit org Pro Plus (janela ~40 min). Re-disparado (`@coderabbitai review`, ack 21:20Z). O check "CodeRabbit Status: SUCCESS" no rollup NÃO é o veredicto formal. |

**O que o #49 faz:** auditoria transversal confirmou que a classe de bug JSON-em-fences está fechada — os 2 classifiers (server `providers/anthropic.ts` + client `inference-transport.ts`) já passam pelo `stripJsonMarkdownFences` partilhado; o executor parseia wire protocol nativo (`input_json_delta`) e correctamente NÃO leva strip. O Dex corrigiu ainda uma lacuna real (múltiplos blocos fenced partiam o parse) e adicionou cobertura directa. Commit traz `Directive:` permanente: nunca `JSON.parse` de texto livre do LLM sem o strip partilhado.

**Correcção factual registada:** a "reincidência do executor (18/05)" era afinal variante de prosa do *classifier* (PR #24), não o executor real — clarificado por git history.

### next_action

Decidir o merge do #49:
- **Opção A** — merge já: `gh pr merge 49 --repo DaSilvaAlves/ecosistema-ia-avancada-pt --squash --delete-branch` (tem mudança de runtime, mas cirúrgica, 18 testes directos, CR pre-commit local 0 findings, CI 100% verde). Como é runtime, a dispensa do CR server-side é menos confortável que no #47 (doc-only) — é uma chamada do Eurico.
- **Opção B** — aguardar o CR server-side libertar a quota (~40 min) e mergear após veredicto formal. Mais conservador. Sem urgência (produção já está sã).

O merge é exclusivo do `@devops` (Gage). Handoff específico do #49 já existe: `RETOMA-20260531-json-fences-prevention-pr-49-aberto-ready-for-eurico.md`.

## Notas para a próxima sessão

- **Rate limit CodeRabbit:** a org está sem créditos Pro Plus — afectou #47 e #49. Se o padrão persistir, ponderar repor créditos ou ajustar a política de CR para PRs doc-only/low-runtime.
- **Follow-ups não-bloqueadores:** nenhum pendente da saga além da decisão #49.
- **Memórias actualizadas:** `project_nexus_v2_hotfix_classifier_fences_resolved` (índice MEMORY.md actualizado). Registo formal: `imersao-tools/nexus/docs/incidents/INCIDENT-20260531-classifier-fences-CLOSED.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-saga-classifier-fences-CONTINUACAO.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `sessão principal (orquestração)` · DATA: `31/05/2026`
