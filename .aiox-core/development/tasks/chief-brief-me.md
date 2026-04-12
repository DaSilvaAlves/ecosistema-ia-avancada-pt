---
task: Daily Brief
responsavel: "@aiox-chief"
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - (nenhuma — agrega mudanças desde a última sessão)
Saida: |
  - daily_brief: briefing com mudanças git / stories pendentes / decisões pendentes / alertas
Checklist:
  - "[ ] Check git changes since last session"
  - "[ ] Check story status updates"
  - "[ ] Check pending decisions awaiting input"
  - "[ ] Check health alerts across environments"
  - "[ ] Format daily brief"
---

# *brief-me

Gera briefing diário com mudanças desde a última sessão, stories pendentes, decisões em espera e alertas de saúde.

## Usage

```
*brief-me
```

## Flow

1. Verificar alterações git desde a última sessão
2. Verificar actualizações de estado de stories
3. Verificar decisões pendentes à espera de input
4. Verificar alertas de saúde dos ambientes
5. Formatar briefing diário

## Output

Briefing estruturado em quatro secções: (1) Mudanças git desde última sessão, (2) Stories com estado actualizado ou bloqueadas, (3) Decisões pendentes com prazo, (4) Alertas de saúde activos. Termina com próximas 3 acções recomendadas.
