---
task: Route Task
responsavel: "@aiox-chief"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - tarefa: descrição da tarefa a executar
  - contexto: contexto adicional relevante (opcional)
Saida: |
  - agente_seleccionado: ID do agente mais adequado
  - comando: comando exacto a executar
  - justificacao: razão da selecção
Checklist:
  - "[ ] Analyze task requirements and type"
  - "[ ] Check agent authority matrix"
  - "[ ] Select best-fit agent"
  - "[ ] Determine exact command"
  - "[ ] Justify routing decision"
---

# *route

Analisa uma tarefa e determina o agente mais adequado com o comando exacto a executar.

## Usage

```
*route {tarefa}
*route "fazer deploy da feature de pagamentos para staging"
*route "criar testes para o módulo de autenticação"
```

## Flow

1. Analisar tipo e requisitos da tarefa
2. Consultar matriz de autoridade de agentes
3. Seleccionar agente com melhor fit para a tarefa
4. Determinar comando exacto a executar
5. Justificar decisão de routing

## Output

Agente seleccionado, comando exacto (ex: `@aiox-deployer *deploy staging main api`), justificação da selecção e alternativas consideradas com razão de descarte.
