---
task: Auditor Audit
responsavel: "@aiox-auditor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - scope: Âmbito da auditoria (full|constitution|authority|stories|language|design)
Saida: |
  - relatorio_violacoes: Relatório completo de violações encontradas
  - severidade: Classificação de severidade por violação (critical|high|medium|low)
  - accao: Plano de acção para remediar violações
Checklist:
  - "[ ] Determine audit scope from input"
  - "[ ] Run all checks relevant to the scope"
  - "[ ] Collect all violations found"
  - "[ ] Classify each violation by severity"
  - "[ ] Generate structured report with remediation plan"
---

# *audit

Executa auditoria AIOX no âmbito definido. Verifica conformidade com Constitution, autoridade de agentes, stories, standards de linguagem e design system. Reporta violações com severidade e plano de acção.

## Usage

```
*audit [scope]
```

## Flow

1. Elicitar scope se não fornecido (default: full)
2. Executar checks relevantes ao scope seleccionado
3. Recolher todas as violações identificadas
4. Classificar severidade de cada violação
5. Gerar relatório estruturado
6. Produzir plano de acção com prioridades

## Output

Relatório de auditoria com violações classificadas por severidade, evidência concreta de cada violação e plano de remediação ordenado por prioridade.
