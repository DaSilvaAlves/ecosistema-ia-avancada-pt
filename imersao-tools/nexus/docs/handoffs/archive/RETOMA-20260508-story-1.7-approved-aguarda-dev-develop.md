# RETOMA — Story 1.7 Approved 10/10, aguarda @dev implementar (terminal limpo)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

---

## TL;DR

Sessão actual com pipeline completo executado (Gage closure Story 1.6 → SM draft Story 1.7 → Architect 6 RESOLVED + ADR-6 NOVO → PO Pax 10/10 GO). Story 1.7 (Undo mechanism com `@vercel/kv` real) está em `Status: Approved` no ficheiro `imersao-tools/nexus/docs/stories/active/1.7.story.md` (684 linhas, untracked em main `598bcdad`). Eurico solicitou abrir terminal limpo para a implementação substancial (5-7h, 9 tasks, ~38 subtasks). Próximo agente: `@dev` Dex com `*develop 1.7`.

---

## AGENTE AIOX A INVOCAR NO TERMINAL NOVO

| Cenário | Agente | Comando exacto |
|---------|--------|----------------|
| **Cenário A (DEFAULT — recomendado)** | `@dev` Dex | `@dev *develop 1.7` |
| Cenário B — Eurico quer rever spec antes | qualquer agente | (lê `imersao-tools/nexus/docs/stories/active/1.7.story.md` primeiro) |
| Cenário C — Eurico quer ajustar resoluções @architect | `@architect` Aria | `@architect` reabre RESOLVED específico |

**Default se Eurico responder apenas "executa"/"avança"/"continua":** invocar `@dev` Dex com Cenário A.

---

## Mensagem inicial sugerida para o terminal novo

Cola exactamente isto na primeira mensagem do terminal novo:

```
Continuação de sessão anterior. Lê este handoff primeiro:
imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.7-approved-aguarda-dev-develop.md

Depois invoca @dev *develop 1.7 para implementar a Story 1.7 (Undo mechanism).
```

---

## Estado actual (08/05/2026)

| Item | Valor |
|------|-------|
| Story | 1.7 — Undo mechanism (storage 30s + endpoint reverse) |
| Epic | Nexus v2 Epic 1 (Cérebro Multi-Intent) |
| Status | **Approved** (10/10 GO da @po Pax) |
| Localização story file | `imersao-tools/nexus/docs/stories/active/1.7.story.md` (684 linhas, untracked) |
| Branch actual | `main` (limpa, pós-closure Story 1.6 `598bcdad`) |
| Branch a criar pelo @dev | `feat/nexus-v2-story-1.7-undo-mechanism` |
| Estimativa | **5-7h** (KV layer + módulo undo + endpoint Edge + executor extension + 14-17 tests) |
| Stories Epic 1 | 6/10 Done (1.1+1.2+1.3+1.4+1.5+1.6); 1.7 Approved aguarda dev |
| Bloqueia | Stories 1.8 (endpoint `/api/agent/prompt`), 1.9 (UI undo toast) |
| Bloqueada por | Stories 1.5+1.3+1.1 — todas Done |

---

## Pipeline executado nesta sessão (NÃO REPETIR)

### Fase 1 — Story 1.6 closure (`@devops` Gage)

- Cenário A (merge waived) executado conforme handoff anterior
- 14 sub-passos executados (gh pr merge → checkout main → mv active→completed → 4 nits absorbed → 4 handoffs archived → INDEX update → closure commit → push → Vercel verified)
- PR #9 merged `115d7033` (2026-05-08T01:41:18Z), closure commit `598bcdad`
- Story 1.6 status `Ready for Review → Done`
- Quality verification: 35/35 vitest PASS local em executor.test.ts pós-fixes
- Deploy verified: HTTP 307 → /login em https://imersao.ia.expressia.pt

### Fase 2 — Story 1.7 draft (`@sm` River)

