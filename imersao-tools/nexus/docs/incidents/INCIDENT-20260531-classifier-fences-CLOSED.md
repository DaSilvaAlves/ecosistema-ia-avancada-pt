# INCIDENT-20260531 — Classifier client-side não faz strip de markdown fences (CLOSED)

> Registo formal de fecho de incidente de produção. Hotfix sem story, conforme SOP `docs/sops/hotfix-producao.md` (memória `reference_sop_hotfix_producao`).
> Este documento NÃO substitui os handoffs nem a memória do incidente — consolida-os para auditoria. Ver secção "Fontes" no fim.

---

## Cabeçalho

| Campo | Valor |
|-------|-------|
| ID do incidente | INCIDENT-20260531-classifier-fences |
| Título | Classifier client-side (ADR-9) não faz strip de markdown fences antes do `JSON.parse` |
| Sistema | Nexus v2 (`imersao-tools/nexus/`) — produção `https://imersao.ia.expressia.pt` |
| Severidade | CRÍTICA — produção down para todos os prompts-com-ferramenta (cérebro multi-intent) |
| Tipo | Hotfix de produção sem story (SOP hotfix-producao) |
| Estado final | CLOSED |
| Detectado por | Gage (`@devops`) na verificação manual pós-deploy da Story 1.12 (gate `@architect` §9.4) |
| Data de detecção | 31/05/2026, ~18:27 |
| Data de fecho | 31/05/2026 |
| Janela do incidente | < ~1h (detecção → fix → merge → verificação em produção no mesmo dia) |

---

## Sintoma observado

No chat live (`imersao.ia.expressia.pt`), o prompt **"anota a tarefa de comprar pão"** devolvia erro de rede em vez de criar a tarefa:

```text
Erro de rede: InferenceTransport: resposta do classifier não é JSON válido —
recebido: ```json {"intents":["tasks"],"confidence":{"tasks":0.96}} ```
```

O JSON era válido — vinha apenas embrulhado em markdown fences (```` ```json ... ``` ````) emitidos pelo modelo Haiku. Nenhuma tool corria porque o classifier nunca chegava a classificar o prompt como acção.

## Causa raiz

Ausência de strip dos markdown fences antes do `JSON.parse` no classifier **client-side**.

| Local | Comportamento antes do fix |
|-------|----------------------------|
| `v2/lib/agent/providers/anthropic.ts` (server-side) | TINHA `stripJsonMarkdownFences()` (de hotfixes 09/05 + 18/05) e aplicava-o antes do parse |
| `v2/lib/agent/inference-transport.ts` (client-side, Phase 1 / ADR-9) | NÃO fazia strip — `JSON.parse(rawResponse)` directo, dentro do `classify` |

Trata-se de uma **regressão da migração client-side (ADR-9 / Story 1.11)**: o `InferenceTransport` reimplementou o parsing do classifier mas omitiu a protecção de fences já existente no caminho server-side. O bug era pré-existente desde a Phase 1; ficou visível agora porque o fix D-FETCH-BIND da Story 1.12 deixou de o mascarar.

### Porque os testes não apanharam

Os mocks do classifier (unit e E2E) devolviam JSON limpo, sem fences — não reflectiam o output real do Haiku. Mais um caso da regra `mock-protocol-fidelity.md`.

### Reincidência reconhecida

Esta é a **terceira ocorrência** da mesma classe de bug (classifier vs markdown fences):

| Data | Caminho afectado | Hotfix |
|------|------------------|--------|
| 09/05/2026 | classifier server-side | PR #15 (origem do SOP hotfix) |
| 18/05/2026 | executor / system-prompt server-side | hotfix executor |
| 31/05/2026 | classifier client-side (ADR-9) | PR #46 (este incidente) |

A correcção desta vez consolidou a lógica num módulo partilhado (DRY) para evitar uma 4ª divergência.

---

## Correcção (ADR-9)

Abordagem cirúrgica e DRY: extrair a lógica de strip para um módulo partilhado reutilizado em ambos os caminhos (server e client).

| Ficheiro | Alteração |
|----------|-----------|
| `v2/lib/agent/classifier-json.ts` | NOVO módulo partilhado — `stripJsonMarkdownFences` (+ `extractFirstJsonObject`), string-processing puro, Edge-safe, sem dependências |
| `v2/lib/agent/inference-transport.ts` | `classify` passa a aplicar `stripJsonMarkdownFences(rawResponse)` antes do `JSON.parse`; preserva `rawResponse` original no `ClassificationResult` (NFR11 / PII) |
| `v2/lib/agent/providers/anthropic.ts` | Passa a importar `stripJsonMarkdownFences` do módulo partilhado (comportamento inalterado) |
| `v2/tests/unit/agent/inference-transport.test.ts` | +2 testes de fidelidade que reproduzem o caso de produção (JSON com fences) e falham se o strip for removido |
| mocks (`proxy-fetch.ts`, `mock-events.ts`) | Mocks do classifier passam a devolver JSON COM fences, fechando o buraco que deixou passar a regressão |

