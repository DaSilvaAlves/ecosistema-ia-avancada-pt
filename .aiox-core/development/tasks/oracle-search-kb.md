---
task: Search Knowledge Base
responsavel: "@aiox-oracle"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - query: string — termo ou frase a pesquisar na knowledge base
  - filtro: agent|task|workflow|rule|all — tipo de artefacto a filtrar
Saida: |
  - resultados: array — lista de resultados ordenados por relevância com título e resumo
  - paths: string[] — caminhos absolutos para os ficheiros encontrados
Checklist:
  - "[ ] Parse query e extrair termos de pesquisa relevantes"
  - "[ ] Apply filtro ao scope de pesquisa"
  - "[ ] Search entity-registry.yaml e ficheiros de dados em .aiox-core/data/"
  - "[ ] Rank resultados por relevância ao query"
  - "[ ] Format resultados com título, resumo de 1 linha e path"
---

# *search-kb

Pesquisa a knowledge base do AIOX por qualquer termo, conceito ou artefacto. Suporta filtros por tipo para restringir resultados a agentes, tasks, workflows ou regras.

## Usage

```
@aiox-oracle
*search-kb

# → pesquisa livre com filtro all

*search-kb "handoff protocol" rule
# → pesquisa regras relacionadas com handoff

*search-kb "qa gate" task
# → pesquisa tasks relacionadas com QA gate
```

## Flow

1. Parse da query para extrair termos de pesquisa relevantes
2. Aplica filtro ao scope: `agent` → `.aiox-core/development/agents/`, `task` → `tasks/`, `workflow` → `workflows/`, `rule` → `.claude/rules/`, `all` → tudo
3. Pesquisa em `entity-registry.yaml` e ficheiros de dados em `.aiox-core/data/`
4. Rank dos resultados por relevância (match exacto > parcial > semântico)
5. Formata resultados com título, resumo de 1 linha e path absoluto

## Output

Tabela markdown com colunas: Título | Tipo | Resumo | Path
Ordenada por relevância descendente, máximo 10 resultados por defeito.
