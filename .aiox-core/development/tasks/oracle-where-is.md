---
task: Locate Artefact
responsavel: "@aiox-oracle"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - nome_artefacto: string — nome ou descrição do artefacto a localizar (agente, task, template, regra, ficheiro)
Saida: |
  - path_absoluto: string — caminho absoluto para o ficheiro ou directório
  - contexto: string — descrição de para que serve o artefacto
  - relacoes: string[] — outros artefactos relacionados (e os seus paths)
Checklist:
  - "[ ] Search no file system por nome exacto e variações"
  - "[ ] Search em entity-registry.yaml para o artefacto"
  - "[ ] Identify contexto e propósito do artefacto encontrado"
  - "[ ] Map relações com outros artefactos (dependências, usa, é-usado-por)"
  - "[ ] Return path absoluto confirmado"
---

# *where-is

Localiza qualquer artefacto do AIOX (agente, task, template, regra, ficheiro de dados, workflow) e devolve o path absoluto, contexto e relações com outros artefactos.

## Usage

```
@aiox-oracle
*where-is

# → solicita nome do artefacto interactivamente

*where-is "qa-gate task"
# → path, descrição e relações da task qa-gate

*where-is "agent handoff template"
# → localiza o template YAML de handoff
```

## Flow

1. Pesquisa no file system por nome exacto, variações e parciais
2. Pesquisa em `entity-registry.yaml` para correspondência canónica
3. Identifica contexto: camada L1/L2/L3/L4, tipo de artefacto, propósito
4. Mapeia relações: quem usa este artefacto, do que este artefacto depende
5. Retorna path absoluto confirmado com verificação de existência

## Output

```
Path: {path_absoluto}
Tipo: {agent|task|template|rule|data|workflow}
Contexto: {descrição de 1-2 frases}
Relações:
  - usa: [{path}, ...]
  - usado-por: [{path}, ...]
```
