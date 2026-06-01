# RETOMA — Story 4.7 (Web Push) · código feito + commitado · aguarda @devops (VAPID+KV)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Dex (`@dev`) — implementação T1-T9 + T11 da Story 4.7
**to_agent:** `@devops` (Gage — provisionar VAPID+KV) → depois `@dev` (smoke test) → `@architect` (gate)
**created:** 2026-06-01
**status:** pending
**prioridade:** MÉDIA-ALTA — código pronto e commitado; só falta a infra (secrets + KV) que é autoridade exclusiva do `@devops`.

## Summary

A Story 4.7 (infra Web Push, Epic 4) tem **todo o código de aplicação implementado, testado e commitado localmente** na branch `feat/nexus-v2-story-4.7-web-push` (commit `79e1fdab`). Decisão do Eurico (01/06): implementar tudo menos o smoke test, porque o pré-requisito de infra (VAPID keys + Vercel KV) não estava provisionado. Os unit tests usam mocks; `lint/typecheck/vitest (1290/1290)/build` passam sem keys reais (as env vars são `.optional()` em `env.ts`). Falta agora o `@devops` provisionar a infra para desbloquear o smoke test (AC14) e o gate `@architect`.

## Estado consolidado

| Item | Valor |
|------|-------|
| Story | 4.7 — Web Push. Status **InProgress** (não Ready — smoke test pendente) |
| Ficheiro story | `imersao-tools/nexus/docs/stories/active/4.7.story.md` (ver Dev Agent Record + Change Log v1.0) |
| Branch | `feat/nexus-v2-story-4.7-web-push` — **NÃO pushed** |
| Commit | `79e1fdab` (12 ficheiros, +933/-74; trailers + Not-tested justificado) |
| Quality gate local | lint PASS · typecheck PASS (0 erros) · vitest 1290/1290 · build OK |
| Epic 4 | 7/10 Done; 4.7 é a 8ª (Web Push) |

## next_action — `@devops` (Gage)

**Passo 0 (BLOQUEIA AC1/AC9/AC14) — provisionar infra:**
1. Gerar par VAPID: `npx web-push generate-vapid-keys`
2. Definir as 2 env vars (nomes canónicos — confirmados em `env.ts:27,36` e `.env.example:32-33`):
   - `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC=<public>` (pública — vai para o bundle client)
   - `WEB_PUSH_VAPID_PRIVATE=<private>` (secret server-only — NUNCA commitar)
3. Adicionar em `imersao-tools/nexus/v2/.env.local` (dev) **e** no painel Vercel (prod).
4. Confirmar/provisionar Vercel KV: `KV_REST_API_URL` + `KV_REST_API_TOKEN` (`env.ts:29-30`) activos no `.env.local` (o projecto Nexus já usa KV para sessões/undo — confirmar que está vivo).

> É operação com secrets + outward-facing (Vercel prod) → autoridade exclusiva `@devops`/Eurico. O `@dev` já verificou: env actualmente VAZIAS, sem `.env.local`.

**Passo 1 (depois da infra) — `@dev` (Dex):** smoke test manual Chrome+Edge (T10/AC14): `npm run dev` (porta 3001) → activar notificações no `PushPermissionPrompt` → `POST /api/push/send` `{ "title":"Teste","body":"Push 4.7 OK" }` → confirmar notificação no Windows com tab em segundo plano. Registar resultado no Dev Agent Record. Correr CodeRabbit pre-commit.

**Passo 2 — gate `@architect` (Aria):** quality gate (separation-of-roles: executor Dex ≠ gate). Marcar story InReview→Done.

**Passo 3 — `@devops`:** `git push` + PR (gh sempre com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`).

## Decisões fixadas (NÃO reabrir — vêm do handoff anterior + Aria)

| Tema | Decisão |
|------|---------|
| Public key VAPID | Via `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC`. SEM rota `/api/push/public-key` (CRIT-2) |
| Persistência subscription | Vercel KV, chave `nexus:push:subscription:singleton`, shape `{endpoint,keys:{p256dh,auth},createdAt}` (CRIT-3) |
| Runtime | `export const runtime = 'nodejs'` em `subscribe` e `send` (web-push usa crypto Node, GAP-4.3/ADR-1) |
| mailto VAPID | Literal `mailto:eurico@nexus.app` hardcoded (não env var) |
| Dexie | NÃO incrementado — subscription não vai para IndexedDB |

## Notas / pendências menores

- **unsubscribe:** o hook faz desubscrição local do browser. NÃO há rota DELETE no scope (AC8 só POST). `deletePushSubscription()` está implementado+testado, pronto para rota futura. Não é bloqueador.
- **CONCERN C8.1 (Pax) resolvido:** `/api/push/send` tem try/catch → 500 sem expor secrets se KV/push service indisponível.
- **Ficheiros criados:** ver File List na story. Helpers `lib/push/{utils,subscriptions-store}.ts`, SW `public/sw.js`, rotas `app/api/push/{subscribe,send}/route.ts`, `hooks/usePushSubscription.ts`, `components/push/PushPermissionPrompt.tsx`, 4 testes.
- **Working tree:** untracked fora de scope (submódulos `comunidade`/`starter-builder`, backups `.antigravity`/`.cursor`) — NÃO tocar.
- **Memória relevante:** `project_nexus_v2_epic_4`, `project_nexus_v2_architecture`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260601-story-4.7-codigo-feito-aguarda-devops-VAPID-KV.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `Dex (@dev)` · DATA: `01/06/2026`
