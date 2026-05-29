# RETOMA — Story 1.9 Draft criada → aguarda @po *validate-story-draft 1.9

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 08/05/2026
**Autor:** River (@sm)
**Para:** @po (Pax)
**Acção esperada:** `@po *validate-story-draft 1.9`

---

## TL;DR

Story 1.9 draft criada em `imersao-tools/nexus/docs/stories/active/1.9.story.md`. É a **primeira story client-side do Epic 1** — consome o SSE endpoint da Story 1.8 e implementa a UI chat completa (ToolCards, UndoToast, ChatInput, MessageList) com Dexie runtime client-side (RESOLVED-2 da Story 1.5).

Handoff de entrada (`RETOMA-20260508-story-1.8-merged-pronto-story-1.9.md`) movido para `archive/`.

---

## Estado actual

| Item | Valor |
|------|-------|
| Story file | `imersao-tools/nexus/docs/stories/active/1.9.story.md` (Status `Draft`) |
| Change Log | v0.1 (Draft created) |
| Epic 1 | 8/10 Done, 1.9 em Draft, 1.10 Pending |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO A QUE SE REFERE: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Contexto crítico para @po

### O que esta story faz

Story 1.9 é a **UI chat consumer client-side**. Server-side completo (Stories 1.1–1.8). Esta story:

1. **`hooks/useAgentStream.ts`** — SSE consumer hook que faz fetch para `POST /api/agent/prompt`, itera o `ReadableStream`, e chama Dexie (`startRun`, `appendToolCall`, `finishRun`) ao receber eventos. Resolve RESOLVED-2 da Story 1.5 (persistência é client-side).

2. **`components/chat/ToolCard.tsx`** — 6 estados (loading/success/error/preview-required/reverted/interrupted), tokens visuais exactos da front-end spec §4.1, animações 250ms, acessibilidade.

3. **`components/chat/UndoToast.tsx`** — Toast 30s countdown, hover-pause, botão "Anular" que chama `POST /api/agent/undo`, `markRunReverted` Dexie, empilhamento max 3.

4. **`components/chat/ChatInput.tsx`** — Input always-visible, atalho "/" foco global, Enter envia, Shift+Enter nova linha, estados disabled durante streaming/preview.

5. **`components/chat/MessageList.tsx`** — Renderiza ChatMessages com ToolCards inline, texto streaming word-by-word, scroll inteligente.

6. **Integração** em `app/page.tsx` — conecta tudo sem destruir layout Epic 0.

### GAPs marcados (2 — @po decide)

| GAP | Localização na story | Questão |
|-----|---------------------|---------|
| GAP-1 | AC2 + contexto PRD §6.1 FR8 | PRD diz "histórico chat em localStorage"; architecture diz Dexie. A story usa Dexie. @po confirma que FR8 (paginação 100 msgs) fica para story futura e que Dexie é correcto nesta? |
| GAP-2 | AC6 | Botão `<Mic>` (VoiceModeButton): story cria placeholder idle apenas. @po confirma que funcionalidade voice (FR77) não faz parte do scope 1.9? |

### SSE contrato (da Story 1.8)

Eventos que a UI deve consumir (da `ExecutorSSEEvent` union Story 1.5/1.6/1.7/1.8):

| Evento | Tipo | Payload chave | Acção UI |
|--------|------|--------------|----------|
| `meta` | `phase: 'start'` | `runId, prompt, modelClassifier, modelExecutor, startedAt` | `startRun` Dexie, mostrar "A pensar..." |
| `meta` | `phase: 'classified'` | `classifierResult` | — (informativo) |
| `tool_start` | — | `runId, toolName, args` | ToolCard → estado `loading` |
| `tool_complete` | — | `runId, toolName, args, result, durationMs` | ToolCard → `success`; `appendToolCall` Dexie |
| `tool_error` | — | `runId, toolName, error` | ToolCard → `error` |
| `preview_request` | — | `runId, toolName, args, reason, confidence?, domain` | ToolCard → `preview-required` |
| `preview_confirmed` | — | `runId, toolName, action` | ToolCard: se `cancel` → `reverted` |
| `undo_registered` | — | `runId` | UndoToast aparece após `done` |
| `text_delta` | — | `delta` | Append texto na mensagem do agente |
| `done` | — | `runId, status, intents, inputTokens, outputTokens, durationMs, totals` | `finishRun` Dexie, UndoToast se `undo_registered` recebido, input ativo |

---

## Caveats operacionais (mantêm-se)

| Caveat | Detalhe |
|--------|---------|
| `'use client'` obrigatório | `useAgentStream`, todos os componentes chat — nunca importar em Server Components nem Edge |
| Dexie não em Edge | `lib/db/client` jamais importado em `runtime = 'edge'` |
| PT-PT em toda a UI | Mensagens de erro, estados, placeholders em português europeu |
| Design system `[IA]AVANÇADA PT` | `#04040A`, glassmorphism, Inter + JetBrains Mono — obrigatório |

---

## Próxima acção

```text
@po *validate-story-draft 1.9
```

Path da story: `imersao-tools/nexus/docs/stories/active/1.9.story.md`

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.9-drafted-aguarda-po-validate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@sm` (River)
DATA: `08/05/2026`