---

## Evidência de verificação em produção

Após deploy Vercel automático do merge do PR #46, repetido o mesmo prompt em `imersao.ia.expressia.pt`:

| Verificação | Resultado |
|-------------|-----------|
| Prompt "anota a tarefa de comprar pão" | Classificado como acção `tasks` |
| Tool `criar_tarefa` | Correu OK |
| Tarefa criada | "Comprar pão" — id `2160a5e7-bd54-47bf-9a18-bfbef2e2701a` |
| UndoStore | Banner "1 acção criada" exibido |

---

## Gates e CI

| Gate | Resultado |
|------|-----------|
| typecheck (local) | PASS |
| lint (local) | PASS |
| vitest (local) | 1117/1117 (+2 testes de fidelidade) |
| build (local) | PASS |
| e2e:regression (local) | 30/30 com classifier fenced — prova o strip end-to-end |
| CI PR #46 | 100% verde (Vitest, regression, Playwright E2E, CodeQL) |
| CodeRabbit PR #46 | Só Minor/Nitpick — zero CRITICAL/MAJOR |

---

## PRs e commits envolvidos

| Item | Detalhe |
|------|---------|
| Branch hotfix | `fix/classifier-fences-client` (de `main` limpo) — eliminada após merge |
| Commits hotfix | `201c7e98` / `6b76dc57` (fix); `6b76dc5` resolveu F1 (MD040) antes do merge |
| PR #46 | `fix(nexus-v2): classifier client-side faz strip de markdown fences (hotfix produção) [ADR-9]` — squash-merged em `main`, merge commit **`77108b6e`** |
| PR #47 (follow-up) | CR findings F2 (JSDoc stale) + F3 (teste edge fence malformado) — doc + teste, sem runtime — squash-merged em `main`, merge commit **`6191bc4c`**; branch `chore/cr-followup-classifier-fences` eliminada após merge |
| CR follow-up | Dispensado por autorização do Eurico (rate limit CodeRabbit Pro Plus); zero waivers de qualidade |

> Nota de auditoria: ambos os PRs (#46, merge commit `77108b6e`; #47, merge commit `6191bc4c`) estão merged em `main`. Este registo de fecho foi levado a `main` através da branch própria `docs/incident-classifier-fences`, assente sobre `origin/main` (`6191bc4c`).

---

## Lições aprendidas

1. **Lógica de protecção de protocolo deve ser partilhada, não duplicada.** A regressão nasceu de o caminho client-side (ADR-9) reimplementar o parsing do classifier sem herdar a protecção de fences já existente no server-side. A correcção centralizou a lógica em `classifier-json.ts` — reutilizada por ambos os caminhos. Qualquer futuro caminho de inferência deve importar deste módulo.
2. **Mocks de protocolo externo têm de reflectir o output real.** Os mocks devolviam JSON limpo; o Haiku devolve JSON com fences. Reforça a regra `mock-protocol-fidelity.md` — os testes de fidelidade adicionados falham se o strip for removido.
3. **Verificação manual pós-deploy apanha o que os testes não apanham.** O gate `@architect` §9.4 (verificação manual em produção após a Story 1.12) foi o que expôs este bug — exemplo concreto do valor desse passo.
4. **Migrações de caminho (server → client) são pontos de risco de regressão de hotfixes anteriores.** Ao migrar lógica, auditar explicitamente os hotfixes de produção já aplicados ao caminho antigo, para garantir que são herdados pelo novo.

---

## Fontes (não duplicar — referência)

| Tipo | Localização |
|------|-------------|
| Memória de fecho | `project_nexus_v2_hotfix_classifier_fences_resolved` (auto-memory do projecto) |
| SOP aplicado | `docs/sops/hotfix-producao.md` (memória `reference_sop_hotfix_producao`) |
| Handoff de detecção | `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-HOTFIX-classifier-fences-producao-down.md` |
| Handoff de saída (hotfix) | `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-hotfix-classifier-fences-ready-for-devops-push.md` |
| Handoff follow-up (arquivado) | `imersao-tools/nexus/docs/handoffs/archive/RETOMA-20260531-cr-followup-classifier-fences-ready-for-push.md` |
| Corpo dos PRs | `imersao-tools/nexus/docs/PR-BODY-HOTFIX-classifier-fences.md`, `imersao-tools/nexus/docs/PR-BODY-CR-FOLLOWUP-classifier-fences.md` |

---

*Registo de fecho criado por Pax (`@po`) em 31/05/2026. Estado: CLOSED. Zero pendentes.*
