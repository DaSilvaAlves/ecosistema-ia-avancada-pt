# QA Gate de Saída — Story 7.4 (Web Speech synthesis PT-PT lê resposta do cérebro, FR80)

```yaml
schema: 1
story: '7.4'
gate: PASS
status_reason: 'AC1-AC7 satisfeitos e falsificáveis (25 testes novos, mock fiel ao protocolo SpeechSynthesis; C1 falsificável — done→speak com texto/lang/voz; R2 cleanup voiceschanged listenerCount 1→0). AC8 (ouvir voz real em browser+altifalante+sessão) = verificação manual pendente do Eurico, não-bloqueador do merge técnico (padrão AC6/7.3, AC13/4.9). Open-closed CONFIRMADO: useAgentStream/useVoice/useVoiceModeState/VoiceModeButton intactos (diff vazio). lint 0 erros / typecheck 0 / 2405 PASS (= baseline 2380 + 25 novos; 1 flake oauth-status pré-existente, isolado 6/6 PASS = não-regressão). CodeRabbit --base main: 4 findings (1 Major + 3 Minor), TODOS não-bloqueadores — o Major é falso-positivo defensivo (provado por código upstream: useAgentStream.submit faz setEvents([]), pelo que stale deltas de runs anteriores não podem coexistir com o done da run activa em stream.events).'
reviewer: 'Quinn'
updated: '2026-06-25T02:10:00Z'
top_issues:
  - id: 'CR-7.4-MAJOR'
    severity: major
    finding: 'ChatPanel.tsx:162-186 — synthesisTextRef reconstrói o texto de TODOS os text_delta de stream.events sem filtrar por runId; o CR alerta que stale deltas de runs anteriores poderiam contaminar a síntese da run actual.'
    suggested_action: 'FALSO-POSITIVO DEFENSIVO — não-bloqueador. Provado por código upstream: useAgentStream.submit (hooks/useAgentStream.ts:363) faz setEvents([]) no início de cada run, repondo stream.events a vazio. Logo, quando o efeito de síntese corre sobre o done da run activa, stream.events só contém eventos dessa run — text_delta de runs anteriores já não existem. O cenário descrito não pode ocorrer. RECOMENDAÇÃO opcional ao @dev: aplicar o filtro e.runId === last.runId é defesa-em-profundidade de baixo custo que torna o ChatPanel robusto independentemente do contrato do hook upstream (melhoria de robustez, não correcção de defeito).'
  - id: 'CR-7.4-MINOR-1'
    severity: minor
    finding: '7.4.story.md:572-581 — cabeçalho "Novos (4)" não bate certo com as 6 entradas listadas na tabela de File List (3 prod + 3 testes).'
    suggested_action: 'Erro documental na story (fora da zona QA Results, que é a única que o @qa pode editar). Não-bloqueador. Corrigir cabeçalho para "Novos (6)" (ou separar prod/testes) — @dev ou @po no close-story.'
  - id: 'CR-7.4-MINOR-2'
    severity: minor
    finding: 'ChatPanel.synthesis.test.tsx:230-232 (C3) — verifica que cancel E submit foram chamados, mas não a ORDEM (cancel antes de submit) exigida por AC3/R1.'
    suggested_action: 'Não-bloqueador. O código JÁ garante a ordem (handleSend é sequencial síncrono: cancel→limpar ref→submit, ChatPanel.tsx:194-196). Melhoria de teste opcional: adicionar expect(cancelSpy.mock.invocationCallOrder[0]).toBeLessThan(submitSpy.mock.invocationCallOrder[0]).'
  - id: 'CR-7.4-MINOR-3'
    severity: minor
    finding: 'ChatPanel.synthesis.test.tsx — testes de encadeamento done→speak só cobrem status="success"; falta um caso status="partial" (deve falar) e um status não-success/partial (não deve falar).'
    suggested_action: 'Não-bloqueador. O código trata partial igual a success (ChatPanel.tsx:174) e ignora outros status; o caminho está coberto pela leitura de código + AC2. Melhoria de cobertura opcional ao @dev: 2 testes extra reutilizando o helper doneSuccess.'
waiver: { active: false }
```

## Veredicto: PASS (Confiança Alta)

Gate de saída executado por Quinn (`@qa`) sobre o branch `feat/7.4-speech-synthesis` (commit `46d1e737`, diff contra `main` HEAD `34a66899`). Executor `@dev` (Dex) != gate `@qa` — `separation-of-roles.md` respeitado. A 7.4 é síntese de voz client-side pura (sem server, sem route nova) → gate `@qa` (padrão EPIC-7 §5 row 7.4). Verificação ancorada no CÓDIGO REAL e em execução própria de lint/typecheck/testes/CodeRabbit, não apenas no relatório do `@dev`.

