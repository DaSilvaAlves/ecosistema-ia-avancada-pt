# RETOMA — Story 7.3 (ARRANQUE): texto transcrito → cérebro multi-intent (FR79), Epic 7

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Projecto:** Nexus v2 (`imersao-tools/nexus/`)
**Story:** 7.3 — Texto transcrito → cérebro multi-intent (FR79), Epic 7 (Voice + OCR), sub-âmbito Voice 3/4
**Estado da story:** NÃO INICIADA — sem draft ainda
**Data:** 24/06/2026
**Agente que sai:** @po (Pax) — fechou a 7.2 e prepara o arranque da 7.3
**Próximo agente:** @sm (River) — `*draft 7.3`
**Branch:** `main` (HEAD `0c44ae4a`, fecho da 7.2) · `main` == `origin/main` (0/0) · sem branches `feat/` pendentes · sem trabalho devops pendente
**from_agent:** @po (Pax) · **to_agent:** @sm (River) · **status:** pending

---

## 1. Resumo executivo (1 parágrafo)

A 7.2 (Web Speech recognition PT-PT, FR78) está FECHADA em `main` (PR #92, squash `0161ae87`; fecho docs-only `0c44ae4a`). A 7.2 entrega o hook `useVoice.ts` que transcreve voz → texto e **injecta a transcrição no campo de texto do `InputBox`** (DEV-DECISION D-7.2-TRANSCRIPT-CONTRACT **opção b**, precedente 6.13) — o texto aparece como se o utilizador o tivesse escrito. A 7.3 é o passo seguinte: garantir que esse texto transcrito **chega ao cérebro multi-intent do Epic 1** (FR79). O EPIC-7.md §5 row 7.3 é explícito: "o texto transcrito vai directo para o cérebro multi-intent do Epic 1. **Reutiliza o pipeline existente, não cria fluxo novo** (precedente 6.13)". Próximo passo: `@sm *draft 7.3`.

## 2. Contexto técnico concreto (o que a 7.2 já deixou ligado)

O pipeline de envio ao cérebro **já existe** e a 7.2 já injecta texto nele. Ficheiros-chave (lidos hoje, 24/06):

| Ficheiro | Ponto relevante | Linha (aprox.) |
|----------|-----------------|----------------|
| `imersao-tools/nexus/v2/components/chat/InputBox.tsx` | `onSend?: (text: string) => void` (prop); `handleSend` → `onSend?.(trimmed)` + `setText('')` | 41/61, 140-141 |
| `InputBox.tsx` | `useVoice({ onTranscript })` → `setText(prev → prev + transcript)` + `voice.reset()`. Comentário no código (linha ~79) já diz: "ficando disponível no pipeline `onSend` existente (a 7.3 consome o texto sem alterar ficheiros da 7.2)" | 81-92 |
| `imersao-tools/nexus/v2/components/chat/ChatPanel.tsx` | Pai do `InputBox` — liga `onSend` ao cérebro (confirmar qual endpoint) | — |
| `imersao-tools/nexus/v2/app/api/agent/` | Endpoint do cérebro multi-intent (Epic 1, em `main`) — destino do texto | — |

> **Trace canónico (sem invenção):** PRD §6.14 FR79 ("Texto transcrito vai directo para o cérebro multi-intent"); EPIC-7.md §5 row 7.3 + §3 (linha "Base Epic 1": "o modo voz **não cria fluxo novo** — transcreve para texto e injecta no pipeline existente do Epic 1, exactamente como a 6.13 fez para o texto do Telegram"). Dependência: Epic 1 (Tool Registry, classifier, executor) DONE em main; 7.2 DONE em main.

## 3. DECISÃO DE DESIGN CENTRAL a resolver no draft (NÃO está fechada)

**Tensão entre FR79 "directo" e a decisão D-7.2-TRANSCRIPT-CONTRACT (opção b):**

- A 7.2 escolheu **injectar no campo** (opção b) → o utilizador **revê e carrega enviar** (dispara `onSend` → cérebro). Com isto, o texto transcrito **já chega ao cérebro** pelo caminho normal de envio.
- A FR79 diz o texto vai **"directo"** para o cérebro. Há duas leituras possíveis, e o draft TEM de escolher uma com trace:
  - **(A) Manual-com-revisão** — a transcrição fica no campo e o utilizador envia (o que a 7.2 já permite). A 7.3 seria sobretudo **verificação E2E** (Voice "criar tarefa comprar leite" → cérebro cria a tarefa — EPIC-7 §AC1, traça 7.1+7.2+7.3) + eventuais ajustes finos, sem fluxo novo.
  - **(B) Envio automático** — após a transcrição, o texto é enviado ao cérebro automaticamente (sem o utilizador carregar enviar). Implicaria ligar `onTranscript`/`processing` ao `onSend` (ou equivalente) — ainda **reutilizando** o pipeline, não criando fluxo novo.

> **Não decidir aqui.** É trabalho do `@sm` (draft) + `@po` (validate), possivelmente com `@architect` se a opção B introduzir distribuição de estado (consultar `internal-state-contract-gate.md`). O que NÃO é negociável: **não criar fluxo novo de processamento** — reutilizar o pipeline `onSend`/endpoint do cérebro (precedente 6.13). Citar FR79 textual no draft e justificar a leitura escolhida (Constitution Artigo IV — No Invention).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260624-story-7.3-ARRANQUE-epic-7-2de10-texto-transcrito-cerebro.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## 4. PRÓXIMA ACÇÃO (clara, uma só)

**`@sm *draft 7.3`** — criar a story a partir de PRD §6.14 FR79 + EPIC-7.md §5 row 7.3, resolvendo a decisão de design da secção 3 com trace explícito.

Pipeline previsto (precedente das stories anteriores do epic): `@sm *draft` → `@po *validate-story-draft` → (`@architect` gate de entrada **só se** a opção B distribuir estado) → `@dev` implementa → `@qa` gate de saída → `@devops` PR + merge → `@po *close-story 7.3`.

## 5. Regras operacionais que o próximo terminal TEM de respeitar

| Regra | Detalhe |
|-------|---------|
| Script de teste | `npm run test:unit` (NÃO `npm test`), a partir de `imersao-tools/nexus/v2/`. Baseline pós-7.2: ~2376 PASS / 1 flake conhecido `oauth-status > sem sessão → 401` (isolado 6/6 PASS = não-regressão) |
| `separation-of-roles.md` | executor `@dev` ≠ gate `@qa`. A 7.3 é lógica client-side (texto → pipeline existente) → gate `@qa` |
| CodeRabbit | Gate de saída corre `coderabbit --base main` (`cr-base-main-no-gate-saida.md`). CLI mudou: `--prompt-only` removido → `review --agent`. **O CR server-side do PR é o autoritativo** — na 7.2 apanhou 3 Major que o CR local não viu |
| `merge-authority.md` | O `@devops` faz o merge quando as 6 condições estão verdes no head SHA; NÃO pedir merge manual ao Eurico; `reviewDecision` stale não bloqueia se CR Status SUCCESS + 0 actionable no head (usar `--admin --squash --delete-branch`) |
| Hard-stop §8 | Máx 2 iterações de CR fix→re-review; Iter 3+ exige autorização humana (`Authorized-by:`) |
| `gh` | SEMPRE `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` |
| Commit selectivo | **NUNCA `git add -A` / `git add .`** — working tree tem submódulos sujos (`comunidade`, `starter-builder`) + ~150 untracked de ruído (`.agent/`, `.codex/`, `.antigravity/`, `PR-BODY-*`, `QA-GATE-*`, `PO-VALIDATION-*`) **e um move pendente do handoff da 6.13** (de outra story, NÃO tocar) |
| `mandatory-change-log.md` | Change Log + `Changes:` no commit; nunca reportar "feito" sem `git diff` real |
| Fronteira | Voice = client-side. Reutilizar pipeline `onSend`/endpoint do cérebro. Zero fluxo novo (precedente 6.13) |

## 6. Estado do repo no momento do handoff

- `main` HEAD `0c44ae4a` (`docs(nexus-v2): close-story 7.2 ...`), sincronizado com `origin` (0/0).
- Epic 7: **2/10 stories Done** · sub-âmbito Voice **2/4** (7.1 ✓, 7.2 ✓; falta 7.3, 7.4).
- 7.2 totalmente em main: `hooks/useVoice.ts`, `types/voice.ts`, `components/chat/InputBox.tsx`, `tests/unit/hooks/useVoice.test.ts`.
- Ruído fora-scope no working tree (não committar): submódulos sujos, ~150 untracked, move do handoff 6.13.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/RETOMA-*.md`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260624-story-7.3-ARRANQUE-epic-7-2de10-texto-transcrito-cerebro.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `@po (Pax)`
DATA: `24/06/2026`
