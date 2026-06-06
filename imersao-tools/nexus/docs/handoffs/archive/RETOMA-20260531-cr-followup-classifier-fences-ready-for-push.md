# RETOMA — CR follow-up classifier-fences (PR #46) pronto para push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

| Campo | Valor |
|-------|-------|
| from_agent | dev (Dex) |
| to_agent | devops (Gage) |
| created | 2026-05-31 |
| status | consumed |
| consumed_by | devops (Gage) |
| consumed_at | 2026-05-31 |
| next_action | push da branch + abrir PR contra main (FEITO: branch pushed `9404c624`, PR #47 aberto vs main) |

## Sumário

Follow-up não-bloqueador do hotfix classifier-fences. O PR #46 (ADR-9) já está
merged em main (`77108b6e`) e verificado em produção. O CodeRabbit Iter 1 desse
PR levantou 3 findings: F1 (MD040 num handoff) já foi resolvido pelo @devops
antes do merge (commit `6b76dc5`); F2 e F3 (ambos Minor/Nitpick) ficaram por
resolver e são o âmbito deste handoff.

Branch `chore/cr-followup-classifier-fences` criada a partir de `origin/main`
actualizado, 1 commit local `9404c624`, gates verdes. **Falta apenas push + PR**
(autoridade exclusiva @devops).

## Findings resolvidos

| ID | Severidade | Ficheiro | Resolução |
|----|-----------|----------|-----------|
| F2 | Minor (Potential issue) | `v2/lib/agent/inference-transport.ts` (JSDoc `classify`, ~L235) | JSDoc stale dizia que o strip de fences era server-side; actualizado para reflectir que o client aplica `stripJsonMarkdownFences` antes do `JSON.parse` (hotfix 31/05) + nota anti-regressão ADR-9 |
| F3 | Nitpick (Quick win) | `v2/tests/unit/agent/inference-transport.test.ts` (~L120) | Adicionado teste edge: fence de abertura ```` ```json ```` SEM fecho → tranca o fallback `extractFirstJsonObject` e a preservação do `rawResponse` com fences |

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. SE ESTE CAMINHO NÃO ESTIVER DENTRO DA PASTA DO PROJECTO A QUE O HANDOFF SE REFERE, MOVER IMEDIATAMENTE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Estado técnico

| Item | Valor |
|------|-------|
| Branch | `chore/cr-followup-classifier-fences` |
| Base | `origin/main` (`77108b6e`) |
| Commit local | `9404c624` |
| Ficheiros alterados | 2 (`inference-transport.ts`, `inference-transport.test.ts`) — 20 ins / 4 del |
| typecheck | PASS (exit 0) |
| lint (`next lint`) | PASS (exit 0; único warning pré-existente em `app/api/auth/logout/route.ts`, não relacionado) |
| vitest (ficheiro afectado) | 10/10 PASS (era 9, +1) |
| vitest (suite completa) | 88 ficheiros / 1118 testes PASS |

Diretório de trabalho Nexus v2: `imersao-tools/nexus/v2/`.

## next_action (para @devops)

1. `git push -u origin chore/cr-followup-classifier-fences`
2. Abrir PR contra `main`:
   ```
   gh pr create --repo DaSilvaAlves/ecosistema-ia-avancada-pt \
     --base main --head chore/cr-followup-classifier-fences \
     --title "chore(nexus-v2): CR follow-up classifier-fences — JSDoc + teste edge [PR #46] [ADR-9]"
   ```
   (corpo: resolve F2 + F3 do CR Iter 1 do PR #46; hotfix já em produção; alterações são doc + teste, sem mudança de runtime)
3. Nota CodeRabbit: o repo atingiu rate limit / créditos no PR #46. Confirmar
   que o CR consegue rever este PR novo (espaçar commits / `@coderabbitai review`).

## Notas

- Push/PR é autoridade exclusiva do @devops — o @dev deixa apenas commitado localmente.
- Não foram tocados submodules (`comunidade`, `starter-builder` aparecem como `M` no `git status` mas são alterações pré-existentes não relacionadas; não staged neste commit).

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus v2`
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260531-cr-followup-classifier-fences-ready-for-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `dev (Dex)`
DATA: `31/05/2026`
