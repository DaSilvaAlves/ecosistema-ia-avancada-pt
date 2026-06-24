# RETOMA — Story 7.2 (Web Speech recognition PT-PT, FR78): VOICE-001 (b) aplicado, aguarda re-gate @qa

> **[CONSUMIDO 24/06/2026 por Pax `@po` — `*close-story 7.2`]** Ciclo fechado: re-gate @qa Iter 1 PASS → @devops PR #92 → CR server-side 3 Major (VOICE-002/003/004) → @dev fix → re-gate @qa Iter 2 PASS → merge `--admin --squash` (squash `0161ae87`, branch `feat/story-7.2` eliminada). Story → Done em `completed/`; EPIC-7 2/10 (Voice 2/4); waiver 0. Próxima: 7.3 (texto transcrito → cérebro, FR79). Handoff arquivado.

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Story:** 7.2 — Web Speech Recognition PT-PT → Texto (FR78), Epic 7 (Voice + OCR), 1/10 do epic, Voice 2/4
**Estado da story:** Ready for Review · gate @qa deu **CONCERNS** · polish 1 iteração (VOICE-001 (b)) **JÁ APLICADO** pelo @dev
**Data:** 24/06/2026
**Agente que sai:** @dev (Dex)
**Próximo agente:** @qa (Quinn) — re-gate de saída sobre o fix VOICE-001 (b)
**Branch:** `main` (HEAD `520f21fc`) · trabalho **uncommitted** (working tree limpo, só os 5 ficheiros in-scope)

---

## 1. Resumo executivo (1 parágrafo)