A 7.4 está pronta para `@devops` (PR + merge). Fecha o sub-âmbito Voice (4/4) do Epic 7. Os 4 findings do CodeRabbit `--base main` são todos não-bloqueadores: o único Major é falso-positivo defensivo (refutado pelo contrato do `useAgentStream`, que repõe `stream.events` a vazio em cada `submit`); os 3 Minor são melhorias incrementais de documentação/testes. AC8 (ouvir a resposta em voz real) é a única peça não verificável em CI — verificação manual pendente do Eurico em Chrome/Edge.

---

## Tabela dos quality checks

| # | Quality Check | Resultado | Evidência |
|---|---------------|-----------|-----------|
| 1 | AC1-AC7 satisfeitos (vs código real) | PASS | 7/8 verificáveis em CI satisfeitos (25 testes + trace de código); AC8 (ouvir voz real) = manual pendente Eurico |
| 2 | Trace AC → fonte (No Invention, Artigo IV) | PASS | FR80 (PRD §6.14 L239) literal; EPIC-7 §5 row 7.4 (L83) "Toggle de voz on/off" + §4 (L54) fiéis; D-7.4-TOGGLE/TRIGGER/SOURCE traçadas |
| 3 | Caminhos de falha sem sucesso silencioso (eixo c) | PASS | AC5: unsupported → isSupported=false, speak/cancel no-op, sem crash; AC4: sem voz pt → fallback gracioso (lang continua pt-PT, voice null); toggle OFF → não fala. Falsificáveis |
| 4 | mock-protocol-fidelity (testes de alta fidelidade) | PASS | Mock fiel SpeechSynthesis/SpeechSynthesisUtterance + voiceschanged assíncrono (espelha mock SpeechRecognition 7.2); C1 falhavaila se done→speak quebrado |
| 5 | GOTCHA spokenRunIdRef (ordem vs reconciliação toggle off→on) | PASS | Marcação spokenRunIdRef DEPOIS do check do toggle (ChatPanel.tsx:181-184): se a run termina antes da reconciliação ON do localStorage, não marca; quando o efeito re-corre (dep synthesisToggle.enabled) com ON, fala. Coberto por C1 (2º teste: re-render não re-dispara). Não esconde sucesso silencioso nem dispara duplicado |
| 6 | internal-state-contract-gate (eixo c — 1 camada) | PASS (âmbito reduzido) | Toggle em localStorage (1 camada) + synthesisTextRef local + utterance efémera → @architect dispensado (padrão 7.2/7.3). Eixo (c) caminhos de falha cobertos (AC3/AC4/AC5) |
| 7 | R1/R2/R3 do PO | PASS | R1: handleSend cancel→limpar ref→submit (ChatPanel.tsx:194-196 + C3). R2: cleanup voiceschanged no unmount com teste listenerCount 1→0 (useSpeechSynthesis.test.ts:248-260). R3: SynthesisToggleButton 7 testes (3 estados + a11y + clique + no-op unsupported) |
| 8 | Open-closed / não-regressão | PASS | useAgentStream.ts/useVoice.ts/useVoiceModeState.ts/VoiceModeButton.tsx INTACTOS (git diff vazio). InputBox/types aditivos com retrocompat (synthesisState !== undefined protege 13 testes da 7.3) |
| 9 | Evidência lint/typecheck/test (corrida pelo @qa) | PASS | lint 0 erros (1 warning pré-existente logout/route.ts fora-scope); typecheck 0; 2405 PASS (baseline 2380 + 25); flake oauth-status isolado 6/6 PASS = não-regressão |
| 10 | CodeRabbit --base main (gate de saída) | PASS | 4 findings (1 Major + 3 Minor) todos não-bloqueadores; Major falso-positivo refutado por código upstream (useAgentStream.submit setEvents([])) |
| 11 | AC8 verificação E2E manual (ouvir voz real) | CONDIÇÃO | Não mockável em CI (browser real + altifalante + sessão activa). Pendente do Eurico em Chrome/Edge. NÃO-FAIL (padrão AC6/7.3, AC13/4.9) |

---

## Matriz de AC → evidência

