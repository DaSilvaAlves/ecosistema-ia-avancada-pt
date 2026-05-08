# RETOMA — Story 1.9 Ready for Review → aguarda `@devops *push`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 08/05/2026
**Autor:** Dex (@dev)
**Para:** Gage (@devops)
**Acção esperada:** `@devops *push` da branch `feat/nexus-v2-story-1.9-ui-chat-consumer` → abrir PR contra `main` → aguardar CodeRabbit Iter 1

---

## TL;DR

Story 1.9 implementação completa. AC1-AC11 + AC13 todos PASS. Quality gates 5/5 verdes. 4 commits locais na branch dedicada. **Aguarda apenas push exclusivo do @devops** (regra `agent-authority.md` — push é exclusivo de Gage).

| Item | Valor |
|------|-------|
| Story file | `imersao-tools/nexus/docs/stories/active/1.9.story.md` |
| Status | `Ready for Review` |
| Branch | `feat/nexus-v2-story-1.9-ui-chat-consumer` |
| Base | `main@f8723a0d` (Story 1.8 merged) |
| Commits locais | 4 (494d1445, e6a7b7e8, 2c3bff94, 034324cd) |
| Quality gates | **5/5 PASS** (lint + typecheck + test:unit 299/299 + build + coverage) |
| Tests novos | 33 (12 ToolCard + 13 useAgentStream + 8 UndoToast) |
| Total suite | 299/299 PASS |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO A QUE SE REFERE: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Resumo da implementação

### AC1+AC2 — `useAgentStream` hook (NEW)

`hooks/useAgentStream.ts` — hook 'use client' que consome `POST /api/agent/prompt` via fetch + ReadableStream reader. Parseia SSE events (`data: <JSON>\n\n`), expõe estado reactivo (`submit`, `isStreaming`, `currentRunId`, `events`, `error`, `reset`) e persiste a run em Dexie client-side conforme RESOLVED-2 da Story 1.5.

Persistência side-effects (best-effort, não bloqueante):
- `meta(start)` → `createAgentRun()`
- `tool_complete` → `appendToolCall()`
- `done` → `db.agent_runs.update({status, durationMs, tokens, intents})`
- `done` (success/partial) → `addChatMessage(assistant)`
- `submit()` → `addChatMessage(user)` imediato

Mensagens PT-PT: HTTP 401 → "Sessão expirada"; 400 → "Prompt inválido"; outros → "Erro do servidor"; network → "Erro de rede".

### AC3+AC4 — `ToolCard` component (NEW)

`components/chat/ToolCard.tsx` — 6 estados conforme front-end-spec §4.1: `loading`, `success`, `error`, `preview-required`, `reverted`, `interrupted`. Tokens visuais exactos (cores hex, animações `pulse-cyan` 1.5s e `pulse-gold-slow` 2.4s, fade-in 200ms + translateY 8→0, transição 250ms ease-out). Botões "Confirmar e gravar" / "Cancelar" / "Tentar de novo" com aria-label descritivos. Foco automático no botão Confirmar ao entrar em `preview-required` (AC9).

### AC5 — `UndoToast` component (NEW)

`components/chat/UndoToast.tsx` — toast bottom-center com countdown 30s, hover-pause, botão "Anular", botão X close. Progress bar 3px Cyan com `aria-valuenow`/`aria-valuemax=30`/`aria-valuemin=0` actualizados a cada tick (100ms). Após click "Anular": POST /api/agent/undo → `markRunReverted` Dexie → toast Lime "Anulado · N acções revertidas". Resposta 410 → toast Magenta "Já não é possível anular — 30s expirados". Resposta 5xx → toast Magenta "Erro ao anular — tenta de novo".

Empilhamento (max 3 FIFO) gerido em `ChatPanel` (single component foca-se num toast individual — SRP).

### AC6 — `ChatInput` (`InputBox.tsx` EXTEND)

`components/chat/InputBox.tsx` — extendido com novo prop `streamingState: 'idle' | 'streaming' | 'preview-pending'`. Comportamento:
- `idle`: textarea activo, placeholder default
- `streaming`: opacity 60%, disabled, placeholder "A processar..."
- `preview-pending`: opacity 60%, disabled, mensagem Gold "Confirma a acção acima antes de continuar" (com `aria-describedby`)

Atalhos preservados (Story 0.4): `/` foco, Enter envia, Shift+Enter nova linha. Botão Mic placeholder idle-only com tooltip "Voz (em breve — disponível em Epic 7)" — GAP-2 RESOLVIDO.

[AUTO-DECISION] Mantido como `InputBox.tsx` (não criado `ChatInput.tsx` duplicado) — 80% da implementação já existia desde Story 0.4 e estava integrado em ChatPanel + tests. Documentado na Task 4 da story.

### AC7 — `MessageList` (REWRITE)

`components/chat/MessageList.tsx` — agora aceita 2 fontes: `messages: ChatMessage[]` (Dexie histórico) + `events: ExecutorSSEEvent[]` (stream actual). Reduz `events[]` para um `LiveAgentBubble` com `ToolCardEntry[]` (mapping SSE → ToolCardState) + texto streaming acumulado. Smart scroll (tolerância 80px do bottom). Estado "A pensar..." quando `isStreaming` mas sem eventos ainda. Mantém welcome bubble da Story 0.4 quando lista vazia.

### AC8 — `ChatPanel` (REWRITE)

