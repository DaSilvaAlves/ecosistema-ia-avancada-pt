# RETOMA — Nexus v2: Story 1.11 Architect Gate RE-RATIFICADO (pronto para @dev Phase 1)

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

**Data:** 30/05/2026 · **De → Para:** Aria (`@architect`) → `@dev` (Dex) / próximo terminal
**Projecto:** Nexus v2 (`imersao-tools/nexus/`) · **Pasta raiz:** `C:\Users\XPS\Documents\ecosistema-ia-avancada-pt`

---

## TL;DR

O BLOCKER do handoff anterior (`RETOMA-20260530-cerebro-fix-adr9-story-1.11.md`) está RESOLVIDO. O Architect Gate da Story 1.11 foi **RE-RATIFICADO (v0.4)** por Aria. As 3 premissas factuais do `@dev` foram confirmadas em código. A2 está fechado com a forma correcta. O faseamento foi re-decidido. **`@dev` está autorizado a arrancar a Phase 1.**

---

## O que mudou no story file (v0.4)

Ficheiro: `imersao-tools/nexus/docs/stories/active/1.11.story.md` (diff +126/-23, aditivo).

1. Cabeçalho do gate com veredicto v0.4 (RE-RATIFICAÇÃO).
2. Nova secção "RE-RATIFICAÇÃO Aria" — tabela confirmando as 3 premissas + tabela do achado adicional.
3. "Achado original" rebaixado a histórico.
4. Tabela A1-A7 RE-RATIFICADA: **A2 ✅ FECHADO** (era "⚠️ REABERTO"); A1 ampliado; A6 corrigido.
5. Faseamento RE-DECIDIDO + decisão sobre REC-1.
6. Tabela de reconciliação de AC.
7. Change Log v0.4.

---

## Decisões arquitecturais vinculativas

**A1 (ampliado):** tornar injectáveis `db`, `kv` E os providers (executor+classifier). Remover do caminho client os imports de valor `@vercel/kv` (`executor.ts:1`), `@/lib/agent/undo` (`:20`), e os `getExecutor()`/`getClassifier()` hard-coded (`:773`/`classifier.ts:204`). Mover `import '@/lib/agent/tools'` para o bundle client.

**A2 (fechado):** criar `InferenceTransport` client-side que implementa `ClassifierProvider`+`ExecutorProvider` (`lib/agent/providers/types.ts`) e faz `fetch('/api/anthropic/proxy',{stream:true})` para Haiku+Sonnet. `providers/anthropic.ts` (SDK directo) fica server-only. T2 mantém-se cheia.

**Faseamento:**
- **Phase 1** (fix produção, mergeável): A1+A2+A3+A6+A7 → AC1,2,3,4,5,6,7,9(client),11,12. Resolve escrita E leitura num só corte. Ordem: **T1→T2→T3→T4(ClientConfirmationProvider)→T5→T7→T8.**
- **Phase 2** (hardening): A4+A5 → AC8,AC10. Ordem: **T4(UndoStore)→T6→T7→T8.**

**REC-1 (split 1.11a/1.11b) DECLINADA** como divisão de scope — escrita/leitura não cortam por junta arquitectural. Mantida só como opção de PR para `@devops`. Uma story 1.11, duas fases.

---

## Próximo passo

`@dev *develop 1.11` (Phase 1) — gate de design já dado (PASS RE-RATIFICADO). Quality gate `@architect` no fim (lint+typecheck+vitest+build). Depois `@devops *push` → CR (hard-stop máx 2 iter) → merge manual (Eurico). `gh pr` requer `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.

**Por commitar (docs-only):** `1.11.story.md` (v0.4) + este handoff. `@devops` committa: `docs(nexus-v2): Architect Gate 1.11 re-ratificado v0.4 [Story 1.11]`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `Nexus v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260530-story-1.11-gate-re-ratificado-pronto-para-dev.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Aria (`@architect`)
DATA: `30/05/2026`
