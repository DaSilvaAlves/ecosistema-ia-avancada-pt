# RETOMA — Story 6.16 (lembretes + briefing matinal via Telegram, FR74/FR75) IMPLEMENTADA e committada em branch local — aguarda push + PR + CR `--base main` + auto-merge + close-story

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

- **from_agent:** orquestrador pipeline `/sdc` 6.16 (River `@sm` + Pax `@po` + Aria `@architect` + Dex `@dev` + Quinn `@qa`)
- **to_agent:** any — preferencialmente `@devops` (push/PR/merge) → `@po` (close-story)
- **created:** 23/06/2026
- **status:** pending
- **projecto:** Nexus v2 (`imersao-tools/nexus/`)

---

## Passo 0 — arranque em terminal novo

```bash
cd "C:\Users\XPS\Documents\ecosistema-ia-avancada-pt"
git fetch origin
git checkout feat/story-6.16-lembretes-briefing   # branch LOCAL — NÃO está em origin
git log --oneline -1                               # esperado: 1a7c21c4 (impl 6.16)
git rev-parse --short main                          # main em 76e907d2 (close-story 6.14), 0/0 com origin
```

**ATENÇÃO:** o trabalho da 6.16 **JÁ está committado** (commit `1a7c21c4`, 12 ficheiros, +1847/-13) mas **NÃO está pushed e NÃO está merged**. Vive só na branch local `feat/story-6.16-lembretes-briefing`, criada a partir de `main`=`76e907d2`. Se o terminal novo for noutra máquina/clone, a branch não existe lá — esperar pelo push do `@devops` ou recriar a partir deste handoff. `main` continua intacta em `76e907d2`.

Ordem de leitura: 1) `CLAUDE.md` + `.claude/rules/` (handoff-location, merge-authority, separation-of-roles, internal-state-contract-gate, cr-base-main-no-gate-saida, not-tested-trailer-rules); 2) ESTE handoff; 3) `imersao-tools/nexus/docs/stories/active/6.16.story.md` (story completa: PO Validation + Architect Gate de Entrada `[D-6.16-*]` + C1-C16 + Dev Agent Record + QA Gate de Saída PASS); 4) `imersao-tools/nexus/docs/EPIC-6.md` §5 (linha 6.16).

**Comando para retomar (one-shot):** `/sdc 6.16 --from devops --push` — corre a fase devops (push + PR + CR `--base main` + auto-merge) e depois sugere close-story. Em alternativa, os passos manuais estão em "Next action" abaixo.

---

## Summary

A Story 6.16 (lembretes Telegram + briefing matinal, FR74/FR75) foi **drafted, validada, gated à entrada, implementada e gated à saída (PASS)** numa cadeia `/sdc` completa. Está em **branch local `feat/story-6.16-lembretes-briefing` (commit `1a7c21c4`), NÃO pushed, NÃO merged**. Falta só o **push → PR → CR `--base main` no PR → auto-merge → close-story**. Após close-story: Epic 6 passa de 14/17 → **15/17**, sub-módulo Telegram de 4/7 → **5/7**. A 6.16 desbloqueia a **6.17** (`enviar_telegram`).

O que a 6.16 entrega: o canal `telegram` é acoplado ao dispatcher de lembretes do Epic 4 (FR37 parcial completado) e um endpoint novo de briefing matinal automático. Decisões-âncora ratificadas (Architect Gate de Entrada, Aria — **NÃO reabrir**):

- **`[D-6.16-CHANNEL-COUPLING]`:** `channels?` aditivo e opcional no `ScheduleEntrySchema` KV (ausente = `['push']`, retrocompatível porque o Zod não tem `.strict()` → faz strip). Dispatcher **unificado** em `dispatch/route.ts` (único ponto que marca `sent`): `effectiveChannels()` + `dispatchPushChannel()` (lógica 4.8 byte-a-byte) + `dispatchTelegramChannel()` aditivo. Rejeitado endpoint separado (colisão no `sent`) e 2.º mirror client-side (reabre cliente Epic 4, viola `D-MIRROR-BESTEFFORT`).
- **`[D-6.16-STATE-CONTRACT]`:** `markScheduleSent` SÓ após TODOS os canais declarados terem sucesso (`if (allOk)`). Push OK + Telegram falha → fica `pending` (anti silent-loss M1 da 4.9). Re-tentativa pode re-enviar o canal OK (duplicado raro tolerável).
- **`[D-6.16-BRIEFING-SCHEDULE]`:** endpoint NOVO `POST /api/telegram/briefing` (Node + `CRON_SECRET` Bearer). Janela `[7,9[` calculada **server-side em `Europe/Lisbon` via `Intl`** (robusto a DST, não confia no UTC do scheduler). Config = env `BRIEFING_HOUR_START/END` (default 7/9). `vercel.json` INTOCADO (`[D-6.5-CRON-CONFIG]` preservado) — scheduler externo chama o endpoint.
- **`[D-6.16-BRIEFING-CONTENT]`:** âmbito honesto v1 = só fontes server-side (lembretes do dia via KV). Conteúdo Dexie (tarefas/hábitos/finanças/diário) e calendário Google diferidos com 1 linha honesta (padrão stub 6.14), zero invenção (Artigo IV). Débito REC-6.16-BRIEFING-RICH.
- **`[D-6.16-CHAT-ID]`:** `getServerEnv().TELEGRAM_CHAT_ID` (já existe, `env.ts:24`); ausente → `console.error` + canal telegram saltado gracioso, `sendMessage` nunca com chatId/texto vazios.