| AC | Descrição | Evidência | Estado |
|----|-----------|-----------|--------|
| AC1 | Toggle on/off, OFF por omissão, persistido em localStorage | useSynthesisToggle (chave nexus_speech_synthesis_enabled; OFF default; remove chave ao desligar; try/catch modo privado) + SynthesisToggleButton (3 estados) + 7 testes de componente + reconciliação no mount | PASS |
| AC2 | Síntese auto após done (success/partial), toggle ON; OFF → não fala | ChatPanel useEffect:159-187 dispara speak em done success/partial com toggle ON; C1 (done+ON→speak 1x, lang pt-PT, voz Joana) + C2 (OFF→speak 0x) | PASS |
| AC3 | Cancel ao iniciar nova run | handleSend:194-196 cancel→limpar ref→submit; C3 (cancel chamado + submit('nova pergunta')) | PASS |
| AC4 | Voz pt-PT + fallback + voiceschanged async + cleanup | selectPortugueseVoice (pt-PT→pt-BR→null) 4 testes puros; voiceschanged assíncrono (Catarina chega tarde); fallback gracioso (voice null, lang continua pt-PT); R2 cleanup listenerCount 1→0 | PASS |
| AC5 | Não suportado → unsupported, sem síntese silenciosa | isSpeechSynthesisSupported() SSR-safe; speak/cancel no-op sem suporte; ChatPanel AC5 (toggle unsupported + speak 0x mesmo com toggle ON em localStorage) | PASS |
| AC6 | Não-regressão do pipeline de entrada | useAgentStream/useVoice/useVoiceModeState/VoiceModeButton intactos (diff vazio); 4 suites herdadas dentro dos 2405 PASS | PASS |
| AC7 | Testes mock fiel + ≥1 falsificável | 25 testes (13 hook + 7 componente + 5 ChatPanel); mock fiel protocolo; C1 falsificável (texto+lang+voz) | PASS |
| AC8 | Verificação manual E2E (ouvir voz real) | Não mockável em CI — pendente do Eurico em Chrome/Edge: toggle síntese ON → falar/enviar → ouvir resposta lida em PT-PT; registar browser+data+output no Change Log | CONDIÇÃO (não-FAIL) |

---

## CodeRabbit `--base main` — análise por finding (todos não-bloqueadores)

| ID | Severidade | Ficheiro | Veredicto @qa |
|----|-----------|----------|---------------|
| CR-7.4-MAJOR | Major | ChatPanel.tsx:162-186 | FALSO-POSITIVO DEFENSIVO. useAgentStream.submit faz setEvents([]) (useAgentStream.ts:363) → stream.events reposto a vazio em cada run → stale deltas de runs anteriores não podem coexistir com o done da run actual. Cenário impossível. Filtro e.runId === last.runId é defesa-em-profundidade opcional (melhoria de robustez, não defeito) |
| CR-7.4-MINOR-1 | Minor | 7.4.story.md:572-581 | Erro documental (cabeçalho "Novos (4)" vs 6 entradas). Fora da zona QA Results. Corrige @dev/@po |
| CR-7.4-MINOR-2 | Minor | ChatPanel.synthesis.test.tsx:230-232 | Código já garante a ordem (handleSend sequencial). Teste podia ser explícito com invocationCallOrder. Melhoria opcional |
| CR-7.4-MINOR-3 | Minor | ChatPanel.synthesis.test.tsx | Falta caso partial e não-success/partial. Código trata partial=success e ignora outros. Cobertura opcional |

> Nota (lição de memória): findings de ferramentas externas são levados a sério — o Major foi investigado contra o código upstream real (`useAgentStream.ts`), não descartado por inspecção superficial. A refutação é por evidência de código (`setEvents([])` no `submit`), não por opinião.

---

## Decisão final

**PASS (Confiança Alta).** A 7.4 implementa fielmente o FR80 com zero invenção, open-closed confirmado, 25 testes falsificáveis de alta fidelidade ao protocolo, e todos os caminhos de falha tratados sem sucesso silencioso. Lint/typecheck/testes verdes (2405 PASS, flake isolado 6/6). CodeRabbit sem bloqueadores. A GOTCHA do `spokenRunIdRef` está correcta e testada. R1/R2/R3 do PO confirmados.

**Condição (não-bloqueadora):** AC8 — verificação manual E2E "ouvir a resposta em voz real" em Chrome/Edge, pendente do Eurico (registar browser + data + output no Change Log), padrão AC6/7.3 e AC13/4.9.

**Próximo passo:** `@devops` — PR + merge (verificar as 6 condições de `merge-authority.md` no head SHA). Após merge: `@po *close-story 7.4` → Epic 7 4/10, sub-âmbito Voice 4/4 COMPLETO.

---

*Gate executado por Quinn (`@qa`) em 25/06/2026. Branch `feat/7.4-speech-synthesis` commit `46d1e737`, NÃO pushed. `@qa` NÃO faz push/PR/merge/close — é do `@devops`/`@po`.*