- Created `imersao-tools/nexus/docs/stories/active/1.7.story.md` v0.1
- 13 ACs, 9 Tasks (~38 subtasks), 6 OQs documentadas
- Trace canónico: PRD §6.1 FR6 + §10 linha 418 + Epic 1 AC4 + Architecture v2 §3+§6.5+§7.2+§8+§17 + Stories 1.1+1.3+1.5+1.6
- Estimativa atualizada 3-5h → 5-7h (scope inclui endpoint reverse conforme PRD §10)

### Fase 3 — Architect Resolution (`@architect` Aria)

Story 1.7 v0.2 — 6 OQs resolvidas com trace-back rigoroso (precedente Story 1.5 RESOLVED-1/2/3):

| RESOLVED | Decisão | Razão chave |
|----------|---------|-------------|
| **RESOLVED-1** | `vi.mock('@vercel/kv')` directo APROVADO | Alinha Stories 1.4-1.6 pattern; princípio "do not mock unit under test" para `lib/agent/undo.ts` em executor tests |
| **RESOLVED-2** | Defense-in-depth APROVADO | KV `ex: 30` + endpoint guard `entry.expiresAt < Date.now()` → 410. Fecha race window de 1s do Upstash TTL precision + clock skew Edge regions |
| **RESOLVED-3** | Cross-process ConfirmationProvider DIFERIDO Story 1.8 + **ADR-6 NOVO** | Namespaces independentes: `nexus:undo:run:*` (Story 1.7) vs `nexus:agent:confirm:*` (Story 1.8 TBD). Partilham cliente `kv`, patterns distintos |
| **RESOLVED-4** | Reverte TODOS os toolCalls do último AgentRun em ordem reversa | "última operação" = último AgentRun (multi-tool); alinha PRD AC1 + Story 1.5 RESOLVED-1 + UX 1-toast-1-click |
| **RESOLVED-5** | 2º POST → 410 (não 200 idempotente neutral) | REST semantic resource Gone; debugging clarity; Story 1.9 deve desactivar botão após 1º click |
| **RESOLVED-6** | Best-effort `errors[]` + adenda `logger.error` | Invariant violation `tool.reverse === undefined` surface em ops sem bloquear UX undo parcial |

ACs alterados pela resolução: **AC6** (defense-in-depth guard + logger.error invocations), **AC9** (14-17 tests = 12-15 inicial + 2 cenários novos: defense-in-depth expiry + invariant violation observability).

Architecture v2 NÃO modificado (ADRs 1-5 fechados em 04/05/2026 intactos; ADR-6 vive in-story file conforme precedente Story 1.5 RESOLVED pattern).

### Fase 4 — PO Validation (`@po` Pax)

Story 1.7 v0.3 — 10-point checklist canónico (precedente Stories 1.5+1.6 ambas 10/10 GO):

| # | Critério | Verdict |
|---|----------|---------|
| 1 | Story format | PASS |
| 2 | ACs claros e testáveis | PASS |
| 3 | ACs alinhados com Epic | PASS |
| 4 | Tasks granulares | PASS |
| 5 | Dependencies identificadas | PASS |
| 6 | Technical context suficiente | PASS |
| 7 | Test plan definido | PASS |
| 8 | No invention (Article IV) | PASS |
| 9 | Constitutional compliance Articles I-VI | PASS |
| 10 | GAP handling | PASS |

