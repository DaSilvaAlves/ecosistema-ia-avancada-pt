---
task: How-To Guide
responsavel: "@aiox-oracle"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - objectivo: string — descrição em linguagem natural do que o utilizador quer atingir
Saida: |
  - sequencia_comandos: step[] — passos ordenados com @agent *command exacto para cada passo
  - explicacao: markdown — explicação do porquê de cada passo na sequência
Checklist:
  - "[ ] Compreender o objectivo em linguagem natural"
  - "[ ] Mapear o objectivo para o workflow AIOX mais adequado"
  - "[ ] Gerar sequência passo-a-passo com formato @agent *command exacto"
  - "[ ] Adicionar explicação curta por passo (porquê este agente, porquê este comando)"
  - "[ ] Validar que nenhum passo inventa comandos — apenas comandos documentados"
---

# *how-to

Gera um guia passo-a-passo para atingir qualquer objectivo dentro do AIOX. Cada passo inclui o comando exacto no formato `@agent *command` e uma breve explicação do porquê.

## Usage

```
@aiox-oracle
*how-to

# → solicita objectivo interactivamente

*how-to "criar uma nova feature do zero"
# → guia completo: @sm *create-story → @po *validate → @dev *develop → @qa *qa-gate → @devops *push

*how-to "resolver um blocker numa story"
# → guia de desbloqueio com diagnóstico e resolução
```

## Flow

1. Compreender o objectivo descrito em linguagem natural
2. Mapear para o workflow AIOX mais adequado (SDC, QA Loop, Spec Pipeline, Brownfield, ou combinação)
3. Gerar sequência passo-a-passo — cada passo com agente, comando e argumento exactos
4. Adicionar explicação de 1-2 frases por passo: porquê este agente, o que acontece, o que produz
5. Validar que todos os comandos existem — nunca inventar comandos não documentados

## Output

Markdown com:
- Título do workflow mapeado
- Passos numerados no formato: `@agent *command {args}` — *explicação breve*
- Nota final sobre o que acontece após o último passo