**Ficheiros tocados pela 6.16 (commit `1a7c21c4`):**

| Ficheiro | Acção |
|----------|-------|
| `imersao-tools/nexus/v2/lib/push/schedule-store.ts` | MODIFICADO — `channels?` opcional no `ScheduleEntrySchema` (aditivo) |
| `imersao-tools/nexus/v2/app/api/push/dispatch/route.ts` | MODIFICADO — `effectiveChannels` + `dispatchPushChannel` (4.8 byte-a-byte) + `dispatchTelegramChannel` + `markScheduleSent` só após `allOk` |
| `imersao-tools/nexus/v2/lib/push/schedule-client.ts` | MODIFICADO — mirror espelha `push` E/OU `telegram`, inclui `channels` no body |
| `imersao-tools/nexus/v2/lib/shared/env.ts` | MODIFICADO — `BRIEFING_HOUR_START/END` opcionais |
| `imersao-tools/nexus/v2/middleware.ts` | MODIFICADO — `/api/telegram/briefing` em `PUBLIC_PATHS` (C13) |
| `imersao-tools/nexus/v2/app/api/telegram/briefing/route.ts` | CRIADO — endpoint briefing (Node + CRON_SECRET, janela horária) |
| `imersao-tools/nexus/v2/lib/telegram/briefing.ts` | CRIADO — helpers puros (janela `Intl` Lisboa, conteúdo server-side) |
| `imersao-tools/nexus/v2/tests/unit/api/push/dispatch-telegram.test.ts` | CRIADO |
| `imersao-tools/nexus/v2/tests/unit/api/telegram/briefing.test.ts` | CRIADO |
| `imersao-tools/nexus/v2/tests/unit/lib/telegram/briefing.test.ts` | CRIADO |
| `imersao-tools/nexus/v2/tests/unit/shared/env.test.ts` | MODIFICADO — parsing das env vars do briefing |
| `imersao-tools/nexus/docs/stories/active/6.16.story.md` | MODIFICADO — PO Validation, Architect Gate, Dev Record, QA Gate, Change Log |

Reutiliza (NÃO duplicar): `sendMessage` (`lib/telegram/bot-api.ts`, 6.13), padrão de cron sempre-200 no catch (`cron/sync/route.ts`, `[D-6.5-PARTIAL-FAILURE]`), `cron-auth`/`getServerEnv`. `webhook/route.ts`, `process-text/route.ts`, `process-voice/route.ts` ficaram com `git diff` VAZIO (open-closed, C12).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260623-story-6.16-IMPLEMENTADA-aguarda-push-PR-merge-close.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2 = `imersao-tools/nexus/`), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Estado dos Gates (cadeia `/sdc` completa)

| Fase | Agente | Veredicto |
|------|--------|-----------|
| `*draft 6.16` | River (`@sm`) | Story criada, story-draft-checklist READY, 11 AC + 5 GAPs |
| `*validate-story-draft` | Pax (`@po`) | **GO 9/10**, zero bloqueadores; anti-invenção 100% confirmada; corrigiu routing (gate entrada `@architect`, saída `@qa`) |
| Architect Gate de Entrada | Aria (`@architect`) | **PASS (DESBLOQUEADO)**; `[D-6.16-*]` + C1-C16 + 3 eixos PASS; Status→Approved |
| `*develop` | Dex (`@dev`) | Impl + commit local `1a7c21c4`; suite **2315 PASS** (+35 vs baseline 2280); lint 0; typecheck 0; CR local Iter 2 = 0 findings |
| QA Gate de Saída | Quinn (`@qa`) | **PASS**; C1-C16 ✓; 3 eixos ✓ contra código real; F2/F4 ACEITE-DIFERIDO; CR `--base main` (CLI 0.6.1) = 0 findings |

