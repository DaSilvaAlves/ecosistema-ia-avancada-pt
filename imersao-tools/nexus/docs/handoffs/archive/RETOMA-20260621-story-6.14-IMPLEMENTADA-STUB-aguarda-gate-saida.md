# RETOMA — Story 6.14 (voz → transcrição, FR72) IMPLEMENTADA COMO STUB em branch local — aguarda Architect Gate de Saída + CR `--base main` → PR/merge

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

- **from_agent:** orquestrador cadeia 6.14 (River `@sm` + Pax `@po` + Aria `@architect` + Dex `@dev`)
- **to_agent:** any — preferencialmente `@architect` (gate de saída) → `@devops` (PR/merge) → `@po` (close-story)
- **created:** 21/06/2026
- **status:** consumed
- **consumed:** true
- **consumed_at:** 2026-06-22T00:00:00Z
- **consumed_by:** Pax (`@po`)
- **projecto:** Nexus v2 (`imersao-tools/nexus/`)

> **CONSUMIDO 22/06/2026 por Pax (`@po`)** — a cadeia completou: Architect Gate de Saída PASS (Aria) → `@devops` PR #88 (squash `30e22adb`) merged em `main` → `@po *close-story 6.14` (Status → Done, story movida para `completed/`, Epic 6 14/17, sub-módulo Telegram 4/7). Ficheiro arquivado.

---

