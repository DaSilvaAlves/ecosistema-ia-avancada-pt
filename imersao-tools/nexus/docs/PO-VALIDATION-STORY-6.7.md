# PO Validation — Story 6.7 (OAuth flow Google, Gmail scope incremental)

> Validação `@po` (Pax) — task `validate-next-story.md` (10-point checklist). Data: 18/06/2026. Branch `main`, HEAD `d4cdb9eb`.

## Veredicto

**GO — Implementation Readiness Score: 9/10. Confidence: High.**

A Story 6.7 está pronta para o **Architect Gate de Entrada (T0, Aria)** e, após este, para `@dev`. Mantém o `Status: Draft` (correcto — `[D-6.7-*]` deferidos ao gate de entrada por design, padrão 6.1/6.2/5.7). NÃO é NO-GO. Os pontos abaixo são Should-Fix de fricção mínima, todos resolvíveis pela própria Aria no T0 — nenhum bloqueia o arranque.

---

## Aplicação do checklist de 10 pontos

| # | Ponto | Verdict | Nota |
|---|-------|---------|------|
| 1 | Template completeness | PASS | Todas as secções do `story-tmpl` presentes; sem placeholders. Executor Assignment, Not-Tested Gate, CodeRabbit Integration, Dev Agent Record, QA Results presentes. |
| 1.1 | Executor assignment | PASS | `executor: @dev` / `quality_gate: @architect` / tools `[coderabbit, lint, typecheck, vitest]`. `executor != quality_gate`. Coerente com EPIC-6 §5 row 6.7 (OAuth/segurança → gate `@architect`) e `separation-of-roles.md`. |
| 2 | File structure & source tree | PASS (verificado em código) | Todos os ficheiros de reutilização EXISTEM em `v2/`: `app/api/google/oauth/{start,callback,status,revoke}/route.ts`, `lib/google/{oauth,oauth-state,token-store}.ts`, `components/settings/GoogleCalendarSettings.tsx`, `app/(app)/settings/page.tsx`, `tests/mocks/handlers/google.ts`. Ficheiros novos (`GmailSettings.tsx`, testes) claramente sinalizados como NOVO. |
| 3 | UI/Frontend completeness | PASS | AC4 define ≥3 estados de render (`não-ligado`/`ligado`/`erro`) com teste de componente obrigatório (`react-component-test-criteria.md`). Design system canónico + A11y (`aria-live`/`role`) em T4. |
| 4 | AC satisfaction | PASS | 8 AC, todos traçam a FR63 (PRD §6.12) + AC1 epic (OAuth <60s) + regras (`internal-state-contract-gate`, `mock-protocol-fidelity`, `external-contract-identifiers`, `react-component-test-criteria`). Task→AC mapping explícito (T1→AC1, T2→AC2, T3→AC3, T4→AC4, T5→AC5/7, T6→AC7/8, T7→AC8). |
| 5 | Validation & testing | PASS | Testes falsificáveis genuínos: `include_granted_scopes=true` no URL; `scope` espaço-separado com `gmail.modify` na resposta MSW; preservação do `refreshToken` Calendar no `saveTokens`. Baseline 1965 PASS (snapshot da 6.2). |
| 6 | Security | PASS | Território OAuth/segurança. AC6 cobre state inválido→403, `getSession()` antes do fluxo, tokens nunca em logs, `access_denied` não destrói Calendar. CR `--base main` obrigatório no gate de saída (lição 5.11). Análise dos 3 eixos do `internal-state-contract-gate.md` prevista no T0. |
| 7 | Tasks/subtasks sequence | PASS | T0 (Architect Gate) é pré-req absoluto de T1-T6. Dependências `[requer T0]`/`[requer T3]` corretas. Granularidade adequada. |
| 8 | CodeRabbit integration | PASS | Secção completa: Story Type Security/Integration/Frontend, agentes `@dev`+`@architect`+`@devops`, quality gates pre-commit/pre-PR, self-healing light mode (2 iter, CRITICAL), focus areas alinhadas aos eixos b/c. |
| 8.1 | No duplicate functionality | PASS (advisory) | A story é explicitamente DRY — reutiliza a fundação 6.1/6.2 e proíbe duplicar `oauth.ts`/`oauth-state.ts`/`token-store.ts`. Sem duplicação introduzida. |
| 9 | Anti-hallucination | PASS (com observações) | Reuso verificado contra código real (ver abaixo). Zero invenção: as ambiguidades reais (signature de `generateAuthUrl`, ausência de `scope` no `GoogleTokenRecord`, status `{connected}` não-diferenciado) NÃO foram resolvidas por suposição — ficam como `[D-6.7-*]` para o T0. Constitution Artigo IV respeitado. |
| 10 | Dev implementation readiness | PASS | Self-contained após T0. Dev Notes com snippet `generateAuthUrl` incremental, tabela de reutilização ficheiro-a-ficheiro, scope `gmail.modify` documentado. |

---

## Verificação em código real (anti-hallucination — ponto 9)

