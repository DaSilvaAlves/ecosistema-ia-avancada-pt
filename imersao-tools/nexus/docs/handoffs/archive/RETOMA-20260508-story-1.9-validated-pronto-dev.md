# RETOMA — Story 1.9 PO validated GO 10/10 → aguarda `@dev *develop 1.9`

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 08/05/2026
**Autor:** Pax (@po)
**Para:** @dev (Dex)
**Acção esperada:** `@dev *develop 1.9`

---

## TL;DR

Story 1.9 validada GO 10/10 PASS. GAP-1 e GAP-2 resolvidos com base em fontes canónicas. Status `Draft → Ready`. Implementação pode começar imediatamente.

| Item | Valor |
|------|-------|
| Story file | `imersao-tools/nexus/docs/stories/active/1.9.story.md` (Status `Ready`) |
| Change Log | v0.2 (PO validated 10/10) |
| Decisão | **GO** |
| Implementation Readiness | 9/10 |
| Confidence Level | High |
| Estimativa @sm mantida | 10-14h |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO A QUE SE REFERE: Nexus v2. LOCALIZAÇÃO CORRECTA. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Resumo da validação 10 pontos

| # | Critério | Verdict |
|---|----------|---------|
| 1 | Goal & Context Clarity | PASS |
| 2 | Technical Implementation Guidance | PASS |
| 3 | Reference Effectiveness | PASS |
| 4 | Self-Containment Assessment | PASS |
| 5 | Testing Guidance | PASS |
| 6 | Acceptance Criteria completeness | PASS |
| 7 | Dependencies Identification | PASS |
| 8 | Risk Assessment | PASS |
| 9 | Estimation Reasonableness | PASS |
| 10 | Definition of Done coverage | PASS |

**Pass rate:** 10/10 = 100%

Detalhe completo na secção `## PO Validation` da story file.

---

## GAP resolutions canónicas

### GAP-1 — FR8 localStorage vs Dexie

**Decisão @po:** Dexie `ChatMessage` é canónico nesta story.

**Fontes:**
- Architecture §4.2 (Dexie 4 escolhido para IndexedDB, ADR-2 04/05/2026)
- Architecture §4.4 (tabela `chat_messages` com índice composto `[conversationId+timestamp]`)
- NFR4 mapping (architecture linha 1026 + front-end-spec linha 1219): `db.chat_messages.where('[conversationId+timestamp]').reverse().offset(N).limit(20)`
- Story 1.5 RESOLVED-2 (persistência client-side é responsabilidade da UI)
- Story 1.1 (criou `chat_messages` em Dexie já)

A wording PRD §6.1 FR8 "localStorage" é stale (predates ADR-2). Architecture é canónica para escolha de tecnologia (Constitution Article IV — architect decide stack).

**Fora de scope 1.9:** paginação infinite scroll de 100 mensagens (FR8 + NFR4). Story 1.9 renderiza apenas a conversa em curso desde Dexie. Paginação infinite scroll fica para story futura (Epic 1 ou 8 — quando volume justificar).

### GAP-2 — VoiceModeButton placeholder

**Decisão @po:** placeholder idle-only fica nesta story; voice completo é Epic 7.

**Fontes:**
- Front-end-spec §4.4 — 5 estados do `VoiceModeButton`; estado `idle` é cinza `#8892A4`, sem animação, sem handler
- PRD §V Epic Voice — Story 7.1 `Componente VoiceMode: botão microfone, indicador visual, stream` (Epic separado)
- PRD FR77-80 (voice mode) mapeados a Epic 7 não a Epic 1
- NFR23 banner Gold para Firefox/Safari (responsabilidade Epic 7)

**Implementação 1.9:** ícone `<Mic>` visível à direita do `<Send>` no input box, cor Grey, sem onclick handler activo (ou tooltip opcional "Voice em breve" — Carnegie nice-to-have, não bloqueador). Garantia de UI parity com a spec sem regressão de scope.

---

## Contexto crítico para @dev

### Stack já pronta (consumir, NÃO redefinir)

| Interface / Módulo | Ficheiro | Story origem |
|--------------------|----------|--------------|
| `runAgent()` + `ExecutorSSEEvent` | `lib/agent/executor.ts` | 1.5 (Done) |
| `ConfirmationProvider` + `preview_request` + `preview_confirmed` | `lib/agent/executor.ts` | 1.6 (Done) |
| `undo_registered` + `UNDO_TTL_SECONDS = 30` | `lib/agent/undo.ts` | 1.7 (Done) |
| `POST /api/agent/prompt` (SSE stream) | `app/api/agent/prompt/route.ts` | 1.8 (Done) |
| `POST /api/agent/confirm` (KV) | `app/api/agent/confirm/route.ts` | 1.8 (Done) |
| `POST /api/agent/undo` | `app/api/agent/undo/route.ts` | 1.7 (Done) |
| `KV_CONFIRM_NAMESPACE` | `lib/agent/kv-confirmation-provider.ts` | 1.8 (Done — server-only) |
| `startRun() / finishRun() / appendToolCall() / markRunReverted()` | `lib/db/repos/agent-runs.ts` | 1.1 (Done — Dexie) |
| `NexusDB` + `db` singleton | `lib/db/client.ts` | Epic 0 + 1.1 (Done) |

### Anti-padrões críticos (reforçar antes de implementar)

- `'use client'` obrigatório em `useAgentStream`, todos os componentes chat — NUNCA importar em Server Component nem em ficheiro com `runtime = 'edge'`
- `lib/db/client` jamais em código Edge (Dexie é client-only)
- Não chamar `runAgent()` directamente do client — chamar via `POST /api/agent/prompt` SSE
- Não re-implementar `ConfirmationProvider` no client — `POST /api/agent/confirm` HTTP normal
- Não criar regression suite — Story 1.10 scope
- Não implementar paginação histórico chat — story futura

### Caveats operacionais

| Caveat | Detalhe |
|--------|---------|
| Memory MSW gotcha | `feedback_mock_must_reflect_real_protocol.md` — handlers MSW devem espelhar o protocolo real (`Content-Type: text/event-stream`, linhas `data: <JSON>\n\n`, terminação `data: [DONE]\n\n`) |
| Memory persist gotcha | `feedback_never_close_terminals.md` — Eurico trabalha com múltiplos terminais; desenhar fixes que não exijam reinício |
| PT-PT obrigatório | mensagens de erro, estados, placeholders em português europeu (regra `language-standards.md`) |
| Design system | `#04040A`, glassmorphism, Inter + JetBrains Mono — regra `design-system-ia-avancada.md` |
| AC8 Epic 0 caveat | verificar estado actual de `app/page.tsx` Epic 0 antes de tocar; integrar `ChatPanel` sem destruir layout existente |

---

## Próxima acção

```text
@dev *develop 1.9
```

Path da story: `imersao-tools/nexus/docs/stories/active/1.9.story.md`

Branch: continuar em `feat/nexus-v2-story-1.8-agent-prompt-endpoint` ou criar `feat/nexus-v2-story-1.9-ui-chat-consumer` (decisão @dev / @devops conforme convenção).

Quality gates a executar antes de delegar push (AC12):
1. `npm run lint`
2. `npm run typecheck`
3. `npm run test:unit`
4. `npm run build`
5. `npm run test:coverage` (targets AC11)

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: Nexus v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.9-validated-pronto-dev.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@po` (Pax)
DATA: `08/05/2026`