**Score: 10/10 GO.** Status `Draft → Approved`.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.7-approved-aguarda-dev-develop.md`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Decisões fechadas Story 1.7 (NÃO REABRIR)

Estas decisões já passaram por @sm + @architect + @po e estão registadas em RESOLVED-N + ADR-6 + AC actualizados. Reabrir requer escalação explícita do Eurico.

1. **Pacote `@vercel/kv` ^3.0.0** (arch §17 line 1132)
2. **TTL constant `UNDO_TTL_SECONDS = 30`** (PRD FR6 + Epic 1 AC4)
3. **KV namespace `nexus:undo:run:<runId>`** (extensão padrão arch §6.5 namespaces existentes)
4. **Defense-in-depth TTL guard** (KV `ex: 30` + `expiresAt < Date.now()` no endpoint)
5. **Reverse loop best-effort** (continua mesmo com erros parciais, acumula em `errors[]`)
6. **Endpoint NÃO chama `markRunReverted`** (cliente-side via Story 1.9 — RESOLVED-2 Story 1.5)
7. **Independent KV namespace de ConfirmationProvider** (ADR-6 — Story 1.7 owns `nexus:undo:*`, Story 1.8 owns `nexus:agent:confirm:*`)
8. **Multi-tool runs revertem TODOS os toolCalls em ordem reversa** (RESOLVED-4)
9. **2º POST endpoint → 410** (não 200 idempotente neutral)
10. **`tool.reverse === undefined` → `errors[]` + `logger.error`** (RESOLVED-6 com adenda Aria)

---

## Plano de implementação (resumo das 9 tasks da Story 1.7)

**O ficheiro completo está em `imersao-tools/nexus/docs/stories/active/1.7.story.md` — Dex deve ler o ficheiro inteiro antes de começar.**

| Task | Descrição | Estimativa |
|------|-----------|------------|
| 1 | `npm install @vercel/kv@^3.0.0` em `imersao-tools/nexus/v2/` + `.env.example` | ~30 min |
| 2 | `UndoEntrySchema` + `UndoRequestSchema` em `lib/agent/schemas.ts` (Zod canonical Story 1.4 pattern) | ~30 min |
| 3 | `lib/agent/undo.ts` — 3 funções (`registerUndoEntry`, `getUndoEntry`, `deleteUndoEntry`) + constante + key helper | ~1h |
| 4 | Estender `lib/agent/executor.ts` — kv real + `undo_registered` SSE event + register loop best-effort | ~1-1.5h |
| 5 | Criar `app/api/agent/undo/route.ts` Edge runtime + auth + defense-in-depth + best-effort + 410 | ~1-1.5h |
| 6 | 14-17 tests Vitest (módulo undo + executor extension + endpoint) | ~2h |
| 7 | Quality gates AC11 5/5 PASS local (lint, typecheck, test:unit, build, coverage) | ~30 min |
| 8 | Story file maintenance — checkboxes, File List, Dev Agent Record, Change Log | ~15 min |
| 9 | Delegar push a `@devops *push 1.7` | (não conta — outro agente) |

**Total estimado:** 5-7h. Sessão fresca com context window livre é ideal.

---

## Caveat operacional CRÍTICO

| Caveat | Detalhe |
|--------|---------|
| Working directory | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt` |
| Branch a criar | `feat/nexus-v2-story-1.7-undo-mechanism` (precedente Stories 1.5+1.6 nomenclatura `feat/nexus-v2-story-{n}-{slug}`) |
| Comandos `gh` requerem flag | `--repo DaSilvaAlves/ecosistema-ia-avancada-pt` (sem flag, gh resolve para upstream `SynkraAI/aiox-core` por default e falha) |
| Push exclusivo | `@devops` Gage (regra `agent-authority.md` Article II) — `@dev` NUNCA pushea |
| Sem `--no-verify` | Pre-commit hooks devem correr (regra `comunidade-safety.md` + global commit protocol) |
| Sem `--force` | Push limpo apenas (precedente Stories 1.5+1.6) |
| PT-PT | Todas as comunicações + commits + comments |
| Conventional commits + trailers | `feat:` para nova feature; trailers Constraint, Confidence, Scope-risk, Directive, Not-tested |
| Workspace governance | Tudo em `imersao-tools/nexus/v2/` (regra `workspace-governance.md`) |

---

## Quality gates expected (AC11)

Antes de delegar push a `@devops`, todos os 5 gates devem PASS local:

