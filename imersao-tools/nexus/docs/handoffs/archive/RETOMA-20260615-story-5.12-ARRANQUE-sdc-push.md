# RETOMA — ARRANQUE Story 5.12 (Cérebro pesquisa web e cria nota, FR56) — correr /sdc 5.12 --push

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

```yaml
from_agent: "Pax (@po) — sessão que fechou Stories 5.10 + 5.11"
to_agent: "any — próximo terminal corre /sdc 5.12 --push (ciclo completo SM→Architect entrada→PO→DEV→Architect saída→DEVOPS)"
created: "2026-06-15T19:00:00Z"
status: consumed
consumed: true
consumed_at: "2026-06-15T21:45:00Z"
consumed_by: "orquestrador /sdc 5.12 --push (River @sm + Aria @architect + Pax @po + Dex @dev + Gage @devops)"
project: nexus-v2
next_action: "/sdc 5.12 --push"
outcome: "Story 5.12 DONE em main (merge squash aa385a04, PR #73, fecho 8f11220e). Epic 5 12/13, Conhecimento 4/5. Opção C client-side (Tool Registry intocado), 0 waivers, 2 iter CR. Próximo: /sdc 5.13 --push (fecha o epic 13/13)."
```

## Summary

O Nexus v2 está a ser terminado via `/sdc`. O **Epic 5 está a 11/13** (Conhecimento 3/5). As Stories 5.10 (pesquisa full-text conhecimento) e 5.11 (pesquisa web) foram fechadas na sessão anterior, ambas em `main`. **Próximo passo: `/sdc 5.12 --push`** — a Story 5.12 (Cérebro pesquisa web e cria nota, FR56). Restam só 5.12 e 5.13 para fechar o Epic 5.

`main` / `origin/main` sincronizados em **`6859cec0`**. A Story 5.12 ainda NÃO existe (será criada pela Fase 1 SM do `/sdc`).

## Git p/ arrancar (primeiro comando no terminal novo)

```bash
git checkout main && git pull --ff-only origin main   # HEAD esperado: 6859cec0 (ou mais recente)
```
- `gh` SEMPRE com `--repo DaSilvaAlves/ecosistema-ia-avancada-pt`.
- NUNCA `git add -A` (há muitos untracked fora-scope no repo: PO-VALIDATION-*, PR-BODY-*, `.claude/` órfão). Add SELECTIVO sempre.
- Código Nexus v2 em `imersao-tools/nexus/v2/` — TODOS os gates (lint/typecheck/vitest/build) correm DENTRO dessa pasta. Baseline vitest actual: **1829 testes**.

## O que é a Story 5.12 (FR56)

Fluxo completo do cérebro multi-intent: **"pesquisa Artemis 2 e cria área Espaço com caderno Artemis 2"** — combina a **pesquisa web (5.11)** + a **criação de área/caderno/nota (5.9)** numa **única intent multi-passo**, com **modo preview antes de persistir** (o utilizador aprova antes de gravar). Trace: `EPIC-5.md` §5 (linha 5.12) + §6 (FR56 linha 73, AC4 linha 109) + `PRD-NEXUS-V2.md` §6.10.

