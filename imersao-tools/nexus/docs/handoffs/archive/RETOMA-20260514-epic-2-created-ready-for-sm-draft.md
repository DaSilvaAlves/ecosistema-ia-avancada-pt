---
from_agent: pm
to_agent: sm
created: 2026-05-14T20:06:24Z
status: pending
project: nexus-v2
epic: 2
next_action: draft_story_2.1
---

> ATENÇÃO — ESTE HANDOFF SEGUE A REGRA OBRIGATÓRIA `handoff-location.md`.
> ANTES DE CRIAR OU MOVER QUALQUER HANDOFF, CONSULTAR `.claude/rules/handoff-location.md`.
> HANDOFFS SÓ VIVEM DENTRO DA PASTA DO PROJECTO A QUE SE REFEREM.

# Epic 2 (Tarefas v2 + Projectos) criado — pronto para `@sm *draft 2.1`

## Sumário

Morgan (`@pm`) criou o documento de Epic 2 em `imersao-tools/nexus/docs/EPIC-2.md`, ancorado 100% no `PRD-NEXUS-V2.md` §10 (Epic 2), na arquitectura (`architecture-v2.md`, 5 ADRs) e na Retrospectiva Epic 1 (acções A1/A2/A6). Epic 1 está consolidado em `main` @ `5514b310` — a dependência está satisfeita. O Epic 2 está pronto para `@sm` partir em stories.

## Estado consolidado

| Item | Valor |
|------|-------|
| Documento Epic 2 | `imersao-tools/nexus/docs/EPIC-2.md` |
| Stories planeadas | 10 (2.1 a 2.10) — ver §5 do documento |
| FRs cobertos | FR9-FR15 (Tarefas v2) + FR29-FR32 (Projectos) |
| ACs nível epic | 5 (AC1-AC5) — ver §6 |
| Dependência | Epic 1 — SATISFEITA (10/10 em main) |
| Bloqueia | Epic 4 (motor de recorrência reutilizado) |
| Paralelizável com | Epic 3 (Finanças) se stories independentes |

## Próxima acção — `@sm`

Executar `@sm *draft` para a **Story 2.1 — Schema tarefas/projectos**.

Antes de draftar, ler:
1. `imersao-tools/nexus/docs/EPIC-2.md` (este epic — fonte directa)
2. `PRD-NEXUS-V2.md` §6.2, §10 (Epic 2)
3. `architecture-v2.md` — secção de schema Dexie (Story 2.1 ESTENDE o schema da Story 1.1, não cria localStorage)
4. `.claude/rules/not-tested-trailer-rules.md` — o `story-tmpl.yaml` já tem a secção "Not-Tested Evidence Gate" (acção A2)

## Pontos críticos a respeitar no drafting

| Ponto | Detalhe |
|-------|---------|
| No Invention | Cada story/AC traça ao PRD §10 — não inventar scope além do documentado |
| Reconciliação PRD ↔ Arquitectura | PRD diz "localStorage"; arquitectura ADR-2 decidiu Dexie 4 IndexedDB. Stories 2.1/2.2 seguem Dexie. Ver §7 do EPIC-2.md |
| `executor != quality_gate` (A6) | A tabela §5 do EPIC-2.md tem executores/quality-gates previstos — `@sm` finaliza, mas nenhum executor pode ser o seu próprio gate |
| Not-Tested Evidence Gate (A2) | Stories 2.7 (motor recorrência) e 2.2 (migration) são candidatas a tocar config — gate obrigatório se `Not-tested:` em path bloqueador |
| Alvo de qualidade | Waiver rate <20% no Epic 2 (Epic 1 foi 50%); hard-stop 2 iter qa-loop-fix por story |
| Sequência | 2.1 → 2.2 sequenciais (schema antes de migration); 2.10 depende de 2.1 + 2.8 |

## Estado da sessão (14/05/2026)

- Branch: `fix/nexus-v2-classifier-strip-markdown-fences`
- Working tree NÃO committado — alterações acumuladas desta sessão:
  - Orion (`@aiox-master`): A1/A3/A6 (3 regras novas em `.claude/rules/`), A10 (memória), cross-links, handoff retrospectiva consumido
  - River (`@sm`): A2 (gate no `story-tmpl.yaml` — canónico + cópia `.claude/`)
  - Morgan (`@pm`): `EPIC-2.md` + este handoff
- O Eurico optou por não committar ainda. `@devops` fará o push quando o Eurico decidir.
- Pré-requisitos Epic 2: A1/A2/A3/A6/A10 FEITOS. A8 (`@po` epic-retrospective-tmpl) SALTADO por decisão do Eurico.

---

**LEMBRETE — REGRA HANDOFF-LOCATION:** ESTE FICHEIRO ESTÁ EM `imersao-tools/nexus/docs/handoffs/RETOMA-20260514-epic-2-created-ready-for-sm-draft.md`. PROJECTO A QUE SE REFERE: nexus-v2 → dentro de `imersao-tools/nexus/`. COINCIDE. CONSULTAR `.claude/rules/handoff-location.md`.

---

## REGRA HANDOFF-LOCATION — CONFIRMAÇÃO FINAL

ESTE HANDOFF FOI CRIADO SEGUINDO A REGRA OBRIGATÓRIA `.claude/rules/handoff-location.md`.

- PROJECTO A QUE SE REFERE: nexus-v2
- LOCALIZAÇÃO CORRECTA: `imersao-tools/nexus/docs/handoffs/`
- LOCALIZAÇÃO ACTUAL: `imersao-tools/nexus/docs/handoffs/RETOMA-20260514-epic-2-created-ready-for-sm-draft.md`
- COINCIDEM? `SIM`

AGENTE RESPONSÁVEL: Morgan (`@pm`)
DATA: 14/05/2026