| Gate | Expectativa |
|------|-------------|
| `npm run lint` | Zero novos warnings (warning pre-existing em `app/api/auth/logout/route.ts` é aceitável — Stories 1.5+1.6 confirmaram) |
| `npm run typecheck` | Exit 0 |
| `npm run test:unit` | 209-212 tests PASS (195 actuais + 14-17 novos) |
| `npm run build` | 11 routes PASS (10 actuais + `/api/agent/undo` novo) |
| `npm run test:coverage` | `lib/agent/undo.ts` >= 90%, `app/api/agent/undo/route.ts` >= 85%, `lib/agent/executor.ts` >= 93% (não regredir do 93.83% Story 1.6) |

Falhas Coverage Report + Record Quality Metrics são tech debt pre-existing (idêntico Stories 1.4/1.5/1.6 — `aiox-capabilities-guardian` backup não existe no CI runner) — NÃO bloqueiam.

---

## Anti-padrões críticos Story 1.7 (do próprio ficheiro)

- NÃO criar o endpoint `/api/agent/prompt` — é Story 1.8
- NÃO criar UI toast undo nem countdown — é Story 1.9
- NÃO alterar `ToolDefinition` (Story 1.3) — `reversible` e `reverse?` já existem
- NÃO alterar `AgentRunSchema` (Story 1.1) — `status: 'reverted'` já existe
- NÃO alterar `ConfirmationProvider` (Story 1.6) — independente do undo
- NÃO chamar `markRunReverted` no servidor — é client-side Dexie (RESOLVED-2 Story 1.5)
- NÃO unificar KV namespace com ConfirmationProvider (Story 1.6) — manter separação até ADR explícito (ADR-6 confirma)

---

## Acessos rápidos

| Recurso | Path / URL |
|---------|------------|
| Pasta para abrir terminal novo | `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt` |
| Story file (Approved 10/10) | `imersao-tools/nexus/docs/stories/active/1.7.story.md` (684 linhas) |
| PRD canónico | `imersao-tools/nexus/docs/PRD-NEXUS-V2.md` (§6.1 FR6 L126, §10 L418, Epic 1 AC4 L427) |
| Architecture canónica | `imersao-tools/nexus/docs/architecture-v2.md` (§3 layout, §6.5 KV, §7 ToolRegistry, §8 streaming, §17 packages) |
| Schemas existentes | `imersao-tools/nexus/v2/lib/agent/schemas.ts` |
| Tool registry | `imersao-tools/nexus/v2/lib/agent/tools/registry.ts` |
| Executor (estender) | `imersao-tools/nexus/v2/lib/agent/executor.ts` |
| Stories anteriores Done (referência) | `imersao-tools/nexus/docs/stories/completed/1.{1,2,3,4,5,6}.story.md` |
| Produção | https://imersao.ia.expressia.pt |
| Repo | https://github.com/DaSilvaAlves/ecosistema-ia-avancada-pt |
| Branch base | `main` em `598bcdad` |

---

## Memórias persistentes relevantes (do Eurico)

- `project_nexus_v2_producao.md` — Nexus v2 LIVE desde 04/05/2026
- `project_nexus_v2_architecture.md` — 5 ADRs Aria 04/05/2026 (NÃO reabrir)
- `feedback_mock_must_reflect_real_protocol.md` — MSW mocks reflectem protocolo real (relevante para cobertura test do `@vercel/kv` mock vs HTTP-level)
- `feedback_no_more_tools.md` — não instalar ferramentas além das já listadas (RESOLVED-1 alinha — `vi.mock` directo, não nova lib)
- `feedback_never_close_terminals.md` — Eurico trabalha com múltiplos terminais paralelos; este handoff é entre sessões distintas (não fechar a actual)

---

## Stories Epic 1 — estado actual

