# HANDOFF-INDEX — Ponto Central de Handoffs Cross-Session

> Regra: `.claude/rules/handoff-central.md`
> Este índice aponta para handoffs pending e archived. Qualquer agente em qualquer terminal deve consultar esta página ao activar-se.

## Pending (não consumidos)

| Data | De → Para | Projecto | Ficheiro | Resumo |
|------|-----------|----------|----------|--------|
| 2026-04-15 | ux-design-expert → any | FitCoach AI (cliente Telmo) | [ecos-handoff-fitcoach-v1-ready-20260415.yaml](handoffs/ecos-handoff-fitcoach-v1-ready-20260415.yaml) | **v1 PRONTO** para entregar ao Telmo Cerveira. 16/16 passos validados end-to-end, 7 bugs fixados (B7, B2, B12, B1, B5, B8, B9), 3 cosméticos deferidos para v2. Acção: enviar `MENSAGEM-TELMO.md` (versão WhatsApp). Handoff narrativo completo em `imersao-tools/docs/teste-telmo/fitcoach-ai/docs/RETOMA-COMPLETO-FINAL.md` |

## Archived (consumidos ou obsoletos)

| Data consumido | Data criado | Projecto | Ficheiro | Razão |
|----------------|-------------|----------|----------|-------|
| 2026-04-15 ~05:30 | 2026-04-14 | FitCoach AI (cliente Telmo) | [archive/ecos-handoff-fitcoach-telmo-to-next-20260414.yaml](handoffs/archive/ecos-handoff-fitcoach-telmo-to-next-20260414.yaml) | Consumido pela sessão de 15/04 que validou Passos 10-16 + lote pré-Telmo. Continuação em `ecos-handoff-fitcoach-v1-ready-20260415.yaml` |

---

## Como usar

### Ao activar agente numa sessão nova

1. Ler este ficheiro primeiro
2. Procurar linha onde `to_agent` bate com o agente actual ou `any`
3. Abrir o YAML + ficheiro RETOMA detalhado se existir
4. Reportar ao utilizador: "Encontrei handoff pending de X, queres continuar?"

### Ao terminar sessão com trabalho incompleto

1. Criar YAML em `docs/handoffs/` (formato: `{prefix}-handoff-{slug}-{YYYYMMDD}.yaml`)
2. Prefixos:
   - `alt-` → alturense-videos
   - `ecos-` → ecosistema-ia-avancada-pt
   - `aiox-` → aiox-core
3. Criar RETOMA detalhado em `{projecto}/docs/RETOMA-*.md` (regra `handoff-location.md`)
4. Adicionar linha no topo da tabela Pending acima

### Ao consumir handoff

1. Marcar no YAML: `consumed: true`, `consumed_at`, `consumed_by`, `status: consumed`
2. Mover `docs/handoffs/{file}.yaml` → `docs/handoffs/archive/{file}.yaml`
3. Remover linha da tabela Pending
4. Adicionar linha à tabela Archived

---

*Última actualização: 15/04/2026 ~05:30 PT (Lisboa)*
