---
task: Explain AIOX Concept
responsavel: "@aiox-oracle"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - conceito: string — nome ou descrição do conceito AIOX a explicar
  - nivel_detalhe: basic|detailed|deep — profundidade da explicação
Saida: |
  - explicacao: markdown — explicação estruturada do conceito
  - ficheiros_referencia: paths[] — caminhos absolutos para ficheiros fonte relevantes
  - comandos_relacionados: string[] — lista de comandos @agent *command relacionados
Checklist:
  - "[ ] Parse concept query e identificar categoria (agent|task|workflow|rule|principle)"
  - "[ ] Search entity-registry.yaml para o conceito"
  - "[ ] Find source files em .aiox-core/ e .claude/rules/"
  - "[ ] Build explanation adaptada ao nivel_detalhe solicitado com referências"
  - "[ ] List related commands no formato @agent *command"
---

# *explain

Explica qualquer conceito do framework AIOX com profundidade adaptada ao nível solicitado. Consulta o entity-registry e ficheiros fonte para garantir que a explicação é baseada em artefactos reais, não inventada.

## Usage

```
@aiox-oracle
*explain

# → explica conceito com nivel basic por defeito

*explain "Story Development Cycle" detailed
# → explicação detalhada do SDC com fases, agentes e comandos

*explain "agent authority" deep
# → explicação completa incluindo delegation matrix e exemplos
```

## Flow

1. Parse da query para identificar o conceito e categoria (agent, task, workflow, rule, principle)
2. Pesquisa em `entity-registry.yaml` para localizar o artefacto correspondente
3. Carrega ficheiros fonte relevantes (`.aiox-core/`, `.claude/rules/`, `docs/`)
4. Constrói explicação estruturada adaptada ao `nivel_detalhe`: basic (o quê), detailed (como), deep (porquê + trade-offs)
5. Agrega lista de comandos relacionados no formato `@agent *command`

## Output

Markdown estruturado com:
- Definição clara do conceito
- Contexto no framework AIOX
- Exemplo prático concreto
- Referências a ficheiros fonte (paths absolutos)
- Comandos relacionados listados
