---
task: Check Configuration
responsavel: "@aiox-resolver"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - ficheiro_ou_seccao: string — path do ficheiro de configuração ou nome da secção a verificar (ex: "core-config.yaml", "agents/dev.md", "boundary")
Saida: |
  - erros: string[] — lista de erros de configuração encontrados
  - sugestoes: string[] — sugestões de correcção para cada erro
Checklist:
  - "[ ] Load ficheiro de configuração especificado"
  - "[ ] Validar contra schema esperado (YAML válido, campos obrigatórios, valores válidos)"
  - "[ ] Reportar erros com linha e campo específico"
  - "[ ] Gerar sugestão de correcção para cada erro encontrado"
  - "[ ] Distinguir erros críticos de warnings"
---

# *check-config

Valida um ficheiro de configuração AIOX contra o schema esperado. Reporta erros com localização exacta (campo e linha) e propõe correcção para cada erro encontrado.

## Usage

```
@aiox-resolver
*check-config

# → solicita ficheiro ou secção interactivamente

*check-config core-config.yaml
# → valida todo o core-config contra o schema AIOX

*check-config agents/dev.md
# → verifica frontmatter YAML do agente @dev

*check-config boundary
# → verifica secção boundary do core-config
```

## Flow

1. Carrega o ficheiro de configuração especificado
2. Valida estrutura: YAML/Markdown válido, sem erros de sintaxe
3. Valida campos obrigatórios: presença, tipos corretos, valores permitidos
4. Valida valores: enums válidos, paths existentes, IDs únicos
5. Reporta erros com campo e linha, distinguindo críticos (bloqueiam funcionamento) de warnings (degradação)

## Output

```
Ficheiro: {path}
Status: {válido|erros encontrados}

Erros ({N}):
  1. Campo '{campo}' — {descrição do erro}
     Sugestão: {correcção concreta}

Warnings ({N}):
  1. {warning com sugestão}

{se válido: "Configuração válida — nenhum problema encontrado"}
```
