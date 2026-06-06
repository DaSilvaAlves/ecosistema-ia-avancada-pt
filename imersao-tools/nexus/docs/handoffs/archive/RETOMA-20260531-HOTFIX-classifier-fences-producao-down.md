# RETOMA — HOTFIX PRODUÇÃO: classifier client-side não faz strip de markdown fences

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** devops (Gage) — incidente detectado em verificação pós-deploy da Story 1.12
**to_agent:** dev (Dex) — implementar hotfix · depois devops (Gage) — push expedito
**created:** 2026-05-31
**status:** consumed
**consumed:** true
**consumed_at:** 2026-05-31T00:00:00Z
**consumed_by:** dev (Dex)
**prioridade:** CRÍTICA — produção down para prompts-com-ferramenta

> **CONSUMIDO** por Dex (`@dev`). Hotfix implementado na branch `fix/classifier-fences-client`. Os 3 pontos cumpridos: (1) `lib/agent/classifier-json.ts` criado (`stripJsonMarkdownFences` + `extractFirstJsonObject` extraídas de `anthropic.ts`); (2) `inference-transport.ts` aplica o strip antes do `JSON.parse`; `anthropic.ts` importa do partilhado (comportamento inalterado); (3) mocks do classifier (`proxy-fetch.ts` + `mock-events.ts`) passam a devolver JSON COM fences + 2 testes de fidelidade dedicados em `inference-transport.test.ts` (reproduzem o caso de produção). Gates locais: typecheck PASS, lint PASS, **vitest 1117/1117** (+2), build PASS. Handoff de saída para `@devops *push` expedito.

## Summary

A verificação manual pós-deploy da Story 1.12 (recomendada pelo gate `@architect` §9.4) apanhou um **segundo bug de produção**. O fix D-FETCH-BIND resolveu o `Illegal invocation`, mas expôs o bug seguinte na mesma cadeia: o **`InferenceTransport.classify` (client-side, Phase 1/ADR-9) não faz strip de markdown fences** antes do `JSON.parse`, ao contrário do `AnthropicClassifier` server-side. O Haiku embrulha o JSON em ```` ```json ... ``` ```` → o parse rebenta → cérebro down para todos os prompts-com-ferramenta.

## Evidência (produção, 31/05/2026 18:27)

Erro no chat live (`imersao.ia.expressia.pt`), prompt "anota a tarefa de comprar pão":

````text
Erro de rede: InferenceTransport: resposta do classifier não é JSON válido —
recebido: ```json {"intents":["tasks"],"confidence":{"tasks":0.96}} ```
````

O JSON é válido — só vem **dentro de fences**. O classify faz `JSON.parse(rawResponse)` directo.

## Causa-raiz (verificada em código)

| Local | Comportamento |
|-------|---------------|
| `lib/agent/providers/anthropic.ts` (server-side) | TEM `stripJsonMarkdownFences()` (hotfixes 09/05 + 18/05) e aplica-o: `const cleaned = stripJsonMarkdownFences(rawResponse); JSON.parse(cleaned)` (`:234-243`) |
| `lib/agent/inference-transport.ts` (client-side, Phase 1) | NÃO faz strip: `JSON.parse(rawResponse)` directo (`classify`, ~`:283`). O comentário `:236` assume (erradamente) que o strip é feito downstream — mas o throw acontece ANTES, dentro do `classify`. |

**Regressão da migração client-side (ADR-9/Story 1.11):** o `InferenceTransport` reimplementou o parsing do classifier mas omitiu a protecção de fences de 2 hotfixes de produção anteriores.

**Porque os testes não apanharam:** os mocks do classifier (unit + E2E) devolvem JSON limpo, sem fences. Mais um caso de `mock-protocol-fidelity.md` — o mock não reflecte o output real do Haiku.

## Fix recomendado (cirúrgico, baixo risco)

1. **Extrair `stripJsonMarkdownFences` (+ `extractFirstJsonObject`) para módulo partilhado** (ex.: `lib/agent/classifier-json.ts`) e reutilizar **em ambos**: `AnthropicClassifier.classify` (server) e `InferenceTransport.classify` (client). DRY — evita uma 3ª divergência. (Edge-safe: é string-processing puro, sem deps.)
2. `InferenceTransport.classify` aplica `stripJsonMarkdownFences(rawResponse)` antes do `JSON.parse`; preservar `rawResponse` original no `ClassificationResult.rawResponse` (NFR11/PII, como o server-side faz).
3. **Teste de fidelidade (obrigatório, `mock-protocol-fidelity.md`):** o mock do classifier no transport (unit + E2E `route-handler.ts`) passa a devolver JSON **com fences** (```` ```json\n{...}\n``` ````). ≥1 teste que **falha** se o strip for removido. Isto fecha o buraco que deixou passar a regressão.

## Caminho

Hotfix de produção (SOP `reference_sop_hotfix_producao`): **`@dev` implementa** (branch `fix/classifier-fences-client` ou hotfix) → quality gate rápido (`@architect` ou self, dada a urgência) → **`@devops` push expedito** → merge → re-verificar em produção o mesmo prompt.

Story 1.12 NÃO reabre (foi correctamente fechada — o seu scope era D-FETCH-BIND + re-rota + UndoStore). Este é um bug **separado**, pré-existente desde a Phase 1, agora visível porque o D-FETCH-BIND deixou de mascarar.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-HOTFIX-classifier-fences-producao-down.md`. CONSULTAR `.claude/rules/handoff-location.md`.

---

## next_action

`@dev` (Dex) — implementar o fix (3 pontos acima): extrair helper partilhado, aplicar no `InferenceTransport.classify`, teste de fidelidade com fences. Depois `@devops *push` expedito. Re-verificar em produção: "anota a tarefa de comprar pão" deve criar a tarefa.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-HOTFIX-classifier-fences-producao-down.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Gage (@devops)`
DATA: `31/05/2026`
