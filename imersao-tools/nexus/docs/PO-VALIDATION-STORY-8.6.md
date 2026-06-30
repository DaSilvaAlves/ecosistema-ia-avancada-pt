# PO Validation — Story 8.6 (Cutover de Produção OpenAI + Runbook de Rollback)

**Validador:** Pax (`@po`)
**Data:** 30/06/2026
**Story:** `imersao-tools/nexus/docs/stories/active/8.6.story.md`
**Task:** `validate-next-story.md` — 10-point checklist + pontos específicos de uma story de cutover de produção
**Veredicto:** **GO** — Pontuação **9 / 10**
**Decisão de status:** mantém `Draft` (a transição para `Approved` cabe ao `@sm` / executor após registar a decisão de gate em T1; ver ponto 6)

---

## Sumário executivo

A Story 8.6 é a **última do Epic 8** (S6 — cutover de produção) e está **inteiramente prescrita pelo ADR-10 §8 row S6 + EPIC-8 §6 AC3/AC4 + EPIC-8 §8 pré-requisito #1**. É uma story operacional/configuração com **ZERO código de produção** — o único artefacto escrito é o runbook (`docs/runbooks/cutover-openai-rollback.md`).

Numa story de produção, a **precisão das citações de código é crítica** (um comando de rollback errado ou uma referência de linha falsa pode induzir o `@devops` em erro durante o cutover). Verifiquei **todas as 5 citações de linha de código contra o ficheiro real** em `imersao-tools/nexus/v2/` — **batem exactamente, sem uma única divergência**:

| Citação na story | Linha real verificada | Resultado |
|------------------|----------------------|-----------|
| `lib/shared/env.ts:35` — `LLM_PROVIDER: z.enum(LLM_PROVIDERS).default('anthropic')` | Linha 35, idêntica | **EXACTA** |
| `lib/shared/env.ts:114` — `NEXT_PUBLIC_LLM_PROVIDER: z.enum(LLM_PROVIDERS).default('anthropic')` | Linha 114, idêntica | **EXACTA** |
| `lib/shared/env.ts:41-44` — `OPENAI_API_KEY: z.string().min(10,...).optional()` | Linhas 41-44, idênticas | **EXACTA** |
| `lib/shared/env.ts:193` — `assertProviderFlagsAgree()` | Linha 193 (`export function assertProviderFlagsAgree(): void {`) | **EXACTA** |
| `factory.ts:73` — `resolveActiveProvider()` chama `assertProviderFlagsAgree()` | Linha 73 (`function resolveActiveProvider(): LLMProvider {`), chamada na linha 74 | **EXACTA** |
| `app/api/openai/proxy/route.ts` — Edge, `OPENAI_URL` constante, `getSession`, rate-limit KV, Bearer | Ficheiro existe; `OPENAI_URL` const linha 30, `runtime='edge'` linha 27, `getSession` import linha 2, rate-limit `nexus:ratelimit:openai:*` | **CONFIRMADA** |

Confirmei ainda, por verificação directa, que **`OPENAI_API_KEY` vive só em `ServerEnvObject`** (linhas 41-44) e **NÃO em `PublicEnvSchema`** (linhas 107-115, que só contém `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC` + `NEXT_PUBLIC_LLM_PROVIDER`), e que **`NEXT_PUBLIC_OPENAI_API_KEY` não existe em nenhum ficheiro** `v2/lib` ou `v2/app` (grep vazio) — o que dá base factual real ao AC4/AC6 (NFR5 server-only).

**Três notas menores não-bloqueadoras** (uma imprecisão de rótulo num precedente, baseline numérico hardcoded, e a pasta-alvo do runbook ainda não existir) baixam a pontuação de 10 para 9. Nenhum fix é obrigatório para arrancar. **GO.**

---

## Citações literais verificadas (foco No Invention — Constitution Art. IV)

| Citação na story | Fonte | Resultado |
|------------------|-------|-----------|
| ADR-10 §8 row S6 (âmbito + AC + gate, story linha 21) | ADR-10 linha 400 | **FIEL** (verbatim, incluindo "`@qa` + manual (deploy por `@devops`)") |
| EPIC-8 §6 AC3 (story linha 24) | EPIC-8 linha 78 | **FIEL** (verbatim) |
| EPIC-8 §6 AC4 (story linha 27) | EPIC-8 linha 79 | **FIEL** (verbatim — server-only NFR5, proxy upstream constante sem SSRF) |
| EPIC-8 §8 pré-requisito #1 (story linha 30) | EPIC-8 linha 116 | **FIEL** (verbatim — "Pendente — necessário antes da 8.6") |
| ADR-10 §1.2.3 (produção sem cérebro, critério = correcção não uptime) | ADR-10 linhas 33-35 | **FIEL** (suporta D-8.6-CUTOVER-AUTHORITY) |

