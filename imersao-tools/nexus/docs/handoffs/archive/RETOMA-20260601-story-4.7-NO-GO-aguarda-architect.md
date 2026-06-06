# RETOMA — Story 4.7 (Web Push) · NO-GO 4/10 · aguarda @architect

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Orion (`@aiox-master`) — orquestração do ciclo SDC da Story 4.7
**to_agent:** `@architect` (Aria, passo 1) → `@sm` (River, passo 2) → `@po` (Pax, passo 3) / Eurico
**created:** 2026-06-01
**status:** consumed
**consumed:** true
**consumed_at:** 2026-06-01T02:35:00Z
**consumed_by:** Orion (`@aiox-master`)
**resultado:** Passo 1 (Aria CRIT-2+CRIT-3) + Passo 2 (River re-draft v0.2, gravado à 2ª tentativa após 1ª falha de gravação) + Passo 3 (Pax GO 8/10) executados. Story 4.7 agora `Ready`. Handoff de saída: `RETOMA-20260601-story-4.7-READY-aguarda-prereq-devops.md`.
**prioridade:** MÉDIA — Story 4.7 em Draft, reprovada na 1ª validação (NO-GO 4/10). 3 bloqueadores arquitecturais a resolver antes de re-draftar. Não bloqueia outras stories do Epic 4 (4.5/4.6 podem arrancar em paralelo).

## Summary

O ciclo SDC da **Story 4.7 (Web Push, Epic 4 Nexus v2)** chegou à validação e **falhou**: `@sm` (River) draftou → `@po` (Pax) validou **NO-GO 4/10, confiança baixa**. A story está bem estruturada (16 AC, plano de testes sólido, GAP-4.6 bem escalado), mas assenta em **3 premissas que divergem do código real** — os erros que `external-contract-identifiers.md` existe para apanhar no draft. **CRIT-2 e CRIT-3 são decisões de `@architect` (Aria)** — ultrapassam o âmbito do SM. O caminho acordado: Aria fixa a direcção de persistência → River reescreve o draft → Pax re-valida. Faltava só a autorização do Eurico para arrancar o passo 1 (este handoff captura o estado nesse ponto).

## Estado consolidado

| Item | Valor |
|------|-------|
| Story | 4.7 — Web Push (FR34 push no horário + FR35 subscrição no onboarding, PRD §6.6). Status **Draft** |
| Ficheiro story | `imersao-tools/nexus/docs/stories/active/4.7.story.md` (secção **PO Validation** já tem os 5 required fixes registados por Pax) |
| Validação | **NO-GO 4/10** (Pax, 01/06). 1.ª story do Epic 4 a falhar à 1ª passagem |
| Epic 4 | **4/10 Done** (4.1, 4.2, 4.3, 4.4). 4.4 merged hoje `192b488c`, closure `73072aeb` (origin/main sync 0 0) |
| Branch actual | `feat/nexus-v2-story-4.4-metricas` (já merged; `main` local em `73072aeb`). Nova branch da 4.7 ainda NÃO criada |
| Quality gate da 4.7 | `@architect` (Aria) — é também quem dá direcção no draft (ver separation-of-roles) |

## Os 3 bloqueadores (CRIT) + 2 should-fix

| # | Problema | Realidade no código (evidência) | Dono |
|---|----------|--------------------------------|------|
| **CRIT-1** | Env vars VAPID inventadas no draft: `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_MAILTO` | Convenção já fixada: `WEB_PUSH_VAPID_PRIVATE` + `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC` — `v2/lib/shared/env.ts:27,36`, `.env.example:30-33`, `README:39` | `@sm` (correcção directa) |
| **CRIT-2** | D2/AC7 rota `/api/push/public-key` contradiz a convenção `NEXT_PUBLIC_` do projecto (public key VAPID é exposta ao client por design via `getPublicEnv()`) | `v2/lib/shared/env.ts:71` | `@architect` (decisão) |
| **CRIT-3** (mais grave) | AC8/AC9/AC10 persistem a subscription em IndexedDB/Dexie a partir de endpoint **Node server** — IndexedDB é browser-only | Store server-side já é **Vercel KV**: `client.ts:153` ("Dexie só client-side"), `env.ts:29` (`KV_REST_API_*`), stub Story 0.7 anota "VAPID + Vercel KV" | `@architect` (decisão) |
| SF-1 | AC diz `subscribe/route.ts` é ficheiro novo | Já existe como stub da Story 0.7 — é edição, não criação | `@sm` |
| SF-2 | Condicional sobre `PushPermissionPrompt`/onboarding | Confirmado: não há onboarding nem `components/push/` — o componente é genuinamente novo; resolver já a D6 | `@sm` |

