---
task: AIOX Glossary
responsavel: "@aiox-mentor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - termo_ou_categoria: string — termo específico (ex: "handoff") ou categoria (ex: "workflows", "agentes")
Saida: |
  - definicao: string — definição clara e concisa do termo
  - contexto: string — onde e quando este termo aparece no AIOX
  - exemplo: string — exemplo de uso concreto no contexto AIOX
Checklist:
  - "[ ] Encontrar o termo no framework (entity-registry, rules, docs)"
  - "[ ] Construir definição baseada em artefactos reais — não inventar"
  - "[ ] Adicionar contexto: onde aparece, com que agentes, em que workflows"
  - "[ ] Fornecer exemplo de uso: frase ou comando concreto"
  - "[ ] Se categoria: listar todos os termos da categoria com definição breve"
---

# *glossary

Fornece definição, contexto e exemplo de uso para qualquer termo do framework AIOX. Se uma categoria for fornecida (ex: "workflows"), lista todos os termos da categoria com definições breves.

## Usage

```
@aiox-mentor
*glossary

# → solicita termo ou categoria interactivamente

*glossary "handoff"
# → definição de handoff, contexto no agent-handoff protocol, exemplo YAML

*glossary "workflows"
# → lista todos os workflows com definição de 1 linha cada

*glossary "elicit"
# → define elicit: true/false no contexto de tasks AIOX
```

## Flow

1. Encontra o termo no framework: pesquisa em `entity-registry.yaml`, `.claude/rules/`, `docs/`
2. Constrói definição baseada em artefactos reais — nunca inventar definições
3. Adiciona contexto: onde este termo aparece, com que agentes, em que workflows ou ficheiros
4. Fornece exemplo concreto: frase de uso ou comando AIOX real
5. Se categoria fornecida: lista todos os termos com definição de 1 linha cada

## Output

Para termo único:
```
**{termo}**
Definição: {definição clara em 1-2 frases}
Contexto: {onde aparece no AIOX}
Exemplo: {uso concreto}
Referência: {path do ficheiro fonte}
```

Para categoria:
Tabela com colunas: Termo | Definição (1 linha) | Referência
