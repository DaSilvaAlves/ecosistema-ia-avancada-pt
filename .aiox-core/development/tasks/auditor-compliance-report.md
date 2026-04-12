---
task: Auditor Compliance Report
responsavel: "@aiox-auditor"
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - (none): Sem input necessário — executa todas as auditorias e agrega resultados
Saida: |
  - scorecard_global: Pontuação global de conformidade por área
  - areas_criticas: Áreas com maior concentração de violações
  - plano_remediacao: Plano de remediação ordenado por prioridade e impacto
Checklist:
  - "[ ] Run constitution check audit"
  - "[ ] Run authority verification audit"
  - "[ ] Run stories lint audit"
  - "[ ] Run language and standards audit"
  - "[ ] Calculate compliance scores per area"
  - "[ ] Identify critical areas"
  - "[ ] Generate remediation plan ordered by priority"
  - "[ ] Format executive report"
---

# *compliance-report

Executa todas as auditorias AIOX e agrega resultados num scorecard executivo com áreas críticas identificadas e plano de remediação priorizado.

## Usage

```
*compliance-report
```

## Flow

1. Executar `*check-constitution` e recolher resultados
2. Executar `*verify-authority` e recolher resultados
3. Executar `*lint-stories all` e recolher resultados
4. Executar `*check-standards all` e recolher resultados
5. Calcular pontuação de conformidade por área
6. Identificar áreas críticas (score < 70%)
7. Gerar plano de remediação ordenado por prioridade
8. Formatar relatório executivo com scorecard visual

## Output

Scorecard global de conformidade por área, mapa de áreas críticas e plano de remediação com estimativa de esforço por acção.