| Story | Estado |
|-------|--------|
| 1.1 Audit Log Data Access Layer | Done (`e70f6f5c`) |
| 1.2 Provider Abstraction Anthropic | Done (`18bc7be2`) |
| 1.3 Tool Registry com Zod | Done (`433d74c3`) |
| 1.4 Classifier prompt PT-PT (Haiku 4.5) | Done (`d3cd981f`) |
| 1.5 Executor + SSE + tool calling loop | Done (`4761e104` waived closure) |
| 1.6 Tool Preview Gate | Done (`115d7033`/closure `598bcdad`) |
| **1.7 Undo mechanism** | **Approved 10/10 — aguarda @dev *develop 1.7** |
| 1.8 Endpoint `/api/agent/prompt` | Pending (depende 1.7) |
| 1.9 UI client consumer Dexie | Pending |
| 1.10 50 prompts regression | Pending |

Após 1.7 fechar: cascata 1.8 → 1.9 → 1.10 desbloqueia. Story 1.8 vai precisar de ADR específico para cross-process ConfirmationProvider (referenciado em ADR-6 da Story 1.7).

---

## Acções concluídas (não repetir)

- Story 1.6 closure completo (PR #9 merged `115d7033`, closure `598bcdad`, 4 nits absorbed, 4 handoffs archived, INDEX updated, deploy verified)
- Story 1.7 draft `imersao-tools/nexus/docs/stories/active/1.7.story.md` (v0.1 → v0.3)
- 6 OQs resolvidas pela `@architect` Aria com RESOLVED-1 a RESOLVED-6
- ADR-6 NOVO documentado in-story (KV namespacing independente)
- AC6 + AC9 actualizados pelas resoluções
- 10-point checklist `@po` Pax aplicado: 10/10 GO
- Status `Draft → Approved`
- Change Log v0.1 + v0.2 + v0.3 preenchidos

---

## Constraints inegociáveis (manter no terminal novo)

- Push authority EXCLUSIVO `@devops` Gage (Article II)
- Sem `--force`, sem `--no-verify`, sem flags destrutivas
- Comandos `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`
- Não tocar em L1/L2 (`.aiox-core/core/`, `.aiox-core/development/tasks/`, etc.)
- Story 1.7 só vai para `completed/` APÓS merge confirmado (acontece em closure pós-PR pelo @devops)
- Falhas Coverage Report / Record Quality Metrics são tech debt pre-existing — NÃO bloqueiam merge
- Comunicação Eurico em PT-PT
- Conventional commits + trailers (Constraint, Confidence, Scope-risk, Directive, Not-tested) — global commit protocol
- Workspace governance respeitada (tudo em `imersao-tools/nexus/v2/`)
- Sem novas ferramentas/libs além de `@vercel/kv` (que já está no arch §17 line 1132)

---

## Recovery / Edge cases para terminal novo

| Situação | Acção esperada |
|----------|----------------|
| `git status` mostra working tree dirty pre-existente | Ignorar — drift de outros projectos não relacionado com Story 1.7 (precedente Story 1.6 closure ignorou também) |
| Branch `feat/nexus-v2-story-1.7-undo-mechanism` já existe localmente | Verificar `git log` se já há commits; se sim, contactar Eurico antes de continuar |
| `npm install` falha em `imersao-tools/nexus/v2/` | Verificar Node version (>=18 per project), tentar `npm install --legacy-peer-deps` se conflict (precedente Story 1.5 não usou esta flag) |
| Vitest tests falham com "Cannot find @vercel/kv" | Confirmar `npm install` foi feito DENTRO de `imersao-tools/nexus/v2/` (não na root do repo) |
| TypeScript erro em import `import { kv } from '@vercel/kv'` | Verificar @vercel/kv version >=3.0.0 (versão 2.x tem signatura diferente) |
| Quality gates falham > 2 vezes consecutivas | Pausar, criar handoff de escalação para @architect Aria reavaliar resolução técnica |

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: **Nexus v2**
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260508-story-1.7-approved-aguarda-dev-develop.md`
- COINCIDEM? **SIM**

AGENTE RESPONSÁVEL: `@po` Pax (sessão actual finaliza após validação 10/10) → próximo terminal Eurico (`@dev` Dex para Cenário A `*develop 1.7`)
DATA: 08/05/2026