**Verificação técnica (commit `1a7c21c4`):**
- Suite COMPLETA Vitest: **2315 PASS** (+35) + 1 FAIL `oauth-status.test.ts` = flake cold-start, isolado 6/6 PASS → NÃO regressão (padrão 6.8-6.14). Baseline 2280 não regrediu.
- `npm run lint`: 0 erros (1 warning pré-existente fora-scope `auth/logout/route.ts`).
- `npm run typecheck`: 0 erros.
- CodeRabbit `--base main` (via skill `coderabbit-review`, CLI 0.6.1): **0 findings**. C16 satisfeito localmente — mesmo assim, o CR do GitHub app re-corre no PR (confirmar limpo no head SHA antes de auto-merge).

---

## Next action

**1. `@devops` (Gage) — push + PR + merge.** O trabalho JÁ está committado (`1a7c21c4`). Passos:
```bash
git push -u origin feat/story-6.16-lembretes-briefing
gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt --base main --head feat/story-6.16-lembretes-briefing \
  --title "feat(nexus-v2): lembretes + briefing matinal via Telegram (FR74/FR75) [Story 6.16]"
```
Corpo do PR: summary acima, decisões `[D-6.16-*]`, AC satisfeitos em CI vs diferidos (P1-P5), nota de que F2/F4 são RECs diferidos adjudicados pelo `@qa`. Terminar com `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

Depois verificar as **6 condições de `merge-authority.md`** no head SHA: (1) CI 100% verde; (2) CodeRabbit Status SUCCESS; (3) zero comentários CR actionable no head SHA; (4) quality gate AIOX = PASS (já temos: QA Gate de Saída PASS); (5) `mergeable` MERGEABLE; (6) hard-stop §8 (≤2 iter CR). `reviewDecision: CHANGES_REQUESTED` NÃO bloqueia se 1-6 verdes (pode ser stale — sinal de verdade é o head SHA). Se verdes:
```bash
gh pr merge {N} --repo DaSilvaAlves/ecosistema-ia-avancada-pt --admin --squash --delete-branch
git checkout main && git pull --ff-only origin main
```
NÃO pedir merge manual ao Eurico (`no-manual-merge-eurico`). Se o CR levantar Major/actionable real no head SHA → `@dev *apply-qa-fixes` (respeitar hard-stop §8: Iter 3+ exige autorização humana via trailer).

**2. `@po` (Pax) `*close-story 6.16`:** Status→Done, `git mv active/ → completed/`, `EPIC-6.md` 14/17→**15/17**, sub-módulo Telegram 4/7→**5/7**, fecho docs-only. Consumir ESTE handoff (marcar `consumed`, mover para `archive/`, actualizar índices).

**3. Próxima story:** `/sdc 6.17` (`enviar_telegram`, FR76, gate `@architect`) — última story do sub-módulo Telegram. A 6.15 (foto→OCR) fica diferida ao Epic 7.

## Débitos diferidos (não-bloqueantes do merge)

| ID | Item | Severidade | Destino |
|----|------|-----------|---------|
| REC-6.16-CHATID-PREFLIGHT | `TELEGRAM_CHAT_ID` permanentemente ausente faria re-push em loop de entries `['push','telegram']` (só com P2 não-provisionado = misconfig prod). Aceite-diferido pelo `@qa` (a alternativa do CR introduziria silent-loss do push, pior) | Média | Story futura / preflight de config |
| REC-6.16-BRIEFING-LEASE | `last_sent` não-atómico permite race de invocações concorrentes no mesmo minuto (scheduler chama hora-a-hora → fora do modelo de ameaça). Pior caso: 1 duplicado raro | Baixa | Observabilidade / arch update |
| REC-6.16-BRIEFING-RICH | Conteúdo rico do briefing (tarefas/hábitos/finanças/diário/calendário) — exige bridge Dexie server-side (junto de REC-6.13-DB-BRIDGE) | Média | Story futura / Epic 7+ |

**Pré-requisitos de produção P1-P5 (NÃO bloqueiam merge; bloqueiam AC de produção AC5/AC10/AC11):** P1 `TELEGRAM_BOT_TOKEN`, P2 `TELEGRAM_CHAT_ID`, P3 `TELEGRAM_WEBHOOK_SECRET`, P4 setup, P5 `CRON_SECRET` + scheduler externo a chamar `POST /api/telegram/briefing` entre 07h-09h Lisboa. Responsável: Eurico + `@devops`.

**Notas operacionais:** `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`; NUNCA `git add -A` (há submódulos `comunidade`/`starter-builder` + muito untracked não-relacionado: `docs/.claude/`, PO-VALIDATION-*, PR-BODY-*, QA-GATE-*, etc.). NÃO reabrir `[D-6.16-*]`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2 (imersao-tools/nexus/)`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260623-story-6.16-IMPLEMENTADA-aguarda-push-PR-merge-close.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `orquestrador pipeline /sdc 6.16 (River+Pax+Aria+Dex+Quinn)`
DATA: `23/06/2026`
