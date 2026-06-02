# RETOMA — Story 4.7 (Web Push) · GO 9/10 · READY · aguarda pré-req @devops

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**from_agent:** Orion (`@aiox-master`) — orquestração do ciclo de recuperação da Story 4.7
**to_agent:** `@devops` (Gage, pré-req VAPID+KV) → `@dev` (Dex, implementação) → `@architect` (Aria, quality gate) / Eurico
**created:** 2026-06-01
**status:** pending
**prioridade:** MÉDIA-ALTA — Story 4.7 desbloqueada e validada (GO 9/10), pronta para implementação assim que o pré-req de infra (VAPID keys + Vercel KV) estiver provisionado.

## Summary

A Story 4.7 (Web Push, Epic 4 Nexus v2) recuperou do NO-GO 4/10. Ciclo executado pelo Orion: **Passo 1** Aria (`@architect`) resolveu CRIT-2 (eliminar rota `/api/push/public-key` — public key VAPID não é secreta, RFC 8292, chega via `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC`) e CRIT-3 (persistência em **Vercel KV**, não Dexie — `@vercel/kv` já instalado; helper server-only `v2/lib/push/subscriptions-store.ts`; chave `nexus:push:subscription:singleton`). **Passo 2** River (`@sm`) reescreveu o corpo da story para v0.2 (à 2ª tentativa — a 1ª reportou "feito" sem gravar; verificação por grep apanhou). **Passo 3** Pax (`@po`) validou **GO 9/10, confiança alta**, Status `Ready`.

## Estado consolidado

| Item | Valor |
|------|-------|
| Story | 4.7 — Web Push (FR34 push no horário + FR35 subscrição no onboarding, PRD §6.6). Status **Ready** |
| Ficheiro story | `imersao-tools/nexus/docs/stories/active/4.7.story.md` (secções `## Architect Direction` + `## PO Validation — 3ª PASSAGEM (GO)`) |
| Validação | **GO 9/10** (Pax, 01/06, 3ª passagem). 5/5 required fixes resolvidos e verificados por grep |
| Epic 4 | **4/10 Done** (4.1-4.4). `main` em `73072aeb`, sync origin |
| Branch da 4.7 | ainda NÃO criada |
| AC | 15 AC (v0.2), renumerados |

## Decisões arquitecturais fixadas (não reabrir)

| Tema | Decisão | Evidência |
|------|---------|-----------|
| Public key VAPID | Via `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC` / `getPublicEnv()`. **Sem** rota `/api/push/public-key` | `env.ts:36,71-74` |
| Persistência subscription | **Vercel KV** (`@vercel/kv` já em `package.json:43`). Helper server-only `subscriptions-store.ts`, chave `nexus:push:subscription:singleton`, shape `{ endpoint, keys:{p256dh,auth}, createdAt }` | `env.ts:29`, ADR-6 |
| Env vars | `WEB_PUSH_VAPID_PRIVATE` (server) + `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC` (client). mailto = literal `mailto:eurico@nexus.app` hardcoded (sem env var nova) | `env.ts:27,36`, `.env.example:30-33` |
| `subscribe/route.ts` | É **edição** do stub da Story 0.7 (não criação) | `app/api/push/subscribe/route.ts` |

## next_action (no novo terminal)

**Passo 0 (BLOQUEIA AC9) — `@devops` (Gage) provisiona infra:**
   - Gerar par de chaves VAPID; definir `WEB_PUSH_VAPID_PRIVATE` (secret) + `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC` (pública) no Vercel.
   - Provisionar Vercel KV (`KV_REST_API_URL` + `KV_REST_API_TOKEN`) se ainda não existir no projecto Nexus.
   - É operação com secrets/outward-facing → requer acção do Eurico/@devops.

**Passo 1 — `@dev` (Dex) implementa** (código de aplicação): helpers `utils.ts` + `subscriptions-store.ts`, rotas `subscribe` (editar stub) + `send` (nova, Node runtime), hook `usePushSubscription`, componente `PushPermissionPrompt` (3 estados). Branch nova `feat/nexus-v2-story-4.7-web-push`.

**Passo 2 — quality gate `@architect` (Aria)** — recomendado por ser quem deu a direcção arquitectural (Edge/Node + KV) e por separation-of-roles (executor Dex ≠ gate Aria). Alternativa: `@qa` (Quinn) se o foco for cobertura de testes.

## CONCERNS minor da Pax (resolver na implementação, não-bloqueantes)
- C8.1: comportamento do `send` se KV indisponível (degradação graciosa) — não está nos AC.
- C5.1: confirmar pré-req @devops (VAPID+KV) FEITO antes de o `@dev` arrancar o AC9.

## Pontos fortes preservados (PASS)
- GAP-4.6 (disparo às 15h com app fechada) escalado para a Story 4.8.
- 3 estados de render do `PushPermissionPrompt` (C1-C3) → testes de componente obrigatórios.
- Fidelidade de protocolo Web Push (urlBase64ToUint8Array 65 bytes P-256, `userVisibleOnly: true`, `subscription.toJSON()`).
- Hard-stop 2 iterações CR; smoke test manual Chrome+Edge (AC14).

## Notas importantes
- **gh sempre com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`**.
- **Working tree:** muitos ficheiros untracked/modified fora de scope (submódulos `comunidade`/`starter-builder`, backups `.antigravity`/`.cursor`) — NÃO tocar.
- **Lição desta sessão (2 lições):** (1) `external-contract-identifiers.md` — validar identificadores contra o código no draft, não só no PRD (causa do NO-GO original). (2) Orquestração: **nunca correr `@sm` (escrita) e `@po` (validação) em paralelo** — são sequenciais; o `@po` leu a v0.1 enquanto o `@sm` ainda não tinha gravado. E `mandatory-change-log` — verificar o ficheiro por grep independente, não confiar no output "feito" do agente (a 1ª gravação do River falhou silenciosamente).
- **Stories alternativas baixo risco:** 4.5 (CRUD metas) e 4.6 (CRUD lembretes) não dependem da 4.7 — podem arrancar em paralelo. Ver `EPIC-4.md` §10.
- **Memória relevante:** `project_nexus_v2_epic_4`, `project_nexus_v2_architecture` (ADR-1 Edge/Node), `project_nexus_v2_story_4_7_architect_direction`, `project_nexus_v2_story_4_7_revalidated`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE (Nexus v2), MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260601-story-4.7-READY-aguarda-prereq-devops.md`
- COINCIDEM? `SIM`

SE NÃO COINCIDEM, MOVER IMEDIATAMENTE COM `git mv` ANTES DE COMMIT.

AGENTE RESPONSÁVEL: `Orion (@aiox-master)` · DATA: `01/06/2026`