Nenhum AC inventado. Cada um dos 6 AC traça a uma destas fontes. **Achado positivo de propagação:** a recomendação No-Invention da validação da 8.5 (não citar o ficheiro inexistente `cr-base-main-no-gate-saida.md`) **foi aplicada** — a 8.6 cita correctamente `coderabbit-integration.md` (ficheiro real) na tabela de regras (Dev Notes linha 334).

---

## 10-Point Checklist

| # | Critério | Veredicto | Pontuação |
|---|----------|-----------|-----------|
| 1 | Template completo (todas as secções presentes) | PASS | 1,0 |
| 2 | AC claros, testáveis, traçados ao ADR-10 §8 S6 + EPIC-8 AC3/AC4/pré-req #1 | PASS | 1,0 |
| 3 | Tasks/subtasks cobrem todos os AC, ordem por dependência (T1→T6) | PASS | 1,0 |
| 4 | Dev Notes com contexto técnico verificado (citações de código exactas) | PASS* | 0,5 |
| 5 | Dependências identificadas e satisfeitas (8.5 Done; parity verde; key = gate de entrada) | PASS | 1,0 |
| 6 | Separation-of-roles (executor `@devops` ≠ gate `@qa` ≠ smoke Eurico) | PASS | 1,0 |
| 7 | Escopo contido (ZERO código de produção; só runbook .md) | PASS | 1,0 |
| 8 | Regras do projecto aplicadas (not-tested/Evidence Gate, separation, merge-authority, CR --base main, hard-stop §8) | PASS | 1,0 |
| 9 | Riscos/gotchas identificados (concordância de flags, key inválida, rollback, lição 8.4) | PASS* | 0,5 |
| 10 | Alinhamento ADR-10 + ausência de invenção (Art. IV) | PASS | 1,0 |

**Total: 9,0 / 10** — limiar GO é ≥7. (*) Pontos 4 e 9 perdem 0,5 cada pelas notas menores abaixo (nenhuma bloqueante).

### Detalhe por ponto crítico da 8.6

**Ponto 1 (No Invention + citações de código) — PASS.** Todas as citações de linha verificadas no ficheiro real; todas as citações literais ADR-10/EPIC-8 fiéis. É a story de melhor precisão de citação do Epic 8 (zero divergências de linha; o nit de regra inexistente da 8.5 já não se repete).

**Ponto 2 (AC testáveis + Evidence Gate) — PASS.** AC1-AC6 têm comando/critério concreto: AC1 `vercel env ls --environment production`; AC2 valores das flags + `assertProviderFlagsAgree()` no boot + `vercel logs` sem erro de arranque; AC3 smoke test + `vercel logs` 200 no proxy + evidência registada; AC4 ficheiro runbook com secções e comandos CLI; AC5 checklist de não-regressão de UI; AC6 `vercel env ls` confirma server-only + ausência de `NEXT_PUBLIC_OPENAI_API_KEY`. A secção **Not-Tested Evidence Gate** está bem construída — exige evidência real (screenshot + `vercel logs` 200) e aplica `not-tested-trailer-rules.md` correctamente: env vars de produção → `Not-tested:` **não é waiver válido**, é red flag bloqueador. Tabela de evidências obrigatórias presente e accionável.

**Ponto 3 (pré-requisito bloqueante) — PASS.** AC1 está **explicitamente marcado como gate de entrada**: "Este AC é **bloqueante** para todos os ACs subsequentes: sem a key real, o smoke test (AC3) é impossível." T1 e T3 reforçam-no na sequência de tasks (T3 provisão antes de T4 cutover antes de T5 smoke). Conforme.

**Ponto 4 (deferição ao Eurico + separation-of-roles) — PASS.** D-8.6-CUTOVER-AUTHORITY e o Executor Assignment estabelecem três papéis distintos: `@devops` executa (provisão de env vars + redeploy), `@qa` valida pré-condições e revê o runbook, Eurico autoriza cada step irreversível + faz o smoke test manual. **Nenhum agente é o seu próprio quality gate** (`executor != quality_gate`: PASS). Alinha com `separation-of-roles.md`. A autorização humana explícita para o flip das flags (ancorada em ADR-10 §1.2.3 — "o critério é correcção, não uptime") é a decisão correcta para a única acção com efeito em produção.

**Ponto 5 (runbook) — PASS.** AC4 + T2 definem um runbook completo e testável: contexto, pré-condições, procedimento de cutover, procedimento de rollback (com comandos Vercel CLI), critérios de activação do rollback, tempo estimado, confirmação pós-acção, contacto de escalação. O rollback é **logicamente testável** (inverso exacto do cutover — flip de flags + redeploy, reversível por construção; ADR-10 §6.1 retrocompat). A localização `docs/runbooks/` (D-8.6-RUNBOOK-LOCATION, AUTO-DECISION) é razoável e justificada — verifiquei que a pasta **não existe ainda** (`find docs -type d -name runbooks` vazio), portanto a criação é dívida positiva (espaço para futuros runbooks) e não colide com convenção existente.