A Story 7.2 implementa o hook client-side `useVoice.ts` que instancia a Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`) com `lang='pt-PT'`, liga-se ao contrato de estado da 7.1 (`useVoiceModeState`, já em main) e injecta a transcrição no campo de texto do `InputBox` (D-7.2-TRANSCRIPT-CONTRACT opção b, precedente 6.13). A implementação inicial passou todos os gates (2371 PASS). O gate de saída @qa deu **CONCERNS** por 1 finding minor do CodeRabbit (**VOICE-001**). O @dev aplicou **APENAS a parte (b)** (toggle de UI condicional ao sucesso de `start()`/`stop()`) e **REJEITOU a parte (a)** (trocar `stateRef`→`recognitionRef` como fonte de verdade — violaria AC5). Gates re-corridos verdes (2372 PASS, 1 flake isolado-PASS). Falta o **re-gate @qa** e depois `@devops` (commit + PR + merge). NÃO há push/PR feito.

---

## 2. Contexto: o que foi feito

### 2.1 Implementação inicial (8 AC satisfeitos)

| Ficheiro | Acção | Conteúdo |
|----------|-------|----------|
| `imersao-tools/nexus/v2/hooks/useVoice.ts` | CRIAR | Hook de reconhecimento Web Speech PT-PT. Instancia via `window.SpeechRecognition ?? window.webkitSpeechRecognition`, `lang='pt-PT'`/`continuous=false`/`interimResults=false`. Liga ao contrato 7.1. Instância efémera (AC5). Cleanup no unmount. |
| `imersao-tools/nexus/v2/types/voice.ts` | MODIFICAR (aditivo) | Tipos do protocolo Web Speech (`SpeechRecognitionEventLike`, `SpeechRecognitionErrorEventLike`, `SpeechRecognitionInstance`, `SpeechRecognitionConstructor`) + `declare global { interface Window }`. Os tipos da 7.1 (`VoiceModeState`, `VoiceModeButtonProps`) NÃO alterados. |
| `imersao-tools/nexus/v2/components/chat/InputBox.tsx` | MODIFICAR | Compõe `useVoice` com `useVoiceModeState`; `onVoiceToggle` → `recognizer.toggle()`; `onTranscript` injecta no campo de texto. |
| `imersao-tools/nexus/v2/tests/unit/hooks/useVoice.test.ts` | CRIAR | 13 testes (11 iniciais + 2 do polish), mock fiel ao protocolo + C6 anti-tautológico. |
| `imersao-tools/nexus/docs/stories/active/7.2.story.md` | MODIFICAR | Dev Agent Record, File List, Completion Notes, Debug Log, Change Log, Status=Ready for Review, checkboxes T1-T5 todos `[x]`. |

### 2.2 DEV-DECISIONS

- **D-7.2-COMPOSE** — `useVoice({ voiceState, onTranscript })` recebe o objecto do `useVoiceModeState` (sem estado paralelo). `stateRef` espelha `state` via `useEffect` para evitar stale closure nos handlers. Instância efémera descartada em `onresult`/`onerror`/`onend`/`stop`/unmount (`teardownRecognition` idempotente).
- **D-7.2-TRANSCRIPT-CONTRACT** — Opção (b): transcrição injectada no campo de texto do `InputBox`; depois `voice.reset()` (processing é transitório). A 7.3 consome pelo pipeline `onSend` existente.
- **Ressalvas PO honradas:** #1 `onend` sempre dispara → `gotResultRef` (useRef, NÃO state) marcado em `onresult` E `onerror` impede falso `setError` no caminho feliz; #2 instanciação via `??` (não só detecção); #3 todos os caminhos de falha → `setError` PT-PT explícito (nunca sucesso silencioso).
- **Tipos Web Speech aditivos** — o `lib.dom.d.ts` não declara `SpeechRecognition`/`SpeechRecognitionEvent`/`SpeechRecognitionErrorEvent` nem os globais `Window`; daí as declarações mínimas.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/RETOMA-20260624-story-7.2-VOICE-001b-aplicado-aguarda-requate-qa.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 3. O fix VOICE-001 (b) — o que mudou no polish

### 3.1 O finding e a adjudicação

- **VOICE-001 (a) — REJEITADO pelo @qa, NÃO aplicado:** trocar `stateRef`→`recognitionRef` como fonte de verdade. Violaria o **AC5** (fonte de verdade única no `useVoiceModeState`). `stateRef` mantém-se como mero espelho do contrato.
- **VOICE-001 (b) — APLICADO:** o `toggle()` chamava `toggleMode()` (transição de UI da 7.1) **incondicionalmente**, podendo dessincronizar a UI do recognizer numa falha síncrona de `start()`/`stop()`.

### 3.2 A correcção (em `useVoice.ts`)

- `start()`: assinatura `(): void` → `(): boolean`. `return false` em todos os early-returns (não suportado / já activo / `createRecognition` null) e no catch de `start()` síncrono (após `setError`+`teardown`); `return true` no caminho normal.
- `stop()`: assinatura `(): void` → `(): boolean`. `return false` se não há sessão ou se `stop()` lança; `return true` no sucesso.
- `toggle()` (antes → depois):

```ts
// ANTES
if (stateRef.current === 'listening') { stop(); } else { start(); }
toggleMode();   // INCONDICIONAL

