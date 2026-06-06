# RETOMA — Story 4.9 F3-b aplicado (D-ACTION-AUTH-COOKIE) — ready for Architect re-gate (Iter 2)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** `@dev` (Dex)
**to_agent:** `@architect` (Aria)
**created:** 03/06/2026
**status:** pending
**projecto:** Nexus v2 (`imersao-tools/nexus/`)
**branch:** `feat/nexus-v2-story-4.8-push-dispatch`
**commit local (NÃO pushed):** `f465494e`
**commit anterior em revisão (v0.3):** `4f2c0245`
**story:** `docs/stories/active/4.9.story.md` (v0.5)

---

## Summary

Apliquei o required-fix bloqueador F3-b da Aria (gate v0.4 CONCERNS): a auth do `/api/push/action`
passa de `CRON_SECRET` Bearer para **cookie de sessão same-origin** (`getSession`) — D-ACTION-AUTH-COOKIE.
Fix localizado (1 endpoint + remoção do secret no SW + ajuste de testes), não redesenho. Os 6 required-fixes
estão todos aplicados. 4 gates locais frescos PASS. CodeRabbit Iter 2: 1 finding minor SKIP justificado
(alinhamento com o endpoint de referência que a própria Aria mandou seguir). Pronto para re-gate `@architect`
(Iter 2). NÃO foi feito push — aguarda o re-gate antes de `@devops *push`.

## Mapa fix → ficheiro (os 6 required-fixes)

| Fix Aria | Ficheiro | O que mudou |
|----------|----------|-------------|
| 1 | `v2/app/api/push/action/route.ts` | Auth `CRON_SECRET` Bearer → `getSession(req)` (401 se `!session.valid`). Removidos `getServerEnv().CRON_SECRET`, `secretsMatch`, `extractBearer` e o branch 503. JSDoc reescrito (D-ACTION-AUTH-COOKIE). |
| 2 | `v2/public/sw.js` | Removido `PUSH_ACTION_SECRET`/`self.__NEXUS_PUSH_ACTION_SECRET__` e o header `Authorization` em `postAction`. `fetch` passa a `credentials: 'same-origin'`. Comentários D-ACTION-AUTH/CRON_SECRET removidos. |
| 3 | `v2/lib/push/cron-auth.ts` | JSDoc actualizado (usado só pelo `/api/push/dispatch`; nota da revogação D-ACTION-AUTH). Código inalterado — o dispatch continua a usá-lo com Bearer. |
| 4 | `v2/tests/unit/api/push/action.test.ts` | Auth Bearer (503/401-bearer) → auth de sessão (mock `getSession`). 2 testes de fidelidade não-tautológicos (ver abaixo). C7/C8 mantidos. |
| 4 (SW) | `v2/tests/unit/sw/notificationclick-handler.test.ts` | C3 ganha asserções: `credentials==='same-origin'`, headers só `Content-Type`, sem `Authorization`. |
| 5 | `docs/stories/active/4.9.story.md` | AC4/AC5/AC7, tabela `external-contract-identifiers.md`, D-ACTION-AUTH revogada + D-ACTION-AUTH-COOKIE, File List, Dev Agent Record, gates v0.5, Change Log v0.5, Status → Ready for Review. |

## Confirmação SameSite (pedido da Aria)

`v2/lib/auth/session.ts` L121 — cookie de sessão Nexus é **`SameSite=Strict`**. `Strict` envia o cookie em
requisições same-origin (só bloqueia cross-site). O `fetch('/api/push/action', { credentials:'same-origin' })`
do SW é same-origin → cookie enviado. **Sem alteração ao cookie.**

## AC4/AC5 agora funcionam com cookie — o teste que o prova (não-tautológico)

`tests/unit/api/push/action.test.ts`:
- **`200 com sessão válida e SEM header Authorization`** — prova que a auth real por cookie deixa passar a
  acção (200 + `markScheduleSent` chamado). É exactamente o caminho do SW em produção (cookie same-origin, sem
  Bearer). **Falharia se o endpoint regredisse para exigir Bearer** (daria 401).
