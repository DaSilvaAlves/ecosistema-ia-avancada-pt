---
task: Generate Cheat Sheet
responsavel: "@aiox-mentor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - tema: commands|agents|workflows|git|squads — tema do cheat sheet a gerar
Saida: |
  - tabela_compacta: markdown — tabela compacta de referência rápida para o tema
Checklist:
  - "[ ] Recolher todos os itens do tema a partir de ficheiros reais (entity-registry, rules, docs)"
  - "[ ] Formatar como tabela compacta com colunas relevantes ao tema"
  - "[ ] Incluir sintaxe exacta de comandos onde aplicável"
  - "[ ] Adicionar descrição de 1 linha por item"
  - "[ ] Ordenar por frequência de uso ou ordem lógica"
---

# *cheat-sheet

Gera uma tabela de referência rápida (cheat sheet) para qualquer tema do AIOX. Compacta toda a informação essencial numa tabela fácil de consultar durante o trabalho.

## Usage

```
@aiox-mentor
*cheat-sheet

# → solicita tema interactivamente

*cheat-sheet commands
# → tabela com todos os comandos *command de todos os agentes

*cheat-sheet agents
# → tabela com todos os agentes: ID, persona, escopo, quando usar

*cheat-sheet workflows
# → tabela com todos os workflows: ID, fases, agentes, quando usar

*cheat-sheet git
# → tabela com comandos git permitidos por agente e comandos bloqueados

*cheat-sheet squads
# → tabela com squads disponíveis: nome, agentes, propósito
```

## Flow

1. Recolhe todos os itens do tema a partir de ficheiros reais: `entity-registry.yaml`, `.claude/rules/`, `docs/`
2. Seleciona colunas relevantes ao tema:
   - `commands`: Agente | Comando | Sintaxe | Descrição
   - `agents`: ID | Persona | Escopo | Quando Usar
   - `workflows`: ID | Fases | Agentes | Quando Usar
   - `git`: Operação | Agente Autorizado | Bloqueado Para
   - `squads`: Nome | Agentes | Propósito
3. Formata como tabela markdown compacta
4. Ordena por frequência de uso ou ordem lógica
5. Inclui sintaxe exacta onde aplicável

## Output

Tabela markdown compacta, pronta a copiar e usar como referência rápida.
Máximo 30 linhas para manter compacidade — agrupado por categoria se necessário.
