# QA Gate de Saída — Story 7.3 (Texto transcrito → cérebro multi-intent, FR79)

```yaml
schema: 1
story: '7.3'
gate: PASS
status_reason: 'AC1-AC5 satisfeitos e falsificáveis (C1-C4 com SpeechRecognition real, não mocka hooks); AC6 (E2E browser real + microfone) = verificação manual pendente do Eurico, não-bloqueador do merge técnico. Zero código de produção alterado (selagem por testes de pipeline já em main, open-closed). lint 0 erros / typecheck 0 / 2380 PASS (1 flake oauth-status pré-existente, isolado 6/6 PASS = não-regressão; efectivo 2381/2381). CodeRabbit --base main: 0 findings em código; 2 findings documentais na story (1 minor path, 1 major coerência readiness/flake), ambos não-bloqueadores.'
reviewer: 'Quinn'
updated: '2026-06-24T20:55:00Z'
top_issues:
  - id: 'CR-7.3-1'
    severity: low
    finding: 'Path de teste inconsistente na secção Testing da story (7.3.story.md:321-324): diz tests/unit/components/chat/InputBox.test.tsx; o real é tests/unit/components/InputBox.test.tsx. As Dev Notes já explicam a diferença (previsão vs. localização real).'
    suggested_action: 'Harmonizar a secção Testing com o path real (débito documental opcional). Não-bloqueante: o gate confirmou por execução real que o path é tests/unit/components/InputBox.test.tsx (13/13 PASS).'
  - id: 'CR-7.3-2'
    severity: low
    finding: 'Coerência readiness vs. flake (7.3.story.md:348-360): o bloco de output mostra "1 failed" enquanto a story está Ready for Review; o CR pediu isenção explícita e consistente do flake oauth-status.'
    suggested_action: 'Polish documental opcional: anotar o "1 failed" no bloco de output como flake conhecido isentado. Não-bloqueante: o gate confirmou independentemente que o 1 failed é o flake oauth-status (isolado 6/6 PASS = não-regressão da baseline pós-7.2).'
waiver: { active: false }
```

## Veredicto: PASS (Confiança Alta)

Gate de saída executado por Quinn (`@qa`) sobre o branch `feat/7.3-texto-transcrito-cerebro` (commit `83ef1831`, diff contra `main`). Executor `@dev` (Dex) != gate `@qa` — `separation-of-roles.md` respeitado. A 7.3 é lógica client-side de roteamento sem efeito externo → gate `@qa` (padrão EPIC-7 §5 row 7.3). Verificação ancorada no CÓDIGO REAL e em execução própria de lint/typecheck/testes/CodeRabbit, não apenas no relatório do `@dev`.

A 7.3 está pronta para `@devops` (PR + merge). Não foi alterado nenhum ficheiro de produção: a story sela por testes de alta fidelidade um pipeline voz → texto → cérebro que já existe em `main` após a 7.2 (D-7.3-PIPELINE-ROUTE opção A — manual-com-revisão, sem fluxo novo, precedente 6.13). Os 2 findings do CodeRabbit são documentais (na própria story), não-bloqueadores. AC6 (cenário E2E em browser real) é a única peça não verificável em CI — verificação manual pendente do Eurico.

---

## Tabela dos quality checks

