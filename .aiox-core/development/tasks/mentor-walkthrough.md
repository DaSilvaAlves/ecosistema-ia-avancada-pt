---
task: Workflow Walkthrough
responsavel: "@aiox-mentor"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - workflow_id: string — identificador do workflow (sdc|qa-loop|spec|brownfield|epic)
Saida: |
  - simulacao: step-by-step markdown — walkthrough completo do workflow com dados de exemplo
Checklist:
  - "[ ] Load definição do workflow a partir de workflow-chains.yaml"
  - "[ ] Explicar propósito de cada fase antes de mostrar o comando"
  - "[ ] Mostrar agente e comando concreto por fase"
  - "[ ] Simular com dados de exemplo realistas (story fictícia, epic fictício)"
  - "[ ] Incluir o que cada fase produz (output) e o que a fase seguinte espera (input)"
---

# *walkthrough

Guia o utilizador por um workflow AIOX completo com simulação passo-a-passo. Cada fase é explicada antes de mostrar o comando, e os dados de exemplo tornam a simulação concreta e fácil de seguir.

## Usage

```
@aiox-mentor
*walkthrough

# → solicita workflow_id interactivamente

*walkthrough sdc
# → walkthrough completo do Story Development Cycle com story de exemplo

*walkthrough spec
# → walkthrough do Spec Pipeline com feature hipotética de exemplo
```

## Flow

1. Carrega definição do workflow de `workflow-chains.yaml`
2. Para cada fase: explica o propósito (porquê existe esta fase), depois mostra o agente e comando
3. Simula com dados de exemplo realistas: story fictícia "2.1 — Implementar login OAuth", epic fictício "EP-03 — Autenticação"
4. Mostra o output de cada fase e como alimenta a fase seguinte
5. Termina com o estado final esperado após workflow completo

## Output

Markdown passo-a-passo com:
```
## Workflow: {workflow_id}

### Fase 1: {phase_name}
**Porquê:** {motivação desta fase}
**Agente:** @{agent}
**Comando:** *{command} {exemplo_args}
**Output:** {o que esta fase produz}

### Fase 2: {phase_name}
...

### Estado Final
{o que está concluído após o workflow}
```
