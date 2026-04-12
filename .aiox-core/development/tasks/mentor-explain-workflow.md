---
task: Explain Workflow Visual
responsavel: "@aiox-mentor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - workflow_id: string — identificador do workflow (sdc|qa-loop|spec|brownfield|epic)
Saida: |
  - diagrama_ascii: string — diagrama ASCII do fluxo do workflow
  - explicacao_fases: markdown — explicação de cada fase com agente, input e output
  - agentes: string[] — lista de agentes envolvidos no workflow
Checklist:
  - "[ ] Load definição do workflow a partir de workflow-chains.yaml"
  - "[ ] Gerar diagrama ASCII com setas e fases em sequência"
  - "[ ] Explicar cada fase: agente responsável, input esperado, output produzido"
  - "[ ] Listar todos os agentes envolvidos no workflow"
  - "[ ] Incluir gates de decisão (GO/NO-GO, APPROVE/REJECT) no diagrama"
---

# *explain-workflow

Apresenta uma explicação visual de qualquer workflow AIOX com diagrama ASCII e descrição detalhada de cada fase. Inclui agentes envolvidos, gates de decisão e fluxo de dados entre fases.

## Usage

```
@aiox-mentor
*explain-workflow

# → solicita workflow_id interactivamente

*explain-workflow sdc
# → diagrama ASCII do Story Development Cycle + explicação das 4 fases

*explain-workflow qa-loop
# → diagrama do loop iterativo QA com condições de saída

*explain-workflow spec
# → diagrama do Spec Pipeline com as 6 fases e complexity gate
```

## Flow

1. Carrega definição do workflow de `workflow-chains.yaml` e `.claude/rules/workflow-execution.md`
2. Gera diagrama ASCII com fases em sequência, setas de transição e gates de decisão
3. Para cada fase: agente responsável, input esperado, output produzido, condição de avanço
4. Lista todos os agentes envolvidos com o seu papel no workflow
5. Indica condições especiais: loops, gates GO/NO-GO, caminhos de escalação

## Output

```
## Workflow: {workflow_id}

{diagrama_ascii}

## Fases

### Fase 1 — {phase_name}
Agente: @{agent}
Input: {o que recebe}
Output: {o que produz}
Gate: {condição para avançar}

...

## Agentes Envolvidos
@{agent1} — {papel}
@{agent2} — {papel}
```
