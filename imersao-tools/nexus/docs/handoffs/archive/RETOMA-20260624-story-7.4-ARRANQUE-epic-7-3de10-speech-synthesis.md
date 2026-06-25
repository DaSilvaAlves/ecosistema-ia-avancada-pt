# RETOMA — Story 7.4 (ARRANQUE): Web Speech synthesis PT-PT lê a resposta do cérebro (FR80), Epic 7

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Story:** 7.4 — Web Speech synthesis PT-PT lê a resposta do cérebro (FR80), Epic 7 (Voice + OCR), sub-âmbito Voice 4/4 (última do Voice)
**Estado da story:** NÃO INICIADA — sem draft ainda
**Data:** 24/06/2026
**Agente que sai:** @po (Pax) — fechou a 7.3 e prepara o arranque da 7.4
**Próximo agente:** @sm (River) — `*draft 7.4`
**Branch:** `main` (HEAD `deecfd25` após push do fecho 7.3 pelo `@devops`) · sem branches `feat/` pendentes da 7.4
**from_agent:** @po (Pax) · **to_agent:** @sm (River) · **status:** pending

---

## 1. Resumo executivo (1 parágrafo)

A 7.3 (texto transcrito → cérebro multi-intent, FR79) está FECHADA em `main` (PR #93, squash `deecfd25`). A 7.3 **selou o pipeline de ENTRADA** voz → texto → cérebro: o texto transcrito pelo `useVoice` (7.2) chega ao cérebro multi-intent do Epic 1 pelo pipeline `onSend` → `stream.submit` existente (D-7.3-PIPELINE-ROUTE = Opção A, manual-com-revisão; zero fluxo novo, zero código de produção alterado). A 7.4 fecha o ciclo do outro lado: **a SAÍDA cérebro → voz**. O FR80 (PRD §6.14) diz que "a resposta do cérebro **pode** ser falada via Web Speech API synthesis". A 7.4 implementa `SpeechSynthesis` (browser nativo, PT-PT, client-side, zero custo) para ler em voz alta a resposta que o cérebro acumula no `stream.events` (via `useAgentStream`). Com a 7.4 fechada, o sub-âmbito Voice (7.1-7.4) fica completo e o Epic 7 passa a 4/10. Próximo passo: `@sm *draft 7.4`.

## 2. Trace canónico (LIDO e CITADO — sem invenção)

**PRD `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` §6.14 (Voice mode), FR80 (linha 239), citação literal:**
> "**FR80:** Resposta do cérebro pode ser falada via Web Speech API synthesis. Trace: JARVIS.txt L66-67."

**PRD §10 Epic 7, "Stories sugeridas" (linha 587), citação literal:**
> "7.4 Web Speech API synthesis (PT-PT) lê resposta do cérebro"

**EPIC-7.md §4 (Voice mode §6.14), row FR80:**
> "FR80 | Resposta do cérebro pode ser falada via Web Speech API synthesis | 7.4"

**EPIC-7.md §5 row 7.4 (descrição + executor/gate), citação literal:**
> "7.4 | Web Speech synthesis (PT-PT) lê resposta | Web Speech API synthesis em PT-PT fala a resposta do cérebro. Toggle de voz on/off | FR80 | `@dev` | `@qa` | Não iniciado"

**Arquitectura (`architecture-v2.md`, citado via EPIC-7.md §0):** Stack "Voice = Web Speech API browser nativo" (§6); `useVoice.ts` é o hook client-side (§3); §9.4 CSP — o microfone está permitido; a síntese de voz (`SpeechSynthesis`) é uma API de saída do browser, sem `connect-src` (não faz fetch externo). **Constitution Artigo I (CLI First):** o modo voz é camada terciária (UI); o cérebro funciona 100% sem voz. **Constitution Artigo IV (No Invention):** cada AC da 7.4 deve traçar a FR80 + EPIC-7 §5 row 7.4.

## 3. DECISÃO DE DESIGN CENTRAL a resolver no draft (NÃO está fechada)

**O FR80 usa a palavra "PODE" ("a resposta do cérebro PODE ser falada") + EPIC-7 §5 row 7.4 diz "Toggle de voz on/off".** Isto deixa duas dimensões em aberto que o draft TEM de resolver com trace (não decidir aqui):

- **[D-7.4-TOGGLE] On/off da síntese:** a leitura em voz é controlada por um toggle de voz on/off (EPIC-7 §5 row 7.4 explicita "Toggle de voz on/off"). Onde vive o estado do toggle (componente de chat? preferência persistida em Dexie/localStorage? estado local da sessão?) e qual o estado por omissão (off por omissão é o mais seguro — a síntese só fala quando o utilizador a liga explicitamente). Resolver com trace.
- **[D-7.4-TRIGGER] Quando falar:** (a) **auto após resposta completa** — quando o `stream` termina (a resposta do cérebro está completa em `stream.events`), a síntese lê o texto final, **só se o toggle estiver on**; vs (b) **botão por mensagem** — cada mensagem do assistente tem um botão "ler em voz alta". A opção (a) é a leitura natural de "lê a resposta do cérebro"; a (b) dá mais controlo. Resolver com trace ao FR80 + à experiência do `MessageList`/`ChatPanel`.
- **[D-7.4-SOURCE] Fonte do texto a falar:** confirmar contra código real qual é a fonte canónica do texto da resposta a sintetizar — as Dev Notes da 7.3 ("Ponto de extensão para a 7.4") registam que `stream.events` (via `useAgentStream`) acumula os `text_delta` da resposta. A 7.4 lê dessa fonte; **não** toca no pipeline de entrada selado pela 7.3 (open-closed).

> **Não decidir aqui.** É trabalho do `@sm` (draft) + `@po` (validate). **Gate de entrada `@architect` provavelmente NÃO necessário** (padrão da 7.2/7.3): a 7.4 é client-side numa só camada (estado do toggle + síntese local ao componente de chat), sem distribuição de estado por endpoint/SW/reconciliação — confirmar via `internal-state-contract-gate.md` no draft. Se o draft introduzir persistência de preferência que cruze camadas, reavaliar. Citar FR80 textual no draft e justificar as leituras escolhidas (Constitution Artigo IV — No Invention).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260624-story-7.4-ARRANQUE-epic-7-3de10-speech-synthesis.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. O que a 7.3 deixou ligado (contexto técnico concreto)

O pipeline de ENTRADA está selado em `main` após a 7.3. A 7.4 assenta no fim desse ciclo — a resposta do cérebro. Ficheiros-chave (do trace de código da 7.3):

| Ficheiro | Ponto relevante para a 7.4 |
|----------|----------------------------|
| `imersao-tools/nexus/v2/hooks/useAgentStream.ts` | `submit(prompt)` → `runClientAgent(prompt)`; `stream.events` acumula os `text_delta` da resposta do cérebro — **fonte do texto a sintetizar** ([D-7.4-SOURCE]) |
| `imersao-tools/nexus/v2/components/chat/ChatPanel.tsx` | `handleSend` → `stream.submit(text)`; pai do `InputBox` e do `MessageList` — ponto provável de composição do toggle de voz |
| `imersao-tools/nexus/v2/components/chat/MessageList.tsx` (confirmar) | onde as mensagens do assistente são renderizadas — candidato a botão "ler em voz alta" se [D-7.4-TRIGGER]=(b) |
| `imersao-tools/nexus/v2/components/chat/VoiceModeButton.tsx` + `hooks/useVoiceModeState.ts` (7.1) | contrato de UI de voz já existente (entrada); a 7.4 NÃO altera (open-closed) — pode reutilizar o padrão de toggle/estados |

> **Fronteira (open-closed):** a 7.4 NÃO altera o pipeline de entrada selado pela 7.3 (`InputBox.onTranscript` → `setText` → `submit` → `onSend` → `stream.submit`), nem o contrato do `useVoice`/`useVoiceModeState` da 7.1/7.2. A 7.4 acrescenta a leitura da saída. Zero server, zero route nova (síntese é browser-only).

## 5. PRÓXIMA ACÇÃO (clara, uma só)

**`@sm *draft 7.4`** — criar a story a partir de PRD §6.14 FR80 (L239) + EPIC-7.md §5 row 7.4, resolvendo as decisões [D-7.4-TOGGLE]/[D-7.4-TRIGGER]/[D-7.4-SOURCE] da secção 3 com trace explícito.

Pipeline previsto (precedente 7.1-7.3): `@sm *draft` → `@po *validate-story-draft` → (`@architect` gate de entrada **só se** introduzir distribuição de estado — pouco provável) → `@dev` implementa → `@qa` gate de saída (CR `--base main`) → `@devops` PR + merge → `@po *close-story 7.4` (EPIC-7 3/10 → **4/10**, Voice 3/4 → **4/4 — sub-âmbito Voice COMPLETO**).

## 6. Regras operacionais que o próximo terminal TEM de respeitar

| Regra | Detalhe |
|-------|---------|
| Script de teste | `npm run test:unit` (NÃO `npm test`), a partir de `imersao-tools/nexus/v2/`. Baseline pós-7.3: ~2380 PASS / 1 flake conhecido `oauth-status > sem sessão → 401` (isolado 6/6 PASS = não-regressão) |
| `separation-of-roles.md` | executor `@dev` ≠ gate `@qa`. A 7.4 é lógica client-side (síntese de saída) → gate `@qa` (padrão EPIC-7 §5 row 7.4) |
| `react-component-test-criteria.md` | se o toggle/botão de voz introduzir estados de render (on/off, a-falar, não-suportado) → teste de componente |
| `mock-protocol-fidelity.md` | mock de `SpeechSynthesis`/`SpeechSynthesisUtterance` reflecte a API real do browser (instalar em `window`, espelhar o padrão do mock de `SpeechRecognition` da 7.2/7.3); ≥1 teste que falharia se o encadeamento "resposta completa → utterance falada" estivesse quebrado |
| `internal-state-contract-gate.md` | eixo (c) caminhos de falha: síntese não suportada (`window.speechSynthesis` ausente) / cancelada → sem sucesso silencioso. A 7.4 é client-side numa só camada → gate `@architect` provavelmente dispensado (confirmar no draft) |
| CodeRabbit | Gate de saída corre `coderabbit review --agent -t committed --base main` (`cr-base-main-no-gate-saida.md`). **O CR server-side do PR é o autoritativo** (na 7.2 apanhou 3 Major que o CR local não viu) |
| `merge-authority.md` | O `@devops` faz o merge quando as 6 condições estão verdes no head SHA; NÃO pedir merge manual ao Eurico; `reviewDecision` stale não bloqueia se CR Status SUCCESS + 0 actionable no head (usar `--admin --squash --delete-branch`) |
| Hard-stop §8 | Máx 2 iterações de CR fix→re-review; Iter 3+ exige autorização humana (`Authorized-by:`) |
| `gh` | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Commit selectivo | **NUNCA `git add -A` / `git add .`** — working tree tem submódulos sujos (`comunidade`, `starter-builder`) + ~150 untracked de ruído (`.agent/`, `.codex/`, `.antigravity/`, `PR-BODY-*`, `QA-GATE-*`, `PO-VALIDATION-*`) **e um delete/move pendente do handoff da 6.13** (de outra story, NÃO tocar) |
| `mandatory-change-log.md` | Change Log + `Changes:` no commit; nunca reportar "feito" sem `git diff` real |
| Fronteira | Voice = client-side. A 7.4 lê a saída do cérebro (`stream.events`); NÃO altera o pipeline de entrada da 7.3 nem o contrato do `useVoice`/`useVoiceModeState` (open-closed). Zero server, zero route nova |
| No Invention (Artigo IV) | Cada AC traça a FR80 (PRD §6.14 L239) + EPIC-7 §5 row 7.4. Não inventar comportamento de síntese fora do que o FR80 descreve |

## 7. Estado do repo no momento do handoff

- `main` HEAD `deecfd25` (`feat(nexus-v2): selar pipeline voz → cérebro multi-intent (FR79) [Story 7.3] (#93)`). O commit de fecho docs-only da 7.3 (Status→Done + `git mv` + EPIC-7 3/10 + handoff arquivado + este handoff de arranque) está em `main` local (ahead) **a aguardar push pelo `@devops`**.
- Epic 7: **3/10 stories Done** · sub-âmbito Voice **3/4** (7.1 ✓, 7.2 ✓, 7.3 ✓; falta só 7.4) · OCR 0/6 (7.5-7.10).
- 7.3 totalmente em main: testes de integração em `tests/unit/components/InputBox.test.tsx` (9→13 testes); **zero código de produção alterado** (selagem por testes do pipeline existente).
- **AC6 da 7.3 (verificação manual E2E em produção — "criar tarefa comprar leite" em Chrome/Edge)** é follow-up pendente do Eurico (padrão AC13/4.9), não-bloqueador. Não afecta a 7.4.
- Ruído fora-scope no working tree (não committar): submódulos sujos, ~150 untracked, delete/move do handoff 6.13 (de outra story).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-*.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260624-story-7.4-ARRANQUE-epic-7-3de10-speech-synthesis.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `@po (Pax)`
DATA: `24/06/2026`
