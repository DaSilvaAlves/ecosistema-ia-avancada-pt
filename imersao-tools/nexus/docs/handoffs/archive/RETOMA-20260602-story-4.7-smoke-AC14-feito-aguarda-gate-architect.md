# RETOMA — Story 4.7 (Web Push) · smoke AC14 feito · aguarda gate @architect

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Dex (`@dev`) — smoke AC14 + mount do componente
**to_agent:** `@architect` (Aria — quality gate) → depois `@devops` (push + PR)
**created:** 2026-06-02
**status:** pending
**prioridade:** ALTA — story Ready for Review, só falta o gate.

## Summary

A Story 4.7 (infra Web Push) está **Ready for Review**. Infra provisionada (@devops): VAPID em Vercel Prod+Dev, KV vivo, `.env.local` criado. Smoke AC14 executado em Chrome+Edge: subscription real → KV → `/api/push/send` 200 `{ok:true}` (FCM aceitou entrega) nos 2 browsers. Quality: lint/typecheck/vitest 1290/1290 PASS. Commits desta sessão: `481cf8bf` (devops provisioning doc), `6c5f7125` (mount + smoke). Falta o gate `@architect` (separation-of-roles: executor Dex ≠ gate), que **inclui ratificar a reconciliação do AC14**.

## next_action — `@architect` (Aria)

Quality gate da Story 4.7. Pontos que exigem decisão de arquitectura:

1. **Ratificar a reconciliação do AC14 (principal).** O `sw.js` da 4.7 tem handler `push` **stub** (não chama `showNotification` — por design, display é a Story 4.9). O AC14 passo 6 ("notificação aparece no Windows") é **inalcançável na 4.7**. Reconciliação aprovada pelo Eurico (02/06): smoke da 4.7 = pipeline até **o push service aceitar a entrega à subscription real** (`web-push` → 200) + SW receber o evento `push`; o **display visível transita para o smoke da Story 4.9**. Confirmar que esta fronteira 4.7/4.9 fica bem registada e que o AC14 da 4.9 herda o passo 6.

2. **Avaliar o mount tardio do `PushPermissionPrompt`.** O componente (T8) nunca tinha sido montado — gap descoberto no smoke. Montado em `app/(app)/lembretes/page.tsx` (placement escolhido pelo Eurico). Verificar se a página Lembretes é o local definitivo aceitável (FR35 dizia "definições + primeiro acesso"; não existe página de definições). `react-component-test-criteria.md`: o mount é trivial (renderiza o componente, que tem testes próprios C1-C3) — sem novo estado de render na página → sem teste de página exigido. Confirmar.

3. **CodeRabbit pre-commit não correu** — outage do serviço (`TRPCClientError "Unknown error"`, 2 tentativas, 02/06). Diff = 6 linhas (mount). Decidir: re-correr agora se o serviço voltou, ou delegar ao gate pre-PR do `@devops` (`coderabbit --base main`).

4. **Gotcha `.env.local` (Debug #4)** — `@next/env`/`dotenv-expand` corrompe o `$` do hash bcrypt local; escapado `\$`. Não afecta produção (var vem do dashboard). Só informativo.

Após PASS: `@devops` faz `git push` + PR (`gh` sempre com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`). Hard-stop §8: máx 2 iter CR.

## Estado consolidado

| Item | Valor |
|------|-------|
| Story | 4.7 — Web Push. Status **Ready for Review** |
| Ficheiro | `imersao-tools/nexus/docs/stories/active/4.7.story.md` (ver Dev Agent Record + Change Log v1.1 + nota AC14) |
| Branch | `feat/nexus-v2-story-4.7-web-push` — **NÃO pushed** |
| Commits sessão | `481cf8bf` (devops), `6c5f7125` (mount+smoke) |
| Quality | lint PASS · typecheck PASS · vitest 1290/1290 · build OK (na 1.0) |
| Smoke AC14 | Chrome ✓ + Edge ✓ (subscription→KV→send 200) — display visível diferido p/ 4.9 |
| CodeRabbit | pendente (outage serviço) |

## Decisões fixadas (NÃO reabrir)

| Tema | Decisão |
|------|---------|
| AC14 passo 6 | Display visível = Story 4.9; smoke 4.7 = entrega aceite pelo push service (aprovado Eurico) |
| Mount do prompt | Página Lembretes (escolha do Eurico) |
| `.env.local` local | Hash bcrypt com `$` escapado (`\$`); dev password = `smoke47` |
| Handoff anterior | `RETOMA-20260601-story-4.7-codigo-feito-aguarda-devops-VAPID-KV.md` — consumido (infra feita) |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260602-story-4.7-smoke-AC14-feito-aguarda-gate-architect.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `Dex (@dev)` · DATA: `02/06/2026`
