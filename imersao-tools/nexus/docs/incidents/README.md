# Incidentes — Nexus v2

Registos formais de fecho de incidentes de produção do Nexus v2 (hotfixes sem story, conforme SOP `docs/sops/hotfix-producao.md`).

## Propósito

Consolidar, para auditoria, os incidentes resolvidos: causa raiz, correcção, evidência de verificação em produção, PRs/commits, lições. Não substitui handoffs nem memória — referencia-os.

## Nomenclatura

`INCIDENT-{YYYYMMDD}-{slug-curto}-{ESTADO}.md`

- `{YYYYMMDD}` — data de detecção do incidente
- `{slug-curto}` — identificador descritivo em kebab-case
- `{ESTADO}` — `CLOSED` (resolvido) ou `OPEN` (em curso)

Exemplo: `INCIDENT-20260531-classifier-fences-CLOSED.md`

## Índice

| Data | Incidente | Severidade | Estado |
|------|-----------|------------|--------|
| 31/05/2026 | [Classifier client-side não faz strip de markdown fences](INCIDENT-20260531-classifier-fences-CLOSED.md) | CRÍTICA | CLOSED |
