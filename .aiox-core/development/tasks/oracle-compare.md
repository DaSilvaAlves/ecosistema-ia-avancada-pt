---
task: Compare AIOX Items
responsavel: "@aiox-oracle"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - item_a: string — primeiro item a comparar (agente, workflow, task, conceito)
  - item_b: string — segundo item a comparar (agente, workflow, task, conceito)
Saida: |
  - tabela_comparativa: markdown — tabela com dimensões relevantes lado a lado
  - recomendacao: string — recomendação clara de quando usar cada um
Checklist:
  - "[ ] Load artefactos para item_a e item_b a partir de ficheiros reais"
  - "[ ] Extract dimensões comparáveis relevantes para o tipo de artefacto"
  - "[ ] Build tabela comparativa markdown com dimensões como linhas"
  - "[ ] Provide recomendação concreta: 'Use A quando X, use B quando Y'"
  - "[ ] Nunca inventar atributos — apenas atributos presentes nos ficheiros fonte"
---

# *compare

Compara dois artefactos AIOX lado a lado (agentes, workflows, tasks, conceitos) em dimensões relevantes. Produz uma tabela comparativa e uma recomendação clara de quando usar cada um.

## Usage

```
@aiox-oracle
*compare

# → solicita os dois items interactivamente

*compare "@aiox-commander" "@monster"
# → compara os dois agentes de orquestração

*compare "spec-pipeline" "sdc"
# → compara os dois workflows principais

*compare "skill" "agent"
# → compara os dois tipos de artefactos
```

## Flow

1. Carrega artefactos de item_a e item_b a partir dos ficheiros fonte reais
2. Extrai dimensões comparáveis relevantes ao tipo: para agentes (autoridade, escopo, comandos), para workflows (fases, agentes, outputs), para conceitos (definição, uso, limitações)
3. Constrói tabela markdown com dimensões como linhas e items como colunas
4. Elabora recomendação: situações concretas onde usar A vs B

## Output

Tabela markdown:

| Dimensão | {item_a} | {item_b} |
|----------|----------|----------|
| ...      | ...      | ...      |

**Recomendação:** Use `{item_a}` quando {condição A}. Use `{item_b}` quando {condição B}.