| # | Quality Check | Resultado | Evidência |
|---|---------------|-----------|-----------|
| 1 | AC1-AC5 satisfeitos (vs código real) | PASS | 5/6 verificáveis em CI satisfeitos por C1-C4 + trace de código; AC6 (E2E browser+microfone) = manual pendente |
| 2 | Trace AC → fonte (No Invention, Artigo IV) | PASS | FR79 (PRD §6.14:238) literal; EPIC-7 §2/§5 row 7.3/§6 AC1 fiéis; D-7.2-TRANSCRIPT-CONTRACT opção b confirmada |
| 3 | Caminhos de falha sem sucesso silencioso (eixo c) | PASS | C3: erro de reconhecimento → `onSend`/`stream.submit` 0x + campo preservado. Falsificável |
| 4 | mock-protocol-fidelity (testes de alta fidelidade) | PASS | `SpeechRecognition` real em `window` (não mocka hooks); `results[0][0].transcript`. C1/C2 falhariam se o encadeamento estivesse quebrado |
| 5 | internal-state-contract-gate | PASS (âmbito reduzido) | Estado numa só camada (campo de texto local ao InputBox) → `@architect` dispensado. Eixo (a) `processing` transitório vs `idle` (C4); eixo (c) falha (C3) |
| 6 | Open-closed / não-regressão | PASS | Zero código de produção alterado; `useVoice` 17/17, `ChatPanel` 5/5, `VoiceModeButton` 7/7, 9 testes base InputBox intactos |
| 7 | Evidência lint/typecheck/test (corrida pelo `@qa`) | PASS | lint 0 erros; typecheck 0; 2380 PASS / flake oauth-status isolado 6/6 |
| 8 | CodeRabbit `--base main` (autoritativo do gate de saída) | PASS | 0 findings em código; 2 findings documentais na story (não-bloqueadores) |

---

## AC1-AC6 — verificação por critério

| AC | Estado | Evidência |
|----|--------|-----------|
| AC1 — E2E pipeline (transcrição → campo → Enviar → `stream.submit` → cérebro) | SATISFEITO (parte CI) | C1: `onTranscript`→campo (`value === "criar tarefa comprar leite"`)→Enter→`onSend` 1x com texto (trim). `ChatPanel.handleSend`→`stream.submit` verificado em `ChatPanel.tsx:134-139`. Parte browser-real = AC6 |
| AC2 — `processing` transitório → `idle` | SATISFEITO | C4: `aria-pressed` true (listening)→false (idle) após `onresult`. `voice.reset()` (`InputBox.tsx:90`) → `useVoiceModeState.ts:98-101` transita `processing→idle`. AUTO-DECISION T2 (no-op) validada |
| AC3 — não-regressão do pipeline existente | SATISFEITO | 9 testes base do InputBox intactos; suite 2381/2381; `useVoice.test.ts` 17/17, `ChatPanel.test.tsx` 5/5, `VoiceModeButton.test.tsx` 7/7 |
| AC4 — falha sem sucesso silencioso | SATISFEITO | C3: `emitError('no-speech')` → `onSend` 0x + campo mantém `"rascunho"`. Falsificável (eixo c `internal-state-contract-gate.md`) |
| AC5 — testes de integração `onTranscript` → `onSend` encadeados | SATISFEITO | C1 (feliz) + C2 (concatenação com espaço: `"tarefa: comprar leite"`) + C3 (falha). `SpeechRecognition` fiel ao protocolo, não mocka hooks |
| AC6 — EPIC-7 AC1 (browser real + microfone) | PENDENTE (manual) | Não mockável em CI nem executável pelo gate (sem browser/microfone). Verificação manual do Eurico — ver condição abaixo |

---

## CodeRabbit `--base main` — findings (autoritativo do gate de saída)

Comando: `coderabbit review --agent -t committed --base main` (WSL), sobre o diff completo `main...feat/7.3-texto-transcrito-cerebro`. O CR server-side definitivo correrá no PR (`@devops`) — este é o gate de saída local (`cr-base-main-no-gate-saida.md`).

```
CRITICAL: 0
MAJOR (código): 0
MINOR (código): 0
FINDINGS DOCUMENTAIS (7.3.story.md): 2 (1 minor + 1 major-da-story)
```

| # | Severidade CR | Ficheiro | Descrição | Bloqueia? |
|---|---------------|----------|-----------|-----------|
| CR-7.3-1 | minor | `7.3.story.md:321-324` | Path inconsistente na secção Testing (`.../chat/InputBox.test.tsx` vs real `.../components/InputBox.test.tsx`) | NÃO — documental; Dev Notes já explicam; gate confirmou path real (13/13 PASS) |
| CR-7.3-2 | major (na story) | `7.3.story.md:348-360` | Coerência readiness vs. output `1 failed` (flake `oauth-status`) | NÃO — documental; gate confirmou independentemente que o `1 failed` = flake (isolado 6/6 PASS = não-regressão) |