**Ponto 6 (scope ZERO código) — PASS.** D-8.6-SCOPE é defensável e verificado: as flags (`LLM_PROVIDER`, `NEXT_PUBLIC_LLM_PROVIDER`), a `OPENAI_API_KEY`, `assertProviderFlagsAgree()`, `resolveLLMProvider()`, o branching da factory e o proxy Edge **já existem em `main`** (8.1/8.2/8.3/8.4 Done) — confirmei linha a linha. Mudar o provider em produção é puro flip de env vars + redeploy; **nenhum AC requer alterar código de produção**. A nota de Tasks "qualquer modificação fora de `docs/runbooks/` é sinal de scope errado → STOP" sela o limite.

**Ponto 7 (hard-stop §8 / merge-authority / coderabbit-integration) — PASS.** Hard-stop §8 (máx 2 iterações CR; Iter 3+ exige `Authorized-by: Eurico`) referenciado na Self-Healing Configuration. `merge-authority.md` correctamente descrito (o `@devops` faz o merge do PR do runbook com as 6 condições verdes no head SHA; nunca pedir merge manual ao Eurico). `coderabbit-integration.md` — CR `--base main` obrigatório no PR do runbook (norma do Epic 8; lição 8.4 CR local ≠ CR server-side) — correctamente citado com o nome de ficheiro real.

---

## Notas menores (não bloqueiam — para o `@sm`/executor)

**Obrigatórios (bloqueiam):** nenhum.

**Recomendados (não-bloqueantes):**

1. **Imprecisão de rótulo num precedente (Dev Notes, tabela "Precedentes de verificação manual deferida", linha 360).** A linha rotula o AC deferido da Story 7.3 como "AC6 — voice synthesis em prod". O **número do AC (AC6) e o padrão (verificação manual deferida ao Eurico) estão correctos**, mas o rótulo "voice synthesis" é impreciso: a 7.3 foi "texto transcrito → cérebro (FR79)"; a *síntese de voz* (SpeechSynthesis a ler a resposta) foi a 7.4. Sugiro ajustar o rótulo para "AC6 — verificação manual E2E em produção (FR79)" para fidelidade histórica. Cosmético; não afecta a validade do precedente (a 8.6 é genuinamente a 3.ª story com verificação-só-de-produção deferida).

2. **Baseline numérico hardcoded (`≥2535 PASS`, várias ocorrências — Estimativa, T1.2, Testing, Contexto de produção).** O número 2535 está coerente com "8.5 acrescentou parity sobre os 2527 pós-8.4", mas está fixado no texto. Como a 8.6 toca ZERO código de produção, o invariante real é "sem regressão face à baseline **efectiva** pós-8.5". Sugiro que T1.2 confirme o número exacto corrente (`npm run test:unit` a partir de `v2/`) em vez de validar contra um literal — a própria T1.2 já manda confirmar a baseline, pelo que basta não tratar 2535 como contrato.

3. **Pasta `docs/runbooks/` ainda não existe.** Confirmado por mim (não é problema — T2.1 cria-a). Apenas registo que a File List / Dev Notes a tratam correctamente como "CRIAR (NOVO)".

---

## Confirmações de conformidade do validador

- **NÃO implementei código.** Apenas li ficheiros e corri `grep`/`ls`/`find` para verificar factos (env.ts, factory.ts, proxy route, ausência de `NEXT_PUBLIC_OPENAI_API_KEY`, ausência da pasta `runbooks/`, citações literais ADR-10/EPIC-8, convenção PO-VALIDATION da 8.5).
- **NÃO alterei os Acceptance Criteria** — nem tasks, nem scope, nem AUTO-DECISIONS, nem status (mantém-se `Draft`). As notas menores acima são para o `@sm` corrigir, não para mim.
- Únicas acções de escrita: este relatório de validação + uma linha no Change Log da story (v0.2).

---

*Validação produzida por Pax (`@po`) em 30/06/2026. Veredicto **GO 9/10**. A 8.6 está pronta para o registo da decisão de gate (T1) e arranque. Todas as citações de código batem certo (precisão exacta — crítica numa story de cutover). Próximo passo: executor regista T1 → `Approved` → criar runbook + PR (CR `--base main`) → provisão da key (Eurico + `@devops`) → cutover autorizado pelo Eurico → smoke test → evidência no Evidence Gate → `@po *close-story 8.6` (fecha o Epic 8; o cérebro volta a responder em produção via OpenAI).*