// DEPOIS
const ok = stateRef.current === 'listening' ? stop() : start();
if (ok) { toggleMode(); }   // só transita a UI se a acção teve sucesso
```

Racional: numa falha síncrona (`start()`/`stop()` lança `InvalidStateError`), a UI NÃO transita — fica coerente com o recognizer. Num `start()` falhado, o `setError` interno já coloca a UI em `error`; não chamar `toggleMode` evita sobrepor essa transição.

### 3.3 Testes do polish (+2)

- Mock estendido com `static throwOnStart` (reset no `beforeEach`) → `start()` lança `DOMException InvalidStateError` (erro real do protocolo).
- "start() lança de forma síncrona → UI NÃO transita (`toggleMode` não chamado) + `setError('Sem resposta de voz detectada')`".
- "stop() lança de forma síncrona → UI NÃO transita (`toggle` continua a 1 chamada)".

---

## 4. Evidência REAL dos gates (pós VOICE-001 (b))

> Script de teste do Nexus v2 = `npm run test:unit` (NÃO `npm test`). Pasta: `imersao-tools/nexus/v2/`.

| Gate | Comando | Resultado |
|------|---------|-----------|
| typecheck | `npm run typecheck` (`tsc --noEmit`) | **0 erros** |
| lint | `npm run lint` (`next lint`) | **0 erros** (1 warning pré-existente `app/api/auth/logout/route.ts` `NextResponse` unused — fora-scope) |
| test (isolado) | `npx vitest run tests/unit/hooks/useVoice.test.ts` | **13/13 PASS** |
| test (suite completa) | `npm run test:unit` | **2372 PASS / 1 fail** |
| flake confirmado | `npx vitest run tests/unit/api/google/oauth-status.test.ts` | **6/6 PASS isolado** (1307ms) = não-regressão |

O 1 fail da suite completa é o flake conhecido `oauth-status > sem sessão → 401` (timeout sob contenção paralela), documentado na story como não-regressão (isolado-PASS). Baseline pós-7.1 era 2359 PASS; a 7.2 adiciona 13 testes novos.

Não-regressão confirmada (run isolado): `ChatPanel.test.tsx` 5/5 PASS, `VoiceModeButton.test.tsx` 7/7 PASS. `tests/setup.ts` e `vitest.config.ts` **INTOCADOS** (mock instalado inline por teste).

---

## 5. Estado dos 8 AC

Todos os 8 AC **satisfeitos** (mapeamento completo na secção Dev Agent Record / QA Results da story). O fix VOICE-001 (b) **reforça** o AC5 (fonte de verdade única ainda mais explícita com `toggleMode` condicional). Nenhum AC regrediu.

---

## 6. PRÓXIMA ACÇÃO (clara, uma só)

**@qa (Quinn) — re-gate de saída da Story 7.2 sobre o fix VOICE-001 (b).**

1. Ler a story `imersao-tools/nexus/docs/stories/active/7.2.story.md` (Dev Agent Record + Change Log têm a evidência).
2. Confirmar que **apenas a parte (b)** foi aplicada e a parte (a) foi correctamente rejeitada (AC5 preservado — `stateRef` continua a ser espelho, não fonte de verdade).
3. Re-correr o gate: `coderabbit --base main` (CR `--base main` no gate de saída, `cr-base-main-no-gate-saida.md`) + confirmar lint/typecheck/test:unit verdes.
4. Se PASS → handoff `@devops` (Gage) para: commit local selectivo dos 5 ficheiros (NUNCA `git add -A` — há submódulos sujos + ~150 untracked fora-scope), PR, e merge (condições 1-6 de `merge-authority.md`).
5. Depois do merge → `@po *close-story 7.2`.

### Notas para quem retoma

- **NÃO committed / NÃO pushed.** Working tree limpo com só os 5 ficheiros in-scope (ver §7). Deixado uncommitted DE PROPÓSITO para o re-review do @qa ver o diff.
- **Script de teste = `npm run test:unit`** (não `npm test`).
- **CodeRabbit CLI mudou:** `--prompt-only` foi removido → usar `review --agent` (ou `--plain`). O review do @dev chegou à fase `reviewing` mas não emitiu findings na janela disponível; o gate @qa `--base main` é o autoritativo.
- **Flake `oauth-status`:** se a suite completa der 1 fail nesse teste, é o flake conhecido (isolado-PASS), NÃO regressão.
- **Fronteira respeitada:** zero routes server-side, zero alterações ao webhook Telegram, zero envio ao cérebro (7.3 fá-lo-á). Hook 100% client-side.

---

## 7. Ficheiros in-scope (git status no momento do handoff)

```
 M imersao-tools/nexus/v2/components/chat/InputBox.tsx
 M imersao-tools/nexus/v2/types/voice.ts
?? imersao-tools/nexus/docs/stories/active/7.2.story.md
?? imersao-tools/nexus/v2/hooks/useVoice.ts
?? imersao-tools/nexus/v2/tests/unit/hooks/useVoice.test.ts
```

Branch `main`, HEAD `520f21fc` (handoff de arranque da 7.2). A 7.2 ainda não tem branch própria `feat/` — o @devops decide se cria branch antes do PR (precedente: stories anteriores criaram `feat/story-X` no @devops).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/RETOMA-*.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/RETOMA-20260624-story-7.2-VOICE-001b-aplicado-aguarda-requate-qa.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `@dev (Dex)`
DATA: `24/06/2026`
