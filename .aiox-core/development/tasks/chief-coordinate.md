---
task: Coordinate Multi-Agent Task
responsavel: "@aiox-chief"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - tarefa: descrição da tarefa complexa que requer múltiplos agentes
Saida: |
  - plano_execucao: sequência agente → passo → dependência → resultado esperado
Checklist:
  - "[ ] Decompose complex task into atomic steps"
  - "[ ] Map each step to responsible agent"
  - "[ ] Define execution order and dependencies"
  - "[ ] Set expected output per step"
  - "[ ] Track progress across agents"
---

# *coordinate

Decompõe uma tarefa complexa em passos atómicos, mapeia para agentes e gera plano de execução multi-agente com dependências.

## Usage

```
*coordinate {tarefa}
*coordinate "lançar nova feature de pagamentos: schema DB + API + testes + deploy staging"
```

## Flow

1. Decompor tarefa complexa em passos atómicos
2. Mapear cada passo ao agente responsável
3. Definir ordem de execução e dependências entre passos
4. Definir output esperado por passo
5. Gerar plano de execução completo

## Output

Plano de execução multi-agente com: lista ordenada de passos, agente responsável por passo, dependências (passo X depende de Y), output esperado por passo e critério de conclusão global.
