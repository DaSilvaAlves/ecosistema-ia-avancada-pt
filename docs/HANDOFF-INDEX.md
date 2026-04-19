# HANDOFF-INDEX — Ponto Central de Handoffs Cross-Session

> Regra: `.claude/rules/handoff-central.md`
> Este índice aponta para handoffs pending e archived. Qualquer agente em qualquer terminal deve consultar esta página ao activar-se.

## Pending (não consumidos)

| Data | De → Para | Projecto | Ficheiro | Resumo |
|------|-----------|----------|----------|--------|
| 2026-04-18 | ux-design-expert → devops + dev | Governance Phase A fecho total | [handoffs/RETOMA-GOVERNANCE-FECHO-TOTAL-20260418.md](handoffs/RETOMA-GOVERNANCE-FECHO-TOTAL-20260418.md) | **5 débitos pós-merge PR #1.** 1) Fix guardian CI (desbloqueia Coverage + Quality Metrics em todos PRs). 2) Vercel desligar/silenciar. 3) Redact PII Telmo (2 ficheiros). 4) Validar schema user_profiles vs profiles. 5) Fase B cleanup 62 HANDOFF_* da raiz. 90-120 min distribuídos por 1-2 sessões. |
| 2026-04-17 | ux-design-expert + devops → any | Guia AI Act + Kit Conformidade | [../../imersao-tools/comunidade/guia-ai-act/docs/handoffs/RETOMA-AUDITORIA-10-BUGS-GUIA-KIT-17042026.md](../../imersao-tools/comunidade/guia-ai-act/docs/handoffs/RETOMA-AUDITORIA-10-BUGS-GUIA-KIT-17042026.md) | **10 bugs críticos resolvidos em produção** (commit submódulo `93665c8`, deploy Vercel 9s, 6/6 smoke tests PASS). 2 anomalias: CodeRabbit CLI trava em WSL → usar PR cloud review; bump foi para feature branch pai não main. Próximos passos: fusão Guia↔Kit, disclaimer v1.0 validação, untracked commits. |
| 2026-04-16 | ux-design-expert → any | Kit Conformidade AI Act | [../../imersao-tools/comunidade/guia-ai-act/docs/handoffs/RETOMA-REUNIAO-EMPRESARIOS-16042026.md](../../imersao-tools/comunidade/guia-ai-act/docs/handoffs/RETOMA-REUNIAO-EMPRESARIOS-16042026.md) | **Preparação reunião empresários + advogados.** 3 peças Live (Landing, Guia, Kit). Form checkout commitado local (40b92b9) mas não deployed. Precisa push submódulo `comunidade` + cleanUrls já resolvido (f7e5291). [SUPERSEDED por handoff 17/04] |
| 2026-04-15 | ux-design-expert → dev | FitCoach AI (landing Telmo) | [../../membros/telmo/handoffs/ecos-handoff-fitcoach-referral-20260415.yaml](../../membros/telmo/handoffs/ecos-handoff-fitcoach-referral-20260415.yaml) | **Arquitectura de referral `?ref=telmo`.** Landing venda AIDA deployada. Falta @dev captura + DB migration + trigger cap 100. Detalhes em `membros/telmo/handoffs/RETOMA-OFERTA-TELMO.md` |
| 2026-04-15 | ux-design-expert → any | FitCoach AI (cliente Telmo) | [../../membros/telmo/handoffs/ecos-handoff-fitcoach-v1-ready-20260415.yaml](../../membros/telmo/handoffs/ecos-handoff-fitcoach-v1-ready-20260415.yaml) | **v1 PRONTO** para entregar ao Telmo Cerveira. 16/16 passos validados, 7 bugs fixados. Acção: enviar `MENSAGEM-TELMO.md`. Ver `membros/telmo/handoffs/RETOMA-COMPLETO-FINAL.md` |

## Archived (consumidos ou obsoletos)

| Data consumido | Data criado | Projecto | Ficheiro | Razão |
|----------------|-------------|----------|----------|-------|
| 2026-04-18 | 2026-04-18 | Governance Phase A | [archive/RETOMA-WORKSPACE-GOVERNANCE-PROPOSTA-20260416-EXECUTED.md](handoffs/archive/RETOMA-WORKSPACE-GOVERNANCE-PROPOSTA-20260416-EXECUTED.md) + [RETOMA-ESTADO-20260418.md](handoffs/RETOMA-ESTADO-20260418.md) | **PR #1 MERGED** via admin-squash (commit `98f664e`) + cherry-pick Dex CodeRabbit fix (`d328b0e`). Governance Phase A CLOSED. |
| 2026-04-15 ~05:30 | 2026-04-14 | FitCoach AI (cliente Telmo) | [archive/ecos-handoff-fitcoach-telmo-to-next-20260414.yaml](handoffs/archive/ecos-handoff-fitcoach-telmo-to-next-20260414.yaml) | Consumido pela sessão de 15/04 que validou Passos 10-16 |

---

## Como usar

### Ao activar agente numa sessão nova

1. Ler este ficheiro primeiro
2. Procurar linha onde `to_agent` bate com o agente actual ou `any`
3. Abrir o YAML + ficheiro RETOMA detalhado se existir
4. Reportar ao utilizador: "Encontrei handoff pending de X, queres continuar?"

### Ao terminar sessão com trabalho incompleto

1. Criar YAML na pasta correcta (formato: `{prefix}-handoff-{slug}-{YYYYMMDD}.yaml`):
   - Handoff de **membro**: `membros/{nome}/handoffs/`
   - Handoff de **projecto próprio** (comunidade, guia-ai-act, kit-conformidade, etc.): `docs/handoffs/`
2. Prefixos:
   - `alt-` → alturense-videos
   - `ecos-` → ecosistema-ia-avancada-pt
   - `aiox-` → aiox-core
3. Criar RETOMA detalhado em `{projecto}/docs/RETOMA-*.md` (regra `handoff-location.md`)
4. Adicionar linha no topo da tabela Pending acima

### Ao consumir handoff

1. Marcar no YAML: `consumed: true`, `consumed_at`, `consumed_by`, `status: consumed`
2. Mover para archive na mesma árvore onde o ficheiro vive:
   - Handoff de **membro**: `membros/{nome}/handoffs/{file}.yaml` → `membros/{nome}/handoffs/archive/{file}.yaml`
   - Handoff de **projecto próprio**: `docs/handoffs/{file}.yaml` → `docs/handoffs/archive/{file}.yaml`
3. Remover linha da tabela Pending
4. Adicionar linha à tabela Archived

---

*Última actualização: 19/04/2026 — Projecto membro José Moreira resetado (PRD/handoffs/pesquisas apagados pelo Eurico). Pasta `membros/jose-moreira/` contém apenas briefing original e ficheiros enviados pelo cliente. Próximo passo: arranque em branco.*