## Passo 0 — arranque em terminal novo

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git fetch origin
git checkout feat/story-6.14-voz-transcricao   # branch LOCAL — NÃO está em origin
git log --oneline -1                            # esperado: 51fc7a47 (impl 6.14 stub)
git rev-parse --short main                       # main em a3f33c49 (docs handoff 6.13→6.14; close 6.13 foi 3ea281b7), 0/0 com origin
```

**ATENÇÃO CRÍTICA:** o trabalho da 6.14 **NÃO está pushed e NÃO está merged**. Vive só na branch local `feat/story-6.14-voz-transcricao`, commit `51fc7a47`. Se o terminal novo for outra máquina/clone, a branch não existe lá — recriar a partir deste handoff ou esperar pelo push do `@devops`. `main` continua intacta em `a3f33c49` (a branch 6.14 foi criada a partir daqui).

Ordem de leitura: 1) `CLAUDE.md` + `.claude/rules/` (handoff-location, merge-authority, separation-of-roles, internal-state-contract-gate, cr-base-main-no-gate-saida, not-tested-trailer-rules); 2) ESTE handoff; 3) `imersao-tools/nexus/docs/stories/active/6.14.story.md` (story completa: nota PO + Architect Gate de Entrada com `[D-6.14-*]` + C1-C6 + Dev Record + Change Log); 4) `imersao-tools/nexus/docs/EPIC-6.md` §5 (linha 6.14) + §7 GAP-6.3; 5) `imersao-tools/nexus/docs/stories/completed/6.13.story.md` (bridge Node + seam `voice` reutilizado).

**Comando para retomar:** **Architect Gate de Saída** (Aria, `@architect`) sobre a branch `feat/story-6.14-voz-transcricao` — inclui **CR `--base main`** (condição C6; o `-t uncommitted` já correu 0 findings mas NÃO basta). Se PASS → `@devops` abre PR e faz auto-merge (`merge-authority.md`) → `@po *close-story 6.14`.

---

## Summary

A Story 6.14 (voz Telegram → transcrição, FR72) foi **drafted, validada, gated à entrada e implementada como STUB FUNCIONAL** numa só cadeia de agentes. Está em **branch local `feat/story-6.14-voz-transcricao` (commit `51fc7a47`, criada a partir de `main`=`a3f33c49`), NÃO pushed, NÃO merged**. O Architect Gate de Entrada confirmou contra doc actual que a **API Anthropic não expõe speech-to-text nativo** e decidiu a **variante (c) — stub de diferimento** (sem serviço de transcrição externo, sem env var nova, sem tocar no CSP). O ramo `voice` do webhook (que a 6.12 deixou stub `routed:false`) passa a rotear para um bridge Node novo `POST /api/telegram/process-voice` que responde ao utilizador com uma mensagem PT-PT de diferimento via `sendMessage` e marca `routed:true, type:'voice'`. Falta só o **gate de saída + CR `--base main` → PR → merge → close-story**. Epic 6 mantém-se 13/17 (a 6.14 só conta após close-story); sub-módulo Telegram passará a 4/7.

## Context — cadeia executada nesta sessão

| Fase | Agente | Resultado |
|------|--------|-----------|
| `*draft 6.14` | River (`@sm`) | Story criada em `active/`, story-draft-checklist READY (bloqueio à implementação até resolver GAP-6.3) |
| `*validate-story-draft 6.14` | Pax (`@po`) | **GO-com-condição 8/10**, zero bloqueadores; 2 advisory (OBS-6.14-1 confirmar STT Anthropic; OBS-6.14-2 shared-secret se bridges encadeados) |
| Architect Gate de Entrada | Aria (`@architect`) | **DESBLOQUEADO-COMO-STUB** (PASS-COM-CONDIÇÕES, confiança alta); 6 `[D-6.14-*]` + C1-C6 + análise antecipada `internal-state-contract-gate` 3 eixos; story Draft→Approved |
| `*develop` | Dex (`@dev`) | Impl stub, commit local `51fc7a47`; suite **2280 PASS** (+14 vs baseline 2266); lint 0, typecheck 0; CR `-t uncommitted` Iter 1 **0 findings** |

**Decisões-âncora `[D-6.14-*]` (ratificadas por Aria — NÃO reabrir):**
- **A `[D-6.14-STT-ANTHROPIC]`:** Anthropic NÃO tem STT — **confirmado contra doc actual**. A Messages API não suporta audio input nativo; o voice dictation do Claude Code só funciona com conta Claude.ai (indisponível com API key directa, que é o que o bridge usa em `factory.ts:27`). Opção "Anthropic" eliminada. Fontes: [Voice dictation — Claude Code Docs](https://code.claude.com/docs/en/voice-dictation); [anthropic-sdk-python #1198 (audio input não suportado na Messages API)](https://github.com/anthropics/anthropic-sdk-python/issues/1198).
- **B `[D-6.14-TRANSCRIPTION-SERVICE]`:** **opção (c) — stub funcional de diferimento.** Rejeitadas (a) Whisper/OpenAI e (b) Google/Deepgram: exigiriam env var nova + CSP `connect-src` + conta/billing + 2.º fornecedor externo num bot single-user (projecto sem integração OpenAI, grep=0). Stub: zero env, zero CSP, canal roteado ponta-a-ponta, epic não bloqueado.
- **C `[D-6.14-DOWNLOAD-RUNTIME]`:** download (Bot API `getFile` + fetch do ficheiro) corre no **bridge Node, nunca Edge** (ADR-1 §4.1: Edge <5s + restrição de memória). No stub o download é **opcional** (não há transcrição a alimentar).
- **D `[D-6.14-BRIDGE-ARCH]`:** **bridge único `process-voice`** (NÃO encadear com `process-text`). Importa `runAgent`/`sendMessage` por símbolo, como o `process-text` da 6.13 — não por HTTP. Resolve OBS-6.14-2 (1 só hop → shared-secret simples).
- **E `[D-6.14-FALLBACK-VOICE]`:** mensagem de diferimento PT-PT EXACTA — *"Recebi a tua mensagem de voz, mas ainda não consigo processar áudio. Por agora, escreve a tua mensagem em texto."* Falha de infra reutiliza o `ERROR_MESSAGE_PT` da 6.13.
- **`[D-6.14-CSP]` / `[D-6.14-ENV-VAR]`:** `next.config.ts` **intacto** (remove o path bloqueador CSP do âmbito da 6.14); **zero env var nova** nesta entrega.

**Ficheiros tocados pela 6.14 (commit `51fc7a47` na branch local):**

| Ficheiro | Acção |
|----------|-------|
| `imersao-tools/nexus/v2/app/api/telegram/process-voice/route.ts` | CRIADO — bridge Node stub de diferimento |
| `imersao-tools/nexus/v2/app/api/telegram/webhook/route.ts` | MODIFICADO — ramo `voice` activado + `dispatchVoiceToBridge` + `PROCESS_VOICE_PATH` |
| `imersao-tools/nexus/v2/middleware.ts` | MODIFICADO — `process-voice` em `PUBLIC_PATHS` (C4) |
| `imersao-tools/nexus/v2/tests/unit/api/telegram/process-voice.test.ts` | CRIADO — 12 testes |
| `imersao-tools/nexus/v2/tests/unit/api/telegram/webhook.test.ts` | MODIFICADO — bloco 6.14 (V1-V4) + 2 voice adaptados |
| `imersao-tools/nexus/docs/stories/active/6.14.story.md` | MODIFICADO — Tasks/Dev Record/File List/Change Log |

Reutiliza da 6.13 (NÃO duplicar): `runAgent` de `lib/agent/executor.ts` (neutro, cookieless), `sendMessage` de `lib/telegram/bot-api.ts`, padrão de bridge Node + shared-secret. Ramos `text`/`photo`/`unknown` do webhook intocados (open-closed, C-6.13); guardas C1-C9 da 6.12 intactas.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260621-story-6.14-IMPLEMENTADA-STUB-aguarda-gate-saida.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2 = `imersao-tools/nexus/`), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Estado dos Acceptance Criteria

- **Satisfeitos em CI:** AC4 (resposta via `sendMessage`), AC5 (ACK imediato fire-and-forget, `routed:true, type:'voice'`), AC6 (open-closed — ramos text/foto/unknown e guardas C1-C9 intactos), AC9 (mock reflecte protocolo real Bot API + ≥1 teste de degeneração de shape: `{ok:false}` → log + 200, sem crash).
- **Inertes no stub (diferidos — REC-6.14-TRANSCRIPTION-FUTURE, conforme gate):** AC1/AC2/AC3 (`getFile`/download/transcrição/cérebro), AC7/AC8 (fallbacks de download/áudio-vazio — só vivos com transcrição real).
- **Para o gate de SAÍDA (`@architect`):** AC10 — análise `internal-state-contract-gate` 3 eixos **já antecipada** no Dev Record; falta a assinatura formal no gate de saída. AC5 de produção deferido a P1-P4 (Eurico).

## Verificação técnica (pelo `@dev`, commit `51fc7a47`)

- Suite COMPLETA Vitest: **2280 PASS** vs baseline 2266 (+14) + **1 FAIL `oauth-status.test.ts`** = flake cold-start sob carga, **isolado 6/6 PASS** → NÃO é regressão (padrão documentado 6.8-6.12). Baseline não regrediu.
- `npm run lint`: 0 erros (1 warning pré-existente fora-scope em `auth/logout/route.ts`).
- `npm run typecheck`: 0 erros.
- CodeRabbit `-t uncommitted` Iter 1: **0 findings** (NÃO substitui o `--base main` do gate de saída — ver `cr-base-main-no-gate-saida`).

## Next action

**1. Architect Gate de Saída (`@architect`, Aria) — OBRIGATÓRIO.** Re-verificar C1-C6 via `git diff` na branch + assinar a análise `internal-state-contract-gate` 3 eixos (AC10) + correr **CR `--base main`** (condição C6 — diff completo do branch; lição 5.11/6.13: o `-t uncommitted` não vê findings server-side). Território server-side novo (route Node + ramo webhook) justifica o gate de saída `@architect` (o par `@dev`/`@architect` respeita `separation-of-roles.md`).

**2. `@devops` (Gage):** se o gate PASS e CR limpo → `git push -u origin feat/story-6.14-voz-transcricao` → abrir PR (`gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt`) → auto-merge squash quando as 6 condições `merge-authority.md` estiverem verdes (NÃO pedir merge manual ao Eurico — `no-manual-merge-eurico`).

**3. `@po` (Pax) `*close-story 6.14`:** Status→Done, `git mv active/ → completed/`, `EPIC-6.md` 13/17→**14/17**, sub-módulo Telegram 3/7→**4/7**, fecho docs-only.

## Débitos e pré-requisitos (não-bloqueantes do merge)

| ID | Item | Severidade | Destino |
|----|------|-----------|---------|
| REC-6.14-TRANSCRIPTION-FUTURE | Transcrição de voz real (se/quando houver decisão de serviço) → introduz **P5** (`OPENAI_API_KEY` ou equiv.) como pré-requisito de produção **E path bloqueador** (`not-tested-trailer-rules` — exige evidência local) + revisão CSP `connect-src` | Diferido | Story futura / Epic 7+ |
| REC-6.13-DB-BRIDGE | Tools de mutação (tasks/finance/habits/Gmail) inacessíveis via Telegram até bridge Dexie server-side | Média | Story futura / Epic 7+ |
| REC-6.13-WAITUNTIL | Robustez do fire-and-forget em serverless (garantir conclusão do background work) | Baixa | Observabilidade / arch update |
| TEST-001 | Handler MSW `sendMessage` não valida `chat_id` (mock; produção valida) | Baixa | Housekeeping |

**Pré-requisitos de produção P1-P4 (herdados 6.11/6.12/6.13 — por provisionar; NÃO bloqueiam merge; bloqueiam AC de produção):** P1 `TELEGRAM_BOT_TOKEN`, P2 `TELEGRAM_CHAT_ID`, P3 `TELEGRAM_WEBHOOK_SECRET` (≥32 chars, também shared-secret do bridge), P4 `POST /api/telegram/setup` 1× pós-deploy. Responsável: Eurico + `@devops`.

**Notas operacionais:** `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; NUNCA `git add -A` (há submódulos `comunidade`/`starter-builder` + untracked não-relacionados); merge por `@devops`/`@aiox-master` quando o PR estiver verde. NÃO reabrir `[D-6.14-*]` / `[D-6.13-*]` / `[D-6.12-*]` / `[D-6.11-*]`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2 (imersao-tools/nexus/)`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260621-story-6.14-IMPLEMENTADA-STUB-aguarda-gate-saida.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `orquestrador cadeia 6.14 (River+Pax+Aria+Dex)`
DATA: `21/06/2026`
