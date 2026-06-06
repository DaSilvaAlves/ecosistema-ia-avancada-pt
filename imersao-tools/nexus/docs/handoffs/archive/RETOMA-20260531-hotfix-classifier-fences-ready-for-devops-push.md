# RETOMA — Hotfix classifier-fences implementado · `@devops *push` expedito

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> CONSULTAR `.claude/rules/handoff-location.md`.

**from_agent:** dev (Dex) — hotfix implementado
**to_agent:** devops (Gage) — `*push` expedito + PR + CR server-side
**created:** 2026-05-31
**status:** pending
**prioridade:** CRÍTICA — produção down para prompts-com-ferramenta

## Summary

Dex (`@dev`) implementou o hotfix do classifier-fences (incidente `RETOMA-20260531-HOTFIX-classifier-fences-producao-down.md`, consumido). Branch `fix/classifier-fences-client`, commit `201c7e98` (7 ficheiros). Todos os gates locais verdes, incluindo **e2e:regression 30/30 com o classifier fenced** (prova o strip end-to-end). Pronto para push expedito.

## Estado

| Item | Valor |
|------|-------|
| Branch | `fix/classifier-fences-client` (criada de `main` `1a983da9`) |
| Commit | `201c7e98` |
| Tipo | Hotfix de produção (sem story — SOP `reference_sop_hotfix_producao`) |
| Git | Commitado localmente (push exclusivo `@devops`) |

## Gates locais (Dex, 31/05/2026) — todos GREEN

| Gate | Resultado |
|------|-----------|
| typecheck | PASS |
| lint | PASS (1 warning pré-existente alheio) |
| vitest | **1117/1117 PASS** (88 ficheiros; +2 testes de fidelidade) |
| build | PASS |
| **e2e:regression** | **30/30 PASS · 20 skipped** — agora com o classifier a devolver JSON **fenced** (prova o `stripJsonMarkdownFences` no fluxo real do browser) |

CodeRabbit local NÃO corrido (produção down → expedir). **CR server-side no PR é o gate** (alteração cirúrgica, baixo risco).

## Ficheiros

**Criado:** `v2/lib/agent/classifier-json.ts` (módulo partilhado), `docs/handoffs/RETOMA-...-HOTFIX-...-producao-down.md` (consumido).
**Modificado:** `v2/lib/agent/inference-transport.ts` (aplica strip), `v2/lib/agent/providers/anthropic.ts` (importa do partilhado), `v2/tests/mocks/proxy-fetch.ts` + `v2/tests/e2e/regression/helpers/mock-events.ts` (classifier fenced), `v2/tests/unit/agent/inference-transport.test.ts` (+2 fidelidade).

## next_action

`@devops *push`: push da branch `fix/classifier-fences-client` (HEAD `201c7e98`), abrir PR contra `main` (`--repo DaSilvaAlves/ecosistema-ia-avancada-pt`), CR server-side. **Expedir** (produção down). Se CR 0 CRITICAL + CI verde → Eurico merge → **re-verificação em produção**: "anota a tarefa de comprar pão" deve criar a tarefa. Depois (opcional) `@po` regista o incidente/fecho.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

- PROJECTO: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-hotfix-classifier-fences-ready-for-devops-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Dex (@dev)` · DATA: `31/05/2026`
