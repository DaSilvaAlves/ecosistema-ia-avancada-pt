---
task: Who Handles This
responsavel: "@aiox-chief"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - descricao: descrição da tarefa ou problema a resolver
Saida: |
  - agente_recomendado: agente primário recomendado com comando
  - alternativas: agentes alternativos com razão
Checklist:
  - "[ ] Parse task description"
  - "[ ] Match to agent domains in authority matrix"
  - "[ ] Rank agents by fit"
  - "[ ] Suggest primary agent with command"
  - "[ ] List alternatives with reasoning"
---

# *who-handles

Determina qual agente deve tratar de uma tarefa específica, com recomendação primária e alternativas.

## Usage

```
*who-handles {descricao}
*who-handles "preciso optimizar queries SQL lentas"
*who-handles "criar wireframe para novo dashboard"
*who-handles "definir arquitectura de microserviços"
```

## Flow

1. Interpretar descrição da tarefa
2. Comparar com domínios de cada agente na matriz de autoridade
3. Ordenar agentes por fit (domínio + expertise)
4. Sugerir agente primário com comando exacto
5. Listar alternativas com razão de fit

## Output

Agente recomendado com justificação e comando exacto (ex: `@data-engineer *optimize-query`), lista de alternativas com razão de fit e nota sobre tarefas que requerem múltiplos agentes.