- **executor `@dev`, gate `@architect`** (território de risco — fluxo multi-passo + estado distribuído + fetch externo). Recomendado **Architect Gate de ENTRADA** (como nas 5.7/5.8/5.11).
- **Reutiliza, NÃO reinventa:**
  - Pesquisa web da 5.11: endpoint `app/api/conhecimento/web-search/route.ts` + helpers `lib/shared/web-search-*.ts`. Decisões firmes `[D-5.11-RUNTIME/FALLBACK/SSRF-FIX]` — respeitar.
  - CRUD da 5.9: `createKnowledgeNote(input: KnowledgeNote)` (`lib/db/repos/knowledge-notes.ts`), repos de áreas/cadernos, página `/knowledge`.
  - **Preview-then-confirm do Epic 1 Story 1.6** (`requiresPreview`) — o mesmo mecanismo que o Brain Dump (5.8) reutilizou. NÃO criar fluxo de confirmação novo (lição GAP-5.3).

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/`. PROJECTO = NEXUS V2 (`imersao-tools/nexus/`). CAMINHO CORRECTO. CONSULTAR `.claude/rules/handoff-location.md`.

---

## Pontos de atenção para o draft (@sm) e o Architect Gate de entrada (@architect)

1. **Fronteira 5.12 vs 5.13 (resolver no draft):** a 5.13 é que **regista as 9 tools no Tool Registry** (incl. `pesquisar_web_e_criar_nota`, `criar_area`, `criar_caderno`, `criar_nota`). A 5.12 é o **fluxo/orquestração multi-passo + preview**. Clarificar no draft: a 5.12 implementa a lógica de orquestração e preview consumindo a pesquisa web (5.11) e os repos (5.9) DIRECTAMENTE, deixando o registo formal das tools para a 5.13? Ou a 5.12 já regista a(s) tool(s) que precisa? O `@architect` decide no gate de entrada (precedente: a 5.7/5.8 separaram lógica de registo). Não assumir — verificar como o cérebro multi-intent do Epic 1 invoca tools hoje.
2. **`internal-state-contract-gate.md` aplica-se** (estado distribuído: intent → pesquisa → proposta de área/caderno/nota → preview → aceite/rejeitado → persistido). Análise de ciclo de vida (3 eixos) obrigatória no gate `@architect`: classes de estado, transição-já-ocorrida (ex: área já existe? caderno já existe?), caminhos de falha (pesquisa web falha a meio do fluxo multi-passo → o que acontece ao que já foi proposto?).
3. **`mock-protocol-fidelity.md`** (A1 Epic 1): mock da resposta do Sonnet (a intent multi-passo) reflecte o protocolo real; ≥1 teste que falharia se o shape divergisse.
4. **A3 Epic 4 — mapa de verificabilidade por AC:** AC4 (pesquisa web cria nota com resumo + fonte URL) pode exigir verificação manual em preview/produção (fetch externo real / Anthropic web search com feature flag).
5. **external-contract-identifiers.md:** se a 5.12 tocar nomes de tools, validar ASCII no draft (nomes já em ASCII no §4 do epic).

## LIÇÃO DE PROCESSO CRÍTICA (da 5.11 — aplicar já na 5.12)

O **gate de saída `@architect` TEM de correr CodeRabbit `--base main`** (diff completo do branch vs main), **NÃO só `coderabbit review --agent -t uncommitted`**. Na 5.11, o gate de saída usou `-t uncommitted` e deu PASS High, mas o CR **server-side** levantou depois 7 findings no PR (incluindo 1 **Critical SSRF**) que o CR local não via → o PR #72 precisou de 3 ciclos de remediação evitáveis. Memória: [[feedback-cr-base-main-no-gate-saida]]. A 5.12 é igualmente território de risco (fetch externo + estado distribuído) — correr `--base main` no gate de saída ANTES de o `@devops` avançar o PR.

## Regras /sdc + merge a relembrar

- **Gate da 5.12 é `@architect`** (entrada + saída), não `@qa`. Separation-of-roles: o `@architect` que faz o gate não implementa o código.
- **Hard-stop §8:** máx 2 iterações CR; **Iter 3+ ou merge waived exigem autorização humana explícita** do Eurico (trailer `Authorized-by: Eurico`). Na 5.11 o Eurico autorizou 1 Iter 3 por um 2.º finding de segurança — não assumir autorização, pedir.
- **merge-authority.md:** o agente (`@devops`) faz o merge quando as 6 condições estão verdes no head SHA (CI verde, CR Status SUCCESS, **0 comentários CR actionable no head**, gate `@architect` PASS, MERGEABLE, hard-stop respeitado). `reviewDecision: CHANGES_REQUESTED` frequentemente é stale — verificar pelo head SHA, usar `--admin --squash --delete-branch` se o head estiver limpo. NUNCA pedir merge manual ao Eurico ([[feedback_no_manual_merge_eurico]]).
- Sem `--push` o pipeline pára antes do devops; **este arranque é com `--push`** (até ao merge).

## Débitos herdados (não-bloqueadores — NÃO resolver na 5.12 sem decisão)

- **REC-SSRF-2** (5.11): eliminar o fetch HTTP interno do endpoint web-search ao proxy Edge — invocar a lógica do proxy directamente (sem reenvio de cookie). Destino arquitectural, pós-Epic 5.
- **FLAG env Vercel** (5.11): confirmar que `VERCEL_PROJECT_PRODUCTION_URL` está exposta ao runtime Node em produção (senão a pesquisa web degrada para DuckDuckGo, que é seguro).
- **OBS-5.10-A2:** `.then()` sem `.catch()` no useEffect de pesquisa em `app/(app)/diario/page.tsx` (da 5.5, já merged) — alinhar via SOP Hotfix ou story dedicada.
- Limpeza do `.claude/agent-memory/` órfão untracked em `imersao-tools/nexus/docs/`.

## Fonte de verdade viva

`imersao-tools/nexus/docs/AUDITORIA-20260612-ROADMAP-CONCLUSAO.md` (checkboxes P0/P1/P2) — ler antes de decidir próximos passos. Memória `nexus-v2-roadmap-conclusao` actualizada com 5.10 + 5.11 Done. Handoffs de fecho da 5.10/5.11 em `handoffs/archive/`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: `nexus-v2` (`imersao-tools/nexus/`)
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260615-story-5.12-ARRANQUE-sdc-push.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: `Pax (@po)`
DATA: `15/06/2026`
