---
task: Squad Status
responsavel: "@aiox-chief"
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - (nenhuma — verifica todos os agentes do squad aiox-mastery)
Saida: |
  - squad_table: tabela com os 24 agentes, estado e última acção
Checklist:
  - "[ ] Check status of each agent in the squad"
  - "[ ] Determine availability per agent"
  - "[ ] Check last action per agent"
  - "[ ] Calculate load distribution"
  - "[ ] Format squad status table"
---

# *squad-status

Apresenta tabela de estado de todos os agentes do squad aiox-mastery com disponibilidade e última acção.

## Usage

```
*squad-status
```

## Flow

1. Verificar estado de cada agente do squad (24 agentes)
2. Determinar disponibilidade por agente
3. Verificar última acção executada por agente
4. Calcular distribuição de carga
5. Formatar tabela de status

## Output

Tabela de squad com colunas: Agente | Estado | Disponível | Última Acção | Carga. Inclui sumário de distribuição de carga e agentes sobrecarregados ou ociosos.