`components/chat/ChatPanel.tsx` — wire completo:
- `useAgentStream()` para SSE + Dexie
- `useConversationMessages()` para histórico Dexie reactivo
- `useEffect` detecta `preview_request` → marca `pendingPreview` (input fica `preview-pending`)
- `useEffect` detecta `undo_registered` → adiciona `UndoToast` (FIFO max 3)
- Handlers `handleConfirmPreview`/`handleCancelPreview` chamam `POST /api/agent/confirm`
- Erro banner Magenta quando `stream.error !== null`

`app/(app)/page.tsx` Epic 0 NÃO TOCADO — apenas usa `<ChatPanel />` por composição (já estava assim). Layout Epic 0 (Header 56px + Sidebar 360px) preservado integralmente.

### AC9 — Acessibilidade (WCAG 2.1 AA)

| Elemento | aria |
|----------|------|
| ToolCard | `role="article"`, `aria-label="Tool {name} — estado {state}"` |
| ToolCard botões | `aria-label` descritivo (Confirmar/Cancelar/Tentar) |
| ToolCard preview | foco automático no botão "Confirmar e gravar" via `useRef` + `useEffect` |
| UndoToast | `role="alert"`, `aria-live="polite"` |
| UndoToast progress | `role="progressbar"`, `aria-valuenow`/`-valuemax=30`/`-valuemin=0`, `aria-label` em PT-PT |
| ChatInput | `aria-label="Escreve o teu prompt"`, `aria-disabled` quando bloqueado, `aria-describedby` em streaming/preview |
| Erro banner | `role="alert"` |

### AC10 — Tests Vitest (33 testes novos)

| Ficheiro | Testes | Coverage |
|---------|-------|----------|
| `tests/unit/hooks/useAgentStream.test.ts` | 13 | 88.69% lines |
| `tests/unit/components/chat/ToolCard.test.tsx` | 12 | 99.14% lines |
| `tests/unit/components/chat/UndoToast.test.tsx` | 8 | 95.57% lines |

MSW handlers locais por test (sem poluir handlers globais). Protocolo SSE real respeitado: `Content-Type: text/event-stream` + `data: <JSON>\n\n` + `data: [DONE]\n\n` (memória `feedback_mock_must_reflect_real_protocol.md`).

Fake timers para `UndoToast` 30s expiry (`vi.useFakeTimers` + `vi.advanceTimersByTime(31_000)`).

### AC11 — Coverage thresholds

| Ficheiro | AC11 target | Achieved |
|----------|-------------|----------|
| `useAgentStream.ts` | >= 85% | **88.69%** |
| `ToolCard.tsx` | >= 85% | **99.14%** |
| `UndoToast.tsx` | >= 85% | **95.57%** |
| `InputBox.tsx` (ChatInput) | >= 75% | **90.00%** |

Vitest config (`vitest.config.ts`) actualizado com novo `coverage.include` para hooks/ + components/chat/.

### AC12 — Quality gates 5/5 PASS

| Gate | Comando | Resultado |
|------|---------|-----------|
| 1 | `npm run lint` | PASS — 0 novos warnings |
| 2 | `npm run typecheck` | PASS — exit 0 |
| 3 | `npm run test:unit` | PASS — 299/299 |
| 4 | `npm run build` | PASS — 12 routes, edge runtime preservado |
| 5 | `npm run test:coverage` | PASS — todos os AC11 verdes |

### AC13 — Story file maintenance

- Status `Ready` → `Ready for Review`
- Tasks 1-9 marcadas `[x]` (Task 10 push é exclusivo @devops)
- Dev Agent Record preenchido (5 decisões + 0 desvios + caveats operacionais)
- File List completa (12 ficheiros)
- Change Log v0.3 (Dev started) + v0.4 (Dev complete)

---

## Commits locais na branch

| SHA | Mensagem |
|-----|----------|
| 494d1445 | `feat(nexus-v2): UI chat consumer hook + ToolCard + UndoToast + ChatPanel wiring [Story 1.9]` |
| e6a7b7e8 | `test(nexus-v2): unit tests useAgentStream + ToolCard + UndoToast [Story 1.9]` |
| 2c3bff94 | `test(nexus-v2): include hooks + components/chat na coverage scope [Story 1.9]` |
| 034324cd | `docs(nexus-v2): Story 1.9 file maintenance + Change Log v0.4 [Story 1.9]` |

---

## Próxima acção

```text
@devops *push
```

1. Push branch `feat/nexus-v2-story-1.9-ui-chat-consumer` para origem
2. Abrir PR contra `main` com título `feat(nexus-v2): Story 1.9 UI chat consumer + ToolCards + UndoToast`
3. Aguardar CodeRabbit Iter 1 review
4. Se CHANGES_REQUESTED → handoff a `@dev` para fixes
5. Se merged → próxima story (1.10 — 50 prompts regression suite)

---

## Caveats para o @devops

| Caveat | Detalhe |
|--------|---------|
| Branch base | `main@f8723a0d` (Story 1.8 merged em 08/05/2026) |
| Build | `npm run build` PASS — edge runtime preservado em `/api/agent/{prompt,confirm,undo}` |
| Migration tests | Não há migrations Dexie nesta story — usa schema v1 existente |
| File-system Story 1.9 vs Story 0.4 | InputBox.tsx EXTENDIDO (não substituído) — preserva retrocompat com tests Story 0.4 |
| InputBox.test.tsx | Pre-existente Story 0.4 teve aria-label match `Mensagem` mudado para `prompt` (AC9) — não há breaking change funcional |
| Coverage scope | `vitest.config.ts` actualizado para incluir hooks/ + components/chat/ — confirmar que CI usa este file |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.9-ready-for-review-aguarda-devops-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@dev` (Dex)
DATA: `08/05/2026`
