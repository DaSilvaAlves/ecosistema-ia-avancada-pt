---
task: Project Overview
responsavel: "@aiox-chief"
responsavel_type: agent
atomic_layer: task
elicit: false
Entrada: |
  - (nenhuma — agrega estado de todos os projectos activos)
Saida: |
  - overview_360: resumo de projectos / stories / health / blockers
Checklist:
  - "[ ] Aggregate all active project states"
  - "[ ] Check workflow statuses per project"
  - "[ ] Check system health across environments"
  - "[ ] Summarize active blockers"
  - "[ ] Format 360 overview"
---

# *overview

Gera overview 360 de todos os projectos activos com estado de stories, health dos ambientes e blockers.

## Usage

```
*overview
```

## Flow

1. Agregar estado de todos os projectos activos
2. Verificar status de workflows por projecto
3. Verificar health dos ambientes (dev/staging/prod)
4. Identificar e resumir blockers activos
5. Formatar overview 360

## Output

Overview 360 com: lista de projectos com % de conclusão, stories em curso por projecto, health dos ambientes, blockers activos com agente responsável e próximas acções prioritárias.