**Conclusão CR:** zero findings actionable em código de produção ou de teste. Ambos os findings são harmonização documental da própria story (severidade real: cosmética/clareza). O `@qa` confirmou por execução real os dois pontos que os findings levantam — pelo que não bloqueiam o merge.

---

## internal-state-contract-gate — análise de âmbito

A 7.3 **não está** no âmbito completo da regra: o estado vive **numa só camada** (campo de texto local ao `InputBox`, sem distribuição por SW/endpoint/reconciliação). Gate `@architect` correctamente dispensado (confirmado pelo `@po` na validação e ratificado aqui). Eixos verificados mesmo assim:

- **Eixo (a) classes de estado:** `processing` (transitório, durante reconhecimento) vs `idle` (pós-injecção). C4 prova a transição `listening → idle` após `onresult`; `voice.reset()` no `onTranscript` garante que `processing` nunca fica preso.
- **Eixo (c) caminhos de falha:** C3 prova que erro de reconhecimento (`no-speech`) NÃO dispara `onSend`/`stream.submit` e preserva o campo — zero envio silencioso de texto vazio ou de transcrição incorrecta.

---

## Evidência de execução (corrida pelo `@qa`)

```
LINT (npm run lint):           0 erros, 1 warning pré-existente (app/api/auth/logout/route.ts — fora de scope, não tocado)
TYPECHECK (npm run typecheck): 0 erros
INPUTBOX ISOLADO:              13 PASS (9 base Story 0.4/1.9 + 4 da 7.3 C1-C4), 347ms
SUITE FULL (npm run test:unit): 2381 testes — 2380 PASS, 1 FAIL
  FAIL único: oauth-status > "sem sessão → 401" — Test timed out 5000ms (flake cold-start, pré-existente)
  Isolado:    oauth-status 6/6 PASS (o teste em causa em 1350ms) — NÃO regressão da 7.3
  Suite efectiva: 2381/2381
CODERABBIT (--agent -t committed --base main, repo toplevel): 2 findings documentais
  0 CRITICAL · 0 MAJOR-código · 0 MINOR-código · 2 findings na 7.3.story.md (não-bloqueadores)
```

---

## Condições do gate

1. **AC6 — verificação manual pendente do Eurico (não-bloqueador do merge técnico):** em Chrome/Edge, sessão activa, microfone autorizado — dizer "criar tarefa comprar leite" → confirmar que o cérebro cria a tarefa (visível no `MessageList` + lista de tarefas). Registar evidência (browser + data + output observado) no Change Log. Fecha o AC1 do EPIC-7 (trace 7.1+7.2+7.3). Não executável em CI — é a única peça funcional que o gate automatizado não pode provar.
2. **Débitos documentais CR-7.3-1 e CR-7.3-2 (não-bloqueadores):** harmonização opcional da secção Testing da story (path + nota de flake).

---

## Próximo passo

Story 7.3 PASS — pronta para `@devops` (PR + merge). Sequência: `@devops` verifica as 6 condições de `merge-authority.md` no head SHA e faz auto-merge se verde (`--admin --squash --delete-branch` se `reviewDecision` stale; CR Status SUCCESS + 0 actionable no head é o sinal de verdade); depois `@po *close-story 7.3` (Status → Done, `git mv` `active/` → `completed/`, EPIC-7.md 2/10 → 3/10, Voice 2/4 → 3/4). A verificação manual AC6 pode correr em paralelo ao merge técnico ou antes do close-story, à escolha do Eurico.

---

*Gate de saída executado por Quinn (`@qa`), 24/06/2026. Evidência corrida localmente em `imersao-tools/nexus/v2` (testes) e no repo toplevel (CodeRabbit `--base main`).*