| Claim da story | Estado real verificado | Veredicto |
|----------------|------------------------|-----------|
| Routes `start`/`callback`/`status`/`revoke` existem (Node) | CONFIRMADO — `app/api/google/oauth/{start,callback,status,revoke}/route.ts`, todas `runtime='nodejs'` | OK |
| `verifyAndConsumeState` single-use HMAC | CONFIRMADO — `lib/google/oauth-state.ts` usado pelo callback (linha 70) | OK |
| `token-store.ts` AES-256-GCM, seam intocado | CONFIRMADO — `GoogleTokenRecord {accessToken, refreshToken, expiresAt}`, [D-6.2-*] | OK |
| `revokeToken` real (não stub) | CONFIRMADO — `oauth.ts:204` POST revoke, 200/400 idempotente, 5xx→`TokenRevokeError` | OK |
| MSW handler shape real snake_case | CONFIRMADO — `google.ts` devolve `scope:'…/auth/calendar'` (single scope) | OK — confirma que T5 (adicionar `gmail.modify`) é trabalho genuíno |
| `GoogleCalendarSettings.tsx` com estados | CONFIRMADO — 6 estados de render; story diz NÃO ALTERAR | OK |

### Divergências entre o draft e o código — TODAS corretamente deferidas ao T0 (não penalizadas)

1. **`generateAuthUrl(state: string)` é Calendar-only e sem parâmetros** (`oauth.ts:117-125`, scope fixo `[GOOGLE_CALENDAR_SCOPE]`). O snippet das Dev Notes (que passa `scope`/`include_granted_scopes` ao `generateAuthUrl`) implica **alterar a assinatura desta função** — o que contradiz a tabela de reutilização ("Não alterar a assinatura das funções", linha 253). Isto é uma tensão real que a Aria resolve no `[D-6.7-INCREMENTAL]`: ou nova função (`generateGmailAuthUrl`) ou parametrizar `generateAuthUrl`. Bem enquadrado, não inventado.
2. **`GoogleTokenRecord` NÃO tem campo `scope`/`authorizedScopes`** (`token-store.ts:57-61`). O `[D-6.7-SCOPE-STORE]=(B)` exigiria adicionar este campo; `[D-6.7-STATUS]=(A)` depende dele. A story marca isto explicitamente nas "Notas ao Architect" (ponto 2). Correto.
3. **`/status` devolve `{connected: boolean}` não-diferenciado** (`status/route.ts:31`). O `[D-6.7-STATUS]` (expandir para `{calendarConnected, gmailConnected}`) é trabalho genuíno. A story prevê-o em T3. Correto.
4. **O callback redirige `?connected=calendar` literal** (`callback/route.ts:50`). Um fluxo Gmail bem-sucedido deveria provavelmente devolver `?connected=gmail` ou `?connected=google` — a story não menciona este detalhe explicitamente. **Should-Fix menor** (ver abaixo).

---

## Should-Fix (não-bloqueantes — resolúveis pela Aria no T0)

- **SF-1 (tensão de assinatura):** A tabela "Reutilização" (linha 253) diz "Não alterar a assinatura das funções" de `oauth.ts`, mas o snippet das Dev Notes (linhas 236-245) passa parâmetros novos a `generateAuthUrl`. O `[D-6.7-INCREMENTAL]` deve reconciliar isto explicitamente (provável: função nova `generateGmailAuthUrl`/parametrizada, preservando a `generateAuthUrl` Calendar-only intocada). A Aria fixa a redacção no T0.
- **SF-2 (redirect de sucesso do callback):** O callback existente redirige `?connected=calendar` fixo. A 6.7 deve definir o que a UI Gmail recebe no sucesso (ex.: `?connected=gmail`/`?connected=google`) sem alterar o caminho Calendar. AC2/AC3 devem mencionar este sinal. Detalhe que o T0 reconcilia (impacta `[D-6.7-STATUS]`/`[D-6.7-UI-COMPONENT]`).

## Confirmações positivas

- **FR63 / epic AC1:** AC1 da story traça a FR63 (PRD §6.12) e ao AC1 nível epic (OAuth <60s, EPIC-6 §6 — story principal 6.1/6.7). Correto.
- **Contratos externos (ponto 2):** scope `https://www.googleapis.com/auth/gmail.modify` e `include_granted_scopes:true` validados no draft contra `external-contract-identifiers.md`. O MSW real (Calendar-only hoje) confirma que a fidelidade de protocolo multi-scope é trabalho a fazer (T5), não assumido.
- **Ciclo de vida de estado (ponto 3):** os 3 eixos (a/b/c) estão explicitamente previstos para o T0, com perguntas concretas e específicas da 6.7 (token único vs adicional; replay de scope já autorizado; `access_denied` não destrói Calendar).
- **AC de produção deferidos (ponto 4):** AC5 produção (OAuth Gmail <60s real) deferido a verificação manual por Eurico após deploy, padrão AC13 da 4.9. Pré-req humano P1-Gmail (activar Gmail API no Google Cloud Console) sinalizado como **não-bloqueante para CI/dev, bloqueante só para produção**. Correto.
- **`[D-6.1-*]`/`[D-6.2-*]` NÃO reabertos:** a story reutiliza-as como contrato fechado.

---

## Decisão final

**GO — 9/10.** Próximo passo: **Architect Gate de Entrada (T0, Aria)** — ratificar os 4 `[D-6.7-*]`, responder os 3 eixos do `internal-state-contract-gate.md`, reconciliar SF-1/SF-2 na redacção dos AC. Depois `@dev *develop 6.7` com gate de saída `@architect` + CR `--base main` (lição 5.11).