## Pontos fortes (já PASS — manter no re-draft)

- **GAP-4.6** (disparo às 15h ±60s com app fechada) correctamente escalado para o draft da Story 4.8 / `@architect`. A 4.7 entrega o endpoint `/api/push/send` e **não** depende dessa decisão para ser implementável.
- `react-component-test-criteria`: `PushPermissionPrompt` contado em 3 estados de render → testes de componente C1-C3 obrigatórios. Correcto.
- AC1 (pré-req VAPID @devops) e AC15 (smoke test manual Chrome+Edge) testáveis e bem atribuídos.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## next_action (no novo terminal)

**Passo 1 — `@architect` (Aria) resolve as 2 decisões arquitecturais:**
   - **CRIT-3:** definir a camada de persistência da push subscription server-side. Realidade: o endpoint Node não pode usar IndexedDB/Dexie (browser-only). O store server-side do projecto é **Vercel KV** (`KV_REST_API_*`). Decidir se a subscription vive em Vercel KV (provável) e devolver a direcção concreta (chave, shape, repo helper) para o repo `push-subscriptions.ts` ser reescrito.
   - **CRIT-2:** confirmar como a public key VAPID chega ao client — via `getPublicEnv()` / `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC` (já no env) em vez de uma rota `/api/push/public-key` dedicada. Decidir se a rota AC7 se mantém, muda ou desaparece.
   - Comando sugerido: `@architect` lê `4.7.story.md` (secção PO Validation) + `env.ts` + `client.ts` + stub `subscribe/route.ts` (Story 0.7) e devolve direcção para o re-draft.

**Passo 2 — `@sm *draft` (River) reescreve a 4.7:**
   - Aplica CRIT-1 (env vars reais), SF-1 (subscribe é edição de stub), SF-2 (resolve D6 — componente novo).
   - Incorpora as decisões da Aria (CRIT-2 + CRIT-3).
   - Mantém os pontos fortes (GAP-4.6 escalado, C1-C3, AC1/AC15).

**Passo 3 — `@po *validate-story-draft 4.7` (Pax) re-valida:**
   - Re-corre o 10-point checklist. Alvo: GO ≥7/10.
   - Só depois `@dev`/`@architect` arrancam a implementação.

## Notas importantes

- **gh sempre com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`** em todos os comandos.
- **Working tree:** muitos ficheiros untracked/modified fora de scope (submódulos `comunidade`/`starter-builder`, `INDEX.md`, backups `.antigravity`/`.cursor`) — NÃO tocar; nada disso pertence à 4.7.
- **Stories alternativas:** se quiseres desbloquear trabalho em paralelo enquanto a 4.7 está em re-draft, 4.5 (CRUD metas) e 4.6 (CRUD lembretes) são baixo risco e não dependem da 4.7. Ver `EPIC-4.md` §10.
- **Lição desta sessão:** o draft do SM assumiu identificadores/arquitectura do PRD sem os cruzar com o código já existente (`env.ts`, `client.ts`, stub 0.7). A regra `external-contract-identifiers.md` manda validar no draft — reforçar este passo no workflow do `@sm` para stories que tocam contratos/infra já implementada.
- **Memória relevante:** `project_nexus_v2_epic_4` (estado do epic), `project_nexus_v2_architecture` (5 ADRs Aria — ADR-1 Edge/Node split é relevante para CRIT-2/CRIT-3).

## Saga anterior (contexto)

Esta sessão (terminal anterior): fechou a Story 4.4 (merge PR #50 `192b488c` + closure `73072aeb`, handoff `RETOMA-20260601-story-4.4-pr-50-aguarda-merge.md` consumido e arquivado), depois arrancou a 4.7 (Eurico escolheu Web Push por maior risco arquitectural) → draft River → NO-GO Pax. Este handoff captura o ponto de decisão antes de delegar à Aria.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260601-story-4.7-NO-GO-aguarda-architect.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `Orion (@aiox-master)` · DATA: `01/06/2026`
