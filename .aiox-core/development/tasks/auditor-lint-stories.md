---
task: Auditor Lint Stories
responsavel: "@aiox-auditor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - story_path: Caminho da story a verificar, ou "all" para todas as stories
Saida: |
  - checklist_por_story: Resultado do lint por cada story analisada
Checklist:
  - "[ ] Load story files from specified path or docs/stories/"
  - "[ ] Check acceptance criteria completeness (all AC defined)"
  - "[ ] Check File List section exists and is populated"
  - "[ ] Check checkboxes reflect actual task completion state"
  - "[ ] Check status transitions follow lifecycle rules"
---

# *lint-stories

Analisa stories AIOX verificando completude dos acceptance criteria, File List, estado dos checkboxes e transições de status. Reporta problemas por story.

## Usage

```
*lint-stories [story_path|all]
```

## Flow

1. Elicitar path de story ou confirmar "all"
2. Carregar ficheiros de story do caminho indicado
3. Verificar completude dos acceptance criteria
4. Verificar existência e preenchimento do File List
5. Verificar se checkboxes reflectem estado real das tasks
6. Verificar transições de status segundo lifecycle rules
7. Produzir checklist de resultados por story

## Output

Checklist de lint por story com problemas identificados, severidade e sugestões de correcção para cada item falhado.