- **`401 com sessão inválida mesmo com Bearer presente`** — prova que o Bearer já não é credencial aceite.
- **C7 `401 sem sessão válida`** — sessão ausente → 401, sem tocar o mirror.

`tests/unit/sw/notificationclick-handler.test.ts` C3 — prova que o SW envia `credentials:'same-origin'` e
**não** envia `Authorization` (fidelidade da auth por cookie do lado SW). Em conjunto fecham o contrato real
(sessão ausente → 401; sessão válida → 200) sem mock de fetch a esconder o bug (`mock-protocol-fidelity.md`).

## Resultados reais dos gates (frescos, em `imersao-tools/nexus/v2/`)

| Gate | Resultado |
|------|-----------|
| `npm run typecheck` | exit 0 |
| `npm run lint` | exit 0 (1 warning pré-existente fora de scope: `app/api/auth/logout/route.ts` `NextResponse` unused) |
| `npm run test:unit` | **1366/1366 PASS** (119 ficheiros; +1 líquido vs 1365 — perde o teste 503-CRON_SECRET, ganha 2 de fidelidade de auth) |
| `npm run build` | exit 0 (26 rotas; `/api/push/action` presente) |
| CodeRabbit Iter 2 | 1 finding minor (F5) SKIP justificado — ver abaixo |

### CodeRabbit Iter 2 — F5 (minor, SKIP justificado)

`action/route.ts`: `getSession(req)` fora de try/catch (KV podia lançar e fugir ao envelope `{ error }`).
**SKIP:** o endpoint de referência que a Aria mandou seguir (`schedule/route.ts` GET/PUT/DELETE) também chama
`getSession` fora de try/catch — só a operação de store fica no try. Envolvê-lo no action divergiria do padrão
ratificado. Além disso `getSession` é defensivo (`kvFetch` devolve `null` se KV ausente; lookup KV em try/catch
interno → `{valid:false}` em falha) — não propaga exceções de KV. Decisão de auth/padrão é território
`@architect`; registado na story (secção CodeRabbit Iter 2).

## O que NÃO mexi (não regredido)

- `/api/push/dispatch` (4.8) mantém `CRON_SECRET` Bearer (cron server-to-server) — auth separada.
- CRIT-1: `lembretes/page.tsx` NÃO tocada; wiring em `useDailyGenerationEngine.ts` intacto.
- `external-contract-identifiers.md`: `push`/`notificationclick`/`marcar-feito`/`snooze` ASCII inalterados.
- Tudo o que a Aria marcou PASS no gate v0.4 (fidelidade de protocolo C6/C6b, SF-1/SF-2, AC6/AC8-AC11, F1/F2/F4).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## blockers

- AC13 (teste manual Chrome+Edge) — PENDENTE-HUMANO (Eurico). Já não está bloqueado por auth quebrada
  (F3-b resolvido); pode ser testado após o re-gate. Confirmar: notificação mostra "Marcar feito" + "Snooze 10min";
  "Marcar feito" fecha sem abrir app e na próxima abertura aparece `sent`; "Snooze" adia 10min e aparece `snoozed`.

## next_action (`@architect` Aria)

1. Re-gate `@architect` (Iter 2) do commit `f465494e` — verificar que F3-b está correctamente aplicado
   (auth por cookie no `/api/push/action`, secret removido do SW, testes de fidelidade reais) e avaliar o SKIP do F5.
2. Se PASS: Story 4.9 fecha o Epic 4 (10/10). Encaminhar para `@devops *push` (NÃO foi feito push).
3. Coordenar com o Eurico o teste manual AC13 (Chrome+Edge) — agora desbloqueado.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260603-story-4.9-F3b-fixed-ready-for-architect-regate.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `@dev` (Dex)
DATA: `03/06/2026`
