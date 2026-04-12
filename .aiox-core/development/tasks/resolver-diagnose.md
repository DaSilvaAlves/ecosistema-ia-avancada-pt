---
task: Diagnose Problem
responsavel: "@aiox-resolver"
responsavel_type: agent
atomic_layer: task
elicit: true
Entrada: |
  - descricao_problema: string — descrição em linguagem natural do problema encontrado
Saida: |
  - causa_raiz: string — causa identificada com base em diagnósticos executados
  - severidade: critical|high|medium|low — nível de severidade do problema
  - accao_correctiva: string — descrição da acção necessária para resolver
  - comando: string — comando concreto @agent *command para iniciar a resolução
Checklist:
  - "[ ] Analisar descrição do problema para identificar categoria (config, workflow, agente, código)"
  - "[ ] Executar diagnósticos relevantes à categoria do problema"
  - "[ ] Identificar causa raiz com base em evidências reais"
  - "[ ] Determinar severidade: critical (bloqueia tudo), high (bloqueia feature), medium (degradação), low (cosmético)"
  - "[ ] Propor acção correctiva com comando concreto dentro da authority matrix"
---

# *diagnose

Diagnostica qualquer problema no AIOX com base na descrição fornecida. Executa diagnósticos relevantes, identifica a causa raiz com evidências, classifica a severidade e propõe a acção correctiva com comando concreto.

## Usage

```
@aiox-resolver
*diagnose

# → solicita descrição do problema interactivamente

*diagnose "story 2.3 está bloqueada e não consigo avançar"
# → diagnostica blocker, identifica causa, sugere @aiox-commander *unblock story-2.3

*diagnose "o agente @dev não reconhece o comando *develop"
# → verifica config de agentes, identifica ficheiro em falta ou YAML inválido

*diagnose "pipeline de CI falha no step de typecheck"
# → analisa config CI, identifica erro de configuração TypeScript
```

## Flow

1. Analisa descrição para categorizar o problema: configuração, workflow bloqueado, agente com erro, código com falha, infra
2. Executa diagnósticos relevantes à categoria: verifica ficheiros de config, lê logs disponíveis, verifica estado de stories
3. Identifica causa raiz com base em evidências reais — nunca adivinhar sem dados
4. Determina severidade: `critical` (bloqueia todo o trabalho), `high` (bloqueia feature), `medium` (degradação parcial), `low` (cosmético)
5. Propõe acção correctiva com comando concreto dentro da authority matrix

## Output

```
Problema: {descrição resumida}
Categoria: {config|workflow|agent|code|infra}

Causa raiz: {causa identificada com evidência}
Severidade: {critical|high|medium|low}

Acção correctiva: {o que fazer}
Comando: @{agent} *{command} {args}

Evidências encontradas:
  - {evidência 1}
  - {evidência 2}
```
